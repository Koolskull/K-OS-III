import { NextResponse } from "next/server";
import { requireUserId } from "@/lib/api-auth";
import { pool } from "@/lib/db";

const MAX_PROJECT_BYTES = 50 * 1024 * 1024;

async function isProjectOwner(projectId: number, userId: string): Promise<boolean> {
  const result = await pool.query(`SELECT 1 FROM kooldraw_projects WHERE id = $1 AND owner_id = $2`, [
    projectId,
    userId,
  ]);
  return (result.rowCount ?? 0) > 0;
}

/** Full project bytes + metadata, for loading back into the editor. */
export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const userId = await requireUserId();
  if (!userId) return NextResponse.json({ error: "Not signed in" }, { status: 401 });

  const { id } = await params;
  const projectId = Number(id);
  if (!Number.isInteger(projectId)) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const result = await pool.query(
    `SELECT name, width, height, project_data FROM kooldraw_projects WHERE id = $1 AND owner_id = $2`,
    [projectId, userId],
  );
  if (result.rowCount === 0) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const row = result.rows[0];
  return new NextResponse(row.project_data, {
    headers: {
      "Content-Type": "application/zip",
      "Content-Disposition": `attachment; filename="${encodeURIComponent(row.name)}.zip"`,
    },
  });
}

/** Overwrite an existing project's data (multipart/form-data: file, name, width, height, thumbnail). */
export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const userId = await requireUserId();
  if (!userId) return NextResponse.json({ error: "Not signed in" }, { status: 401 });

  const { id } = await params;
  const projectId = Number(id);
  if (!Number.isInteger(projectId)) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (!(await isProjectOwner(projectId, userId))) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const form = await req.formData().catch(() => null);
  if (!form) return NextResponse.json({ error: "Expected multipart/form-data" }, { status: 400 });

  const file = form.get("file");
  const name = String(form.get("name") ?? "").trim().slice(0, 255) || "UNTITLED";
  const width = Number(form.get("width"));
  const height = Number(form.get("height"));
  const thumbnail = form.get("thumbnail");
  if (!(file instanceof File)) return NextResponse.json({ error: "file is required" }, { status: 400 });
  if (file.size === 0) return NextResponse.json({ error: "Empty project data" }, { status: 400 });
  if (file.size > MAX_PROJECT_BYTES) return NextResponse.json({ error: "Project too large" }, { status: 400 });

  const bytes = Buffer.from(await file.arrayBuffer());
  const thumbnailUrl = typeof thumbnail === "string" && thumbnail ? thumbnail : null;

  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const project = await client.query(
      `UPDATE kooldraw_projects SET name = $2, width = $3, height = $4, thumbnail_url = $5, project_data = $6, updated_at = now()
       WHERE id = $1
       RETURNING id, name, width, height, thumbnail_url, updated_at`,
      [projectId, name, width, height, thumbnailUrl, bytes],
    );
    await client.query(
      `UPDATE user_assets SET title = $2, thumbnail_url = $3 WHERE kooldraw_project_id = $1`,
      [projectId, name, thumbnailUrl],
    );
    await client.query("COMMIT");
    return NextResponse.json(project.rows[0]);
  } catch (e) {
    await client.query("ROLLBACK");
    throw e;
  } finally {
    client.release();
  }
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const userId = await requireUserId();
  if (!userId) return NextResponse.json({ error: "Not signed in" }, { status: 401 });

  const { id } = await params;
  const projectId = Number(id);
  if (!Number.isInteger(projectId)) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (!(await isProjectOwner(projectId, userId))) return NextResponse.json({ error: "Not found" }, { status: 404 });

  await pool.query(`DELETE FROM kooldraw_projects WHERE id = $1`, [projectId]);
  return NextResponse.json({ ok: true });
}
