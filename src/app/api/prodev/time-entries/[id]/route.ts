import { NextResponse } from "next/server";
import { requireUserId } from "@/lib/api-auth";
import { pool } from "@/lib/db";

/** Clock out — only the person who clocked in can close their own entry. */
export async function PATCH(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const userId = await requireUserId();
  if (!userId) return NextResponse.json({ error: "Not signed in" }, { status: 401 });

  const { id } = await params;
  const entryId = Number(id);
  if (!Number.isInteger(entryId)) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const result = await pool.query(
    `UPDATE prodev_time_entries SET clock_out = now()
     WHERE id = $1 AND user_id = $2 AND clock_out IS NULL
     RETURNING id, user_id, clock_in, clock_out`,
    [entryId, userId],
  );
  if (result.rowCount === 0) return NextResponse.json({ error: "Not found or already clocked out" }, { status: 404 });
  return NextResponse.json(result.rows[0]);
}
