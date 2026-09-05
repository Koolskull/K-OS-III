// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/*
 *  2KOOL PRODUCTIONS — Royalty Router
 *
 *  5% of a sale (the credited TEAM's share, not 5% each) sits here until
 *  pull-withdrawn by the wallets named on that shot. Used for shot NFTs,
 *  cards, toys, merch, and any other licensed use of a credited design.
 */

import {AccessControl} from "@openzeppelin/contracts/access/AccessControl.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {CreditLedger} from "./CreditLedger.sol";

contract RoyaltyRouter is AccessControl, ReentrancyGuard {
    using SafeERC20 for IERC20;

    bytes32 public constant SETTLER_ROLE = keccak256("SETTLER_ROLE");

    address internal constant ETH = address(0);

    CreditLedger public immutable ledger;

    mapping(uint256 shotId => address) public sinkOf;
    mapping(address sink => uint256) public shotOfSink;
    mapping(uint256 shotId => mapping(address token => uint256)) public pooled;
    mapping(uint256 shotId => mapping(address token => mapping(address account => uint256))) public
        withdrawn;

    event SinkRegistered(uint256 indexed shotId, address indexed sink);
    event Credited(uint256 indexed shotId, address indexed token, uint256 amount);
    event Withdrawn(
        uint256 indexed shotId, address indexed token, address indexed account, uint256 amount
    );

    error ZeroAddress();
    error Unauthorized();
    error NothingOwed();
    error NoCredits();

    constructor(address admin, CreditLedger ledger_) {
        if (admin == address(0) || address(ledger_) == address(0)) revert ZeroAddress();
        ledger = ledger_;
        _grantRole(DEFAULT_ADMIN_ROLE, admin);
        _grantRole(SETTLER_ROLE, admin);
    }

    function registerSink(uint256 shotId, address sink) external onlyRole(SETTLER_ROLE) {
        if (sink == address(0)) revert ZeroAddress();
        sinkOf[shotId] = sink;
        shotOfSink[sink] = shotId;
        emit SinkRegistered(shotId, sink);
    }

    function creditETH(uint256 shotId) external payable {
        _assertCreditor(shotId);
        pooled[shotId][ETH] += msg.value;
        emit Credited(shotId, ETH, msg.value);
    }

    function creditToken(uint256 shotId, address token, uint256 amount) external {
        _assertCreditor(shotId);
        pooled[shotId][token] += amount;
        emit Credited(shotId, token, amount);
    }

    function owed(uint256 shotId, address token, address account) public view returns (uint256) {
        uint256 weightSum = ledger.totalWeight(shotId);
        if (weightSum == 0) return 0;
        CreditLedger.Credit[] memory credits = ledger.creditsOf(shotId);
        uint256 share;
        for (uint256 i; i < credits.length; ++i) {
            if (credits[i].account == account) {
                share += credits[i].weight;
            }
        }
        if (share == 0) return 0;
        uint256 total = (pooled[shotId][token] * share) / weightSum;
        uint256 already = withdrawn[shotId][token][account];
        if (total <= already) return 0;
        return total - already;
    }

    function withdraw(uint256 shotId, address token) external nonReentrant {
        uint256 amount = owed(shotId, token, msg.sender);
        if (amount == 0) revert NothingOwed();
        withdrawn[shotId][token][msg.sender] += amount;
        if (token == ETH) {
            (bool ok,) = msg.sender.call{value: amount}("");
            require(ok, "ETH");
        } else {
            IERC20(token).safeTransfer(msg.sender, amount);
        }
        emit Withdrawn(shotId, token, msg.sender, amount);
    }

    receive() external payable {}

    function _assertCreditor(uint256 shotId) internal view {
        if (msg.sender != sinkOf[shotId] && !hasRole(SETTLER_ROLE, msg.sender)) {
            revert Unauthorized();
        }
    }
}
