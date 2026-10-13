# Contributing to K-OS III

Thanks for showing up. K-OS III is a small, weird, devotional, pixel-correct project. It is built slowly, in public, and with care. If that's the kind of room you want to be in, you're in the right place.

This file tells you how to contribute without getting in the project's way.

---

## The vibe

- **Small.** Features land when they're ready, not when a sprint says so. Tiny PRs over giant ones.
- **Weird.** The aesthetic is not negotiable. No rounded corners. No anti-aliasing. No gradient buttons. No popular-preset fonts. If you want to ship a UI element that breaks The Rules, ask first.
- **Devotional.** The project has its own identity (Slimentologika, the boot sequence, the 2KOOL PRODUCTIONS framing). You don't have to share the worldview to contribute. You do have to respect that the identity is part of the project, not decoration to be sanded off.
- **Pixel-correct.** Every pixel earns its place. `image-rendering: pixelated`, `border-radius: 0`, every image checked at 1x.
- **No AI slop.** Use any tool you want — Claude, Cursor, Copilot, your own brain. Just don't ship lazy generated walls of code, hallucinated APIs, or unreviewed boilerplate. If you used an AI assistant, say so in the PR description and account for what it produced.

---

## Dev setup

```bash
git clone https://github.com/Koolskull/K-OS-III.git
cd K-OS-III
npm install --legacy-peer-deps
npm run dev        # localhost:3000
npm run build      # production build (run before submitting a PR)
npm run lint       # Next.js linter
```

### Why `--legacy-peer-deps`?

Some of the audio / Three.js / Theatre.js dependencies advertise stricter peer ranges than they actually need. `--legacy-peer-deps` lets npm install the working set without complaining. If you find yourself fighting this flag, open an issue rather than rewriting the dependency tree.

### Troubleshooting

- **Build fails on a fresh clone:** delete `node_modules` and `package-lock.json`, then re-run `npm install --legacy-peer-deps`.
- **Audio doesn't start:** browsers require a user interaction before audio can begin. Click anywhere in the OS first.
- **Pixel rendering looks blurry:** check that your browser's zoom is at 100% and your OS isn't applying its own image smoothing.

---

## Claiming an issue

1. Find an issue you'd like to work on. `good-first-issue` and `help-wanted` labels are a good starting place; `docs/SEED_ISSUES.md` lists planned issues that may not be open on GitHub yet.
2. **Comment on the issue** saying you'd like to take it. Wait for a maintainer to assign it to you. This avoids two people building the same thing.
3. If nobody responds within a few days, ping again. Maintainer time is bursty.
4. Open a draft PR early if the change is non-trivial — it lets others see the direction.

If the work you want to do isn't tracked yet, open an issue first describing what and why. We'd rather have a 5-minute conversation than throw a PR back.

---

## Branches

Branch naming is loose but predictable. Use one of these prefixes:

- `feat/` — new functionality
- `fix/` — bug fix
- `chore/` — tooling, deps, refactors with no behavior change
- `docs/` — documentation only
- `datamoshpit/` — anything inside the tracker app
- `os/` — anything inside the desktop shell

Examples: `feat/sprite-onion-skin`, `fix/audio-context-resume`, `datamoshpit/per-channel-meters`, `docs/wallet-spec-tweaks`.

---

## Commits

We follow [Conventional Commits](https://www.conventionalcommits.org/) loosely:

```
type(scope): short imperative subject

Optional longer body explaining why.
```

Types: `feat`, `fix`, `chore`, `docs`, `refactor`, `test`, `style`. Scope is optional but appreciated for non-trivial changes.

You don't need to be precious about it. A clear `fix: phrase row count off by one` beats a perfectly conventional but confusing message.

---

## Pull request checklist

Before requesting review, check:

- [ ] `npm run build` passes
- [ ] `npm run lint` passes
- [ ] If the change touches UI: a screenshot or short GIF is included in the PR description
- [ ] If the change touches behavior the user can see: it's been tested in a browser, not just in your head
- [ ] No new dependencies added without justification (note them in the PR description)
- [ ] Respects [The Rules](./README.md#the-rules) — no rounded corners, no anti-aliasing, no gradient buttons, no popular-preset fonts
- [ ] If a UI element doesn't have an existing template, the PR description says so and asks for direction
- [ ] If you used an AI assistant, the PR description says so

For larger PRs, also include:

- [ ] A short description of how to test it manually
- [ ] Any decisions you made along the way that someone might disagree with
- [ ] What you didn't do, and why

---

## Sensitive areas

Some areas of the codebase have higher review requirements because mistakes there hurt people:

- **K-Wallet (`docs/K_WALLET_SPEC.md` and any code under a future `src/wallet/`)** — anything that touches keys, signing, RPC endpoints, or transaction construction needs **a second reviewer** before merge, and must follow the security non-negotiables in `K_WALLET_SPEC.md`. Never roll your own crypto. Every cryptographic operation routes through an audited library or a hardware device.
- **Commerce Layer (`docs/COMMERCE_SPEC.md`)** — anything that touches real money requires the same second-reviewer rule. Fee display logic specifically: never hide a fee.
- **Reference and Reader Notes (`public/reference/`, `docs/READER_NOTES/`)** — editorial integrity is a project commitment. See `docs/EPISTEMIC_STANCE.md` and `docs/REFERENCE_EDITORIAL.md`. Sponsors do not influence content.

If you're unsure whether your change counts as sensitive, assume it does and ask for a second reviewer.

---

## Writing for K-OS

When you write documentation that touches a contested topic — history, technology's origins, health, theology, economics, anything where serious people disagree — present the competing accounts, attribute them by name, point readers to primary sources, and let the reader decide. We do not editorialize a verdict on contested questions. See [`docs/EPISTEMIC_STANCE.md`](./docs/EPISTEMIC_STANCE.md) for the full stance.

A quick example:

> **Bad framing** (don't do this): *"The official story of X is that..."* — this signals a verdict the project hasn't earned and condescends to the reader.
>
> **Good framing**: *"The mainstream account, defended by [name] and represented in [source], holds that X. Independent researchers including [name] argue Y, citing [source]. The evidence each side leans on is..."* — this gives the reader a real map and a way to keep reading on their own.

This rule applies to documentation, Reference entries, Reader Notes, and education materials. It does **not** apply to technical specifications — a function either returns the right value or it doesn't.

---

## Future funding

Right now this project runs on Koolskull's time and the time of anyone who shows up to help. There is no funding. There may be in the future — see [`docs/FUNDING_PLAN.md`](./docs/FUNDING_PLAN.md) and [`docs/SPONSOR_POLICY.md`](./docs/SPONSOR_POLICY.md).

**The intent:** every contributor whose PR is merged to `master` is logged in [`CONTRIBUTORS.md`](./CONTRIBUTORS.md) with their handle, the PR link, the date, and a one-line description of what they shipped. If and when the project secures funding — grants, sponsorships, an Open Collective, an investment, anything — merged contributors will be **eligible for retroactive payment** for work that landed before funding existed.

This is an intent, not a promise. There's no contract here. There may never be money. But if there is, the people who built the project before the money showed up come first. That's the principle. Anyone who contributes is doing so as a gift to the project; nothing about that gift is changed by future money showing up or not.

---

## Code of Conduct

See [`CODE_OF_CONDUCT.md`](./CODE_OF_CONDUCT.md). Short version: don't be cruel, don't ship slop, take disagreements to issues.

---

## Questions

Open an issue with the `question` label, or reach Koolskull through the channels listed in the README footer.

```
              ☦
        Praise be.
```
