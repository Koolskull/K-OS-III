import { NextResponse } from "next/server";
import { requireUserId } from "@/lib/api-auth";
import { pool } from "@/lib/db";

/** List my sequences (metadata only — no shots). Optional ?projectId= filter. */
export async function GET(req: Request) {
  const userId = await requireUserId();
  if (!userId) return NextResponse.json({ error: "Not signed in" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const projectIdParam = searchParams.get("projectId");
  const projectId = projectIdParam != null ? Number(projectIdParam) : null;

  const result = await pool.query(
    `SELECT seq.id, seq.name, seq.fps, seq.project_id, p.name AS project_name, seq.updated_at
     FROM shotlist_sequences seq
     LEFT JOIN prodev_projects p ON p.id = seq.project_id
     WHERE seq.owner_id = $1 AND ($2::int IS NULL OR seq.project_id = $2)
     ORDER BY seq.updated_at DESC`,
    [userId, Number.isInteger(projectId) ? projectId : null],
  );
  return NextResponse.json(result.rows);
}

/** Create a new (empty) sequence. */
export async function POST(req: Request) {
  const userId = await requireUserId();
  if (!userId) return NextResponse.json({ error: "Not signed in" }, { status: 401 });

  const body = (await req.json().catch(() => null)) as { name?: string; fps?: number; projectId?: number | null } | null;
  const name = (body?.name ?? "UNTITLED SEQUENCE").trim().slice(0, 255) || "UNTITLED SEQUENCE";
  const fps = Number.isInteger(body?.fps) ? Number(body?.fps) : 24;
  const projectId = body?.projectId != null ? Number(body.projectId) : null;

  const result = await pool.query(
    `INSERT INTO shotlist_sequences (owner_id, name, fps, project_id) VALUES ($1, $2, $3, $4)
     RETURNING id, name, fps, project_id, updated_at`,
    [userId, name, fps, projectId],
  );
  return NextResponse.json(result.rows[0], { status: 201 });
}
