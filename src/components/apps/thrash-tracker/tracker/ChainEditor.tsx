/*
 *            ☦
 *      ╔══════════════╗
 *      ║  ST. THOMAS  ║
 *      ║  AQUINAS     ║
 *      ║  Patron of   ║
 *      ║  Order       ║
 *      ╚══════════════╝
 *
 *   CHAIN EDITOR
 *   16 steps, each with a phrase reference + transpose value.
 *   Chains are the link between Song rows and Phrases —
 *   like patterns in Koala Sampler, or chains in LGPT/PicoTracker.
 *
 *   Columns:
 *     0: PHRASE  (hex 00-FF, -- = empty)
 *     1: TRANS   (transpose, signed hex, 80 = 0)
 *
 *   Controls (handled by DatamoshpitApp):
 *     Arrow Up/Down   = move cursor between steps
 *     Arrow Left/Right = move between columns
 *     Q + Arrows      = change values
 *     Z / Enter       = place default phrase
 *     X / Delete      = clear step
 */

"use client";

import React, { useRef, useLayoutEffect } from "react";
import type { Chain } from "@/types/tracker";

export const CHAIN_COLS = {
  PHRASE: 0,
  TRANS: 1,
} as const;

export const CHAIN_COL_COUNT = 2;

interface ChainEditorProps {
  chain: Chain;
  activeRow: number;
  activeCol: number;
  phraseCount: number;
  onRowSelect: (row: number) => void;
  onColSelect: (col: number) => void;
}

const ROW_HEIGHT = 18;

function toHex(value: number | null | undefined, digits = 2): string {
  if (value === null || value === undefined) return "--".slice(0, digits);
  return value.toString(16).toUpperCase().padStart(digits, "0");
}

function formatTranspose(transpose: number): string {
  if (transpose === 0) return "00";
  if (transpose > 0) return "+" + transpose.toString(16).toUpperCase().padStart(1, "0");
  return "-" + Math.abs(transpose).toString(16).toUpperCase().padStart(1, "0");
}

const COLUMNS = [
  { key: "PHRASE", chars: 2, label: "PH" },
  { key: "TRANS",  chars: 3, label: "TR" },
];

const CURSOR_STYLE: React.CSSProperties = {
  backgroundColor: "#ffffff",
  color: "#000000",
};

function ChainStepRow({
  step,
  index,
  isActiveRow,
  activeCol,
  onClickCell,
}: {
  step: Chain["steps"][number];
  index: number;
  isActiveRow: boolean;
  activeCol: number;
  onClickCell: (col: number) => void;
}) {
  const cells = [
    { text: toHex(step.phrase) },
    { text: formatTranspose(step.transpose) },
  ];

  const hasData = step.phrase !== null;

  return (
    <div
      className="flex px-1 items-center"
      style={{
        height: `${ROW_HEIGHT}px`,
        gap: "0.5ch",
      }}
    >
      {/* Step number */}
      <span style={{
        width: "2ch",
        color: isActiveRow ? "#888888" : "#444444",
      }}>
        {toHex(index)}
      </span>

      {/* Data columns */}
      {cells.map((cell, colIdx) => {
        const col = COLUMNS[colIdx];
        const isCursor = isActiveRow && colIdx === activeCol;
        const baseColor = isActiveRow || hasData ? "#ffffff" : "#555555";

        return (
          <span
            key={colIdx}
            className="cursor-pointer"
            style={{
              width: `${col.chars}ch`,
              color: isCursor ? CURSOR_STYLE.color : baseColor,
              backgroundColor: isCursor ? CURSOR_STYLE.backgroundColor : "transparent",
              ...(isActiveRow && !isCursor ? { backgroundColor: "#0a0a0a" } : {}),
            }}
            onClick={() => onClickCell(colIdx)}
          >
            {cell.text}
          </span>
        );
      })}
    </div>
  );
}

export function ChainEditor({
  chain,
  activeRow,
  activeCol,
  phraseCount,
  onRowSelect,
  onColSelect,
}: ChainEditorProps) {
  const viewportRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    const viewport = viewportRef.current;
    const track = trackRef.current;
    if (!viewport || !track) return;

    const viewportHeight = viewport.clientHeight;
    const offset = activeRow * ROW_HEIGHT - viewportHeight / 2 + ROW_HEIGHT / 2;
    track.style.transform = `translateY(${-offset}px)`;
  }, [activeRow, chain.steps.length]);

  return (
    <div
      className="select-none h-full flex flex-col"
      style={{
        fontFamily: "var(--dm-font-primary)",
        fontSize: "10px",
        imageRendering: "pixelated",
      }}
    >
      {/* Column headers */}
      <div
        className="flex px-1 border-b items-center flex-shrink-0"
        style={{
          borderColor: "#333333",
          backgroundColor: "#000000",
          height: "20px",
          gap: "0.5ch",
        }}
      >
        <span style={{ width: "2ch", color: "#555555" }}>#</span>
        {COLUMNS.map((col, i) => (
          <span
            key={col.key}
            style={{
              width: `${col.chars}ch`,
              color: i === activeCol ? "#ffffff" : "#555555",
            }}
          >
            {col.label}
          </span>
        ))}
      </div>

      {/* Scrolling viewport */}
      <div
        ref={viewportRef}
        className="flex-1 relative overflow-hidden"
      >
        {/* Center-line row indicator */}
        <div
          className="absolute left-0 right-0 pointer-events-none"
          style={{
            top: "50%",
            height: `${ROW_HEIGHT}px`,
            marginTop: `${-ROW_HEIGHT / 2}px`,
            borderTop: "1px solid #333333",
            borderBottom: "1px solid #333333",
            zIndex: 3,
          }}
        />

        {/* Row track */}
        <div ref={trackRef} style={{ willChange: "transform" }}>
          {chain.steps.map((step, i) => (
            <ChainStepRow
              key={i}
              step={step}
              index={i}
              isActiveRow={i === activeRow}
              activeCol={activeCol}
              onClickCell={(col) => {
                onRowSelect(i);
                onColSelect(col);
              }}
            />
          ))}
        </div>
      </div>

      {/* Bottom status */}
      <div
        className="flex-shrink-0 border-t px-1 flex items-center justify-between"
        style={{
          borderColor: "#333333",
          fontSize: "7px",
          color: "#555555",
          letterSpacing: "1px",
          height: "14px",
          lineHeight: "14px",
        }}
      >
        <span>STEP {toHex(activeRow)}/{toHex(chain.steps.length - 1)}</span>
        <span>CHAIN {toHex(chain.id)}</span>
        <span>{phraseCount} PHRASES</span>
      </div>
    </div>
  );
}
