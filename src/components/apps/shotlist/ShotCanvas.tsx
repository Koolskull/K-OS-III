/*
 * SHOTLIST — mono shot plate editor
 * Thumbnail portrait/landscape · optional HD/4K
 * Harsh / pressure pen / dither + shared viewport gestures
 */

"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import { clientToCanvasBitmap, useCanvasViewport } from "@/lib/creative";
import {
  BAYER8,
  SHOT_H,
  SHOT_W,
  bitmapToDataURL,
  bitmapToImageData,
  cloneBitmap,
  createBlankBitmap,
  dataURLToBitmap,
  forEachStrokePoint,
  normalizePressure,
  stampTool,
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

  const [tool, setTool] = useState<DrawTool>("harsh");
  const [ink, setInk] = useState<MonoInk>(bg === "white" ? 0 : 255);
  const [ditherOx, setDitherOx] = useState(0);
  const [ditherOy, setDitherOy] = useState(0);
  const [ready, setReady] = useState(false);
  const [status, setStatus] = useState("Loading plate…");
  const [baseScale, setBaseScale] = useState(0.5);

  toolRef.current = tool;
  inkRef.current = ink;
  ditherOxRef.current = ditherOx;
  ditherOyRef.current = ditherOy;

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
  const zoomFit = useCallback(() => {
    resetViewport();
    setStatus("Zoom fit");
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

  return (
    <div style={rootStyle}>
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
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
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
        <button type="button" style={toolBtn(tool === "dither")} onClick={() => setTool("dither")}>
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

        {/* Desktop zoom controls */}
        <span style={{ width: 1, height: 20, background: "#333", margin: "0 4px" }} />
        <button
          type="button"
          style={miniBtn()}
          onClick={zoomOut}
          title="Zoom out (scroll down)"
        >
          −
        </button>
        <button
          type="button"
          style={{ ...miniBtn(), minWidth: 48 }}
          onClick={zoomFit}
          title="Fit / reset zoom (0)"
        >
          {zoomPct}%
        </button>
        <button
          type="button"
          style={miniBtn()}
          onClick={zoomIn}
          title="Zoom in (scroll up)"
        >
          +
        </button>
        <button
          type="button"
          style={miniBtn()}
          onClick={() => setZoom(1)}
          title="100% camera zoom"
        >
          1:1
        </button>

        {tool === "dither" && (
          <>
            <button type="button" style={miniBtn()} onClick={() => setDitherOx((v) => (v + 1) % 8)}>
              OX {ditherOx}
            </button>
            <button type="button" style={miniBtn()} onClick={() => setDitherOy((v) => (v + 1) % 8)}>
              OY {ditherOy}
            </button>
            <DitherPreview ox={ditherOx} oy={ditherOy} ink={ink} />
          </>
        )}
      </div>

      <div
        ref={wrapRef}
        onWheel={onWheelZoom}
        style={{
          flex: 1,
          minHeight: 0,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#111",
          overflow: "hidden",
          touchAction: "none",
          cursor: grab ? "grab" : "crosshair",
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
              // outline does not affect hit-testing / getBoundingClientRect
              outline: "1px solid #444",
              border: "none",
              padding: 0,
              margin: 0,
              display: "block",
              touchAction: "none",
              background: bg === "white" ? "#fff" : "#000",
              // Only apply transform when non-identity (avoids subpixel drift at rest)
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
      </div>

      <div
        style={{
          borderTop: "1px solid #222",
          padding: "4px 10px",
          fontSize: 8,
          color: "#666",
          letterSpacing: 1,
          display: "flex",
          justifyContent: "space-between",
          flexShrink: 0,
          gap: 8,
          flexWrap: "wrap",
        }}
      >
        <span>{status}</span>
        <span>
          SCROLL zoom · +/− buttons · SPACE+DRAG pan · SHIFT+DRAG rotate · 0 fit
        </span>
      </div>
    </div>
  );
}

function DitherPreview({
  ox,
  oy,
  ink,
}: {
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
        const b = BAYER8[(y + oy) % 8]![(x + ox) % 8]!;
        const on = b < 32;
        const v = on ? ink : ink === 0 ? 255 : 0;
        ctx.fillStyle = v === 0 ? "#000" : "#fff";
        ctx.fillRect(x * s, y * s, s, s);
      }
    }
  }, [ox, oy, ink]);
  return (
    <canvas
      ref={ref}
      style={{
        width: 24,
        height: 24,
        imageRendering: "pixelated",
        border: "1px solid #444",
      }}
    />
  );
}
