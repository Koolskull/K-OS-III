/*
 *            ☦
 *      ╔════════════════╗
 *      ║  ST. ISIDORE   ║
 *      ║  Patron of the ║
 *      ║  Internet      ║
 *      ╚════════════════╝
 *
 *   GENMDM PARSER
 *   Reads GenMDM .genm instrument bank files.
 *   Text format: one instrument per line.
 *
 *   Line format:
 *     index, v0 v1 ... v48 [name];
 *
 *   49 values: 5 global + 11 params × 4 ops
 *   (params grouped by type across all 4 operators)
 *
 *   Global: algorithm, feedback, lfoFreq, ams, fms
 *   Per-param groups of 4 (op1-4):
 *     TL, MUL, DT, RS, AR, D1R, D2R, RR, D1L, AM, SSG-EG
 *
 *   Values are stored as MIDI CC values (0-127).
 */

import type { Instrument, FMOperator } from "@/types/tracker";

interface GenMDMPatch {
  index: number;
  name: string;
  algorithm: number;
  feedback: number;
  operators: [FMOperator, FMOperator, FMOperator, FMOperator];
}

function ccToRange(cc: number, max: number): number {
  return Math.round((cc / 127) * max);
}

function parseGenMDMLine(line: string): GenMDMPatch | null {
  const trimmed = line.trim();
  if (!trimmed || !trimmed.includes(",")) return null;

  // Split "index, values... [name];"
  const commaIdx = trimmed.indexOf(",");
  const index = parseInt(trimmed.slice(0, commaIdx));

  // Extract name from brackets
  const nameMatch = trimmed.match(/\[([^\]]*)\]/);
  const name = nameMatch ? nameMatch[1] : `PATCH ${index}`;

  // Extract values between comma and bracket/semicolon
  const valueStr = trimmed
    .slice(commaIdx + 1)
    .replace(/\[.*$/, "")
    .trim();
  const vals = valueStr.split(/\s+/).map(Number);

  if (vals.length < 49) return null;

  // Global params
  const algorithm = vals[0]; // 0-7
  const feedback = vals[1];  // 0-7
  // vals[2] = LFO freq, vals[3] = AMS, vals[4] = FMS (not in our model)

  // Param groups of 4 (one per operator), starting at index 5
  // TL:5-8, MUL:9-12, DT:13-16, RS:17-20, AR:21-24, D1R:25-28, D2R:29-32, RR:33-36, D1L:37-40, AM:41-44, SSG:45-48
  const ops: FMOperator[] = [];
  for (let op = 0; op < 4; op++) {
    const tl = vals[5 + op];
    const mul = vals[9 + op];
    const dt = vals[13 + op];
    // const rs = vals[17 + op]; // rate scaling (not in our model)
    const ar = vals[21 + op];
    const d1r = vals[25 + op];
    // const d2r = vals[29 + op]; // secondary decay (not directly mapped)
    const rr = vals[33 + op];
    const d1l = vals[37 + op];
    // const am = vals[41 + op]; // AM enable (not in our model)
    // const ssg = vals[45 + op]; // SSG-EG (not in our model)

    const rawDt = ccToRange(dt, 7);

    ops.push({
      ratio: Math.max(1, ccToRange(mul, 15)),
      level: 127 - tl, // invert TL: 0=silent→127, 127=loud→0
      attack: ccToRange(ar, 127),
      decay: ccToRange(d1r, 127),
      sustain: ccToRange(d1l, 127),
      release: ccToRange(rr, 127),
      detune: rawDt > 3 ? rawDt - 7 : rawDt,
      multiple: ccToRange(mul, 15),
      d2r: 0,
      rs: 0,
      am: 0,
    });
  }

  return {
    index,
    name,
    algorithm,
    feedback,
    operators: ops as [FMOperator, FMOperator, FMOperator, FMOperator],
  };
}

export function parseGenMDM(text: string): GenMDMPatch[] {
  return text
    .split("\n")
    .map(parseGenMDMLine)
    .filter((p): p is GenMDMPatch => p !== null);
}

export function genmdmPatchToInstrument(patch: GenMDMPatch, id: number): Instrument {
  return {
    id,
    name: patch.name.toUpperCase().slice(0, 16),
    type: "fm",
    volume: 100,
    pan: 64,
    table: null,
    fmAlgorithm: patch.algorithm,
    fmFeedback: patch.feedback,
    fmOperators: patch.operators,
    macros: [],
  };
}

/** Fetch and parse a .genm bank file, returns array of instruments */
export async function loadGenMDMBank(
  url: string,
  startId: number,
): Promise<Instrument[]> {
  const res = await fetch(url);
  if (!res.ok) return [];
  const text = await res.text();
  const patches = parseGenMDM(text);
  return patches.map((p, i) => genmdmPatchToInstrument(p, startId + i));
}
