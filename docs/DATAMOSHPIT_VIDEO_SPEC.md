# Datamoshpit A/V Architecture — Design Spec

**Status:** design document. No video-layer code is shipped in this pass. This spec is what Koolskull will review before implementation begins.

This document proposes how video, animation, iframes, image sequences, and generative shaders bind to tracker instruments. It is explicitly a **design proposal** — open questions at the bottom of the doc need Koolskull's input before code lands.

For the existing tracker architecture, see [`../CLAUDE.datamoshpit.md`](../CLAUDE.datamoshpit.md) and [`../VMI_ARTIST_GUIDE.md`](../VMI_ARTIST_GUIDE.md). Those documents are canonical and were not modified by this PR.

---

## 1. The mental model

An "instrument" in Datamoshpit is already a sound source. Extend it: every instrument **optionally** has a **Visual Module (VM)** attached.

When a note fires on that instrument, the VM receives an event:

```ts
interface NoteOnEvent {
  note: number          // MIDI note number
  velocity: number      // 0–127
  tick: number          // global tick counter
  phraseRow: number     // current phrase row index (for cuing visual sequences)
  channel: number       // 0–7
}
```

When the note ends, it gets a release event with the same channel/tick context. Between events, the VM runs its own animation loop **driven by the tracker's tick clock** — there is no separate visual clock, so audio and visuals stay frame-accurate against each other regardless of system load.

**Critical principle:** the tracker is the master clock. Visuals slave to ticks, never the other way around. If a visual layer can't keep up, it drops frames; it does not slow the audio.

---

## 2. VM types

### v0 — pick three to spec concretely

#### 2.1 Image Sequence VM

A folder of PNGs played as an animation.

**Behavior:**
- Advance frame on note-on
- Hold on sustain (or loop within a defined sub-range)
- Release on note-off (snaps to a "released" frame or fades, configurable)

**Parameters:**
- Folder path (relative to project)
- Frame rate (independent of tick rate, in case the visual wants to play fast/slow against the music)
- Loop mode: `once` / `loop` / `ping-pong`
- Note-to-frame mapping: `single` (every note plays the whole sequence) / `pitch-mapped` (note pitch → frame index, useful for animated character sheets)
- Frame-on-released (default: blank)

**Asset format:** plain PNG sequences. Compatible with the existing VMI naming convention from `VMI_ARTIST_GUIDE.md` so the same artists can produce both VMI buttons and visual instruments.

#### 2.2 Iframe VM

An arbitrary URL loaded in a sandboxed iframe.

**Behavior:**
- Receives note events via `postMessage` on the documented schema (below)
- Renders whatever it wants inside the iframe
- Can post messages back if the host wants to react to the visual (open question: do we let visuals influence the music?)

**Parameters:**
- URL (local path or http(s)://)
- Pixel dimensions (so the layer is sized predictably regardless of the iframe's intrinsic size)
- Sandbox attributes (default: `sandbox="allow-scripts allow-same-origin"` — the strict default; permissive flags require explicit opt-in)

**`postMessage` schema** (documented so external developers can write HTML5 visualizers that plug in):

```ts
type DatamoshpitMessage =
  | { type: 'note-on'; note: number; velocity: number; tick: number; phraseRow: number; channel: number }
  | { type: 'note-off'; note: number; tick: number; channel: number }
  | { type: 'tick'; tick: number; bpm: number }
  | { type: 'pause' }
  | { type: 'play'; tick: number }
  | { type: 'stop' }
  | { type: 'channel-energy'; channel: number; level: number }  // optional, sent if iframe subscribes
```

Iframes that want channel energy data (for audio-reactive visuals) post a subscription message back: `{ type: 'subscribe'; topic: 'channel-energy' }`.

#### 2.3 Shader VM

A GLSL fragment shader running on a Three.js plane filling the layer's region.

**Behavior:**
- Runs every frame
- Uniforms auto-bound from tracker state

**Auto-bound uniforms:**

| Uniform | Type | Source |
|---|---|---|
| `uTime` | float | seconds since playback started |
| `uNote` | float | last note received (-1 if none) |
| `uVelocity` | float | last velocity (0..1) |
| `uTick` | float | global tick counter |
| `uChannelEnergy[8]` | float[8] | per-channel post-fader RMS energy, 0..1 |
| `uPrevTexture` | sampler2D | the previous frame of this layer's output, for feedback / datamosh effects |
| `uResolution` | vec2 | layer pixel dimensions |

**Starter shaders shipped in v0:**

1. **`plasma`** — the classic demoscene plasma. Cheap, looks alive, good default.
2. **`crt-feedback`** — feedback-loop shader using `uPrevTexture` to produce phosphor trails / smear / datamosh artifacts. The flagship of the visual system; gives the project its name.
3. **`glitch-block`** — bytewise rectangular displacement keyed to note velocity. Hard, fast, very 2KOOL.

**Asset format:** plain `.frag` files in `public/shaders/<shader-id>/main.frag`, with an optional `meta.json` declaring custom uniforms the user can edit from the Instrument screen.

### Out of scope for v0 (mention as "Later")

- **Video-file VM** — `<video>` element fed `currentTime` from the tracker clock. Codec issues and seeking accuracy make this a v0.5 conversation.
- **Webcam VM** — getUserMedia source for live performance. Permission UX is its own design conversation.
- **Canvas2D VM** — for procedural visuals that don't need shader power. Easy to add later; not strictly necessary for v0 because the Iframe VM covers this use case (an iframe can host a 2D canvas).

---

## 3. The VM-to-instrument binding UI

VM configuration appears on the Instrument screen (F4). The proposal:

```
INSTRUMENT 03
─────────────────────────────────
TYPE        FM
ENGINE      YM2612
ALG         01
FB          07
…
─────────────────────────────────
VM          ---     ← cycles: --- / IMG / IFR / SHA / CUSTOM
  (when VM is non-empty, a sub-panel appears here)
```

When VM is set to a type, a sub-panel appears below showing parameters for that type. Example for `SHA`:

```
VM          SHA
  SHADER    crt-feedback
  PARAM 1   FEEDBACK    F4
  PARAM 2   ZOOM        80
  PARAM 3   TINT_R      00
  PARAM 4   TINT_G      F0
  PARAM 5   TINT_B      40
```

Cursor navigation and value editing follow the existing tracker conventions (Q+arrows, etc. — see `koolskull-os-ui-notes.md`). **No new control modalities.** The VM panel is a normal Instrument-screen panel that just happens to control visuals.

This **does not break the existing tracker look** — VM is one new row, hidden by default (rendered as `---`), revealed on demand. Users who don't use VMs see an unchanged Instrument screen.

---

## 4. Compositor

Multiple VMs from multiple channels combine into one visual output through a layer stack.

### Layer model

- **8 layers**, one per tracker channel.
- Each layer has a **blend mode**: `normal`, `add`, `multiply`, `screen`, `difference`.
- Each layer has an **opacity** (0..1).
- Each layer has an **enabled** flag (if false, the layer is skipped — useful for muting visuals without muting audio).

The stack is rendered bottom-up (channel 1 = bottom, channel 8 = top). Final output is a single canvas at a configurable resolution.

### Output destinations

- **Embedded panel** — renders inside a window in the K-OS desktop (a sibling to Datamoshpit's main window). Default size and aspect configurable.
- **Fullscreen** — pop-out, hides the rest of the OS chrome. Toggle with a hotkey (proposal: `F11` while Datamoshpit is focused, or a "fullscreen visuals" button on the project screen).
- **External display** — for live performance, the visuals window is dragged to a second monitor. No special handling needed; this is just a fullscreen-on-second-monitor case.

---

## 5. Performance budget

**Target:** 60fps on a mid-range laptop with 8 channels active and 3 of them running shaders.

### Concerns

- **Feedback shaders need an FBO pool.** Each shader-VM instance that uses `uPrevTexture` requires its own framebuffer-object ping-pong pair. With 3 active feedback shaders that's 6 FBOs at the layer's resolution; budget GPU memory accordingly. A pool that allocates lazily and reuses on layer destroy keeps this in check.
- **Iframes can jank the main thread.** A misbehaving iframe (heavy JS, sync XHR, layout thrash) blocks the host. Mitigations: a per-iframe time-budget warning when `requestAnimationFrame` callbacks routinely take > 8ms; a documented best-practice for iframe authors.
- **Image Sequence VMs can blow GPU memory** if a long high-resolution sequence is preloaded. Stream from disk for sequences > N frames (TBD by experiment), and warn the user when adding a sequence that would exceed the budget.
- **Compositor blend modes** are inexpensive on GPU but can add up. Default to `normal` and let the user opt into expensive modes.

### Telemetry

A small overlay (toggleable, off by default) shows:

- Compositor frame time
- Per-layer frame time
- Active FBO count
- Iframe message backlog per iframe

This makes performance problems visible without requiring browser dev tools.

---

## 6. Persistence

VM configuration is saved alongside the existing project file. Proposal: extend the project format to a versioned schema with a top-level `visuals` block:

```json
{
  "version": "k3.1",
  "project": { /* existing tracker project data */ },
  "visuals": {
    "layers": [
      {
        "channel": 0,
        "vm": {
          "type": "shader",
          "shaderId": "crt-feedback",
          "params": { "FEEDBACK": 244, "ZOOM": 128, "TINT_R": 0, "TINT_G": 240, "TINT_B": 64 }
        },
        "blend": "screen",
        "opacity": 0.8,
        "enabled": true
      }
    ],
    "outputResolution": [640, 360]
  }
}
```

**File extension:** `.k3proj` proposed for the new format. Old `.dmproj` (or whatever the current format is — TBD per the existing ProjectFactory) is migrated on load with a `version` upgrade pass.

**Asset references:** image sequences and shaders are referenced by relative path so projects are portable. A future "package project" action zips the project + referenced assets for sharing.

---

## 7. Naming

Koolskull has flagged "datamoshpit" as possibly temporary. Proposed alternatives, in the 2KOOL aesthetic, ranked:

| # | Name | Why |
|---|---|---|
| **0** | **DATAMOSHPIT** | The current name. Carries existing brand equity and the visual identity is built around it. The CRT-feedback shader is literally "datamosh" in motion. Don't change this without a reason. |
| 1 | **VHSALMS** | Pun on VHS + Psalms. Devotional + glitch-aesthetic. Reads as a single word, fits the K-OS naming pattern (single-word, all-caps). |
| 2 | **GREENSLIME TRACKER** | Roots the name in the Slimentologika / Ancient Temple of the Green Slime mythology. Two words; might tire faster than a single-word name. |
| 3 | **NOMOS** (Greek: order, law) | Short, mysterious, fits the devotional thread without being on-the-nose. Risk: nobody knows how to pronounce it on first read. |
| 4 | **K-TRAKKER** | K-* family naming pattern (K-OS, K-Wallet, K-CHAT, K-TRAKKER). Clean, consistent. Risk: loses the existing brand color. |
| 5 | **MORTIFY** | Old word for "to put to death the deeds of the body" (Romans 8:13). Strong devotional. Visceral. May read too dark for a music tool. |

Default ranking, subject to Koolskull's veto: **stay with DATAMOSHPIT**. The name is doing work the alternatives would have to re-earn.

---

## 8. Open questions (need Koolskull's input)

These are unresolved decisions that gate implementation. Ordered by urgency.

1. **Default size/aspect of the embedded visuals panel.** A 16:9 320×180 default would feel handheld-friendly; 4:3 256×192 would feel Game Boy / NES; square 256×256 would feel art-piece. What's the right default?
2. **Visuals → music feedback loop.** Do we let visuals (especially Iframe VMs) post messages back that *influence* the music — e.g., a visual that detects something via webcam and sends a note-trigger? Or is the visual layer strictly downstream of the music?
3. **Project file format extension.** `.k3proj` as proposed, or extend the existing `.dmproj` (or whatever the current extension is) with a version bump? Either is fine technically; the question is brand continuity.
4. **Where the visuals window lives.** A sibling window in the desktop, or a panel inside Datamoshpit's main window? The former is more flexible for live performance; the latter is more discoverable for first-time users.
5. **Fullscreen visuals hotkey.** `F11`, a button on the project screen, or both? Conflicts with the browser's own fullscreen on `F11`?
6. **Naming.** Per § 7. Default is to stay with DATAMOSHPIT.
7. **Iframe sandbox defaults.** `allow-scripts allow-same-origin` is permissive enough for most visualizers but does allow the iframe to read its own document state and call APIs. Stricter default (just `allow-scripts`)? Stricter and let the user explicitly opt into permissions per-instrument?
8. **Performance overlay toggle.** A keyboard shortcut, a checkbox in project settings, or always on for development builds? What about end-user builds — show by default or hide?
9. **VMI compatibility.** Image Sequence VMs use plain PNG sequences. Should they be **directly compatible** with the VMI naming convention (`SSSSXX.PNG` from `VMI_ARTIST_GUIDE.md`) so the same source assets can drive a button and a visual instrument? Or are these two different asset types that just look similar?
10. **Export pipeline.** When the user wants to export a song-with-visuals, what's the deliverable? An HTML5/JS zip (per workspace `CLAUDE.md` Phase 2c)? An MP4 via FFmpeg.wasm? Both? This is downstream of v0 but the answer shapes how the visuals layer is built — a render-to-MP4 path means the compositor must support deterministic-seeking offline rendering, which is a different architecture from real-time playback.

---

## 9. References

- Existing canonical specs (do not modify in this PR): [`../CLAUDE.datamoshpit.md`](../CLAUDE.datamoshpit.md), [`../VMI_ARTIST_GUIDE.md`](../VMI_ARTIST_GUIDE.md)
- Three.js shader / FBO docs — https://threejs.org/manual/
- HTML5 iframe sandbox — https://developer.mozilla.org/en-US/docs/Web/HTML/Element/iframe#sandbox
- Demoscene reference for the starter shaders — Shadertoy archive, https://shadertoy.com
