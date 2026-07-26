/*
 *                    ☦
 *        ACCOUNTS — AUTH.JS CONFIG
 *
 *   Matrix-first identity (see docs/ACCOUNTS_SPEC.md § 2): signing in with an
 *   existing Matrix account (matrix.org or any self-hosted homeserver) IS
 *   how a K-OS account gets created — no separate email/password system of
 *   our own to manage. Ethereum wallet sign-in (SIWE) is next priority,
 *   layered in as an additional Credentials provider once this is stable.
 *
 *   Session strategy is JWT, not database sessions — Credentials-style
 *   providers in Auth.js don't get the automatic OAuth account-linking flow,
 *   so `authorize()` below does the users/accounts upsert itself, directly
 *   against Postgres (see db/schema.sql), and the `sessions` table goes
 *   unused for this provider.
 */

import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { pool } from "@/lib/db";
import { matrixVerifyIdentity, MatrixLoginError } from "@/lib/matrix-auth";

export const { handlers, auth, signIn, signOut } = NextAuth({
  session: { strategy: "jwt" },
  providers: [
    Credentials({
      id: "matrix",
      name: "Matrix",
      credentials: {
        homeserver: { label: "Homeserver", type: "text" },
        username: { label: "Matrix username", type: "text" },
        password: { label: "Password", type: "password" },
      },
      async authorize(raw) {
        const homeserver = typeof raw?.homeserver === "string" ? raw.homeserver : "";
        const username = typeof raw?.username === "string" ? raw.username : "";
        const password = typeof raw?.password === "string" ? raw.password : "";
        if (!homeserver || !username || !password) return null;

        let matrixUserId: string;
        try {
          matrixUserId = await matrixVerifyIdentity(homeserver, username, password);
        } catch (err) {
          if (err instanceof MatrixLoginError) {
            throw new Error(err.message);
          }
          throw new Error("Matrix login failed.");
        }

        // Upsert the users row keyed by the linked Matrix account, then
        // ensure a blank profiles row exists (edited later via /api/profile).
        const client = await pool.connect();
        try {
          await client.query("BEGIN");
          const existing = await client.query(
            `SELECT u.id FROM users u
             JOIN accounts a ON a."userId" = u.id
             WHERE a.provider = 'matrix' AND a."providerAccountId" = $1`,
            [matrixUserId],
          );

          let userId: number;
          if (existing.rowCount && existing.rowCount > 0) {
            userId = existing.rows[0].id;
          } else {
            const inserted = await client.query(
              `INSERT INTO users (name) VALUES ($1) RETURNING id`,
              [matrixUserId],
            );
            userId = inserted.rows[0].id;
            await client.query(
              `INSERT INTO accounts ("userId", type, provider, "providerAccountId")
               VALUES ($1, 'credentials', 'matrix', $2)`,
              [userId, matrixUserId],
            );
            await client.query(
              `INSERT INTO profiles (user_id, display_name) VALUES ($1, $2)
               ON CONFLICT (user_id) DO NOTHING`,
              [userId, matrixUserId],
            );
          }
          await client.query("COMMIT");
          return { id: String(userId), name: matrixUserId };
        } catch (e) {
          await client.query("ROLLBACK");
          throw e;
        } finally {
          client.release();
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user?.id) token.userId = user.id;
      return token;
    },
    async session({ session, token }) {
      if (token.userId && session.user) {
        (session.user as { id?: string }).id = token.userId as string;
      }
      return session;
    },
  },
  pages: {
    signIn: "/account",
  },
});
