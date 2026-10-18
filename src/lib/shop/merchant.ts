"use client";

import { getAddress } from "ethers";
import { SHOP_OWNER_ADDRESS, SHOP_OWNER_ENS, SHOP_OWNER_WALLETS } from "@/lib/buildFlags";
import {
  connectEthereumProvider,
  discoverEip6963Wallets,
  type Eip1193Provider,
} from "@/lib/walletProviders";

const KEY = "kos-merchant-wallet-v1";

export { SHOP_OWNER_ADDRESS, SHOP_OWNER_ENS, SHOP_OWNER_WALLETS };

export function isOwnerAddress(addr: string | null | undefined): boolean {
  if (!addr) return false;
  const lower = (() => {
    try {
      return getAddress(addr).toLowerCase();
    } catch {
      return addr.toLowerCase();
    }
  })();
  return SHOP_OWNER_WALLETS.some((w) => w.address === lower);
}

export function merchantAddress(): string | null {
  if (typeof window === "undefined") return null;
  const stored = window.localStorage.getItem(KEY);
  return isOwnerAddress(stored) ? stored : null;
}

export function isMerchant(): boolean {
  return Boolean(merchantAddress());
}

async function requestAccount(provider: Eip1193Provider): Promise<string> {
  const accounts = (await provider.request({ method: "eth_requestAccounts" })) as string[];
  if (!accounts[0]) throw new Error("Wallet returned no account.");
  return getAddress(accounts[0]);
}

export async function connectMerchantWallet(provider?: Eip1193Provider): Promise<string> {
  const eth = provider ?? (await connectEthereumProvider()).provider;
  const addr = await requestAccount(eth);
  if (!isOwnerAddress(addr)) {
    throw new Error(`Not a shop admin. Sign in as ${SHOP_OWNER_ENS}.`);
  }
  window.localStorage.setItem(KEY, addr);
  return addr;
}

export function disconnectMerchant(): void {
  window.localStorage.removeItem(KEY);
}

export function shortAddr(addr: string): string {
  return `${addr.slice(0, 6)}…${addr.slice(-4)}`;
}

export function watchWallets(onFound: Parameters<typeof discoverEip6963Wallets>[0]): () => void {
  return discoverEip6963Wallets(onFound);
}
