import { NextResponse } from "next/server";
import { requireUserId, isShotMember } from "@/lib/api-auth";
import { pool } from "@/lib/db";

/** Flat list of a shot's checklist items — client assembles the tree via parent_id. ?shotId=<id> */
export async function GET(req: Request) {
  const userId = await requireUserId();
  if (!userId) return NextResponse.json({ error: "Not signed in" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const shotId = Number(searchParams.get("shotId"));
  if (!Number.isInteger(shotId)) return NextResponse.json({ error: "shotId is required" }, { status: 400 });
  if (!(await isShotMember(shotId, userId))) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const [items, assets] = await Promise.all([
    pool.query(
      `SELECT i.id, i.parent_id, i.title, i.status, i.owner_id, i.hours, i.contribution_percent, i.sort_order,
              COALESCE(p.display_name, u.name) AS owner_name
       FROM prodev_checklist_items i
       LEFT JOIN users u ON u.id = i.owner_id
       LEFT JOIN profiles p ON p.user_id = i.owner_id
       WHERE i.shot_id = $1
       ORDER BY i.sort_order, i.id`,
      [shotId],
    ),
    pool.query(
      `SELECT a.item_id, a.asset_path FROM prodev_checklist_item_assets a
       JOIN prodev_checklist_items i ON i.id = a.item_id
       WHERE i.shot_id = $1`,
      [shotId],
    ),
  ]);

  const assetsByItem = new Map<number, string[]>();
  for (const row of assets.rows) {
    const list = assetsByItem.get(row.item_id) ?? [];
    list.push(row.asset_path);
    assetsByItem.set(row.item_id, list);
  }

  return NextResponse.json(items.rows.map((row) => ({ ...row, assets: assetsByItem.get(row.id) ?? [] })));
}

/** Create a checklist item under a shot (optionally nested under parentId). */
export async function POST(req: Request) {
  const userId = await requireUserId();
  if (!userId) return NextResponse.json({ error: "Not signed in" }, { status: 401 });

  const body = (await req.json()) as { shotId?: number; parentId?: number | null; title?: string };
  const shotId = Number(body.shotId);
  const title = (body.title ?? "").trim().slice(0, 500);
  const parentId = body.parentId != null ? Number(body.parentId) : null;
  if (!Number.isInteger(shotId)) return NextResponse.json({ error: "shotId is required" }, { status: 400 });
  if (!title) return NextResponse.json({ error: "Title is required" }, { status: 400 });
  if (!(await isShotMember(shotId, userId))) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const maxOrder = await pool.query(
    `SELECT COALESCE(MAX(sort_order), -1) + 1 AS next FROM prodev_checklist_items WHERE shot_id = $1`,
    [shotId],
  );
  const result = await pool.query(
    `INSERT INTO prodev_checklist_items (shot_id, parent_id, title, sort_order)
     VALUES ($1, $2, $3, $4)
     RETURNING id, parent_id, title, status, owner_id, hours, contribution_percent, sort_order`,
    [shotId, parentId, title, maxOrder.rows[0].next],
  );
  return NextResponse.json({ ...result.rows[0], owner_name: null, assets: [] }, { status: 201 });
}
