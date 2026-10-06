```
              ☦
     ╔══════════════════════════════╗
     ║  CONTROLLER & DEVICE SUPPORT ║
     ║  CRITICAL PRIORITY           ║
     ╚══════════════════════════════╝
```

# Controller & Device Support

**THIS IS NOT OPTIONAL. THIS IS ESSENTIAL.**

Datamoshpit MUST work with all of the following input devices.
Cross-device compatibility is a core design requirement, not an afterthought.

---

## Priority 1: Keyboard (Web Standard)

The baseline. If you have a keyboard, you can use Datamoshpit fully.
See NAVIGATION_AND_INPUT.md for full keyboard mapping.

---

## Priority 1: MIDI Controller

MIDI controllers are the music-maker's native language.
Full MIDI support via the **Web MIDI API**.

### MIDI Input Mapping
| MIDI Message | Datamoshpit Action |
|-------------|-------------------|
| Note On | Enter note at cursor / Trigger instrument in playground |
| Note Off | Release note |
| CC 1 (Mod Wheel) | Mapped to active macro controller |
| CC 7 (Volume) | Channel volume |
| CC 10 (Pan) | Channel pan |
| CC 64 (Sustain) | Hold note |
| CC 74 (Cutoff) | Filter cutoff (synth instruments) |
| CC 71 (Resonance) | Filter resonance |
| Program Change | Select instrument slot |
| Pitch Bend | Pitch bend (maps to P command) |
| Transport (Start) | Play |
| Transport (Stop) | Stop |
| Transport (Continue) | Continue from position |
| MIDI Clock | Sync to external clock |

### MIDI Learn Mode
- Any MIDI CC can be mapped to any parameter
- Enter MIDI Learn: hold SELECT + tap parameter
- Move a knob/fader on your controller
- Mapping is saved per-project
- Multiple CCs can map to same parameter (layered control)
- One CC can map to multiple parameters (macro-style)

### MIDI Output
- Notes played by the sequencer are sent as MIDI out
- Allows Datamoshpit to drive external hardware synths
- Clock output for syncing external gear
- Channel assignment: tracker channel → MIDI channel

### Specific Controller Compatibility Targets
- **Akai MPD / MPK series**: Pads + knobs + keys
- **Novation Launchpad**: Grid mode for live performance
- **Korg nanoKEY / nanoKONTROL**: Compact travel controllers
- **Arturia MiniLab / KeyStep**: Keys + encoders
- **Generic USB MIDI**: Any class-compliant MIDI device

---

## Priority 1: Game Controller / Gamepad

The **Gamepad API** (Web standard) enables console and handheld controllers.
This is essential because tracker navigation IS gamepad navigation.

### Standard Gamepad Mapping (SDL/XInput layout)

| Gamepad Button | Virtual Button | Action |
|---------------|---------------|--------|
| **A / Cross** | A | Place/Edit/Confirm |
| **B / Circle** | B | Delete/Back/Cancel |
| **X / Square** | SELECT | Modifier (screen nav, clipboard) |
| **Y / Triangle** | - | Toggle HEX/SLIME mode |
| **D-pad Up** | UP | Cursor up |
| **D-pad Down** | DOWN | Cursor down |
| **D-pad Left** | LEFT | Cursor left / decrease value |
| **D-pad Right** | RIGHT | Cursor right / increase value |
| **Start** | START | Play/Stop |
| **Select/Back** | - | Open project settings |
| **L Shoulder** | - | Previous channel |
| **R Shoulder** | - | Next channel |
| **L Trigger** | - | Decrease value fast (page up) |
| **R Trigger** | - | Increase value fast (page down) |
| **Left Stick** | - | Scroll / navigate (analog) |
| **Right Stick** | - | Adjust value (vertical = coarse, horizontal = fine) |

### Specific Gamepad Targets
- **Xbox controllers** (USB, Bluetooth)
- **PlayStation DualShock / DualSense** (USB, Bluetooth)
- **Nintendo Switch Pro Controller**
- **8BitDo controllers** (SN30, Pro 2, etc.) — CRITICAL: these are what retro handheld users carry
- **Generic USB gamepads**

### Gamepad Configuration
- Button remapping in Project settings
- Analog stick dead zone adjustment
- Vibration/haptic feedback for note triggers

---

## Priority 1: Handheld Devices (Miyoo Mini, Anbernic, etc.)

**THIS IS A FIRST-CLASS TARGET PLATFORM.**

Retro handhelds like the Miyoo Mini run Linux with a web browser.
Datamoshpit must render correctly and accept input on these devices.

### Target Devices
| Device | Screen | Input | OS |
|--------|--------|-------|-----|
| **Miyoo Mini / Mini+** | 640x480 / 640x480 | D-pad + ABXY + L/R + Start/Select | OnionOS / MiniUI (Linux) |
| **Anbernic RG35XX** | 640x480 | D-pad + ABXY + L/R/L2/R2 + joystick | Linux / muOS |
| **Anbernic RG353** | 640x480 | D-pad + ABXY + dual sticks + L/R | Linux / ArkOS |
| **Trimui Smart Pro** | 1280x720 | D-pad + ABXY + joystick | Linux |
| **Powkiddy RGB30** | 720x720 | D-pad + ABXY + joystick | Linux |
| **Steam Deck** | 1280x800 | Full gamepad + trackpads + touchscreen | SteamOS (Linux) |

### Handheld-Specific Requirements
1. **Fixed internal resolution**: The UI renders at 320x240 or 480x320 and scales with nearest-neighbor. This guarantees pixel-perfect display on ANY screen size.
2. **No hover states**: Handhelds have no mouse. All interaction is cursor + buttons.
3. **Readable at small sizes**: Kongtext font must be legible at the native resolution.
4. **Fast startup**: These devices have limited RAM. The app must load quickly.
5. **Offline capable**: Service worker caches everything. No internet needed after first load.
6. **D-pad priority**: Analog sticks are optional. D-pad MUST work perfectly.
7. **Gamepad API mapping**: Each handheld's built-in controls map through the standard Gamepad API when running in a browser.

### Running on Handhelds
Option A: **Hosted locally** — Run `npm run build && npm start` on the device, access via localhost
Option B: **Static export** — `next export` generates static files, serve via any local HTTP server (lighttpd, python -m http.server)
Option C: **PortMaster/RetroArch** — Package as a PortMaster app or run in RetroArch's built-in browser
Option D: **Dedicated binary** — Future: compile via Tauri for native ARM Linux binary

### Performance Considerations
- Target: 60fps UI rendering on RK3566 (Anbernic RG353 chip level)
- Audio: Web Audio API works in Chromium on Linux ARM
- Memory: Keep total JS bundle under 2MB
- Storage: IndexedDB for saves (works in Chromium)

---

## Priority 2: Touch Screen (Phone/Tablet)

See NAVIGATION_AND_INPUT.md for touch details.
Touch is supported but keyboard/gamepad/MIDI are preferred for speed.

---

## Implementation: Input Router

All input goes through a single **InputRouter** that normalizes events:

```
Keyboard Event  ─┐
Gamepad Event   ─┤
MIDI Event      ─┼──→ InputRouter ──→ Virtual Button State ──→ App
Touch Event     ─┤
Custom Mapping  ─┘
```

The InputRouter:
1. Detects connected devices on startup
2. Shows/hides touch overlay based on whether keyboard/gamepad is connected
3. Maintains a priority stack (most recently used device gets focus)
4. Allows simultaneous multi-device input (MIDI notes + gamepad navigation)
5. Stores custom mappings in project data

### Device Detection
```typescript
// Pseudocode for device detection
navigator.getGamepads()          // Gamepad API
navigator.requestMIDIAccess()    // Web MIDI API
keyboard event listeners         // Keyboard
touch event listeners            // Touch
```

When a gamepad is detected, show a brief "GAMEPAD CONNECTED" toast.
When MIDI is detected, show "MIDI: [device name]" toast.
Auto-configure known devices (8BitDo, Xbox, PS, etc.).

---

## Custom Mapping Persistence

All controller mappings are saved per-project in the project file.
Global default mappings are stored in browser localStorage.
Users can export/import mapping profiles as JSON.
