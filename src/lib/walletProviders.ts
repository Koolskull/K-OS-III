"use client";

/*
 *                    ☦
 *        ACCOUNTS — MULTI-WALLET DISCOVERY
 *
 *   Two ways a browser can hand us an Ethereum-compatible signer:
 *
 *   1. EIP-6963 ("Multi Injected Provider Discovery") — the current
 *      standard that lets every installed wallet extension (MetaMask,
 *      Rabby, Rainbow, Brave Wallet, ...) announce itself individually,
 *      instead of all of them fighting over a single window.ethereum.
 *      This is what makes desktop reliable with more than one wallet
 *      installed. Covers wallet-app-embedded mobile browsers too (e.g.
 *      opening the site from inside the Rainbow app), since those inject
 *      the same way a desktop extension does.
 *
 *   2. WalletConnect — for a genuinely plain mobile browser (regular
 *      Safari/Chrome, no injected provider at all) or as a QR-code
 *      fallback on desktop. Its own modal already lists popular wallets
 *      and handles deep-linking, so we don't hand-roll that part.
 */

export interface Eip1193Provider {
  request(args: { method: string; params?: unknown[] }): Promise<unknown>;
}

export interface Eip6963ProviderInfo {
  uuid: string;
  name: string;
  icon: string;
  rdns: string;
}

export interface Eip6963Detail {
  info: Eip6963ProviderInfo;
  provider: Eip1193Provider;
}

declare global {
  interface WindowEventMap {
    "eip6963:announceProvider": CustomEvent<Eip6963Detail>;
  }
  interface Window {
    ethereum?: Eip1193Provider;
  }
}

/** Ask every installed wallet to announce itself, and collect the replies. */
export function discoverEip6963Wallets(onFound: (wallet: Eip6963Detail) => void): () => void {
  const seen = new Set<string>();
  const handler = (event: CustomEvent<Eip6963Detail>) => {
    if (seen.has(event.detail.info.uuid)) return;
    seen.add(event.detail.info.uuid);
    onFound(event.detail);
  };
  window.addEventListener("eip6963:announceProvider", handler as EventListener);
  window.dispatchEvent(new Event("eip6963:requestProvider"));
  return () => window.removeEventListener("eip6963:announceProvider", handler as EventListener);
}

let wcProviderPromise: Promise<Eip1193Provider & { connect(): Promise<void>; accounts: string[]; disconnect(): Promise<void> }> | null = null;

/** Lazily create (once) and return the WalletConnect provider singleton. */
export async function getWalletConnectProvider() {
  if (!wcProviderPromise) {
    wcProviderPromise = (async () => {
      const projectId = process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID;
      if (!projectId) {
        throw new Error("WalletConnect isn't configured (NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID missing).");
      }
      const { EthereumProvider } = await import("@walletconnect/ethereum-provider");
      return EthereumProvider.init({
        projectId,
        chains: [1],
        showQrModal: true,
        metadata: {
          name: "KOOLSKULL OS",
          description: "Sign in to KOOLSKULL OS",
          // Must match the page origin exactly (http vs https). Phantom rejects
          // http://localhost when the request claims https://localhost.
          url: typeof window !== "undefined" ? window.location.origin : "https://koolskull.com",
          icons: [],
        },
      });
    })();
  }
  return wcProviderPromise;
}

/** Injected wallet if present, otherwise WalletConnect QR. */
export async function connectEthereumProvider(): Promise<{
  address: string;
  provider: Eip1193Provider;
}> {
  let provider: Eip1193Provider | undefined =
    typeof window !== "undefined" ? window.ethereum : undefined;
  if (!provider) {
    const wc = await getWalletConnectProvider();
    await wc.connect();
    provider = wc;
  }
  const accounts = (await provider.request({ method: "eth_requestAccounts" })) as string[];
  const address = accounts?.[0];
  if (!address) throw new Error("No account");
  return { address, provider };
}

export async function ensureChain(provider: Eip1193Provider, chainId: number): Promise<void> {
  const chainHex = (await provider.request({ method: "eth_chainId" })) as string;
  if (parseInt(chainHex, 16) === chainId) return;
  await provider.request({
    method: "wallet_switchEthereumChain",
    params: [{ chainId: "0x" + chainId.toString(16) }],
  });
}
