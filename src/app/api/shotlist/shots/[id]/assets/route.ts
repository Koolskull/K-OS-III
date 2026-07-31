import { NextResponse } from "next/server";
import { requireUserId, isShotlistShotOwner, isAssetOwner } from "@/lib/api-auth";
import { pool } from "@/lib/db";

/** Assets attached to this shot. */
export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const userId = await requireUserId();
  if (!userId) return NextResponse.json({ error: "Not signed in" }, { status: 401 });

  const { id } = await params;
  const shotId = Number(id);
  if (!Number.isInteger(shotId)) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (!(await isShotlistShotOwner(shotId, userId))) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const result = await pool.query(
    `SELECT a.id, a.kind, a.title, a.thumbnail_url, a.file_path, a.created_at
     FROM shotlist_shot_assets sa
     JOIN user_assets a ON a.id = sa.asset_id
     WHERE sa.shot_id = $1
     ORDER BY sa.added_at`,
    [shotId],
  );
  return NextResponse.json(result.rows);
}

/** Attach an existing library asset to this shot. */
export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const userId = await requireUserId();
  if (!userId) return NextResponse.json({ error: "Not signed in" }, { status: 401 });

  const { id } = await params;
  const shotId = Number(id);
  if (!Number.isInteger(shotId)) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (!(await isShotlistShotOwner(shotId, userId))) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const body = (await req.json().catch(() => null)) as { assetId?: number } | null;
  const assetId = Number(body?.assetId);
  if (!Number.isInteger(assetId)) return NextResponse.json({ error: "assetId is required" }, { status: 400 });
  if (!(await isAssetOwner(assetId, userId))) return NextResponse.json({ error: "Not found" }, { status: 404 });

  await pool.query(
    `INSERT INTO shotlist_shot_assets (shot_id, asset_id) VALUES ($1, $2)
     ON CONFLICT (shot_id, asset_id) DO NOTHING`,
    [shotId, assetId],
  );
  return NextResponse.json({ ok: true }, { status: 201 });
}
