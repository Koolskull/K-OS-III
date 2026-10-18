/**
 * K-OS bazaar money and settlement contracts.
 * ETH, USDC, BTC, and XMR are the default rails. CULT is the only extra coin.
 * On-chain NFT sales use Seaport 1.6. The order book is Ethereum Attestation Service.
 */

export const ZERO_ADDRESS = "0x0000000000000000000000000000000000000000";
export const ZERO_BYTES32 = `0x${"0".repeat(64)}`;

export const SEAPORT_16 = "0x0000000000000068F116a894984e2DB1123eB395";
export const EAS = "0xA1207F3BBa224E2c9c3c6D5aF63D0eb1582Ce587";
export const EAS_SCHEMA_REGISTRY = "0xA7b39296258348C78294F95B872b282326A97BDF";
/** One string field. UID is keccak256(abi.encodePacked(schema, resolver, revocable)). */
export const EAS_SCHEMA = "string korder";

export const USDC_ADDRESS = "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48";
export const CULT_ADDRESS = "0x0000000000c5dc95539589fbD24BE07c6C14eCa4";

export const LIST_SECONDS = 30 * 24 * 60 * 60;

export type CurrencyId = "ETH" | "USDC" | "BTC" | "XMR" | "CULT";

export interface Currency {
  id: CurrencyId;
  /** eth and erc20 settle inside the Seaport transaction. invoice is a direct payment. */
  kind: "eth" | "erc20" | "invoice";
  address: string;
  decimals: number;
}

export const CURRENCIES: Currency[] = [
  { id: "ETH", kind: "eth", address: ZERO_ADDRESS, decimals: 18 },
  { id: "USDC", kind: "erc20", address: USDC_ADDRESS, decimals: 6 },
  { id: "BTC", kind: "invoice", address: ZERO_ADDRESS, decimals: 8 },
  { id: "XMR", kind: "invoice", address: ZERO_ADDRESS, decimals: 12 },
  { id: "CULT", kind: "erc20", address: CULT_ADDRESS, decimals: 18 },
];

const byId = new Map(CURRENCIES.map((c) => [c.id, c]));

export function currencyById(id: CurrencyId): Currency {
  const c = byId.get(id);
  if (!c) throw new Error("Unknown currency");
  return c;
}

export function isCurrencyId(value: string): value is CurrencyId {
  return byId.has(value as CurrencyId);
}

export function atomicCurrency(id: CurrencyId): boolean {
  return currencyById(id).kind !== "invoice";
}
