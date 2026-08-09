/*
 *                    ☦
 *        APP PACKAGE TYPES — App Manager catalog
 *
 *   Each desktop app is a versioned package with its own docs pointer.
 *   See docs/APP_MANAGER.md.
 */

export type AppTier = "core" | "bundled" | "remote";

export type AppId =
  | "app-manager"
  | "datamoshpit"
  | "bible"
  | "games"
  | "kooldraw"
  | "manual"
  | "stardrain-wiki"
  | "tilemap"
  | "shotlist"
  | "skulltext"
  | "skullmash"
  | "education"
  | "nodemap"
  | "stance"
  | "notes"
  | "account"
  | "browser"
  | "prodev"
  | "chat";

export interface AppPackage {
  id: AppId;
  name: string;
  glyph: string;
  /** Short blurb for App Manager cards */
  description: string;
  tier: AppTier;
  /** Semver of this package definition (not necessarily the shell) */
  version: string;
  defaultWindow: { title: string; width: number; height: number };
  /** Needs /api/* (hidden when HAS_BACKEND is false) */
  requiresCloud?: boolean;
  /** Path under docs/ for package documentation */
  docsPath?: string;
  /** In-OS manual article slug if any */
  manualSlug?: string;
  /** Category for filters */
  category: "system" | "create" | "media" | "learn" | "social" | "tools";
}

export interface AppInstallRecord {
  appId: AppId;
  versionInstalled: string;
  installedAt: string; // ISO
  lastOpenedAt?: string;
  openCount: number;
}

export interface AppInstallStore {
  version: 1;
  installs: Record<string, AppInstallRecord>;
}
