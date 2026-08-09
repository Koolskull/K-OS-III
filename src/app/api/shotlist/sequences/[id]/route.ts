import { NextResponse } from "next/server";
import { requireUserId, isSequenceOwner } from "@/lib/api-auth";
import { pool } from "@/lib/db";

const SHOT_COLUMNS = `id, prodev_shot_id, title, description, duration_frames, audio_notes, bg, orientation,
  plate_w, plate_h, thumbnail_url, has_committed_thumbnail, xsheet, status, sort_order`;

/** Full sequence + all its shots. */
export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const userId = await requireUserId();
  if (!userId) return NextResponse.json({ error: "Not signed in" }, { status: 401 });

  const { id } = await params;
  const sequenceId = Number(id);
  if (!Number.isInteger(sequenceId)) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (!(await isSequenceOwner(sequenceId, userId))) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const [seq, shots] = await Promise.all([
    pool.query(`SELECT id, name, fps, project_id FROM shotlist_sequences WHERE id = $1`, [sequenceId]),
    pool.query(
      `SELECT ${SHOT_COLUMNS} FROM shotlist_shots WHERE sequence_id = $1 ORDER BY sort_order, id`,
      [sequenceId],
    ),
  ]);
  if (seq.rowCount === 0) return NextResponse.json({ error: "Not found" }, { status: 404 });

  return NextResponse.json({ ...seq.rows[0], shots: shots.rows });
}

interface SequencePatch {
  name?: string;
  fps?: number;
  project_id?: number | null;
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const userId = await requireUserId();
  if (!userId) return NextResponse.json({ error: "Not signed in" }, { status: 401 });

  const { id } = await params;
  const sequenceId = Number(id);
  if (!Number.isInteger(sequenceId)) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (!(await isSequenceOwner(sequenceId, userId))) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const body = (await req.json()) as SequencePatch;
  const name = typeof body.name === "string" ? body.name.trim().slice(0, 255) : undefined;
  const fps = typeof body.fps === "number" ? body.fps : undefined;
  const projectId = body.project_id === null ? null : body.project_id != null ? Number(body.project_id) : undefined;

  const result = await pool.query(
    `UPDATE shotlist_sequences SET
       name = COALESCE($2, name),
       fps = COALESCE($3, fps),
       project_id = CASE WHEN $4::boolean THEN $5 ELSE project_id END,
       updated_at = now()
     WHERE id = $1
     RETURNING id, name, fps, project_id`,
    [sequenceId, name, fps, projectId !== undefined, projectId ?? null],
  );
  return NextResponse.json(result.rows[0]);
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const userId = await requireUserId();
  if (!userId) return NextResponse.json({ error: "Not signed in" }, { status: 401 });

  const { id } = await params;
  const sequenceId = Number(id);
  if (!Number.isInteger(sequenceId)) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (!(await isSequenceOwner(sequenceId, userId))) return NextResponse.json({ error: "Not found" }, { status: 404 });

  await pool.query(`DELETE FROM shotlist_sequences WHERE id = $1`, [sequenceId]);
  return NextResponse.json({ ok: true });
}
