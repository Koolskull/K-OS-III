import { getAddress, id, keccak256, solidityPacked, toUtf8Bytes } from "ethers";
import { getSanctioned } from "@/data/sanctioned-nfts";
import {
  CULT_ADDRESS,
  EAS_SCHEMA,
  USDC_ADDRESS,
  ZERO_ADDRESS,
  ZERO_BYTES32,
  type CurrencyId,
  atomicCurrency,
  currencyById,
  isCurrencyId,
} from "@/data/market";
import { formatPrice } from "@/lib/market/money";

export interface OfferItem {
  itemType: number;
  token: string;
  identifierOrCriteria: string;
  startAmount: string;
  endAmount: string;
}

export interface ConsiderationItem extends OfferItem {
  recipient: string;
}

export interface OrderComponents {
  offerer: string;
  zone: string;
  offer: OfferItem[];
  consideration: ConsiderationItem[];
  orderType: number;
  startTime: string;
  endTime: string;
  zoneHash: string;
  salt: string;
  conduitKey: string;
  counter: string;
}

export interface SignedSeaport {
  parameters: OrderComponents;
  signature: string;
}

/** Posted into the on-chain book. Seaport fields are what the wallet signed. */
export interface KOrder {
  v: 1;
  kind: "seaport" | "invoice";
  currency: CurrencyId;
  offerer: string;
  raw: string;
  nft?: { contract: string; tokenId: string };
  art?: { title: string; image: string };
  payTo?: string;
  seaport?: SignedSeaport;
}

export interface FloorListing {
  id: string;
  order: KOrder;
  price: string;
  collectionName: string;
}

const TYPED = {
  OfferItem: [
    { name: "itemType", type: "uint8" },
    { name: "token", type: "address" },
    { name: "identifierOrCriteria", type: "uint256" },
    { name: "startAmount", type: "uint256" },
    { name: "endAmount", type: "uint256" },
  ],
  ConsiderationItem: [
    { name: "itemType", type: "uint8" },
    { name: "token", type: "address" },
    { name: "identifierOrCriteria", type: "uint256" },
    { name: "startAmount", type: "uint256" },
    { name: "endAmount", type: "uint256" },
    { name: "recipient", type: "address" },
  ],
  OrderComponents: [
    { name: "offerer", type: "address" },
    { name: "zone", type: "address" },
    { name: "offer", type: "OfferItem[]" },
    { name: "consideration", type: "ConsiderationItem[]" },
    { name: "orderType", type: "uint8" },
    { name: "startTime", type: "uint256" },
    { name: "endTime", type: "uint256" },
    { name: "zoneHash", type: "bytes32" },
    { name: "salt", type: "uint256" },
    { name: "conduitKey", type: "bytes32" },
    { name: "counter", type: "uint256" },
  ],
};

export const SEAPORT_TYPES = TYPED;

export const ATTESTED_TOPIC = id("Attested(address,address,bytes32,bytes32)");

export function schemaUid(): string {
  return keccak256(solidityPacked(["string", "address", "bool"], [EAS_SCHEMA, ZERO_ADDRESS, true]));
}

export function orderKey(order: KOrder): string {
  const sig = order.seaport?.signature;
  const basis = sig && sig.length > 10 ? sig : JSON.stringify(order);
  return `local:${keccak256(toUtf8Bytes(basis)).slice(2, 18)}`;
}

function addr(value: string): string {
  return getAddress(value);
}

function sameAddr(a: string, b: string): boolean {
  try {
    return addr(a).toLowerCase() === addr(b).toLowerCase();
  } catch {
    return false;
  }
}

function httpImage(value: string): string | null {
  const v = value.trim();
  if (v.length < 8 || v.length > 300) return null;
  if (v.startsWith("ipfs://")) {
    const path = v.slice("ipfs://".length).replace(/^ipfs\//, "");
    if (!path || path.includes("..") || /\s/.test(path)) return null;
    return `https://ipfs.io/ipfs/${path}`;
  }
  try {
    const u = new URL(v);
    if (u.protocol !== "https:") return null;
    return u.toString();
  } catch {
    return null;
  }
}

function currencyOfConsideration(item: ConsiderationItem): CurrencyId | null {
  if (item.itemType === 0 && sameAddr(item.token, ZERO_ADDRESS)) return "ETH";
  if (item.itemType === 1 && sameAddr(item.token, USDC_ADDRESS)) return "USDC";
  if (item.itemType === 1 && sameAddr(item.token, CULT_ADDRESS)) return "CULT";
  return null;
}

function asRecord(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== "object") return null;
  return value as Record<string, unknown>;
}

function readItem(value: unknown, withRecipient: boolean): ConsiderationItem | null {
  const o = asRecord(value);
  if (!o) return null;
  const itemType = Number(o.itemType);
  const token = typeof o.token === "string" ? o.token : "";
  const identifierOrCriteria = typeof o.identifierOrCriteria === "string" ? o.identifierOrCriteria : "";
  const startAmount = typeof o.startAmount === "string" ? o.startAmount : "";
  const endAmount = typeof o.endAmount === "string" ? o.endAmount : "";
  if (!Number.isInteger(itemType) || !token || !/^\d+$/.test(identifierOrCriteria)) return null;
  if (!/^\d+$/.test(startAmount) || startAmount !== endAmount || startAmount === "0") return null;
  try {
    addr(token);
  } catch {
    return null;
  }
  const base = { itemType, token: addr(token), identifierOrCriteria, startAmount, endAmount };
  if (!withRecipient) return { ...base, recipient: ZERO_ADDRESS };
  if (typeof o.recipient !== "string") return null;
  try {
    return { ...base, recipient: addr(o.recipient) };
  } catch {
    return null;
  }
}

/** Accept a book entry only when the signed terms match the displayed price and collection. */
export function parseKOrder(value: unknown): KOrder | null {
  const o = asRecord(value);
  if (!o || o.v !== 1) return null;
  if (o.kind !== "seaport" && o.kind !== "invoice") return null;
  if (typeof o.currency !== "string" || !isCurrencyId(o.currency)) return null;
  if (typeof o.offerer !== "string" || typeof o.raw !== "string") return null;
  let offerer: string;
  try {
    offerer = addr(o.offerer);
  } catch {
    return null;
  }
  const currency = o.currency;
  if (o.kind === "seaport") {
    if (!atomicCurrency(currency)) return null;
    const sea = asRecord(o.seaport);
    const params = asRecord(sea?.parameters);
    if (!sea || !params || typeof sea.signature !== "string" || !sea.signature.startsWith("0x")) return null;
    if (!Array.isArray(params.offer) || params.offer.length !== 1) return null;
    if (!Array.isArray(params.consideration) || params.consideration.length !== 1) return null;
    const offer = readItem(params.offer[0], false);
    const pay = readItem(params.consideration[0], true);
    if (!offer || !pay) return null;
    if (offer.itemType !== 2 || offer.startAmount !== "1") return null;
    const col = getSanctioned(offer.token);
    if (!col) return null;
    if (Number(params.orderType) !== 0) return null;
    if (!sameAddr(String(params.offerer ?? ""), offerer)) return null;
    if (!sameAddr(String(params.zone ?? ""), ZERO_ADDRESS)) return null;
    if (String(params.zoneHash ?? "") !== ZERO_BYTES32) return null;
    if (String(params.conduitKey ?? "") !== ZERO_BYTES32) return null;
    if (!/^\d+$/.test(String(params.counter ?? ""))) return null;
    if (!/^\d+$/.test(String(params.salt ?? ""))) return null;
    if (!/^\d+$/.test(String(params.startTime ?? "")) || !/^\d+$/.test(String(params.endTime ?? ""))) return null;
    const settled = currencyOfConsideration(pay);
    if (!settled || settled !== currency) return null;
    if (!sameAddr(pay.recipient, offerer)) return null;
    if (pay.identifierOrCriteria !== "0") return null;
    if (pay.startAmount !== o.raw) return null;
    const nft = asRecord(o.nft);
    if (!nft || !sameAddr(String(nft.contract ?? ""), offer.token)) return null;
    if (String(nft.tokenId) !== offer.identifierOrCriteria) return null;
    const parameters: OrderComponents = {
      offerer,
      zone: ZERO_ADDRESS,
      offer: [
        {
          itemType: offer.itemType,
          token: offer.token,
          identifierOrCriteria: offer.identifierOrCriteria,
          startAmount: offer.startAmount,
          endAmount: offer.endAmount,
        },
      ],
      consideration: [pay],
      orderType: 0,
      startTime: String(params.startTime),
      endTime: String(params.endTime),
      zoneHash: ZERO_BYTES32,
      salt: String(params.salt),
      conduitKey: ZERO_BYTES32,
      counter: String(params.counter),
    };
    return {
      v: 1,
      kind: "seaport",
      currency,
      offerer,
      raw: o.raw,
      nft: { contract: addr(offer.token), tokenId: offer.identifierOrCriteria },
      seaport: { parameters, signature: sea.signature },
    };
  }

  const nftRaw = asRecord(o.nft);
  const artRaw = asRecord(o.art);
  if (nftRaw && artRaw) return null;
  if (!nftRaw && !artRaw) return null;
  if (nftRaw) {
    if (atomicCurrency(currency)) return null;
    if (typeof nftRaw.contract !== "string" || typeof nftRaw.tokenId !== "string") return null;
    if (!getSanctioned(nftRaw.contract) || !/^\d+$/.test(nftRaw.tokenId)) return null;
    if (typeof o.payTo !== "string") return null;
    if (currency === "BTC" && !/^(bc1[ac-hj-np-z02-9]{11,71}|[13][a-km-zA-HJ-NP-Z1-9]{25,34})$/.test(o.payTo)) return null;
    if (currency === "XMR" && !/^[48][0-9A-Za-z]{94}([0-9A-Za-z]{11})?$/.test(o.payTo)) return null;
    if (!/^\d+(\.\d+)?$/.test(o.raw) || Number(o.raw) <= 0) return null;
    return {
      v: 1,
      kind: "invoice",
      currency,
      offerer,
      raw: o.raw,
      payTo: o.payTo,
      nft: { contract: addr(nftRaw.contract), tokenId: nftRaw.tokenId },
    };
  }
  const title = typeof artRaw?.title === "string" ? artRaw.title.trim() : "";
  const image = typeof artRaw?.image === "string" ? httpImage(artRaw.image) : null;
  if (!title || title.length > 80 || !image) return null;
  if (currency === "BTC" || currency === "XMR") {
    if (typeof o.payTo !== "string") return null;
    if (currency === "BTC" && !/^(bc1[ac-hj-np-z02-9]{11,71}|[13][a-km-zA-HJ-NP-Z1-9]{25,34})$/.test(o.payTo)) return null;
    if (currency === "XMR" && !/^[48][0-9A-Za-z]{94}([0-9A-Za-z]{11})?$/.test(o.payTo)) return null;
    if (!/^\d+(\.\d+)?$/.test(o.raw) || Number(o.raw) <= 0) return null;
    return { v: 1, kind: "invoice", currency, offerer, raw: o.raw, payTo: o.payTo, art: { title, image } };
  }
  if (!atomicCurrency(currency) || !/^\d+$/.test(o.raw) || o.raw === "0") return null;
  try {
    currencyById(currency);
  } catch {
    return null;
  }
  return { v: 1, kind: "invoice", currency, offerer, raw: o.raw, payTo: offerer, art: { title, image } };
}

export function listingFromOrder(order: KOrder, id: string): FloorListing {
  const col = order.nft ? getSanctioned(order.nft.contract) : undefined;
  return {
    id,
    order,
    price: formatPrice(order.currency, order.raw),
    collectionName: col?.name || (order.art ? "ART" : "NFT"),
  };
}

export function orderLive(order: KOrder, nowSec = Math.floor(Date.now() / 1000)): boolean {
  const end = order.seaport ? Number(order.seaport.parameters.endTime) : 0;
  const start = order.seaport ? Number(order.seaport.parameters.startTime) : 0;
  if (!order.seaport) return true;
  return start <= nowSec && nowSec <= end;
}
