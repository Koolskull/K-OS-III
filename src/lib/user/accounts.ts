/**
 * Local-first accounts for K-OS III (static export / 2kool.tv).
 *
 * - Email + password accounts (PBKDF2 password verifier + encrypted ETH wallet)
 * - Provider-linked local accounts (github / google) — mint wallet after lock passphrase
 * - Optional PocketBase OAuth when NEXT_PUBLIC_POCKETBASE_URL is set
 *
 * Everything lives in localStorage. No server required for the local path.
 * Multi-device sync needs PocketBase (or another backend) — see pocketbase.ts.
 */

import { mintEncryptedWallet, decryptPrivateKey, type EthWalletRecord } from "./wallet";
import { updateIdentity } from "./profile";

const STORE_KEY = "kos-accounts-v1";
const SESSION_KEY = "kos-session-v1";

export type AuthProvider = "email" | "github" | "google";

export type KosAccountPublic = {
  id: string;
  provider: AuthProvider;
  email: string;
  displayName: string;
  handle: string;
  /** Public ETH address only */
  walletAddress: `0x${string}`;
  walletCreatedAt: string;
  createdAt: string;
};

type KosAccountRecord = KosAccountPublic & {
  /** base64 salt for password verifier */
  passwordSalt: string;
  /** base64 of PBKDF2-SHA-256 derived password hash */
  passwordHash: string;
  passwordIterations: number;
  wallet: EthWalletRecord;
};

type AccountStore = {
  version: 1;
  accounts: KosAccountRecord[];
};

type Session = {
  accountId: string;
  /** Not the password — only used to re-export in-session after unlock */
  unlocked?: boolean;
};

const encoder = new TextEncoder();
const PASS_ITERS = 100_000;

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

function newId(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(16));
  return Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
}

async function hashPassword(
  password: string,
  salt: Uint8Array,
  iterations: number,
): Promise<string> {
  const base = await crypto.subtle.importKey("raw", encoder.encode(password), "PBKDF2", false, [
    "deriveBits",
  ]);
  const bits = await crypto.subtle.deriveBits(
    { name: "PBKDF2", salt: salt as BufferSource, iterations, hash: "SHA-256" },
    base,
    256,
  );
  return b64(bits);
}

function emptyStore(): AccountStore {
  return { version: 1, accounts: [] };
}

function loadStore(): AccountStore {
  if (typeof window === "undefined") return emptyStore();
  try {
    const raw = window.localStorage.getItem(STORE_KEY);
    if (!raw) return emptyStore();
    const parsed = JSON.parse(raw) as AccountStore;
    if (!parsed || parsed.version !== 1 || !Array.isArray(parsed.accounts)) return emptyStore();
    return parsed;
  } catch {
    return emptyStore();
  }
}

function saveStore(store: AccountStore): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORE_KEY, JSON.stringify(store));
  } catch {
    /* quota */
  }
}

function toPublic(a: KosAccountRecord): KosAccountPublic {
  return {
    id: a.id,
    provider: a.provider,
    email: a.email,
    displayName: a.displayName,
    handle: a.handle,
    walletAddress: a.walletAddress,
    walletCreatedAt: a.walletCreatedAt,
    createdAt: a.createdAt,
  };
}

function loadSession(): Session | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.sessionStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    const s = JSON.parse(raw) as Session;
    if (!s?.accountId) return null;
    return s;
  } catch {
    return null;
  }
}

function saveSession(session: Session | null): void {
  if (typeof window === "undefined") return;
  try {
    if (!session) window.sessionStorage.removeItem(SESSION_KEY);
    else window.sessionStorage.setItem(SESSION_KEY, JSON.stringify(session));
  } catch {
    /* ignore */
  }
}

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

function normalizeHandle(h: string): string {
  return h.trim().replace(/^@+/, "").replace(/[^a-zA-Z0-9_-]/g, "").slice(0, 24);
}

function syncProfileFromAccount(a: KosAccountPublic): void {
  try {
    updateIdentity({
      displayName: a.displayName,
      handle: a.handle || a.email.split("@")[0] || "",
    });
  } catch {
    /* ignore */
  }
}

export function listAccounts(): KosAccountPublic[] {
  return loadStore().accounts.map(toPublic);
}

export function getCurrentAccount(): KosAccountPublic | null {
  const session = loadSession();
  if (!session) return null;
  const rec = loadStore().accounts.find((a) => a.id === session.accountId);
  return rec ? toPublic(rec) : null;
}

export function isSignedIn(): boolean {
  return getCurrentAccount() !== null;
}

export function signOut(): void {
  saveSession(null);
}

export type CreateEmailAccountInput = {
  email: string;
  password: string;
  displayName?: string;
  handle?: string;
};

/**
 * Create email account and mint encrypted ETH wallet under the same password.
 * Signs the user in on success.
 */
export async function createEmailAccount(
  input: CreateEmailAccountInput,
): Promise<KosAccountPublic> {
  const email = normalizeEmail(input.email);
  if (!email || !email.includes("@")) throw new Error("Valid email required");
  if (!input.password || input.password.length < 8) {
    throw new Error("Password must be at least 8 characters");
  }

  const store = loadStore();
  if (store.accounts.some((a) => a.email === email && a.provider === "email")) {
    throw new Error("Account already exists for this email");
  }

  const passwordSalt = crypto.getRandomValues(new Uint8Array(16));
  const passwordHash = await hashPassword(input.password, passwordSalt, PASS_ITERS);
  const wallet = await mintEncryptedWallet(input.password);
  const displayName =
    (input.displayName || "").trim() || email.split("@")[0] || "operator";
  const handle = normalizeHandle(input.handle || displayName);

  const record: KosAccountRecord = {
    id: newId(),
    provider: "email",
    email,
    displayName,
    handle,
    walletAddress: wallet.address,
    walletCreatedAt: wallet.createdAt,
    createdAt: new Date().toISOString(),
    passwordSalt: b64(passwordSalt),
    passwordHash,
    passwordIterations: PASS_ITERS,
    wallet,
  };

  store.accounts.push(record);
  saveStore(store);
  saveSession({ accountId: record.id, unlocked: true });
  syncProfileFromAccount(toPublic(record));
  return toPublic(record);
}

/**
 * Provider-linked local account (github / google).
 * When PocketBase is not configured, this is a local identity path:
 * user sets a lock passphrase → ETH wallet is minted under it.
 * Real OAuth is available via pocketbase.ts when NEXT_PUBLIC_POCKETBASE_URL is set.
 */
export async function createProviderAccount(input: {
  provider: "github" | "google";
  email: string;
  passphrase: string;
  displayName?: string;
  handle?: string;
}): Promise<KosAccountPublic> {
  const email = normalizeEmail(input.email);
  if (!email || !email.includes("@")) throw new Error("Valid email required");
  if (!input.passphrase || input.passphrase.length < 8) {
    throw new Error("Lock passphrase must be at least 8 characters");
  }

  const store = loadStore();
  if (
    store.accounts.some(
      (a) => a.email === email && a.provider === input.provider,
    )
  ) {
    throw new Error(`Already linked ${input.provider} account for this email`);
  }

  const passwordSalt = crypto.getRandomValues(new Uint8Array(16));
  const passwordHash = await hashPassword(
    input.passphrase,
    passwordSalt,
    PASS_ITERS,
  );
  const wallet = await mintEncryptedWallet(input.passphrase);
  const displayName =
    (input.displayName || "").trim() ||
    email.split("@")[0] ||
    input.provider.toUpperCase();
  const handle = normalizeHandle(input.handle || displayName);

  const record: KosAccountRecord = {
    id: newId(),
    provider: input.provider,
    email,
    displayName,
    handle,
    walletAddress: wallet.address,
    walletCreatedAt: wallet.createdAt,
    createdAt: new Date().toISOString(),
    passwordSalt: b64(passwordSalt),
    passwordHash,
    passwordIterations: PASS_ITERS,
    wallet,
  };

  store.accounts.push(record);
  saveStore(store);
  saveSession({ accountId: record.id, unlocked: true });
  syncProfileFromAccount(toPublic(record));
  return toPublic(record);
}

export async function signInEmail(
  email: string,
  password: string,
): Promise<KosAccountPublic> {
  const e = normalizeEmail(email);
  const store = loadStore();
  const rec = store.accounts.find((a) => a.email === e && a.provider === "email");
  if (!rec) throw new Error("No email account found");

  const hash = await hashPassword(
    password,
    fromB64(rec.passwordSalt),
    rec.passwordIterations,
  );
  if (hash !== rec.passwordHash) throw new Error("Wrong password");

  saveSession({ accountId: rec.id, unlocked: true });
  syncProfileFromAccount(toPublic(rec));
  return toPublic(rec);
}

/** Sign in any provider account with its lock passphrase / password. */
export async function signInWithPassphrase(
  accountId: string,
  passphrase: string,
): Promise<KosAccountPublic> {
  const store = loadStore();
  const rec = store.accounts.find((a) => a.id === accountId);
  if (!rec) throw new Error("Account not found");

  const hash = await hashPassword(
    passphrase,
    fromB64(rec.passwordSalt),
    rec.passwordIterations,
  );
  if (hash !== rec.passwordHash) throw new Error("Wrong passphrase");

  saveSession({ accountId: rec.id, unlocked: true });
  syncProfileFromAccount(toPublic(rec));
  return toPublic(rec);
}

/**
 * Export private key for the signed-in account.
 * Requires the account password / lock passphrase.
 */
export async function exportAccountPrivateKey(
  passphrase: string,
): Promise<{ privateKey: `0x${string}`; address: `0x${string}` }> {
  const session = loadSession();
  if (!session) throw new Error("Not signed in");
  const rec = loadStore().accounts.find((a) => a.id === session.accountId);
  if (!rec) throw new Error("Account not found");

  // Verify password first
  const hash = await hashPassword(
    passphrase,
    fromB64(rec.passwordSalt),
    rec.passwordIterations,
  );
  if (hash !== rec.passwordHash) throw new Error("Wrong passphrase");

  const privateKey = await decryptPrivateKey(rec.wallet, passphrase);
  return { privateKey, address: rec.wallet.address };
}

export function deleteAccount(accountId: string): void {
  const store = loadStore();
  store.accounts = store.accounts.filter((a) => a.id !== accountId);
  saveStore(store);
  const session = loadSession();
  if (session?.accountId === accountId) saveSession(null);
}

export function pocketBaseUrl(): string | null {
  const url =
    typeof process !== "undefined"
      ? process.env.NEXT_PUBLIC_POCKETBASE_URL?.trim()
      : undefined;
  return url || null;
}

export function socialOAuthAvailable(): boolean {
  return Boolean(pocketBaseUrl());
}
