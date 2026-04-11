/*
 *                    ☦
 *               _____|_____
 *              |           |
 *              |   ☧ IC XC |
 *              |   NIKA    |
 *              |___________|
 *              |     |     |
 *              |     |     |
 *              |_____|_____|
 *
 *   The Lord watches over the data structures below.
 *   May these types be sound and true.
 *
 *   ╔═══════════════════════════════╗
 *   ║  TRACKER CORE TYPE SYSTEM    ║
 *   ╚═══════════════════════════════╝
 */

// ──────────────────────────────────────
// SLIMENTOLOGIKA - Base 16 Number System
// from the Ancient Temple of the Green Slime
// ──────────────────────────────────────
// Standard hex: 0  1  2  3  4  5  6  7  8  9  A  B  C  D  E  F
// Slime keys:   S0 S1 S2 S3 S4 S5 S6 S7 S8 S9 SA SB SC SD SE SF
// Each maps to a sprite: /sprites/ST{0-F}.png
//
// S0 = empty circle          S8 = circle variant
// S1 = circle + vert line    S9 = circle + diagonal
// S2 = circle + X            SA = circle + full X
// S3 = empty square          SB = square variant
// S4 = square + inner tri    SC = square + inner angle
// S5 = square + X            SD = square + chevron
// S6 = square + diamond      SE = square + envelope
// S7 = square + complex      SF = square + full pattern

/** Hex digit keys that map to Slimentologika sprites */
export const SLIME_HEX_KEYS = [
  "0", "1", "2", "3", "4", "5", "6", "7",
  "8", "9", "A", "B", "C", "D", "E", "F",
] as const;

export type SlimeHexKey = typeof SLIME_HEX_KEYS[number];

/** Get the sprite path for a Slimentologika digit */
export function slimeSpritePath(hexDigit: SlimeHexKey): string {
  return `/sprites/ST${hexDigit}.png`;
}

/** Convert a number to an array of Slimentologika hex keys for sprite rendering */
export function toSlimeKeys(value: number, minDigits = 1): SlimeHexKey[] {
  if (value < 0) return toSlimeKeys(-value, minDigits); // TODO: handle negative display
  const hex = value.toString(16).toUpperCase();
  const padded = hex.padStart(minDigits, "0");
  return padded.split("") as SlimeHexKey[];
}

/** Standard hex string formatting (for hex display mode) */
export function toHex(value: number, digits = 2): string {
  return value.toString(16).toUpperCase().padStart(digits, "0");
}

// ──────────────────────────────────────
// CORE TRACKER DATA MODEL
// Song → Chain → Phrase → Table
// ──────────────────────────────────────

/** Effect command applied per tick */
export interface Effect {
  command: string;   // 2-char command code (e.g. "VP" for volume pan)
  value: number;     // 0x00-0xFF
}

/** A single row in a phrase */
export interface PhraseRow {
  note: number | null;        // MIDI note number, null = empty
  instrument: number | null;  // instrument slot index
  effect1: Effect | null;     // first effect column
  effect2: Effect | null;     // second effect column
  slice: number | null;       // sample slice offset 0x00-0xFF (used when instrument is "sample" type)
                              // high nibble = coarse (1/16th), low nibble = fine (1/256th)
}

/** Phrase: 2–256 rows of note/instrument/effect data (default 16) */
export interface Phrase {
  id: number;
  rows: PhraseRow[];          // 2–256 rows, 00–FF (Shift+W+Up/Down to resize)
}

/** Table row: subroutine tick with dual effects */
export interface TableRow {
  transpose: number;          // semitone transpose
  effect1: Effect | null;
  effect2: Effect | null;
}

/** Table: looping subroutine of effects per tick */
export interface Table {
  id: number;
  rows: TableRow[];           // 16 rows
  loopStart: number;          // row to loop back to
}

/** Chain: sequence of phrase references */
export interface Chain {
  id: number;
  steps: Array<{
    phrase: number | null;    // phrase ID reference
    transpose: number;       // semitone transpose
  }>;                        // 16 steps
}

/** Song: arrangement of chains across channels */
export interface Song {
  id: number;
  name: string;
  bpm: number;
  tpb: number;               // ticks per beat
  channels: number;           // number of channels (default 8)
  rows: Array<{
    chains: (number | null)[]; // one chain ref per channel
  }>;                         // 256 rows max
}

// ──────────────────────────────────────
// INSTRUMENT SYSTEM
// ──────────────────────────────────────

export type OscillatorShape = "sine" | "square" | "saw" | "triangle" | "noise" | "fm";

/** FM operator for YM2612-style synthesis */
export interface FMOperator {
  ratio: number;              // frequency ratio
  level: number;              // output level 0-127 (TL)
  attack: number;             // attack rate 0-31 (AR)
  decay: number;              // decay rate 0-31 (DR)
  sustain: number;            // sustain level 0-15 (SL)
  release: number;            // release rate 0-15 (RR)
  detune: number;             // detune amount 0-7 (DT)
  multiple: number;           // frequency multiple 0-15 (MUL)
  d2r: number;                // decay 2 rate (sustain rate) 0-31
  rs: number;                 // rate scaling 0-3
  am: number;                 // AM enable 0-1
}

/** Instrument definition */
export interface Instrument {
  id: number;
  name: string;
  type: "synth" | "sample" | "fm";
  volume: number;             // 0-127
  pan: number;                // 0 (L) - 64 (C) - 127 (R)
  table: number | null;       // assigned table ID
  envSpeed?: number;           // envelope speed 0x00-0xFF
  envTarget?: number;          // envelope target 0x00-0xFF

  // Synth params
  oscShape?: OscillatorShape;
  cutoff?: number;
  resonance?: number;
  envAttack?: number;
  envDecay?: number;
  envSustain?: number;
  envRelease?: number;

  // FM params (YM2612 style - 4 operators)
  fmAlgorithm?: number;      // 0-7 algorithm
  fmFeedback?: number;       // 0-7 feedback
  fmFMS?: number;            // 0-7 freq mod sensitivity
  fmAMS?: number;            // 0-3 amp mod sensitivity
  fmOperators?: [FMOperator, FMOperator, FMOperator, FMOperator];

  // Sample params
  sampleId?: number;            // reference to ProjectSample.id
  sampleUrl?: string;           // legacy: external URL (fallback if no sampleId)
  sampleStart?: number;
  sampleEnd?: number;
  sampleLoop?: boolean;
  loopStart?: number;            // 0x00-0xFF (0=start of sample, FF=end)
  loopEnd?: number;              // 0x00-0xFF (loop end point)
  // Granular movement: two values define a curve across the loop cycle
  // Both signed: 0x80=0 (still), >0x80=forward, <0x80=backward
  // Equal values = constant speed, different = acceleration/deceleration
  // e.g. MVA=C0 MVB=80 → starts fast, decelerates to stop (tape pause)
  //      MVA=80 MVB=C0 → starts still, accelerates (tape start)
  //      MVA=C0 MVB=40 → forward then reverses (scratch)
  granMoveA?: number;            // 0x00-0xFF movement start speed
  granMoveB?: number;            // 0x00-0xFF movement end speed
  granSize?: number;             // 0x00-0xFF grain/loop window size (00=off/full sample)
  granSoft?: number;             // 0x00-0xFF crossfade softening at grain edges
  granHarm?: number;             // 0x00-0xFF harmonic detune per grain (80=none)

  // Macro controllers (user-assignable)
  macros: MacroController[];
}

/** User-assignable macro controller */
export interface MacroController {
  id: number;
  name: string;
  target: string;             // parameter path (e.g. "cutoff", "fmOperators.0.ratio")
  min: number;
  max: number;
  value: number;
  curve: "linear" | "exponential" | "step";
}

// ──────────────────────────────────────
// PROJECT SAMPLES
// ──────────────────────────────────────

/** Audio sample stored as binary data inside the project */
export interface ProjectSample {
  id: number;
  name: string;
  data: ArrayBuffer;
}

// ──────────────────────────────────────
// PROJECT / SAVE DATA
// ──────────────────────────────────────

export interface ProjectData {
  version: string;
  name: string;
  song: Song;
  chains: Chain[];
  phrases: Phrase[];
  tables: Table[];
  instruments: Instrument[];
  samples: ProjectSample[];
}

// ──────────────────────────────────────
// DISPLAY MODE
// ──────────────────────────────────────

export type DisplayMode = "hex" | "slime";

export type TrackerScreen =
  | "preferences" // system preferences (MIDI, audio, display scaling)
  | "instrument"  // instrument playground (default/first screen)
  | "song"        // song arrangement
  | "chain"       // chain editor
  | "phrase"      // phrase editor
  | "table"       // table editor
  | "project"     // project settings
  | "live";       // live performance mode
