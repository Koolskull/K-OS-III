/*
 *                    ☦
 *            ╔═══════════════════╗
 *            ║  K-OS III        ║
 *            ║  DESKTOP         ║
 *            ╚═══════════════════╝
 *
 *   Icons = core ∪ installs (App Manager). Double-click to launch.
 */

"use client";

import React, { useCallback, useEffect, useState } from "react";
import {
  desktopPackages,
  loadInstallState,
  subscribeInstalls,
  type InstallStoreState,
} from "@/lib/apps/installStore";

interface DesktopProps {
  onLaunchApp: (appId: string) => void;
}

export function Desktop({ onLaunchApp }: DesktopProps) {
  const [state, setState] = useState<InstallStoreState>({ version: 1, installs: {} });
  const [selectedIcon, setSelectedIcon] = useState<string | null>(null);
  const lastClickRef = React.useRef<{ id: string; time: number } | null>(null);

  useEffect(() => {
    setState(loadInstallState());
    return subscribeInstalls(() => setState(loadInstallState()));
  }, []);

  const icons = desktopPackages(state);

  const handleIconClick = useCallback(
    (id: string) => {
      const now = Date.now();
      const last = lastClickRef.current;
      if (last && last.id === id && now - last.time < 400) {
        onLaunchApp(id);
        lastClickRef.current = null;
      } else {
        setSelectedIcon(id);
        lastClickRef.current = { id, time: now };
      }
    },
    [onLaunchApp],
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Enter" && selectedIcon) onLaunchApp(selectedIcon);
    },
    [selectedIcon, onLaunchApp],
  );

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
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          flexWrap: "wrap",
          alignContent: "flex-start",
          gap: "var(--dm-ui-gap, 4px)",
          padding: "var(--dm-ui-pad, 4px)",
          height: "calc(100% - var(--dm-taskbar-h, 32px))",
        }}
      >
        {icons.map((icon) => {
          const isSelected = selectedIcon === icon.id;
          return (
            <div
              key={icon.id}
              onClick={() => handleIconClick(icon.id)}
              style={{
                width: "64px",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: "2px",
                padding: "4px 2px",
                cursor: "pointer",
                backgroundColor: isSelected ? "rgba(255,255,255,0.1)" : "transparent",
                border: isSelected ? "1px solid #555555" : "1px solid transparent",
                userSelect: "none",
              }}
            >
              <div
                style={{
                  width: 36,
                  height: 36,
                  border: "1px solid #444",
                  background: "#0a0a0a",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 16,
                  color: "#fff",
                  fontFamily: "var(--dm-font-primary)",
                }}
              >
                {icon.glyph}
              </div>
              <div
                style={{
                  fontFamily: "var(--dm-font-primary)",
                  fontSize: "var(--dm-ui-font-xs, 7px)",
                  color: "#ccc",
                  textAlign: "center",
                  letterSpacing: "0.5px",
                  lineHeight: 1.2,
                  maxWidth: 60,
                  wordBreak: "break-word",
                }}
              >
                {icon.label}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
