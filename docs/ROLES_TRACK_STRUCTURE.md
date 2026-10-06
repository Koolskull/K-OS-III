# Roles — Track Structure

> **Status:** Design draft. 2026-10-06.
> **Purpose:** Turn the dictated material on feminism, “traditional roles,” and adaptive households into a wired education track that provides both teaching (six lessons) and learning tools (four offline worksheets/logs). Mirrors the structure and tone of the `creativity/` track and follows the project’s epistemic rules.

---

## 1) The author’s dictated material (verbatim)

> 🗣️ "Albeit having the appearance of the more polite position, feminism has also tangibly harmed the modern woman in many ways, and the conservative position on what women are expected to do is also very warped and referential of a curated portrayal of a particular vignette of history rather than an actual portrayal of historically traditional family roles. Traditionally the aggregate of relationships fit based upon each others abilities and needs. Roles constantly shift in reality, sometimes people get sick, sometimes they heal, sometimes they travel, and one did homesteading depending on plans, but as far back as I have researched lightly, it appears as though women were constantly expected to do very grueling labor either at home or in some form of professional expression. Although the degeneration of female youth through Marxist proxy tentacles, similar evil intentions sit behind the perceived oppositional line of thinking. What we see is that the thing anyone fears the most, becomes what they inevitably manifest in their timeline, but when you are able to let go and not worry about how you are perceived on your timeline, then you can just amorphously flow with the path that God provides you. Do what is in front of you and don't worry too much about what it's supposed to mean or how others will perceive it, just keep developing it and objectively create this abstract thing into its ideal form, and let go of external projections. Yes females are naturally gifted at things men are completely unable to do on many different biological and perceptive layers, but as victims of this proverbial prison planet hologram matrix, we all need to plug into our Father's creative infinite flow in order to escape and achieve his plan along the way."

How the track treats this material:
- The quoted blocks are preserved verbatim with the 🗣️ marker. They are the author’s framing voice, not settled fact claims.
- The “Marxist proxy tentacles” and “prison planet hologram matrix” phrases are kept in quotes and interpreted as theological/metaphorical framing. Where the phrases point at documented intellectual history (e.g., Engels, 1884), the history is cited and labeled by stance (mainstream vs dissenting).
- Claims about sex differences are placed beside the mainstream research picture and its disputes; the “completely unable” phrasing is labeled explicitly as the author’s.

---

## 2) Design principle: teach and equip, under epistemic guardrails

Like the `creativity/` track, this track alternates a teaching layer (lessons that map claims and sources) with a tools layer (offline worksheets/logs that let the reader act without passing a quiz).

Epistemic rules mirrored from `docs/EPISTEMIC_STANCE.md`:
- Present the mainstream account and credible dissenting accounts, by name, with sources.
- Prefer primary sources where available.
- Label positions as mainstream or dissenting.
- Name what is inference vs. what is documented record.
- Do not collapse into single-villain frames; keep multi-actor institutions in view.

Two doors (as in `creativity/06-the-two-doors.md`):
- Christian door: “flow with the path God provides” and “plug into the Father’s creative infinite flow” as theological counsel.
- Secular door: attention management, habit, and action-before-identity as practice.

---

## 3) Proposed track layout

```
public/education/roles/
├── track.yaml
├── 01-the-two-polite-positions.md
├── 02-the-curated-vignette.md
├── 03-roles-that-shift.md
├── 04-grueling-labor-the-real-tradition.md
├── 05-the-fear-manifestation-loop.md
├── 06-the-flow-and-the-two-gifts.md
└── tools/
    ├── role-inventory.md
    ├── fear-manifestation-log.md
    ├── weekly-flow-log.md
    └── transcript-prompt.md
```

---

## 4) Lesson outline with source map

### 01 — The two polite positions
**Teaches:** Frames the two polite positions (mainstream feminist; mainstream conservative) as partial. Introduces the author’s quoted voice as interpretive frame, not verdict.  
**Sources (named):** Stephanie Coontz (1992; 2005); Claudia Goldin (1990; 2021); Stevenson & Wolfers (2009, mainstream debate over interpretation); Mary Harrington (2023); Louise Perry (2022); Phyllis Schlafly (1977). Engels (1884) marked as a historical referent.  
**Tool:** `role-inventory.md`.

### 02 — The curated vignette
**Teaches:** The “traditional family” image is a mid-20th-century snapshot; earlier records show composite economic/domestic labor.  
**Sources:** Coontz (1992; 2005); Ruth Schwartz Cowan (1983); Goldin (1990; 2021); Alice Clark (1919); Laurel Thatcher Ulrich (1982; 1990); Proverbs 31 (primary).

### 03 — Roles that shift
**Teaches:** Adaptive roles as historical norm; fixed scripts are the exception.  
**Sources:** Ulrich (1982; 1990); Clark (1919); Goldin (1990; 2021).  
**Tools:** `role-inventory.md`, `weekly-flow-log.md`.

### 04 — Grueling labor, the real tradition
**Teaches:** Names sectors (agriculture, textiles, domestic service, early industry) as historically grueling women’s work.  
**Sources:** Ulrich (1982; 1990); Hufton (1995); Clark (1919); Goldin (1990); Cowan (1983).

### 05 — The fear–manifestation loop
**Teaches:** Presents author’s spiritual/metaphorical framing with a secular echo (attention/habit). Does not over-claim empirically.  
**Tools:** `fear-manifestation-log.md`, `weekly-flow-log.md`.

### 06 — The flow and the two gifts
**Teaches:** Holds the author’s strong claim beside mainstream sex-difference research and its disputes; keeps both doors open.  
**Sources:** Hyde (2005); Baron-Cohen (2003); (popular-science critiques summarized by Gina Rippon, 2019).
**Tools:** `weekly-flow-log.md`, `transcript-prompt.md`.

---

## 5) Wiring into the EDUCATION app

Three code surfaces change:
1. `public/education/roles/track.yaml` — manifest (slug `roles`, prerequisite `[sovereignty]` as a soft cross-link; estimated hours 3).
2. `src/lib/education/catalog.ts` — add a `roles` entry with six lessons and estimated minutes.
3. `src/lib/education/quizzes.ts` — add MCQs for `roles/01` … `roles/06` testing comprehension of positions and who argues them (no forced agreement).

Docs:
- `docs/ROLES_TRACK_STRUCTURE.md` (this file, source map + design).
- `docs/ROLES_THE_TWO_POLITE_POSITIONS.md` (philosophy doc; full quote preserved; optional deepening).
- `EDUCATION.md` — add to both the wired-tracks and all-tracks tables.
- `docs/EPISTEMIC_STANCE.md` — if a Reader Notes seed list exists, add this contested-topic pointer; otherwise skip.
- If an in-app known-markdown list exists (`src/lib/education/mdFiles.ts` in PR #13), add these docs there in that PR, not here.

---

## 6) Epistemic treatment (mandatory on this topic)

- Mainstream and dissenting labels are explicit for each claim cluster.
- Primary sources are preferred where they exist (e.g., Proverbs 31; Engels 1884).
- No single-ethnicity or single-villain frames. The quoted “Marxist proxy tentacles” language is preserved as an interpretive frame, not as settled fact; where it points at Marxist/socialist family-policy texts, those are named and read as texts.
- Biological claims are separated from theological metaphors; where the research picture is mixed, that is said plainly.

---

## 7) Open decisions

- [ ] Should lesson 02 include a short sidebar on 1950s U.S. policy context (GI Bill, racial exclusions in mortgages and employment) to make clear why “the vignette” was selective and unevenly distributed?
- [ ] Add a Reader Note on “Sex differences in interests and perception — what is strong, what is disputed” to the `docs/READER_NOTES/` folder, or keep citations inside lesson 06 only?
- [ ] Whether to include a short section on contemporary pro-natalist policies across OECD as an example of non-ideological role adaptation at the state-policy level.

---

*End of design draft.*
