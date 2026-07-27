import { NextResponse } from "next/server";
import { requireUserId, isChecklistItemMember } from "@/lib/api-auth";
import { pool } from "@/lib/db";

interface ItemPatch {
  title?: string;
  status?: "todo" | "in-progress" | "done";
  owner_id?: number | null;
  hours?: number;
  contribution_percent?: number;
  parent_id?: number | null;
}

const STATUSES = new Set(["todo", "in-progress", "done"]);

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const userId = await requireUserId();
  if (!userId) return NextResponse.json({ error: "Not signed in" }, { status: 401 });

  const { id } = await params;
  const itemId = Number(id);
  if (!Number.isInteger(itemId)) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (!(await isChecklistItemMember(itemId, userId))) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const body = (await req.json()) as ItemPatch;
  const title = typeof body.title === "string" ? body.title.trim().slice(0, 500) : undefined;
  const status = STATUSES.has(body.status as string) ? body.status : undefined;
  const ownerId = body.owner_id === null ? null : body.owner_id != null ? Number(body.owner_id) : undefined;
  const hours = typeof body.hours === "number" ? body.hours : undefined;
  const contributionPercent = typeof body.contribution_percent === "number" ? body.contribution_percent : undefined;
  const parentId = body.parent_id === null ? null : body.parent_id != null ? Number(body.parent_id) : undefined;

  const result = await pool.query(
    `UPDATE prodev_checklist_items SET
       title = COALESCE($2, title),
       status = COALESCE($3, status),
       owner_id = CASE WHEN $4::boolean THEN $5 ELSE owner_id END,
       hours = COALESCE($6, hours),
       contribution_percent = COALESCE($7, contribution_percent),
       parent_id = CASE WHEN $8::boolean THEN $9 ELSE parent_id END,
       updated_at = now()
     WHERE id = $1
     RETURNING id, parent_id, title, status, owner_id, hours, contribution_percent, sort_order`,
    [
      itemId,
      title,
      status,
      ownerId !== undefined,
      ownerId ?? null,
      hours,
      contributionPercent,
      parentId !== undefined,
      parentId ?? null,
    ],
  );
  return NextResponse.json(result.rows[0]);
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const userId = await requireUserId();
  if (!userId) return NextResponse.json({ error: "Not signed in" }, { status: 401 });

  const { id } = await params;
  const itemId = Number(id);
  if (!Number.isInteger(itemId)) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (!(await isChecklistItemMember(itemId, userId))) return NextResponse.json({ error: "Not found" }, { status: 404 });

  // Children cascade via ON DELETE CASCADE on parent_id.
  await pool.query(`DELETE FROM prodev_checklist_items WHERE id = $1`, [itemId]);
  return NextResponse.json({ ok: true });
}
