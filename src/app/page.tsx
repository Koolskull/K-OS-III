/*
 *                          ☦
 *                  ╔════════════════╗
 *                  ║    IC    XC   ║
 *                  ║   NIKA NIKA   ║
 *                  ╚════════════════╝
 *
 *        ┌──────────────────────────────┐
 *        │                              │
 *        │    ††† KNIGHTS TEMPLAR †††   │
 *        │    KOOLSKULL OPERATING       │
 *        │    SYSTEM III                │
 *        │                              │
 *        │    "Non nobis, Domine,       │
 *        │     non nobis, sed nomini    │
 *        │     tuo da gloriam."         │
 *        │                              │
 *        └──────────────────────────────┘
 *
 *   K-OS III DESKTOP SHELL
 *   Boot sequence → Desktop with icons → Windowed apps
 *
 *   Saint Benedict, protect this house of code.
 *   Holy Angels, keep every window in good order.
 */

"use client";

import React, { useState, useCallback } from "react";
import { BootSequence } from "@/components/os/BootSequence";
import { Desktop } from "@/components/os/Desktop";
import { Taskbar } from "@/components/os/Taskbar";
import { AppWindow } from "@/components/os/AppWindow";
import type { WindowState } from "@/components/os/AppWindow";
import { DatamoshpitApp } from "@/components/apps/DatamoshpitApp";
import { BibleReader } from "@/components/apps/bible/BibleReader";
import { GameMenu } from "@/components/apps/games/GameMenu";
import { KoolDrawApp } from "@/components/apps/kooldraw/KoolDrawApp";
import { ManualApp } from "@/components/apps/manual/ManualApp";
import { StardrainWikiApp } from "@/components/apps/stardrain-wiki/StardrainWikiApp";
import TilemapApp from "@/components/apps/tilemap/TilemapApp";
import ShotlistApp from "@/components/apps/shotlist/ShotlistApp";
import { assetUrl } from "@/lib/assets";
// PicoTracker disabled — Datamoshpit covers this workflow
// import { PicoTrackerApp } from "@/components/apps/picotracker/PicoTrackerApp";

type AppId =
  | "datamoshpit"
  | "bible"
  | "games"
  | "kooldraw"
  | "manual"
  | "stardrain-wiki"
  | "tilemap"
  | "shotlist";

interface OpenWindow {
  id: string;
  appId: AppId;
  title: string;
  state: WindowState;
  zIndex: number;
}

const APP_DEFAULTS: Record<AppId, { title: string; width: number; height: number }> = {
  datamoshpit: { title: "DATAMOSHPIT", width: 800, height: 600 },
  bible: { title: "HOLY BIBLE", width: 640, height: 500 },
  games: { title: "GAMES", width: 700, height: 550 },
  kooldraw: { title: "SPRITE EDITOR", width: 800, height: 600 },
  manual: { title: "K-OS MANUAL", width: 880, height: 600 },
  "stardrain-wiki": { title: "STARDRAIN WIKI", width: 860, height: 620 },
  tilemap: { title: "TILEMAP PAINTER", width: 960, height: 700 },
  shotlist: { title: "SHOTLIST", width: 900, height: 640 },
  // picotracker: { title: "PICOTRACKER", width: 700, height: 550 },
};

let windowCounter = 0;

export default function KoolskullOS() {
  const [booting, setBooting] = useState(true);
  const [windows, setWindows] = useState<OpenWindow[]>([]);
  const [focusedWindowId, setFocusedWindowId] = useState<string | null>(null);
  const [nextZIndex, setNextZIndex] = useState(1);

  const launchApp = useCallback((appId: string) => {
    const id = appId as AppId;
    const defaults = APP_DEFAULTS[id];
    if (!defaults) return;

    // If app is already open, focus it
    const existing = windows.find((w) => w.appId === id);
    if (existing) {
      setFocusedWindowId(existing.id);
      setNextZIndex((z) => z + 1);
      setWindows((prev) =>
        prev.map((w) =>
          w.id === existing.id
            ? { ...w, zIndex: nextZIndex, state: { ...w.state, isMinimized: false } }
            : w,
        ),
      );
      return;
    }

    windowCounter++;
    const windowId = `${id}-${windowCounter}`;

    const newWindow: OpenWindow = {
      id: windowId,
      appId: id,
      title: defaults.title,
      state: {
        x: 0,
        y: 0,
        width: defaults.width,
        height: defaults.height,
        isMinimized: false,
        isMaximized: true,
      },
      zIndex: nextZIndex,
    };

    setWindows((prev) => [...prev, newWindow]);
    setFocusedWindowId(windowId);
    setNextZIndex((z) => z + 1);
  }, [windows, nextZIndex]);

  const focusWindow = useCallback((id: string) => {
    setFocusedWindowId(id);
    setNextZIndex((z) => {
      setWindows((prev) =>
        prev.map((w) => (w.id === id ? { ...w, zIndex: z } : w)),
      );
      return z + 1;
    });
  }, []);

  const closeWindow = useCallback((id: string) => {
    setWindows((prev) => prev.filter((w) => w.id !== id));
    setFocusedWindowId((prev) => {
      if (prev !== id) return prev;
      const remaining = windows.filter((w) => w.id !== id);
      if (remaining.length === 0) return null;
      remaining.sort((a, b) => b.zIndex - a.zIndex);
      return remaining[0].id;
    });
  }, [windows]);

  const updateWindowState = useCallback((id: string, state: WindowState) => {
    setWindows((prev) =>
      prev.map((w) => (w.id === id ? { ...w, state } : w)),
    );
    if (state.isMinimized) {
      setFocusedWindowId((prev) => (prev === id ? null : prev));
    }
  }, []);

  const handleTaskbarClick = useCallback((id: string) => {
    const win = windows.find((w) => w.id === id);
    if (!win) return;

    if (win.id === focusedWindowId && !win.state.isMinimized) {
      updateWindowState(id, { ...win.state, isMinimized: true });
    } else if (win.state.isMinimized) {
      updateWindowState(id, { ...win.state, isMinimized: false });
      focusWindow(id);
    } else {
      focusWindow(id);
    }
  }, [windows, focusedWindowId, updateWindowState, focusWindow]);

  const showDesktop = useCallback(() => {
    setWindows((prev) =>
      prev.map((w) => ({ ...w, state: { ...w.state, isMinimized: true } })),
    );
    setFocusedWindowId(null);
  }, []);

  if (booting) {
    return <BootSequence onComplete={() => setBooting(false)} />;
  }

  return (
    <div
      className="w-full h-full relative overflow-hidden"
      style={{ backgroundColor: "#000000" }}
    >
      <Desktop onLaunchApp={launchApp} />

      {windows.map((win) => (
        <AppWindow
          key={win.id}
          id={win.id}
          title={win.title}
          state={win.state}
          zIndex={win.zIndex}
          isFocused={win.id === focusedWindowId}
          onFocus={() => focusWindow(win.id)}
          onStateChange={(state) => updateWindowState(win.id, state)}
          onClose={() => closeWindow(win.id)}
        >
          {win.appId === "datamoshpit" && (
            <DatamoshpitApp isFocused={win.id === focusedWindowId} />
          )}
          {win.appId === "bible" && <BibleReader />}
          {win.appId === "games" && <GameMenu />}
          {win.appId === "kooldraw" && (
            <KoolDrawApp isFocused={win.id === focusedWindowId} />
          )}
          {win.appId === "manual" && <ManualApp />}
          {win.appId === "stardrain-wiki" && <StardrainWikiApp />}
          {win.appId === "tilemap" && (
            <TilemapApp isFocused={win.id === focusedWindowId} />
          )}
          {win.appId === "shotlist" && (
            <ShotlistApp isFocused={win.id === focusedWindowId} />
          )}
        </AppWindow>
      ))}

      <Taskbar
        windows={windows.map((w) => ({
          id: w.id,
          title: w.title,
          isMinimized: w.state.isMinimized,
        }))}
        focusedId={focusedWindowId}
        onWindowClick={handleTaskbarClick}
        onShowDesktop={showDesktop}
      />

      {/* Screen glitch overlay */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage: `url(${assetUrl("/gifs/screenglitch.gif")})`,
          backgroundSize: "cover",
          backgroundRepeat: "no-repeat",
          opacity: 0.07,
          zIndex: 999999,
          mixBlendMode: "screen",
        }}
      />
    </div>
  );
}
