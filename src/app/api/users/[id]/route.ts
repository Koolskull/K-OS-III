import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { pool } from "@/lib/db";

/**
 * Public profile view — returns a profile if it's marked public, or if the
 * signed-in user is viewing their own (private-or-not) profile. Anyone
 * else's private profile is a 404, not a 403 — we don't reveal that a
 * private profile exists at all.
 */
export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const userId = Number(id);
  if (!Number.isInteger(userId)) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const session = await auth();
  const viewerId = (session?.user as { id?: string } | undefined)?.id;
  const isSelf = viewerId != null && Number(viewerId) === userId;

  const result = await pool.query(
    `SELECT p.user_id, p.display_name, p.bio, p.avatar_url, p.is_public, u.name AS matrix_id
     FROM profiles p
     JOIN users u ON u.id = p.user_id
     WHERE p.user_id = $1`,
    [userId],
  );
  const profile = result.rows[0];
  if (!profile) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (!profile.is_public && !isSelf) return NextResponse.json({ error: "Not found" }, { status: 404 });

  return NextResponse.json(profile);
}
