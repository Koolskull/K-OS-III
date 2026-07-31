import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { pool } from "@/lib/db";

/**
 * Public profile view. Contact fields only when toggles allow (or self).
 * ENS shown only when show_ens and ens_name set.
 */
export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const userId = Number(id);
  if (!Number.isInteger(userId)) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const session = await auth();
  const viewerId = (session?.user as { id?: string } | undefined)?.id;
  const isSelf = viewerId != null && Number(viewerId) === userId;

  const result = await pool.query(
    `SELECT p.user_id, p.display_name, p.bio, p.avatar_url, p.is_public,
            p.show_email, p.show_ethereum, p.show_matrix, p.show_ens, p.ens_name,
            u.name AS name, u.email
     FROM profiles p
     JOIN users u ON u.id = p.user_id
     WHERE p.user_id = $1`,
    [userId],
  );
  const profile = result.rows[0];
  if (!profile) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (!profile.is_public && !isSelf) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const accounts = await pool.query(
    `SELECT provider, "providerAccountId" FROM accounts WHERE "userId" = $1`,
    [userId],
  );
  const ethereum: string[] = [];
  const matrix: string[] = [];
  for (const row of accounts.rows as { provider: string; providerAccountId: string }[]) {
    if (row.provider === "ethereum") ethereum.push(row.providerAccountId);
    if (row.provider === "matrix") matrix.push(row.providerAccountId);
  }

  const blocks = await pool.query(
    `SELECT id, block_type, payload, sort_order
     FROM profile_blocks WHERE user_id = $1
     ORDER BY sort_order ASC, id ASC`,
    [userId],
  );

  const showEmail = Boolean(profile.show_email) || isSelf;
  const showEthereum = Boolean(profile.show_ethereum) || isSelf;
  const showMatrix = Boolean(profile.show_matrix) || isSelf;
  const showEns = Boolean(profile.show_ens) || isSelf;

  return NextResponse.json({
    user_id: profile.user_id,
    display_name: profile.display_name,
    bio: profile.bio,
    avatar_url: profile.avatar_url,
    is_public: profile.is_public,
    matrix_id: showMatrix ? (matrix[0] ?? profile.name ?? null) : null,
    ens_name: showEns && profile.ens_name ? profile.ens_name : null,
    contacts: {
      email: showEmail && profile.email ? profile.email : null,
      ethereum: showEthereum ? ethereum : [],
      matrix: showMatrix ? matrix : [],
      ens: showEns && profile.ens_name ? profile.ens_name : null,
    },
    show_email: isSelf ? profile.show_email : undefined,
    show_ethereum: isSelf ? profile.show_ethereum : undefined,
    show_matrix: isSelf ? profile.show_matrix : undefined,
    show_ens: isSelf ? profile.show_ens : undefined,
    blocks: blocks.rows,
  });
}
