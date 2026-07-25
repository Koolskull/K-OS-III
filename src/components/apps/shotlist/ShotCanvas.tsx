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
  DITHER_PATTERNS,
  SHOT_H,
  SHOT_W,
  bitmapToDataURL,
  bitmapToImageData,
  cloneBitmap,
  createBlankBitmap,
  dataURLToBitmap,
  forEachStrokePoint,
  normalizePressure,
  renderDitherGradientStrip,
  sampleDitherRank,
  stampDither,
  stampPen,
  type DitherPatternId,
  type MonoInk,
  type ShotBg,
} from "./monoDraw";

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

  const [ink, setInk] = useState<MonoInk>(bg === "white" ? 0 : 255);
  const [ditherOx, setDitherOx] = useState(0);
  const [ditherOy, setDitherOy] = useState(0);
  const [ditherPattern, setDitherPattern] = useState<DitherPatternId>(
    DEFAULT_DITHER_PATTERN,
  );
  /** Ordered-dither gray coverage 0..1 (Bayer gradient stop) */
  const [coverage, setCoverage] = useState(0.5);
  const [toolsOpen, setToolsOpen] = useState(true);
  const [helpOpen, setHelpOpen] = useState(false);
  const [ready, setReady] = useState(false);
  const [status, setStatus] = useState("Loading…");
  const [baseScale, setBaseScale] = useState(0.5);

  inkRef.current = ink;
  ditherOxRef.current = ditherOx;
  ditherOyRef.current = ditherOy;
  ditherPatternRef.current = ditherPattern;
  coverageRef.current = coverage;

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
    transformStyle,
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
  });

  useEffect(() => {
    let cancelled = false;
    setReady(false);
    (async () => {
      if (initialDataUrl) {
        bmpRef.current = await dataURLToBitmap(initialDataUrl, plateW, plateH, bg);
      } else {
        bmpRef.current = createBlankBitmap(bg, plateW, plateH);
      }
      if (cancelled) return;
      undoRef.current = [];
      resetViewport();
      setReady(true);
      setStatus("ready");
      requestAnimationFrame(() => paintView());
    })();
    return () => {
      cancelled = true;
    };
  }, [initialDataUrl, bg, plateW, plateH, paintView, resetViewport]);

  // Ordered-dither gradient strip — true 1:1 pixels (no CSS stretch)
  const GRAD_W = 20;
  const GRAD_H = 128;
  useEffect(() => {
    const c = gradientRef.current;
    if (!c || !toolsOpen) return;
    const ctx = c.getContext("2d");
    if (!ctx) return;
    c.width = GRAD_W;
    c.height = GRAD_H;
    const inkV = ink;
    const bgV: 0 | 255 = ink === 0 ? 255 : 0;
    // Top = solid (100%), bottom = empty (0%) — matches native vertical range (high at top)
    renderDitherGradientStrip(ctx, GRAD_W, GRAD_H, ditherPattern, inkV, bgV, {
      ox: ditherOx,
      oy: ditherOy,
      invertCoverage: true,
    });
  }, [ditherPattern, ditherOx, ditherOy, ink, toolsOpen]);

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

  const clientToPlate = useCallback(
    (clientX: number, clientY: number): { x: number; y: number } | null => {
      const canvas = viewRef.current;
      if (!canvas) return null;
      const { w, h } = sizeRef.current;
      const { x, y } = clientToCanvasBitmap(canvas, clientX, clientY, viewport.rotation);
      if (x < -2 || y < -2 || x > w + 2 || y > h + 2) return null;
      return {
        x: Math.max(0, Math.min(w - 0.01, x)),
        y: Math.max(0, Math.min(h - 0.01, y)),
      };
    },
    [viewport.rotation],
  );

  const stampAt = useCallback((x: number, y: number, pressure: number) => {
    const { w, h } = sizeRef.current;
    const cov = coverageRef.current;
    const base = {
      ink: inkRef.current,
      pressure,
      ditherOx: ditherOxRef.current,
      ditherOy: ditherOyRef.current,
      width: w,
      height: h,
      ditherPattern: ditherPatternRef.current,
      coverage: cov,
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

  const onPointerDown = useCallback(
    (e: React.PointerEvent<HTMLCanvasElement>) => {
      if (!ready) return;
      if (vpDown(e)) {
        drawingRef.current = false;
        return;
      }
      if (e.button !== 0 && e.pointerType === "mouse") return;
      e.preventDefault();
      const pt = clientToPlate(e.clientX, e.clientY);
      if (!pt) return;
      try {
        (e.target as HTMLCanvasElement).setPointerCapture(e.pointerId);
      } catch {
        /* ignore */
      }
      pointerIdRef.current = e.pointerId;
      drawingRef.current = true;
      pushUndo();
      lastPtRef.current = null;
      const p = normalizePressure(e.pressure, e.pointerType, e.buttons);
      strokeTo(pt.x, pt.y, p);
    },
    [ready, vpDown, clientToPlate, pushUndo, strokeTo],
  );

  const onPointerMove = useCallback(
    (e: React.PointerEvent<HTMLCanvasElement>) => {
      if (vpMove(e)) return;
      if (!drawingRef.current || pointerIdRef.current !== e.pointerId) return;
      e.preventDefault();
      const pt = clientToPlate(e.clientX, e.clientY);
      if (!pt) return;
      strokeTo(pt.x, pt.y, normalizePressure(e.pressure, e.pointerType, e.buttons));
    },
    [vpMove, clientToPlate, strokeTo],
  );

  const endStroke = useCallback(
    (e: React.PointerEvent<HTMLCanvasElement>) => {
      vpUp(e);
      if (pointerIdRef.current === e.pointerId || pointerIdRef.current == null) {
        drawingRef.current = false;
        pointerIdRef.current = null;
        lastPtRef.current = null;
      }
      try {
        (e.target as HTMLCanvasElement).releasePointerCapture(e.pointerId);
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
  }, [undo, handleSave, onCancel, resetViewport]);

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
        {/* Left tools */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            flexShrink: 0,
            borderRight: "1px solid #222",
            background: "#000",
          }}
        >
          <button
            type="button"
            onClick={() => setToolsOpen((v) => !v)}
            title="Pen tools (T)"
            style={{
              width: 36,
              height: 28,
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
                overflowY: "auto",
                padding: 4,
                display: "flex",
                flexDirection: "column",
                gap: 6,
                alignItems: "center",
              }}
            >
              <div style={{ display: "flex", gap: 3, width: "100%" }}>
                <button type="button" style={{ ...miniBtn(ink === 0), flex: 1, padding: "2px 0" }} onClick={() => setInk(0)}>
                  B
                </button>
                <button type="button" style={{ ...miniBtn(ink === 255), flex: 1, padding: "2px 0" }} onClick={() => setInk(255)}>
                  W
                </button>
              </div>

              <div style={{ fontSize: 7, color: "#555", letterSpacing: 1 }}>
                {Math.round(coverage * 100)}%
              </div>

              {/*
                Vertical tone rail: gradient strip is the control.
                Top = solid 100%, bottom = empty 0% (yellow line tracks coverage).
                Canvas pixels are 1:1 with CSS size — no stretch.
              */}
              <div
                style={{
                  display: "flex",
                  flexDirection: "row",
                  gap: 4,
                  alignItems: "flex-start",
                }}
              >
                <div
                  style={{
                    position: "relative",
                    width: GRAD_W,
                    height: GRAD_H,
                    border: "1px solid #333",
                    cursor: "ns-resize",
                    flexShrink: 0,
                    imageRendering: "pixelated",
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
                    height={GRAD_H}
                    style={{
                      width: GRAD_W,
                      height: GRAD_H,
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
                      // top of strip = 100% → line at (1 - coverage)
                      top: `${(1 - coverage) * 100}%`,
                      height: 2,
                      background: "#ffff00",
                      transform: "translateY(-1px)",
                      pointerEvents: "none",
                      boxShadow: "0 0 0 1px #000",
                    }}
                  />
                </div>

                {/* Kernel swatches — fixed 16×16 1:1 px, stacked */}
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: 2,
                    maxHeight: GRAD_H,
                    overflowY: "auto",
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
                        padding: 0,
                        border:
                          ditherPattern === p.id ? "1px solid #ffff00" : "1px solid #333",
                        background: "#000",
                        cursor: "pointer",
                        lineHeight: 0,
                        flexShrink: 0,
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

              <div style={{ display: "flex", flexDirection: "column", gap: 3, width: "100%" }}>
                <button type="button" style={{ ...miniBtn(), width: "100%", fontSize: 8 }} onClick={undo}>
                  UNDO
                </button>
                <button type="button" style={{ ...miniBtn(), width: "100%", fontSize: 8 }} onClick={clearPlate}>
                  CLR
                </button>
                <button type="button" style={{ ...miniBtn(), width: "100%", fontSize: 8 }} onClick={fillInk}>
                  FILL
                </button>
                <button type="button" style={{ ...miniBtn(), width: "100%", fontSize: 8 }} onClick={() => setToolsOpen(false)}>
                  HIDE
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Canvas */}
        <div
          ref={wrapRef}
          style={{
            flex: 1,
            minWidth: 0,
            minHeight: 0,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
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
              onPointerDown={onPointerDown}
              onPointerMove={onPointerMove}
              onPointerUp={endStroke}
              onPointerCancel={endStroke}
              style={{
                width: cssW,
                height: cssH,
                imageRendering: "pixelated",
                outline: "1px solid #333",
                border: "none",
                display: "block",
                touchAction: "none",
                background: bg === "white" ? "#fff" : "#000",
                transform:
                  Math.abs(viewport.panX) > 0.01 ||
                  Math.abs(viewport.panY) > 0.01 ||
                  Math.abs(viewport.rotation) > 0.01
                    ? transformStyle
                    : undefined,
                transformOrigin: "center center",
              }}
            />
          ) : (
            <div style={{ color: "#444", fontSize: 10 }}>…</div>
          )}

          <button
            type="button"
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
                maxWidth: 200,
                padding: 8,
                background: "#000",
                border: "1px solid #444",
                fontSize: 8,
                color: "#888",
                lineHeight: 1.6,
                letterSpacing: 1,
              }}
            >
              <div>Ordered dither (Bayer tone) — vertical slider = gray %</div>
              <div>0% empty · 50% checker · 100% solid</div>
              <div>SCROLL zoom · SPACE pan · SHIFT/ALT rotate</div>
              <div>FIT · T tools · X ink · ⌘Z undo</div>
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

