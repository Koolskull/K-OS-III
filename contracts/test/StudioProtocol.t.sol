// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Test} from "forge-std/Test.sol";
import {StudioKit} from "../src/StudioKit.sol";
import {StudioTreasury} from "../src/StudioTreasury.sol";
import {CreditLedger} from "../src/CreditLedger.sol";
import {RoyaltyRouter} from "../src/RoyaltyRouter.sol";
import {ShotNFT} from "../src/ShotNFT.sol";
import {InstrumentRegistry} from "../src/InstrumentRegistry.sol";
import {MockStablecoin} from "./mocks/MockStablecoin.sol";
import {IERC2981} from "@openzeppelin/contracts/interfaces/IERC2981.sol";

contract StudioProtocolTest is Test {
    StudioKit internal kit;
    StudioTreasury internal treasury;
    CreditLedger internal ledger;
    RoyaltyRouter internal router;
    ShotNFT internal nft;
    InstrumentRegistry internal registry;
    MockStablecoin internal usdc;
    MockStablecoin internal usdt;

    address internal admin = address(0xA11CE);
    address internal conversion = address(0x5AFE);
    address internal animator = address(0xA1);
    address internal composer = address(0xC0);
    address internal buyer = address(0xB0);
    address internal newHire = address(0x1111);

    uint256 internal constant CAP = 100_000 * 1e6;

    function setUp() public {
        kit = new StudioKit(admin, conversion, 1_000);
        treasury = kit.treasury();
        ledger = kit.ledger();
        router = kit.router();
        nft = kit.nft();
        registry = kit.registry();

        usdc = new MockStablecoin("USD Coin", "USDC", 6);
        usdt = new MockStablecoin("Tether", "USDT", 6);

        vm.startPrank(admin);
        treasury.setStablecoin(address(usdc), true, 6);
        treasury.setStablecoin(address(usdt), true, 6);
        treasury.setMember(animator, StudioTreasury.MemberStatus.Active, CAP);
        treasury.grantShares(animator, 100);
        vm.stopPrank();

        usdc.mint(buyer, 10_000_000 * 1e6);
        usdc.mint(address(this), 10_000_000 * 1e6);
        usdc.approve(address(treasury), type(uint256).max);
    }

    function _deposit(uint256 amount) internal {
        treasury.deposit(address(usdc), amount);
    }

    function _openAndPublish() internal returns (uint256 shotId, address sink) {
        vm.startPrank(admin);
        uint256 productionId = ledger.openProduction(
            bytes32("demo-film"), "Demo Film", "ipfs://production", 500, admin
        );

        CreditLedger.Credit[] memory credits = new CreditLedger.Credit[](2);
        credits[0] = CreditLedger.Credit(animator, bytes32("animator"), 1, false);
        credits[1] = CreditLedger.Credit(composer, bytes32("composer"), 1, false);

        shotId = ledger.commitShot(
            productionId, 0, bytes32("main"), keccak256("frame-1"), "ipfs://shot/1", 40, credits
        );
        vm.stopPrank();

        vm.prank(animator);
        ledger.acceptCredit(shotId);
        vm.prank(composer);
        ledger.acceptCredit(shotId);

        ledger.freezeShot(shotId);

        vm.prank(admin);
        sink = nft.publish(shotId, address(treasury));
    }

    function testSalaryCapBlocksOverpay() public {
        _deposit(1_000_000 * 1e6);

        vm.startPrank(admin);
        treasury.paySalary(animator, address(usdc), CAP);
        vm.expectRevert(abi.encodeWithSelector(StudioTreasury.CapExceeded.selector, CAP, 1, CAP));
        treasury.paySalary(animator, address(usdc), 1);
        vm.stopPrank();
    }

    function testSalaryCapResetsAfterYear() public {
        _deposit(1_000_000 * 1e6);

        vm.prank(admin);
        treasury.paySalary(animator, address(usdc), CAP);
        assertEq(usdc.balanceOf(animator), CAP);

        vm.warp(block.timestamp + 365 days);
        vm.prank(admin);
        treasury.paySalary(animator, address(usdc), CAP);
        assertEq(usdc.balanceOf(animator), 2 * CAP);
    }

    function testCapIsAcrossStablecoins() public {
        usdt.mint(address(this), CAP);
        usdt.approve(address(treasury), CAP);
        _deposit(500_000 * 1e6);
        treasury.deposit(address(usdt), CAP);

        vm.startPrank(admin);
        treasury.paySalary(animator, address(usdc), 60_000 * 1e6);
        treasury.paySalary(animator, address(usdt), 40_000 * 1e6);
        vm.expectRevert(abi.encodeWithSelector(StudioTreasury.CapExceeded.selector, CAP, 1, CAP));
        treasury.paySalary(animator, address(usdc), 1);
        vm.stopPrank();
    }

    function testCannotPayAboveContractedSalary() public {
        vm.prank(admin);
        treasury.setMember(composer, StudioTreasury.MemberStatus.Active, 50_000 * 1e6);
        _deposit(200_000 * 1e6);

        vm.prank(admin);
        vm.expectRevert(
            abi.encodeWithSelector(
                StudioTreasury.CapExceeded.selector, 0, 50_000 * 1e6 + 1, 50_000 * 1e6
            )
        );
        treasury.paySalary(composer, address(usdc), 50_000 * 1e6 + 1);
    }

    function testHireBudgetCannotPayActiveMember() public {
        _deposit(100_000 * 1e6);
        vm.prank(admin);
        vm.expectRevert(StudioTreasury.ActiveMemberUsePayroll.selector);
        treasury.spendHireBudget(address(usdc), animator, 1_000 * 1e6, bytes32("bonus"));
    }

    function testHireBudgetPaysNewHire() public {
        _deposit(100_000 * 1e6);
        uint256 hire = (100_000 * 1e6 * 1_000) / 10_000;
        vm.prank(admin);
        treasury.spendHireBudget(address(usdc), newHire, hire, bytes32("first-paycheck-setup"));
        assertEq(usdc.balanceOf(newHire), hire);
    }

    function testEthLocksAndOnlySweepsToSafe() public {
        vm.deal(address(this), 3 ether);
        (bool ok,) = address(treasury).call{value: 3 ether}("");
        assertTrue(ok);
        assertEq(address(treasury).balance, 3 ether);

        vm.prank(admin);
        treasury.sweepEthToConversionSafe();
        assertEq(conversion.balance, 3 ether);
        assertEq(address(treasury).balance, 0);
    }

    function testCannotRescueStablecoin() public {
        _deposit(1_000 * 1e6);
        vm.prank(admin);
        vm.expectRevert(StudioTreasury.ProtectedToken.selector);
        treasury.rescueToken(address(usdc), admin, 1);
    }

    function testCreditsMustBeAcceptedBeforeFreeze() public {
        vm.startPrank(admin);
        uint256 productionId = ledger.openProduction(bytes32("x"), "X", "ipfs://x", 500, admin);
        CreditLedger.Credit[] memory credits = new CreditLedger.Credit[](1);
        credits[0] = CreditLedger.Credit(animator, bytes32("animator"), 1, false);
        uint256 shotId = ledger.commitShot(
            productionId, 0, bytes32("main"), keccak256("a"), "ipfs://a", 1, credits
        );
        vm.stopPrank();

        vm.expectRevert(CreditLedger.CreditsIncomplete.selector);
        ledger.freezeShot(shotId);
    }

    function testVersionedCreditsAreAppendOnly() public {
        (uint256 shotId,) = _openAndPublish();
        assertTrue(ledger.shotIsFrozen(shotId));

        vm.startPrank(admin);
        CreditLedger.Credit[] memory credits = new CreditLedger.Credit[](1);
        credits[0] = CreditLedger.Credit(composer, bytes32("composer"), 1, false);
        uint256 v2 = ledger.commitShot(
            1,
            shotId,
            bytes32("credits-fix"),
            keccak256("frame-1-v2"),
            "ipfs://shot/1v2",
            40,
            credits
        );
        vm.stopPrank();

        assertEq(ledger.parentOf(v2), shotId);
        assertEq(ledger.creditsOf(shotId).length, 2);
        assertEq(ledger.creditsOf(v2).length, 1);
    }

    function testPublishMintsNftWithFivePercentRoyalty() public {
        (uint256 shotId, address sink) = _openAndPublish();
        assertEq(nft.ownerOf(shotId), address(treasury));
        (address receiver, uint256 amount) = IERC2981(address(nft)).royaltyInfo(shotId, 1_000 ether);
        assertEq(receiver, sink);
        assertEq(amount, 50 ether);
    }

    function testSettleSaleSplitsFivePercentToCreditedTeam() public {
        (uint256 shotId,) = _openAndPublish();
        uint256 price = 1_000 * 1e6;

        vm.startPrank(buyer);
        usdc.approve(address(nft), price);
        nft.settleSale(shotId, address(usdc), price);
        vm.stopPrank();

        uint256 creatorCut = 50 * 1e6;
        assertEq(router.owed(shotId, address(usdc), animator), 25 * 1e6);
        assertEq(router.owed(shotId, address(usdc), composer), 25 * 1e6);

        vm.prank(animator);
        router.withdraw(shotId, address(usdc));
        vm.prank(composer);
        router.withdraw(shotId, address(usdc));
        assertEq(usdc.balanceOf(animator), 25 * 1e6);
        assertEq(usdc.balanceOf(composer), 25 * 1e6);

        uint256 studioCut = price - creatorCut;
        uint256 hireCut = (studioCut * 1_000) / 10_000;
        assertEq(treasury.hireBudget(address(usdc)), hireCut);
        assertEq(treasury.lockedSurplus(address(usdc)), studioCut - hireCut);
    }

    function testMarketplaceEthRoyaltyHitsTheRightShot() public {
        (uint256 shotId, address sink) = _openAndPublish();
        vm.deal(buyer, 1 ether);
        vm.prank(buyer);
        (bool ok,) = sink.call{value: 1 ether}("");
        assertTrue(ok);

        assertEq(router.owed(shotId, address(0), animator), 0.5 ether);
        vm.prank(animator);
        router.withdraw(shotId, address(0));
        assertEq(animator.balance, 0.5 ether);
    }

    function testRoyaltyOverride() public {
        vm.startPrank(admin);
        uint256 productionId = ledger.openProduction(bytes32("x"), "X", "ipfs://x", 500, admin);
        CreditLedger.Credit[] memory credits = new CreditLedger.Credit[](1);
        credits[0] = CreditLedger.Credit(animator, bytes32("animator"), 1, false);
        uint256 shotId =
            ledger.commitShot(productionId, 0, 0, keccak256("a"), "ipfs://a", 1, credits);
        ledger.setRoyaltyOverride(shotId, 250);
        vm.stopPrank();

        vm.prank(animator);
        ledger.acceptCredit(shotId);
        ledger.freezeShot(shotId);
        vm.prank(admin);
        nft.publish(shotId, address(treasury));

        (, uint256 amount) = IERC2981(address(nft)).royaltyInfo(shotId, 10_000);
        assertEq(amount, 250);
    }

    function testInstrumentRegistryRoutesProfitToVault() public {
        vm.prank(admin);
        uint256 id = registry.register(
            InstrumentRegistry.Instrument({
                kind: InstrumentRegistry.Kind.JuiceboxV2,
                chainId: 1,
                collection: 0xD8e9d4cf0C2d464BC0759d1C1B8a99D7A4159b0F,
                projectOrTokenId: 402,
                label: "Juicebox V2 project 402",
                notesUri: "https://old.juicebox.money/v2/p/402",
                countsAsProfit: true,
                registeredAt: 0,
                registeredBy: address(0)
            })
        );

        vm.startPrank(buyer);
        usdc.approve(address(treasury), 10_000 * 1e6);
        registry.routeProceeds(id, address(usdc), 10_000 * 1e6);
        vm.stopPrank();

        assertEq(
            treasury.lockedSurplus(address(usdc)) + treasury.hireBudget(address(usdc)), 10_000 * 1e6
        );
    }

    function testSharesDoNotUnlockSurplus() public {
        _deposit(500_000 * 1e6);
        assertEq(treasury.sharesOf(animator), 100);
        assertGt(treasury.lockedSurplus(address(usdc)), 0);
        // There is no withdrawShares or cashOut. Surplus stays until payroll.
        vm.prank(animator);
        vm.expectRevert();
        treasury.paySalary(animator, address(usdc), 1);
    }
}
