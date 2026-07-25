/*
 * Accurate client (mouse/touch) → canvas bitmap pixel mapping.
 *
 * For drawing accuracy the canvas element should have:
 *   - NO CSS transform (especially no translate/rotate/scale)
 *   - border: none; padding: 0; margin only for layout
 *   - zoom applied via CSS width/height only
 *
 * Pan/center the canvas with left/top + margin, not transform.
 */

/**
 * Map a client-space pointer into the canvas bitmap coordinate system
 * (0..canvas.width, 0..canvas.height), origin top-left of the bitmap.
 */
export function clientToCanvasBitmap(
  canvas: HTMLCanvasElement,
  clientX: number,
  clientY: number,
  _rotationDeg = 0,
): { x: number; y: number } {
  const bw = canvas.width;
  const bh = canvas.height;
  if (bw < 1 || bh < 1) return { x: -1, y: -1 };

  const rect = canvas.getBoundingClientRect();
  if (rect.width < 1 || rect.height < 1) return { x: -1, y: -1 };

  // Prefer layout content size when it matches the visual box (no ancestor scale).
  // Fall back to rect when an ancestor transform scales the element.
  const layoutW = canvas.clientWidth;
  const layoutH = canvas.clientHeight;
  const useLayout =
    layoutW >= 1 &&
    layoutH >= 1 &&
    Math.abs(rect.width - layoutW) < 0.5 &&
    Math.abs(rect.height - layoutH) < 0.5;

  const contentW = useLayout ? layoutW : rect.width;
  const contentH = useLayout ? layoutH : rect.height;

  const x = ((clientX - rect.left) / contentW) * bw;
  const y = ((clientY - rect.top) / contentH) * bh;
  return { x, y };
}
