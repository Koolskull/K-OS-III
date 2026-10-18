/**
 * Portable mint/status client.
 *
 * Local Next (`HAS_BACKEND`) prefers `/api/*` (Alchemy + Scatter proxy).
 * Static FTP builds call Scatter's public API and a CORS Ethereum RPC
 * directly — no Node, no Alchemy. Optional PHP shims under `/api/` are a
 * backup if Scatter or RPC is blocked.
 *
 * Scatter API: https://docs.scatter.art/api/getting-started
 */

import { HAS_BACKEND } from "@/lib/buildFlags";
import {
  MIYAMAKER_MINI,
  SANCTIONED_NFTS,
  fallbackTokenImage,
  isEthAddress,
} from "@/data/sanctioned-nfts";
import { isMiyamakerMint, isKnownScatterSlug, MIYAMAKER_MINT_SLUG } from "@/data/scatter-mints";
import { CULT_ADDRESS, USDC_ADDRESS } from "@/data/market";
import {
  SCATTER_API,
  ZERO_ADDR,
  type ScatterCollection,
  type ScatterMintResponse,
  type ScatterMintTransaction,
  isMappedScatterCollection,
  mapScatterCollection,
} from "@/lib/scatter";
import {
  SEL,
  dataBalanceOf,
  dataOwnerOf,
  hexToUint,
  publicEthCall,
  publicEthCallMany,
  addressFromWord,
} from "@/lib/publicEth";

const HDR = { Accept: "application/json" };

export interface MiyamakerStatus {
  address: string;
  chainId: number;
  minted: number;
  max: number;
  remaining: number;
  soldOut: boolean;
  mintPriceEth: string;
  mintPriceWei: string;
}

export interface OwnedNftItem {
  contractAddress: string;
  tokenId: string;
  name: string | null;
  image: string | null;
  collectionId: string | null;
  collectionName: string | null;
}

export interface OwnedLookup {
  address: string;
  held: string[];
  items: OwnedNftItem[];
  balances: Record<string, number>;
  source: "api" | "rpc";
}

async function readJson(res: Response): Promise<unknown> {
  const ct = res.headers.get("content-type") || "";
  if (!ct.includes("json")) return null;
  return res.json().catch(() => null);
}

async function getJson(url: string, init?: RequestInit): Promise<unknown | null> {
  try {
    const res = await fetch(url, { cache: "no-store", ...init, headers: { ...HDR, ...(init?.headers || {}) } });
    const data = await readJson(res);
    if (!res.ok) return null;
    return data;
  } catch {
    return null;
  }
}

function errorMessage(data: unknown, fallback: string): string {
  if (data && typeof data === "object") {
    const o = data as { error?: unknown; message?: unknown };
    if (typeof o.error === "string" && o.error) return o.error;
    if (typeof o.message === "string" && o.message) return o.message;
  }
  return fallback;
}

export function miyamakerToCollection(s: MiyamakerStatus): ScatterCollection {
  return {
    slug: MIYAMAKER_MINT_SLUG,
    name: MIYAMAKER_MINI.name,
    address: s.address,
    chainId: s.chainId,
    avatar: `${MIYAMAKER_MINI.imageBase}1.png`,
    banner: MIYAMAKER_MINI.heroGif,
    description: "",
    minted: s.minted,
    max: s.max,
    remaining: s.remaining,
    soldOut: s.soldOut,
    lists: [
      {
        id: "public",
        name: "PUBLIC",
        tokenPrice: s.mintPriceEth,
        currency: "ETH",
        currencyAddress: ZERO_ADDR,
        startTime: null,
        endTime: null,
        listLimit: s.max,
        isPublic: true,
        native: true,
      },
    ],
  };
}

function wrapMiyamaker(raw: unknown): MiyamakerStatus | null {
  if (!raw || typeof raw !== "object") return null;
  const s = raw as Partial<MiyamakerStatus>;
  const minted = Number(s.minted);
  const max = Number(s.max) || MIYAMAKER_MINI.maxSupply;
  if (!Number.isFinite(minted)) return null;
  return {
    address: String(s.address || MIYAMAKER_MINI.address),
    chainId: Number(s.chainId) || 1,
    minted,
    max,
    remaining: Math.max(0, max - minted),
    soldOut: max > 0 && minted >= max,
    mintPriceEth: String(s.mintPriceEth || MIYAMAKER_MINI.mintPriceEth),
    mintPriceWei: String(s.mintPriceWei || MIYAMAKER_MINI.mintPriceWei),
  };
}

async function miyamakerFromRpc(): Promise<MiyamakerStatus> {
  const [supplyHex, maxHex] = await Promise.all([
    publicEthCall(MIYAMAKER_MINI.address, SEL.totalSupply),
    publicEthCall(MIYAMAKER_MINI.address, SEL.maxSupply),
  ]);
  const minted = hexToUint(supplyHex);
  const max = hexToUint(maxHex) || MIYAMAKER_MINI.maxSupply;
  return {
    address: MIYAMAKER_MINI.address,
    chainId: MIYAMAKER_MINI.chainId,
    minted,
    max,
    remaining: Math.max(0, max - minted),
    soldOut: max > 0 && minted >= max,
    mintPriceEth: MIYAMAKER_MINI.mintPriceEth,
    mintPriceWei: MIYAMAKER_MINI.mintPriceWei,
  };
}

export async function loadMiyamakerStatus(): Promise<MiyamakerStatus> {
  const local = async () => wrapMiyamaker(await getJson("/api/miyamaker/status"));
  if (HAS_BACKEND) {
    return (await local()) ?? miyamakerFromRpc();
  }
  try {
    return await miyamakerFromRpc();
  } catch {
    const php = await local();
    if (php) return php;
    throw new Error("Could not load Miyamaker supply");
  }
}

async function scatterDirect(slug: string, minterAddress?: string): Promise<ScatterCollection> {
  if (!isKnownScatterSlug(slug)) throw new Error("Unknown collection");
  const listQs = minterAddress ? `?minterAddress=${encodeURIComponent(minterAddress)}` : "";
  const [colRes, listRes] = await Promise.all([
    fetch(`${SCATTER_API}/collection/${slug}`, { headers: HDR, cache: "no-store" }),
    fetch(`${SCATTER_API}/collection/${slug}/eligible-invite-lists${listQs}`, {
      headers: HDR,
      cache: "no-store",
    }),
  ]);
  const colJson = await readJson(colRes);
  if (!colRes.ok || !colJson || typeof colJson !== "object") {
    throw new Error(errorMessage(colJson, "Scatter collection fetch failed"));
  }
  const lists = listRes.ok ? ((await readJson(listRes)) as unknown[]) : [];
  const mapped = mapScatterCollection(slug, colJson as Record<string, unknown>, Array.isArray(lists) ? lists : []);
  if (!mapped.address) throw new Error("Scatter collection missing contract");
  return mapped;
}

export async function loadScatterCollection(
  slug: string,
  minterAddress?: string,
): Promise<ScatterCollection> {
  const local = async () => {
    const data = await getJson(`/api/scatter/${slug}`);
    return isMappedScatterCollection(data) ? data : null;
  };
  if (HAS_BACKEND) {
    return (await local()) ?? scatterDirect(slug, minterAddress);
  }
  try {
    return await scatterDirect(slug, minterAddress);
  } catch (e) {
    const php = await local();
    if (php) return php;
    throw e instanceof Error ? e : new Error("Could not load collection");
  }
}

export async function loadMintCollection(
  slug: string,
  minterAddress?: string,
): Promise<ScatterCollection> {
  if (isMiyamakerMint(slug)) {
    return miyamakerToCollection(await loadMiyamakerStatus());
  }
  return loadScatterCollection(slug, minterAddress);
}

const MINT_ERC20 = new Set([USDC_ADDRESS.toLowerCase(), CULT_ADDRESS.toLowerCase()]);

export interface PreparedScatterMint {
  tx: ScatterMintTransaction;
  erc20s: { address: string; amount: string }[];
}

function mintTxFromBody(data: unknown): PreparedScatterMint {
  const body = data as ScatterMintResponse | null;
  if (!body || typeof body !== "object") throw new Error("Scatter did not return a transaction");
  if (body.error) throw new Error(body.error);
  const erc20s = (body.erc20s ?? []).map((row) => ({
    address: String(row.address),
    amount: String(row.amount),
  }));
  for (const token of erc20s) {
    if (!MINT_ERC20.has(token.address.toLowerCase())) {
      throw new Error("This mint list is not ETH, USDC, or CULT.");
    }
  }
  const tx = body.mintTransaction;
  if (!tx?.to || !tx.data) throw new Error("Scatter did not return a transaction");
  return { tx, erc20s };
}

export async function requestScatterMintPrepared(opts: {
  slug: string;
  collectionAddress: string;
  chainId: number;
  minterAddress: string;
  listId: string;
  quantity: number;
}): Promise<PreparedScatterMint> {
  const quantity = Math.max(1, Math.min(20, Math.round(opts.quantity || 1)));
  const local = async () => {
    try {
      const res = await fetch("/api/scatter/mint", {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({
          slug: opts.slug,
          minterAddress: opts.minterAddress,
          listId: opts.listId,
          quantity,
        }),
      });
      const data = await readJson(res);
      if (!res.ok) {
        if (HAS_BACKEND) throw new Error(errorMessage(data, "Mint failed"));
        return null;
      }
      return mintTxFromBody(data);
    } catch (e) {
      if (HAS_BACKEND) throw e;
      return null;
    }
  };

  const direct = async () => {
    const res = await fetch(`${SCATTER_API}/mint`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify({
        collectionAddress: opts.collectionAddress,
        chainId: opts.chainId,
        minterAddress: opts.minterAddress,
        lists: [{ id: opts.listId, quantity }],
      }),
    });
    const data = await readJson(res);
    if (!res.ok) throw new Error(errorMessage(data, "Scatter mint failed"));
    return mintTxFromBody(data);
  };

  if (HAS_BACKEND) {
    const tx = await local();
    if (tx) return tx;
  }
  try {
    return await direct();
  } catch (e) {
    const tx = await local();
    if (tx) return tx;
    throw e instanceof Error ? e : new Error("Mint failed");
  }
}

export async function requestScatterMintTx(opts: {
  slug: string;
  collectionAddress: string;
  chainId: number;
  minterAddress: string;
  listId: string;
  quantity: number;
}): Promise<ScatterMintTransaction> {
  const prepared = await requestScatterMintPrepared(opts);
  if (prepared.erc20s.length > 0) {
    throw new Error("This mint list is not native ETH — use the marketplace mint.");
  }
  return prepared.tx;
}

function itemsFromApi(data: unknown, address: string): OwnedLookup | null {
  if (!data || typeof data !== "object") return null;
  const o = data as { items?: OwnedNftItem[]; held?: string[]; balances?: Record<string, number> };
  if (!Array.isArray(o.items)) return null;
  const balances = o.balances ?? {};
  const held =
    o.held ??
    SANCTIONED_NFTS.filter((c) =>
      o.items!.some((n) => n.contractAddress.toLowerCase() === c.address.toLowerCase()),
    ).map((c) => c.id);
  return { address, held, items: o.items, balances, source: "api" };
}

async function balancesFromRpc(owner: string): Promise<Record<string, number>> {
  const results = await publicEthCallMany(
    SANCTIONED_NFTS.map((c) => ({ to: c.address, data: dataBalanceOf(owner) })),
  );
  const balances: Record<string, number> = {};
  SANCTIONED_NFTS.forEach((c, i) => {
    balances[c.id] = hexToUint(results[i] ?? "0x0");
  });
  return balances;
}

/** Mini supply is small; ownerOf scan fills images when Alchemy is absent. */
async function scanMiniOwned(owner: string, minted: number): Promise<OwnedNftItem[]> {
  const cap = Math.min(minted, 320);
  if (cap < 1) return [];
  const ownerNorm = owner.toLowerCase();
  const items: OwnedNftItem[] = [];
  const chunk = 25;
  for (let start = 1; start <= cap; start += chunk) {
    const ids: number[] = [];
    for (let id = start; id <= Math.min(cap, start + chunk - 1); id++) ids.push(id);
    const results = await publicEthCallMany(
      ids.map((id) => ({ to: MIYAMAKER_MINI.address, data: dataOwnerOf(id) })),
    );
    results.forEach((hex, i) => {
      const who = addressFromWord(hex);
      if (!who || who.toLowerCase() !== ownerNorm) return;
      const tokenId = String(ids[i]);
      items.push({
        contractAddress: MIYAMAKER_MINI.address,
        tokenId,
        name: `Miyamaker Mini #${tokenId}`,
        image: fallbackTokenImage(MIYAMAKER_MINI.address, tokenId),
        collectionId: MIYAMAKER_MINI.id,
        collectionName: MIYAMAKER_MINI.name,
      });
    });
  }
  return items;
}

export async function loadOwnedNfts(address: string): Promise<OwnedLookup> {
  if (!isEthAddress(address)) throw new Error("Valid Ethereum address required");
  const local = async () => itemsFromApi(await getJson(`/api/miyamaker/owned?address=${address}`), address);

  if (HAS_BACKEND) {
    const api = await local();
    if (api) return api;
  }

  const balances = await balancesFromRpc(address);
  const held = SANCTIONED_NFTS.filter((c) => (balances[c.id] ?? 0) > 0).map((c) => c.id);
  let items: OwnedNftItem[] = [];
  if ((balances[MIYAMAKER_MINI.id] ?? 0) > 0) {
    try {
      const status = await loadMiyamakerStatus();
      items = await scanMiniOwned(address, status.minted);
    } catch {
      items = [];
    }
  }
  const php = !HAS_BACKEND ? await local() : null;
  if (php && php.items.length > items.length) return php;
  return { address, held, items, balances, source: "rpc" };
}


