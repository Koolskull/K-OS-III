"use client";

import { useCallback, useEffect, useRef, useState, type CSSProperties, type ReactNode } from "react";
import { ThrashTrackerApp } from "@/components/apps/ThrashTrackerApp";

/**
 * Thrash Tracker app body. Grid on top. Under it, the old Datamoshpit
 * controls: the tracker key view, then the round Game Boy pad.
 * Left cross moves. Right cross is ALT, SHIFT, DEL, and CTRL.
 * A red ESC sits in the top right. Space sits between the two crosses.
 * The desktop icon opens this inside a window.
 */

const BTN = 44;
const GAP = 4;
const CROSS = BTN * 3 + GAP * 2;
const TUTORIAL_KEY = "thrash-phone-tutorial-v2";
const NOTES = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];
const LOWER = "zsxdcvgbhnjm,l.;/";
const UPPER = "q2w3er5t6y7ui9o0p";

const IDLE: CSSProperties = {
  width: "100%",
  height: "100%",
  border: "1px solid #666666",
  borderRadius: "50%",
  background: "#0a0a0a",
  color: "#888888",
  fontFamily: "kongtext, monospace",
  fontSize: "8px",
  lineHeight: 1,
  letterSpacing: "1px",
  whiteSpace: "nowrap",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  touchAction: "none",
  userSelect: "none",
  WebkitTouchCallout: "none",
  cursor: "pointer",
  padding: 0,
};

const HOT: CSSProperties = {
  ...IDLE,
  background: "#ffffff",
  color: "#000000",
  borderColor: "#ffffff",
};

type Dir = "up" | "down" | "left" | "right";

const ARROW: Record<Dir, string> = {
  up: "ArrowUp",
  down: "ArrowDown",
  left: "ArrowLeft",
  right: "ArrowRight",
};

function press(key: string, code: string, shift = false, ctrl = false, alt = false) {
  const host = window as Window & { __thrashMods?: { shift: boolean; ctrl: boolean; alt: boolean } | null };
  host.__thrashMods = { shift, ctrl, alt };
  window.dispatchEvent(
    new KeyboardEvent("keydown", {
      key,
      code,
      bubbles: true,
      cancelable: true,
      shiftKey: shift,
      ctrlKey: ctrl,
      altKey: alt,
    }),
  );
  host.__thrashMods = null;
}

function Cross({ children }: { children: ReactNode }) {
  return (
    <div
      style={{
        width: CROSS,
        height: CROSS,
        display: "grid",
        gridTemplateColumns: `${BTN}px ${BTN}px ${BTN}px`,
        gridTemplateRows: `${BTN}px ${BTN}px ${BTN}px`,
        gap: GAP,
        flexShrink: 0,
      }}
    >
      {children}
    </div>
  );
}

function PadButton({
  label,
  onDown,
  onUp,
  hold = false,
}: {
  label: string;
  onDown: () => void;
  onUp: () => void;
  /** Stay down if the browser cancels the finger when a second key is pressed. */
  hold?: boolean;
}) {
  const [hot, setHot] = useState(false);
  const down = useCallback(() => {
    setHot(true);
    onDown();
  }, [onDown]);
  const up = useCallback(() => {
    setHot(false);
    onUp();
  }, [onUp]);

  return (
    <button
      type="button"
      aria-label={label}
      className="dm-touch-btn-circle"
      style={hot ? HOT : IDLE}
      onContextMenu={(event) => event.preventDefault()}
      onPointerDown={(event) => {
        event.preventDefault();
        down();
        try { event.currentTarget.setPointerCapture(event.pointerId); } catch { /* pointer already gone */ }
      }}
      onPointerUp={(event) => {
        event.preventDefault();
        up();
      }}
      onPointerCancel={hold ? undefined : up}
    >
      {label}
    </button>
  );
}

function splitKeys(row: string) {
  return [...row].map((label, note) => {
    const pitch = note % 12;
    const isBlack = pitch === 1 || pitch === 3 || pitch === 6 || pitch === 8 || pitch === 10;
    return { label, note, isBlack };
  });
}

function noteLabel(index: number, octave: number) {
  const midi = (octave + 1) * 12 + index;
  return `${NOTES[((midi % 12) + 12) % 12]}${Math.floor(midi / 12) - 1}`;
}

function KeyRow({
  row,
  octave,
  base,
  held,
  onNote,
  onUp,
}: {
  row: string;
  octave: number;
  base: number;
  held: string;
  onNote: (label: string) => void;
  onUp: () => void;
}) {
  const keys = splitKeys(row);
  const white = keys.filter((key) => !key.isBlack);
  return (
    <div style={{ display: "flex", flexDirection: "column", flex: 1, minHeight: 0 }}>
      <div style={{ display: "flex", height: "42%" }}>
        {white.map((key, index) => {
          const black = keys.find((item) => item.note > key.note && (index + 1 >= white.length || item.note < white[index + 1].note));
          return (
            <div key={key.label} style={{ flex: black ? 6 : 1, minWidth: 0 }}>
              {black ? (
                <NoteKey
                  label={black.label}
                  hint={noteLabel(base + black.note, octave)}
                  black
                  hot={held === black.label}
                  onDown={() => onNote(black.label)}
                  onUp={onUp}
                />
              ) : null}
            </div>
          );
        })}
      </div>
      <div style={{ display: "flex", height: "58%" }}>
        {white.map((key) => (
          <NoteKey
            key={key.label}
            label={key.label.toUpperCase()}
            hint={noteLabel(base + key.note, octave)}
            hot={held === key.label}
            onDown={() => onNote(key.label)}
            onUp={onUp}
          />
        ))}
      </div>
    </div>
  );
}

function NoteKey({
  label,
  hint,
  black = false,
  hot,
  onDown,
  onUp,
}: {
  label: string;
  hint: string;
  black?: boolean;
  hot: boolean;
  onDown: () => void;
  onUp: () => void;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      onContextMenu={(event) => event.preventDefault()}
      onPointerDown={(event) => {
        event.preventDefault();
        onDown();
        try { event.currentTarget.setPointerCapture(event.pointerId); } catch { /* pointer already gone */ }
      }}
      onPointerUp={(event) => {
        event.preventDefault();
        onUp();
      }}
      onPointerCancel={onUp}
      style={{
        width: "100%",
        height: "100%",
        border: "1px solid #333333",
        borderRadius: 0,
        background: hot ? "#ffffff" : black ? "#111111" : "#0a0a0a",
        color: hot ? "#000000" : black ? "#666666" : "#888888",
        fontFamily: "kongtext, monospace",
        fontSize: "8px",
        lineHeight: 1,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        touchAction: "none",
        userSelect: "none",
        cursor: "pointer",
        padding: 0,
      }}
    >
      <span>{label.toUpperCase()}</span>
      <span style={{ fontSize: "6px", color: hot ? "#000000" : "#444444", marginTop: 2 }}>{hint}</span>
    </button>
  );
}

function DatamoshpitControls() {
  const repeat = useRef<number | null>(null);
  const delay = useRef<number | null>(null);
  const mods = useRef({ shift: false, alt: false, ctrl: false });
  const [held, setHeld] = useState("");
  const [octave, setOctave] = useState(4);

  const clearRepeat = useCallback(() => {
    if (delay.current !== null) window.clearTimeout(delay.current);
    if (repeat.current !== null) window.clearInterval(repeat.current);
    delay.current = null;
    repeat.current = null;
  }, []);

  useEffect(() => clearRepeat, [clearRepeat]);

  useEffect(() => {
    const down = (event: KeyboardEvent) => {
      const key = event.key.toLowerCase();
      if (LOWER.includes(key) || UPPER.includes(key)) setHeld(key);
      if (key === "-" || key === "_") setOctave((value) => Math.max(0, value - 1));
      if (key === "=" || key === "+") setOctave((value) => Math.min(8, value + 1));
    };
    const up = () => setHeld("");
    window.addEventListener("keydown", down);
    window.addEventListener("keyup", up);
    return () => {
      window.removeEventListener("keydown", down);
      window.removeEventListener("keyup", up);
    };
  }, []);

  const steer = useCallback((dir: Dir) => {
    const { shift, alt, ctrl } = mods.current;
    press(ARROW[dir], ARROW[dir], shift, ctrl, alt);
  }, []);

  const startDir = useCallback((dir: Dir) => {
    steer(dir);
    clearRepeat();
    delay.current = window.setTimeout(() => {
      repeat.current = window.setInterval(() => steer(dir), 80);
    }, 300);
  }, [steer, clearRepeat]);

  const playNote = useCallback((label: string) => {
    setHeld(label);
    window.dispatchEvent(new CustomEvent("thrash-note", { detail: { key: label } }));
  }, []);

  const releaseNote = useCallback(() => setHeld(""), []);

  const changeOctave = useCallback((delta: number) => {
    const key = delta < 0 ? "-" : "=";
    press(key, key === "-" ? "Minus" : "Equal");
  }, []);

  return (
    <div
      style={{
        flexShrink: 0,
        display: "flex",
        flexDirection: "column",
        gap: 6,
        padding: "6px 8px calc(6px + env(safe-area-inset-bottom))",
        background: "#000000",
        borderTop: "1px solid #333333",
        touchAction: "none",
      }}
    >
      <div style={{ display: "flex", gap: 4, height: 28 }}>
        <button type="button" onPointerDown={() => changeOctave(-1)} style={octaveButton}>OCT-</button>
        <button type="button" onPointerDown={() => changeOctave(1)} style={octaveButton}>OCT+</button>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 2, height: 112 }}>
        <KeyRow row={UPPER} octave={octave} base={12} held={held} onNote={playNote} onUp={releaseNote} />
        <KeyRow row={LOWER} octave={octave} base={0} held={held} onNote={playNote} onUp={releaseNote} />
      </div>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "4px 8px 0",
          height: CROSS,
        }}
      >
        <Cross>
          <div />
          <PadButton label="UP" onDown={() => startDir("up")} onUp={clearRepeat} />
          <div />
          <PadButton label="LT" onDown={() => startDir("left")} onUp={clearRepeat} />
          <div />
          <PadButton label="RT" onDown={() => startDir("right")} onUp={clearRepeat} />
          <div />
          <PadButton label="DN" onDown={() => startDir("down")} onUp={clearRepeat} />
          <div />
        </Cross>
        <button
          type="button"
          aria-label="SPACE"
          onContextMenu={(event) => event.preventDefault()}
          onPointerDown={(event) => {
            event.preventDefault();
            press(" ", "Space");
          }}
          style={spaceButton}
        >
          SPACE
        </button>
        <Cross>
          <div />
          <PadButton
            label="ALT"
            hold
            onDown={() => { mods.current.alt = true; }}
            onUp={() => { mods.current.alt = false; }}
          />
          <div />
          <PadButton
            label="SHIFT"
            hold
            onDown={() => { mods.current.shift = true; }}
            onUp={() => { mods.current.shift = false; }}
          />
          <div />
          <PadButton
            label="DEL"
            onDown={() => press("Backspace", "Backspace")}
            onUp={() => {}}
          />
          <div />
          <PadButton
            label="CTRL"
            hold
            onDown={() => { mods.current.ctrl = true; }}
            onUp={() => { mods.current.ctrl = false; }}
          />
          <div />
        </Cross>
      </div>
    </div>
  );
}

const spaceButton: CSSProperties = {
  flex: 1,
  alignSelf: "flex-end",
  height: BTN,
  margin: "0 8px",
  border: "1px solid #666666",
  borderRadius: 0,
  background: "#0a0a0a",
  color: "#888888",
  fontFamily: "kongtext, monospace",
  fontSize: "8px",
  letterSpacing: "1px",
  cursor: "pointer",
};

const escapeButton: CSSProperties = {
  position: "absolute",
  top: 6,
  right: 6,
  zIndex: 5,
  height: 36,
  minWidth: 72,
  padding: "0 10px",
  border: "1px solid #ff2020",
  borderRadius: 0,
  background: "#8a0000",
  color: "#ffd0d0",
  fontFamily: "kongtext, monospace",
  fontSize: "11px",
  letterSpacing: "1px",
  cursor: "pointer",
};

const octaveButton: CSSProperties = {
  flex: 1,
  border: "1px solid #333333",
  borderRadius: 0,
  background: "#0a0a0a",
  color: "#888888",
  fontFamily: "kongtext, monospace",
  fontSize: "8px",
  letterSpacing: "1px",
  cursor: "pointer",
};

function Tutorial() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    try {
      if (localStorage.getItem(TUTORIAL_KEY) !== "1") setShow(true);
    } catch {
      setShow(true);
    }
  }, []);

  const dismiss = useCallback(() => {
    try {
      localStorage.setItem(TUTORIAL_KEY, "1");
    } catch {
      /* private mode still closes for this visit */
    }
    setShow(false);
  }, []);

  if (!show) return null;

  const line: CSSProperties = {
    margin: 0,
    fontFamily: "kongtext, monospace",
    fontSize: "16px",
    lineHeight: 1.4,
    color: "#ffffff",
  };

  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        zIndex: 20,
        background: "rgba(0,0,0,0.92)",
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        gap: 16,
        padding: "24px 16px calc(16px + env(safe-area-inset-bottom))",
        touchAction: "none",
      }}
    >
      <p style={line}>LEFT PAD moves the cursor.</p>
      <p style={line}>Hold SHIFT and a direction to change screen.</p>
      <p style={line}>Hold CTRL and a direction to change the value. Up and down jump. Left and right step.</p>
      <p style={line}>SPACE plays and pauses. DEL clears a cell. Red ESC stops.</p>
      <button
        type="button"
        onClick={dismiss}
        style={{
          marginTop: 8,
          height: 64,
          border: "1px solid #ffffff",
          background: "#ffffff",
          color: "#000000",
          fontFamily: "kongtext, monospace",
          fontSize: "16px",
          letterSpacing: "0px",
          cursor: "pointer",
        }}
      >
        DISMISS
      </button>
    </div>
  );
}

export function ThrashPhoneShell({
  isFocused,
  embedded = false,
}: {
  isFocused: boolean;
  /** Fill the desktop app window. */
  embedded?: boolean;
}) {
  return (
    <main
      style={{
        position: embedded ? "absolute" : "fixed",
        inset: 0,
        background: "#000000",
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
        touchAction: "manipulation",
      }}
    >
      <div style={{ flex: "1 1 0", minHeight: 0, position: "relative", overflow: "hidden" }}>
        <ThrashTrackerApp isFocused={isFocused} backdrop={false} phone />
        <button
          type="button"
          aria-label="ESC"
          onContextMenu={(event) => event.preventDefault()}
          onPointerDown={(event) => {
            event.preventDefault();
            press("Escape", "Escape");
          }}
          style={escapeButton}
        >
          ESC
        </button>
      </div>
      <DatamoshpitControls />
      <Tutorial />
    </main>
  );
}
