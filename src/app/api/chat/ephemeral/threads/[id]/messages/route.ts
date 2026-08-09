import { NextResponse } from "next/server";
import { requireUserId } from "@/lib/api-auth";
import { pool } from "@/lib/db";
import { EPHEMERAL_MAX_BODY, EPHEMERAL_TTL_MS, purgeExpiredEphemeral } from "@/lib/chat/ephemeral";

async function assertMember(threadId: number, userId: number): Promise<boolean> {
  const r = await pool.query(
    `SELECT 1 FROM chat_ephemeral_members WHERE thread_id = $1 AND user_id = $2`,
    [threadId, userId],
  );
  return (r.rowCount ?? 0) > 0;
}

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const userId = await requireUserId();
  if (!userId) return NextResponse.json({ error: "Not signed in" }, { status: 401 });
  const threadId = Number((await params).id);
  if (!Number.isInteger(threadId)) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (!(await assertMember(threadId, Number(userId)))) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  await purgeExpiredEphemeral();

  const result = await pool.query(
    `SELECT m.id, m.sender_id, m.body, m.created_at, m.expires_at,
            COALESCE(p.display_name, u.name) AS sender_name,
            p.avatar_url AS sender_avatar
     FROM chat_ephemeral_messages m
     JOIN users u ON u.id = m.sender_id
     LEFT JOIN profiles p ON p.user_id = m.sender_id
     WHERE m.thread_id = $1 AND m.expires_at > now()
     ORDER BY m.id ASC
     LIMIT 200`,
    [threadId],
  );
  return NextResponse.json({
    messages: result.rows,
    policy: "TEXT_ONLY_48H_NO_MEDIA",
  });
}

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const userId = await requireUserId();
  if (!userId) return NextResponse.json({ error: "Not signed in" }, { status: 401 });
  const threadId = Number((await params).id);
  if (!Number.isInteger(threadId)) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (!(await assertMember(threadId, Number(userId)))) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  let body: { body?: string };
  try {
    body = (await req.json()) as { body?: string };
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const text = typeof body.body === "string" ? body.body.trim().slice(0, EPHEMERAL_MAX_BODY) : "";
  if (!text) return NextResponse.json({ error: "Empty message" }, { status: 400 });
  // Explicit: no media, no URLs that look like data: embeds — plain text only.
  if (/^data:/i.test(text) || text.includes("<img") || text.includes("<video")) {
    return NextResponse.json({ error: "Media not allowed on server notes." }, { status: 400 });
  }

  await purgeExpiredEphemeral();
  const expires = new Date(Date.now() + EPHEMERAL_TTL_MS);
  const inserted = await pool.query(
    `INSERT INTO chat_ephemeral_messages (thread_id, sender_id, body, expires_at)
     VALUES ($1, $2, $3, $4)
     RETURNING id, sender_id, body, created_at, expires_at`,
    [threadId, Number(userId), text, expires.toISOString()],
  );
  return NextResponse.json(inserted.rows[0]);
}
