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

const TASKBAR_H = 36;

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
        height: `${TASKBAR_H}px`,
        backgroundColor: "#0a0a0a",
        borderTop: "2px solid #333333",
        display: "flex",
        alignItems: "center",
        padding: "0 4px",
        gap: "4px",
        zIndex: 99999,
        fontFamily: "var(--dm-font-primary)",
        fontSize: "9px",
        imageRendering: "pixelated",
      }}
    >
      {/* Start button */}
      <button
        onClick={onShowDesktop}
        style={{
          height: "28px",
          padding: "0 8px",
          border: "2px solid #555555",
          backgroundColor: "#000000",
          color: "#ffffff",
          fontFamily: "var(--dm-font-primary)",
          fontSize: "9px",
          letterSpacing: "1px",
          cursor: "pointer",
          flexShrink: 0,
        }}
      >
        ☦ K-OS
      </button>

      {/* Divider */}
      <div style={{ width: "2px", height: "24px", backgroundColor: "#333333", flexShrink: 0 }} />

      {/* Window buttons */}
      <div style={{ flex: 1, display: "flex", gap: "2px", overflow: "hidden" }}>
        {windows.map((win) => {
          const isActive = win.id === focusedId && !win.isMinimized;
          return (
            <button
              key={win.id}
              onClick={() => onWindowClick(win.id)}
              style={{
                height: "28px",
                padding: "0 8px",
                border: `2px solid ${isActive ? "#ffffff" : "#333333"}`,
                backgroundColor: isActive ? "#1a1a1a" : "#000000",
                color: isActive ? "#ffffff" : "#888888",
                fontFamily: "var(--dm-font-primary)",
                fontSize: "8px",
                letterSpacing: "1px",
                cursor: "pointer",
                minWidth: "80px",
                maxWidth: "160px",
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
      <div style={{ width: "2px", height: "24px", backgroundColor: "#333333", flexShrink: 0 }} />

      {/* Clock */}
      <div
        style={{
          height: "28px",
          padding: "0 8px",
          border: "1px solid #333333",
          backgroundColor: "#000000",
          color: "#888888",
          fontFamily: "var(--dm-font-primary)",
          fontSize: "9px",
          letterSpacing: "2px",
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
