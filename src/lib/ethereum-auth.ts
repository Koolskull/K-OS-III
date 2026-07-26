/*
 *                    ☦
 *        ACCOUNTS — ETHEREUM (SIWE) LOGIN
 *
 *   Sign-In With Ethereum (EIP-4361) — see docs/K_WALLET_SPEC.md § 5. Uses
 *   the `siwe` reference package for message parsing/verification (never
 *   roll our own crypto — K_WALLET_SPEC.md § 7 non-negotiable). Its
 *   signature-recovery step depends on `ethers` as a peer dependency; the
 *   rest of K-Wallet prefers `viem`, but this is scoped narrowly to
 *   SIWE verification via the standard library, not a general EVM choice.
 *
 *   The nonce (anti-replay) is issued via an HttpOnly cookie this module
 *   controls directly — deliberately independent of Auth.js's own CSRF
 *   cookie, whose internal format isn't a stable/public API to depend on.
 */

import { SiweMessage, generateNonce } from "siwe";

export const SIWE_NONCE_COOKIE = "siwe-nonce";

/** Generate a fresh single-use nonce for a login attempt. */
export function newSiweNonce(): string {
  return generateNonce();
}

export class SiweVerifyError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "SiweVerifyError";
  }
}

/**
 * Verify a signed SIWE message against the nonce issued for this session.
 * Returns the checksummed Ethereum address on success, throws otherwise.
 */
export async function verifySiwe(
  rawMessage: string,
  signature: string,
  expectedNonce: string | undefined,
): Promise<string> {
  if (!expectedNonce) {
    throw new SiweVerifyError("No pending sign-in nonce — request a fresh one and try again.");
  }

  let siweMessage: SiweMessage;
  try {
    siweMessage = new SiweMessage(rawMessage);
  } catch {
    throw new SiweVerifyError("Malformed sign-in message.");
  }

  try {
    const result = await siweMessage.verify({ signature, nonce: expectedNonce });
    if (!result.success) {
      throw new SiweVerifyError("Signature verification failed.");
    }
    return result.data.address;
  } catch (err) {
    if (err instanceof SiweVerifyError) throw err;
    throw new SiweVerifyError("Signature verification failed.");
  }
}
