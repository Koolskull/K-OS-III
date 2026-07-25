# SHOTLIST — Sequencing / Storyboard / X-Sheet Spec

**Status:** Design document. Offline MVP first. Wallet / multi-party approval is a documented future goal, not a blocker.

This is the production-oriented sequencing engine for K-OS III. It sits beside Datamoshpit rather than inside it, while remaining tightly coupled. UI and input model stay faithful to Datamoshpit (keyboard-first, pixel-correct, Slimentologika where numbers appear) and to the Mobile Creative UI pattern (CornerChrome + VerticalChromeToggle).

---

## 1. Why this exists

Datamoshpit is excellent at music + per-instrument visuals. Professional animation and show-running need something different:

- A storyboard / shot-list view of the whole piece
- Collapsible frame-by-frame X-sheets at 24 fps inside each shot
- **Variable length per shot** (any frame count at 24 fps)
- Quick thumbnail + description capture, then progressive detail
- Audio-timed notes
- Printable monochrome production documents for storyboards, scripts, and animator X-sheets
- A clean path from placeholder → versioned finals → team sign-off

SHOTLIST is that tool. Offline-first. Local files. No accounts required for core use.

---

## 2. Hierarchy (mirrors Datamoshpit)

Exactly parallel to Song → Chain → Phrase:

```
Sequence / Storyboard          ← like Song
  └── Shot                     ← like Chain
        ├── Thumbnail + basic description
        ├── Duration (variable frames @ 24 fps)
        ├── Audio timing / sync notes
        └── X-Sheet            ← like Phrase (expandable)
              └── Frame[] @ 24 fps
                    (exposure, action, dialogue, camera,
                     audio cue, sprite/asset ref, notes)
```

### Sequence
Top-level document. Can be created empty or seeded from a Datamoshpit project (selected channels / phrases mapped onto shots or used as audio reference).

### Shot — variable length
- Quick-created with a thumbnail (generated snapshot or assigned sprite) + short descriptive text.
- **Each shot has its own duration in frames at 24 fps** (not a fixed grid). A shot may be 12 frames (½ s), 24 frames (1 s), 72 frames (3 s), or any positive integer. Duration is editable after creation.
- High-level audio timing notes for the whole shot.
- Expandable to reveal its internal X-Sheet.
- Carries version / status placeholders for later approval work.

### X-Sheet (inside Shot)
Frame-accurate breakdown at **24 frames per second**.
The X-Sheet length tracks (or is derived from) the shot’s `durationFrames`. Individual rows can still use exposure/hold counts so a 72-frame shot does not require 72 unique drawings.

Each frame can contain:
- Exposure / hold count
- Action description
- Dialogue
- Camera notes
- Audio cue / timing mark relative to soundtrack
- Sprite or asset reference (links to KoolDraw)
- Free-form production notes

This is the collapsible “detail” level the user expands only when needed.

---

## 3. Core offline workflow

1. **Create Shot** → generate or assign thumbnail + write basic description. Done in seconds.
2. **Set length** → open the Shot and set `durationFrames` (any positive integer @ 24 fps).
3. **Detail the X-Sheet** → expand and fill frame-by-frame notes, especially audio timing.
4. **Assign / update assets** → link sprites or final renders; use the same template across versions.
5. **Export for production** → printable mono documents (see §7).
6. **Iterate** until the team is ready to sign off.

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

## 5. KoolDraw round-trip

From any frame or Shot thumbnail:
- Open the linked sprite in KoolDraw.
- KoolDraw shows a **“Return to Shot List”** button when launched in this context.
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

## 7. Printable production exports (monochrome)

**Target raster size:** **3840 × 4969** pixels, **monochromatic** (1-bit or pure black/white grayscale), optimized for black-and-white printers and high-resolution print workflows.

Aspect is portrait (~0.77), suitable for letter/A-series style production pages at high DPI when downsampled or printed at native resolution.

### Export modes

| Mode | Audience | Contents |
|------|----------|----------|
| **Storyboard + script** | Directors, writers, producers | Shot thumbnails in order, shot numbers, duration (frames + time @ 24 fps), description, dialogue/script lines, high-level audio notes |
| **X-Sheet (animator)** | Animators, cleanup, in-betweeners | Classic exposure-sheet layout per shot: frame column, exposure/hold, action, dialogue, camera, audio cues, asset refs; multi-page if the shot is long |

### Requirements

- Fully offline generation (canvas → PNG, and/or PDF when practical).
- Pure mono: no grayscale gradients required; high-contrast black ink on white for cheap B&W laser/inkjet.
- Multiple shots can paginate across pages; each page still targets the 3840×4969 canvas (or PDF page mapped to that pixel ratio).
- Optional: CSV / Markdown text exports for the same data (Phase 2 companion formats).

### Implementation notes (Phase 2)

- Render via offscreen `<canvas>` at 3840×4969, then `toBlob` / download PNG (and PDF via a small pure-JS writer or print CSS if preferred later).
- Thumbnails dithered or thresholded to mono so the page stays printer-friendly.
- X-sheet grid lines and labels use hard pixel edges (project aesthetic).

---

## 8. Future goal — Wallet-based multi-party approval

**Documented now so it is never lost. Built after the offline core is solid.**

- Team members stay up-to-date on shot / X-sheet / final-asset status.
- Designated director, producer, or investor accounts (via K-Wallet) can place checkmarks / signed approvals on specific shots, X-sheets, or files.
- Versioned assets with cryptographic approval states.
- Everyone on the project sees the current sign-off status.

This maps onto existing K-Wallet and PRODEV plans. It is explicitly **not** required for the offline MVP. It must appear in the project README and ROADMAP as a near-term goal once the local application is working.

---

## 9. Implementation phases

### Phase 0 — Spec + Scaffold
- `docs/SHOTLIST_SPEC.md` (done)
- Scaffold `src/components/apps/shotlist/` (done)
- Register desktop icon and AppId (done)
- Basic empty window + variable-duration shot fields + CornerChrome (done)

### Phase 0.5 — Mono shot plate (landed)
Every shot starts on a monochrome thumbnail plate — **portrait 480×853** or **landscape 853×480** (chosen with plate color at create).

- **Start orientation + color:** portrait/landscape and black/white (new-shot prompt)
- **Flow:** draw first, then fill metadata (below canvas on mobile, beside on desktop). Corner menus: ACT / ? / INFO / ZEN.
- **Ink:** black or white only (no gray)
- **Tools** (shared `src/lib/drawStamps.ts` + `monoDraw.ts` / `ShotCanvas.tsx`):
  - **HARSH** — solid hard disk; pressure only widens slightly. Fast carve / sketch.
  - **PEN** — solid B/W; **pressure → brush size**. Stylus preferred; mouse/touch get a default.
  - **DITHER** — Bayer 8×8; **pressure → density + size**; **OX/OY phase**.
- Plate PNG is the shot `thumbnail` data-URL at `plateW`×`plateH`.
- **Optional size upgrade** (only after first committed thumbnail save / sprite return):
  - **HD** 1920×1080
  - **4K** 3840×2160  
  Letterboxed nearest-neighbor mono upscale from the thumbnail. UI: **HD/4K** / **U**.
- Keys: `1/H` harsh · `2/B` pen · `3/D` dither · `X` ink · phase keys · `⌘Z` · `Enter` save · `Esc`
- Viewport (desktop): **scroll** zoom · **Space+drag** pan · **Shift/Alt+drag** rotate (never Ctrl — macOS right-click). See [`CREATIVE_WORKFLOW.md`](./CREATIVE_WORKFLOW.md) § Canvas viewport controls.

### Phase 0.6 — Cross-app workflow (landed)
KoolDraw round-trip via the **Creative Workflow Bus** — see [`CREATIVE_WORKFLOW.md`](./CREATIVE_WORKFLOW.md):

- **S** / **KOOL** / plate **→ KOOL** hands the plate to KoolDraw  
- KoolDraw yellow bar: **RETURN TO SHOTLIST** (mono threshold on return)  
- Shared freehand registry: `FREEHAND_TOOLS` in `@/lib/creative`

### Phase 1 — Offline MVP
- Sequence view of Shots (thumbnail + description + **variable duration**) — *list + plate draw: done*
- Expand Shot → 24 fps X-Sheet editor (frame rows driven by duration / exposures)
- Quick thumbnail creation / assignment — *inline mono + KoolDraw round-trip: done*
- Basic audio-timing notes
- Sprite assignment + round-trip to KoolDraw
- Full keyboard model + mobile CornerChrome

### Phase 2 — Production polish + print export
- **3840×4969 monochrome printable exports**
  - Storyboard + script layout
  - Animator X-sheet layout
- CSV / Markdown companions
- Stronger Datamoshpit import / audio reference
- Versioned asset slots against the same template

### Phase 3 — Wallet / multi-user approvals
- After offline core is stable
- Checkmarks, signed status, team visibility
- Documented in README / ROADMAP from day one

---

## 10. Open questions (decide during Phase 0/1)

1. Default name on the desktop: **SHOTLIST** (current), or rename later?
2. Exact thumbnail generation method (canvas snapshot from KoolDraw, simple solid + text, or user-supplied image)?
3. Should the X-Sheet support multiple layers / levels per frame from day one, or start single-layer and expand later?
4. How tightly should a Sequence share its audio clock with an open Datamoshpit project (shared tick vs independent)?
5. File extension and whether it lives inside or beside the tracker project format.
6. Print export: PNG only first, or PNG + PDF in the same Phase 2 pass?
7. Multi-shot vs single-shot pages — default pagination rule for long sequences?

---

## 11. References

- Datamoshpit hierarchy & input: `CLAUDE.datamoshpit.md`, `src/types/tracker.ts`
- Mobile creative UI: `docs/MOBILE_CREATIVE_UI.md`
- Video / visual layer plans: `docs/DATAMOSHPIT_VIDEO_SPEC.md`
- Sprite data model: `src/types/sprite.ts`
- Wallet plans (future): `docs/K_WALLET_SPEC.md`, `docs/COMMERCE_SPEC.md`

Praise the Lord.

— K-OS III design notes, July 2026
