# Reader Notes

Reader Notes are companion documents that present competing accounts of contested topics in more depth than the documents that reference them.

The purpose, in plain terms: any time a K-OS document touches a topic where serious people genuinely disagree, a Reader Note lives here mapping the disagreement honestly — sourced, attributed, and ending with the reader, not the author, holding the verdict.

For the rules these notes are written under, see [`../EPISTEMIC_STANCE.md`](../EPISTEMIC_STANCE.md).

---

## What a Reader Note is

A markdown file that:

1. Names the topic clearly.
2. Identifies the **mainstream account** — what it claims, who defends it, where it is most carefully laid out.
3. Identifies the **dissenting accounts** — who makes them, what they claim, where they are most carefully laid out.
4. Presents the **evidence each side leans on**, with links to primary sources where available.
5. Closes with a **what-we-do-not-conclude** paragraph that hands the verdict back to the reader.

## What a Reader Note is *not*

- Not advocacy for either side.
- Not a list of every claim ever made on a topic.
- Not a debunking. Not a cheerleading.
- Not the place to settle a debate the wider world hasn't settled.

## Naming and structure

- File name: `kebab-case-topic.md` (e.g. `architectural-history.md`, `high-frame-rate-perception.md`).
- Section structure: `Topic` → `The mainstream account` → `The dissenting account(s)` → `What the evidence is and where to find it` → `What we do not conclude`.
- YAML frontmatter optional but encouraged:

```yaml
---
title: <topic title>
last_reviewed: YYYY-MM-DD
editors: [<handle>, <handle>]
---
```

## Currently in this folder

- [`architectural-history.md`](./architectural-history.md) — the academic architectural-history account of 19th-century monumental construction vs. the independent-researcher account associated with Jon Levi and peers.

## Planned (see `docs/SEED_ISSUES.md`)

- High-frame-rate perception and screen health
- History of wireless power and "free energy" claims
- The disintermediation debate (platforms vs. peer-to-peer commerce)

## How to contribute a Reader Note

1. Open an issue proposing the topic. Include why it merits a note (i.e. a real, sourced disagreement exists).
2. Wait for editorial feedback. Some topics will be declined; not every disagreement is one K-OS is the right vehicle to map.
3. Draft the note following the structure above. Read your draft against the guardrails in `EPISTEMIC_STANCE.md`.
4. Submit a PR. Expect editorial review focused on attribution, source quality, and tone.

The goal of every Reader Note is the same: a careful reader finishes it knowing what each side actually claims, what evidence each side relies on, and where to keep reading. Nothing more, nothing less.
