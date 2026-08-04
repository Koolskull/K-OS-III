import type { MapNode } from "./types";

export interface Viewport {
  x: number;
  y: number;
  scale: number;
}

export interface Pt {
  x: number;
  y: number;
}

/** Node center in world space (rotation pivot). */
export function nodeCenter(n: MapNode): Pt {
  return { x: n.x + n.w / 2, y: n.y + n.h / 2 };
}

export function nodeRotation(n: MapNode): number {
  return n.rotation ?? 0;
}

/** Screen (canvas-local CSS px) → world. Always use live rect + viewport. */
export function screenToWorld(
  clientX: number,
  clientY: number,
  rect: DOMRect,
  vp: Viewport,
): Pt {
  return {
    x: (clientX - rect.left - vp.x) / vp.scale,
    y: (clientY - rect.top - vp.y) / vp.scale,
  };
}

/** Zoom about a canvas-local point (CSS px). */
export function applyZoomAt(
  vp: Viewport,
  canvasX: number,
  canvasY: number,
  nextScale: number,
): Viewport {
  const scale = Math.min(2.5, Math.max(0.35, nextScale));
  const wx = (canvasX - vp.x) / vp.scale;
  const wy = (canvasY - vp.y) / vp.scale;
  return {
    scale,
    x: canvasX - wx * scale,
    y: canvasY - wy * scale,
  };
}

/** World point → node-local coords (origin top-left of unrotated box). */
export function worldToNodeLocal(n: MapNode, wx: number, wy: number): Pt {
  const c = nodeCenter(n);
  const rad = (-nodeRotation(n) * Math.PI) / 180;
  const dx = wx - c.x;
  const dy = wy - c.y;
  const cos = Math.cos(rad);
  const sin = Math.sin(rad);
  return {
    x: dx * cos - dy * sin + n.w / 2,
    y: dx * sin + dy * cos + n.h / 2,
  };
}

/** Accurate hit including rotation — works at any window size (world space). */
export function hitNode(nodes: MapNode[], wx: number, wy: number): MapNode | null {
  for (let i = nodes.length - 1; i >= 0; i--) {
    const n = nodes[i]!;
    const local = worldToNodeLocal(n, wx, wy);
    if (local.x >= 0 && local.x <= n.w && local.y >= 0 && local.y <= n.h) return n;
  }
  return null;
}

/**
 * Wire routing continuum t ∈ [0,1]:
 * 0 = straight, ~0.5 = smooth cubic, 1 = orthogonal grid (circuit board).
 */
export function routeWirePoints(a: MapNode, b: MapNode, t: number, grid = 24): Pt[] {
  const amount = Math.min(1, Math.max(0, t));
  const ca = nodeCenter(a);
  const cb = nodeCenter(b);
  const x1 = ca.x;
  const y1 = ca.y;
  const x2 = cb.x;
  const y2 = cb.y;

  // Orthogonal Manhattan on grid
  const snap = (v: number) => Math.round(v / grid) * grid;
  const ox1 = snap(x1);
  const oy1 = snap(y1);
  const ox2 = snap(x2);
  const oy2 = snap(y2);
  let ortho: Pt[];
  if (ox1 === ox2 || oy1 === oy2) {
    ortho = [
      { x: x1, y: y1 },
      { x: ox1, y: oy1 },
      { x: ox2, y: oy2 },
      { x: x2, y: y2 },
    ];
  } else {
    // Prefer mid-X elbow (H then V then H) for circuit look
    const midX = snap((ox1 + ox2) / 2);
    ortho = [
      { x: x1, y: y1 },
      { x: ox1, y: oy1 },
      { x: midX, y: oy1 },
      { x: midX, y: oy2 },
      { x: ox2, y: oy2 },
      { x: x2, y: y2 },
    ];
  }

  // Sample cubic smooth (current default look)
  const dx = Math.abs(x2 - x1) * 0.4;
  const c1x = x1 + dx;
  const c1y = y1;
  const c2x = x2 - dx;
  const c2y = y2;
  const smooth: Pt[] = [];
  const steps = 24;
  for (let i = 0; i <= steps; i++) {
    const u = i / steps;
    const v = 1 - u;
    smooth.push({
      x:
        v * v * v * x1 +
        3 * v * v * u * c1x +
        3 * v * u * u * c2x +
        u * u * u * x2,
      y:
        v * v * v * y1 +
        3 * v * v * u * c1y +
        3 * v * u * u * c2y +
        u * u * u * y2,
    });
  }

  const straight: Pt[] = [
    { x: x1, y: y1 },
    { x: x2, y: y2 },
  ];

  // Blend: 0–0.5 straight→smooth, 0.5–1 smooth→ortho
  if (amount <= 0.5) {
    const k = amount / 0.5;
    return blendPolylines(straight, smooth, k);
  }
  const k = (amount - 0.5) / 0.5;
  return blendPolylines(smooth, ortho, k);
}

function resample(pts: Pt[], n: number): Pt[] {
  if (pts.length === 0) return [];
  if (pts.length === 1) return Array.from({ length: n }, () => ({ ...pts[0]! }));
  const lengths: number[] = [0];
  let total = 0;
  for (let i = 1; i < pts.length; i++) {
    total += Math.hypot(pts[i]!.x - pts[i - 1]!.x, pts[i]!.y - pts[i - 1]!.y);
    lengths.push(total);
  }
  if (total < 1e-6) return Array.from({ length: n }, () => ({ ...pts[0]! }));
  const out: Pt[] = [];
  for (let i = 0; i < n; i++) {
    const target = (i / (n - 1)) * total;
    let j = 1;
    while (j < lengths.length && lengths[j]! < target) j++;
    const a = pts[j - 1]!;
    const b = pts[Math.min(j, pts.length - 1)]!;
    const seg0 = lengths[j - 1]!;
    const seg1 = lengths[Math.min(j, lengths.length - 1)]!;
    const u = seg1 > seg0 ? (target - seg0) / (seg1 - seg0) : 0;
    out.push({ x: a.x + (b.x - a.x) * u, y: a.y + (b.y - a.y) * u });
  }
  return out;
}

function blendPolylines(a: Pt[], b: Pt[], t: number): Pt[] {
  const n = 25;
  const ra = resample(a, n);
  const rb = resample(b, n);
  const k = Math.min(1, Math.max(0, t));
  return ra.map((p, i) => ({
    x: p.x + (rb[i]!.x - p.x) * k,
    y: p.y + (rb[i]!.y - p.y) * k,
  }));
}

export function strokePolyline(
  ctx: CanvasRenderingContext2D,
  pts: Pt[],
): void {
  if (pts.length === 0) return;
  ctx.beginPath();
  ctx.moveTo(pts[0]!.x, pts[0]!.y);
  for (let i = 1; i < pts.length; i++) {
    ctx.lineTo(pts[i]!.x, pts[i]!.y);
  }
}

/** Distance from point to polyline segments. */
export function distToPolyline(pts: Pt[], wx: number, wy: number): number {
  let best = Infinity;
  for (let i = 1; i < pts.length; i++) {
    const ax = pts[i - 1]!.x;
    const ay = pts[i - 1]!.y;
    const bx = pts[i]!.x;
    const by = pts[i]!.y;
    const dx = bx - ax;
    const dy = by - ay;
    const len2 = dx * dx + dy * dy;
    let t = len2 > 0 ? ((wx - ax) * dx + (wy - ay) * dy) / len2 : 0;
    t = Math.max(0, Math.min(1, t));
    const px = ax + t * dx;
    const py = ay + t * dy;
    best = Math.min(best, Math.hypot(wx - px, wy - py));
  }
  return best;
}
