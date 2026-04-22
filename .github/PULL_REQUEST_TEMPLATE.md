## What this changes

A short description of the change. What does it do, and why.

Closes #(issue number, if applicable)

## How to test it

Step-by-step. Someone reviewing the PR should be able to follow these and verify the change works.

1.
2.
3.

## Screenshots / GIFs

**Required for any change to UI.** Attach a screenshot or short GIF showing the change in action. Pixel-correct screenshots, please — no upscaling, no anti-aliasing, no drop shadows.

## Checklist

- [ ] `npm run build` passes
- [ ] `npm run lint` passes
- [ ] If UI changed: screenshot/GIF included above
- [ ] If behavior changed: tested in a browser, not just in my head
- [ ] No new dependencies added without justification (note them below if added)
- [ ] Respects [The Rules](../README.md#the-rules) — no rounded corners, no anti-aliasing, no gradient buttons, no popular-preset fonts
- [ ] If a new UI element doesn't have an existing template, I asked first (see `koolskull-os-ui-notes.md`)
- [ ] If I used an AI assistant, I'm noting it below

## Sensitive areas

Tick any that apply. These require a **second reviewer** before merge per [`CONTRIBUTING.md`](../CONTRIBUTING.md#sensitive-areas).

- [ ] Touches K-Wallet (anything under a future `src/wallet/`, or any change implied by `docs/K_WALLET_SPEC.md`)
- [ ] Touches Commerce Layer (anything implied by `docs/COMMERCE_SPEC.md`)
- [ ] Touches Reference content (`public/reference/`) or Reader Notes (`docs/READER_NOTES/`)
- [ ] Adds or upgrades a wallet-touching dependency (must update `docs/WALLET_DEPENDENCIES.md`)

## New dependencies

If you added new packages, list them here with a one-line rationale each. If none, say "none."

## AI assistance

If you used an AI assistant (Claude, Cursor, Copilot, etc.) for any part of this PR, note what you used and what it produced. We don't gatekeep AI use; we do gatekeep accountability.

## Anything else reviewers should know

Edge cases, tradeoffs you made, things you didn't do and why.
