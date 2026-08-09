import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import bcrypt from "bcryptjs";
import { requireUserId } from "@/lib/api-auth";
import {
  AccountLinkError,
  linkProviderToUser,
  listLinkedMethods,
  unlinkProviderFromUser,
} from "@/lib/account-upsert";
import { matrixVerifyIdentity, MatrixLoginError } from "@/lib/matrix-auth";
import { verifySiwe, SiweVerifyError, SIWE_NONCE_COOKIE } from "@/lib/ethereum-auth";
import { isValidEmail, normalizeEmail } from "@/lib/password-auth";
import { pool } from "@/lib/db";

const BCRYPT_ROUNDS = 12;

type LinkBody =
  | { method: "ethereum"; message: string; signature: string }
  | { method: "matrix"; homeserver: string; username: string; password: string }
  | { method: "email"; email: string; password: string };

/**
 * POST — optionally attach a verified identity to the signed-in user.
 * DELETE — remove one linked method (refuses to leave zero sign-in paths).
 */
export async function POST(req: Request) {
  const userId = await requireUserId();
  if (!userId) return NextResponse.json({ error: "Not signed in" }, { status: 401 });

  let body: LinkBody;
  try {
    body = (await req.json()) as LinkBody;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  try {
    if (body.method === "ethereum") {
      const jar = await cookies();
      const nonce = jar.get(SIWE_NONCE_COOKIE)?.value;
      let address: string;
      try {
        address = await verifySiwe(body.message ?? "", body.signature ?? "", nonce);
      } catch (err) {
        const msg = err instanceof SiweVerifyError ? err.message : "Ethereum verification failed.";
        return NextResponse.json({ error: msg }, { status: 400 });
      }
      await linkProviderToUser(userId, "ethereum", address);
      // Clear nonce so it cannot be replayed for another link.
      jar.delete(SIWE_NONCE_COOKIE);
    } else if (body.method === "matrix") {
      let matrixUserId: string;
      try {
        matrixUserId = await matrixVerifyIdentity(
          body.homeserver ?? "",
          body.username ?? "",
          body.password ?? "",
        );
      } catch (err) {
        const msg = err instanceof MatrixLoginError ? err.message : "Matrix verification failed.";
        return NextResponse.json({ error: msg }, { status: 400 });
      }
      await linkProviderToUser(userId, "matrix", matrixUserId);
    } else if (body.method === "email") {
      const email = normalizeEmail(body.email ?? "");
      const password = body.password ?? "";
      if (!isValidEmail(email)) {
        return NextResponse.json({ error: "Enter a valid email address." }, { status: 400 });
      }
      if (password.length < 8) {
        return NextResponse.json({ error: "Password must be at least 8 characters." }, { status: 400 });
      }

      const taken = await pool.query(
        `SELECT id FROM users WHERE email = $1 AND id <> $2`,
        [email, Number(userId)],
      );
      if ((taken.rowCount ?? 0) > 0) {
        return NextResponse.json(
          { error: "That email is already used by a different K-OS account." },
          { status: 409 },
        );
      }

      const passwordHash = await bcrypt.hash(password, BCRYPT_ROUNDS);
      await pool.query(
        `UPDATE users SET email = $2, password_hash = $3 WHERE id = $1`,
        [Number(userId), email, passwordHash],
      );
      await linkProviderToUser(userId, "email", email);
    } else {
      return NextResponse.json({ error: "Unknown link method." }, { status: 400 });
    }

    const methods = await listLinkedMethods(userId);
    return NextResponse.json({ methods });
  } catch (err) {
    if (err instanceof AccountLinkError) {
      return NextResponse.json({ error: err.message }, { status: err.status });
    }
    throw err;
  }
}

export async function DELETE(req: Request) {
  const userId = await requireUserId();
  if (!userId) return NextResponse.json({ error: "Not signed in" }, { status: 401 });

  let body: { provider?: string; providerAccountId?: string };
  try {
    body = (await req.json()) as { provider?: string; providerAccountId?: string };
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const provider = body.provider ?? "";
  const providerAccountId = body.providerAccountId ?? "";
  if (!provider || !providerAccountId) {
    return NextResponse.json({ error: "provider and providerAccountId required." }, { status: 400 });
  }

  try {
    await unlinkProviderFromUser(userId, provider, providerAccountId);
    const methods = await listLinkedMethods(userId);
    return NextResponse.json({ methods });
  } catch (err) {
    if (err instanceof AccountLinkError) {
      return NextResponse.json({ error: err.message }, { status: err.status });
    }
    throw err;
  }
}
