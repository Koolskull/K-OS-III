# Education

K-OS ships with a multi-track curriculum designed to be usable **offline-first** — a person on a handheld device with no internet should still be able to learn from K-OS alone.

Tracks live under `public/education/` as markdown lessons with a `track.yaml` manifest.

## In-OS EDUCATION app

The desktop app **EDUCATION** (icon `§`) loads those markdown files, lets you read lessons, and marks progress when you pass a **multiple-choice checkout** at the end of each lesson.

- Progress is stored in **browser `localStorage`** only (no accounts, no server).
- Quizzes live in `src/lib/education/quizzes.ts`; catalog in `src/lib/education/catalog.ts`.
- App UI: `src/components/apps/education/EducationApp.tsx`.
- Static GitHub Pages deploy already includes `public/education/**` via `npm run build` + Pages workflow.

Live: open the OS → double-click **EDUCATION** → pick Sovereignty, Culture Machines, Antediluvian Observatory, or **Creativity as the Way Out** → read → **START QUIZ** → pass to mark complete.

For the system spec, see `docs/KNOWLEDGE_CORPUS.md`.

---

## Wired tracks

| Document | What it covers | Status |
|---|---|---|
| **`docs/CREATIVITY_AS_THE_WAY_OUT.md`** | Creativity as the accessible exit from trauma-shaped states (depression, laziness, imposter syndrome, hopelessness); value as a function of reality rather than narrative, drawing on the Jekyll Island / Federal Reserve history; creativity as the primary objective function for long-term, exponential value. Christian and secular readings converge. Verbatim dictated quotes preserved alongside academic prose. | **Wired as `creativity/` track** · 2026-10-05 · six lessons + six offline tools in the EDUCATION app |
| **`docs/ROLES_THE_TWO_POLITE_POSITIONS.md`** | Feminism and “traditional roles,” read against the documented record of women’s labor; households as adaptive systems that shift roles by ability and need; author’s spiritual framing preserved as quotes, labeled as such; mainstream/dissenting accounts presented with sources; sex-difference claims set beside the research picture; two doors (Christian and secular). | **Wired as `roles/` track** · 2026-10-06 · six lessons + four offline tools in the EDUCATION app |

Design draft and track structure: `docs/CREATIVITY_TRACK_STRUCTURE.md`. Notion capture surface: `K-OS Educational Tract — Creativity as the Way Out` (private page; sync rule: new dictated quotes land in Notion first, then push to the repo).

---

## The flagship: Ethereum developer track

**The Ethereum developer track is the project's flagship curriculum.** It is the most loved track, gets the most attention, and is the primary on-ramp for the project's priority builder audience. Anyone who finishes it should be able to read mainnet contracts, write and test their own, deploy to a testnet, and understand what is happening at every layer of an EVM application.

→ `public/education/ethereum-dev/`

*(Not yet wired into the EDUCATION app catalog — Sovereignty, Culture Machines, Antediluvian, and Creativity ship first.)*

---

## All tracks

| Track | What it covers | Status |
|---|---|---|
| **`ethereum-dev/`** | What Ethereum is, accounts vs. contracts, gas, the EVM, Solidity basics, Foundry/Hardhat, testing, deploying, reading mainnet contracts, common vulnerabilities, account abstraction, L2s. | Intro lesson written. Outline complete. Lessons 02+ stubbed. |
| **`solidity/`** | Deeper Solidity: storage layout, gas optimization, design patterns, security patterns, audit-readiness. Follows `ethereum-dev/`. | Outline only. |
| **`cryptography-basics/`** | Hashing, symmetric vs. asymmetric, digital signatures, key derivation, why seed phrases work the way they do. Prerequisite for the wallet and privacy tracks. | Outline only. |
| **`privacy/`** | Threat modeling for normal people, metadata vs. content, Tor basics, why Monero exists, OPSEC hygiene for developers, device hygiene, the real-world limits of privacy tooling — honest, not hype. | Outline only. |
| **`bitcoin/`** | UTXO model, script basics, Lightning at a high level, how Bitcoin wallets differ from EVM wallets. Smaller than the Ethereum track by design. | Outline only. |
| **`monero/`** | Why Monero, ring signatures and stealth addresses conceptually, view keys, wallet hygiene, running a node. | Outline only. |
| **`reading-codebases/`** | Meta-track on how to read unfamiliar codebases, orient in a large repo, use git history as a learning tool, read tests first, build a mental model from entry points. Quietly important — most developer learning fails not at syntax but at orientation. | Outline only. |
| **`sovereignty/`** | Tools for examining sources of belief and institutional power. Simple spiritual foundations (Jesus), Robert Monroe / OBE, declassified MKUltra and Stargate, Tesla and Russell (record vs later claims), Jekyll Island / Federal Reserve / American System tradition, Eric Weinstein / institutional physics consensus (All-In case study). Follows `EPISTEMIC_STANCE.md`. | Nine lessons written · **in EDUCATION app**. |
| **`culture-machines/`** | Injection vs bottom-up proliferation; Cacophony → Burning Man → SantaCon; Grateful Dead Acid Tests and academic LSD; jungle / CCRU / accelerationism; Aquino, MindWar, Temple of Set, and the Presidio investigation (documented record vs internet narrative); festival scale and myths that fail evidence checks; retro-computer content versus the tracker, Fairlight, and Synclavier, with institutional claims about mainstream music labeled by their evidence. Follows `EPISTEMIC_STANCE.md`. | Seven lessons written · **in EDUCATION app**. |
| **`antediluvian/`** | Alternative deep history / pre-flood era: methods, Younger Dryas, Göbekli + 'founded' megaliths, cross-continental flood/diffusion parallels, occult old-map worldview (Piri Reis/Hapgood), Watchers vs Tartaria clocks. Observe, cite, leave contradictions visible. Follows `EPISTEMIC_STANCE.md`. | Sixteen densified lessons · **in EDUCATION app**. |
| **`creativity/`** | Creativity as the accessible exit from trauma-shaped states; the Jekyll Island value diagnostic (real vs facade); creativity as the primary objective function; two doors (Christian + secular). Six lessons + six offline learning tools (state inventory, first-build template, value diagnostic, compounding sketch, weekly build log, transcript prompt). Prerequisite: sovereignty. | Six lessons written · **in EDUCATION app** · wired 2026-10-05 |
| **`roles/`** | Feminism and “traditional roles” compared to the historical record of women’s labor; adaptive households that shift roles by ability and need; fear–manifestation as spiritual metaphor with secular echoes; sex-difference claims labeled and sourced; two doors kept open. Prerequisite: sovereignty. | Six lessons written · **in EDUCATION app** · wired 2026-10-06 |

---

## Why these tracks, in this order

The two recruiting audiences for this curriculum are **Ethereum developers who don't yet know they want to contribute to K-OS**, and **K-OS users who are ready to cross from invisible-mode wallet UX into direct crypto sovereignty.** The ordering above reflects both.

- **Ethereum and Solidity** are first because they are the primary builder funnel.
- **Cryptography basics** is positioned early because it unlocks the wallet, the privacy track, and the Bitcoin and Monero tracks.
- **Privacy** is positioned next because most developers and users learn cryptography without learning threat modeling, which is where the protections actually live or fail.
- **Bitcoin** and **Monero** are smaller, deliberately — these are companion tracks for users who want to operate in those ecosystems, not standalone curricula.
- **Reading codebases** is a meta-skill the project considers undertaught. It belongs in the curriculum because every other track ultimately leads to "read a real project's code."
- **Sovereignty** sits alongside the technical tracks as an epistemic and historical companion: primary sources on consciousness research, declassified intelligence programs, competing accounts of monetary power, and institutional science as a consensus machine, written under the same rules as the rest of the corpus.
- **Culture machines** sits next to sovereignty as a cultural-history companion: how scenes, institutions, and markets co-produce forms that computers scale, with the same primary-source habit and explicit filters against unsupported totalizing claims.
- **Antediluvian Observatory** sits with sovereignty as an epistemic companion for deep-history and pre-flood alternative theories (catastrophe debates, founded megaliths, cross-continental parallels, occult map worldview, Enochic and mud-flood frames). Method first; conversion never the goal.
- **Creativity as the Way Out** sits as the practice track: the only track that teaches *how to do* something rather than teaching *about* something. It answers the economic stance's rent-extraction diagnosis with a constructive practice, and it extends the two-door identity from VISION.md into curriculum form.

---

## Contributing a lesson

1. Pick a stubbed lesson in any `track.yaml`.
2. Write it. Aim for clarity over completeness; a tight 1,200-word lesson beats a sprawling 5,000-word one.
3. Include working code examples where the topic admits them. Examples should be runnable as written, with no missing imports.
4. If the track is in the EDUCATION app catalog, add MCQs in `src/lib/education/quizzes.ts` and a catalog entry in `src/lib/education/catalog.ts`.
5. Submit a PR. Tag with the track slug.

For broader doc-writing rules including the epistemic-stance requirements on contested topics, see `docs/EPISTEMIC_STANCE.md` and the "Writing for K-OS" section of `CONTRIBUTING.md`.
