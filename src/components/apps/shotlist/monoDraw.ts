/*
 * SHOTLIST — monochrome bitmap helpers
 * Default thumbnail plate: 480 × 853 (≈ 9:16 portrait)
 * Optional upgrades after first thumbnail: 1920×1080 (HD) · 3840×2160 (4K)
 * Pixels are strictly 0 (black) or 255 (white).
 * Freehand stamps share algorithms with KoolDraw via @/lib/drawStamps.
 */

import {
  BAYER8,
  forEachStrokePoint,
  normalizePressure,
  stampDitherDisk,
  stampHarshDisk,
  stampPressureDisk,
} from "@/lib/drawStamps";

export { BAYER8, forEachStrokePoint, normalizePressure };

/** Default first-drawing thumbnail size (portrait storyboard plate) */
export const SHOT_W = 480;
export const SHOT_H = 853;
/** Landscape thumbnail (swap of portrait) */
export const SHOT_LANDSCAPE_W = 853;
export const SHOT_LANDSCAPE_H = 480;
/** @deprecated use plate pixel count for current size — kept for list defaults */
export const SHOT_PIXELS = SHOT_W * SHOT_H;

export type MonoInk = 0 | 255;
export type ShotBg = "black" | "white";
export type DrawTool = "harsh" | "pen" | "dither";
export type PlateOrientation = "portrait" | "landscape";

/** Named plate sizes. Thumbnail is required first; HD/4K unlock after commit. */
export type PlateSizeId = "thumb-portrait" | "thumb-landscape" | "hd" | "uhd";

export interface PlateSize {
  id: PlateSizeId;
  label: string;
  short: string;
  width: number;
  height: number;
  /** Only available after the shot has a committed first thumbnail */
  requiresThumbnail: boolean;
  orientation?: PlateOrientation;
}

export const PLATE_SIZES: readonly PlateSize[] = [
  {
    id: "thumb-portrait",
    label: "THUMB PORTRAIT 480×853",
    short: "480×853",
    width: 480,
    height: 853,
    requiresThumbnail: false,
    orientation: "portrait",
  },
  {
    id: "thumb-landscape",
    label: "THUMB LANDSCAPE 853×480",
    short: "853×480",
    width: 853,
    height: 480,
    requiresThumbnail: false,
    orientation: "landscape",
  },
  {
    id: "hd",
    label: "HD 1920×1080",
    short: "1920×1080",
    width: 1920,
    height: 1080,
    requiresThumbnail: true,
  },
  {
    id: "uhd",
    label: "4K 3840×2160",
    short: "3840×2160",
    width: 3840,
    height: 2160,
    requiresThumbnail: true,
  },
] as const;

export function thumbSize(orientation: PlateOrientation): { width: number; height: number } {
  return orientation === "landscape"
    ? { width: SHOT_LANDSCAPE_W, height: SHOT_LANDSCAPE_H }
    : { width: SHOT_W, height: SHOT_H };
}

export function plateSizeById(id: PlateSizeId): PlateSize {
  return PLATE_SIZES.find((p) => p.id === id) ?? PLATE_SIZES[0]!;
}

export function plateSizeFromDims(width: number, height: number): PlateSize | null {
  return (
    PLATE_SIZES.find((p) => p.width === width && p.height === height) ?? null
  );
}

/** Upgrade targets available once a first thumbnail exists (not the current size). */
export function availableUpgrades(
  hasCommittedThumbnail: boolean,
  currentW: number,
  currentH: number,
): PlateSize[] {
  if (!hasCommittedThumbnail) return [];
  return PLATE_SIZES.filter(
    (p) =>
      p.requiresThumbnail &&
      !(p.width === currentW && p.height === currentH) &&
      // Only allow stepping up in total pixels (no downscale path for now)
      p.width * p.height > currentW * currentH,
  );
}

export function bgToInk(bg: ShotBg): MonoInk {
  return bg === "white" ? 255 : 0;
}

export function createBlankBitmap(
  bg: ShotBg,
  width = SHOT_W,
  height = SHOT_H,
): Uint8ClampedArray {
  const data = new Uint8ClampedArray(width * height);
  data.fill(bgToInk(bg));
  return data;
}

export function cloneBitmap(src: Uint8ClampedArray): Uint8ClampedArray {
  return new Uint8ClampedArray(src);
}

export function indexAt(x: number, y: number, width: number): number {
  return y * width + x;
}

export function inBounds(
  x: number,
  y: number,
  width: number,
  height: number,
): boolean {
  return x >= 0 && y >= 0 && x < width && y < height;
}

export interface StampOpts {
  ink: MonoInk;
  /** 0..1 */
  pressure: number;
  ditherOx: number;
  ditherOy: number;
  width: number;
  height: number;
}

function writeMono(
  bmp: Uint8ClampedArray,
  ink: MonoInk,
  width: number,
  height: number,
) {
  return (x: number, y: number) => {
    const ix = Math.floor(x);
    const iy = Math.floor(y);
    if (ix < 0 || iy < 0 || ix >= width || iy >= height) return;
    bmp[indexAt(ix, iy, width)] = ink;
  };
}

export function stampHarsh(
  bmp: Uint8ClampedArray,
  cx: number,
  cy: number,
  opts: StampOpts,
): void {
  stampHarshDisk(
    cx,
    cy,
    { pressure: opts.pressure, maxRadius: 5 },
    writeMono(bmp, opts.ink, opts.width, opts.height),
  );
}

export function stampPen(
  bmp: Uint8ClampedArray,
  cx: number,
  cy: number,
  opts: StampOpts,
): void {
  stampPressureDisk(
    cx,
    cy,
    { pressure: opts.pressure, maxRadius: 23 },
    writeMono(bmp, opts.ink, opts.width, opts.height),
  );
}

export function stampDither(
  bmp: Uint8ClampedArray,
  cx: number,
  cy: number,
  opts: StampOpts,
): void {
  stampDitherDisk(
    cx,
    cy,
    {
      pressure: opts.pressure,
      maxRadius: 28,
      ditherOx: opts.ditherOx,
      ditherOy: opts.ditherOy,
    },
    writeMono(bmp, opts.ink, opts.width, opts.height),
  );
}

export function stampTool(
  bmp: Uint8ClampedArray,
  tool: DrawTool,
  cx: number,
  cy: number,
  opts: StampOpts,
): void {
  switch (tool) {
    case "harsh":
      stampHarsh(bmp, cx, cy, opts);
      break;
    case "pen":
      stampPen(bmp, cx, cy, opts);
      break;
    case "dither":
      stampDither(bmp, cx, cy, opts);
      break;
  }
}

export function bitmapToImageData(
  bmp: Uint8ClampedArray,
  width: number,
  height: number,
): ImageData {
  const n = width * height;
  const rgba = new Uint8ClampedArray(n * 4);
  for (let i = 0; i < n; i++) {
    const v = bmp[i]!;
    const o = i * 4;
    rgba[o] = v;
    rgba[o + 1] = v;
    rgba[o + 2] = v;
    rgba[o + 3] = 255;
  }
  return new ImageData(rgba, width, height);
}

export function imageDataToBitmap(img: ImageData): Uint8ClampedArray {
  const n = img.width * img.height;
  const bmp = new Uint8ClampedArray(n);
  const d = img.data;
  for (let i = 0; i < n; i++) {
    const o = i * 4;
    const lum = (d[o]! + d[o + 1]! + d[o + 2]!) / 3;
    bmp[i] = lum >= 128 ? 255 : 0;
  }
  return bmp;
}

export function bitmapToDataURL(
  bmp: Uint8ClampedArray,
  width: number,
  height: number,
): string {
  if (typeof document === "undefined") return "";
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) return "";
  ctx.putImageData(bitmapToImageData(bmp, width, height), 0, 0);
  return canvas.toDataURL("image/png");
}

export function dataURLToBitmap(
  dataUrl: string,
  width: number,
  height: number,
  bg: ShotBg = "black",
): Promise<Uint8ClampedArray> {
  return new Promise((resolve) => {
    if (typeof Image === "undefined" || !dataUrl) {
      resolve(createBlankBitmap(bg, width, height));
      return;
    }
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        resolve(createBlankBitmap(bg, width, height));
        return;
      }
      ctx.fillStyle = bg === "white" ? "#fff" : "#000";
      ctx.fillRect(0, 0, width, height);
      ctx.imageSmoothingEnabled = false;
      ctx.drawImage(img, 0, 0, width, height);
      resolve(imageDataToBitmap(ctx.getImageData(0, 0, width, height)));
    };
    img.onerror = () => resolve(createBlankBitmap(bg, width, height));
    img.src = dataUrl;
  });
}

/**
 * Upscale / reframe a mono plate into a new size.
 * Letterboxes the source (contain) on the target with bg fill; nearest-neighbor.
 */
export async function upgradePlateDataUrl(
  dataUrl: string | null,
  srcW: number,
  srcH: number,
  dstW: number,
  dstH: number,
  bg: ShotBg,
): Promise<string> {
  if (typeof document === "undefined") return dataUrl ?? "";

  const canvas = document.createElement("canvas");
  canvas.width = dstW;
  canvas.height = dstH;
  const ctx = canvas.getContext("2d");
  if (!ctx) return dataUrl ?? "";

  ctx.fillStyle = bg === "white" ? "#ffffff" : "#000000";
  ctx.fillRect(0, 0, dstW, dstH);
  ctx.imageSmoothingEnabled = false;

  const drawContained = (img: CanvasImageSource, iw: number, ih: number) => {
    const scale = Math.min(dstW / iw, dstH / ih);
    const dw = Math.max(1, Math.round(iw * scale));
    const dh = Math.max(1, Math.round(ih * scale));
    const dx = Math.floor((dstW - dw) / 2);
    const dy = Math.floor((dstH - dh) / 2);
    ctx.drawImage(img, 0, 0, iw, ih, dx, dy, dw, dh);
  };

  if (!dataUrl) {
    return canvas.toDataURL("image/png");
  }

  await new Promise<void>((resolve) => {
    const img = new Image();
    img.onload = () => {
      const iw = img.naturalWidth || srcW;
      const ih = img.naturalHeight || srcH;
      drawContained(img, iw, ih);
      // Force mono after scale (no gray from browser resampling edge cases)
      const imageData = ctx.getImageData(0, 0, dstW, dstH);
      const d = imageData.data;
      for (let i = 0; i < dstW * dstH; i++) {
        const o = i * 4;
        const lum = (d[o]! + d[o + 1]! + d[o + 2]!) / 3;
        const v = lum >= 128 ? 255 : 0;
        d[o] = d[o + 1] = d[o + 2] = v;
        d[o + 3] = 255;
      }
      ctx.putImageData(imageData, 0, 0);
      resolve();
    };
    img.onerror = () => resolve();
    img.src = dataUrl;
  });

  return canvas.toDataURL("image/png");
}
