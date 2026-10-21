import { formatUnits, getAddress } from "ethers";
import { fallbackTokenImage, floorCollections, getSanctioned, isWideArt, type SanctionedCollection } from "@/data/sanctioned-nfts";
import { CULT_ADDRESS, SEAPORT_16, USDC_ADDRESS, type CurrencyId } from "@/data/market";
import { formatPrice } from "@/lib/market/money";
import { nftMedia, wideStill } from "@/lib/mediaKind";
import { publicSaleTiles } from "@/lib/market/publicFloor";
import { type ConsiderationItem, type FloorListing, type KOrder, type OfferItem, type OrderComponents } from "@/lib/market/orders";

const API = "https://api.opensea.io/api/v2";
const KEY_STORE = "kos-opensea-key-v1";
/** OpenSea's fee recipient. Shown as its own line so the cut is not folded into the price. */
const OPENSEA_FEE = "0x0000a26b00c1f0df003000390027140000faa719";
const PAGE = 20;
const NFT_PAGE = 48;
const SALE_PAGE = 50;

export interface CatalogNft {
  id: string;
  collectionId: string;
  collectionName: string;
  slug: string;
  contract: string;
  tokenId: string;
  name: string;
  image: string | null;
  /** Largest still. The gallery tile keeps `image`. */
  full?: string | null;
  /** HTML, audio, or video file when the token has one. */
  animation?: string | null;
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

async function readBody(res: Response): Promise<unknown> {
  const text = await res.text();
  if (!text.trim()) return null;
  try {
    return JSON.parse(text);
  } catch {
    throw new Error("OpenSea listings are unavailable.");
  }
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
  return readBody(res);
}

async function osPost(path: string, key: string, body: unknown): Promise<unknown> {
  const res = await fetch(`${API}${path}`, {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
      "x-api-key": key,
    },
    body: JSON.stringify(body),
  });
  if (res.status === 404) return null;
  if (res.status === 401) {
    localStorage.removeItem(KEY_STORE);
    throw new Error("OpenSea refused the read key.");
  }
  if (!res.ok) throw new Error("OpenSea listings are unavailable.");
  return readBody(res);
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
  const named = typeof row.name === "string" ? row.name.trim() : "";
  const media = nftMedia(row);
  const fallback = fallbackTokenImage(contract, tokenId);
  return {
    id: `${contract.toLowerCase()}:${tokenId}`,
    collectionId: col.id,
    collectionName: col.name,
    slug: col.openseaSlug,
    contract,
    tokenId,
    name: named || `${col.name} #${tokenId}`,
    image: isWideArt(col.id) ? wideStill(media.full || media.image) || media.image || fallback : media.image || fallback,
    full: isWideArt(col.id) ? wideStill(media.full || media.image) || media.full || media.image || null : fallback || media.full || media.image || null,
    animation: media.animation || null,
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

export interface SaleTile {
  listing: FloorListing;
  nft: CatalogNft;
}

function plainId(tokenId: string): string {
  if (/^\d+$/.test(tokenId)) return tokenId.replace(/^0+/, "") || "0";
  return tokenId;
}

function saleTileFromListing(listing: FloorListing, col: SanctionedCollection): SaleTile | null {
  const token = listing.order.nft;
  if (!token || !col.openseaSlug) return null;
  const tokenId = plainId(token.tokenId);
  return {
    listing,
    nft: {
      id: `${token.contract.toLowerCase()}:${tokenId}`,
      collectionId: col.id,
      collectionName: col.name,
      slug: col.openseaSlug,
      contract: token.contract,
      tokenId,
      name: `${col.name} #${tokenId}`,
      image: fallbackTokenImage(token.contract, tokenId),
      full: fallbackTokenImage(token.contract, tokenId),
      animation: null,
    },
  };
}

function saleKey(tile: SaleTile): string {
  const cur = tile.listing.paySymbol || tile.listing.order.currency;
  return `${tile.nft.contract.toLowerCase()}:${plainId(tile.nft.tokenId)}:${cur}`;
}

/** One ask per token and currency. The smaller raw amount stays. */
export function mergeSaleTiles(prev: SaleTile[], extra: SaleTile[]): SaleTile[] {
  const map = new Map<string, SaleTile>();
  for (const tile of [...prev, ...extra]) {
    const key = saleKey(tile);
    const have = map.get(key);
    if (!have) {
      map.set(key, tile);
      continue;
    }
    try {
      if (BigInt(tile.listing.order.raw) < BigInt(have.listing.order.raw)) map.set(key, tile);
    } catch {
      /* keep the ask already stored */
    }
  }
  return [...map.values()];
}

export function saleTileFromBook(row: FloorListing): SaleTile | null {
  const token = row.order.nft;
  if (!token) return null;
  const col = getSanctioned(token.contract);
  if (!col?.openseaSlug || !floorCollections().some((item) => item.id === col.id)) return null;
  return saleTileFromListing(row, col);
}

async function fillSaleImages(tiles: SaleTile[]): Promise<void> {
  const missing = tiles.filter((tile) => !tile.nft.image);
  if (!missing.length) return;
  const key = await readKey();
  for (let i = 0; i < missing.length; i += 40) {
    const chunk = missing.slice(i, i + 40);
    const body = (await osPost("/nfts/batch", key, {
      identifiers: chunk.map((tile) => ({
        chain: "ethereum",
        contract_address: tile.nft.contract,
        token_id: tile.nft.tokenId,
      })),
    })) as { nfts?: unknown[] } | null;
    const found = new Map<string, { name: string; image: string; full: string; animation: string }>();
    for (const row of body?.nfts ?? []) {
      if (!row || typeof row !== "object") continue;
      const rec = row as Record<string, unknown>;
      const contract = typeof rec.contract === "string" ? rec.contract.toLowerCase() : "";
      const tokenId = plainId(digits(rec.identifier));
      if (!contract || !tokenId) continue;
      const named = typeof rec.name === "string" ? rec.name.trim() : "";
      found.set(`${contract}:${tokenId}`, { name: named, ...nftMedia(rec) });
    }
    for (const tile of chunk) {
      const hit = found.get(`${tile.nft.contract.toLowerCase()}:${plainId(tile.nft.tokenId)}`);
      if (!hit) continue;
      if (!tile.nft.image && hit.image) tile.nft.image = hit.image;
      if (!tile.nft.full) tile.nft.full = hit.full || hit.image || tile.nft.image;
      if (hit.animation) tile.nft.animation = hit.animation;
      if (hit.name) tile.nft.name = hit.name;
    }
  }
}

/** Art can lag. The ask is already on the tile. */
export async function withSaleImages(tiles: SaleTile[]): Promise<SaleTile[]> {
  const next = tiles.map((tile) => ({ ...tile, nft: { ...tile.nft } }));
  try {
    await fillSaleImages(next);
  } catch {
    /* a missing picture does not hide the price */
  }
  for (const tile of next) {
    if (!isWideArt(tile.nft.collectionId)) continue;
    const wide = wideStill(tile.nft.full || tile.nft.image);
    if (!wide) continue;
    tile.nft.image = wide;
    tile.nft.full = wide;
  }
  return next;
}

/**
 * Active asks, cheapest first within each collection.
 * Pass cursors to read the next page of collections that still have one.
 * `null` reads the first page. "all" keeps each collection's own page.
 */
async function readRestSales(
  collectionId: string,
  cursors: Record<string, string | null> | null,
): Promise<{ tiles: SaleTile[]; next: Record<string, string | null> }> {
  const cols = (collectionId === "all" ? floorCollections() : floorCollections().filter((col) => col.id === collectionId)).filter(
    (col) => col.openseaSlug,
  );
  const targets = cursors ? cols.filter((col) => Boolean(cursors[col.id])) : cols;
  if (!targets.length) return { tiles: [], next: {} };
  const key = await readKey();
  const settled = await Promise.allSettled(
    targets.map(async (col) => {
      const query = new URLSearchParams({ limit: String(SALE_PAGE) });
      const cursor = cursors?.[col.id];
      if (cursor) query.set("next", cursor);
      const body = (await osGet(`/listings/collection/${col.openseaSlug}/best?${query}`, key)) as {
        listings?: unknown[];
        next?: unknown;
      } | null;
      const tiles = (body?.listings ?? [])
        .map((row) => {
          const listing = listingFromApi(row, col.name);
          return listing ? saleTileFromListing(listing, col) : null;
        })
        .filter((row): row is SaleTile => Boolean(row));
      const next = typeof body?.next === "string" && body.next ? body.next : null;
      return { id: col.id, tiles, next };
    }),
  );
  const ok = settled.flatMap((row) => (row.status === "fulfilled" ? [row.value] : []));
  if (!ok.length) {
    const fail = settled.find((row) => row.status === "rejected");
    throw fail && fail.status === "rejected" ? fail.reason : new Error("OpenSea listings are unavailable.");
  }
  const byId = new Map(ok.map((row) => [row.id, row]));
  const tiles: SaleTile[] = [];
  const next: Record<string, string | null> = {};
  for (const col of targets) {
    const page = byId.get(col.id);
    if (!page) continue;
    tiles.push(...page.tiles);
    next[col.id] = page.next;
  }
  return { tiles: mergeSaleTiles([], tiles), next };
}

/** Active asks. The signed OpenSea book is preferred. When that read key is
 * refused, the public price list still fills the floor.
 */
export async function openSeaSales(
  collectionId: string,
  cursors: Record<string, string | null> | null,
): Promise<{ tiles: SaleTile[]; next: Record<string, string | null> }> {
  const listed = cursors ? null : publicSaleTiles(collectionId);
  try {
    const page = await readRestSales(collectionId, cursors);
    if (page.tiles.length) return page;
  } catch {
    /* a refused read key must not hide asks that are on the public floor */
  }
  if (!listed) return { tiles: [], next: {} };
  const tiles = await listed;
  return { tiles: mergeSaleTiles([], tiles), next: {} };
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

export interface TokenQuote {
  amount: number;
  symbol: string;
  label: string;
}

export interface SeaHeld {
  tokenId: string;
  name: string;
  image: string | null;
  contract: string;
  traits: { type: string; value: string }[];
}

function trimAmount(amount: number): string {
  return amount.toFixed(6).replace(/\.?0+$/, "");
}

/** Best offer price. Null when the token has no active offer. */
export async function openSeaBestOffer(slug: string, tokenId: string): Promise<TokenQuote | null> {
  if (!/^\d+$/.test(tokenId)) return null;
  const key = await readKey();
  const body = await osGet(`/offers/collection/${encodeURIComponent(slug)}/nfts/${tokenId}/best`, key);
  return quoteFrom(body);
}

/** Trait value counts for a collection. Keys are lowercased. Empty when OpenSea has no table. */
export async function openSeaTraitCounts(slug: string): Promise<Record<string, Record<string, number>>> {
  const key = await readKey();
  const body = await osGet(`/traits/${encodeURIComponent(slug)}`, key);
  return traitTable(body);
}

/** NFTs in a wallet. Pass a slug to ask OpenSea to narrow the page; still filter by contract. */
export async function openSeaHeld(address: string, slug: string | null): Promise<SeaHeld[]> {
  if (!/^0x[a-fA-F0-9]{40}$/.test(address)) return [];
  const key = await readKey();
  const query = new URLSearchParams({ limit: "50" });
  if (slug) query.set("collection", slug);
  const body = (await osGet(`/chain/ethereum/account/${address}/nfts?${query}`, key)) as { nfts?: unknown[] } | null;
  return (body?.nfts ?? []).map(heldFromApi).filter((row): row is SeaHeld => Boolean(row));
}

function quoteFrom(body: unknown): TokenQuote | null {
  if (Array.isArray(body)) return quoteFrom(body[0]);
  if (!body || typeof body !== "object") return null;
  const row = body as Record<string, unknown>;
  if (row.status && row.status !== "ACTIVE") return null;
  const price = row.price as { current?: { currency?: string; decimals?: number; value?: string } } | undefined;
  const current = price?.current;
  if (!current || !/^\d+$/.test(String(current.value || ""))) return null;
  const decimals = Number(current.decimals ?? 18);
  const symbol = String(current.currency || "ETH").toUpperCase();
  const amount = Number(formatUnits(String(current.value), Number.isFinite(decimals) ? decimals : 18));
  if (!Number.isFinite(amount)) return null;
  return { amount, symbol, label: `${trimAmount(amount)} ${symbol}` };
}

function traitTable(body: unknown): Record<string, Record<string, number>> {
  const out: Record<string, Record<string, number>> = {};
  if (!body || typeof body !== "object") return out;
  const root = body as Record<string, unknown>;
  const src = (root.counts && typeof root.counts === "object" ? root.counts : root.categories) as unknown;
  if (!src || typeof src !== "object" || Array.isArray(src)) return out;
  for (const [trait, values] of Object.entries(src as Record<string, unknown>)) {
    if (!values || typeof values !== "object" || Array.isArray(values)) continue;
    const bucket: Record<string, number> = {};
    for (const [value, count] of Object.entries(values as Record<string, unknown>)) {
      const n = typeof count === "number" ? count : Number(count);
      if (Number.isFinite(n) && n > 0) bucket[value.toLowerCase()] = n;
    }
    if (Object.keys(bucket).length) out[trait.toLowerCase()] = bucket;
  }
  return out;
}

function heldTraits(value: unknown): { type: string; value: string }[] {
  if (!Array.isArray(value)) return [];
  const out: { type: string; value: string }[] = [];
  for (const row of value) {
    if (!row || typeof row !== "object") continue;
    const o = row as Record<string, unknown>;
    const type = o.trait_type ?? o.traitType;
    if (typeof type !== "string" || o.value == null) continue;
    out.push({ type, value: String(o.value) });
  }
  return out;
}

function heldFromApi(value: unknown): SeaHeld | null {
  if (!value || typeof value !== "object") return null;
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
    tokenId,
    contract,
    name: named || `#${tokenId}`,
    image: display || rawImage || fallbackTokenImage(contract, tokenId),
    traits: heldTraits(row.traits),
  };
}
