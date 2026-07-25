/*
 *                    ☦
 *            ╔═══════════════════╗
 *            ║  KOOLDRAW        ║
 *            ║  SPRITE CANVAS   ║
 *            ╚═══════════════════╝
 *
 *   Main drawing canvas with zoom, pan, pixel grid.
 *   Handles mouse/touch input and routes to active tool.
 *   Uses Pointer Events so finger-drag paints continuously on mobile.
 *   Pressure-aware freehand: pen / harsh / dither / eraser.
 *   Viewport: space-pan, shift rotate, pinch zoom+twist, 2-finger undo, 3-finger redo.
 *   Supports onion skinning (previous = purple, next = green).
 *   Supports playback displayFrameIndex for main-canvas animation preview.
 */

"use client";

import React, { useRef, useEffect, useCallback, useState } from "react";
import type { SpriteLayer, ToolId, PackedColor } from "@/types/sprite";
import { clientToCanvasBitmap, useCanvasViewport } from "@/lib/creative";
import {
  getPixel,
  setPixel,
  getLinePixels,
  getRectPixels,
  floodFill,
  compositeFrame,
  packedColorToRGBA,
  normalizePressure,
  stampFramePressurePen,
  stampFrameHarsh,
  stampFrameDither,
  stampFrameEraserDisk,
  stampFrameSoftPaint,
  type DitherPatternId,
  type PressureCurve,
  DEFAULT_PRESSURE_CURVE,
} from "@/lib/SpriteUtils";

export interface OnionSkinSettings {
  enabled: boolean;
  /** Opacity for previous frames: index 0 = frame-1, 1 = frame-2, 2 = frame-3 */
  prevOpacities: [number, number, number];
  /** Opacity for next frames: index 0 = frame+1, 1 = frame+2, 2 = frame+3 */
  nextOpacities: [number, number, number];
  /**
   * Wrap onion around the animation loop:
   * first frame sees last as previous; last frame sees first as next.
   */
  loopWrap?: boolean;
}

/** Soft paint / pressure brush settings (full color) */
export interface BrushSettings {
  /** Max brush radius/width in px (1–256) */
  maxSize: number;
  minSize: number;
  /** Base opacity 0..1 */
  opacity: number;
  /** Map pressure → opacity */
  opacityFromPressure: boolean;
  /** Map pressure → size (via curve) */
  sizeFromPressure: boolean;
  softness: number;
  scatter: number;
  antialias: boolean;
  curve: PressureCurve;
  /** When set, snap paint colors to this palette (indexed mode) */
  indexedPalette: string[] | null;
}

export const DEFAULT_BRUSH: BrushSettings = {
  maxSize: 8,
  minSize: 1,
  opacity: 1,
  opacityFromPressure: true,
  sizeFromPressure: true,
  softness: 0.35,
  scatter: 0,
  antialias: true,
  curve: { ...DEFAULT_PRESSURE_CURVE },
  indexedPalette: null,
};

interface SpriteCanvasProps {
  layers: SpriteLayer[];
  activeLayerIndex: number;
  activeFrameIndex: number;
  /** Frame shown on canvas (overrides activeFrameIndex for display, e.g. during playback) */
  displayFrameIndex?: number;
  /** When true, block drawing and hide onion skin (playback mode) */
  playing?: boolean;
  width: number;
  height: number;
  tool: ToolId;
  color: PackedColor;
  penSize: number;
  brush?: BrushSettings;
  /** Bayer phase X for dither pencil (0–7) */
  ditherOx?: number;
  /** Bayer phase Y for dither pencil (0–7) */
  ditherOy?: number;
  /** Dither pattern id (opacity / texture variety) */
  ditherPattern?: DitherPatternId;
  zoom: number;
  onZoomChange: (zoom: number) => void;
  /** Called after discrete edits (fill, shape commit) — parent should push undo + re-render chrome. */
  onPixelsChanged: () => void;
  /** Called once at freehand stroke start, before paint — parent should snapshot undo. */
  onStrokeBegin?: () => void;
  /** Called at freehand stroke end — parent should refresh thumbs (no new undo entry). */
  onStrokeEnd?: () => void;
  /** Two-finger tap / external undo */
  onUndo?: () => void;
  /** Three-finger tap / external redo */
  onRedo?: () => void;
  onColorPicked: (color: PackedColor) => void;
  onionSkin?: OnionSkinSettings;
}

const CHECKER_LIGHT = "#2a2a2a";
const CHECKER_DARK = "#1a1a1a";
const GRID_COLOR = "#333333";

const ONION_PREV = { r: 180, g: 80, b: 255 };
const ONION_NEXT = { r: 60, g: 220, b: 120 };

/** Write composited frame into ImageData (fast path — one putImageData). */
function packFrameToImageData(
  imageData: ImageData,
  layers: SpriteLayer[],
  frameIndex: number,
  width: number,
  height: number,
  tint?: { r: number; g: number; b: number },
  opacity = 1,
): void {
  const composited = compositeFrame(layers, frameIndex, width, height);
  const buf = new Uint32Array(imageData.data.buffer);
  if (!tint) {
    buf.set(composited.pixels);
    return;
  }
  for (let i = 0; i < width * height; i++) {
    const c = composited.pixels[i]!;
    if (c === 0) {
      buf[i] = 0;
      continue;
    }
    const rgba = packedColorToRGBA(c);
    if (rgba.a === 0) {
      buf[i] = 0;
      continue;
    }
    const lum = (rgba.r * 0.299 + rgba.g * 0.587 + rgba.b * 0.114) / 255;
    const r = Math.round(tint.r * (0.35 + lum * 0.65));
    const g = Math.round(tint.g * (0.35 + lum * 0.65));
    const b = Math.round(tint.b * (0.35 + lum * 0.65));
    const a = Math.round(rgba.a * opacity);
    // ABGR packed (little-endian ImageData)
    buf[i] = ((a << 24) | (b << 16) | (g << 8) | r) >>> 0;
  }
}

export function SpriteCanvas({
  layers,
  activeLayerIndex,
  activeFrameIndex,
  displayFrameIndex,
  playing = false,
  width,
  height,
  tool,
  color,
  penSize,
  brush = DEFAULT_BRUSH,
  ditherOx = 0,
  ditherOy = 0,
  ditherPattern = "bayer8",
  zoom,
  onZoomChange,
  onPixelsChanged,
  onStrokeBegin,
  onStrokeEnd,
  onUndo,
  onRedo,
  onColorPicked,
  onionSkin,
}: SpriteCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const spriteBufRef = useRef<HTMLCanvasElement | null>(null);
  const onionBufRef = useRef<HTMLCanvasElement | null>(null);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const drawingRef = useRef(false);

  const {
    viewport,
    onPointerDown: vpDown,
    onPointerMove: vpMove,
    onPointerUp: vpUp,
    spaceDownRef,
    onWheelZoom: camWheelZoom,
    resetViewport,
  } = useCanvasViewport({
    onUndo,
    onRedo,
    minZoom: 0.35,
    maxZoom: 4,
    enabled: !playing,
    enableRotation: true,
    pinchRotate: true,
  });

  /** Pixel zoom × camera zoom (pinch / scroll multiplies camera) */
  const drawZoom = Math.max(1, zoom * (viewport.zoom || 1));
  /** Sub-pixel stroke continuity for freehand tools */
  const lastPixelRef = useRef<{ x: number; y: number } | null>(null);
  const shapeStartRef = useRef<[number, number] | null>(null);
  const overlayRef = useRef<[number, number, PackedColor][]>([]);
  const activePointerIdRef = useRef<number | null>(null);
  const toolRef = useRef(tool);
  const colorRef = useRef(color);
  const penSizeRef = useRef(penSize);
  const brushRef = useRef(brush);
  const ditherOxRef = useRef(ditherOx);
  const ditherOyRef = useRef(ditherOy);
  const ditherPatternRef = useRef(ditherPattern);
  toolRef.current = tool;
  colorRef.current = color;
  penSizeRef.current = penSize;
  brushRef.current = brush;
  ditherOxRef.current = ditherOx;
  ditherOyRef.current = ditherOy;
  ditherPatternRef.current = ditherPattern;

  const viewFrameIndex = displayFrameIndex ?? activeFrameIndex;
  const activeLayer = layers[activeLayerIndex];
  const activeFrame = activeLayer?.frames[activeFrameIndex];

  /** Sub-pixel coords: bitmap space → sprite pixels via offset / drawZoom. */
  const screenToFloatPixel = useCallback(
    (clientX: number, clientY: number): [number, number] => {
      const canvas = canvasRef.current;
      if (!canvas) return [-1, -1];
      const { x: sx, y: sy } = clientToCanvasBitmap(
        canvas,
        clientX,
        clientY,
        viewport.rotation,
      );
      if (sx < 0 || sy < 0) return [-1, -1];
      const px = (sx - offset.x) / drawZoom;
      const py = (sy - offset.y) / drawZoom;
      return [px, py];
    },
    [offset, drawZoom, viewport.rotation],
  );

  /** Integer pixel coords (shapes / fill / picker). */
  const screenToPixel = useCallback(
    (clientX: number, clientY: number): [number, number] => {
      const [fx, fy] = screenToFloatPixel(clientX, clientY);
      return [Math.floor(fx), Math.floor(fy)];
    },
    [screenToFloatPixel],
  );

  const ensureBuf = (ref: React.MutableRefObject<HTMLCanvasElement | null>) => {
    let c = ref.current;
    if (!c) {
      c = document.createElement("canvas");
      ref.current = c;
    }
    if (c.width !== width || c.height !== height) {
      c.width = width;
      c.height = height;
    }
    return c;
  };

  /**
   * Fast path: composite → ImageData once, blit with drawImage.
   * (Previously filled every pixel with fillRect — unusable while stroking.)
   */
  const render = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const cw = canvas.width;
    const ch = canvas.height;
    ctx.clearRect(0, 0, cw, ch);

    const z = drawZoom;
    const ox = offset.x;
    const oy = offset.y;
    const dw = width * z;
    const dh = height * z;

    // Checker background (two-color grid via few rects when z is large is still OK;
    // for speed use a 2×2 pattern scaled to z)
    {
      const tile = Math.max(1, Math.floor(z));
      const pat = document.createElement("canvas");
      pat.width = tile * 2;
      pat.height = tile * 2;
      const pctx = pat.getContext("2d")!;
      pctx.fillStyle = CHECKER_LIGHT;
      pctx.fillRect(0, 0, tile, tile);
      pctx.fillRect(tile, tile, tile, tile);
      pctx.fillStyle = CHECKER_DARK;
      pctx.fillRect(tile, 0, tile, tile);
      pctx.fillRect(0, tile, tile, tile);
      const pattern = ctx.createPattern(pat, "repeat");
      if (pattern) {
        ctx.save();
        ctx.translate(ox, oy);
        ctx.fillStyle = pattern;
        ctx.fillRect(0, 0, dw, dh);
        ctx.restore();
      }
    }

    // Onion skins (composited once each → drawImage)
    if (onionSkin?.enabled && !playing) {
      const onion = ensureBuf(onionBufRef);
      const octx = onion.getContext("2d")!;
      const img = octx.createImageData(width, height);
      const frameCount = layers[0]?.frames.length ?? 0;
      const wrap = !!onionSkin.loopWrap && frameCount > 1;
      const resolvePrev = (d: number): number | null => {
        let fi = viewFrameIndex - d;
        if (fi >= 0) return fi;
        if (!wrap) return null;
        fi = ((fi % frameCount) + frameCount) % frameCount;
        return fi === viewFrameIndex ? null : fi;
      };
      const resolveNext = (d: number): number | null => {
        let fi = viewFrameIndex + d;
        if (fi < frameCount) return fi;
        if (!wrap) return null;
        fi = fi % frameCount;
        return fi === viewFrameIndex ? null : fi;
      };
      for (let d = 3; d >= 1; d--) {
        const fi = resolvePrev(d);
        const op = onionSkin.prevOpacities[d - 1] ?? 0;
        if (fi != null && op > 0.001) {
          packFrameToImageData(img, layers, fi, width, height, ONION_PREV, op);
          octx.putImageData(img, 0, 0);
          ctx.imageSmoothingEnabled = false;
          ctx.drawImage(onion, ox, oy, dw, dh);
        }
      }
      for (let d = 3; d >= 1; d--) {
        const fi = resolveNext(d);
        const op = onionSkin.nextOpacities[d - 1] ?? 0;
        if (fi != null && op > 0.001) {
          packFrameToImageData(img, layers, fi, width, height, ONION_NEXT, op);
          octx.putImageData(img, 0, 0);
          ctx.imageSmoothingEnabled = false;
          ctx.drawImage(onion, ox, oy, dw, dh);
        }
      }
    }

    // Main composite — single blit
    {
      const buf = ensureBuf(spriteBufRef);
      const bctx = buf.getContext("2d")!;
      const img = bctx.createImageData(width, height);
      packFrameToImageData(img, layers, viewFrameIndex, width, height);
      // Overlay shape preview into buffer
      if (!playing && overlayRef.current.length) {
        const u32 = new Uint32Array(img.data.buffer);
        for (const [px, py, oc] of overlayRef.current) {
          if (px < 0 || py < 0 || px >= width || py >= height) continue;
          u32[py * width + px] = oc;
        }
      }
      bctx.putImageData(img, 0, 0);
      ctx.imageSmoothingEnabled = false;
      ctx.drawImage(buf, ox, oy, dw, dh);
    }

    if (z >= 6 && !playing) {
      ctx.strokeStyle = GRID_COLOR;
      ctx.lineWidth = 1;
      ctx.beginPath();
      for (let x = 0; x <= width; x++) {
        const px = ox + x * z + 0.5;
        ctx.moveTo(px, oy);
        ctx.lineTo(px, oy + dh);
      }
      for (let y = 0; y <= height; y++) {
        const py = oy + y * z + 0.5;
        ctx.moveTo(ox, py);
        ctx.lineTo(ox + dw, py);
      }
      ctx.stroke();
    }

    ctx.strokeStyle = "#555555";
    ctx.lineWidth = 1;
    ctx.strokeRect(ox - 0.5, oy - 0.5, dw + 1, dh + 1);
  }, [layers, viewFrameIndex, width, height, drawZoom, offset, onionSkin, playing]);

  useEffect(() => {
    render();
  }, [render]);

  useEffect(() => {
    const container = containerRef.current;
    const canvas = canvasRef.current;
    if (!container || !canvas) return;

    const observer = new ResizeObserver(() => {
      canvas.width = container.clientWidth;
      canvas.height = container.clientHeight;
      setOffset({
        x: Math.floor((canvas.width - width * drawZoom) / 2),
        y: Math.floor((canvas.height - height * drawZoom) / 2),
      });
      render();
    });
    observer.observe(container);
    return () => observer.disconnect();
  }, [width, height, drawZoom, render]);

  const applyFreehandStamp = useCallback(
    (fx: number, fy: number, pressure: number, pointerType: string) => {
      if (!activeFrame) return;
      const t = toolRef.current;
      const c = colorRef.current;
      const br = brushRef.current;
      const maxR = Math.max(1, br.maxSize || penSizeRef.current);
      const minR = Math.max(1, Math.min(br.minSize, maxR));
      // Mouse → full width; stylus → live pressure (unless size-from-pressure off)
      const sizeP = br.sizeFromPressure
        ? pointerType === "mouse"
          ? 1
          : pressure
        : 1;
      const opacMul = br.opacityFromPressure
        ? pointerType === "mouse"
          ? 1
          : Math.max(0.05, pressure)
        : 1;

      switch (t) {
        case "pen":
          stampFramePressurePen(activeFrame, fx, fy, c, sizeP, maxR);
          break;
        case "paint":
          stampFrameSoftPaint(activeFrame, fx, fy, c, {
            pressure: sizeP,
            maxRadius: maxR,
            minRadius: minR,
            curve: br.curve,
            opacity: br.opacity * opacMul,
            opacityFromPressure: false,
            softness: br.softness,
            scatter: br.scatter,
            antialias: br.antialias,
            indexedPalette: br.indexedPalette,
          });
          break;
        case "harsh":
          stampFrameHarsh(activeFrame, fx, fy, c, sizeP, maxR);
          break;
        case "dither":
          stampFrameDither(
            activeFrame,
            fx,
            fy,
            c,
            sizeP,
            maxR,
            ditherOxRef.current,
            ditherOyRef.current,
            ditherPatternRef.current,
          );
          break;
        case "eraser":
          stampFrameEraserDisk(activeFrame, fx, fy, sizeP, maxR);
          break;
        default:
          break;
      }
    },
    [activeFrame],
  );

  const applyTool = useCallback(
    (px: number, py: number, isStart: boolean, pressure: number, pointerType = "mouse") => {
      if (playing) return;
      if (!activeFrame) return;

      const t = toolRef.current;
      const freehand =
        t === "pen" || t === "paint" || t === "harsh" || t === "dither" || t === "eraser";

      if (freehand) {
        if (isStart) onStrokeBegin?.();
        const last = lastPixelRef.current;
        if (!last || isStart) {
          applyFreehandStamp(px, py, pressure, pointerType);
        } else {
          // Soft paint: denser sampling for smooth feathers
          const step = t === "paint" ? 0.5 : 1;
          const dx = px - last.x;
          const dy = py - last.y;
          const dist = Math.hypot(dx, dy);
          const n = Math.max(1, Math.ceil(dist / step));
          for (let i = 0; i <= n; i++) {
            const u = i / n;
            applyFreehandStamp(last.x + dx * u, last.y + dy * u, pressure, pointerType);
          }
        }
        lastPixelRef.current = { x: px, y: py };
        // Live paint: fast composite blit (not per-pixel fillRect)
        render();
        return;
      }

      const ix = Math.floor(px);
      const iy = Math.floor(py);
      if (ix < 0 || ix >= width || iy < 0 || iy >= height) return;

      switch (t) {
        case "fill": {
          if (isStart) {
            floodFill(activeFrame, ix, iy, colorRef.current);
            onPixelsChanged();
          }
          break;
        }
        case "picker": {
          if (isStart) {
            const pickedColor = getPixel(activeFrame, ix, iy);
            if (pickedColor !== 0) onColorPicked(pickedColor);
          }
          break;
        }
        case "line": {
          if (isStart) {
            shapeStartRef.current = [ix, iy];
          } else if (shapeStartRef.current) {
            const [sx, sy] = shapeStartRef.current;
            overlayRef.current = getLinePixels(sx, sy, ix, iy).map(([x, y]) => [
              x,
              y,
              colorRef.current,
            ]);
          }
          render();
          break;
        }
        case "rect": {
          if (isStart) {
            shapeStartRef.current = [ix, iy];
          } else if (shapeStartRef.current) {
            const [sx, sy] = shapeStartRef.current;
            overlayRef.current = getRectPixels(sx, sy, ix, iy).map(([x, y]) => [
              x,
              y,
              colorRef.current,
            ]);
          }
          render();
          break;
        }
      }
    },
    [
      activeFrame,
      width,
      height,
      onPixelsChanged,
      onStrokeBegin,
      onColorPicked,
      render,
      playing,
      applyFreehandStamp,
    ],
  );

  const commitShape = useCallback(
    (px: number, py: number) => {
      if (!activeFrame || !shapeStartRef.current) return;
      const [sx, sy] = shapeStartRef.current;

      let pixels: [number, number][] = [];
      if (tool === "line") pixels = getLinePixels(sx, sy, px, py);
      if (tool === "rect") pixels = getRectPixels(sx, sy, px, py);

      for (const [x, y] of pixels) setPixel(activeFrame, x, y, color);
      overlayRef.current = [];
      shapeStartRef.current = null;
      onPixelsChanged();
    },
    [activeFrame, tool, color, onPixelsChanged],
  );

  const endStroke = useCallback(
    (clientX: number, clientY: number) => {
      if (!drawingRef.current) return;
      drawingRef.current = false;
      activePointerIdRef.current = null;
      const t = toolRef.current;
      if (t === "line" || t === "rect") {
        const [px, py] = screenToPixel(clientX, clientY);
        commitShape(px, py);
      } else if (
        t === "pen" ||
        t === "paint" ||
        t === "harsh" ||
        t === "dither" ||
        t === "eraser"
      ) {
        onStrokeEnd?.();
      }
      lastPixelRef.current = null;
      render();
    },
    [screenToPixel, commitShape, render, onStrokeEnd],
  );

  const handlePointerDown = useCallback(
    (e: React.PointerEvent) => {
      if (playing) return;
      if (vpDown(e)) {
        // Multi-touch / pan / rotate — cancel any in-progress stroke
        if (drawingRef.current) {
          drawingRef.current = false;
          activePointerIdRef.current = null;
          lastPixelRef.current = null;
          onStrokeEnd?.();
        }
        return;
      }
      if (e.button !== 0 && e.pointerType === "mouse") return;
      if (drawingRef.current) return;

      e.preventDefault();
      const canvas = canvasRef.current;
      if (canvas) {
        try {
          canvas.setPointerCapture(e.pointerId);
        } catch {
          // ignore
        }
      }

      activePointerIdRef.current = e.pointerId;
      drawingRef.current = true;
      lastPixelRef.current = null;
      const pressure = normalizePressure(e.pressure, e.pointerType, e.buttons);
      const [px, py] = screenToFloatPixel(e.clientX, e.clientY);
      applyTool(px, py, true, pressure, e.pointerType);
    },
    [screenToFloatPixel, applyTool, playing, vpDown, onStrokeEnd],
  );

  const handlePointerMove = useCallback(
    (e: React.PointerEvent) => {
      if (vpMove(e)) {
        // Multi-touch mid-stroke: stop drawing
        if (drawingRef.current) {
          drawingRef.current = false;
          activePointerIdRef.current = null;
          lastPixelRef.current = null;
        }
        return;
      }
      if (!drawingRef.current) return;
      if (activePointerIdRef.current !== null && e.pointerId !== activePointerIdRef.current) return;

      e.preventDefault();
      const pressure = normalizePressure(e.pressure, e.pointerType, e.buttons);
      const [px, py] = screenToFloatPixel(e.clientX, e.clientY);
      applyTool(px, py, false, pressure, e.pointerType);
    },
    [screenToFloatPixel, applyTool, vpMove],
  );

  const handlePointerUp = useCallback(
    (e: React.PointerEvent) => {
      vpUp(e);
      if (activePointerIdRef.current !== null && e.pointerId !== activePointerIdRef.current) return;
      e.preventDefault();
      const canvas = canvasRef.current;
      if (canvas && activePointerIdRef.current !== null) {
        try {
          canvas.releasePointerCapture(e.pointerId);
        } catch {
          // ignore
        }
      }
      if (drawingRef.current) endStroke(e.clientX, e.clientY);
    },
    [endStroke, vpUp],
  );

  const handlePointerCancel = useCallback(
    (e: React.PointerEvent) => {
      vpUp(e);
      if (activePointerIdRef.current !== null && e.pointerId !== activePointerIdRef.current) return;
      drawingRef.current = false;
      activePointerIdRef.current = null;
      overlayRef.current = [];
      lastPixelRef.current = null;
      shapeStartRef.current = null;
      render();
    },
    [render, vpUp],
  );

  const handleWheel = useCallback(
    (e: React.WheelEvent) => {
      e.preventDefault();
      // Desktop mouse / trackpad: scroll = zoom in/out (pixel zoom)
      const dy = e.deltaY;
      if (Math.abs(dy) < 40) {
        // trackpad — also nudge camera for fine control
        camWheelZoom(e);
      }
      const step = Math.max(1, Math.floor(zoom / 4));
      const delta = dy > 0 ? -step : step;
      const newZoom = Math.max(1, Math.min(64, zoom + delta));
      onZoomChange(newZoom);
    },
    [zoom, onZoomChange, camWheelZoom],
  );

  const zoomInBtn = useCallback(() => {
    onZoomChange(Math.min(64, zoom + Math.max(1, Math.floor(zoom / 4))));
  }, [zoom, onZoomChange]);

  const zoomOutBtn = useCallback(() => {
    onZoomChange(Math.max(1, zoom - Math.max(1, Math.floor(zoom / 4))));
  }, [zoom, onZoomChange]);

  const zoomResetBtn = useCallback(() => {
    onZoomChange(12);
    resetViewport();
  }, [onZoomChange, resetViewport]);

  const zBtn: React.CSSProperties = {
    width: 28,
    height: 24,
    border: "1px solid #555",
    background: "#000",
    color: "#ccc",
    fontFamily: "var(--dm-font-primary), monospace",
    fontSize: 12,
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    touchAction: "manipulation",
  };

  return (
    <div
      ref={containerRef}
      className="relative w-full h-full overflow-hidden"
      style={{
        backgroundColor: "#0a0a0a",
        cursor: playing ? "default" : spaceDownRef.current ? "grab" : "crosshair",
      }}
    >
      <canvas
        ref={canvasRef}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerCancel}
        onWheel={handleWheel}
        style={{
          imageRendering: "pixelated",
          touchAction: "none",
          width: "100%",
          height: "100%",
          display: "block",
          border: "none",
          padding: 0,
          margin: 0,
          // Pan + rotate (zoom is CSS size via drawZoom / parent). Pen map inverse-rotates.
          transform: `translate(${viewport.panX}px, ${viewport.panY}px) rotate(${viewport.rotation}deg)`,
          transformOrigin: "center center",
        }}
      />
      {/* Desktop zoom cluster */}
      {!playing && (
        <div
          style={{
            position: "absolute",
            top: 8,
            right: 8,
            display: "flex",
            gap: 4,
            zIndex: 20,
          }}
        >
          <button type="button" style={zBtn} onClick={zoomOutBtn} title="Zoom out (scroll)">
            −
          </button>
          <button
            type="button"
            style={{ ...zBtn, width: 40, fontSize: 9 }}
            onClick={zoomResetBtn}
            title="Reset zoom"
          >
            {zoom}×
          </button>
          <button type="button" style={zBtn} onClick={zoomInBtn} title="Zoom in (scroll)">
            +
          </button>
        </div>
      )}
      <div
        style={{
          position: "absolute",
          bottom: 4,
          right: 4,
          fontFamily: "var(--dm-font-primary)",
          fontSize: "8px",
          color: "#555555",
          letterSpacing: "1px",
          pointerEvents: "none",
        }}
      >
        {zoom}X · SCROLL ZOOM
        {playing ? " · PLAY" : onionSkin?.enabled ? " · ONION" : ""}
      </div>
    </div>
  );
}
