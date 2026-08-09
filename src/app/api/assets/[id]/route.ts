import { NextResponse } from "next/server";
import { requireUserId } from "@/lib/api-auth";
import { pool } from "@/lib/db";
import { deleteUploadedAsset } from "@/lib/uploads";

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const userId = await requireUserId();
  if (!userId) return NextResponse.json({ error: "Not signed in" }, { status: 401 });

  const { id } = await params;
  const assetId = Number(id);
  if (!Number.isInteger(assetId)) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const result = await pool.query(
    `DELETE FROM user_assets WHERE id = $1 AND owner_id = $2 RETURNING file_path`,
    [assetId, userId],
  );
  if (result.rowCount === 0) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const filePath = result.rows[0].file_path as string | null;
  if (filePath) await deleteUploadedAsset(filePath);

  return NextResponse.json({ ok: true });
}
