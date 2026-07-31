/*
 *                    ☦
 *        ENS — RESOLVE / REVERSE-LOOKUP
 *
 *   Server-side helpers for optional public ENS display on profiles.
 *   Spoof prevention: only accept an ens_name that forward-resolves to
 *   one of the user's linked eth addresses.
 */

import { getAddress, isAddress, JsonRpcProvider } from "ethers";

function rpcUrl(): string {
  if (process.env.ETH_RPC_URL) return process.env.ETH_RPC_URL;
  const key = process.env.ALCHEMY_API_KEY;
  if (key) return `https://eth-mainnet.g.alchemy.com/v2/${key}`;
  return "https://cloudflare-eth.com";
}

/** Reverse-resolve primary ENS for a checksummed address. */
export async function lookupEnsName(address: string): Promise<string | null> {
  if (!isAddress(address)) return null;
  const addr = getAddress(address);
  const provider = new JsonRpcProvider(rpcUrl());
  try {
    return await provider.lookupAddress(addr);
  } catch {
    return null;
  } finally {
    provider.destroy?.();
  }
}

/** Forward-resolve ENS name → address (checksummed) or null. */
export async function resolveEnsName(name: string): Promise<string | null> {
  const n = name.trim().toLowerCase();
  if (!n.includes(".")) return null;
  const provider = new JsonRpcProvider(rpcUrl());
  try {
    const addr = await provider.resolveName(n);
    return addr ? getAddress(addr) : null;
  } catch {
    return null;
  } finally {
    provider.destroy?.();
  }
}

/** True if ensName currently points at one of the given eth addresses. */
export async function ensOwnedByAddresses(ensName: string, addresses: string[]): Promise<boolean> {
  const resolved = await resolveEnsName(ensName);
  if (!resolved) return false;
  const set = new Set(addresses.map((a) => getAddress(a).toLowerCase()));
  return set.has(resolved.toLowerCase());
}
