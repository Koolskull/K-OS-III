/*
 *                    ☦
 *        APP CATALOG — source of truth for package IDs / versions / docs
 *
 *   Desktop only shows core + user installs. Everything else is installed
 *   through APP MANAGER. Code may still ship in the bundle (v1); install
 *   toggles visibility + future telemetry. See docs/APP_MANAGER.md.
 */

import type { AppId, AppPackage } from "./types";

/** Shell version shown next to packages (product generation). */
export const SHELL_VERSION = "0.2.2-beta";

export const APP_CATALOG: AppPackage[] = [
  {
    id: "app-manager",
    name: "APP MANAGER",
    glyph: "⊞",
    description: "Install, update, and uninstall desktop apps. Browse package docs and versions.",
    tier: "core",
    version: "1.0.0",
    defaultWindow: { title: "APP MANAGER", width: 920, height: 640 },
    docsPath: "docs/APP_MANAGER.md",
    category: "system",
  },
  {
    id: "manual",
    name: "MANUAL",
    glyph: "?",
    description: "In-OS documentation — trackers, terminal, creative tools.",
    tier: "core",
    version: "1.0.0",
    defaultWindow: { title: "MANUAL", width: 880, height: 600 },
    manualSlug: "welcome",
    category: "learn",
  },
  {
    id: "account",
    name: "ACCOUNT",
    glyph: "☺",
    description: "Sign in (wallet / email / Matrix), edit profile, link identities.",
    tier: "core",
    version: "1.0.0",
    defaultWindow: { title: "ACCOUNT", width: 420, height: 560 },
    requiresCloud: true,
    docsPath: "docs/ACCOUNTS_SPEC.md",
    category: "system",
  },
  {
    id: "datamoshpit",
    name: "DATAMOSHPIT",
    glyph: "☦",
    description: "Tracker + live pads + bounce-to-file. Core music machine.",
    tier: "bundled",
    version: "0.2.2",
    defaultWindow: { title: "DATAMOSHPIT", width: 800, height: 600 },
    docsPath: "docs/DATAMOSHPIT_GUIDE.md",
    manualSlug: "what-is-a-tracker",
    category: "create",
  },
  {
    id: "kooldraw",
    name: "KOOLDRAW",
    glyph: "◻",
    description: "Pixel / vector drawing and stamp plates for shots.",
    tier: "bundled",
    version: "0.2.0",
    defaultWindow: { title: "KOOLDRAW", width: 800, height: 600 },
    category: "create",
  },
  {
    id: "shotlist",
    name: "SHOTLIST",
    glyph: "▦",
    description: "Shot plates, X-sheets, offline sequence planning.",
    tier: "bundled",
    version: "0.1.0",
    defaultWindow: { title: "SHOTLIST", width: 900, height: 640 },
    docsPath: "docs/SHOTLIST_SPEC.md",
    category: "create",
  },
  {
    id: "tilemap",
    name: "TILEMAP",
    glyph: "▤",
    description: "Tile painter for maps and game layouts.",
    tier: "bundled",
    version: "0.1.0",
    defaultWindow: { title: "TILEMAP PAINTER", width: 960, height: 700 },
    category: "create",
  },
  {
    id: "skulltext",
    name: "SKULLTEXT",
    glyph: "☠",
    description: "CodeMirror text editor for notes and source.",
    tier: "bundled",
    version: "0.1.0",
    defaultWindow: { title: "SKULLTEXT", width: 900, height: 640 },
    category: "tools",
  },
  {
    id: "skullmash",
    name: "SKULLMASH",
    glyph: "◎",
    description: "Image → balloon mesh → keyframes (Monster Mash style).",
    tier: "bundled",
    version: "0.3.0",
    defaultWindow: { title: "SKULLMASH", width: 1100, height: 720 },
    category: "create",
  },
  {
    id: "notes",
    name: "NOTES",
    glyph: "✎",
    description: "Personal notes — private by default, optional public + to-dos.",
    tier: "bundled",
    version: "0.1.0",
    defaultWindow: { title: "NOTES", width: 860, height: 620 },
    docsPath: "docs/NOTES.md",
    category: "tools",
  },
  {
    id: "bible",
    name: "HOLY BIBLE",
    glyph: "✝",
    description: "KJV reader with search and bookmarks.",
    tier: "bundled",
    version: "1.0.0",
    defaultWindow: { title: "HOLY BIBLE", width: 640, height: 500 },
    category: "learn",
  },
  {
    id: "education",
    name: "EDUCATION",
    glyph: "§",
    description: "Lesson tracks, MCQ checkouts, local progress.",
    tier: "bundled",
    version: "0.2.0",
    defaultWindow: { title: "EDUCATION", width: 920, height: 640 },
    docsPath: "EDUCATION.md",
    category: "learn",
  },
  {
    id: "nodemap",
    name: "NODEMAP",
    glyph: "◈",
    description: "Graph canvas — nodes, wires, pinch zoom.",
    tier: "bundled",
    version: "0.1.0",
    defaultWindow: { title: "NODEMAP", width: 1000, height: 700 },
    docsPath: "docs/NODEMAP.md",
    category: "tools",
  },
  {
    id: "stance",
    name: "EPISTEMIC STANCE",
    glyph: "¶",
    description: "How we treat claims, sources, and uncertainty.",
    tier: "bundled",
    version: "0.1.0",
    defaultWindow: { title: "EPISTEMIC STANCE", width: 780, height: 620 },
    docsPath: "docs/EPISTEMIC_STANCE.md",
    category: "learn",
  },
  {
    id: "games",
    name: "GAMES",
    glyph: ">",
    description: "In-browser game menu (Keen, Skullvaders, more).",
    tier: "bundled",
    version: "0.1.0",
    defaultWindow: { title: "GAMES", width: 700, height: 550 },
    category: "media",
  },
  {
    id: "stardrain-wiki",
    name: "STARDRAIN",
    glyph: "☄",
    description: "Stardrain wiki browser inside the OS.",
    tier: "bundled",
    version: "0.1.0",
    defaultWindow: { title: "STARDRAIN WIKI", width: 860, height: 620 },
    category: "media",
  },
  {
    id: "browser",
    name: "KOS BROWSER",
    glyph: "@",
    description: "Browse public K-OS profiles.",
    tier: "bundled",
    version: "0.1.0",
    defaultWindow: { title: "KOS BROWSER", width: 480, height: 560 },
    requiresCloud: true,
    docsPath: "docs/ACCOUNTS_SPEC.md",
    category: "social",
  },
  {
    id: "chat",
    name: "K-CHAT",
    glyph: "✉",
    description: "Ephemeral threads + wallet/matrix messaging rails.",
    tier: "bundled",
    version: "0.1.0",
    defaultWindow: { title: "K-CHAT", width: 520, height: 480 },
    requiresCloud: true,
    docsPath: "docs/CHAT_SPEC.md",
    category: "social",
  },
  {
    id: "prodev",
    name: "PRODEV",
    glyph: "%",
    description: "Production credits, checklist, clock-in/out.",
    tier: "bundled",
    version: "0.1.0",
    defaultWindow: { title: "PRODEV", width: 820, height: 560 },
    requiresCloud: true,
    category: "tools",
  },
];

const byId = new Map(APP_CATALOG.map((p) => [p.id, p]));

export function getAppPackage(id: string): AppPackage | undefined {
  return byId.get(id as AppId);
}

export function listCoreApps(): AppPackage[] {
  return APP_CATALOG.filter((p) => p.tier === "core");
}

export function listInstallableApps(): AppPackage[] {
  return APP_CATALOG.filter((p) => p.tier !== "core");
}

export function isKnownAppId(id: string): id is AppId {
  return byId.has(id as AppId);
}
