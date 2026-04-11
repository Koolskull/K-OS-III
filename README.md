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

---

## What Is This?

K-OS III is a desktop environment that runs in your browser. It boots with a terminal scroll of the Holy Rosary and Psalms, then presents a desktop with icons, a taskbar, and draggable windows — each running a different app.

It's built to be a creative workstation: make music, draw sprites, read scripture, play games. Everything runs in one place, no installs needed.

## Apps

### DATAMOSHPIT — Music Tracker
A tracker for making music, inspired by LSDJ, LGPT, PicoTracker, and Furnace. FM synthesis (YM2612-style 4-operator), sample playback, and a visual instrument playground. Write songs in a spreadsheet-style sequencer. Every pixel earns its place.

### SPRITE EDITOR — Pixel Art & Animation
A Piskel-inspired sprite editor for creating pixel art and animations. Draw with pen, eraser, fill, line, and rectangle tools. Manage layers and animation frames. Export as PNG sequences or sprite sheets for use in Datamoshpit visual layers.

### HOLY BIBLE — King James Version
An integrated e-reader for the King James Bible. Navigate by book, chapter, and verse. Highlight passages, take notes, export your study data.

### GAMES — Open Source Arcade Cabinet
K-OS III ships with open-source games compiled to WebAssembly, playable directly in the browser:

| Game | Description | Source |
|------|-------------|--------|
| **SuperTux** | Open-source platformer inspired by Super Mario. Run, jump, and explore icy worlds. | [SuperTux](https://www.supertux.org/) |
| **Commander Keen** | Classic DOS platformer by id Software. Invasion of the Vorticons — all three episodes. Built from [Chocolate Keen](https://github.com/nicerloop/chocolatekeen), an open-source reimplementation. | [Chocolate Keen](https://github.com/nicerloop/chocolatekeen) |

We believe open-source entertainment belongs alongside open-source tools. These games are included to celebrate the history of PC gaming and to provide a creative break without leaving the OS.

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

## Getting Started

```bash
cd K-OS-III
npm install --legacy-peer-deps
npm run dev
```

Open `http://localhost:3000` in your browser. The boot sequence scrolls, then the desktop loads. Double-click any icon to launch an app.

## Project Structure

```
K-OS-III/
├── src/
│   ├── app/                  # Next.js pages (desktop shell)
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
└── docs/                     # Command reference, controller support
```

## The Rules

1. No rounded corners.
2. No anti-aliasing.
3. No gradient buttons.
4. Every pixel earns its place.
5. Every file is blessed.

---

```
              ☦
     "Make a joyful noise."
        — Psalm 100:1

     2KOOL PRODUCTIONS
```
