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
import {
  radiusFromPressure,
  samplePressureCurve,
  stampDitherDisk,
  stampHarshDisk,
  stampPressureDisk,
  type DitherPatternId,
  type PressureCurve,
} from "@/lib/drawStamps";

export {
  forEachStrokePoint,
  normalizePressure,
  radiusFromPressure,
  samplePressureCurve,
  BAYER8,
  DITHER_PATTERNS,
  DEFAULT_DITHER_PATTERN,
  DEFAULT_PRESSURE_CURVE,
  sampleDitherRank,
  type DitherPatternId,
  type PressureCurve,
} from "@/lib/drawStamps";

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

/** Clamp canvas dimensions (1…4096) to keep memory sane */
export function clampCanvasSize(n: number): number {
  return Math.min(4096, Math.max(1, Math.round(n)));
}

/** Pixel-zoom floor/ceiling (allows sub-1× for large canvases) */
export const PIXEL_ZOOM_MIN = 0.05;
export const PIXEL_ZOOM_MAX = 64;

export function clampPixelZoom(z: number): number {
  if (!Number.isFinite(z) || z <= 0) return 1;
  return Math.min(PIXEL_ZOOM_MAX, Math.max(PIXEL_ZOOM_MIN, z));
}

/**
 * Zoom that fits spriteW×spriteH into a view box (with padding).
 * Used after resize / reset so large canvases open fully visible.
 */
export function fitPixelZoom(
  spriteW: number,
  spriteH: number,
  viewW: number,
  viewH: number,
  padding = 48,
): number {
  const aw = Math.max(32, viewW - padding);
  const ah = Math.max(32, viewH - padding);
  const zx = aw / Math.max(1, spriteW);
  const zy = ah / Math.max(1, spriteH);
  return clampPixelZoom(Math.min(zx, zy));
}

/** Human-readable zoom label: 12× · 1.5× · 0.25× */
export function formatPixelZoom(z: number): string {
  const v = clampPixelZoom(z);
  if (v >= 10) return `${Math.round(v)}`;
  if (v >= 1) return (Math.round(v * 10) / 10).toString();
  if (v >= 0.1) return (Math.round(v * 100) / 100).toString();
  return (Math.round(v * 1000) / 1000).toString();
}

/**
 * Nearest-neighbor resize of a single frame into newW×newH.
 * Stretches content to fill the new canvas (pixel-art friendly).
 */
export function resizeFrameNearest(
  frame: SpriteFrame,
  newW: number,
  newH: number,
  newId?: number,
): SpriteFrame {
  const w = clampCanvasSize(newW);
  const h = clampCanvasSize(newH);
  const next = createFrame(newId ?? frame.id, w, h);
  if (frame.width < 1 || frame.height < 1) return next;
  for (let y = 0; y < h; y++) {
    const sy = Math.min(frame.height - 1, Math.floor((y / h) * frame.height));
    for (let x = 0; x < w; x++) {
      const sx = Math.min(frame.width - 1, Math.floor((x / w) * frame.width));
      next.pixels[y * w + x] = frame.pixels[sy * frame.width + sx]!;
    }
  }
  return next;
}

/**
 * Resize entire project (all layers / frames) to newW×newH via nearest-neighbor.
 */
export function resizeProject(
  project: SpriteProject,
  newW: number,
  newH: number,
): SpriteProject {
  const w = clampCanvasSize(newW);
  const h = clampCanvasSize(newH);
  if (w === project.width && h === project.height) return project;
  return {
    ...project,
    width: w,
    height: h,
    layers: project.layers.map((layer) => ({
      ...layer,
      frames: layer.frames.map((f) => resizeFrameNearest(f, w, h)),
    })),
  };
}

/** Common canvas size presets for KoolDraw settings */
export const CANVAS_SIZE_PRESETS: readonly {
  id: string;
  label: string;
  w: number;
  h: number;
}[] = [
  { id: "16", label: "16×16", w: 16, h: 16 },
  { id: "32", label: "32×32", w: 32, h: 32 },
  { id: "64", label: "64×64", w: 64, h: 64 },
  { id: "128", label: "128×128", w: 128, h: 128 },
  { id: "vga", label: "640×480", w: 640, h: 480 },
  { id: "hd", label: "1920×1080", w: 1920, h: 1080 },
  // User-facing “4K-class” size (3840×2160); 3080×2160 kept as optional alias
  { id: "4k", label: "3840×2160", w: 3840, h: 2160 },
  { id: "4k-alt", label: "3080×2160", w: 3080, h: 2160 },
] as const;

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

// ── PRESSURE / HARSH / DITHER STAMPS (shared with SHOTLIST via drawStamps) ──

/** Write a solid pressure pen disk (color) onto a frame. */
export function stampFramePressurePen(
  frame: SpriteFrame,
  cx: number,
  cy: number,
  color: PackedColor,
  pressure: number,
  maxRadius: number,
): void {
  stampPressureDisk(cx, cy, { pressure, maxRadius }, (x, y) => setPixel(frame, x, y, color));
}

/** Harsh solid carve disk. */
export function stampFrameHarsh(
  frame: SpriteFrame,
  cx: number,
  cy: number,
  color: PackedColor,
  pressure: number,
  maxRadius: number,
): void {
  stampHarshDisk(cx, cy, { pressure, maxRadius }, (x, y) => setPixel(frame, x, y, color));
}

/** Ordered-dither pencil with phase offsets. */
export function stampFrameDither(
  frame: SpriteFrame,
  cx: number,
  cy: number,
  color: PackedColor,
  pressure: number,
  maxRadius: number,
  ditherOx: number,
  ditherOy: number,
  pattern?: DitherPatternId,
): void {
  stampDitherDisk(
    cx,
    cy,
    { pressure, maxRadius, ditherOx, ditherOy, pattern },
    (x, y) => setPixel(frame, x, y, color),
  );
}

/** Erase with pressure-sized solid disk (transparent). */
export function stampFrameEraserDisk(
  frame: SpriteFrame,
  cx: number,
  cy: number,
  pressure: number,
  maxRadius: number,
): void {
  stampPressureDisk(cx, cy, { pressure, maxRadius }, (x, y) => setPixel(frame, x, y, TRANSPARENT));
}

/** Soft / natural paint brush options (full color + opacity). */
export interface SoftPaintOpts {
  pressure: number;
  maxRadius: number;
  minRadius?: number;
  curve?: PressureCurve;
  /** Base opacity 0..1 (before pressure mapping) */
  opacity: number;
  /** When true, pressure also scales opacity */
  opacityFromPressure?: boolean;
  /** 0 = hard edge, 1 = fully feathered */
  softness: number;
  /** 0..1 scatter as fraction of radius */
  scatter: number;
  /** Sub-pixel coverage at edges (soft AA) */
  antialias: boolean;
  /** Snap final color to nearest palette hex (indexed mode) */
  indexedPalette?: string[] | null;
}

/** Nearest palette color by RGB distance (indexed / classic hardware feel). */
export function nearestPalettePacked(color: PackedColor, palette: string[]): PackedColor {
  if (!palette.length) return color;
  const { r, g, b, a } = packedColorToRGBA(color);
  let best = hexToPackedColor(palette[0]!);
  let bestD = Infinity;
  for (const hex of palette) {
    const p = hexToPackedColor(hex);
    const pr = p & 0xff;
    const pg = (p >> 8) & 0xff;
    const pb = (p >> 16) & 0xff;
    const d = (r - pr) ** 2 + (g - pg) ** 2 + (b - pb) ** 2;
    if (d < bestD) {
      bestD = d;
      best = p;
    }
  }
  // Keep source alpha intent
  return (best & 0x00ffffff) | (a << 24);
}

/**
 * Full-color soft paint disk: pressure size (curve), opacity, feather, scatter, AA.
 * Blends into existing frame pixels (not hard overwrite).
 */
export function stampFrameSoftPaint(
  frame: SpriteFrame,
  cx: number,
  cy: number,
  color: PackedColor,
  opts: SoftPaintOpts,
): void {
  const maxR = Math.max(1, opts.maxRadius);
  const minR = Math.max(0.5, Math.min(opts.minRadius ?? 1, maxR));
  const p = Math.min(1, Math.max(0, opts.pressure));
  // Smooth (non-integer) radius for soft paint
  const y = samplePressureCurve(p, opts.curve);
  const r = minR + y * (maxR - minR);

  let ox = cx;
  let oy = cy;
  const scatter = Math.min(1, Math.max(0, opts.scatter));
  if (scatter > 0.001) {
    const s = scatter * r;
    ox += (Math.random() * 2 - 1) * s;
    oy += (Math.random() * 2 - 1) * s;
  }

  let opac = Math.min(1, Math.max(0, opts.opacity));
  if (opts.opacityFromPressure) opac *= Math.max(0.05, p);

  let paint = color;
  if (opts.indexedPalette && opts.indexedPalette.length) {
    paint = nearestPalettePacked(color, opts.indexedPalette);
  }
  const { r: cr, g: cg, b: cb } = packedColorToRGBA(paint);
  const softness = Math.min(1, Math.max(0, opts.softness));
  const aa = opts.antialias;
  const rOuter = r + (aa ? 0.75 : 0);
  const rInner = Math.max(0.01, r * (1 - softness * 0.95));
  const rOuter2 = rOuter * rOuter;
  const rInner2 = rInner * rInner;

  const x0 = Math.floor(ox - rOuter);
  const y0 = Math.floor(oy - rOuter);
  const x1 = Math.ceil(ox + rOuter);
  const y1 = Math.ceil(oy + rOuter);

  for (let y = y0; y <= y1; y++) {
    for (let x = x0; x <= x1; x++) {
      if (x < 0 || y < 0 || x >= frame.width || y >= frame.height) continue;
      const dx = x + 0.5 - ox;
      const dy = y + 0.5 - oy;
      const d2 = dx * dx + dy * dy;
      if (d2 > rOuter2) continue;

      let cover = 1;
      if (softness > 0.001 || aa) {
        const d = Math.sqrt(d2);
        if (d <= rInner) cover = 1;
        else if (d >= rOuter) cover = 0;
        else cover = 1 - (d - rInner) / Math.max(0.001, rOuter - rInner);
        // Smoothstep for natural feather
        cover = cover * cover * (3 - 2 * cover);
      }

      const a = Math.round(255 * opac * cover);
      if (a <= 0) continue;
      const src = rgbaToPackedColor(cr, cg, cb, a);
      const i = y * frame.width + x;
      frame.pixels[i] = alphaBlend(frame.pixels[i]!, src);
    }
  }
}

/** Classic / hardware-style palette presets (hex). */
export const INDEXED_PALETTE_PRESETS: Record<
  string,
  { label: string; colors: string[] }
> = {
  pico8: {
    label: "PICO-8",
    colors: [
      "#000000", "#1D2B53", "#7E2553", "#008751",
      "#AB5236", "#5F574F", "#C2C3C7", "#FFF1E8",
      "#FF004D", "#FFA300", "#FFEC27", "#00E436",
      "#29ADFF", "#83769C", "#FF77A8", "#FFCCAA",
    ],
  },
  gameboy: {
    label: "GAME BOY",
    colors: ["#0f380f", "#306230", "#8bac0f", "#9bbc0f"],
  },
  cga: {
    label: "CGA",
    colors: [
      "#000000", "#0000AA", "#00AA00", "#00AAAA",
      "#AA0000", "#AA00AA", "#AA5500", "#AAAAAA",
      "#555555", "#5555FF", "#55FF55", "#55FFFF",
      "#FF5555", "#FF55FF", "#FFFF55", "#FFFFFF",
    ],
  },
  mono: {
    label: "MONO",
    colors: ["#000000", "#ffffff"],
  },
};

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

/**
 * Build a sprite project from a data URL (creative workflow handoff).
 * Image is scaled to width×height with nearest-neighbor feel (smoothing off).
 * When mono is true, pixels are thresholded to pure black / white (alpha kept).
 */
export async function loadProjectFromDataUrl(
  name: string,
  width: number,
  height: number,
  dataUrl: string | null | undefined,
  opts?: { mono?: boolean; bg?: "black" | "white" },
): Promise<SpriteProject> {
  const project = createBlankSprite(name, width, height);
  const frame = project.layers[0]!.frames[0]!;

  if (!dataUrl || typeof Image === "undefined") {
    if (opts?.bg === "white") {
      const white = rgbaToPackedColor(255, 255, 255, 255);
      frame.pixels.fill(white);
    }
    return project;
  }

  await new Promise<void>((resolve) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        resolve();
        return;
      }
      if (opts?.bg === "white") {
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(0, 0, width, height);
      } else if (opts?.bg === "black" || opts?.mono) {
        ctx.fillStyle = "#000000";
        ctx.fillRect(0, 0, width, height);
      }
      ctx.imageSmoothingEnabled = false;
      ctx.drawImage(img, 0, 0, width, height);
      const imageData = ctx.getImageData(0, 0, width, height);
      const d = imageData.data;
      for (let i = 0; i < width * height; i++) {
        const o = i * 4;
        let r = d[o]!;
        let g = d[o + 1]!;
        let b = d[o + 2]!;
        const a = d[o + 3]!;
        if (a === 0) {
          frame.pixels[i] = TRANSPARENT;
          continue;
        }
        if (opts?.mono) {
          const lum = (r + g + b) / 3;
          const v = lum >= 128 ? 255 : 0;
          r = g = b = v;
        }
        frame.pixels[i] = rgbaToPackedColor(r, g, b, a);
      }
      resolve();
    };
    img.onerror = () => resolve();
    img.src = dataUrl;
  });

  return project;
}

/**
 * Threshold a data URL to pure mono black/white PNG (SHOTLIST plate return path).
 */
export async function dataUrlToMonoDataUrl(
  dataUrl: string,
  width: number,
  height: number,
  bg: "black" | "white" = "black",
): Promise<string> {
  if (typeof document === "undefined") return dataUrl;
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        resolve(dataUrl);
        return;
      }
      ctx.fillStyle = bg === "white" ? "#ffffff" : "#000000";
      ctx.fillRect(0, 0, width, height);
      ctx.imageSmoothingEnabled = false;
      ctx.drawImage(img, 0, 0, width, height);
      const imageData = ctx.getImageData(0, 0, width, height);
      const d = imageData.data;
      for (let i = 0; i < width * height; i++) {
        const o = i * 4;
        const a = d[o + 3]!;
        if (a < 128) {
          // transparent → background
          const v = bg === "white" ? 255 : 0;
          d[o] = d[o + 1] = d[o + 2] = v;
          d[o + 3] = 255;
        } else {
          const lum = (d[o]! + d[o + 1]! + d[o + 2]!) / 3;
          const v = lum >= 128 ? 255 : 0;
          d[o] = d[o + 1] = d[o + 2] = v;
          d[o + 3] = 255;
        }
      }
      ctx.putImageData(imageData, 0, 0);
      resolve(canvas.toDataURL("image/png"));
    };
    img.onerror = () => resolve(dataUrl);
    img.src = dataUrl;
  });
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
