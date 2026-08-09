/*
 *                    ☦
 *      USAGE CLOCK — time spent in apps (client-measured)
 *
 *  Focus timer → localStorage totals. Sync to account via /api/apps/activity
 *  when logged in. Privacy: public profile only if show_time_stats.
 */

import type { AppId } from "./catalog";
import { getAppPackage, isKnownAppId } from "./catalog";

const USAGE_KEY = "kos-app-usage-v1";
const TICK_MS = 5000;
const MAX_SESSION_MS = 4 * 60 * 60 * 1000;

export interface AppUsageTotals {
  version: 1;
  /** appId → milliseconds focused */
  totals: Record<string, number>;
  sessionCount: Record<string, number>;
  lastActiveAt: Record<string, number>;
}

type Listener = () => void;
const listeners = new Set<Listener>();

let activeAppId: string | null = null;
let sessionStartedAt = 0;
let tickTimer: ReturnType<typeof setInterval> | null = null;

function canUseStorage(): boolean {
  return typeof window !== "undefined" && typeof window.localStorage !== "undefined";
}

function empty(): AppUsageTotals {
  return { version: 1, totals: {}, sessionCount: {}, lastActiveAt: {} };
}

export function loadUsage(): AppUsageTotals {
  if (!canUseStorage()) return empty();
  try {
    const raw = window.localStorage.getItem(USAGE_KEY);
    if (!raw) return empty();
    const p = JSON.parse(raw) as AppUsageTotals;
    if (p?.version !== 1 || typeof p.totals !== "object") return empty();
    return {
      version: 1,
      totals: p.totals ?? {},
      sessionCount: p.sessionCount ?? {},
      lastActiveAt: p.lastActiveAt ?? {},
    };
  } catch {
    return empty();
  }
}

function persist(u: AppUsageTotals): void {
  if (!canUseStorage()) return;
  try {
    window.localStorage.setItem(USAGE_KEY, JSON.stringify(u));
  } catch {
    /* ignore */
  }
  listeners.forEach((l) => l());
}

export function subscribeUsage(listener: Listener): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function addMs(appId: string, ms: number): void {
  if (ms <= 0 || ms > MAX_SESSION_MS) return;
  const u = loadUsage();
  u.totals[appId] = (u.totals[appId] ?? 0) + ms;
  u.lastActiveAt[appId] = Date.now();
  persist(u);
}

function flushActive(): void {
  if (!activeAppId || !sessionStartedAt) return;
  const elapsed = Date.now() - sessionStartedAt;
  addMs(activeAppId, Math.min(elapsed, MAX_SESSION_MS));
  sessionStartedAt = Date.now();
}

/** Call when a window for appId becomes focused. */
export function usageClockFocus(appId: string): void {
  if (!isKnownAppId(appId) || appId === "appmanager") return;
  if (!getAppPackage(appId)) return;

  if (activeAppId === appId) return;
  flushActive();

  if (activeAppId !== appId) {
    const u = loadUsage();
    u.sessionCount[appId] = (u.sessionCount[appId] ?? 0) + 1;
    persist(u);
  }

  activeAppId = appId;
  sessionStartedAt = Date.now();

  if (tickTimer) clearInterval(tickTimer);
  tickTimer = setInterval(() => {
    if (document.visibilityState === "hidden") return;
    flushActive();
  }, TICK_MS);
}

/** Call when app blurs / closes / tab hides. */
export function usageClockBlur(): void {
  flushActive();
  activeAppId = null;
  sessionStartedAt = 0;
  if (tickTimer) {
    clearInterval(tickTimer);
    tickTimer = null;
  }
}

export function formatDuration(ms: number): string {
  if (ms < 60_000) return `${Math.round(ms / 1000)}s`;
  if (ms < 3_600_000) return `${Math.round(ms / 60_000)}m`;
  const h = Math.floor(ms / 3_600_000);
  const m = Math.round((ms % 3_600_000) / 60_000);
  return `${h}h ${m}m`;
}

export function getUsageMs(appId: string): number {
  return loadUsage().totals[appId] ?? 0;
}

/** Snapshot for cloud sync / public profile. */
export function usageSnapshot(): {
  totals: Record<string, number>;
  sessionCount: Record<string, number>;
  lastActiveAt: Record<string, number>;
} {
  const u = loadUsage();
  return {
    totals: { ...u.totals },
    sessionCount: { ...u.sessionCount },
    lastActiveAt: { ...u.lastActiveAt },
  };
}

if (typeof window !== "undefined") {
  window.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "hidden") flushActive();
  });
  window.addEventListener("pagehide", () => usageClockBlur());
}
