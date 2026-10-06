/*
 *                    ☦
 *            ╔══════════════════╗
 *            ║  K-OS III        ║
 *            ║  SHELL CATALOG   ║
 *            ╚══════════════════╝
 *
 *   Names the shell can open, and the one depot package
 *   that is not on the desktop until it is installed.
 */

import { TRACKER_TITLE } from "@/components/apps/thrash-tracker/dm2/model";

export interface ShellApp {
  id: string;
  title: string;
  label: string;
  glyph: string;
  width: number;
  height: number;
  iconWidth?: number;
  aliases: string[];
  /** Present on the desktop before anyone uses the shell. */
  installed: boolean;
}

export const SHELL_APPS: ShellApp[] = [
  { id: "updates", title: "UPDATES", label: "UPDATES", glyph: "!", width: 820, height: 600, aliases: ["updates", "news", "log", "changelog"], installed: true },
  { id: "identity", title: "IDENTITY", label: "IDENTITY", glyph: "◉", width: 640, height: 560, aliases: ["id"], installed: true },
  { id: "bible", title: "HOLY BIBLE", label: "HOLY BIBLE", glyph: "✝", width: 640, height: 500, aliases: ["bible", "kjv"], installed: true },
  { id: "thrash-tracker", title: TRACKER_TITLE, label: TRACKER_TITLE, glyph: "☦", width: 1000, height: 620, iconWidth: 96, aliases: ["thrash", "tracker", "datamoshpit", "dm2"], installed: true },
  { id: "kooldraw", title: "KOOLDRAW", label: "KOOLDRAW", glyph: "◻", width: 800, height: 600, aliases: ["draw", "kooldraw"], installed: true },
  { id: "shotlist", title: "SHOTLIST", label: "SHOTLIST", glyph: "▦", width: 900, height: 640, aliases: ["shots"], installed: true },
  { id: "tilemap", title: "TILEMAP PAINTER", label: "TILEMAP", glyph: "▤", width: 960, height: 700, aliases: ["tiles", "tilemap"], installed: true },
  { id: "nodemap", title: "NODEMAP", label: "NODEMAP", glyph: "◈", width: 1000, height: 700, aliases: ["nodes"], installed: true },
  { id: "stance", title: "EPISTEMIC STANCE", label: "EPISTEMIC STANCE", glyph: "¶", width: 780, height: 620, aliases: ["stance", "epistemic"], installed: true },
  { id: "skulltext", title: "SKULLTEXT", label: "SKULLTEXT", glyph: "☠", width: 900, height: 640, aliases: ["text"], installed: true },
  { id: "skullmash", title: "SKULLMASH", label: "SKULLMASH", glyph: "◎", width: 1100, height: 720, aliases: ["mash"], installed: true },
  { id: "notes", title: "NOTES", label: "NOTES", glyph: "✎", width: 860, height: 620, aliases: ["note"], installed: true },
  { id: "games", title: "GAMES", label: "GAMES", glyph: ">", width: 700, height: 550, aliases: ["game"], installed: true },
  { id: "manual", title: "K-OS MANUAL", label: "MANUAL", glyph: "?", width: 880, height: 600, aliases: ["manual", "man"], installed: true },
  { id: "education", title: "EDUCATION", label: "EDUCATION", glyph: "§", width: 920, height: 640, aliases: ["edu", "academy", "lessons"], installed: true },
  { id: "stardrain-wiki", title: "STARDRAIN WIKI", label: "STARDRAIN", glyph: "☄", width: 860, height: 620, aliases: ["stardrain", "lore", "wiki"], installed: true },
  { id: "backstage-wiki", title: "BACKSTAGE", label: "BACKSTAGE", glyph: "◐", width: 860, height: 620, aliases: ["backstage"], installed: true },
  { id: "studio", title: "2KOOL STUDIO", label: "STUDIO", glyph: "▣", width: 900, height: 640, aliases: ["2kool", "studio"], installed: true },
  { id: "prodev", title: "PRODEV", label: "PRODEV", glyph: "▥", width: 900, height: 640, aliases: ["dev"], installed: true },
  { id: "picotracker", title: "PICOTRACKER", label: "PICOTRACKER", glyph: "♪", width: 1000, height: 620, aliases: ["pico", "picotracker", "lgpt"], installed: false },
];

export type ShellAppId = (typeof SHELL_APPS)[number]["id"];

const STORAGE_KEY = "kos-iii-shell-installed";

export function normAppName(value: string): string {
  return value.toLowerCase().replace(/[\s_\-]+/g, "");
}

export function defaultInstalledIds(): string[] {
  return SHELL_APPS.filter((app) => app.installed).map((app) => app.id);
}

export function readInstalledIds(): string[] {
  const defaults = defaultInstalledIds();
  if (typeof window === "undefined") return defaults;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return defaults;
    const extra = JSON.parse(raw) as unknown;
    if (!Array.isArray(extra)) return defaults;
    const known = new Set(SHELL_APPS.map((app) => app.id));
    const added = extra.filter((id): id is string => typeof id === "string" && known.has(id));
    return [...new Set([...defaults, ...added])];
  } catch {
    return defaults;
  }
}

export function writeInstalledIds(ids: readonly string[]): void {
  const defaults = new Set(defaultInstalledIds());
  const extra = ids.filter((id) => !defaults.has(id));
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(extra));
}

export function findShellApp(query: string): ShellApp | null {
  const key = normAppName(query);
  if (!key) return null;
  return (
    SHELL_APPS.find((app) => {
      if (normAppName(app.id) === key) return true;
      if (normAppName(app.label) === key) return true;
      if (normAppName(app.title) === key) return true;
      return app.aliases.some((alias) => normAppName(alias) === key);
    }) ?? null
  );
}

export function appById(id: string): ShellApp | null {
  return SHELL_APPS.find((app) => app.id === id) ?? null;
}
