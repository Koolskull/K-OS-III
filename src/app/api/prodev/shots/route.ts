import { NextResponse } from "next/server";
import { requireUserId, isProjectMember } from "@/lib/api-auth";
import { pool } from "@/lib/db";

/** Shots within a project — ?projectId=<id> */
export async function GET(req: Request) {
  const userId = await requireUserId();
  if (!userId) return NextResponse.json({ error: "Not signed in" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const projectId = Number(searchParams.get("projectId"));
  if (!Number.isInteger(projectId)) return NextResponse.json({ error: "projectId is required" }, { status: 400 });
  if (!(await isProjectMember(projectId, userId))) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const result = await pool.query(
    `SELECT id, title, sort_order, created_at FROM prodev_shots WHERE project_id = $1 ORDER BY sort_order, id`,
    [projectId],
  );
  return NextResponse.json(result.rows);
}

/** Create a shot within a project. */
export async function POST(req: Request) {
  const userId = await requireUserId();
  if (!userId) return NextResponse.json({ error: "Not signed in" }, { status: 401 });

  const body = (await req.json()) as { projectId?: number; title?: string };
  const projectId = Number(body.projectId);
  const title = (body.title ?? "").trim().slice(0, 500);
  if (!Number.isInteger(projectId)) return NextResponse.json({ error: "projectId is required" }, { status: 400 });
  if (!title) return NextResponse.json({ error: "Title is required" }, { status: 400 });
  if (!(await isProjectMember(projectId, userId))) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const maxOrder = await pool.query(
    `SELECT COALESCE(MAX(sort_order), -1) + 1 AS next FROM prodev_shots WHERE project_id = $1`,
    [projectId],
  );
  const result = await pool.query(
    `INSERT INTO prodev_shots (project_id, title, sort_order) VALUES ($1, $2, $3)
     RETURNING id, title, sort_order, created_at`,
    [projectId, title, maxOrder.rows[0].next],
  );
  return NextResponse.json(result.rows[0], { status: 201 });
}
