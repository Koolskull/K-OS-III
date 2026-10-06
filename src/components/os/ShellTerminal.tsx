/*
 *                    ☦
 *            ╔══════════════════╗
 *            ║  K-OS III        ║
 *            ║  SHELL           ║
 *            ╚══════════════════╝
 *
 *   SHIFT+T opens this panel in the lower left.
 *   Type an app name to open it. Missing packages ask
 *   before they install. Equations print their result.
 */

"use client";

import React, { useEffect, useRef, useState } from "react";
import { appById } from "@/lib/os/shell/catalog";
import {
  formatAppList,
  HELP_TEXT,
  installFrames,
  interpret,
  type ShellAction,
} from "@/lib/os/shell/interpret";

interface ShellTerminalProps {
  installedIds: readonly string[];
  onLaunchApp: (appId: string) => void;
  onInstall: (appId: string) => void;
}

interface Entry {
  id: number;
  text: string;
}

interface PendingAsk {
  appId: string | null;
  label: string;
}

const GREETING = ["K-OS SHELL", "SHIFT+T CLOSES", "TYPE HELP"].join("\n");

function typingTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  if (target.isContentEditable) return true;
  const tag = target.tagName;
  if (tag === "TEXTAREA" || tag === "SELECT") return true;
  if (tag === "INPUT") {
    const type = (target as HTMLInputElement).type;
    return !["button", "checkbox", "radio", "range", "color", "file", "submit", "reset"].includes(type);
  }
  return false;
}

function isShellToggle(event: KeyboardEvent): boolean {
  return event.shiftKey && !event.ctrlKey && !event.metaKey && !event.altKey && (event.key === "T" || event.key === "t");
}

export function ShellTerminal({ installedIds, onLaunchApp, onInstall }: ShellTerminalProps) {
  const [open, setOpen] = useState(false);
  const [entries, setEntries] = useState<Entry[]>([{ id: 1, text: GREETING }]);
  const [draft, setDraft] = useState("");
  const [blink, setBlink] = useState(true);

  const openRef = useRef(false);
  const draftRef = useRef("");
  const installedRef = useRef(installedIds);
  const launchRef = useRef(onLaunchApp);
  const installRef = useRef(onInstall);
  const pendingRef = useRef<PendingAsk | null>(null);
  const installingRef = useRef(false);
  const tokenRef = useRef(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const idRef = useRef(1);
  const historyRef = useRef<string[]>([]);
  const histIndex = useRef(0);
  const scrollerRef = useRef<HTMLDivElement>(null);
  const submitRef = useRef<(line: string) => void>(() => {});
  const abortRef = useRef<() => void>(() => {});

  openRef.current = open;
  installedRef.current = installedIds;
  launchRef.current = onLaunchApp;
  installRef.current = onInstall;

  const push = (text: string) => {
    idRef.current += 1;
    const id = idRef.current;
    setEntries((prev) => [...prev, { id, text }].slice(-200));
    return id;
  };

  const replace = (id: number, text: string) => {
    setEntries((prev) => prev.map((entry) => (entry.id === id ? { ...entry, text } : entry)));
  };

  const setDraftBoth = (value: string) => {
    draftRef.current = value;
    setDraft(value);
  };

  const stopTimer = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  };

  abortRef.current = () => {
    if (!installingRef.current) return;
    tokenRef.current += 1;
    stopTimer();
    installingRef.current = false;
    pendingRef.current = null;
    push("INSTALL ABORTED");
  };

  const startInstall = (appId: string | null, label: string) => {
    stopTimer();
    tokenRef.current += 1;
    const token = tokenRef.current;
    installingRef.current = true;
    const frames = installFrames(label);
    const entryId = push(frames[0]);
    let frame = 0;
    timerRef.current = setInterval(() => {
      if (tokenRef.current !== token) return;
      frame += 1;
      if (frame >= frames.length) {
        stopTimer();
        installingRef.current = false;
        if (appId) {
          installRef.current(appId);
          const title = appById(appId)?.title ?? label;
          push("INSTALLED");
          push(label);
          push(`OPENING ${title}`);
          launchRef.current(appId);
        } else {
          push("DEPOT HAS NO PACKAGE");
          push(label);
        }
        return;
      }
      replace(entryId, frames[frame]);
    }, 120);
  };

  const apply = (action: ShellAction) => {
    switch (action.kind) {
      case "empty":
        return;
      case "help":
        push(HELP_TEXT);
        return;
      case "clear":
        idRef.current = 1;
        pendingRef.current = null;
        setEntries([{ id: 1, text: GREETING }]);
        return;
      case "exit":
        setOpen(false);
        return;
      case "list":
        push(formatAppList(new Set(installedRef.current), "installed"));
        return;
      case "depot":
        push(formatAppList(new Set(installedRef.current), "depot"));
        return;
      case "math":
        push(action.value);
        return;
      case "bad-math":
        push("CANNOT EVALUATE");
        return;
      case "launch":
        push(`OPENING ${action.title}`);
        launchRef.current(action.appId);
        return;
      case "already":
        push(`${action.title} IS ALREADY INSTALLED.`);
        push(`OPENING ${action.title}`);
        launchRef.current(action.appId);
        return;
      case "ask":
        pendingRef.current = { appId: action.appId, label: action.label };
        push(`${action.label} IS NOT INSTALLED.`);
        push("INSTALL IT? [Y/N]");
        return;
      case "begin":
        pendingRef.current = null;
        startInstall(action.appId, action.label);
        return;
      case "install-usage":
        push("INSTALL <NAME>");
        return;
      case "open-usage":
        push("OPEN <NAME>");
        return;
      case "yes": {
        const pending = pendingRef.current;
        pendingRef.current = null;
        if (!pending) return;
        startInstall(pending.appId, pending.label);
        return;
      }
      case "no":
        pendingRef.current = null;
        push("INSTALL CANCELLED");
        return;
      case "need-yn":
        push("Y OR N");
        return;
      default:
        return;
    }
  };

  submitRef.current = (line: string) => {
    const echo = line;
    if (echo.trim()) {
      const history = historyRef.current;
      if (history[history.length - 1] !== echo) history.push(echo);
      if (history.length > 50) history.shift();
    }
    histIndex.current = historyRef.current.length;
    push(`> ${echo}`);
    apply(interpret(echo, new Set(installedRef.current), pendingRef.current !== null));
  };

  useEffect(() => {
    const blinkTimer = setInterval(() => setBlink((on) => !on), 530);
    return () => clearInterval(blinkTimer);
  }, []);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.isComposing) return;
      if (isShellToggle(event)) {
        if (event.repeat) {
          event.preventDefault();
          event.stopImmediatePropagation();
          return;
        }
        if (!openRef.current && typingTarget(event.target)) return;
        event.preventDefault();
        event.stopImmediatePropagation();
        if (openRef.current && installingRef.current) abortRef.current();
        openRef.current = !openRef.current;
        setOpen(openRef.current);
        return;
      }
      if (!openRef.current) return;
      if (event.ctrlKey || event.metaKey || event.altKey) {
        event.stopImmediatePropagation();
        return;
      }
      event.preventDefault();
      event.stopImmediatePropagation();
      if (installingRef.current) {
        if (event.key === "Escape") abortRef.current();
        return;
      }
      if (event.key === "Enter") {
        const line = draftRef.current;
        setDraftBoth("");
        submitRef.current(line);
        return;
      }
      if (event.key === "Backspace") {
        setDraftBoth(draftRef.current.slice(0, -1));
        return;
      }
      if (event.key === "Escape") {
        setOpen(false);
        return;
      }
      if (event.key === "ArrowUp") {
        const history = historyRef.current;
        if (history.length === 0) return;
        const index = histIndex.current >= history.length ? history.length - 1 : Math.max(0, histIndex.current - 1);
        histIndex.current = index;
        setDraftBoth(history[index] ?? "");
        return;
      }
      if (event.key === "ArrowDown") {
        const history = historyRef.current;
        if (histIndex.current >= history.length - 1) {
          histIndex.current = history.length;
          setDraftBoth("");
          return;
        }
        histIndex.current += 1;
        setDraftBoth(history[histIndex.current] ?? "");
        return;
      }
      if (event.key.length === 1 && draftRef.current.length < 120) {
        setDraftBoth(draftRef.current + event.key);
      }
    };

    const onPaste = (event: ClipboardEvent) => {
      if (!openRef.current || installingRef.current) return;
      const text = event.clipboardData?.getData("text") ?? "";
      if (!text) return;
      event.preventDefault();
      event.stopImmediatePropagation();
      const next = (draftRef.current + text.replace(/[\r\n]+/g, " ")).slice(0, 120);
      setDraftBoth(next);
    };

    window.addEventListener("keydown", onKey, true);
    window.addEventListener("paste", onPaste, true);
    return () => {
      window.removeEventListener("keydown", onKey, true);
      window.removeEventListener("paste", onPaste, true);
      stopTimer();
    };
  }, []);

  useEffect(() => {
    const el = scrollerRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [entries, draft, open]);

  return (
    <div
      role="dialog"
      aria-label="K-OS shell"
      aria-hidden={!open}
      style={{
        display: open ? "flex" : "none",
        position: "absolute",
        left: "8px",
        bottom: "calc(var(--dm-taskbar-h, 32px) + 8px)",
        width: "min(480px, calc(100% - 16px))",
        height: "min(300px, calc(100% - var(--dm-taskbar-h, 32px) - 24px))",
        zIndex: 100000,
        flexDirection: "column",
        backgroundColor: "#000000",
        color: "#ffffff",
        border: "1px solid #ffffff",
        fontFamily: "'courier-pixel', 'Courier New', monospace",
        fontSize: "12px",
        lineHeight: 1.35,
        imageRendering: "pixelated",
        WebkitFontSmoothing: "none",
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          gap: "8px",
          padding: "4px 8px",
          borderBottom: "1px solid #333333",
          color: "#888888",
          letterSpacing: "1px",
          flexShrink: 0,
        }}
      >
        <span>K-OS SHELL</span>
        <span>SHIFT+T</span>
      </div>
      <div
        ref={scrollerRef}
        style={{
          flex: 1,
          overflow: "auto",
          padding: "8px",
          whiteSpace: "pre-wrap",
          overflowWrap: "anywhere",
        }}
      >
        {entries.map((entry) => (
          <div key={entry.id}>{entry.text}</div>
        ))}
      </div>
      <div
        style={{
          flexShrink: 0,
          padding: "4px 8px",
          borderTop: "1px solid #333333",
          whiteSpace: "pre-wrap",
          overflowWrap: "anywhere",
        }}
      >
        {"> "}
        {draft}
        <span
          style={{
            display: "inline-block",
            width: "8px",
            height: "12px",
            verticalAlign: "text-bottom",
            backgroundColor: blink ? "#ffffff" : "transparent",
          }}
        />
      </div>
    </div>
  );
}
