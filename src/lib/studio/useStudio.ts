"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  createPublicClient,
  createWalletClient,
  custom,
  http,
  isAddress,
  type Chain,
  type EIP1193Provider,
  type Hex,
  type PublicClient,
  type WalletClient,
} from "viem";
import {
  arbitrum,
  base,
  baseSepolia,
  foundry,
  mainnet,
  optimism,
  sepolia,
} from "viem/chains";
import { studioKitAbi } from "@/lib/studio/abi";
import {
  CHAIN_PRESETS,
  loadConfig,
  saveConfig,
  type HexAddr,
  type StudioAddresses,
  type StudioConfig,
} from "@/lib/studio/config";

const CHAINS: Record<number, Chain> = {
  1: mainnet,
  11155111: sepolia,
  8453: base,
  84532: baseSepolia,
  10: optimism,
  42161: arbitrum,
  31337: foundry,
};

type Injected = EIP1193Provider & {
  on?: (event: string, fn: (accounts: string[]) => void) => void;
  removeListener?: (event: string, fn: (accounts: string[]) => void) => void;
};

function injected(): Injected | undefined {
  if (typeof window === "undefined") return undefined;
  return (window as unknown as { ethereum?: Injected }).ethereum;
}

export function useStudio() {
  const [config, setConfigState] = useState<StudioConfig>(loadConfig);
  const [addresses, setAddresses] = useState<StudioAddresses | null>(null);
  const [account, setAccount] = useState<HexAddr | null>(null);
  const [status, setStatus] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const chain = CHAINS[config.chainId] ?? sepolia;

  const publicClient: PublicClient = useMemo(() => {
    const transport = config.rpcUrl.trim() ? http(config.rpcUrl.trim()) : http();
    return createPublicClient({ chain, transport });
  }, [chain, config.rpcUrl]);

  const setConfig = useCallback((next: StudioConfig) => {
    setConfigState(next);
    saveConfig(next);
    setAddresses(null);
  }, []);

  const connect = useCallback(async () => {
    setError("");
    const eth = injected();
    if (!eth) {
      setError("No injected wallet. Install a browser wallet to sign.");
      return;
    }
    const accounts = (await eth.request({ method: "eth_requestAccounts" })) as string[];
    const addr = accounts[0];
    if (!addr || !isAddress(addr)) {
      setError("Wallet returned no address.");
      return;
    }
    const walletChain = Number(await eth.request({ method: "eth_chainId" }));
    if (walletChain !== config.chainId) {
      try {
        await eth.request({
          method: "wallet_switchEthereumChain",
          params: [{ chainId: `0x${config.chainId.toString(16)}` }],
        });
      } catch {
        setError(
          `Wallet is on chain ${walletChain}. Switch to ${CHAIN_PRESETS.find((c) => c.id === config.chainId)?.label ?? config.chainId}.`,
        );
        return;
      }
    }
    setAccount(addr);
    setStatus(`Connected ${addr.slice(0, 6)}…${addr.slice(-4)}`);
  }, [config.chainId]);

  const walletClient: WalletClient | null = useMemo(() => {
    const eth = injected();
    if (!eth || !account) return null;
    return createWalletClient({
      account,
      chain,
      transport: custom(eth),
    });
  }, [account, chain]);

  const loadKit = useCallback(async () => {
    setError("");
    if (!isAddress(config.kit)) {
      setError("Paste the StudioKit address from deploy.");
      return null;
    }
    setBusy(true);
    try {
      const kit = config.kit as HexAddr;
      const [treasury, ledger, router, nft, registry] = await Promise.all([
        publicClient.readContract({ address: kit, abi: studioKitAbi, functionName: "treasury" }),
        publicClient.readContract({ address: kit, abi: studioKitAbi, functionName: "ledger" }),
        publicClient.readContract({ address: kit, abi: studioKitAbi, functionName: "router" }),
        publicClient.readContract({ address: kit, abi: studioKitAbi, functionName: "nft" }),
        publicClient.readContract({ address: kit, abi: studioKitAbi, functionName: "registry" }),
      ]);
      const next = { kit, treasury, ledger, router, nft, registry };
      setAddresses(next);
      setStatus("Kit loaded.");
      return next;
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
      return null;
    } finally {
      setBusy(false);
    }
  }, [config.kit, publicClient]);

  const send = useCallback(
    async (label: string, fn: () => Promise<Hex>) => {
      if (!walletClient || !account) {
        setError("Connect a wallet first.");
        return null;
      }
      setBusy(true);
      setError("");
      setStatus(`${label}…`);
      try {
        const hash = await fn();
        setStatus(`${label}: ${hash.slice(0, 10)}… waiting`);
        const receipt = await publicClient.waitForTransactionReceipt({ hash });
        if (receipt.status === "reverted") {
          setError(`${label} reverted.`);
          return null;
        }
        setStatus(`${label} confirmed: ${hash}`);
        return receipt;
      } catch (e) {
        const msg = e instanceof Error ? e.message : String(e);
        setError(msg.split("\n")[0] ?? msg);
        return null;
      } finally {
        setBusy(false);
      }
    },
    [account, publicClient, walletClient],
  );

  useEffect(() => {
    const eth = injected();
    if (!eth?.on) return;
    const onAcc = (accs: string[]) =>
      setAccount(accs[0] && isAddress(accs[0]) ? accs[0] : null);
    eth.on("accountsChanged", onAcc);
    return () => eth.removeListener?.("accountsChanged", onAcc);
  }, []);

  return {
    config,
    setConfig,
    addresses,
    account,
    connect,
    publicClient,
    walletClient,
    loadKit,
    send,
    status,
    error,
    busy,
    chain,
  };
}
