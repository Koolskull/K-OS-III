import { NextResponse } from "next/server";
import { requireUserId, isShotMember } from "@/lib/api-auth";
import { pool } from "@/lib/db";

/** The finalized credit split for a shot — who gets what % (see docs/ACCOUNTS_SPEC.md § 4). */
export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const userId = await requireUserId();
  if (!userId) return NextResponse.json({ error: "Not signed in" }, { status: 401 });

  const { id } = await params;
  const shotId = Number(id);
  if (!Number.isInteger(shotId)) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (!(await isShotMember(shotId, userId))) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const result = await pool.query(
    `SELECT c.user_id, c.percent, COALESCE(p.display_name, u.name) AS display_name
     FROM prodev_shot_credits c
     JOIN users u ON u.id = c.user_id
     LEFT JOIN profiles p ON p.user_id = c.user_id
     WHERE c.shot_id = $1
     ORDER BY c.percent DESC`,
    [shotId],
  );
  return NextResponse.json(result.rows);
}

/**
 * Replace the shot's credit split wholesale — body: { credits: [{ user_id, percent }] }.
 * K-OS only ever computes/attests this split (docs/ACCOUNTS_SPEC.md § 4) — it is not a
 * payout; nothing here moves money.
 */
export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const userId = await requireUserId();
  if (!userId) return NextResponse.json({ error: "Not signed in" }, { status: 401 });

  const { id } = await params;
  const shotId = Number(id);
  if (!Number.isInteger(shotId)) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (!(await isShotMember(shotId, userId))) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const body = (await req.json()) as { credits?: Array<{ user_id: number; percent: number }> };
  const credits = Array.isArray(body.credits) ? body.credits : [];

  for (const c of credits) {
    if (!Number.isInteger(c.user_id) || typeof c.percent !== "number" || c.percent < 0 || c.percent > 100) {
      return NextResponse.json({ error: "Invalid credit entry" }, { status: 400 });
    }
  }
  const total = credits.reduce((sum, c) => sum + c.percent, 0);
  if (total > 100.001) {
    return NextResponse.json({ error: `Credits sum to ${total}%, which is over 100%` }, { status: 400 });
  }

  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    await client.query(`DELETE FROM prodev_shot_credits WHERE shot_id = $1`, [shotId]);
    for (const c of credits) {
      await client.query(
        `INSERT INTO prodev_shot_credits (shot_id, user_id, percent) VALUES ($1, $2, $3)`,
        [shotId, c.user_id, c.percent],
      );
    }
    await client.query("COMMIT");
  } catch (e) {
    await client.query("ROLLBACK");
    throw e;
  } finally {
    client.release();
  }

  return NextResponse.json({ ok: true });
}
