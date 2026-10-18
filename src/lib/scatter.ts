export const ZERO_ADDR = "0x0000000000000000000000000000000000000000";
export const PUBLIC_ROOT = `0x${"0".repeat(64)}`;
/** Official Scatter HTTP API — https://docs.scatter.art/api/getting-started */
export const SCATTER_API = "https://api.scatter.art/v1";

export interface ScatterMintList {
  id: string;
  name: string;
  tokenPrice: string;
  currency: string;
  currencyAddress: string;
  root?: string;
  startTime: string | null;
  endTime: string | null;
  listLimit: number;
  isPublic?: boolean;
  native?: boolean;
}

export interface ScatterCollection {
  slug: string;
  name: string;
  symbol?: string;
  address: string;
  chainId: number;
  avatar: string | null;
  banner: string | null;
  description: string;
  minted: number;
  max: number;
  remaining: number;
  soldOut: boolean;
  owners?: number | null;
  lists: ScatterMintList[];
}

export function isNativeList(L: ScatterMintList): boolean {
  if (typeof L.native === "boolean") return L.native;
  return !L.currencyAddress || L.currencyAddress.toLowerCase() === ZERO_ADDR;
}

export function isPublicList(L: ScatterMintList): boolean {
  if (typeof L.isPublic === "boolean") return L.isPublic;
  const root = (L.root || "").toLowerCase();
  return !root || root === PUBLIC_ROOT;
}

export function isOpenList(L: ScatterMintList, now = Date.now()): boolean {
  const start = L.startTime ? Date.parse(L.startTime) : 0;
  const end = L.endTime ? Date.parse(L.endTime) : Infinity;
  return start <= now && now <= end;
}

/** Public (root-zero) native ETH list currently open. Ignore allowlists. */
export function pickPublicEthList(lists: ScatterMintList[]): ScatterMintList | undefined {
  const open = lists.filter((L) => isNativeList(L) && isPublicList(L) && isOpenList(L));
  open.sort((a, b) => Number(a.tokenPrice) - Number(b.tokenPrice));
  return open[0];
}

export function priceLabel(list: ScatterMintList): string {
  const n = Number(list.tokenPrice);
  const amount = Number.isFinite(n) ? String(n) : list.tokenPrice;
  const cur = !list.currency || list.currency === "Ξ" ? "ETH" : list.currency;
  return `${amount} ${cur}`;
}

export function formatEth(amount: number): string {
  if (!Number.isFinite(amount)) return "—";
  const s = amount.toFixed(6).replace(/\.?0+$/, "");
  return `${s} ETH`;
}

export function scatterImage(uri: string | null | undefined, size: string): string | null {
  if (!uri) return null;
  if (uri.startsWith("ipfs://")) {
    return `https://ipfs.io/ipfs/${uri.slice("ipfs://".length)}`;
  }
  if (!uri.includes("ucarecdn.com")) return uri;
  const base = uri.endsWith("/") ? uri : `${uri}/`;
  return `${base}-/preview/${size}/`;
}

export function chainInfo(chainId: number): {
  chainId: number;
  name: string;
  currency: string;
  explorer: string;
} {
  if (chainId === 1) {
    return { chainId: 1, name: "Ethereum Mainnet", currency: "ETH", explorer: "https://etherscan.io" };
  }
  return { chainId, name: `Chain ${chainId}`, currency: "ETH", explorer: "" };
}

export function shortContract(addr: string): string {
  if (!addr || addr.length < 12) return addr || "—";
  return `${addr.slice(0, 6)}…${addr.slice(-4)}`;
}

export function listCap(list: ScatterMintList | undefined): number | null {
  if (!list) return null;
  const n = Number(list.listLimit);
  if (!Number.isFinite(n) || n <= 0 || n >= 0xffffffff) return null;
  return n;
}

export interface ScatterMintTransaction {
  to: string;
  value: string;
  data: string;
}

export interface ScatterMintResponse {
  mintTransaction: ScatterMintTransaction;
  erc20s?: { address: string; amount: string }[];
  error?: string;
}

export function mapScatterList(raw: unknown): ScatterMintList {
  const L = (raw ?? {}) as Record<string, unknown>;
  const root = String(L.root ?? "");
  const currencyAddress = String(L.currency_address ?? L.currencyAddress ?? "");
  return {
    id: String(L.id ?? ""),
    name: String(L.name ?? ""),
    tokenPrice: String(L.token_price ?? L.tokenPrice ?? ""),
    currency: String(L.currency_symbol ?? L.currency ?? "ETH"),
    currencyAddress,
    root,
    startTime: (L.start_time as string | null | undefined) ?? (L.startTime as string | null | undefined) ?? null,
    endTime: (L.end_time as string | null | undefined) ?? (L.endTime as string | null | undefined) ?? null,
    listLimit: Number(L.list_limit ?? L.listLimit ?? 0),
    isPublic: root.toLowerCase() === PUBLIC_ROOT,
    native: !currencyAddress || currencyAddress.toLowerCase() === ZERO_ADDR,
  };
}

export function mapScatterCollection(
  slug: string,
  col: Record<string, unknown>,
  lists: unknown[],
): ScatterCollection {
  const minted = Number(col.num_items ?? col.minted ?? 0);
  const max = Number(col.max_items ?? col.max ?? 0);
  return {
    slug,
    name: String(col.name ?? slug),
    symbol: col.symbol as string | undefined,
    address: String(col.address ?? ""),
    chainId: Number(col.chain_id ?? col.chainId ?? 1),
    avatar: (col.avatar_uri as string | null | undefined) ?? (col.avatar as string | null | undefined) ?? null,
    banner: (col.banner_uri as string | null | undefined) ?? (col.banner as string | null | undefined) ?? null,
    description: String(col.description ?? ""),
    minted,
    max,
    remaining: Math.max(0, max - minted),
    soldOut: max > 0 && minted >= max,
    owners: (col.num_owners as number | null | undefined) ?? (col.owners as number | null | undefined) ?? null,
    lists: lists.map(mapScatterList),
  };
}

export function isMappedScatterCollection(value: unknown): value is ScatterCollection {
  if (!value || typeof value !== "object") return false;
  const v = value as ScatterCollection;
  return Boolean(v.slug && v.address && Array.isArray(v.lists));
}
