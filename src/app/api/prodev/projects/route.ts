import { NextResponse } from "next/server";
import { requireUserId } from "@/lib/api-auth";
import { pool } from "@/lib/db";

/** Projects the signed-in user is a member of (owner or contributor). */
export async function GET() {
  const userId = await requireUserId();
  if (!userId) return NextResponse.json({ error: "Not signed in" }, { status: 401 });

  const result = await pool.query(
    `SELECT p.id, p.name, p.owner_id, p.created_at, m.role
     FROM prodev_projects p
     JOIN prodev_members m ON m.project_id = p.id
     WHERE m.user_id = $1
     ORDER BY p.created_at DESC`,
    [userId],
  );
  return NextResponse.json(result.rows);
}

/** Create a project. The creator becomes its owner (and first member). */
export async function POST(req: Request) {
  const userId = await requireUserId();
  if (!userId) return NextResponse.json({ error: "Not signed in" }, { status: 401 });

  const body = (await req.json()) as { name?: string };
  const name = (body.name ?? "").trim().slice(0, 255);
  if (!name) return NextResponse.json({ error: "Name is required" }, { status: 400 });

  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const inserted = await client.query(
      `INSERT INTO prodev_projects (owner_id, name) VALUES ($1, $2) RETURNING id, name, owner_id, created_at`,
      [userId, name],
    );
    const project = inserted.rows[0];
    await client.query(
      `INSERT INTO prodev_members (project_id, user_id, role) VALUES ($1, $2, 'owner')`,
      [project.id, userId],
    );
    await client.query("COMMIT");
    return NextResponse.json(project, { status: 201 });
  } catch (e) {
    await client.query("ROLLBACK");
    throw e;
  } finally {
    client.release();
  }
}
