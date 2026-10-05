/*
 * In-OS addresses. Literature inside K-OS cites other literature
 * with kos:// instead of sending the reader out to a browser tab.
 *
 *   kos://academy/<track>/<lesson>
 *   kos://backstage/<entryId>
 *   kos://stardrain/<entryId>
 *
 * The destination app may not be mounted when the click happens.
 * The target is held here until that app reads it, and the desktop
 * shell is asked to open or focus the window in the meantime.
 */

export type KosTarget =
  | { app: "education"; track: string; lesson: string }
  | { app: "backstage-wiki"; entry: string }
  | { app: "stardrain-wiki"; entry: string };

export const KOS_EVENT = "kos-open";
const STORAGE_KEY = "kos-open-pending";

let pending: KosTarget | null = null;
let shellReady = false;

export function markKosShell(): void {
  shellReady = true;
}

export function peekPending(app?: KosTarget["app"]): KosTarget | null {
  if (!pending) return null;
  if (app && pending.app !== app) return null;
  return pending;
}

export function consumePending(app: KosTarget["app"]): KosTarget | null {
  if (!pending || pending.app !== app) return null;
  const target = pending;
  pending = null;
  try {
    sessionStorage.removeItem(STORAGE_KEY);
  } catch {
    /* private mode */
  }
  return target;
}

export function restorePendingFromStorage(): KosTarget | null {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const target = JSON.parse(raw) as KosTarget;
    if (!target || (target.app !== "education" && target.app !== "backstage-wiki" && target.app !== "stardrain-wiki")) {
      return null;
    }
    pending = target;
    return target;
  } catch {
    return null;
  }
}

export function appIdFor(target: KosTarget): "education" | "backstage-wiki" | "stardrain-wiki" {
  return target.app === "education" ? "education" : target.app;
}

export function parseKos(href: string): KosTarget | null {
  const match = href.trim().match(/^kos:\/\/(academy|backstage|stardrain)\/([^/\s?#]+)(?:\/([^/\s?#]+))?\/?$/);
  if (!match) return null;
  const kind = match[1];
  const first = match[2];
  const second = match[3];
  if (kind === "academy") {
    if (!second) return null;
    return { app: "education", track: first, lesson: second };
  }
  if (kind === "backstage") return { app: "backstage-wiki", entry: first };
  return { app: "stardrain-wiki", entry: first };
}

export function subscribeKos(fn: (target: KosTarget) => void): () => void {
  const handler = (event: Event) => {
    const target = (event as CustomEvent<KosTarget>).detail;
    if (target) fn(target);
  };
  window.addEventListener(KOS_EVENT, handler);
  return () => window.removeEventListener(KOS_EVENT, handler);
}

export function openKos(target: KosTarget): void {
  pending = target;
  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(target));
  } catch {
    /* private mode */
  }
  window.dispatchEvent(new CustomEvent(KOS_EVENT, { detail: target }));
  if (!shellReady && target.app !== "education" && window.location.pathname !== "/") {
    window.location.assign("/");
  }
}
