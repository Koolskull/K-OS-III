/*
 *                    ☦
 *            ╔═══════════════════╗
 *            ║  K-OS III        ║
 *            ║  BOOT SEQUENCE   ║
 *            ╚═══════════════════╝
 *
 *   Fast POST-style terminal scroll (~8 seconds):
 *   1. K-OS III ASCII header
 *   2. Condensed Rosary (Our Father, Hail Mary, Glory Be)
 *   3. Essential Psalm verses (23, 91, 121)
 *   4. System ready POST
 *
 *   Tap screen or press any key to skip.
 */

"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { ROSARY_PRAYERS } from "@/data/rosary";

interface BootSequenceProps {
  onComplete: () => void;
}

const BOOT_LINES: string[] = [
  // ── HEADER ──
  " In the Name of the Father, and of the Son, and of the Holy Ghost.",
  "                                                ",
  "                                                ",
  "  ██╗  ██╗       ██████╗  ███████╗     ██╗██╗██╗",
  "  ██║ ██╔╝      ██╔═══██╗ ██╔════╝     ██║██║██║",
  "  █████╔╝ █████╗██║   ██║ ███████╗     ██║██║██║",
  "  ██╔═██╗ ╚════╝██║   ██║ ╚════██║     ██║██║██║",
  "  ██║  ██╗      ╚██████╔╝ ███████║     ██║██║██║",
  "  ╚═╝  ╚═╝       ╚═════╝  ╚══════╝     ╚═╝╚═╝╚═╝",
  "",
  "  KOOLSKULL OPERATING SYSTEM III",
  "  (C) 2007-2026 2Kool Productions LLC",
  "",
  "  ☦ BLESSED BE THE LORD MY STRENGTH ☦",
  "  ══════════════════════════════════════",
  "",

  // ── ROSARY ──
  ...ROSARY_PRAYERS.map((l) => `  ${l ?? ""}`),
  "",

  // ── ESSENTIAL PSALMS ──
  "  ── PSALMS ──",
  "",
  "  [PSALM 023:004]",
  "  Yea, though I walk through the valley",
  "  of the shadow of death, I will fear no evil:",
  "  for thou art with me; thy rod and thy staff",
  "  they comfort me.",
  "",
  "  [PSALM 091:001]",
  "  He that dwelleth in the secret place",
  "  of the most High shall abide under the shadow",
  "  of the Almighty.",
  "",
  "  [PSALM 121:001]",
  "  I will lift up mine eyes unto the hills,",
  "  from whence cometh my help.",
  "  [PSALM 121:002] My help cometh from the LORD,",
  "  which made heaven and earth.",
  "",

  // ── SYSTEM POST ──
  "  ══════════════════════════════════════",
  "  LOADING KOOLSKULL OPERATING SYSTEM III...",
  "  ══════════════════════════════════════",
  "",
  "  AUDIO ENGINE.............. OK",
  "  INPUT ROUTER.............. OK",
  "  VIRTUAL FILESYSTEM........ OK",
  "  TRACKER ENGINE............ OK",
  "  BIBLE DATA................ OK",
  "  ARCADE CABINET............ OK",
  "",
  "  ☦ SYSTEM BLESSED ☦",
  "",
  "  STARTING DESKTOP...",
];

// ~60 lines at 120ms each ≈ 7.2s + 200ms initial delay + 500ms end pause ≈ ~8s
const LINE_SPEED_MS = 120;

export function BootSequence({ onComplete }: BootSequenceProps) {
  const [lines, setLines] = useState<string[]>([]);
  const containerRef = useRef<HTMLDivElement>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const indexRef = useRef(0);
  const doneRef = useRef(false);

  // Auto-scroll to bottom
  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight;
    }
  }, [lines]);

  const finish = useCallback(() => {
    if (doneRef.current) return;
    doneRef.current = true;
    if (timerRef.current) clearTimeout(timerRef.current);
    onComplete();
  }, [onComplete]);

  // Skip on any key, click, or touch (mobile)
  useEffect(() => {
    const skip = (e: Event) => {
      e.preventDefault();
      finish();
    };
    window.addEventListener("keydown", skip);
    window.addEventListener("pointerdown", skip);
    window.addEventListener("touchstart", skip, { passive: false });
    return () => {
      window.removeEventListener("keydown", skip);
      window.removeEventListener("pointerdown", skip);
      window.removeEventListener("touchstart", skip);
    };
  }, [finish]);

  // Single scroll loop
  useEffect(() => {
    const tick = () => {
      if (doneRef.current) return;
      if (indexRef.current < BOOT_LINES.length) {
        setLines((prev) => [...prev, BOOT_LINES[indexRef.current]]);
        indexRef.current++;
        timerRef.current = setTimeout(tick, LINE_SPEED_MS);
      } else {
        // Pause briefly then transition
        timerRef.current = setTimeout(finish, 500);
      }
    };
    timerRef.current = setTimeout(tick, 200);
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [finish]);

  return (
    <div
      className="w-full h-full overflow-hidden flex flex-col"
      style={{
        backgroundColor: "#000000",
        fontFamily: "var(--dm-font-primary)",
        fontSize: "10px",
        imageRendering: "pixelated",
        // Full-screen hit target for mobile tap-to-skip
        touchAction: "manipulation",
        cursor: "pointer",
        userSelect: "none",
        WebkitUserSelect: "none",
      }}
      role="button"
      aria-label="Tap or press any key to skip boot sequence"
      onClick={(e) => {
        e.preventDefault();
        finish();
      }}
    >
      <div
        ref={containerRef}
        className="flex-1 overflow-y-auto p-2"
        style={{ scrollBehavior: "auto" }}
      >
        {lines.map((line, i) => {
          const l = line ?? "";
          return (
            <div
              key={i}
              style={{
                color: l.includes("══") || l.includes("──")
                  ? "#555555"
                  : l.includes("[PSALM")
                    ? "#888888"
                    : l.includes("OK")
                      ? "#00ff00"
                      : l.includes("☦")
                        ? "#ffcc00"
                        : "#cccccc",
                whiteSpace: "pre-wrap",
                lineHeight: "1.4",
                letterSpacing: "1px",
              }}
            >
              {l || "\u00A0"}
            </div>
          );
        })}
        <div style={{ color: "#ffffff", animation: "blink 1s step-end infinite" }}>_</div>
      </div>

      {/* Skip prompt — larger + higher contrast for mobile */}
      <div
        className="flex-shrink-0 px-3 py-3 border-t-2 text-center"
        style={{
          borderColor: "#333333",
          color: "#ffff00",
          fontSize: "11px",
          letterSpacing: "2px",
          backgroundColor: "#0a0a0a",
          // Keep clear of iOS home indicator / Android nav
          paddingBottom: "max(12px, env(safe-area-inset-bottom))",
        }}
      >
        TAP SCREEN OR PRESS ANY KEY TO SKIP
      </div>
      <style>{`@keyframes blink { 0%,50%{opacity:1} 51%,100%{opacity:0} }`}</style>
    </div>
  );
}
