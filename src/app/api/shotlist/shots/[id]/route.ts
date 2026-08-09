import { NextResponse } from "next/server";
import { requireUserId, isShotlistShotOwner } from "@/lib/api-auth";
import { pool } from "@/lib/db";

interface ShotPatch {
  prodev_shot_id?: number | null;
  title?: string;
  description?: string;
  duration_frames?: number;
  audio_notes?: string;
  bg?: string;
  orientation?: string;
  plate_w?: number;
  plate_h?: number;
  thumbnail_url?: string | null;
  has_committed_thumbnail?: boolean;
  xsheet?: unknown[];
  status?: string;
  sort_order?: number;
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const userId = await requireUserId();
  if (!userId) return NextResponse.json({ error: "Not signed in" }, { status: 401 });

  const { id } = await params;
  const shotId = Number(id);
  if (!Number.isInteger(shotId)) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (!(await isShotlistShotOwner(shotId, userId))) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const body = (await req.json()) as ShotPatch;
  const prodevShotId = body.prodev_shot_id === null ? null : body.prodev_shot_id != null ? Number(body.prodev_shot_id) : undefined;
  const title = typeof body.title === "string" ? body.title.trim().slice(0, 500) : undefined;
  const xsheet = body.xsheet !== undefined ? JSON.stringify(body.xsheet) : undefined;

  const result = await pool.query(
    `UPDATE shotlist_shots SET
       prodev_shot_id = CASE WHEN $2::boolean THEN $3 ELSE prodev_shot_id END,
       title = COALESCE($4, title),
       description = COALESCE($5, description),
       duration_frames = COALESCE($6, duration_frames),
       audio_notes = COALESCE($7, audio_notes),
       bg = COALESCE($8, bg),
       orientation = COALESCE($9, orientation),
       plate_w = COALESCE($10, plate_w),
       plate_h = COALESCE($11, plate_h),
       thumbnail_url = CASE WHEN $12::boolean THEN $13 ELSE thumbnail_url END,
       has_committed_thumbnail = COALESCE($14, has_committed_thumbnail),
       xsheet = COALESCE($15, xsheet),
       status = COALESCE($16, status),
       sort_order = COALESCE($17, sort_order)
     WHERE id = $1
     RETURNING id, prodev_shot_id, title, description, duration_frames, audio_notes, bg, orientation,
       plate_w, plate_h, thumbnail_url, has_committed_thumbnail, xsheet, status, sort_order`,
    [
      shotId,
      prodevShotId !== undefined,
      prodevShotId ?? null,
      title,
      body.description,
      body.duration_frames,
      body.audio_notes,
      body.bg,
      body.orientation,
      body.plate_w,
      body.plate_h,
      body.thumbnail_url !== undefined,
      body.thumbnail_url ?? null,
      body.has_committed_thumbnail,
      xsheet,
      body.status,
      body.sort_order,
    ],
  );
  return NextResponse.json(result.rows[0]);
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const userId = await requireUserId();
  if (!userId) return NextResponse.json({ error: "Not signed in" }, { status: 401 });

  const { id } = await params;
  const shotId = Number(id);
  if (!Number.isInteger(shotId)) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (!(await isShotlistShotOwner(shotId, userId))) return NextResponse.json({ error: "Not found" }, { status: 404 });

  await pool.query(`DELETE FROM shotlist_shots WHERE id = $1`, [shotId]);
  return NextResponse.json({ ok: true });
}
