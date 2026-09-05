// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {StudioTreasury} from "./StudioTreasury.sol";
import {CreditLedger} from "./CreditLedger.sol";
import {RoyaltyRouter} from "./RoyaltyRouter.sol";
import {ShotRoyaltySink} from "./ShotRoyaltySink.sol";
import {ShotNFT} from "./ShotNFT.sol";
import {InstrumentRegistry} from "./InstrumentRegistry.sol";

/// @notice Deploys and wires the full 2Kool production protocol in one transaction.
contract StudioKit {
    StudioTreasury public immutable treasury;
    CreditLedger public immutable ledger;
    RoyaltyRouter public immutable router;
    ShotRoyaltySink public immutable sinkImpl;
    ShotNFT public immutable nft;
    InstrumentRegistry public immutable registry;

    constructor(address admin, address conversionSafe, uint16 hireBps) {
        require(admin != address(0), "admin");

        treasury = new StudioTreasury(address(this), conversionSafe, hireBps);
        ledger = new CreditLedger(address(this));
        router = new RoyaltyRouter(address(this), ledger);
        sinkImpl = new ShotRoyaltySink();
        nft = new ShotNFT(address(this), ledger, router, treasury, address(sinkImpl));
        registry = new InstrumentRegistry(address(this), treasury);

        ledger.setShotNFT(address(nft));
        treasury.grantRole(treasury.DEPOSITOR_ROLE(), address(nft));
        treasury.grantRole(treasury.DEPOSITOR_ROLE(), address(registry));
        router.grantRole(router.SETTLER_ROLE(), address(nft));

        _passTreasury(admin);
        _passLedger(admin);
        _passRouter(admin);
        _passNft(admin);
        _passRegistry(admin);
    }

    function _passTreasury(address admin) internal {
        treasury.grantRole(treasury.DEFAULT_ADMIN_ROLE(), admin);
        treasury.grantRole(treasury.PAYROLL_ROLE(), admin);
        treasury.grantRole(treasury.PAUSER_ROLE(), admin);
        treasury.grantRole(treasury.DEPOSITOR_ROLE(), admin);
        treasury.renounceRole(treasury.DEFAULT_ADMIN_ROLE(), address(this));
        treasury.renounceRole(treasury.PAYROLL_ROLE(), address(this));
        treasury.renounceRole(treasury.PAUSER_ROLE(), address(this));
        treasury.renounceRole(treasury.DEPOSITOR_ROLE(), address(this));
    }

    function _passLedger(address admin) internal {
        ledger.grantRole(ledger.DEFAULT_ADMIN_ROLE(), admin);
        ledger.grantRole(ledger.CREDIT_ROLE(), admin);
        ledger.grantRole(ledger.PUBLISHER_ROLE(), admin);
        ledger.renounceRole(ledger.DEFAULT_ADMIN_ROLE(), address(this));
        ledger.renounceRole(ledger.CREDIT_ROLE(), address(this));
        ledger.renounceRole(ledger.PUBLISHER_ROLE(), address(this));
    }

    function _passRouter(address admin) internal {
        router.grantRole(router.DEFAULT_ADMIN_ROLE(), admin);
        router.grantRole(router.SETTLER_ROLE(), admin);
        router.renounceRole(router.DEFAULT_ADMIN_ROLE(), address(this));
        router.renounceRole(router.SETTLER_ROLE(), address(this));
    }

    function _passNft(address admin) internal {
        nft.grantRole(nft.DEFAULT_ADMIN_ROLE(), admin);
        nft.grantRole(nft.PUBLISHER_ROLE(), admin);
        nft.renounceRole(nft.DEFAULT_ADMIN_ROLE(), address(this));
        nft.renounceRole(nft.PUBLISHER_ROLE(), address(this));
    }

    function _passRegistry(address admin) internal {
        registry.grantRole(registry.DEFAULT_ADMIN_ROLE(), admin);
        registry.grantRole(registry.REGISTRAR_ROLE(), admin);
        registry.renounceRole(registry.DEFAULT_ADMIN_ROLE(), address(this));
        registry.renounceRole(registry.REGISTRAR_ROLE(), address(this));
    }
}
