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
 *   When adding a new game:
 *   1. Add a GameEntry to GAMES[]
 *   2. Add a GAME_KEY_MAPS[id] mapping from K-OS buttons to game keys
 *   3. Add a GAME_HELP[id] string describing the controls
 */

"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";

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
  keen:     "ARROWS:MOVE  Q:JUMP  W:POGO  Q+W:FIRE  ESC:EXIT",
};

const DEFAULT_HELP = "ARROWS:MOVE  Q:ACTION  W:ALT  SPACE:CONFIRM  ESC:EXIT";

// D-pad + Space + Escape always pass through (identity-mapped)
const PASSTHROUGH_KEYS = new Set([
  "ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight",
  "Space", "Escape", "Enter",
]);

// Track which K-OS action buttons are held for modifier state
const KOS_ACTION_BUTTONS = new Set(["KeyQ", "KeyW", "ShiftLeft", "ShiftRight"]);

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

export function GameMenu() {
  const [cursor, setCursor] = useState(0);
  const [activeGame, setActiveGame] = useState<GameEntry | null>(null);
  const [storageReady, setStorageReady] = useState(false);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  // Request persistent storage on mount
  useEffect(() => {
    if (navigator.storage?.persist) {
      navigator.storage.persist().then(() => setStorageReady(true));
    } else {
      setStorageReady(true);
    }
  }, []);

  // Focus iframe canvas when game starts
  const focusGame = useCallback(() => {
    const iframe = iframeRef.current;
    if (!iframe) return;
    iframe.focus();
    // Also try to focus the canvas inside
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
    // Track which mapped keys are currently held (by their mapped key name)
    const heldMapped = new Set<string>();

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

  // If a game is running, show it fullscreen in an iframe
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
          <span style={{ fontSize: "7px", color: "#333333", letterSpacing: "1px" }}>
            {GAME_HELP[activeGame.id] ?? DEFAULT_HELP}
          </span>
        </div>
        {storageReady ? (
          <iframe
            ref={iframeRef}
            src={activeGame.src}
            className="flex-1 w-full border-0"
            style={{ backgroundColor: "#000000" }}
            allow="autoplay; gamepad; storage-access"
            onLoad={focusGame}
          />
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <span style={{ color: "#555555", fontSize: "9px", letterSpacing: "2px", fontFamily: "var(--dm-font-primary)" }}>
              REQUESTING STORAGE...
            </span>
          </div>
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
