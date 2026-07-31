import { NextResponse } from "next/server";
import { requireUserId, isChecklistItemMember } from "@/lib/api-auth";
import { pool } from "@/lib/db";

/** A checklist item's clock-in history + running total. ?checklistItemId=<id> */
export async function GET(req: Request) {
  const userId = await requireUserId();
  if (!userId) return NextResponse.json({ error: "Not signed in" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const itemId = Number(searchParams.get("checklistItemId"));
  if (!Number.isInteger(itemId)) {
    return NextResponse.json({ error: "checklistItemId is required" }, { status: 400 });
  }
  if (!(await isChecklistItemMember(itemId, userId))) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const [entries, total] = await Promise.all([
    pool.query(
      `SELECT te.id, te.user_id, te.clock_in, te.clock_out, COALESCE(p.display_name, u.name) AS user_name
       FROM prodev_time_entries te
       LEFT JOIN users u ON u.id = te.user_id
       LEFT JOIN profiles p ON p.user_id = te.user_id
       WHERE te.checklist_item_id = $1
       ORDER BY te.clock_in DESC`,
      [itemId],
    ),
    pool.query(
      `SELECT COALESCE(SUM(EXTRACT(EPOCH FROM (COALESCE(clock_out, now()) - clock_in))), 0) AS seconds
       FROM prodev_time_entries WHERE checklist_item_id = $1`,
      [itemId],
    ),
  ]);

  return NextResponse.json({
    entries: entries.rows,
    totalSeconds: Number(total.rows[0].seconds),
  });
}

/** Clock in — creates an open entry. 409s if this user already has one open on this item. */
export async function POST(req: Request) {
  const userId = await requireUserId();
  if (!userId) return NextResponse.json({ error: "Not signed in" }, { status: 401 });

  const body = (await req.json().catch(() => null)) as { checklistItemId?: number } | null;
  const itemId = Number(body?.checklistItemId);
  if (!Number.isInteger(itemId)) {
    return NextResponse.json({ error: "checklistItemId is required" }, { status: 400 });
  }
  if (!(await isChecklistItemMember(itemId, userId))) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const existing = await pool.query(
    `SELECT id FROM prodev_time_entries WHERE checklist_item_id = $1 AND user_id = $2 AND clock_out IS NULL`,
    [itemId, userId],
  );
  if (existing.rowCount && existing.rowCount > 0) {
    return NextResponse.json({ error: "Already clocked in on this item." }, { status: 409 });
  }

  const result = await pool.query(
    `INSERT INTO prodev_time_entries (checklist_item_id, user_id) VALUES ($1, $2)
     RETURNING id, user_id, clock_in, clock_out`,
    [itemId, userId],
  );
  return NextResponse.json(result.rows[0], { status: 201 });
}
