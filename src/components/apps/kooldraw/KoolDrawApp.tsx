/*
 *                    ☦
 *            ╔══════════════════╗
 *            ║  KOOLDRAW        ║
 *            ║  SPRITE EDITOR   ║
 *            ╚══════════════════╝
 *
 *   Pixel art sprite and animation editor.
 *   Piskel-inspired, K-OS III aesthetic.
 *
 *   Tools: Pen, Eraser, Fill, Picker, Line, Rect
 *   Features: Layers, Frames, Animation Preview, Undo/Redo
 *   Export: PNG sequence (zip), Sprite sheet, GIF
 */

"use client";

import React, { useState, useCallback, useRef, useEffect } from "react";
import type { SpriteProject, SpriteLayer, ToolId, PackedColor, HistoryEntry } from "@/types/sprite";
import {
  createBlankSprite,
  createFrame,
  cloneFrame,
  nextSpriteId,
  hexToPackedColor,
  packedColorToHex,
  compositeFrame,
  frameToCanvas,
  renderSpriteSheet,
  downloadCanvasAsPng,
  downloadFramesAsZip,
  TRANSPARENT,
} from "@/lib/SpriteUtils";
import { SpriteCanvas } from "./SpriteCanvas";

interface KoolDrawAppProps {
  isFocused: boolean;
}

const TOOLS: { id: ToolId; label: string; key: string }[] = [
  { id: "pen", label: "PEN", key: "B" },
  { id: "eraser", label: "ERA", key: "E" },
  { id: "fill", label: "FIL", key: "G" },
  { id: "picker", label: "PKR", key: "I" },
  { id: "line", label: "LIN", key: "L" },
  { id: "rect", label: "RCT", key: "R" },
];

const MAX_HISTORY = 100;

export function KoolDrawApp({ isFocused }: KoolDrawAppProps) {
  const [project, setProject] = useState<SpriteProject>(() => createBlankSprite("SPRITE", 32, 32));
  const [activeTool, setActiveTool] = useState<ToolId>("pen");
  const [primaryColor, setPrimaryColor] = useState<PackedColor>(hexToPackedColor("#ffffff"));
  const [penSize, setPenSize] = useState(1);
  const [zoom, setZoom] = useState(12);
  const [activeFrameIndex, setActiveFrameIndex] = useState(0);
  const [activeLayerIndex, setActiveLayerIndex] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [previewFrame, setPreviewFrame] = useState(0);
  const [renderTick, setRenderTick] = useState(0);

  // History
  const historyRef = useRef<HistoryEntry[]>([]);
  const historyIndexRef = useRef(-1);

  const forceRender = useCallback(() => setRenderTick((t) => t + 1), []);

  // ── HISTORY ──
  const saveHistory = useCallback(() => {
    const entry: HistoryEntry = {
      layerSnapshots: project.layers.flatMap((layer) =>
        layer.frames.map((frame, fi) => ({
          layerId: layer.id,
          frameIndex: fi,
          pixels: new Uint32Array(frame.pixels),
        })),
      ),
      activeFrameIndex,
      activeLayerIndex,
    };
    // Truncate forward history
    historyRef.current = historyRef.current.slice(0, historyIndexRef.current + 1);
    historyRef.current.push(entry);
    if (historyRef.current.length > MAX_HISTORY) historyRef.current.shift();
    historyIndexRef.current = historyRef.current.length - 1;
  }, [project, activeFrameIndex, activeLayerIndex]);

  const undo = useCallback(() => {
    if (historyIndexRef.current <= 0) return;
    historyIndexRef.current--;
    const entry = historyRef.current[historyIndexRef.current];
    if (!entry) return;
    setProject((prev) => {
      const layers = prev.layers.map((layer) => ({
        ...layer,
        frames: layer.frames.map((frame, fi) => {
          const snap = entry.layerSnapshots.find((s) => s.layerId === layer.id && s.frameIndex === fi);
          if (snap) return { ...frame, pixels: new Uint32Array(snap.pixels) };
          return frame;
        }),
      }));
      return { ...prev, layers };
    });
    setActiveFrameIndex(entry.activeFrameIndex);
    setActiveLayerIndex(entry.activeLayerIndex);
    forceRender();
  }, [forceRender]);

  const redo = useCallback(() => {
    if (historyIndexRef.current >= historyRef.current.length - 1) return;
    historyIndexRef.current++;
    const entry = historyRef.current[historyIndexRef.current];
    if (!entry) return;
    setProject((prev) => {
      const layers = prev.layers.map((layer) => ({
        ...layer,
        frames: layer.frames.map((frame, fi) => {
          const snap = entry.layerSnapshots.find((s) => s.layerId === layer.id && s.frameIndex === fi);
          if (snap) return { ...frame, pixels: new Uint32Array(snap.pixels) };
          return frame;
        }),
      }));
      return { ...prev, layers };
    });
    setActiveFrameIndex(entry.activeFrameIndex);
    setActiveLayerIndex(entry.activeLayerIndex);
    forceRender();
  }, [forceRender]);

  const handlePixelsChanged = useCallback(() => {
    saveHistory();
    forceRender();
  }, [saveHistory, forceRender]);

  // ── KEYBOARD SHORTCUTS ──
  useEffect(() => {
    if (!isFocused) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey) {
        if (e.key === "z") { e.preventDefault(); undo(); return; }
        if (e.key === "y") { e.preventDefault(); redo(); return; }
      }
      // Tool shortcuts
      const toolEntry = TOOLS.find((t) => t.key.toLowerCase() === e.key.toLowerCase());
      if (toolEntry) { setActiveTool(toolEntry.id); return; }
      // Pen size
      if (e.key === "[") setPenSize((s) => Math.max(1, s - 1));
      if (e.key === "]") setPenSize((s) => Math.min(16, s + 1));
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isFocused, undo, redo]);

  // ── ANIMATION PLAYBACK ──
  useEffect(() => {
    if (!playing) return;
    const frameCount = project.layers[0]?.frames.length ?? 1;
    const interval = setInterval(() => {
      setPreviewFrame((f) => (f + 1) % frameCount);
    }, 1000 / Math.max(1, project.fps));
    return () => clearInterval(interval);
  }, [playing, project.fps, project.layers]);

  // ── FRAME MANAGEMENT ──
  const addFrame = useCallback(() => {
    saveHistory();
    setProject((prev) => ({
      ...prev,
      layers: prev.layers.map((layer) => ({
        ...layer,
        frames: [...layer.frames, createFrame(nextSpriteId(), prev.width, prev.height)],
      })),
    }));
    setActiveFrameIndex((prev) => prev + 1);
  }, [saveHistory]);

  const duplicateFrame = useCallback(() => {
    saveHistory();
    setProject((prev) => ({
      ...prev,
      layers: prev.layers.map((layer) => {
        const src = layer.frames[activeFrameIndex];
        if (!src) return layer;
        const dup = cloneFrame(src, nextSpriteId());
        const frames = [...layer.frames];
        frames.splice(activeFrameIndex + 1, 0, dup);
        return { ...layer, frames };
      }),
    }));
    setActiveFrameIndex((i) => i + 1);
  }, [activeFrameIndex, saveHistory]);

  const deleteFrame = useCallback(() => {
    const frameCount = project.layers[0]?.frames.length ?? 0;
    if (frameCount <= 1) return;
    saveHistory();
    setProject((prev) => ({
      ...prev,
      layers: prev.layers.map((layer) => ({
        ...layer,
        frames: layer.frames.filter((_, i) => i !== activeFrameIndex),
      })),
    }));
    setActiveFrameIndex((i) => Math.max(0, i - 1));
  }, [activeFrameIndex, project.layers, saveHistory]);

  // ── LAYER MANAGEMENT ──
  const addLayer = useCallback(() => {
    saveHistory();
    const frameCount = project.layers[0]?.frames.length ?? 1;
    const newLayer: SpriteLayer = {
      id: nextSpriteId(),
      name: `LAYER ${project.layers.length + 1}`,
      opacity: 1,
      visible: true,
      frames: Array.from({ length: frameCount }, () => createFrame(nextSpriteId(), project.width, project.height)),
    };
    setProject((prev) => ({ ...prev, layers: [...prev.layers, newLayer] }));
    setActiveLayerIndex(project.layers.length);
  }, [project, saveHistory]);

  const toggleLayerVisibility = useCallback((idx: number) => {
    setProject((prev) => ({
      ...prev,
      layers: prev.layers.map((l, i) => i === idx ? { ...l, visible: !l.visible } : l),
    }));
    forceRender();
  }, [forceRender]);

  // ── EXPORT ──
  const exportSpriteSheet = useCallback(() => {
    const frameCount = project.layers[0]?.frames.length ?? 1;
    const canvas = renderSpriteSheet(project, frameCount, 1);
    downloadCanvasAsPng(canvas, `${project.name}_sheet.png`);
  }, [project]);

  const exportFrames = useCallback(() => {
    downloadFramesAsZip(project, 1);
  }, [project]);

  // ── PALETTE ──
  const handlePaletteClick = useCallback((hex: string) => {
    setPrimaryColor(hexToPackedColor(hex));
  }, []);

  const handleColorPicked = useCallback((c: PackedColor) => {
    setPrimaryColor(c);
  }, []);

  const frameCount = project.layers[0]?.frames.length ?? 1;

  // ── ANIMATION PREVIEW (tiny canvas) ──
  const previewCanvasRef = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const canvas = previewCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const fi = playing ? previewFrame : activeFrameIndex;
    const composited = compositeFrame(project.layers, fi, project.width, project.height);
    const frameCanvas = frameToCanvas(composited, 1);
    canvas.width = project.width;
    canvas.height = project.height;
    ctx.imageSmoothingEnabled = false;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(frameCanvas, 0, 0);
  }, [project, activeFrameIndex, previewFrame, playing, renderTick]);

  return (
    <div
      className="w-full h-full flex flex-col overflow-hidden"
      style={{
        backgroundColor: "#000000",
        fontFamily: "var(--dm-font-primary)",
        fontSize: "9px",
        imageRendering: "pixelated",
        color: "#ffffff",
      }}
    >
      {/* Top bar */}
      <div
        className="flex items-center justify-between px-2 py-0.5 border-b-2 flex-shrink-0"
        style={{ borderColor: "#1a1a1a", minHeight: "20px" }}
      >
        <span style={{ letterSpacing: "2px" }}>SPRITE EDITOR</span>
        <div className="flex gap-2 items-center">
          <span style={{ color: "#888888" }}>{project.width}x{project.height}</span>
          <span style={{ color: "#555555" }}>FRM:{activeFrameIndex + 1}/{frameCount}</span>
          <span style={{ color: "#555555" }}>PEN:{penSize}</span>
        </div>
      </div>

      {/* Main area: toolbar | canvas | sidebar */}
      <div className="flex flex-1 overflow-hidden">
        {/* Tool palette */}
        <div
          className="flex flex-col border-r flex-shrink-0"
          style={{ borderColor: "#1a1a1a", width: "40px" }}
        >
          {TOOLS.map((t) => (
            <button
              key={t.id}
              onClick={() => setActiveTool(t.id)}
              style={{
                height: "32px",
                border: "none",
                borderBottom: "1px solid #1a1a1a",
                backgroundColor: activeTool === t.id ? "#1a1a1a" : "#000000",
                color: activeTool === t.id ? "#ffffff" : "#555555",
                fontFamily: "var(--dm-font-primary)",
                fontSize: "7px",
                letterSpacing: "1px",
                cursor: "pointer",
              }}
              title={`${t.label} (${t.key})`}
            >
              {t.label}
            </button>
          ))}
          {/* Undo/Redo */}
          <div style={{ marginTop: "auto" }}>
            <button
              onClick={undo}
              style={{
                width: "100%", height: "24px", border: "none",
                borderTop: "1px solid #1a1a1a",
                backgroundColor: "#000000", color: "#555555",
                fontFamily: "var(--dm-font-primary)", fontSize: "7px",
                cursor: "pointer",
              }}
            >
              UNDO
            </button>
            <button
              onClick={redo}
              style={{
                width: "100%", height: "24px", border: "none",
                borderTop: "1px solid #1a1a1a",
                backgroundColor: "#000000", color: "#555555",
                fontFamily: "var(--dm-font-primary)", fontSize: "7px",
                cursor: "pointer",
              }}
            >
              REDO
            </button>
          </div>
        </div>

        {/* Canvas */}
        <div className="flex-1 relative overflow-hidden">
          <SpriteCanvas
            layers={project.layers}
            activeLayerIndex={activeLayerIndex}
            activeFrameIndex={activeFrameIndex}
            width={project.width}
            height={project.height}
            tool={activeTool}
            color={primaryColor}
            penSize={penSize}
            zoom={zoom}
            onZoomChange={setZoom}
            onPixelsChanged={handlePixelsChanged}
            onColorPicked={handleColorPicked}
          />
        </div>

        {/* Right sidebar: preview + palette + layers */}
        <div
          className="flex flex-col border-l flex-shrink-0"
          style={{ borderColor: "#1a1a1a", width: "120px" }}
        >
          {/* Preview */}
          <div className="border-b" style={{ borderColor: "#1a1a1a", padding: "4px" }}>
            <div className="flex items-center justify-between mb-1">
              <span style={{ fontSize: "7px", color: "#888888", letterSpacing: "1px" }}>PREVIEW</span>
              <button
                onClick={() => setPlaying((p) => !p)}
                style={{
                  border: "1px solid #555555",
                  backgroundColor: "#000000",
                  color: playing ? "#ffffff" : "#555555",
                  fontFamily: "var(--dm-font-primary)",
                  fontSize: "7px",
                  padding: "1px 4px",
                  cursor: "pointer",
                }}
              >
                {playing ? "STOP" : "PLAY"}
              </button>
            </div>
            <div style={{ display: "flex", justifyContent: "center", backgroundColor: "#0a0a0a", padding: "4px" }}>
              <canvas
                ref={previewCanvasRef}
                style={{
                  width: `${Math.min(96, project.width * 3)}px`,
                  height: `${Math.min(96, project.height * 3)}px`,
                  imageRendering: "pixelated",
                }}
              />
            </div>
            <div className="flex items-center justify-between mt-1">
              <span style={{ fontSize: "7px", color: "#555555" }}>FPS</span>
              <div className="flex gap-1">
                <button
                  onClick={() => setProject((p) => ({ ...p, fps: Math.max(1, p.fps - 1) }))}
                  style={{ border: "1px solid #333", backgroundColor: "#000", color: "#888", fontSize: "7px", cursor: "pointer", padding: "0 3px", fontFamily: "var(--dm-font-primary)" }}
                >
                  -
                </button>
                <span style={{ fontSize: "7px", color: "#888888", minWidth: "16px", textAlign: "center" }}>{project.fps}</span>
                <button
                  onClick={() => setProject((p) => ({ ...p, fps: Math.min(60, p.fps + 1) }))}
                  style={{ border: "1px solid #333", backgroundColor: "#000", color: "#888", fontSize: "7px", cursor: "pointer", padding: "0 3px", fontFamily: "var(--dm-font-primary)" }}
                >
                  +
                </button>
              </div>
            </div>
          </div>

          {/* Color palette */}
          <div className="border-b" style={{ borderColor: "#1a1a1a", padding: "4px" }}>
            <span style={{ fontSize: "7px", color: "#888888", letterSpacing: "1px" }}>COLOR</span>
            {/* Current color */}
            <div
              className="mt-1 mb-1"
              style={{
                width: "100%",
                height: "16px",
                backgroundColor: packedColorToHex(primaryColor),
                border: "1px solid #555555",
              }}
            />
            {/* Palette grid */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(8, 1fr)", gap: "1px" }}>
              {project.palette.map((hex, i) => (
                <div
                  key={i}
                  onClick={() => handlePaletteClick(hex)}
                  style={{
                    width: "100%",
                    aspectRatio: "1",
                    backgroundColor: hex,
                    border: packedColorToHex(primaryColor) === hex ? "1px solid #ffffff" : "1px solid #333333",
                    cursor: "pointer",
                  }}
                />
              ))}
            </div>
          </div>

          {/* Layers */}
          <div className="flex-1 overflow-y-auto" style={{ padding: "4px" }}>
            <div className="flex items-center justify-between mb-1">
              <span style={{ fontSize: "7px", color: "#888888", letterSpacing: "1px" }}>LAYERS</span>
              <button
                onClick={addLayer}
                style={{
                  border: "1px solid #555555",
                  backgroundColor: "#000000",
                  color: "#888888",
                  fontFamily: "var(--dm-font-primary)",
                  fontSize: "7px",
                  padding: "1px 4px",
                  cursor: "pointer",
                }}
              >
                +
              </button>
            </div>
            {project.layers.map((layer, i) => (
              <div
                key={layer.id}
                onClick={() => setActiveLayerIndex(i)}
                style={{
                  padding: "2px 4px",
                  backgroundColor: i === activeLayerIndex ? "#1a1a1a" : "transparent",
                  borderLeft: i === activeLayerIndex ? "2px solid #ffffff" : "2px solid transparent",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  cursor: "pointer",
                  marginBottom: "1px",
                }}
              >
                <span style={{ fontSize: "7px", color: i === activeLayerIndex ? "#ffffff" : "#555555" }}>
                  {layer.name}
                </span>
                <button
                  onClick={(e) => { e.stopPropagation(); toggleLayerVisibility(i); }}
                  style={{
                    border: "none",
                    backgroundColor: "transparent",
                    color: layer.visible ? "#888888" : "#333333",
                    fontFamily: "var(--dm-font-primary)",
                    fontSize: "7px",
                    cursor: "pointer",
                  }}
                >
                  {layer.visible ? "V" : "-"}
                </button>
              </div>
            ))}
          </div>

          {/* Export buttons */}
          <div className="border-t" style={{ borderColor: "#1a1a1a", padding: "4px" }}>
            <span style={{ fontSize: "7px", color: "#888888", letterSpacing: "1px", display: "block", marginBottom: "2px" }}>EXPORT</span>
            <button
              onClick={exportFrames}
              style={{
                width: "100%", height: "20px", border: "1px solid #333333",
                backgroundColor: "#000000", color: "#888888",
                fontFamily: "var(--dm-font-primary)", fontSize: "7px",
                cursor: "pointer", marginBottom: "2px",
              }}
            >
              PNG ZIP
            </button>
            <button
              onClick={exportSpriteSheet}
              style={{
                width: "100%", height: "20px", border: "1px solid #333333",
                backgroundColor: "#000000", color: "#888888",
                fontFamily: "var(--dm-font-primary)", fontSize: "7px",
                cursor: "pointer",
              }}
            >
              SHEET
            </button>
          </div>
        </div>
      </div>

      {/* Frame timeline (bottom) */}
      <div
        className="flex items-center border-t flex-shrink-0 overflow-x-auto"
        style={{ borderColor: "#1a1a1a", minHeight: "48px", padding: "4px" }}
      >
        {Array.from({ length: frameCount }, (_, i) => {
          const composited = compositeFrame(project.layers, i, project.width, project.height);
          return (
            <FrameThumbnail
              key={i}
              frame={composited}
              index={i}
              isActive={i === activeFrameIndex}
              onClick={() => setActiveFrameIndex(i)}
              spriteWidth={project.width}
              spriteHeight={project.height}
            />
          );
        })}
        <div className="flex gap-1 ml-2">
          <button
            onClick={addFrame}
            style={{
              width: "36px", height: "36px",
              border: "1px solid #333333",
              backgroundColor: "#000000", color: "#555555",
              fontFamily: "var(--dm-font-primary)", fontSize: "14px",
              cursor: "pointer",
            }}
          >
            +
          </button>
          <button
            onClick={duplicateFrame}
            style={{
              width: "36px", height: "36px",
              border: "1px solid #333333",
              backgroundColor: "#000000", color: "#555555",
              fontFamily: "var(--dm-font-primary)", fontSize: "7px",
              cursor: "pointer",
            }}
          >
            DUP
          </button>
          {frameCount > 1 && (
            <button
              onClick={deleteFrame}
              style={{
                width: "36px", height: "36px",
                border: "1px solid #333333",
                backgroundColor: "#000000", color: "#555555",
                fontFamily: "var(--dm-font-primary)", fontSize: "7px",
                cursor: "pointer",
              }}
            >
              DEL
            </button>
          )}
        </div>
      </div>

      {/* Bottom status bar */}
      <div
        className="flex items-center justify-between px-2 py-0.5 border-t-2 flex-shrink-0"
        style={{ borderColor: "#1a1a1a", minHeight: "18px" }}
      >
        <span style={{ fontSize: "7px", color: "#555555", letterSpacing: "1px" }}>
          B:PEN E:ERASER G:FILL I:PICK L:LINE R:RECT [/]:SIZE CTRL+Z:UNDO
        </span>
        <span style={{ fontSize: "7px", color: "#555555" }}>☦</span>
      </div>
    </div>
  );
}

// ── FRAME THUMBNAIL ──

function FrameThumbnail({
  frame,
  index,
  isActive,
  onClick,
  spriteWidth,
  spriteHeight,
}: {
  frame: import("@/types/sprite").SpriteFrame;
  index: number;
  isActive: boolean;
  onClick: () => void;
  spriteWidth: number;
  spriteHeight: number;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    canvas.width = spriteWidth;
    canvas.height = spriteHeight;
    ctx.imageSmoothingEnabled = false;
    const src = frameToCanvas(frame, 1);
    ctx.clearRect(0, 0, spriteWidth, spriteHeight);
    ctx.drawImage(src, 0, 0);
  }, [frame, spriteWidth, spriteHeight]);

  return (
    <div
      onClick={onClick}
      style={{
        flexShrink: 0,
        marginRight: "3px",
        cursor: "pointer",
        border: isActive ? "2px solid #ffffff" : "1px solid #333333",
        backgroundColor: "#0a0a0a",
        padding: "2px",
      }}
    >
      <canvas
        ref={canvasRef}
        style={{
          width: "32px",
          height: "32px",
          imageRendering: "pixelated",
          display: "block",
        }}
      />
      <div
        style={{
          fontFamily: "var(--dm-font-primary)",
          fontSize: "6px",
          color: isActive ? "#ffffff" : "#555555",
          textAlign: "center",
          marginTop: "1px",
        }}
      >
        {index + 1}
      </div>
    </div>
  );
}
