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

import React, { useState, useCallback, useEffect, useRef } from "react";
import { BootSequence } from "@/components/os/BootSequence";
import { Desktop } from "@/components/os/Desktop";
import { Taskbar } from "@/components/os/Taskbar";
import { AppWindow } from "@/components/os/AppWindow";
import type { WindowState } from "@/components/os/AppWindow";
import { ThrashPhoneShell } from "@/components/apps/thrash-tracker/ThrashPhoneShell";
import { BibleReader } from "@/components/apps/bible/BibleReader";
import { GameMenu } from "@/components/apps/games/GameMenu";
import { KoolDrawApp } from "@/components/apps/kooldraw/KoolDrawApp";
import { ManualApp } from "@/components/apps/manual/ManualApp";
import { StardrainWikiApp } from "@/components/apps/stardrain-wiki/StardrainWikiApp";
import { BackstageWikiApp } from "@/components/apps/backstage-wiki/BackstageWikiApp";
import TilemapApp from "@/components/apps/tilemap/TilemapApp";
import ShotlistApp from "@/components/apps/shotlist/ShotlistApp";
import { SkullTextApp } from "@/components/apps/skulltext/SkullTextApp";
import { EducationApp } from "@/components/apps/education/EducationApp";
import SkullMashApp from "@/components/apps/skullmash/SkullMashApp";
import { NodeMapApp } from "@/components/apps/nodemap/NodeMapApp";
import { StanceApp } from "@/components/apps/stance/StanceApp";
import { NotesApp } from "@/components/apps/notes/NotesApp";
import {
  appIdFor,
  markKosShell,
  restorePendingFromStorage,
  subscribeKos,
} from "@/lib/os/kos-nav";
import { IdentityApp } from "@/components/apps/identity/IdentityApp";
import { StudioApp } from "@/components/apps/studio/StudioApp";
import { ProdevApp } from "@/components/apps/prodev/ProdevApp";
import { PicoTrackerApp } from "@/components/apps/picotracker/PicoTrackerApp";
import { ShellTerminal } from "@/components/os/ShellTerminal";
import { assetUrl } from "@/lib/assets";
import { CreativeWorkflowProvider } from "@/lib/creative";
import {
  SHELL_APPS,
  defaultInstalledIds,
  readInstalledIds,
  writeInstalledIds,
  type ShellAppId,
} from "@/lib/os/shell/catalog";


type AppId = ShellAppId;

interface OpenWindow {
  id: string;
  appId: AppId;
  title: string;
  state: WindowState;
  zIndex: number;
}

const APP_DEFAULTS: Record<AppId, { title: string; width: number; height: number }> = Object.fromEntries(
  SHELL_APPS.map((app) => [app.id, { title: app.title, width: app.width, height: app.height }]),
) as Record<AppId, { title: string; width: number; height: number }>;

let windowCounter = 0;

export default function KoolskullOS() {
  const [booting, setBooting] = useState(true);
  const [windows, setWindows] = useState<OpenWindow[]>([]);
  const [focusedWindowId, setFocusedWindowId] = useState<string | null>(null);
  const [nextZIndex, setNextZIndex] = useState(1);
  const [installedIds, setInstalledIds] = useState<string[]>(defaultInstalledIds);

  useEffect(() => {
    setInstalledIds(readInstalledIds());
  }, []);

  const installApp = useCallback((appId: string) => {
    setInstalledIds((prev) => {
      if (prev.includes(appId)) return prev;
      const next = [...prev, appId];
      writeInstalledIds(next);
      return next;
    });
  }, []);

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

  const kosRestored = useRef(false);
  useEffect(() => {
    markKosShell();
    if (!kosRestored.current) {
      kosRestored.current = true;
      const stored = restorePendingFromStorage();
      if (stored) launchApp(appIdFor(stored));
    }
    return subscribeKos((target) => launchApp(appIdFor(target)));
  }, [launchApp]);

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
    <CreativeWorkflowProvider onLaunchApp={launchApp}>
      <div
        className="w-full h-full relative overflow-hidden"
        style={{ backgroundColor: "#000000" }}
      >
        <Desktop onLaunchApp={launchApp} installedIds={installedIds} />

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
            {win.appId === "thrash-tracker" && (
              <ThrashPhoneShell isFocused={win.id === focusedWindowId} embedded />
            )}
            {win.appId === "bible" && <BibleReader />}
            {win.appId === "games" && <GameMenu />}
            {win.appId === "kooldraw" && (
              <KoolDrawApp isFocused={win.id === focusedWindowId} />
            )}
            {win.appId === "manual" && <ManualApp />}
            {win.appId === "stardrain-wiki" && <StardrainWikiApp />}
            {win.appId === "backstage-wiki" && <BackstageWikiApp />}
            {win.appId === "tilemap" && (
              <TilemapApp isFocused={win.id === focusedWindowId} />
            )}
            {win.appId === "shotlist" && (
              <ShotlistApp isFocused={win.id === focusedWindowId} />
            )}
            {win.appId === "skulltext" && (
              <SkullTextApp isFocused={win.id === focusedWindowId} />
            )}
            {win.appId === "skullmash" && (
              <SkullMashApp isFocused={win.id === focusedWindowId} />
            )}
            {win.appId === "education" && <EducationApp />}
            {win.appId === "nodemap" && (
              <NodeMapApp isFocused={win.id === focusedWindowId} />
            )}
            {win.appId === "stance" && <StanceApp />}
            {win.appId === "notes" && (
              <NotesApp isFocused={win.id === focusedWindowId} />
            )}
            {win.appId === "identity" && <IdentityApp />}
            {win.appId === "studio" && <StudioApp />}
            {win.appId === "prodev" && <ProdevApp />}
            {win.appId === "picotracker" && (
              <PicoTrackerApp isFocused={win.id === focusedWindowId} />
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

        <ShellTerminal
          installedIds={installedIds}
          onLaunchApp={launchApp}
          onInstall={installApp}
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
    </CreativeWorkflowProvider>
  );
}
