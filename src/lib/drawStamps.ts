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

/**
 * Cubic-Bezier pressure→size anchors in the unit square.
 * Endpoints are fixed: (0,0)=min radius, (1,1)=max radius.
 * `a` and `b` are the two free vector control points (like Illustrator handles).
 */
export interface PressureAnchor {
  /** Pressure axis 0..1 */
  x: number;
  /** Normalized size 0..1 (0 = minRadius, 1 = maxRadius) */
  y: number;
}

export interface PressureCurve {
  a: PressureAnchor;
  b: PressureAnchor;
}

/** Soft exponential default — stays thin at light pressure, ramps late */
export const DEFAULT_PRESSURE_CURVE: PressureCurve = {
  a: { x: 0.28, y: 0.04 },
  b: { x: 0.62, y: 0.38 },
};

/** Straight diagonal (legacy linear feel) */
export const LINEAR_PRESSURE_CURVE: PressureCurve = {
  a: { x: 0.33, y: 0.33 },
  b: { x: 0.66, y: 0.66 },
};

export function clamp01(v: number): number {
  return Math.min(1, Math.max(0, v));
}

export function clampPressureCurve(curve: PressureCurve): PressureCurve {
  return {
    a: { x: clamp01(curve.a.x), y: clamp01(curve.a.y) },
    b: { x: clamp01(curve.b.x), y: clamp01(curve.b.y) },
  };
}

/** Cubic Bernstein basis B(t) with fixed ends 0 → 1 via controls c1, c2 */
function cubic01(t: number, c1: number, c2: number): number {
  const u = 1 - t;
  return 3 * u * u * t * c1 + 3 * u * t * t * c2 + t * t * t;
}

function cubic01Deriv(t: number, c1: number, c2: number): number {
  // d/dt [3(1-t)²t c1 + 3(1-t)t² c2 + t³]
  const u = 1 - t;
  return (
    3 * u * u * c1 +
    6 * u * t * (c2 - c1) +
    3 * t * t * (1 - c2)
  );
}

/**
 * Given pressure p (x), invert cubic Bezier X(t)=p then sample Y(t).
 * Returns normalized size factor 0..1.
 */
export function samplePressureCurve(
  pressure: number,
  curve: PressureCurve = DEFAULT_PRESSURE_CURVE,
): number {
  const p = clamp01(pressure);
  const { a, b } = clampPressureCurve(curve);
  // Newton–Raphson: find t where X(t) ≈ p
  let t = p;
  for (let i = 0; i < 10; i++) {
    const x = cubic01(t, a.x, b.x);
    const dx = cubic01Deriv(t, a.x, b.x);
    if (Math.abs(dx) < 1e-7) break;
    t -= (x - p) / dx;
    if (t < 0) t = 0;
    else if (t > 1) t = 1;
  }
  return clamp01(cubic01(t, a.y, b.y));
}

export interface DiskStampOpts {
  /** 0..1 */
  pressure: number;
  /** Max brush radius in pixels at full pressure. */
  maxRadius: number;
  /** Min brush radius in pixels at zero pressure. Default 1. */
  minRadius?: number;
  /** Optional cubic-Bezier pressure→size curve (two anchors). */
  curve?: PressureCurve;
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
  const maxR = Math.max(1, Math.min(5, opts.maxRadius));
  const minR = Math.max(1, Math.min(opts.minRadius ?? 1, maxR));
  const r = radiusFromPressure(opts.pressure, maxR, minR, opts.curve);
  stampSolidDisk(cx, cy, r, write);
}

/**
 * Pressure→radius via cubic Bezier (two vector anchors).
 * p=0 → minRadius, p=1 → maxRadius (clamped, integers ≥ 1).
 */
export function radiusFromPressure(
  pressure: number,
  maxRadius: number,
  minRadius = 1,
  curve: PressureCurve = DEFAULT_PRESSURE_CURVE,
): number {
  const maxR = Math.max(1, Math.round(maxRadius));
  const minR = Math.max(1, Math.min(Math.round(minRadius), maxR));
  if (maxR <= minR) return minR;
  const y = samplePressureCurve(pressure, curve);
  return Math.round(minR + y * (maxR - minR));
}

/**
 * Ordered dither pencil (Bayer-style continuous tone).
 *
 * `coverage` is the gray level 0..1 to emulate (like a gradient stop on a
 * Bayer-dithered ramp — see https://jdobr.es/blog/dithering/ bottom strip).
 * Pixel is inked when rank/64 < coverage. Pressure only drives brush size.
 * ox/oy phase-shift the matrix so layered strokes carve differently.
 */
export function stampDitherDisk(
  cx: number,
  cy: number,
  opts: DiskStampOpts & {
    ditherOx: number;
    ditherOy: number;
    pattern?: DitherPatternId;
    /** Gray coverage 0..1 (ordered-dither density). Defaults to pressure. */
    coverage?: number;
  },
  write: StampWrite,
): void {
  const pattern = opts.pattern ?? DEFAULT_DITHER_PATTERN;
  const coverage = Math.min(1, Math.max(0, opts.coverage ?? opts.pressure));
  const r = Math.max(
    1,
    radiusFromPressure(
      opts.pressure,
      opts.maxRadius,
      opts.minRadius ?? 1,
      opts.curve,
    ),
  );

  // Full solid / empty short-circuit (ends of the ordered-dither gradient)
  if (coverage >= 0.999) {
    stampSolidDisk(cx, cy, r, write);
    return;
  }
  if (coverage <= 0.001) {
    return;
  }

  // rank is 0..63; ink when rank < coverage*64  (classic ordered dither)
  const threshold = coverage * 64;
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
      if (dx * dx + dy * dy > r2) continue;
      const rank = sampleDitherRank(pattern, x, y, ox, oy);
      if (rank < threshold) write(x, y);
    }
  }
}

/**
 * Render a vertical ordered-dither gradient strip (coverage 0 at top → 1 at bottom,
 * or reverse). Used for the density slider preview UI.
 */
export function renderDitherGradientStrip(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  pattern: DitherPatternId,
  ink: 0 | 255,
  bg: 0 | 255,
  opts?: { ox?: number; oy?: number; invertCoverage?: boolean },
): void {
  const ox = opts?.ox ?? 0;
  const oy = opts?.oy ?? 0;
  const inv = opts?.invertCoverage ?? false;
  const img = ctx.createImageData(width, height);
  const d = img.data;
  for (let y = 0; y < height; y++) {
    const t = inv ? 1 - y / Math.max(1, height - 1) : y / Math.max(1, height - 1);
    const threshold = t * 64;
    for (let x = 0; x < width; x++) {
      const rank = sampleDitherRank(pattern, x, y, ox, oy);
      const v = rank < threshold ? ink : bg;
      const o = (y * width + x) * 4;
      d[o] = v;
      d[o + 1] = v;
      d[o + 2] = v;
      d[o + 3] = 255;
    }
  }
  ctx.putImageData(img, 0, 0);
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
  stampSolidDisk(
    cx,
    cy,
    radiusFromPressure(
      opts.pressure,
      opts.maxRadius,
      opts.minRadius ?? 1,
      opts.curve,
    ),
    write,
  );
}
