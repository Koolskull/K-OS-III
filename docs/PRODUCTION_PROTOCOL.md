# 2Kool Productions — Production Protocol

**Status:** v0 contracts in [`contracts/`](../contracts/). Audited by tests, not by a security firm. Do not send production-scale funds until a human audit and counsel review.

This is the on-chain constitution for 2Kool Productions: who did the work, who gets paid, and what happens when the catalogue is worth more than anyone's annual salary.

It is inspired by (and deliberately unlike):

- **Stan Lee / Marvel** — artists signed work-for-hire in desperation; decades of credit and royalty fights followed. Credits here are proposed, **accepted by the named wallets**, then frozen. A correction is a new version with a parent pointer, like git. Nobody gets to silently rewrite who made a shot.
- **Anime/manga pipeline** — alleged underpayment and vanished credits. Every published shot carries auditable metadata: who, role, weight, work units, content hash, branch, parent version.
- **Todd McFarlane / Image** — talent hits, cash hits, people vanish. Surplus is **not** dumped into member wallets. It stays in the vault to fund salaries.
- **BAYC** — hundreds of millions raised, no comparable feature delivered. Fundraising NFTs (including Juicebox project 402 and prior drops) are registered as **company profit instruments**. Proceeds enter the vault. They do not become a private treasury.
- **Gorillaz** — a world-class IP that never quite committed to a film/series at studio intensity. The protocol does not make you finish a movie. It makes it structurally harder to loot the war chest instead of staffing the work.
- **Autodesk Flow Production Tracking** — the closest professional analogue for *who did what on which shot*. Flow is a SaaS database. This protocol is a public, future-proof credit + money layer that a Flow-like app (or K-OS itself) can write to.

---

## What the protocol promises

1. **Salary ceiling.** 2Kool takes out at most **$100,000 USDT/USDC/USAT per member per rolling 365-day window**. Individual contracts can be lower. They cannot be higher on-chain.
2. **Vault, not pockets.** NFT sales, painting sales, music sales, broadcast sales, and registered fundraising instruments deposit into `StudioTreasury`. There is no `withdrawToFounder`.
3. **Hire budget.** A configurable slice of each deposit (default **10%**) is earmarked for new hires. It cannot be paid to already-active members (that would bypass the cap).
4. **Studio units.** `grantShares` records a member's claim on *continued payroll from locked surplus*, not a cash-out. Pair this with real cap-table documents.
5. **Five percent, shared.** Default **5% of each sale** of a shot NFT, card, toy, or other use of that credited design goes to the **team named on that shot**, split by weight. Not 5% each. Override is allowed per shot, capped at **10%** so customer premium stays sane.
6. **Credits are git.** Frozen shots are immutable. Alternate takes are branches. Updates are children.

---

## Architecture

```
  paintings / music / broadcast / Juicebox 402 / legacy NFTs
                         │
                         ▼
              InstrumentRegistry.routeProceeds
                         │
                         ▼
                   StudioTreasury
                   ┌─────────────┐
                   │ hire budget │──► new hires only
                   │ locked      │──► paySalary (≤ cap)
                   │ surplus     │    (no other exit)
                   └─────────────┘

  K-OS / Flow-like tracker / minting app
                         │
                         ▼
                    CreditLedger  ──publish──►  ShotNFT (cel)
                         │                         │
                         │                    ERC-2981 5%
                         ▼                         │
                   credited wallets ◄──── RoyaltyRouter / per-shot sink
```

---

## Money rules (the vault)

`StudioTreasury` accepts only registered stablecoins (USDC, USDT, and later USAT via `setStablecoin`). ETH can be sent in; it **cannot** be paid as salary. Council sweeps ETH to `conversionSafe`, swaps to a stablecoin, and deposits it back. That Safe should be the same council that cannot pay itself a bonus through payroll.

**Exits that exist**

- `paySalary(member, token, amount)` — active members only, against their contracted salary, never above the $100k cap, across all stablecoins in the window (60k USDC + 40k USDT = cap hit).
- `spendHireBudget` — not to active members.
- `allocateHireBudget` — move surplus → hire bucket (still inside the vault).
- `rescueToken` — only **unregistered** tokens (accidental airdrops). USDC/USDT/USAT cannot be rescued.

**Exits that do not exist**

- Cashing studio units.
- Founder draw.
- "We hit it big, send it to the Bahamas."

If the catalogue explodes, the surplus sits there as **runway**: salaries, new hires, production. That is the anti-BAYC / anti-Image rule.

### What "$100k" means

Amounts are tracked in **6-decimal USD**. USDC/USDT are 1:1 by assumption. An 18-decimal stablecoin is converted down. There is no oracle; do not add an unpegged token as a "stablecoin."

The window is **rolling 365 days** from the first payment in the window, not a calendar year. Simpler, harder to game around January 1.

---

## Credit rules (the ledger)

A **production** is a film, series, game, album, or broadcast.

A **shot** is a commit:

| Field | Meaning |
|---|---|
| `parentShotId` | Previous version (`0` = original). Corrections never edit the parent. |
| `branch` | e.g. `main`, `alt-take`, `credits-fix` |
| `contentHash` | Hash of the media (or of the IPFS CID) |
| `uri` | `ipfs://…` metadata (crew, software used, Frame.io/Flow id, etc.) |
| `workUnits` | Hours × 100, or any studio unit you standardize |
| `credits[]` | `account`, `role`, `weight` |

Flow:

1. Showrunner (or `CREDIT_ROLE` software) `commitShot`
2. Each named wallet `acceptCredit` — this is the Stan Lee fix: you do not get a credit without the person's signature
3. `freezeShot` when all have accepted, or `forceFreeze` if a wallet is dead/unresponsive (the missing accepts remain visible)
4. `publish` mints the Shot NFT and deploys a royalty sink

K-OS should eventually write these commits as frames are locked in Datamoshpit / KoolDraw. Until then, a CSV/JSON importer or a Flow export is enough.

**Granularity.** A feature at 24fps × 90 minutes is ~130k frames. That is a poor fit for Ethereum L1. Default grain is **shot** (edited unit). Frame-level tokens are for L2, or for cells you actually intend to sell.

---

## Royalty rules (the 5%)

Default **500 bps (5%)** of sale price, **shared by weight** among credits on that shot.

Examples:

- Animator weight 1, composer weight 1, sale $1000 → $50 pool → $25 each.
- A card/toy/script using that shot/design is the same sale path: `ShotNFT.settleSale(shotId, token, price)`.
- Override: `setRoyaltyOverride(shotId, bps)` before publish. Max **1000 bps**. Use this when a contract honestly needs a different split — not as a way to zero artists out as policy. Zero is technically allowed as an override; if you want sincerity, don't.

**Enforcement**

- Studio-run sales (your minting app, merch desk, K-OS commerce): always `settleSale`. 95% (or 100%−override) to the vault, 5% to the router.
- Third-party marketplaces: ERC-2981 points at a **per-shot clone**. Markets that honor 2981 send ETH/tokens to the right crew. Markets that ignore 2981 are a known industry failure; do not rely on them for the promise.

Alumni can still withdraw royalties. Salary is for `Active` members; credits are forever.

---

## Legacy fundraising (Juicebox 402 and existing NFTs)

[Juicebox V2 project 402](https://old.juicebox.money/v2/p/402) is registered as a profit instrument. The old UI is deprecated. **This protocol does not take over that contract.** To migrate:

1. Withdraw remaining project funds from the Juicebox terminal (project owner NFT = JBProjects token 402).
2. Convert to USDC/USDT/USAT.
3. `StudioTreasury.deposit`.
4. Keep the Juicebox row in `InstrumentRegistry` so the raise stays part of the company books.

Existing NFT drops belong in [`contracts/instruments.json`](../contracts/instruments.json). Paste collection addresses from the minting app, then `registry.register` + `routeProceeds` on sales. See [`NFT_MINTING.md`](./NFT_MINTING.md).

---

## Admin

Deploy with `StudioKit`. Immediately:

- `ADMIN` = a 2-of-3 or 3-of-5 **Safe**, not a hot wallet
- `CONVERSION_SAFE` = the same or a narrower Safe that only does ETH→stablecoin
- Grant `CREDIT_ROLE` to the production software (or a bot key that can only commit, not freeze-force)
- Pause keys live in a different pocket than payroll keys if you can

If admin is one EOA, the vault is a suggestion, not a constitution.

---

## Legal pairing (required, off-chain)

Have counsel draft, at minimum:

1. Employment / contractor agreements that **mirror** the $100k cap and vault rules.
2. IP assignment + license-back so 2Kool can exploit the work while credits and the 5% survive.
3. A statement that on-chain studio units are **not** offered as securities unless you intend to go through that process.
4. A merch/NFT rider that buyer-facing 5% is the default, with the override clause.
5. How alumni royalties are taxed.

The chain will not save you in court by itself. It will make lying about credits and silently draining the treasury much harder.

---

## Security

- Tests: `cd contracts && forge test` (16 passing as of this version).
- No formal audit yet. Treat as experimental until one exists.
- OpenZeppelin v5.7 (AccessControl, ERC-721, ERC-2981, Clones, SafeERC20).
- USDT's missing return value is handled via SafeERC20.

---

## What K-OS apps write

Three desks share one local production board (`k-os-production-board` in the browser):

| App | Job |
|---|---|
| **SHOTLIST** | Sequence, plates, X-sheets. Expand a shot to edit credits and commit. |
| **PRODEV** | Spreadsheet of the same shots: status, hours, crew rollup, tasks, vault numbers. |
| **STUDIO** | Chain desk (kit, mint, `settleSale`, instruments) plus a BOARD tab of the same shots. |

A title or credit change in any of them shows up in the others. `commitShot` still needs an injected wallet and a loaded StudioKit.

---

## What K-OS should grow next

- Datamoshpit "lock shot" → `commitShot`.
- Commerce Layer `settleSale` for merch.
- This is the commissioned creator-economy tool sketched in [`COMMERCE_SPEC.md`](./COMMERCE_SPEC.md) § 6.3, aimed at a production company rather than a generic marketplace.
