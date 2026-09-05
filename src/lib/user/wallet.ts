/**
 * Client-side Ethereum wallet for K-OS III.
 * Static-export safe: Web Crypto + viem only. No server.
 *
 * Private keys are AES-GCM encrypted with a key derived from the
 * account passphrase (PBKDF2-SHA-256). Keys never leave the browser
 * except via explicit user export.
 */

import { generatePrivateKey, privateKeyToAccount } from "viem/accounts";

export type EthWalletPublic = {
  address: `0x${string}`;
  createdAt: string;
};

export type EthWalletRecord = EthWalletPublic & {
  /** base64(iv || tag || ciphertext) of utf8 private key hex */
  encryptedPrivateKey: string;
  /** base64 salt used for PBKDF2 */
  salt: string;
  /** PBKDF2 iterations */
  iterations: number;
};

const DEFAULT_ITERATIONS = 120_000;
const encoder = new TextEncoder();
const decoder = new TextDecoder();

function b64(bytes: ArrayBuffer | Uint8Array): string {
  const u8 = bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes);
  let s = "";
  for (let i = 0; i < u8.length; i++) s += String.fromCharCode(u8[i]!);
  return btoa(s);
}

function fromB64(s: string): Uint8Array {
  const bin = atob(s);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}

async function deriveKey(
  passphrase: string,
  salt: Uint8Array,
  iterations: number,
): Promise<CryptoKey> {
  const base = await crypto.subtle.importKey(
    "raw",
    encoder.encode(passphrase),
    "PBKDF2",
    false,
    ["deriveKey"],
  );
  return crypto.subtle.deriveKey(
    {
      name: "PBKDF2",
      salt: salt as BufferSource,
      iterations,
      hash: "SHA-256",
    },
    base,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt", "decrypt"],
  );
}

/** Encrypt private key hex with passphrase-derived AES-GCM key. */
export async function encryptPrivateKey(
  privateKeyHex: string,
  passphrase: string,
  iterations = DEFAULT_ITERATIONS,
): Promise<{ blob: string; salt: string; iterations: number }> {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const key = await deriveKey(passphrase, salt, iterations);
  const plain = encoder.encode(privateKeyHex.replace(/^0x/, "").toLowerCase());
  const cipherBuf = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv: iv as BufferSource },
    key,
    plain,
  );
  // AES-GCM ciphertext from Web Crypto includes the auth tag at the end.
  // Store: iv (12) || ciphertext+tag
  const cipher = new Uint8Array(cipherBuf);
  const packed = new Uint8Array(iv.length + cipher.length);
  packed.set(iv, 0);
  packed.set(cipher, iv.length);
  return { blob: b64(packed), salt: b64(salt), iterations };
}

/** Decrypt stored blob back to 0x-prefixed private key. */
export async function decryptPrivateKey(
  record: Pick<EthWalletRecord, "encryptedPrivateKey" | "salt" | "iterations">,
  passphrase: string,
): Promise<`0x${string}`> {
  const salt = fromB64(record.salt);
  const packed = fromB64(record.encryptedPrivateKey);
  if (packed.length < 13) throw new Error("Corrupt wallet blob");
  const iv = packed.subarray(0, 12);
  const data = packed.subarray(12);
  const key = await deriveKey(passphrase, salt, record.iterations);
  try {
    const plainBuf = await crypto.subtle.decrypt(
      { name: "AES-GCM", iv: iv as BufferSource },
      key,
      data as BufferSource,
    );
    const hex = decoder.decode(plainBuf);
    return (hex.startsWith("0x") ? hex : `0x${hex}`) as `0x${string}`;
  } catch {
    throw new Error("Wrong passphrase or corrupt wallet");
  }
}

export function generateEthWallet(): {
  address: `0x${string}`;
  privateKey: `0x${string}`;
} {
  const privateKey = generatePrivateKey();
  const account = privateKeyToAccount(privateKey);
  return { address: account.address, privateKey };
}

/** Mint a fresh wallet and encrypt it under the given passphrase. */
export async function mintEncryptedWallet(
  passphrase: string,
): Promise<EthWalletRecord> {
  const { address, privateKey } = generateEthWallet();
  const enc = await encryptPrivateKey(privateKey, passphrase);
  return {
    address,
    createdAt: new Date().toISOString(),
    encryptedPrivateKey: enc.blob,
    salt: enc.salt,
    iterations: enc.iterations,
  };
}

export function shortAddress(address: string, chars = 4): string {
  if (!address || address.length < chars * 2 + 2) return address;
  return `${address.slice(0, 2 + chars)}…${address.slice(-chars)}`;
}

/** Chunk address for vertical-list display (Slimentologika: vertical layout → horizontal digits). */
export function chunkAddress(address: string, size = 10): string[] {
  const m = address.match(new RegExp(`.{1,${size}}`, "g"));
  return m ?? [address];
}
