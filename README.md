# K-OS III

> **🟡 EARLY BETA — `0.2.0-beta.1`.** Working, buildable, but rough. Datamoshpit's tracker, sprite editor, and per-instrument visual system are in. Save format may break before `0.3`. Save your projects locally and don't ship anything you can't afford to lose.

**A fake operating system that runs in your browser and actually makes music, art, and on-chain work.** Built for Ethereum developers, artists, and makers — first.

> **Who this is for, in priority order:** Ethereum / EVM developers first, then tracker and chiptune musicians, pixel artists, handheld Linux tinkerers, privacy-curious builders, and Christian creatives. This ordering is deliberate — see [`VISION.md`](./VISION.md).

[![Next.js](https://img.shields.io/badge/Next.js-16-black?logo=next.js)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-strict-blue?logo=typescript)](https://www.typescriptlang.org/)
[![Tone.js](https://img.shields.io/badge/Audio-Tone.js-orange)](https://tonejs.github.io/)
[![License: TBD](https://img.shields.io/badge/license-TBD-lightgrey)](./LICENSE)
[![Built with Claude Code](https://img.shields.io/badge/built%20with-Claude%20Code-8A2BE2)](https://claude.com/claude-code)

## Screenshots

| Boot sequence | Datamoshpit (Phrase) | Sprite editor | Desktop |
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
- **Pixel artists and animators** who want a sprite editor and animation tools that respect 1px-per-pixel rendering.
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
| **SPRITE EDITOR** | Pixel art and animation tool |
| **HOLY BIBLE** | King James Bible reader with highlights and notes |
| **GAMES** | Open-source arcade cabinet (SuperTux, Commander Keen) |

Each app opens in its own draggable, resizable window on the desktop. You can run multiple apps at once.

---

## Datamoshpit

Datamoshpit is the OS's flagship app — an 8-channel music tracker (Pulse / Wave / Noise / FM-YM2612 / Sample) with phrases, chains, songs, tables, grooves, Slimentologika base-16 glyphs, and LGPT-style controls. Five engines, eight channels, and an input model so minimal you can drive the whole thing from a Game Boy D-pad.

If you've used a tracker before — LSDJ, LGPT, Renoise, Furnace — Datamoshpit will feel familiar fast. If you haven't, the **full beginner's guide** walks you from "what is a tracker" to "you just wrote music":

→ [`docs/DATAMOSHPIT_GUIDE.md`](./docs/DATAMOSHPIT_GUIDE.md)

Quick orientation: arrow keys move the cursor, **Q + arrows** edit values (Q+Right or Q+Up to increase, Q+Left or Q+Down to decrease), **W** places a note, **Space** plays / stops, **Shift + arrows** move between screens, **Tab** toggles Slimentologika ↔ hex display.

For deeper technical references, see the docs index further down this README.

---

## Other Apps

### SPRITE EDITOR — Pixel Art & Animation

A Piskel-inspired sprite editor for creating pixel art and animations. Tools include pen, eraser, fill, line, and rectangle. Manage layers and animation frames. Export as PNG sequences or sprite sheets for use in Datamoshpit visual layers.

### HOLY BIBLE — King James Version

An integrated e-reader for the King James Bible. Navigate by book, chapter, and verse. Highlight passages, take notes, export your study data.

### GAMES — Open Source Arcade Cabinet

K-OS III ships with open-source games compiled to WebAssembly:

| Game | Description |
|------|-------------|
| **SuperTux** | Open-source platformer inspired by Super Mario |
| **Commander Keen** | Classic DOS platformer by id Software (all three episodes via [Chocolate Keen](https://github.com/nicerloop/chocolatekeen)) |

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
| Games | Emscripten / WebAssembly |

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
│   │       └── kooldraw/     # Sprite editor
│   ├── engine/               # Audio, synth, tracker, project I/O
│   ├── lib/                  # InputRouter, BibleDataLoader, SpriteUtils
│   ├── types/                # TypeScript types
│   └── data/                 # Rosary text for boot sequence
├── public/
│   ├── bible/                # KJV Bible JSON
│   ├── fonts/                # Pixel fonts (kongtext, sometype-mono)
│   ├── games/
│   │   ├── supertux/         # SuperTux WebAssembly build
│   │   └── keen/             # Commander Keen WebAssembly build
│   ├── sprites/              # Slimentologika glyphs
│   └── gifs/                 # Screen effects
└── docs/                     # Detailed specs (commands, controllers, etc.)
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
| [`docs/SOUND_ENGINES.md`](./docs/SOUND_ENGINES.md) | All sound engines and their parameters |
| [`docs/GROOVE_AND_TIMING.md`](./docs/GROOVE_AND_TIMING.md) | Groove system and timing math |
| [`docs/SLIMENTOLOGIKA_GUIDE.md`](./docs/SLIMENTOLOGIKA_GUIDE.md) | Full guide to the base-16 glyph system |

**Project docs:** [`VISION.md`](./VISION.md) · [`ROADMAP.md`](./ROADMAP.md) · [`CONTRIBUTING.md`](./CONTRIBUTING.md) · [`CONTRIBUTORS.md`](./CONTRIBUTORS.md) · [`CODE_OF_CONDUCT.md`](./CODE_OF_CONDUCT.md) · [`EDUCATION.md`](./EDUCATION.md)

**Stance docs:** [`docs/EPISTEMIC_STANCE.md`](./docs/EPISTEMIC_STANCE.md) · [`docs/ECONOMIC_STANCE.md`](./docs/ECONOMIC_STANCE.md) · [`docs/SPONSOR_POLICY.md`](./docs/SPONSOR_POLICY.md)

**Design specs:** [`docs/K_WALLET_SPEC.md`](./docs/K_WALLET_SPEC.md) · [`docs/COMMERCE_SPEC.md`](./docs/COMMERCE_SPEC.md) · [`docs/CHAT_SPEC.md`](./docs/CHAT_SPEC.md) · [`docs/KNOWLEDGE_CORPUS.md`](./docs/KNOWLEDGE_CORPUS.md) · [`docs/FUNDING_PLAN.md`](./docs/FUNDING_PLAN.md)

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
