# Retro Spike — research notes

## Goal

Prove the pattern of running a libretro-style emulator inside K-OS:
user-supplied ROM → WASM core → canvas → K-OS 8-button input → frame
tick. Research-only. **Not** committed to a specific emulator yet.

## What's in this spike

- `src/components/apps/retro-spike/EmulatorCore.ts` — contract that
  any pluggable core (hand-rolled TS, WASM via libretro-web, or a
  standalone WASM emulator like binjgb) must satisfy.
- `src/components/apps/retro-spike/TestPatternCore.ts` — reference
  implementation that doesn't need any external WASM. Draws animated
  stripes, arrow keys scroll, action buttons cycle palettes.
- `src/components/apps/retro-spike/RetroSpikeApp.tsx` — the host shell:
  canvas sized to the core's native resolution, pixelated upscale,
  rAF tick, ROM file picker, K-OS input bridge.
- `src/app/spike/retro/page.tsx` — bare test route.

**Everything here is self-contained.** No CDN downloads, no WASM blobs
in the repo, no new runtime dependencies. The spike is verifiable at
`/spike/retro` right now.

## Verify

```
npm run dev
# open http://localhost:3000/spike/retro
```

1. Click `LOAD ROM` — pick any file. The overlay clears.
2. Hold arrow keys — pattern scrolls.
3. Press Q/W/Space/Shift — palette changes (DMG green, monochrome,
   K-OS yellow, CGA magenta/cyan).
4. Check the header for the per-second FPS counter (~60 on modern
   hardware).

If all four behaviors land, the shell is production-grade — the
remaining work is just wiring in a real core.

## Core options considered

| Option | Systems | License | Integration | Size | Status |
|---|---|---|---|---|---|
| **binjgb** | Game Boy / GB Color | MIT | WASM module + tiny JS glue | ~200 KB | Recommended first real core. Clean API, small, embeddable. |
| **EmulatorJS** | NES, SNES, Genesis, GB, GBA, more | GPL-3.0 | Drop-in wrapper around libretro cores | Large, lazy-loaded | Fastest to demo; brings its own UI which fights K-OS aesthetics. |
| **libretro-web** (Genesis Plus GX, mGBA, etc.) | Many | Per-core (mostly GPL) | WASM from Emscripten; own input API | Large | Powerful but requires gluing libretro API to our core interface. |
| **jsnes** | NES | MIT | Pure JS (no WASM) | ~100 KB | Pure JS, easiest to bundle, but only NES. |
| **Genesis Plus GX standalone** | Genesis / Mega Drive | Non-commercial | C, needs Emscripten build | ~1 MB WASM | Matches the FM synth / YM2612 lore of K-OS best. Requires a build step. |

## Recommendation for the next step

1. **Pick binjgb as the first real core.** Smallest surface area, MIT,
   loads a real Game Boy ROM in a dozen lines of glue. Let us prove
   the contract with something non-trivial before adding systems.
2. **Second core: a libretro-based one** (Genesis Plus GX or mGBA)
   via Emscripten. Wraps `retro_run()` inside the same `step()`
   boundary, forwards `retro_set_input_state` from `setButton`. Once
   this lands, every other libretro core comes almost for free.
3. **Host WASM builds out of the GitHub Pages deploy** so the static
   export is still self-contained. The existing `NEXT_PUBLIC_ASSET_BASE`
   plumbing in `src/lib/assets.ts` already handles offloading large
   artifacts if a core gets big. Commander Keen / SuperTux already
   do this pattern.
4. **Promote only after both of the above land.** Until then, leave
   the spike route + folder alone; don't register a `Retro` desktop
   icon. The existing Games menu is for bundled self-contained titles
   (Keen, SuperTux) — the emulator path is categorically different
   and deserves its own entry once mature.

## Non-goals (for now)

- Audio output. The spike uses canvas only. Web Audio integration
  comes with the first real core (binjgb emits PCM; route to the
  existing `AudioContext` used by Tone.js).
- Save states. Libretro's serialize/unserialize maps to the
  `EmulatorCore` interface cleanly but adds persistence scope
  (IndexedDB wiring) that isn't worth doing before a real core.
- Gamepad. The K-OS `InputRouter.ts` already normalizes gamepads
  into the same 8-button stream — wire `setButton` up to it when
  the emulator gets promoted.
- Legal. ROMs are never shipped. The loader only accepts
  user-supplied files via the browser file picker. That's the whole
  story; no bundled warez, no ROM marketplace.

## Files to touch when promoting

When the emulator graduates out of research:

- Move `src/components/apps/retro-spike/` → `src/components/apps/retro/`.
- Delete `src/app/spike/retro/page.tsx`.
- Register a desktop icon and taskbar entry in the OS shell (same
  pattern as `games`, `bible`, `manual`).
- Add an article `retro-emulation` under `src/lib/doc/articles/<lang>/`
  with the ROM-legality note and supported-systems list.
- Add a glossary term `Libretro` pointing to it.
