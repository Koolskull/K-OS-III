/** Browser project for Datamoshpit. Same song shape as the desktop app, without a plugin host. */

export const CHANNELS = 8;
export const LAYERS = 4;
export const SONG_ROWS = 256;
export const CHAIN_STEPS = 16;
export const SLOTS = 256;
export const MAX_PHRASE = 256;
export const MAX_TABLE = 64;

export type InstType = "synth" | "sampler" | "fm" | "plugin";
export type ScreenName =
  | "song"
  | "chain"
  | "phrase"
  | "layer"
  | "table"
  | "instrument"
  | "live"
  | "project";

export const SCREENS: ScreenName[] = [
  "song",
  "chain",
  "phrase",
  "layer",
  "table",
  "instrument",
  "live",
  "project",
];

export interface Adsr {
  a: number;
  d: number;
  s: number;
  r: number;
}

export interface Effect {
  on: boolean;
  cmd: string;
  value: number;
}

export const TRACKER_NAME = "THRASH TRACKER PRO";
export const TRACKER_VERSION = "v0.51";
export const TRACKER_TITLE = `${TRACKER_NAME} ${TRACKER_VERSION}`;

export interface Cell {
  note: number;
  instrument: number;
  volume: number;
  slice: number;
  loop: number;
  /** -1 empty, 0 left, 1 down, 2 up, 3 right. Drawn, not played as a game yet. */
  step: number;
  fx: Effect;
}

export interface Phrase {
  used: boolean;
  length: number;
  rows: Cell[];
  gain: number[];
  root: number[];
}

export interface ChainStep {
  phrase: number;
  transpose: number;
}

export interface Chain {
  used: boolean;
  steps: ChainStep[];
}

export interface TableRow {
  transposeOn: boolean;
  transpose: number;
  slice: number;
  repeatCount: number;
  repeatRate: number;
  filterMode: number;
  cutoff: number;
  resonance: number;
  crushRate: number;
  crushBits: number;
  vstSlot: number;
  vstParam: number;
  vstValue: number;
  fx1: Effect;
  fx2: Effect;
}

export interface Table {
  used: boolean;
  name: string;
  length: number;
  loopStart: number;
  rows: TableRow[];
}

export interface YmOp {
  dt: number;
  mul: number;
  tl: number;
  rs: number;
  ar: number;
  dr: number;
  sr: number;
  rr: number;
  sl: number;
  am: number;
  ssg: number;
}

export interface YmPatch {
  algorithm: number;
  feedback: number;
  ams: number;
  fms: number;
  lfo: number;
  op: YmOp[];
}

export interface InstLayer {
  used: boolean;
  type: InstType;
  osc: number;
  sampleId: number;
  env: Adsr;
  ym: YmPatch;
}

export interface Instrument {
  used: boolean;
  name: string;
  type: InstType;
  osc: number;
  volume: number;
  pan: number;
  table: number;
  tableHold: boolean;
  sampleId: number;
  env: Adsr;
  slotted: boolean;
  slot: number;
  layers: InstLayer[];
  ym: YmPatch;
}

export interface SampleData {
  id: number;
  name: string;
  rate: number;
  pcm: Float32Array;
}

export interface Project {
  version: string;
  name: string;
  bpm: number;
  tpb: number;
  song: number[][];
  chains: Chain[];
  phrases: Phrase[];
  tables: Table[];
  instruments: Instrument[];
  samples: SampleData[];
}

export const SQUARE_ADSR: Adsr = { a: 0, d: 64, s: 0, r: 64 };
export const SHAPED_ADSR: Adsr = { a: 16, d: 64, s: 64, r: 64 };

const NOTE_NAMES = ["C-", "C#", "D-", "D#", "E-", "F-", "F#", "G-", "G#", "A-", "A#", "B-"];

export function hex2(value: number): string {
  const n = Math.max(0, Math.min(255, value | 0));
  return n.toString(16).toUpperCase().padStart(2, "0");
}

export function hexOrDash(value: number): string {
  return value < 0 ? "--" : hex2(value);
}

export function noteName(midi: number): string {
  const note = Math.max(0, Math.min(127, midi | 0));
  const octave = Math.floor(note / 12) - 1;
  return NOTE_NAMES[note % 12] + String(octave);
}

export function emptyEffect(): Effect {
  return { on: false, cmd: "--", value: 0 };
}

export function emptyCell(): Cell {
  return {
    note: -1,
    instrument: -1,
    volume: -1,
    slice: -1,
    loop: -1,
    step: -1,
    fx: emptyEffect(),
  };
}

export function defaultYm(): YmPatch {
  const op = (dt: number, mul: number, tl: number, ar: number, dr: number, rr: number, sl: number): YmOp => ({
    dt, mul, tl, rs: 0, ar, dr, sr: 0, rr, sl, am: 0, ssg: 0,
  });
  return {
    algorithm: 4,
    feedback: 4,
    ams: 0,
    fms: 0,
    lfo: 0,
    op: [
      op(3, 2, 0x12, 0x1f, 0x0a, 0x08, 0x02),
      op(0, 1, 0x00, 0x1f, 0x08, 0x07, 0x01),
      op(0, 1, 0x28, 0x1f, 0x0c, 0x08, 0x04),
      op(3, 2, 0x14, 0x1c, 0x0a, 0x06, 0x03),
    ],
  };
}

function emptyLayer(): InstLayer {
  return { used: false, type: "synth", osc: 1, sampleId: -1, env: { ...SHAPED_ADSR }, ym: defaultYm() };
}

export function emptyInstrument(): Instrument {
  return {
    used: false,
    name: "NULL",
    type: "synth",
    osc: 1,
    volume: 100,
    pan: 64,
    table: -1,
    tableHold: false,
    sampleId: -1,
    env: { ...SHAPED_ADSR },
    slotted: false,
    slot: 0,
    layers: [emptyLayer(), emptyLayer(), emptyLayer(), emptyLayer()],
    ym: defaultYm(),
  };
}

function emptyPhrase(): Phrase {
  return {
    used: false,
    length: 16,
    rows: [],
    gain: [0x7f, 0x7f, 0x7f, 0x7f],
    root: [0, 0, 0, 0],
  };
}

function emptyChain(): Chain {
  return {
    used: false,
    steps: Array.from({ length: CHAIN_STEPS }, () => ({ phrase: -1, transpose: 0 })),
  };
}

function emptyTableRow(): TableRow {
  return {
    transposeOn: false,
    transpose: 0,
    slice: -1,
    repeatCount: 0,
    repeatRate: 0,
    filterMode: -1,
    cutoff: -1,
    resonance: -1,
    crushRate: -1,
    crushBits: -1,
    vstSlot: -1,
    vstParam: -1,
    vstValue: -1,
    fx1: emptyEffect(),
    fx2: emptyEffect(),
  };
}

function emptyTable(): Table {
  return { used: false, name: "", length: 16, loopStart: 0, rows: [] };
}

export function cellAt(phrase: Phrase, row: number): Cell {
  while (phrase.rows.length <= row) phrase.rows.push(emptyCell());
  return phrase.rows[row];
}

export function tableRowAt(table: Table, row: number): TableRow {
  while (table.rows.length <= row) table.rows.push(emptyTableRow());
  return table.rows[row];
}

export const AMEN_ROWS = 128;
export const AMEN_BEATS = 16;
export const AMEN_URL = "/samples/Amen_184bpm.wav";

export function amenTempo(rate: number, frames: number): number {
  if (frames <= 0 || rate <= 0) return 184;
  return (AMEN_BEATS * rate * 60) / frames;
}

export function isUntouchedFactory(project: Project): boolean {
  const inst = project.instruments[0];
  const phrase = project.phrases[0];
  const cell = phrase?.rows[0];
  const later = (phrase?.rows ?? []).slice(1).some((row) => row.note >= 0);
  return (
    project.samples.every((sample) => sample.pcm.length === 0) &&
    inst?.name === "OSC" &&
    inst.type === "synth" &&
    phrase?.length === 32 &&
    !later &&
    cell?.note === 60 &&
    cell.instrument === 0
  );
}

export function amenNeedsAudio(project: Project): boolean {
  const inst = project.instruments[0];
  if (!inst?.used || inst.name !== "AMEN") return false;
  const id = inst.sampleId >= 0 ? inst.sampleId : 0;
  const sample = project.samples.find((item) => item.id === id);
  return !sample || sample.pcm.length === 0;
}

export function installAmenBreak(project: Project, sample: SampleData, reshape: boolean): void {
  const index = project.samples.findIndex((item) => item.id === sample.id);
  if (index >= 0) project.samples[index] = sample;
  else project.samples.push(sample);
  const inst = project.instruments[0];
  inst.used = true;
  inst.name = "AMEN";
  inst.type = "sampler";
  inst.sampleId = sample.id;
  inst.volume = 127;
  inst.pan = 64;
  inst.slotted = true;
  inst.slot = 0;
  inst.env = { a: 0, d: 0, s: 100, r: 0 };
  inst.layers.forEach((layer) => {
    layer.used = false;
    layer.sampleId = -1;
  });
  inst.layers[0].used = true;
  inst.layers[0].type = "sampler";
  inst.layers[0].sampleId = sample.id;
  inst.layers[0].env = { a: 0, d: 0, s: 100, r: 0 };
  if (!reshape) return;
  project.tpb = 8;
  project.bpm = amenTempo(sample.rate, sample.pcm.length);
  const phrase = project.phrases[0];
  phrase.used = true;
  phrase.length = AMEN_ROWS;
  phrase.gain = [0x7f, 0, 0, 0];
  const cell = cellAt(phrase, 0);
  cell.note = 60;
  cell.instrument = 0;
  cell.volume = 0x80;
}

export function createDefault(): Project {
  const song = Array.from({ length: SONG_ROWS }, () => Array.from({ length: CHANNELS }, () => -1));
  song[0][0] = 0;
  const chains = Array.from({ length: SLOTS }, () => emptyChain());
  chains[0].used = true;
  chains[0].steps[0].phrase = 0;
  const phrases = Array.from({ length: SLOTS }, () => emptyPhrase());
  phrases[0].used = true;
  phrases[0].length = 32;
  phrases[0].gain = [0x7f, 0, 0, 0];
  const first = cellAt(phrases[0], 0);
  first.note = 60;
  first.instrument = 0;
  first.volume = 0x80;
  const tables = Array.from({ length: SLOTS }, () => emptyTable());
  tables[0].used = true;
  tables[0].length = 16;
  const instruments = Array.from({ length: SLOTS }, () => emptyInstrument());
  const osc = instruments[0];
  osc.used = true;
  osc.name = "OSC";
  osc.type = "synth";
  osc.osc = 1;
  osc.volume = 127;
  osc.pan = 64;
  osc.table = 0;
  return {
    version: "dm2.web",
    name: "UNTITLED",
    bpm: 120,
    tpb: 8,
    song,
    chains,
    phrases,
    tables,
    instruments,
    samples: [],
  };
}

export function blankInstrument(project: Project, instrumentId: number): void {
  if (instrumentId < 0 || instrumentId >= SLOTS) return;
  const inst = project.instruments[instrumentId];
  inst.used = true;
  inst.slotted = true;
  inst.slot = 0;
  inst.name = "SQ" + hex2(instrumentId);
  inst.type = "synth";
  inst.osc = 1;
  inst.volume = 127;
  inst.pan = 64;
  inst.env = { ...SQUARE_ADSR };
  inst.sampleId = -1;
  inst.layers.forEach((layer) => {
    layer.used = false;
    layer.type = "synth";
    layer.osc = 1;
    layer.env = { ...SQUARE_ADSR };
    layer.sampleId = -1;
  });
  inst.layers[0].used = true;
  inst.layers[0].type = "synth";
  inst.layers[0].osc = 1;
  inst.layers[0].env = { ...SQUARE_ADSR };
}

export function seedNote(cell: Cell): void {
  if (cell.note < 0) cell.note = 60;
  if (cell.volume < 0) cell.volume = 0x80;
}

export function nextFreeInstrument(project: Project): number {
  const found = project.instruments.findIndex((inst) => !inst.used);
  return found < 0 ? 0 : found;
}

export interface PlayFace {
  type: InstType;
  osc: number;
  sampleId: number;
  env: Adsr;
  volume: number;
  pan: number;
  table: number;
  tableHold: boolean;
  ym: YmPatch;
}

export function audibleFace(inst: Instrument, layer: number): PlayFace | null {
  if (inst.slotted) {
    const op = inst.layers[Math.max(0, Math.min(LAYERS - 1, layer))];
    if (!op?.used) return null;
    if (op.type === "plugin") return null;
    return {
      type: op.type,
      osc: op.osc,
      sampleId: op.sampleId,
      env: op.env,
      volume: inst.volume,
      pan: inst.pan,
      table: inst.table,
      tableHold: inst.tableHold,
      ym: op.type === "fm" ? op.ym : inst.ym,
    };
  }
  if (layer !== 0) return null;
  if (inst.type === "plugin") return null;
  return {
    type: inst.type,
    osc: inst.osc,
    sampleId: inst.sampleId,
    env: inst.env,
    volume: inst.volume,
    pan: inst.pan,
    table: inst.table,
    tableHold: inst.tableHold,
    ym: inst.ym,
  };
}

export interface PlaybackProject {
  bpm: number;
  tpb: number;
  song: number[][];
  chains: { phrase: number; transpose: number }[][];
  phrases: Array<{
    length: number;
    gain: number[];
    root: number[];
    rows: Array<Cell | null>;
  } | null>;
  tables: Array<{
    length: number;
    loopStart: number;
    rows: TableRow[];
  } | null>;
  instruments: Array<{
    used: boolean;
    type: InstType;
    osc: number;
    volume: number;
    pan: number;
    table: number;
    tableHold: boolean;
    sampleId: number;
    env: Adsr;
    slotted: boolean;
    ym: YmPatch;
    layers: InstLayer[];
  }>;
}

export function playbackSnapshot(project: Project): PlaybackProject {
  return {
    bpm: project.bpm,
    tpb: project.tpb,
    song: project.song,
    chains: project.chains.map((chain) => chain.steps),
    phrases: project.phrases.map((phrase) =>
      phrase.used
        ? {
            length: phrase.length,
            gain: phrase.gain,
            root: phrase.root,
            rows: phrase.rows.map((row) => row),
          }
        : null,
    ),
    tables: project.tables.map((table) =>
      table.used
        ? { length: table.length, loopStart: table.loopStart, rows: table.rows }
        : null,
    ),
    instruments: project.instruments.map((inst) => ({
      used: inst.used,
      type: inst.type,
      osc: inst.osc,
      volume: inst.volume,
      pan: inst.pan,
      table: inst.table,
      tableHold: inst.tableHold,
      sampleId: inst.sampleId,
      env: inst.env,
      slotted: inst.slotted,
      ym: inst.ym,
      layers: inst.layers,
    })),
  };
}

interface StoredSample {
  id: number;
  name: string;
  rate: number;
  pcm: string;
}

interface StoredProject {
  version: string;
  name: string;
  bpm: number;
  tpb: number;
  song: number[][];
  chains: Chain[];
  phrases: Phrase[];
  tables: Table[];
  instruments: Instrument[];
  samples?: StoredSample[];
}

function pcmToB64(pcm: Float32Array): string {
  const bytes = new Uint8Array(pcm.length * 2);
  const view = new DataView(bytes.buffer);
  for (let i = 0; i < pcm.length; i++) {
    const s = Math.max(-1, Math.min(1, pcm[i]));
    view.setInt16(i * 2, s < 0 ? s * 0x8000 : s * 0x7fff, true);
  }
  let binary = "";
  const chunk = 0x8000;
  for (let i = 0; i < bytes.length; i += chunk)
    binary += String.fromCharCode(...bytes.subarray(i, i + chunk));
  return btoa(binary);
}

function b64ToPcm(text: string): Float32Array {
  const binary = atob(text);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  const view = new DataView(bytes.buffer);
  const pcm = new Float32Array(Math.floor(bytes.length / 2));
  for (let i = 0; i < pcm.length; i++) pcm[i] = view.getInt16(i * 2, true) / 0x8000;
  return pcm;
}

export function serialize(project: Project, withSamples: boolean): string {
  const stored: StoredProject = {
    version: project.version,
    name: project.name,
    bpm: project.bpm,
    tpb: project.tpb,
    song: project.song,
    chains: project.chains,
    phrases: project.phrases,
    tables: project.tables,
    instruments: project.instruments,
    samples: withSamples
      ? project.samples.map((sample) => ({
          id: sample.id,
          name: sample.name,
          rate: sample.rate,
          pcm: pcmToB64(sample.pcm),
        }))
      : [],
  };
  return JSON.stringify(stored);
}

export function deserialize(text: string): Project {
  const raw = JSON.parse(text) as StoredProject;
  const base = createDefault();
  base.name = raw.name || "UNTITLED";
  base.bpm = Number(raw.bpm) || 120;
  base.tpb = Number(raw.tpb) || 8;
  if (Array.isArray(raw.song)) base.song = raw.song;
  if (Array.isArray(raw.chains)) base.chains = raw.chains;
  if (Array.isArray(raw.phrases)) base.phrases = raw.phrases;
  if (Array.isArray(raw.tables)) base.tables = raw.tables;
  if (Array.isArray(raw.instruments)) {
    base.instruments = raw.instruments.map((inst) => ({
      ...emptyInstrument(),
      ...inst,
      layers: inst.layers?.length === 4 ? inst.layers : emptyInstrument().layers,
      ym: inst.ym ?? defaultYm(),
      env: inst.env ?? { ...SHAPED_ADSR },
    }));
  }
  base.samples = (raw.samples ?? []).map((sample) => ({
    id: sample.id,
    name: sample.name,
    rate: sample.rate,
    pcm: b64ToPcm(sample.pcm),
  }));
  return base;
}
