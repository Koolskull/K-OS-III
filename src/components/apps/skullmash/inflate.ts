import * as THREE from "three";

export type Point2 = { x: number; y: number };

export function resampleClosed(pts: Point2[], target = 64): Point2[] {
  if (pts.length < 3) return pts.slice();
  const segs: { a: Point2; b: Point2; len: number }[] = [];
  let total = 0;
  for (let i = 0; i < pts.length; i++) {
    const a = pts[i]!;
    const b = pts[(i + 1) % pts.length]!;
    const len = Math.hypot(b.x - a.x, b.y - a.y);
    segs.push({ a, b, len });
    total += len;
  }
  if (total < 1e-6) return pts.slice();
  const out: Point2[] = [];
  const step = total / target;
  let si = 0;
  let along = 0;
  for (let i = 0; i < target; i++) {
    const want = i * step;
    while (si < segs.length - 1 && along + segs[si]!.len < want) {
      along += segs[si]!.len;
      si++;
    }
    const s = segs[si]!;
    const t = s.len < 1e-9 ? 0 : (want - along) / s.len;
    out.push({
      x: s.a.x + (s.b.x - s.a.x) * t,
      y: s.a.y + (s.b.y - s.a.y) * t,
    });
  }
  return out;
}

function pointInPoly(x: number, y: number, poly: Point2[]): boolean {
  let inside = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const xi = poly[i]!.x;
    const yi = poly[i]!.y;
    const xj = poly[j]!.x;
    const yj = poly[j]!.y;
    const intersect =
      yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi + 1e-12) + xi;
    if (intersect) inside = !inside;
  }
  return inside;
}

function distToEdge(x: number, y: number, poly: Point2[]): number {
  let min = Infinity;
  for (let i = 0; i < poly.length; i++) {
    const a = poly[i]!;
    const b = poly[(i + 1) % poly.length]!;
    const dx = b.x - a.x;
    const dy = b.y - a.y;
    const len2 = dx * dx + dy * dy;
    let t = len2 < 1e-12 ? 0 : ((x - a.x) * dx + (y - a.y) * dy) / len2;
    t = Math.max(0, Math.min(1, t));
    const d = Math.hypot(x - (a.x + t * dx), y - (a.y + t * dy));
    if (d < min) min = d;
  }
  return min;
}

function punchColor(r: number, g: number, b: number, amount = 1.08): [number, number, number] {
  const l = 0.2126 * r + 0.7152 * g + 0.0722 * b;
  const sat = 1.12;
  return [
    Math.min(1, l + (r - l) * sat) * amount,
    Math.min(1, l + (g - l) * sat) * amount,
    Math.min(1, l + (b - l) * sat) * amount,
  ];
}

export type InflateOptions = {
  canvasW: number;
  canvasH: number;
  /**
   * User inflation amount 0.15–1.6 (default ~0.85).
   * Controls plush thickness — NOT a cone height multiplier.
   */
  inflate?: number;
  imageData?: ImageData | null;
  fillColor?: [number, number, number];
  /** Grid cells along the longer AABB side (higher = smoother). */
  resolution?: number;
};

/**
 * Plush / Monster Mash–style inflation.
 *
 * 1. Dense grid inside the silhouette
 * 2. Distance field → circular-arc cross-section (rounded, not conical)
 * 3. Poisson-like Jacobi relaxations for a soft dome (paper uses modified Poisson)
 * 4. Symmetric top + bottom shell for a stuffed-plush body
 *
 * Reference: Dvorožňák et al. SA2020 — inflate via modified Poisson for
 * rounded cross-section; we approximate that on a raster field.
 */
export function inflatePolygon(
  rawPts: Point2[],
  opts: InflateOptions,
): THREE.BufferGeometry {
  const { canvasW, canvasH } = opts;
  const inflate = Math.max(0.12, Math.min(1.8, opts.inflate ?? 0.85));
  const fill = opts.fillColor ?? [0.72, 0.72, 0.74];
  const resTarget = opts.resolution ?? 56;

  if (rawPts.length < 3) return new THREE.BufferGeometry();

  // Smooth contour for clean boundary
  const contour = resampleClosed(rawPts, Math.min(96, Math.max(40, Math.floor(rawPts.length * 0.6))));

  let minX = Infinity,
    minY = Infinity,
    maxX = -Infinity,
    maxY = -Infinity;
  for (const p of contour) {
    minX = Math.min(minX, p.x);
    minY = Math.min(minY, p.y);
    maxX = Math.max(maxX, p.x);
    maxY = Math.max(maxY, p.y);
  }
  // pad so boundary sits inside grid a bit
  const pad = 4;
  minX -= pad;
  minY -= pad;
  maxX += pad;
  maxY += pad;
  const bw = Math.max(8, maxX - minX);
  const bh = Math.max(8, maxY - minY);
  const aspect = bw / bh;
  let nx: number;
  let ny: number;
  if (aspect >= 1) {
    nx = resTarget;
    ny = Math.max(12, Math.round(resTarget / aspect));
  } else {
    ny = resTarget;
    nx = Math.max(12, Math.round(resTarget * aspect));
  }
  const dx = bw / (nx - 1);
  const dy = bh / (ny - 1);

  // inside mask + distance field (px)
  const N = nx * ny;
  const inside = new Uint8Array(N);
  const dist = new Float32Array(N);
  let maxD = 0;
  for (let j = 0; j < ny; j++) {
    for (let i = 0; i < nx; i++) {
      const x = minX + i * dx;
      const y = minY + j * dy;
      const idx = j * nx + i;
      const inn = pointInPoly(x, y, contour);
      inside[idx] = inn ? 1 : 0;
      if (inn) {
        const d = distToEdge(x, y, contour);
        dist[idx] = d;
        if (d > maxD) maxD = d;
      }
    }
  }
  if (maxD < 1e-3) maxD = 1;

  // --- Circular-arc seed (rounded plush cross-section, not a cone) ---
  // For a disk of inradius R: h = sqrt(2 R d - d^2) peaks at R (hemisphere-like).
  // Scale so peak scene-height is controlled by `inflate` and region size.
  const R = maxD;
  const heightField = new Float32Array(N);
  // Scene unit conversion: keep lateral scale 0.01; thickness proportional to
  // region size so big shapes don't look like needles.
  const lateral = 0.01;
  // peak height in scene units ≈ inflate * (R * lateral) * plump
  // plump ~ 0.95 makes a stuffed-pillow feel (slightly under full sphere)
  const plump = 0.92;
  const peakH = inflate * R * lateral * plump;

  for (let i = 0; i < N; i++) {
    if (!inside[i]) {
      heightField[i] = 0;
      continue;
    }
    const d = dist[i]!;
    // circular arc cross-section
    const arc = Math.sqrt(Math.max(0, 2 * R * d - d * d));
    // normalize: max arc at d=R is R
    heightField[i] = (arc / R) * peakH;
  }

  // Mark near-boundary cells for Dirichlet lock (h≈0)
  const boundary = new Uint8Array(N);
  for (let j = 0; j < ny; j++) {
    for (let i = 0; i < nx; i++) {
      const idx = j * nx + i;
      if (!inside[idx]) continue;
      // thin ring near silhouette stays glued to the plane
      if (dist[idx]! < Math.max(dx, dy) * 0.65) boundary[idx] = 1;
      // also any neighbor outside
      for (const [di, dj] of [
        [1, 0],
        [-1, 0],
        [0, 1],
        [0, -1],
      ] as const) {
        const ii = i + di;
        const jj = j + dj;
        if (ii < 0 || jj < 0 || ii >= nx || jj >= ny || !inside[jj * nx + ii]) {
          boundary[idx] = 1;
          break;
        }
      }
    }
  }

  // --- Poisson-like relaxation (modified Jacobi) ---
  // Paper: modified Poisson → smooth rounded cross-section.
  // We relax toward neighbor mean while gently re-anchoring to circular arc.
  // RHS push keeps volume; blend keeps plush roundness.
  const tmp = new Float32Array(N);
  const iterations = 28;
  const blendArc = 0.18; // keep a bit of circular-arc shape each iter
  for (let it = 0; it < iterations; it++) {
    for (let j = 0; j < ny; j++) {
      for (let i = 0; i < nx; i++) {
        const idx = j * nx + i;
        if (!inside[idx] || boundary[idx]) {
          tmp[idx] = heightField[idx]!;
          continue;
        }
        let sum = 0;
        let cnt = 0;
        for (const [di, dj] of [
          [1, 0],
          [-1, 0],
          [0, 1],
          [0, -1],
          [1, 1],
          [1, -1],
          [-1, 1],
          [-1, -1],
        ] as const) {
          const ii = i + di;
          const jj = j + dj;
          if (ii < 0 || jj < 0 || ii >= nx || jj >= ny) continue;
          const nidx = jj * nx + ii;
          if (!inside[nidx]) continue;
          // diagonal weights slightly lower
          const w = di !== 0 && dj !== 0 ? 0.7 : 1;
          sum += heightField[nidx]! * w;
          cnt += w;
        }
        // small positive source → gentle dome (Poisson ∇²h = -c)
        const source = peakH * 0.012;
        const avg = cnt > 0 ? sum / cnt + source : heightField[idx]!;
        const d = dist[idx]!;
        const arc = (Math.sqrt(Math.max(0, 2 * R * d - d * d)) / R) * peakH;
        tmp[idx] = avg * (1 - blendArc) + arc * blendArc;
      }
    }
    heightField.set(tmp);
    // re-zero boundary each pass
    for (let i = 0; i < N; i++) {
      if (boundary[i] || !inside[i]) heightField[i] = 0;
    }
  }

  // Soft clamp peak so user inflate stays predictable
  let hMax = 0;
  for (let i = 0; i < N; i++) if (heightField[i]! > hMax) hMax = heightField[i]!;
  if (hMax > 1e-8) {
    const gain = peakH / hMax;
    // only scale down if overshot; slight undershoot is fine (softer)
    if (gain < 1) {
      for (let i = 0; i < N; i++) heightField[i]! *= gain;
    }
  }

  // Build mesh from grid (top + bottom)
  const img = opts.imageData;
  const sampleColor = (px: number, py: number): [number, number, number] => {
    if (!img) return fill;
    const ix = Math.max(0, Math.min(img.width - 1, Math.floor(px)));
    const iy = Math.max(0, Math.min(img.height - 1, Math.floor(py)));
    const i = (iy * img.width + ix) * 4;
    return punchColor(img.data[i]! / 255, img.data[i + 1]! / 255, img.data[i + 2]! / 255);
  };

  // vertex index per grid cell, -1 if unused
  const vid = new Int32Array(N);
  vid.fill(-1);
  const positions: number[] = [];
  const colors: number[] = [];
  const uvs: number[] = [];

  const pushVert = (x: number, y: number, h: number, underside: boolean) => {
    const yy = underside ? -h * 0.98 : h; // nearly symmetric plush
    positions.push((x - canvasW / 2) * lateral, yy, (y - canvasH / 2) * lateral);
    uvs.push(x / canvasW, 1 - y / canvasH);
    const [r, g, b] = sampleColor(x, y);
    const lift = underside ? (img ? 0.72 : 0.55) : img ? 1.02 : 0.92 + 0.08 * Math.min(1, h / (peakH + 1e-6));
    colors.push(Math.min(1, r * lift), Math.min(1, g * lift), Math.min(1, b * lift));
    return positions.length / 3 - 1;
  };

  // top verts
  for (let j = 0; j < ny; j++) {
    for (let i = 0; i < nx; i++) {
      const idx = j * nx + i;
      if (!inside[idx]) continue;
      // keep a vertex if inside; boundary verts have h=0
      const x = minX + i * dx;
      const y = minY + j * dy;
      vid[idx] = pushVert(x, y, heightField[idx]!, false);
    }
  }

  const topCount = positions.length / 3;
  // bottom verts (same XY, mirrored)
  const vidBot = new Int32Array(N);
  vidBot.fill(-1);
  for (let j = 0; j < ny; j++) {
    for (let i = 0; i < nx; i++) {
      const idx = j * nx + i;
      if (vid[idx] < 0) continue;
      const x = minX + i * dx;
      const y = minY + j * dy;
      vidBot[idx] = pushVert(x, y, heightField[idx]!, true);
    }
  }

  const indices: number[] = [];
  const tryQuad = (i: number, j: number) => {
    const a = j * nx + i;
    const b = j * nx + (i + 1);
    const c = (j + 1) * nx + (i + 1);
    const d = (j + 1) * nx + i;
    if (vid[a]! < 0 || vid[b]! < 0 || vid[c]! < 0 || vid[d]! < 0) return;
    // top (CCW from above)
    indices.push(vid[a]!, vid[b]!, vid[c]!, vid[a]!, vid[c]!, vid[d]!);
    // bottom (flipped)
    indices.push(vidBot[a]!, vidBot[c]!, vidBot[b]!, vidBot[a]!, vidBot[d]!, vidBot[c]!);
  };
  for (let j = 0; j < ny - 1; j++) {
    for (let i = 0; i < nx - 1; i++) tryQuad(i, j);
  }

  // Side wall strip along silhouette: connect top/bottom where a grid edge
  // has one inside and one outside — seals the plush so it isn't a hollow shell gap
  for (let j = 0; j < ny; j++) {
    for (let i = 0; i < nx; i++) {
      const idx = j * nx + i;
      if (vid[idx]! < 0) continue;
      // right neighbor
      if (i + 1 < nx) {
        const n = j * nx + (i + 1);
        if (vid[n]! < 0) {
          // edge on boundary — thin wall using this vert duplicated? skip if neighbor out
        } else {
          // both inside: check if edge is on silhouette (a neighbor of either is outside)
        }
      }
    }
  }
  // Simpler side walls: for every boundary top vert with a boundary-edge to another boundary top vert
  for (let j = 0; j < ny; j++) {
    for (let i = 0; i < nx; i++) {
      const idx = j * nx + i;
      if (vid[idx]! < 0 || !boundary[idx]) continue;
      for (const [di, dj] of [
        [1, 0],
        [0, 1],
      ] as const) {
        const ii = i + di;
        const jj = j + dj;
        if (ii >= nx || jj >= ny) continue;
        const nidx = jj * nx + ii;
        if (vid[nidx]! < 0 || !boundary[nidx]) continue;
        // only emit wall if the quad toward the interior exists on one side
        // (prevents walls across the whole grid)
        const midX = minX + (i + ii) * 0.5 * dx;
        const midY = minY + (j + jj) * 0.5 * dy;
        // offset perpendicular toward possible interior
        const px = -(jj - j);
        const py = ii - i;
        const testIn =
          pointInPoly(midX + px * dx * 0.4, midY + py * dy * 0.4, contour) ||
          pointInPoly(midX - px * dx * 0.4, midY - py * dy * 0.4, contour);
        if (!testIn) continue;
        const t0 = vid[idx]!;
        const t1 = vid[nidx]!;
        const b0 = vidBot[idx]!;
        const b1 = vidBot[nidx]!;
        // outward-ish wall
        indices.push(t0, b0, b1, t0, b1, t1);
      }
    }
  }

  if (indices.length === 0 || topCount === 0) {
    // fallback: tiny empty
    return new THREE.BufferGeometry();
  }

  const geo = new THREE.BufferGeometry();
  geo.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
  geo.setAttribute("uv", new THREE.Float32BufferAttribute(uvs, 2));
  geo.setAttribute("color", new THREE.Float32BufferAttribute(colors, 3));
  geo.setIndex(indices);
  geo.computeVertexNormals();

  // One more normal-friendly pass: average split normals softens faceting
  // (MeshStandardMaterial already smooths by vertex normals)
  return geo;
}

/** Map UI 0–100 slider to inflate parameter. */
export function sliderToInflate(slider: number): number {
  // 0 → 0.2 (almost flat), 50 → 0.85 (default plush), 100 → 1.55 (chunky)
  const t = Math.max(0, Math.min(100, slider)) / 100;
  return 0.2 + t * 1.35;
}
