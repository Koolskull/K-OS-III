/*
 *                    ☦
 *        ACCOUNTS — SHARED PROVIDER UPSERT + OPTIONAL LINK
 *
 *   Every identity method (Matrix, Ethereum, ...) ends the same way: link a
 *   verified external identity to a K-OS users/accounts row, seeding a blank
 *   profiles row the first time. Credentials providers in Auth.js don't get
 *   the automatic OAuth account-linking flow, so this is done by hand
 *   directly against Postgres (see db/schema.sql).
 *
 *   linkProviderToUser is the *optional* path for an already-signed-in user
 *   who wants a second sign-in method on the same portfolio account. Never
 *   required — wallet-only / Matrix-only / email-only are all valid forever.
 */

import { pool } from "@/lib/db";

export class AccountLinkError extends Error {
  status: number;
  constructor(message: string, status = 400) {
    super(message);
    this.name = "AccountLinkError";
    this.status = status;
  }
}

export interface LinkedMethod {
  provider: string;
  providerAccountId: string;
  /** Short label safe to show in the Account UI. */
  label: string;
}

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

function labelFor(provider: string, providerAccountId: string): string {
  if (provider === "ethereum" && providerAccountId.startsWith("0x") && providerAccountId.length > 10) {
    return `${providerAccountId.slice(0, 6)}…${providerAccountId.slice(-4)}`;
  }
  return providerAccountId;
}

/** All linked sign-in methods for a user (no secrets). */
export async function listLinkedMethods(userId: string | number): Promise<LinkedMethod[]> {
  const uid = Number(userId);
  const result = await pool.query(
    `SELECT provider, "providerAccountId" FROM accounts WHERE "userId" = $1 ORDER BY provider, id`,
    [uid],
  );
  // Also surface email-on-users when present but no email account row (legacy).
  const userRow = await pool.query(`SELECT email FROM users WHERE id = $1`, [uid]);
  const email = userRow.rows[0]?.email as string | null | undefined;
  const rows: LinkedMethod[] = result.rows.map((r: { provider: string; providerAccountId: string }) => ({
    provider: r.provider,
    providerAccountId: r.providerAccountId,
    label: labelFor(r.provider, r.providerAccountId),
  }));
  if (email && !rows.some((r) => r.provider === "email" && r.providerAccountId === email)) {
    rows.unshift({ provider: "email", providerAccountId: email, label: email });
  }
  return rows;
}

/**
 * Attach a verified external identity to an existing K-OS user.
 * Throws AccountLinkError on conflict with another user.
 */
export async function linkProviderToUser(
  userId: string | number,
  provider: string,
  providerAccountId: string,
  accountType: "credentials" | "oauth" | "oidc" = "credentials",
): Promise<LinkedMethod> {
  const uid = Number(userId);
  if (!Number.isInteger(uid)) throw new AccountLinkError("Invalid user.");
  if (!provider || !providerAccountId) throw new AccountLinkError("Provider and account id required.");

  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const existing = await client.query(
      `SELECT "userId" FROM accounts WHERE provider = $1 AND "providerAccountId" = $2`,
      [provider, providerAccountId],
    );
    if (existing.rowCount && existing.rowCount > 0) {
      const owner = Number(existing.rows[0].userId);
      if (owner === uid) {
        await client.query("COMMIT");
        return { provider, providerAccountId, label: labelFor(provider, providerAccountId) };
      }
      throw new AccountLinkError(
        "That identity is already connected to a different K-OS account.",
        409,
      );
    }
    await client.query(
      `INSERT INTO accounts ("userId", type, provider, "providerAccountId")
       VALUES ($1, $2, $3, $4)`,
      [uid, accountType, provider, providerAccountId],
    );
    await client.query("COMMIT");
    return { provider, providerAccountId, label: labelFor(provider, providerAccountId) };
  } catch (e) {
    await client.query("ROLLBACK");
    throw e;
  } finally {
    client.release();
  }
}

/**
 * Remove one linked method. Refuses if it would leave the user with zero
 * sign-in paths (accounts rows + users.email/password).
 */
export async function unlinkProviderFromUser(
  userId: string | number,
  provider: string,
  providerAccountId: string,
): Promise<void> {
  const uid = Number(userId);
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const methods = await client.query(
      `SELECT id, provider, "providerAccountId" FROM accounts WHERE "userId" = $1`,
      [uid],
    );
    const userRow = await client.query(
      `SELECT email, password_hash FROM users WHERE id = $1`,
      [uid],
    );
    const hasPassword = Boolean(userRow.rows[0]?.password_hash && userRow.rows[0]?.email);

    const match = methods.rows.find(
      (r: { provider: string; providerAccountId: string }) =>
        r.provider === provider && r.providerAccountId === providerAccountId,
    );

    // Unlinking "email" may mean clearing users.email when there is no accounts row.
    if (!match && provider === "email") {
      const remainingAccounts = methods.rowCount ?? 0;
      if (remainingAccounts < 1) {
        throw new AccountLinkError("Cannot remove your only sign-in method.", 400);
      }
      await client.query(
        `UPDATE users SET email = NULL, password_hash = NULL WHERE id = $1`,
        [uid],
      );
      await client.query("COMMIT");
      return;
    }

    if (!match) throw new AccountLinkError("That linked method was not found.", 404);

    const remainingAfter = (methods.rowCount ?? 0) - 1;
    const stillHasPassword =
      hasPassword && !(provider === "email" && providerAccountId === userRow.rows[0]?.email);
    if (remainingAfter < 1 && !stillHasPassword) {
      throw new AccountLinkError("Cannot remove your only sign-in method.", 400);
    }

    await client.query(`DELETE FROM accounts WHERE id = $1`, [match.id]);
    if (provider === "email") {
      await client.query(
        `UPDATE users SET email = NULL, password_hash = NULL WHERE id = $1 AND email = $2`,
        [uid, providerAccountId],
      );
    }
    await client.query("COMMIT");
  } catch (e) {
    await client.query("ROLLBACK");
    throw e;
  } finally {
    client.release();
  }
}
