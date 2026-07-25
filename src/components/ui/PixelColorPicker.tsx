/*
 * PixelColorPicker — hard-pixel HSV picker + hex readout
 * Matches K-OS monochrome chrome; no OS native color widget.
 */

"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import { PixelKnob } from "./PixelKnob";

function clamp(v: number, a: number, b: number) {
  return Math.min(b, Math.max(a, v));
}

function hexNorm(hex: string): string {
  let h = hex.replace("#", "").trim();
  if (h.length === 3) {
    h = h[0]! + h[0] + h[1]! + h[1] + h[2]! + h[2];
  }
  if (h.length < 6) return "#000000";
  return `#${h.slice(0, 6).toLowerCase()}`;
}

function hexToRgb(hex: string): { r: number; g: number; b: number } {
  const h = hexNorm(hex).slice(1);
  return {
    r: parseInt(h.slice(0, 2), 16) || 0,
    g: parseInt(h.slice(2, 4), 16) || 0,
    b: parseInt(h.slice(4, 6), 16) || 0,
  };
}

function rgbToHex(r: number, g: number, b: number): string {
  const c = (n: number) =>
    clamp(Math.round(n), 0, 255).toString(16).padStart(2, "0");
  return `#${c(r)}${c(g)}${c(b)}`;
}

/** RGB 0–255 → HSV h 0–360, s/v 0–1 */
function rgbToHsv(r: number, g: number, b: number): { h: number; s: number; v: number } {
  const R = r / 255;
  const G = g / 255;
  const B = b / 255;
  const max = Math.max(R, G, B);
  const min = Math.min(R, G, B);
  const d = max - min;
  let h = 0;
  if (d > 1e-6) {
    if (max === R) h = ((G - B) / d + (G < B ? 6 : 0)) * 60;
    else if (max === G) h = ((B - R) / d + 2) * 60;
    else h = ((R - G) / d + 4) * 60;
  }
  const s = max <= 1e-6 ? 0 : d / max;
  return { h, s, v: max };
}

function hsvToRgb(h: number, s: number, v: number): { r: number; g: number; b: number } {
  const hh = ((h % 360) + 360) % 360;
  const c = v * s;
  const x = c * (1 - Math.abs(((hh / 60) % 2) - 1));
  const m = v - c;
  let rp = 0;
  let gp = 0;
  let bp = 0;
  if (hh < 60) {
    rp = c;
    gp = x;
  } else if (hh < 120) {
    rp = x;
    gp = c;
  } else if (hh < 180) {
    gp = c;
    bp = x;
  } else if (hh < 240) {
    gp = x;
    bp = c;
  } else if (hh < 300) {
    rp = x;
    bp = c;
  } else {
    rp = c;
    bp = x;
  }
  return {
    r: Math.round((rp + m) * 255),
    g: Math.round((gp + m) * 255),
    b: Math.round((bp + m) * 255),
  };
}

function hueColor(h: number): string {
  const { r, g, b } = hsvToRgb(h, 1, 1);
  return `rgb(${r},${g},${b})`;
}

export interface PixelColorPickerProps {
  /** #rrggbb */
  value: string;
  onChange: (hex: string) => void;
  /** Compact for side rails */
  width?: number;
}

export function PixelColorPicker({
  value,
  onChange,
  width = 112,
}: PixelColorPickerProps) {
  const svRef = useRef<HTMLCanvasElement>(null);
  const hueRef = useRef<HTMLCanvasElement>(null);
  const rgb = hexToRgb(value);
  const initial = rgbToHsv(rgb.r, rgb.g, rgb.b);
  const [h, setH] = useState(initial.h);
  const [s, setS] = useState(initial.s);
  const [v, setV] = useState(initial.v);
  const [hexEdit, setHexEdit] = useState(hexNorm(value));

  // Sync from outside when hex changes externally (palette click)
  useEffect(() => {
    const hx = hexNorm(value);
    setHexEdit(hx);
    const { r, g, b } = hexToRgb(hx);
    const hsv = rgbToHsv(r, g, b);
    setH(hsv.h);
    setS(hsv.s);
    setV(hsv.v);
  }, [value]);

  const emit = useCallback(
    (nh: number, ns: number, nv: number) => {
      const { r, g, b } = hsvToRgb(nh, ns, nv);
      const hex = rgbToHex(r, g, b);
      setHexEdit(hex);
      onChange(hex);
    },
    [onChange],
  );

  const svW = Math.max(64, width - 8);
  const svH = Math.round(svW * 0.72);
  const hueH = 10;

  // Paint SV square (hard pixels, no AA)
  useEffect(() => {
    const c = svRef.current;
    if (!c) return;
    const ctx = c.getContext("2d");
    if (!ctx) return;
    c.width = svW;
    c.height = svH;
    ctx.imageSmoothingEnabled = false;
    const img = ctx.createImageData(svW, svH);
    const d = img.data;
    for (let y = 0; y < svH; y++) {
      const vv = 1 - y / Math.max(1, svH - 1);
      for (let x = 0; x < svW; x++) {
        const ss = x / Math.max(1, svW - 1);
        const { r, g, b } = hsvToRgb(h, ss, vv);
        const i = (y * svW + x) * 4;
        d[i] = r;
        d[i + 1] = g;
        d[i + 2] = b;
        d[i + 3] = 255;
      }
    }
    ctx.putImageData(img, 0, 0);

    // Crosshair (hard pixels, inverted-ish white/black)
    const cx = Math.round(s * (svW - 1));
    const cy = Math.round((1 - v) * (svH - 1));
    ctx.fillStyle = "#000000";
    ctx.fillRect(cx - 3, cy, 7, 1);
    ctx.fillRect(cx, cy - 3, 1, 7);
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(cx - 2, cy, 5, 1);
    ctx.fillRect(cx, cy - 2, 1, 5);
  }, [h, s, v, svW, svH]);

  // Paint hue strip
  useEffect(() => {
    const c = hueRef.current;
    if (!c) return;
    const ctx = c.getContext("2d");
    if (!ctx) return;
    c.width = svW;
    c.height = hueH;
    ctx.imageSmoothingEnabled = false;
    const img = ctx.createImageData(svW, hueH);
    const d = img.data;
    for (let x = 0; x < svW; x++) {
      const hh = (x / Math.max(1, svW - 1)) * 360;
      const { r, g, b } = hsvToRgb(hh, 1, 1);
      for (let y = 0; y < hueH; y++) {
        const i = (y * svW + x) * 4;
        d[i] = r;
        d[i + 1] = g;
        d[i + 2] = b;
        d[i + 3] = 255;
      }
    }
    ctx.putImageData(img, 0, 0);
    const hx = Math.round((h / 360) * (svW - 1));
    ctx.fillStyle = "#000000";
    ctx.fillRect(hx - 1, 0, 3, hueH);
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(hx, 0, 1, hueH);
  }, [h, svW, hueH]);

  const pickSv = (clientX: number, clientY: number, el: HTMLElement) => {
    const rect = el.getBoundingClientRect();
    const x = clamp((clientX - rect.left) / Math.max(1, rect.width), 0, 1);
    const y = clamp((clientY - rect.top) / Math.max(1, rect.height), 0, 1);
    const ns = x;
    const nv = 1 - y;
    setS(ns);
    setV(nv);
    emit(h, ns, nv);
  };

  const pickHue = (clientX: number, el: HTMLElement) => {
    const rect = el.getBoundingClientRect();
    const x = clamp((clientX - rect.left) / Math.max(1, rect.width), 0, 1);
    const nh = x * 360;
    setH(nh);
    emit(nh, s, v);
  };

  const bindDrag = (
    el: HTMLElement,
    onMove: (e: PointerEvent) => void,
  ) => {
    const up = () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", up);
    };
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", up);
  };

  const chrome: React.CSSProperties = {
    border: "1px solid #555",
    background: "#000",
    boxSizing: "border-box",
  };

  return (
    <div
      style={{
        width: "100%",
        display: "flex",
        flexDirection: "column",
        gap: 4,
        fontFamily: "var(--dm-font-primary), monospace",
        imageRendering: "pixelated",
      }}
    >
      {/* Active swatch + hex */}
      <div style={{ display: "flex", gap: 4, alignItems: "stretch" }}>
        <div
          style={{
            ...chrome,
            width: 28,
            minHeight: 28,
            flexShrink: 0,
            backgroundColor: hexNorm(value),
            // pixel checker under for near-black visibility
            backgroundImage:
              "linear-gradient(45deg,#222 25%,transparent 25%),linear-gradient(-45deg,#222 25%,transparent 25%),linear-gradient(45deg,transparent 75%,#222 75%),linear-gradient(-45deg,transparent 75%,#222 75%)",
            backgroundSize: "6px 6px",
            backgroundPosition: "0 0,0 3px,3px -3px,-3px 0",
            boxShadow: `inset 0 0 0 999px ${hexNorm(value)}`,
          }}
          title={hexNorm(value)}
        />
        <input
          value={hexEdit}
          onChange={(e) => {
            const raw = e.target.value;
            setHexEdit(raw.startsWith("#") ? raw : `#${raw}`);
          }}
          onBlur={() => {
            const hx = hexNorm(hexEdit);
            setHexEdit(hx);
            const { r, g, b } = hexToRgb(hx);
            const hsv = rgbToHsv(r, g, b);
            setH(hsv.h);
            setS(hsv.s);
            setV(hsv.v);
            onChange(hx);
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter") (e.target as HTMLInputElement).blur();
          }}
          spellCheck={false}
          style={{
            ...chrome,
            flex: 1,
            minWidth: 0,
            color: "#fff",
            fontSize: 8,
            letterSpacing: 1,
            padding: "4px 6px",
            outline: "none",
            fontFamily: "inherit",
            textTransform: "uppercase",
          }}
        />
      </div>

      {/* SV plane */}
      <canvas
        ref={svRef}
        width={svW}
        height={svH}
        onPointerDown={(e) => {
          e.preventDefault();
          const el = e.currentTarget;
          el.setPointerCapture(e.pointerId);
          pickSv(e.clientX, e.clientY, el);
          const move = (ev: PointerEvent) => pickSv(ev.clientX, ev.clientY, el);
          bindDrag(el, move);
        }}
        style={{
          width: "100%",
          height: svH,
          display: "block",
          imageRendering: "pixelated",
          ...chrome,
          cursor: "crosshair",
          touchAction: "none",
        }}
      />

      {/* Hue bar */}
      <canvas
        ref={hueRef}
        width={svW}
        height={hueH}
        onPointerDown={(e) => {
          e.preventDefault();
          const el = e.currentTarget;
          el.setPointerCapture(e.pointerId);
          pickHue(e.clientX, el);
          const move = (ev: PointerEvent) => pickHue(ev.clientX, el);
          bindDrag(el, move);
        }}
        style={{
          width: "100%",
          height: hueH,
          display: "block",
          imageRendering: "pixelated",
          ...chrome,
          cursor: "ew-resize",
          touchAction: "none",
        }}
      />

      {/* RGB knobs — pixel dials */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr 1fr",
          gap: 0,
          border: "1px solid #333",
        }}
      >
        {(
          [
            { key: "r", label: "R", val: rgb.r, set: (n: number) => {
              const hex = rgbToHex(n, rgb.g, rgb.b);
              const hsv = rgbToHsv(n, rgb.g, rgb.b);
              setH(hsv.h); setS(hsv.s); setV(hsv.v);
              setHexEdit(hex);
              onChange(hex);
            }},
            { key: "g", label: "G", val: rgb.g, set: (n: number) => {
              const hex = rgbToHex(rgb.r, n, rgb.b);
              const hsv = rgbToHsv(rgb.r, n, rgb.b);
              setH(hsv.h); setS(hsv.s); setV(hsv.v);
              setHexEdit(hex);
              onChange(hex);
            }},
            { key: "b", label: "B", val: rgb.b, set: (n: number) => {
              const hex = rgbToHex(rgb.r, rgb.g, n);
              const hsv = rgbToHsv(rgb.r, rgb.g, n);
              setH(hsv.h); setS(hsv.s); setV(hsv.v);
              setHexEdit(hex);
              onChange(hex);
            }},
          ] as const
        ).map((ch) => (
          <div
            key={ch.key}
            style={{
              border: "1px solid #1a1a1a",
              padding: "3px 0",
              display: "flex",
              justifyContent: "center",
              background: "#000",
            }}
          >
            <PixelKnob
              label={ch.label}
              min={0}
              max={255}
              step={1}
              value={ch.val}
              displayValue={`${ch.val}`}
              size={32}
              layout="vertical"
              title={`${ch.label} channel`}
              onChange={ch.set}
            />
          </div>
        ))}
      </div>

      {/* Hue readout chip */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 4,
          ...chrome,
          padding: "3px 6px",
        }}
      >
        <div
          style={{
            width: 10,
            height: 10,
            background: hueColor(h),
            border: "1px solid #555",
            flexShrink: 0,
          }}
        />
        <span style={{ fontSize: 7, color: "#888", letterSpacing: 1 }}>
          H {Math.round(h)} · S {Math.round(s * 100)} · V {Math.round(v * 100)}
        </span>
      </div>
    </div>
  );
}

export default PixelColorPicker;
