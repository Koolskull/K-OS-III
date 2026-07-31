import { NextResponse } from "next/server";
import { requireUserId } from "@/lib/api-auth";
import { pool } from "@/lib/db";
import { saveUploadedAsset, UploadError } from "@/lib/uploads";

const ASSET_KINDS = new Set(["kooldraw_project", "datamoshpit_render", "image", "audio"]);

/** My asset library, optionally filtered by ?kind=. */
export async function GET(req: Request) {
  const userId = await requireUserId();
  if (!userId) return NextResponse.json({ error: "Not signed in" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const kind = searchParams.get("kind");

  const result = await pool.query(
    `SELECT id, kind, title, thumbnail_url, file_path, created_at FROM user_assets
     WHERE owner_id = $1 AND ($2::text IS NULL OR kind = $2)
     ORDER BY created_at DESC`,
    [userId, kind && ASSET_KINDS.has(kind) ? kind : null],
  );
  return NextResponse.json(result.rows);
}

/** Upload a plain image/audio asset into the library (multipart/form-data: file, kind, title). */
export async function POST(req: Request) {
  const userId = await requireUserId();
  if (!userId) return NextResponse.json({ error: "Not signed in" }, { status: 401 });

  const form = await req.formData().catch(() => null);
  if (!form) return NextResponse.json({ error: "Expected multipart/form-data" }, { status: 400 });

  const file = form.get("file");
  const kind = String(form.get("kind") ?? "");
  const title = String(form.get("title") ?? "").trim().slice(0, 255);
  if (!(file instanceof File)) return NextResponse.json({ error: "file is required" }, { status: 400 });
  if (kind !== "image" && kind !== "audio") return NextResponse.json({ error: "kind must be image or audio" }, { status: 400 });
  if (!title) return NextResponse.json({ error: "title is required" }, { status: 400 });

  let urlPath: string;
  try {
    urlPath = await saveUploadedAsset(kind, file);
  } catch (err) {
    if (err instanceof UploadError) return NextResponse.json({ error: err.message }, { status: 400 });
    return NextResponse.json({ error: "Upload failed." }, { status: 500 });
  }

  const result = await pool.query(
    `INSERT INTO user_assets (owner_id, kind, title, file_path) VALUES ($1, $2, $3, $4)
     RETURNING id, kind, title, thumbnail_url, file_path, created_at`,
    [userId, kind, title, urlPath],
  );
  return NextResponse.json(result.rows[0], { status: 201 });
}
