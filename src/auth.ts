/*
 *                    ☦
 *        ACCOUNTS — AUTH.JS CONFIG
 *
 *   Five identity methods (see docs/ACCOUNTS_SPEC.md § 2):
 *   - Google, X: standard OAuth, for the lowest-friction "just click a
 *     button" onboarding path. These go through @auth/pg-adapter, which
 *     handles the users/accounts upsert automatically — db/schema.sql's
 *     users/accounts/sessions/verification_token tables are already shaped
 *     to match exactly what the adapter expects.
 *   - Email + password: our own credentials, for people who don't want to
 *     link a third-party account at all. See src/lib/password-auth.ts and
 *     /api/auth/register (sign-up is a separate step here, unlike the other
 *     four methods, since nothing external already verified the identity).
 *   - Matrix: signing in with an existing Matrix account (matrix.org or any
 *     self-hosted homeserver) IS how a K-OS account gets created.
 *   - Ethereum: Sign-In With Ethereum (EIP-4361), verified via the `siwe`
 *     reference library (see docs/K_WALLET_SPEC.md § 5, § 7).
 *
 *   Session strategy is JWT, not database sessions — Credentials-style
 *   providers in Auth.js don't get the automatic OAuth account-linking flow
 *   (and JWT sessions are required for Credentials providers to work at
 *   all), so Matrix/Ethereum/email-password's `authorize()` do the
 *   users/accounts upsert by hand (src/lib/account-upsert.ts,
 *   src/lib/password-auth.ts). Google/X don't need that — the adapter does
 *   it for them — but they still end up in the same `users` table, so
 *   `events.createUser` below seeds the same blank `profiles` row Matrix/
 *   Ethereum sign-in creates by hand, keeping every method's users
 *   consistent.
 *
 *   Google/X are only registered as providers when their env vars are
 *   actually set, so an unconfigured deploy doesn't advertise a sign-in
 *   button that would just fail at the callback — see .env.local.example.
 */

import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import Google from "next-auth/providers/google";
import Twitter from "next-auth/providers/twitter";
import PostgresAdapter from "@auth/pg-adapter";
import type { Provider } from "next-auth/providers";
import { pool } from "@/lib/db";
import { upsertProviderUser } from "@/lib/account-upsert";
import { matrixVerifyIdentity, MatrixLoginError } from "@/lib/matrix-auth";
import { verifySiwe, SiweVerifyError, SIWE_NONCE_COOKIE } from "@/lib/ethereum-auth";
import { verifyPassword } from "@/lib/password-auth";

const oauthProviders: Provider[] = [];
if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
  oauthProviders.push(
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    }),
  );
}
if (process.env.X_CLIENT_ID && process.env.X_CLIENT_SECRET) {
  oauthProviders.push(
    // OAuth 2.0 is this provider's default (not OAuth 1.0a) as of this
    // next-auth version — matches what the X Developer Portal issues today.
    Twitter({
      clientId: process.env.X_CLIENT_ID,
      clientSecret: process.env.X_CLIENT_SECRET,
    }),
  );
}

/** Minimal same-name cookie parse — we only ever set this one ourselves (see /api/ethereum/nonce). */
function readCookie(cookieHeader: string | null, name: string): string | undefined {
  if (!cookieHeader) return undefined;
  for (const part of cookieHeader.split(";")) {
    const [k, ...rest] = part.trim().split("=");
    if (k === name) return decodeURIComponent(rest.join("="));
  }
  return undefined;
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  trustHost: true,
  adapter: PostgresAdapter(pool),
  session: { strategy: "jwt" },
  providers: [
    ...oauthProviders,
    Credentials({
      id: "email",
      name: "Email",
      credentials: {
        email: { label: "Email", type: "text" },
        password: { label: "Password", type: "password" },
      },
      async authorize(raw) {
        const email = typeof raw?.email === "string" ? raw.email : "";
        const password = typeof raw?.password === "string" ? raw.password : "";
        if (!email || !password) return null;

        const user = await verifyPassword(email, password);
        if (!user) throw new Error("Incorrect email or password.");
        return user;
      },
    }),
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
          if (err instanceof MatrixLoginError) throw new Error(err.message);
          throw new Error("Matrix login failed.");
        }

        return upsertProviderUser("matrix", matrixUserId, matrixUserId);
      },
    }),
    Credentials({
      id: "ethereum",
      name: "Ethereum",
      credentials: {
        message: { label: "Message", type: "text" },
        signature: { label: "Signature", type: "text" },
      },
      async authorize(raw, request) {
        const message = typeof raw?.message === "string" ? raw.message : "";
        const signature = typeof raw?.signature === "string" ? raw.signature : "";
        if (!message || !signature) return null;

        const nonce = readCookie(request.headers.get("cookie"), SIWE_NONCE_COOKIE);

        let address: string;
        try {
          address = await verifySiwe(message, signature, nonce);
        } catch (err) {
          if (err instanceof SiweVerifyError) throw new Error(err.message);
          throw new Error("Ethereum sign-in failed.");
        }

        return upsertProviderUser("ethereum", address, address);
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
  events: {
    // Only fires for adapter-managed sign-ins (Google/X) — Matrix/Ethereum/
    // email-password seed their own `profiles` row inside their own
    // authorize()/register handlers, since those never touch the adapter.
    async createUser({ user }) {
      if (!user.id) return;
      await pool.query(
        `INSERT INTO profiles (user_id, display_name) VALUES ($1, $2)
         ON CONFLICT (user_id) DO NOTHING`,
        [user.id, user.name ?? null],
      );
    },
  },
  pages: {
    signIn: "/account",
  },
});
