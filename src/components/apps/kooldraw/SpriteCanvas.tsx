/*
 *                    ☦
 *            ╔══════════════════╗
 *            ║  KOOLDRAW        ║
 *            ║  SPRITE CANVAS   ║
 *            ╚══════════════════╝
 *
 *   Main drawing canvas with zoom, pan, pixel grid.
 *   Handles mouse/touch input and routes to active tool.
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

interface SpriteCanvasProps {
  layers: SpriteLayer[];
  activeLayerIndex: number;
  activeFrameIndex: number;
  width: number;
  height: number;
  tool: ToolId;
  color: PackedColor;
  penSize: number;
  zoom: number;
  onZoomChange: (zoom: number) => void;
  onPixelsChanged: () => void;
  onColorPicked: (color: PackedColor) => void;
}

const CHECKER_LIGHT = "#2a2a2a";
const CHECKER_DARK = "#1a1a1a";
const GRID_COLOR = "#333333";

export function SpriteCanvas({
  layers,
  activeLayerIndex,
  activeFrameIndex,
  width,
  height,
  tool,
  color,
  penSize,
  zoom,
  onZoomChange,
  onPixelsChanged,
  onColorPicked,
}: SpriteCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const drawingRef = useRef(false);
  const lastPixelRef = useRef<[number, number] | null>(null);
  const shapeStartRef = useRef<[number, number] | null>(null);
  const overlayRef = useRef<[number, number, PackedColor][]>([]);

  const activeLayer = layers[activeLayerIndex];
  const activeFrame = activeLayer?.frames[activeFrameIndex];

  // Convert screen coords to sprite pixel coords
  // Accounts for CSS transforms (body scale) by comparing
  // getBoundingClientRect (screen-space) to canvas pixel dimensions
  const screenToPixel = useCallback(
    (clientX: number, clientY: number): [number, number] => {
      const canvas = canvasRef.current;
      if (!canvas) return [-1, -1];
      const rect = canvas.getBoundingClientRect();
      // Scale factor between CSS-rendered size and canvas internal pixels
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

  // ── RENDER ──
  const render = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const cw = canvas.width;
    const ch = canvas.height;
    ctx.clearRect(0, 0, cw, ch);

    // Checkerboard background for transparency
    const cellSize = Math.max(4, zoom);
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const isLight = (x + y) % 2 === 0;
        ctx.fillStyle = isLight ? CHECKER_LIGHT : CHECKER_DARK;
        ctx.fillRect(offset.x + x * zoom, offset.y + y * zoom, zoom, zoom);
      }
    }

    // Composite all layers
    const composited = compositeFrame(layers, activeFrameIndex, width, height);

    // Draw composited pixels
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const c = composited.pixels[y * width + x];
        if (c === 0) continue;
        const rgba = packedColorToRGBA(c);
        ctx.fillStyle = `rgba(${rgba.r},${rgba.g},${rgba.b},${rgba.a / 255})`;
        ctx.fillRect(offset.x + x * zoom, offset.y + y * zoom, zoom, zoom);
      }
    }

    // Draw overlay (shape preview)
    for (const [ox, oy, oc] of overlayRef.current) {
      if (ox < 0 || ox >= width || oy < 0 || oy >= height) continue;
      const rgba = packedColorToRGBA(oc);
      ctx.fillStyle = `rgba(${rgba.r},${rgba.g},${rgba.b},${rgba.a / 255})`;
      ctx.fillRect(offset.x + ox * zoom, offset.y + oy * zoom, zoom, zoom);
    }

    // Pixel grid (only when zoomed in enough)
    if (zoom >= 6) {
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

    // Canvas border
    ctx.strokeStyle = "#555555";
    ctx.lineWidth = 1;
    ctx.strokeRect(offset.x - 0.5, offset.y - 0.5, width * zoom + 1, height * zoom + 1);
  }, [layers, activeFrameIndex, width, height, zoom, offset]);

  useEffect(() => {
    render();
  }, [render]);

  // Resize canvas to container
  useEffect(() => {
    const container = containerRef.current;
    const canvas = canvasRef.current;
    if (!container || !canvas) return;

    const observer = new ResizeObserver(() => {
      canvas.width = container.clientWidth;
      canvas.height = container.clientHeight;
      // Center the sprite
      setOffset({
        x: Math.floor((canvas.width - width * zoom) / 2),
        y: Math.floor((canvas.height - height * zoom) / 2),
      });
      render();
    });
    observer.observe(container);
    return () => observer.disconnect();
  }, [width, height, zoom, render]);

  // ── TOOL APPLICATION ──
  const applyTool = useCallback(
    (px: number, py: number, isStart: boolean) => {
      if (!activeFrame) return;
      if (px < 0 || px >= width || py < 0 || py >= height) return;

      switch (tool) {
        case "pen": {
          const pixels = getPenPixels(px, py, penSize);
          for (const [x, y] of pixels) setPixel(activeFrame, x, y, color);
          // Interpolate from last position
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
    [activeFrame, tool, color, penSize, width, height, onPixelsChanged, onColorPicked, render],
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

  // ── MOUSE HANDLERS ──
  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      if (e.button === 1) return; // middle-click for pan (handled separately)
      const [px, py] = screenToPixel(e.clientX, e.clientY);
      drawingRef.current = true;
      lastPixelRef.current = null;
      applyTool(px, py, true);
    },
    [screenToPixel, applyTool],
  );

  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      if (!drawingRef.current) return;
      const [px, py] = screenToPixel(e.clientX, e.clientY);
      applyTool(px, py, false);
    },
    [screenToPixel, applyTool],
  );

  const handleMouseUp = useCallback(
    (e: React.MouseEvent) => {
      if (!drawingRef.current) return;
      drawingRef.current = false;
      if (tool === "line" || tool === "rect") {
        const [px, py] = screenToPixel(e.clientX, e.clientY);
        commitShape(px, py);
      }
      lastPixelRef.current = null;
      render();
    },
    [tool, screenToPixel, commitShape, render],
  );

  // Zoom with wheel
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
      style={{ backgroundColor: "#0a0a0a", cursor: "crosshair" }}
    >
      <canvas
        ref={canvasRef}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={() => {
          if (drawingRef.current) {
            drawingRef.current = false;
            overlayRef.current = [];
            lastPixelRef.current = null;
          }
        }}
        onWheel={handleWheel}
        style={{ imageRendering: "pixelated" }}
      />
      {/* Zoom indicator */}
      <div
        style={{
          position: "absolute",
          bottom: 4,
          right: 4,
          fontFamily: "var(--dm-font-primary)",
          fontSize: "8px",
          color: "#555555",
          letterSpacing: "1px",
        }}
      >
        {zoom}X
      </div>
    </div>
  );
}
