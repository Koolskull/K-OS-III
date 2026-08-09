import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { pool } from "@/lib/db";
import { ensOwnedByAddresses, lookupEnsName } from "@/lib/ens";

interface ProfilePatch {
  display_name?: string;
  bio?: string;
  avatar_url?: string;
  is_public?: boolean;
  show_email?: boolean;
  show_ethereum?: boolean;
  show_matrix?: boolean;
  show_ens?: boolean;
  show_install_list?: boolean;
  show_time_stats?: boolean;
  show_badges?: boolean;
  /** If true, reverse-resolve ENS from first linked eth wallet and cache it. */
  refresh_ens?: boolean;
  ens_name?: string | null;
}

const PROFILE_COLS = `user_id, display_name, bio, avatar_url, is_public,
  show_email, show_ethereum, show_matrix, ens_name, show_ens,
  show_install_list, show_time_stats, show_badges`;

async function ensureActivityColumns(): Promise<void> {
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
  } catch {
    /* columns may already exist or DB briefly unavailable */
  }

  const result = await pool.query(
    `SELECT ${PROFILE_COLS} FROM profiles WHERE user_id = $1`,
    [userId],
  );
  return NextResponse.json(result.rows[0] ?? null);
}

export async function PATCH(req: Request) {
  const session = await auth();
  const userId = (session?.user as { id?: string } | undefined)?.id;
  if (!userId) return NextResponse.json({ error: "Not signed in" }, { status: 401 });

  const body = (await req.json()) as ProfilePatch;
  const displayName = typeof body.display_name === "string" ? body.display_name.slice(0, 255) : undefined;
  const bio = typeof body.bio === "string" ? body.bio.slice(0, 2000) : undefined;
  const avatarUrl = typeof body.avatar_url === "string" ? body.avatar_url.slice(0, 2000) : undefined;
  const isPublic = typeof body.is_public === "boolean" ? body.is_public : undefined;
  const showEmail = typeof body.show_email === "boolean" ? body.show_email : undefined;
  const showEthereum = typeof body.show_ethereum === "boolean" ? body.show_ethereum : undefined;
  const showMatrix = typeof body.show_matrix === "boolean" ? body.show_matrix : undefined;
  const showEns = typeof body.show_ens === "boolean" ? body.show_ens : undefined;
  const showInstallList =
    typeof body.show_install_list === "boolean" ? body.show_install_list : undefined;
  const showTimeStats =
    typeof body.show_time_stats === "boolean" ? body.show_time_stats : undefined;
  const showBadges = typeof body.show_badges === "boolean" ? body.show_badges : undefined;

  try {
    await ensureActivityColumns();
  } catch {
    /* ignore */
  }

  let ensName: string | null | undefined = undefined;
  if (body.refresh_ens === true) {
    const eth = await pool.query(
      `SELECT "providerAccountId" FROM accounts WHERE "userId" = $1 AND provider = 'ethereum'`,
      [Number(userId)],
    );
    const addresses = eth.rows.map((r: { providerAccountId: string }) => r.providerAccountId);
    let found: string | null = null;
    for (const addr of addresses) {
      found = await lookupEnsName(addr);
      if (found) break;
    }
    ensName = found;
  } else if (body.ens_name === null) {
    ensName = null;
  } else if (typeof body.ens_name === "string" && body.ens_name.trim()) {
    const candidate = body.ens_name.trim().toLowerCase();
    const eth = await pool.query(
      `SELECT "providerAccountId" FROM accounts WHERE "userId" = $1 AND provider = 'ethereum'`,
      [Number(userId)],
    );
    const addresses = eth.rows.map((r: { providerAccountId: string }) => r.providerAccountId);
    const ok = await ensOwnedByAddresses(candidate, addresses);
    if (!ok) {
      return NextResponse.json(
        { error: "That ENS name does not resolve to one of your linked wallets." },
        { status: 400 },
      );
    }
    ensName = candidate;
  }

  const result = await pool.query(
    `UPDATE profiles SET
       display_name = COALESCE($2, display_name),
       bio = COALESCE($3, bio),
       avatar_url = COALESCE($4, avatar_url),
       is_public = COALESCE($5, is_public),
       show_email = COALESCE($6, show_email),
       show_ethereum = COALESCE($7, show_ethereum),
       show_matrix = COALESCE($8, show_matrix),
       show_ens = COALESCE($9, show_ens),
       ens_name = CASE WHEN $10::boolean THEN $11 ELSE ens_name END,
       show_install_list = COALESCE($12, show_install_list),
       show_time_stats = COALESCE($13, show_time_stats),
       show_badges = COALESCE($14, show_badges),
       updated_at = now()
     WHERE user_id = $1
     RETURNING ${PROFILE_COLS}`,
    [
      userId,
      displayName,
      bio,
      avatarUrl,
      isPublic,
      showEmail,
      showEthereum,
      showMatrix,
      showEns,
      ensName !== undefined,
      ensName ?? null,
      showInstallList,
      showTimeStats,
      showBadges,
    ],
  );
  return NextResponse.json(result.rows[0] ?? null);
}
