import { NextResponse } from "next/server";
import { requireUserId, isSequenceOwner } from "@/lib/api-auth";
import { pool } from "@/lib/db";

interface ShotInput {
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

/** Create one shot under a sequence — used both for a brand-new shot and to
 *  materialize a locally-created shot on first save (see ShotlistApp.tsx). */
export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const userId = await requireUserId();
  if (!userId) return NextResponse.json({ error: "Not signed in" }, { status: 401 });

  const { id } = await params;
  const sequenceId = Number(id);
  if (!Number.isInteger(sequenceId)) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (!(await isSequenceOwner(sequenceId, userId))) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const body = (await req.json()) as ShotInput;
  const title = (body.title ?? "SHOT").trim().slice(0, 500) || "SHOT";
  const plateW = Number.isInteger(body.plate_w) ? Number(body.plate_w) : 512;
  const plateH = Number.isInteger(body.plate_h) ? Number(body.plate_h) : 512;

  const maxOrder = await pool.query(
    `SELECT COALESCE(MAX(sort_order), -1) + 1 AS next FROM shotlist_shots WHERE sequence_id = $1`,
    [sequenceId],
  );

  const result = await pool.query(
    `INSERT INTO shotlist_shots
       (sequence_id, prodev_shot_id, title, description, duration_frames, audio_notes, bg, orientation,
        plate_w, plate_h, thumbnail_url, has_committed_thumbnail, xsheet, status, sort_order)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
     RETURNING id, prodev_shot_id, title, description, duration_frames, audio_notes, bg, orientation,
       plate_w, plate_h, thumbnail_url, has_committed_thumbnail, xsheet, status, sort_order`,
    [
      sequenceId,
      body.prodev_shot_id ?? null,
      title,
      body.description ?? "",
      Number.isInteger(body.duration_frames) ? body.duration_frames : 24,
      body.audio_notes ?? "",
      body.bg ?? "white",
      body.orientation ?? "landscape",
      plateW,
      plateH,
      body.thumbnail_url ?? null,
      Boolean(body.has_committed_thumbnail),
      JSON.stringify(body.xsheet ?? []),
      body.status ?? "draft",
      maxOrder.rows[0].next,
    ],
  );
  return NextResponse.json(result.rows[0], { status: 201 });
}
