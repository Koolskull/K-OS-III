```
              ☦
     ╔═════════════════════════╗
     ║  NAVIGATION & INPUT     ║
     ║  Specifications         ║
     ╚═════════════════════════╝
```

# Navigation & Input System

Datamoshpit uses the same navigation philosophy as LSDj:
**Smooth menu diving with very few keys.**

On a web browser, a regular typing keyboard is all you need.
On a touchscreen, it works — but a keyboard makes it fly.
With a gamepad (8BitDo, Xbox, PS, etc.) it feels like a Game Boy.
With a MIDI controller, notes and CCs flow straight in.
On a Miyoo Mini or Anbernic handheld, it runs in the browser natively.

**See also: [CONTROLLER_SUPPORT.md](CONTROLLER_SUPPORT.md)** for MIDI, gamepad, and handheld device specifications.

---

## Core Input Model

Datamoshpit maps to a virtual "Game Boy" input:

| Virtual Button | Keyboard Key | Touch Zone | Function |
|---------------|-------------|------------|----------|
| **A** | Z | Right-bottom button | Place/Edit/Confirm |
| **B** | X | Right-top button | Delete/Back/Cancel |
| **SELECT** | Shift | Left-bottom button | Modifier key (screen nav, clipboard) |
| **START** | Enter/Return | Left-top button | Play/Stop |
| **UP** | Arrow Up | D-pad up | Cursor up |
| **DOWN** | Arrow Down | D-pad down | Cursor down |
| **LEFT** | Arrow Left | D-pad left | Cursor left / decrease value |
| **RIGHT** | Arrow Right | D-pad right | Cursor right / increase value |

### Combo Actions (matching LSDj)

| Combo | Action |
|-------|--------|
| A + CURSOR | Change value at cursor (LEFT/RIGHT = note, UP/DOWN = octave) |
| B + A | Delete value and copy to clipboard |
| SELECT + CURSOR | Navigate between screens (screen map) |
| SELECT + A | Paste from clipboard |
| SELECT + B | Start block selection, then move cursor to select area |
| SELECT + B, B | Quick-mark column/row |
| SELECT + B, B, B | Quick-mark entire screen |
| SELECT + START | Play all channels from any screen |
| B + SELECT | Mute current channel |
| START (song screen) | Play all channels |
| START (other screens) | Play current channel only |

### Shift+W Dual-Variable Control (KNOWN FORMULA)

**Shift+W** is the universal modifier for controlling **two variables at once**
on any screen that has a dual-parameter context. This is a known formula for
solving the problem of navigating two independent dimensions with only four
directional inputs.

| Axis | Controls |
|------|----------|
| **Shift + W + UP/DOWN** | Left / top variable (primary axis) |
| **Shift + W + LEFT/RIGHT** | Right / bottom variable (secondary axis) |

Hold **Shift** and **W** together, then use arrow keys. Key repeat works.

#### Context-Sensitive Behavior:

**PHRASE screen:**
| Combo | Action |
|-------|--------|
| Shift+W+UP | Add row to phrase (max 256) |
| Shift+W+DOWN | Remove last row (min 2) |

**LIVE screen:**
| Combo | Action |
|-------|--------|
| Shift+W+UP | Next bank (0–63) |
| Shift+W+DOWN | Previous bank |
| Shift+W+LEFT | Previous kit/preset |
| Shift+W+RIGHT | Next kit/preset |

This pattern extends to any future screen that needs dual-variable scrolling.

### Value Editing

When cursor is on an editable field:
- **A** on empty cell: Insert default value
- **A + LEFT/RIGHT**: Change value (note name, hex digit, etc.)
- **A + UP/DOWN**: Change octave / coarse value
- **B**: Delete value
- **B + A**: Cut to clipboard

---

## Screen Map

Datamoshpit uses a spatial screen map navigated with SELECT + CURSOR.
Based on LSDj's 5x3 grid, expanded for our additional features:

```
┌─────────┬─────────┬─────────┐
│ PROJECT │  SYNTH  │  WAVE   │
├────┬────┼─────────┼────┬────┤
│SONG│CHAIN│ PHRASE │INST│TABLE│
├────┴────┴─────────┴────┴────┤
│           GROOVE            │
└─────────────────────────────┘
```

**Middle row** = where you spend most time (composition)
**Top row** = sound design and project settings
**Bottom row** = timing/groove

### Screen Navigation
- SELECT + RIGHT: Move right on map
- SELECT + LEFT: Move left on map
- SELECT + UP: Move up on map
- SELECT + DOWN: Move down on map

### Quick Navigation
- From Phrase screen, SELECT + RIGHT on a command = jump to that table
- From Chain screen, SELECT + RIGHT on a phrase = jump to that phrase
- From Song screen, SELECT + RIGHT on a chain = jump to that chain
- From Instrument screen, SELECT + RIGHT on TABLE = jump to table editor
- SELECT + LEFT always goes back

---

## Keyboard Layout (Full Keyboard Mode)

For users who want faster note entry with a full keyboard
(similar to LSDj's keyboard mode, section 5.6):

### Piano Layout
```
 W E   T Y U   O P
A S D F G H J K L ;
```
Maps to chromatic notes:
```
 C#D#  F#G#A#  C#D#
C D E F G A B C D E
```

### Additional Keyboard Shortcuts (Web Only)
| Key | Action |
|-----|--------|
| Space | Play/Stop (alternative to Enter) |
| Tab | Toggle HEX/SLIME display mode |
| Escape | Back to previous screen |
| 1-8 | Jump to channel 1-8 |
| F1-F7 | Jump to screen (Song/Chain/Phrase/Inst/Table/Synth/Wave) |
| Shift+W+Up/Down | Dual-variable primary axis (context-sensitive) |
| Shift+W+Left/Right | Dual-variable secondary axis (context-sensitive) |
| Ctrl+C | Copy selection |
| Ctrl+V | Paste |
| Ctrl+X | Cut |
| Ctrl+Z | Undo |

---

## Touch Screen Specifics

When no keyboard is attached, a virtual controller overlay appears:

```
┌──────────────────────────────────┐
│                                  │
│        [MAIN SCREEN AREA]        │
│                                  │
│                                  │
│                                  │
├──────────┬───────────┬───────────┤
│  D-PAD   │  STATUS   │  [B] [A]  │
│  ┌─┐     │  BPM:120  │           │
│ ←│↑│→    │  CH:PU1   │ [SEL]     │
│  │↓│     │           │ [START]   │
│  └─┘     │           │           │
└──────────┴───────────┴───────────┘
```

### Touch Gestures (in main screen area)
- **Tap cell**: Select/focus that cell
- **Double tap cell**: Enter edit mode for that cell
- **Swipe up/down**: Scroll grid vertically
- **Swipe left/right**: Switch channels (in Song/Chain view)
- **Long press**: Context menu (copy, paste, delete)
- **Two-finger vertical drag**: Adjust value (like a virtual knob)

### Touch Optimizations
- All touch targets minimum 44x44 CSS pixels (Apple HIG)
- Virtual D-pad has generous hit zones with diagonal dead zones
- Haptic feedback on button presses (if device supports it)
- Touch controls can be hidden when a keyboard is detected

---

## Prelisten Mode

Like LSDj's PRELISTEN setting:
When ON, notes and instruments play as you enter them.
This gives immediate audio feedback during composition.
Toggle in Project screen settings.
