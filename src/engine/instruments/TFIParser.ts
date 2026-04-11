/*
 *            ☦
 *      ╔═══════════════╗
 *      ║  ST. DUNSTAN  ║
 *      ║  Patron of    ║
 *      ║  Metalworkers ║
 *      ╚═══════════════╝
 *
 *   TFI PARSER
 *   Reads TFM Music Maker .tfi instrument files.
 *   42 bytes: algorithm, feedback, then 4 operators × 10 bytes.
 *
 *   Operator byte order:
 *     MUL, DT, TL, RS, AR, D1R, D2R, RR, D1L, SSG-EG
 */

import type { Instrument, FMOperator } from "@/types/tracker";

interface TFIData {
  algorithm: number;
  feedback: number;
  operators: [FMOperator, FMOperator, FMOperator, FMOperator];
}

function parseTFIOperator(data: Uint8Array, offset: number): FMOperator {
  const mul = data[offset];        // 0-15
  const dt = data[offset + 1];     // 0-7
  const tl = data[offset + 2];     // 0-127 (inverted: 0=loud, 127=silent)
  const rs = data[offset + 3];     // 0-3 rate scaling
  const ar = data[offset + 4];     // 0-31
  const d1r = data[offset + 5];    // 0-31
  const d2r = data[offset + 6];    // 0-31
  const rr = data[offset + 7];     // 0-15
  const d1l = data[offset + 8];    // 0-15 (sustain level)
  // const ssg = data[offset + 9]; // SSG-EG (not in our model)

  return {
    ratio: Math.max(1, mul),
    level: 127 - tl,
    attack: Math.round((ar / 31) * 127),
    decay: Math.round((d1r / 31) * 127),
    sustain: Math.round((d1l / 15) * 127),
    release: Math.round((rr / 15) * 127),
    detune: dt > 3 ? dt - 7 : dt,  // 0-3=positive, 4-7=negative
    multiple: mul,
    d2r,
    rs,
    am: 0,
  };
}

export function parseTFI(buffer: ArrayBuffer): TFIData | null {
  if (buffer.byteLength !== 42) return null;
  const data = new Uint8Array(buffer);
  return {
    algorithm: data[0],
    feedback: data[1],
    operators: [
      parseTFIOperator(data, 2),
      parseTFIOperator(data, 12),
      parseTFIOperator(data, 22),
      parseTFIOperator(data, 32),
    ],
  };
}

export function tfiToInstrument(tfi: TFIData, id: number, name: string): Instrument {
  return {
    id,
    name,
    type: "fm",
    volume: 100,
    pan: 64,
    table: null,
    fmAlgorithm: tfi.algorithm,
    fmFeedback: tfi.feedback,
    fmOperators: tfi.operators,
    macros: [],
  };
}

/** Fetch and parse a .tfi file from a URL */
export async function loadTFI(url: string, id: number, name: string): Promise<Instrument | null> {
  const res = await fetch(url);
  if (!res.ok) return null;
  const buffer = await res.arrayBuffer();
  const tfi = parseTFI(buffer);
  if (!tfi) return null;
  return tfiToInstrument(tfi, id, name);
}
