import { NextResponse } from "next/server";
import { pool } from "@/lib/db";

/**
 * Public profile search — no auth required, since browsing public profiles
 * shouldn't need an account. Only returns rows a user has explicitly opted
 * into making public (profiles.is_public), matching against either their
 * chosen display name or their underlying Matrix ID.
 */
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const q = (searchParams.get("q") ?? "").trim().slice(0, 100);
  if (!q) return NextResponse.json([]);

  const result = await pool.query(
    `SELECT p.user_id, p.display_name, p.avatar_url, u.name AS matrix_id
     FROM profiles p
     JOIN users u ON u.id = p.user_id
     WHERE p.is_public = true
       AND (p.display_name ILIKE $1 OR u.name ILIKE $1)
     ORDER BY p.display_name NULLS LAST, u.name
     LIMIT 25`,
    [`%${q}%`],
  );
  return NextResponse.json(result.rows);
}
