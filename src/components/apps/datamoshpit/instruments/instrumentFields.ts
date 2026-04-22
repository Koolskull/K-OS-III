/*
 *            ☦
 *      ╔══════════════════════════╗
 *      ║  INSTRUMENT FIELD LAYOUT ║
 *      ╚══════════════════════════╝
 *
 *   Defines field descriptors and layout builder
 *   for the cursor-navigable instrument editor.
 */

import type {
  Instrument, FMOperator, ProjectSample,
  InstrumentVisual, VisualSource, VisualTriggerMode,
} from "@/types/tracker";
import { VISUAL_FRAMES_MIN, VISUAL_FRAMES_MAX } from "@/types/tracker";
import { SAMPLE_MANIFEST, sampleIndexFromUrl } from "@/engine/instruments/sampleManifest";
import {
  defaultVisualForInstrument,
  rollVisualForInstrument,
} from "@/components/apps/datamoshpit/visuals/scene-vm";

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

  // Per-instrument visual section — toggle reveals the controls
  rows.push({ type: "separator", label: "VISUAL" });
  for (const r of visualRows(inst)) rows.push(r);

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

/* ------------------------------------------------------------------ */
/*  VISUAL section                                                     */
/* ------------------------------------------------------------------ */

const VISUAL_SOURCES: VisualSource[] = [
  "none", "color", "image", "video", "shader", "model", "iframe",
];
const VISUAL_SOURCE_LABELS: Record<VisualSource, string> = {
  none: "NONE", color: "COLOR", image: "IMAGE", video: "VIDEO",
  shader: "SHADER", model: "MODEL", iframe: "IFRAME",
};

const VISUAL_TRIGGERS: VisualTriggerMode[] = [
  "play-from-start", "play-from-frame", "pitch-mapped", "velocity-amp", "none",
];
const VISUAL_TRIGGER_LABELS: Record<VisualTriggerMode, string> = {
  "play-from-start": "START",
  "play-from-frame": "FRAME",
  "pitch-mapped":    "PITCH",
  "velocity-amp":    "VELAMP",
  "none":            "NONE",
};

const SHADER_IDS = ["plasma", "crt-feedback", "glitch-block"] as const;

function ensureVisual(inst: Instrument): InstrumentVisual {
  return inst.visual ?? defaultVisualForInstrument(inst.id, inst.type);
}

function patchVisual(inst: Instrument, patch: Partial<InstrumentVisual>): Instrument {
  return { ...inst, visual: { ...ensureVisual(inst), ...patch } };
}

function visualEnabledField(): InstrumentField {
  return {
    key: "v_enabled", label: "ENABL",
    min: 0, max: 1, digits: 0,
    get: (i) => (ensureVisual(i).enabled ? 1 : 0),
    set: (i, v) => patchVisual(i, { enabled: v === 1 }),
    display: (i) => (ensureVisual(i).enabled ? "ON" : "OFF"),
  };
}

function visualSeedField(): InstrumentField {
  // SEED isn't stored — every change re-rolls all the random fields. We use
  // the field's "value" purely as an Q-flick counter for the user (00..FF).
  // Internally we feed it as the seedOffset to rollVisualForInstrument.
  return {
    key: "v_seed", label: "RND",
    min: 0, max: 0xFF, digits: 2,
    // We don't persist a seed on the visual; show a stable 00 unless the user just bumped it.
    // The displayed value is derived from a transient prop on visual we add below.
    get: (i) => (ensureVisual(i)._seed ?? 0) as number,
    set: (i, v) => {
      const cur = ensureVisual(i);
      const rolled = rollVisualForInstrument(i.id, i.type, cur.enabled, v);
      // preserve user-set color/asset/etc that they might want to keep across re-rolls?
      // For v0: re-rolling fully replaces the random fields. Power users edit individual
      // fields after they find a roll they like.
      return { ...i, visual: { ...rolled, _seed: v } };
    },
  };
}

function visualSourceField(): InstrumentField {
  return {
    key: "v_src", label: "SRC",
    min: 0, max: VISUAL_SOURCES.length - 1, digits: 0,
    get: (i) => VISUAL_SOURCES.indexOf(ensureVisual(i).source),
    set: (i, v) => patchVisual(i, { source: VISUAL_SOURCES[v] }),
    display: (i) => VISUAL_SOURCE_LABELS[ensureVisual(i).source],
  };
}

function visualColorField(): InstrumentField {
  // Single hex byte cycles through a 256-entry palette generated per the value.
  // Lets the user Q-flick colors without a full color picker.
  return {
    key: "v_color", label: "COLOR",
    min: 0, max: 0xFF, digits: 2,
    get: (i) => paletteIndexFromColor(ensureVisual(i).color ?? "#ffffff"),
    set: (i, v) => patchVisual(i, { color: paletteColor(v) }),
    display: (i) => ensureVisual(i).color ?? "#FFFFFF",
  };
}

function visualShaderField(): InstrumentField {
  return {
    key: "v_shader", label: "SHADR",
    min: 0, max: SHADER_IDS.length - 1, digits: 0,
    get: (i) => Math.max(0, SHADER_IDS.indexOf((ensureVisual(i).shaderId ?? "plasma") as typeof SHADER_IDS[number])),
    set: (i, v) => patchVisual(i, { shaderId: SHADER_IDS[v] }),
    display: (i) => (ensureVisual(i).shaderId ?? "plasma").toUpperCase(),
  };
}

/* ---- Asset action fields (intercepted by DatamoshpitApp) ---- */

/** Read-only display of the current asset reference */
function visualAssetUrlField(): InstrumentField {
  return {
    key: "v_asset_url", label: "ASSET",
    min: 0, max: 0, digits: 0,
    get: () => 0,
    set: (i) => i,
    display: (i) => {
      const url = ensureVisual(i).assetUrl;
      if (!url) return "[NONE]";
      if (url.startsWith("data:")) return "[EMBEDDED]";
      const tail = url.split("/").pop();
      return tail && tail.length > 16 ? tail.slice(0, 14) + ".." : (tail || url);
    },
  };
}

/** Action: open native file picker and load the chosen file as a data URL */
function visualAssetLoadField(): InstrumentField {
  return {
    key: "v_asset_load", label: "LOAD",
    min: 0, max: 0, digits: 0,
    get: () => 0,
    set: (i) => i,           // side effect handled in DatamoshpitApp
    display: () => "[PICK FILE]",
  };
}

/** Action: open the KoolDraw sprite editor embedded; result becomes the asset */
function visualAssetDrawField(): InstrumentField {
  return {
    key: "v_asset_draw", label: "DRAW",
    min: 0, max: 0, digits: 0,
    get: () => 0,
    set: (i) => i,           // side effect handled in DatamoshpitApp
    display: () => "[KOOLDRAW]",
  };
}

/** Action: clear the asset reference */
function visualAssetClearField(): InstrumentField {
  return {
    key: "v_asset_clear", label: "CLR",
    min: 0, max: 0, digits: 0,
    get: () => 0,
    set: (i) => i,           // side effect handled in DatamoshpitApp
    display: () => "[X]",
  };
}

/** Action: open the InstrumentTimelineEditor modal for fine-grained keyframe authoring */
function visualTimelineEditField(): InstrumentField {
  return {
    key: "v_timeline_open", label: "TLINE",
    min: 0, max: 0, digits: 0,
    get: () => 0,
    set: (i) => i,           // side effect handled in DatamoshpitApp
    display: (i) => {
      const kfs = ensureVisual(i).customKeyframes;
      return kfs && kfs.length > 0 ? `[EDIT (${kfs.length}KF)]` : "[EDIT]";
    },
  };
}

/** Action: clear the user's custom keyframes (revert to auto-generated) */
function visualTimelineClearField(): InstrumentField {
  return {
    key: "v_timeline_clear", label: "TCLR",
    min: 0, max: 0, digits: 0,
    get: () => 0,
    set: (i) => i,           // side effect handled in DatamoshpitApp
    display: () => "[REVERT TO AUTO]",
  };
}

/** Field keys that DatamoshpitApp must intercept rather than calling field.set */
export const VISUAL_ACTION_FIELD_KEYS = new Set([
  "v_asset_load",
  "v_asset_draw",
  "v_asset_clear",
  "v_timeline_open",
  "v_timeline_clear",
]);

function visualWidthField(): InstrumentField {
  return {
    key: "v_w", label: "W",
    min: 8, max: 1024, digits: 3,
    get: (i) => ensureVisual(i).width,
    set: (i, v) => patchVisual(i, { width: Math.max(8, Math.min(1024, v)) }),
  };
}
function visualHeightField(): InstrumentField {
  return {
    key: "v_h", label: "H",
    min: 8, max: 1024, digits: 3,
    get: (i) => ensureVisual(i).height,
    set: (i, v) => patchVisual(i, { height: Math.max(8, Math.min(1024, v)) }),
  };
}
function visualPosXField(): InstrumentField {
  return {
    key: "v_px", label: "X",
    min: 0, max: 0xFF, digits: 2,
    get: (i) => ensureVisual(i).posX,
    set: (i, v) => patchVisual(i, { posX: v }),
  };
}
function visualPosYField(): InstrumentField {
  return {
    key: "v_py", label: "Y",
    min: 0, max: 0xFF, digits: 2,
    get: (i) => ensureVisual(i).posY,
    set: (i, v) => patchVisual(i, { posY: v }),
  };
}

function visualLengthField(): InstrumentField {
  return {
    key: "v_len", label: "LEN",
    min: VISUAL_FRAMES_MIN, max: VISUAL_FRAMES_MAX, digits: 2,
    get: (i) => ensureVisual(i).totalFrames,
    set: (i, v) => patchVisual(i, {
      totalFrames: Math.max(VISUAL_FRAMES_MIN, Math.min(VISUAL_FRAMES_MAX, v)),
    }),
  };
}

function visualTriggerField(): InstrumentField {
  return {
    key: "v_trig", label: "TRIG",
    min: 0, max: VISUAL_TRIGGERS.length - 1, digits: 0,
    get: (i) => VISUAL_TRIGGERS.indexOf(ensureVisual(i).triggerMode),
    set: (i, v) => patchVisual(i, { triggerMode: VISUAL_TRIGGERS[v] }),
    display: (i) => VISUAL_TRIGGER_LABELS[ensureVisual(i).triggerMode],
  };
}

function visualTriggerFrameField(): InstrumentField {
  return {
    key: "v_trigframe", label: "TFRM",
    min: 1, max: VISUAL_FRAMES_MAX, digits: 2,
    get: (i) => ensureVisual(i).triggerFrame ?? 1,
    set: (i, v) => patchVisual(i, { triggerFrame: v }),
  };
}

function visualPitchLoField(): InstrumentField {
  return {
    key: "v_plo", label: "PLO",
    min: 0, max: 127, digits: 2,
    get: (i) => ensureVisual(i).pitchLo ?? 36,
    set: (i, v) => {
      const cur = ensureVisual(i);
      const hi = cur.pitchHi ?? 96;
      // Keep PLO < PHI so the range never inverts
      return patchVisual(i, { pitchLo: Math.min(v, hi - 1) });
    },
  };
}

function visualPitchHiField(): InstrumentField {
  return {
    key: "v_phi", label: "PHI",
    min: 0, max: 127, digits: 2,
    get: (i) => ensureVisual(i).pitchHi ?? 96,
    set: (i, v) => {
      const cur = ensureVisual(i);
      const lo = cur.pitchLo ?? 36;
      return patchVisual(i, { pitchHi: Math.max(v, lo + 1) });
    },
  };
}

/**
 * Build the rows for the VISUAL section. When the visual is disabled, only
 * the ENABL toggle row is shown — toggling on reveals the rest.
 */
function visualRows(inst: Instrument): LayoutRow[] {
  const v = ensureVisual(inst);
  const rows: LayoutRow[] = [];
  rows.push({ type: "fields", fields: [visualEnabledField()] });

  if (!v.enabled) return rows;

  rows.push({ type: "fields", fields: [visualSeedField()] });
  rows.push({ type: "fields", fields: [visualSourceField()] });

  // Only show the source-specific field that's relevant
  if (v.source === "color") {
    rows.push({ type: "fields", fields: [visualColorField()] });
  } else if (v.source === "shader") {
    rows.push({ type: "fields", fields: [visualShaderField()] });
  } else if (v.source === "image" || v.source === "video" || v.source === "model" || v.source === "iframe") {
    // Asset reference + LOAD/DRAW/CLEAR action triplet
    rows.push({ type: "fields", fields: [visualAssetUrlField()] });
    rows.push({ type: "fields", fields: [visualAssetLoadField()] });
    if (v.source === "image") {
      // KoolDraw embed currently produces PNG only — only offered for image source
      rows.push({ type: "fields", fields: [visualAssetDrawField()] });
    }
    if (v.assetUrl) {
      rows.push({ type: "fields", fields: [visualAssetClearField()] });
    }
  }

  rows.push({ type: "fields", fields: [visualWidthField(), visualHeightField()] });
  rows.push({ type: "fields", fields: [visualPosXField(), visualPosYField()] });
  rows.push({ type: "fields", fields: [visualLengthField()] });
  rows.push({ type: "fields", fields: [visualTriggerField()] });

  // Trigger-mode-specific extras
  if (v.triggerMode === "play-from-frame") {
    rows.push({ type: "fields", fields: [visualTriggerFrameField()] });
  } else if (v.triggerMode === "pitch-mapped") {
    rows.push({ type: "fields", fields: [visualPitchLoField(), visualPitchHiField()] });
  }

  // Per-instrument keyframe timeline editor (modal)
  rows.push({ type: "fields", fields: [visualTimelineEditField()] });
  if (v.customKeyframes && v.customKeyframes.length > 0) {
    rows.push({ type: "fields", fields: [visualTimelineClearField()] });
  }

  return rows;
}

/* ------------------------------------------------------------------ */
/*  Color palette helpers                                              */
/* ------------------------------------------------------------------ */

/** 256-entry HSL palette traversed by Q-flick. Index 0 = white, 255 = near-black. */
function paletteColor(idx: number): string {
  const i = Math.max(0, Math.min(255, Math.round(idx))) | 0;
  if (i === 0) return "#ffffff";
  if (i === 255) return "#101010";
  // Hues spread across 0..360, with mid lightness; saturated.
  const h = Math.round((i / 255) * 360);
  const s = 80;
  const l = 55;
  return hslToHex(h, s, l);
}

function paletteIndexFromColor(hex: string): number {
  // Fast inverse: parse hex → approximate hue → palette index.
  const rgb = hex.replace("#", "");
  if (rgb.length < 6) return 0;
  const r = parseInt(rgb.slice(0, 2), 16) / 255;
  const g = parseInt(rgb.slice(2, 4), 16) / 255;
  const b = parseInt(rgb.slice(4, 6), 16) / 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  if (max === min) return r > 0.7 ? 0 : 255;
  const d = max - min;
  let h = 0;
  if (max === r) h = ((g - b) / d) % 6;
  else if (max === g) h = (b - r) / d + 2;
  else h = (r - g) / d + 4;
  h = Math.round(h * 60);
  if (h < 0) h += 360;
  return Math.round((h / 360) * 255);
}

function hslToHex(h: number, s: number, l: number): string {
  const c = (1 - Math.abs(2 * (l / 100) - 1)) * (s / 100);
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = l / 100 - c / 2;
  let r = 0, g = 0, b = 0;
  if (h < 60) { r = c; g = x; }
  else if (h < 120) { r = x; g = c; }
  else if (h < 180) { g = c; b = x; }
  else if (h < 240) { g = x; b = c; }
  else if (h < 300) { r = x; b = c; }
  else { r = c; b = x; }
  const toHex = (v: number) => Math.round((v + m) * 255).toString(16).padStart(2, "0");
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}
