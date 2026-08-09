import { NextResponse } from "next/server";
import { requireUserId } from "@/lib/api-auth";
import { pool } from "@/lib/db";
import { saveRenderFile, UploadError } from "@/lib/uploads";
import { MAX_RENDER_SECONDS } from "@/lib/datamoshpit/renderCapture";

const MAX_RENDERS_PER_HOUR = 5;

/** My renders. */
export async function GET() {
  const userId = await requireUserId();
  if (!userId) return NextResponse.json({ error: "Not signed in" }, { status: 401 });

  const result = await pool.query(
    `SELECT id, title, kind, duration_seconds, created_at FROM datamoshpit_renders
     WHERE owner_id = $1 ORDER BY created_at DESC`,
    [userId],
  );
  return NextResponse.json(result.rows);
}

/** Upload a finished bounce-to-file render (multipart/form-data: file, title, kind, seconds). */
export async function POST(req: Request) {
  const userId = await requireUserId();
  if (!userId) return NextResponse.json({ error: "Not signed in" }, { status: 401 });

  const recent = await pool.query(
    `SELECT COUNT(*) AS n FROM datamoshpit_renders WHERE owner_id = $1 AND created_at > now() - interval '1 hour'`,
    [userId],
  );
  if (Number(recent.rows[0].n) >= MAX_RENDERS_PER_HOUR) {
    return NextResponse.json({ error: `Render limit reached (${MAX_RENDERS_PER_HOUR}/hour). Try again later.` }, { status: 429 });
  }

  const form = await req.formData().catch(() => null);
  if (!form) return NextResponse.json({ error: "Expected multipart/form-data" }, { status: 400 });

  const file = form.get("file");
  const title = String(form.get("title") ?? "").trim().slice(0, 255) || "UNTITLED RENDER";
  const kind = String(form.get("kind") ?? "audio");
  const seconds = Number(form.get("seconds"));
  if (!(file instanceof File)) return NextResponse.json({ error: "file is required" }, { status: 400 });
  if (kind !== "audio" && kind !== "video") return NextResponse.json({ error: "kind must be audio or video" }, { status: 400 });
  if (!Number.isFinite(seconds) || seconds <= 0) return NextResponse.json({ error: "Invalid duration" }, { status: 400 });
  if (seconds > MAX_RENDER_SECONDS + 5) {
    // +5s slack for stop() round-trip latency — the client already caps at MAX_RENDER_SECONDS
    return NextResponse.json({ error: `Renders are capped at ${MAX_RENDER_SECONDS / 60} minutes.` }, { status: 400 });
  }

  let saved: { urlPath: string; mimeType: string };
  try {
    saved = await saveRenderFile(kind, file);
  } catch (err) {
    if (err instanceof UploadError) return NextResponse.json({ error: err.message }, { status: 400 });
    return NextResponse.json({ error: "Upload failed." }, { status: 500 });
  }

  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const render = await client.query(
      `INSERT INTO datamoshpit_renders (owner_id, title, kind, file_path, mime_type, duration_seconds)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING id, title, kind, duration_seconds, created_at`,
      [userId, title, kind, saved.urlPath, saved.mimeType, seconds],
    );
    const renderId = render.rows[0].id;
    await client.query(
      `INSERT INTO user_assets (owner_id, kind, title, datamoshpit_render_id)
       VALUES ($1, 'datamoshpit_render', $2, $3)`,
      [userId, title, renderId],
    );
    await client.query("COMMIT");
    return NextResponse.json(render.rows[0], { status: 201 });
  } catch (e) {
    await client.query("ROLLBACK");
    throw e;
  } finally {
    client.release();
  }
}
