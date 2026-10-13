# Reference Editorial Policy

This document governs the curated Reference (`public/reference/`). Entries here are editorial work, not user-generated content; this file says who decides and how.

For the broader rules on how K-OS handles contested topics, see [`EPISTEMIC_STANCE.md`](./EPISTEMIC_STANCE.md). For the system architecture, see [`KNOWLEDGE_CORPUS.md`](./KNOWLEDGE_CORPUS.md).

---

## Scope of this policy

This policy governs **the default Reference shipped with K-OS** — the entries the editorial team is responsible for curating, vetting, and standing behind.

It does **not** govern what individual users put on their own machines. K-OS is local-first; users own their own copy and can edit, replace, swap, or extend the corpus however they like (see `KNOWLEDGE_CORPUS.md` § *Swapping or extending the default corpus*). Community-maintained or third-party Reference databases are welcome to set their own editorial policies; this one applies only to upstream defaults.

The editorial effort described below exists to give the default a stable, opinionated voice. Customization downstream is encouraged.

---

## Editors

**Editors: TBD.** Initial editorial responsibility rests with @Koolskull as project founder. Additional editors will be invited as the corpus grows. The expectation is a small editorial team — not a wiki.

When the editorial team expands, this section is updated to list named editors with their areas of focus.

## Inclusion criteria

**Inclusion criteria: TBD in detail.** The working principles, until codified more precisely:

- Subjects must have **established significance** — sustained influence, documented work, lasting impact in their field.
- Subjects should be **legible to the project's audience** — Ethereum developers, musicians, artists, makers, builders, learners. A subject that is significant in a field totally orthogonal to the project's reach can wait.
- Subjects should be **resolvable from primary sources** — their work, their writings, their measurable impact — not from biographical mythology.
- The Reference is **opinionated**, not exhaustive. We pick. Wikipedia exists for the rest.

See [`VISION.md`](../VISION.md) for the project's broader values, which inform what counts as significant for our purposes.

## Living people

Per [`KNOWLEDGE_CORPUS.md`](./KNOWLEDGE_CORPUS.md):

> The Reference is intended for historical figures, movements, places, and topics whose significance is well-established enough for a curated editorial pass. Living people, if included at all, are limited to those with public bodies of work where inclusion is clearly commentary on their work, not on the person.

Concrete editorial rules for living-person entries:

1. **Default to no.** If there is no compelling reason to include a living person, don't.
2. **Public bodies of work only.** A living person is included on the basis of public, durable work — a published book, a released open-source project, a body of recorded music, a documented technical contribution. Not on the basis of social-media presence, public statements, or political positions.
3. **Commentary on the work, not on the person.** The entry discusses what the person made, not who they are as a private individual.
4. **No claims of present-day fact about the person's life beyond what is publicly and durably documented.** Career, public work, public statements with sources — yes. Personal life, relationships, private opinions — no.
5. **Right of reply.** A subject who is alive and reaches out to dispute the entry is engaged with seriously. Factual corrections are made.
6. **Two-editor sign-off required for any living-person entry before merge.**

This is a practical constraint as much as an ethical one. A curated reference that names living individuals carelessly invites defamation claims, harassment campaigns directed at the project, and the kind of disputes that consume maintainer time and damage editorial credibility. We avoid all of this by defaulting to no.

## Editorial process

1. **Proposal.** Any contributor opens an issue proposing a Reference subject. Issue must include: subject name, why this subject merits an entry, proposed primary sources, and (if applicable) any known controversy around the subject.
2. **Editorial review.** An editor accepts or declines the proposal, with reasoning. Decline reasons might include: insufficient established significance, scope mismatch, living-person rules not met, no good sources available.
3. **Drafting.** Once accepted, the contributor (or an assigned editor) drafts the entry following the format in `KNOWLEDGE_CORPUS.md`.
4. **Editorial review of draft.** An editor reviews against:
   - Source quality (primary sources cited, attributions correct)
   - Tone (no advocacy, no debunking, no condescension)
   - Epistemic-stance compliance for contested topics (mainstream and dissenting accounts both present)
   - Living-person rules where applicable
5. **Merge.** Single-editor sign-off for non-controversial historical subjects; two-editor sign-off for living people, contested topics, or anything where the editor is uncertain.

## Contested topics

Reference entries on contested topics follow [`EPISTEMIC_STANCE.md`](./EPISTEMIC_STANCE.md): mainstream account and credible dissenting accounts both presented, attributed, and sourced; reader decides. The entry may also link to a companion Reader Note in `READER_NOTES/` for fuller treatment.

## Sponsor influence

Per [`SPONSOR_POLICY.md`](./SPONSOR_POLICY.md), no sponsor or funder influences Reference content. Inclusion or framing of a subject is never a deliverable to a funder. Editorial integrity of the Reference is non-negotiable.

## Updating this file

Changes to editorial policy are themselves PRs, reviewed by the editorial team. Substantive changes (e.g. expanding the living-person rules, redefining inclusion criteria) require explicit founder approval until the editorial team has formalized governance.
