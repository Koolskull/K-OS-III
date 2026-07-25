/*
 * Shared pressure / harsh / dither stamp primitives.
 * Used by SHOTLIST mono plates and KoolDraw sprite frames.
 */

/** 8×8 Bayer ordered-dither matrix (values 0..63) */
export const BAYER8: number[][] = [
  [0, 32, 8, 40, 2, 34, 10, 42],
  [48, 16, 56, 24, 50, 18, 58, 26],
  [12, 44, 4, 36, 14, 46, 6, 38],
  [60, 28, 52, 20, 62, 30, 54, 22],
  [3, 35, 11, 43, 1, 33, 9, 41],
  [51, 19, 59, 27, 49, 17, 57, 25],
  [15, 47, 7, 39, 13, 45, 5, 37],
  [63, 31, 55, 23, 61, 29, 53, 21],
];

/** 4×4 Bayer (values 0..15), scaled to 0..63 when sampled */
export const BAYER4: number[][] = [
  [0, 8, 2, 10],
  [12, 4, 14, 6],
  [3, 11, 1, 9],
  [15, 7, 13, 5],
];

/** 2×2 Bayer (values 0..3), scaled to 0..63 when sampled */
export const BAYER2: number[][] = [
  [0, 2],
  [3, 1],
];

/**
 * Named dither patterns for “opacity” / density variety.
 * Threshold (from pressure) still controls fill density within each pattern.
 */
export type DitherPatternId =
  | "bayer8" // classic fine ordered (default)
  | "bayer4" // coarser ordered
  | "bayer2" // chunky 2×2
  | "dots" // fine grain / stipple
  | "sparse" // very light opacity feel
  | "hatch" // diagonal 45° lines
  | "hline" // horizontal rules
  | "cross"; // cross-hatch

export interface DitherPatternDef {
  id: DitherPatternId;
  /** Toolbar short label */
  label: string;
  /** Longer title */
  title: string;
}

/** All patterns in UI order — bayer8 first, then 7 more */
export const DITHER_PATTERNS: readonly DitherPatternDef[] = [
  { id: "bayer8", label: "B8", title: "Bayer 8×8 — fine ordered (default)" },
  { id: "bayer4", label: "B4", title: "Bayer 4×4 — medium ordered" },
  { id: "bayer2", label: "B2", title: "Bayer 2×2 — chunky" },
  { id: "dots", label: "DOT", title: "Dots — fine stipple / grain" },
  { id: "sparse", label: "SPR", title: "Sparse — light opacity wash" },
  { id: "hatch", label: "HAT", title: "Hatch — diagonal lines" },
  { id: "hline", label: "HLN", title: "H-Lines — horizontal rules" },
  { id: "cross", label: "XHS", title: "Cross-hatch — grid opacity" },
] as const;

export const DEFAULT_DITHER_PATTERN: DitherPatternId = "bayer8";

/** Sample pattern at integer pixel → rank 0..63 (higher = harder to fill). */
export function sampleDitherRank(
  pattern: DitherPatternId,
  x: number,
  y: number,
  ox: number,
  oy: number,
): number {
  const px = x + ox;
  const py = y + oy;
  switch (pattern) {
    case "bayer8": {
      const u = ((px % 8) + 8) % 8;
      const v = ((py % 8) + 8) % 8;
      return BAYER8[v]![u]!;
    }
    case "bayer4": {
      const u = ((px % 4) + 4) % 4;
      const v = ((py % 4) + 4) % 4;
      return BAYER4[v]![u]! * 4; // 0..60
    }
    case "bayer2": {
      const u = ((px % 2) + 2) % 2;
      const v = ((py % 2) + 2) % 2;
      return BAYER2[v]![u]! * 21; // 0..63
    }
    case "dots": {
      // Fine stipple via mixed modular hash → 0..63
      const h = (px * 7 + py * 13) ^ (px * py * 3);
      return ((h % 64) + 64) % 64;
    }
    case "sparse": {
      // Mostly high ranks → few dots until pressure is high
      const cell = ((px & 3) === 0 && (py & 3) === 0) ? 8 : 56;
      const jitter = ((px * 5 + py * 11) % 8 + 8) % 8;
      return Math.min(63, cell + jitter);
    }
    case "hatch": {
      // Diagonal: (x+y) period 4 → steps of opacity
      const d = (((px + py) % 4) + 4) % 4;
      return d * 16; // 0,16,32,48
    }
    case "hline": {
      // Horizontal lines every other row at mid ranks
      const row = ((py % 2) + 2) % 2;
      return row === 0 ? 8 : 56;
    }
    case "cross": {
      // Grid: horizontal + vertical — low rank on lines
      const onH = ((py % 3) + 3) % 3 === 0;
      const onV = ((px % 3) + 3) % 3 === 0;
      if (onH && onV) return 4;
      if (onH || onV) return 20;
      return 58;
    }
    default:
      return BAYER8[((py % 8) + 8) % 8]![((px % 8) + 8) % 8]!;
  }
}

/** Normalize pointer pressure: mouse/trackpad get a usable default. */
export function normalizePressure(
  pressure: number,
  pointerType: string,
  buttons: number,
): number {
  if (pointerType === "mouse" || pointerType === "touch") {
    if (pressure > 0.01) return Math.min(1, Math.max(0.05, pressure));
    return buttons > 0 ? 0.55 : 0;
  }
  return Math.min(1, Math.max(0.04, pressure || 0.04));
}

/** Dense sampling between two points for continuous freehand strokes. */
export function forEachStrokePoint(
  x0: number,
  y0: number,
  x1: number,
  y1: number,
  fn: (x: number, y: number) => void,
): void {
  const dx = x1 - x0;
  const dy = y1 - y0;
  const dist = Math.hypot(dx, dy);
  const steps = Math.max(1, Math.ceil(dist));
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    fn(x0 + dx * t, y0 + dy * t);
  }
}

export type StampWrite = (x: number, y: number) => void;

export interface DiskStampOpts {
  /** 0..1 */
  pressure: number;
  /** Max brush radius in pixels (from UI pen size). Min effective 1. */
  maxRadius: number;
}

/**
 * Harsh pen — solid hard disk. Pressure only widens slightly so carving stays decisive.
 * Radius: 1 .. min(5, maxRadius) scaled by pressure.
 */
export function stampHarshDisk(
  cx: number,
  cy: number,
  opts: DiskStampOpts,
  write: StampWrite,
): void {
  const cap = Math.max(1, Math.min(5, opts.maxRadius));
  const r = Math.max(1, Math.round(1 + opts.pressure * (cap - 1)));
  stampSolidDisk(cx, cy, r, write);
}

/**
 * Pressure→radius mapping used by pen and dither.
 * maxRadius 1 → always 1; otherwise 1..maxRadius by pressure.
 */
export function radiusFromPressure(pressure: number, maxRadius: number): number {
  const maxR = Math.max(1, Math.round(maxRadius));
  if (maxR <= 1) return 1;
  return Math.max(1, Math.round(1 + pressure * (maxR - 1)));
}

/**
 * Variable-position dither pencil.
 * Pressure controls radius (via maxRadius) and pattern threshold density.
 * ox/oy shift the pattern so repeated strokes layer differently.
 */
export function stampDitherDisk(
  cx: number,
  cy: number,
  opts: DiskStampOpts & {
    ditherOx: number;
    ditherOy: number;
    pattern?: DitherPatternId;
  },
  write: StampWrite,
): void {
  const pattern = opts.pattern ?? DEFAULT_DITHER_PATTERN;
  const base = radiusFromPressure(opts.pressure, opts.maxRadius);
  const r = Math.max(1, Math.round(base * 1.15));
  // Sparse needs higher pressure to reach solid; others 2..64
  const maxThresh = pattern === "sparse" ? 72 : 64;
  const threshold = Math.floor(2 + opts.pressure * (maxThresh - 2));
  const r2 = r * r;
  const ox = opts.ditherOx | 0;
  const oy = opts.ditherOy | 0;
  const x0 = Math.floor(cx - r);
  const y0 = Math.floor(cy - r);
  const x1 = Math.ceil(cx + r);
  const y1 = Math.ceil(cy + r);

  for (let y = y0; y <= y1; y++) {
    for (let x = x0; x <= x1; x++) {
      const dx = x + 0.5 - cx;
      const dy = y + 0.5 - cy;
      const d2 = dx * dx + dy * dy;
      if (d2 > r2) continue;
      const edge = Math.sqrt(d2) / r;
      const localThresh = threshold * (1 - edge * 0.55);
      const rank = sampleDitherRank(pattern, x, y, ox, oy);
      if (rank < localThresh) write(x, y);
    }
  }
}

export function stampSolidDisk(
  cx: number,
  cy: number,
  r: number,
  write: StampWrite,
): void {
  const r2 = r * r;
  const x0 = Math.floor(cx - r);
  const y0 = Math.floor(cy - r);
  const x1 = Math.ceil(cx + r);
  const y1 = Math.ceil(cy + r);
  for (let y = y0; y <= y1; y++) {
    for (let x = x0; x <= x1; x++) {
      const dx = x + 0.5 - cx;
      const dy = y + 0.5 - cy;
      if (dx * dx + dy * dy <= r2) write(x, y);
    }
  }
}

/** Re-export clean pressure pen using radiusFromPressure. */
export function stampPressureDisk(
  cx: number,
  cy: number,
  opts: DiskStampOpts,
  write: StampWrite,
): void {
  stampSolidDisk(cx, cy, radiusFromPressure(opts.pressure, opts.maxRadius), write);
}
