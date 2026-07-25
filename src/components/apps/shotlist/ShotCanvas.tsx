/*
 * SHOTLIST — mono plate editor
 * One compact header · left pen panel with vertical ordered-dither density
 * Bayer-style continuous tone (see https://jdobr.es/blog/dithering/)
 */

"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import { clientToCanvasBitmap, useCanvasViewport } from "@/lib/creative";
import {
  DEFAULT_DITHER_PATTERN,
  DEFAULT_PRESSURE_CURVE,
  DITHER_PATTERNS,
  LINEAR_PRESSURE_CURVE,
  SHOT_H,
  SHOT_W,
  bitmapToDataURL,
  bitmapToImageData,
  cloneBitmap,
  createBlankBitmap,
  dataURLToBitmap,
  forEachStrokePoint,
  normalizePressure,
  radiusFromPressure,
  renderDitherGradientStrip,
  sampleDitherRank,
  stampDither,
  stampPen,
  type DitherPatternId,
  type MonoInk,
  type PressureCurve,
  type ShotBg,
} from "./monoDraw";

/** Pen size clamps (px radius) */
const PEN_SIZE_FLOOR = 1;
const PEN_SIZE_CEIL = 96;
const DEFAULT_PEN_MIN = 1;
const DEFAULT_PEN_MAX = 24;

export interface ShotCanvasProps {
  initialDataUrl: string | null;
  bg: ShotBg;
  width?: number;
  height?: number;
  onSave: (dataUrl: string) => void;
  onCancel?: () => void;
  title?: string;
  onOpenInSpriteEditor?: (liveDataUrl: string) => void;
  embedded?: boolean;
  onLiveChange?: (dataUrl: string) => void;
}

const miniBtn = (active = false): React.CSSProperties => ({
  padding: "3px 8px",
  height: 26,
  background: active ? "#ffffff" : "#000000",
  color: active ? "#000000" : "#cccccc",
  border: active ? "1px solid #ffffff" : "1px solid #555555",
  cursor: "pointer",
  fontFamily: "inherit",
  fontSize: 9,
  letterSpacing: 1,
  touchAction: "manipulation",
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
});

function maxUndoForSize(w: number, h: number): number {
  const px = w * h;
  if (px >= 3840 * 2160) return 6;
  if (px >= 1920 * 1080) return 12;
  return 24;
}

export function ShotCanvas({
  initialDataUrl,
  bg,
  width = SHOT_W,
  height = SHOT_H,
  onSave,
  onCancel,
  title = "SHOT",
  onOpenInSpriteEditor,
  embedded = false,
}: ShotCanvasProps) {
  const plateW = width;
  const plateH = height;
  const viewRef = useRef<HTMLCanvasElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  const gradientRef = useRef<HTMLCanvasElement>(null);
  const bmpRef = useRef<Uint8ClampedArray>(createBlankBitmap(bg, plateW, plateH));
  const sizeRef = useRef({ w: plateW, h: plateH });
  sizeRef.current = { w: plateW, h: plateH };
  const drawingRef = useRef(false);
  const lastPtRef = useRef<{ x: number; y: number } | null>(null);
  const pointerIdRef = useRef<number | null>(null);
  const undoRef = useRef<Uint8ClampedArray[]>([]);
  const inkRef = useRef<MonoInk>(bg === "white" ? 0 : 255);
  const ditherOxRef = useRef(0);
  const ditherOyRef = useRef(0);
  const ditherPatternRef = useRef<DitherPatternId>(DEFAULT_DITHER_PATTERN);
  const coverageRef = useRef(0.5);
  const penMinRef = useRef(DEFAULT_PEN_MIN);
  const penMaxRef = useRef(DEFAULT_PEN_MAX);
  const penCurveRef = useRef<PressureCurve>(DEFAULT_PRESSURE_CURVE);

  const [ink, setInk] = useState<MonoInk>(bg === "white" ? 0 : 255);
  const [ditherOx, setDitherOx] = useState(0);
  const [ditherOy, setDitherOy] = useState(0);
  const [ditherPattern, setDitherPattern] = useState<DitherPatternId>(
    DEFAULT_DITHER_PATTERN,
  );
  /** Ordered-dither gray coverage 0..1 (Bayer gradient stop) */
  const [coverage, setCoverage] = useState(0.5);
  /** Brush radius at zero pressure (px) */
  const [penMinSize, setPenMinSize] = useState(DEFAULT_PEN_MIN);
  /** Brush radius at full pressure (px) */
  const [penMaxSize, setPenMaxSize] = useState(DEFAULT_PEN_MAX);
  /** Cubic-Bezier anchors for pressure→size */
  const [penCurve, setPenCurve] = useState<PressureCurve>(DEFAULT_PRESSURE_CURVE);
  /** Last stylus/mouse pressure for live curve indicator */
  const [lastPressure, setLastPressure] = useState(0.5);
  const [toolsOpen, setToolsOpen] = useState(true);
  const [curveOpen, setCurveOpen] = useState(false);
  const [helpOpen, setHelpOpen] = useState(false);
  const [ready, setReady] = useState(false);
  const [status, setStatus] = useState("Loading…");
  const [baseScale, setBaseScale] = useState(0.5);

  inkRef.current = ink;
  ditherOxRef.current = ditherOx;
  ditherOyRef.current = ditherOy;
  ditherPatternRef.current = ditherPattern;
  coverageRef.current = coverage;
  penMinRef.current = penMinSize;
  penMaxRef.current = penMaxSize;
  penCurveRef.current = penCurve;

  const paintView = useCallback(() => {
    const canvas = viewRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const { w, h } = sizeRef.current;
    if (canvas.width !== w || canvas.height !== h) {
      canvas.width = w;
      canvas.height = h;
    }
    ctx.imageSmoothingEnabled = false;
    ctx.putImageData(bitmapToImageData(bmpRef.current, w, h), 0, 0);
  }, []);

  const pushUndo = useCallback(() => {
    const stack = undoRef.current;
    stack.push(cloneBitmap(bmpRef.current));
    const max = maxUndoForSize(sizeRef.current.w, sizeRef.current.h);
    while (stack.length > max) stack.shift();
  }, []);

  const undo = useCallback(() => {
    const prev = undoRef.current.pop();
    if (!prev) return;
    bmpRef.current = prev;
    paintView();
    setStatus("Undo");
  }, [paintView]);

  const {
    viewport,
    resetViewport,
    onWheelZoom,
    onPointerDown: vpDown,
    onPointerMove: vpMove,
    onPointerUp: vpUp,
    spaceDownRef,
  } = useCanvasViewport({
    onUndo: undo,
    minZoom: 0.15,
    maxZoom: 12,
    // No rotation — was glitchy and broke pen accuracy
    enableRotation: false,
    pinchRotate: false,
  });

  // Load plate once per source/size. Keep canvas mounted while decoding so
  // we never unmount → remount with an unpainted buffer (blank plate bug).
  const loadGenRef = useRef(0);
  useEffect(() => {
    const gen = ++loadGenRef.current;
    let cancelled = false;
    (async () => {
      const next = initialDataUrl
        ? await dataURLToBitmap(initialDataUrl, plateW, plateH, bg)
        : createBlankBitmap(bg, plateW, plateH);
      if (cancelled || gen !== loadGenRef.current) return;
      bmpRef.current = next;
      undoRef.current = [];
      resetViewport();
      setReady(true);
      setStatus("ready");
      // paint after React has the canvas in the tree
      requestAnimationFrame(() => {
        if (!cancelled && gen === loadGenRef.current) paintView();
      });
    })();
    return () => {
      cancelled = true;
    };
    // Intentionally omit paintView/resetViewport identity — they are stable;
    // including initialDataUrl would reload after every parent thumbnail write.
    // eslint-disable-next-line react-hooks/exhaustive-deps -- load only on plate identity
  }, [initialDataUrl, bg, plateW, plateH]);

  // Paint whenever we become ready (covers first mount after async load)
  useEffect(() => {
    if (ready) paintView();
  }, [ready, paintView]);

  // Ordered-dither gradient strip — fills left rail height (no scroll)
  const GRAD_W = 20;
  const [gradH, setGradH] = useState(160);
  const railRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!toolsOpen) return;
    const el = railRef.current;
    if (!el) return;
    const measure = () => {
      const h = Math.floor(el.getBoundingClientRect().height);
      // keep enough pixels for patterns (8 × ~16) while never overflowing
      setGradH(Math.max(64, h));
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, [toolsOpen]);

  useEffect(() => {
    const c = gradientRef.current;
    if (!c || !toolsOpen) return;
    const ctx = c.getContext("2d");
    if (!ctx) return;
    const h = Math.max(8, gradH);
    c.width = GRAD_W;
    c.height = h;
    const inkV = ink;
    const bgV: 0 | 255 = ink === 0 ? 255 : 0;
    // Top = solid (100%), bottom = empty (0%) — matches native vertical range (high at top)
    renderDitherGradientStrip(ctx, GRAD_W, h, ditherPattern, inkV, bgV, {
      ox: ditherOx,
      oy: ditherOy,
      invertCoverage: true,
    });
  }, [ditherPattern, ditherOx, ditherOy, ink, toolsOpen, gradH]);

  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const fit = () => {
      const rect = el.getBoundingClientRect();
      const pad = 12;
      const sx = (rect.width - pad) / plateW;
      const sy = (rect.height - pad) / plateH;
      const cap = plateW >= 3000 ? 0.4 : plateW >= 1500 ? 0.7 : 1.2;
      setBaseScale(Math.max(0.05, Math.min(sx, sy, cap)));
    };
    fit();
    const ro = new ResizeObserver(fit);
    ro.observe(el);
    const onWheelNative = (ev: WheelEvent) => {
      ev.preventDefault();
      onWheelZoom(ev);
    };
    el.addEventListener("wheel", onWheelNative, { passive: false });
    return () => {
      ro.disconnect();
      el.removeEventListener("wheel", onWheelNative);
    };
  }, [ready, plateW, plateH, onWheelZoom]);

  /** Map client coords → plate pixels. Canvas has no CSS transform. */
  const clientToPlate = useCallback(
    (clientX: number, clientY: number): { x: number; y: number } | null => {
      const canvas = viewRef.current;
      if (!canvas || canvas.width < 1 || canvas.height < 1) return null;
      const { w, h } = sizeRef.current;
      const { x, y } = clientToCanvasBitmap(canvas, clientX, clientY, 0);
      if (!Number.isFinite(x) || !Number.isFinite(y)) return null;
      // Outside plate (with small slop for edge hits)
      if (x < -1 || y < -1 || x > w + 1 || y > h + 1) return null;
      return {
        x: Math.max(0, Math.min(w - 0.01, x)),
        y: Math.max(0, Math.min(h - 0.01, y)),
      };
    },
    [],
  );

  const stampAt = useCallback((x: number, y: number, pressure: number) => {
    const { w, h } = sizeRef.current;
    const cov = coverageRef.current;
    const minR = penMinRef.current;
    const maxR = penMaxRef.current;
    const base = {
      ink: inkRef.current,
      pressure,
      ditherOx: ditherOxRef.current,
      ditherOy: ditherOyRef.current,
      width: w,
      height: h,
      ditherPattern: ditherPatternRef.current,
      coverage: cov,
      minRadius: minR,
      maxRadius: maxR,
      curve: penCurveRef.current,
    };
    // Solid at full coverage; ordered dither otherwise (true Bayer tone)
    if (cov >= 0.995) {
      stampPen(bmpRef.current, x, y, base);
    } else if (cov > 0.001) {
      stampDither(bmpRef.current, x, y, base);
    }
    // cov ≈ 0 → no ink (empty end of gradient)
  }, []);

  const strokeTo = useCallback(
    (x: number, y: number, pressure: number) => {
      const last = lastPtRef.current;
      if (!last) stampAt(x, y, pressure);
      else {
        forEachStrokePoint(last.x, last.y, x, y, (px, py) => {
          stampAt(px, py, pressure);
        });
      }
      lastPtRef.current = { x, y };
      paintView();
    },
    [paintView, stampAt],
  );

  // Stage-level pointers (wrap) — pan works on empty area; pen uses canvas rect
  const onStagePointerDown = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      // Let floating chrome (curve panel, help, info) keep their own clicks
      const t = e.target as HTMLElement | null;
      if (t && t !== e.currentTarget && t.closest("button, input, label, a, [data-ui]")) {
        return;
      }
      if (!ready) return;
      if (vpDown(e)) {
        drawingRef.current = false;
        try {
          e.currentTarget.setPointerCapture(e.pointerId);
        } catch {
          /* ignore */
        }
        return;
      }
      if (e.button !== 0 && e.pointerType === "mouse") return;
      const pt = clientToPlate(e.clientX, e.clientY);
      if (!pt) return;
      e.preventDefault();
      try {
        e.currentTarget.setPointerCapture(e.pointerId);
      } catch {
        /* ignore */
      }
      pointerIdRef.current = e.pointerId;
      drawingRef.current = true;
      pushUndo();
      lastPtRef.current = null;
      const p = normalizePressure(e.pressure, e.pointerType, e.buttons);
      setLastPressure(p);
      strokeTo(pt.x, pt.y, p);
    },
    [ready, vpDown, clientToPlate, pushUndo, strokeTo],
  );

  const onStagePointerMove = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      if (vpMove(e)) return;
      if (!drawingRef.current || pointerIdRef.current !== e.pointerId) return;
      e.preventDefault();
      const pt = clientToPlate(e.clientX, e.clientY);
      if (!pt) return;
      const p = normalizePressure(e.pressure, e.pointerType, e.buttons);
      setLastPressure(p);
      strokeTo(pt.x, pt.y, p);
    },
    [vpMove, clientToPlate, strokeTo],
  );

  const onStagePointerUp = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      vpUp(e);
      if (pointerIdRef.current === e.pointerId || pointerIdRef.current == null) {
        drawingRef.current = false;
        pointerIdRef.current = null;
        lastPtRef.current = null;
      }
      try {
        e.currentTarget.releasePointerCapture(e.pointerId);
      } catch {
        /* ignore */
      }
    },
    [vpUp],
  );

  const clearPlate = useCallback(() => {
    pushUndo();
    bmpRef.current = createBlankBitmap(bg, plateW, plateH);
    paintView();
  }, [bg, plateW, plateH, pushUndo, paintView]);

  const fillInk = useCallback(() => {
    pushUndo();
    bmpRef.current.fill(ink);
    paintView();
  }, [ink, pushUndo, paintView]);

  const exportUrl = useCallback(() => {
    const { w, h } = sizeRef.current;
    return bitmapToDataURL(bmpRef.current, w, h);
  }, []);

  const handleSave = useCallback(() => onSave(exportUrl()), [onSave, exportUrl]);
  const handleOpenSprite = useCallback(() => {
    onOpenInSpriteEditor?.(exportUrl());
  }, [onOpenInSpriteEditor, exportUrl]);

  const bumpPenMax = useCallback((delta: number) => {
    setPenMaxSize((prev) => {
      const next = Math.min(PEN_SIZE_CEIL, Math.max(PEN_SIZE_FLOOR, prev + delta));
      // Keep max ≥ min
      setPenMinSize((min) => Math.min(min, next));
      return next;
    });
  }, []);

  const bumpPenMin = useCallback((delta: number) => {
    setPenMinSize((prev) => {
      const next = Math.min(PEN_SIZE_CEIL, Math.max(PEN_SIZE_FLOOR, prev + delta));
      // Keep min ≤ max
      setPenMaxSize((max) => Math.max(max, next));
      return next;
    });
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }
      if (e.code === "Space") e.preventDefault();
      const k = e.key.toLowerCase();
      if ((e.metaKey || e.ctrlKey) && k === "z") {
        e.preventDefault();
        undo();
        return;
      }
      if (k === "0" && !e.metaKey && !e.ctrlKey) {
        resetViewport();
        return;
      }
      if (k === "t") {
        setToolsOpen((v) => !v);
        return;
      }
      if (k === "c" && !e.metaKey && !e.ctrlKey && !e.altKey) {
        setCurveOpen((v) => !v);
        return;
      }
      // [ / ] — max pen size smaller / larger
      // Shift+[ / ] — min pen size smaller / larger
      // Alt holds for ±5
      if (e.key === "[" || e.code === "BracketLeft") {
        e.preventDefault();
        const step = e.altKey ? 5 : 1;
        if (e.shiftKey) bumpPenMin(-step);
        else bumpPenMax(-step);
        return;
      }
      if (e.key === "]" || e.code === "BracketRight") {
        e.preventDefault();
        const step = e.altKey ? 5 : 1;
        if (e.shiftKey) bumpPenMin(step);
        else bumpPenMax(step);
        return;
      }
      if (k === "x") setInk((v) => (v === 0 ? 255 : 0));
      if (k === "enter") {
        e.preventDefault();
        handleSave();
      }
      if (k === "escape") {
        e.preventDefault();
        onCancel?.();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [undo, handleSave, onCancel, resetViewport, bumpPenMax, bumpPenMin]);

  const displayScale = baseScale * (viewport.zoom || 1);
  const cssW = Math.max(1, Math.floor(plateW * displayScale));
  const cssH = Math.max(1, Math.floor(plateH * displayScale));
  const grab = spaceDownRef.current;

  const zoomFit = useCallback(() => {
    resetViewport();
  }, [resetViewport]);

  const rootStyle: React.CSSProperties = embedded
    ? {
        position: "relative",
        width: "100%",
        height: "100%",
        minHeight: 0,
        background: "#000",
        color: "#fff",
        fontFamily: "var(--dm-font-primary), monospace",
        display: "flex",
        flexDirection: "column",
        imageRendering: "pixelated",
        userSelect: "none",
        overflow: "hidden",
      }
    : {
        position: "absolute",
        inset: 0,
        zIndex: 50,
        background: "#000",
        color: "#fff",
        fontFamily: "var(--dm-font-primary), monospace",
        display: "flex",
        flexDirection: "column",
        imageRendering: "pixelated",
        userSelect: "none",
      };

  /** Top of strip = 100% tone, bottom = 0% (matches yellow thumb + invertCoverage) */
  const setCoverageFromClientY = (clientY: number, el: HTMLElement) => {
    const rect = el.getBoundingClientRect();
    const t = (clientY - rect.top) / Math.max(1, rect.height);
    setCoverage(Math.min(1, Math.max(0, 1 - t)));
  };

  return (
    <div style={rootStyle}>
      {/* ONE compact header bar */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
          padding: "4px 8px",
          borderBottom: "1px solid #333",
          flexShrink: 0,
          minHeight: 32,
          background: "#000",
        }}
      >
        <span
          style={{
            color: "#ffff00",
            letterSpacing: 1,
            fontSize: 10,
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
            maxWidth: 120,
          }}
        >
          {title}
        </span>
        <span style={{ color: "#444", fontSize: 8, letterSpacing: 1, flex: 1 }}>
          {plateW}×{plateH}
        </span>
        <button type="button" style={miniBtn()} onClick={zoomFit} title="Fit (0)">
          FIT
        </button>
        {onOpenInSpriteEditor && (
          <button type="button" style={miniBtn()} onClick={handleOpenSprite}>
            SPRITE
          </button>
        )}
        <button type="button" style={miniBtn(true)} onClick={handleSave}>
          SAVE
        </button>
      </div>

      <div style={{ flex: 1, minHeight: 0, display: "flex", overflow: "hidden" }}>
        {/* Left tools — full-height column, no scroll */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            flexShrink: 0,
            alignSelf: "stretch",
            height: "100%",
            borderRight: "1px solid #222",
            background: "#000",
            overflow: "hidden",
          }}
        >
          <button
            type="button"
            onClick={() => setToolsOpen((v) => !v)}
            title="Pen tools (T)"
            style={{
              width: toolsOpen ? 92 : 36,
              height: 26,
              flexShrink: 0,
              border: "none",
              borderBottom: "1px solid #333",
              background: toolsOpen ? "#fff" : "#000",
              color: toolsOpen ? "#000" : "#888",
              fontFamily: "inherit",
              fontSize: 8,
              letterSpacing: 1,
              cursor: "pointer",
            }}
          >
            PEN
          </button>
          {toolsOpen && (
            <div
              style={{
                width: 92,
                flex: 1,
                minHeight: 0,
                overflow: "hidden",
                padding: "4px 4px 6px",
                display: "flex",
                flexDirection: "column",
                gap: 4,
                alignItems: "center",
              }}
            >
              <div style={{ display: "flex", gap: 3, width: "100%", flexShrink: 0 }}>
                <button type="button" style={{ ...miniBtn(ink === 0), flex: 1, padding: "2px 0", height: 22 }} onClick={() => setInk(0)}>
                  B
                </button>
                <button type="button" style={{ ...miniBtn(ink === 255), flex: 1, padding: "2px 0", height: 22 }} onClick={() => setInk(255)}>
                  W
                </button>
              </div>

              <div style={{ fontSize: 7, color: "#555", letterSpacing: 1, flexShrink: 0 }}>
                {Math.round(coverage * 100)}%
              </div>

              {/*
                Vertical tone rail fills remaining height (no scroll).
                Top = solid 100%, bottom = empty 0%.
              */}
              <div
                ref={railRef}
                style={{
                  flex: 1,
                  minHeight: 0,
                  width: "100%",
                  display: "flex",
                  flexDirection: "row",
                  gap: 4,
                  alignItems: "stretch",
                  justifyContent: "center",
                  overflow: "hidden",
                }}
              >
                <div
                  style={{
                    position: "relative",
                    width: GRAD_W,
                    height: "100%",
                    border: "1px solid #333",
                    cursor: "ns-resize",
                    flexShrink: 0,
                    imageRendering: "pixelated",
                    overflow: "hidden",
                  }}
                  onPointerDown={(e) => {
                    const el = e.currentTarget;
                    el.setPointerCapture(e.pointerId);
                    setCoverageFromClientY(e.clientY, el);
                  }}
                  onPointerMove={(e) => {
                    if (e.buttons !== 1) return;
                    setCoverageFromClientY(e.clientY, e.currentTarget);
                  }}
                  title="Drag: top=solid · bottom=empty"
                >
                  <canvas
                    ref={gradientRef}
                    width={GRAD_W}
                    height={gradH}
                    style={{
                      width: "100%",
                      height: "100%",
                      display: "block",
                      imageRendering: "pixelated",
                      pointerEvents: "none",
                    }}
                  />
                  <div
                    style={{
                      position: "absolute",
                      left: 0,
                      right: 0,
                      top: `${(1 - coverage) * 100}%`,
                      height: 2,
                      background: "#ffff00",
                      transform: "translateY(-1px)",
                      pointerEvents: "none",
                      boxShadow: "0 0 0 1px #000",
                    }}
                  />
                </div>

                {/* Kernel swatches — fill rail height evenly, no scroll */}
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "space-between",
                    height: "100%",
                    flex: 1,
                    minHeight: 0,
                    overflow: "hidden",
                  }}
                >
                  {DITHER_PATTERNS.map((p) => (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => setDitherPattern(p.id)}
                      title={p.title}
                      style={{
                        width: 18,
                        height: 18,
                        maxHeight: "12.5%",
                        padding: 0,
                        border:
                          ditherPattern === p.id ? "1px solid #ffff00" : "1px solid #333",
                        background: "#000",
                        cursor: "pointer",
                        lineHeight: 0,
                        flex: "1 1 0",
                        minHeight: 0,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        overflow: "hidden",
                      }}
                    >
                      <ToneSwatch
                        pattern={p.id}
                        coverage={coverage}
                        ink={ink}
                        ox={ditherOx}
                        oy={ditherOy}
                        px={16}
                      />
                    </button>
                  ))}
                </div>
              </div>

              <div
                style={{
                  width: "100%",
                  fontSize: 7,
                  color: "#666",
                  letterSpacing: 1,
                  textAlign: "center",
                  lineHeight: 1.3,
                  flexShrink: 0,
                }}
                title="[ ] max size · Shift+[ ] min size"
              >
                SIZE {penMinSize}–{penMaxSize}
              </div>

              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: 2,
                  width: "100%",
                  flexShrink: 0,
                }}
              >
                <button
                  type="button"
                  style={{ ...miniBtn(curveOpen), width: "100%", fontSize: 8, height: 22 }}
                  onClick={() => setCurveOpen((v) => !v)}
                  title="Pressure → size curve (C)"
                >
                  CURVE
                </button>
                <button type="button" style={{ ...miniBtn(), width: "100%", fontSize: 8, height: 22 }} onClick={undo}>
                  UNDO
                </button>
                <button type="button" style={{ ...miniBtn(), width: "100%", fontSize: 8, height: 22 }} onClick={clearPlate}>
                  CLR
                </button>
                <button type="button" style={{ ...miniBtn(), width: "100%", fontSize: 8, height: 22 }} onClick={fillInk}>
                  FILL
                </button>
                <button type="button" style={{ ...miniBtn(), width: "100%", fontSize: 8, height: 22 }} onClick={() => setToolsOpen(false)}>
                  HIDE
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Canvas stage — pan/zoom via left/top + size; canvas has ZERO transform */}
        <div
          ref={wrapRef}
          onPointerDown={onStagePointerDown}
          onPointerMove={onStagePointerMove}
          onPointerUp={onStagePointerUp}
          onPointerCancel={onStagePointerUp}
          style={{
            flex: 1,
            minWidth: 0,
            minHeight: 0,
            background: "#0a0a0a",
            overflow: "hidden",
            touchAction: "none",
            cursor: grab ? "grab" : "crosshair",
            position: "relative",
          }}
        >
          {ready ? (
            <canvas
              ref={viewRef}
              width={plateW}
              height={plateH}
              style={{
                // Center + pan with left/top/margin only — NEVER transform
                // (transform broke pen hit-testing / offset under cursor)
                position: "absolute",
                left: `calc(50% + ${viewport.panX}px)`,
                top: `calc(50% + ${viewport.panY}px)`,
                width: cssW,
                height: cssH,
                marginLeft: -Math.floor(cssW / 2),
                marginTop: -Math.floor(cssH / 2),
                transform: "none",
                imageRendering: "pixelated",
                outline: "1px solid #333",
                border: "none",
                padding: 0,
                boxSizing: "content-box",
                display: "block",
                touchAction: "none",
                background: bg === "white" ? "#fff" : "#000",
                pointerEvents: "none", // stage owns hit-testing; map via rect
              }}
            />
          ) : (
            <div style={{ color: "#444", fontSize: 10, padding: 20 }}>…</div>
          )}

          {/* Pressure curve panel */}
          {curveOpen && (
            <PressureCurvePanel
              minSize={penMinSize}
              maxSize={penMaxSize}
              curve={penCurve}
              lastPressure={lastPressure}
              onCurveChange={setPenCurve}
              onMinChange={(v) => {
                const next = Math.min(PEN_SIZE_CEIL, Math.max(PEN_SIZE_FLOOR, Math.round(v)));
                setPenMinSize(next);
                setPenMaxSize((max) => Math.max(max, next));
              }}
              onMaxChange={(v) => {
                const next = Math.min(PEN_SIZE_CEIL, Math.max(PEN_SIZE_FLOOR, Math.round(v)));
                setPenMaxSize(next);
                setPenMinSize((min) => Math.min(min, next));
              }}
              onClose={() => setCurveOpen(false)}
            />
          )}

          <button
            type="button"
            data-ui="help"
            onClick={() => setHelpOpen((v) => !v)}
            style={{
              position: "absolute",
              bottom: 6,
              right: 6,
              zIndex: 12,
              width: 28,
              height: 26,
              border: helpOpen ? "1px solid #fff" : "1px solid #555",
              background: helpOpen ? "#fff" : "#000",
              color: helpOpen ? "#000" : "#888",
              fontFamily: "inherit",
              fontSize: 11,
              cursor: "pointer",
            }}
          >
            ?
          </button>
          {helpOpen && (
            <div
              style={{
                position: "absolute",
                bottom: 36,
                right: 6,
                zIndex: 12,
                maxWidth: 220,
                padding: 8,
                background: "#000",
                border: "1px solid #444",
                fontSize: 8,
                color: "#888",
                lineHeight: 1.6,
                letterSpacing: 1,
              }}
            >
              <div>Pen draws where you point (no rotate on plate)</div>
              <div>Tone strip = ordered dither %</div>
              <div>SCROLL zoom · SPACE+drag pan</div>
              <div>Pinch zoom · 2-finger tap undo</div>
              <div>[ ] max size · Shift+[ ] min size</div>
              <div>C curve (drag 2 anchors) · T · X · ⌘Z</div>
              <button type="button" style={{ ...miniBtn(), marginTop: 6 }} onClick={() => setHelpOpen(false)}>
                CLOSE
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

const CURVE_PAD = { l: 28, r: 12, t: 12, b: 22 } as const;
const CURVE_W = 240;
const CURVE_H = 160;
const ANCHOR_HIT = 12;

/** Floating panel: cubic-Bezier pressure→radius with 2 draggable anchors */
function PressureCurvePanel({
  minSize,
  maxSize,
  curve,
  lastPressure,
  onCurveChange,
  onMinChange,
  onMaxChange,
  onClose,
}: {
  minSize: number;
  maxSize: number;
  curve: PressureCurve;
  lastPressure: number;
  onCurveChange: (c: PressureCurve) => void;
  onMinChange: (v: number) => void;
  onMaxChange: (v: number) => void;
  onClose: () => void;
}) {
  const graphRef = useRef<HTMLCanvasElement>(null);
  const dragRef = useRef<"a" | "b" | null>(null);
  const curveRef = useRef(curve);
  curveRef.current = curve;

  const liveR = radiusFromPressure(lastPressure, maxSize, minSize, curve);

  const plotBox = useCallback(() => {
    const plotW = CURVE_W - CURVE_PAD.l - CURVE_PAD.r;
    const plotH = CURVE_H - CURVE_PAD.t - CURVE_PAD.b;
    return { plotW, plotH };
  }, []);

  /** unit (pressure, sizeNorm) → integer canvas px (no half-pixels) */
  const toPx = useCallback((ux: number, uy: number) => {
    const { plotW, plotH } = plotBox();
    return {
      x: Math.round(CURVE_PAD.l + ux * plotW),
      y: Math.round(CURVE_PAD.t + (1 - uy) * plotH),
    };
  }, [plotBox]);

  /** canvas px → unit (clamped) */
  const fromPx = useCallback((px: number, py: number) => {
    const { plotW, plotH } = plotBox();
    return {
      x: Math.min(1, Math.max(0, (px - CURVE_PAD.l) / plotW)),
      y: Math.min(1, Math.max(0, 1 - (py - CURVE_PAD.t) / plotH)),
    };
  }, [plotBox]);

  useEffect(() => {
    const c = graphRef.current;
    if (!c) return;
    const ctx = c.getContext("2d", { alpha: false });
    if (!ctx) return;
    ctx.imageSmoothingEnabled = false;

    const W = c.width;
    const H = c.height;
    const { plotW, plotH } = plotBox();
    const padL = CURVE_PAD.l;
    const padT = CURVE_PAD.t;

    /** Crisp axis-aligned 1px run via fillRect (no stroke AA) */
    const hLine = (x0: number, x1: number, y: number, color: string) => {
      const a = Math.round(Math.min(x0, x1));
      const b = Math.round(Math.max(x0, x1));
      ctx.fillStyle = color;
      ctx.fillRect(a, Math.round(y), b - a + 1, 1);
    };
    const vLine = (x: number, y0: number, y1: number, color: string) => {
      const a = Math.round(Math.min(y0, y1));
      const b = Math.round(Math.max(y0, y1));
      ctx.fillStyle = color;
      ctx.fillRect(Math.round(x), a, 1, b - a + 1);
    };
    /** Bresenham 1px line — hard pixels only */
    const line = (x0: number, y0: number, x1: number, y1: number, color: string) => {
      let x = Math.round(x0);
      let y = Math.round(y0);
      const xe = Math.round(x1);
      const ye = Math.round(y1);
      const dx = Math.abs(xe - x);
      const dy = Math.abs(ye - y);
      const sx = x < xe ? 1 : -1;
      const sy = y < ye ? 1 : -1;
      let err = dx - dy;
      ctx.fillStyle = color;
      for (;;) {
        ctx.fillRect(x, y, 1, 1);
        if (x === xe && y === ye) break;
        const e2 = 2 * err;
        if (e2 > -dy) {
          err -= dy;
          x += sx;
        }
        if (e2 < dx) {
          err += dx;
          y += sy;
        }
      }
    };
    const rect = (x: number, y: number, w: number, h: number, color: string) => {
      ctx.fillStyle = color;
      ctx.fillRect(Math.round(x), Math.round(y), w, h);
    };

    ctx.fillStyle = "#0a0a0a";
    ctx.fillRect(0, 0, W, H);

    // Grid
    for (let i = 0; i <= 4; i++) {
      const x = padL + Math.round((plotW * i) / 4);
      const y = padT + Math.round((plotH * i) / 4);
      vLine(x, padT, padT + plotH, "#1a1a1a");
      hLine(padL, padL + plotW, y, "#1a1a1a");
    }

    // Diagonal guide (linear reference) — dotted
    {
      const a = toPx(0, 0);
      const b = toPx(1, 1);
      let x = a.x;
      let y = a.y;
      const xe = b.x;
      const ye = b.y;
      const dx = Math.abs(xe - x);
      const dy = Math.abs(ye - y);
      const sx = x < xe ? 1 : -1;
      const sy = y < ye ? 1 : -1;
      let err = dx - dy;
      let n = 0;
      ctx.fillStyle = "#222";
      for (;;) {
        if (n % 3 === 0) ctx.fillRect(x, y, 1, 1);
        if (x === xe && y === ye) break;
        const e2 = 2 * err;
        if (e2 > -dy) {
          err -= dy;
          x += sx;
        }
        if (e2 < dx) {
          err += dx;
          y += sy;
        }
        n++;
      }
    }

    // Axes
    vLine(padL, padT, padT + plotH, "#444");
    hLine(padL, padL + plotW, padT + plotH, "#444");

    // Labels (bitmap font path still AA's a little — accept for text)
    ctx.fillStyle = "#555";
    ctx.font = "9px monospace";
    ctx.textAlign = "center";
    ctx.textBaseline = "alphabetic";
    ctx.fillText("pressure →", padL + Math.round(plotW / 2), H - 4);
    ctx.save();
    ctx.translate(10, padT + Math.round(plotH / 2));
    ctx.rotate(-Math.PI / 2);
    ctx.fillText("radius", 0, 0);
    ctx.restore();

    ctx.textAlign = "right";
    ctx.fillStyle = "#666";
    ctx.fillText(String(maxSize), padL - 4, padT + 8);
    ctx.fillText(String(minSize), padL - 4, padT + plotH);

    const end0 = toPx(0, 0);
    const end1 = toPx(1, 1);
    const ha = toPx(curve.a.x, curve.a.y);
    const hb = toPx(curve.b.x, curve.b.y);

    // Vector handles
    line(end0.x, end0.y, ha.x, ha.y, "#3a3a20");
    line(end1.x, end1.y, hb.x, hb.y, "#3a3a20");

    // Bezier curve — plot hard pixels (2px thick blocky)
    const steps = plotW;
    let prev: { x: number; y: number } | null = null;
    for (let i = 0; i <= steps; i++) {
      const p = i / steps;
      const r = radiusFromPressure(p, maxSize, minSize, curve);
      const yn = maxSize <= minSize ? 0 : (r - minSize) / (maxSize - minSize);
      const pt = toPx(p, yn);
      if (prev) line(prev.x, prev.y, pt.x, pt.y, "#ffff00");
      // 2px body
      rect(pt.x, pt.y, 2, 2, "#ffff00");
      prev = pt;
    }

    // Fixed endpoints (3×3 blocks)
    for (const e of [end0, end1]) {
      rect(e.x - 1, e.y - 1, 3, 3, "#888");
    }

    // Draggable anchors (diamond via rects)
    const drawAnchor = (pt: { x: number; y: number }, label: string) => {
      const { x, y } = pt;
      rect(x, y - 5, 1, 11, "#ffff00");
      rect(x - 1, y - 4, 3, 9, "#ffff00");
      rect(x - 2, y - 3, 5, 7, "#ffff00");
      rect(x - 3, y - 2, 7, 5, "#ffff00");
      rect(x - 4, y - 1, 9, 3, "#ffff00");
      rect(x - 5, y, 11, 1, "#ffff00");
      // black core
      rect(x - 1, y - 1, 3, 3, "#000");
      rect(x, y, 1, 1, "#ffff00");
      ctx.fillStyle = "#aaa";
      ctx.font = "8px monospace";
      ctx.textAlign = "left";
      ctx.fillText(label, x + 8, y + 3);
    };
    drawAnchor(ha, "A");
    drawAnchor(hb, "B");

    // Live pressure marker
    const p = Math.min(1, Math.max(0, lastPressure));
    const rLive = radiusFromPressure(p, maxSize, minSize, curve);
    const ynLive = maxSize <= minSize ? 0 : (rLive - minSize) / (maxSize - minSize);
    const live = toPx(p, ynLive);
    // dashed vertical
    for (let y = live.y; y <= padT + plotH; y += 4) {
      rect(live.x, y, 1, 2, "#fff");
    }
    rect(live.x - 2, live.y - 2, 5, 5, "#fff");
    rect(live.x - 1, live.y - 1, 3, 3, "#000");
    rect(live.x, live.y, 1, 1, "#fff");
    ctx.fillStyle = "#ccc";
    ctx.font = "8px monospace";
    ctx.textAlign = "left";
    const labelX = live.x + 6 > W - 50 ? live.x - 52 : live.x + 6;
    ctx.fillText(`${Math.round(p * 100)}%→r${rLive}`, labelX, live.y - 4);
  }, [minSize, maxSize, lastPressure, curve, plotBox, toPx]);

  const hitTest = (px: number, py: number): "a" | "b" | null => {
    const ha = toPx(curveRef.current.a.x, curveRef.current.a.y);
    const hb = toPx(curveRef.current.b.x, curveRef.current.b.y);
    const da = (px - ha.x) ** 2 + (py - ha.y) ** 2;
    const db = (px - hb.x) ** 2 + (py - hb.y) ** 2;
    const r2 = ANCHOR_HIT * ANCHOR_HIT;
    if (da <= r2 && da <= db) return "a";
    if (db <= r2) return "b";
    return null;
  };

  const clientToCanvas = (clientX: number, clientY: number) => {
    const c = graphRef.current;
    if (!c) return null;
    const rect = c.getBoundingClientRect();
    const sx = c.width / Math.max(1, rect.width);
    const sy = c.height / Math.max(1, rect.height);
    return {
      x: (clientX - rect.left) * sx,
      y: (clientY - rect.top) * sy,
    };
  };

  const onGraphPointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const pt = clientToCanvas(e.clientX, e.clientY);
    if (!pt) return;
    const which = hitTest(pt.x, pt.y);
    if (!which) return;
    e.preventDefault();
    e.currentTarget.setPointerCapture(e.pointerId);
    dragRef.current = which;
  };

  const onGraphPointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!dragRef.current) return;
    const pt = clientToCanvas(e.clientX, e.clientY);
    if (!pt) return;
    const u = fromPx(pt.x, pt.y);
    const which = dragRef.current;
    onCurveChange({
      ...curveRef.current,
      [which]: { x: u.x, y: u.y },
    });
  };

  const onGraphPointerUp = (e: React.PointerEvent<HTMLCanvasElement>) => {
    dragRef.current = null;
    try {
      e.currentTarget.releasePointerCapture(e.pointerId);
    } catch {
      /* ignore */
    }
  };

  return (
    <div
      data-ui="curve-panel"
      style={{
        position: "absolute",
        top: 10,
        right: 10,
        zIndex: 14,
        width: 260,
        background: "#000",
        border: "1px solid #444",
        padding: 10,
        display: "flex",
        flexDirection: "column",
        gap: 8,
        boxShadow: "0 4px 24px rgba(0,0,0,0.6)",
        pointerEvents: "auto",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 8,
        }}
      >
        <span style={{ color: "#ffff00", fontSize: 9, letterSpacing: 1 }}>PRESSURE CURVE</span>
        <button type="button" style={{ ...miniBtn(), height: 22, padding: "2px 6px" }} onClick={onClose}>
          ✕
        </button>
      </div>

      <canvas
        ref={graphRef}
        width={CURVE_W}
        height={CURVE_H}
        onPointerDown={onGraphPointerDown}
        onPointerMove={onGraphPointerMove}
        onPointerUp={onGraphPointerUp}
        onPointerCancel={onGraphPointerUp}
        style={{
          width: "100%",
          height: CURVE_H,
          display: "block",
          border: "1px solid #222",
          imageRendering: "pixelated",
          cursor: "crosshair",
          touchAction: "none",
        }}
      />

      <div style={{ fontSize: 8, color: "#888", letterSpacing: 1, lineHeight: 1.5 }}>
        Drag anchors A · B (cubic Bezier)
        <br />
        Live: r{liveR} @ {Math.round(lastPressure * 100)}%
      </div>

      {/* Min / Max controls */}
      <label style={{ display: "flex", flexDirection: "column", gap: 3, fontSize: 8, color: "#777", letterSpacing: 1 }}>
        MIN {minSize}px
        <input
          type="range"
          min={PEN_SIZE_FLOOR}
          max={PEN_SIZE_CEIL}
          value={minSize}
          onChange={(e) => onMinChange(Number(e.target.value))}
          style={{ width: "100%", accentColor: "#ffff00" }}
        />
      </label>
      <label style={{ display: "flex", flexDirection: "column", gap: 3, fontSize: 8, color: "#777", letterSpacing: 1 }}>
        MAX {maxSize}px  ·  [ ]
        <input
          type="range"
          min={PEN_SIZE_FLOOR}
          max={PEN_SIZE_CEIL}
          value={maxSize}
          onChange={(e) => onMaxChange(Number(e.target.value))}
          style={{ width: "100%", accentColor: "#ffff00" }}
        />
      </label>

      <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
        <button type="button" style={{ ...miniBtn(), flex: 1, fontSize: 9 }} onClick={() => onMaxChange(maxSize - 1)} title="[">
          [
        </button>
        <button type="button" style={{ ...miniBtn(), flex: 1, fontSize: 9 }} onClick={() => onMaxChange(maxSize + 1)} title="]">
          ]
        </button>
        <button
          type="button"
          style={{ ...miniBtn(), flex: 1, fontSize: 8 }}
          onClick={() => onCurveChange({ ...DEFAULT_PRESSURE_CURVE })}
          title="Soft exponential curve"
        >
          EXP
        </button>
        <button
          type="button"
          style={{ ...miniBtn(), flex: 1, fontSize: 8 }}
          onClick={() => onCurveChange({ ...LINEAR_PRESSURE_CURVE })}
          title="Linear diagonal"
        >
          LIN
        </button>
        <button
          type="button"
          style={{ ...miniBtn(), flex: 1, fontSize: 8 }}
          onClick={() => {
            onMinChange(DEFAULT_PEN_MIN);
            onMaxChange(DEFAULT_PEN_MAX);
            onCurveChange({ ...DEFAULT_PRESSURE_CURVE });
          }}
          title="Reset size + curve"
        >
          RST
        </button>
      </div>
    </div>
  );
}

/** Fixed-size 1:1 pixel swatch of current coverage with a given kernel */
function ToneSwatch({
  pattern,
  coverage,
  ink,
  ox,
  oy,
  px = 16,
}: {
  pattern: DitherPatternId;
  coverage: number;
  ink: MonoInk;
  ox: number;
  oy: number;
  px?: number;
}) {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const c = ref.current;
    if (!c) return;
    const ctx = c.getContext("2d");
    if (!ctx) return;
    const n = px;
    c.width = n;
    c.height = n;
    const bg: 0 | 255 = ink === 0 ? 255 : 0;
    const thr = coverage * 64;
    const img = ctx.createImageData(n, n);
    for (let y = 0; y < n; y++) {
      for (let x = 0; x < n; x++) {
        const rank = sampleDitherRank(pattern, x, y, ox, oy);
        const v =
          coverage >= 0.995 ? ink : coverage <= 0.001 ? bg : rank < thr ? ink : bg;
        const o = (y * n + x) * 4;
        img.data[o] = v;
        img.data[o + 1] = v;
        img.data[o + 2] = v;
        img.data[o + 3] = 255;
      }
    }
    ctx.putImageData(img, 0, 0);
  }, [pattern, coverage, ink, ox, oy, px]);
  return (
    <canvas
      ref={ref}
      width={px}
      height={px}
      style={{
        width: px,
        height: px,
        imageRendering: "pixelated",
        display: "block",
      }}
    />
  );
}

