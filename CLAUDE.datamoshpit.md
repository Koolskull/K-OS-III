# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What This Is

Datamoshpit is a web-based music tracker (like LSDj/LGPT/FastTracker) built as part of KOOLSKULL OS. It runs in the browser targeting everything from Miyoo Mini handhelds to 4K displays, with plans for DDR cabinet integration. The interface uses a custom base-16 symbolic number system called **Slimentologika** (16 pixel-art glyphs replacing hex digits 0–F).

## Commands

```bash
npm run dev        # Start dev server (Turbopack)
npm run build      # Production build
npm run start      # Serve production build
npm run lint       # Next.js linter
```

No test suite is configured.

## Architecture

**Framework**: Next.js 16 (App Router) + React 18 + TypeScript + Tailwind CSS 4

### Data Flow

All tracker state lives in `src/app/page.tsx` as top-level `useState` hooks. Props drill down to child components; callbacks bubble changes back up. No Redux/Zustand/Context — this is intentional.

### Core Data Model (Song → Chain → Phrase → Table)

Defined in `src/types/tracker.ts`. This is the classic tracker hierarchy:
- **Song**: 256 rows × 8 channels of chain references, plus BPM/TPB
- **Chain**: 16-step sequence of phrase references with transpose
- **Phrase**: 2–256 rows (default 16) of note/instrument/2 effects per row
- **Table**: 16-row looping subroutine of effects per tick
- **Instrument**: Synth, sample, or FM (YM2612-style 4-operator) with macro controllers

### Input System

`src/lib/InputRouter.ts` — singleton that normalizes keyboard into a unified `InputAction` stream. Modeled after LSDj/LGPT/PicoTracker's Game Boy-style controls:
- **Plain arrows** = cursor movement
- **Shift + arrows** = screen navigation
- **Q + arrows** = value editing
- **Shift + W + arrows** = dual-variable control (context-sensitive per screen)

The Live screen (`LivePads.tsx`) uses capture-phase keyboard listeners with `stopPropagation` to intercept piano keys before InputRouter.

### Audio Engine

`src/engine/` uses Tone.js. Three layers:
- `AudioEngine.ts` — singleton, master gain, per-channel Tone.Channel mixer
- `FMSynth.ts` — YM2612-inspired 4-operator FM voice wrapping Tone.FMSynth
- `TrackerEngine.ts` — main sequencer, resolves Song→Chain→Phrase→Table per tick
- `ProjectFactory.ts` — creates blank projects with 4 default FM instruments

### Screen System

8 screens arranged in a 3×5 spatial grid (navigated with Shift+Arrows). Defined in `src/components/os/ScreenMap.tsx`:
```
[preferences]  [    ]  [    ]  [    ]  [     ]
[project    ]  [    ]  [live]  [    ]  [     ]
[song       ]  [chain] [phrase] [inst] [table]
```

### Slimentologika Display

`src/components/ui/SlimeDigit.tsx` renders numbers as either hex text or sprite sequences (16 PNG glyphs in `/public/sprites/ST0.png`–`STF.png`). Toggle between modes with Tab key. `DisplayMode` type is `"hex" | "slime"`.

**Orientation rule**: When elements are laid out horizontally, digits stack vertically. When vertical, digits go side-by-side. This is a universal standard across all KOOLSKULL OS interfaces.

## Styling Conventions

- **No rounded corners** — enforced globally with `border-radius: 0 !important`
- **No anti-aliasing** — `image-rendering: pixelated`, `-webkit-font-smoothing: none`
- **Inline styles** for dynamic colors (`backgroundColor`, `borderColor`, `color`) alongside Tailwind utility classes
- **CSS variables** prefixed `--dm-` (e.g., `--dm-font-primary`, `--dm-scale`, `--dm-slime-size`)
- **CSS classes** prefixed `dm-` (e.g., `dm-scale-2x`, `dm-font-cycle`)
- **Responsive scaling** via `transform: scale()` at media query breakpoints in `globals.css`: tiny (<480px), base, 2x (1280px+), 3x (2560px+), 4x (3840px+)
- **Primary font**: kongtext (pixel bitmap) at base resolutions, Sometype Mono at HD (1280px+)

## Key Conventions

- All components use `"use client"` directive (client-side rendering throughout)
- ASCII art block comments with religious/medieval themes are part of the project's identity — preserve them
- The `@/*` path alias maps to `./src/*`
- The phrase editor uses FastTracker-style centered-cursor scrolling (cursor stays at viewport center, rows scroll via CSS `translateY`)
- Effect commands are 2-char codes (see `docs/COMMANDS.md`)
- `docs/` contains detailed specifications: navigation, commands, controller support, groove/timing, sound engines, and the Slimentologika guide
