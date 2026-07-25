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
 * Pressure controls radius (via maxRadius) and Bayer threshold density.
 * ox/oy shift the matrix so repeated strokes layer differently.
 */
export function stampDitherDisk(
  cx: number,
  cy: number,
  opts: DiskStampOpts & { ditherOx: number; ditherOy: number },
  write: StampWrite,
): void {
  // Slightly larger feel than solid pen at same size setting
  const base = radiusFromPressure(opts.pressure, opts.maxRadius);
  const r = Math.max(1, Math.round(base * 1.15));
  const threshold = Math.floor(2 + opts.pressure * 62); // 2..64
  const r2 = r * r;
  const ox = ((opts.ditherOx % 8) + 8) % 8;
  const oy = ((opts.ditherOy % 8) + 8) % 8;
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
      const b = BAYER8[(y + oy) % 8]![(x + ox) % 8]!;
      if (b < localThresh) write(x, y);
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
