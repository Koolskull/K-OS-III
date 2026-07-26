import { NextResponse } from "next/server";
import { newSiweNonce, SIWE_NONCE_COOKIE } from "@/lib/ethereum-auth";

/** Issue a fresh single-use SIWE nonce, tied to this browser via an HttpOnly cookie. */
export async function GET() {
  const nonce = newSiweNonce();
  const res = NextResponse.json({ nonce });
  res.cookies.set(SIWE_NONCE_COOKIE, nonce, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: 60 * 10, // 10 minutes to complete the wallet-signing round trip
    path: "/",
  });
  return res;
}
