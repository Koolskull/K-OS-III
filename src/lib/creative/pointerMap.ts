/*
 * Accurate client (mouse/touch) → canvas bitmap pixel mapping.
 *
 * Supports pan (via layout position) and CSS rotate around center.
 * Zoom should be applied via CSS width/height (not transform:scale)
 * so content box sizes stay meaningful.
 *
 * Prefer: border none, padding 0. Pan with left/top + margin or
 * translate; rotation with transform: rotate() transform-origin: center.
 */

/**
 * Map a client-space pointer into the canvas bitmap coordinate system
 * (0..canvas.width, 0..canvas.height), origin top-left of the bitmap.
 *
 * @param rotationDeg CSS rotate() angle in degrees (positive = CSS clockwise)
 */
export function clientToCanvasBitmap(
  canvas: HTMLCanvasElement,
  clientX: number,
  clientY: number,
  rotationDeg = 0,
): { x: number; y: number } {
  const bw = canvas.width;
  const bh = canvas.height;
  if (bw < 1 || bh < 1) return { x: -1, y: -1 };

  const rect = canvas.getBoundingClientRect();
  if (rect.width < 1 || rect.height < 1) return { x: -1, y: -1 };

  // Unrotated content size (layout). Zoom is baked into these.
  const layoutW = canvas.clientWidth || rect.width;
  const layoutH = canvas.clientHeight || rect.height;
  if (layoutW < 1 || layoutH < 1) return { x: -1, y: -1 };

  const rot = rotationDeg;

  // Visual center = transform-origin center (AABB center after rotate)
  const cx = rect.left + rect.width / 2;
  const cy = rect.top + rect.height / 2;
  const dx = clientX - cx;
  const dy = clientY - cy;

  if (Math.abs(rot) < 0.01) {
    // Axis-aligned: rect.width/height IS the true on-screen size in the same
    // coordinate space as clientX/clientY by spec (getBoundingClientRect
    // reflects every ancestor transform, CSS zoom, etc. — ALWAYS correct
    // here since rotate(0)/translate() never change an element's own
    // width/height). Previously this compared rect against canvas.clientWidth
    // and only trusted rect when they "looked" ancestor-scaled — a heuristic
    // that silently mismapped clicks whenever clientWidth and rect diverged
    // for reasons other than a transform:scale ancestor (e.g. page-level CSS
    // zoom). Trusting rect unconditionally removes that failure mode.
    const x = ((clientX - rect.left) / rect.width) * bw;
    const y = ((clientY - rect.top) / rect.height) * bh;
    return { x, y };
  }

  // Inverse of CSS rotate(θ). Screen y-down; CSS positive θ is clockwise:
  //   [[cosθ, sinθ], [-sinθ, cosθ]] applied to (dx, dy) about center.
  const θ = (rot * Math.PI) / 180;
  const c = Math.cos(θ);
  const s = Math.sin(θ);
  const rx = dx * c + dy * s;
  const ry = -dx * s + dy * c;

  // (rx, ry) is CSS px from border-box center in unrotated space.
  // Content is centered in the border box (border:none → matches).
  const localX = rx + layoutW / 2;
  const localY = ry + layoutH / 2;

  const x = (localX / layoutW) * bw;
  const y = (localY / layoutH) * bh;
  return { x, y };
}
