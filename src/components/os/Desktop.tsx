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
import { BRAND } from "@/lib/buildFlags";

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
        aria-hidden
        style={{
          position: "absolute",
          inset: 0,
          backgroundImage: "url(/gifs/screenglitch.gif)",
          backgroundPosition: "50%",
          backgroundRepeat: "no-repeat",
          backgroundSize: "100% 100%",
          opacity: 0.15,
          pointerEvents: "none",
          imageRendering: "pixelated",
          zIndex: 0,
        }}
      />
      <div
        style={{
          position: "relative",
          zIndex: 1,
          display: "flex",
          flexDirection: "column",
          height: "calc(100% - var(--dm-taskbar-h, 32px))",
          padding: "0 10px 10px",
          overflow: "auto",
        }}
      >
        {BRAND === "koolskull" && (
          <div
            aria-hidden
            style={{
              alignSelf: "flex-start",
              width: "min(555px, 92vw)",
              height: 220,
              padding: 20,
              flexShrink: 0,
            }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/img/koolskull-logo.png"
              alt="KOOL SKULL"
              style={{
                display: "block",
                width: "100%",
                height: "100%",
                objectFit: "contain",
                imageRendering: "pixelated",
                pointerEvents: "none",
              }}
            />
          </div>
        )}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            flexWrap: "wrap",
            alignContent: "flex-start",
            gap: "var(--dm-ui-gap, 4px)",
            paddingTop: BRAND === "koolskull" ? 15 : "var(--dm-ui-pad, 4px)",
            flex: 1,
            minHeight: 0,
          }}
        >
        {icons.map((icon) => {
          const isSelected = selectedIcon === icon.id;
          return (
            <div
              key={icon.id}
              data-app-id={icon.id}
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
    </div>
  );
}
