/*
 *                    ☦
 *        ACCOUNTS — EMAIL + PASSWORD
 *
 *   The lowest-friction sign-in method: no external identity provider, no
 *   wallet extension, no Matrix homeserver — just an email and a password
 *   we hash ourselves (db/schema.sql's users.password_hash). Unlike Matrix/
 *   Ethereum/OAuth, this is the one method where "sign in" and "create
 *   account" are genuinely different actions, since nothing external
 *   already verified the identity — see /api/auth/register.
 */

import bcrypt from "bcryptjs";
import { pool } from "@/lib/db";

const BCRYPT_ROUNDS = 12;

export class EmailAuthError extends Error {}

export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

export function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export async function registerWithPassword(
  rawEmail: string,
  password: string,
  name: string,
): Promise<{ id: string; name: string }> {
  const email = normalizeEmail(rawEmail);
  if (!isValidEmail(email)) throw new EmailAuthError("Enter a valid email address.");
  if (password.length < 8) throw new EmailAuthError("Password must be at least 8 characters.");

  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const existing = await client.query(`SELECT id FROM users WHERE email = $1`, [email]);
    if (existing.rowCount && existing.rowCount > 0) {
      throw new EmailAuthError("An account with that email already exists — sign in instead.");
    }

    const passwordHash = await bcrypt.hash(password, BCRYPT_ROUNDS);
    const displayName = name.trim() || email.split("@")[0];
    const inserted = await client.query(
      `INSERT INTO users (name, email, password_hash) VALUES ($1, $2, $3) RETURNING id`,
      [displayName, email, passwordHash],
    );
    const userId = inserted.rows[0].id;

    await client.query(
      `INSERT INTO accounts ("userId", type, provider, "providerAccountId")
       VALUES ($1, 'credentials', 'email', $2)`,
      [userId, email],
    );
    await client.query(
      `INSERT INTO profiles (user_id, display_name) VALUES ($1, $2)
       ON CONFLICT (user_id) DO NOTHING`,
      [userId, displayName],
    );

    await client.query("COMMIT");
    return { id: String(userId), name: displayName };
  } catch (e) {
    await client.query("ROLLBACK");
    throw e;
  } finally {
    client.release();
  }
}

export async function verifyPassword(
  rawEmail: string,
  password: string,
): Promise<{ id: string; name: string } | null> {
  const email = normalizeEmail(rawEmail);
  const result = await pool.query(
    `SELECT id, name, password_hash FROM users WHERE email = $1`,
    [email],
  );
  const row = result.rows[0];
  if (!row || !row.password_hash) return null;

  const valid = await bcrypt.compare(password, row.password_hash);
  if (!valid) return null;

  return { id: String(row.id), name: row.name ?? email };
}
