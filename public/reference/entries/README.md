# Reference entries

Markdown files in this folder make up the K-OS Reference — the curated, offline-first encyclopedia bundled with the OS.

For the system architecture, see [`docs/KNOWLEDGE_CORPUS.md`](../../../docs/KNOWLEDGE_CORPUS.md).
For editorial policy, see [`docs/REFERENCE_EDITORIAL.md`](../../../docs/REFERENCE_EDITORIAL.md).
For the rules on contested topics, see [`docs/EPISTEMIC_STANCE.md`](../../../docs/EPISTEMIC_STANCE.md).

## File format

Each entry is a markdown file with YAML frontmatter:

```yaml
---
title: <human-readable name>
category: <person | place | movement | topic | technology>
editors: [<handle>]
last_reviewed: YYYY-MM-DD
sources:
  - title: <source>
    author: <author>
    url: <url>
    type: <book | paper | archive | site>
---
```

File names use kebab-case slugs: `ada-lovelace.md`, `claude-shannon.md`, `ym2612.md`.

## Currently in this folder

The first two entries are placeholders that exist to establish the format. They are not staking editorial ground.

- [`ada-lovelace.md`](./ada-lovelace.md)
- [`claude-shannon.md`](./claude-shannon.md)

## Adding an entry

Open an issue first, per the editorial process in `REFERENCE_EDITORIAL.md`. Living-person entries require two-editor sign-off.
