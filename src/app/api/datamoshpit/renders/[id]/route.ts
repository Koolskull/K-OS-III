import { NextResponse } from "next/server";
import { requireUserId } from "@/lib/api-auth";
import { pool } from "@/lib/db";
import { deleteUploadedAsset } from "@/lib/uploads";

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const userId = await requireUserId();
  if (!userId) return NextResponse.json({ error: "Not signed in" }, { status: 401 });

  const { id } = await params;
  const renderId = Number(id);
  if (!Number.isInteger(renderId)) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const result = await pool.query(
    `DELETE FROM datamoshpit_renders WHERE id = $1 AND owner_id = $2 RETURNING file_path`,
    [renderId, userId],
  );
  if (result.rowCount === 0) return NextResponse.json({ error: "Not found" }, { status: 404 });

  await deleteUploadedAsset(result.rows[0].file_path as string);
  return NextResponse.json({ ok: true });
}
