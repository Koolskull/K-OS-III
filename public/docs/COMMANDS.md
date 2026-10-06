```
              ☦
     ╔═════════════════════════╗
     ║  EFFECT COMMANDS        ║
     ║  Reference              ║
     ╚═════════════════════════╝
```

# Effect Commands

Commands are entered in the CMD columns of Phrase and Table screens.
Each command is a single letter + 2-digit hex value (e.g., `C37`).

Based on LSDj's command set, extended for our additional engines.

---

## Command List

| Cmd | Name | Phrase | Table | Description |
|-----|------|--------|-------|-------------|
| **A** | Table Start/Stop | Yes | Yes | Start table from given step. `A00` = restart, `AFF` = stop table |
| **B** | MayBe | Yes | Yes | Conditional: In phrases, maybe play note (probability). In tables, maybe hop |
| **C** | Chord | Yes | Yes | Arpeggio. First digit = semitones up 1, second digit = semitones up 2. Cycles through root + two intervals per tick |
| **D** | Delay | Yes | No | Delay note by given number of ticks |
| **E** | Envelope | Yes | Yes | Amplitude envelope. Pulse/Noise: set hardware env. Wave: set volume 0-3. FM: set operator TL. Sample: set volume |
| **F** | Wave Frame / Finetune | Yes | Yes | Pulse: set duty cycle. Kit: set sample offset. Wave: set wave frame. FM: detune |
| **G** | Groove Select | Yes | Yes | Switch to groove number. Works in both phrases and tables |
| **H** | Hop | Yes | Yes | In phrases: jump to another position (loop/skip). In tables: loop back to row. `H00-0F` = hop to row, `HXY` where X=times, Y=target |
| **K** | Kill Note | Yes | Yes | Stop note after given number of ticks |
| **L** | Slide | Yes | Yes | Portamento/glide to next note. Value = speed. In tables: continuous pitch slide |
| **M** | Master Volume | Yes | Yes | Set master output volume |
| **O** | Set Output | Yes | Yes | Panning. `OLR`: L=left(0-F), R=right(0-F). `O00`=off, `OFF`=full stereo |
| **P** | Pitch Bend | Yes | Yes | Pitch slide up/down. `P01-P7F`=slide up, `P80-PFF`=slide down. Speed varies by PITCH mode |
| **R** | Retrig / Resync | Yes | Yes | Retrigger note. First digit = times, second digit = speed. `R00` = resync without retrigger |
| **S** | Sweep / Shape | Yes | Yes | Pulse: hardware frequency sweep. Kit: loop/offset. Noise: change noise shape |
| **T** | Tempo | Yes | Yes | Set song tempo (BPM). `T00-TFF` maps to tempo range |
| **V** | Vibrato | Yes | Yes | Pitch vibrato. First digit = speed, second digit = depth |
| **W** | Wave | Yes | Yes | Pulse: set waveform duty. Wave: set synth play mode. FM: set algorithm |
| **Z** | Randomize | Yes | Yes | Randomize the last-used command's value. Useful for generative/glitch effects |

---

## Table-Specific Columns

Tables have 6 columns (matching LSDj):

| Column | Name | Description |
|--------|------|-------------|
| 1 | **VOL** | Envelope/volume per tick (first digit = amplitude, second = speed) |
| 2 | **TSP** | Transpose in semitones per tick |
| 3-4 | **CMD** | First command column (letter + value) |
| 5-6 | **CMD** | Second command column (letter + value) |

Tables advance one row per tick by default.
Use the **G** command to change the groove (speed) of a table.
Use the **H** command to create loops within a table.

---

## Phrase Columns

| Column | Name | Description |
|--------|------|-------------|
| 1 | **NOTE** | Note + octave (e.g., C-5, D#3) or sample name for Kit instruments |
| 2 | **INSTR** | Instrument number (00-FF) |
| 3-4 | **CMD** | Command column (letter + 2-digit value) |

---

## Notes on Commands

### H (Hop) - The Loop Master
- In **phrases**: `H00` = stop phrase. `H0x` = hop to row x. `Hxy` (x>0) = hop x times to row y, then continue.
- In **tables**: `H0x` = hop to row x forever (creates a loop). `Hxy` (x>0) = hop x times then continue.

### C (Chord) - Quick Arpeggios
- `C37` = cycles root, +3 semitones, +7 semitones = minor chord
- `C47` = major chord
- `C0C` = octave arpeggio
- Speed depends on groove/tick rate

### B (MayBe) - Probability
- In phrases: `B80` = 50% chance of playing the note. Value = probability (00=never, FF=always)
- In tables: `B80` = 50% chance of executing the hop
- Great for generative/algorithmic music

### Z (Randomize) - Chaos
- Randomizes the value of whatever command was used last
- Place after any other command to add controlled randomness
- Use in tables for evolving textures

---

## FM-Specific Commands (Extensions)

These only affect FM engine channels:

| Cmd | Name | Description |
|-----|------|-------------|
| **W** | Algorithm | Set FM algorithm (0-7) when on FM channel |
| **F** | Detune | Set operator detune when on FM channel |
| **E** | Op Level | Set operator total level (which op depends on context) |

### TODO: Define additional FM-specific commands as needed

---

## Noise-Specific Commands (Extensions)

| Cmd | Name | Description |
|-----|------|-------------|
| **S** | Shape | Change noise shape (WHITE/PINK/BROWN/METALLIC/DIGITAL/CUSTOM) |
| **F** | Bitrate | Set noise bitrate (01-10 maps to 1-16 bit) |

### TODO: Define bitrate warping automation via tables
