import { auth } from "@/auth";
import { pool } from "@/lib/db";

/** The signed-in user's DB id, or null if there is no session. */
export async function requireUserId(): Promise<string | null> {
  const session = await auth();
  return (session?.user as { id?: string } | undefined)?.id ?? null;
}

/** Is this user a member (owner or contributor) of this PRODEV project? */
export async function isProjectMember(projectId: number, userId: string): Promise<boolean> {
  const result = await pool.query(
    `SELECT 1 FROM prodev_members WHERE project_id = $1 AND user_id = $2`,
    [projectId, userId],
  );
  return (result.rowCount ?? 0) > 0;
}

/** Is this user a member of the project that owns this shot? */
export async function isShotMember(shotId: number, userId: string): Promise<boolean> {
  const result = await pool.query(
    `SELECT 1 FROM prodev_shots s
     JOIN prodev_members m ON m.project_id = s.project_id
     WHERE s.id = $1 AND m.user_id = $2`,
    [shotId, userId],
  );
  return (result.rowCount ?? 0) > 0;
}

/** Is this user a member of the project that owns this checklist item's shot? */
export async function isChecklistItemMember(itemId: number, userId: string): Promise<boolean> {
  const result = await pool.query(
    `SELECT 1 FROM prodev_checklist_items i
     JOIN prodev_shots s ON s.id = i.shot_id
     JOIN prodev_members m ON m.project_id = s.project_id
     WHERE i.id = $1 AND m.user_id = $2`,
    [itemId, userId],
  );
  return (result.rowCount ?? 0) > 0;
}

/** Does this user own this Shotlist sequence? (single-owner, unlike PRODEV's multi-member projects.) */
export async function isSequenceOwner(sequenceId: number, userId: string): Promise<boolean> {
  const result = await pool.query(
    `SELECT 1 FROM shotlist_sequences WHERE id = $1 AND owner_id = $2`,
    [sequenceId, userId],
  );
  return (result.rowCount ?? 0) > 0;
}

/** Does this user own the sequence that this Shotlist shot belongs to? */
export async function isShotlistShotOwner(shotId: number, userId: string): Promise<boolean> {
  const result = await pool.query(
    `SELECT 1 FROM shotlist_shots sh
     JOIN shotlist_sequences seq ON seq.id = sh.sequence_id
     WHERE sh.id = $1 AND seq.owner_id = $2`,
    [shotId, userId],
  );
  return (result.rowCount ?? 0) > 0;
}

/** Does this user own this library asset? */
export async function isAssetOwner(assetId: number, userId: string): Promise<boolean> {
  const result = await pool.query(`SELECT 1 FROM user_assets WHERE id = $1 AND owner_id = $2`, [assetId, userId]);
  return (result.rowCount ?? 0) > 0;
}
