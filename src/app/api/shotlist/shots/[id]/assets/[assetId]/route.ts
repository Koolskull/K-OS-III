import { NextResponse } from "next/server";
import { requireUserId, isShotlistShotOwner } from "@/lib/api-auth";
import { pool } from "@/lib/db";

/** Detach an asset from this shot (does not delete the asset itself). */
export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string; assetId: string }> }) {
  const userId = await requireUserId();
  if (!userId) return NextResponse.json({ error: "Not signed in" }, { status: 401 });

  const { id, assetId } = await params;
  const shotId = Number(id);
  const aid = Number(assetId);
  if (!Number.isInteger(shotId) || !Number.isInteger(aid)) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (!(await isShotlistShotOwner(shotId, userId))) return NextResponse.json({ error: "Not found" }, { status: 404 });

  await pool.query(`DELETE FROM shotlist_shot_assets WHERE shot_id = $1 AND asset_id = $2`, [shotId, aid]);
  return NextResponse.json({ ok: true });
}
