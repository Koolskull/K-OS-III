/**
 * The piece a mint will create, plus recent and wallet galleries.
 * These contracts mint 1..supply in order. tokenURI(supply) exists and
 * tokenURI(supply+1) reverts, but the next file is already hosted.
 * Stat traits and the broken Windows-path trait are not assets.
 */

import { Interface } from "ethers";
import { getSanctioned } from "@/data/sanctioned-nfts";
import { loadOwnedNfts } from "@/lib/mintClient";
import { openSeaAsk, openSeaBestOffer, openSeaHeld, type SeaHeld } from "@/lib/market/opensea";
import { publicEthCall } from "@/lib/publicEth";

const uriIface = new Interface(["function tokenURI(uint256 tokenId) view returns (string)"]);
const TRANSFER = "0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef";
const ZERO_TOPIC = `0x${"0".repeat(64)}`;
const IPFS = ["https://ipfs.io/ipfs/", "https://nftstorage.link/ipfs/", "https://w3s.link/ipfs/"];

const KNOWN_IMAGE: Record<string, (id: string) => string> = {
  "0xc5759dd58057808568c698ffdc4ad5548d17e75a": (id) => `https://stardrain.app/mialien/metadata/images/${id}.jpg`,
  "0x375a1911c0c2982f59826c227b7830e5d5985d59": (id) => `https://koolskull.com/miyamakermini/metadata/images/${id}.png`,
};

export interface PieceTrait {
  type: string;
  value: string;
}

export interface MintPiece {
  tokenId: string;
  name: string;
  images: string[];
  traits: PieceTrait[];
  asset: string;
  rarity: number | null;
  price: number | null;
  priceLabel: string | null;
  priceSymbol: string;
  offer: number | null;
  offerLabel: string | null;
  offerSymbol: string;
}

export type PieceSort = "asset" | "rarity" | "price" | "offer";

export type TraitCounts = Record<string, Record<string, number>>;

export function skipTrait(type: string): boolean {
  if (type.includes("\\") || type.toLowerCase().includes("mialienmaker-engine")) return true;
  const t = type.replace(/[^a-z]/gi, "").toLowerCase();
  return t.startsWith("atk") || t.startsWith("def");
}

export function knownImages(contract: string, tokenId: string): string[] {
  const build = KNOWN_IMAGE[contract.toLowerCase()];
  return build ? [build(tokenId)] : [];
}

export function blankPiece(tokenId: string, images: string[], name = ""): MintPiece {
  const label = name || `#${tokenId}`;
  return {
    tokenId,
    name: label,
    images,
    traits: [],
    asset: label,
    rarity: null,
    price: null,
    priceLabel: null,
    priceSymbol: "",
    offer: null,
    offerLabel: null,
    offerSymbol: "",
  };
}

export function provisionalRecent(contract: string, lastId: number, count: number): MintPiece[] {
  const rows: MintPiece[] = [];
  for (let id = lastId; id >= 1 && rows.length < count; id--) {
    rows.push(blankPiece(String(id), knownImages(contract, String(id))));
  }
  return rows;
}

export function swapTrailingId(uri: string, tokenId: string): string | null {
  const hash = uri.split("#");
  const q = hash[0].split("?");
  const parts = q[0].split("/");
  if (!/^\d+$/.test(parts[parts.length - 1] || "")) return null;
  parts[parts.length - 1] = tokenId;
  return `${parts.join("/")}${q[1] ? `?${q[1]}` : ""}${hash[1] ? `#${hash[1]}` : ""}`;
}

export function gatewayUrls(uri: string): string[] {
  if (!uri) return [];
  if (uri.startsWith("ipfs://")) {
    const path = uri.slice("ipfs://".length).replace(/^ipfs\//, "");
    return IPFS.map((host) => host + path);
  }
  if (uri.startsWith("https://") || uri.startsWith("data:image/")) return [uri];
  return [];
}

export async function findTemplate(contract: string, minted: number): Promise<{ uri: string; lastId: number } | null> {
  const start = Math.max(0, minted);
  if (start < 1) return null;
  for (let id = start; id >= Math.max(1, start - 6); id--) {
    try {
      const data = uriIface.encodeFunctionData("tokenURI", [BigInt(id)]);
      const hex = await publicEthCall(contract, data);
      if (!hex || hex === "0x") continue;
      const decoded = uriIface.decodeFunctionResult("tokenURI", hex);
      const uri = String(decoded[0] || "");
      if (uri) return { uri, lastId: id };
    } catch {
      /* that id is not minted */
    }
  }
  return null;
}

export async function loadPiece(template: string, contract: string, tokenId: string): Promise<MintPiece> {
  const uri = template ? swapTrailingId(template, tokenId) : null;
  const meta = uri ? await readMeta(uri) : null;
  const traits = parseTraits(meta?.attributes);
  const name = meta?.name ? String(meta.name) : `#${tokenId}`;
  const images = unique([
    ...knownImages(contract, tokenId),
    ...(meta?.image ? gatewayUrls(String(meta.image)) : []),
    ...guessImages(template, tokenId),
  ]);
  return { ...blankPiece(tokenId, images, name), traits, asset: assetOf(traits, name, tokenId) };
}

export async function loadSpan(template: string, contract: string, startId: number, count: number): Promise<MintPiece[]> {
  const ids: string[] = [];
  const n = Math.max(1, Math.min(20, count));
  for (let i = 0; i < n; i++) ids.push(String(startId + i));
  return mapPool(ids, 4, (id) => loadPiece(template, contract, id));
}

export async function loadRecent(template: string, contract: string, lastId: number, count: number): Promise<MintPiece[]> {
  const ids: string[] = [];
  for (let id = lastId; id >= 1 && ids.length < count; id--) ids.push(String(id));
  return mapPool(ids, 4, (id) => loadPiece(template, contract, id));
}

export function applyRarity(rows: MintPiece[], counts: TraitCounts, supply: number): MintPiece[] {
  if (!supply || !Object.keys(counts).length) return rows;
  return rows.map((row) => ({ ...row, rarity: rarityScore(row.traits, counts, supply) }));
}

export function sortPieces(rows: MintPiece[], sort: PieceSort): MintPiece[] {
  const copy = [...rows];
  copy.sort((a, b) => {
    if (sort === "asset") {
      const byAsset = a.asset.localeCompare(b.asset);
      if (byAsset) return byAsset;
      return Number(a.tokenId) - Number(b.tokenId);
    }
    if (sort === "rarity") {
      if (a.rarity == null && b.rarity == null) return Number(b.tokenId) - Number(a.tokenId);
      if (a.rarity == null) return 1;
      if (b.rarity == null) return -1;
      return b.rarity - a.rarity;
    }
    if (sort === "price") return compareMoney(a.price, a.priceSymbol, b.price, b.priceSymbol, true);
    return compareMoney(a.offer, a.offerSymbol, b.offer, b.offerSymbol, false);
  });
  return copy;
}

export async function attachQuotes(slug: string, rows: MintPiece[]): Promise<MintPiece[]> {
  if (!rows.length) return rows;
  let dead = false;
  return mapPool(rows, 3, async (row) => {
    if (dead) return row;
    try {
      const [ask, bid] = await Promise.all([
        openSeaAsk(slug, row.tokenId, row.name),
        openSeaBestOffer(slug, row.tokenId),
      ]);
      const price = ask ? parseMoney(ask.price) : null;
      return {
        ...row,
        price: price?.amount ?? null,
        priceLabel: price ? pretty(price.amount, price.symbol) : null,
        priceSymbol: price?.symbol ?? "",
        offer: bid?.amount ?? null,
        offerLabel: bid?.label ?? null,
        offerSymbol: bid?.symbol ?? "",
      };
    } catch {
      dead = true;
      return row;
    }
  });
}

export async function loadWalletPieces(
  address: string,
  contract: string,
): Promise<{ pieces: MintPiece[]; holding: boolean }> {
  const sea = getSanctioned(contract)?.openseaSlug ?? null;
  if (sea) {
    try {
      let held = (await openSeaHeld(address, sea)).filter((row) => row.contract.toLowerCase() === contract.toLowerCase());
      if (!held.length) {
        held = (await openSeaHeld(address, null)).filter((row) => row.contract.toLowerCase() === contract.toLowerCase());
      }
      if (held.length) return { pieces: held.map(pieceFromHeld), holding: true };
    } catch {
      /* chain scan below */
    }
  }
  const owned = await loadOwnedNfts(address).catch(() => null);
  const id = getSanctioned(contract)?.id;
  const holding = Boolean(id && owned && (owned.balances[id] ?? 0) > 0);
  const pieces = (owned?.items ?? [])
    .filter((item) => item.contractAddress.toLowerCase() === contract.toLowerCase())
    .map((item) => {
      const tokenId = decimalId(item.tokenId);
      const images = item.image ? [item.image, ...knownImages(contract, tokenId)] : knownImages(contract, tokenId);
      return blankPiece(tokenId, unique(images), item.name || "");
    });
  return { pieces, holding: holding || pieces.length > 0 };
}

export function mintedIds(
  logs: { address: string; topics: string[] }[],
  contract: string,
  minter: string,
): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const log of logs) {
    if (log.address.toLowerCase() !== contract.toLowerCase()) continue;
    const topics = log.topics || [];
    if ((topics[0] || "").toLowerCase() !== TRANSFER) continue;
    const fromZero = (topics[1] || "").toLowerCase() === ZERO_TOPIC;
    const toMinter = Boolean(topics[2] && topics[2].toLowerCase().endsWith(minter.toLowerCase().replace(/^0x/, "")));
    if (!fromZero && !toMinter) continue;
    if (!topics[3]) continue;
    try {
      const id = BigInt(topics[3]).toString();
      if (seen.has(id)) continue;
      seen.add(id);
      out.push(id);
    } catch {
      /* not a token id */
    }
  }
  return out;
}

function pieceFromHeld(held: SeaHeld): MintPiece {
  const images = unique([...(held.image ? [held.image] : []), ...knownImages(held.contract, held.tokenId)]);
  return {
    ...blankPiece(held.tokenId, images, held.name),
    traits: held.traits,
    asset: assetOf(held.traits, held.name, held.tokenId),
  };
}

function assetOf(traits: PieceTrait[], name: string, tokenId: string): string {
  const real = traits.filter((t) => !skipTrait(t.type));
  const body = real.find((t) => /^body$/i.test(t.type.trim()));
  const item = real.find((t) => /^item$/i.test(t.type.trim()));
  const lead = body || item || real[0];
  if (lead?.value) return lead.value;
  return name || `#${tokenId}`;
}

function rarityScore(traits: PieceTrait[], counts: TraitCounts, supply: number): number | null {
  let total = 0;
  let used = 0;
  for (const trait of traits) {
    if (skipTrait(trait.type)) continue;
    const n = counts[trait.type.toLowerCase()]?.[trait.value.toLowerCase()];
    if (!n) continue;
    total += supply / n;
    used++;
  }
  if (!used) return null;
  return Math.round(total * 10) / 10;
}

function compareMoney(
  av: number | null,
  as: string,
  bv: number | null,
  bs: string,
  lowFirst: boolean,
): number {
  if (av == null && bv == null) return 0;
  if (av == null) return 1;
  if (bv == null) return -1;
  if (as !== bs) return as < bs ? -1 : 1;
  return lowFirst ? av - bv : bv - av;
}

function parseMoney(label: string): { amount: number; symbol: string } | null {
  const match = label.trim().match(/^([0-9]+(?:\.[0-9]+)?)\s+([A-Za-z0-9]+)$/);
  if (!match) return null;
  const amount = Number(match[1]);
  if (!Number.isFinite(amount)) return null;
  return { amount, symbol: match[2].toUpperCase() };
}

function pretty(amount: number, symbol: string): string {
  return `${amount.toFixed(6).replace(/\.?0+$/, "")} ${symbol}`;
}

function parseTraits(value: unknown): PieceTrait[] {
  if (!Array.isArray(value)) return [];
  const out: PieceTrait[] = [];
  for (const row of value) {
    if (!row || typeof row !== "object") continue;
    const o = row as Record<string, unknown>;
    const type = o.trait_type ?? o.traitType;
    if (typeof type !== "string" || o.value == null) continue;
    out.push({ type, value: String(o.value) });
  }
  return out;
}

function guessImages(template: string, tokenId: string): string[] {
  const swapped = template ? swapTrailingId(template, tokenId) : null;
  if (!swapped) return [];
  const urls = gatewayUrls(swapped);
  const out: string[] = [];
  for (const url of urls) {
    if (/\.(png|jpe?g|gif|webp)$/i.test(url)) out.push(url);
    if (url.includes("/json/")) {
      const stem = url.replace("/json/", "/images/").replace(/\/$/, "");
      out.push(`${stem}.jpg`, `${stem}.png`, `${stem}.gif`);
    }
  }
  return out;
}

async function readMeta(uri: string): Promise<{ name?: string; image?: string; attributes?: unknown } | null> {
  for (const url of gatewayUrls(uri)) {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), 8000);
    try {
      const res = await fetch(url, { cache: "force-cache", signal: ctrl.signal });
      if (!res.ok) continue;
      const ct = res.headers.get("content-type") || "";
      if (ct.startsWith("image/")) return { image: url };
      const json = (await res.json()) as { name?: string; image?: string; attributes?: unknown };
      if (json && typeof json === "object") return json;
    } catch {
      /* next host */
    } finally {
      clearTimeout(timer);
    }
  }
  return null;
}

function unique(urls: string[]): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const url of urls) {
    if (!url || seen.has(url)) continue;
    seen.add(url);
    out.push(url);
  }
  return out;
}

function decimalId(id: string): string {
  if (/^\d+$/.test(id)) return id;
  if (/^0x[0-9a-fA-F]+$/.test(id)) {
    try {
      return BigInt(id).toString();
    } catch {
      return id;
    }
  }
  return id;
}

async function mapPool<T, R>(items: T[], limit: number, fn: (item: T) => Promise<R>): Promise<R[]> {
  const out: R[] = new Array(items.length);
  let cursor = 0;
  async function worker() {
    while (cursor < items.length) {
      const index = cursor;
      cursor += 1;
      out[index] = await fn(items[index]);
    }
  }
  const n = Math.min(limit, items.length);
  await Promise.all(Array.from({ length: n }, () => worker()));
  return out;
}
