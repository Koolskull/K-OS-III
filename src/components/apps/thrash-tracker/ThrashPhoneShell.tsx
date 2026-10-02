"use client";

import { useCallback, useEffect, useRef, useState, type CSSProperties, type ReactNode } from "react";
import { ThrashTrackerApp } from "@/components/apps/ThrashTrackerApp";
import {
  FaceplateShell,
  SkinPackPicker,
  useSkinPack,
  VmiImage,
} from "@/components/faceplates";
import { padUrlFallbackChain, resolveButtonUrl, type ResolvedSkinPack } from "@/lib/faceplates";

/**
 * Thrash Tracker as a handheld chassis.
 *
 * The tracker instance sits in a screen well. Faceplate art + keys decorate
 * AROUND that screen — they are the device body, not a second panel jammed
 * inside the AppWindow beside the grid.
 *
 * SHIFT / CTRL step F1–F8. SPACE plays/pauses.
 */

const BTN = 40;
const GAP = 4;
const CROSS = BTN * 3 + GAP * 2;
const TUTORIAL_KEY = "thrash-phone-tutorial-dismissed";

const IDLE: CSSProperties = {
  width: "100%",
  height: "100%",
  borderWidth: 1,
  borderStyle: "solid",
  borderColor: "#666666",
  background: "#0a0a0a",
  color: "#888888",
  fontFamily: "kongtext, monospace",
  fontSize: "12px",
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

function buttonArtUrls(pack: ResolvedSkinPack | null, slot: string, hot: boolean): string[] {
  if (!pack) return [];
  const state = hot ? "pressed" : "default";
  const primary = resolveButtonUrl(pack, slot, state);
  const urls: string[] = [];
  if (primary) urls.push(primary);
  for (const u of padUrlFallbackChain(pack, 0, state)) {
    if (!urls.includes(u)) urls.push(u);
  }
  return urls;
}

function PadButton({
  label,
  slot,
  pack,
  onDown,
  onUp,
}: {
  label: string;
  slot: string;
  pack: ResolvedSkinPack | null;
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

  const art = buttonArtUrls(pack, slot, hot);
  const hasArt = art.length > 0;

  return (
    <button
      type="button"
      aria-label={label}
      style={{
        ...(hot ? HOT : IDLE),
        position: "relative",
        overflow: "hidden",
        borderColor: hasArt ? "transparent" : hot ? "#ffffff" : "#666666",
        background: hasArt ? "transparent" : hot ? "#ffffff" : "#0a0a0a",
      }}
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
      {hasArt && (
        <div style={{ position: "absolute", inset: 0, zIndex: 0 }}>
          <VmiImage urls={art} alt="" fit="cover" />
        </div>
      )}
      <span style={{ position: "relative", zIndex: 1 }}>{label}</span>
    </button>
  );
}

/** Chassis controls — sit on the faceplate body below the screen well. */
function ChassisKeys({
  pack,
}: {
  pack: ResolvedSkinPack | null;
}) {
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
        alignItems: "center",
        gap: 6,
        padding: "8px 12px calc(8px + env(safe-area-inset-bottom))",
        touchAction: "none",
        position: "relative",
        zIndex: 1,
      }}
    >
      <div style={{ display: "flex", justifyContent: "center", width: "100%", gap: 12, alignItems: "center" }}>
        <Cross>
          <div />
          <PadButton label="UP" slot="up" pack={pack} onDown={() => startDir("up")} onUp={clearRepeat} />
          <div />
          <PadButton label="LT" slot="left" pack={pack} onDown={() => startDir("left")} onUp={clearRepeat} />
          <div />
          <PadButton label="RT" slot="right" pack={pack} onDown={() => startDir("right")} onUp={clearRepeat} />
          <div />
          <PadButton label="DN" slot="down" pack={pack} onDown={() => startDir("down")} onUp={clearRepeat} />
          <div />
        </Cross>
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 4,
            width: 80,
            flexShrink: 0,
          }}
        >
          <div style={{ height: BTN }}>
            <PadButton label="SHIFT" slot="shift" pack={pack} onDown={() => changePage(1)} onUp={noop} />
          </div>
          <div style={{ height: BTN }}>
            <PadButton label="CTRL" slot="ctrl" pack={pack} onDown={() => changePage(-1)} onUp={noop} />
          </div>
        </div>
      </div>
      <div style={{ height: 36, width: "100%", maxWidth: CROSS + 12 + 80 }}>
        <PadButton label="SPACE" slot="space" pack={pack} onDown={() => press(" ", "Space")} onUp={noop} />
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
          borderWidth: 1,
          borderStyle: "solid",
          borderColor: "#ffffff",
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
  const { pack, activeId, catalog, cycle } = useSkinPack();

  return (
    <main
      style={{
        position: embedded ? "absolute" : "fixed",
        inset: 0,
        background: "#000000",
        overflow: "hidden",
        touchAction: "manipulation",
      }}
    >
      {/*
        One chassis: faceplate art is the device body.
        Tracker lives in the screen well; keys decorate the body around it.
      */}
      <FaceplateShell
        pack={pack}
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          background: "#0a0a0a",
        }}
      >
        {/* Top bezel chrome — skin picker lives on the chassis, not in the screen */}
        <div
          style={{
            flexShrink: 0,
            display: "flex",
            justifyContent: "flex-end",
            alignItems: "center",
            padding: "4px 8px 2px",
            position: "relative",
            zIndex: 1,
            gap: 8,
            minHeight: 24,
          }}
        >
          <SkinPackPicker
            catalog={catalog}
            activeId={activeId ?? pack?.manifest.id}
            onCycle={cycle}
          />
        </div>

        {/* Screen well — the Thrash Tracker instance */}
        <div
          style={{
            flex: "1 1 auto",
            minHeight: 0,
            margin: "0 10px",
            position: "relative",
            zIndex: 1,
            borderWidth: 2,
            borderStyle: "solid",
            borderColor: "#222222",
            background: "#000000",
            boxShadow: "inset 0 0 0 1px #111111",
            overflow: "hidden",
          }}
        >
          <ThrashTrackerApp isFocused={isFocused} backdrop={false} phone />
        </div>

        {/* Chassis controls — decorate the faceplate body under the screen */}
        <ChassisKeys pack={pack} />
      </FaceplateShell>

      <Tutorial />
    </main>
  );
}
