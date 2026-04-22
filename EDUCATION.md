# Education

K-OS ships with a multi-track curriculum designed to be usable **offline-first** — a person on a handheld device with no internet should still be able to learn from K-OS alone.

Tracks live under [`public/education/`](./public/education/) as markdown lessons with a `track.yaml` manifest. An in-OS course runner (future work — see [`ROADMAP.md`](./ROADMAP.md) "Next") will render these with progress tracking and sandboxed code execution. Until then, the lessons are still readable as plain markdown.

For the system spec, see [`docs/KNOWLEDGE_CORPUS.md`](./docs/KNOWLEDGE_CORPUS.md).

---

## The flagship: Ethereum developer track

**The Ethereum developer track is the project's flagship curriculum.** It is the most loved track, gets the most attention, and is the primary on-ramp for the project's priority builder audience. Anyone who finishes it should be able to read mainnet contracts, write and test their own, deploy to a testnet, and understand what is happening at every layer of an EVM application.

→ [`public/education/ethereum-dev/`](./public/education/ethereum-dev/)

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

---

## Why these tracks, in this order

The two recruiting audiences for this curriculum are **Ethereum developers who don't yet know they want to contribute to K-OS**, and **K-OS users who are ready to cross from invisible-mode wallet UX into direct crypto sovereignty.** The ordering above reflects both.

- **Ethereum and Solidity** are first because they are the primary builder funnel.
- **Cryptography basics** is positioned early because it unlocks the wallet, the privacy track, and the Bitcoin and Monero tracks.
- **Privacy** is positioned next because most developers and users learn cryptography without learning threat modeling, which is where the protections actually live or fail.
- **Bitcoin** and **Monero** are smaller, deliberately — these are companion tracks for users who want to operate in those ecosystems, not standalone curricula.
- **Reading codebases** is a meta-skill the project considers undertaught. It belongs in the curriculum because every other track ultimately leads to "read a real project's code."

---

## Contributing a lesson

1. Pick a stubbed lesson in any `track.yaml`.
2. Write it. Aim for clarity over completeness; a tight 1,200-word lesson beats a sprawling 5,000-word one.
3. Include working code examples where the topic admits them. Examples should be runnable as written, with no missing imports.
4. Submit a PR. Tag with the track slug.

For broader doc-writing rules including the epistemic-stance requirements on contested topics, see [`docs/EPISTEMIC_STANCE.md`](./docs/EPISTEMIC_STANCE.md) and the "Writing for K-OS" section of [`CONTRIBUTING.md`](./CONTRIBUTING.md).
