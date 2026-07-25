/*
 * SHOTLIST — mono shot plate editor
 * Default 480×853 thumbnail; optional HD / 4K after first commit.
 * Harsh pen · pressure pen · dither pencil
 */

"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
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
  /** Working plate dimensions (thumbnail / HD / 4K) */
  width?: number;
  height?: number;
  onSave: (dataUrl: string) => void;
  onCancel: () => void;
  title?: string;
  onOpenInSpriteEditor?: (liveDataUrl: string) => void;
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
  const [scale, setScale] = useState(0.5);

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
      setReady(true);
      setStatus(`${plateW}×${plateH} · ${bg.toUpperCase()} plate · mono`);
      requestAnimationFrame(() => paintView());
    })();
    return () => {
      cancelled = true;
    };
  }, [initialDataUrl, bg, plateW, plateH, paintView]);

  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const fit = () => {
      const rect = el.getBoundingClientRect();
      const pad = 8;
      const sx = (rect.width - pad) / plateW;
      const sy = (rect.height - pad) / plateH;
      // Cap zoom lower for huge plates so they always fit
      const cap = plateW >= 3000 ? 0.45 : plateW >= 1500 ? 0.75 : 1.25;
      setScale(Math.max(0.05, Math.min(sx, sy, cap)));
    };
    fit();
    const ro = new ResizeObserver(fit);
    ro.observe(el);
    return () => ro.disconnect();
  }, [ready, plateW, plateH]);

  const clientToPlate = useCallback(
    (clientX: number, clientY: number): { x: number; y: number } | null => {
      const canvas = viewRef.current;
      if (!canvas) return null;
      const { w, h } = sizeRef.current;
      const rect = canvas.getBoundingClientRect();
      const x = ((clientX - rect.left) / rect.width) * w;
      const y = ((clientY - rect.top) / rect.height) * h;
      if (x < -2 || y < -2 || x > w + 2 || y > h + 2) return null;
      return {
        x: Math.max(0, Math.min(w - 0.01, x)),
        y: Math.max(0, Math.min(h - 0.01, y)),
      };
    },
    [],
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
      e.preventDefault();
      const pt = clientToPlate(e.clientX, e.clientY);
      if (!pt) return;
      (e.target as HTMLCanvasElement).setPointerCapture(e.pointerId);
      pointerIdRef.current = e.pointerId;
      drawingRef.current = true;
      pushUndo();
      lastPtRef.current = null;
      const p = normalizePressure(e.pressure, e.pointerType, e.buttons);
      strokeTo(pt.x, pt.y, p);
      setStatus(
        `${toolRef.current.toUpperCase()} · ink ${inkRef.current === 0 ? "BLK" : "WHT"} · p${p.toFixed(2)}`,
      );
    },
    [ready, clientToPlate, pushUndo, strokeTo],
  );

  const onPointerMove = useCallback(
    (e: React.PointerEvent<HTMLCanvasElement>) => {
      if (!drawingRef.current || pointerIdRef.current !== e.pointerId) return;
      e.preventDefault();
      const pt = clientToPlate(e.clientX, e.clientY);
      if (!pt) return;
      const p = normalizePressure(e.pressure, e.pointerType, e.buttons);
      strokeTo(pt.x, pt.y, p);
    },
    [clientToPlate, strokeTo],
  );

  const endStroke = useCallback((e: React.PointerEvent<HTMLCanvasElement>) => {
    if (pointerIdRef.current !== e.pointerId) return;
    drawingRef.current = false;
    pointerIdRef.current = null;
    lastPtRef.current = null;
    try {
      (e.target as HTMLCanvasElement).releasePointerCapture(e.pointerId);
    } catch {
      /* already released */
    }
  }, []);

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

  const handleSave = useCallback(() => {
    const { w, h } = sizeRef.current;
    onSave(bitmapToDataURL(bmpRef.current, w, h));
  }, [onSave]);

  const handleOpenSprite = useCallback(() => {
    if (!onOpenInSpriteEditor) return;
    const { w, h } = sizeRef.current;
    onOpenInSpriteEditor(bitmapToDataURL(bmpRef.current, w, h));
  }, [onOpenInSpriteEditor]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }
      const k = e.key.toLowerCase();
      if ((e.metaKey || e.ctrlKey) && k === "z") {
        e.preventDefault();
        undo();
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
  }, [undo, handleSave, onCancel]);

  const cssW = Math.floor(plateW * scale);
  const cssH = Math.floor(plateH * scale);

  return (
    <div
      style={{
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
      }}
    >
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
          {plateW}×{plateH} · MONO
        </span>
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
          {onOpenInSpriteEditor && (
            <button
              type="button"
              style={miniBtn()}
              onClick={handleOpenSprite}
              title="Continue in Sprite Editor (layers, full tool set)"
            >
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
        <button
          type="button"
          style={toolBtn(tool === "harsh")}
          onClick={() => setTool("harsh")}
          title="Harsh pen (1 / H)"
        >
          HARSH
        </button>
        <button
          type="button"
          style={toolBtn(tool === "pen")}
          onClick={() => setTool("pen")}
          title="Pen (2 / B) — pressure = size"
        >
          PEN
        </button>
        <button
          type="button"
          style={toolBtn(tool === "dither")}
          onClick={() => setTool("dither")}
          title="Dither pencil (3 / D)"
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

        <button type="button" style={miniBtn()} onClick={undo} title="Undo (Ctrl/Cmd+Z)">
          UNDO
        </button>
        <button type="button" style={miniBtn()} onClick={clearPlate}>
          CLEAR
        </button>
        <button type="button" style={miniBtn()} onClick={fillInk}>
          FILL
        </button>

        {tool === "dither" && (
          <>
            <span style={{ width: 1, height: 20, background: "#333", margin: "0 4px" }} />
            <span style={{ color: "#666", fontSize: 9, letterSpacing: 1 }}>PHASE</span>
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
        style={{
          flex: 1,
          minHeight: 0,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#111",
          overflow: "hidden",
          touchAction: "none",
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
              border: "1px solid #444",
              cursor: "crosshair",
              touchAction: "none",
              background: bg === "white" ? "#fff" : "#000",
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
          fontSize: 9,
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
          1/H HARSH · 2/B PEN · 3/D DITHER · X INK · ⌘Z · ENTER SAVE · ESC
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
      title="Dither matrix phase preview"
      style={{
        width: 24,
        height: 24,
        imageRendering: "pixelated",
        border: "1px solid #444",
      }}
    />
  );
}
