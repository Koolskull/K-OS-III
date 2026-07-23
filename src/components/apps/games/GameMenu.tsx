/*
 *       ╔══════════════════╗
 *       ║  ARCADE CABINET  ║
 *       ║  ──────────────  ║
 *       ║  SELECT A GAME   ║
 *       ╚══════════════════╝
 *
 *   K-OS III UNIVERSAL GAME INPUT
 *
 *   The OS targets an 8-button hardware device:
 *     D-PAD  → ArrowUp, ArrowDown, ArrowLeft, ArrowRight
 *     BTN A  → Q       (primary action)
 *     BTN B  → W       (secondary action)
 *     BTN C  → Space   (tertiary / confirm)
 *     BTN D  → Shift   (modifier)
 *     MENU   → Escape  (pause / exit)
 *
 *   Each game defines a KEY_MAP that translates these 8 buttons
 *   (plus Escape) into whatever the game expects internally.
 *   NO other keys reach the game. This ensures every game is
 *   playable on the 8-button device.
 *
 *   Mobile: game viewport is locked to 4:3; remaining space holds
 *   a simple touch D-pad + action buttons.
 */

"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { gameAssetUrl } from "@/lib/assets";

interface GameEntry {
  id: string;
  name: string;
  desc: string;
  src: string;
}

const GAMES: GameEntry[] = [
  // SuperTux omitted from GitHub build (234MB .data file exceeds GitHub limit)
  // Uncomment when running locally with the SuperTux WASM files present:
  // {
  //   id: "supertux",
  //   name: "SUPERTUX",
  //   desc: "OPEN-SOURCE PLATFORMER - WEBASSEMBLY",
  //   src: "/games/supertux/supertux2.html",
  // },
  {
    id: "keen",
    name: "COMMANDER KEEN",
    desc: "INVASION OF THE VORTICONS - WEBASSEMBLY",
    src: "/games/keen/chocolate-keen.html",
  },
];

/*
 * ── PER-GAME KEY MAPS ──
 *
 * Maps K-OS button codes to what the game expects.
 * Only keys listed here (plus D-pad and Escape) will reach the game.
 * Everything else is blocked.
 *
 * Format: { [kosButtonCode]: { key, code, keyCode } }
 *
 * K-OS buttons available to map:
 *   "KeyQ"       → BTN A (primary action)
 *   "KeyW"       → BTN B (secondary action)
 *   "Space"      → BTN C (tertiary / confirm)
 *   "ShiftLeft"  → BTN D (modifier)
 */
interface KeyMapping {
  key: string;
  code: string;
  keyCode: number;
}

const GAME_KEY_MAPS: Record<string, Record<string, KeyMapping>> = {
  // SuperTux: Q=run/action(Ctrl), W=secondary(Alt), Space=jump
  // supertux: {
  //   KeyQ:      { key: "Control", code: "ControlLeft", keyCode: 17 },
  //   KeyW:      { key: "Alt",     code: "AltLeft",     keyCode: 18 },
  // },
  // Commander Keen: Q=jump(Ctrl), W=pogo(Alt), Q+W=fire(Ctrl+Alt), Space=menu select
  keen: {
    KeyQ:      { key: "Control", code: "ControlLeft", keyCode: 17 },
    KeyW:      { key: "Alt",     code: "AltLeft",     keyCode: 18 },
    // Space passes through as Space
  },
};

// Per-game help text for the top bar
const GAME_HELP: Record<string, string> = {
  // supertux: "ARROWS:MOVE  SPACE:JUMP  Q:RUN  W:ACTION  ESC:EXIT",
  keen:     "ARROWS:MOVE  Q:JUMP  W:POGO  SHOOT:FIRE  ESC:EXIT",
};

const DEFAULT_HELP = "ARROWS:MOVE  Q:ACTION  W:ALT  SPACE:CONFIRM  ESC:EXIT";

// D-pad + Space + Escape always pass through (identity-mapped)
const PASSTHROUGH_KEYS = new Set([
  "ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight",
  "Space", "Escape", "Enter",
]);

function dispatchToIframe(
  iframe: HTMLIFrameElement,
  type: "keydown" | "keyup",
  mapped: KeyMapping,
  heldButtons: Set<string>,
  repeat: boolean,
) {
  const canvas = iframe.contentDocument?.querySelector("canvas");
  if (!canvas) return;

  // Compute modifier state from what's currently held (after mapping)
  const init: KeyboardEventInit = {
    key: mapped.key,
    code: mapped.code,
    keyCode: mapped.keyCode,
    which: mapped.keyCode,
    bubbles: true,
    cancelable: true,
    shiftKey: heldButtons.has("Shift"),
    ctrlKey: heldButtons.has("Control") || mapped.key === "Control",
    altKey: heldButtons.has("Alt") || mapped.key === "Alt",
    metaKey: false,
    repeat,
  };

  // On keyup, don't assert the modifier for the key being released
  if (type === "keyup") {
    if (mapped.key === "Control") init.ctrlKey = false;
    if (mapped.key === "Alt") init.altKey = false;
    if (mapped.key === "Shift") init.shiftKey = false;
  }

  canvas.dispatchEvent(new KeyboardEvent(type, init));
}

function dispatchPassthrough(
  iframe: HTMLIFrameElement,
  type: "keydown" | "keyup",
  original: KeyboardEvent,
  heldButtons: Set<string>,
) {
  const canvas = iframe.contentDocument?.querySelector("canvas");
  if (!canvas) return;

  const init: KeyboardEventInit = {
    key: original.key,
    code: original.code,
    keyCode: original.keyCode,
    which: original.which,
    bubbles: true,
    cancelable: true,
    shiftKey: heldButtons.has("Shift"),
    ctrlKey: heldButtons.has("Control"),
    altKey: heldButtons.has("Alt"),
    metaKey: false,
    repeat: original.repeat,
  };

  canvas.dispatchEvent(new KeyboardEvent(type, init));
}

/** Synthetic key event from on-screen buttons */
function makeSyntheticKey(code: string, key: string, keyCode: number): KeyboardEvent {
  return new KeyboardEvent("keydown", {
    key,
    code,
    keyCode,
    which: keyCode,
    bubbles: true,
    cancelable: true,
  });
}

const ARROW_MAP: Record<string, { key: string; code: string; keyCode: number }> = {
  up:    { key: "ArrowUp",    code: "ArrowUp",    keyCode: 38 },
  down:  { key: "ArrowDown",  code: "ArrowDown",  keyCode: 40 },
  left:  { key: "ArrowLeft",  code: "ArrowLeft",  keyCode: 37 },
  right: { key: "ArrowRight", code: "ArrowRight", keyCode: 39 },
};

export function GameMenu() {
  const [cursor, setCursor] = useState(0);
  const [activeGame, setActiveGame] = useState<GameEntry | null>(null);
  const [storageReady, setStorageReady] = useState(false);
  const [showTouchPad, setShowTouchPad] = useState(false);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  // Shared held-modifier state for both keyboard and touch
  const heldMappedRef = useRef<Set<string>>(new Set());

  // Request persistent storage on mount
  useEffect(() => {
    if (navigator.storage?.persist) {
      navigator.storage.persist().then(() => setStorageReady(true));
    } else {
      setStorageReady(true);
    }
  }, []);

  // Show touch pad on coarse pointers / narrow viewports
  useEffect(() => {
    const check = () => {
      const coarse = window.matchMedia("(pointer: coarse)").matches;
      const narrow = window.innerWidth < 900 || window.innerHeight < 700;
      setShowTouchPad(coarse || narrow);
    };
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  // Focus iframe canvas when game starts
  const focusGame = useCallback(() => {
    const iframe = iframeRef.current;
    if (!iframe) return;
    iframe.focus();
    setTimeout(() => {
      const canvas = iframe.contentDocument?.querySelector("canvas");
      if (canvas) {
        (canvas as HTMLCanvasElement).focus();
      }
    }, 100);
  }, []);

  // Input proxy: intercept ALL keys, only forward K-OS buttons to game
  useEffect(() => {
    if (!activeGame) return;

    const keyMap = GAME_KEY_MAPS[activeGame.id] ?? {};
    const heldMapped = heldMappedRef.current;

    const handleKey = (e: KeyboardEvent, type: "keydown" | "keyup") => {
      const iframe = iframeRef.current;
      if (!iframe) return;

      // ESC always exits the game (K-OS level, not sent to game)
      if (e.code === "Escape" && type === "keydown") {
        setActiveGame(null);
        e.preventDefault();
        e.stopPropagation();
        return;
      }

      // Block ALL keys by default — only K-OS buttons get through
      e.preventDefault();
      e.stopPropagation();

      // D-pad and passthrough keys (Space, Enter) → send as-is
      if (PASSTHROUGH_KEYS.has(e.code)) {
        dispatchPassthrough(iframe, type, e, heldMapped);
        return;
      }

      // Action buttons (Q, W, Shift) → look up per-game mapping
      const mapped = keyMap[e.code];
      if (mapped) {
        if (type === "keydown") {
          heldMapped.add(mapped.key);
        } else {
          heldMapped.delete(mapped.key);
        }
        dispatchToIframe(iframe, type, mapped, heldMapped, e.repeat);
        return;
      }

      // Shift without a mapping → track as modifier but don't send
      if (e.code === "ShiftLeft" || e.code === "ShiftRight") {
        if (type === "keydown") {
          heldMapped.add("Shift");
        } else {
          heldMapped.delete("Shift");
        }
        return;
      }

      // Everything else is silently blocked — game never sees it
    };

    const onDown = (e: KeyboardEvent) => handleKey(e, "keydown");
    const onUp = (e: KeyboardEvent) => handleKey(e, "keyup");

    window.addEventListener("keydown", onDown, true);
    window.addEventListener("keyup", onUp, true);

    return () => {
      window.removeEventListener("keydown", onDown, true);
      window.removeEventListener("keyup", onUp, true);
    };
  }, [activeGame]);

  // Touch control helpers — feed same pipeline as keyboard
  const sendArrow = useCallback((dir: keyof typeof ARROW_MAP, type: "keydown" | "keyup") => {
    const iframe = iframeRef.current;
    if (!iframe || !activeGame) return;
    const m = ARROW_MAP[dir];
    const evt = makeSyntheticKey(m.code, m.key, m.keyCode);
    dispatchPassthrough(iframe, type, evt, heldMappedRef.current);
  }, [activeGame]);

  const sendAction = useCallback((kosCode: string, type: "keydown" | "keyup") => {
    const iframe = iframeRef.current;
    if (!iframe || !activeGame) return;
    const keyMap = GAME_KEY_MAPS[activeGame.id] ?? {};
    const heldMapped = heldMappedRef.current;

    if (kosCode === "Space") {
      const evt = makeSyntheticKey("Space", " ", 32);
      dispatchPassthrough(iframe, type, evt, heldMapped);
      return;
    }

    // SHOOT = simultaneous JUMP (Q) + POGO (W) for Keen fire
    if (kosCode === "SHOOT") {
      const q = keyMap["KeyQ"];
      const w = keyMap["KeyW"];
      if (q) {
        if (type === "keydown") heldMapped.add(q.key);
        else heldMapped.delete(q.key);
        dispatchToIframe(iframe, type, q, heldMapped, false);
      }
      if (w) {
        if (type === "keydown") heldMapped.add(w.key);
        else heldMapped.delete(w.key);
        dispatchToIframe(iframe, type, w, heldMapped, false);
      }
      return;
    }

    const mapped = keyMap[kosCode];
    if (mapped) {
      if (type === "keydown") heldMapped.add(mapped.key);
      else heldMapped.delete(mapped.key);
      dispatchToIframe(iframe, type, mapped, heldMapped, false);
    }
  }, [activeGame]);

  // Menu keyboard navigation
  useEffect(() => {
    if (activeGame) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.shiftKey) return;
      if (e.code === "KeyQ") return;

      let handled = true;
      switch (e.key) {
        case "ArrowUp":
          setCursor((c) => Math.max(0, c - 1));
          break;
        case "ArrowDown":
          setCursor((c) => Math.min(GAMES.length - 1, c + 1));
          break;
        case "w":
        case "W":
        case "Enter":
          setActiveGame(GAMES[cursor]);
          break;
        default:
          handled = false;
      }

      if (handled) {
        e.preventDefault();
        e.stopPropagation();
      }
    };

    window.addEventListener("keydown", handleKeyDown, true);
    return () => window.removeEventListener("keydown", handleKeyDown, true);
  }, [cursor, activeGame]);

  // If a game is running, show it with optional mobile touch pad
  if (activeGame) {
    return (
      <div
        className="w-full h-full flex flex-col"
        style={{ backgroundColor: "#000000" }}
      >
        <div
          className="flex items-center justify-between px-2 py-0.5 border-b-2 flex-shrink-0"
          style={{
            borderColor: "#1a1a1a",
            backgroundColor: "#000000",
            minHeight: "20px",
            fontFamily: "var(--dm-font-primary)",
          }}
        >
          <span style={{ fontSize: "9px", color: "#ffffff", letterSpacing: "2px" }}>
            {activeGame.name}
          </span>
          <button
            onClick={() => setActiveGame(null)}
            style={{
              border: "1px solid #555",
              background: "#000",
              color: "#aaa",
              fontFamily: "var(--dm-font-primary)",
              fontSize: "8px",
              letterSpacing: "1px",
              padding: "2px 8px",
              cursor: "pointer",
            }}
          >
            EXIT
          </button>
        </div>

        {/* Game viewport — locked to 4:3, centered */}
        <div
          className="flex-1 min-h-0 flex items-center justify-center"
          style={{ backgroundColor: "#000", position: "relative" }}
        >
          {storageReady ? (
            <div
              style={{
                // 4:3 box that fits inside available space
                width: "min(100%, calc((100% - 0px) * 4 / 3))",
                maxWidth: "100%",
                aspectRatio: "4 / 3",
                maxHeight: "100%",
                position: "relative",
              }}
            >
              <iframe
                ref={iframeRef}
                src={gameAssetUrl(activeGame.src)}
                title={activeGame.name}
                style={{
                  position: "absolute",
                  inset: 0,
                  width: "100%",
                  height: "100%",
                  border: 0,
                  backgroundColor: "#000000",
                }}
                allow="autoplay; gamepad; storage-access"
                onLoad={focusGame}
              />
            </div>
          ) : (
            <span style={{ color: "#555555", fontSize: "9px", letterSpacing: "2px", fontFamily: "var(--dm-font-primary)" }}>
              REQUESTING STORAGE...
            </span>
          )}
        </div>

        {/* Mobile touch control pad */}
        {showTouchPad && (
          <MobileTouchPad
            onArrow={sendArrow}
            onAction={sendAction}
            help={GAME_HELP[activeGame.id] ?? DEFAULT_HELP}
          />
        )}
      </div>
    );
  }

  // Game selection menu
  return (
    <div
      className="w-full h-full flex flex-col overflow-hidden"
      style={{
        backgroundColor: "#000000",
        fontFamily: "var(--dm-font-primary)",
        fontSize: "10px",
        imageRendering: "pixelated",
      }}
    >
      {/* Header */}
      <div
        className="flex items-center justify-between px-2 py-0.5 border-b-2 flex-shrink-0"
        style={{ borderColor: "#1a1a1a", backgroundColor: "#000000", minHeight: "20px" }}
      >
        <span style={{ fontSize: "9px", color: "#ffffff", letterSpacing: "2px" }}>
          GAMES
        </span>
        <span style={{ fontSize: "8px", color: "#555555", letterSpacing: "1px" }}>
          {GAMES.length} TITLE{GAMES.length !== 1 ? "S" : ""}
        </span>
      </div>

      {/* Game list */}
      <div className="flex-1 overflow-y-auto p-2">
        {GAMES.map((game, i) => {
          const isCursor = i === cursor;
          return (
            <div
              key={game.id}
              className="py-2 px-1 cursor-pointer"
              style={{
                backgroundColor: isCursor ? "#0a0a0a" : "transparent",
                borderLeft: isCursor ? "3px solid #ffffff" : "3px solid transparent",
                paddingLeft: "6px",
              }}
              onClick={() => {
                setCursor(i);
                setActiveGame(game);
              }}
            >
              <div
                style={{
                  color: isCursor ? "#ffffff" : "#555555",
                  fontSize: "9px",
                  letterSpacing: "2px",
                }}
              >
                {game.name}
              </div>
              <div
                style={{
                  color: isCursor ? "#888888" : "#333333",
                  fontSize: "8px",
                  letterSpacing: "1px",
                  marginTop: "2px",
                }}
              >
                {game.desc}
              </div>
            </div>
          );
        })}
      </div>

      {/* Bottom bar */}
      <div
        className="flex items-center justify-between px-2 py-1 border-t-2 flex-shrink-0"
        style={{ borderColor: "#1a1a1a", backgroundColor: "#000000", minHeight: "28px" }}
      >
        <span style={{ fontSize: "8px", color: "#555555", letterSpacing: "1px" }}>
          UP/DN:SELECT  W:PLAY  SHIFT+Q+UUDD:EXIT
        </span>
      </div>
    </div>
  );
}

/* ── MOBILE TOUCH PAD ──
 * Matches Datamoshpit TouchController circle style exactly:
 *   .dm-touch-btn-circle + CIRCLE_STYLE / ACTIVE_STYLE
 */

const BTN_SIZE = 48;
const BTN_GAP = 4;

const CIRCLE_STYLE: React.CSSProperties = {
  width: BTN_SIZE,
  height: BTN_SIZE,
  borderWidth: "1px",
  borderStyle: "solid",
  borderColor: "#666666",
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

function MobileTouchPad({
  onArrow,
  onAction,
  help,
}: {
  onArrow: (dir: "up" | "down" | "left" | "right", type: "keydown" | "keyup") => void;
  onAction: (kosCode: string, type: "keydown" | "keyup") => void;
  help: string;
}) {
  const [activeKeys, setActiveKeys] = useState<Set<string>>(new Set());

  const setActive = (id: string, on: boolean) => {
    setActiveKeys((prev) => {
      const next = new Set(prev);
      if (on) next.add(id);
      else next.delete(id);
      return next;
    });
  };

  const bindHold = (
    id: string,
    down: () => void,
    up: () => void,
  ): React.HTMLAttributes<HTMLButtonElement> => ({
    onPointerDown: (e) => {
      e.preventDefault();
      (e.currentTarget as HTMLElement).setPointerCapture?.(e.pointerId);
      setActive(id, true);
      down();
    },
    onPointerUp: (e) => {
      e.preventDefault();
      setActive(id, false);
      up();
    },
    onPointerCancel: (e) => {
      e.preventDefault();
      setActive(id, false);
      up();
    },
    onContextMenu: (e) => e.preventDefault(),
  });

  const styleFor = (id: string): React.CSSProperties =>
    activeKeys.has(id) ? ACTIVE_STYLE : CIRCLE_STYLE;

  return (
    <div
      className="dm-touch-controller flex-shrink-0 border-t-2"
      style={{
        borderColor: "#1a1a1a",
        backgroundColor: "#000000",
        padding: "10px 12px",
        paddingBottom: "max(12px, env(safe-area-inset-bottom))",
        fontFamily: "var(--dm-font-primary)",
      }}
    >
      <div style={{ fontSize: 7, color: "#555", letterSpacing: 1, marginBottom: 8, textAlign: "center" }}>
        {help}
      </div>

      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          gap: 16,
          maxWidth: 420,
          margin: "0 auto",
        }}
      >
        {/* D-pad — circular, Datamoshpit style */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: `${BTN_SIZE}px ${BTN_SIZE}px ${BTN_SIZE}px`,
            gridTemplateRows: `${BTN_SIZE}px ${BTN_SIZE}px ${BTN_SIZE}px`,
            gap: BTN_GAP,
          }}
        >
          <div />
          <button
            type="button"
            className="dm-touch-btn-circle"
            style={styleFor("up")}
            {...bindHold(
              "up",
              () => onArrow("up", "keydown"),
              () => onArrow("up", "keyup"),
            )}
          >
            UP
          </button>
          <div />
          <button
            type="button"
            className="dm-touch-btn-circle"
            style={styleFor("left")}
            {...bindHold(
              "left",
              () => onArrow("left", "keydown"),
              () => onArrow("left", "keyup"),
            )}
          >
            LT
          </button>
          <div />
          <button
            type="button"
            className="dm-touch-btn-circle"
            style={styleFor("right")}
            {...bindHold(
              "right",
              () => onArrow("right", "keydown"),
              () => onArrow("right", "keyup"),
            )}
          >
            RT
          </button>
          <div />
          <button
            type="button"
            className="dm-touch-btn-circle"
            style={styleFor("down")}
            {...bindHold(
              "down",
              () => onArrow("down", "keydown"),
              () => onArrow("down", "keyup"),
            )}
          >
            DN
          </button>
          <div />
        </div>

        {/* Action buttons: JUMP, POGO, SHOOT, SPACE */}
        <div style={{ display: "flex", flexDirection: "column", gap: 8, alignItems: "flex-end" }}>
          <div style={{ display: "flex", gap: 8 }}>
            <button
              type="button"
              className="dm-touch-btn-circle"
              style={styleFor("jump")}
              {...bindHold(
                "jump",
                () => onAction("KeyQ", "keydown"),
                () => onAction("KeyQ", "keyup"),
              )}
            >
              JUMP
            </button>
            <button
              type="button"
              className="dm-touch-btn-circle"
              style={styleFor("pogo")}
              {...bindHold(
                "pogo",
                () => onAction("KeyW", "keydown"),
                () => onAction("KeyW", "keyup"),
              )}
            >
              POGO
            </button>
          </div>
          <button
            type="button"
            className="dm-touch-btn-circle"
            style={{ ...styleFor("shoot"), width: BTN_SIZE * 2 + BTN_GAP, borderRadius: 0 }}
            {...bindHold(
              "shoot",
              () => onAction("SHOOT", "keydown"),
              () => onAction("SHOOT", "keyup"),
            )}
          >
            SHOOT
          </button>
          <button
            type="button"
            className="dm-touch-btn-circle"
            style={{ ...styleFor("space"), width: BTN_SIZE * 2 + BTN_GAP, borderRadius: 0 }}
            {...bindHold(
              "space",
              () => onAction("Space", "keydown"),
              () => onAction("Space", "keyup"),
            )}
          >
            SPACE
          </button>
        </div>
      </div>
    </div>
  );
}
