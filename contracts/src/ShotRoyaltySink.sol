// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/*
 *  Minimal clone target. One clone per published shot so ERC-2981 ETH
 *  royalties from marketplaces land on the right shot without a race.
 */

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

interface IRoyaltyRouter {
    function creditETH(uint256 shotId) external payable;
    function creditToken(uint256 shotId, address token, uint256 amount) external;
}

contract ShotRoyaltySink {
    using SafeERC20 for IERC20;

    address public router;
    uint256 public shotId;
    bool public initialized;

    error AlreadyInit();
    error NotInit();

    constructor() {
        initialized = true;
    }

    function initialize(address router_, uint256 shotId_) external {
        if (initialized) revert AlreadyInit();
        initialized = true;
        router = router_;
        shotId = shotId_;
    }

    receive() external payable {
        if (router == address(0)) revert NotInit();
        IRoyaltyRouter(router).creditETH{value: msg.value}(shotId);
    }

    function forwardToken(address token) external {
        if (router == address(0)) revert NotInit();
        uint256 bal = IERC20(token).balanceOf(address(this));
        if (bal == 0) return;
        IERC20(token).safeTransfer(router, bal);
        IRoyaltyRouter(router).creditToken(shotId, token, bal);
    }
}
