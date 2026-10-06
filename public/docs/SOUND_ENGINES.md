```
              ☦
     ╔═════════════════════════╗
     ║  SOUND ENGINE MODULES   ║
     ║  Specifications         ║
     ╚═════════════════════════╝
```

# Sound Engine Modules

Each sound engine is a self-contained module that can be assigned to a channel.
Eight maximum channels total. Each channel gets ONE engine at a time.

---

## 1. Game Boy Sound Engine (DMG / GB APU Emulation)

Inspired by LSDj and Furnace Tracker's Game Boy support.
Emulates the 4-bit resolution sound chip of the original Game Boy.

### Channels (when using full GB mode, takes 4 of 8 channels)

| Channel | Type | Description |
|---------|------|-------------|
| PU1 | Pulse | Square wave with envelope AND sweep (freq sweep on PU1 only) |
| PU2 | Pulse | Square wave with envelope (no sweep) |
| WAV | Wave | Soft synth: 32-sample 4-bit wavetable, sample playback, speech synthesis |
| NOI | Noise | Noise generator with envelope and shape functions |

### Pulse Instrument Parameters
- **ENV**: 3-stage amplitude envelope. Each value = 2 hex digits: amplitude + speed. Example: `32/AD/10` = attack from 3 fast, decay to A slow, sustain at 1 hold
- **WAVE**: Duty cycle (12.5%, 25%, 50%, 75%)
- **SWEEP**: Frequency sweep (PU1 only). First digit = time, second = increase/decrease
- **PU2 TSP**: Transpose pulse channel 2 relative to PU1
- **FINETUNE**: Detune between pulse channels for phase effects
- **LENGTH**: Sound length (UNLIM = infinite)
- **OUTPUT**: L/R/LR/OFF panning
- **PITCH**: FAST (360Hz update), TICK (per tick), STEP (pitch change on P cmd), DRUM (log falloff)
- **TRANSP**: ON/OFF - whether project/chain transpose affects this instrument
- **CMD/RATE**: Command speed. 0=fastest, F=slowest
- **TABLE**: Assign a table for per-tick automation

### Wave Instrument Parameters
- **VOLUME**: 0=0%, 1=25%, 2=50%, 3=100% (hardware limitation: only 4 levels)
- **WAVE**: Select which wave to play from Wave screen
- **SYNTH**: Select which synth sound (16 synths, each uses 10 waves)
- **PLAY**: MANUAL, ONCE, LOOP, PINGPONG
- **SPEED**: Synth playback speed
- **LENGTH**: Synth sound length
- **LOOP POS**: Loop point

### Wave Synth Screen Parameters
- **SIGNAL**: Square, saw tooth, triangle, custom wave, W.FX
- **FILTER**: Low-pass, high-pass, band-pass, all-pass
- **DIST**: CLIP, FOLD, WRAP distortion modes
- **PHASE**: Waveform horizontal compression (PINCH, WARP, RESYNC, RESYN2)
- **VOLUME**: Signal volume (start/end for morphing)
- **CUTOFF**: Filter cutoff frequency (start/end)
- **Q**: Resonance
- **VSHIFT**: Vertical signal shift
- **LIMIT**: Vertical limit using DIST mode
- **PHASE**: Horizontal compression amount (start/end)

### Noise Instrument Parameters
- **ENV**: Same envelope system as Pulse
- **PITCH**: FREE (pitch changes can randomly mute) or SAFE (restarts after pitch change)
- **LENGTH**: UNLIM or timed
- **OUTPUT**: L/R/LR/OFF
- **VIBRATO**: Shape control
- **TABLE**: Per-tick automation

### Kit Instrument Parameters (Sample Playback via Wave Channel)
- **KIT**: Select sample kit (two kits: left note column + right note column)
- **VOLUME**: 0-3 levels + L/R output
- **OFFSET**: Sample start loop point
- **LEN**: ALL or partial
- **LOOP**: OFF, ON (from offset), ATK (from beginning)
- **SPEED**: Full or half speed
- **CLIP**: HARD, SOFT, FOLD, WRAP (mixing behavior when layering two kits)

---

## 2. YM2612 FM Synthesis Engine

4-operator FM synthesis inspired by the Yamaha YM2612 (Sega Genesis / Mega Drive).
As seen in Furnace Tracker and Deflemask.

### Per-Operator Parameters
- **RATIO**: Frequency ratio (0-15)
- **LEVEL**: Output level (TL: 0-127)
- **ATTACK**: Attack rate (AR: 0-31)
- **DECAY**: First decay rate (D1R: 0-31)
- **SUSTAIN**: Sustain level (SL: 0-15)
- **SUSTAIN RATE**: Second decay rate (D2R: 0-31)
- **RELEASE**: Release rate (RR: 0-15)
- **DETUNE**: Detune amount (DT: 0-7)
- **MULTIPLE**: Frequency multiple (MUL: 0-15)
- **KEY SCALE**: Rate scaling (KS: 0-3)
- **AM ENABLE**: Amplitude modulation on/off

### Global FM Parameters
- **ALGORITHM**: 0-7 (defines operator routing)
- **FEEDBACK**: 0-7 (operator 1 self-feedback)
- **LFO FREQ**: Low frequency oscillator speed
- **LFO AM DEPTH**: Amplitude modulation depth
- **LFO FM DEPTH**: Frequency modulation depth

### TODO: Define exact algorithm diagrams for our 8 algorithms

---

## 3. 16-Bit Sample Playback Module

Simple, efficient sample player.

### Constraints
- **Max samples per song**: 16
- **Max sample size**: 64KB each
- **Sample format**: 16-bit PCM (mono or stereo)
- **Supported import formats**: WAV, raw PCM
- **Total sample memory budget**: 1MB max per song (16 x 64KB)

### Per-Sample Parameters
- **START**: Sample start point
- **END**: Sample end point
- **LOOP**: OFF, FORWARD, PINGPONG
- **LOOP START**: Loop region start
- **LOOP END**: Loop region end
- **ROOT NOTE**: Base pitch (MIDI note)
- **FINETUNE**: Fine pitch adjustment
- **VOLUME**: 0-127
- **PAN**: L-C-R (0-127)

### Playback Features
- Pitch-shifted playback (chromatic, follows note input)
- Reverse playback
- One-shot or looped modes
- Half-speed mode for lo-fi effect

---

## 4. Noise Channel (Dynamic Noise Warping)

A dedicated noise synthesis engine that goes beyond simple white/pink noise.
Dynamically warps noise through different bitrates and shapes.

### Core Parameters
- **SHAPE**: Noise shape selection
  - WHITE: Full spectrum white noise
  - PINK: -3dB/octave rolled off
  - BROWN: -6dB/octave rolled off (Brownian motion)
  - METALLIC: Short-loop periodic noise (like NES/GB metallic tones)
  - DIGITAL: Quantized/crushed noise
  - CUSTOM: User-defined noise via wavetable

### Bitrate Warping
- **BITRATE**: Dynamic bit depth (1-bit through 16-bit)
  - 1-bit: Harsh square-ish noise
  - 4-bit: Game Boy style noise
  - 8-bit: Classic digital noise
  - 16-bit: Full resolution
- **BITRATE can be automated** via tables for dynamic warping over time

### Frequency Bend Module (ADSR Mode)
- **FREQ START**: Starting frequency/pitch of noise
- **FREQ END**: Target frequency after envelope
- **BEND ATTACK**: Time to reach peak frequency
- **BEND DECAY**: Time from peak to sustain frequency
- **BEND SUSTAIN**: Held frequency level
- **BEND RELEASE**: Frequency on note release
- **BEND CURVE**: LINEAR, EXPONENTIAL, LOGARITHMIC

### Amplitude Envelope (Standard ADSR)
- **ATTACK**: 0-127
- **DECAY**: 0-127
- **SUSTAIN**: 0-127
- **RELEASE**: 0-127

### Shape Modulation
- **SHAPE LFO**: Morphs between noise shapes over time
- **BITRATE LFO**: Warps bitrate with LFO
- **RING MOD**: Ring modulate noise with another channel's output

### Use Cases
- Snare drums (white noise + freq bend down)
- Hi-hats (metallic noise, short envelope)
- Risers/falls (noise with long frequency sweep)
- Texture pads (shaped noise with filter)
- Glitch effects (rapid bitrate warping via table)

---

## Channel Assignment

8 channels total. User assigns engines freely:

```
Example configurations:

[Full GB Mode + FM]
CH1: PU1    CH5: FM
CH2: PU2    CH6: FM
CH3: WAV    CH7: SAMPLE
CH4: NOI    CH8: NOISE

[FM Heavy]
CH1: FM     CH5: FM
CH2: FM     CH6: FM
CH3: FM     CH7: SAMPLE
CH4: FM     CH8: NOISE

[Hybrid]
CH1: PU1    CH5: SAMPLE
CH2: PU2    CH6: SAMPLE
CH3: FM     CH7: FM
CH4: NOISE  CH8: NOISE
```

Each channel can be reassigned per-song in the Project screen.
