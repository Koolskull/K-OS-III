// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Script} from "forge-std/Script.sol";
import {StudioKit} from "../src/StudioKit.sol";
import {StudioTreasury} from "../src/StudioTreasury.sol";
import {InstrumentRegistry} from "../src/InstrumentRegistry.sol";

/// @notice Deploy the 2Kool production protocol.
///
///   ADMIN=0x... CONVERSION_SAFE=0x... forge script script/Deploy.s.sol --rpc-url $RPC --broadcast
contract Deploy is Script {
    address constant JB_PROJECTS_MAINNET = 0xD8e9d4cf0C2d464BC0759d1C1B8a99D7A4159b0F;
    uint256 constant JUICEBOX_PROJECT_ID = 402;
    address constant USDC_MAINNET = 0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48;
    address constant USDT_MAINNET = 0xdAC17F958D2ee523a2206206994597C13D831ec7;

    function run() external {
        address admin = vm.envAddress("ADMIN");
        address conversionSafe = vm.envAddress("CONVERSION_SAFE");
        uint16 hireBps = uint16(vm.envOr("HIRE_BPS", uint256(1_000)));

        vm.startBroadcast();
        StudioKit kit = new StudioKit(admin, conversionSafe, hireBps);

        // Follow-up txs only work if the broadcasting wallet is ADMIN.
        // If ADMIN is a Safe, submit setStablecoin / register from the Safe.
        if (msg.sender == admin && block.chainid == 1) {
            StudioTreasury treasury = kit.treasury();
            treasury.setStablecoin(USDC_MAINNET, true, 6);
            treasury.setStablecoin(USDT_MAINNET, true, 6);
            kit.registry()
                .register(
                    InstrumentRegistry.Instrument({
                        kind: InstrumentRegistry.Kind.JuiceboxV2,
                        chainId: 1,
                        collection: JB_PROJECTS_MAINNET,
                        projectOrTokenId: JUICEBOX_PROJECT_ID,
                        label: "Juicebox V2 project 402 (legacy 2Kool fundraising)",
                        notesUri: "https://old.juicebox.money/v2/p/402",
                        countsAsProfit: true,
                        registeredAt: 0,
                        registeredBy: address(0)
                    })
                );
        }

        vm.stopBroadcast();
    }
}
