/*
 *                    ☦
 *      APP CATALOG — installable package registry
 *
 *  Source of truth for app ids, tiers, versions, docs, badges.
 *  Core always on desktop. Bundled requires install. See docs/APP_MANAGER_SPEC.md.
 */

import { BRAND_NAME, HAS_BACKEND } from "@/lib/buildFlags";

export type AppTier = "core" | "bundled";

export type AppId =
  | "appmanager"
  | "account"
  | "manual"
  | "education"
  | "bible"
  | "datamoshpit"
  | "kooldraw"
  | "shotlist"
  | "tilemap"
  | "skulltext"
  | "skullmash"
  | "notes"
  | "nodemap"
  | "stance"
  | "games"
  | "stardrain-wiki"
  | "browser"
  | "prodev"
  | "chat";

export interface AppPackage {
  id: AppId;
  name: string;
  label: string;
  glyph: string;
  description: string;
  tier: AppTier;
  version: string;
  requiresCloud?: boolean;
  /** Fresh sessions get these without opening App Manager */
  preinstall?: boolean;
  defaultWindow: { title: string; width: number; height: number };
  badgeId: string;
  docsPath?: string;
  manualSlug?: string;
}

export const SHELL_VERSION = "0.2.2-beta";

export const APP_CATALOG: AppPackage[] = [
  {
    id: "appmanager",
    name: "App Manager",
    label: "APPS",
    glyph: "+",
    description: "Install apps, see versions, badges, and time spent.",
    tier: "core",
    version: "1.1.0",
    defaultWindow: { title: "APP MANAGER", width: 800, height: 580 },
    badgeId: "badge.core.appmanager",
    docsPath: "docs/APP_MANAGER_SPEC.md",
  },
  {
    id: "manual",
    name: "Manual",
    label: "MANUAL",
    glyph: "?",
    description: `In-OS documentation for ${BRAND_NAME}.`,
    tier: "core",
    version: "1.0.0",
    defaultWindow: { title: `${BRAND_NAME} MANUAL`, width: 880, height: 600 },
    badgeId: "badge.core.manual",
    manualSlug: "welcome",
  },
  {
    id: "account",
    name: "Account",
    label: "ACCOUNT",
    glyph: "☺",
    description: "Wallet/email sign-in, profile, privacy for installs & time stats.",
    tier: "core",
    version: "1.1.0",
    requiresCloud: true,
    defaultWindow: { title: "ACCOUNT", width: 420, height: 560 },
    badgeId: "badge.core.account",
    docsPath: "docs/ACCOUNTS_SPEC.md",
  },
  {
    id: "education",
    name: "Education",
    label: "EDUCATION",
    glyph: "§",
    description: "Tracks, lessons, quizzes.",
    tier: "core",
    version: "0.2.0",
    preinstall: true,
    defaultWindow: { title: "EDUCATION", width: 920, height: 640 },
    badgeId: "badge.install.education",
    docsPath: "EDUCATION.md",
  },
  {
    id: "bible",
    name: "Holy Bible",
    label: "HOLY BIBLE",
    glyph: "✝",
    description: "Scripture reader with notes.",
    tier: "bundled",
    version: "1.0.0",
    preinstall: true,
    defaultWindow: { title: "HOLY BIBLE", width: 640, height: 500 },
    badgeId: "badge.install.bible",
  },
  {
    id: "datamoshpit",
    name: "Datamoshpit",
    label: "DATAMOSHPIT",
    glyph: "☦",
    description: "Tracker, instruments, live visuals.",
    tier: "bundled",
    version: "0.2.2",
    defaultWindow: { title: "DATAMOSHPIT", width: 800, height: 600 },
    badgeId: "badge.install.datamoshpit",
    docsPath: "docs/DATAMOSHPIT_GUIDE.md",
    manualSlug: "what-is-a-tracker",
  },
  {
    id: "kooldraw",
    name: "KoolDraw",
    label: "KOOLDRAW",
    glyph: "◻",
    description: "Pixel drawing and stamps.",
    tier: "bundled",
    version: "0.2.0",
    preinstall: true,
    defaultWindow: { title: "KOOLDRAW", width: 800, height: 600 },
    badgeId: "badge.install.kooldraw",
  },
  {
    id: "shotlist",
    name: "Shotlist",
    label: "SHOTLIST",
    glyph: "▦",
    description: "Shot plates and X-sheets.",
    tier: "bundled",
    version: "0.1.0",
    defaultWindow: { title: "SHOTLIST", width: 900, height: 640 },
    badgeId: "badge.install.shotlist",
    docsPath: "docs/SHOTLIST_SPEC.md",
  },
  {
    id: "tilemap",
    name: "Tilemap Painter",
    label: "TILEMAP",
    glyph: "▤",
    description: "Tilemap editor for game scenes.",
    tier: "bundled",
    version: "0.1.0",
    defaultWindow: { title: "TILEMAP PAINTER", width: 960, height: 700 },
    badgeId: "badge.install.tilemap",
  },
  {
    id: "skulltext",
    name: "SkullText",
    label: "SKULLTEXT",
    glyph: "☠",
    description: "Code and text editor.",
    tier: "bundled",
    version: "0.1.0",
    defaultWindow: { title: "SKULLTEXT", width: 900, height: 640 },
    badgeId: "badge.install.skulltext",
  },
  {
    id: "skullmash",
    name: "SkullMash",
    label: "SKULLMASH",
    glyph: "◎",
    description: "Image → balloon mesh → keyframes.",
    tier: "bundled",
    version: "0.3.0",
    defaultWindow: { title: "SKULLMASH", width: 1100, height: 720 },
    badgeId: "badge.install.skullmash",
  },
  {
    id: "notes",
    name: "Notes",
    label: "NOTES",
    glyph: "✎",
    description: "Personal notes — private by default.",
    tier: "bundled",
    version: "0.1.0",
    defaultWindow: { title: "NOTES", width: 860, height: 620 },
    badgeId: "badge.install.notes",
    docsPath: "docs/NOTES.md",
  },
  {
    id: "nodemap",
    name: "NodeMap",
    label: "NODEMAP",
    glyph: "◈",
    description: "Graph canvas — nodes and wires.",
    tier: "bundled",
    version: "0.1.0",
    defaultWindow: { title: "NODEMAP", width: 1000, height: 700 },
    badgeId: "badge.install.nodemap",
    docsPath: "docs/NODEMAP.md",
  },
  {
    id: "stance",
    name: "Epistemic Stance",
    label: "EPISTEMIC STANCE",
    glyph: "¶",
    description: "How we treat claims and sources.",
    tier: "bundled",
    version: "0.1.0",
    defaultWindow: { title: "EPISTEMIC STANCE", width: 780, height: 620 },
    badgeId: "badge.install.stance",
    docsPath: "docs/EPISTEMIC_STANCE.md",
  },
  {
    id: "games",
    name: "Games",
    label: "GAMES",
    glyph: ">",
    description: "Game launcher / demos.",
    tier: "bundled",
    version: "0.1.0",
    defaultWindow: { title: "GAMES", width: 700, height: 550 },
    badgeId: "badge.install.games",
  },
  {
    id: "stardrain-wiki",
    name: "Stardrain Wiki",
    label: "STARDRAIN",
    glyph: "☄",
    description: "Stardrain universe lore.",
    tier: "bundled",
    version: "0.1.0",
    defaultWindow: { title: "STARDRAIN WIKI", width: 860, height: 620 },
    badgeId: "badge.install.stardrain-wiki",
  },
  {
    id: "browser",
    name: "KOS Browser",
    label: "KOS BROWSER",
    glyph: "@",
    description: "Browse public profiles.",
    tier: "bundled",
    version: "0.1.0",
    requiresCloud: true,
    defaultWindow: { title: "KOS BROWSER", width: 480, height: 560 },
    badgeId: "badge.install.browser",
  },
  {
    id: "prodev",
    name: "PRODEV",
    label: "PRODEV",
    glyph: "%",
    description: "Production credits and checklists.",
    tier: "bundled",
    version: "0.1.0",
    requiresCloud: true,
    defaultWindow: { title: "PRODEV", width: 820, height: 560 },
    badgeId: "badge.install.prodev",
  },
  {
    id: "chat",
    name: "K-CHAT",
    label: "K-CHAT",
    glyph: "✉",
    description: "Messaging rails (wallet / Matrix).",
    tier: "bundled",
    version: "0.1.0",
    requiresCloud: true,
    defaultWindow: { title: "K-CHAT", width: 520, height: 480 },
    badgeId: "badge.install.chat",
    docsPath: "docs/CHAT_SPEC.md",
  },
];

const byId = new Map(APP_CATALOG.map((a) => [a.id, a]));

export function getAppPackage(id: string): AppPackage | undefined {
  return byId.get(id as AppId);
}

export function isCoreApp(id: string): boolean {
  return getAppPackage(id)?.tier === "core";
}

export function isKnownAppId(id: string): id is AppId {
  return byId.has(id as AppId);
}

export function availableCatalog(): AppPackage[] {
  return APP_CATALOG.filter((a) => HAS_BACKEND || !a.requiresCloud);
}

export function preinstallAppIds(): AppId[] {
  return availableCatalog()
    .filter((a) => a.tier === "core" || a.preinstall)
    .map((a) => a.id);
}

export function appWindowDefaults(id: AppId): { title: string; width: number; height: number } {
  const pkg = getAppPackage(id);
  if (pkg) return pkg.defaultWindow;
  return { title: id.toUpperCase(), width: 640, height: 480 };
}
