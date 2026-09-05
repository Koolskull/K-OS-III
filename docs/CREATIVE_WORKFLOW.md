# Creative Workflow Bus

**Status:** Implemented (v0)  
**Code:** `src/lib/creative/`

This is the lightweight OS mechanism that lets creative apps share **drawing tools** and **hand assets back and forth** without embedding one app inside another.

---

## Why it exists

SHOTLIST owns mono storyboard plates (480×853).  
KoolDraw owns full sprite layers, animation frames, and the same freehand stack.  

Artists need to:

1. Sketch a plate quickly in SHOTLIST  
2. Jump into the KoolDraw for layers / polish / onion skin  
3. **Return** the plate to the same shot without losing place  

Datamoshpit can keep its local embedded KoolDraw overlay for instrument visuals; the bus is for **windowed** multi-app workflow.

---

## Modules

| Path | Role |
|------|------|
| `src/lib/creative/types.ts` | Session / result / freehand tool ids |
| `src/lib/creative/toolRegistry.ts` | Shared **PEN / HRS / DTH / ERA** definitions (keys + labels) |
| `src/lib/creative/CreativeWorkflow.tsx` | React context: `handoffTo` / `complete` / `cancel` |
| `src/lib/creative/useCanvasViewport.ts` | Shared pan / zoom / rotate gestures |
| `src/lib/creative/pointerMap.ts` | Client → canvas pixel mapping (incl. rotation) |
| `src/lib/drawStamps.ts` | Shared stamp algorithms (pressure, harsh, dither) |
| `src/lib/SpriteUtils.ts` | `loadProjectFromDataUrl`, `dataUrlToMonoDataUrl` |

Shell wiring: `CreativeWorkflowProvider` wraps the desktop in `src/app/page.tsx` and receives `launchApp` so handoffs open/focus the target window.

---

## Handoff API (for app authors)

```ts
const { handoffTo, lastReturn, clearReturn, sessionFor, complete, cancel } =
  useCreativeWorkflow();

// Source app → target
handoffTo({
  sourceApp: "shotlist",
  targetApp: "kooldraw",
  kind: "mono-plate",
  label: "SHOT 3",
  width: 480,
  height: 853,
  dataUrl: platePng,
  mono: true,
  bg: "black",
  ref: { shotId: 3 }, // opaque; returned to you unchanged
});

// Target app (KoolDraw) when done:
complete({ dataUrl, width, height });
// or cancel();

// Source app on focus:
useEffect(() => {
  if (!lastReturn || lastReturn.session.sourceApp !== "shotlist") return;
  // apply lastReturn.result using lastReturn.session.ref
  clearReturn();
}, [lastReturn]);
```

---

## User flow (SHOTLIST ↔ KoolDraw)

1. Select a shot → **KOOL** (or press **S**), or in plate editor **→ KOOL**  
2. KoolDraw opens with the plate loaded (mono-aware)  
3. Yellow bar: **RETURN TO SHOTLIST** / **CANCEL**  
4. On RETURN, mono threshold is applied and the shot thumbnail updates  

Inline mono DRAW (E) still works for quick sketching without leaving SHOTLIST.

---

## Canvas viewport controls (SHOTLIST plate + KoolDraw)

Shared by `useCanvasViewport` + `pointerMap`. Used in the storyboard plate editor and the KoolDraw.

| Control | Action |
|---------|--------|
| **Scroll wheel / trackpad** | Zoom in / out |
| **+/− buttons** | Step zoom |
| **Space + drag** | Pan |
| **Shift + drag** | Rotate canvas |
| **Alt + drag** | Rotate canvas (same as Shift) |
| **Two-finger pinch** | Zoom + rotate |
| **Two-finger tap** | Undo |
| **FIT** (header) / **0** (shot plate) | Reset zoom, pan, and rotation to normal fill view |

### macOS note — no Ctrl for rotate

**Do not use Ctrl+click for rotate.** On macOS, Ctrl+click is the system secondary-click (right-click) and fights the drawing tools. Rotate is **Shift** or **Alt** only. Ctrl/Meta+click is ignored for viewport gestures.

### Implementation notes

- Zoom is applied by changing CSS **width/height**, not `transform: scale`, so hit-testing stays stable.
- Pan + rotate use `transform: translate(...) rotate(...)` with `transform-origin: center`.
- When rotated, pointer mapping inverse-rotates around the visual center using `clientWidth`/`clientHeight` (see `pointerMap.ts`). A wrong inverse previously offset the pen after rotation.

---

## Shared freehand tools

Import `FREEHAND_TOOLS` from `@/lib/creative` instead of re-listing keys:

- **B** PEN — pressure size  
- **K** HRS — harsh carve  
- **D** DTH — dither pencil + pattern + phase  
- **E** ERA — pressure eraser  

Shape tools (fill, line, rect, …) stay app-local.

### Dither patterns (8 total — “opacity” / density variety)

Defined in `src/lib/drawStamps.ts` as `DITHER_PATTERNS`. Pressure still drives brush size and fill threshold within each pattern.

| Id | Label | Feel |
|----|-------|------|
| `bayer8` | B8 | Fine ordered Bayer (default) |
| `bayer4` | B4 | Medium ordered |
| `bayer2` | B2 | Chunky 2×2 |
| `dots` | DOT | Fine stipple / grain |
| `sparse` | SPR | Light wash — few dots until hard pressure |
| `hatch` | HAT | Diagonal lines |
| `hline` | HLN | Horizontal rules |
| `cross` | XHS | Cross-hatch grid |

Phase **OX/OY** still shifts the pattern so layered strokes carve differently.

---

## Adding a new participant

1. Give the app a `CreativeAppId` in `types.ts`  
2. Call `handoffTo` / consume `sessionFor('your-app')`  
3. On complete, write the result into your model via `ref`  
4. Prefer shared stamps from `drawStamps` for freehand  

No new IPC framework — one React context, one session at a time (v0).

---

## Out of scope (later)

- Concurrent multi-handoff queue  
- Binary asset store / IPFS pointers  
- Live co-editing  
- Migrating Datamoshpit embedded KoolDraw onto the bus  

Praise the Lord. Keep the bus thin and the stamps sharp.
