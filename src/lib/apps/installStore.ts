/*
 *                    ☦
 *      APP INSTALL STORE — local first
 *
 *  localStorage until PocketBase sync (Phase B). Core apps always "installed".
 */

import {
  type AppId,
  type AppPackage,
  availableCatalog,
  getAppPackage,
  isCoreApp,
  preinstallAppIds,
} from "./catalog";
import { awardInstallBadge } from "./badges";

const STORAGE_KEY = "kos-app-installs-v1";

export interface InstallRecord {
  appId: AppId;
  versionInstalled: string;
  installedAt: number;
  lastOpenedAt: number | null;
  openCount: number;
}

export interface InstallStoreState {
  version: 1;
  installs: Record<string, InstallRecord>;
}

type Listener = () => void;

const listeners = new Set<Listener>();

function canUseStorage(): boolean {
  return typeof window !== "undefined" && typeof window.localStorage !== "undefined";
}

function emptyState(): InstallStoreState {
  return { version: 1, installs: {} };
}

export function loadInstallState(): InstallStoreState {
  if (!canUseStorage()) return emptyState();
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      const seeded = seedPreinstalls(emptyState());
      persist(seeded);
      return seeded;
    }
    const parsed = JSON.parse(raw) as InstallStoreState;
    if (parsed?.version !== 1 || typeof parsed.installs !== "object") {
      const seeded = seedPreinstalls(emptyState());
      persist(seeded);
      return seeded;
    }
    const next = seedPreinstalls(parsed);
    if (JSON.stringify(next) !== JSON.stringify(parsed)) persist(next);
    return next;
  } catch {
    return seedPreinstalls(emptyState());
  }
}

function seedPreinstalls(state: InstallStoreState): InstallStoreState {
  const installs = { ...state.installs };
  const now = Date.now();
  for (const id of preinstallAppIds()) {
    const pkg = getAppPackage(id);
    if (!pkg) continue;
    if (!installs[id]) {
      installs[id] = {
        appId: id,
        versionInstalled: pkg.version,
        installedAt: now,
        lastOpenedAt: null,
        openCount: 0,
      };
    }
  }
  return { version: 1, installs };
}

function persist(state: InstallStoreState): void {
  if (!canUseStorage()) return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    /* ignore */
  }
}

export function saveInstallState(state: InstallStoreState): void {
  persist(state);
  listeners.forEach((l) => l());
}

export function subscribeInstalls(listener: Listener): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function isInstalled(appId: string, state?: InstallStoreState): boolean {
  if (isCoreApp(appId)) return true;
  const s = state ?? loadInstallState();
  return Boolean(s.installs[appId]);
}

export function getInstall(appId: string, state?: InstallStoreState): InstallRecord | undefined {
  const s = state ?? loadInstallState();
  return s.installs[appId];
}

export function installApp(appId: AppId): { state: InstallStoreState; newBadgeTitle: string | null } {
  const pkg = getAppPackage(appId);
  if (!pkg) return { state: loadInstallState(), newBadgeTitle: null };
  const state = loadInstallState();
  if (state.installs[appId]) {
    return { state, newBadgeTitle: null };
  }
  const now = Date.now();
  const next: InstallStoreState = {
    ...state,
    installs: {
      ...state.installs,
      [appId]: {
        appId,
        versionInstalled: pkg.version,
        installedAt: now,
        lastOpenedAt: null,
        openCount: 0,
      },
    },
  };
  saveInstallState(next);
  const badge = awardInstallBadge(appId);
  return { state: next, newBadgeTitle: badge?.title ?? null };
}

export function uninstallApp(appId: AppId): InstallStoreState {
  if (isCoreApp(appId)) return loadInstallState();
  const state = loadInstallState();
  const { [appId]: _removed, ...rest } = state.installs;
  const next = { ...state, installs: rest };
  saveInstallState(next);
  return next;
}

export function recordAppOpen(appId: AppId): void {
  if (!isInstalled(appId) && !isCoreApp(appId)) return;
  const state = loadInstallState();
  const pkg = getAppPackage(appId);
  if (!pkg) return;
  const cur = state.installs[appId];
  const rec: InstallRecord = cur ?? {
    appId,
    versionInstalled: pkg.version,
    installedAt: Date.now(),
    lastOpenedAt: null,
    openCount: 0,
  };
  const next: InstallStoreState = {
    ...state,
    installs: {
      ...state.installs,
      [appId]: {
        ...rec,
        lastOpenedAt: Date.now(),
        openCount: rec.openCount + 1,
      },
    },
  };
  saveInstallState(next);
}

/** Desktop icons: core + installed bundled (available in this build). */
export function desktopPackages(state?: InstallStoreState): AppPackage[] {
  const s = state ?? loadInstallState();
  return availableCatalog().filter((pkg) => {
    if (pkg.tier === "core") return true;
    return Boolean(s.installs[pkg.id]);
  });
}

export function canLaunchApp(appId: string, state?: InstallStoreState): boolean {
  if (!getAppPackage(appId)) return false;
  return isInstalled(appId, state);
}
