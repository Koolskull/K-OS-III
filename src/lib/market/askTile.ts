import { getAddress } from "ethers";
import { wideStill } from "../mediaKind";
import { priceLabel, unitRaw } from "./askPrice.mjs";
import { type CurrencyId } from "@/data/market";
import { type FloorListing, type KOrder } from "@/lib/market/orders";
import { type CatalogNft, type SaleTile } from "@/lib/market/opensea";

export interface PublicAsk {
  tokenId: string;
  name: string;
  imageUrl: string;
  maker: string;
  symbol: string;
  unit: number;
  listingId: string;
}

export interface AskCollection {
  id: string;
  name: string;
  address: string;
  slug: string;
  wide: boolean;
  localImage: string | null;
}

const RAILS: Record<string, { id: CurrencyId; decimals: number }> = {
  ETH: { id: "ETH", decimals: 18 },
  WETH: { id: "ETH", decimals: 18 },
  USDC: { id: "USDC", decimals: 6 },
  CULT: { id: "CULT", decimals: 18 },
};

/** A visible ask. No signed Seaport payload, so the tile cannot invent a buy. */
export function askTile(col: AskCollection, ask: PublicAsk): SaleTile | null {
  if (!/^\d+$/.test(ask.tokenId)) return null;
  const rail = RAILS[ask.symbol.toUpperCase()] ?? { id: "ETH" as CurrencyId, decimals: 18 };
  let contract = "";
  let offerer = "";
  try {
    contract = getAddress(col.address);
    offerer = getAddress(ask.maker);
  } catch {
    return null;
  }
  const wide = wideStill(ask.imageUrl);
  const picture = col.wide ? wide || ask.imageUrl || col.localImage : col.localImage || ask.imageUrl || null;
  const price = priceLabel(ask.unit, ask.symbol);
  const order: KOrder = {
    v: 1,
    kind: "seaport",
    currency: rail.id,
    offerer,
    raw: unitRaw(ask.unit, rail.decimals),
    nft: { contract, tokenId: ask.tokenId },
  };
  const nft: CatalogNft = {
    id: `${contract.toLowerCase()}:${ask.tokenId}`,
    collectionId: col.id,
    collectionName: col.name,
    slug: col.slug,
    contract,
    tokenId: ask.tokenId,
    name: ask.name || `${col.name} #${ask.tokenId}`,
    image: picture,
    full: picture,
    animation: null,
  };
  const listing: FloorListing = {
    id: ask.listingId || `${contract.toLowerCase()}:${ask.tokenId}:${ask.symbol}`,
    order,
    price,
    collectionName: col.name,
    venue: "opensea",
    paySymbol: ask.symbol.toUpperCase(),
    fees: [
      ["ASK", price],
      ["FEE SPLIT", "ON THE OPENSEA ORDER"],
    ],
  };
  return { listing, nft };
}
