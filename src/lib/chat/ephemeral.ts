import { pool } from "@/lib/db";

/** Server notes: text-only, 48h TTL. Not Matrix, not XMTP. */
export const EPHEMERAL_TTL_MS = 48 * 60 * 60 * 1000;
export const EPHEMERAL_MAX_BODY = 2000;

export async function purgeExpiredEphemeral(): Promise<void> {
  await pool.query(`DELETE FROM chat_ephemeral_messages WHERE expires_at < now()`);
}
