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
/**
 * Some WebKit versions, under the CSS `zoom` property (not `transform:
 * scale`), paint an element at its zoomed visual size but report
 * getBoundingClientRect() / clientWidth / clientHeight at the PRE-zoom
 * logical size — the two agree with each other, but neither matches where
 * PointerEvent.clientX/clientY actually land (those are always true
 * on-screen position). Chromium keeps rect in sync with the real visual
 * size instead, so rect ends up LARGER than clientWidth there once zoom is
 * active. That difference is exactly how we detect which behavior the
 * current browser has, without any UA sniffing: if rect still matches
 * clientWidth despite an active zoom, rect hasn't picked it up, and we
 * scale it in ourselves using the zoom factor we set in the first place.
 */
function detectZoomCorrection(canvas: HTMLCanvasElement, rect: DOMRect, layoutW: number, layoutH: number): number {
  if (typeof document === "undefined") return 1;
  const zoomStr = getComputedStyle(document.documentElement).zoom;
  const activeZoom = zoomStr ? parseFloat(zoomStr) : 1;
  if (!Number.isFinite(activeZoom) || activeZoom <= 1.001) return 1;
  const rectMatchesLayout =
    Math.abs(rect.width - layoutW) < 1 && Math.abs(rect.height - layoutH) < 1;
  return rectMatchesLayout ? activeZoom : 1;
}

export function clientToCanvasBitmap(
  canvas: HTMLCanvasElement,
  clientX: number,
  clientY: number,
  rotationDeg = 0,
): { x: number; y: number } {
  const bw = canvas.width;
  const bh = canvas.height;
  if (bw < 1 || bh < 1) return { x: -1, y: -1 };

  const rawRect = canvas.getBoundingClientRect();
  if (rawRect.width < 1 || rawRect.height < 1) return { x: -1, y: -1 };

  // Unrotated content size (layout). Zoom is baked into these.
  const rawLayoutW = canvas.clientWidth || rawRect.width;
  const rawLayoutH = canvas.clientHeight || rawRect.height;
  if (rawLayoutW < 1 || rawLayoutH < 1) return { x: -1, y: -1 };

  const zc = detectZoomCorrection(canvas, rawRect, rawLayoutW, rawLayoutH);
  // Scaled from the viewport origin, matching how the browser paints a
  // zoomed subtree rooted at <html>/<body> — not from the element's own
  // top-left, which would double-count its already-corrected position.
  const rect = zc === 1 ? rawRect : new DOMRect(rawRect.left * zc, rawRect.top * zc, rawRect.width * zc, rawRect.height * zc);
  const layoutW = rawLayoutW * zc;
  const layoutH = rawLayoutH * zc;

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
    // zoom). Trusting rect unconditionally removes that failure mode — except
    // on WebKit browsers where rect itself doesn't reflect zoom either, which
    // `zc` above corrects for.
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
