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
 *   Viewport: space-pan, shift/ctrl rotate, pinch zoom+rot, 2-finger undo.
 *   Supports onion skinning (previous = purple, next = green).
 *   Supports playback displayFrameIndex for main-canvas animation preview.
 */

"use client";

import React, { useRef, useEffect, useCallback, useState } from "react";
import type { SpriteLayer, ToolId, PackedColor } from "@/types/sprite";
import { useCanvasViewport } from "@/lib/creative";
import {
  getPixel,
  setPixel,
  getLinePixels,
  getRectPixels,
  floodFill,
  compositeFrame,
  packedColorToRGBA,
  forEachStrokePoint,
  normalizePressure,
  stampFramePressurePen,
  stampFrameHarsh,
  stampFrameDither,
  stampFrameEraserDisk,
} from "@/lib/SpriteUtils";

export interface OnionSkinSettings {
  enabled: boolean;
  /** Opacity for previous frames: index 0 = frame-1, 1 = frame-2, 2 = frame-3 */
  prevOpacities: [number, number, number];
  /** Opacity for next frames: index 0 = frame+1, 1 = frame+2, 2 = frame+3 */
  nextOpacities: [number, number, number];
}

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
  /** Bayer phase X for dither pencil (0–7) */
  ditherOx?: number;
  /** Bayer phase Y for dither pencil (0–7) */
  ditherOy?: number;
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
  onColorPicked: (color: PackedColor) => void;
  onionSkin?: OnionSkinSettings;
}

const CHECKER_LIGHT = "#2a2a2a";
const CHECKER_DARK = "#1a1a1a";
const GRID_COLOR = "#333333";

const ONION_PREV = { r: 180, g: 80, b: 255 };
const ONION_NEXT = { r: 60, g: 220, b: 120 };

function drawOnionFrame(
  ctx: CanvasRenderingContext2D,
  layers: SpriteLayer[],
  frameIndex: number,
  width: number,
  height: number,
  offset: { x: number; y: number },
  zoom: number,
  opacity: number,
  tint: { r: number; g: number; b: number },
) {
  if (opacity <= 0.001) return;
  const frameCount = layers[0]?.frames.length ?? 0;
  if (frameIndex < 0 || frameIndex >= frameCount) return;

  const composited = compositeFrame(layers, frameIndex, width, height);

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const c = composited.pixels[y * width + x];
      if (c === 0) continue;
      const rgba = packedColorToRGBA(c);
      if (rgba.a === 0) continue;

      const lum = (rgba.r * 0.299 + rgba.g * 0.587 + rgba.b * 0.114) / 255;
      const r = Math.round(tint.r * (0.35 + lum * 0.65));
      const g = Math.round(tint.g * (0.35 + lum * 0.65));
      const b = Math.round(tint.b * (0.35 + lum * 0.65));
      const a = (rgba.a / 255) * opacity;

      ctx.fillStyle = `rgba(${r},${g},${b},${a})`;
      ctx.fillRect(offset.x + x * zoom, offset.y + y * zoom, zoom, zoom);
    }
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
  ditherOx = 0,
  ditherOy = 0,
  zoom,
  onZoomChange,
  onPixelsChanged,
  onStrokeBegin,
  onStrokeEnd,
  onUndo,
  onColorPicked,
  onionSkin,
}: SpriteCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const drawingRef = useRef(false);

  const {
    viewport,
    transformStyle,
    onPointerDown: vpDown,
    onPointerMove: vpMove,
    onPointerUp: vpUp,
    spaceDownRef,
    setZoom: setCamZoom,
  } = useCanvasViewport({
    onUndo,
    minZoom: 0.35,
    maxZoom: 4,
    enabled: !playing,
  });
  /** Sub-pixel stroke continuity for freehand tools */
  const lastPixelRef = useRef<{ x: number; y: number } | null>(null);
  const shapeStartRef = useRef<[number, number] | null>(null);
  const overlayRef = useRef<[number, number, PackedColor][]>([]);
  const activePointerIdRef = useRef<number | null>(null);
  const toolRef = useRef(tool);
  const colorRef = useRef(color);
  const penSizeRef = useRef(penSize);
  const ditherOxRef = useRef(ditherOx);
  const ditherOyRef = useRef(ditherOy);
  toolRef.current = tool;
  colorRef.current = color;
  penSizeRef.current = penSize;
  ditherOxRef.current = ditherOx;
  ditherOyRef.current = ditherOy;

  const viewFrameIndex = displayFrameIndex ?? activeFrameIndex;
  const activeLayer = layers[activeLayerIndex];
  const activeFrame = activeLayer?.frames[activeFrameIndex];

  /** Sub-pixel coords for smooth freehand stamping (inverse camera + pixel zoom). */
  const screenToFloatPixel = useCallback(
    (clientX: number, clientY: number): [number, number] => {
      const canvas = canvasRef.current;
      if (!canvas) return [-1, -1];
      const rect = canvas.getBoundingClientRect();
      // Center of transformed canvas
      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height / 2;
      let dx = clientX - cx;
      let dy = clientY - cy;
      const rad = (-viewport.rotation * Math.PI) / 180;
      const cos = Math.cos(rad);
      const sin = Math.sin(rad);
      dx /= viewport.zoom || 1;
      dy /= viewport.zoom || 1;
      const rx = dx * cos - dy * sin;
      const ry = dx * sin + dy * cos;
      // Map from CSS px (post-layout, un-camera) into canvas backing store
      // rect size includes CSS transform; use canvas CSS size ≈ offsetWidth
      const dispW = canvas.offsetWidth || rect.width / (viewport.zoom || 1);
      const dispH = canvas.offsetHeight || rect.height / (viewport.zoom || 1);
      const sx = (dispW / 2 + rx) * (canvas.width / dispW);
      const sy = (dispH / 2 + ry) * (canvas.height / dispH);
      const px = (sx - offset.x) / zoom;
      const py = (sy - offset.y) / zoom;
      return [px, py];
    },
    [zoom, offset, viewport.rotation, viewport.zoom],
  );

  /** Integer pixel coords (shapes / fill / picker). */
  const screenToPixel = useCallback(
    (clientX: number, clientY: number): [number, number] => {
      const [fx, fy] = screenToFloatPixel(clientX, clientY);
      return [Math.floor(fx), Math.floor(fy)];
    },
    [screenToFloatPixel],
  );

  const render = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const cw = canvas.width;
    const ch = canvas.height;
    ctx.clearRect(0, 0, cw, ch);

    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const isLight = (x + y) % 2 === 0;
        ctx.fillStyle = isLight ? CHECKER_LIGHT : CHECKER_DARK;
        ctx.fillRect(offset.x + x * zoom, offset.y + y * zoom, zoom, zoom);
      }
    }

    // Onion only when not playing and enabled
    if (onionSkin?.enabled && !playing) {
      for (let d = 3; d >= 1; d--) {
        const fi = viewFrameIndex - d;
        const op = onionSkin.prevOpacities[d - 1] ?? 0;
        drawOnionFrame(ctx, layers, fi, width, height, offset, zoom, op, ONION_PREV);
      }
      for (let d = 3; d >= 1; d--) {
        const fi = viewFrameIndex + d;
        const op = onionSkin.nextOpacities[d - 1] ?? 0;
        drawOnionFrame(ctx, layers, fi, width, height, offset, zoom, op, ONION_NEXT);
      }
    }

    const composited = compositeFrame(layers, viewFrameIndex, width, height);

    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const c = composited.pixels[y * width + x];
        if (c === 0) continue;
        const rgba = packedColorToRGBA(c);
        ctx.fillStyle = `rgba(${rgba.r},${rgba.g},${rgba.b},${rgba.a / 255})`;
        ctx.fillRect(offset.x + x * zoom, offset.y + y * zoom, zoom, zoom);
      }
    }

    if (!playing) {
      for (const [ox, oy, oc] of overlayRef.current) {
        if (ox < 0 || ox >= width || oy < 0 || oy >= height) continue;
        const rgba = packedColorToRGBA(oc);
        ctx.fillStyle = `rgba(${rgba.r},${rgba.g},${rgba.b},${rgba.a / 255})`;
        ctx.fillRect(offset.x + ox * zoom, offset.y + oy * zoom, zoom, zoom);
      }
    }

    if (zoom >= 6 && !playing) {
      ctx.strokeStyle = GRID_COLOR;
      ctx.lineWidth = 1;
      ctx.beginPath();
      for (let x = 0; x <= width; x++) {
        const px = offset.x + x * zoom + 0.5;
        ctx.moveTo(px, offset.y);
        ctx.lineTo(px, offset.y + height * zoom);
      }
      for (let y = 0; y <= height; y++) {
        const py = offset.y + y * zoom + 0.5;
        ctx.moveTo(offset.x, py);
        ctx.lineTo(offset.x + width * zoom, py);
      }
      ctx.stroke();
    }

    ctx.strokeStyle = "#555555";
    ctx.lineWidth = 1;
    ctx.strokeRect(offset.x - 0.5, offset.y - 0.5, width * zoom + 1, height * zoom + 1);
  }, [layers, viewFrameIndex, width, height, zoom, offset, onionSkin, playing]);

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
        x: Math.floor((canvas.width - width * zoom) / 2),
        y: Math.floor((canvas.height - height * zoom) / 2),
      });
      render();
    });
    observer.observe(container);
    return () => observer.disconnect();
  }, [width, height, zoom, render]);

  const applyFreehandStamp = useCallback(
    (fx: number, fy: number, pressure: number) => {
      if (!activeFrame) return;
      const t = toolRef.current;
      const c = colorRef.current;
      const maxR = Math.max(1, penSizeRef.current);
      switch (t) {
        case "pen":
          stampFramePressurePen(activeFrame, fx, fy, c, pressure, maxR);
          break;
        case "harsh":
          stampFrameHarsh(activeFrame, fx, fy, c, pressure, maxR);
          break;
        case "dither":
          stampFrameDither(
            activeFrame,
            fx,
            fy,
            c,
            pressure,
            maxR,
            ditherOxRef.current,
            ditherOyRef.current,
          );
          break;
        case "eraser":
          stampFrameEraserDisk(activeFrame, fx, fy, pressure, maxR);
          break;
        default:
          break;
      }
    },
    [activeFrame],
  );

  const applyTool = useCallback(
    (px: number, py: number, isStart: boolean, pressure: number) => {
      if (playing) return;
      if (!activeFrame) return;

      const t = toolRef.current;
      const freehand = t === "pen" || t === "harsh" || t === "dither" || t === "eraser";

      if (freehand) {
        if (isStart) onStrokeBegin?.();
        const last = lastPixelRef.current;
        if (!last || isStart) {
          applyFreehandStamp(px, py, pressure);
        } else {
          forEachStrokePoint(last.x, last.y, px, py, (x, y) => {
            applyFreehandStamp(x, y, pressure);
          });
        }
        lastPixelRef.current = { x: px, y: py };
        // Live paint: re-composite only. Undo snapshot was taken at stroke begin.
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
      } else if (t === "pen" || t === "harsh" || t === "dither" || t === "eraser") {
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
        drawingRef.current = false;
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
      applyTool(px, py, true, pressure);
    },
    [screenToFloatPixel, applyTool, playing, vpDown],
  );

  const handlePointerMove = useCallback(
    (e: React.PointerEvent) => {
      if (vpMove(e)) return;
      if (!drawingRef.current) return;
      if (activePointerIdRef.current !== null && e.pointerId !== activePointerIdRef.current) return;

      e.preventDefault();
      const pressure = normalizePressure(e.pressure, e.pointerType, e.buttons);
      const [px, py] = screenToFloatPixel(e.clientX, e.clientY);
      applyTool(px, py, false, pressure);
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
      if (e.ctrlKey || e.metaKey) {
        // Camera zoom
        const factor = e.deltaY > 0 ? 0.9 : 1.1;
        setCamZoom(viewport.zoom * factor);
        return;
      }
      const delta = e.deltaY > 0 ? -1 : 1;
      const newZoom = Math.max(1, Math.min(64, zoom + delta * Math.max(1, Math.floor(zoom / 4))));
      onZoomChange(newZoom);
    },
    [zoom, onZoomChange, setCamZoom, viewport.zoom],
  );

  // Pinch camera zoom also nudges pixel zoom slightly when cam hits limits — optional skip

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
          transform: transformStyle,
          transformOrigin: "center center",
        }}
      />
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
        {zoom}X · cam{viewport.zoom.toFixed(2)} · r{Math.round(viewport.rotation)}°
        {playing ? " · PLAY" : onionSkin?.enabled ? " · ONION" : ""}
      </div>
    </div>
  );
}
