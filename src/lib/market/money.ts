import { formatUnits, getAddress, parseUnits } from "ethers";
import {
  CULT_ADDRESS,
  USDC_ADDRESS,
  type CurrencyId,
  currencyById,
  isCurrencyId,
} from "@/data/market";
import {
  isNativeList,
  isOpenList,
  type ScatterMintList,
} from "@/lib/scatter";

export function formatPrice(id: CurrencyId, raw: string): string {
  const c = currencyById(id);
  if (c.kind === "invoice") return `${raw} ${id}`;
  return `${formatUnits(raw, c.decimals)} ${id}`;
}

export function parsePrice(id: CurrencyId, text: string): string {
  const t = text.trim();
  const c = currencyById(id);
  if (c.kind === "invoice") {
    const re = id === "BTC" ? /^\d+(\.\d{1,8})?$/ : /^\d+(\.\d{1,12})?$/;
    if (!re.test(t) || Number(t) <= 0) throw new Error("Enter a price above zero.");
    return t;
  }
  let raw: bigint;
  try {
    raw = parseUnits(t, c.decimals);
  } catch {
    throw new Error("Enter a plain decimal price.");
  }
  if (raw <= BigInt(0)) throw new Error("Enter a price above zero.");
  return raw.toString();
}

export function payAddressOk(id: CurrencyId, value: string): boolean {
  const v = value.trim();
  if (id === "BTC") return /^(bc1[ac-hj-np-z02-9]{11,71}|[13][a-km-zA-HJ-NP-Z1-9]{25,34})$/.test(v);
  if (id === "XMR") return /^[48][0-9A-Za-z]{94}([0-9A-Za-z]{11})?$/.test(v);
  try {
    getAddress(v);
    return true;
  } catch {
    return false;
  }
}

/** Open Scatter lists that take ETH, USDC, or CULT. Includes extra public roots such as the Mialien CULT list. */
export function listSettlement(list: ScatterMintList): CurrencyId | null {
  if (!isOpenList(list)) return null;
  if (isNativeList(list)) return "ETH";
  const a = (list.currencyAddress || "").toLowerCase();
  if (a === USDC_ADDRESS.toLowerCase()) return "USDC";
  if (a === CULT_ADDRESS.toLowerCase()) return "CULT";
  return null;
}

export function openPayableLists(lists: ScatterMintList[]): ScatterMintList[] {
  const rank = (id: CurrencyId) => (id === "CULT" ? 0 : id === "ETH" ? 1 : 2);
  return lists
    .filter((L) => listSettlement(L))
    .sort((a, b) => rank(listSettlement(a) as CurrencyId) - rank(listSettlement(b) as CurrencyId));
}

export function settlementLabel(list: ScatterMintList): string {
  const id = listSettlement(list);
  if (!id || !isCurrencyId(id)) return list.currency || "ETH";
  return id;
}

export function scaleListPrice(list: ScatterMintList, qty: number): string {
  const id = listSettlement(list);
  if (!id) return list.tokenPrice;
  const c = currencyById(id);
  if (c.kind === "invoice") return list.tokenPrice;
  try {
    const raw = parseUnits(String(list.tokenPrice), c.decimals) * BigInt(Math.max(1, qty));
    return formatUnits(raw, c.decimals);
  } catch {
    return list.tokenPrice;
  }
}
