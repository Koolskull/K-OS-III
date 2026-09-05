// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/*
 *  2KOOL PRODUCTIONS — Credit Ledger
 *
 *  Git for showrunners. Every shot is a commit: parent (previous version),
 *  content hash, work units, branch name, and a list of credited wallets.
 *  Credits are proposed, accepted by the people named, then frozen.
 *  Frozen history is never edited. A correction is a new shot with a parent.
 */

import {AccessControl} from "@openzeppelin/contracts/access/AccessControl.sol";

contract CreditLedger is AccessControl {
    bytes32 public constant CREDIT_ROLE = keccak256("CREDIT_ROLE");
    bytes32 public constant PUBLISHER_ROLE = keccak256("PUBLISHER_ROLE");

    uint16 public constant BPS_DENOMINATOR = 10_000;
    uint16 public constant DEFAULT_ROYALTY_BPS = 500; // 5% shared by the credited team
    uint16 public constant MAX_ROYALTY_BPS = 1_000; // 10% ceiling — keep customer premium sane

    struct Production {
        bytes32 slug;
        string title;
        string uri;
        uint16 defaultRoyaltyBps;
        address showrunner;
        bool exists;
    }

    struct Credit {
        address account;
        bytes32 role;
        uint16 weight;
        bool accepted;
    }

    struct Shot {
        uint256 productionId;
        uint256 parentShotId;
        bytes32 branch;
        bytes32 contentHash;
        string uri;
        uint32 workUnits;
        uint16 royaltyBps;
        bool royaltyOverride;
        bool frozen;
        bool published;
        uint64 createdAt;
        address proposer;
    }

    uint256 public productionCount;
    uint256 public shotCount;
    address public shotNFT;

    mapping(uint256 => Production) public productions;
    mapping(uint256 => Shot) public shots;
    mapping(uint256 => Credit[]) internal _credits;

    event ProductionOpened(
        uint256 indexed productionId,
        bytes32 slug,
        string title,
        address showrunner,
        uint16 defaultRoyaltyBps
    );
    event ShotCommitted(
        uint256 indexed shotId,
        uint256 indexed productionId,
        uint256 parentShotId,
        bytes32 branch,
        bytes32 contentHash
    );
    event CreditAccepted(uint256 indexed shotId, address indexed account);
    event ShotFrozen(uint256 indexed shotId, bool forced);
    event ShotPublished(uint256 indexed shotId);
    event RoyaltyOverride(uint256 indexed shotId, uint16 bps);
    event ShotNFTSet(address indexed shotNFT);

    error ZeroAddress();
    error UnknownProduction();
    error UnknownShot();
    error InvalidRoyalty();
    error NoCredits();
    error AlreadyFrozen();
    error NotFrozen();
    error AlreadyPublished();
    error NotCredited();
    error CreditsIncomplete();
    error NotShotNFT();
    error EmptyTitle();

    constructor(address admin) {
        if (admin == address(0)) revert ZeroAddress();
        _grantRole(DEFAULT_ADMIN_ROLE, admin);
        _grantRole(CREDIT_ROLE, admin);
        _grantRole(PUBLISHER_ROLE, admin);
    }

    function setShotNFT(address shotNFT_) external onlyRole(DEFAULT_ADMIN_ROLE) {
        if (shotNFT_ == address(0)) revert ZeroAddress();
        shotNFT = shotNFT_;
        emit ShotNFTSet(shotNFT_);
    }

    function openProduction(
        bytes32 slug,
        string calldata title,
        string calldata uri,
        uint16 defaultRoyaltyBps,
        address showrunner
    ) external onlyRole(CREDIT_ROLE) returns (uint256 id) {
        if (bytes(title).length == 0) revert EmptyTitle();
        if (showrunner == address(0)) revert ZeroAddress();
        uint16 bps = defaultRoyaltyBps == 0 ? DEFAULT_ROYALTY_BPS : defaultRoyaltyBps;
        if (bps > MAX_ROYALTY_BPS) revert InvalidRoyalty();

        id = ++productionCount;
        productions[id] = Production({
            slug: slug,
            title: title,
            uri: uri,
            defaultRoyaltyBps: bps,
            showrunner: showrunner,
            exists: true
        });
        emit ProductionOpened(id, slug, title, showrunner, bps);
    }

    function commitShot(
        uint256 productionId,
        uint256 parentShotId,
        bytes32 branch,
        bytes32 contentHash,
        string calldata uri,
        uint32 workUnits,
        Credit[] calldata credits_
    ) external onlyRole(CREDIT_ROLE) returns (uint256 id) {
        if (!productions[productionId].exists) {
            revert UnknownProduction();
        }
        if (credits_.length == 0) revert NoCredits();
        if (parentShotId != 0 && shots[parentShotId].createdAt == 0) revert UnknownShot();

        id = ++shotCount;
        shots[id] = Shot({
            productionId: productionId,
            parentShotId: parentShotId,
            branch: branch,
            contentHash: contentHash,
            uri: uri,
            workUnits: workUnits,
            royaltyBps: 0,
            royaltyOverride: false,
            frozen: false,
            published: false,
            createdAt: uint64(block.timestamp),
            proposer: msg.sender
        });

        Credit[] storage list = _credits[id];
        for (uint256 i; i < credits_.length; ++i) {
            if (credits_[i].account == address(0) || credits_[i].weight == 0) revert ZeroAddress();
            list.push(
                Credit({
                    account: credits_[i].account,
                    role: credits_[i].role,
                    weight: credits_[i].weight,
                    accepted: false
                })
            );
        }

        emit ShotCommitted(id, productionId, parentShotId, branch, contentHash);
    }

    function acceptCredit(uint256 shotId) external {
        Shot storage s = _requireShot(shotId);
        if (s.frozen) revert AlreadyFrozen();

        Credit[] storage list = _credits[shotId];
        bool found;
        for (uint256 i; i < list.length; ++i) {
            if (list[i].account == msg.sender) {
                list[i].accepted = true;
                found = true;
            }
        }
        if (!found) revert NotCredited();
        emit CreditAccepted(shotId, msg.sender);
    }

    function freezeShot(uint256 shotId) external {
        Shot storage s = _requireShot(shotId);
        if (s.frozen) revert AlreadyFrozen();
        if (!_allAccepted(shotId)) revert CreditsIncomplete();
        s.frozen = true;
        emit ShotFrozen(shotId, false);
    }

    /// @notice Showrunner/admin escape hatch when a credited wallet cannot sign.
    ///         The refusal is still on-chain via missing accept events.
    function forceFreeze(uint256 shotId) external onlyRole(CREDIT_ROLE) {
        Shot storage s = _requireShot(shotId);
        if (s.frozen) revert AlreadyFrozen();
        s.frozen = true;
        emit ShotFrozen(shotId, true);
    }

    function setRoyaltyOverride(uint256 shotId, uint16 bps) external onlyRole(CREDIT_ROLE) {
        Shot storage s = _requireShot(shotId);
        if (s.published) revert AlreadyPublished();
        if (bps > MAX_ROYALTY_BPS) revert InvalidRoyalty();
        s.royaltyOverride = true;
        s.royaltyBps = bps;
        emit RoyaltyOverride(shotId, bps);
    }

    function markPublished(uint256 shotId) external {
        if (msg.sender != shotNFT) revert NotShotNFT();
        Shot storage s = _requireShot(shotId);
        if (!s.frozen) revert NotFrozen();
        if (s.published) revert AlreadyPublished();
        s.published = true;
        emit ShotPublished(shotId);
    }

    function canPublish(uint256 shotId) external view returns (bool) {
        Shot storage s = shots[shotId];
        return s.createdAt != 0 && s.frozen && !s.published;
    }

    function royaltyBpsOf(uint256 shotId) public view returns (uint16) {
        Shot storage s = shots[shotId];
        if (s.createdAt == 0) revert UnknownShot();
        if (s.royaltyOverride) return s.royaltyBps;
        return productions[s.productionId].defaultRoyaltyBps;
    }

    function uriOf(uint256 shotId) external view returns (string memory) {
        return _requireShot(shotId).uri;
    }

    function creditsOf(uint256 shotId) external view returns (Credit[] memory) {
        return _credits[shotId];
    }

    function totalWeight(uint256 shotId) public view returns (uint256 sum) {
        Credit[] storage list = _credits[shotId];
        for (uint256 i; i < list.length; ++i) {
            sum += list[i].weight;
        }
    }

    function creditCount(uint256 shotId) external view returns (uint256) {
        return _credits[shotId].length;
    }

    function shotIsFrozen(uint256 shotId) external view returns (bool) {
        return _requireShot(shotId).frozen;
    }

    function parentOf(uint256 shotId) external view returns (uint256) {
        return _requireShot(shotId).parentShotId;
    }

    function _allAccepted(uint256 shotId) internal view returns (bool) {
        Credit[] storage list = _credits[shotId];
        for (uint256 i; i < list.length; ++i) {
            if (!list[i].accepted) return false;
        }
        return list.length > 0;
    }

    function _requireShot(uint256 shotId) internal view returns (Shot storage s) {
        s = shots[shotId];
        if (s.createdAt == 0) revert UnknownShot();
    }
}
