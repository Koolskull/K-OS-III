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
2. Jump into the Sprite Editor for layers / polish / onion skin  
3. **Return** the plate to the same shot without losing place  

Datamoshpit can keep its local embedded KoolDraw overlay for instrument visuals; the bus is for **windowed** multi-app workflow.

---

## Modules

| Path | Role |
|------|------|
| `src/lib/creative/types.ts` | Session / result / freehand tool ids |
| `src/lib/creative/toolRegistry.ts` | Shared **PEN / HRS / DTH / ERA** definitions (keys + labels) |
| `src/lib/creative/CreativeWorkflow.tsx` | React context: `handoffTo` / `complete` / `cancel` |
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

## User flow (SHOTLIST ↔ Sprite Editor)

1. Select a shot → **SPRITE** (or press **S**), or in plate editor **→ SPRITE**  
2. Sprite Editor opens with the plate loaded (mono-aware)  
3. Yellow bar: **RETURN TO SHOTLIST** / **CANCEL**  
4. On RETURN, mono threshold is applied and the shot thumbnail updates  

Inline mono DRAW (E) still works for quick sketching without leaving SHOTLIST.

---

## Shared freehand tools

Import `FREEHAND_TOOLS` from `@/lib/creative` instead of re-listing keys:

- **B** PEN — pressure size  
- **K** HRS — harsh carve  
- **D** DTH — dither pencil + phase  
- **E** ERA — pressure eraser  

Shape tools (fill, line, rect, …) stay app-local.

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
