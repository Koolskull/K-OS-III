/*
 *                    ☦
 *            ╔══════════════════╗
 *            ║  K-OS III        ║
 *            ║  DESKTOP         ║
 *            ╚══════════════════╝
 *
 *   Desktop with icon grid. Double-click to launch apps.
 *   Classic Win98 layout: icons flow top-left, down then right.
 */

"use client";

import React, { useState, useCallback } from "react";

interface DesktopProps {
  onLaunchApp: (appId: string) => void;
}

interface DesktopIcon {
  id: string;
  label: string;
  glyph: string;
}

const ICONS: DesktopIcon[] = [
  { id: "bible", label: "HOLY BIBLE", glyph: "✝" },
  { id: "datamoshpit", label: "DATAMOSHPIT", glyph: "☦" },
  { id: "kooldraw", label: "SPRITE EDITOR", glyph: "◻" },
  { id: "games", label: "GAMES", glyph: ">" },
  { id: "manual", label: "MANUAL", glyph: "?" },
  // { id: "picotracker", label: "PICOTRACKER", glyph: "♫" },
];

export function Desktop({ onLaunchApp }: DesktopProps) {
  const [selectedIcon, setSelectedIcon] = useState<string | null>(null);
  const lastClickRef = React.useRef<{ id: string; time: number } | null>(null);

  const handleIconClick = useCallback((id: string) => {
    const now = Date.now();
    const last = lastClickRef.current;

    if (last && last.id === id && now - last.time < 400) {
      // Double-click: launch
      onLaunchApp(id);
      lastClickRef.current = null;
    } else {
      // Single click: select
      setSelectedIcon(id);
      lastClickRef.current = { id, time: now };
    }
  }, [onLaunchApp]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === "Enter" && selectedIcon) {
      onLaunchApp(selectedIcon);
    }
  }, [selectedIcon, onLaunchApp]);

  return (
    <div
      className="absolute inset-0"
      style={{
        backgroundColor: "#000000",
        backgroundImage: "radial-gradient(circle at 50% 50%, #0a0a0a 0%, #000000 100%)",
      }}
      tabIndex={0}
      onKeyDown={handleKeyDown}
    >
      {/* Icon grid */}
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          flexWrap: "wrap",
          alignContent: "flex-start",
          gap: "8px",
          padding: "16px",
          height: "calc(100% - 40px)",
        }}
      >
        {ICONS.map((icon) => {
          const isSelected = selectedIcon === icon.id;
          return (
            <div
              key={icon.id}
              onClick={() => handleIconClick(icon.id)}
              style={{
                width: "80px",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: "4px",
                padding: "8px 4px",
                cursor: "pointer",
                backgroundColor: isSelected ? "rgba(255,255,255,0.1)" : "transparent",
                border: isSelected ? "1px solid #555555" : "1px solid transparent",
                userSelect: "none",
              }}
            >
              {/* Icon glyph */}
              <div
                style={{
                  width: "48px",
                  height: "48px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "28px",
                  color: "#ffffff",
                  imageRendering: "pixelated",
                }}
              >
                {icon.glyph}
              </div>
              {/* Label */}
              <span
                style={{
                  fontFamily: "var(--dm-font-primary)",
                  fontSize: "8px",
                  color: "#ffffff",
                  letterSpacing: "1px",
                  textAlign: "center",
                  wordBreak: "break-all",
                  lineHeight: "1.3",
                }}
              >
                {icon.label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
