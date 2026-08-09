/*
 *                    ☦
 *      ACTIVITY SYNC — push local installs / badges / usage to profile
 *
 *  When signed in, POST /api/apps/activity so stats can show on public profile
 *  (gated by show_install_list / show_time_stats / show_badges).
 */

import { loadInstallState } from "./installStore";
import { loadBadges } from "./badges";
import { usageSnapshot } from "./usageClock";

export interface ActivityPayload {
  installs: Array<{
    appId: string;
    versionInstalled: string;
    installedAt: number;
    openCount: number;
    lastOpenedAt: number | null;
  }>;
  badges: Array<{ badgeId: string; earnedAt: number }>;
  usage: {
    totals: Record<string, number>;
    sessionCount: Record<string, number>;
    lastActiveAt: Record<string, number>;
  };
}

export function buildActivityPayload(): ActivityPayload {
  const st = loadInstallState();
  return {
    installs: Object.values(st.installs).map((r) => ({
      appId: r.appId,
      versionInstalled: r.versionInstalled,
      installedAt: r.installedAt,
      openCount: r.openCount,
      lastOpenedAt: r.lastOpenedAt,
    })),
    badges: loadBadges().map((b) => ({ badgeId: b.badgeId, earnedAt: b.earnedAt })),
    usage: usageSnapshot(),
  };
}

/** Best-effort; no throw. Returns true if server accepted. */
export async function syncActivityToAccount(): Promise<boolean> {
  try {
    const res = await fetch("/api/apps/activity", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(buildActivityPayload()),
    });
    return res.ok;
  } catch {
    return false;
  }
}
