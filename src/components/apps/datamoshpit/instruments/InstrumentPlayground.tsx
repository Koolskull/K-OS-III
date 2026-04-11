/*
 *                    ☦
 *            ╔══════════════╗
 *            ║  ST. JUBAL   ║
 *            ║  Father of   ║
 *            ║  all who play║
 *            ║  the harp &  ║
 *            ║  flute       ║
 *            ╚══════════════╝
 *        ─ Genesis 4:21 ─
 *
 *   ┌─────────────────────────┐
 *   │  ✝ TEMPLAR GUARD ✝    │
 *   │  of the INSTRUMENT     │
 *   │  EDITOR                │
 *   └─────────────────────────┘
 *
 *   INSTRUMENT EDITOR
 *   Cursor-navigable vertical parameter list.
 *   LGPT/LSDj-style: arrows move cursor, Q+arrows edit values.
 *
 *   On widescreen (1280px+) sections flow into columns
 *   so all parameters are visible without scrolling.
 */

"use client";

import React, { useCallback, useRef, useEffect, useLayoutEffect, useState } from "react";
import type { Instrument, FMOperator, ProjectSample } from "@/types/tracker";
import { AudioEngine } from "@/engine/audio/AudioEngine";
import { FMSynthVoice } from "@/engine/synth/FMSynth";
import { SamplerVoice } from "@/engine/synth/SamplerVoice";
import { buildFieldLayout, getNavigableRows } from "./instrumentFields";
import type { LayoutRow, InstrumentField } from "./instrumentFields";

export interface InstrumentEditorProps {
  instrument: Instrument;
  onInstrumentChange: (inst: Instrument) => void;
  slotIndex: number;
  cursorRow: number;
  cursorCol: number;
  onCursorMove: (row: number, col: number) => void;
  projectSamples?: ProjectSample[];
}

const ROW_HEIGHT = 18;
const LABEL_WIDTH = 48;
const CELL_WIDTH = "3ch";  // fits 2-digit hex + padding
const WIDE_BREAKPOINT = 1280;
const OP_HEADER_HEIGHT = ROW_HEIGHT - 4; // 14px
const MOVE_CURVE_HEIGHT = 48; // 5 lines × 8px + padding

/** Get the pixel height of a render item */
function itemHeight(item: RenderItem): number {
  switch (item.type) {
    case "separator": return ROW_HEIGHT;
    case "fields": return ROW_HEIGHT;
    case "opHeader": return OP_HEADER_HEIGHT;
    case "moveCurve": return MOVE_CURVE_HEIGHT;
  }
}

function toHex(value: number, digits = 2): string {
  return value.toString(16).toUpperCase().padStart(digits, "0");
}

// ── Render item types ──

type RenderItem =
  | { type: "separator"; label: string }
  | { type: "fields"; fields: InstrumentField[]; navIndex: number }
  | { type: "opHeader" }
  | { type: "moveCurve"; moveA: number; moveB: number };

/** A visual section: items grouped between separators */
interface Section {
  items: RenderItem[];
}

// ── Sub-components ──

function FieldCell({
  field,
  instrument,
  isCursor,
}: {
  field: InstrumentField;
  instrument: Instrument;
  isCursor: boolean;
}) {
  const displayText = field.display
    ? field.display(instrument)
    : toHex(field.get(instrument), field.digits);

  const isWide = !!field.display;
  const width = isWide ? undefined : CELL_WIDTH;
  const minWidth = isWide ? CELL_WIDTH : undefined;

  return (
    <span
      style={{
        width,
        minWidth,
        color: isCursor ? "#000000" : "#ffffff",
        backgroundColor: isCursor ? "#ffffff" : "transparent",
        paddingLeft: "2px",
        paddingRight: "2px",
      }}
    >
      {displayText}
    </span>
  );
}

function FieldRow({
  fields,
  instrument,
  isActiveRow,
  cursorCol,
  onClick,
}: {
  fields: InstrumentField[];
  instrument: Instrument;
  isActiveRow: boolean;
  cursorCol: number;
  onClick: (col: number) => void;
}) {
  const label = fields[0]?.label ?? "";

  return (
    <div
      className="flex items-center px-1"
      style={{
        height: `${ROW_HEIGHT}px`,
        backgroundColor: isActiveRow ? "#0a0a0a" : "transparent",
        gap: "1px",
      }}
    >
      <span
        style={{
          width: `${LABEL_WIDTH}px`,
          color: isActiveRow ? "#888888" : "#555555",
          letterSpacing: "1px",
        }}
      >
        {label}
      </span>
      {fields.map((field, colIdx) => (
        <span
          key={field.key}
          className="cursor-pointer"
          onClick={() => onClick(colIdx)}
        >
          <FieldCell
            field={field}
            instrument={instrument}
            isCursor={isActiveRow && colIdx === cursorCol}
          />
        </span>
      ))}
    </div>
  );
}

function SeparatorRow({ label }: { label: string }) {
  return (
    <div
      className="flex items-center px-1"
      style={{
        height: `${ROW_HEIGHT}px`,
        color: "#555555",
        letterSpacing: "1px",
      }}
    >
      <span style={{ color: "#444444" }}>
        {`── ${label} ──`}
      </span>
    </div>
  );
}

function MovementCurve({ moveA, moveB }: { moveA: number; moveB: number }) {
  const HEIGHT = 5;
  const WIDTH = 16;
  const aSign = (moveA - 0x80) / 128;
  const bSign = (moveB - 0x80) / 128;

  const rows: string[] = [];
  for (let y = 0; y < HEIGHT; y++) {
    let line = "";
    for (let x = 0; x < WIDTH; x++) {
      const t = x / (WIDTH - 1);
      const speed = aSign + (bSign - aSign) * t;
      const speedRow = Math.round((1 - speed) / 2 * (HEIGHT - 1));
      if (speedRow === y) {
        line += "\u2588";
      } else if (y === Math.floor(HEIGHT / 2)) {
        line += "\u2500";
      } else {
        line += " ";
      }
    }
    rows.push(line);
  }

  const isStill = moveA === 0x80 && moveB === 0x80;
  const label = isStill ? "STILL" :
    aSign === bSign ? "CONST" :
    Math.abs(aSign) > Math.abs(bSign) ? "DECEL" :
    Math.abs(aSign) < Math.abs(bSign) ? "ACCEL" :
    aSign > 0 && bSign < 0 ? "SCRCH" :
    "CURVE";

  return (
    <div
      className="px-1"
      style={{
        fontFamily: "var(--dm-font-primary)",
        fontSize: "8px",
        lineHeight: "8px",
        letterSpacing: "0px",
      }}
    >
      <div className="flex items-start gap-1">
        <div style={{ width: `${LABEL_WIDTH}px`, color: "#444444", fontSize: "7px", paddingTop: "8px" }}>
          {label}
        </div>
        <div style={{ color: "#555555", whiteSpace: "pre" }}>
          {rows.map((row, i) => (
            <div key={i} style={{
              color: i === Math.floor(HEIGHT / 2) ? "#333333" : "#888888",
            }}>
              {row}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function OpHeaderRow() {
  const labels = ["TL", "AR", "DR", "D2R", "RR", "SL", "MUL", "DT", "RS", "AM"];
  return (
    <div
      className="flex items-center px-1"
      style={{
        height: `${ROW_HEIGHT - 4}px`,
        gap: "1px",
        fontSize: "7px",
        color: "#444444",
        letterSpacing: "1px",
      }}
    >
      <span style={{ width: `${LABEL_WIDTH}px` }} />
      {labels.map((l) => (
        <span key={l} style={{ width: CELL_WIDTH, paddingLeft: "2px" }}>
          {l}
        </span>
      ))}
    </div>
  );
}

// ── Section rendering ──

function RenderSection({
  section,
  instrument,
  cursorRow,
  cursorCol,
  onCursorMove,
}: {
  section: Section;
  instrument: Instrument;
  cursorRow: number;
  cursorCol: number;
  onCursorMove: (row: number, col: number) => void;
}) {
  return (
    <div>
      {section.items.map((item, i) => {
        if (item.type === "separator") {
          return <SeparatorRow key={`sep-${i}`} label={item.label} />;
        }
        if (item.type === "opHeader") {
          return <OpHeaderRow key={`oph-${i}`} />;
        }
        if (item.type === "moveCurve") {
          return (
            <MovementCurve
              key={`curve-${i}`}
              moveA={item.moveA}
              moveB={item.moveB}
            />
          );
        }
        return (
          <FieldRow
            key={`row-${item.navIndex}`}
            fields={item.fields}
            instrument={instrument}
            isActiveRow={item.navIndex === cursorRow}
            cursorCol={cursorCol}
            onClick={(col) => onCursorMove(item.navIndex, col)}
          />
        );
      })}
    </div>
  );
}

// ── Main component ──

export function InstrumentPlayground({
  instrument,
  onInstrumentChange,
  slotIndex,
  cursorRow,
  cursorCol,
  onCursorMove,
  projectSamples,
}: InstrumentEditorProps) {
  const fmVoiceRef = useRef<FMSynthVoice | null>(null);
  const samplerRef = useRef<SamplerVoice | null>(null);
  const viewportRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);

  // Load sample when instrument changes to sample type
  useEffect(() => {
    if (instrument.type !== "sample" || !instrument.sampleUrl) return;
    const audio = AudioEngine.getInstance();
    audio.init().then(() => {
      if (samplerRef.current) samplerRef.current.dispose();
      const voice = new SamplerVoice(audio.getChannel(0));
      voice.loadSample(instrument.sampleUrl!).then(() => {
        samplerRef.current = voice;
      });
    });
  }, [instrument.type, instrument.sampleUrl]);

  const playTestNote = useCallback(async () => {
    const audio = AudioEngine.getInstance();
    await audio.init();

    if (instrument.type === "sample") {
      if (samplerRef.current?.isLoaded()) {
        samplerRef.current.triggerRelease();
        samplerRef.current.triggerAttack(60, null);
      }
    } else {
      if (fmVoiceRef.current) fmVoiceRef.current.dispose();
      fmVoiceRef.current = new FMSynthVoice(audio.getChannel(0));
      fmVoiceRef.current.applyInstrument(instrument);
      fmVoiceRef.current.triggerAttackRelease(60, "8n");
    }
  }, [instrument]);

  const layout = buildFieldLayout(instrument, projectSamples);
  const navRows = getNavigableRows(layout);

  // Build flat render items list
  let navIdx = 0;
  const allItems: RenderItem[] = [];

  for (const row of layout) {
    if (row.type === "separator") {
      allItems.push({ type: "separator", label: row.label });
      if (row.label.startsWith("OP")) {
        allItems.push({ type: "opHeader" });
      }
      if (row.label === "GRANULAR") {
        allItems.push({
          type: "moveCurve",
          moveA: instrument.granMoveA ?? 0x80,
          moveB: instrument.granMoveB ?? 0x80,
        });
      }
    } else {
      allItems.push({ type: "fields", fields: row.fields, navIndex: navIdx });
      navIdx++;
    }
  }

  // Compute the Y offset of the active cursor row
  let cursorY = 0;
  let cursorItemHeight = ROW_HEIGHT;
  for (const item of allItems) {
    if (item.type === "fields" && item.navIndex === cursorRow) {
      cursorItemHeight = itemHeight(item);
      break;
    }
    cursorY += itemHeight(item);
  }

  // Center the cursor row in the viewport via translateY
  useLayoutEffect(() => {
    const viewport = viewportRef.current;
    const track = trackRef.current;
    if (!viewport || !track) return;
    const viewH = viewport.clientHeight;
    const offset = cursorY - viewH / 2 + cursorItemHeight / 2;
    track.style.transform = `translateY(${-offset}px)`;
  }, [cursorRow, cursorY, cursorItemHeight, instrument.type]);

  // Current field info for status bar
  const currentFields = navRows[cursorRow];
  const currentField = currentFields?.[Math.min(cursorCol, (currentFields?.length ?? 1) - 1)];

  return (
    <div
      className="flex flex-col h-full select-none"
      style={{
        fontFamily: "var(--dm-font-primary)",
        fontSize: "10px",
        imageRendering: "pixelated",
      }}
    >
      {/* Header */}
      <div
        className="flex items-center justify-between px-1 border-b flex-shrink-0"
        style={{
          borderColor: "#333333",
          height: "22px",
        }}
      >
        <span style={{ color: "#ffffff", letterSpacing: "2px", fontSize: "10px" }}>
          [{toHex(slotIndex, 1)}] {instrument.name}
        </span>
        <button
          className="border-2 px-3 py-0.5 cursor-pointer active:bg-neutral-800"
          style={{
            borderColor: "#ffffff",
            backgroundColor: "#000000",
            color: "#ffffff",
            fontFamily: "var(--dm-font-primary)",
            fontSize: "10px",
            letterSpacing: "1px",
          }}
          onClick={playTestNote}
        >
          PLAY
        </button>
      </div>

      {/* Center-scrolling viewport */}
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

        {/* Track — moves via translateY to keep cursor centered */}
        <div ref={trackRef} style={{ willChange: "transform" }}>
          {allItems.map((item, i) => {
            if (item.type === "separator") {
              return <SeparatorRow key={`sep-${i}`} label={item.label} />;
            }
            if (item.type === "opHeader") {
              return <OpHeaderRow key={`oph-${i}`} />;
            }
            if (item.type === "moveCurve") {
              return (
                <MovementCurve
                  key={`curve-${i}`}
                  moveA={item.moveA}
                  moveB={item.moveB}
                />
              );
            }
            return (
              <FieldRow
                key={`row-${item.navIndex}`}
                fields={item.fields}
                instrument={instrument}
                isActiveRow={item.navIndex === cursorRow}
                cursorCol={cursorCol}
                onClick={(col) => onCursorMove(item.navIndex, col)}
              />
            );
          })}
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
        <span>
          {currentField
            ? `${currentField.label || currentField.key} ${currentField.display ? currentField.display(instrument) : toHex(currentField.get(instrument), currentField.digits)}`
            : ""}
        </span>
        <span>ROW {toHex(cursorRow)}/{toHex(navRows.length - 1)}</span>
      </div>
    </div>
  );
}
