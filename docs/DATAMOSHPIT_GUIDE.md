# Thrash Tracker — Beginner's Guide

This guide walks you through everything you need to start making music in Thrash Tracker, step by step, even if you've never used a tracker before.

The Thrash Tracker icon currently opens the browser port of desktop Thrash Tracker. That window is documented in the manual article **Thrash Tracker in the Browser** (`src/lib/doc/articles/en/datamoshpit-browser.tsx`) and in the section below. The rest of this file describes the earlier K-OS tracker: groove, Slimentologika, Q+arrows, and the long effect list. Those controls are not what the window does now.

## Browser Thrash Tracker

Eight channels. Chains are 16 steps. Phrases, tables, oscillators, samples, and four-operator FM. No VST, AU, or LV2. A plugin row is stored and stays silent; the status line says `PLUGIN STAYS ON THE DESKTOP` once.

The canvas is 960×540. The corner map is:

```
S  C  P  L     song, chain, phrase, rack
T  I  V  R     table, instrument, visualiser, project
```

Shift+F1 through Shift+F8 jump there. Shift+arrows move across the map and stop at the edge. The V tile hides the grid and shows the background plus the scope.

Space on the song page plays from the cursor row. Space again, or Escape, stops. Space on a chain or phrase auditions that pattern. Closing the window closes the audio.

A new project is not empty. Instrument `00` is `AMEN`, the Amen break at `public/samples/Amen_184bpm.wav`. Phrase `00` is `80` rows (128), eight rows to the beat, and row `00` is `C-4` so the sample plays at its recorded speed. Tempo is locked so four bars match the file. Space on the song page plays the break and, because the next song cell is empty, the channel wraps and the break starts again until Space or Escape. Ctrl+Shift+N still makes the short square, named `SQ` plus its hex id: attack `00`, decay `40`, sustain `00`, release `40`. That pluck does not replace `AMEN` until a cell points at it.

One row is one tick: `60 / (BPM × ticks per beat)` seconds. A new project is 8 ticks per beat, so a beat is eight rows. Tempo comes from the Amen file so those 128 rows match the recording. Envelope time is `(value / 127)² × 4` seconds.

Phrase columns are `NT IN VL SL LP FX VA ST`. The note column is a piano: lower `zsxdcvgbhnjm,l.;/` and upper `q2w3er5t6y7ui9o0p`. Octave 4 puts `z` on C-4. Hex digits write chain, phrase, instrument, volume, slice, and effect value, two digits each. The phrase effects the worklet sounds are `KL` (kill the note) and `VO` (row gain, `7F` near unity). Other command letters can be typed and do not change the sound yet. A table transpose is heard when it is on. Slice, retrigger, filter, crush, and the table’s own effects are stored and drawn, not applied.

Every edit autosaves in this browser at `dm2-web-pattern`, without sample audio. Ctrl+S downloads `NAME.dm2.json` with samples as little-endian 16-bit audio in base64. `version` is `dm2.web`. A desktop `.dm2` is a different JSON. A `.dmpit` is a zip from the older tracker. Neither opens here yet.

2kool.tv is still the previous site. This tracker is the Thrash Tracker window in the copy you are running.

For deeper technical references of the older tracker, see [`COMMANDS.md`](./COMMANDS.md), [`NAVIGATION_AND_INPUT.md`](./NAVIGATION_AND_INPUT.md), [`SOUND_ENGINES.md`](./SOUND_ENGINES.md), [`GROOVE_AND_TIMING.md`](./GROOVE_AND_TIMING.md), [`SLIMENTOLOGIKA_GUIDE.md`](./SLIMENTOLOGIKA_GUIDE.md), and [`CONTROLLER_SUPPORT.md`](./CONTROLLER_SUPPORT.md).

---

## What Is a Tracker?

A tracker is a type of music software that uses a **spreadsheet-style grid** instead of a piano roll. Notes are entered as text in rows that scroll from top to bottom. Each row is a "step" in time — when the sequencer reaches that row, it plays whatever note or command is there.

Trackers were invented in the late 1980s on the Commodore Amiga. They've been used to create everything from chiptune to breakcore to film scores. Famous trackers include ProTracker, FastTracker II, LSDJ (Game Boy), and LGPT (handheld). Thrash Tracker carries that tradition forward into the browser.

**If you've used a DAW like Ableton or FL Studio:** Think of the tracker grid like a piano roll turned on its side and compressed into text. It looks alien at first, but once it clicks, many people find it faster than clicking notes on a grid.

## Your First Boot

1. Double-click the **DATAMOSHPIT** icon on the K-OS desktop
2. You'll see the **Phrase screen** — this is where you'll spend most of your time
3. The screen shows a grid with columns: **NOTE**, **INSTR** (instrument), and **CMD** (effect command)
4. A cursor highlights the current cell — use arrow keys to move it around

## The Screen Map

Thrash Tracker is organized into screens arranged in a spatial grid. You move between them using **Shift + Arrow Keys**:

```
┌─────────┬─────────┬─────────┐
│ PROJECT │  SYNTH  │  WAVE   │
├────┬────┼─────────┼────┬────┤
│SONG│CHAIN│ PHRASE │INST│TABLE│
├────┴────┴─────────┴────┴────┤
│           GROOVE            │
└─────────────────────────────┘
```

**Where to start:**

| Screen | What It's For |
|--------|--------------|
| **PHRASE** | Where you write note patterns — this is home base |
| **CHAIN** | Strings phrases together into longer sequences |
| **SONG** | Arranges chains across 8 channels into a full song |
| **INSTRUMENT** | Edit how each instrument sounds |
| **TABLE** | Per-tick automation for detailed sound shaping |
| **GROOVE** | Controls the timing/swing feel |
| **PROJECT** | BPM, project settings, save/load |

**Navigation tip:** You can also press **F1–F7** to jump directly to a screen, or **Escape** to go back.

## Controls Cheat Sheet

Thrash Tracker uses a simple control scheme inspired by Game Boy trackers. You only need a few keys:

```
CORE CONTROLS
─────────────────────────────────────────────
Arrow Keys          Move cursor
Q + Arrows          Edit value at cursor
                      Q + Right/Up = increase
                      Q + Left/Down = decrease
W                   Place note / confirm
Shift + Arrows      Navigate between screens
Space               Play / Stop
Tab                 Toggle hex / Slimentologika display
Escape              Go back
```

```
CLIPBOARD & SELECTION
─────────────────────────────────────────────
Ctrl+C              Copy
Ctrl+V              Paste
Ctrl+X              Cut
Ctrl+Z              Undo
```

```
QUICK JUMPS
─────────────────────────────────────────────
F1                  Song screen
F2                  Chain screen
F3                  Phrase screen
F4                  Instrument screen
F5                  Table screen
1-8                 Jump to channel 1-8
```

## Making Your First Beat

Here's a step-by-step walkthrough to get sound coming out:

### Step 1: Get to the Phrase Screen

If you're not already there, press **F3** or use **Shift + Arrows** to navigate to the Phrase screen.

### Step 2: Enter a Note

1. Move your cursor to an empty row in the **NOTE** column
2. Press **W** to place a default note (usually C-5)
3. You should see something like `C-5 00` appear — that's note C, octave 5, instrument 00

### Step 3: Change the Note

With your cursor on the note:
- **Q + Left/Right** changes the note name (C, C#, D, D#, E, F, etc.)
- **Q + Up/Down** changes the octave

### Step 4: Add More Notes

Move the cursor down a few rows and enter more notes. A simple pattern might look like:

```
Row 00:  C-5  00  ---
Row 01:  ---  --  ---
Row 02:  ---  --  ---
Row 03:  ---  --  ---
Row 04:  E-5  00  ---
Row 05:  ---  --  ---
Row 06:  ---  --  ---
Row 07:  ---  --  ---
Row 08:  G-5  00  ---
Row 09:  ---  --  ---
Row 10:  ---  --  ---
Row 11:  ---  --  ---
Row 12:  C-6  00  ---
Row 13:  ---  --  ---
Row 14:  ---  --  ---
Row 15:  ---  --  ---
```

That's a simple C major arpeggio spread across 16 steps.

### Step 5: Hit Play

Press **Space** to hear your phrase play. Press **Space** again to stop.

### Step 6: Experiment

- Try changing instruments: move to the **INSTR** column and use **Q + Up/Down** to pick a different instrument number
- Try adding effect commands in the **CMD** column (see the [effect commands](#effect-commands-quick-reference) section below)
- Navigate to the **Instrument** screen (**F4**) to tweak how your instrument sounds

Congratulations — you just wrote music in a tracker.

## Understanding the Data Model

Thrash Tracker organizes music in a hierarchy. Think of it like building blocks:

```
SONG (the whole piece)
  └── CHAINS (sections — verse, chorus, etc.)
        └── PHRASES (short patterns — a melody, a drum loop)
              └── TABLES (per-tick automation — vibrato, arpeggios)
```

Here's what each level does:

| Level | Size | What It Holds |
|-------|------|--------------|
| **Song** | 256 rows x 8 channels | References to chains. This is the arrangement. |
| **Chain** | 16 steps | References to phrases, with optional transpose per step. |
| **Phrase** | 2-256 rows (default 16) | The actual notes, instruments, and effect commands. |
| **Table** | 16 rows (loops) | Per-tick effects — runs 6x faster than phrases. Great for sound design. |

**The workflow:**
1. Write **phrases** (your building blocks — a bass riff, a kick pattern, a melody)
2. String phrases into **chains** (combine building blocks into sections)
3. Arrange chains in the **song** screen (lay out your full track across 8 channels)

You don't have to use all levels right away. Many people just write phrases and hit play — that's totally valid.

## Sound Engines

Thrash Tracker has multiple sound engines you can assign to any of its 8 channels:

| Engine | Description | Good For |
|--------|------------|----------|
| **Pulse** | Square wave (Game Boy style) | Chiptune leads, basses, arpeggios |
| **Wave** | Wavetable synth with soft-synth features | Pads, textures, bass, custom waveforms |
| **Noise** | Noise generator with dynamic bit-crushing | Hi-hats, snares, risers, glitch FX |
| **FM (YM2612)** | 4-operator FM synthesis (Sega Genesis style) | Basses, bells, metallic sounds, complex tones |
| **Sample** | 16-bit sample playback | Drums, vocals, any recorded audio |

You can mix and match — run 2 pulse channels + 2 FM channels + a noise channel + 3 sample channels, or any combination that adds up to 8.

## Effect Commands Quick Reference

Commands go in the **CMD** column of the Phrase screen. Each command is a letter followed by a 2-digit hex value.

**Most useful commands to learn first:**

| Cmd | Name | What It Does | Example |
|-----|------|-------------|---------|
| **C** | Chord | Arpeggio — cycles between notes | `C37` = minor chord, `C47` = major |
| **D** | Delay | Delays the note by N ticks | `D03` = delay 3 ticks |
| **E** | Envelope | Sets volume/amplitude | `E08` = set volume to 8 |
| **H** | Hop | Jump/loop within a phrase | `H00` = stop, `H08` = jump to row 8 |
| **K** | Kill | Cuts the note after N ticks | `K03` = cut after 3 ticks |
| **L** | Slide | Portamento/glide to next note | `L03` = slide speed 3 |
| **O** | Output | Panning (left/right) | `OFF` = full stereo, `OF0` = left only |
| **P** | Pitch | Pitch bend up or down | `P01` = bend up slow, `P81` = bend down slow |
| **T** | Tempo | Change BPM mid-song | `T80` = set tempo to 128 BPM |
| **V** | Vibrato | Pitch wobble | `V42` = speed 4, depth 2 |

**Advanced commands:**

| Cmd | Name | What It Does |
|-----|------|-------------|
| **A** | Table | Start/stop a table automation |
| **B** | MayBe | Probability — note only plays sometimes (great for generative music) |
| **G** | Groove | Switch timing groove mid-phrase |
| **R** | Retrig | Retrigger note rapidly (rolls, stutters) |
| **W** | Wave | Change waveform/algorithm |
| **Z** | Random | Randomize the last command's value (controlled chaos) |

For the full command reference, see [`COMMANDS.md`](./COMMANDS.md).

## Groove and Swing

By default, every step in a phrase lasts 6 ticks (straight timing). The **Groove screen** lets you change this.

**What's a groove?** It's a repeating pattern of tick counts that determines how long each step lasts.

**Straight timing (default):**
```
Step 1: 6 ticks ████████
Step 2: 6 ticks ████████
(repeats)
```

**Swing feel:**
```
Step 1: 8 ticks ██████████
Step 2: 5 ticks ██████
(repeats — even steps feel "late")
```

**Triplet feel:**
```
Step 1: 4 ticks ██████
Step 2: 4 ticks ██████
Step 3: 4 ticks ██████
(repeats — three steps per beat instead of two)
```

Use the **G** command in a phrase to switch grooves on the fly. Different channels can run different grooves at the same time. Full timing math: [`GROOVE_AND_TIMING.md`](./GROOVE_AND_TIMING.md).

## Slimentologika (the Weird Symbols)

When you first open Thrash Tracker, you might notice unfamiliar symbols instead of regular numbers. That's **Slimentologika** — a custom base-16 glyph system unique to KOOLSKULL OS.

**Don't panic.** Press **Tab** at any time to switch between Slimentologika and standard hex digits. You can compose entirely in hex mode if you prefer.

Slimentologika uses 16 pixel-art glyphs that map directly to hex values 0-F:

```
Standard hex:  0  1  2  3  4  5  6  7  8  9  A  B  C  D  E  F
Slimentologika: (16 unique pixel-art glyphs — learn them visually)
```

**Tips for learning Slimentologika:**
- Start by learning just the first four glyphs (0-3)
- Use Tab to toggle back to hex whenever you're confused
- Let it happen naturally through repetition — don't force memorization
- The phrase editor row numbers are the best place to practice, since you see them constantly

For a deep dive into the number system, history, and glyph families, see [`SLIMENTOLOGIKA_GUIDE.md`](./SLIMENTOLOGIKA_GUIDE.md).

---

```
              ☦
     "Make a joyful noise."
        — Psalm 100:1
```
