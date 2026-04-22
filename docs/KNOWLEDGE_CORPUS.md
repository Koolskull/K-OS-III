# Knowledge Corpus

K-OS ships with an embedded, curated reference corpus and a multi-track curriculum. The design goal: a person on a handheld device with no internet can still learn to build on Ethereum, understand cryptography, and study history, from K-OS alone.

This document describes the system. The Reference and Education folders are the implementation; this is the spec they answer to.

For *how* this content gets written — including the rules around contested topics — see [`EPISTEMIC_STANCE.md`](./EPISTEMIC_STANCE.md).

---

## Read this first: the user owns their corpus

What ships with K-OS is a **default** — an opinionated starting point so the OS is useful from the moment the user opens it. Nothing about the corpus is locked.

A K-OS user can, at any time and without permission:

- **Edit, expand, or delete any entry** in their local Reference or Education tracks. The files are plain markdown on their disk.
- **Swap the corpus wholesale** — point K-OS at a different Reference database, a community-maintained alternative, a fork curated by someone they trust, their own homegrown version.
- **Connect to alternative sources** — federated reference networks, IPFS-published corpora, a friend's repo, an entirely different curriculum maintained by a different community.
- **Build their own curation tools** on top of the data formats described below. Markdown with YAML frontmatter is intentionally chosen because it is forkable, scriptable, and not gated by anything proprietary.
- **Fork K-OS itself** and ship a version with a completely different editorial stance.

K-OS's editorial work is the gift of a sane default. **Customization is encouraged.** The system is designed to make swapping out the defaults as natural as living with them.

The rest of this document describes how the **defaults** are produced. The defaults are ours. The OS is the user's.

---

## The Reference (working title: K-REF)

A curated, locally-bundled biographical and topical encyclopedia. Think "small, opinionated, editorially curated Wikipedia" — not a clone of Wikipedia, but a handpicked reference of people, topics, and movements the project's editors consider formative.

### Editorial model

- Koolskull and a designated set of editors decide inclusion.
- The editor list and inclusion criteria live in [`REFERENCE_EDITORIAL.md`](./REFERENCE_EDITORIAL.md).
- Reference entries follow the rules in [`EPISTEMIC_STANCE.md`](./EPISTEMIC_STANCE.md). On contested topics, mainstream and dissenting accounts are both presented, sourced, and attributed, and the reader decides.

### Offline-first

The whole corpus ships with the OS build and works with **no network**. This is a hard requirement. A user on a handheld device on an airplane, in a basement, in a country with bad bandwidth — opens K-OS, opens the Reference, reads. No fetch, no API call.

### Scope guidance — important

The Reference is intended for **historical figures, movements, places, and topics** whose significance is well-established enough for a curated editorial pass.

**Living people**, if included at all, are limited to those with public bodies of work where inclusion is clearly commentary on their work, not on the person. This is a practical constraint:

- A curated reference that names living individuals without care invites defamation, harassment, and legal exposure.
- It would harm the project's standing and divert maintainer time to disputes.
- It would compromise the editorial credibility of every other entry.

This constraint is not negotiable. Entries on living people require explicit editor sign-off and are reviewed against the editorial policy in `REFERENCE_EDITORIAL.md`.

### Format

Each entry is a markdown file under `public/reference/entries/<slug>.md` with YAML frontmatter:

```yaml
---
title: <human-readable name>
category: <person | place | movement | topic | technology>
editors: [<handle>, <handle>]
last_reviewed: YYYY-MM-DD
sources:
  - title: <source title>
    author: <author>
    url: <url if available>
    type: <book | paper | archive | site>
---

# <Title>

<2–5 paragraphs of curated content. Sources cited inline by title.>

## See also

- <related entry slugs, comma-separated>
- <Reader Notes if relevant>

## Sources

<full source list>
```

### Reader app (future work — see ROADMAP "Next")

An in-OS app renders these entries with search, filtering by category, cross-linking, and bookmarking. Until that ships, the entries are still useful as plain markdown.

For this initial pass, the folder is scaffolded with two placeholder entries:

- [`ada-lovelace.md`](../public/reference/entries/ada-lovelace.md)
- [`claude-shannon.md`](../public/reference/entries/claude-shannon.md)

These exist to establish the format. Neither is editorially controversial; they are not staking ground.

---

## Education Tracks

Structured learning tracks as markdown courses with embedded code examples. Each track lives under `public/education/<track-slug>/`:

```
public/education/<track-slug>/
├── track.yaml          # manifest: title, summary, lessons, prerequisites
├── 01-introduction.md
├── 02-<topic>.md
├── 03-<topic>.md
└── ...
```

`track.yaml` example:

```yaml
title: <track title>
slug: <track-slug>
summary: <one-paragraph description>
prerequisites: [<other-track-slug>, <other-track-slug>]
estimated_hours: <integer>
lessons:
  - file: 01-introduction.md
    title: Introduction
  - file: 02-<topic>.md
    title: <Topic>
```

### Course runner (future work — see ROADMAP "Next")

An in-OS app reads `track.yaml`, renders lessons in order, tracks progress locally, and provides a sandboxed code-execution environment for the lessons that include code (mainly the Ethereum and Solidity tracks). Until that ships, lessons are still readable as plain markdown.

### Initial tracks (scaffolded in this pass)

- **`ethereum-dev/`** — primary track, most developed scaffold. Flagship curriculum. The `01-introduction.md` is real prose; subsequent lessons are outlined in `track.yaml` and stubbed.
- **`solidity/`** — deeper dive following `ethereum-dev`. Outline only.
- **`cryptography-basics/`** — hashing, symmetric vs asymmetric, signatures, key derivation. Prerequisite for the wallet and privacy tracks. Outline only.
- **`privacy/`** — threat modeling for normal people, OPSEC, the real-world limits of privacy tooling. Outline only.
- **`bitcoin/`** — UTXO model, script basics, Lightning conceptually. Outline only; smaller than the Ethereum track by design.
- **`monero/`** — ring signatures and stealth addresses conceptually, view keys, wallet hygiene. Outline only.
- **`reading-codebases/`** — a meta-track on how to orient in a large repo, use git history as a learning tool, read tests first. Outline only.

The Ethereum developer track is **the project's flagship curriculum.** It should feel like the most loved track. See [`EDUCATION.md`](../EDUCATION.md) at the repo root for the index.

---

## Swapping or extending the default corpus

The architecture is intentionally simple so that replacing the defaults is straightforward:

- **Override an entry locally**: drop a file with the same slug into a user-overrides folder (location TBD when the in-OS reader app lands; in-tree it's just editing the file). Local overrides win over defaults.
- **Add new entries**: drop new markdown files in `public/reference/entries/` or in a configured user folder. They appear automatically in the reader.
- **Swap the whole corpus**: point the reader app at a different folder via OS settings. Could be a checked-out git repo of an alternative curated reference, an IPFS pin, a folder synced from a friend, anything that conforms to the entry format.
- **Federated / community corpora** (future work): a manifest format will allow declaring upstream Reference sources that the reader can browse alongside (or instead of) the defaults, with clear visual attribution of which source any given entry came from. See `ROADMAP.md` "Later" for direction.

This is the same posture K-OS takes toward chat protocols, payment rails, and signing devices: ship a sensible default, expose the seams, and trust the user to recompose the system as they see fit.

## Why this is in K-OS at all

Most operating systems do not ship with an encyclopedia and a curriculum. K-OS does because the project's mission depends on it:

- The wallet (`K_WALLET_SPEC.md`) presents concepts (gas, nonce, view keys, signatures) that most users have never been taught. The curriculum is how a user crosses from "I have no idea what that means" to "I know what I'm doing." The wallet UI links into the relevant lessons inline.
- The Commerce Layer (`COMMERCE_SPEC.md`) presents fees and rails that users deserve to understand before consenting to them. The curriculum makes the disclosure meaningful instead of theatrical.
- The project's commitment to local-first means external help is not always reachable. Shipping the help with the OS is the only honest way to honor that commitment.
- A handheld K-OS device on a long flight or in a low-connectivity environment should be a complete learning station. That requires the corpus to ship.

---

## Contributing

- **A new Reference entry**: open an issue proposing the subject. If approved, follow the format above and submit a PR. Editor approval needed before merge.
- **A new lesson in an existing track**: pick a stubbed lesson from `track.yaml`, write it, submit a PR. Tag the PR with the track slug.
- **A new education track**: open an issue first. New tracks need editorial approval and a named owner.
- **A correction or expansion**: regular PR.

For any of the above, follow the rules in `EPISTEMIC_STANCE.md` if the topic is contested, and `CONTRIBUTING.md` for the general process.
