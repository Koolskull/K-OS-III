/*
 *       ╔══════════════════╗
 *       ║  ARCADE CABINET  ║
 *       ║  ──────────────  ║
 *       ║  SELECT A GAME   ║
 *       ╚══════════════════╝
 *
 *   K-OS III UNIVERSAL GAME INPUT
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
  {
    id: "keen",
    name: "COMMANDER KEEN",
    desc: "INVASION OF THE VORTICONS - WEBASSEMBLY",
    src: "/games/keen/chocolate-keen.html",
  },
  {
    id: "genesis",
    name: "MEGA DRIVE",
    desc: "SEGA GENESIS / MD – PICODRIVE (LIGHT)",
    src: "/games/genesis/index.html",
  },
];

interface KeyMapping {
  key: string;
  code: string;
  keyCode: number;
}

const GAME_KEY_MAPS: Record<string, Record<string, KeyMapping>> = {
  keen: {
    KeyQ: { key: "Control", code: "ControlLeft", keyCode: 17 },
    KeyW: { key: "Alt", code: "AltLeft", keyCode: 18 },
  },
  // Genesis / PicoDrive uses standard arrows + Z/X/A/S etc.
  // Passthrough is fine for now; EmulatorJS handles its own input.
};

const GAME_HELP: Record<string, string> = {
  keen: "ARROWS:MOVE  Q:JUMP  W:POGO  SHOOT:FIRE  ESC:EXIT",
  genesis: "ARROWS:MOVE  Z/X/A/S:BUTTONS  ESC:EXIT",
};

const DEFAULT_HELP = "ARROWS:MOVE  Q:ACTION  W:ALT  SPACE:CONFIRM  ESC:EXIT";

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

function makeSyntheticKey(code: string, key: string, keyCode: number): KeyboardEvent {
  return new KeyboardEvent("keydown", {
    key, code, keyCode, which: keyCode, bubbles: true, cancelable: true,
  });
}

const ARROW_MAP: Record<string, { key: string; code: string; keyCode: number }> = {
  up: { key: "ArrowUp", code: "ArrowUp", keyCode: 38 },
  down: { key: "ArrowDown", code: "ArrowDown", keyCode: 40 },
  left: { key: "ArrowLeft", code: "ArrowLeft", keyCode: 37 },
  right: { key: "ArrowRight", code: "ArrowRight", keyCode: 39 },
};

export function GameMenu() {
  const [cursor, setCursor] = useState(0);
  const [activeGame, setActiveGame] = useState<GameEntry | null>(null);
  const [storageReady, setStorageReady] = useState(false);
  const [showTouchPad, setShowTouchPad] = useState(false);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const heldMappedRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    if (navigator.storage?.persist) {
      navigator.storage.persist().then(() => setStorageReady(true));
    } else {
      setStorageReady(true);
    }
  }, []);

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

  const focusGame = useCallback(() => {
    const iframe = iframeRef.current;
    if (!iframe) return;
    iframe.focus();
    setTimeout(() => {
      const canvas = iframe.contentDocument?.querySelector("canvas");
      if (canvas) (canvas as HTMLCanvasElement).focus();
    }, 100);
  }, []);

  useEffect(() => {
    if (!activeGame) return;
    const keyMap = GAME_KEY_MAPS[activeGame.id] ?? {};
    const heldMapped = heldMappedRef.current;

    const handleKey = (e: KeyboardEvent, type: "keydown" | "keyup") => {
      const iframe = iframeRef.current;
      if (!iframe) return;

      if (e.code === "Escape" && type === "keydown") {
        setActiveGame(null);
        e.preventDefault();
        e.stopPropagation();
        return;
      }

      e.preventDefault();
      e.stopPropagation();

      if (PASSTHROUGH_KEYS.has(e.code)) {
        dispatchPassthrough(iframe, type, e, heldMapped);
        return;
      }

      const mapped = keyMap[e.code];
      if (mapped) {
        if (type === "keydown") heldMapped.add(mapped.key);
        else heldMapped.delete(mapped.key);
        dispatchToIframe(iframe, type, mapped, heldMapped, e.repeat);
        return;
      }

      if (e.code === "ShiftLeft" || e.code === "ShiftRight") {
        if (type === "keydown") heldMapped.add("Shift");
        else heldMapped.delete("Shift");
      }
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

    if (kosCode === "SHOOT") {
      const q = keyMap["KeyQ"];
      const w = keyMap["KeyW"];
      if (q) {
        if (type === "keydown") heldMapped.add(q.key); else heldMapped.delete(q.key);
        dispatchToIframe(iframe, type, q, heldMapped, false);
      }
      if (w) {
        if (type === "keydown") heldMapped.add(w.key); else heldMapped.delete(w.key);
        dispatchToIframe(iframe, type, w, heldMapped, false);
      }
      return;
    }

    const mapped = keyMap[kosCode];
    if (mapped) {
      if (type === "keydown") heldMapped.add(mapped.key); else heldMapped.delete(mapped.key);
      dispatchToIframe(iframe, type, mapped, heldMapped, false);
    }
  }, [activeGame]);

  useEffect(() => {
    if (activeGame) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.shiftKey) return;
      if (e.code === "KeyQ") return;
      let handled = true;
      switch (e.key) {
        case "ArrowUp": setCursor(c => Math.max(0, c - 1)); break;
        case "ArrowDown": setCursor(c => Math.min(GAMES.length - 1, c + 1)); break;
        case "w": case "W": case "Enter": setActiveGame(GAMES[cursor]); break;
        default: handled = false;
      }
      if (handled) { e.preventDefault(); e.stopPropagation(); }
    };
    window.addEventListener("keydown", handleKeyDown, true);
    return () => window.removeEventListener("keydown", handleKeyDown, true);
  }, [cursor, activeGame]);

  if (activeGame) {
    return (
      <div className="w-full h-full flex flex-col" style={{ backgroundColor: "#000000" }}>
        <div className="flex items-center justify-between px-2 py-0.5 border-b-2 flex-shrink-0" style={{ borderColor: "#1a1a1a", backgroundColor: "#000000", minHeight: "20px", fontFamily: "var(--dm-font-primary)" }}>
          <span style={{ fontSize: "9px", color: "#ffffff", letterSpacing: "2px" }}>{activeGame.name}</span>
          <button onClick={() => setActiveGame(null)} style={{ border: "1px solid #555", background: "#000", color: "#aaa", fontFamily: "var(--dm-font-primary)", fontSize: "8px", letterSpacing: "1px", padding: "2px 8px", cursor: "pointer" }}>EXIT</button>
        </div>
        <div className="flex-1 min-h-0 flex items-center justify-center" style={{ backgroundColor: "#000", position: "relative" }}>
          {storageReady ? (
            <div style={{ width: "min(100%, calc((100% - 0px) * 4 / 3))", maxWidth: "100%", aspectRatio: "4 / 3", maxHeight: "100%", position: "relative" }}>
              <iframe
                ref={iframeRef}
                src={gameAssetUrl(activeGame.src)}
                title={activeGame.name}
                style={{ position: "absolute", inset: 0, width: "100%", height: "100%", border: 0, backgroundColor: "#000000" }}
                allow="autoplay; gamepad; storage-access"
                onLoad={focusGame}
              />
            </div>
          ) : (
            <span style={{ color: "#555555", fontSize: "9px", letterSpacing: "2px", fontFamily: "var(--dm-font-primary)" }}>REQUESTING STORAGE...</span>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-full flex flex-col overflow-hidden" style={{ backgroundColor: "#000000", fontFamily: "var(--dm-font-primary)", fontSize: "10px", imageRendering: "pixelated" }}>
      <div className="flex items-center justify-between px-2 py-0.5 border-b-2 flex-shrink-0" style={{ borderColor: "#1a1a1a", backgroundColor: "#000000", minHeight: "20px" }}>
        <span style={{ fontSize: "9px", color: "#ffffff", letterSpacing: "2px" }}>GAMES</span>
        <span style={{ fontSize: "8px", color: "#555555", letterSpacing: "1px" }}>{GAMES.length} TITLE{GAMES.length !== 1 ? "S" : ""}</span>
      </div>
      <div className="flex-1 overflow-y-auto p-2">
        {GAMES.map((game, i) => {
          const isCursor = i === cursor;
          return (
            <div key={game.id} className="py-2 px-1 cursor-pointer" style={{ backgroundColor: isCursor ? "#0a0a0a" : "transparent", borderLeft: isCursor ? "3px solid #ffffff" : "3px solid transparent", paddingLeft: "6px" }} onClick={() => { setCursor(i); setActiveGame(game); }}>
              <div style={{ color: isCursor ? "#ffffff" : "#555555", fontSize: "9px", letterSpacing: "2px" }}>{game.name}</div>
              <div style={{ color: isCursor ? "#888888" : "#333333", fontSize: "8px", letterSpacing: "1px", marginTop: "2px" }}>{game.desc}</div>
            </div>
          );
        })}
      </div>
      <div className="flex items-center justify-between px-2 py-1 border-t-2 flex-shrink-0" style={{ borderColor: "#1a1a1a", backgroundColor: "#000000", minHeight: "28px" }}>
        <span style={{ fontSize: "8px", color: "#555555", letterSpacing: "1px" }}>UP/DN:SELECT  W:PLAY  ESC:EXIT</span>
      </div>
    </div>
  );
}
