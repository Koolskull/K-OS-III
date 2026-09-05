// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/*
 *  2KOOL PRODUCTIONS — Studio Treasury
 *
 *  All inbound company value lands here. Members can be paid a salary,
 *  never more than $100,000 of pegged stablecoin per rolling year.
 *  Surplus cannot be swept into anyone's pocket. It funds future payroll,
 *  new hires, and the share ledger that records who is owed a living
 *  from the work — not a lottery ticket.
 */

import {AccessControl} from "@openzeppelin/contracts/access/AccessControl.sol";
import {Pausable} from "@openzeppelin/contracts/utils/Pausable.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";

import {IERC721Receiver} from "@openzeppelin/contracts/token/ERC721/IERC721Receiver.sol";

contract StudioTreasury is AccessControl, Pausable, ReentrancyGuard, IERC721Receiver {
    using SafeERC20 for IERC20;

    bytes32 public constant PAYROLL_ROLE = keccak256("PAYROLL_ROLE");
    bytes32 public constant PAUSER_ROLE = keccak256("PAUSER_ROLE");
    bytes32 public constant DEPOSITOR_ROLE = keccak256("DEPOSITOR_ROLE");

    /// @notice $100,000 expressed at 6 decimal places (USDC/USDT style).
    uint256 public constant ANNUAL_CAP_USD6 = 100_000 * 1e6;
    uint256 public constant YEAR = 365 days;
    uint16 public constant BPS_DENOMINATOR = 10_000;

    enum MemberStatus {
        None,
        Active,
        Alumni,
        Suspended
    }

    struct Stablecoin {
        bool allowed;
        uint8 decimals;
    }

    struct Member {
        MemberStatus status;
        uint256 salaryUsd6;
        uint256 shares;
        uint64 startedAt;
    }

    struct PayWindow {
        uint64 startedAt;
        uint256 paidUsd6;
    }

    mapping(address token => Stablecoin) public stablecoins;
    mapping(address account => Member) public members;
    mapping(address account => PayWindow) public windows;

    uint256 public totalShares;
    uint16 public hireBps;
    address public conversionSafe;

    mapping(address token => uint256) public hireBudget;
    mapping(address token => uint256) public lockedSurplus;

    event StablecoinSet(address indexed token, bool allowed, uint8 decimals);
    event HireBpsSet(uint16 bps);
    event ConversionSafeSet(address indexed safe);
    event MemberUpdated(
        address indexed account, MemberStatus status, uint256 salaryUsd6, uint256 shares
    );
    event SharesGranted(address indexed account, uint256 amount, uint256 totalShares);
    event Deposited(address indexed token, address indexed from, uint256 amount, uint256 hireCut);
    event EthLocked(address indexed from, uint256 amount);
    event SalaryPaid(
        address indexed employee, address indexed token, uint256 amount, uint256 paidUsd6InWindow
    );
    event HireSpent(address indexed token, address indexed to, uint256 amount, bytes32 reason);
    event HireAllocated(address indexed token, uint256 amount);
    event EthSwept(uint256 amount, address indexed to);
    event TokenRescued(address indexed token, address indexed to, uint256 amount);

    error ZeroAddress();
    error InvalidBps();
    error InvalidDecimals();
    error TokenNotAllowed();
    error NotActiveMember();
    error ActiveMemberUsePayroll();
    error SalaryOverCap();
    error SalaryExceedsContract();
    error InsufficientHireBudget();
    error InsufficientSurplus();
    error CapExceeded(uint256 paid, uint256 attempt, uint256 cap);
    error ProtectedToken();
    error NoEth();

    constructor(address admin, address conversionSafe_, uint16 hireBps_) {
        if (admin == address(0) || conversionSafe_ == address(0)) revert ZeroAddress();
        if (hireBps_ > BPS_DENOMINATOR) revert InvalidBps();

        _grantRole(DEFAULT_ADMIN_ROLE, admin);
        _grantRole(PAYROLL_ROLE, admin);
        _grantRole(PAUSER_ROLE, admin);
        _grantRole(DEPOSITOR_ROLE, admin);

        conversionSafe = conversionSafe_;
        hireBps = hireBps_;
    }

    // -------------------------------------------------------------------------
    // Configuration
    // -------------------------------------------------------------------------

    function setStablecoin(address token, bool allowed, uint8 decimals_)
        external
        onlyRole(DEFAULT_ADMIN_ROLE)
    {
        if (token == address(0)) revert ZeroAddress();
        if (allowed && decimals_ == 0) revert InvalidDecimals();
        stablecoins[token] = Stablecoin({allowed: allowed, decimals: decimals_});
        emit StablecoinSet(token, allowed, decimals_);
    }

    function setHireBps(uint16 bps) external onlyRole(DEFAULT_ADMIN_ROLE) {
        if (bps > BPS_DENOMINATOR) revert InvalidBps();
        hireBps = bps;
        emit HireBpsSet(bps);
    }

    function setConversionSafe(address safe) external onlyRole(DEFAULT_ADMIN_ROLE) {
        if (safe == address(0)) revert ZeroAddress();
        conversionSafe = safe;
        emit ConversionSafeSet(safe);
    }

    function pause() external onlyRole(PAUSER_ROLE) {
        _pause();
    }

    function unpause() external onlyRole(PAUSER_ROLE) {
        _unpause();
    }

    // -------------------------------------------------------------------------
    // Members and studio units (not legal equity by themselves)
    // -------------------------------------------------------------------------

    function setMember(address account, MemberStatus status, uint256 salaryUsd6)
        external
        onlyRole(DEFAULT_ADMIN_ROLE)
    {
        if (account == address(0)) revert ZeroAddress();
        if (salaryUsd6 > ANNUAL_CAP_USD6) revert SalaryOverCap();

        Member storage m = members[account];
        if (m.startedAt == 0) m.startedAt = uint64(block.timestamp);
        m.status = status;
        m.salaryUsd6 = salaryUsd6;
        emit MemberUpdated(account, status, salaryUsd6, m.shares);
    }

    function grantShares(address account, uint256 amount) external onlyRole(DEFAULT_ADMIN_ROLE) {
        if (account == address(0) || amount == 0) revert ZeroAddress();
        Member storage m = members[account];
        if (m.status == MemberStatus.None) revert NotActiveMember();
        m.shares += amount;
        totalShares += amount;
        emit SharesGranted(account, amount, totalShares);
        emit MemberUpdated(account, m.status, m.salaryUsd6, m.shares);
    }

    // -------------------------------------------------------------------------
    // Deposits — value enters the vault and stays there
    // -------------------------------------------------------------------------

    function deposit(address token, uint256 amount) external whenNotPaused nonReentrant {
        _depositFrom(msg.sender, token, amount);
    }

    /// @notice Pull-deposit used by the sale desk / instrument registry.
    function depositFrom(address from, address token, uint256 amount)
        external
        whenNotPaused
        nonReentrant
        onlyRole(DEPOSITOR_ROLE)
    {
        _depositFrom(from, token, amount);
    }

    /// @notice Direct transfer already arrived; account it. Only trusted modules.
    function creditBalance(address token, uint256 amount)
        external
        whenNotPaused
        onlyRole(DEPOSITOR_ROLE)
    {
        if (!stablecoins[token].allowed) revert TokenNotAllowed();
        _split(token, amount, msg.sender);
    }

    /// @notice Vault holds published shot NFTs (animation cels) until they are listed for sale.
    function onERC721Received(address, address, uint256, bytes calldata)
        external
        pure
        returns (bytes4)
    {
        return IERC721Receiver.onERC721Received.selector;
    }

    receive() external payable {
        emit EthLocked(msg.sender, msg.value);
    }

    // -------------------------------------------------------------------------
    // Payroll — the only path from surplus to a member wallet
    // -------------------------------------------------------------------------

    function paySalary(address employee, address token, uint256 amount)
        external
        whenNotPaused
        nonReentrant
        onlyRole(PAYROLL_ROLE)
    {
        Member memory m = members[employee];
        if (m.status != MemberStatus.Active) revert NotActiveMember();
        if (!stablecoins[token].allowed) revert TokenNotAllowed();

        uint256 usd6 = _toUsd6(token, amount);
        uint256 paid = _consumeCap(employee, usd6);
        if (paid > m.salaryUsd6) revert SalaryExceedsContract();

        _debitSurplus(token, amount);
        IERC20(token).safeTransfer(employee, amount);
        emit SalaryPaid(employee, token, amount, paid);
    }

    function spendHireBudget(address token, address to, uint256 amount, bytes32 reason)
        external
        whenNotPaused
        nonReentrant
        onlyRole(PAYROLL_ROLE)
    {
        if (to == address(0)) revert ZeroAddress();
        if (!stablecoins[token].allowed) revert TokenNotAllowed();
        if (members[to].status == MemberStatus.Active) revert ActiveMemberUsePayroll();
        uint256 budget = hireBudget[token];
        if (amount > budget) revert InsufficientHireBudget();
        hireBudget[token] = budget - amount;
        IERC20(token).safeTransfer(to, amount);
        emit HireSpent(token, to, amount, reason);
    }

    function allocateHireBudget(address token, uint256 amount)
        external
        onlyRole(DEFAULT_ADMIN_ROLE)
    {
        _debitSurplus(token, amount);
        hireBudget[token] += amount;
        emit HireAllocated(token, amount);
    }

    /// @notice ETH is not payroll. Council Safe swaps it and deposits USDC/USDT/USAT.
    function sweepEthToConversionSafe() external nonReentrant onlyRole(DEFAULT_ADMIN_ROLE) {
        uint256 bal = address(this).balance;
        if (bal == 0) revert NoEth();
        (bool ok,) = conversionSafe.call{value: bal}("");
        require(ok, "ETH_SWEEP");
        emit EthSwept(bal, conversionSafe);
    }

    /// @notice Recover tokens that are not registered stablecoins (airdrops, mistakes).
    function rescueToken(address token, address to, uint256 amount)
        external
        onlyRole(DEFAULT_ADMIN_ROLE)
    {
        if (stablecoins[token].allowed) revert ProtectedToken();
        if (to == address(0)) revert ZeroAddress();
        IERC20(token).safeTransfer(to, amount);
        emit TokenRescued(token, to, amount);
    }

    // -------------------------------------------------------------------------
    // Views
    // -------------------------------------------------------------------------

    function sharesOf(address account) external view returns (uint256) {
        return members[account].shares;
    }

    function remainingCapUsd6(address employee) external view returns (uint256) {
        PayWindow memory w = windows[employee];
        if (w.startedAt == 0 || block.timestamp >= uint256(w.startedAt) + YEAR) {
            return members[employee].salaryUsd6;
        }
        uint256 cap = members[employee].salaryUsd6;
        if (w.paidUsd6 >= cap) return 0;
        return cap - w.paidUsd6;
    }

    function toUsd6(address token, uint256 amount) external view returns (uint256) {
        return _toUsd6(token, amount);
    }

    // -------------------------------------------------------------------------
    // Internal
    // -------------------------------------------------------------------------

    function _depositFrom(address from, address token, uint256 amount) internal {
        if (!stablecoins[token].allowed) revert TokenNotAllowed();
        IERC20(token).safeTransferFrom(from, address(this), amount);
        _split(token, amount, from);
    }

    function _split(address token, uint256 amount, address from) internal {
        uint256 hireCut = (amount * hireBps) / BPS_DENOMINATOR;
        hireBudget[token] += hireCut;
        lockedSurplus[token] += amount - hireCut;
        emit Deposited(token, from, amount, hireCut);
    }

    function _debitSurplus(address token, uint256 amount) internal {
        uint256 surplus = lockedSurplus[token];
        if (amount > surplus) revert InsufficientSurplus();
        lockedSurplus[token] = surplus - amount;
    }

    function _toUsd6(address token, uint256 amount) internal view returns (uint256) {
        uint8 d = stablecoins[token].decimals;
        if (d == 6) return amount;
        if (d > 6) return amount / (10 ** (d - 6));
        return amount * (10 ** (6 - d));
    }

    function _consumeCap(address employee, uint256 usd6) internal returns (uint256 paid) {
        PayWindow storage w = windows[employee];
        if (w.startedAt == 0 || block.timestamp >= uint256(w.startedAt) + YEAR) {
            w.startedAt = uint64(block.timestamp);
            w.paidUsd6 = 0;
        }
        uint256 next = w.paidUsd6 + usd6;
        uint256 cap = members[employee].salaryUsd6;
        if (cap > ANNUAL_CAP_USD6) cap = ANNUAL_CAP_USD6;
        if (next > cap) revert CapExceeded(w.paidUsd6, usd6, cap);
        w.paidUsd6 = next;
        return next;
    }
}
