import { NextResponse } from "next/server";
import { requireUserId } from "@/lib/api-auth";
import { pool } from "@/lib/db";
import { purgeExpiredEphemeral } from "@/lib/chat/ephemeral";

/** List ephemeral threads for the signed-in user (text-only 48h notes). */
export async function GET() {
  const userId = await requireUserId();
  if (!userId) return NextResponse.json({ error: "Not signed in" }, { status: 401 });
  await purgeExpiredEphemeral();

  const result = await pool.query(
    `SELECT t.id, t.kind, t.title, t.created_at,
            (SELECT body FROM chat_ephemeral_messages m
             WHERE m.thread_id = t.id ORDER BY m.id DESC LIMIT 1) AS last_body
     FROM chat_ephemeral_threads t
     JOIN chat_ephemeral_members mem ON mem.thread_id = t.id
     WHERE mem.user_id = $1
     ORDER BY t.created_at DESC
     LIMIT 50`,
    [Number(userId)],
  );
  return NextResponse.json({
    threads: result.rows,
    note: "TEXT ONLY · AUTO-DELETE 48H · NOT MATRIX · NOT XMTP · NO MEDIA",
  });
}

/** Open or create a DM with peerUserId, or create a group with member ids. */
export async function POST(req: Request) {
  const userId = await requireUserId();
  if (!userId) return NextResponse.json({ error: "Not signed in" }, { status: 401 });

  let body: { peerUserId?: number; memberUserIds?: number[]; title?: string; kind?: "dm" | "group" };
  try {
    body = (await req.json()) as typeof body;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const kind = body.kind === "group" ? "group" : "dm";
  const uid = Number(userId);

  if (kind === "dm") {
    const peer = Number(body.peerUserId);
    if (!Number.isInteger(peer) || peer === uid) {
      return NextResponse.json({ error: "peerUserId required" }, { status: 400 });
    }
    // Find existing 1:1
    const existing = await pool.query(
      `SELECT t.id FROM chat_ephemeral_threads t
       WHERE t.kind = 'dm'
         AND EXISTS (SELECT 1 FROM chat_ephemeral_members m WHERE m.thread_id = t.id AND m.user_id = $1)
         AND EXISTS (SELECT 1 FROM chat_ephemeral_members m WHERE m.thread_id = t.id AND m.user_id = $2)
         AND (SELECT COUNT(*) FROM chat_ephemeral_members m WHERE m.thread_id = t.id) = 2
       LIMIT 1`,
      [uid, peer],
    );
    if (existing.rows[0]) {
      return NextResponse.json({ threadId: existing.rows[0].id, kind: "dm" });
    }
    const client = await pool.connect();
    try {
      await client.query("BEGIN");
      const t = await client.query(
        `INSERT INTO chat_ephemeral_threads (kind) VALUES ('dm') RETURNING id`,
      );
      const tid = t.rows[0].id as number;
      await client.query(`INSERT INTO chat_ephemeral_members (thread_id, user_id) VALUES ($1,$2),($1,$3)`, [
        tid,
        uid,
        peer,
      ]);
      await client.query("COMMIT");
      return NextResponse.json({ threadId: tid, kind: "dm" });
    } catch (e) {
      await client.query("ROLLBACK");
      throw e;
    } finally {
      client.release();
    }
  }

  // group
  const members = Array.isArray(body.memberUserIds)
    ? body.memberUserIds.map(Number).filter((n) => Number.isInteger(n) && n !== uid)
    : [];
  if (members.length < 1) {
    return NextResponse.json({ error: "group needs memberUserIds" }, { status: 400 });
  }
  const title = typeof body.title === "string" ? body.title.slice(0, 255) : "Group";
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const t = await client.query(
      `INSERT INTO chat_ephemeral_threads (kind, title) VALUES ('group', $1) RETURNING id`,
      [title],
    );
    const tid = t.rows[0].id as number;
    await client.query(`INSERT INTO chat_ephemeral_members (thread_id, user_id) VALUES ($1,$2)`, [tid, uid]);
    for (const m of members) {
      await client.query(
        `INSERT INTO chat_ephemeral_members (thread_id, user_id) VALUES ($1,$2) ON CONFLICT DO NOTHING`,
        [tid, m],
      );
    }
    await client.query("COMMIT");
    return NextResponse.json({ threadId: tid, kind: "group", title });
  } catch (e) {
    await client.query("ROLLBACK");
    throw e;
  } finally {
    client.release();
  }
}

