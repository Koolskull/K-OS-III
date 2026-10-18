/*
 * KOOLDRAW — pixel art & animation
 * Freehand tools from @/lib/creative tool registry.
 * Cross-app handoffs via CreativeWorkflow (SHOTLIST ↔ etc.).
 */

"use client";

import React, { useState, useCallback, useRef, useEffect, useMemo } from "react";
import type { SpriteProject, SpriteLayer, ToolId, PackedColor, HistoryEntry } from "@/types/sprite";
import {
  createBlankSprite,
  createFrame,
  nextSpriteId,
  hexToPackedColor,
  packedColorToHex,
  compositeFrame,
  frameToCanvas,
  renderSpriteSheet,
  downloadCanvasAsPng,
  downloadFramesAsZip,
  downloadAnimationBundle,
  serializeProjectToBundleZip,
  loadProjectFromBundleZip,
  loadProjectFromDataUrl,
  dataUrlToMonoDataUrl,
  resizeProject,
  clampCanvasSize,
  clampPixelZoom,
  fitPixelZoom,
  CANVAS_SIZE_PRESETS,
  DITHER_PATTERNS,
  DEFAULT_DITHER_PATTERN,
  renderDitherToneSwatch,
  renderDitherGradientStripColor,
  INDEXED_PALETTE_PRESETS,
  DEFAULT_PRESSURE_CURVE,
  insertBlankExposure,
  duplicateExposure,
  reuseExposure,
  deleteExposure,
  moveExposure,
  moveLayer,
  deleteLayer,
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
import { Timeline, TimelineToolbar, type TimelineOrientation, type OnionMark } from "./Timeline";
import { LayerPanel } from "./LayerPanel";
import {
  CornerHost,
  CornerPanel,
  VerticalChromeToggle,
  CornerDismissLayer,
  useCornerChromeOptional,
} from "@/components/ui/CornerChrome";
import { PixelKnob } from "@/components/ui/PixelKnob";
import { PixelColorPicker } from "@/components/ui/PixelColorPicker";
import { HAS_BACKEND } from "@/lib/buildFlags";

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
  /** Auto-load this saved project on mount — e.g. "EDIT DRAWING" from PRODEV/Shotlist. */
  launchProjectId?: number;
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

/** Deep-clone every layer's pool + exposures so a pushed history entry is immune to later in-place edits. */
function snapshotLayers(layers: SpriteLayer[]): SpriteLayer[] {
  return layers.map((layer) => ({
    ...layer,
    frames: layer.frames.map((f) => ({ ...f, pixels: new Uint32Array(f.pixels) })),
    exposures: [...layer.exposures],
  }));
}

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

export function KoolDrawApp({ isFocused, embeddedMode, launchProjectId }: KoolDrawAppProps) {
  return (
    <CornerHost storageKey="kos-kooldraw-chrome" style={{ backgroundColor: "#000" }}>
      <KoolDrawInner isFocused={isFocused} embeddedMode={embeddedMode} launchProjectId={launchProjectId} />
    </CornerHost>
  );
}

function KoolDrawInner({ isFocused, embeddedMode, launchProjectId }: KoolDrawAppProps) {
  const chrome = useCornerChromeOptional();
  const isNarrow = chrome?.isNarrow ?? false;
  const uiHidden = chrome?.uiHidden ?? false;
  const collapse = isNarrow || uiHidden;

  const workflow = useCreativeWorkflow();
  const handoff = workflow.sessionFor("kooldraw");

  const [project, setProject] = useState<SpriteProject>(() =>
    createBlankSprite("SPRITE", embeddedMode?.initialWidth ?? 32, embeddedMode?.initialHeight ?? 32),
  );
  /** Mandatory name+size prompt before drawing — skipped when arriving via a handoff/embed/deep-link, which already have their own naming/sizing context. */
  const [needsSetup, setNeedsSetup] = useState(() => !embeddedMode && !handoff && launchProjectId == null);

  /* ---- Persistence (Postgres save/load) ---- */
  const [serverProjectId, setServerProjectId] = useState<number | null>(null);
  const [savingProject, setSavingProject] = useState(false);
  const [savedProjects, setSavedProjects] = useState<
    Array<{ id: number; name: string; width: number; height: number; updated_at: string }>
  >([]);
  const [loadingSavedProjects, setLoadingSavedProjects] = useState(false);
  const [showOpenExisting, setShowOpenExisting] = useState(false);
  const [setupName, setSetupName] = useState("");
  const [setupW, setSetupW] = useState(32);
  const [setupH, setSetupH] = useState(32);
  const [handoffReady, setHandoffReady] = useState(true);
  const [activeTool, setActiveTool] = useState<ToolId>("pen");
  const [primaryColor, setPrimaryColor] = useState<PackedColor>(hexToPackedColor("#ffffff"));
  const [penSize, setPenSize] = useState(1);
  const [brush, setBrush] = useState<BrushSettings>(() => ({
    ...DEFAULT_BRUSH,
    maxSize: 1,
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
  /** Manual density (Shotlist-style tone bar) — overrides pressure-based coverage. */
  const [ditherCoverage, setDitherCoverage] = useState(0.5);
  /** Paint both dither colors instead of ink-only density over existing content. */
  const [ditherTwoTone, setDitherTwoTone] = useState(false);
  const [ditherColorB, setDitherColorB] = useState<PackedColor>(hexToPackedColor("#000000"));
  const [showDitherColorB, setShowDitherColorB] = useState(false);

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
  /**
   * "auto" follows the window's own aspect ratio live: taller-than-wide →
   * horizontal filmstrip at the bottom; wider-than-tall → vertical X-Sheet
   * grid in a thin right-side column. The header button cycles
   * auto → horizontal → vertical → auto, pinning an explicit choice until
   * cycled back to auto. Persisted like CornerHost's zen state.
   */
  const [timelineOrientationMode, setTimelineOrientationMode] = useState<
    TimelineOrientation | "auto"
  >(() => {
    if (typeof window === "undefined") return "auto";
    const saved = window.localStorage.getItem("kos-kooldraw-timeline-orientation");
    return saved === "vertical" || saved === "horizontal" ? saved : "auto";
  });
  useEffect(() => {
    if (typeof window === "undefined") return;
    window.localStorage.setItem("kos-kooldraw-timeline-orientation", timelineOrientationMode);
  }, [timelineOrientationMode]);

  const rootRef = useRef<HTMLDivElement>(null);
  const [isWideWindow, setIsWideWindow] = useState(true);
  useEffect(() => {
    const el = rootRef.current;
    if (!el || typeof ResizeObserver === "undefined") return;
    const update = () => setIsWideWindow(el.clientWidth >= el.clientHeight);
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const timelineOrientation: TimelineOrientation =
    timelineOrientationMode === "auto"
      ? isWideWindow
        ? "vertical"
        : "horizontal"
      : timelineOrientationMode;

  const cycleTimelineOrientationMode = useCallback(() => {
    setTimelineOrientationMode((m) =>
      m === "auto" ? "horizontal" : m === "horizontal" ? "vertical" : "auto",
    );
  }, []);

  /** Vertical X-Sheet column width — drag handle on its left edge. */
  const XSHEET_MIN = 140;
  const XSHEET_MAX = 420;
  const XSHEET_DEFAULT = 200;
  const [xsheetWidth, setXsheetWidth] = useState(XSHEET_DEFAULT);
  const xsheetDragRef = useRef<{ startX: number; startW: number } | null>(null);

  const onXsheetHandlePointerDown = useCallback(
    (e: React.PointerEvent) => {
      e.preventDefault();
      e.currentTarget.setPointerCapture(e.pointerId);
      xsheetDragRef.current = { startX: e.clientX, startW: xsheetWidth };
    },
    [xsheetWidth],
  );

  const onXsheetHandlePointerMove = useCallback((e: React.PointerEvent) => {
    const drag = xsheetDragRef.current;
    if (!drag) return;
    // Column is on the right edge — dragging left (toward canvas) widens it.
    const dx = drag.startX - e.clientX;
    const next = Math.min(XSHEET_MAX, Math.max(XSHEET_MIN, drag.startW + dx));
    setXsheetWidth(next);
  }, []);

  const onXsheetHandlePointerUp = useCallback((e: React.PointerEvent) => {
    xsheetDragRef.current = null;
    try {
      e.currentTarget.releasePointerCapture(e.pointerId);
    } catch {
      /* ignore */
    }
  }, []);

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
      if (handoff.xsheetSnapshot) setTimelineOrientationMode("vertical");
      // Baseline entry so undo can return to the freshly-loaded state, but no further.
      historyRef.current = [{ layers: snapshotLayers(proj.layers), activeFrameIndex: 0, activeLayerIndex: 0 }];
      historyIndexRef.current = 0;
      setNeedsSetup(false);
      setHandoffReady(true);
      forceRender();
    })();
    return () => {
      cancelled = true;
    };
  }, [handoff?.id, embeddedMode, forceRender, handoff]);

  const loadProjectById = useCallback(
    async (id: number) => {
      const res = await fetch(`/api/kooldraw/projects/${id}`);
      if (!res.ok) return;
      const blob = await res.blob();
      const proj = await loadProjectFromBundleZip(blob);
      setProject(proj);
      setServerProjectId(id);
      setActiveFrameIndex(0);
      setActiveLayerIndex(0);
      setZoom(clampPixelZoom(fitPixelZoom(proj.width, proj.height, 720, 520)));
      historyRef.current = [{ layers: snapshotLayers(proj.layers), activeFrameIndex: 0, activeLayerIndex: 0 }];
      historyIndexRef.current = 0;
      setNeedsSetup(false);
      setShowOpenExisting(false);
      forceRender();
    },
    [forceRender],
  );

  useEffect(() => {
    if (launchProjectId != null) loadProjectById(launchProjectId);
    // Only re-run when the launch target itself changes; loadProjectById is stable enough in practice.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [launchProjectId]);

  const loadSavedProjectsList = useCallback(async () => {
    setLoadingSavedProjects(true);
    const res = await fetch("/api/kooldraw/projects");
    if (res.ok) setSavedProjects(await res.json());
    setLoadingSavedProjects(false);
  }, []);

  const exportCurrentDataUrl = useCallback(() => {
    return frameToCanvas(
      compositeFrame(project.layers, activeFrameIndex, project.width, project.height),
      1,
    ).toDataURL("image/png");
  }, [project, activeFrameIndex]);

  const saveProject = useCallback(
    async (asNew: boolean) => {
      setSavingProject(true);
      try {
        const zipBlob = await serializeProjectToBundleZip(project, 1);
        const thumbnail = exportCurrentDataUrl();
        const form = new FormData();
        form.set("file", zipBlob, "project.zip");
        form.set("name", project.name || "UNTITLED");
        form.set("width", String(project.width));
        form.set("height", String(project.height));
        form.set("thumbnail", thumbnail);

        const targetId = asNew ? null : serverProjectId;
        const res = targetId != null
          ? await fetch(`/api/kooldraw/projects/${targetId}`, { method: "PUT", body: form })
          : await fetch("/api/kooldraw/projects", { method: "POST", body: form });
        if (res.ok) {
          const saved = await res.json();
          setServerProjectId(saved.id);
        }
      } finally {
        setSavingProject(false);
      }
    },
    [project, serverProjectId, exportCurrentDataUrl],
  );

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

  const pingPongDirRef = useRef<1 | -1>(1);

  const togglePlayback = useCallback(() => {
    setPlaying((p) => {
      if (!p) {
        setPreviewFrame(activeFrameIndex);
        pingPongDirRef.current = 1;
      }
      return !p;
    });
  }, [activeFrameIndex]);

  /**
   * Push a POST-edit checkpoint (not pre-edit — the history pointer always
   * tracks the currently-displayed state, so undo/redo can step one entry
   * at a time). Takes explicit values rather than reading `project` via
   * closure so callers can compute the next state once and use it for both
   * `setProject` and this push, without the staleness/StrictMode-double-
   * invoke risk of pushing from inside a `setProject` updater function.
   */
  const pushHistorySnapshot = useCallback(
    (layers: SpriteLayer[], afi: number, ali: number) => {
      const entry: HistoryEntry = {
        layers: snapshotLayers(layers),
        activeFrameIndex: afi,
        activeLayerIndex: ali,
      };
      historyRef.current = historyRef.current.slice(0, historyIndexRef.current + 1);
      historyRef.current.push(entry);
      if (historyRef.current.length > MAX_HISTORY) historyRef.current.shift();
      historyIndexRef.current = historyRef.current.length - 1;
    },
    [],
  );

  /** Seed the undo baseline once, from the sprite's true initial state. */
  useEffect(() => {
    historyRef.current = [{ layers: snapshotLayers(project.layers), activeFrameIndex: 0, activeLayerIndex: 0 }];
    historyIndexRef.current = 0;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const applyHistoryEntry = useCallback((entry: HistoryEntry) => {
    setProject((prev) => ({ ...prev, layers: snapshotLayers(entry.layers) }));
    setActiveFrameIndex(entry.activeFrameIndex);
    setActiveLayerIndex(entry.activeLayerIndex);
    forceRender();
  }, [forceRender]);

  const undo = useCallback(() => {
    if (historyIndexRef.current <= 0) return;
    historyIndexRef.current--;
    const entry = historyRef.current[historyIndexRef.current];
    if (entry) applyHistoryEntry(entry);
  }, [applyHistoryEntry]);

  const redo = useCallback(() => {
    if (historyIndexRef.current >= historyRef.current.length - 1) return;
    historyIndexRef.current++;
    const entry = historyRef.current[historyIndexRef.current];
    if (entry) applyHistoryEntry(entry);
  }, [applyHistoryEntry]);

  /** Discrete edits (fill, shape commit) — SpriteCanvas has already mutated pixels by the time this fires, so this captures the post-edit state. */
  const handlePixelsChanged = useCallback(() => {
    pushHistorySnapshot(project.layers, activeFrameIndex, activeLayerIndex);
    forceRender();
  }, [pushHistorySnapshot, project.layers, activeFrameIndex, activeLayerIndex, forceRender]);

  /** Freehand strokes push their checkpoint at stroke END (post-edit) — nothing needed at stroke start. */
  const handleStrokeBegin = useCallback(() => {}, []);

  const handleStrokeEnd = useCallback(() => {
    pushHistorySnapshot(project.layers, activeFrameIndex, activeLayerIndex);
    forceRender();
  }, [pushHistorySnapshot, project.layers, activeFrameIndex, activeLayerIndex, forceRender]);

  const insertBlankFrame = useCallback(() => {
    const nextLayers = insertBlankExposure(project.layers, activeFrameIndex, project.width, project.height);
    const nextFrameIndex = activeFrameIndex + 1;
    setProject((prev) => ({ ...prev, layers: nextLayers }));
    pushHistorySnapshot(nextLayers, nextFrameIndex, activeLayerIndex);
    setActiveFrameIndex(nextFrameIndex);
  }, [project.layers, project.width, project.height, activeFrameIndex, activeLayerIndex, pushHistorySnapshot]);

  const duplicateFrame = useCallback(() => {
    const nextLayers = duplicateExposure(project.layers, activeFrameIndex);
    const nextFrameIndex = activeFrameIndex + 1;
    setProject((prev) => ({ ...prev, layers: nextLayers }));
    pushHistorySnapshot(nextLayers, nextFrameIndex, activeLayerIndex);
    setActiveFrameIndex(nextFrameIndex);
  }, [project.layers, activeFrameIndex, activeLayerIndex, pushHistorySnapshot]);

  const deleteFrame = useCallback(() => {
    if ((project.layers[0]?.exposures.length ?? 0) <= 1) return;
    const nextLayers = deleteExposure(project.layers, activeFrameIndex);
    const nextFrameIndex = Math.max(0, activeFrameIndex - 1);
    setProject((prev) => ({ ...prev, layers: nextLayers }));
    pushHistorySnapshot(nextLayers, nextFrameIndex, activeLayerIndex);
    setActiveFrameIndex(nextFrameIndex);
  }, [project.layers, activeFrameIndex, activeLayerIndex, pushHistorySnapshot]);

  const reorderFrame = useCallback(
    (from: number, to: number) => {
      const nextLayers = moveExposure(project.layers, from, to);
      setProject((prev) => ({ ...prev, layers: nextLayers }));
      pushHistorySnapshot(nextLayers, to, activeLayerIndex);
      setActiveFrameIndex(to);
    },
    [project.layers, activeLayerIndex, pushHistorySnapshot],
  );

  /** Point the active layer's active slot at an existing pool frame — reuse, not a new copy. */
  const reuseFrame = useCallback(
    (hexId: string) => {
      const nextLayers = project.layers.map((layer, i) =>
        i === activeLayerIndex ? reuseExposure(layer, activeFrameIndex, hexId) : layer,
      );
      setProject((prev) => ({ ...prev, layers: nextLayers }));
      pushHistorySnapshot(nextLayers, activeFrameIndex, activeLayerIndex);
      forceRender();
    },
    [project.layers, activeLayerIndex, activeFrameIndex, pushHistorySnapshot, forceRender],
  );

  const addLayer = useCallback(() => {
    const count = project.layers[0]?.exposures.length ?? 1;
    // A fresh layer starts blank everywhere via ONE reused pool frame across
    // every position, rather than N separate blank frame objects.
    const hexId = "000";
    const newLayer: SpriteLayer = {
      id: nextSpriteId(),
      name: `LAYER ${project.layers.length + 1}`,
      opacity: 1,
      visible: true,
      frames: [createFrame(nextSpriteId(), project.width, project.height, hexId)],
      exposures: Array.from({ length: count }, () => hexId),
    };
    const nextLayers = [...project.layers, newLayer];
    const nextLayerIndex = project.layers.length;
    setProject((prev) => ({ ...prev, layers: nextLayers }));
    pushHistorySnapshot(nextLayers, activeFrameIndex, nextLayerIndex);
    setActiveLayerIndex(nextLayerIndex);
  }, [project.layers, activeFrameIndex, pushHistorySnapshot]);

  const toggleLayerVisibility = useCallback((idx: number) => {
    setProject((prev) => ({
      ...prev,
      layers: prev.layers.map((l, i) => (i === idx ? { ...l, visible: !l.visible } : l)),
    }));
    forceRender();
  }, [forceRender]);

  const handleDeleteLayer = useCallback(
    (index: number) => {
      if (project.layers.length <= 1) return;
      const nextLayers = deleteLayer(project.layers, index);
      const nextLayerIndex = Math.min(activeLayerIndex, project.layers.length - 2);
      setProject((prev) => ({ ...prev, layers: nextLayers }));
      pushHistorySnapshot(nextLayers, activeFrameIndex, nextLayerIndex);
      setActiveLayerIndex(nextLayerIndex);
    },
    [project.layers, activeFrameIndex, activeLayerIndex, pushHistorySnapshot],
  );

  const handleReorderLayer = useCallback(
    (from: number, to: number) => {
      const nextLayers = moveLayer(project.layers, from, to);
      setProject((prev) => ({ ...prev, layers: nextLayers }));
      pushHistorySnapshot(nextLayers, activeFrameIndex, to);
      setActiveLayerIndex(to);
    },
    [project.layers, activeFrameIndex, pushHistorySnapshot],
  );

  const handleRenameLayer = useCallback(
    (index: number, name: string) => {
      const nextLayers = project.layers.map((l, i) => (i === index ? { ...l, name } : l));
      setProject((prev) => ({ ...prev, layers: nextLayers }));
      pushHistorySnapshot(nextLayers, activeFrameIndex, activeLayerIndex);
    },
    [project.layers, activeFrameIndex, activeLayerIndex, pushHistorySnapshot],
  );

  /** Continuous drag control — not undo-tracked, same as other live settings (pen size, zoom). */
  const handleLayerOpacity = useCallback((index: number, opacity: number) => {
    setProject((prev) => ({
      ...prev,
      layers: prev.layers.map((l, i) => (i === index ? { ...l, opacity } : l)),
    }));
    forceRender();
  }, [forceRender]);

  useEffect(() => {
    if (!isFocused) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement || e.target instanceof HTMLSelectElement) {
        return;
      }
      if (e.ctrlKey || e.metaKey) {
        const k = e.key.toLowerCase();
        if (k === "z") { e.preventDefault(); undo(); return; }
        if (k === "y") { e.preventDefault(); redo(); return; }
      }
      // Shift+F/Shift+D checked before tool-hotkey matching below — bare "D"
      // is the dither tool's key, and e.key.toLowerCase() doesn't care about
      // Shift, so these must win first or Shift+D would silently switch tools.
      if (e.shiftKey && !e.ctrlKey && !e.metaKey && !e.altKey) {
        if (e.key.toLowerCase() === "f") { e.preventDefault(); insertBlankFrame(); return; }
        if (e.key.toLowerCase() === "d") { e.preventDefault(); duplicateFrame(); return; }
      }
      const count = project.layers[0]?.exposures.length ?? 1;
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
  }, [isFocused, undo, redo, togglePlayback, project.layers, insertBlankFrame, duplicateFrame]);

  useEffect(() => {
    if (!playing) return;
    const count = project.layers[0]?.exposures.length ?? 1;
    const mode = project.loopMode;
    const interval = setInterval(() => {
      setPreviewFrame((f) => {
        if (count <= 1) return 0;
        switch (mode) {
          case "oneshot": {
            const next = f + 1;
            if (next >= count) {
              setPlaying(false);
              return count - 1;
            }
            return next;
          }
          case "pingpong": {
            let next = f + pingPongDirRef.current;
            if (next >= count) {
              pingPongDirRef.current = -1;
              next = Math.max(0, count - 2);
            } else if (next < 0) {
              pingPongDirRef.current = 1;
              next = count > 1 ? 1 : 0;
            }
            return next;
          }
          case "random": {
            let next = Math.floor(Math.random() * count);
            if (next === f) next = (next + 1) % count;
            return next;
          }
          case "loop":
          default:
            return (f + 1) % count;
        }
      });
    }, 1000 / Math.max(1, project.fps));
    return () => clearInterval(interval);
  }, [playing, project.fps, project.layers, project.loopMode]);

  const exportSpriteSheet = useCallback(() => {
    downloadCanvasAsPng(renderSpriteSheet(project, project.layers[0]?.exposures.length ?? 1, 1), `${project.name}_sheet.png`);
  }, [project]);

  const exportFrames = useCallback(() => { downloadFramesAsZip(project, 1); }, [project]);
  const exportBundle = useCallback(() => { void downloadAnimationBundle(project, 1); }, [project]);
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
      const resized = resizeProject(project, nw, nh);
      setProject(resized);
      pushHistorySnapshot(resized.layers, activeFrameIndex, activeLayerIndex);
      // Fit large plates into the view (sub-1× zoom allowed)
      setZoom(clampPixelZoom(fitPixelZoom(nw, nh, 720, 520)));
      forceRender();
    },
    [project, activeFrameIndex, activeLayerIndex, pushHistorySnapshot, forceRender],
  );

  const frameCount = project.layers[0]?.exposures.length ?? 1;
  const displayFrameIndex = playing ? previewFrame : activeFrameIndex;

  /** Onion-skin prev/next tint per timeline position, precomputed once for the Timeline strip. */
  const onionMarks: OnionMark[] | undefined = useMemo(() => {
    if (playing || !onionEnabled || frameCount <= 1) return undefined;
    const marks: OnionMark[] = Array.from({ length: frameCount }, () => ({ isPrev: false, isNext: false }));
    for (let d = 1; d <= ONION_RANGE; d++) {
      const prevOp = prevOpacities[d - 1] ?? 0;
      const nextOp = nextOpacities[d - 1] ?? 0;
      let prev = activeFrameIndex - d;
      if (prev < 0) prev = onionLoopWrap ? ((prev % frameCount) + frameCount) % frameCount : -1;
      let next = activeFrameIndex + d;
      if (next >= frameCount) next = onionLoopWrap ? next % frameCount : -1;
      if (prev >= 0 && prev !== activeFrameIndex && prevOp > 0.001) marks[prev]!.isPrev = true;
      if (next >= 0 && next !== activeFrameIndex && nextOp > 0.001) marks[next]!.isNext = true;
    }
    return marks;
  }, [playing, onionEnabled, frameCount, activeFrameIndex, prevOpacities, nextOpacities, onionLoopWrap]);

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
  const ditherColorBContent = (
    <div
      style={{
        padding: 0,
        backgroundColor: "#1a1a1a",
        border: "1px solid #555",
        width: "min(92vw, 160px)",
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
        <span style={{ fontSize: 8, color: "#ddd", letterSpacing: 1 }}>DITHER COLOR B</span>
        <button
          type="button"
          onClick={() => setShowDitherColorB(false)}
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
        <PixelColorPicker
          value={packedColorToHex(ditherColorB)}
          onChange={(hex) => setDitherColorB(hexToPackedColor(hex))}
          width={128}
        />
      </div>
    </div>
  );

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
        <div style={{ borderTop: "1px solid #333", padding: 4, display: "flex", flexDirection: "column", gap: 4 }}>
          {/* Tone bar + kernel swatches — same visual language as Shotlist's dither panel */}
          <div style={{ display: "flex", gap: 3, height: 108 }}>
            <DitherToneBar
              coverage={ditherCoverage}
              onChange={setDitherCoverage}
              pattern={ditherPattern}
              colorA={primaryColor}
              colorB={ditherColorB}
              ox={ditherOx}
              oy={ditherOy}
              width={22}
            />
            <div style={{ display: "flex", flexDirection: "column", gap: 2, flex: 1, minWidth: 0 }}>
              {DITHER_PATTERNS.map((p) => (
                <DitherSwatchButton
                  key={p.id}
                  pattern={p.id}
                  active={ditherPattern === p.id}
                  coverage={ditherCoverage}
                  colorA={primaryColor}
                  colorB={ditherColorB}
                  ox={ditherOx}
                  oy={ditherOy}
                  onClick={() => setDitherPattern(p.id)}
                  title={p.title}
                />
              ))}
            </div>
          </div>
          <div style={{ textAlign: "center", fontSize: 6, color: "#666", letterSpacing: 1 }}>
            {Math.round(ditherCoverage * 100)}% TONE
          </div>

          <div style={grid4}>
            <button type="button" onClick={() => setDitherOx((v) => (v + 1) % 8)} style={toolBtn(false)} title="Dither phase X">
              OX {ditherOx}
            </button>
            <button type="button" onClick={() => setDitherOy((v) => (v + 1) % 8)} style={toolBtn(false)} title="Dither phase Y">
              OY {ditherOy}
            </button>
            <button
              type="button"
              disabled
              style={{ ...toolBtn(false), backgroundColor: packedColorToHex(primaryColor), color: "#fff", textShadow: "0 0 2px #000, 0 0 2px #000", cursor: "default" }}
              title="Color A = current brush color"
            >
              A
            </button>
            <button
              type="button"
              onClick={() => setShowDitherColorB((v) => !v)}
              style={{
                ...toolBtn(false),
                backgroundColor: packedColorToHex(ditherColorB),
                border: showDitherColorB ? "1px solid #00ff00" : "1px solid #333",
                color: "#fff",
                textShadow: "0 0 2px #000, 0 0 2px #000",
              }}
              title="Dither color B"
            >
              B
            </button>
          </div>

          <button
            type="button"
            onClick={() => setDitherTwoTone((v) => !v)}
            style={{ ...toolBtn(ditherTwoTone), width: "100%" }}
            title="Paint both A and B colors (instead of A-density over existing content)"
          >
            {ditherTwoTone ? "A+B TWO-TONE" : "A ONLY (DENSITY)"}
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
        <div style={{ marginTop: 3 }}>
          <span style={{ fontSize: 7, color: "#555", display: "block", marginBottom: 2 }}>LOOP</span>
          <div style={{ ...grid4, border: "1px solid #333" }}>
            {(
              [
                { id: "oneshot", label: "1×" },
                { id: "loop", label: "LOOP" },
                { id: "pingpong", label: "PING" },
                { id: "random", label: "RND" },
              ] as const
            ).map((m) => (
              <button
                key={m.id}
                type="button"
                onClick={() => setProject((p) => ({ ...p, loopMode: m.id }))}
                style={{ ...toolBtn(project.loopMode === m.id), fontSize: 5 }}
                title={`Loop mode: ${m.label}`}
              >
                {m.label}
              </button>
            ))}
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
      <LayerPanel
        layers={project.layers}
        activeLayerIndex={activeLayerIndex}
        onSelect={setActiveLayerIndex}
        onToggleVisibility={toggleLayerVisibility}
        onAdd={addLayer}
        onDelete={handleDeleteLayer}
        onRename={handleRenameLayer}
        onOpacityChange={handleLayerOpacity}
        onReorder={handleReorderLayer}
      />
      {HAS_BACKEND && (
        <div className="border-t" style={{ borderColor: "#1a1a1a", padding: 4 }}>
          <span style={{ fontSize: 7, color: "#888", letterSpacing: 1, display: "block", marginBottom: 2 }}>PROJECT</span>
          <button
            onClick={() => saveProject(false)}
            disabled={savingProject}
            style={{ width: "100%", height: 20, border: "1px solid #333", background: "#000", color: "#888", fontFamily: "var(--dm-font-primary)", fontSize: 7, cursor: "pointer", marginBottom: 2 }}
          >
            {savingProject ? "SAVING…" : serverProjectId != null ? "SAVE" : "SAVE PROJECT"}
          </button>
          {serverProjectId != null && (
            <button
              onClick={() => saveProject(true)}
              disabled={savingProject}
              style={{ width: "100%", height: 20, border: "1px solid #333", background: "#000", color: "#888", fontFamily: "var(--dm-font-primary)", fontSize: 7, cursor: "pointer", marginBottom: 2 }}
            >
              SAVE AS NEW
            </button>
          )}
        </div>
      )}
      <div className="border-t" style={{ borderColor: "#1a1a1a", padding: 4 }}>
        <span style={{ fontSize: 7, color: "#888", letterSpacing: 1, display: "block", marginBottom: 2 }}>EXPORT</span>
        <button onClick={exportFrames} style={{ width: "100%", height: 20, border: "1px solid #333", background: "#000", color: "#888", fontFamily: "var(--dm-font-primary)", fontSize: 7, cursor: "pointer", marginBottom: 2 }}>PNG ZIP</button>
        <button onClick={exportSpriteSheet} style={{ width: "100%", height: 20, border: "1px solid #333", background: "#000", color: "#888", fontFamily: "var(--dm-font-primary)", fontSize: 7, cursor: "pointer", marginBottom: 2 }}>SHEET</button>
        <button onClick={exportBundle} title="Export hex-named PNGs per layer + JSON playback manifest" style={{ width: "100%", height: 20, border: "1px solid #333", background: "#000", color: "#888", fontFamily: "var(--dm-font-primary)", fontSize: 7, cursor: "pointer" }}>BUNDLE</button>
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
    <Timeline
      layers={project.layers}
      activeLayerIndex={activeLayerIndex}
      activeFrameIndex={activeFrameIndex}
      displayFrameIndex={displayFrameIndex}
      spriteWidth={project.width}
      spriteHeight={project.height}
      playing={playing}
      orientation={timelineOrientation}
      renderTick={renderTick}
      xsheetSnapshot={handoff?.xsheetSnapshot}
      onionMarks={onionMarks}
      onSelectFrame={(i) => { setPlaying(false); setActiveFrameIndex(i); }}
      onSelectLayer={setActiveLayerIndex}
      onTogglePlayback={togglePlayback}
      onInsertBlank={insertBlankFrame}
      onDuplicate={duplicateFrame}
      onDelete={deleteFrame}
      onReorder={reorderFrame}
      onReuse={reuseFrame}
    />
  );

  const setupModal = needsSetup ? (
    <div
      style={{
        position: "absolute",
        inset: 0,
        zIndex: 100,
        background: "rgba(0,0,0,0.96)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 16,
      }}
    >
      <div
        style={{
          padding: 0,
          backgroundColor: "#1a1a1a",
          border: "1px solid #555",
          width: "min(92vw, 280px)",
          fontFamily: "var(--dm-font-primary)",
          imageRendering: "pixelated",
          boxShadow: "4px 4px 0 #000",
        }}
      >
        <div
          style={{
            padding: "5px 8px",
            borderBottom: "1px solid #333",
            background: "#222",
          }}
        >
          <span style={{ fontSize: 8, color: "#00ff00", letterSpacing: 1 }}>NEW ANIMATION</span>
        </div>

        <div style={{ padding: 8 }}>
          <div style={{ fontSize: 6, color: "#555", letterSpacing: 1, marginBottom: 3 }}>
            NAME
          </div>
          <input
            type="text"
            value={setupName}
            onChange={(e) => setSetupName(e.target.value)}
            placeholder="UNTITLED"
            autoFocus
            style={{
              width: "100%",
              height: 26,
              background: "#000",
              color: "#fff",
              border: "1px solid #555",
              fontFamily: "inherit",
              fontSize: 9,
              padding: "0 6px",
              outline: "none",
              marginBottom: 10,
              boxSizing: "border-box",
            }}
          />

          <div style={{ fontSize: 6, color: "#555", letterSpacing: 1, marginBottom: 3 }}>
            SIZE — PRESETS
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
              const on = setupW === p.w && setupH === p.h;
              return (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => {
                    setSetupW(p.w);
                    setSetupH(p.h);
                  }}
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
          <div style={{ display: "flex", gap: 4, alignItems: "center", marginBottom: 14 }}>
            <input
              type="number"
              min={1}
              max={4096}
              value={setupW}
              onChange={(e) => setSetupW(Number(e.target.value) || 1)}
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
              value={setupH}
              onChange={(e) => setSetupH(Number(e.target.value) || 1)}
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
              const name = setupName.trim() || "UNTITLED";
              applyCanvasSize(setupW, setupH);
              setProject((p) => ({ ...p, name }));
              setNeedsSetup(false);
            }}
            style={{
              width: "100%",
              height: 28,
              border: "1px solid #00ff00",
              background: "#00ff00",
              color: "#000",
              fontFamily: "inherit",
              fontSize: 8,
              letterSpacing: 1,
              cursor: "pointer",
            }}
          >
            START DRAWING
          </button>

          {HAS_BACKEND && (
            <>
              <button
                type="button"
                onClick={() => {
                  const next = !showOpenExisting;
                  setShowOpenExisting(next);
                  if (next) loadSavedProjectsList();
                }}
                style={{
                  width: "100%",
                  height: 22,
                  marginTop: 6,
                  border: "1px solid #555",
                  background: "#000",
                  color: "#888",
                  fontFamily: "inherit",
                  fontSize: 7,
                  letterSpacing: 1,
                  cursor: "pointer",
                }}
              >
                {showOpenExisting ? "▾ HIDE SAVED PROJECTS" : "▸ OPEN EXISTING PROJECT"}
              </button>

              {showOpenExisting && (
                <div style={{ marginTop: 6, maxHeight: 140, overflowY: "auto", border: "1px solid #333" }}>
                  {loadingSavedProjects ? (
                    <div style={{ fontSize: 7, color: "#666", padding: 6 }}>LOADING…</div>
                  ) : savedProjects.length === 0 ? (
                    <div style={{ fontSize: 7, color: "#666", padding: 6 }}>NO SAVED PROJECTS YET.</div>
                  ) : (
                    savedProjects.map((p) => (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => loadProjectById(p.id)}
                        style={{
                          display: "block",
                          width: "100%",
                          textAlign: "left",
                          padding: "4px 6px",
                          border: "none",
                          borderBottom: "1px solid #1a1a1a",
                          background: "transparent",
                          color: "#ccc",
                          fontFamily: "inherit",
                          fontSize: 7,
                          cursor: "pointer",
                        }}
                      >
                        {p.name} — {p.width}×{p.height}
                      </button>
                    ))
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  ) : null;

  return (
    <div ref={rootRef} className="w-full h-full flex flex-col overflow-hidden" style={{ backgroundColor: "#000", fontFamily: "var(--dm-font-primary)", fontSize: 9, imageRendering: "pixelated", color: "#fff", position: "relative" }}>
      {setupModal}
      {embeddedMode ? (
        <div className="flex items-center justify-between px-2 py-1 border-b-2 flex-shrink-0" style={{ borderColor: "#00ff00", backgroundColor: "#222200", minHeight: 22 }}>
          <span style={{ color: "#00ff00", letterSpacing: 2 }}>{embeddedMode.title ?? "DRAWING FOR INSTRUMENT VISUAL"}</span>
          <div className="flex gap-2">
            <button onClick={() => embeddedMode.onUse(exportCurrentDataUrl())} style={{ background: "#00ff00", color: "#000", border: "1px solid #000", fontFamily: "monospace", fontSize: 10, padding: "1px 6px", cursor: "pointer" }}>USE THIS SPRITE</button>
            <button onClick={() => embeddedMode.onCancel()} style={{ background: "#000", color: "#fff", border: "1px solid #fff", fontFamily: "monospace", fontSize: 10, padding: "1px 6px", cursor: "pointer" }}>CANCEL</button>
          </div>
        </div>
      ) : null}

      {/* OS creative-bus handoff (SHOTLIST ↔ KoolDraw) */}
      {!embeddedMode && handoff ? (
        <div
          className="flex items-center justify-between px-2 py-1 border-b-2 flex-shrink-0 flex-wrap gap-2"
          style={{ borderColor: "#00ff00", backgroundColor: "#222200", minHeight: 22 }}
        >
          <span style={{ color: "#00ff00", letterSpacing: 1, fontSize: 10 }}>
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
                background: "#00ff00",
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
            <button
              type="button"
              style={headerBtn(timelineOrientationMode !== "auto")}
              onClick={cycleTimelineOrientationMode}
              title={
                timelineOrientationMode === "auto"
                  ? "Timeline: AUTO (follows window shape) — click to pin FILM"
                  : timelineOrientationMode === "horizontal"
                    ? "Timeline: pinned FILM (bottom strip) — click to pin X-SHEET"
                    : "Timeline: pinned X-SHEET (right column) — click to return to AUTO"
              }
            >
              {timelineOrientationMode === "auto"
                ? `AUTO · ${timelineOrientation === "vertical" ? "X-SHEET" : "FILM"}`
                : timelineOrientationMode === "vertical"
                  ? "X-SHEET"
                  : "FILM"}
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
              ditherCoverage={ditherCoverage}
              ditherTwoTone={ditherTwoTone}
              ditherColorB={ditherColorB}
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
            {showDitherColorB && !collapse && (
              <div style={{ position: "absolute", top: 8, left: 8, zIndex: 40 }}>
                {ditherColorBContent}
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
                {showDitherColorB && (
                  <div style={{ position: "absolute", bottom: 50, left: "50%", transform: "translateX(-50%)", zIndex: 43, maxWidth: "min(92vw, 240px)" }}>
                    {ditherColorBContent}
                  </div>
                )}
              </>
            )}
          </div>

          {/* Horizontal filmstrip — between L/R rails, under canvas; drag handle to show/hide.
              Vertical (X-Sheet) mode instead renders in the thin right-side column below. */}
          {!collapse && timelineOrientation === "horizontal" && (
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
                  height: 36,
                  cursor: "ns-resize",
                  touchAction: "none",
                  background: "#0a0a0a",
                  borderTop: "1px solid #333",
                  borderBottom: timelineHeight > 0 ? "1px solid #222" : "1px solid #333",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "0 6px",
                  gap: 8,
                  userSelect: "none",
                }}
              >
                <span style={{ display: "flex", alignItems: "center", gap: 6, flexShrink: 0 }}>
                  <div
                    style={{
                      width: 20,
                      height: 3,
                      background: timelineHeight > 0 ? "#555" : "#00ff00",
                      borderRadius: 0,
                    }}
                  />
                  <span style={{ fontSize: 6, color: "#666", letterSpacing: 1 }}>
                    {timelineHeight > 0 ? "TIMELINE" : "DRAG UP"}
                  </span>
                </span>
                {/* Frame controls live in this bar (not beside frame 1 in the
                    scrolling strip) — stop the drag from starting under a click here. */}
                <div
                  onPointerDown={(e) => e.stopPropagation()}
                  onDoubleClick={(e) => e.stopPropagation()}
                  style={{ display: "flex", alignItems: "center" }}
                >
                  <TimelineToolbar
                    playing={playing}
                    frameCount={frameCount}
                    activePool={project.layers[activeLayerIndex]?.frames ?? []}
                    spriteWidth={project.width}
                    spriteHeight={project.height}
                    renderTick={renderTick}
                    onTogglePlayback={togglePlayback}
                    onInsertBlank={insertBlankFrame}
                    onDuplicate={duplicateFrame}
                    onDelete={deleteFrame}
                    onReuse={reuseFrame}
                  />
                </div>
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
            </>
          )}
          {!collapse && (
            <div
              className="flex items-center justify-between px-2 py-0.5 border-t flex-shrink-0"
              style={{ borderColor: "#1a1a1a", minHeight: 18 }}
            >
              <span style={{ fontSize: 7, color: "#555", letterSpacing: 1 }}>
                ,/. frame · 2-tap undo · 3-tap redo · pinch/twist · P play
              </span>
              <span style={{ fontSize: 7, color: "#555" }}>☦</span>
            </div>
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

        {/* Vertical (X-Sheet) mode: thin dedicated column to the right of the
            preview/color/export rail, per user request — never crammed into
            that already-dense rail. Left-edge handle resizes its width. */}
        {!collapse && timelineOrientation === "vertical" && (
          <>
            <div
              role="separator"
              aria-orientation="vertical"
              aria-label="Drag to resize X-Sheet width"
              title="Drag to resize · double-click to reset"
              onPointerDown={onXsheetHandlePointerDown}
              onPointerMove={onXsheetHandlePointerMove}
              onPointerUp={onXsheetHandlePointerUp}
              onPointerCancel={onXsheetHandlePointerUp}
              onDoubleClick={() => setXsheetWidth(XSHEET_DEFAULT)}
              style={{
                flexShrink: 0,
                width: 8,
                cursor: "ew-resize",
                touchAction: "none",
                background: "#0a0a0a",
                borderLeft: "1px solid #333",
                borderRight: "1px solid #222",
                userSelect: "none",
              }}
            />
            <div
              className="flex flex-col flex-shrink-0"
              style={{
                borderColor: "#1a1a1a",
                width: xsheetWidth,
                alignSelf: "stretch",
                height: "100%",
                minHeight: 0,
                overflow: "hidden",
                background: "#000",
              }}
            >
              {timelineContent}
            </div>
          </>
        )}

        {collapse && (
          <>
            <CornerPanel id="tools" corner="top-left" label="TOOL">{toolsContent}</CornerPanel>
            <CornerPanel id="side" corner="top-right" label="CLR">{sideContent}</CornerPanel>
            <CornerPanel id="frames" corner="bottom-left" label="FRM">{timelineContent}</CornerPanel>
            <button type="button" style={{ ...mobileFrameBtn, left: 44 }} onClick={(e) => { e.stopPropagation(); insertBlankFrame(); }}>+</button>
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
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    cycleTimelineOrientationMode();
                  }}
                  style={{
                    display: "block",
                    width: "100%",
                    textAlign: "left",
                    border: "1px solid #333",
                    background: timelineOrientationMode !== "auto" ? "#fff" : "#000",
                    color: timelineOrientationMode !== "auto" ? "#000" : "#aaa",
                    fontFamily: "inherit",
                    fontSize: 8,
                    padding: "3px 4px",
                    cursor: "pointer",
                    marginBottom: 4,
                  }}
                  title="Cycle timeline layout: AUTO / FILM / X-SHEET"
                >
                  {timelineOrientationMode === "auto"
                    ? `AUTO MODE (${timelineOrientation === "vertical" ? "X-SHEET" : "FILMSTRIP"})`
                    : timelineOrientationMode === "vertical"
                      ? "X-SHEET MODE"
                      : "FILMSTRIP MODE"}
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

/**
 * Dither tone/density bar — colored port of Shotlist's vertical tone strip
 * (drag: top=solid A, bottom=solid B), showing the real A/B colors instead
 * of mono ink/bg.
 */
function DitherToneBar({
  coverage,
  onChange,
  pattern,
  colorA,
  colorB,
  ox,
  oy,
  width = 22,
}: {
  coverage: number;
  onChange: (v: number) => void;
  pattern: DitherPatternId;
  colorA: PackedColor;
  colorB: PackedColor;
  ox: number;
  oy: number;
  width?: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    renderDitherGradientStripColor(ctx, width, 96, pattern, colorA, colorB, { ox, oy });
  }, [pattern, colorA, colorB, ox, oy, width]);

  const setFromY = (clientY: number) => {
    const el = ref.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const t = 1 - (clientY - rect.top) / Math.max(1, rect.height);
    onChange(Math.min(1, Math.max(0, t)));
  };

  return (
    <div
      ref={ref}
      title="Tone: top=solid A · bottom=solid B"
      onPointerDown={(e) => {
        e.preventDefault();
        (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
        setFromY(e.clientY);
      }}
      onPointerMove={(e) => {
        if (e.buttons !== 1) return;
        setFromY(e.clientY);
      }}
      style={{
        position: "relative",
        width,
        height: "100%",
        border: "1px solid #333",
        cursor: "ns-resize",
        flexShrink: 0,
        overflow: "hidden",
        touchAction: "none",
      }}
    >
      <canvas
        ref={canvasRef}
        style={{ width: "100%", height: "100%", display: "block", imageRendering: "pixelated", pointerEvents: "none" }}
      />
      <div
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          top: `${(1 - coverage) * 100}%`,
          height: 2,
          background: "#00ff00",
          transform: "translateY(-1px)",
          pointerEvents: "none",
          boxShadow: "0 0 0 1px #000",
        }}
      />
    </div>
  );
}

/** One dither kernel swatch button — colored port of Shotlist's ToneSwatch pattern preview. */
function DitherSwatchButton({
  pattern,
  active,
  coverage,
  colorA,
  colorB,
  ox,
  oy,
  onClick,
  title,
}: {
  pattern: DitherPatternId;
  active: boolean;
  coverage: number;
  colorA: PackedColor;
  colorB: PackedColor;
  ox: number;
  oy: number;
  onClick: () => void;
  title: string;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    renderDitherToneSwatch(ctx, 16, pattern, coverage, colorA, colorB, ox, oy);
  }, [pattern, coverage, colorA, colorB, ox, oy]);

  return (
    <button
      type="button"
      onClick={onClick}
      title={title}
      style={{
        flex: "1 1 0",
        minHeight: 0,
        padding: 0,
        border: active ? "1px solid #00ff00" : "1px solid #333",
        background: "#000",
        cursor: "pointer",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        overflow: "hidden",
      }}
    >
      <canvas ref={canvasRef} style={{ width: 16, height: 16, imageRendering: "pixelated", display: "block" }} />
    </button>
  );
}

