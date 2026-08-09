import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { pool } from "@/lib/db";

/**
 * Sync client-measured app installs / badges / usage onto the user profile.
 * Public visibility controlled by show_install_list / show_time_stats / show_badges.
 */

type ActivityBody = {
  installs?: Array<{
    appId: string;
    versionInstalled?: string;
    installedAt?: number;
    openCount?: number;
    lastOpenedAt?: number | null;
  }>;
  badges?: Array<{ badgeId: string; earnedAt?: number }>;
  usage?: {
    totals?: Record<string, number>;
    sessionCount?: Record<string, number>;
    lastActiveAt?: Record<string, number>;
  };
};

async function ensureActivityColumns(): Promise<void> {
  // Idempotent — safe on every cold start of a serverless instance.
  await pool.query(`
    ALTER TABLE profiles ADD COLUMN IF NOT EXISTS show_install_list BOOLEAN NOT NULL DEFAULT false;
    ALTER TABLE profiles ADD COLUMN IF NOT EXISTS show_time_stats BOOLEAN NOT NULL DEFAULT false;
    ALTER TABLE profiles ADD COLUMN IF NOT EXISTS show_badges BOOLEAN NOT NULL DEFAULT true;
    ALTER TABLE profiles ADD COLUMN IF NOT EXISTS apps_activity JSONB NOT NULL DEFAULT '{}'::jsonb;
  `);
}

export async function GET() {
  const session = await auth();
  const userId = (session?.user as { id?: string } | undefined)?.id;
  if (!userId) return NextResponse.json({ error: "Not signed in" }, { status: 401 });

  try {
    await ensureActivityColumns();
  } catch (e) {
    console.error("apps/activity schema", e);
  }

  const result = await pool.query(
    `SELECT show_install_list, show_time_stats, show_badges, apps_activity
     FROM profiles WHERE user_id = $1`,
    [userId],
  );
  const row = result.rows[0];
  if (!row) return NextResponse.json({ error: "No profile" }, { status: 404 });
  return NextResponse.json({
    show_install_list: row.show_install_list,
    show_time_stats: row.show_time_stats,
    show_badges: row.show_badges,
    activity: row.apps_activity ?? {},
  });
}

export async function POST(req: Request) {
  const session = await auth();
  const userId = (session?.user as { id?: string } | undefined)?.id;
  if (!userId) return NextResponse.json({ error: "Not signed in" }, { status: 401 });

  try {
    await ensureActivityColumns();
  } catch (e) {
    console.error("apps/activity schema", e);
    return NextResponse.json({ error: "Schema error" }, { status: 500 });
  }

  const body = (await req.json().catch(() => null)) as ActivityBody | null;
  if (!body) return NextResponse.json({ error: "Invalid body" }, { status: 400 });

  const installs = Array.isArray(body.installs)
    ? body.installs
        .filter((i) => i && typeof i.appId === "string")
        .slice(0, 64)
        .map((i) => ({
          appId: String(i.appId).slice(0, 64),
          versionInstalled: String(i.versionInstalled ?? "").slice(0, 32),
          installedAt: Number(i.installedAt) || 0,
          openCount: Math.min(Number(i.openCount) || 0, 1_000_000),
          lastOpenedAt: i.lastOpenedAt == null ? null : Number(i.lastOpenedAt) || null,
        }))
    : [];

  const badges = Array.isArray(body.badges)
    ? body.badges
        .filter((b) => b && typeof b.badgeId === "string")
        .slice(0, 128)
        .map((b) => ({
          badgeId: String(b.badgeId).slice(0, 128),
          earnedAt: Number(b.earnedAt) || 0,
        }))
    : [];

  const usageTotals: Record<string, number> = {};
  if (body.usage?.totals && typeof body.usage.totals === "object") {
    for (const [k, v] of Object.entries(body.usage.totals).slice(0, 64)) {
      const n = Number(v);
      if (Number.isFinite(n) && n >= 0 && n < 1e12) usageTotals[String(k).slice(0, 64)] = Math.floor(n);
    }
  }

  const payload = {
    installs,
    badges,
    usage: {
      totals: usageTotals,
      sessionCount: body.usage?.sessionCount ?? {},
      lastActiveAt: body.usage?.lastActiveAt ?? {},
    },
    updatedAt: new Date().toISOString(),
  };

  await pool.query(
    `UPDATE profiles SET apps_activity = $2::jsonb, updated_at = now()
     WHERE user_id = $1`,
    [userId, JSON.stringify(payload)],
  );

  return NextResponse.json({ ok: true });
}
