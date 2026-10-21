function zoomOf(el: Element): number {
  const raw = parseFloat(getComputedStyle(el).zoom || "1");
  return Number.isFinite(raw) && raw > 0 ? raw : 1;
}

/** Layout size of `el`'s parent that is actually on screen.
 * html and body both set zoom, and Chrome multiplies them, so a wide
 * desktop paints near 2× and clips. Columns follow that visible box.
 */
export function visibleLayoutBox(el: HTMLElement): { w: number; h: number; parentW: number; parentH: number } {
  const base = el.parentElement ?? el;
  const parentW = base.clientWidth || window.innerWidth;
  const parentH = base.clientHeight || window.innerHeight;
  const rect = base.getBoundingClientRect();
  const rectScale = parentW > 8 ? rect.width / parentW : 1;
  const scale = zoomOf(document.documentElement) * zoomOf(document.body);
  const paint = rectScale > 1.08 ? rectScale : scale > 1.08 ? scale : 1;
  const left = rectScale > 1.08 ? rect.left / rectScale : rect.left;
  const top = rectScale > 1.08 ? rect.top / rectScale : rect.top;
  const viewW = window.innerWidth / paint;
  const viewH = window.innerHeight / paint;
  return {
    w: Math.floor(Math.min(parentW, Math.max(0, viewW - Math.max(0, left)))),
    h: Math.floor(Math.min(parentH, Math.max(0, viewH - Math.max(0, top)))),
    parentW,
    parentH,
  };
}
