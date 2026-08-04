import * as THREE from "three";

export type PinXY = { id: string; x: number; y: number };

/**
 * Inverse-distance-weighted 2D warp applied to balloon meshes.
 * Mesh local XZ maps from canvas pixels: x = (px - cw/2)*0.01, z = (py - ch/2)*0.01
 * Rest pin positions define the undeformed field; current pins pull the surface.
 */
export function applyPinWarp(
  group: THREE.Group,
  rest: PinXY[],
  current: PinXY[],
  canvasW: number,
  canvasH: number,
  restPositions: Map<THREE.BufferGeometry, Float32Array>,
): void {
  if (rest.length === 0) return;

  const restById = new Map(rest.map((p) => [p.id, p]));
  const deltas: { rx: number; ry: number; dx: number; dy: number }[] = [];
  for (const c of current) {
    const r = restById.get(c.id);
    if (!r) continue;
    const dx = c.x - r.x;
    const dy = c.y - r.y;
    if (Math.hypot(dx, dy) < 0.01 && deltas.length === 0) {
      /* still include zero for stability */
    }
    deltas.push({ rx: r.x, ry: r.y, dx, dy });
  }
  if (deltas.length === 0) return;

  const power = 2.2;
  const eps = 4; // px

  group.traverse((obj) => {
    if (!(obj as THREE.Mesh).isMesh) return;
    const mesh = obj as THREE.Mesh;
    const geo = mesh.geometry as THREE.BufferGeometry;
    const pos = geo.getAttribute("position") as THREE.BufferAttribute;
    if (!pos) return;

    let base = restPositions.get(geo);
    if (!base || base.length !== pos.array.length) {
      base = new Float32Array(pos.array as Float32Array);
      restPositions.set(geo, base);
    }

    for (let i = 0; i < pos.count; i++) {
      const ix = i * 3;
      const bx = base[ix]!;
      const by = base[ix + 1]!;
      const bz = base[ix + 2]!;
      // canvas coords
      const px = bx / 0.01 + canvasW / 2;
      const py = bz / 0.01 + canvasH / 2;

      let wsum = 0;
      let ddx = 0;
      let ddy = 0;
      for (const d of deltas) {
        const dist = Math.hypot(px - d.rx, py - d.ry) + eps;
        const w = 1 / Math.pow(dist, power);
        wsum += w;
        ddx += d.dx * w;
        ddy += d.dy * w;
      }
      if (wsum > 1e-12) {
        ddx /= wsum;
        ddy /= wsum;
      }
      // falloff so edges stay more planted (use |y| height as interior weight)
      const interior = Math.min(1, Math.abs(by) / 0.35);
      const k = 0.35 + 0.65 * interior;
      pos.setXYZ(i, bx + ddx * 0.01 * k, by, bz + ddy * 0.01 * k);
    }
    pos.needsUpdate = true;
    geo.computeVertexNormals();
  });
}

/** Reset mesh to stored rest pose. */
export function resetToRest(
  group: THREE.Group,
  restPositions: Map<THREE.BufferGeometry, Float32Array>,
): void {
  group.traverse((obj) => {
    if (!(obj as THREE.Mesh).isMesh) return;
    const mesh = obj as THREE.Mesh;
    const geo = mesh.geometry as THREE.BufferGeometry;
    const pos = geo.getAttribute("position") as THREE.BufferAttribute;
    const base = restPositions.get(geo);
    if (!pos || !base) return;
    (pos.array as Float32Array).set(base);
    pos.needsUpdate = true;
    geo.computeVertexNormals();
  });
}
