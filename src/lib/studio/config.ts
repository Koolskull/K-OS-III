"use client";

export type HexAddr = `0x${string}`;

export type StudioAddresses = {
  kit: HexAddr;
  treasury: HexAddr;
  ledger: HexAddr;
  router: HexAddr;
  nft: HexAddr;
  registry: HexAddr;
};

export type StudioConfig = {
  chainId: number;
  rpcUrl: string;
  kit: string;
  paymentToken: string;
};

const STORAGE_KEY = "k-os-studio-config";

export const CHAIN_PRESETS: { id: number; label: string }[] = [
  { id: 1, label: "Ethereum" },
  { id: 11155111, label: "Sepolia" },
  { id: 8453, label: "Base" },
  { id: 84532, label: "Base Sepolia" },
  { id: 10, label: "OP Mainnet" },
  { id: 42161, label: "Arbitrum" },
  { id: 31337, label: "Anvil" },
];

export const KNOWN_USDC: Record<number, HexAddr> = {
  1: "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
  8453: "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913",
  11155111: "0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238",
};

export const DEFAULT_CONFIG: StudioConfig = {
  chainId: 11155111,
  rpcUrl: "",
  kit: "",
  paymentToken: KNOWN_USDC[11155111],
};

export function loadConfig(): StudioConfig {
  if (typeof window === "undefined") return DEFAULT_CONFIG;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_CONFIG;
    return { ...DEFAULT_CONFIG, ...JSON.parse(raw) };
  } catch {
    return DEFAULT_CONFIG;
  }
}

export function saveConfig(cfg: StudioConfig) {
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(cfg));
}

export const INSTRUMENT_KINDS = [
  "JuiceboxV2",
  "Erc721",
  "Erc1155",
  "Music",
  "Painting",
  "Broadcast",
  "Other",
] as const;

export const MEMBER_STATUSES = ["None", "Active", "Alumni", "Suspended"] as const;
