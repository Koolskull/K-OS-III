/*
 *            ☦
 *      ╔══════════════════╗
 *      ║  ST. MICHAEL     ║
 *      ║  Guardian of     ║
 *      ║  Touch           ║
 *      ╚══════════════════╝
 *
 *   TOUCH CONTROLLER
 *   On-screen Game Boy-style controller for portrait/vertical screens.
 *
 *   Left side: D-pad (4 circle buttons in cross formation)
 *   Right side: Action buttons in cross formation
 *     North = Shift (SH)
 *     East  = W
 *     South = Q
 *     West  = Space (SP)
 *
 *   When isTextInput is true, shows a QWERTY keyboard instead.
 *   Hidden on the Live screen (it has its own touch piano).
 *
 *   Supports both touch events AND mouse events (for desktop touchscreens).
 */

"use client";

import React, { useCallback, useRef, useEffect, useState } from "react";
import type { InputRouter, InputAction } from "@/lib/InputRouter";

interface TouchControllerProps {
  inputRouter: InputRouter | null;
  isTextInput?: boolean;
  onTextChar?: (char: string) => void;
}

const BTN_SIZE = 44;
const BTN_GAP = 4;
const CROSS_SIZE = BTN_SIZE * 3 + BTN_GAP * 2;

const CIRCLE_STYLE: React.CSSProperties = {
  width: `${BTN_SIZE}px`,
  height: `${BTN_SIZE}px`,
  border: "1px solid #666666",
  backgroundColor: "#0a0a0a",
  color: "#888888",
  fontFamily: "var(--dm-font-primary)",
  fontSize: "8px",
  letterSpacing: "1px",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  touchAction: "none",
  WebkitTouchCallout: "none",
  userSelect: "none",
  cursor: "pointer",
};

const ACTIVE_STYLE: React.CSSProperties = {
  ...CIRCLE_STYLE,
  backgroundColor: "#ffffff",
  color: "#000000",
  borderColor: "#ffffff",
};

// ── D-PAD BUTTON ──

function DpadButton({
  dir,
  label,
  inputRouter,
}: {
  dir: "up" | "down" | "left" | "right";
  label: string;
  inputRouter: InputRouter | null;
}) {
  const [active, setActive] = useState(false);
  const repeatRef = useRef<number | null>(null);
  const delayRef = useRef<number | null>(null);

  const clearRepeat = useCallback(() => {
    if (delayRef.current !== null) { clearTimeout(delayRef.current); delayRef.current = null; }
    if (repeatRef.current !== null) { clearInterval(repeatRef.current); repeatRef.current = null; }
  }, []);

  const doStart = useCallback(() => {
    if (!inputRouter) return;
    setActive(true);
    const action = inputRouter.resolveDirection(dir);
    inputRouter.injectAction(action);
    clearRepeat();
    delayRef.current = window.setTimeout(() => {
      repeatRef.current = window.setInterval(() => {
        const a = inputRouter.resolveDirection(dir);
        inputRouter.injectAction(a);
      }, 80);
    }, 300);
  }, [dir, inputRouter, clearRepeat]);

  const doEnd = useCallback(() => {
    setActive(false);
    clearRepeat();
  }, [clearRepeat]);

  useEffect(() => clearRepeat, [clearRepeat]);

  return (
    <button
      className="dm-touch-btn-circle"
      style={active ? ACTIVE_STYLE : CIRCLE_STYLE}
      onTouchStart={(e) => { e.preventDefault(); doStart(); }}
      onTouchEnd={(e) => { e.preventDefault(); doEnd(); }}
      onTouchCancel={(e) => { e.preventDefault(); doEnd(); }}
      onMouseDown={(e) => { e.preventDefault(); doStart(); }}
      onMouseUp={(e) => { e.preventDefault(); doEnd(); }}
      onMouseLeave={doEnd}
    >
      {label}
    </button>
  );
}

// ── MODIFIER BUTTON ──

function ModButton({
  label,
  modifier,
  inputRouter,
}: {
  label: string;
  modifier: "shift" | "q" | "w";
  inputRouter: InputRouter | null;
}) {
  const [active, setActive] = useState(false);

  const doStart = useCallback(() => {
    setActive(true);
    inputRouter?.setModifier(modifier, true);
  }, [modifier, inputRouter]);

  const doEnd = useCallback(() => {
    setActive(false);
    inputRouter?.setModifier(modifier, false);
    if (modifier === "q") {
      inputRouter?.injectAction("place");
    }
  }, [modifier, inputRouter]);

  return (
    <button
      className="dm-touch-btn-circle"
      style={active ? ACTIVE_STYLE : CIRCLE_STYLE}
      onTouchStart={(e) => { e.preventDefault(); doStart(); }}
      onTouchEnd={(e) => { e.preventDefault(); doEnd(); }}
      onTouchCancel={(e) => { e.preventDefault(); doEnd(); }}
      onMouseDown={(e) => { e.preventDefault(); doStart(); }}
      onMouseUp={(e) => { e.preventDefault(); doEnd(); }}
      onMouseLeave={() => { if (active) doEnd(); }}
    >
      {label}
    </button>
  );
}

// ── ACTION BUTTON ──

function ActionButton({
  label,
  action,
  inputRouter,
}: {
  label: string;
  action: InputAction;
  inputRouter: InputRouter | null;
}) {
  const [active, setActive] = useState(false);

  const doStart = useCallback(() => {
    setActive(true);
    inputRouter?.injectAction(action);
  }, [action, inputRouter]);

  const doEnd = useCallback(() => {
    setActive(false);
  }, []);

  return (
    <button
      className="dm-touch-btn-circle"
      style={active ? ACTIVE_STYLE : CIRCLE_STYLE}
      onTouchStart={(e) => { e.preventDefault(); doStart(); }}
      onTouchEnd={(e) => { e.preventDefault(); doEnd(); }}
      onTouchCancel={(e) => { e.preventDefault(); doEnd(); }}
      onMouseDown={(e) => { e.preventDefault(); doStart(); }}
      onMouseUp={(e) => { e.preventDefault(); doEnd(); }}
      onMouseLeave={() => { if (active) doEnd(); }}
    >
      {label}
    </button>
  );
}

// ── QWERTY KEYBOARD ──

const QWERTY_ROWS = [
  ["1","2","3","4","5","6","7","8","9","0"],
  ["Q","W","E","R","T","Y","U","I","O","P"],
  ["A","S","D","F","G","H","J","K","L"],
  ["Z","X","C","V","B","N","M","-","_"],
];

const KEY_STYLE: React.CSSProperties = {
  flex: "1",
  maxWidth: "32px",
  height: "32px",
  border: "1px solid #555555",
  backgroundColor: "#0a0a0a",
  color: "#ffffff",
  fontFamily: "var(--dm-font-primary)",
  fontSize: "8px",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  touchAction: "none",
  cursor: "pointer",
};

const WIDE_KEY_STYLE: React.CSSProperties = {
  height: "32px",
  border: "1px solid #555555",
  backgroundColor: "#0a0a0a",
  color: "#888888",
  fontFamily: "var(--dm-font-primary)",
  fontSize: "8px",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  touchAction: "none",
  cursor: "pointer",
};

function TouchKeyboard({
  onChar,
  inputRouter,
}: {
  onChar?: (char: string) => void;
  inputRouter: InputRouter | null;
}) {
  const fireChar = useCallback((char: string) => {
    onChar?.(char);
  }, [onChar]);

  const fireBackspace = useCallback(() => {
    inputRouter?.injectAction("delete");
  }, [inputRouter]);

  const fireDone = useCallback(() => {
    inputRouter?.injectAction("place");
  }, [inputRouter]);

  return (
    <div
      className="dm-touch-controller"
      style={{
        display: "flex",
        flexDirection: "column",
        gap: "2px",
        padding: "4px",
      }}
    >
      {QWERTY_ROWS.map((row, ri) => (
        <div key={ri} style={{ display: "flex", gap: "2px", justifyContent: "center" }}>
          {row.map((ch) => (
            <button
              key={ch}
              style={KEY_STYLE}
              onTouchStart={(e) => { e.preventDefault(); fireChar(ch); }}
              onMouseDown={(e) => { e.preventDefault(); fireChar(ch); }}
            >
              {ch}
            </button>
          ))}
        </div>
      ))}
      {/* Bottom row: SPACE, BKSP, DONE */}
      <div style={{ display: "flex", gap: "2px", justifyContent: "center" }}>
        <button
          style={{ ...WIDE_KEY_STYLE, flex: "3" }}
          onTouchStart={(e) => { e.preventDefault(); fireChar(" "); }}
          onMouseDown={(e) => { e.preventDefault(); fireChar(" "); }}
        >
          SPACE
        </button>
        <button
          style={{ ...WIDE_KEY_STYLE, flex: "2" }}
          onTouchStart={(e) => { e.preventDefault(); fireBackspace(); }}
          onMouseDown={(e) => { e.preventDefault(); fireBackspace(); }}
        >
          BKSP
        </button>
        <button
          style={{ ...WIDE_KEY_STYLE, flex: "2", backgroundColor: "#1a1a1a", color: "#ffffff" }}
          onTouchStart={(e) => { e.preventDefault(); fireDone(); }}
          onMouseDown={(e) => { e.preventDefault(); fireDone(); }}
        >
          DONE
        </button>
      </div>
    </div>
  );
}

// ── MAIN COMPONENT ──

export function TouchController({ inputRouter, isTextInput, onTextChar }: TouchControllerProps) {
  if (isTextInput) {
    return <TouchKeyboard onChar={onTextChar} inputRouter={inputRouter} />;
  }

  return (
    <div
      className="dm-touch-controller"
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "8px 16px",
        height: "160px",
        flexShrink: 0,
      }}
    >
      {/* Left: D-pad cross */}
      <div
        style={{
          width: `${CROSS_SIZE}px`,
          height: `${CROSS_SIZE}px`,
          display: "grid",
          gridTemplateColumns: `${BTN_SIZE}px ${BTN_SIZE}px ${BTN_SIZE}px`,
          gridTemplateRows: `${BTN_SIZE}px ${BTN_SIZE}px ${BTN_SIZE}px`,
          gap: `${BTN_GAP}px`,
        }}
      >
        {/* Row 1: _, UP, _ */}
        <div />
        <DpadButton dir="up" label="UP" inputRouter={inputRouter} />
        <div />
        {/* Row 2: LEFT, _, RIGHT */}
        <DpadButton dir="left" label="LT" inputRouter={inputRouter} />
        <div />
        <DpadButton dir="right" label="RT" inputRouter={inputRouter} />
        {/* Row 3: _, DOWN, _ */}
        <div />
        <DpadButton dir="down" label="DN" inputRouter={inputRouter} />
        <div />
      </div>

      {/* Right: Action buttons cross */}
      <div
        style={{
          width: `${CROSS_SIZE}px`,
          height: `${CROSS_SIZE}px`,
          display: "grid",
          gridTemplateColumns: `${BTN_SIZE}px ${BTN_SIZE}px ${BTN_SIZE}px`,
          gridTemplateRows: `${BTN_SIZE}px ${BTN_SIZE}px ${BTN_SIZE}px`,
          gap: `${BTN_GAP}px`,
        }}
      >
        {/* Row 1: _, SHIFT (North), _ */}
        <div />
        <ModButton label="SH" modifier="shift" inputRouter={inputRouter} />
        <div />
        {/* Row 2: SPACE (West), _, W (East) */}
        <ActionButton label="SP" action="play_stop" inputRouter={inputRouter} />
        <div />
        <ModButton label="W" modifier="w" inputRouter={inputRouter} />
        {/* Row 3: _, Q (South), _ */}
        <div />
        <ModButton label="Q" modifier="q" inputRouter={inputRouter} />
        <div />
      </div>
    </div>
  );
}
