/*
 *              ☦
 *       ╔══════════════╗
 *       ║  THE ANCIENT ║
 *       ║  TEMPLE OF   ║
 *       ║  THE GREEN   ║
 *       ║    SLIME     ║
 *       ╚══════════════╝
 *
 *   ┌────────────────────────┐
 *   │ ✝ TEMPLAR GUARD ✝    │
 *   │ of SLIMENTOLOGIKA     │
 *   └────────────────────────┘
 *
 *   SLIME DIGIT COMPONENT
 *   Renders Slimentologika base-16 glyphs
 *   as sprite images from /sprites/ST{0-F}.png
 */

"use client";

import React from "react";
import type { SlimeHexKey } from "@/types/tracker";
import { slimeSpritePath, toSlimeKeys } from "@/types/tracker";

interface SlimeDigitProps {
  hexKey: SlimeHexKey;
  /** Optional fixed pixel size. When omitted, uses CSS 1ch (matches font). */
  size?: number;
}

/**
 * Renders a single Slimentologika glyph sprite.
 * When no size is given, the glyph is exactly 1ch wide —
 * matching one monospaced character in Courier Pixel.
 */
export function SlimeGlyph({ hexKey, size }: SlimeDigitProps) {
  if (size != null) {
    return (
      <img
        src={slimeSpritePath(hexKey)}
        alt={hexKey}
        className="slime-digit"
        draggable={false}
        style={{
          width: size,
          height: size,
          imageRendering: "pixelated",
        }}
      />
    );
  }
  return (
    <img
      src={slimeSpritePath(hexKey)}
      alt={hexKey}
      className="slime-digit"
      draggable={false}
    />
  );
}

interface SlimeNumberProps {
  value: number;
  digits?: number;
  /** Fixed pixel size. Omit to use CSS 1ch (matches font). */
  size?: number;
}

/**
 * Renders a multi-digit Slimentologika number as a row of sprites.
 * Without a size prop, each glyph is 1ch wide — matching Courier Pixel.
 */
export function SlimeNumber({ value, digits = 2, size }: SlimeNumberProps) {
  const keys = toSlimeKeys(value, digits);
  return (
    <span className="inline-flex items-center gap-0">
      {keys.map((k, i) => (
        <SlimeGlyph key={i} hexKey={k} size={size} />
      ))}
    </span>
  );
}

interface SlimeOrHexProps {
  value: number | null;
  digits?: number;
  mode: "hex" | "slime";
  /** Fixed pixel size for slime sprites. Omit to use CSS 1ch. */
  size?: number;
  emptyChar?: string;
}

/**
 * Renders a value as either hex text or Slimentologika sprites
 * depending on the current display mode.
 * Both modes occupy the same width when using Courier Pixel font.
 */
export function SlimeOrHex({
  value,
  digits = 2,
  mode,
  size,
  emptyChar = "-",
}: SlimeOrHexProps) {
  if (value === null) {
    return <span>{emptyChar.repeat(digits)}</span>;
  }

  if (mode === "slime") {
    return <SlimeNumber value={value} digits={digits} size={size} />;
  }

  return <span>{value.toString(16).toUpperCase().padStart(digits, "0")}</span>;
}
