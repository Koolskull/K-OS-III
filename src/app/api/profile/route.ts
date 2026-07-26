import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { pool } from "@/lib/db";

interface ProfilePatch {
  display_name?: string;
  bio?: string;
  avatar_url?: string;
  is_public?: boolean;
}

export async function GET() {
  const session = await auth();
  const userId = (session?.user as { id?: string } | undefined)?.id;
  if (!userId) return NextResponse.json({ error: "Not signed in" }, { status: 401 });

  const result = await pool.query(
    `SELECT user_id, display_name, bio, avatar_url, is_public FROM profiles WHERE user_id = $1`,
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

  const result = await pool.query(
    `UPDATE profiles SET
       display_name = COALESCE($2, display_name),
       bio = COALESCE($3, bio),
       avatar_url = COALESCE($4, avatar_url),
       is_public = COALESCE($5, is_public),
       updated_at = now()
     WHERE user_id = $1
     RETURNING user_id, display_name, bio, avatar_url, is_public`,
    [userId, displayName, bio, avatarUrl, isPublic],
  );
  return NextResponse.json(result.rows[0] ?? null);
}
