# Accounts, Storage & Production Credits — Design Spec

**Status:** identity (§ 2) is now built and running on the `accounts-dev` branch — Matrix and Ethereum (SIWE) sign-in, a profile editor, an NFT-avatar picker via Alchemy, and public-profile search (the "KOS Browser" app). Storage (§ 3) and production credits (§ 4, now merged with **PRODEV** — see § 4.2) remain planning-only. This doc is still a decision-gathering doc for the unbuilt parts; once decisions land, split it into focused specs matching the existing house pattern (see § 6).

For the philosophy this must not contradict, see [`ECONOMIC_STANCE.md`](./ECONOMIC_STANCE.md). For the wallet rails this can reuse, see [`K_WALLET_SPEC.md`](./K_WALLET_SPEC.md). For payment routing, see [`COMMERCE_SPEC.md`](./COMMERCE_SPEC.md). For the existing protocol-pluggable identity/social layer, see [`CHAT_SPEC.md`](./CHAT_SPEC.md). For the production-credits tool this now absorbs, see [`../prodev/`](../prodev/).

---

## 0. Where this idea came from

Paraphrased from the original ask: users should be able to make accounts (email, or optionally an Ethereum or Monero wallet if they want to stay local/private), get some amount of storage (free tier = local/cache/USB/own folder; paid "Pro" tier = 2GB via Pinata/IPFS, or a custom portal — iCloud, Drive, whatever the user prefers, long-term), and have a public, customizable profile that works as a portfolio and tracks how much work they put into a production. Every participant in a production gets credited, and the system should be able to **automate splitting profit based on proven effort** — so contributors get fairly compensated. Productions are private by default until the team releases them; after release, metadata can optionally be made public, gated behind a fee the team sets. A public timeline of posts during production is optional, and viewers can comment — including with their own black-and-white (free) or color (Pro) drawings. Pro is proposed at $3/month for 2GB.

That's a coherent product idea. It's also **at least four separable subsystems** with very different risk profiles, several of which run directly into decisions this project has already deliberately left open (see § 5).

---

## 1. This must not contradict the existing stance

[`ECONOMIC_STANCE.md`](./ECONOMIC_STANCE.md) states plainly: **"K-OS never requires a platform account... to use any of its creative tools. You install the OS and you make things. Nobody is between you and the work."**

So the starting constraint for everything below is: **accounts are additive, never a gate.** KoolDraw, Shotlist, and Datamoshpit must keep working exactly as they do today, fully, for a user with zero account. An account unlocks a *portfolio, sync, credit-tracking, and social layer* on top — it is not a login wall in front of the creative tools.

[`COMMERCE_SPEC.md`](./COMMERCE_SPEC.md) § 7 states: **"K-OS never takes custody of user funds"** and **"No 'K-OS account balance.'"** Any residuals/profit-split mechanism (§ 4) has to be designed to route real settlement directly between participants' own configured payment methods — K-OS can compute and attest the *split*, but cannot become the thing holding everyone's money. That has real regulatory weight (money-transmission licensing) that a simple ledger feature would otherwise walk into by accident.

**A third constraint, added explicitly by the project owner:** the accountability mechanism — who did what, credited how — has to keep working **even when the whole project is run fully offline, with no server and no internet connection at all.** A production team working entirely local-first (a real, intended use case for K-OS, not an edge case) still needs to be able to keep each other honest about who contributed what. This rules out any design that assumes a central ledger server is always reachable — see § 4's revised approach below.

---

## 2. Identity — built: Matrix + Ethereum, not email/password

Plans changed from the original "email/password baseline" once actually scoped — see the git history on `accounts-dev` for the real sequence. What's running now:

- **Matrix sign-in** (`src/lib/matrix-auth.ts`, `src/auth.ts`) — signing in with an existing Matrix account (matrix.org or any self-hosted homeserver) verifies the password directly against that homeserver's own login API, then immediately logs the resulting token back out. K-OS never holds a live Matrix credential, only proof of identity at the moment of sign-in. This is *instead of* a bespoke email/password system — no separate password database of our own.
- **Ethereum sign-in** (`src/lib/ethereum-auth.ts`) — Sign-In With Ethereum (EIP-4361), verified via the `siwe` reference package (never hand-rolled signature recovery, per [`K_WALLET_SPEC.md`](./K_WALLET_SPEC.md) § 7's non-negotiable). Works with any EIP-1193 wallet (MetaMask, etc.) via `window.ethereum` directly — no WalletConnect/wagmi dependency yet, kept deliberately minimal for v0.
- **NFT avatars** (`src/lib/alchemy.ts`, `/api/nfts`) — a signed-in Ethereum account can pick one of its owned NFTs as a profile picture, via Alchemy's NFT API (server-side only; the API key never reaches the browser).
- **Public profile search** (`/api/users/search`, `/api/users/[id]`, the "KOS Browser" app) — search and view profiles their owners have explicitly made public.
- All identity providers converge on the same `users`/`accounts`/`profiles` Postgres schema (`db/schema.sql`).
- **Optional multi-method linking** — a signed-in user can attach additional methods (Ethereum SIWE, Matrix verify, email+password) via `/api/account/link` and the Account app's CONNECTED IDENTITIES section. Linking is **never required**; wallet-only / Matrix-only / email-only accounts are valid forever. No forced recovery nudge.
- **Contact visibility** — `profiles.show_email` / `show_ethereum` / `show_matrix` / **`show_ens`** (default off). Public profiles only expose contact fields the owner toggled on. ENS is cached on `profiles.ens_name` after refresh from a linked wallet (spoof-checked).
- **Profile modules** (Elementor-simple) — `profile_blocks` + `/api/profile/blocks`, server-sanitized: text, image, gif, YouTube, allowlisted iframes, **`nft`**, **`nft_gallery`**. NFT modules require Alchemy ownership proof against linked wallets. No user HTML.
- **Monero sign-in** remains genuinely unsolved — no off-the-shelf "Monero SIWE" to reach for, same as originally noted. Still open, still real design work.
- Chat is dual-rail (wallet/ENS encrypted vs Matrix separate) — see [`CHAT_SPEC.md`](./CHAT_SPEC.md). Linking identities to one portfolio does **not** merge chat protocols.

**Account recovery:** optional second method is available; it is not a required nudge (product choice).

---

## 3. Storage tiers — this is the "IPFS publishing" roadmap item, arriving early

[`ROADMAP.md`](../ROADMAP.md) already lists **"IPFS publishing from inside K-OS"** as a planned, unbuilt "Later" item — "with the manifest file stored locally so the user owns the pointer." The Pro storage tier described here is largely that roadmap item, pulled forward and given a concrete first customer (Pinata).

Proposed tiers, as described:

- **Free:** local by default (browser cache), user-selectable local folder or USB via the File System Access API. No account required to use this — it's what K-OS already does today.
- **Pro ($3/mo, 2GB):** Pinata-pinned IPFS storage.
- **Custom (Pro or above):** user's own iCloud, Google Drive, or self-managed IPFS pinning service — "theoretically," explicitly deferred past a minimal v1.

**Open questions for the team:**

1. Build a generic `StorageAdapter` interface now (Pinata as the first adapter, others pluggable later) — matching the pattern K-Wallet and Chat already use for their own adapters — or hardcode Pinata for v1 and generalize later?
2. What happens to a user's pinned content if they cancel Pro? Grace period, immediate unpin, forced migration to local?
3. Who actually pays Pinata's bill as usage scales, and does $3/mo cover it with any margin? This needs real numbers, not a guess, before the price is fixed.
4. Does this route through [`COMMERCE_SPEC.md`](./COMMERCE_SPEC.md)'s Commerce Layer (so payment method choice is uniform across the OS), or is storage billing its own thing? Recommend: the former.

---

## 4. Production credits & residuals — the highest-risk piece, deliberately last

This is the most legally and financially consequential part of the idea, and it's worth being direct about that rather than treating it as a feature ticket.

**"Automate the residuals of profit based on effort proven by credits"** means: real money, split automatically between multiple people, based on a formula the software evaluates. That is revenue-sharing / royalty distribution. Depending on structure and volume, that can brush up against money-transmission regulation — which is exactly the territory [`COMMERCE_SPEC.md`](./COMMERCE_SPEC.md) § 8 (Compliance posture) and § 9 open question 3 (registered MSB/PayFac status) already flags as unresolved, and exactly why § 7 insists K-OS never take custody of funds.

The clean way to build this **without** K-OS becoming a money transmitter: K-OS computes and attests *who gets what share*, but the actual settlement happens directly between participants through rails they've each configured themselves (Stripe Connect direct transfers, or direct wallet-to-wallet payment) — the same "K-OS is never the intermediary" posture the Commerce Layer already commits to.

### 4.1 Offline-first accountability — the record has to survive with zero server

The project owner added an explicit constraint (§ 1): a production team running K-OS **fully offline, with no server and no internet connection**, still needs to be able to keep each other honest about who contributed what. This splits the problem cleanly in two, and it's worth keeping them separate:

- **The accountability record** (who did what, when, attested by whom) — this can and should work fully offline.
- **The actual money moving** (§ 4's settlement) — this inherently needs connectivity *at the moment a payout happens*, same as any bank transfer or on-chain transaction does. Nothing can pay out while genuinely offline; the point is that the *record* doesn't wait for connectivity to be trustworthy.

A design direction that reuses infrastructure this project has already committed to, rather than inventing a new one: **local, cryptographically signed attestations**, using K-Wallet's Signer Layer, which already commits to a `signMessage` capability (§ 2.3 of [`K_WALLET_SPEC.md`](./K_WALLET_SPEC.md)). Each participant signs their own claimed contributions (or countersigns a collaborator's claim about them) with a key they hold locally — hardware or software signer, same as everything else in K-Wallet. Signed attestations are an append-only local log, exchangeable directly between participants' machines — over local network, sneakernet/USB, or whatever's available — with no server in the loop at all. When participants do reconnect (to each other or to the wider internet), logs merge; because every entry is independently signed, tampering or after-the-fact rewriting is detectable without needing a trusted third party to have been watching the whole time. This is the same trust model git commits already give contributors, just applied to production-credit claims instead of code changes — and it's a genuinely local-first, sovereign-user design, consistent with the rest of this project rather than a bolted-on exception to it.

This is a real design direction, not a decided one — the merge/conflict-resolution semantics (what happens when two offline logs disagree about the same claim) need real design work, likely informed by CRDT or git-like merge patterns.

This also overlaps with two things already sketched elsewhere:

- [`COMMERCE_SPEC.md`](./COMMERCE_SPEC.md) § 6's **Commissioned Tool** candidates — specifically #1 (a reputation / web-of-trust system for peer-to-peer commerce) and #3 (a creator-economy tool for artists to sell work made inside K-OS with no marketplace cut). This production-credits idea may *be* that Commissioned Tool, or a close sibling of it, rather than a fourth parallel system.
- [`CONTRIBUTORS.md`](../CONTRIBUTORS.md) and [`SPONSOR_POLICY.md`](./SPONSOR_POLICY.md)'s existing pattern of a contributor ledger used as "the basis for retroactive payment when funding allows" — a precedent for "track effort, pay later" already exists for K-OS's *own* contributors. Worth asking whether the same pattern generalizes to a *production's* participants, or whether it needs its own model entirely.

### 4.2 PRODEV — this section's concrete implementation, already named and skeletoned

Turns out this subsystem already has a name and a start: **[`prodev/`](../prodev/)**, "Production Development Workstation" — a modular nested checklist/shot tracker feeding a credits ledger. Right now it's genuinely just stubs (`prodev/src/blockchain/ledger.ts`'s `recordContribution`/`distributeProfits` are a `console.log` and an empty function; `prodev/src/ui/ChecklistComponent.tsx` is a "Coming Soon" placeholder) — nothing implemented, which is good timing, since it means it can be built correctly against real identity instead of retrofitted.

**Data model, and where identity now plugs in** (`prodev/src/core/types.ts`):

```ts
interface ChecklistItem { id, title, status, owner: string, hours, contributionPercent, assets: string[], children? }
interface Shot { id, title, checklist, layers, credits: Record<string, number> } // team member -> %
interface Project { id, name, modules, blockchainRef: string }
```

`owner: string` and the keys of `credits: Record<string, number>` are currently free-form strings with nothing backing them. Now that § 2's identity system exists, these should key off real `users.id` (or the `accounts` table's `providerAccountId` when a specific payout rail matters — e.g. an Ethereum address to pay directly). That's the concrete integration point: **a checklist item's `owner` becomes a K-OS user, not a name someone typed.**

**"Private blockchain" vs. the § 4.1 signed-attestation-log design — these are the same idea, reconcile them:** PRODEV's own `ledger.ts` TODO already considers *"Hyperledger / custom / SQLite + signatures for MVP"* — the "SQLite + signatures" option **is** § 4.1's proposal (local signed attestations via K-Wallet's Signer Layer), just arrived at independently. Recommend resolving this explicitly rather than building both: start with the lightweight signed-log approach for MVP (works fully offline per § 1's constraint, no network/consensus infrastructure to run), and treat a heavier real distributed ledger (Hyperledger or similar) as a possible *later* upgrade only if the trust model genuinely needs multi-party consensus beyond what independently-signed, merge-checked local logs already provide. Standing up a blockchain network is a real operational burden that cuts against "a small production team can run this fully offline" — worth not paying that cost until something concrete demands it.

**`distributeProfits(revenue)` and the wallet infrastructure that now exists:** this stub is exactly § 4's "K-OS computes the split, real settlement happens directly between participants' own payment methods" — and now that Ethereum sign-in exists (§ 2), a contributor who's linked a wallet already has a real payout address sitting in the `accounts` table (`provider = 'ethereum'`), reachable with the same query `/api/nfts` already uses to find a user's linked address. Stripe Connect would cover contributors who haven't linked a wallet, per § 4's original design. Nothing here is built — this is the concrete shape the eventual implementation would take.

**Open questions for the team (these need real discussion, not just an engineering call):**

1. What counts as "effort" — logged actions in the app, time tracked, or a lead's manual approval of a split? `contributionPercent`/`hours` already exist as fields in `ChecklistItem` — are those the actual inputs, or placeholders?
2. Is the split formula fixed by K-OS, or fully configurable per production (i.e., is K-OS just the calculator/attestation layer, and the humans agree the actual percentages)?
3. Dispute resolution — what happens when a participant disagrees with their credited share?
4. Tax reporting obligations for contributors being paid out — does this need 1099-equivalent handling, and in which jurisdictions?
5. Given the regulatory weight here, does this need a lawyer's review before any code is written, not after?
6. What's the merge/conflict-resolution rule when two participants' offline attestation logs disagree about the same claim once they reconnect? (§ 4.1)
7. Confirm: SQLite-plus-signatures MVP now, real distributed ledger only if later demanded — or is a genuine blockchain a hard requirement from the start? (§ 4.2)
8. `Project.blockchainRef: string` already exists as a field — what does it point to once § 4.1's design is chosen? A local log's root hash? Something else?

**Recommendation: build this next after § 2 (done) stabilizes**, using real usage of the identity/profile system to inform the "effort" model, rather than designing it in the abstract.

---

## 5. Direct tension to resolve: does K-OS charge its own fee?

[`COMMERCE_SPEC.md`](./COMMERCE_SPEC.md) § 9 open question 1, verbatim: **"Does K-OS ever charge a fee of its own? ... Or strictly no — K-OS is and always will be a zero-fee Commerce Layer?"** — this has been an open, unanswered question in this repo already.

The $3/mo Pro tier is a K-OS-charged fee (for storage, specifically — not a marketplace cut on peer-to-peer commerce, which is a meaningfully different thing per [`ECONOMIC_STANCE.md`](./ECONOMIC_STANCE.md)'s "businesses providing clear services at fair prices are welcome" carve-out). Worth the team explicitly deciding: is a flat, transparent, service-for-a-fee subscription (storage) philosophically fine under the existing stance, while a percentage-based cut on production revenue-sharing (§ 4) would not be? That distinction is probably right, but it should be a stated decision, not an implicit one.

---

## 6. Recommended sequencing

What actually happened, plus what's next:

1. ✅ **Identity** — Matrix + Ethereum sign-in, profile editor, NFT avatars, public profile search. Built on `accounts-dev`, not yet merged to `master`. Monero sign-in still unsolved (§ 2).
2. **Production credits & residuals, via PRODEV** — now the recommended next phase (moved up from last), since real identity exists to build it against and PRODEV's own skeleton is already waiting (§ 4.2). Start with the checklist/shot tracker UI wired to real users, then the signed-attestation-log MVP (§ 4.1/4.2), before touching any actual payout logic.
3. **Pro storage + billing** — Pinata-backed storage tier, billed through the Commerce Layer (Stripe path first).
4. **Social layer** — public profile timelines, comments (drawing replies) — likely as an extension of Chat's existing Account/Identity layer and Farcaster adapter rather than a bespoke system. The KOS Browser app (§ 2) already covers profile search/view; timelines and comments are the remaining piece.
5. **Actual profit distribution** — deliberately last of all, gated on real legal/team input per § 4, only once § 2's credit-tracking has real production data to design the payout rules against.

Once the team has made calls on the open questions above, split this doc into focused specs following the existing pattern (`ACCOUNTS_SPEC.md` → possibly `STORAGE_SPEC.md`, `PRODUCTION_CREDITS_SPEC.md` merged into `prodev/`'s own docs, each with their own "Open questions (need Koolskull's input)" section, matching `K_WALLET_SPEC.md` and `COMMERCE_SPEC.md`).

---

## 7. Open questions, collected

1. Account recovery for a wallet-only or Matrix-only user with no second identity method linked? (§ 2)
2. Generic `StorageAdapter` interface now, or hardcode Pinata for v1? (§ 3)
3. Pinned-content policy on Pro cancellation? (§ 3)
4. Does $3/mo actually cover Pinata costs at real scale? (§ 3)
5. What counts as "effort" for the credits ledger — are `ChecklistItem.hours`/`contributionPercent` the real inputs? (§ 4, § 4.2)
6. Is the profit-split formula fixed or per-production configurable? (§ 4)
7. Dispute resolution process for contested credit splits? (§ 4)
8. Tax reporting obligations for paid-out contributors? (§ 4)
9. Does the residuals system need legal review before implementation starts? (§ 4)
10. Is a flat storage subscription fee philosophically distinct from a revenue-share cut, under the existing zero-fee-Commerce-Layer question? (§ 5)
11. Does the social/profile/timeline layer reuse Chat's Account & Identity Layer and Farcaster adapter, or is it a separate system? (§ 6)
12. What's the merge/conflict-resolution rule when two offline attestation logs disagree about the same claim? (§ 4.1)
13. SQLite-plus-signatures MVP now, real distributed ledger only if later demanded — or is a genuine blockchain a hard requirement from the start? (§ 4.2)
14. What does `Project.blockchainRef: string` point to once the § 4.1 design is chosen? (§ 4.2)
