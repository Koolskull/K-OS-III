/*
 * SHOTLIST — mono shot plate editor
 * Thumbnail portrait/landscape · optional HD/4K
 * Harsh / pressure pen / dither + shared viewport gestures
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
  sampleDitherRank,
  stampTool,
  type DitherPatternId,
  type DrawTool,
  type MonoInk,
  type ShotBg,
} from "./monoDraw";

export interface ShotCanvasProps {
  initialDataUrl: string | null;
  bg: ShotBg;
  width?: number;
  height?: number;
  onSave: (dataUrl: string) => void;
  onCancel: () => void;
  title?: string;
  onOpenInSpriteEditor?: (liveDataUrl: string) => void;
  /**
   * When true, fills parent instead of covering the whole app —
   * used for draw + metadata split layout.
   */
  embedded?: boolean;
  /** Live export of the plate (for parent metadata save without full SAVE) */
  onLiveChange?: (dataUrl: string) => void;
}

const toolBtn = (active: boolean): React.CSSProperties => ({
  padding: "6px 10px",
  background: active ? "#ffffff" : "#000000",
  color: active ? "#000000" : "#cccccc",
  border: active ? "1px solid #ffffff" : "1px solid #555555",
  cursor: "pointer",
  fontFamily: "inherit",
  fontSize: 10,
  letterSpacing: 1,
  touchAction: "manipulation",
});

const miniBtn = (active = false): React.CSSProperties => ({
  ...toolBtn(active),
  padding: "4px 8px",
  fontSize: 9,
  minWidth: 36,
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
  title = "SHOT PLATE",
  onOpenInSpriteEditor,
  embedded = false,
  onLiveChange,
}: ShotCanvasProps) {
  const plateW = width;
  const plateH = height;
  const viewRef = useRef<HTMLCanvasElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  const bmpRef = useRef<Uint8ClampedArray>(createBlankBitmap(bg, plateW, plateH));
  const sizeRef = useRef({ w: plateW, h: plateH });
  sizeRef.current = { w: plateW, h: plateH };
  const drawingRef = useRef(false);
  const lastPtRef = useRef<{ x: number; y: number } | null>(null);
  const pointerIdRef = useRef<number | null>(null);
  const undoRef = useRef<Uint8ClampedArray[]>([]);
  const toolRef = useRef<DrawTool>("harsh");
  const inkRef = useRef<MonoInk>(bg === "white" ? 0 : 255);
  const ditherOxRef = useRef(0);
  const ditherOyRef = useRef(0);
  const ditherPatternRef = useRef<DitherPatternId>(DEFAULT_DITHER_PATTERN);

  const [tool, setTool] = useState<DrawTool>("harsh");
  const [ink, setInk] = useState<MonoInk>(bg === "white" ? 0 : 255);
  const [ditherOx, setDitherOx] = useState(0);
  const [ditherOy, setDitherOy] = useState(0);
  const [ditherPattern, setDitherPattern] = useState<DitherPatternId>(
    DEFAULT_DITHER_PATTERN,
  );
  /** Left collapsible dither-pattern rail */
  const [ditherPanelOpen, setDitherPanelOpen] = useState(false);
  /** Far lower-right help (`?`) — status/shortcuts only when open */
  const [helpOpen, setHelpOpen] = useState(false);
  const [ready, setReady] = useState(false);
  const [status, setStatus] = useState("Loading plate…");
  const [baseScale, setBaseScale] = useState(0.5);

  toolRef.current = tool;
  inkRef.current = ink;
  ditherOxRef.current = ditherOx;
  ditherOyRef.current = ditherOy;
  ditherPatternRef.current = ditherPattern;

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
    if (!prev) {
      setStatus("Nothing to undo");
      return;
    }
    bmpRef.current = prev;
    paintView();
    setStatus("Undo");
  }, [paintView]);

  const {
    viewport,
    transformStyle,
    resetViewport,
    setZoom,
    zoomBy,
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
      setStatus(`${plateW}×${plateH} · ${bg.toUpperCase()} · mono`);
      requestAnimationFrame(() => paintView());
    })();
    return () => {
      cancelled = true;
    };
  }, [initialDataUrl, bg, plateW, plateH, paintView, resetViewport]);

  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const fit = () => {
      const rect = el.getBoundingClientRect();
      const pad = 16;
      const sx = (rect.width - pad) / plateW;
      const sy = (rect.height - pad) / plateH;
      const cap = plateW >= 3000 ? 0.4 : plateW >= 1500 ? 0.7 : 1.2;
      setBaseScale(Math.max(0.05, Math.min(sx, sy, cap)));
    };
    fit();
    const ro = new ResizeObserver(fit);
    ro.observe(el);
    // Non-passive wheel so preventDefault stops page scroll while zooming
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

  /** Map mouse/touch → plate pixels (border-aware, transform-safe). */
  const clientToPlate = useCallback(
    (clientX: number, clientY: number): { x: number; y: number } | null => {
      const canvas = viewRef.current;
      if (!canvas) return null;
      const { w, h } = sizeRef.current;
      const { x, y } = clientToCanvasBitmap(
        canvas,
        clientX,
        clientY,
        viewport.rotation,
      );
      if (x < -2 || y < -2 || x > w + 2 || y > h + 2) return null;
      return {
        x: Math.max(0, Math.min(w - 0.01, x)),
        y: Math.max(0, Math.min(h - 0.01, y)),
      };
    },
    [viewport.rotation],
  );

  const strokeTo = useCallback(
    (x: number, y: number, pressure: number) => {
      const { w, h } = sizeRef.current;
      const opts = {
        ink: inkRef.current,
        pressure,
        ditherOx: ditherOxRef.current,
        ditherOy: ditherOyRef.current,
        width: w,
        height: h,
        ditherPattern: ditherPatternRef.current,
      };
      const last = lastPtRef.current;
      if (!last) {
        stampTool(bmpRef.current, toolRef.current, x, y, opts);
      } else {
        forEachStrokePoint(last.x, last.y, x, y, (px, py) => {
          stampTool(bmpRef.current, toolRef.current, px, py, opts);
        });
      }
      lastPtRef.current = { x, y };
      paintView();
    },
    [paintView],
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
      setStatus(
        `${toolRef.current.toUpperCase()} · ${inkRef.current === 0 ? "BLK" : "WHT"} · p${p.toFixed(2)}`,
      );
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
      const p = normalizePressure(e.pressure, e.pointerType, e.buttons);
      strokeTo(pt.x, pt.y, p);
    },
    [vpMove, clientToPlate, strokeTo],
  );

  const endStroke = useCallback(
    (e: React.PointerEvent<HTMLCanvasElement>) => {
      vpUp(e);
      if (pointerIdRef.current !== e.pointerId && pointerIdRef.current != null) {
        /* other pointer */
      }
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
    setStatus(`Cleared to ${bg.toUpperCase()}`);
  }, [bg, plateW, plateH, pushUndo, paintView]);

  const fillInk = useCallback(() => {
    pushUndo();
    bmpRef.current.fill(ink);
    paintView();
    setStatus(`Filled ${ink === 0 ? "BLACK" : "WHITE"}`);
  }, [ink, pushUndo, paintView]);

  const exportUrl = useCallback(() => {
    const { w, h } = sizeRef.current;
    return bitmapToDataURL(bmpRef.current, w, h);
  }, []);

  const handleSave = useCallback(() => {
    onSave(exportUrl());
  }, [onSave, exportUrl]);

  const handleOpenSprite = useCallback(() => {
    if (!onOpenInSpriteEditor) return;
    onOpenInSpriteEditor(exportUrl());
  }, [onOpenInSpriteEditor, exportUrl]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }
      if (e.code === "Space") {
        e.preventDefault(); // avoid page scroll while panning
      }
      const k = e.key.toLowerCase();
      if ((e.metaKey || e.ctrlKey) && k === "z") {
        e.preventDefault();
        undo();
        return;
      }
      if (k === "0" && !e.metaKey && !e.ctrlKey) {
        resetViewport();
        setStatus("Viewport reset");
        return;
      }
      switch (k) {
        case "1":
        case "h":
          setTool("harsh");
          setStatus("HARSH pen");
          break;
        case "2":
        case "b":
          setTool("pen");
          setStatus("PEN (pressure size)");
          break;
        case "3":
        case "d":
          setTool("dither");
          setStatus("DITHER pencil");
          break;
        case "x":
          setInk((v) => (v === 0 ? 255 : 0));
          break;
        case "[":
          setDitherOx((v) => (v + 7) % 8);
          break;
        case "]":
          setDitherOx((v) => (v + 1) % 8);
          break;
        case ";":
          setDitherOy((v) => (v + 7) % 8);
          break;
        case "'":
          setDitherOy((v) => (v + 1) % 8);
          break;
        case "enter":
          e.preventDefault();
          handleSave();
          break;
        case "escape":
          e.preventDefault();
          onCancel();
          break;
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [undo, handleSave, onCancel, resetViewport]);

  // Zoom via layout size (base fit × camera zoom) — reliable for mouse hit-testing
  const displayScale = baseScale * (viewport.zoom || 1);
  const cssW = Math.max(1, Math.floor(plateW * displayScale));
  const cssH = Math.max(1, Math.floor(plateH * displayScale));
  const grab = spaceDownRef.current;
  const zoomPct = Math.round((viewport.zoom || 1) * 100);

  const zoomIn = useCallback(() => zoomBy(1.2), [zoomBy]);
  const zoomOut = useCallback(() => zoomBy(1 / 1.2), [zoomBy]);
  /** Reset zoom, pan, and rotation to normal fill view */
  const zoomFit = useCallback(() => {
    resetViewport();
    setStatus("View reset · fill");
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

  const sideToggle: React.CSSProperties = {
    width: 36,
    height: 28,
    flexShrink: 0,
    border: "1px solid #555",
    background: ditherPanelOpen ? "#fff" : "#000",
    color: ditherPanelOpen ? "#000" : "#888",
    fontFamily: "inherit",
    fontSize: 8,
    letterSpacing: 1,
    cursor: "pointer",
    touchAction: "manipulation",
  };

  return (
    <div style={rootStyle}>
      {/* Header */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 8,
          padding: "6px 10px",
          borderBottom: "2px solid #fff",
          flexShrink: 0,
          flexWrap: "wrap",
        }}
      >
        <span style={{ color: "#ffff00", letterSpacing: 2, fontSize: 11 }}>
          ☦ {title}
        </span>
        <span style={{ color: "#666", fontSize: 9, letterSpacing: 1 }}>
          {plateW}×{plateH} · MONO · {zoomPct}%
          {Math.abs(viewport.rotation) >= 0.5
            ? ` · r${Math.round(viewport.rotation)}°`
            : ""}
        </span>
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap", alignItems: "center" }}>
          <button
            type="button"
            style={miniBtn()}
            onClick={zoomFit}
            title="Reset zoom, pan, and rotation to normal fill view (0)"
          >
            FIT
          </button>
          {onOpenInSpriteEditor && (
            <button type="button" style={miniBtn()} onClick={handleOpenSprite}>
              → SPRITE
            </button>
          )}
          <button type="button" style={miniBtn()} onClick={onCancel}>
            CANCEL
          </button>
          <button type="button" style={miniBtn(true)} onClick={handleSave}>
            SAVE
          </button>
        </div>
      </div>

      {/* Compact main tools (no dither patterns here) */}
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          gap: 6,
          padding: "6px 10px",
          borderBottom: "1px solid #222",
          alignItems: "center",
          flexShrink: 0,
        }}
      >
        <button type="button" style={toolBtn(tool === "harsh")} onClick={() => setTool("harsh")}>
          HARSH
        </button>
        <button type="button" style={toolBtn(tool === "pen")} onClick={() => setTool("pen")}>
          PEN
        </button>
        <button
          type="button"
          style={toolBtn(tool === "dither")}
          onClick={() => {
            setTool("dither");
            setDitherPanelOpen(true);
          }}
          title="Dither — open patterns on left"
        >
          DITHER
        </button>
        <span style={{ width: 1, height: 20, background: "#333", margin: "0 4px" }} />
        <button type="button" style={toolBtn(ink === 0)} onClick={() => setInk(0)}>
          BLK
        </button>
        <button type="button" style={toolBtn(ink === 255)} onClick={() => setInk(255)}>
          WHT
        </button>
        <span style={{ width: 1, height: 20, background: "#333", margin: "0 4px" }} />
        <button type="button" style={miniBtn()} onClick={undo}>
          UNDO
        </button>
        <button type="button" style={miniBtn()} onClick={clearPlate}>
          CLEAR
        </button>
        <button type="button" style={miniBtn()} onClick={fillInk}>
          FILL
        </button>
        <span style={{ width: 1, height: 20, background: "#333", margin: "0 4px" }} />
        <button type="button" style={miniBtn()} onClick={zoomOut} title="Zoom out">
          −
        </button>
        <button type="button" style={{ ...miniBtn(), minWidth: 48 }} onClick={zoomFit} title="Fit">
          {zoomPct}%
        </button>
        <button type="button" style={miniBtn()} onClick={zoomIn} title="Zoom in">
          +
        </button>
        <button type="button" style={miniBtn()} onClick={() => setZoom(1)} title="1:1 camera">
          1:1
        </button>
      </div>

      {/* Canvas row: left dither rail + stage */}
      <div
        style={{
          flex: 1,
          minHeight: 0,
          display: "flex",
          position: "relative",
          overflow: "hidden",
        }}
      >
        {/* Left dither pattern rail */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            flexShrink: 0,
            borderRight: "1px solid #222",
            background: "#000",
            zIndex: 5,
          }}
        >
          <button
            type="button"
            style={{ ...sideToggle, border: "none", borderBottom: "1px solid #333", width: 36 }}
            onClick={() => setDitherPanelOpen((v) => !v)}
            title={ditherPanelOpen ? "Hide dither patterns" : "Show dither patterns"}
            aria-expanded={ditherPanelOpen}
          >
            DTH
          </button>
          {ditherPanelOpen && (
            <div
              style={{
                width: 52,
                flex: 1,
                overflowY: "auto",
                display: "flex",
                flexDirection: "column",
                gap: 4,
                padding: 4,
                alignItems: "stretch",
              }}
            >
              <div style={{ fontSize: 7, color: "#555", letterSpacing: 1, textAlign: "center" }}>
                DITHER
              </div>
              {DITHER_PATTERNS.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  style={{
                    ...miniBtn(ditherPattern === p.id),
                    width: "100%",
                    minWidth: 0,
                    padding: "6px 2px",
                    fontSize: 8,
                  }}
                  onClick={() => {
                    setTool("dither");
                    setDitherPattern(p.id);
                    setStatus(`DITHER · ${p.title}`);
                  }}
                  title={p.title}
                >
                  {p.label}
                </button>
              ))}
              <button
                type="button"
                style={{ ...miniBtn(), width: "100%", minWidth: 0, fontSize: 8 }}
                onClick={() => setDitherOx((v) => (v + 1) % 8)}
                title="Phase X"
              >
                OX{ditherOx}
              </button>
              <button
                type="button"
                style={{ ...miniBtn(), width: "100%", minWidth: 0, fontSize: 8 }}
                onClick={() => setDitherOy((v) => (v + 1) % 8)}
                title="Phase Y"
              >
                OY{ditherOy}
              </button>
              <div style={{ display: "flex", justifyContent: "center", paddingTop: 4 }}>
                <DitherPreview
                  pattern={ditherPattern}
                  ox={ditherOx}
                  oy={ditherOy}
                  ink={ink}
                />
              </div>
              <button
                type="button"
                style={{ ...miniBtn(), width: "100%", minWidth: 0, fontSize: 7, marginTop: "auto" }}
                onClick={() => setDitherPanelOpen(false)}
                title="Hide dither panel"
              >
                HIDE
              </button>
            </div>
          )}
        </div>

        {/* Drawing stage */}
        <div
          ref={wrapRef}
          onWheel={onWheelZoom}
          style={{
            flex: 1,
            minWidth: 0,
            minHeight: 0,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: "#111",
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
              onWheel={onWheelZoom}
              style={{
                width: cssW,
                height: cssH,
                imageRendering: "pixelated",
                outline: "1px solid #444",
                border: "none",
                padding: 0,
                margin: 0,
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
            <div style={{ color: "#555", letterSpacing: 2, fontSize: 11 }}>LOADING…</div>
          )}

          {/* Far lower-right help toggle */}
          <button
            type="button"
            onClick={() => setHelpOpen((v) => !v)}
            title="Help / shortcuts"
            style={{
              position: "absolute",
              bottom: 6,
              right: 6,
              zIndex: 12,
              width: 32,
              height: 28,
              border: helpOpen ? "1px solid #fff" : "1px solid #555",
              background: helpOpen ? "#fff" : "#000",
              color: helpOpen ? "#000" : "#888",
              fontFamily: "inherit",
              fontSize: 12,
              cursor: "pointer",
              touchAction: "manipulation",
            }}
          >
            ?
          </button>
          {helpOpen && (
            <div
              style={{
                position: "absolute",
                bottom: 40,
                right: 6,
                zIndex: 12,
                maxWidth: 220,
                padding: 8,
                background: "#000",
                border: "1px solid #444",
                fontSize: 8,
                color: "#888",
                letterSpacing: 1,
                lineHeight: 1.6,
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <div style={{ color: "#aaa", marginBottom: 4 }}>{status}</div>
              <div>FIT · 0 — reset view</div>
              <div>SCROLL / +− — zoom</div>
              <div>SPACE+DRAG — pan</div>
              <div>SHIFT/ALT+DRAG — rotate</div>
              <div>DTH — dither patterns (left)</div>
              <div>2-FINGER TAP — undo</div>
              <button
                type="button"
                style={{ ...miniBtn(), marginTop: 6, width: "100%" }}
                onClick={() => setHelpOpen(false)}
              >
                CLOSE
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function DitherPreview({
  pattern,
  ox,
  oy,
  ink,
}: {
  pattern: DitherPatternId;
  ox: number;
  oy: number;
  ink: MonoInk;
}) {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const c = ref.current;
    if (!c) return;
    const ctx = c.getContext("2d");
    if (!ctx) return;
    const s = 3;
    c.width = 8 * s;
    c.height = 8 * s;
    for (let y = 0; y < 8; y++) {
      for (let x = 0; x < 8; x++) {
        const rank = sampleDitherRank(pattern, x, y, ox, oy);
        const on = rank < 32;
        const v = on ? ink : ink === 0 ? 255 : 0;
        ctx.fillStyle = v === 0 ? "#000" : "#fff";
        ctx.fillRect(x * s, y * s, s, s);
      }
    }
  }, [pattern, ox, oy, ink]);
  return (
    <canvas
      ref={ref}
      title="Dither pattern preview (mid density)"
      style={{
        width: 24,
        height: 24,
        imageRendering: "pixelated",
        border: "1px solid #444",
      }}
    />
  );
}
