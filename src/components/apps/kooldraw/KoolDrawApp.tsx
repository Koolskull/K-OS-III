/*
 * KOOLDRAW SPRITE EDITOR
 * Freehand tools from @/lib/creative tool registry.
 * Cross-app handoffs via CreativeWorkflow (SHOTLIST ↔ etc.).
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
  loadProjectFromDataUrl,
  dataUrlToMonoDataUrl,
} from "@/lib/SpriteUtils";
import { FREEHAND_TOOLS, useCreativeWorkflow } from "@/lib/creative";
import { SpriteCanvas, type OnionSkinSettings } from "./SpriteCanvas";
import {
  CornerHost,
  CornerPanel,
  VerticalChromeToggle,
  CornerDismissLayer,
  useCornerChromeOptional,
} from "@/components/ui/CornerChrome";

export interface KoolDrawEmbeddedMode {
  initialWidth?: number;
  initialHeight?: number;
  onUse: (dataUrl: string) => void;
  onCancel: () => void;
  title?: string;
}

interface KoolDrawAppProps {
  isFocused: boolean;
  embeddedMode?: KoolDrawEmbeddedMode;
}

/** Shape / utility tools (freehand stack comes from modular registry) */
const SHAPE_TOOLS: { id: ToolId; label: string; key: string }[] = [
  { id: "fill", label: "FIL", key: "G" },
  { id: "picker", label: "PKR", key: "I" },
  { id: "line", label: "LIN", key: "L" },
  { id: "rect", label: "RCT", key: "R" },
];

const TOOLS: { id: ToolId; label: string; key: string; title?: string }[] = [
  ...FREEHAND_TOOLS.map((t) => ({
    id: t.id as ToolId,
    label: t.label,
    key: t.key,
    title: t.title,
  })),
  ...SHAPE_TOOLS,
];

const MAX_HISTORY = 100;
const DEFAULT_PREV_OP: [number, number, number] = [0.45, 0.28, 0.14];
const DEFAULT_NEXT_OP: [number, number, number] = [0.45, 0.28, 0.14];

const toolBtn = (active: boolean): React.CSSProperties => ({
  height: 32,
  border: "none",
  borderBottom: "1px solid #1a1a1a",
  backgroundColor: active ? "#1a1a1a" : "#000000",
  color: active ? "#ffffff" : "#555555",
  fontFamily: "var(--dm-font-primary)",
  fontSize: 7,
  letterSpacing: 1,
  cursor: "pointer",
  width: "100%",
});

const mobileOnionBtn = (active: boolean): React.CSSProperties => ({
  width: 44,
  height: 32,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  backgroundColor: active ? "#ffffff" : "#000000",
  color: active ? "#000000" : "#888888",
  border: active ? "1px solid #ffffff" : "1px solid #555555",
  fontFamily: "var(--dm-font-primary)",
  fontSize: 8,
  letterSpacing: 1,
  cursor: "pointer",
  userSelect: "none",
  touchAction: "manipulation",
  imageRendering: "pixelated",
});

const mobileFrameBtn: React.CSSProperties = {
  position: "absolute",
  bottom: 4,
  zIndex: 40,
  width: 36,
  height: 28,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  backgroundColor: "#000000",
  color: "#888888",
  border: "1px solid #555555",
  fontFamily: "var(--dm-font-primary)",
  fontSize: 8,
  letterSpacing: 1,
  cursor: "pointer",
  userSelect: "none",
  touchAction: "manipulation",
  imageRendering: "pixelated",
};

const headerBtn = (active: boolean): React.CSSProperties => ({
  border: active ? "1px solid #ffffff" : "1px solid #555555",
  background: active ? "#ffffff" : "#000000",
  color: active ? "#000000" : "#888888",
  fontFamily: "var(--dm-font-primary)",
  fontSize: 8,
  letterSpacing: 1,
  padding: "2px 8px",
  cursor: "pointer",
  height: 20,
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
});

export function KoolDrawApp({ isFocused, embeddedMode }: KoolDrawAppProps) {
  return (
    <CornerHost storageKey="kos-kooldraw-chrome" style={{ backgroundColor: "#000" }}>
      <KoolDrawInner isFocused={isFocused} embeddedMode={embeddedMode} />
    </CornerHost>
  );
}

function KoolDrawInner({ isFocused, embeddedMode }: KoolDrawAppProps) {
  const chrome = useCornerChromeOptional();
  const isNarrow = chrome?.isNarrow ?? false;
  const uiHidden = chrome?.uiHidden ?? false;
  const collapse = isNarrow || uiHidden;

  const workflow = useCreativeWorkflow();
  const handoff = workflow.sessionFor("kooldraw");

  const [project, setProject] = useState<SpriteProject>(() =>
    createBlankSprite("SPRITE", embeddedMode?.initialWidth ?? 32, embeddedMode?.initialHeight ?? 32),
  );
  const [handoffReady, setHandoffReady] = useState(true);
  const [activeTool, setActiveTool] = useState<ToolId>("pen");
  const [primaryColor, setPrimaryColor] = useState<PackedColor>(hexToPackedColor("#ffffff"));
  const [penSize, setPenSize] = useState(4);
  /** Bayer matrix phase for dither pencil (variable-positioned dither) */
  const [ditherOx, setDitherOx] = useState(0);
  const [ditherOy, setDitherOy] = useState(0);
  const [zoom, setZoom] = useState(12);
  const [activeFrameIndex, setActiveFrameIndex] = useState(0);
  const [activeLayerIndex, setActiveLayerIndex] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [previewFrame, setPreviewFrame] = useState(0);
  const [renderTick, setRenderTick] = useState(0);
  // Onion skin ON by default (mobile + desktop)
  const [onionEnabled, setOnionEnabled] = useState(true);
  const [showOnionOptions, setShowOnionOptions] = useState(false);
  const [prevOpacities, setPrevOpacities] = useState<[number, number, number]>([...DEFAULT_PREV_OP]);
  const [nextOpacities, setNextOpacities] = useState<[number, number, number]>([...DEFAULT_NEXT_OP]);

  const onionSkin: OnionSkinSettings = { enabled: onionEnabled, prevOpacities, nextOpacities };
  const historyRef = useRef<HistoryEntry[]>([]);
  const historyIndexRef = useRef(-1);
  const forceRender = useCallback(() => setRenderTick((t) => t + 1), []);

  /* Load creative-bus handoff into the canvas (SHOTLIST plates, etc.) */
  useEffect(() => {
    if (!handoff || embeddedMode) return;
    let cancelled = false;
    setHandoffReady(false);
    (async () => {
      const proj = await loadProjectFromDataUrl(
        handoff.label || "HANDOFF",
        handoff.width,
        handoff.height,
        handoff.dataUrl,
        { mono: handoff.mono, bg: handoff.bg },
      );
      if (cancelled) return;
      setProject(proj);
      setActiveFrameIndex(0);
      setActiveLayerIndex(0);
      setZoom(
        Math.max(
          1,
          Math.min(16, Math.floor(480 / Math.max(handoff.width, handoff.height))),
        ),
      );
      historyRef.current = [];
      historyIndexRef.current = -1;
      setHandoffReady(true);
      forceRender();
    })();
    return () => {
      cancelled = true;
    };
  }, [handoff?.id, embeddedMode, forceRender, handoff]);

  const exportCurrentDataUrl = useCallback(() => {
    return frameToCanvas(
      compositeFrame(project.layers, activeFrameIndex, project.width, project.height),
      1,
    ).toDataURL("image/png");
  }, [project, activeFrameIndex]);

  const returnHandoff = useCallback(async () => {
    if (!handoff) return;
    let dataUrl = exportCurrentDataUrl();
    if (handoff.mono) {
      dataUrl = await dataUrlToMonoDataUrl(
        dataUrl,
        handoff.width,
        handoff.height,
        handoff.bg ?? "black",
      );
    }
    workflow.complete({
      dataUrl,
      width: project.width,
      height: project.height,
    });
  }, [handoff, exportCurrentDataUrl, project.width, project.height, workflow]);

  const cancelHandoff = useCallback(() => {
    workflow.cancel();
  }, [workflow]);

  const togglePlayback = useCallback(() => {
    setPlaying((p) => {
      if (!p) setPreviewFrame(activeFrameIndex);
      return !p;
    });
  }, [activeFrameIndex]);

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
    setProject((prev) => ({
      ...prev,
      layers: prev.layers.map((layer) => ({
        ...layer,
        frames: layer.frames.map((frame, fi) => {
          const snap = entry.layerSnapshots.find((s) => s.layerId === layer.id && s.frameIndex === fi);
          return snap ? { ...frame, pixels: new Uint32Array(snap.pixels) } : frame;
        }),
      })),
    }));
    setActiveFrameIndex(entry.activeFrameIndex);
    setActiveLayerIndex(entry.activeLayerIndex);
    forceRender();
  }, [forceRender]);

  const redo = useCallback(() => {
    if (historyIndexRef.current >= historyRef.current.length - 1) return;
    historyIndexRef.current++;
    const entry = historyRef.current[historyIndexRef.current];
    if (!entry) return;
    setProject((prev) => ({
      ...prev,
      layers: prev.layers.map((layer) => ({
        ...layer,
        frames: layer.frames.map((frame, fi) => {
          const snap = entry.layerSnapshots.find((s) => s.layerId === layer.id && s.frameIndex === fi);
          return snap ? { ...frame, pixels: new Uint32Array(snap.pixels) } : frame;
        }),
      })),
    }));
    setActiveFrameIndex(entry.activeFrameIndex);
    setActiveLayerIndex(entry.activeLayerIndex);
    forceRender();
  }, [forceRender]);

  const handlePixelsChanged = useCallback(() => {
    saveHistory();
    forceRender();
  }, [saveHistory, forceRender]);

  /** Freehand: snapshot once before paint; refresh chrome after stroke. */
  const handleStrokeBegin = useCallback(() => {
    saveHistory();
  }, [saveHistory]);

  const handleStrokeEnd = useCallback(() => {
    forceRender();
  }, [forceRender]);

  useEffect(() => {
    if (!isFocused) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey) {
        if (e.key === "z") { e.preventDefault(); undo(); return; }
        if (e.key === "y") { e.preventDefault(); redo(); return; }
      }
      const toolEntry = TOOLS.find((t) => t.key.toLowerCase() === e.key.toLowerCase());
      if (toolEntry) { setActiveTool(toolEntry.id); return; }
      // Pen size — hold Shift to nudge dither phase instead
      if (e.key === "[") {
        if (e.shiftKey) setDitherOx((v) => (v + 7) % 8);
        else setPenSize((s) => Math.max(1, s - 1));
        return;
      }
      if (e.key === "]") {
        if (e.shiftKey) setDitherOx((v) => (v + 1) % 8);
        else setPenSize((s) => Math.min(32, s + 1));
        return;
      }
      if (e.key === "," || e.key === ";") {
        setDitherOy((v) => (v + 7) % 8);
        return;
      }
      if (e.key === "." || e.key === "'") {
        setDitherOy((v) => (v + 1) % 8);
        return;
      }
      if ((e.key === "o" || e.key === "O") && !e.ctrlKey && !e.metaKey && !e.altKey) setOnionEnabled((v) => !v);
      // Space is reserved for canvas pan (hold + drag). Play uses P.
      if ((e.key === "p" || e.key === "P") && !e.ctrlKey && !e.metaKey && !e.altKey) {
        e.preventDefault();
        togglePlayback();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isFocused, undo, redo, togglePlayback]);

  useEffect(() => {
    if (!playing) return;
    const count = project.layers[0]?.frames.length ?? 1;
    const interval = setInterval(() => setPreviewFrame((f) => (f + 1) % count), 1000 / Math.max(1, project.fps));
    return () => clearInterval(interval);
  }, [playing, project.fps, project.layers]);

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
        const frames = [...layer.frames];
        frames.splice(activeFrameIndex + 1, 0, cloneFrame(src, nextSpriteId()));
        return { ...layer, frames };
      }),
    }));
    setActiveFrameIndex((i) => i + 1);
  }, [activeFrameIndex, saveHistory]);

  const deleteFrame = useCallback(() => {
    if ((project.layers[0]?.frames.length ?? 0) <= 1) return;
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

  const addLayer = useCallback(() => {
    saveHistory();
    const count = project.layers[0]?.frames.length ?? 1;
    const newLayer: SpriteLayer = {
      id: nextSpriteId(),
      name: `LAYER ${project.layers.length + 1}`,
      opacity: 1,
      visible: true,
      frames: Array.from({ length: count }, () => createFrame(nextSpriteId(), project.width, project.height)),
    };
    setProject((prev) => ({ ...prev, layers: [...prev.layers, newLayer] }));
    setActiveLayerIndex(project.layers.length);
  }, [project, saveHistory]);

  const toggleLayerVisibility = useCallback((idx: number) => {
    setProject((prev) => ({
      ...prev,
      layers: prev.layers.map((l, i) => (i === idx ? { ...l, visible: !l.visible } : l)),
    }));
    forceRender();
  }, [forceRender]);

  const exportSpriteSheet = useCallback(() => {
    downloadCanvasAsPng(renderSpriteSheet(project, project.layers[0]?.frames.length ?? 1, 1), `${project.name}_sheet.png`);
  }, [project]);

  const exportFrames = useCallback(() => { downloadFramesAsZip(project, 1); }, [project]);
  const handlePaletteClick = useCallback((hex: string) => { setPrimaryColor(hexToPackedColor(hex)); }, []);
  const handleColorPicked = useCallback((c: PackedColor) => { setPrimaryColor(c); }, []);

  const frameCount = project.layers[0]?.frames.length ?? 1;
  const displayFrameIndex = playing ? previewFrame : activeFrameIndex;

  const previewCanvasRef = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const canvas = previewCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const frameCanvas = frameToCanvas(compositeFrame(project.layers, displayFrameIndex, project.width, project.height), 1);
    canvas.width = project.width;
    canvas.height = project.height;
    ctx.imageSmoothingEnabled = false;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(frameCanvas, 0, 0);
  }, [project, displayFrameIndex, renderTick]);

  const onionOptionsContent = (
    <div style={{ padding: 8, backgroundColor: "#000", border: "1px solid #333", minWidth: 180, fontFamily: "var(--dm-font-primary)" }} onClick={(e) => e.stopPropagation()} onPointerDown={(e) => e.stopPropagation()}>
      <div style={{ fontSize: 7, color: "#888", letterSpacing: 1, marginBottom: 8 }}>ONION SKIN OPTIONS</div>
      <div style={{ marginBottom: 10 }}>
        <div style={{ fontSize: 7, color: "#b850ff", letterSpacing: 1, marginBottom: 4 }}>PREV (PURPLE)</div>
        {[0, 1, 2].map((i) => (
          <div key={`prev-${i}`} style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 4 }}>
            <span style={{ fontSize: 7, color: "#666", width: 28 }}>-{i + 1}</span>
            <input type="range" min={0} max={100} value={Math.round(prevOpacities[i] * 100)} onChange={(e) => { const v = Number(e.target.value) / 100; setPrevOpacities((prev) => { const n = [...prev] as [number, number, number]; n[i] = v; return n; }); }} style={{ flex: 1, height: 4, accentColor: "#b850ff", cursor: "pointer" }} />
            <span style={{ fontSize: 7, color: "#888", width: 24, textAlign: "right" }}>{Math.round(prevOpacities[i] * 100)}</span>
          </div>
        ))}
      </div>
      <div style={{ marginBottom: 8 }}>
        <div style={{ fontSize: 7, color: "#3cdc78", letterSpacing: 1, marginBottom: 4 }}>NEXT (GREEN)</div>
        {[0, 1, 2].map((i) => (
          <div key={`next-${i}`} style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 4 }}>
            <span style={{ fontSize: 7, color: "#666", width: 28 }}>+{i + 1}</span>
            <input type="range" min={0} max={100} value={Math.round(nextOpacities[i] * 100)} onChange={(e) => { const v = Number(e.target.value) / 100; setNextOpacities((prev) => { const n = [...prev] as [number, number, number]; n[i] = v; return n; }); }} style={{ flex: 1, height: 4, accentColor: "#3cdc78", cursor: "pointer" }} />
            <span style={{ fontSize: 7, color: "#888", width: 24, textAlign: "right" }}>{Math.round(nextOpacities[i] * 100)}</span>
          </div>
        ))}
      </div>
      <div style={{ display: "flex", gap: 4 }}>
        <button onClick={() => { setPrevOpacities([...DEFAULT_PREV_OP]); setNextOpacities([...DEFAULT_NEXT_OP]); }} style={{ flex: 1, height: 18, border: "1px solid #333", background: "#000", color: "#888", fontFamily: "var(--dm-font-primary)", fontSize: 6, letterSpacing: 1, cursor: "pointer" }}>RESET</button>
        <button onClick={() => setShowOnionOptions(false)} style={{ flex: 1, height: 18, border: "1px solid #555", background: "#000", color: "#aaa", fontFamily: "var(--dm-font-primary)", fontSize: 6, letterSpacing: 1, cursor: "pointer" }}>CLOSE</button>
      </div>
    </div>
  );

  // Onion controls always present in tools (desktop strip + mobile TOOL panel)
  const toolsContent = (
    <div className="flex flex-col" style={{ width: collapse ? "auto" : 40 }}>
      {TOOLS.map((t) => (
        <button
          key={t.id}
          onClick={() => setActiveTool(t.id)}
          style={toolBtn(activeTool === t.id)}
          title={t.title ?? `${t.label} (${t.key})`}
        >
          {t.label}
        </button>
      ))}
      {activeTool === "dither" && (
        <div style={{ borderTop: "1px solid #1a1a1a", padding: 2 }}>
          <button
            type="button"
            onClick={() => setDitherOx((v) => (v + 1) % 8)}
            style={{ ...toolBtn(false), height: 22, fontSize: 6 }}
            title="Dither phase X (Shift+])"
          >
            OX{ditherOx}
          </button>
          <button
            type="button"
            onClick={() => setDitherOy((v) => (v + 1) % 8)}
            style={{ ...toolBtn(false), height: 22, fontSize: 6 }}
            title="Dither phase Y (.)"
          >
            OY{ditherOy}
          </button>
        </div>
      )}
      <div style={{ borderTop: "1px solid #1a1a1a", marginTop: 2 }}>
        <button onClick={() => setOnionEnabled((v) => !v)} style={toolBtn(onionEnabled)} title="Onion Skin (O)">ONI</button>
        <button onClick={() => setShowOnionOptions((v) => !v)} style={{ ...toolBtn(showOnionOptions), height: 24, fontSize: 6 }} title="Onion Skin Options">OPT</button>
        <button onClick={togglePlayback} style={toolBtn(playing)} title="Play / Pause (P)">{playing ? "||" : ">"}</button>
      </div>
      <div style={{ marginTop: "auto" }}>
        <button onClick={undo} style={{ ...toolBtn(false), height: 24 }}>UNDO</button>
        <button onClick={redo} style={{ ...toolBtn(false), height: 24 }}>REDO</button>
      </div>
    </div>
  );

  const sideContent = (
    <div className="flex flex-col" style={{ width: collapse ? "100%" : 120 }}>
      <div className="border-b" style={{ borderColor: "#1a1a1a", padding: 4 }}>
        <div className="flex items-center justify-between mb-1">
          <span style={{ fontSize: 7, color: "#888", letterSpacing: 1 }}>PREVIEW</span>
          <button onClick={togglePlayback} style={{ border: "1px solid #555", background: "#000", color: playing ? "#fff" : "#555", fontFamily: "var(--dm-font-primary)", fontSize: 7, padding: "1px 4px", cursor: "pointer" }}>{playing ? "STOP" : "PLAY"}</button>
        </div>
        <div style={{ display: "flex", justifyContent: "center", background: "#0a0a0a", padding: 4 }}>
          <canvas ref={previewCanvasRef} style={{ width: Math.min(96, project.width * 3), height: Math.min(96, project.height * 3), imageRendering: "pixelated" }} />
        </div>
        <div className="flex items-center justify-between mt-1">
          <span style={{ fontSize: 7, color: "#555" }}>FPS</span>
          <div className="flex gap-1">
            <button onClick={() => setProject((p) => ({ ...p, fps: Math.max(1, p.fps - 1) }))} style={{ border: "1px solid #333", background: "#000", color: "#888", fontSize: 7, cursor: "pointer", padding: "0 3px" }}>-</button>
            <span style={{ fontSize: 7, color: "#888", minWidth: 16, textAlign: "center" }}>{project.fps}</span>
            <button onClick={() => setProject((p) => ({ ...p, fps: Math.min(60, p.fps + 1) }))} style={{ border: "1px solid #333", background: "#000", color: "#888", fontSize: 7, cursor: "pointer", padding: "0 3px" }}>+</button>
          </div>
        </div>
      </div>
      <div className="border-b" style={{ borderColor: "#1a1a1a", padding: 4 }}>
        <span style={{ fontSize: 7, color: "#888", letterSpacing: 1 }}>COLOR</span>
        <div className="mt-1 mb-1" style={{ width: "100%", height: 16, backgroundColor: packedColorToHex(primaryColor), border: "1px solid #555" }} />
        <div style={{ display: "grid", gridTemplateColumns: "repeat(8, 1fr)", gap: 1 }}>
          {project.palette.map((hex, i) => (
            <div key={i} onClick={() => handlePaletteClick(hex)} style={{ width: "100%", aspectRatio: "1", backgroundColor: hex, border: packedColorToHex(primaryColor) === hex ? "1px solid #fff" : "1px solid #333", cursor: "pointer" }} />
          ))}
        </div>
      </div>
      <div className="flex-1 overflow-y-auto" style={{ padding: 4 }}>
        <div className="flex items-center justify-between mb-1">
          <span style={{ fontSize: 7, color: "#888", letterSpacing: 1 }}>LAYERS</span>
          <button onClick={addLayer} style={{ border: "1px solid #555", background: "#000", color: "#888", fontFamily: "var(--dm-font-primary)", fontSize: 7, padding: "1px 4px", cursor: "pointer" }}>+</button>
        </div>
        {project.layers.map((layer, i) => (
          <div key={layer.id} onClick={() => setActiveLayerIndex(i)} style={{ padding: "2px 4px", backgroundColor: i === activeLayerIndex ? "#1a1a1a" : "transparent", borderLeft: i === activeLayerIndex ? "2px solid #fff" : "2px solid transparent", display: "flex", alignItems: "center", justifyContent: "space-between", cursor: "pointer", marginBottom: 1 }}>
            <span style={{ fontSize: 7, color: i === activeLayerIndex ? "#fff" : "#555" }}>{layer.name}</span>
            <button onClick={(e) => { e.stopPropagation(); toggleLayerVisibility(i); }} style={{ border: "none", background: "transparent", color: layer.visible ? "#888" : "#333", fontFamily: "var(--dm-font-primary)", fontSize: 7, cursor: "pointer" }}>{layer.visible ? "V" : "-"}</button>
          </div>
        ))}
      </div>
      <div className="border-t" style={{ borderColor: "#1a1a1a", padding: 4 }}>
        <span style={{ fontSize: 7, color: "#888", letterSpacing: 1, display: "block", marginBottom: 2 }}>EXPORT</span>
        <button onClick={exportFrames} style={{ width: "100%", height: 20, border: "1px solid #333", background: "#000", color: "#888", fontFamily: "var(--dm-font-primary)", fontSize: 7, cursor: "pointer", marginBottom: 2 }}>PNG ZIP</button>
        <button onClick={exportSpriteSheet} style={{ width: "100%", height: 20, border: "1px solid #333", background: "#000", color: "#888", fontFamily: "var(--dm-font-primary)", fontSize: 7, cursor: "pointer" }}>SHEET</button>
      </div>
    </div>
  );

  const timelineContent = (
    <div className="flex items-center overflow-x-auto" style={{ minHeight: 48, padding: 4 }}>
      {/* Desktop timeline play control */}
      <button
        type="button"
        onClick={togglePlayback}
        title={playing ? "Pause" : "Play"}
        style={{
          flexShrink: 0,
          width: 36,
          height: 36,
          marginRight: 6,
          border: playing ? "1px solid #fff" : "1px solid #555",
          background: playing ? "#fff" : "#000",
          color: playing ? "#000" : "#888",
          fontFamily: "var(--dm-font-primary)",
          fontSize: 12,
          cursor: "pointer",
        }}
      >
        {playing ? "||" : ">"}
      </button>

      {Array.from({ length: frameCount }, (_, i) => (
        <FrameThumbnail
          key={i}
          frame={compositeFrame(project.layers, i, project.width, project.height)}
          index={i}
          isActive={i === displayFrameIndex}
          onClick={() => { setPlaying(false); setActiveFrameIndex(i); }}
          spriteWidth={project.width}
          spriteHeight={project.height}
          isOnionPrev={!playing && onionEnabled && i < activeFrameIndex && i >= activeFrameIndex - 3}
          isOnionNext={!playing && onionEnabled && i > activeFrameIndex && i <= activeFrameIndex + 3}
        />
      ))}
      <div className="flex gap-1 ml-2">
        <button onClick={addFrame} style={{ width: 36, height: 36, border: "1px solid #333", background: "#000", color: "#555", fontFamily: "var(--dm-font-primary)", fontSize: 14, cursor: "pointer" }}>+</button>
        <button onClick={duplicateFrame} style={{ width: 36, height: 36, border: "1px solid #333", background: "#000", color: "#555", fontFamily: "var(--dm-font-primary)", fontSize: 7, cursor: "pointer" }}>DUP</button>
        {frameCount > 1 && <button onClick={deleteFrame} style={{ width: 36, height: 36, border: "1px solid #333", background: "#000", color: "#555", fontFamily: "var(--dm-font-primary)", fontSize: 7, cursor: "pointer" }}>DEL</button>}
      </div>
    </div>
  );

  return (
    <div className="w-full h-full flex flex-col overflow-hidden" style={{ backgroundColor: "#000", fontFamily: "var(--dm-font-primary)", fontSize: 9, imageRendering: "pixelated", color: "#fff" }}>
      {embeddedMode ? (
        <div className="flex items-center justify-between px-2 py-1 border-b-2 flex-shrink-0" style={{ borderColor: "#ffff00", backgroundColor: "#222200", minHeight: 22 }}>
          <span style={{ color: "#ffff00", letterSpacing: 2 }}>{embeddedMode.title ?? "DRAWING FOR INSTRUMENT VISUAL"}</span>
          <div className="flex gap-2">
            <button onClick={() => embeddedMode.onUse(exportCurrentDataUrl())} style={{ background: "#ffff00", color: "#000", border: "1px solid #000", fontFamily: "monospace", fontSize: 10, padding: "1px 6px", cursor: "pointer" }}>USE THIS SPRITE</button>
            <button onClick={() => embeddedMode.onCancel()} style={{ background: "#000", color: "#fff", border: "1px solid #fff", fontFamily: "monospace", fontSize: 10, padding: "1px 6px", cursor: "pointer" }}>CANCEL</button>
          </div>
        </div>
      ) : null}

      {/* OS creative-bus handoff (SHOTLIST ↔ Sprite Editor) */}
      {!embeddedMode && handoff ? (
        <div
          className="flex items-center justify-between px-2 py-1 border-b-2 flex-shrink-0 flex-wrap gap-2"
          style={{ borderColor: "#ffff00", backgroundColor: "#222200", minHeight: 22 }}
        >
          <span style={{ color: "#ffff00", letterSpacing: 1, fontSize: 10 }}>
            ← {handoff.sourceApp.toUpperCase()} · {handoff.label}
            {handoff.mono ? " · MONO" : ""} · {handoff.width}×{handoff.height}
            {!handoffReady ? " · LOADING…" : ""}
          </span>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => void returnHandoff()}
              disabled={!handoffReady}
              style={{
                background: "#ffff00",
                color: "#000",
                border: "1px solid #000",
                fontFamily: "monospace",
                fontSize: 10,
                padding: "2px 8px",
                cursor: handoffReady ? "pointer" : "wait",
              }}
              title="Return plate/sprite to calling app"
            >
              RETURN TO {handoff.sourceApp.toUpperCase()}
            </button>
            <button
              type="button"
              onClick={cancelHandoff}
              style={{
                background: "#000",
                color: "#fff",
                border: "1px solid #fff",
                fontFamily: "monospace",
                fontSize: 10,
                padding: "2px 8px",
                cursor: "pointer",
              }}
            >
              CANCEL
            </button>
          </div>
        </div>
      ) : null}

      {!collapse && (
        <div className="flex items-center justify-between px-2 py-0.5 border-b-2 flex-shrink-0" style={{ borderColor: "#1a1a1a", minHeight: 22 }}>
          <span style={{ letterSpacing: 2 }}>SPRITE EDITOR</span>
          <div className="flex gap-2 items-center">
            <span style={{ color: "#888" }}>{project.width}x{project.height}</span>
            <span style={{ color: "#555" }}>FRM:{displayFrameIndex + 1}/{frameCount}</span>
            <span style={{ color: "#555" }}>SZ:{penSize}</span>
            {activeTool === "dither" && (
              <span style={{ color: "#666" }}>DΦ:{ditherOx},{ditherOy}</span>
            )}

            {/* Desktop header: onion + play always visible */}
            <button type="button" style={headerBtn(onionEnabled)} onClick={() => setOnionEnabled((v) => !v)} title="Onion Skin (O)">
              {onionEnabled ? "ONION" : "ONI"}
            </button>
            <button type="button" style={headerBtn(showOnionOptions)} onClick={() => setShowOnionOptions((v) => !v)} title="Onion Options">
              OPT
            </button>
            <button type="button" style={headerBtn(playing)} onClick={togglePlayback} title="Play / Pause (P)">
              {playing ? "||" : ">"}
            </button>
          </div>
        </div>
      )}

      <div className="flex flex-1 overflow-hidden relative">
        {!collapse && <div className="flex flex-col border-r flex-shrink-0" style={{ borderColor: "#1a1a1a", width: 40 }}>{toolsContent}</div>}

        <div className="flex-1 relative overflow-hidden">
          <SpriteCanvas
            layers={project.layers}
            activeLayerIndex={activeLayerIndex}
            activeFrameIndex={activeFrameIndex}
            displayFrameIndex={displayFrameIndex}
            playing={playing}
            width={project.width}
            height={project.height}
            tool={activeTool}
            color={primaryColor}
            penSize={penSize}
            ditherOx={ditherOx}
            ditherOy={ditherOy}
            zoom={zoom}
            onZoomChange={setZoom}
            onPixelsChanged={handlePixelsChanged}
            onStrokeBegin={handleStrokeBegin}
            onStrokeEnd={handleStrokeEnd}
            onUndo={undo}
            onColorPicked={handleColorPicked}
            onionSkin={onionSkin}
          />
          <CornerDismissLayer />
          {showOnionOptions && !collapse && <div style={{ position: "absolute", top: 8, left: 48, zIndex: 40 }}>{onionOptionsContent}</div>}
          {collapse && (
            <>
              <div style={{ position: "absolute", bottom: 10, left: "50%", transform: "translateX(-50%)", display: "flex", gap: 8, zIndex: 42 }}>
                <button type="button" style={mobileOnionBtn(onionEnabled)} onClick={(e) => { e.stopPropagation(); setOnionEnabled((v) => !v); }}>{onionEnabled ? "ON" : "ONI"}</button>
                <button type="button" style={mobileOnionBtn(showOnionOptions)} onClick={(e) => { e.stopPropagation(); setShowOnionOptions((v) => !v); }}>OPT</button>
              </div>
              {showOnionOptions && <div style={{ position: "absolute", bottom: 50, left: "50%", transform: "translateX(-50%)", zIndex: 43, maxWidth: "min(92vw, 240px)" }}>{onionOptionsContent}</div>}
            </>
          )}
        </div>

        {!collapse && <div className="flex flex-col border-l flex-shrink-0" style={{ borderColor: "#1a1a1a", width: 120 }}>{sideContent}</div>}

        {collapse && (
          <>
            <CornerPanel id="tools" corner="top-left" label="TOOL">{toolsContent}</CornerPanel>
            <CornerPanel id="side" corner="top-right" label="CLR">{sideContent}</CornerPanel>
            <CornerPanel id="frames" corner="bottom-left" label="FRM">{timelineContent}</CornerPanel>
            <button type="button" style={{ ...mobileFrameBtn, left: 44 }} onClick={(e) => { e.stopPropagation(); addFrame(); }}>+</button>
            <button type="button" style={{ ...mobileFrameBtn, left: 84 }} onClick={(e) => { e.stopPropagation(); duplicateFrame(); }}>DUP</button>
            <button
              type="button"
              aria-label={playing ? "Pause" : "Play"}
              title={playing ? "Pause" : "Play"}
              style={{
                ...mobileFrameBtn,
                right: 84,
                left: "auto",
                backgroundColor: playing ? "#ffffff" : "#000000",
                color: playing ? "#000000" : "#888888",
                borderColor: playing ? "#ffffff" : "#555555",
              }}
              onClick={(e) => { e.stopPropagation(); togglePlayback(); }}
            >
              {playing ? "||" : ">"}
            </button>
            <CornerPanel id="info" corner="bottom-right" label="INFO">
              <div style={{ padding: 4, fontSize: 8, color: "#888" }}>
                <div>{project.width}×{project.height}</div>
                <div>FRM {displayFrameIndex + 1}/{frameCount}</div>
                <div>SZ {penSize} · {activeTool.toUpperCase()}</div>
                {activeTool === "dither" && (
                  <div style={{ marginTop: 2 }}>DITHER Φ {ditherOx},{ditherOy}</div>
                )}
                <div style={{ marginTop: 4, color: onionEnabled ? "#b850ff" : "#555" }}>ONION {onionEnabled ? "ON" : "OFF"}</div>
                <div style={{ marginTop: 6 }}>B/K/D freehand · H = UI · O = onion</div>
              </div>
            </CornerPanel>
          </>
        )}

        <VerticalChromeToggle corner="bottom-right" />
      </div>

      {!collapse && <div className="flex items-center border-t flex-shrink-0 overflow-x-auto" style={{ borderColor: "#1a1a1a", minHeight: 48 }}>{timelineContent}</div>}
      {!collapse && (
        <div className="flex items-center justify-between px-2 py-0.5 border-t-2 flex-shrink-0" style={{ borderColor: "#1a1a1a", minHeight: 18 }}>
          <span style={{ fontSize: 7, color: "#555", letterSpacing: 1 }}>
            B/K/D freehand · SPACE+DRAG pan · SHIFT/ALT+DRAG rot · SCROLL zoom · PINCH · 2-FINGER TAP undo · P play · H:ZEN
          </span>
          <span style={{ fontSize: 7, color: "#555" }}>☦</span>
        </div>
      )}
    </div>
  );
}

function FrameThumbnail({
  frame, index, isActive, onClick, spriteWidth, spriteHeight, isOnionPrev, isOnionNext,
}: {
  frame: import("@/types/sprite").SpriteFrame;
  index: number;
  isActive: boolean;
  onClick: () => void;
  spriteWidth: number;
  spriteHeight: number;
  isOnionPrev?: boolean;
  isOnionNext?: boolean;
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
    ctx.clearRect(0, 0, spriteWidth, spriteHeight);
    ctx.drawImage(frameToCanvas(frame, 1), 0, 0);
  }, [frame, spriteWidth, spriteHeight]);

  let borderColor = isActive ? "#ffffff" : "#333333";
  if (!isActive && isOnionPrev) borderColor = "#b850ff";
  if (!isActive && isOnionNext) borderColor = "#3cdc78";

  return (
    <div onClick={onClick} style={{ flexShrink: 0, marginRight: 3, cursor: "pointer", border: isActive ? "2px solid #ffffff" : `1px solid ${borderColor}`, backgroundColor: "#0a0a0a", padding: 2 }}>
      <canvas ref={canvasRef} style={{ width: 32, height: 32, imageRendering: "pixelated", display: "block" }} />
      <div style={{ fontFamily: "var(--dm-font-primary)", fontSize: 6, color: isActive ? "#fff" : isOnionPrev ? "#b850ff" : isOnionNext ? "#3cdc78" : "#555", textAlign: "center", marginTop: 1 }}>{index + 1}</div>
    </div>
  );
}
