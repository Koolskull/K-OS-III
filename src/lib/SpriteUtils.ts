/*
 *                    ☦
 *            ╔══════════════════╗
 *            ║  KOOLDRAW        ║
 *            ║  SPRITE UTILS    ║
 *            ╚══════════════════╝
 *
 *   Pixel manipulation, drawing primitives, flood fill, export.
 */

import type { SpriteFrame, SpriteLayer, SpriteProject, RGBA, PackedColor } from "@/types/sprite";

// ── COLOR CONVERSION ──

/** Pack RGBA into canvas-native ABGR Uint32 */
export function rgbaToPackedColor(r: number, g: number, b: number, a: number): PackedColor {
  return ((a << 24) | (b << 16) | (g << 8) | r) >>> 0;
}

/** Unpack canvas-native ABGR Uint32 to RGBA */
export function packedColorToRGBA(c: PackedColor): RGBA {
  return {
    r: c & 0xFF,
    g: (c >> 8) & 0xFF,
    b: (c >> 16) & 0xFF,
    a: (c >> 24) & 0xFF,
  };
}

/** Hex string "#RRGGBB" or "#RRGGBBAA" to packed color */
export function hexToPackedColor(hex: string): PackedColor {
  const h = hex.replace("#", "");
  const r = parseInt(h.slice(0, 2), 16);
  const g = parseInt(h.slice(2, 4), 16);
  const b = parseInt(h.slice(4, 6), 16);
  const a = h.length >= 8 ? parseInt(h.slice(6, 8), 16) : 255;
  return rgbaToPackedColor(r, g, b, a);
}

/** Packed color to "#RRGGBB" hex string */
export function packedColorToHex(c: PackedColor): string {
  const { r, g, b } = packedColorToRGBA(c);
  return `#${r.toString(16).padStart(2, "0")}${g.toString(16).padStart(2, "0")}${b.toString(16).padStart(2, "0")}`;
}

export const TRANSPARENT: PackedColor = 0;

// ── FRAME OPERATIONS ──

/** Create a blank frame */
export function createFrame(id: number, width: number, height: number): SpriteFrame {
  return { id, width, height, pixels: new Uint32Array(width * height) };
}

/** Clone a frame's pixels */
export function cloneFrame(frame: SpriteFrame, newId?: number): SpriteFrame {
  return {
    id: newId ?? frame.id,
    width: frame.width,
    height: frame.height,
    pixels: new Uint32Array(frame.pixels),
  };
}

/** Get pixel at (x, y), returns 0 if out of bounds */
export function getPixel(frame: SpriteFrame, x: number, y: number): PackedColor {
  if (x < 0 || x >= frame.width || y < 0 || y >= frame.height) return 0;
  return frame.pixels[y * frame.width + x];
}

/** Set pixel at (x, y), no-op if out of bounds */
export function setPixel(frame: SpriteFrame, x: number, y: number, color: PackedColor): void {
  if (x < 0 || x >= frame.width || y < 0 || y >= frame.height) return;
  frame.pixels[y * frame.width + x] = color;
}

// ── DRAWING PRIMITIVES ──

/** Bresenham line from (x0,y0) to (x1,y1), returns array of [x,y] */
export function getLinePixels(x0: number, y0: number, x1: number, y1: number): [number, number][] {
  const pixels: [number, number][] = [];
  let dx = Math.abs(x1 - x0);
  let dy = Math.abs(y1 - y0);
  const sx = x0 < x1 ? 1 : -1;
  const sy = y0 < y1 ? 1 : -1;
  let err = dx - dy;

  while (true) {
    pixels.push([x0, y0]);
    if (x0 === x1 && y0 === y1) break;
    const e2 = 2 * err;
    if (e2 > -dy) { err -= dy; x0 += sx; }
    if (e2 < dx) { err += dx; y0 += sy; }
  }
  return pixels;
}

/** Get pixels for a rectangle outline */
export function getRectPixels(x0: number, y0: number, x1: number, y1: number): [number, number][] {
  const minX = Math.min(x0, x1);
  const maxX = Math.max(x0, x1);
  const minY = Math.min(y0, y1);
  const maxY = Math.max(y0, y1);
  const pixels: [number, number][] = [];
  for (let x = minX; x <= maxX; x++) { pixels.push([x, minY]); pixels.push([x, maxY]); }
  for (let y = minY + 1; y < maxY; y++) { pixels.push([minX, y]); pixels.push([maxX, y]); }
  return pixels;
}

/** Get pixels for a filled rectangle */
export function getFilledRectPixels(x0: number, y0: number, x1: number, y1: number): [number, number][] {
  const minX = Math.min(x0, x1);
  const maxX = Math.max(x0, x1);
  const minY = Math.min(y0, y1);
  const maxY = Math.max(y0, y1);
  const pixels: [number, number][] = [];
  for (let y = minY; y <= maxY; y++) {
    for (let x = minX; x <= maxX; x++) {
      pixels.push([x, y]);
    }
  }
  return pixels;
}

/** Flood fill from (startX, startY) with color. Modifies frame in place. */
export function floodFill(frame: SpriteFrame, startX: number, startY: number, fillColor: PackedColor): void {
  const targetColor = getPixel(frame, startX, startY);
  if (targetColor === fillColor) return;

  const { width, height, pixels } = frame;
  const stack: [number, number][] = [[startX, startY]];
  const visited = new Uint8Array(width * height);

  while (stack.length > 0) {
    const [x, y] = stack.pop()!;
    const idx = y * width + x;
    if (x < 0 || x >= width || y < 0 || y >= height) continue;
    if (visited[idx]) continue;
    if (pixels[idx] !== targetColor) continue;

    visited[idx] = 1;
    pixels[idx] = fillColor;

    stack.push([x + 1, y], [x - 1, y], [x, y + 1], [x, y - 1]);
  }
}

// ── PEN SIZE ──

/** Get pixel positions for a square pen centered at (cx, cy) */
export function getPenPixels(cx: number, cy: number, size: number): [number, number][] {
  if (size <= 1) return [[cx, cy]];
  const half = Math.floor(size / 2);
  const pixels: [number, number][] = [];
  for (let dy = -half; dy < size - half; dy++) {
    for (let dx = -half; dx < size - half; dx++) {
      pixels.push([cx + dx, cy + dy]);
    }
  }
  return pixels;
}

// ── LAYER COMPOSITING ──

/** Composite all visible layers at a given frame index into a single frame */
export function compositeFrame(layers: SpriteLayer[], frameIndex: number, width: number, height: number): SpriteFrame {
  const result = createFrame(0, width, height);
  for (const layer of layers) {
    if (!layer.visible) continue;
    const frame = layer.frames[frameIndex];
    if (!frame) continue;
    const opacity = layer.opacity;
    for (let i = 0; i < width * height; i++) {
      const src = frame.pixels[i];
      if (src === 0) continue; // fully transparent
      if (opacity >= 1) {
        const srcA = (src >> 24) & 0xFF;
        if (srcA === 255) {
          result.pixels[i] = src;
        } else if (srcA > 0) {
          result.pixels[i] = alphaBlend(result.pixels[i], src);
        }
      } else {
        // Scale alpha by layer opacity
        const srcA = Math.round(((src >> 24) & 0xFF) * opacity);
        if (srcA === 0) continue;
        const adjusted = (src & 0x00FFFFFF) | (srcA << 24);
        result.pixels[i] = alphaBlend(result.pixels[i], adjusted);
      }
    }
  }
  return result;
}

/** Alpha blend src over dst (both packed ABGR) */
function alphaBlend(dst: PackedColor, src: PackedColor): PackedColor {
  const sa = ((src >> 24) & 0xFF) / 255;
  const sr = src & 0xFF;
  const sg = (src >> 8) & 0xFF;
  const sb = (src >> 16) & 0xFF;

  const da = ((dst >> 24) & 0xFF) / 255;
  const dr = dst & 0xFF;
  const dg = (dst >> 8) & 0xFF;
  const db = (dst >> 16) & 0xFF;

  const outA = sa + da * (1 - sa);
  if (outA === 0) return 0;

  const outR = Math.round((sr * sa + dr * da * (1 - sa)) / outA);
  const outG = Math.round((sg * sa + dg * da * (1 - sa)) / outA);
  const outB = Math.round((sb * sa + db * da * (1 - sa)) / outA);
  const outAi = Math.round(outA * 255);

  return rgbaToPackedColor(outR, outG, outB, outAi);
}

// ── FRAME TO CANVAS ──

/** Render a frame to an HTMLCanvasElement */
export function frameToCanvas(frame: SpriteFrame, scale: number = 1): HTMLCanvasElement {
  const canvas = document.createElement("canvas");
  canvas.width = frame.width * scale;
  canvas.height = frame.height * scale;
  const ctx = canvas.getContext("2d")!;
  ctx.imageSmoothingEnabled = false;

  // Draw at 1:1 first
  const tempCanvas = document.createElement("canvas");
  tempCanvas.width = frame.width;
  tempCanvas.height = frame.height;
  const tempCtx = tempCanvas.getContext("2d")!;
  const imageData = tempCtx.createImageData(frame.width, frame.height);
  const buf = new Uint32Array(imageData.data.buffer);
  buf.set(frame.pixels);
  tempCtx.putImageData(imageData, 0, 0);

  // Scale up
  if (scale > 1) {
    ctx.drawImage(tempCanvas, 0, 0, canvas.width, canvas.height);
  } else {
    ctx.drawImage(tempCanvas, 0, 0);
  }

  return canvas;
}

// ── PROJECT FACTORY ──

let nextId = 1;
export function nextSpriteId(): number {
  return nextId++;
}

/** Create a blank sprite project */
export function createBlankSprite(name: string, width: number, height: number): SpriteProject {
  const frame = createFrame(nextSpriteId(), width, height);
  const layer: SpriteLayer = {
    id: nextSpriteId(),
    name: "LAYER 1",
    opacity: 1,
    visible: true,
    frames: [frame],
  };
  return {
    name,
    width,
    height,
    fps: 8,
    layers: [layer],
    palette: [
      "#000000", "#ffffff", "#ff0000", "#00ff00",
      "#0000ff", "#ffff00", "#ff00ff", "#00ffff",
      "#888888", "#555555", "#880000", "#008800",
      "#000088", "#888800", "#880088", "#008888",
    ],
  };
}

// ── EXPORT HELPERS ──

/** Render all frames as a sprite sheet canvas */
export function renderSpriteSheet(
  project: SpriteProject,
  columns: number,
  scale: number = 1,
): HTMLCanvasElement {
  const frameCount = project.layers[0]?.frames.length ?? 0;
  const rows = Math.ceil(frameCount / columns);
  const w = project.width * scale;
  const h = project.height * scale;
  const canvas = document.createElement("canvas");
  canvas.width = w * columns;
  canvas.height = h * rows;
  const ctx = canvas.getContext("2d")!;
  ctx.imageSmoothingEnabled = false;

  for (let i = 0; i < frameCount; i++) {
    const composited = compositeFrame(project.layers, i, project.width, project.height);
    const frameCanvas = frameToCanvas(composited, scale);
    const col = i % columns;
    const row = Math.floor(i / columns);
    ctx.drawImage(frameCanvas, col * w, row * h);
  }

  return canvas;
}

/** Download a canvas as PNG */
export function downloadCanvasAsPng(canvas: HTMLCanvasElement, filename: string): void {
  canvas.toBlob((blob) => {
    if (!blob) return;
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  }, "image/png");
}

/** Download individual frames as a zip of PNGs */
export async function downloadFramesAsZip(
  project: SpriteProject,
  scale: number = 1,
): Promise<void> {
  const JSZip = (await import("jszip")).default;
  const zip = new JSZip();
  const frameCount = project.layers[0]?.frames.length ?? 0;

  for (let i = 0; i < frameCount; i++) {
    const composited = compositeFrame(project.layers, i, project.width, project.height);
    const canvas = frameToCanvas(composited, scale);
    const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/png"));
    if (blob) {
      zip.file(`${project.name}_${i.toString().padStart(4, "0")}.png`, blob);
    }
  }

  const content = await zip.generateAsync({ type: "blob" });
  const url = URL.createObjectURL(content);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${project.name}_frames.zip`;
  a.click();
  URL.revokeObjectURL(url);
}

/** Export animated GIF using canvas frames */
export async function downloadAsGif(
  project: SpriteProject,
  scale: number = 1,
): Promise<void> {
  // Use a simple GIF encoder approach: render each frame and encode
  const frameCount = project.layers[0]?.frames.length ?? 0;
  if (frameCount === 0) return;

  const w = project.width * scale;
  const h = project.height * scale;
  const delay = Math.round(1000 / Math.max(1, project.fps));

  // Build GIF using canvas-to-gif approach
  // For now, export as sprite sheet (GIF encoding requires a library)
  // TODO: integrate gif.js or similar
  const canvas = renderSpriteSheet(project, frameCount, scale);
  downloadCanvasAsPng(canvas, `${project.name}.png`);
}
