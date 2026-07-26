/*
 *                    ☦
 *        ACCOUNTS — AUTH.JS CONFIG
 *
 *   Two identity methods (see docs/ACCOUNTS_SPEC.md § 2):
 *   - Matrix: signing in with an existing Matrix account (matrix.org or any
 *     self-hosted homeserver) IS how a K-OS account gets created — no
 *     separate email/password system of our own to manage.
 *   - Ethereum: Sign-In With Ethereum (EIP-4361), verified via the `siwe`
 *     reference library (see docs/K_WALLET_SPEC.md § 5, § 7).
 *
 *   Session strategy is JWT, not database sessions — Credentials-style
 *   providers in Auth.js don't get the automatic OAuth account-linking flow,
 *   so `authorize()` below does the users/accounts upsert itself (see
 *   src/lib/account-upsert.ts), and the `sessions` table goes unused.
 */

import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { upsertProviderUser } from "@/lib/account-upsert";
import { matrixVerifyIdentity, MatrixLoginError } from "@/lib/matrix-auth";
import { verifySiwe, SiweVerifyError, SIWE_NONCE_COOKIE } from "@/lib/ethereum-auth";

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
  pages: {
    signIn: "/account",
  },
});
