/*
 * Accurate client (mouse/touch) → canvas pixel mapping.
 * Accounts for CSS size vs backing store, borders, and optional CSS rotation.
 */

/**
 * Map a client-space pointer into the canvas bitmap coordinate system
 * (0..canvas.width, 0..canvas.height), origin top-left of the bitmap.
 *
 * Call this before converting to "logical" sprite/plate pixels (offset/zoom).
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

  const cs = getComputedStyle(canvas);
  const borderLeft = parseFloat(cs.borderLeftWidth) || 0;
  const borderTop = parseFloat(cs.borderTopWidth) || 0;
  const borderRight = parseFloat(cs.borderRightWidth) || 0;
  const borderBottom = parseFloat(cs.borderBottomWidth) || 0;
  const padLeft = parseFloat(cs.paddingLeft) || 0;
  const padTop = parseFloat(cs.paddingTop) || 0;
  const padRight = parseFloat(cs.paddingRight) || 0;
  const padBottom = parseFloat(cs.paddingBottom) || 0;

  // Content box size in CSS pixels (where the bitmap is painted)
  const contentW =
    rect.width - borderLeft - borderRight - padLeft - padRight;
  const contentH =
    rect.height - borderTop - borderBottom - padTop - padBottom;
  if (contentW < 1 || contentH < 1) return { x: -1, y: -1 };

  const rot = rotationDeg;

  if (Math.abs(rot) < 0.01) {
    // Axis-aligned (includes CSS translate pan — rect is already moved)
    const x = ((clientX - rect.left - borderLeft - padLeft) / contentW) * bw;
    const y = ((clientY - rect.top - borderTop - padTop) / contentH) * bh;
    return { x, y };
  }

  // Rotated around transform-origin center (default: center of border box).
  // Invert rotation about the visual center of the element.
  const cx = rect.left + rect.width / 2;
  const cy = rect.top + rect.height / 2;
  let dx = clientX - cx;
  let dy = clientY - cy;
  const rad = (-rot * Math.PI) / 180;
  const cos = Math.cos(rad);
  const sin = Math.sin(rad);
  const rx = dx * cos - dy * sin;
  const ry = dx * sin + dy * cos;

  // Unrotated content box is offsetWidth/Height minus border/padding
  // offsetWidth includes border+padding; use content dimensions we already have
  // when rotation is applied, contentW/contentH from getBoundingClientRect are for
  // the AABB — use offsetWidth/clientWidth for true unrotated layout size.
  const layoutW = canvas.clientWidth || contentW;
  const layoutH = canvas.clientHeight || contentH;
  const x = (0.5 + rx / layoutW) * bw;
  const y = (0.5 + ry / layoutH) * bh;
  return { x, y };
}
