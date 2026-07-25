/*
 * KOOLDRAW — pixel art & animation
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
  resizeProject,
  clampCanvasSize,
  clampPixelZoom,
  fitPixelZoom,
  CANVAS_SIZE_PRESETS,
  DITHER_PATTERNS,
  DEFAULT_DITHER_PATTERN,
  INDEXED_PALETTE_PRESETS,
  DEFAULT_PRESSURE_CURVE,
  type DitherPatternId,
} from "@/lib/SpriteUtils";
import { FREEHAND_TOOLS, useCreativeWorkflow } from "@/lib/creative";
import {
  SpriteCanvas,
  DEFAULT_BRUSH,
  ONION_RANGE,
  type BrushSettings,
  type OnionSkinSettings,
} from "./SpriteCanvas";
import {
  CornerHost,
  CornerPanel,
  VerticalChromeToggle,
  CornerDismissLayer,
  useCornerChromeOptional,
} from "@/components/ui/CornerChrome";
import { PixelKnob } from "@/components/ui/PixelKnob";
import { PixelColorPicker } from "@/components/ui/PixelColorPicker";

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

/**
 * Falloff for ±1…±3 (index 0 = closest).
 * Strong near current, soft at outer ring.
 */
function defaultOnionSide(): number[] {
  const arr = new Array(ONION_RANGE).fill(0) as number[];
  const seeds = [0.7, 0.4, 0.18];
  for (let i = 0; i < ONION_RANGE; i++) arr[i] = seeds[i] ?? 0;
  return arr;
}


/** Shared grid cell button — monochrome, hard edges */
const toolBtn = (active: boolean): React.CSSProperties => ({
  height: "100%",
  minHeight: 24,
  border: "1px solid #222",
  backgroundColor: active ? "#ffffff" : "#000000",
  color: active ? "#000000" : "#888888",
  fontFamily: "var(--dm-font-primary)",
  fontSize: 6,
  letterSpacing: 0,
  cursor: "pointer",
  width: "100%",
  padding: 0,
  margin: 0,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  boxSizing: "border-box",
});

const grid4: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(4, 1fr)",
  gap: 0,
  width: "100%",
};

const grid2: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(2, 1fr)",
  gap: 0,
  width: "100%",
};

const gridCell: React.CSSProperties = {
  minHeight: 24,
  border: "1px solid #1a1a1a",
  boxSizing: "border-box",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  background: "#000",
};

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
  const [penSize, setPenSize] = useState(8);
  const [brush, setBrush] = useState<BrushSettings>(() => ({
    ...DEFAULT_BRUSH,
    maxSize: 8,
    curve: { ...DEFAULT_PRESSURE_CURVE },
  }));
  /** free = any hex; indexed = snap to active palette (classic hardware) */
  const [paletteMode, setPaletteMode] = useState<"free" | "indexed">("free");
  const [palettePreset, setPalettePreset] = useState<string>("project");
  /** Bayer matrix phase for dither pencil (variable-positioned dither) */
  const [ditherOx, setDitherOx] = useState(0);
  const [ditherOy, setDitherOy] = useState(0);
  const [ditherPattern, setDitherPattern] =
    useState<DitherPatternId>(DEFAULT_DITHER_PATTERN);

  const activePalette: string[] =
    palettePreset === "project"
      ? project.palette
      : INDEXED_PALETTE_PRESETS[palettePreset]?.colors ?? project.palette;

  const brushForCanvas: BrushSettings = {
    ...brush,
    maxSize: penSize,
    indexedPalette: paletteMode === "indexed" ? activePalette : null,
  };
  const [zoom, setZoom] = useState(12);
  const [activeFrameIndex, setActiveFrameIndex] = useState(0);
  const [activeLayerIndex, setActiveLayerIndex] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [previewFrame, setPreviewFrame] = useState(0);
  const [renderTick, setRenderTick] = useState(0);
  // Onion skin ON by default (mobile + desktop)
  const [onionEnabled, setOnionEnabled] = useState(true);
  const [onionLoopWrap, setOnionLoopWrap] = useState(true);
  const [onionTint, setOnionTint] = useState(0.88);
  const [showOnionOptions, setShowOnionOptions] = useState(false);
  const [showSizeSettings, setShowSizeSettings] = useState(false);
  const [prevOpacities, setPrevOpacities] = useState<number[]>(() => defaultOnionSide());
  const [nextOpacities, setNextOpacities] = useState<number[]>(() => defaultOnionSide());
  /** Timeline panel height (0 = collapsed); drag handle resizes */
  const [timelineHeight, setTimelineHeight] = useState(72);
  const timelineDragRef = useRef<{ startY: number; startH: number } | null>(null);

  const onionSkin: OnionSkinSettings = {
    enabled: onionEnabled,
    prevOpacities,
    nextOpacities,
    loopWrap: onionLoopWrap,
    tint: onionTint,
  };

  const TIMELINE_MIN = 0;
  const TIMELINE_MAX = 220;
  const TIMELINE_DEFAULT = 72;

  const onTimelineHandlePointerDown = useCallback(
    (e: React.PointerEvent) => {
      e.preventDefault();
      e.currentTarget.setPointerCapture(e.pointerId);
      timelineDragRef.current = { startY: e.clientY, startH: timelineHeight };
    },
    [timelineHeight],
  );

  const onTimelineHandlePointerMove = useCallback((e: React.PointerEvent) => {
    const drag = timelineDragRef.current;
    if (!drag) return;
    // Drag up = taller timeline
    const dy = drag.startY - e.clientY;
    const next = Math.min(TIMELINE_MAX, Math.max(TIMELINE_MIN, drag.startH + dy));
    setTimelineHeight(next);
  }, []);

  const onTimelineHandlePointerUp = useCallback((e: React.PointerEvent) => {
    timelineDragRef.current = null;
    try {
      e.currentTarget.releasePointerCapture(e.pointerId);
    } catch {
      /* ignore */
    }
    // Snap closed if nearly collapsed
    setTimelineHeight((h) => (h < 20 ? 0 : h));
  }, []);
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
        clampPixelZoom(
          fitPixelZoom(handoff.width, handoff.height, 720, 520),
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
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement || e.target instanceof HTMLSelectElement) {
        return;
      }
      if (e.ctrlKey || e.metaKey) {
        if (e.key === "z") { e.preventDefault(); undo(); return; }
        if (e.key === "y") { e.preventDefault(); redo(); return; }
      }
      const count = project.layers[0]?.frames.length ?? 1;
      // Frame navigation: , prev · . next · w first
      if (e.key === "," && !e.ctrlKey && !e.metaKey && !e.altKey) {
        e.preventDefault();
        setPlaying(false);
        setActiveFrameIndex((i) => (i - 1 + count) % count);
        return;
      }
      if (e.key === "." && !e.ctrlKey && !e.metaKey && !e.altKey) {
        e.preventDefault();
        setPlaying(false);
        setActiveFrameIndex((i) => (i + 1) % count);
        return;
      }
      if ((e.key === "w" || e.key === "W") && !e.ctrlKey && !e.metaKey && !e.altKey) {
        e.preventDefault();
        setPlaying(false);
        setActiveFrameIndex(0);
        return;
      }
      const toolEntry = TOOLS.find((t) => t.key.toLowerCase() === e.key.toLowerCase());
      if (toolEntry) { setActiveTool(toolEntry.id); return; }
      // Pen size — hold Shift to nudge dither phase X
      if (e.key === "[") {
        if (e.shiftKey) setDitherOx((v) => (v + 7) % 8);
        else setPenSize((s) => Math.max(1, s - 1));
        return;
      }
      if (e.key === "]") {
        if (e.shiftKey) setDitherOx((v) => (v + 1) % 8);
        else setPenSize((s) => Math.min(256, s + 1));
        return;
      }
      // Dither phase Y (moved off ,/. which now change frames)
      if (e.key === ";" || e.key === ":") {
        setDitherOy((v) => (v + 7) % 8);
        return;
      }
      if (e.key === "'" || e.key === '"') {
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
  }, [isFocused, undo, redo, togglePlayback, project.layers]);

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

  const [customW, setCustomW] = useState(32);
  const [customH, setCustomH] = useState(32);

  useEffect(() => {
    setCustomW(project.width);
    setCustomH(project.height);
  }, [project.width, project.height]);

  const applyCanvasSize = useCallback(
    (w: number, h: number) => {
      const nw = clampCanvasSize(w);
      const nh = clampCanvasSize(h);
      if (nw === project.width && nh === project.height) return;
      if (nw * nh >= 1920 * 1080) {
        // Soft warning for huge canvases (undo memory)
        const ok = window.confirm(
          `Resize all frames to ${nw}×${nh}?\nLarge sizes use more memory for undo.`,
        );
        if (!ok) return;
      }
      saveHistory();
      setProject((prev) => resizeProject(prev, nw, nh));
      // Fit large plates into the view (sub-1× zoom allowed)
      setZoom(clampPixelZoom(fitPixelZoom(nw, nh, 720, 520)));
      forceRender();
    },
    [project.width, project.height, saveHistory, forceRender],
  );

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

  const setPrevOpAt = (i: number, op01: number) => {
    setPrevOpacities((prev) => {
      const n = prev.slice();
      while (n.length < ONION_RANGE) n.push(0);
      n[i] = Math.min(1, Math.max(0, op01));
      return n;
    });
  };
  const setNextOpAt = (i: number, op01: number) => {
    setNextOpacities((prev) => {
      const n = prev.slice();
      while (n.length < ONION_RANGE) n.push(0);
      n[i] = Math.min(1, Math.max(0, op01));
      return n;
    });
  };

  /** Toggle a single offset: off → default seed, on → 0 (Krita top-box behaviour) */
  const toggleOnionOffset = (side: "prev" | "next", idx: number) => {
    const setter = side === "prev" ? setPrevOpacities : setNextOpacities;
    setter((prev) => {
      const n = prev.slice();
      while (n.length < ONION_RANGE) n.push(0);
      const cur = n[idx] ?? 0;
      n[idx] = cur > 0.001 ? 0 : (defaultOnionSide()[idx] ?? 0.5);
      return n;
    });
  };

  /**
   * Krita-style onion docker (compact):
   *   −3 … −1 | 0 (locked 100%) | +1 … +3
   * Vertical opacity bars; left = past, right = future.
   */
  const onionOptionsContent = (
    <div
      style={{
        padding: 0,
        backgroundColor: "#1a1a1a",
        border: "1px solid #555",
        width: "min(92vw, 220px)",
        fontFamily: "var(--dm-font-primary)",
        imageRendering: "pixelated",
        boxShadow: "4px 4px 0 #000",
      }}
      onClick={(e) => e.stopPropagation()}
      onPointerDown={(e) => e.stopPropagation()}
    >
      {/* Title bar */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "5px 8px",
          borderBottom: "1px solid #333",
          background: "#222",
        }}
      >
        <span style={{ fontSize: 8, color: "#ddd", letterSpacing: 1 }}>ONION SKINS</span>
        <button
          type="button"
          onClick={() => setShowOnionOptions(false)}
          style={{
            border: "1px solid #555",
            background: "#111",
            color: "#aaa",
            fontFamily: "inherit",
            fontSize: 9,
            width: 18,
            height: 16,
            cursor: "pointer",
            padding: 0,
            lineHeight: 1,
          }}
          title="Close"
        >
          ×
        </button>
      </div>

      {/* Offset labels −10…0…+10 (click side labels to toggle on/off) */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: `repeat(${ONION_RANGE * 2 + 1}, minmax(0, 1fr))`,
          gap: 1,
          padding: "4px 6px 0",
          background: "#141414",
        }}
      >
        {Array.from({ length: ONION_RANGE }, (_, k) => {
          const d = ONION_RANGE - k;
          const idx = d - 1;
          const on = (prevOpacities[idx] ?? 0) > 0.001;
          return (
            <button
              key={`lbl-p${d}`}
              type="button"
              onClick={() => toggleOnionOffset("prev", idx)}
              title={`Toggle frame −${d}`}
              style={{
                fontSize: 7,
                color: on ? "#bbb" : "#444",
                textAlign: "center",
                padding: "3px 0",
                border: "none",
                background: "transparent",
                cursor: "pointer",
                fontFamily: "inherit",
                minWidth: 0,
              }}
            >
              -{d}
            </button>
          );
        })}
        <div
          style={{
            fontSize: 8,
            color: "#fff",
            textAlign: "center",
            padding: "3px 0",
            fontWeight: 700,
            background: "#2a2a2a",
            borderRadius: 1,
          }}
          title="Current frame (always 100%)"
        >
          0
        </div>
        {Array.from({ length: ONION_RANGE }, (_, k) => {
          const d = k + 1;
          const idx = d - 1;
          const on = (nextOpacities[idx] ?? 0) > 0.001;
          return (
            <button
              key={`lbl-n${d}`}
              type="button"
              onClick={() => toggleOnionOffset("next", idx)}
              title={`Toggle frame +${d}`}
              style={{
                fontSize: 7,
                color: on ? "#bbb" : "#444",
                textAlign: "center",
                padding: "3px 0",
                border: "none",
                background: "transparent",
                cursor: "pointer",
                fontFamily: "inherit",
                minWidth: 0,
              }}
            >
              {d}
            </button>
          );
        })}
      </div>

      {/* Vertical opacity histogram — drag each bar up/down */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: `repeat(${ONION_RANGE * 2 + 1}, minmax(0, 1fr))`,
          gap: 3,
          height: 96,
          padding: "4px 8px 8px",
          background: "#141414",
          borderBottom: "1px solid #2a2a2a",
        }}
      >
        {/* Past: −10 … −1 (left → right, farthest → closest) */}
        {Array.from({ length: ONION_RANGE }, (_, k) => {
          const d = ONION_RANGE - k;
          const idx = d - 1;
          const op = prevOpacities[idx] ?? 0;
          return (
            <OnionVertBar
              key={`bar-p${d}`}
              value={op}
              locked={false}
              side="prev"
              onChange={(v) => setPrevOpAt(idx, v)}
              title={`−${d}: ${Math.round(op * 100)}% · drag to set opacity`}
            />
          );
        })}
        {/* Current: locked 100% — uneditable */}
        <OnionVertBar
          value={1}
          locked
          side="current"
          onChange={() => {}}
          title="0 · current frame (100%, locked)"
        />
        {/* Future: +1 … +10 */}
        {Array.from({ length: ONION_RANGE }, (_, k) => {
          const d = k + 1;
          const idx = d - 1;
          const op = nextOpacities[idx] ?? 0;
          return (
            <OnionVertBar
              key={`bar-n${d}`}
              value={op}
              locked={false}
              side="next"
              onChange={(v) => setNextOpAt(idx, v)}
              title={`+${d}: ${Math.round(op * 100)}% · drag to set opacity`}
            />
          );
        })}
      </div>

      {/* Tint (Krita master tint strength) */}
      <div style={{ padding: "8px 10px 6px", borderBottom: "1px solid #2a2a2a" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ fontSize: 7, color: "#888", letterSpacing: 1, minWidth: 28 }}>TINT</span>
          <OnionTintBar value={onionTint} onChange={setOnionTint} />
          <span
            style={{
              fontSize: 7,
              color: "#eee",
              border: "1px solid #444",
              background: "#0a0a0a",
              padding: "2px 5px",
              minWidth: 32,
              textAlign: "center",
            }}
          >
            {Math.round(onionTint * 100)}%
          </span>
        </div>
      </div>

      {/* Previous / Next tint colour labels (fixed purple / green) */}
      <div
        style={{
          display: "flex",
          gap: 0,
          borderBottom: "1px solid #2a2a2a",
          background: "#111",
        }}
      >
        <div
          style={{
            flex: 1,
            display: "flex",
            alignItems: "center",
            gap: 6,
            padding: "7px 10px",
            borderRight: "1px solid #2a2a2a",
            fontSize: 6,
            color: "#aaa",
            letterSpacing: 0.5,
          }}
        >
          <span
            style={{
              width: 14,
              height: 14,
              background: "#c04040",
              border: "1px solid #666",
              flexShrink: 0,
            }}
            title="Previous-frame tint (on canvas: purple)"
          />
          PREVIOUS FRAMES
        </div>
        <div
          style={{
            flex: 1,
            display: "flex",
            alignItems: "center",
            justifyContent: "flex-end",
            gap: 6,
            padding: "7px 10px",
            fontSize: 6,
            color: "#aaa",
            letterSpacing: 0.5,
          }}
        >
          NEXT FRAMES
          <span
            style={{
              width: 14,
              height: 14,
              background: "#40b060",
              border: "1px solid #666",
              flexShrink: 0,
            }}
            title="Next-frame tint (on canvas: green)"
          />
        </div>
      </div>

      {/* Footer actions */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 0 }}>
        <button
          type="button"
          onClick={() => setOnionLoopWrap((v) => !v)}
          style={{
            height: 24,
            border: "none",
            borderRight: "1px solid #2a2a2a",
            background: onionLoopWrap ? "#eee" : "#111",
            color: onionLoopWrap ? "#000" : "#777",
            fontFamily: "inherit",
            fontSize: 6,
            letterSpacing: 1,
            cursor: "pointer",
          }}
          title="Loop: first ghosts last, last ghosts first"
        >
          LOOP {onionLoopWrap ? "ON" : "OFF"}
        </button>
        <button
          type="button"
          onClick={() => {
            setPrevOpacities(defaultOnionSide());
            setNextOpacities(defaultOnionSide());
            setOnionTint(0.88);
            setOnionLoopWrap(true);
          }}
          style={{
            height: 24,
            border: "none",
            borderRight: "1px solid #2a2a2a",
            background: "#111",
            color: "#888",
            fontFamily: "inherit",
            fontSize: 6,
            letterSpacing: 1,
            cursor: "pointer",
          }}
        >
          RESET
        </button>
        <button
          type="button"
          onClick={() => setShowOnionOptions(false)}
          style={{
            height: 24,
            border: "none",
            background: "#111",
            color: "#aaa",
            fontFamily: "inherit",
            fontSize: 6,
            letterSpacing: 1,
            cursor: "pointer",
          }}
        >
          CLOSE
        </button>
      </div>
    </div>
  );

  // Left rail: strict CSS grids (4-col tools/toggles/actions, 2-col knobs)
  const toolsContent = (
    <div
      style={{
        width: collapse ? "auto" : 116,
        height: "100%",
        minHeight: 0,
        overflowY: "auto",
        overflowX: "hidden",
        display: "flex",
        flexDirection: "column",
        background: "#000",
      }}
    >
      {/* Tools — fill 4-col grid (wraps to next row) */}
      <div style={grid4}>
        {TOOLS.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setActiveTool(t.id)}
            style={{ ...toolBtn(activeTool === t.id), minHeight: 26 }}
            title={t.title ?? `${t.label} (${t.key})`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Brush knobs — 2×2 grid cells */}
      <div style={{ ...grid2, borderTop: "1px solid #333" }}>
        {(
          [
            {
              key: "size",
              label: "SIZE",
              min: 1,
              max: 256,
              value: penSize,
              shown: `${penSize}`,
              title: "Max pen width · drag ↑/→",
              onChange: (v: number) => {
                setPenSize(v);
                setBrush((b) => ({ ...b, maxSize: v }));
              },
            },
            {
              key: "opac",
              label: "OPAC",
              min: 1,
              max: 100,
              value: Math.round(brush.opacity * 100),
              shown: `${Math.round(brush.opacity * 100)}`,
              title: "Base opacity",
              onChange: (v: number) => setBrush((b) => ({ ...b, opacity: v / 100 })),
            },
            {
              key: "soft",
              label: "SOFT",
              min: 0,
              max: 100,
              value: Math.round(brush.softness * 100),
              shown: `${Math.round(brush.softness * 100)}`,
              title: "Feather / softness",
              onChange: (v: number) => setBrush((b) => ({ ...b, softness: v / 100 })),
            },
            {
              key: "scat",
              label: "SCAT",
              min: 0,
              max: 100,
              value: Math.round(brush.scatter * 100),
              shown: `${Math.round(brush.scatter * 100)}`,
              title: "Pen scatter",
              onChange: (v: number) => setBrush((b) => ({ ...b, scatter: v / 100 })),
            },
          ] as const
        ).map((k) => (
          <div
            key={k.key}
            style={{
              ...gridCell,
              minHeight: 72,
              padding: "4px 2px",
              flexDirection: "column",
            }}
          >
            <PixelKnob
              label={k.label}
              min={k.min}
              max={k.max}
              step={1}
              value={k.value}
              displayValue={k.shown}
              size={36}
              layout="vertical"
              title={k.title}
              onChange={k.onChange}
            />
          </div>
        ))}
      </div>

      {/* Brush flags — 4-col */}
      <div style={{ ...grid4, borderTop: "1px solid #333" }}>
        <button type="button" style={toolBtn(brush.antialias)} onClick={() => setBrush((b) => ({ ...b, antialias: !b.antialias }))} title="Antialias">
          AA
        </button>
        <button type="button" style={toolBtn(brush.sizeFromPressure)} onClick={() => setBrush((b) => ({ ...b, sizeFromPressure: !b.sizeFromPressure }))} title="Pressure → size">
          P·S
        </button>
        <button type="button" style={toolBtn(brush.opacityFromPressure)} onClick={() => setBrush((b) => ({ ...b, opacityFromPressure: !b.opacityFromPressure }))} title="Pressure → opacity">
          P·O
        </button>
        <button
          type="button"
          style={toolBtn(false)}
          onClick={() =>
            setBrush((b) => ({
              ...b,
              curve: { ...DEFAULT_PRESSURE_CURVE },
              softness: 0.35,
              scatter: 0,
              antialias: true,
              opacity: 1,
            }))
          }
          title="Reset brush"
        >
          RST
        </button>
      </div>

      {activeTool === "dither" && (
        <div style={{ ...grid4, borderTop: "1px solid #333" }}>
          {DITHER_PATTERNS.map((p) => (
            <button
              key={p.id}
              type="button"
              onClick={() => setDitherPattern(p.id)}
              style={{ ...toolBtn(ditherPattern === p.id), fontSize: 5, minHeight: 22 }}
              title={p.title}
            >
              {p.label}
            </button>
          ))}
          <button type="button" onClick={() => setDitherOx((v) => (v + 1) % 8)} style={{ ...toolBtn(false), gridColumn: "span 2" }} title="Dither phase X">
            OX {ditherOx}
          </button>
          <button type="button" onClick={() => setDitherOy((v) => (v + 1) % 8)} style={{ ...toolBtn(false), gridColumn: "span 2" }} title="Dither phase Y">
            OY {ditherOy}
          </button>
        </div>
      )}

      {/* Bottom actions — 4-col + full-width second row for undo/redo */}
      <div style={{ marginTop: "auto", borderTop: "1px solid #333" }}>
        <div style={grid4}>
          <button type="button" onClick={() => setOnionEnabled((v) => !v)} style={toolBtn(onionEnabled)} title="Onion (O)">
            ONI
          </button>
          <button type="button" onClick={() => setShowOnionOptions((v) => !v)} style={toolBtn(showOnionOptions)} title="Onion options">
            OPT
          </button>
          <button type="button" onClick={togglePlayback} style={toolBtn(playing)} title="Play">
            {playing ? "||" : ">"}
          </button>
          <button type="button" onClick={undo} style={toolBtn(false)} title="Undo">
            UND
          </button>
        </div>
        <div style={grid2}>
          <button type="button" onClick={redo} style={toolBtn(false)} title="Redo">
            REDO
          </button>
          <button
            type="button"
            onClick={() => setTimelineHeight((h) => (h > 0 ? 0 : TIMELINE_DEFAULT))}
            style={toolBtn(timelineHeight > 0)}
            title="Toggle timeline"
          >
            FRM
          </button>
        </div>
      </div>
    </div>
  );

  const sideContent = (
    <div
      className="flex flex-col"
      style={{
        width: collapse ? "100%" : 120,
        height: "100%",
        minHeight: 0,
        overflow: "hidden",
      }}
    >
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
      <div
        className="border-b"
        style={{
          borderColor: "#1a1a1a",
          padding: 4,
          overflowY: "auto",
          flexShrink: 0,
          maxHeight: "55%",
        }}
      >
        <div
          style={{
            fontSize: 6,
            color: "#666",
            letterSpacing: 1,
            marginBottom: 4,
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <span>COLOR</span>
          <span style={{ color: "#444" }}>PIXEL</span>
        </div>

        <PixelColorPicker
          value={packedColorToHex(primaryColor)}
          onChange={(hex) => setPrimaryColor(hexToPackedColor(hex))}
          width={112}
        />

        {/* Mode + palette — grid chrome */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: 0,
            marginTop: 4,
            border: "1px solid #333",
          }}
        >
          <button
            type="button"
            onClick={() => setPaletteMode("free")}
            style={{
              height: 20,
              fontSize: 6,
              letterSpacing: 1,
              border: "1px solid #222",
              background: paletteMode === "free" ? "#fff" : "#000",
              color: paletteMode === "free" ? "#000" : "#888",
              cursor: "pointer",
              fontFamily: "inherit",
            }}
            title="Free hex colors"
          >
            HEX
          </button>
          <button
            type="button"
            onClick={() => setPaletteMode("indexed")}
            style={{
              height: 20,
              fontSize: 6,
              letterSpacing: 1,
              border: "1px solid #222",
              background: paletteMode === "indexed" ? "#fff" : "#000",
              color: paletteMode === "indexed" ? "#000" : "#888",
              cursor: "pointer",
              fontFamily: "inherit",
            }}
            title="Snap paint to indexed palette"
          >
            IDX
          </button>
        </div>

        <select
          value={palettePreset}
          onChange={(e) => setPalettePreset(e.target.value)}
          style={{
            width: "100%",
            height: 20,
            marginTop: 4,
            marginBottom: 4,
            background: "#000",
            color: "#ccc",
            border: "1px solid #555",
            fontFamily: "inherit",
            fontSize: 6,
            letterSpacing: 1,
            borderRadius: 0,
          }}
          title="Palette source"
        >
          <option value="project">PROJECT</option>
          {Object.entries(INDEXED_PALETTE_PRESETS).map(([id, p]) => (
            <option key={id} value={id}>
              {p.label}
            </option>
          ))}
        </select>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(4, 1fr)",
            gap: 0,
            border: "1px solid #333",
          }}
        >
          {activePalette.map((hex, i) => {
            const sel =
              packedColorToHex(primaryColor) === hex.toLowerCase() ||
              packedColorToHex(primaryColor) === hex;
            return (
              <button
                key={`${hex}-${i}`}
                type="button"
                onClick={() => handlePaletteClick(hex)}
                title={hex}
                style={{
                  width: "100%",
                  aspectRatio: "1",
                  padding: 0,
                  backgroundColor: hex,
                  border: sel ? "2px solid #fff" : "1px solid #222",
                  cursor: "pointer",
                  boxSizing: "border-box",
                  imageRendering: "pixelated",
                }}
              />
            );
          })}
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

  /** Canvas size settings — popup only (not always-on in the rail) */
  const sizeSettingsContent = (
    <div
      style={{
        padding: 0,
        backgroundColor: "#1a1a1a",
        border: "1px solid #555",
        width: "min(92vw, 240px)",
        fontFamily: "var(--dm-font-primary)",
        imageRendering: "pixelated",
        boxShadow: "4px 4px 0 #000",
      }}
      onClick={(e) => e.stopPropagation()}
      onPointerDown={(e) => e.stopPropagation()}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "5px 8px",
          borderBottom: "1px solid #333",
          background: "#222",
        }}
      >
        <span style={{ fontSize: 8, color: "#ddd", letterSpacing: 1 }}>IMAGE SIZE</span>
        <button
          type="button"
          onClick={() => setShowSizeSettings(false)}
          style={{
            border: "1px solid #555",
            background: "#111",
            color: "#aaa",
            fontFamily: "inherit",
            fontSize: 9,
            width: 18,
            height: 16,
            cursor: "pointer",
            padding: 0,
            lineHeight: 1,
          }}
          title="Close"
        >
          ×
        </button>
      </div>

      <div style={{ padding: 8 }}>
        <div
          style={{
            fontSize: 7,
            color: "#666",
            letterSpacing: 1,
            marginBottom: 6,
            display: "flex",
            justifyContent: "space-between",
          }}
        >
          <span>CURRENT</span>
          <span style={{ color: "#eee" }}>
            {project.width}×{project.height}
          </span>
        </div>

        <div style={{ fontSize: 6, color: "#555", letterSpacing: 1, marginBottom: 3 }}>
          PRESETS
        </div>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: 0,
            border: "1px solid #333",
            marginBottom: 8,
          }}
        >
          {CANVAS_SIZE_PRESETS.map((p) => {
            const on = project.width === p.w && project.height === p.h;
            return (
              <button
                key={p.id}
                type="button"
                onClick={() => {
                  applyCanvasSize(p.w, p.h);
                  setShowSizeSettings(false);
                }}
                title={`Resize all frames to ${p.label} (nearest-neighbor)`}
                style={{
                  height: 24,
                  border: "1px solid #222",
                  background: on ? "#fff" : "#000",
                  color: on ? "#000" : "#888",
                  fontFamily: "inherit",
                  fontSize: 6,
                  letterSpacing: 0,
                  cursor: "pointer",
                  padding: "0 4px",
                }}
              >
                {p.label}
              </button>
            );
          })}
        </div>

        <div style={{ fontSize: 6, color: "#555", letterSpacing: 1, marginBottom: 3 }}>
          CUSTOM
        </div>
        <div style={{ display: "flex", gap: 4, alignItems: "center", marginBottom: 6 }}>
          <input
            type="number"
            min={1}
            max={4096}
            value={customW}
            onChange={(e) => setCustomW(Number(e.target.value) || 1)}
            title="Width"
            style={{
              flex: 1,
              minWidth: 0,
              height: 24,
              background: "#000",
              color: "#fff",
              border: "1px solid #555",
              fontFamily: "inherit",
              fontSize: 8,
              padding: "0 6px",
              outline: "none",
            }}
          />
          <span style={{ fontSize: 8, color: "#555" }}>×</span>
          <input
            type="number"
            min={1}
            max={4096}
            value={customH}
            onChange={(e) => setCustomH(Number(e.target.value) || 1)}
            title="Height"
            style={{
              flex: 1,
              minWidth: 0,
              height: 24,
              background: "#000",
              color: "#fff",
              border: "1px solid #555",
              fontFamily: "inherit",
              fontSize: 8,
              padding: "0 6px",
              outline: "none",
            }}
          />
        </div>
        <button
          type="button"
          onClick={() => {
            applyCanvasSize(customW, customH);
            setShowSizeSettings(false);
          }}
          style={{
            width: "100%",
            height: 26,
            border: "1px solid #555",
            background: "#000",
            color: "#ccc",
            fontFamily: "inherit",
            fontSize: 7,
            letterSpacing: 1,
            cursor: "pointer",
          }}
          title="Apply custom size to all frames (nearest-neighbor scale)"
        >
          APPLY SIZE
        </button>
        <div style={{ fontSize: 5, color: "#444", marginTop: 6, letterSpacing: 0.5, lineHeight: 1.4 }}>
          Scales all frames · nearest-neighbor · undoable
        </div>
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

      {Array.from({ length: frameCount }, (_, i) => {
        let isOnionPrev = false;
        let isOnionNext = false;
        if (!playing && onionEnabled && frameCount > 1 && i !== activeFrameIndex) {
          for (let d = 1; d <= ONION_RANGE; d++) {
            const prevOp = prevOpacities[d - 1] ?? 0;
            const nextOp = nextOpacities[d - 1] ?? 0;
            let prev = activeFrameIndex - d;
            if (prev < 0) prev = onionLoopWrap ? ((prev % frameCount) + frameCount) % frameCount : -1;
            let next = activeFrameIndex + d;
            if (next >= frameCount) next = onionLoopWrap ? next % frameCount : -1;
            if (prev === i && prevOp > 0.001) isOnionPrev = true;
            if (next === i && nextOp > 0.001) isOnionNext = true;
          }
        }
        return (
          <FrameThumbnail
            key={i}
            frame={compositeFrame(project.layers, i, project.width, project.height)}
            index={i}
            isActive={i === displayFrameIndex}
            onClick={() => { setPlaying(false); setActiveFrameIndex(i); }}
            spriteWidth={project.width}
            spriteHeight={project.height}
            isOnionPrev={isOnionPrev}
            isOnionNext={isOnionNext}
          />
        );
      })}
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

      {/* OS creative-bus handoff (SHOTLIST ↔ KoolDraw) */}
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
          <span style={{ letterSpacing: 2 }}>KOOLDRAW</span>
          <div className="flex gap-2 items-center">
            <span style={{ color: "#555" }}>FRM:{displayFrameIndex + 1}/{frameCount}</span>
            <span style={{ color: "#555" }}>
              SZ:{penSize} · OP:{Math.round(brush.opacity * 100)}
              {paletteMode === "indexed" ? " · IDX" : ""}
            </span>
            {activeTool === "dither" && (
              <span style={{ color: "#666" }}>DΦ:{ditherOx},{ditherOy}</span>
            )}

            {/* Size opens settings popup (not always visible in rail) */}
            <button
              type="button"
              style={headerBtn(showSizeSettings)}
              onClick={() => {
                setShowSizeSettings((v) => !v);
                setShowOnionOptions(false);
              }}
              title="Image size settings"
            >
              {project.width}×{project.height}
            </button>
            {/* Desktop header: onion + play always visible */}
            <button type="button" style={headerBtn(onionEnabled)} onClick={() => setOnionEnabled((v) => !v)} title="Onion Skin (O)">
              {onionEnabled ? "ONION" : "ONI"}
            </button>
            <button
              type="button"
              style={headerBtn(showOnionOptions)}
              onClick={() => {
                setShowOnionOptions((v) => !v);
                setShowSizeSettings(false);
              }}
              title="Onion Options"
            >
              OPT
            </button>
            <button type="button" style={headerBtn(playing)} onClick={togglePlayback} title="Play / Pause (P)">
              {playing ? "||" : ">"}
            </button>
          </div>
        </div>
      )}

      {/* Main workspace: L/R rails full height · canvas + timeline in the center column */}
      <div
        className="flex flex-1 overflow-hidden relative"
        style={{ minHeight: 0 }}
      >
        {!collapse && (
          <div
            className="flex flex-col border-r flex-shrink-0"
            style={{
              borderColor: "#1a1a1a",
              width: 116,
              alignSelf: "stretch",
              height: "100%",
              minHeight: 0,
              overflow: "hidden",
            }}
          >
            {toolsContent}
          </div>
        )}

        <div
          className="flex flex-col flex-1 overflow-hidden"
          style={{ minWidth: 0, minHeight: 0 }}
        >
          {/* Drawing area */}
          <div className="flex-1 relative overflow-hidden" style={{ minHeight: 0 }}>
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
              brush={brushForCanvas}
              ditherOx={ditherOx}
              ditherOy={ditherOy}
              ditherPattern={ditherPattern}
              zoom={zoom}
              onZoomChange={setZoom}
              onPixelsChanged={handlePixelsChanged}
              onStrokeBegin={handleStrokeBegin}
              onStrokeEnd={handleStrokeEnd}
              onUndo={undo}
              onRedo={redo}
              onColorPicked={handleColorPicked}
              onionSkin={onionSkin}
            />
            <CornerDismissLayer />
            {showOnionOptions && !collapse && (
              <div style={{ position: "absolute", top: 8, left: 8, zIndex: 40 }}>
                {onionOptionsContent}
              </div>
            )}
            {showSizeSettings && !collapse && (
              <div style={{ position: "absolute", top: 8, right: 8, zIndex: 40 }}>
                {sizeSettingsContent}
              </div>
            )}
            {collapse && (
              <>
                <div style={{ position: "absolute", bottom: 10, left: "50%", transform: "translateX(-50%)", display: "flex", gap: 8, zIndex: 42 }}>
                  <button type="button" style={mobileOnionBtn(onionEnabled)} onClick={(e) => { e.stopPropagation(); setOnionEnabled((v) => !v); }}>{onionEnabled ? "ON" : "ONI"}</button>
                  <button
                    type="button"
                    style={mobileOnionBtn(showOnionOptions)}
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowOnionOptions((v) => !v);
                      setShowSizeSettings(false);
                    }}
                  >
                    OPT
                  </button>
                  <button
                    type="button"
                    style={mobileOnionBtn(showSizeSettings)}
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowSizeSettings((v) => !v);
                      setShowOnionOptions(false);
                    }}
                  >
                    SIZE
                  </button>
                </div>
                {showOnionOptions && (
                  <div style={{ position: "absolute", bottom: 50, left: "50%", transform: "translateX(-50%)", zIndex: 43, maxWidth: "min(92vw, 240px)" }}>
                    {onionOptionsContent}
                  </div>
                )}
                {showSizeSettings && (
                  <div style={{ position: "absolute", bottom: 50, left: "50%", transform: "translateX(-50%)", zIndex: 43, maxWidth: "min(92vw, 240px)" }}>
                    {sizeSettingsContent}
                  </div>
                )}
              </>
            )}
          </div>

          {/* Timeline strip — between L/R rails, under canvas; drag handle to show/hide */}
          {!collapse && (
            <>
              <div
                role="separator"
                aria-orientation="horizontal"
                aria-label="Drag to resize animation timeline"
                title={
                  timelineHeight > 0
                    ? "Drag down to hide timeline · double-click to toggle"
                    : "Drag up to show timeline · double-click to expand"
                }
                onPointerDown={onTimelineHandlePointerDown}
                onPointerMove={onTimelineHandlePointerMove}
                onPointerUp={onTimelineHandlePointerUp}
                onPointerCancel={onTimelineHandlePointerUp}
                onDoubleClick={() =>
                  setTimelineHeight((h) => (h > 0 ? 0 : TIMELINE_DEFAULT))
                }
                style={{
                  flexShrink: 0,
                  height: 10,
                  cursor: "ns-resize",
                  touchAction: "none",
                  background: "#0a0a0a",
                  borderTop: "1px solid #333",
                  borderBottom: timelineHeight > 0 ? "1px solid #222" : "1px solid #333",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 6,
                  userSelect: "none",
                }}
              >
                <div
                  style={{
                    width: 36,
                    height: 3,
                    background: timelineHeight > 0 ? "#555" : "#ffff00",
                    borderRadius: 0,
                  }}
                />
                <span style={{ fontSize: 6, color: "#666", letterSpacing: 1 }}>
                  {timelineHeight > 0 ? "TIMELINE" : "TIMELINE · DRAG UP"}
                </span>
                <div
                  style={{
                    width: 36,
                    height: 3,
                    background: timelineHeight > 0 ? "#555" : "#ffff00",
                    borderRadius: 0,
                  }}
                />
              </div>
              {timelineHeight > 0 && (
                <div
                  className="flex items-center overflow-x-auto"
                  style={{
                    flexShrink: 0,
                    height: timelineHeight,
                    borderColor: "#1a1a1a",
                    background: "#000",
                    minHeight: 0,
                  }}
                >
                  {timelineContent}
                </div>
              )}
              <div
                className="flex items-center justify-between px-2 py-0.5 border-t flex-shrink-0"
                style={{ borderColor: "#1a1a1a", minHeight: 18 }}
              >
                <span style={{ fontSize: 7, color: "#555", letterSpacing: 1 }}>
                  ,/. frame · 2-tap undo · 3-tap redo · pinch/twist · P play
                </span>
                <span style={{ fontSize: 7, color: "#555" }}>☦</span>
              </div>
            </>
          )}
        </div>

        {!collapse && (
          <div
            className="flex flex-col border-l flex-shrink-0"
            style={{
              borderColor: "#1a1a1a",
              width: 120,
              alignSelf: "stretch",
              height: "100%",
              minHeight: 0,
              overflow: "hidden",
            }}
          >
            {sideContent}
          </div>
        )}

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
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowSizeSettings(true);
                    setShowOnionOptions(false);
                  }}
                  style={{
                    display: "block",
                    width: "100%",
                    textAlign: "left",
                    border: "1px solid #333",
                    background: showSizeSettings ? "#fff" : "#000",
                    color: showSizeSettings ? "#000" : "#aaa",
                    fontFamily: "inherit",
                    fontSize: 8,
                    padding: "3px 4px",
                    cursor: "pointer",
                    marginBottom: 4,
                  }}
                  title="Image size settings"
                >
                  {project.width}×{project.height} · SIZE…
                </button>
                <div>FRM {displayFrameIndex + 1}/{frameCount}</div>
                <div>SZ {penSize} · {activeTool.toUpperCase()}</div>
                {activeTool === "dither" && (
                  <div style={{ marginTop: 2 }}>DITHER Φ {ditherOx},{ditherOy}</div>
                )}
                <div style={{ marginTop: 4, color: onionEnabled ? "#b850ff" : "#555" }}>
                  ONION {onionEnabled ? "ON" : "OFF"}
                  {onionLoopWrap ? " · LOOP" : ""}
                </div>
                <div style={{ marginTop: 6 }}>, . frames · W first · O onion · H UI</div>
              </div>
            </CornerPanel>
          </>
        )}

        <VerticalChromeToggle corner="bottom-right" />
      </div>
    </div>
  );
}

/**
 * Vertical opacity column — drag up/down (Krita onion bar).
 * Past / future share a soft blue-grey fill; center (current) is full white, locked.
 */
function OnionVertBar({
  value,
  onChange,
  locked,
  side,
  title,
}: {
  value: number;
  onChange: (v: number) => void;
  locked?: boolean;
  side: "prev" | "next" | "current";
  title?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  // Krita uses one blue for all offset bars; center is the active frame.
  const fill = side === "current" ? "#f0f0f0" : "#7a9eb8";

  const setFromY = (clientY: number) => {
    if (locked) return;
    const el = ref.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const t = 1 - (clientY - rect.top) / Math.max(1, rect.height);
    onChange(Math.min(1, Math.max(0, t)));
  };

  return (
    <div
      ref={ref}
      title={title}
      onPointerDown={(e) => {
        if (locked) return;
        e.preventDefault();
        e.stopPropagation();
        (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
        setFromY(e.clientY);
      }}
      onPointerMove={(e) => {
        if (locked || e.buttons === 0) return;
        setFromY(e.clientY);
      }}
      style={{
        position: "relative",
        height: "100%",
        minWidth: 0,
        background: locked ? "#1e1e1e" : "#0c0c0c",
        border: locked ? "1px solid #3a3a3a" : "1px solid #222",
        cursor: locked ? "default" : "ns-resize",
        touchAction: "none",
        opacity: !locked && value < 0.001 ? 0.35 : 1,
      }}
    >
      {/* Fill grows from bottom (0% → empty, 100% → full) */}
      <div
        style={{
          position: "absolute",
          left: 1,
          right: 1,
          bottom: 0,
          height: `${Math.round(Math.min(1, Math.max(0, value)) * 100)}%`,
          background: fill,
          imageRendering: "pixelated",
          pointerEvents: "none",
        }}
      />
      {/* Floor line */}
      <div
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          bottom: 0,
          height: 1,
          background: "#333",
          pointerEvents: "none",
        }}
      />
    </div>
  );
}

/** Horizontal tint strength bar (0–100%) */
function OnionTintBar({
  value,
  onChange,
}: {
  value: number;
  onChange: (v: number) => void;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const setFromX = (clientX: number) => {
    const el = ref.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const t = (clientX - rect.left) / Math.max(1, rect.width);
    onChange(Math.min(1, Math.max(0, t)));
  };
  return (
    <div
      ref={ref}
      onPointerDown={(e) => {
        e.preventDefault();
        (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
        setFromX(e.clientX);
      }}
      onPointerMove={(e) => {
        if (e.buttons === 0) return;
        setFromX(e.clientX);
      }}
      style={{
        flex: 1,
        height: 14,
        border: "1px solid #444",
        background: "#0a0a0a",
        position: "relative",
        cursor: "ew-resize",
        touchAction: "none",
      }}
    >
      <div
        style={{
          position: "absolute",
          left: 0,
          top: 0,
          bottom: 0,
          width: `${Math.round(value * 100)}%`,
          background: "linear-gradient(90deg, #444 0%, #aaa 100%)",
        }}
      />
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
