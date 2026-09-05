// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/*
 *  2KOOL PRODUCTIONS — Instrument Registry
 *
 *  Existing fundraising NFTs, Juicebox projects, paintings, music drops,
 *  and broadcast licenses are registered here so their proceeds count as
 *  company profit flowing into the salary vault — not as a private windfall.
 *
 *  This contract cannot rewrite old Juicebox or marketplace contracts.
 *  It is the new canonical book: what counts, and where the money goes.
 */

import {AccessControl} from "@openzeppelin/contracts/access/AccessControl.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {StudioTreasury} from "./StudioTreasury.sol";

contract InstrumentRegistry is AccessControl, ReentrancyGuard {
    using SafeERC20 for IERC20;

    bytes32 public constant REGISTRAR_ROLE = keccak256("REGISTRAR_ROLE");

    enum Kind {
        JuiceboxV2,
        Erc721,
        Erc1155,
        Music,
        Painting,
        Broadcast,
        Other
    }

    struct Instrument {
        Kind kind;
        uint256 chainId;
        address collection;
        uint256 projectOrTokenId;
        string label;
        string notesUri;
        bool countsAsProfit;
        uint64 registeredAt;
        address registeredBy;
    }

    StudioTreasury public immutable treasury;
    uint256 public instrumentCount;
    mapping(uint256 => Instrument) public instruments;

    /// @dev collection => tokenId (0 = whole collection) => instrument id
    mapping(address => mapping(uint256 => uint256)) public idOf;

    event InstrumentRegistered(
        uint256 indexed id, Kind kind, address collection, uint256 projectOrTokenId, string label
    );
    event ProceedsRouted(
        uint256 indexed instrumentId, address indexed token, uint256 amount, address from
    );

    error ZeroAddress();
    error UnknownInstrument();
    error NotProfitInstrument();

    constructor(address admin, StudioTreasury treasury_) {
        if (admin == address(0) || address(treasury_) == address(0)) revert ZeroAddress();
        treasury = treasury_;
        _grantRole(DEFAULT_ADMIN_ROLE, admin);
        _grantRole(REGISTRAR_ROLE, admin);
    }

    function register(Instrument calldata inst)
        external
        onlyRole(REGISTRAR_ROLE)
        returns (uint256 id)
    {
        id = ++instrumentCount;
        instruments[id] = Instrument({
            kind: inst.kind,
            chainId: inst.chainId,
            collection: inst.collection,
            projectOrTokenId: inst.projectOrTokenId,
            label: inst.label,
            notesUri: inst.notesUri,
            countsAsProfit: inst.countsAsProfit,
            registeredAt: uint64(block.timestamp),
            registeredBy: msg.sender
        });
        idOf[inst.collection][inst.projectOrTokenId] = id;
        emit InstrumentRegistered(id, inst.kind, inst.collection, inst.projectOrTokenId, inst.label);
    }

    /// @notice Pay sale/royalty proceeds from a registered instrument into the vault.
    function routeProceeds(uint256 instrumentId, address token, uint256 amount)
        external
        nonReentrant
    {
        Instrument storage inst = instruments[instrumentId];
        if (inst.registeredAt == 0) revert UnknownInstrument();
        if (!inst.countsAsProfit) revert NotProfitInstrument();
        treasury.depositFrom(msg.sender, token, amount);
        emit ProceedsRouted(instrumentId, token, amount, msg.sender);
    }

    function get(uint256 id) external view returns (Instrument memory) {
        if (instruments[id].registeredAt == 0) revert UnknownInstrument();
        return instruments[id];
    }
}
