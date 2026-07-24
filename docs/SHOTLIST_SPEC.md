# SHOTLIST — Sequencing / Storyboard / X-Sheet Spec

**Status:** Design document. Offline MVP first. Wallet / multi-party approval is a documented future goal, not a blocker.

This is the production-oriented sequencing engine for K-OS III. It sits beside Datamoshpit rather than inside it, while remaining tightly coupled. UI and input model stay faithful to Datamoshpit (keyboard-first, pixel-correct, Slimentologika where numbers appear) and to the Mobile Creative UI pattern (CornerChrome + VerticalChromeToggle).

---

## 1. Why this exists

Datamoshpit is excellent at music + per-instrument visuals. Professional animation and show-running need something different:

- A storyboard / shot-list view of the whole piece
- Collapsible frame-by-frame X-sheets at 24 fps inside each shot
- Quick thumbnail + description capture, then progressive detail
- Audio-timed notes
- A clean path from placeholder → versioned finals → team sign-off

SHOTLIST is that tool. Offline-first. Local files. No accounts required for core use.

---

## 2. Hierarchy (mirrors Datamoshpit)

Exactly parallel to Song → Chain → Phrase:

```
Sequence / Storyboard          ← like Song
  └── Shot                     ← like Chain
        ├── Thumbnail + basic description
        ├── Duration (frames or seconds @ 24 fps)
        ├── Audio timing / sync notes
        └── X-Sheet            ← like Phrase (expandable)
              └── Frame[] @ 24 fps
                    (exposure, action, dialogue, camera,
                     audio cue, sprite/asset ref, notes)
```

### Sequence
Top-level document. Can be created empty or seeded from a Datamoshpit project (selected channels / phrases mapped onto shots or used as audio reference).

### Shot
- Quick-created with a thumbnail (generated snapshot or assigned sprite) + short descriptive text.
- Holds overall duration and high-level audio timing notes.
- Expandable to reveal its internal X-Sheet.
- Carries version / status placeholders for later approval work.

### X-Sheet (inside Shot)
Frame-accurate breakdown at **24 frames per second**.
Each frame can contain:
- Exposure / hold count
- Action description
- Dialogue
- Camera notes
- Audio cue / timing mark relative to soundtrack
- Sprite or asset reference (links to Sprite Editor / KoolDraw)
- Free-form production notes

This is the collapsible “detail” level the user expands only when needed.

---

## 3. Core offline workflow

1. **Create Shot** → generate or assign thumbnail + write basic description. Done in seconds.
2. **Set length** → open the Shot and define duration on the 24 fps timeline.
3. **Detail the X-Sheet** → expand and fill frame-by-frame notes, especially audio timing.
4. **Assign / update assets** → link sprites or final renders; use the same template across versions.
5. **Iterate** until the team is ready to sign off.

All of the above is 100 % local. No network, no wallets, no accounts.

---

## 4. UI & Input principles

- **Keyboard-first**, identical conventions to Datamoshpit (arrows, Q+arrows for values, Shift+arrows for screens, etc.).
- **Collapsible** exactly like phrases inside chains: Shot list is the default view; expand a Shot to work its X-Sheet.
- **Mobile / tablet**: full CornerChrome + VerticalChrome / “Zen” mode from `docs/MOBILE_CREATIVE_UI.md`. Quick-action tabs for repeated tasks (duplicate frame, set duration, insert, etc.).
- Aesthetic rules are non-negotiable: no rounded corners, no anti-aliasing, pixel fonts, hard edges, Slimentologika where numbers appear.

Possible internal screens (navigated like Datamoshpit’s ScreenMap):
- Sequence (shot list / storyboard grid)
- Shot Detail (thumbnail, description, duration, audio notes)
- X-Sheet (frame grid or list)
- Library / Assets
- Export

---

## 5. Sprite Editor round-trip

From any frame or Shot thumbnail:
- Open the linked sprite in KoolDraw (Sprite Editor).
- Sprite Editor shows a **“Return to Shot List”** button when launched in this context.
- On return: save the sprite, update the reference in SHOTLIST, restore focus and scroll position.

Requires a lightweight caller-context mechanism in the OS shell (simple event / shared state). No heavy IPC needed for v0.

---

## 6. File format & Datamoshpit interop

- New extension proposed: `.k3shot` (or an extension block inside the future `.k3proj`).
- Can open / reference Datamoshpit project files for audio timeline and visual mapping.
- Assets (sprites, images) stored by relative path or embedded binary for portability.
- Version field for future migration.

Exact schema will be finalized in implementation; the hierarchy above is the source of truth.

---

## 7. Future goal — Wallet-based multi-party approval

**Documented now so it is never lost. Built after the offline core is solid.**

- Team members stay up-to-date on shot / X-sheet / final-asset status.
- Designated director, producer, or investor accounts (via K-Wallet) can place checkmarks / signed approvals on specific shots, X-sheets, or files.
- Versioned assets with cryptographic approval states.
- Everyone on the project sees the current sign-off status.

This maps onto existing K-Wallet and PRODEV plans. It is explicitly **not** required for the offline MVP. It must appear in the project README and ROADMAP as a near-term goal once the local application is working.

---

## 8. Implementation phases

### Phase 0 — Spec + Scaffold (this document)
- `docs/SHOTLIST_SPEC.md` (done)
- Scaffold `src/components/apps/shotlist/`
- Register desktop icon and AppId in Desktop.tsx + page.tsx
- Basic empty window that respects CornerChrome

### Phase 1 — Offline MVP
- Sequence view of Shots (thumbnail + description + duration)
- Expand Shot → 24 fps X-Sheet editor
- Quick thumbnail creation / assignment
- Basic audio-timing notes
- Sprite assignment + round-trip to Sprite Editor
- Full keyboard model + mobile CornerChrome

### Phase 2 — Production polish
- Export shot list / X-sheet (CSV, Markdown, printable layout)
- Stronger Datamoshpit import / audio reference
- Versioned asset slots against the same template

### Phase 3 — Wallet / multi-user approvals
- After offline core is stable
- Checkmarks, signed status, team visibility
- Documented in README / ROADMAP from day one

---

## 9. Open questions (decide during Phase 0/1)

1. Default name on the desktop: **SHOTLIST**, **XSHEET**, **K-SEQ**, or other?
2. Exact thumbnail generation method (canvas snapshot from Sprite Editor, simple solid + text, or user-supplied image)?
3. Should the X-Sheet support multiple layers / levels per frame from day one, or start single-layer and expand later?
4. How tightly should a Sequence share its audio clock with an open Datamoshpit project (shared tick vs independent)?
5. File extension and whether it lives inside or beside the tracker project format.

---

## 10. References

- Datamoshpit hierarchy & input: `CLAUDE.datamoshpit.md`, `src/types/tracker.ts`
- Mobile creative UI: `docs/MOBILE_CREATIVE_UI.md`
- Video / visual layer plans: `docs/DATAMOSHPIT_VIDEO_SPEC.md`
- Sprite data model: `src/types/sprite.ts`
- Wallet plans (future): `docs/K_WALLET_SPEC.md`, `docs/COMMERCE_SPEC.md`

Praise the Lord.

— K-OS III design notes, July 2026
