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

import React, { useState, useEffect, useCallback } from "react";
import { signOut } from "next-auth/react";

interface TaskbarWindow {
  id: string;
  title: string;
  isMinimized: boolean;
}

const menuActionBtn: React.CSSProperties = {
  width: "100%",
  height: "var(--dm-ui-btn-h, 22px)",
  border: "1px solid #555555",
  backgroundColor: "#000000",
  color: "#ffffff",
  fontFamily: "var(--dm-font-primary)",
  fontSize: "var(--dm-ui-font-xs, 7px)",
  letterSpacing: "1px",
  cursor: "pointer",
  boxSizing: "border-box",
};

interface TaskbarProps {
  windows: TaskbarWindow[];
  focusedId: string | null;
  onWindowClick: (id: string) => void;
  onShowDesktop: () => void;
  onLaunchApp: (appId: string) => void;
}

interface SessionUser {
  name?: string | null;
}

export function Taskbar({ windows, focusedId, onWindowClick, onShowDesktop, onLaunchApp }: TaskbarProps) {
  const [time, setTime] = useState("");
  const [menuOpen, setMenuOpen] = useState(false);
  const [user, setUser] = useState<SessionUser | null>(null);
  const [loadingUser, setLoadingUser] = useState(true);

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

  const refreshSession = useCallback(async () => {
    setLoadingUser(true);
    try {
      const res = await fetch("/api/auth/session");
      const data = await res.json();
      setUser(data?.user ?? null);
    } catch {
      setUser(null);
    }
    setLoadingUser(false);
  }, []);

  // Re-check on mount and every time the menu opens (covers signing in via
  // /account in another tab/window since we don't have a shared session
  // context here).
  useEffect(() => {
    refreshSession();
  }, [refreshSession]);
  useEffect(() => {
    if (menuOpen) refreshSession();
  }, [menuOpen, refreshSession]);

  const handleSignOut = useCallback(async () => {
    await signOut({ redirect: false });
    setUser(null);
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
      {/* Start button — opens the start menu (account status + sign in/out) */}
      <div style={{ position: "relative", flexShrink: 0 }}>
        <button
          onClick={() => setMenuOpen((v) => !v)}
          style={{
            height: "var(--dm-ui-btn-h, 22px)",
            padding: "0 8px",
            border: `1px solid ${menuOpen ? "#ffffff" : "#555555"}`,
            backgroundColor: menuOpen ? "#1a1a1a" : "#000000",
            color: "#ffffff",
            fontFamily: "var(--dm-font-primary)",
            fontSize: "var(--dm-ui-font-sm, 8px)",
            letterSpacing: "1px",
            cursor: "pointer",
          }}
        >
          ☦ 2KOOL.TV
        </button>

        {menuOpen && (
          <>
            {/* Click-outside-to-close scrim */}
            <div
              onClick={() => setMenuOpen(false)}
              style={{ position: "fixed", inset: 0, zIndex: 99999 }}
            />
            <div
              style={{
                position: "absolute",
                bottom: "calc(var(--dm-ui-btn-h, 22px) + 5px)",
                left: 0,
                zIndex: 100000,
                minWidth: "160px",
                backgroundColor: "#0a0a0a",
                border: "1px solid #555555",
                boxShadow: "3px 3px 0 #000000",
                fontFamily: "var(--dm-font-primary)",
                imageRendering: "pixelated",
              }}
            >
              <div
                style={{
                  padding: "5px 8px",
                  borderBottom: "1px solid #333333",
                  backgroundColor: "#1a1a1a",
                  fontSize: "var(--dm-ui-font-xs, 7px)",
                  color: "#888888",
                  letterSpacing: "1px",
                }}
              >
                ACCOUNT
              </div>
              <div style={{ padding: "8px" }}>
                {loadingUser ? (
                  <div style={{ fontSize: "var(--dm-ui-font-sm, 8px)", color: "#666666" }}>…</div>
                ) : user ? (
                  <>
                    <div
                      style={{
                        fontSize: "var(--dm-ui-font-sm, 8px)",
                        color: "#ffffff",
                        letterSpacing: "0.5px",
                        marginBottom: "8px",
                        wordBreak: "break-all",
                      }}
                    >
                      {user.name}
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                      <button
                        onClick={() => {
                          setMenuOpen(false);
                          onLaunchApp("account");
                        }}
                        style={menuActionBtn}
                      >
                        ACCOUNT
                      </button>
                      <button
                        onClick={() => {
                          setMenuOpen(false);
                          onLaunchApp("browser");
                        }}
                        style={menuActionBtn}
                      >
                        KOS BROWSER
                      </button>
                      <button onClick={handleSignOut} style={menuActionBtn}>
                        SIGN OUT
                      </button>
                    </div>
                  </>
                ) : (
                  <>
                    <div
                      style={{
                        fontSize: "var(--dm-ui-font-sm, 8px)",
                        color: "#888888",
                        letterSpacing: "0.5px",
                        marginBottom: "8px",
                      }}
                    >
                      NOT SIGNED IN
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                      <button
                        onClick={() => {
                          setMenuOpen(false);
                          onLaunchApp("account");
                        }}
                        style={{ ...menuActionBtn, border: "1px solid #ffffff", backgroundColor: "#ffffff", color: "#000000" }}
                      >
                        LOG IN
                      </button>
                      <button
                        onClick={() => {
                          setMenuOpen(false);
                          onLaunchApp("browser");
                        }}
                        style={menuActionBtn}
                      >
                        KOS BROWSER
                      </button>
                    </div>
                  </>
                )}
              </div>
            </div>
          </>
        )}
      </div>

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

      {/* Show desktop — moved here from the start button, which now opens the start menu */}
      <button
        onClick={onShowDesktop}
        title="Show desktop (minimize all windows)"
        style={{
          height: "var(--dm-ui-btn-h, 22px)",
          width: "var(--dm-ui-btn-h, 22px)",
          border: "1px solid #333333",
          backgroundColor: "#000000",
          color: "#888888",
          fontFamily: "var(--dm-font-primary)",
          fontSize: "var(--dm-ui-font-sm, 8px)",
          cursor: "pointer",
          flexShrink: 0,
        }}
      >
        ▭
      </button>

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
