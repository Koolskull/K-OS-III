/*
 *            ☦
 *      ╔════════════╗
 *      ║  ST. DAVID ║
 *      ║  Patron of ║
 *      ║   Poets    ║
 *      ╚════════════╝
 *
 *   ┌───────────────────────┐
 *   │  ✝ TEMPLAR GUARD ✝  │
 *   │  of the PHRASE GRID  │
 *   └───────────────────────┘
 *
 *   PHRASE EDITOR
 *   2–256 rows of note, instrument, slice, and dual effects.
 *
 *   Cursor stays vertically centered on screen.
 *   Pattern data scrolls around it.
 *
 *   Columns (0-7):
 *     0: NOTE  (C-0 to B-9, --- = empty)
 *     1: IN    (instrument hex 00-FF)
 *     2: SL    (slice hex 00-FF, dim when not sample)
 *     3: CMD1  (2-char effect command)
 *     4: VAL1  (effect 1 value hex 00-FF)
 *     5: CMD2  (2-char effect command)
 *     6: VAL2  (effect 2 value hex 00-FF)
 *
 *   Row number (#) is not a selectable column.
 */

"use client";

import React, { useRef, useLayoutEffect } from "react";
import type { Phrase, Instrument } from "@/types/tracker";

/** Column indices for the phrase cursor */
export const PHRASE_COLS = {
  NOTE: 0,
  INST: 1,
  SLICE: 2,
  CMD1: 3,
  VAL1: 4,
  CMD2: 5,
  VAL2: 6,
} as const;

export const PHRASE_COL_COUNT = 7;

interface PhraseEditorProps {
  phrase: Phrase;
  instruments: Instrument[];
  activeRow: number;
  activeCol: number;
  onRowSelect: (row: number) => void;
  onColSelect: (col: number) => void;
}

const NOTE_NAMES = ["C-", "C#", "D-", "D#", "E-", "F-", "F#", "G-", "G#", "A-", "A#", "B-"];
const ROW_HEIGHT = 18;

function formatNote(note: number | null): string {
  if (note === null) return "---";
  const name = NOTE_NAMES[note % 12];
  const octave = Math.floor(note / 12) - 1;
  return `${name}${octave}`;
}

function toHex(value: number | null | undefined, digits = 2): string {
  if (value === null || value === undefined) return "--".slice(0, digits);
  return value.toString(16).toUpperCase().padStart(digits, "0");
}

function formatCmd(cmd: string | undefined): string {
  if (!cmd) return "--";
  return cmd;
}

function isSampleInstrument(instruments: Instrument[], instIdx: number | null): boolean {
  if (instIdx === null) return false;
  const inst = instruments[instIdx];
  return inst?.type === "sample";
}

/**
 * Column widths in `ch` units (1ch = width of "0" in the current monospace font).
 * This keeps hex text and Slimentologika sprites perfectly aligned.
 */
const COLUMNS = [
  { key: "NOTE",  chars: 3, label: "NOT" },   // "C-4" = 3 chars
  { key: "INST",  chars: 2, label: "IN" },     // "FF"  = 2 chars
  { key: "SLICE", chars: 2, label: "SL" },     // "FF"  = 2 chars
  { key: "CMD1",  chars: 2, label: "C1" },     // "--"  = 2 chars
  { key: "VAL1",  chars: 2, label: "V1" },     // "FF"  = 2 chars
  { key: "CMD2",  chars: 2, label: "C2" },     // "--"  = 2 chars
  { key: "VAL2",  chars: 2, label: "V2" },     // "FF"  = 2 chars
];
const ROW_NUM_CHARS = 2; // "FF" = 2 chars

/** Style for cursor highlight on active cell */
const CURSOR_STYLE: React.CSSProperties = {
  backgroundColor: "#ffffff",
  color: "#000000",
};

function PhraseRowComponent({
  row,
  index,
  isActiveRow,
  activeCol,
  isSample,
  onClickCell,
}: {
  row: Phrase["rows"][number];
  index: number;
  isActiveRow: boolean;
  activeCol: number;
  isSample: boolean;
  onClickCell: (col: number) => void;
}) {
  // Cell values for each column
  const cells: { text: string; dimmed?: boolean }[] = [
    { text: formatNote(row.note) },
    { text: toHex(row.instrument) },
    { text: toHex(row.slice ?? null), dimmed: !isSample || row.slice === null || row.slice === undefined },
    { text: formatCmd(row.effect1?.command) },
    { text: toHex(row.effect1?.value ?? null) },
    { text: formatCmd(row.effect2?.command) },
    { text: toHex(row.effect2?.value ?? null) },
  ];

  const hasData = row.note !== null;

  return (
    <div
      className="flex px-1 items-center"
      style={{
        height: `${ROW_HEIGHT}px`,
        gap: "0.5ch",
      }}
    >
      {/* Row number (not selectable) */}
      <span style={{
        width: `${ROW_NUM_CHARS}ch`,
        color: isActiveRow ? "#888888" : "#444444",
      }}>
        {toHex(index)}
      </span>

      {/* Data columns */}
      {cells.map((cell, colIdx) => {
        const col = COLUMNS[colIdx];
        const isCursor = isActiveRow && colIdx === activeCol;
        const baseColor = cell.dimmed
          ? "#333333"
          : isActiveRow || hasData
            ? "#ffffff"
            : "#555555";

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

export function PhraseEditor({
  phrase,
  instruments,
  activeRow,
  activeCol,
  onRowSelect,
  onColSelect,
}: PhraseEditorProps) {
  const viewportRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    const viewport = viewportRef.current;
    const track = trackRef.current;
    if (!viewport || !track) return;

    const viewportHeight = viewport.clientHeight;
    const offset = activeRow * ROW_HEIGHT - viewportHeight / 2 + ROW_HEIGHT / 2;
    track.style.transform = `translateY(${-offset}px)`;
  }, [activeRow, phrase.rows.length]);

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
        {/* Row number header */}
        <span style={{ width: `${ROW_NUM_CHARS}ch`, color: "#555555" }}>#</span>

        {/* Column headers — highlight active column */}
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
          {phrase.rows.map((row, i) => (
            <PhraseRowComponent
              key={i}
              row={row}
              index={i}
              isActiveRow={i === activeRow}
              activeCol={activeCol}
              isSample={isSampleInstrument(instruments, row.instrument)}
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
        <span>ROW {toHex(activeRow)}/{toHex(phrase.rows.length - 1)}</span>
        <span>{COLUMNS[activeCol].label}</span>
      </div>
    </div>
  );
}
