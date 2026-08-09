/*
 *                    ☦
 *        APP INSTALLS — local install set (App Manager)
 *
 *   localStorage mirror so guests and offline users get the install UX
 *   without cloud. Cloud sync can layer on later (user_app_installs).
 */

"use client";

import { useCallback, useSyncExternalStore } from "react";
import { APP_CATALOG, getAppPackage, listCoreApps } from "./catalog";
import type { AppId, AppInstallRecord, AppInstallStore, AppPackage } from "./types";
import { HAS_BACKEND } from "@/lib/buildFlags";

const STORAGE_KEY = "kos-app-installs-v1";
const CHANGE_EVENT = "kos-app-installs-changed";

function emptyStore(): AppInstallStore {
  return { version: 1, installs: {} };
}

function readStore(): AppInstallStore {
  if (typeof window === "undefined") return emptyStore();
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return emptyStore();
    const parsed = JSON.parse(raw) as AppInstallStore;
    if (parsed?.version !== 1 || typeof parsed.installs !== "object") return emptyStore();
    return parsed;
  } catch {
    return emptyStore();
  }
}

function writeStore(store: AppInstallStore): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
  window.dispatchEvent(new Event(CHANGE_EVENT));
}

function subscribe(onChange: () => void): () => void {
  if (typeof window === "undefined") return () => {};
  const handler = () => onChange();
  window.addEventListener(CHANGE_EVENT, handler);
  window.addEventListener("storage", handler);
  return () => {
    window.removeEventListener(CHANGE_EVENT, handler);
    window.removeEventListener("storage", handler);
  };
}

function getSnapshot(): string {
  if (typeof window === "undefined") return "{}";
  return localStorage.getItem(STORAGE_KEY) ?? "{}";
}

function getServerSnapshot(): string {
  return "{}";
}

export function isCoreApp(id: string): boolean {
  return getAppPackage(id)?.tier === "core";
}

export function isInstalled(id: string, store?: AppInstallStore): boolean {
  if (isCoreApp(id)) return true;
  const s = store ?? readStore();
  return Boolean(s.installs[id]);
}

export function installApp(appId: AppId): void {
  const pkg = getAppPackage(appId);
  if (!pkg || pkg.tier === "core") return;
  if (pkg.requiresCloud && !HAS_BACKEND) return;

  const store = readStore();
  const now = new Date().toISOString();
  store.installs[appId] = {
    appId,
    versionInstalled: pkg.version,
    installedAt: store.installs[appId]?.installedAt ?? now,
    lastOpenedAt: store.installs[appId]?.lastOpenedAt,
    openCount: store.installs[appId]?.openCount ?? 0,
  };
  writeStore(store);
}

export function uninstallApp(appId: AppId): void {
  const pkg = getAppPackage(appId);
  if (!pkg || pkg.tier === "core") return;
  const store = readStore();
  delete store.installs[appId];
  writeStore(store);
}

export function recordAppOpen(appId: AppId): void {
  if (isCoreApp(appId)) return;
  const store = readStore();
  const existing = store.installs[appId];
  if (!existing) return;
  existing.lastOpenedAt = new Date().toISOString();
  existing.openCount = (existing.openCount ?? 0) + 1;
  writeStore(store);
}

export function updateInstalledVersion(appId: AppId): void {
  const pkg = getAppPackage(appId);
  if (!pkg) return;
  const store = readStore();
  const rec = store.installs[appId];
  if (!rec) return;
  rec.versionInstalled = pkg.version;
  writeStore(store);
}

export function getInstallRecord(appId: string): AppInstallRecord | null {
  return readStore().installs[appId] ?? null;
}

export function hasUpdate(appId: string): boolean {
  const pkg = getAppPackage(appId);
  const rec = getInstallRecord(appId);
  if (!pkg || !rec) return false;
  return rec.versionInstalled !== pkg.version;
}

/** Packages that may appear as desktop icons right now. */
export function getDesktopPackages(store?: AppInstallStore): AppPackage[] {
  const s = store ?? readStore();
  return APP_CATALOG.filter((pkg) => {
    if (pkg.requiresCloud && !HAS_BACKEND) return false;
    if (pkg.tier === "core") return true;
    return Boolean(s.installs[pkg.id]);
  });
}

export function useAppInstalls(): {
  installedIds: Set<string>;
  store: AppInstallStore;
  install: (id: AppId) => void;
  uninstall: (id: AppId) => void;
  applyUpdate: (id: AppId) => void;
  desktopPackages: AppPackage[];
} {
  const raw = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  const store: AppInstallStore = (() => {
    try {
      const p = JSON.parse(raw) as AppInstallStore;
      if (p?.version === 1 && p.installs) return p;
    } catch {
      /* empty */
    }
    return emptyStore();
  })();

  const installedIds = new Set<string>([
    ...listCoreApps().map((a) => a.id),
    ...Object.keys(store.installs),
  ]);

  const install = useCallback((id: AppId) => installApp(id), []);
  const uninstall = useCallback((id: AppId) => uninstallApp(id), []);
  const applyUpdate = useCallback((id: AppId) => updateInstalledVersion(id), []);

  const desktopPackages = getDesktopPackages(store);

  return { installedIds, store, install, uninstall, applyUpdate, desktopPackages };
}

/** One-shot listener for Desktop without full hook if needed */
export function useDesktopIcons(): AppPackage[] {
  const { desktopPackages } = useAppInstalls();
  return desktopPackages;
}
