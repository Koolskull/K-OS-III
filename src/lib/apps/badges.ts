/*
 *                    ☦
 *      BADGES — local stub (PocketBase sync later)
 */

import { APP_CATALOG, type AppId, getAppPackage } from "./catalog";

const BADGES_KEY = "kos-user-badges-v1";

export interface EarnedBadge {
  badgeId: string;
  earnedAt: number;
  meta?: Record<string, string>;
}

export interface BadgeDef {
  id: string;
  title: string;
  description: string;
  earnedAt?: number;
}

function canUseStorage(): boolean {
  return typeof window !== "undefined" && typeof window.localStorage !== "undefined";
}

export function loadBadges(): EarnedBadge[] {
  if (!canUseStorage()) return [];
  try {
    const raw = window.localStorage.getItem(BADGES_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as EarnedBadge[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function saveBadges(list: EarnedBadge[]): void {
  if (!canUseStorage()) return;
  try {
    window.localStorage.setItem(BADGES_KEY, JSON.stringify(list));
  } catch {
    /* ignore */
  }
}

export function hasBadge(badgeId: string): boolean {
  return loadBadges().some((b) => b.badgeId === badgeId);
}

/** Award install badge for an app. Returns the badge def if newly earned. */
export function awardInstallBadge(appId: AppId): BadgeDef | null {
  const pkg = getAppPackage(appId);
  if (!pkg) return null;
  const badgeId = pkg.badgeId;
  if (hasBadge(badgeId)) return null;
  const list = loadBadges();
  list.push({ badgeId, earnedAt: Date.now(), meta: { appId } });
  saveBadges(list);
  return {
    id: badgeId,
    title: `Installed ${pkg.name}`,
    description: `You installed ${pkg.name} (${pkg.version}).`,
  };
}

export function listEarnedBadges(): BadgeDef[] {
  return loadBadges().map((b) => {
    const app = APP_CATALOG.find((a) => a.badgeId === b.badgeId);
    return {
      id: b.badgeId,
      title: app ? `Installed ${app.name}` : b.badgeId,
      description: app
        ? `You installed ${app.name}. Cloud sync for badges comes with PocketBase accounts.`
        : "Earned badge",
      earnedAt: b.earnedAt,
    };
  });
}
