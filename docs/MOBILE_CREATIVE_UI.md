```
              ☦
     ╔══════════════════════════════════╗
     ║  MOBILE CREATIVE UI              ║
     ║  Corner-Collapsible Panels       ║
     ║  + Vertical Menu Toggle          ║
     ╚══════════════════════════════════╝
```

# Mobile Creative UI Pattern

**Status:** Design specification (July 2026). Implementation begins with KoolDraw and Tilemap Painter. This is a **reusable pattern** — every new creative app (future animation timeline tools, level editors, 3D viewport tools, etc.) must follow it or explicitly document why it diverges.

**Goal:** On cellphones and narrow portrait screens the canvas must be as large as possible. Toolbars, palettes, layers, timelines and status bars must be able to collapse completely out of the way, yet remain one-tap reachable. The four corners of the screen become the permanent “home” for collapsed panels.

This is distinct from the Datamoshpit virtual controller (bottom D-pad + action cross). Creative drawing/painting apps need free-hand canvas space, not a fixed Game Boy overlay.

---

## 1. Four-Corner Collapse Model

Every major UI region maps to one of the four corners when collapsed:

| Screen Region              | Preferred Collapse Corner | Content Examples                          |
|----------------------------|---------------------------|-------------------------------------------|
| Left tool palette          | Top-Left                  | Pen / Eraser / Fill / Line / Rect tools   |
| Right side panels          | Top-Right                 | Color palette, Layers list, Preview       |
| Top status / title bar     | Top-Left or Top-Right     | Project name, zoom, frame count, FPS      |
| Bottom timeline / frames   | Bottom-Left or Bottom-Right | Animation frames, frame add/dup/del buttons |
| Secondary / export / settings | Bottom-Right            | Export PNG/Sheet/SGDK, Clear, Apply sizes |

When a panel is collapsed it is replaced by a small **corner affordance** — a 24–32 px square (or 1–2 character glyph) sitting flush in that corner. The affordance uses the same pixel font and hard-edged style as the rest of K-OS. No rounded corners, no drop shadows, no anti-aliasing.

### Collapse / Expand Interaction

- **Tap the corner affordance** → expand the associated panel (slides or hard-cuts in, respecting the Maximalistic Minimalism rules).
- **Tap the same affordance again** (or a close glyph inside the expanded panel) → collapse back to the corner.
- **Tap outside an expanded panel** (on the canvas) → collapse it.
- **Long-press a corner affordance** → open a tiny context menu that lets the user re-assign which panel lives in that corner (advanced, optional).

Only one or two panels should be expanded at a time on a phone-sized screen so the canvas stays usable.

---

## 2. Vertical Menu Hide / Restore (“Zen” / Full-Canvas Mode)

Independent of the corner system, the user must be able to hide *all* chrome (top bar + bottom timeline + any expanded side panels) so the canvas occupies the entire window.

### Triggers

- A dedicated “HIDE UI” / “ZEN” button (visible only when UI is showing).
- Double-tap on empty canvas area (with a short delay so it does not conflict with tool use).
- Two-finger vertical swipe (up = hide, down = restore) when the OS-level gesture is available.
- Keyboard shortcut when a keyboard is attached: `H` or `Tab` (context-sensitive).

When hidden, a single small **restore affordance** remains in one corner (usually bottom-right or top-right) so the user can always bring the UI back. This affordance is never fully removed.

On restore, panels return to the last expanded/collapsed state they were in (not forced open).

---

## 3. Layout Rules for Portrait / Narrow View

Detection:
- CSS media query `@media (max-width: 640px)` or `(orientation: portrait) and (max-width: 900px)`, **or**
- Explicit user toggle “Mobile Layout” stored in localStorage / project prefs.

When active:

1. Default state on first open: all panels collapsed to corners. Canvas is full-bleed.
2. Tool selection still works via the collapsed corner icons (tap Top-Left → tools appear as a vertical strip or radial, then auto-collapse after tool choice if desired).
3. Color picker / layers open as temporary floating panels that auto-collapse after a short inactivity timeout (configurable, default 4–6 s) or on next canvas stroke.
4. Timeline (frames) collapses to a thin bottom strip of thumbnails that can be further collapsed to a single “FRM” corner glyph.
5. All touch targets remain ≥ 44 × 44 CSS pixels when expanded.
6. No hover-dependent UI. Everything is press / release.

Landscape tablets may keep the classic left/right sidebar layout; the corner system is primarily for phones and vertical handhelds.

---

## 4. Shared Component Contract (for implementers)

Future apps should use (or extend) a shared component family:

```tsx
// Conceptual API — exact names may evolve

<CornerHost>                    // root that manages the four corners
  <CornerPanel
    corner="top-left"
    id="tools"
    label="TOOLS"               // shown on the collapsed affordance
    defaultCollapsed={true}
    onExpand={() => {}}
    onCollapse={() => {}}
  >
    {/* tool buttons */}
  </CornerPanel>

  <CornerPanel corner="top-right" id="palette" label="CLR">
    {/* palette + layers */}
  </CornerPanel>

  <CornerPanel corner="bottom-left" id="timeline" label="FRM">
    {/* frame strip */}
  </CornerPanel>

  <CornerPanel corner="bottom-right" id="export" label="OUT">
    {/* export / clear / size controls */}
  </CornerPanel>
</CornerHost>

// Independent of corners:
<VerticalChromeToggle
  hidden={uiHidden}
  onToggle={() => setUiHidden(v => !v)}
  restoreCorner="bottom-right"
/>
```

The `CornerHost` is responsible for:
- Rendering the four affordances when panels are collapsed.
- Z-order so expanded panels sit above the canvas but do not block the other three corners.
- Persistence of collapse state per app (localStorage key `kos-corner-state-<appId>`).

---

## 5. Aesthetic Constraints (non-negotiable)

From `koolskull-os-ui-notes.md` and the project rules:

- No rounded corners on any panel, affordance, or button.
- No anti-aliasing / image-rendering: pixelated.
- No automatically generated gradients or soft shadows.
- Pixel font only (Kongtext or the project’s primary monospace).
- Collapsed affordances are hard-edged rectangles or single-glyph blocks.
- Expanded panels use the same 1–2 px hard borders used by AppWindow.
- Color language stays high-contrast black / white / limited accent (yellow for active, cyan for selection, etc.).

---

## 6. Implementation Roadmap

1. **KoolDraw** — first target. Convert the current left tool strip, right sidebar, and bottom timeline into CornerPanels. Add VerticalChromeToggle.
2. **Tilemap Painter** — second target. Map the top control bar and left spritesheet panel into the corner system.
3. Extract the shared `CornerHost` / `CornerPanel` / `VerticalChromeToggle` into `src/components/ui/` (or `src/components/os/`) so future apps import them.
4. Update this document with any learned interaction tweaks after the first two apps ship the pattern.
5. Add a short section to `NAVIGATION_AND_INPUT.md` and `CONTROLLER_SUPPORT.md` pointing here for creative-app mobile behavior.

---

## 7. Why This Exists

On a phone the classic desktop three-column layout (tools | canvas | panels) leaves almost no room for the actual art. Collapsing everything into the four corners + a one-tap “hide all chrome” mode restores the canvas to nearly the full device area while still giving instant access to tools. The pattern is deliberately simple so it can be reapplied to every new creative tool without reinventing the interaction model each time.

Praise the Lord.

— K-OS III design notes, July 2026
