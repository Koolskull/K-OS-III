/*
 * Accurate client (mouse/touch) → canvas bitmap pixel mapping.
 *
 * CSS transform model we support on the canvas element:
 *   transform: translate(panX, panY) rotate(rotationDeg)
 *   transform-origin: center center
 *   zoom is applied via CSS width/height (NOT transform: scale)
 *
 * When rotated, getBoundingClientRect() is an AABB — we must inverse-rotate
 * around the visual center using the unrotated layout size (clientWidth/Height).
 */

/**
 * Map a client-space pointer into the canvas bitmap coordinate system
 * (0..canvas.width, 0..canvas.height), origin top-left of the bitmap.
 *
 * @param rotationDeg CSS rotate() angle in degrees (positive = CSS clockwise on screen)
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

  // Unrotated content box (bitmap paints here). Zoom is baked into these sizes.
  const contentW = canvas.clientWidth;
  const contentH = canvas.clientHeight;
  if (contentW < 1 || contentH < 1) return { x: -1, y: -1 };

  const cs = getComputedStyle(canvas);
  const borderLeft = parseFloat(cs.borderLeftWidth) || 0;
  const borderTop = parseFloat(cs.borderTopWidth) || 0;
  const padLeft = parseFloat(cs.paddingLeft) || 0;
  const padTop = parseFloat(cs.paddingTop) || 0;

  const rot = rotationDeg;

  // ── Unrotated (and pure translate) path ────────────────────────────
  // getBoundingClientRect already includes translate; content is inset by border/pad.
  if (Math.abs(rot) < 0.01) {
    const x =
      ((clientX - rect.left - borderLeft - padLeft) / contentW) * bw;
    const y =
      ((clientY - rect.top - borderTop - padTop) / contentH) * bh;
    return { x, y };
  }

  // ── Rotated path ───────────────────────────────────────────────────
  // Visual center of the transformed element = transform-origin (center).
  // AABB center from getBoundingClientRect coincides with that origin for
  // translate + rotate around center.
  const cx = rect.left + rect.width / 2;
  const cy = rect.top + rect.height / 2;

  // Screen-space vector from center → pointer
  const dx = clientX - cx;
  const dy = clientY - cy;

  // Inverse of CSS rotate(θ). In screen coords (Y down), CSS uses
  //   [[cosθ, -sinθ], [sinθ, cosθ]]
  // Inverse is rotate(-θ):
  //   [[cosθ, sinθ], [-sinθ, cosθ]]
  const θ = (rot * Math.PI) / 180;
  const c = Math.cos(θ);
  const s = Math.sin(θ);
  const rx = dx * c + dy * s;
  const ry = -dx * s + dy * c;

  // (rx, ry) is now in unrotated CSS px relative to the border-box center.
  // Content box is centered within the border box (equal borders assumed;
  // we use clientWidth which is the content size).
  // Map from content-local coords:
  //   content origin (0,0) is at center - (contentW/2, contentH/2) in border-box space
  //   but if there are borders, center of border box ≠ center of content by
  //   (borderRight-borderLeft)/2 etc. For border:none (our case) they match.
  const localX = rx + contentW / 2;
  const localY = ry + contentH / 2;

  const x = (localX / contentW) * bw;
  const y = (localY / contentH) * bh;
  return { x, y };
}
