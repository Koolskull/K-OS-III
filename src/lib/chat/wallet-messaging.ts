/*
 *                    ☦
 *        WALLET / ENS MESSAGING
 *
 *   Resolve ENS, local conversation cache, favorites.
 *   Live XMTP: optional — when @xmtp/browser-sdk is added, wire Client.create
 *   here. Until then, DMs are local-device cache only and labeled honestly.
 *   Network ciphertext never hits K-OS Postgres.
 */

import { getAddress, isAddress, JsonRpcProvider } from "ethers";

const FAV_KEY = "kos-kchat-favorites-v1";
const LOCAL_DM_KEY = "kos-kchat-wallet-local-v1";

export interface WalletDmMessage {
  id: string;
  from: string;
  body: string;
  ts: number;
  encrypted: boolean;
}

export interface WalletConversation {
  peer: string;
  peerAddress: string;
  messages: WalletDmMessage[];
}

function rpc(): string {
  return process.env.NEXT_PUBLIC_ETH_RPC_URL || "https://cloudflare-eth.com";
}

export async function resolvePeerHandle(handle: string): Promise<{ address: string; ens: string | null }> {
  const h = handle.trim();
  // Avoid relying on isAddress type-narrowing (ethers typings can collapse to never).
  if (isAddress(h as string)) {
    return { address: getAddress(h), ens: null };
  }
  const lower = String(h).toLowerCase();
  if (lower.endsWith(".eth") || (lower.includes(".") && !lower.startsWith("@"))) {
    const provider = new JsonRpcProvider(rpc());
    try {
      const addr = await provider.resolveName(lower);
      if (!addr) throw new Error(`Could not resolve ${h}`);
      return { address: getAddress(addr), ens: lower };
    } finally {
      provider.destroy?.();
    }
  }
  throw new Error("Use a 0x address or ENS name (e.g. name.eth)");
}

export function loadFavorites(): string[] {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(localStorage.getItem(FAV_KEY) ?? "[]") as string[];
  } catch {
    return [];
  }
}

export function toggleFavorite(id: string): string[] {
  const set = new Set(loadFavorites());
  if (set.has(id)) set.delete(id);
  else set.add(id);
  const arr = [...set];
  localStorage.setItem(FAV_KEY, JSON.stringify(arr));
  return arr;
}

export function loadLocalWalletDms(): WalletConversation[] {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(localStorage.getItem(LOCAL_DM_KEY) ?? "[]") as WalletConversation[];
  } catch {
    return [];
  }
}

function saveLocalWalletDms(list: WalletConversation[]) {
  localStorage.setItem(LOCAL_DM_KEY, JSON.stringify(list));
}

export function openLocalWalletDm(peerAddress: string, ens: string | null): WalletConversation {
  const list = loadLocalWalletDms();
  const addr = getAddress(peerAddress);
  let conv = list.find((c) => c.peerAddress.toLowerCase() === addr.toLowerCase());
  if (!conv) {
    conv = {
      peer: ens ?? `${addr.slice(0, 6)}…${addr.slice(-4)}`,
      peerAddress: addr,
      messages: [],
    };
    list.unshift(conv);
    saveLocalWalletDms(list);
  }
  return conv;
}

export function appendLocalWalletMessage(
  peerAddress: string,
  from: string,
  body: string,
  encrypted: boolean,
): WalletConversation {
  const list = loadLocalWalletDms();
  const addr = getAddress(peerAddress);
  let conv = list.find((c) => c.peerAddress.toLowerCase() === addr.toLowerCase());
  if (!conv) {
    conv = { peer: `${addr.slice(0, 6)}…${addr.slice(-4)}`, peerAddress: addr, messages: [] };
    list.unshift(conv);
  }
  conv.messages.push({
    id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
    from,
    body,
    ts: Date.now(),
    encrypted,
  });
  saveLocalWalletDms(list);
  return conv;
}

/**
 * Placeholder for XMTP. Returns null until @xmtp/browser-sdk is installed and
 * this function is wired to Client.create (see docs/WALLET_DEPENDENCIES.md).
 */
export async function tryCreateXmtpClient(
  _provider: { request: (args: { method: string; params?: unknown[] }) => Promise<unknown> },
): Promise<{ send: (to: string, body: string) => Promise<void> } | null> {
  void _provider;
  return null;
}
