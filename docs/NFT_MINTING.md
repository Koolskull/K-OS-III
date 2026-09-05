# NFT minting — 2Kool Productions

How shot NFTs are minted, how royalties attach, and how **already-released** tokens (Juicebox, prior drops, paintings, music) are treated as fundraising instruments for the company vault.

On-chain spec: [`PRODUCTION_PROTOCOL.md`](./PRODUCTION_PROTOCOL.md)  
Addresses after deploy: fill [`contracts/instruments.json`](../contracts/instruments.json)

---

## Why a shot is an NFT

An animation cel is a physical leftover of production that later became an aftermarket object. A **Shot NFT** is the same idea with better provenance:

- Practical: every published shot has a stable id, a content hash, a metadata URI, and a version parent.
- Legal: the token points at a frozen credit list the named artists signed on-chain.
- Aftermarket: if someone wants to buy "that shot" like a cel, they can. The credited team shares **5% of that sale** (not 5% each).

You do **not** need to mint every frame of a feature on L1. Default grain is **shot**. Frame-level minting is for L2 or for cells you intend to sell.

---

## Minting a shot (new protocol)

In K-OS: desktop icon **STUDIO** → CREDITS (commit + accept + freeze) → MINT (publish) → SALE (`settleSale`).

Requires `PUBLISHER_ROLE` on `ShotNFT` and a frozen shot on `CreditLedger`.

```
1. openProduction(slug, title, uri, royaltyBps=500, showrunner)
2. commitShot(productionId, parentId, branch, contentHash, uri, workUnits, credits[])
3. each credited wallet → acceptCredit(shotId)
4. freezeShot(shotId)          // or forceFreeze if a wallet cannot sign
5. ShotNFT.publish(shotId, to) // `to` is usually the StudioTreasury
```

`publish`:

- Mints ERC-721 token id = `shotId`
- Sets `tokenURI` from the ledger
- Deploys an EIP-1167 `ShotRoyaltySink` clone
- Sets ERC-2981 royalty to that sink at the shot's bps (default 5%, max 10%)

### Metadata (`uri`)

Put at least this on IPFS (JSON):

```json
{
  "name": "Production Title — SEQ010_SH020_v003",
  "description": "Locked shot. Credits are on-chain in CreditLedger.",
  "image": "ipfs://…",
  "animation_url": "ipfs://…",
  "external_url": "https://2kool.tv/…",
  "attributes": [
    { "trait_type": "production", "value": "demo-film" },
    { "trait_type": "branch", "value": "main" },
    { "trait_type": "work_units", "value": 40 }
  ],
  "production": {
    "software": ["K-OS III", "Datamoshpit", "KoolDraw"],
    "flow_id": "optional-autodesk-flow-or-shotgrid-id",
    "parent_shot_id": 0,
    "content_hash": "0x…"
  }
}
```

The chain is the credit authority. IPFS is the picture and the production notes.

### Selling

**Studio / minting app / merch / cards / toys** — always:

```
ShotNFT.settleSale(shotId, usdc, salePrice)
```

Buyer pays `salePrice`. Default split: **5%** to `RoyaltyRouter` (credited team, by weight), **95%** to `StudioTreasury` (then 10% of *that* to the hire budget, rest locked surplus).

**Secondary marketplaces** — ERC-2981. Honor is voluntary outside your own desk.

### Existing minting app

If you already ship an NFT minting app, do **not** point it at a new ERC-721 that skips the ledger. Either:

- Call `CreditLedger` + `ShotNFT.publish` as the mint backend, or
- Keep the old collection, register it (below), and route proceeds into the vault until you cut over.

---

## Legacy instruments (already released NFTs)

The protocol cannot rewrite an old collection. It **books** them.

1. Put every existing collection in `contracts/instruments.json` (collection address, chain, label, whether proceeds are company profit).
2. After deploy, `InstrumentRegistry.register(...)`.
3. When a sale happens, the seller or a listing bot calls `routeProceeds(instrumentId, token, amount)`, which pulls stablecoins into the vault.

### Juicebox V2 project 402

| | |
|---|---|
| UI (deprecated) | https://old.juicebox.money/v2/p/402 |
| Chain | Ethereum mainnet |
| Project id | 402 |
| JBProjects | `0xD8e9d4cf0C2d464BC0759d1C1B8a99D7A4159b0F` |

Register as `Kind.JuiceboxV2`. Withdraw leftover ETH from the Juicebox terminal, convert, `StudioTreasury.deposit`. Historical payers are not automatically reminted; they remain Juicebox-side. The new Shot NFT collection is a new series. If you want Juicebox NFT holders to count as a specific class of studio unit, that is a **separate** `grantShares` decision with counsel — do not silently dilute.

### Paintings, music, broadcast

Same registry, different `Kind` (`Painting`, `Music`, `Broadcast`). Off-chain invoicing still has to call `routeProceeds` or `deposit`. The chain only knows what you send it.

---

## Customer premium

The 5% is meant to be invisible-enough at checkout and meaningful over a 30-year catalogue. Do not stack 5% per crew member. Do not stack a second marketplace fee on top as "2Kool tax" without disclosing it (see [`COMMERCE_SPEC.md`](./COMMERCE_SPEC.md) — never hide fees). Override exists for honest exceptions, not as the default.

---

## Checklist before a public mint

- [ ] Safe is `DEFAULT_ADMIN` on every contract
- [ ] USDC/USDT allowlisted; USAT added only when the token is real
- [ ] Juicebox 402 registered; leftover funds migrated
- [ ] Every prior collection address pasted into `instruments.json` and registered
- [ ] First production opened; a dry-run shot accepted, frozen, published on a testnet
- [ ] `settleSale` wired in the minting app (not only "list on OpenSea")
- [ ] Counsel has matched the 5% and the $100k cap in the paper contracts
