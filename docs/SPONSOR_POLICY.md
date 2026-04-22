# Sponsor & Funding Policy

A short, plain-language policy stating what K-OS accepts money for and what it does not.

This document exists so that anyone considering supporting the project — and anyone considering contributing to a project that takes outside money — can understand the rules of the room before showing up.

For the broader funding map, see [`FUNDING_PLAN.md`](./FUNDING_PLAN.md). For the contributor-facing future-funding intent, see [`../CONTRIBUTING.md`](../CONTRIBUTING.md) § *Future funding*.

---

## What K-OS accepts money for

- **Paying contributors** for work merged to `master`. The CONTRIBUTORS ledger is the basis for retroactive payment when funding allows.
- **Hosting** — domains, demo deploys, CI minutes, public-asset CDN.
- **Hardware R&D** for the eventual K-OS reference hand-computer (see `VISION.md` and `ROADMAP.md` Later).
- **Legal** — entity formation, license review, sponsor agreement review.
- **Grant application support** — time spent writing applications and meeting reporting requirements.
- **Specific commissioned work** — e.g., the Commissioned Tool for the Commerce Layer (see [`COMMERCE_SPEC.md`](./COMMERCE_SPEC.md) § 6), education curriculum work, ports to additional platforms.

---

## What K-OS does not accept money for

- **Editorial influence over the Reference, Reader Notes, or Education tracks.** No sponsor decides what's in or out of the curated corpus. No sponsor frames an entry. This is non-negotiable.
- **Personal enrichment beyond fair compensation for work done.** Funds are not a transfer of project value into a single individual's pocket beyond what their work is worth. The maintainers are not extracting from the project.
- **Anything that would compromise the project's independence to make technical or design decisions.** A sponsor who attaches strings that conflict with `VISION.md` or the spec docs is declined.
- **Anti-features** — telemetry the user didn't ask for, tracking, advertising surfaces, dark patterns. Not even for a lot of money.

---

## Disclosure

Every funding source above a threshold is **publicly listed.**

- **Threshold:** propose **$1,000 / €1,000** as starting figure (subject to revision once the project has a real funding history). Below this, attribution is at the contributor's discretion; above, it is mandatory.
- **Where:** a `FUNDERS.md` file (to be created when the first qualifying source lands), and on any project landing page that exists at the time.
- **What's listed:** funder name, funding period, amount range (round numbers are fine — exact figures are not always disclosable), and what the funding was for at a one-line level.

Anonymous contributions below the threshold are accepted. Anonymous contributions at or above the threshold are declined unless the project's auditors / fiscal sponsor have full attribution privately.

---

## Right of refusal

The project reserves the right to **decline funding from sources that would compromise its mission**, and **will publicly state when it has done so.**

The standard for declining:

- The funder requires editorial influence over content described as non-influenceable above.
- The funder's stated mission or operating record is in conflict with `VISION.md` in ways that cannot be reconciled.
- Accepting the funding would create a conflict of interest the project cannot manage transparently.

Declines are logged (without the funder's name unless the funder consents) so the project's funding history is auditable.

---

## Conflict of interest

A maintainer who has a personal financial relationship with a current or potential sponsor must:

1. Disclose it to the rest of the maintainer group.
2. Recuse themselves from the funding decision.
3. If the relationship is ongoing and material, disclose it in their CONTRIBUTORS entry.

This is standard practice in any project that handles money seriously. Documenting it now is cheaper than discovering it later.

---

## How this policy is changed

Material changes to this document are PRs reviewed and approved by the founder and (when one exists) the editorial / governance group. Substantive changes are accompanied by a `CHANGES.md` entry or PR description explaining why the change was made and what it allows or disallows that wasn't before.
