import { NextResponse } from "next/server";
import { requireUserId } from "@/lib/api-auth";
import { pool } from "@/lib/db";

const MAX_PROJECT_BYTES = 50 * 1024 * 1024; // 50MB — generous for pixel-art bundles

/** My saved KoolDraw projects (metadata only — no project_data bytes). */
export async function GET() {
  const userId = await requireUserId();
  if (!userId) return NextResponse.json({ error: "Not signed in" }, { status: 401 });

  const result = await pool.query(
    `SELECT id, name, width, height, thumbnail_url, updated_at FROM kooldraw_projects
     WHERE owner_id = $1 ORDER BY updated_at DESC`,
    [userId],
  );
  return NextResponse.json(result.rows);
}

/** Save a new project (multipart/form-data: file [zip], name, width, height, thumbnail [data URL]). */
export async function POST(req: Request) {
  const userId = await requireUserId();
  if (!userId) return NextResponse.json({ error: "Not signed in" }, { status: 401 });

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
  if (!Number.isInteger(width) || !Number.isInteger(height)) {
    return NextResponse.json({ error: "width/height are required" }, { status: 400 });
  }

  const bytes = Buffer.from(await file.arrayBuffer());
  const thumbnailUrl = typeof thumbnail === "string" && thumbnail ? thumbnail : null;

  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const project = await client.query(
      `INSERT INTO kooldraw_projects (owner_id, name, width, height, thumbnail_url, project_data)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING id, name, width, height, thumbnail_url, updated_at`,
      [userId, name, width, height, thumbnailUrl, bytes],
    );
    const projectId = project.rows[0].id;
    await client.query(
      `INSERT INTO user_assets (owner_id, kind, title, thumbnail_url, kooldraw_project_id)
       VALUES ($1, 'kooldraw_project', $2, $3, $4)`,
      [userId, name, thumbnailUrl, projectId],
    );
    await client.query("COMMIT");
    return NextResponse.json(project.rows[0], { status: 201 });
  } catch (e) {
    await client.query("ROLLBACK");
    throw e;
  } finally {
    client.release();
  }
}
