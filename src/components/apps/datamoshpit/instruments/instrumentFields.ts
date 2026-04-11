/*
 *            ☦
 *      ╔══════════════════════════╗
 *      ║  INSTRUMENT FIELD LAYOUT ║
 *      ╚══════════════════════════╝
 *
 *   Defines field descriptors and layout builder
 *   for the cursor-navigable instrument editor.
 */

import type { Instrument, FMOperator, ProjectSample } from "@/types/tracker";
import { SAMPLE_MANIFEST, sampleIndexFromUrl } from "@/engine/instruments/sampleManifest";

export interface InstrumentField {
  key: string;
  label: string;       // row label (only shown on col 0)
  min: number;
  max: number;
  digits: number;      // hex display width
  get: (inst: Instrument) => number;
  set: (inst: Instrument, val: number) => Instrument;
  display?: (inst: Instrument) => string; // override for enum/string fields
}

// ── Row types ──
// A "separator" row is just a visual divider, not navigable
export type LayoutRow =
  | { type: "fields"; fields: InstrumentField[] }
  | { type: "separator"; label: string };

const INST_TYPES: Instrument["type"][] = ["sample", "fm", "synth"];

function defaultFMOperator(): FMOperator {
  return {
    ratio: 1, level: 100, attack: 0x1F, decay: 0x0A,
    sustain: 0x02, release: 0x0F, detune: 3, multiple: 1,
    d2r: 0, rs: 0, am: 0,
  };
}

function typeField(): InstrumentField {
  return {
    key: "type",
    label: "TYPE",
    min: 0,
    max: INST_TYPES.length - 1,
    digits: 0,
    get: (inst) => INST_TYPES.indexOf(inst.type),
    set: (inst, val) => {
      const newType = INST_TYPES[val];
      const updated = { ...inst, type: newType };
      // Initialize FM operators when switching to FM type
      if (newType === "fm" && !updated.fmOperators) {
        updated.fmAlgorithm = updated.fmAlgorithm ?? 0;
        updated.fmFeedback = updated.fmFeedback ?? 3;
        updated.fmFMS = updated.fmFMS ?? 0;
        updated.fmAMS = updated.fmAMS ?? 0;
        updated.fmOperators = [
          defaultFMOperator(),
          defaultFMOperator(),
          defaultFMOperator(),
          defaultFMOperator(),
        ];
      }
      return updated;
    },
    display: (inst) => inst.type.toUpperCase(),
  };
}

function simpleField(
  key: string, label: string,
  prop: keyof Instrument,
  min: number, max: number, digits: number,
  defaultVal = 0,
): InstrumentField {
  return {
    key, label, min, max, digits,
    get: (inst) => (inst[prop] as number) ?? defaultVal,
    set: (inst, val) => ({ ...inst, [prop]: val }),
  };
}

function sampleField(projectSamples?: ProjectSample[]): InstrumentField {
  // Use project samples if available, fall back to legacy manifest
  if (projectSamples && projectSamples.length > 0) {
    return {
      key: "sample",
      label: "SMPL",
      min: 0,
      max: projectSamples.length - 1,
      digits: 0,
      get: (inst) => {
        if (inst.sampleId != null) {
          const idx = projectSamples.findIndex((s) => s.id === inst.sampleId);
          return idx >= 0 ? idx : 0;
        }
        return 0;
      },
      set: (inst, val) => {
        const clamped = Math.max(0, Math.min(projectSamples.length - 1, val));
        const sample = projectSamples[clamped];
        return { ...inst, sampleId: sample.id, sampleUrl: undefined };
      },
      display: (inst) => {
        if (inst.sampleId != null) {
          const sample = projectSamples.find((s) => s.id === inst.sampleId);
          if (sample) {
            return sample.name.length > 24 ? sample.name.slice(0, 24) : sample.name;
          }
        }
        return "NONE";
      },
    };
  }

  // Legacy: hardcoded manifest
  return {
    key: "sample",
    label: "SMPL",
    min: 0,
    max: SAMPLE_MANIFEST.length - 1,
    digits: 0,
    get: (inst) => sampleIndexFromUrl(inst.sampleUrl),
    set: (inst, val) => {
      const clamped = Math.max(0, Math.min(SAMPLE_MANIFEST.length - 1, val));
      return { ...inst, sampleUrl: `/Instruments/samples/${SAMPLE_MANIFEST[clamped]}` };
    },
    display: (inst) => {
      const filename = inst.sampleUrl?.split("/").pop() ?? "NONE";
      return filename.length > 24 ? filename.slice(0, 24) : filename;
    },
  };
}

function loopField(): InstrumentField {
  return {
    key: "loop",
    label: "LOOP",
    min: 0,
    max: 1,
    digits: 0,
    get: (inst) => inst.sampleLoop ? 1 : 0,
    set: (inst, val) => ({ ...inst, sampleLoop: val === 1 }),
    display: (inst) => inst.sampleLoop ? "ON" : "OFF",
  };
}

function opField(
  opIdx: number, key: keyof FMOperator,
  label: string, min: number, max: number, digits: number,
): InstrumentField {
  return {
    key: `op${opIdx}_${key}`,
    label,
    min, max, digits,
    get: (inst) => {
      const op = inst.fmOperators?.[opIdx];
      return op ? (op[key] as number) : 0;
    },
    set: (inst, val) => {
      if (!inst.fmOperators) return inst;
      const ops = [...inst.fmOperators] as [FMOperator, FMOperator, FMOperator, FMOperator];
      ops[opIdx] = { ...ops[opIdx], [key]: val };
      return { ...inst, fmOperators: ops };
    },
  };
}

function opRow(opIdx: number): InstrumentField[] {
  return [
    opField(opIdx, "level",    "TL",  0, 0x7F, 2),
    opField(opIdx, "attack",   "AR",  0, 0x1F, 2),
    opField(opIdx, "decay",    "DR",  0, 0x1F, 2),
    opField(opIdx, "d2r",      "D2R", 0, 0x1F, 2),
    opField(opIdx, "release",  "RR",  0, 0x0F, 2),
    opField(opIdx, "sustain",  "SL",  0, 0x0F, 2),
    opField(opIdx, "multiple", "MUL", 0, 0x0F, 2),
    opField(opIdx, "detune",   "DT",  0, 0x07, 2),
    opField(opIdx, "rs",       "RS",  0, 0x03, 2),
    opField(opIdx, "am",       "AM",  0, 0x01, 2),
  ];
}

/**
 * Build the full field layout for an instrument.
 * Returns an array of LayoutRows (navigable field rows + separator rows).
 */
export function buildFieldLayout(inst: Instrument, projectSamples?: ProjectSample[]): LayoutRow[] {
  const rows: LayoutRow[] = [];

  // Common fields
  rows.push({ type: "fields", fields: [typeField()] });
  rows.push({ type: "fields", fields: [
    { key: "name", label: "NAME", min: 0, max: 0, digits: 0,
      get: () => 0, set: (i) => i,
      display: (i) => i.name },
  ]});
  rows.push({ type: "fields", fields: [simpleField("vol", "VOL", "volume", 0, 0xFF, 2)] });
  rows.push({ type: "fields", fields: [simpleField("pan", "PAN", "pan", 0, 0x7F, 2)] });
  rows.push({ type: "fields", fields: [
    {
      key: "envSpeed", label: "ENV", min: 0, max: 0xFF, digits: 2,
      get: (i) => i.envSpeed ?? 0x04,
      set: (i, v) => ({ ...i, envSpeed: v }),
    },
    {
      key: "envTarget", label: "", min: 0, max: 0xFF, digits: 2,
      get: (i) => i.envTarget ?? 0x00,
      set: (i, v) => ({ ...i, envTarget: v }),
    },
  ]});
  rows.push({ type: "fields", fields: [
    {
      key: "table", label: "TABLE", min: -1, max: 0xFF, digits: 2,
      get: (i) => i.table ?? -1,
      set: (i, v) => ({ ...i, table: v < 0 ? null : v }),
      display: (i) => i.table === null ? "--" : i.table.toString(16).toUpperCase().padStart(2, "0"),
    },
  ]});

  // Sample-only fields
  if (inst.type === "sample") {
    rows.push({ type: "separator", label: "SAMPLE" });
    rows.push({ type: "fields", fields: [sampleField(projectSamples)] });
    rows.push({ type: "fields", fields: [loopField()] });
    rows.push({ type: "fields", fields: [
      simpleField("loopStart", "LSTA", "loopStart", 0, 0xFF, 2, 0x00),
      simpleField("loopEnd", "LEND", "loopEnd", 0, 0xFF, 2, 0xFF),
    ]});
    rows.push({ type: "separator", label: "GRANULAR" });
    rows.push({ type: "fields", fields: [simpleField("granSize", "SIZE", "granSize", 0, 0xFF, 2, 0x00)] });
    rows.push({ type: "fields", fields: [
      {
        key: "granMoveA", label: "MVA", min: 0, max: 0xFF, digits: 2,
        get: (i) => i.granMoveA ?? 0x80,
        set: (i, v) => ({ ...i, granMoveA: v }),
      },
      {
        key: "granMoveB", label: "MVB", min: 0, max: 0xFF, digits: 2,
        get: (i) => i.granMoveB ?? 0x80,
        set: (i, v) => ({ ...i, granMoveB: v }),
      },
    ]});
    rows.push({ type: "fields", fields: [simpleField("granSoft", "SOFT", "granSoft", 0, 0xFF, 2, 0x00)] });
    rows.push({ type: "fields", fields: [simpleField("granHarm", "HARM", "granHarm", 0, 0xFF, 2, 0x80)] });
  }

  // FM-only fields
  if (inst.type === "fm") {
    rows.push({ type: "separator", label: "FM" });
    rows.push({ type: "fields", fields: [simpleField("algo", "ALGO", "fmAlgorithm", 0, 7, 1, 0)] });
    rows.push({ type: "fields", fields: [simpleField("fdbk", "FDBK", "fmFeedback", 0, 7, 1, 0)] });
    rows.push({ type: "fields", fields: [simpleField("fms", "FMS", "fmFMS", 0, 7, 1, 0)] });
    rows.push({ type: "fields", fields: [simpleField("ams", "AMS", "fmAMS", 0, 3, 1, 0)] });

    for (let op = 0; op < 4; op++) {
      rows.push({ type: "separator", label: `OP${op + 1}` });
      rows.push({ type: "fields", fields: opRow(op) });
    }
  }

  return rows;
}

/**
 * Get only navigable rows (fields only, no separators) from the layout.
 */
export function getNavigableRows(layout: LayoutRow[]): InstrumentField[][] {
  return layout
    .filter((r): r is { type: "fields"; fields: InstrumentField[] } => r.type === "fields")
    .map((r) => r.fields);
}
