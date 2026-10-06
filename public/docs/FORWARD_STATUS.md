# Forward Status — Build health & unfinished work

**Last updated:** 2026-07-24 (creative workflow bus)  
**Audience:** maintainers and contributors picking up where the last session left off.

This note is intentionally short. Deep specs stay in their own docs; this file answers two questions only: *does it build?* and *what should we do next?*

---

## 1. Latest build error (fixed)

**Symptom:** `npm run build` failed under Next.js 16 / Turbopack with a parse error in SHOTLIST.

**Root cause:** three small JSX/attribute syntax bugs introduced in the Phase 0 scaffold (`src/components/apps/shotlist/ShotlistApp.tsx`):

| Location | Bug | Fix |
|----------|-----|-----|
| Thumbnail `<img>` | Opened with `>` instead of self-closing `/>` | Close as void element |
| Description `<textarea>` | `rows={2,` (trailing comma inside expression) | `rows={2}` |
| Audio notes `<textarea>` | same `rows={2,` typo | `rows={2}` |

**Verification:** `npm run build` completes successfully after the fix (static generation of all routes).

**Related lockfile drift (unrelated to the crash):** `package-lock.json` still reported `0.1.0` while `package.json` is `0.2.1-beta`. A local install already rewrote the lockfile version field — include that when committing so CI stays clean.

---

## 2. Efficiency rules for unfinished work

Credit- and attention-efficient order:

1. **Keep the green build.** One syntax typo in a newly registered app can block the whole OS. After any scaffold PR, run `npm run lint` (tsc) + `npm run build` before merge.
2. **Finish one vertical slice at a time.** Prefer “one app phase done” over “many apps half-started.”
3. **Specs already exist — implement against them.** Do not rewrite design docs unless an open question forces a decision.
4. **Ship offline/local first.** Wallet, commerce, multi-user, and hardware targets wait until the local creative loop works.
5. **Document only when a human would get lost without it.** Prefer updating phase checklists inside existing specs over new long essays.

---

## 3. Recommended next queue (high ROI)

### A. SHOTLIST Phase 1 — Offline MVP *(active surface; highest continuity)*

Spec: [`SHOTLIST_SPEC.md`](./SHOTLIST_SPEC.md) §9 Phase 1. Scaffold (Phase 0) is in-tree and registered.

**Landed:**
- Shot plates + freehand stamps (`drawStamps`) in SHOTLIST and KoolDraw  
- **Creative Workflow Bus** — SHOTLIST ↔ KoolDraw handoff (**S** / RETURN). See `docs/CREATIVE_WORKFLOW.md`

Minimal remaining Phase 1 slice (in order):

1. Persist sequence to IndexedDB / downloadable `.k3shot` JSON (even if schema is v0).
2. Drive X-Sheet rows from `durationFrames` + exposure holds (not a single dummy frame).
3. Optional: import image → threshold to mono plate; KoolDraw round-trip later.
4. Keyboard model parity with Datamoshpit for list / expand / field edit.
5. KoolDraw return-to-shot context (only after 1–4).

Defer: print export (Phase 2), wallet approvals (Phase 3).

### B. OS shell “good first issues” *(parallelizable; tiny PRs)*

From [`SEED_ISSUES.md`](./SEED_ISSUES.md) Part 1 — pick any one; each is isolated:

- `?` keyboard shortcut overlay  
- Boot sequence skip (hold Esc)  
- In-OS About panel  
- Wallpaper picker  
- Demo deploy + replace `[DEMO_URL]`  

### C. Datamoshpit Video Layer v0 *(roadmap “Now”)*

Spec: [`DATAMOSHPIT_VIDEO_SPEC.md`](./DATAMOSHPIT_VIDEO_SPEC.md). Start with single-layer compositor + one VM type (Image Sequence *or* Shader), not all three.

### D. Explicitly *not* next (unless staffing + security review)

- K-Wallet crypto implementations (interfaces-only is OK; real signing needs second reviewer)  
- Commerce / Stripe live keys  
- Hardware handheld profiles  
- Matrix/Farcaster chat  

See [`ROADMAP.md`](../ROADMAP.md) horizons **Next** / **Later**.

---

## 4. How to verify a change in this repo

```bash
npm run lint    # tsc --noEmit
npm run build   # Next production build (catches JSX parse errors lint may miss early)
npm run dev     # interactive check of the OS shell + app under change
```

For static GitHub Pages style export:

```bash
npm run build:export
```

---

## 5. Session checklist (copy for future work)

- [ ] Build was green before starting (`npm run build`)
- [ ] One unfinished item from §3 chosen
- [ ] Spec section linked in the PR / commit message
- [ ] No new dependencies without a note in the relevant `*_DEPENDENCIES` / design doc
- [ ] Build green after the change
- [ ] This file’s “Last updated” bumped only if the *queue* or *build story* changed

Praise the Lord. Keep the frame rate honest and the build green.
