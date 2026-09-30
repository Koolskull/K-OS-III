"use client";

import { useCallback, useEffect, useRef, useState, type CSSProperties, type ReactNode } from "react";
import { ThrashTrackerApp } from "@/components/apps/ThrashTrackerApp";

/**
 * Phone tracker. Grid on top, Datamoshpit-style keys underneath, no backdrop.
 * The 2kool.tv desktop icon always opens this, on every viewport. The /thrash
 * route uses the same shell. SHIFT and CTRL step the F1-F8 screen list.
 * SPACE plays and pauses. Kongtext is drawn at 8px and shown at 2x (16px).
 */

const BTN = 56;
const GAP = 6;
const CROSS = BTN * 3 + GAP * 2;
const TUTORIAL_KEY = "thrash-phone-tutorial-dismissed";

const IDLE: CSSProperties = {
  width: "100%",
  height: "100%",
  border: "1px solid #666666",
  background: "#0a0a0a",
  color: "#888888",
  fontFamily: "kongtext, monospace",
  fontSize: "16px",
  lineHeight: 1,
  letterSpacing: "0px",
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

function press(key: string, code: string, shift = false, ctrl = false) {
  window.dispatchEvent(
    new KeyboardEvent("keydown", {
      key,
      code,
      bubbles: true,
      cancelable: true,
      shiftKey: shift,
      ctrlKey: ctrl,
    }),
  );
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
}: {
  label: string;
  onDown: () => void;
  onUp: () => void;
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
      style={hot ? HOT : IDLE}
      onContextMenu={(event) => event.preventDefault()}
      onPointerDown={(event) => {
        event.preventDefault();
        event.currentTarget.setPointerCapture(event.pointerId);
        down();
      }}
      onPointerUp={(event) => {
        event.preventDefault();
        up();
      }}
      onPointerCancel={up}
    >
      {label}
    </button>
  );
}

function ThrashKeys() {
  const repeat = useRef<number | null>(null);
  const delay = useRef<number | null>(null);

  const clearRepeat = useCallback(() => {
    if (delay.current !== null) window.clearTimeout(delay.current);
    if (repeat.current !== null) window.clearInterval(repeat.current);
    delay.current = null;
    repeat.current = null;
  }, []);

  useEffect(() => clearRepeat, [clearRepeat]);

  const steer = useCallback((dir: Dir) => {
    press(ARROW[dir], ARROW[dir]);
  }, []);

  const startDir = useCallback((dir: Dir) => {
    steer(dir);
    clearRepeat();
    delay.current = window.setTimeout(() => {
      repeat.current = window.setInterval(() => steer(dir), 80);
    }, 300);
  }, [steer, clearRepeat]);

  const changePage = useCallback((delta: number) => {
    // PageDown/PageUp with shift or ctrl. Phone handler calls goTo
    // on the Shift+F1-F8 screen list, from the current screen.
    const code = delta > 0 ? "PageDown" : "PageUp";
    press(code, code, delta > 0, delta < 0);
  }, []);

  const noop = useCallback(() => {}, []);

  return (
    <div
      style={{
        flexShrink: 0,
        display: "flex",
        flexDirection: "column",
        gap: 8,
        padding: "8px 12px calc(8px + env(safe-area-inset-bottom))",
        background: "#000000",
        touchAction: "none",
      }}
    >
      <div style={{ display: "flex", justifyContent: "center" }}>
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
      </div>
      <div style={{ display: "flex", gap: 8, height: 56 }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <PadButton label="SHIFT" onDown={() => changePage(1)} onUp={noop} />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <PadButton label="CTRL" onDown={() => changePage(-1)} onUp={noop} />
        </div>
      </div>
      <div style={{ height: 64 }}>
        <PadButton label="SPACE" onDown={() => press(" ", "Space")} onUp={noop} />
      </div>
    </div>
  );
}

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
      <p style={line}>ARROWS move the cursor.</p>
      <p style={line}>SHIFT changes the page. Next screen in the F1 to F8 list.</p>
      <p style={line}>CTRL changes the page. Previous screen in that list.</p>
      <p style={line}>SPACE plays and pauses.</p>
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
  /** Fill the desktop window instead of the viewport. The icon always uses this. */
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
      <div style={{ flex: "1 1 auto", minHeight: 0, position: "relative", overflow: "hidden" }}>
        <ThrashTrackerApp isFocused={isFocused} backdrop={false} phone />
      </div>
      <ThrashKeys />
      <Tutorial />
    </main>
  );
}
