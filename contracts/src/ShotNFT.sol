// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/*
 *  2KOOL PRODUCTIONS — Shot NFT
 *
 *  One token per published shot (or per frame, if you mint at that grain).
 *  Comparable to an animation cel: provenance is the point; aftermarket
 *  is optional. ERC-2981 points at a per-shot royalty sink so the credited
 *  team shares 5% of future sales — 5% total, not 5% each.
 */

import {AccessControl} from "@openzeppelin/contracts/access/AccessControl.sol";
import {ERC721} from "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import {
    ERC721URIStorage
} from "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import {ERC2981} from "@openzeppelin/contracts/token/common/ERC2981.sol";
import {Clones} from "@openzeppelin/contracts/proxy/Clones.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {CreditLedger} from "./CreditLedger.sol";
import {RoyaltyRouter} from "./RoyaltyRouter.sol";
import {StudioTreasury} from "./StudioTreasury.sol";
import {ShotRoyaltySink} from "./ShotRoyaltySink.sol";

contract ShotNFT is ERC721, ERC721URIStorage, ERC2981, AccessControl, ReentrancyGuard {
    using SafeERC20 for IERC20;

    bytes32 public constant PUBLISHER_ROLE = keccak256("PUBLISHER_ROLE");

    CreditLedger public immutable ledger;
    RoyaltyRouter public immutable router;
    StudioTreasury public immutable treasury;
    address public immutable sinkImplementation;

    event ShotPublishedNFT(uint256 indexed shotId, address indexed to, address sink);
    event SaleSettled(
        uint256 indexed shotId,
        address indexed token,
        uint256 salePrice,
        uint256 creatorCut,
        uint256 studioCut
    );

    error ZeroAddress();
    error CannotPublish();

    constructor(
        address admin,
        CreditLedger ledger_,
        RoyaltyRouter router_,
        StudioTreasury treasury_,
        address sinkImplementation_
    ) ERC721("2Kool Production Shot", "2KSHOT") {
        if (
            admin == address(0) || address(ledger_) == address(0) || address(router_) == address(0)
                || address(treasury_) == address(0) || sinkImplementation_ == address(0)
        ) {
            revert ZeroAddress();
        }
        ledger = ledger_;
        router = router_;
        treasury = treasury_;
        sinkImplementation = sinkImplementation_;
        _grantRole(DEFAULT_ADMIN_ROLE, admin);
        _grantRole(PUBLISHER_ROLE, admin);
    }

    function publish(uint256 shotId, address to)
        external
        onlyRole(PUBLISHER_ROLE)
        returns (address sink)
    {
        if (to == address(0)) revert ZeroAddress();
        if (!ledger.canPublish(shotId)) revert CannotPublish();

        sink = Clones.clone(sinkImplementation);
        ShotRoyaltySink(payable(sink)).initialize(address(router), shotId);
        router.registerSink(shotId, sink);
        ledger.markPublished(shotId);

        _safeMint(to, shotId);
        _setTokenURI(shotId, ledger.uriOf(shotId));
        _setTokenRoyalty(shotId, sink, ledger.royaltyBpsOf(shotId));

        emit ShotPublishedNFT(shotId, to, sink);
    }

    /// @notice Primary / merch / toy / card sale. 5% (or override) to credited team, rest to vault.
    function settleSale(uint256 shotId, address token, uint256 salePrice) external nonReentrant {
        uint16 bps = ledger.royaltyBpsOf(shotId);
        uint256 creatorCut = (salePrice * bps) / 10_000;
        uint256 studioCut = salePrice - creatorCut;

        IERC20(token).safeTransferFrom(msg.sender, address(treasury), studioCut);
        treasury.creditBalance(token, studioCut);

        if (creatorCut > 0) {
            IERC20(token).safeTransferFrom(msg.sender, address(router), creatorCut);
            router.creditToken(shotId, token, creatorCut);
        }

        emit SaleSettled(shotId, token, salePrice, creatorCut, studioCut);
    }

    function tokenURI(uint256 tokenId)
        public
        view
        override(ERC721, ERC721URIStorage)
        returns (string memory)
    {
        return super.tokenURI(tokenId);
    }

    function supportsInterface(bytes4 interfaceId)
        public
        view
        override(ERC721, ERC721URIStorage, ERC2981, AccessControl)
        returns (bool)
    {
        return super.supportsInterface(interfaceId);
    }
}
