# Seed Issues

This file aggregates the issues planned by the project across the design docs in this PR. Claude Code can't open GitHub issues directly — Koolskull or a maintainer should paste these into the issue tracker.

Each item includes a suggested **title**, the **labels** to apply, and a short **description**. Where an issue depends on or references a design doc, the doc is linked.

When opening these, follow the format in [`.github/ISSUE_TEMPLATE/`](../.github/ISSUE_TEMPLATE/).

---

## Part 1 — On-ramp / first ten issues

### 1. Add keyboard shortcut hints overlay (press `?`)
**Labels:** `good-first-issue`, `os-shell`, `ux`
**Size:** small
A discoverable overlay that pops on `?` (or `Shift+?`) showing the most relevant keyboard shortcuts for the current screen. Pixel-correct, no rounded corners. Appears as a centered window; dismissed with `?` again or `Escape`.

### 2. Screenshot pass: capture the 4 hero GIFs/PNGs for README
**Labels:** `good-first-issue`, `docs`, `screenshots`
**Size:** small
Capture the four screenshots referenced from the top of `README.md`: boot sequence, Datamoshpit phrase editor, sprite editor, desktop with multiple windows. Save into [`public/screenshots/`](../public/screenshots/) per the README in that folder. Animated GIFs welcome.

### 3. Datamoshpit: per-channel meters in the taskbar
**Labels:** `datamoshpit`, `help-wanted`
**Size:** medium
Tiny per-channel level meters visible in the taskbar when Datamoshpit is the active window. 8 columns of pixel-bar level indicators. Updates from the AudioEngine's per-channel mixer.

### 4. Sprite editor: onion-skin toggle
**Labels:** `good-first-issue`, `os-shell`, `kooldraw`
**Size:** small-medium
Add a toggle to overlay the previous and next animation frames at reduced opacity behind the current frame for animation work. Reference: Piskel's onion skin implementation.

### 5. Boot sequence: skip key (hold Esc)
**Labels:** `good-first-issue`, `os-shell`
**Size:** tiny
Allow holding `Escape` to skip the Rosary/Psalms boot scroll once a user knows it. The boot sequence is part of the project's identity, but skippable on demand respects users who reboot frequently during development.

### 6. Demo deploy and `[DEMO_URL]` replacement
**Labels:** `chore`, `infra`
**Size:** small
Pick a host (Vercel is the obvious match for Next.js), wire up auto-deploy from `master`, and replace the `[DEMO_URL]` placeholder in `README.md`. Note any `--legacy-peer-deps` issues encountered.

### 7. In-OS About panel
**Labels:** `good-first-issue`, `os-shell`
**Size:** small
A small About panel reachable from the start menu showing version, contributor count, current build commit, and links into VISION/CONTRIBUTING/LICENSE. Pixel-correct window styling.

### 8. Datamoshpit: live VU meter on the project screen
**Labels:** `good-first-issue`, `datamoshpit`
**Size:** small
A pair of pixel-bar VU meters for L/R master output on the project screen. Smaller scope than the per-channel meters issue (#3) and a good warm-up for it.

### 9. Sprite editor: export-as-PNG-sequence button
**Labels:** `good-first-issue`, `kooldraw`
**Size:** small
A single-action export of all animation frames as numbered PNGs, ready to drop into Datamoshpit's planned Image Sequence VM (see [`DATAMOSHPIT_VIDEO_SPEC.md`](./DATAMOSHPIT_VIDEO_SPEC.md)).

### 10. Wallpaper picker on the desktop right-click menu
**Labels:** `good-first-issue`, `os-shell`, `ux`
**Size:** small
Right-click the desktop → choose from a small set of bundled wallpapers (pixel-correct, no gradients). Selection persists in IndexedDB.

---

## Part 1.5 — Epistemic stance / Reader Notes

### 11. Reader Note: high-frame-rate perception and screen health
**Labels:** `docs`, `epistemic-stance`, `reader-notes`, `help-wanted`
Write a Reader Note covering Showscan / Trumbull, the reception of Peter Jackson's 48fps films, contemporary HFR research, and the popular claim that screen refresh rates cause broad psychological harm. Present each account with sources. Follow the rules in [`EPISTEMIC_STANCE.md`](./EPISTEMIC_STANCE.md) and the format in [`READER_NOTES/README.md`](./READER_NOTES/README.md).

### 12. Reader Note: history of wireless power and "free energy" claims
**Labels:** `docs`, `epistemic-stance`, `reader-notes`, `help-wanted`
Tesla's documented work, the historical record of Wardenclyffe, modern academic assessment, and the popular-independent-research account. Present each with sources. Same rules as #11.

---

## Part 1.6 — Knowledge corpus / Education

### 13. Reference entry: propose 3 historical figures central to computing/cryptography
**Labels:** `docs`, `reference`, `editorial`
Open an issue proposing 3 specific historical figures who would be valuable Reference entries beyond the existing Lovelace and Shannon placeholders. Include why each merits an entry and rough source list. Editor approval required before drafting.

### 14. Education: flesh out `ethereum-dev/02-accounts-and-contracts.md`
**Labels:** `docs`, `education`, `ethereum-dev`, `help-wanted`
Write the second lesson of the flagship Ethereum developer track. Topic outlined in [`public/education/ethereum-dev/track.yaml`](../public/education/ethereum-dev/track.yaml). Aim for ~1,200 words with runnable code examples where relevant.

### 15. Education: flesh out `cryptography-basics/02-hashing.md`
**Labels:** `docs`, `education`, `cryptography-basics`, `help-wanted`
Second lesson of the cryptography track — hashing concepts, properties, where hashes show up in the wallet/chain layers. Concept-first; math only when it earns its place.

### 16. Design: in-OS reader app for `public/reference/` entries
**Labels:** `os-shell`, `design`, `help-wanted`
Design (not yet build) the in-OS app that renders the Reference entries with search, filtering, cross-linking, and bookmarking. Pixel-correct window styling. See [`KNOWLEDGE_CORPUS.md`](./KNOWLEDGE_CORPUS.md).

### 17. Design: in-OS course runner for `public/education/` tracks
**Labels:** `os-shell`, `design`, `help-wanted`
Design the in-OS course runner that reads `track.yaml`, renders lessons in order, tracks progress locally, and provides sandboxed code-execution for tracks that include code (Ethereum, Solidity).

---

## Part 1.7 — K-Wallet

> All K-Wallet PRs require a **second reviewer** per [`CONTRIBUTING.md`](../CONTRIBUTING.md#sensitive-areas).

### 18. K-Wallet v0: scaffold the three-layer architecture (empty interfaces, no crypto)
**Labels:** `wallet`, `design`, `sensitive`
Create `src/wallet/` with the Key Layer / Chain Layer / Signer Layer interface definitions from [`K_WALLET_SPEC.md`](./K_WALLET_SPEC.md). No crypto code — interfaces only, with `TODO(security-review)` markers where implementations would go.

### 19. K-Wallet v0: EVM adapter via `viem` — read-only first
**Labels:** `wallet`, `evm`, `sensitive`, `help-wanted`
Wrap `viem` in the `ChainAdapter` interface for EVM chains. Read-only operations first (`getBalance`, `getHistory`, ENS resolution). No signing yet. Add `viem` to [`WALLET_DEPENDENCIES.md`](./WALLET_DEPENDENCIES.md) with a named reviewer.

### 20. K-Wallet v0: Ledger signer integration for EVM
**Labels:** `wallet`, `signer`, `sensitive`, `help-wanted`
Implement the `LedgerSigner` for EVM via `@ledgerhq/hw-app-eth` over WebUSB. Sign-only — does not handle key generation or storage.

### 21. K-Wallet v0: Keystone-style QR signer spec for EVM
**Labels:** `wallet`, `signer`, `design`, `sensitive`
Specify the QR-encoded transaction protocol used by the `KeystoneSigner` (and the future `KOSAirgappedSigner`) for air-gapped EVM signing. Write as a follow-on doc to `K_WALLET_SPEC.md`.

### 22. K-Wallet: threat-model writeup for the software-wallet mode
**Labels:** `wallet`, `docs`, `sensitive`
Honest threat-model document covering what the `LocalSoftwareSigner` does and doesn't protect against — what an attacker with file-system access can do, what an attacker with browser-page access can do, what malicious browser extensions can do. Link from `K_WALLET_SPEC.md` § 2.1. Hardware mode is the recommended default — this doc should make that recommendation defensible.

---

## Part 1.8 — Economic stance

### 23. Reader Note: the disintermediation debate
**Labels:** `docs`, `epistemic-stance`, `reader-notes`, `economic-stance`, `help-wanted`
Present the case for and against platform-mediated vs. peer-to-peer commerce with sources from both sides. The economic stance document ([`ECONOMIC_STANCE.md`](./ECONOMIC_STANCE.md)) takes a position; this Reader Note maps the broader debate fairly per [`EPISTEMIC_STANCE.md`](./EPISTEMIC_STANCE.md).

---

## Part 1.9 — Commerce Layer

### 24. Commerce Layer: scaffold the `Commerce` interface and a no-op adapter
**Labels:** `commerce`, `design`, `help-wanted`
Create `src/commerce/` with the `Commerce` interface and `RailAdapter` interface from [`COMMERCE_SPEC.md`](./COMMERCE_SPEC.md). Implement a no-op direct/offline adapter for testing the abstraction without external dependencies.

### 25. Commerce Layer: Stripe adapter skeleton (no keys; dev-mode only)
**Labels:** `commerce`, `stripe`, `sensitive`, `help-wanted`
Wire up the Stripe SDK behind a `RailAdapter` implementation. **Dev-mode only** — no live API keys, no production credentials. Demonstrates the adapter pattern; production integration is a separate PR with a named reviewer.

### 26. Commerce Layer: design the fee-display component (honest fee breakdown)
**Labels:** `commerce`, `ux`, `design`
Design and implement `<FeeDisplay>` per the "never hide fees" non-negotiable in `COMMERCE_SPEC.md` § 4. Per-party breakdown, no aggregated "service fee" lines. Pixel-correct styling.

### 27. Education: legal/compliance track outline
**Labels:** `docs`, `education`, `compliance`
Outline a new education track on the legal/compliance side of running commerce: KYC where applicable, tax reporting, sanctions screening, consumer protection. Outline only — full lessons later. Add `legal-compliance/` to [`EDUCATION.md`](../EDUCATION.md) when scaffolded.

---

## Part 1.10 — Funding

### 28. Funding: draft 1-page project summary extracted from VISION.md
**Labels:** `funding`, `docs`
A focused 1-pager suitable for grant applications and investor conversations. Extract from [`VISION.md`](../VISION.md). Live at `docs/PROJECT_SUMMARY.md`.

### 29. Funding: apply to Ethereum Foundation ESP when demo video is ready
**Labels:** `funding`, `ethereum`
Apply to the [Ethereum Foundation Ecosystem Support Program](https://esp.ethereum.foundation/). Top-fit for K-OS's education + dev-tooling work. Gated on the demo video (#31).

### 30. Funding: set up Open Collective and publish sponsor policy
**Labels:** `funding`, `infra`
Set up Open Collective for the project, or alternatively pursue Software Freedom Conservancy fiscal sponsorship. Publish [`SPONSOR_POLICY.md`](./SPONSOR_POLICY.md) as a public-facing page before accepting any money.

### 31. Funding: record 90-second demo video
**Labels:** `funding`, `media`, `screenshots`
The single highest-leverage item for grant applications and investor conversations. Boot, desktop, Datamoshpit live demo, sprite editor cameo. Record at native resolution, no upscaling. Gated on screenshot pass (#2).

---

## Part 1.11 — Chat

### 32. Chat: scaffold the `ChatAdapter` interface and mock adapter
**Labels:** `chat`, `design`, `help-wanted`
Create `src/chat/` with the `ChatAdapter` interface from [`CHAT_SPEC.md`](./CHAT_SPEC.md). Implement a mock adapter with hardcoded channels and messages so the UI layer can be developed against the abstraction without network dependencies.

### 33. Chat: Matrix adapter skeleton (connect + list rooms, no sending)
**Labels:** `chat`, `matrix`, `help-wanted`
Wire `matrix-js-sdk` behind the `ChatAdapter` interface. Connect to a user-supplied homeserver, list rooms, fetch history. Sending is a separate PR. E2EE is a separate PR after that.

### 34. Chat: Farcaster adapter skeleton (read-only channel view first)
**Labels:** `chat`, `farcaster`, `help-wanted`
Read-only Farcaster channel/cast view via a Hub client. UI must clearly indicate posts are public and permanent (per the "never fake a feature" rule).

### 35. Chat: capability-flag system for honest feature rendering
**Labels:** `chat`, `design`, `ux`
Implement the `AdapterCapabilities` query system from `CHAT_SPEC.md` § 3. Edit/delete buttons hidden when not supported, encryption indicator only when E2EE is on, public/permanent warning when applicable.

### 36. Chat: unified inbox view combining multiple adapters
**Labels:** `chat`, `ux`
Default unified-timeline view across all connected accounts, with filter controls for per-adapter or per-account views. Spaces feature (saved filters) can be a follow-on.

### 37. Chat: in-message payment request card (integrates Commerce Layer)
**Labels:** `chat`, `commerce`, `design`, `sensitive`
A payment-request attachment type that renders as a card inside the chat UI, invokes the Commerce Layer's router on accept, and shows the result inline. Requires Commerce Layer scaffolding (#24) to land first.

---

## Tagging cheat sheet

When opening these or filing related issues, prefer this label vocabulary so filters work:

- **Area:** `os-shell`, `datamoshpit`, `kooldraw`, `wallet`, `commerce`, `chat`, `education`, `reference`
- **Type:** `bug`, `enhancement`, `design`, `docs`, `chore`, `infra`
- **Difficulty:** `good-first-issue`, `help-wanted`, `sensitive`
- **Cross-cutting:** `epistemic-stance`, `economic-stance`, `editorial`, `screenshots`, `ux`, `funding`

Sensitive (`wallet`, `commerce`, editorial-content) areas require a second reviewer per `CONTRIBUTING.md`.
