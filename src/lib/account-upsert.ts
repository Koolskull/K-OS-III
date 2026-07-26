/*
 *                    ☦
 *        ACCOUNTS — SHARED PROVIDER UPSERT
 *
 *   Every identity method (Matrix, Ethereum, ...) ends the same way: link a
 *   verified external identity to a K-OS users/accounts row, seeding a blank
 *   profiles row the first time. Credentials providers in Auth.js don't get
 *   the automatic OAuth account-linking flow, so this is done by hand
 *   directly against Postgres (see db/schema.sql).
 */

import { pool } from "@/lib/db";

export async function upsertProviderUser(
  provider: string,
  providerAccountId: string,
  displayName: string,
): Promise<{ id: string; name: string }> {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const existing = await client.query(
      `SELECT u.id FROM users u
       JOIN accounts a ON a."userId" = u.id
       WHERE a.provider = $1 AND a."providerAccountId" = $2`,
      [provider, providerAccountId],
    );

    let userId: number;
    if (existing.rowCount && existing.rowCount > 0) {
      userId = existing.rows[0].id;
    } else {
      const inserted = await client.query(
        `INSERT INTO users (name) VALUES ($1) RETURNING id`,
        [displayName],
      );
      userId = inserted.rows[0].id;
      await client.query(
        `INSERT INTO accounts ("userId", type, provider, "providerAccountId")
         VALUES ($1, 'credentials', $2, $3)`,
        [userId, provider, providerAccountId],
      );
      await client.query(
        `INSERT INTO profiles (user_id, display_name) VALUES ($1, $2)
         ON CONFLICT (user_id) DO NOTHING`,
        [userId, displayName],
      );
    }
    await client.query("COMMIT");
    return { id: String(userId), name: displayName };
  } catch (e) {
    await client.query("ROLLBACK");
    throw e;
  } finally {
    client.release();
  }
}
