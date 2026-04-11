/*
 *              ☦
 *       ╔═════════════════╗
 *       ║   ST. CECILIA   ║
 *       ║   Patroness of  ║
 *       ║   Musicians     ║
 *       ╚═════════════════╝
 *
 *   LIVE PADS + KEYBOARD
 *   16-pad grid (4x4) with 64 banks.
 *   On-screen tracker keyboard (LSDJ / LGPT style).
 *
 *   KEYBOARD LAYOUT (2 octaves, tracker standard):
 *
 *   Upper octave:
 *    |2|3| |5|6|7| |9|0| |=|     ← black keys
 *   |Q|W|E|R|T|Y|U|I|O|P|[|]|   ← white keys
 *
 *   Lower octave:
 *    |S|D| |G|H|J| |L|;|         ← black keys
 *   |Z|X|C|V|B|N|M|,|.|/|       ← white keys
 *
 *   RESPONSIVE LAYOUT:
 *   Wide screen  → pads LEFT, keyboard RIGHT
 *   Tall screen  → pads TOP, keyboard BOTTOM
 *
 *   Wide (16:9)   → lower octave only (Z–/)
 *   Square (≈1:1) → both octaves stacked
 */

"use client";

import React, { useState, useCallback, useRef, useEffect } from "react";
import { toSlimeKeys } from "@/types/tracker";
import type { SlimeHexKey } from "@/types/tracker";
import { SlimeGlyph } from "@/components/apps/datamoshpit/ui/SlimeDigit";

export interface PlaybackChannelInfo {
  chainId: number | null;
  phraseId: number | null;
  phraseRow: number;
}

interface LivePadsProps {
  bank: number;
  preset: number;
  inputMode?: "tracker" | "sampler";
  mutedPads?: Set<number>;
  soloedPads?: Set<number>;
  isRecording?: boolean;
  playbackInfo?: PlaybackChannelInfo[];
  patternBank?: number;
  onPadTrigger: (padIndex: number, bank: number) => void;
  onNoteOn: (midiNote: number) => void;
  onNoteOff: (midiNote: number) => void;
}

const PADS_PER_BANK = 16;

type LayoutMode = "wide" | "tall";
type OctaveMode = "single" | "stacked";

// ── TRACKER KEYBOARD MAPPING ──
// Each key maps to a MIDI note offset within its octave.
// White keys are the natural notes, black keys are sharps.

interface KeyDef {
  label: string;
  code: string;
  note: number; // semitone offset (0=C, 1=C#, 2=D, etc.)
  isBlack: boolean;
}

// Lower octave (C3 = MIDI 48): Z row = white, S row = black
const LOWER_WHITE: KeyDef[] = [
  { label: "Z", code: "KeyZ", note: 0,  isBlack: false }, // C
  { label: "X", code: "KeyX", note: 2,  isBlack: false }, // D
  { label: "C", code: "KeyC", note: 4,  isBlack: false }, // E
  { label: "V", code: "KeyV", note: 5,  isBlack: false }, // F
  { label: "B", code: "KeyB", note: 7,  isBlack: false }, // G
  { label: "N", code: "KeyN", note: 9,  isBlack: false }, // A
  { label: "M", code: "KeyM", note: 11, isBlack: false }, // B
  { label: ",", code: "Comma", note: 12, isBlack: false }, // C+1
  { label: ".", code: "Period", note: 14, isBlack: false }, // D+1
  { label: "/", code: "Slash", note: 16, isBlack: false }, // E+1
  { label: "\\", code: "Backslash", note: 17, isBlack: false }, // F+1
];

const LOWER_BLACK: KeyDef[] = [
  { label: "S", code: "KeyS", note: 1,  isBlack: true }, // C#
  { label: "D", code: "KeyD", note: 3,  isBlack: true }, // D#
  // gap (E has no sharp)
  { label: "G", code: "KeyG", note: 6,  isBlack: true }, // F#
  { label: "H", code: "KeyH", note: 8,  isBlack: true }, // G#
  { label: "J", code: "KeyJ", note: 10, isBlack: true }, // A#
  // gap (B has no sharp)
  { label: "L", code: "KeyL", note: 13, isBlack: true }, // C#+1
  { label: ";", code: "Semicolon", note: 15, isBlack: true }, // D#+1
  // gap (E+1 has no sharp)
  { label: "'", code: "Quote", note: 18, isBlack: true }, // F#+1
];

// Upper octave (C4 = MIDI 60): Q row = white, number row = black
const UPPER_WHITE: KeyDef[] = [
  { label: "Q", code: "KeyQ", note: 0,  isBlack: false }, // C
  { label: "W", code: "KeyW", note: 2,  isBlack: false }, // D
  { label: "E", code: "KeyE", note: 4,  isBlack: false }, // E
  { label: "R", code: "KeyR", note: 5,  isBlack: false }, // F
  { label: "T", code: "KeyT", note: 7,  isBlack: false }, // G
  { label: "Y", code: "KeyY", note: 9,  isBlack: false }, // A
  { label: "U", code: "KeyU", note: 11, isBlack: false }, // B
  { label: "I", code: "KeyI", note: 12, isBlack: false }, // C+1
  { label: "O", code: "KeyO", note: 14, isBlack: false }, // D+1
  { label: "P", code: "KeyP", note: 16, isBlack: false }, // E+1
  { label: "[", code: "BracketLeft", note: 17, isBlack: false }, // F+1
  { label: "]", code: "BracketRight", note: 19, isBlack: false }, // G+1
];

const UPPER_BLACK: KeyDef[] = [
  { label: "2", code: "Digit2", note: 1,  isBlack: true }, // C#
  { label: "3", code: "Digit3", note: 3,  isBlack: true }, // D#
  { label: "5", code: "Digit5", note: 6,  isBlack: true }, // F#
  { label: "6", code: "Digit6", note: 8,  isBlack: true }, // G#
  { label: "7", code: "Digit7", note: 10, isBlack: true }, // A#
  { label: "9", code: "Digit9", note: 13, isBlack: true }, // C#+1
  { label: "0", code: "Digit0", note: 15, isBlack: true }, // D#+1
  { label: "=", code: "Equal", note: 18, isBlack: true },  // F#+1
];

// Note names for display
const NOTE_NAMES = ["C","C#","D","D#","E","F","F#","G","G#","A","A#","B"];

// Build keyboard code → MIDI note lookup
const CODE_TO_MIDI: Record<string, number> = {};
for (const k of [...LOWER_WHITE, ...LOWER_BLACK]) {
  CODE_TO_MIDI[k.code] = 48 + k.note; // C3 base
}
for (const k of [...UPPER_WHITE, ...UPPER_BLACK]) {
  CODE_TO_MIDI[k.code] = 60 + k.note; // C4 base
}

function Pad({
  index,
  bank,
  active,
  muted,
  soloed,
  onTrigger,
}: {
  index: number;
  bank: number;
  active: boolean;
  muted?: boolean;
  soloed?: boolean;
  onTrigger: () => void;
}) {
  const globalIndex = bank * PADS_PER_BANK + index;
  const digits = toSlimeKeys(globalIndex, 2);

  let borderColor = active ? "#ffffff" : "#444444";
  let backgroundColor = active ? "#2a2a2a" : "#0a0a0a";

  if (muted) {
    borderColor = active ? "#ff4444" : "#331111";
    backgroundColor = active ? "#1a0808" : "#080404";
  } else if (soloed) {
    borderColor = active ? "#ffff00" : "#aaaa00";
    backgroundColor = active ? "#2a2a00" : "#0a0a00";
  }

  return (
    <button
      className="border-2 flex flex-col items-center justify-center cursor-pointer select-none"
      style={{
        borderColor,
        backgroundColor,
        width: "100%",
        height: "100%",
        opacity: muted ? 0.5 : 1,
      }}
      onMouseDown={onTrigger}
      onTouchStart={(e) => { e.preventDefault(); onTrigger(); }}
    >
      {digits.map((k, i) => (
        <SlimeGlyph key={i} hexKey={k} size={12} />
      ))}
    </button>
  );
}

/** A single key in the tracker keyboard */
function TrackerKey({
  keyDef,
  midiNote,
  isActive,
  onDown,
  onUp,
}: {
  keyDef: KeyDef;
  midiNote: number;
  isActive: boolean;
  onDown: () => void;
  onUp: () => void;
}) {
  const noteName = NOTE_NAMES[midiNote % 12];
  const octave = Math.floor(midiNote / 12) - 1;

  return (
    <button
      className="border flex flex-col items-center justify-center cursor-pointer select-none"
      style={{
        borderColor: isActive ? "#ffffff" : "#333333",
        backgroundColor: isActive
          ? "#ffffff"
          : keyDef.isBlack ? "#111111" : "#0a0a0a",
        color: isActive ? "#000000" : keyDef.isBlack ? "#666666" : "#888888",
        flex: "1",
        minWidth: 0,
        height: "100%",
      }}
      onMouseDown={onDown}
      onMouseUp={onUp}
      onMouseLeave={onUp}
      onTouchStart={(e) => { e.preventDefault(); onDown(); }}
      onTouchEnd={onUp}
    >
      <span style={{ fontSize: "9px", fontWeight: "bold" }}>
        {keyDef.label}
      </span>
      <span style={{
        fontSize: "6px",
        color: isActive ? "#000000" : "#444444",
        marginTop: "1px",
      }}>
        {noteName}{octave}
      </span>
    </button>
  );
}

/** One octave of tracker keyboard: black row on top, white row below */
function TrackerOctaveBlock({
  whiteKeys,
  blackKeys,
  baseNote,
  activeNotes,
  onNoteOn,
  onNoteOff,
}: {
  whiteKeys: KeyDef[];
  blackKeys: KeyDef[];
  baseNote: number;
  activeNotes: Set<number>;
  onNoteOn: (n: number) => void;
  onNoteOff: (n: number) => void;
}) {
  // Merge and sort all keys by note for the black key row positioning
  const allSorted = [...whiteKeys, ...blackKeys].sort((a, b) => a.note - b.note);

  return (
    <div className="flex flex-col gap-0" style={{ flex: "1", minHeight: 0 }}>
      {/* Black key row — black keys get more flex than empty gaps */}
      <div className="flex" style={{ height: "40%", minHeight: "16px" }}>
        {whiteKeys.map((wk, wi) => {
          const bk = blackKeys.find(
            (b) => b.note > wk.note && (wi + 1 >= whiteKeys.length || b.note < whiteKeys[wi + 1].note)
          );
          return (
            <React.Fragment key={wk.code}>
              {bk ? (
                <div style={{ flex: "6", minWidth: 0 }}>
                  <TrackerKey
                    keyDef={bk}
                    midiNote={baseNote + bk.note}
                    isActive={activeNotes.has(baseNote + bk.note)}
                    onDown={() => onNoteOn(baseNote + bk.note)}
                    onUp={() => onNoteOff(baseNote + bk.note)}
                  />
                </div>
              ) : (
                <div style={{ flex: "1", minWidth: 0 }} />
              )}
            </React.Fragment>
          );
        })}
      </div>

      {/* White key row */}
      <div className="flex" style={{ height: "60%", minHeight: "20px" }}>
        {whiteKeys.map((wk) => (
          <TrackerKey
            key={wk.code}
            keyDef={wk}
            midiNote={baseNote + wk.note}
            isActive={activeNotes.has(baseNote + wk.note)}
            onDown={() => onNoteOn(baseNote + wk.note)}
            onUp={() => onNoteOff(baseNote + wk.note)}
          />
        ))}
      </div>
    </div>
  );
}

export function LivePads({
  bank,
  preset,
  inputMode = "tracker",
  mutedPads,
  soloedPads,
  isRecording = false,
  playbackInfo = [],
  patternBank = 0,
  onPadTrigger,
  onNoteOn,
  onNoteOff,
}: LivePadsProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [activePad, setActivePad] = useState<number | null>(null);
  const [activeNotes, setActiveNotes] = useState<Set<number>>(new Set());
  const [layout, setLayout] = useState<LayoutMode>("tall");
  const [octaveMode, setOctaveMode] = useState<OctaveMode>("stacked");

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const ro = new ResizeObserver((entries) => {
      const { width, height } = entries[0].contentRect;
      const ratio = width / height;
      setLayout(ratio > 1.2 ? "wide" : "tall");
      // Always show both octave rows stacked — upper on top, lower below.
      setOctaveMode("stacked");
    });

    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // Listen for physical keyboard → light up on-screen keys + trigger notes
  // Disabled in sampler mode — KoalaRouter handles keys instead
  useEffect(() => {
    if (inputMode === "sampler") return;

    const heldKeys = new Set<string>();

    const handleKeyDown = (e: KeyboardEvent) => {
      const midi = CODE_TO_MIDI[e.code];
      if (midi === undefined) return;
      if (heldKeys.has(e.code)) return; // ignore key repeat
      heldKeys.add(e.code);
      e.preventDefault();
      e.stopPropagation();
      setActiveNotes((prev) => new Set(prev).add(midi));
      onNoteOn(midi);
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      const midi = CODE_TO_MIDI[e.code];
      if (midi === undefined) return;
      heldKeys.delete(e.code);
      setActiveNotes((prev) => {
        const next = new Set(prev);
        next.delete(midi);
        return next;
      });
      onNoteOff(midi);
    };

    // Use capture phase so we intercept before InputRouter
    window.addEventListener("keydown", handleKeyDown, true);
    window.addEventListener("keyup", handleKeyUp, true);
    return () => {
      window.removeEventListener("keydown", handleKeyDown, true);
      window.removeEventListener("keyup", handleKeyUp, true);
    };
  }, [onNoteOn, onNoteOff, inputMode]);

  const handlePadTrigger = useCallback(
    (index: number) => {
      setActivePad(index);
      onPadTrigger(index, bank);
      setTimeout(() => setActivePad(null), 150);
    },
    [bank, onPadTrigger],
  );

  const handleNoteOn = useCallback(
    (midiNote: number) => {
      setActiveNotes((prev) => new Set(prev).add(midiNote));
      onNoteOn(midiNote);
    },
    [onNoteOn],
  );

  const handleNoteOff = useCallback(
    (midiNote: number) => {
      setActiveNotes((prev) => {
        const next = new Set(prev);
        next.delete(midiNote);
        return next;
      });
      onNoteOff(midiNote);
    },
    [onNoteOff],
  );

  const bankDigits = toSlimeKeys(bank, 2);
  const presetDigits = toSlimeKeys(preset, 2);
  const isWide = layout === "wide";

  return (
    <div
      ref={containerRef}
      className="h-full select-none flex flex-col"
      style={{
        fontFamily: "var(--dm-font-primary)",
        fontSize: "10px",
        imageRendering: "pixelated",
      }}
    >
      {/* Bank / Preset header */}
      <div
        className="flex items-center justify-between px-2 py-1 border-b flex-shrink-0"
        style={{ borderColor: "#333333" }}
      >
        <div className="flex items-center gap-1">
          <span style={{ fontSize: "8px", color: "#999999", letterSpacing: "1px" }}>BANK</span>
          <div className="flex items-center gap-0 border px-1" style={{ borderColor: "#555555" }}>
            {bankDigits.map((k, i) => (
              <SlimeGlyph key={i} hexKey={k} size={12} />
            ))}
          </div>
        </div>
        <div className="flex items-center gap-1">
          <span style={{ fontSize: "8px", color: "#999999", letterSpacing: "1px" }}>KIT</span>
          <div className="flex items-center gap-0 border px-1" style={{ borderColor: "#555555" }}>
            {presetDigits.map((k, i) => (
              <SlimeGlyph key={i} hexKey={k} size={12} />
            ))}
          </div>
        </div>
      </div>

      {/* Playback chain/pattern indicator + recording status */}
      {(playbackInfo.length > 0 || isRecording) && (
        <div
          className="flex items-center gap-2 px-2 py-0.5 border-b flex-shrink-0"
          style={{ borderColor: "#222222", minHeight: "16px" }}
        >
          {isRecording && (
            <span style={{
              fontSize: "8px",
              color: "#ff4444",
              letterSpacing: "1px",
              animation: "blink 0.5s step-end infinite",
            }}>
              REC
            </span>
          )}
          {playbackInfo.length > 0 && (
            <div className="flex items-center gap-1" style={{ fontSize: "7px", color: "#666666", letterSpacing: "1px" }}>
              <span style={{ color: "#888888" }}>PTN:</span>
              {playbackInfo.map((ch, i) => (
                <span key={i} style={{
                  color: ch.chainId !== null ? "#aaaaaa" : "#333333",
                  minWidth: "16px",
                  textAlign: "center",
                }}>
                  {ch.chainId !== null
                    ? `${ch.chainId.toString(16).toUpperCase()}:${ch.phraseRow.toString(16).toUpperCase().padStart(2, "0")}`
                    : "--"}
                </span>
              ))}
              {patternBank > 0 && (
                <span style={{ color: "#555555", marginLeft: "4px" }}>
                  PB:{patternBank}
                </span>
              )}
            </div>
          )}
        </div>
      )}

      {/* Main: pads + keyboard */}
      <div
        className="flex-1 flex min-h-0"
        style={{ flexDirection: isWide ? "row" : "column" }}
      >
        {/* 4x4 Pad grid */}
        <div
          className="p-1"
          style={{
            flex: isWide ? "0 0 50%" : "1 1 0%",
            minHeight: 0,
            minWidth: 0,
          }}
        >
          <div
            className="grid gap-1"
            style={{
              gridTemplateColumns: "repeat(4, 1fr)",
              gridTemplateRows: "repeat(4, 1fr)",
              height: "100%",
            }}
          >
            {Array.from({ length: 16 }, (_, i) => {
              const globalIdx = bank * PADS_PER_BANK + i;
              return (
                <Pad
                  key={i}
                  index={i}
                  bank={bank}
                  active={activePad === i}
                  muted={mutedPads?.has(globalIdx)}
                  soloed={soloedPads?.has(globalIdx)}
                  onTrigger={() => handlePadTrigger(i)}
                />
              );
            })}
          </div>
        </div>

        {/* Tracker keyboard section */}
        <div
          className="p-1 flex flex-col gap-1"
          style={{
            flex: isWide ? "0 0 50%" : "0 0 auto",
            borderLeft: isWide ? "1px solid #333333" : "none",
            borderTop: isWide ? "none" : "1px solid #333333",
            minHeight: isWide ? 0 : octaveMode === "stacked" ? "120px" : "60px",
          }}
        >
          {octaveMode === "stacked" ? (
            <>
              {/* Upper octave: number row + QWERTY row */}
              <TrackerOctaveBlock
                whiteKeys={UPPER_WHITE}
                blackKeys={UPPER_BLACK}
                baseNote={60}
                activeNotes={activeNotes}
                onNoteOn={handleNoteOn}
                onNoteOff={handleNoteOff}
              />
              {/* Lower octave: ASDF row + ZXCV row */}
              <TrackerOctaveBlock
                whiteKeys={LOWER_WHITE}
                blackKeys={LOWER_BLACK}
                baseNote={48}
                activeNotes={activeNotes}
                onNoteOn={handleNoteOn}
                onNoteOff={handleNoteOff}
              />
            </>
          ) : (
            /* Single octave: lower only */
            <TrackerOctaveBlock
              whiteKeys={LOWER_WHITE}
              blackKeys={LOWER_BLACK}
              baseNote={48}
              activeNotes={activeNotes}
              onNoteOn={handleNoteOn}
              onNoteOff={handleNoteOff}
            />
          )}
        </div>
      </div>

      {/* Shortcut hint */}
      <div
        className="flex-shrink-0 px-1"
        style={{
          fontSize: "7px",
          color: "#444444",
          letterSpacing: "1px",
          height: "12px",
          lineHeight: "12px",
        }}
      >
        SHIFT+W: UP/DN=BANK  L/R=KIT
      </div>
    </div>
  );
}
