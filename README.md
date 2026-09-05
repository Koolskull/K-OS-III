# K-OS III

> **🟡 EARLY BETA — `0.2.0-beta.1`.** Working, buildable, but rough. Datamoshpit's tracker, KoolDraw, and per-instrument visual system are in. **New in this update:** dual-plane Tilemap Painter (with SGDK export) and a lightweight Mega Drive / Genesis emulator. Save format may still break before `0.3`. Save your projects locally and don't ship anything you can't afford to lose.

**A fake operating system that runs in your browser and actually makes music, art, and on-chain work.** Built for Ethereum developers, artists, and makers — first.

> **Who this is for, in priority order:** Ethereum / EVM developers first, then tracker and chiptune musicians, pixel artists, handheld Linux tinkerers, privacy-curious builders, and Christian creatives. This ordering is deliberate — see [`VISION.md`](./VISION.md).

[![Next.js](https://img.shields.io/badge/Next.js-16-black?logo=next.js)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-strict-blue?logo=typescript)](https://www.typescriptlang.org/)
[![Tone.js](https://img.shields.io/badge/Audio-Tone.js-orange)](https://tonejs.github.io/)
[![License: TBD](https://img.shields.io/badge/license-TBD-lightgrey)](./LICENSE)
[![Built with Claude Code](https://img.shields.io/badge/built%20with-Claude%20Code-8A2BE2)](https://claude.com/claude-code)

## Screenshots

| Boot sequence | Datamoshpit (Phrase) | KoolDraw | Desktop |
|---|---|---|---|
| ![boot](./public/screenshots/boot.png) | ![datamoshpit](./public/screenshots/datamoshpit-phrase.png) | ![sprite](./public/screenshots/sprite-editor.png) | ![desktop](./public/screenshots/desktop.png) |

> Placeholders. See [`public/screenshots/README.md`](./public/screenshots/README.md) for what each shot should capture and how to contribute one.

## Try it in 30 seconds

```bash
git clone https://github.com/Koolskull/K-OS-III.git
cd K-OS-III
npm install --legacy-peer-deps
npm run dev
```

Open `http://localhost:3000` — the boot sequence runs, the desktop loads, double-click an app icon. That's it.

Live demo: `[DEMO_URL]` *(coming soon — this is a placeholder until the deploy lands; see `docs/SEED_ISSUES.md`)*.

---

```
                              ☦

              ╔══════════════════════════════╗
              ║                              ║
              ║      K-OS III                ║
              ║      KOOLSKULL OS            ║
              ║                              ║
              ║   A 2KOOL PRODUCTIONS TOOL   ║
              ║                              ║
              ╚══════════════════════════════╝

     ┌──────────────────────────────────────────┐
     │                                          │
     │   ††† PRAISE THE LORD JESUS †††          │
     │                                          │
     │   "Non nobis, Domine, non nobis,         │
     │    sed nomini tuo da gloriam."           │
     │                                          │
     └──────────────────────────────────────────┘
```

# K-OS III — KOOLSKULL OPERATING SYSTEM

**A web-based operating system for media production.**

K-OS III is a desktop environment that runs in your browser. It boots with a terminal scroll of the Holy Rosary and Psalms, then presents a desktop with icons, a taskbar, and draggable windows — each running a different app. No installs, no accounts, no nonsense.

---

## Table of Contents

- [Who This Is For](#who-this-is-for)
- [Getting Started](#getting-started)
- [Apps Overview](#apps-overview)
- [Datamoshpit](#datamoshpit)
- [Other Apps](#other-apps)
- [Recent Additions](#recent-additions-july-2026)
- [Input Devices](#input-devices)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [The Rules](#the-rules)
- [How We Write](#how-we-write)
- [Detailed Documentation](#detailed-documentation)
- [Who Made This](#who-made-this)

---

## Who This Is For

K-OS III is for people who want to make things on their own machine, without a platform sitting in between them and the work. In priority order, the people who get the most out of this project are:

- **Tracker heads and chiptune people** — LSDJ, LGPT, Renoise, Furnace, Polyend Tracker. Datamoshpit is built in this lineage.
- **Pixel artists and animators** who want KoolDraw animation tools that respect 1px-per-pixel rendering.
- **Handheld gamers and Linux tinkerers** — Miyoo Mini, Anbernic, Steam Deck, anything with a small screen and arrow keys.
- **Christian creatives** who appreciate that the project is openly devotional in its identity, and who don't have to apologize for being so themselves.
- **Ethereum / EVM developers** — see [`VISION.md`](./VISION.md) for the priority builder audience and what the contribution surface looks like for you specifically.
- **Anyone sick of Figma and rented creative software** who wants tools they actually own.

If you want to know more about *why* the project is shaped this way, [`VISION.md`](./VISION.md) is the long-form answer.

---

## Getting Started

You need [Node.js](https://nodejs.org/) (v18 or higher) installed.

```bash
git clone https://github.com/Koolskull/K-OS-III.git
cd K-OS-III
npm install --legacy-peer-deps
npm run dev
```

Open **http://localhost:3000** in your browser. The boot sequence scrolls, then the desktop loads. Double-click any icon to launch an app.

That's it. You're in.

---

## Apps Overview

| App | What It Does |
|-----|-------------|
| **DATAMOSHPIT** | Music tracker — make beats, melodies, full songs |
| **KOOLDRAW** | Pixel art and animation tool |
| **TILEMAP** | Dual-plane tilemap painter for Genesis-style levels + SGDK export |
| **HOLY BIBLE** | King James Bible reader with highlights and notes |
| **GAMES** | Open-source arcade cabinet (Commander Keen + Mega Drive emulator) |

Each app opens in its own draggable, resizable window on the desktop. You can run multiple apps at once.

---

## Datamoshpit

Datamoshpit is the OS's flagship app — an 8-channel music tracker (Pulse / Wave / Noise / FM-YM2612 / Sample) with phrases, chains, songs, tables, grooves, Silmentologika base-16 glyphs, and LGPT-style controls. Five engines, eight channels, and an input model so minimal you can drive the whole thing from a Game Boy D-pad.

If you've used a tracker before — LSDJ, LGPT, Renoise, Furnace — Datamoshpit will feel familiar fast. If you haven't, the **full beginner's guide** walks you from "what is a tracker" to "you just wrote music":

→ [`docs/DATAMOSHPIT_GUIDE.md`](./docs/DATAMOSHPIT_GUIDE.md)

Quick orientation: arrow keys move the cursor, **Q + arrows** edit values (Q+Right or Q+Up to increase, Q+Left or Q+Down to decrease), **W** places a note, **Space** plays / stops, **Shift + arrows** move between screens, **Tab** toggles Slimentologika ↔ hex display.

For deeper technical references, see the docs index further down this README.

---

## Other Apps

### KOOLDRAW — Pixel Art & Animation

KoolDraw is a Piskel-inspired pixel art and animation app. Tools include pen, soft paint, eraser, fill, line, and rectangle. Export as PNG sequences or sprite sheets for use in Datamoshpit visual layers.

**Timeline & layers** (see [`docs/doc/en/kooldraw-timeline`](./src/lib/doc/articles/en/kooldraw-timeline.tsx) in-app for the full manual page):

- Every frame gets a permanent **3-digit hex id** (`000`–`FFF`). Layers keep a drawing *pool* (every distinct drawing) separate from the timeline's *exposure track* (which pool drawing plays at each position) — so a drawing can be **reused** at multiple non-contiguous points in the sequence (Clip Studio Paint / OpenToonz style) without duplicating pixel data. `Shift+F` inserts a new blank frame, `Shift+D` duplicates the active one into an independent copy; the **REUSE** picker points a slot at an existing drawing instead.
- Layers and frames both drag-reorder in place (press-and-drag, same interaction as the color picker/knob controls — not browser drag-and-drop), with an `Alt+↑`/`Alt+↓` keyboard path on a focused layer row. Layers also support delete, rename, and an opacity knob.
- The timeline toggles between a **horizontal filmstrip** (docked under the canvas) and a **vertical X-Sheet-style grid** (rows = frames top-to-bottom, columns = layers, docked in a thin column beside the preview/color/export rail) — the same row order OpenToonz and Tahoma2D use for their Xsheet panel. A header button cycles **AUTO → FILM → X-SHEET**: AUTO follows the window's own shape live (taller-than-wide → filmstrip, wider-than-tall → X-Sheet column); FILM/X-SHEET pin an explicit choice. Opening a shot from Shotlist pins X-Sheet mode and mirrors that shot's fps/duration/row layout.

On phones the editor uses the **Corner-Collapsible Panels** pattern (toolbars and side panels collapse into the four screen corners + a full-canvas “zen” mode). See [`docs/MOBILE_CREATIVE_UI.md`](./docs/MOBILE_CREATIVE_UI.md).

### TILEMAP — Dual-Plane Level Painter (New)

A bare-bones but capable tilemap editor aimed at Sega Genesis / Mega Drive style levels:

- Load any spritesheet (PNG / GIF / WebP)
- Two independent planes (Plane A / Plane B)
- Custom tile size (default 8×8) and map size (default 40×28)
- Per-tile palette index (0–3)
- Paint / Erase / Pick tools
- Export composed PNG of both planes
- **Export SGDK `.h`** — generates `TILE_ATTR_FULL`-compatible `u16` arrays ready to drop into an SGDK project

Keyboard: `A` / `S` / `Tab` switch plane · `B` paint · `E` erase · `I` pick · `1-4` palette · `[` `]` zoom

Same mobile corner-collapse + vertical hide pattern as KoolDraw (documented in [`docs/MOBILE_CREATIVE_UI.md`](./docs/MOBILE_CREATIVE_UI.md)).

### HOLY BIBLE — King James Version

An integrated e-reader for the King James Bible. Navigate by book, chapter, and verse. Highlight passages, take notes, export your study data.

### GAMES — Open Source Arcade Cabinet

K-OS III ships with open-source games compiled to WebAssembly / browser emulators:

| Game | Description |
|------|-------------|
| **Commander Keen** | Classic DOS platformer by id Software (all three episodes via [Chocolate Keen](https://github.com/nicerloop/chocolatekeen)) |
| **MEGA DRIVE** | Lightweight Sega Genesis / Mega Drive emulator (PicoDrive core via EmulatorJS). Load any `.md` / `.bin` / `.gen` / `.smd` ROM. |

---

## Recent Additions (July 2026)

- **Tilemap Painter** — new desktop app for dual-plane tilemap editing + SGDK header export. Designed for people making Genesis-style homebrew levels.
- **Mega Drive emulator** — added to the Games app. Uses the lightest practical core (PicoDrive) so it stays responsive even on modest hardware / handheld browsers.
- Both features keep the existing K-OS window system (draggable, resizable, maximizable, taskbar integration).
- **Mobile Creative UI pattern** documented for KoolDraw + Tilemap (and future creative tools): menus collapse into the four corners of the screen and can be fully hidden for maximum canvas space on cell phones.

### STUDIO — 2Kool production desk

Credits, shot NFTs, and `settleSale` for the Production Protocol. Connect an injected wallet, load a StudioKit address, commit shots like git, mint cels, settle the 5% team royalty. Counsel briefing is under the COUNSEL tab. See [`docs/PRODUCTION_PROTOCOL.md`](./docs/PRODUCTION_PROTOCOL.md).

---

## Input Devices

Datamoshpit works with whatever you have:

| Device | How It Works |
|--------|-------------|
| **Keyboard** | Full support — this is the baseline. See controls above. |
| **Gamepad** (Xbox, PS, 8BitDo, etc.) | Connects via Gamepad API. D-pad = cursor, face buttons = A/B/Select/Start. Feels like a Game Boy. |
| **MIDI controller** | Connects via Web MIDI API. Notes enter directly, knobs map to parameters, MIDI learn mode available. |
| **Touch screen** | Virtual D-pad and buttons appear when no keyboard/gamepad is detected. |
| **Handheld devices** (Miyoo Mini, Anbernic, Steam Deck) | Runs in the browser on Linux handhelds. Pixel-perfect at small resolutions. |

See [docs/CONTROLLER_SUPPORT.md](docs/CONTROLLER_SUPPORT.md) for full device-specific details and button mappings.

Creative apps (KoolDraw, Tilemap) use the additional **[Mobile Creative UI](docs/MOBILE_CREATIVE_UI.md)** pattern on phones so the canvas stays large.

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 16 + React 18 + TypeScript |
| Styling | Tailwind CSS 4 |
| Audio Engine | Tone.js (Web Audio API) |
| 3D / Shaders | Three.js |
| Animation | Theatre.js |
| Synthesis | YM2612-style 4-operator FM |
| Games | Emscripten / WebAssembly + EmulatorJS (PicoDrive) |

---

## Project Structure

```
K-OS-III/
├── src/
│   ├── app/                  # Next.js pages (desktop shell entry point)
│   ├── components/
│   │   ├── os/               # Desktop, Taskbar, AppWindow, BootSequence
│   │   └── apps/
│   │       ├── datamoshpit/  # Tracker, instruments, live pads
│   │       ├── bible/        # Scripture reader
│   │       ├── games/        # Game menu + iframe launcher
│   │       ├── kooldraw/     # KoolDraw
│   │       ├── tilemap/      # Dual-plane tilemap painter + SGDK export
│   │       ├── identity/     # Local accounts + in-app ETH wallet
│   │       ├── studio/       # 2Kool production desk (credits, mint, sales)
│   │       └── prodev/       # Production spreadsheet (shared board with Shotlist)
│   ├── engine/               # Audio, synth, tracker, project I/O
│   ├── lib/                  # InputRouter, BibleDataLoader, SpriteUtils
│   ├── types/                # TypeScript types
│   └── data/                 # Rosary text for boot sequence
├── public/
│   ├── bible/                # KJV Bible JSON
│   ├── fonts/                # Pixel fonts (kongtext, sometype-mono)
│   ├── games/
│   │   ├── keen/             # Commander Keen WebAssembly build
│   │   └── genesis/          # Mega Drive emulator page (PicoDrive)
│   ├── sprites/              # Slimentologika glyphs
│   └── gifs/                 # Screen effects
├── contracts/                # 2Kool production protocol (vault, credits, shot NFTs)
└── docs/                     # Detailed specs (commands, controllers, production protocol)
```

---

## The Rules

1. No rounded corners.
2. No anti-aliasing.
3. No gradient buttons.
4. Every pixel earns its place.
5. Every file is blessed.

---

## How We Write

On contested topics, we present the debate rather than the verdict. See [`docs/EPISTEMIC_STANCE.md`](./docs/EPISTEMIC_STANCE.md). The corpus shipped with K-OS is an opinionated *default* — your install is yours to edit, swap, federate, or replace ([`docs/KNOWLEDGE_CORPUS.md`](./docs/KNOWLEDGE_CORPUS.md)).

---

## Detailed Documentation

For deeper technical specifications, see the docs folder:

| Document | Contents |
|----------|---------|
| [`docs/DATAMOSHPIT_GUIDE.md`](./docs/DATAMOSHPIT_GUIDE.md) | Full Datamoshpit beginner's guide |
| [`docs/COMMANDS.md`](./docs/COMMANDS.md) | Full effect command reference |
| [`docs/NAVIGATION_AND_INPUT.md`](./docs/NAVIGATION_AND_INPUT.md) | Complete input system specification |
| [`docs/CONTROLLER_SUPPORT.md`](./docs/CONTROLLER_SUPPORT.md) | MIDI, gamepad, handheld, and touch support |
| [`docs/MOBILE_CREATIVE_UI.md`](./docs/MOBILE_CREATIVE_UI.md) | **Corner-collapsible menus + vertical hide for KoolDraw, Tilemap & future creative tools** |
| [`docs/SOUND_ENGINES.md`](./docs/SOUND_ENGINES.md) | All sound engines and their parameters |
| [`docs/GROOVE_AND_TIMING.md`](./docs/GROOVE_AND_TIMING.md) | Groove system and timing math |
| [`docs/SLIMENTOLOGIKA_GUIDE.md`](./docs/SLIMENTOLOGIKA_GUIDE.md) | Full guide to the base-16 glyph system |

**Project docs:** [`VISION.md`](./VISION.md) · [`ROADMAP.md`](./ROADMAP.md) · [`CONTRIBUTING.md`](./CONTRIBUTING.md) · [`CONTRIBUTORS.md`](./CONTRIBUTORS.md) · [`CODE_OF_CONDUCT.md`](./CODE_OF_CONDUCT.md) · [`EDUCATION.md`](./EDUCATION.md)

**Stance docs:** [`docs/EPISTEMIC_STANCE.md`](./docs/EPISTEMIC_STANCE.md) · [`docs/ECONOMIC_STANCE.md`](./docs/ECONOMIC_STANCE.md) · [`docs/SPONSOR_POLICY.md`](./docs/SPONSOR_POLICY.md)

**Design specs:** [`docs/K_WALLET_SPEC.md`](./docs/K_WALLET_SPEC.md) · [`docs/COMMERCE_SPEC.md`](./docs/COMMERCE_SPEC.md) · [`docs/CHAT_SPEC.md`](./docs/CHAT_SPEC.md) · [`docs/KNOWLEDGE_CORPUS.md`](./docs/KNOWLEDGE_CORPUS.md) · [`docs/FUNDING_PLAN.md`](./docs/FUNDING_PLAN.md) · [`docs/PRODUCTION_PROTOCOL.md`](./docs/PRODUCTION_PROTOCOL.md)

---

## Who Made This

K-OS III is built by **[@Koolskull](https://github.com/Koolskull)** — musician, developer, founder of 2KOOL Productions. Eleven-plus years of UI design, tracker music, pixel art, and the slow accumulation of the worldview the OS is built on.

Contributors who have shipped to `master` are listed in [`CONTRIBUTORS.md`](./CONTRIBUTORS.md). If your name should be there and isn't, open an issue.

**Community channels:** Discord `[invite TBD]` · Matrix `[room TBD]` · email: see [the founder's GitHub profile](https://github.com/Koolskull) for current contact.

---

```
              ☦
     "Make a joyful noise."
        — Psalm 100:1

     2KOOL PRODUCTIONS
```
