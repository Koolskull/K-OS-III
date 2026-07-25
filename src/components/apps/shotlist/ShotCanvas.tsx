/*
 * SHOTLIST — mono shot plate editor
 * Single top bar · left pen panel · unified pen + dither slider
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
  /** Optional close — Escape still works if provided */
  onCancel?: () => void;
  title?: string;
  onOpenInSpriteEditor?: (liveDataUrl: string) => void;
  embedded?: boolean;
  onLiveChange?: (dataUrl: string) => void;
}

const miniBtn = (active = false): React.CSSProperties => ({
  padding: "4px 10px",
  background: active ? "#ffffff" : "#000000",
  color: active ? "#000000" : "#cccccc",
  border: active ? "1px solid #ffffff" : "1px solid #555555",
  cursor: "pointer",
  fontFamily: "inherit",
  fontSize: 10,
  letterSpacing: 1,
  touchAction: "manipulation",
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
  const inkRef = useRef<MonoInk>(bg === "white" ? 0 : 255);
  const ditherOxRef = useRef(0);
  const ditherOyRef = useRef(0);
  const ditherPatternRef = useRef<DitherPatternId>(DEFAULT_DITHER_PATTERN);
  const ditherAmountRef = useRef(0.45);

  const [ink, setInk] = useState<MonoInk>(bg === "white" ? 0 : 255);
  const [ditherOx, setDitherOx] = useState(0);
  const [ditherOy, setDitherOy] = useState(0);
  const [ditherPattern, setDitherPattern] = useState<DitherPatternId>(
    DEFAULT_DITHER_PATTERN,
  );
  /** 0 = solid pen · 1 = full dither density */
  const [ditherAmount, setDitherAmount] = useState(0.45);
  const [toolsOpen, setToolsOpen] = useState(true);
  const [helpOpen, setHelpOpen] = useState(false);
  const [ready, setReady] = useState(false);
  const [status, setStatus] = useState("Loading plate…");
  const [baseScale, setBaseScale] = useState(0.5);

  inkRef.current = ink;
  ditherOxRef.current = ditherOx;
  ditherOyRef.current = ditherOy;
  ditherPatternRef.current = ditherPattern;
  ditherAmountRef.current = ditherAmount;

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
      setStatus(`${plateW}×${plateH} · mono`);
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

  const stampAt = useCallback(
    (x: number, y: number, pressure: number) => {
      const { w, h } = sizeRef.current;
      const amount = ditherAmountRef.current;
      const base = {
        ink: inkRef.current,
        pressure,
        ditherOx: ditherOxRef.current,
        ditherOy: ditherOyRef.current,
        width: w,
        height: h,
        ditherPattern: ditherPatternRef.current,
      };
      // Unified pen: slider 0 → solid; >0 → dither density × pressure
      if (amount < 0.03) {
        stampPen(bmpRef.current, x, y, base);
      } else {
        stampDither(bmpRef.current, x, y, {
          ...base,
          pressure: Math.min(1, pressure * (0.15 + 0.85 * amount)),
        });
      }
    },
    [],
  );

  const strokeTo = useCallback(
    (x: number, y: number, pressure: number) => {
      const last = lastPtRef.current;
      if (!last) {
        stampAt(x, y, pressure);
      } else {
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
      setStatus(
        `PEN · ${inkRef.current === 0 ? "BLK" : "WHT"} · dither ${Math.round(ditherAmountRef.current * 100)}% · p${p.toFixed(2)}`,
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
      if (e.code === "Space") e.preventDefault();
      const k = e.key.toLowerCase();
      if ((e.metaKey || e.ctrlKey) && k === "z") {
        e.preventDefault();
        undo();
        return;
      }
      if (k === "0" && !e.metaKey && !e.ctrlKey) {
        resetViewport();
        setStatus("View reset · fill");
        return;
      }
      if (k === "t") {
        setToolsOpen((v) => !v);
        return;
      }
      switch (k) {
        case "x":
          setInk((v) => (v === 0 ? 255 : 0));
          break;
        case "enter":
          e.preventDefault();
          handleSave();
          break;
        case "escape":
          e.preventDefault();
          onCancel?.();
          break;
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

  return (
    <div style={rootStyle}>
      {/* Single top bar: title + FIT / SPRITE / SAVE */}
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
        <div style={{ display: "flex", alignItems: "center", gap: 10, minWidth: 0 }}>
          <span style={{ color: "#ffff00", letterSpacing: 2, fontSize: 11 }}>
            ☦ {title}
          </span>
          <span style={{ color: "#555", fontSize: 9, letterSpacing: 1 }}>
            {plateW}×{plateH}
          </span>
        </div>
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap", alignItems: "center" }}>
          <button type="button" style={miniBtn()} onClick={zoomFit} title="Fit view (0)">
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
      </div>

      {/* Stage + left tools */}
      <div style={{ flex: 1, minHeight: 0, display: "flex", position: "relative", overflow: "hidden" }}>
        {/* Left collapsible pen panel */}
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
            onClick={() => setToolsOpen((v) => !v)}
            title={toolsOpen ? "Hide pen tools (T)" : "Show pen tools (T)"}
            style={{
              width: 40,
              height: 32,
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
                width: 200,
                flex: 1,
                overflowY: "auto",
                padding: 8,
                display: "flex",
                flexDirection: "column",
                gap: 10,
              }}
            >
              <div style={{ fontSize: 8, color: "#666", letterSpacing: 1 }}>INK</div>
              <div style={{ display: "flex", gap: 6 }}>
                <button type="button" style={{ ...miniBtn(ink === 0), flex: 1 }} onClick={() => setInk(0)}>
                  BLK
                </button>
                <button type="button" style={{ ...miniBtn(ink === 255), flex: 1 }} onClick={() => setInk(255)}>
                  WHT
                </button>
              </div>

              <div style={{ fontSize: 8, color: "#666", letterSpacing: 1 }}>
                DITHER · {Math.round(ditherAmount * 100)}%
                {ditherAmount < 0.03 ? " (SOLID)" : ""}
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <input
                  type="range"
                  min={0}
                  max={100}
                  value={Math.round(ditherAmount * 100)}
                  onChange={(e) => setDitherAmount(Number(e.target.value) / 100)}
                  style={{ flex: 1, accentColor: "#fff", height: 4, cursor: "pointer" }}
                  title="0 = solid pen · 100 = full dither opacity"
                />
              </div>

              <div style={{ fontSize: 8, color: "#666", letterSpacing: 1 }}>PATTERN</div>
              <div
                style={{
                  display: "flex",
                  flexWrap: "wrap",
                  gap: 6,
                  alignItems: "center",
                }}
              >
                {DITHER_PATTERNS.map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => {
                      setDitherPattern(p.id);
                      if (ditherAmount < 0.05) setDitherAmount(0.45);
                      setStatus(`Pattern · ${p.title}`);
                    }}
                    title={p.title}
                    style={{
                      width: 40,
                      height: 40,
                      padding: 2,
                      border:
                        ditherPattern === p.id ? "1px solid #fff" : "1px solid #333",
                      background: "#111",
                      cursor: "pointer",
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: 2,
                    }}
                  >
                    <DitherPreview
                      pattern={p.id}
                      ox={ditherOx}
                      oy={ditherOy}
                      ink={ink}
                      size={28}
                    />
                  </button>
                ))}
              </div>

              <div style={{ display: "flex", gap: 6 }}>
                <button
                  type="button"
                  style={{ ...miniBtn(), flex: 1, fontSize: 8 }}
                  onClick={() => setDitherOx((v) => (v + 1) % 8)}
                >
                  OX {ditherOx}
                </button>
                <button
                  type="button"
                  style={{ ...miniBtn(), flex: 1, fontSize: 8 }}
                  onClick={() => setDitherOy((v) => (v + 1) % 8)}
                >
                  OY {ditherOy}
                </button>
              </div>

              <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                <button type="button" style={miniBtn()} onClick={undo}>
                  UNDO
                </button>
                <button type="button" style={miniBtn()} onClick={clearPlate}>
                  CLEAR
                </button>
                <button type="button" style={miniBtn()} onClick={fillInk}>
                  FILL
                </button>
              </div>
              <button
                type="button"
                style={{ ...miniBtn(), marginTop: "auto" }}
                onClick={() => setToolsOpen(false)}
              >
                HIDE
              </button>
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

          {/* Lower-right help only (Shot info is parent) */}
          <button
            type="button"
            onClick={() => setHelpOpen((v) => !v)}
            title="Help"
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
            >
              <div style={{ color: "#aaa", marginBottom: 4 }}>{status}</div>
              <div>FIT / 0 — fill view</div>
              <div>T — pen tools</div>
              <div>SCROLL — zoom · SPACE — pan</div>
              <div>SHIFT/ALT — rotate</div>
              <div>Dither slider 0 = solid pen</div>
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
  size = 24,
}: {
  pattern: DitherPatternId;
  ox: number;
  oy: number;
  ink: MonoInk;
  size?: number;
}) {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const c = ref.current;
    if (!c) return;
    const ctx = c.getContext("2d");
    if (!ctx) return;
    const cells = 8;
    const s = Math.max(1, Math.floor(size / cells));
    c.width = cells * s;
    c.height = cells * s;
    for (let y = 0; y < cells; y++) {
      for (let x = 0; x < cells; x++) {
        const rank = sampleDitherRank(pattern, x, y, ox, oy);
        const on = rank < 32;
        const v = on ? ink : ink === 0 ? 255 : 0;
        ctx.fillStyle = v === 0 ? "#000" : "#fff";
        ctx.fillRect(x * s, y * s, s, s);
      }
    }
  }, [pattern, ox, oy, ink, size]);
  return (
    <canvas
      ref={ref}
      width={size}
      height={size}
      style={{
        width: size,
        height: size,
        imageRendering: "pixelated",
        display: "block",
      }}
    />
  );
}
