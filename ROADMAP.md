# Roadmap

This is a roadmap, not a plan of record. Things move. The further out you read, the less load-bearing the dates are.

The structure has three horizons:

- **Now** — concrete, merge-able tasks for the next ~3 months. These are real units of work. Many are already in [`docs/SEED_ISSUES.md`](./docs/SEED_ISSUES.md).
- **Next** — directions for the next year. Believable, sized, but not yet broken into PRs.
- **Later** — vision-level, long-arc work. Marked clearly as vision, not roadmap, so nobody thinks they're committing to it.

For the "why" behind any of this, see [`VISION.md`](./VISION.md).

---

## Now (≤ 3 months)

These are concrete and contributor-friendly. Pick one and go.

- **Datamoshpit Video Layer v0** — first cut of the visual-module system from [`docs/DATAMOSHPIT_VIDEO_SPEC.md`](./docs/DATAMOSHPIT_VIDEO_SPEC.md): pick the three v0 VM types (Image Sequence, Iframe, Shader), wire the Instrument-screen binding UI, ship the compositor at single-layer first, then layer stacking.
- **Screenshot / GIF pass** — capture the four hero shots in `public/screenshots/` and any extra shots called out there. This unlocks every grant application and every social post.
- **Demo deploy** — pick a host (Vercel is the obvious one for Next.js), wire it up, replace `[DEMO_URL]` in the README. Demo links convert curiosity into contributions.
- **First five "good first issues"** — see `docs/SEED_ISSUES.md`. Examples: keyboard shortcut overlay (`?`), per-channel meters in the taskbar, sprite-editor onion-skin toggle, boot-sequence skip key, in-OS About panel.
- **Repo scaffolding** *(this PR)* — README hero, CONTRIBUTING, ROADMAP, VISION, EPISTEMIC_STANCE, KNOWLEDGE_CORPUS, K_WALLET_SPEC, ECONOMIC_STANCE, COMMERCE_SPEC, FUNDING_PLAN, CHAT_SPEC, .github scaffolding. *Done in this pass.*

---

## Next (≤ 12 months)

Bigger pieces, not yet sized into individual PRs. Most of these unlock follow-on work.

- **Audio-reactive shader instruments** — the Shader VM type extended with per-channel FFT data and a small library of reusable uniforms.
- **Iframe / image-sequence instruments** — full publish-and-share pipeline so a community shader/animation can be dropped into a project as one URL or one folder.
- **MIDI Learn polish** — fast, predictable mapping for any controller, with persistence across sessions and projects.
- **Handheld target profiles** — first-class tested builds for Miyoo Mini, Anbernic devices, Steam Deck. Includes UI scaling profiles and per-device input maps.
- **In-OS reader app for `public/reference/`** — markdown-rendered, search, cross-linking. Backbone of the offline knowledge corpus from [`docs/KNOWLEDGE_CORPUS.md`](./docs/KNOWLEDGE_CORPUS.md).
- **In-OS course runner for `public/education/`** — embedded code examples, progress tracking, all local-first. Flagship curriculum is `ethereum-dev/`.
- **K-Wallet v0** — the architecture from [`docs/K_WALLET_SPEC.md`](./docs/K_WALLET_SPEC.md): EVM via `viem`, software signer + Ledger signer, send/receive, basic ENS, WalletConnect v2. Bitcoin and Monero ship as watch-only first.
- **Commerce Layer v0** — the abstraction from [`docs/COMMERCE_SPEC.md`](./docs/COMMERCE_SPEC.md): the `Commerce` interface, Stripe adapter skeleton (dev-mode), honest fee-display component, no-op direct/offline adapter.
- **Chat (Matrix adapter)** — first-class Matrix client per [`docs/CHAT_SPEC.md`](./docs/CHAT_SPEC.md). Connect, list rooms, send messages, basic E2EE.
- **Chat (Farcaster adapter)** — read-only first, then signing via K-Wallet.
- **DDR Cabinet input profile** — large-target UI mode optimized for foot input and 3-6ft viewing distance.
- **PWA / installable web app** — manifest, service worker, offline-first for the OS shell and the bundled apps.

---

## Later — *vision, not roadmap*

> **Read this section as direction, not commitment.** Nothing here is scheduled. Nothing here has a contributor assigned. These are the long-arc bets that make the rest of the project make sense. If you only read one section of this doc, read [`VISION.md`](./VISION.md) instead.

- **Open-source modular hand-computer reference hardware** — a steel, fixable, modular handheld that runs K-OS natively and doubles as the air-gapped signer for K-Wallet (see `K_WALLET_SPEC.md` `KOSAirgappedSigner`).
- **IPFS publishing from inside K-OS** — a song, a sprite, a 3D scene, a contract — published from the OS to IPFS in one action, with the manifest file stored locally so the user owns the pointer.
- **In-OS marketplace for projects, samples, sprites, shaders, and contracts** — settlement rail is a backend choice, not a user choice (see `COMMERCE_SPEC.md`). Buyers and sellers transact directly; K-OS does not custody funds.
- **Installable Linux distro** — Zorin OS fork that ships K-OS apps as native desktop apps (Electron or Tauri), with a custom boot sequence and pre-installed tools.
- **Reference hardware integration with the wider FOSS handheld scene** — co-branded builds for Miyoo, Anbernic, ClockworkPi, etc.
- **Konami / arcade partnership for DDR Mode** — see `koolskull-os-ui-notes.md` for the full DDR Cabinet business plan.
- **Dedicated KoolDraw app** — Krita + Clip Studio + Piskel hybrid for storyboard and animation work, integrated with the Datamoshpit visual timeline (see workspace `CLAUDE.md` Phase 3).

---

## How to suggest a roadmap change

Open an issue with the `roadmap` label. Say which horizon you think your idea fits into and why. Big things start as small comments.
