/*
 *                    ☦
 *            ╔══════════════════╗
 *            ║  K-OS III        ║
 *            ║  TASKBAR         ║
 *            ╚══════════════════╝
 *
 *   Bottom bar: start button, window buttons, clock.
 */

"use client";

import React, { useState, useEffect } from "react";

interface TaskbarWindow {
  id: string;
  title: string;
  isMinimized: boolean;
}

interface TaskbarProps {
  windows: TaskbarWindow[];
  focusedId: string | null;
  onWindowClick: (id: string) => void;
  onShowDesktop: () => void;
}

export function Taskbar({ windows, focusedId, onWindowClick, onShowDesktop }: TaskbarProps) {
  const [time, setTime] = useState("");

  useEffect(() => {
    const update = () => {
      const now = new Date();
      const h = now.getHours().toString().padStart(2, "0");
      const m = now.getMinutes().toString().padStart(2, "0");
      const s = now.getSeconds().toString().padStart(2, "0");
      setTime(`${h}:${m}:${s}`);
    };
    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div
      style={{
        position: "absolute",
        bottom: 0,
        left: 0,
        right: 0,
        height: "var(--dm-taskbar-h, 32px)",
        backgroundColor: "#0a0a0a",
        borderTop: "1px solid #333333",
        display: "flex",
        alignItems: "center",
        padding: "0 var(--dm-ui-pad, 4px)",
        gap: "var(--dm-ui-gap, 4px)",
        zIndex: 99999,
        fontFamily: "var(--dm-font-primary)",
        fontSize: "var(--dm-ui-font-sm, 8px)",
        imageRendering: "pixelated",
      }}
    >
      {/* Start button */}
      <button
        onClick={onShowDesktop}
        style={{
          height: "var(--dm-ui-btn-h, 22px)",
          padding: "0 8px",
          border: "1px solid #555555",
          backgroundColor: "#000000",
          color: "#ffffff",
          fontFamily: "var(--dm-font-primary)",
          fontSize: "var(--dm-ui-font-sm, 8px)",
          letterSpacing: "1px",
          cursor: "pointer",
          flexShrink: 0,
        }}
      >
        ☦ K-OS
      </button>

      {/* BETA badge — visible reminder this is a 0.2.0-beta.1 build */}
      <span
        title="K-OS III 0.2.0-beta.1 — early beta. Expect rough edges."
        style={{
          fontFamily: "var(--dm-font-primary)",
          fontSize: "var(--dm-ui-font-xs, 7px)",
          color: "#000000",
          backgroundColor: "#ffff00",
          padding: "1px 4px",
          marginLeft: "4px",
          letterSpacing: "1px",
          flexShrink: 0,
          imageRendering: "pixelated",
          border: "1px solid #000000",
        }}
      >
        BETA
      </span>

      {/* Divider */}
      <div style={{ width: "1px", height: "var(--dm-ui-btn-h, 22px)", backgroundColor: "#333333", flexShrink: 0 }} />

      {/* Window buttons */}
      <div style={{ flex: 1, display: "flex", gap: "2px", overflow: "hidden" }}>
        {windows.map((win) => {
          const isActive = win.id === focusedId && !win.isMinimized;
          return (
            <button
              key={win.id}
              onClick={() => onWindowClick(win.id)}
              style={{
                height: "var(--dm-ui-btn-h, 22px)",
                padding: "0 6px",
                border: `1px solid ${isActive ? "#ffffff" : "#333333"}`,
                backgroundColor: isActive ? "#1a1a1a" : "#000000",
                color: isActive ? "#ffffff" : "#888888",
                fontFamily: "var(--dm-font-primary)",
                fontSize: "var(--dm-ui-font-xs, 7px)",
                letterSpacing: "1px",
                cursor: "pointer",
                minWidth: "64px",
                maxWidth: "140px",
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
                textAlign: "left",
              }}
            >
              {win.title}
            </button>
          );
        })}
      </div>

      {/* Divider */}
      <div style={{ width: "1px", height: "var(--dm-ui-btn-h, 22px)", backgroundColor: "#333333", flexShrink: 0 }} />

      {/* Clock */}
      <div
        style={{
          height: "var(--dm-ui-btn-h, 22px)",
          padding: "0 6px",
          border: "1px solid #333333",
          backgroundColor: "#000000",
          color: "#888888",
          fontFamily: "var(--dm-font-primary)",
          fontSize: "var(--dm-ui-font-sm, 8px)",
          letterSpacing: "1px",
          display: "flex",
          alignItems: "center",
          flexShrink: 0,
        }}
      >
        {time}
      </div>
    </div>
  );
}
