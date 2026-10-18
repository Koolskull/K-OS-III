import { formatUnits, getAddress } from "ethers";
import { fallbackTokenImage, floorCollections, type SanctionedCollection } from "@/data/sanctioned-nfts";
import { CULT_ADDRESS, SEAPORT_16, USDC_ADDRESS, type CurrencyId } from "@/data/market";
import { formatPrice } from "@/lib/market/money";
import { type ConsiderationItem, type FloorListing, type KOrder, type OfferItem, type OrderComponents } from "@/lib/market/orders";

const API = "https://api.opensea.io/api/v2";
const KEY_STORE = "kos-opensea-key-v1";
/** OpenSea's fee recipient. Shown as its own line so the cut is not folded into the price. */
const OPENSEA_FEE = "0x0000a26b00c1f0df003000390027140000faa719";
const PAGE = 20;
const NFT_PAGE = 48;

export interface CatalogNft {
  id: string;
  collectionId: string;
  collectionName: string;
  slug: string;
  contract: string;
  tokenId: string;
  name: string;
  image: string | null;
}

interface SavedKey {
  key: string;
  exp: number;
}

let keyRequest: Promise<string> | null = null;

async function readKey(): Promise<string> {
  let saved: SavedKey | null = null;
  try {
    saved = JSON.parse(localStorage.getItem(KEY_STORE) || "null") as SavedKey | null;
  } catch {
    saved = null;
  }
  if (saved?.key && saved.exp > Date.now() + 60_000) return saved.key;
  if (!keyRequest) {
    keyRequest = mintKey().finally(() => {
      keyRequest = null;
    });
  }
  return keyRequest;
}

async function mintKey(): Promise<string> {
  const res = await fetch(`${API}/auth/keys`, {
    method: "POST",
    headers: { Accept: "application/json", "Content-Type": "application/json" },
    body: "{}",
  });
  if (!res.ok) throw new Error("OpenSea did not issue a read key.");
  const body = (await res.json()) as { api_key?: string; expires_at?: string };
  if (!body.api_key || !body.expires_at) throw new Error("OpenSea did not issue a read key.");
  const exp = Date.parse(body.expires_at);
  localStorage.setItem(KEY_STORE, JSON.stringify({ key: body.api_key, exp }));
  return body.api_key;
}

async function osGet(path: string, key: string): Promise<unknown> {
  const res = await fetch(`${API}${path}`, {
    headers: { Accept: "application/json", "x-api-key": key },
  });
  if (res.status === 404) return null;
  if (res.status === 401) {
    localStorage.removeItem(KEY_STORE);
    throw new Error("OpenSea refused the read key.");
  }
  if (!res.ok) throw new Error("OpenSea floor is unavailable.");
  return res.json();
}

function digits(value: unknown): string {
  if (typeof value === "number" && Number.isFinite(value)) return String(Math.trunc(value));
  if (typeof value === "string" && /^\d+$/.test(value)) return value;
  return "";
}

function bytes32(value: unknown): string {
  return typeof value === "string" && /^0x[0-9a-fA-F]{64}$/.test(value) ? value : "";
}

function offerItem(value: unknown): OfferItem | null {
  if (!value || typeof value !== "object") return null;
  const row = value as Record<string, unknown>;
  const itemType = Number(row.itemType);
  const identifierOrCriteria = digits(row.identifierOrCriteria);
  const startAmount = digits(row.startAmount);
  const endAmount = digits(row.endAmount);
  if (!Number.isInteger(itemType) || !identifierOrCriteria || !startAmount || startAmount !== endAmount) return null;
  try {
    return {
      itemType,
      token: getAddress(String(row.token)),
      identifierOrCriteria,
      startAmount,
      endAmount,
    };
  } catch {
    return null;
  }
}

function considerationItem(value: unknown): ConsiderationItem | null {
  const base = offerItem(value);
  if (!base || !value || typeof value !== "object") return null;
  try {
    return { ...base, recipient: getAddress(String((value as { recipient?: string }).recipient)) };
  } catch {
    return null;
  }
}

function listingFromApi(entry: unknown, collectionName: string): FloorListing | null {
  if (!entry || typeof entry !== "object") return null;
  const row = entry as Record<string, unknown>;
  if (row.status !== "ACTIVE") return null;
  if (String(row.protocol_address || "").toLowerCase() !== SEAPORT_16.toLowerCase()) return null;
  const proto = row.protocol_data as { parameters?: Record<string, unknown>; signature?: string } | undefined;
  const params = proto?.parameters;
  const signature = proto?.signature;
  if (!params || typeof signature !== "string" || !signature.startsWith("0x")) return null;
  const offer = Array.isArray(params.offer) ? params.offer.map(offerItem) : [];
  const consideration = Array.isArray(params.consideration) ? params.consideration.map(considerationItem) : [];
  if (offer.length !== 1 || offer[0]?.itemType !== 2 || consideration.length === 0) return null;
  if (consideration.some((item) => !item)) return null;
  const pay = consideration as ConsiderationItem[];
  const zone = typeof params.zone === "string" ? params.zone : "";
  const zoneHash = bytes32(params.zoneHash);
  const conduitKey = bytes32(params.conduitKey);
  const salt = digits(params.salt);
  const counter = digits(params.counter);
  const startTime = digits(params.startTime);
  const endTime = digits(params.endTime);
  const orderHash = bytes32(row.order_hash);
  if (!zone || !zoneHash || !conduitKey || !salt || !counter || !startTime || !endTime || !orderHash) return null;
  let offerer = "";
  try {
    offerer = getAddress(String(params.offerer));
  } catch {
    return null;
  }
  const parameters: OrderComponents = {
    offerer,
    zone: getAddress(zone),
    offer: [offer[0]],
    consideration: pay,
    orderType: Number(params.orderType) || 0,
    startTime,
    endTime,
    zoneHash,
    salt,
    conduitKey,
    counter,
  };
  const price = row.price as { current?: { currency?: string; decimals?: number; value?: string } } | undefined;
  const current = price?.current;
  const symbol = (current?.currency || "ETH").toUpperCase();
  const decimals = Number(current?.decimals ?? 18);
  const raw = digits(current?.value);
  if (!raw) return null;
  const currency = payCurrency(pay);
  const order: KOrder = {
    v: 1,
    kind: "seaport",
    currency: currency ?? "ETH",
    offerer,
    raw,
    nft: { contract: offer[0].token, tokenId: offer[0].identifierOrCriteria },
    seaport: { parameters, signature },
  };
  return {
    id: orderHash,
    order,
    price: currency ? formatPrice(currency, raw) : `${formatUnits(raw, decimals)} ${symbol}`,
    collectionName,
    venue: "opensea",
    paySymbol: currency ?? symbol,
    fees: feeLines(pay, offerer, symbol, decimals),
  };
}

function payCurrency(items: ConsiderationItem[]): CurrencyId | null {
  if (items.every((item) => item.itemType === 0)) return "ETH";
  const token = items[0]?.token.toLowerCase();
  if (!token || items.some((item) => item.itemType !== 1 || item.token.toLowerCase() !== token)) return null;
  if (token === USDC_ADDRESS.toLowerCase()) return "USDC";
  if (token === CULT_ADDRESS.toLowerCase()) return "CULT";
  return null;
}

function feeLines(items: ConsiderationItem[], offerer: string, symbol: string, decimals: number): [string, string][] {
  const buckets = new Map<string, bigint>();
  for (const item of items) {
    const who = item.recipient.toLowerCase();
    const label = who === offerer.toLowerCase() ? "SELLER RECEIVES" : who === OPENSEA_FEE ? "OPENSEA FEE" : "CREATOR FEE";
    buckets.set(label, (buckets.get(label) ?? BigInt(0)) + BigInt(item.startAmount));
  }
  return [...buckets.entries()].map(([label, amount]) => [label, `${formatUnits(amount, decimals)} ${symbol}`]);
}

function nftFromApi(value: unknown, col: SanctionedCollection): CatalogNft | null {
  if (!value || typeof value !== "object" || !col.openseaSlug) return null;
  const row = value as Record<string, unknown>;
  const tokenId = digits(row.identifier);
  if (!tokenId) return null;
  let contract = "";
  try {
    contract = getAddress(String(row.contract));
  } catch {
    return null;
  }
  const display = typeof row.display_image_url === "string" ? row.display_image_url : "";
  const rawImage = typeof row.image_url === "string" ? row.image_url : "";
  const named = typeof row.name === "string" ? row.name.trim() : "";
  return {
    id: `${contract.toLowerCase()}:${tokenId}`,
    collectionId: col.id,
    collectionName: col.name,
    slug: col.openseaSlug,
    contract,
    tokenId,
    name: named || `${col.name} #${tokenId}`,
    image: display || rawImage || fallbackTokenImage(contract, tokenId),
  };
}

/** One page of a koolskull collection, listed or not. */
export async function openSeaNfts(collectionId: string, cursor: string | null): Promise<{ nfts: CatalogNft[]; next: string | null }> {
  const col = floorCollections().find((item) => item.id === collectionId);
  if (!col?.openseaSlug) return { nfts: [], next: null };
  const key = await readKey();
  const query = new URLSearchParams({ limit: String(NFT_PAGE) });
  if (cursor) query.set("next", cursor);
  const body = (await osGet(`/collection/${col.openseaSlug}/nfts?${query}`, key)) as {
    nfts?: unknown[];
    next?: unknown;
  } | null;
  const nfts = (body?.nfts ?? []).map((row) => nftFromApi(row, col)).filter((row): row is CatalogNft => Boolean(row));
  const next = typeof body?.next === "string" && body.next ? body.next : null;
  return { nfts, next };
}

/** First page of every floor collection, or one collection when an id is passed. */
export async function openSeaGallery(collectionId: string, cursor: string | null): Promise<{ nfts: CatalogNft[]; next: string | null }> {
  if (collectionId === "all") {
    const pages = await Promise.all(floorCollections().map((col) => openSeaNfts(col.id, null)));
    const seen = new Set<string>();
    const nfts: CatalogNft[] = [];
    for (const page of pages) {
      for (const nft of page.nfts) {
        if (seen.has(nft.id)) continue;
        seen.add(nft.id);
        nfts.push(nft);
      }
    }
    return { nfts, next: null };
  }
  return openSeaNfts(collectionId, cursor);
}

/** Best ask for one token. Null when it is not listed. */
export async function openSeaAsk(slug: string, tokenId: string, collectionName: string): Promise<FloorListing | null> {
  if (!/^\d+$/.test(tokenId)) return null;
  const key = await readKey();
  const body = await osGet(`/listings/collection/${encodeURIComponent(slug)}/nfts/${tokenId}/best`, key);
  return listingFromApi(body, collectionName);
}

/** Cheapest active OpenSea asks for the koolskull collections on the floor. */
export async function openSeaFloor(): Promise<FloorListing[]> {
  const key = await readKey();
  const collections = floorCollections().filter((col) => col.openseaSlug);
  const pages = await Promise.all(
    collections.map(async (col) => {
      const body = (await osGet(`/listings/collection/${col.openseaSlug}/best?limit=${PAGE}`, key)) as {
        listings?: unknown[];
      } | null;
      return (body?.listings ?? [])
        .map((row) => listingFromApi(row, col.name))
        .filter((row): row is FloorListing => Boolean(row));
    }),
  );
  const seen = new Set<string>();
  const rows: FloorListing[] = [];
  for (const page of pages) {
    for (const row of page) {
      if (seen.has(row.id)) continue;
      seen.add(row.id);
      rows.push(row);
    }
  }
  rows.sort((a, b) => {
    const as = a.paySymbol || a.order.currency;
    const bs = b.paySymbol || b.order.currency;
    if (as !== bs) return as < bs ? -1 : 1;
    const av = BigInt(a.order.raw);
    const bv = BigInt(b.order.raw);
    if (av === bv) return 0;
    return av < bv ? -1 : 1;
  });
  return rows;
}
