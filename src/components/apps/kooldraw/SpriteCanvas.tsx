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
 *   Supports onion skinning (previous = purple, next = green).
 *   Supports playback displayFrameIndex for main-canvas animation preview.
 */

"use client";

import React, { useRef, useEffect, useCallback, useState } from "react";
import type { SpriteFrame, SpriteLayer, ToolId, PackedColor } from "@/types/sprite";
import {
  getPixel,
  setPixel,
  getLinePixels,
  getRectPixels,
  getFilledRectPixels,
  floodFill,
  getPenPixels,
  compositeFrame,
  packedColorToRGBA,
  cloneFrame,
  TRANSPARENT,
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
  zoom: number;
  onZoomChange: (zoom: number) => void;
  onPixelsChanged: () => void;
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
  zoom,
  onZoomChange,
  onPixelsChanged,
  onColorPicked,
  onionSkin,
}: SpriteCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const drawingRef = useRef(false);
  const lastPixelRef = useRef<[number, number] | null>(null);
  const shapeStartRef = useRef<[number, number] | null>(null);
  const overlayRef = useRef<[number, number, PackedColor][]>([]);
  const activePointerIdRef = useRef<number | null>(null);

  const viewFrameIndex = displayFrameIndex ?? activeFrameIndex;
  const activeLayer = layers[activeLayerIndex];
  const activeFrame = activeLayer?.frames[activeFrameIndex];

  const screenToPixel = useCallback(
    (clientX: number, clientY: number): [number, number] => {
      const canvas = canvasRef.current;
      if (!canvas) return [-1, -1];
      const rect = canvas.getBoundingClientRect();
      const scaleX = canvas.width / rect.width;
      const scaleY = canvas.height / rect.height;
      const sx = (clientX - rect.left) * scaleX;
      const sy = (clientY - rect.top) * scaleY;
      const px = Math.floor((sx - offset.x) / zoom);
      const py = Math.floor((sy - offset.y) / zoom);
      return [px, py];
    },
    [zoom, offset],
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

  const applyTool = useCallback(
    (px: number, py: number, isStart: boolean) => {
      if (playing) return;
      if (!activeFrame) return;
      if (px < 0 || px >= width || py < 0 || py >= height) return;

      switch (tool) {
        case "pen": {
          const pixels = getPenPixels(px, py, penSize);
          for (const [x, y] of pixels) setPixel(activeFrame, x, y, color);
          if (!isStart && lastPixelRef.current) {
            const [lx, ly] = lastPixelRef.current;
            const linePixels = getLinePixels(lx, ly, px, py);
            for (const [lxp, lyp] of linePixels) {
              const penPx = getPenPixels(lxp, lyp, penSize);
              for (const [x, y] of penPx) setPixel(activeFrame, x, y, color);
            }
          }
          lastPixelRef.current = [px, py];
          onPixelsChanged();
          break;
        }
        case "eraser": {
          const pixels = getPenPixels(px, py, penSize);
          for (const [x, y] of pixels) setPixel(activeFrame, x, y, TRANSPARENT);
          if (!isStart && lastPixelRef.current) {
            const [lx, ly] = lastPixelRef.current;
            const linePixels = getLinePixels(lx, ly, px, py);
            for (const [lxp, lyp] of linePixels) {
              const penPx = getPenPixels(lxp, lyp, penSize);
              for (const [x, y] of penPx) setPixel(activeFrame, x, y, TRANSPARENT);
            }
          }
          lastPixelRef.current = [px, py];
          onPixelsChanged();
          break;
        }
        case "fill": {
          if (isStart) {
            floodFill(activeFrame, px, py, color);
            onPixelsChanged();
          }
          break;
        }
        case "picker": {
          if (isStart) {
            const pickedColor = getPixel(activeFrame, px, py);
            if (pickedColor !== 0) onColorPicked(pickedColor);
          }
          break;
        }
        case "line": {
          if (isStart) {
            shapeStartRef.current = [px, py];
          } else if (shapeStartRef.current) {
            const [sx, sy] = shapeStartRef.current;
            overlayRef.current = getLinePixels(sx, sy, px, py).map(([x, y]) => [x, y, color]);
          }
          render();
          break;
        }
        case "rect": {
          if (isStart) {
            shapeStartRef.current = [px, py];
          } else if (shapeStartRef.current) {
            const [sx, sy] = shapeStartRef.current;
            overlayRef.current = getRectPixels(sx, sy, px, py).map(([x, y]) => [x, y, color]);
          }
          render();
          break;
        }
      }
    },
    [activeFrame, tool, color, penSize, width, height, onPixelsChanged, onColorPicked, render, playing],
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
      if (tool === "line" || tool === "rect") {
        const [px, py] = screenToPixel(clientX, clientY);
        commitShape(px, py);
      }
      lastPixelRef.current = null;
      render();
    },
    [tool, screenToPixel, commitShape, render],
  );

  const handlePointerDown = useCallback(
    (e: React.PointerEvent) => {
      if (playing) return;
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
      const [px, py] = screenToPixel(e.clientX, e.clientY);
      applyTool(px, py, true);
    },
    [screenToPixel, applyTool, playing],
  );

  const handlePointerMove = useCallback(
    (e: React.PointerEvent) => {
      if (!drawingRef.current) return;
      if (activePointerIdRef.current !== null && e.pointerId !== activePointerIdRef.current) return;

      e.preventDefault();
      const [px, py] = screenToPixel(e.clientX, e.clientY);
      applyTool(px, py, false);
    },
    [screenToPixel, applyTool],
  );

  const handlePointerUp = useCallback(
    (e: React.PointerEvent) => {
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
      endStroke(e.clientX, e.clientY);
    },
    [endStroke],
  );

  const handlePointerCancel = useCallback(
    (e: React.PointerEvent) => {
      if (activePointerIdRef.current !== null && e.pointerId !== activePointerIdRef.current) return;
      drawingRef.current = false;
      activePointerIdRef.current = null;
      overlayRef.current = [];
      lastPixelRef.current = null;
      shapeStartRef.current = null;
      render();
    },
    [render],
  );

  const handleWheel = useCallback(
    (e: React.WheelEvent) => {
      e.preventDefault();
      const delta = e.deltaY > 0 ? -1 : 1;
      const newZoom = Math.max(1, Math.min(64, zoom + delta * Math.max(1, Math.floor(zoom / 4))));
      onZoomChange(newZoom);
    },
    [zoom, onZoomChange],
  );

  return (
    <div
      ref={containerRef}
      className="relative w-full h-full overflow-hidden"
      style={{ backgroundColor: "#0a0a0a", cursor: playing ? "default" : "crosshair" }}
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
        {zoom}X
        {playing ? " · PLAY" : onionSkin?.enabled ? " · ONION" : ""}
      </div>
    </div>
  );
}
