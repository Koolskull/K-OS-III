import {
  AbiCoder,
  BrowserProvider,
  Interface,
  getAddress,
  type Eip1193Provider as EthersProvider,
} from "ethers";
import {
  EAS,
  EAS_SCHEMA,
  EAS_SCHEMA_REGISTRY,
  LIST_SECONDS,
  SEAPORT_16,
  ZERO_ADDRESS,
  ZERO_BYTES32,
  type CurrencyId,
  currencyById,
} from "@/data/market";
import { getSanctioned } from "@/data/sanctioned-nfts";
import type { Eip1193Provider } from "@/lib/walletProviders";
import { publicEthCall, publicEthRequest } from "@/lib/publicEth";
import {
  SEAPORT_TYPES,
  type KOrder,
  type OrderComponents,
  schemaUid,
} from "@/lib/market/orders";

const coder = AbiCoder.defaultAbiCoder();

const seaport = new Interface([
  "function getCounter(address offerer) view returns (uint256)",
  "function getOrderHash((address,address,(uint8,address,uint256,uint256,uint256)[],(uint8,address,uint256,uint256,uint256,address)[],uint8,uint256,uint256,bytes32,uint256,bytes32,uint256) order) view returns (bytes32)",
  "function getOrderStatus(bytes32 orderHash) view returns (bool isValidated, bool isCancelled, uint256 totalFilled, uint256 totalSize)",
  "function fulfillOrder(((address,address,(uint8,address,uint256,uint256,uint256)[],(uint8,address,uint256,uint256,uint256,address)[],uint8,uint256,uint256,bytes32,uint256,bytes32,uint256),bytes) order, bytes32 fulfillerConduitKey) payable returns (bytes4)",
  "function cancel((address,address,(uint8,address,uint256,uint256,uint256)[],(uint8,address,uint256,uint256,uint256,address)[],uint8,uint256,uint256,bytes32,uint256,bytes32,uint256)[] orders) returns (bool)",
]);

const erc721 = new Interface([
  "function ownerOf(uint256 tokenId) view returns (address)",
  "function tokenURI(uint256 tokenId) view returns (string)",
  "function isApprovedForAll(address owner, address operator) view returns (bool)",
  "function setApprovalForAll(address operator, bool approved)",
  "function safeTransferFrom(address from, address to, uint256 tokenId)",
]);

const erc20 = new Interface([
  "function allowance(address owner, address spender) view returns (uint256)",
  "function approve(address spender, uint256 amount) returns (bool)",
  "function balanceOf(address account) view returns (uint256)",
  "function transfer(address to, uint256 amount) returns (bool)",
]);

const registry = new Interface([
  "function register(string schema, address resolver, bool revocable) returns (bytes32)",
  "function getSchema(bytes32 uid) view returns (string schema, address resolver, bool revocable)",
]);

const eas = new Interface([
  "function attest((bytes32,(address,uint64,bool,bytes32,bytes,uint256)) request) payable returns (bytes32)",
  "function revoke((bytes32,(bytes32,uint256)) request) payable",
  "function getAttestation(bytes32 uid) view returns (bytes32 uid, bytes32 schema, uint64 time, uint64 expirationTime, uint64 revocationTime, bytes32 refUID, address recipient, address attester, bool revocable, bytes data)",
]);

export interface TxRequest {
  to: string;
  data?: string;
  value?: bigint;
}

export async function sendTx(provider: Eip1193Provider, from: string, tx: TxRequest): Promise<string> {
  const params: Record<string, string> = { from, to: tx.to };
  if (tx.data) params.data = tx.data;
  if (tx.value && tx.value > BigInt(0)) params.value = `0x${tx.value.toString(16)}`;
  const hash = await provider.request({ method: "eth_sendTransaction", params: [params] });
  if (typeof hash !== "string" || !hash.startsWith("0x")) throw new Error("Wallet did not return a transaction.");
  return hash;
}

export async function waitReceipt(hash: string): Promise<{ logs: { address: string; topics: string[]; data: string }[] }> {
  for (let i = 0; i < 45; i++) {
    const rec = (await publicEthRequest("eth_getTransactionReceipt", [hash]).catch(() => null)) as {
      status?: string;
      logs?: { address: string; topics: string[]; data: string }[];
    } | null;
    if (rec?.logs) {
      if (rec.status === "0x0") throw new Error("The transaction reverted.");
      return { logs: rec.logs };
    }
    await new Promise((r) => setTimeout(r, 2000));
  }
  throw new Error("Submitted. Refresh the book in a minute.");
}

export async function ethBalance(account: string): Promise<bigint> {
  const hex = (await publicEthRequest("eth_getBalance", [account, "latest"])) as string;
  return BigInt(hex);
}

export async function erc20Balance(token: string, account: string): Promise<bigint> {
  const data = erc20.encodeFunctionData("balanceOf", [account]);
  return BigInt(await publicEthCall(token, data));
}

export async function erc20Allowance(token: string, owner: string, spender: string): Promise<bigint> {
  const data = erc20.encodeFunctionData("allowance", [owner, spender]);
  return BigInt(await publicEthCall(token, data));
}

export function approveErc20Tx(token: string, spender: string, amount: bigint): TxRequest {
  return { to: token, data: erc20.encodeFunctionData("approve", [spender, amount]) };
}

export function transferErc20Tx(token: string, to: string, amount: bigint): TxRequest {
  return { to: token, data: erc20.encodeFunctionData("transfer", [to, amount]) };
}

/** USDC rejects approve() when the current allowance is already non-zero. */
export async function ensureErc20Allowance(
  provider: Eip1193Provider,
  owner: string,
  token: string,
  spender: string,
  need: bigint,
): Promise<void> {
  const current = await erc20Allowance(token, owner, spender);
  if (current >= need) return;
  if (current > BigInt(0)) {
    const zeroHash = await sendTx(provider, owner, approveErc20Tx(token, spender, BigInt(0)));
    await waitReceipt(zeroHash);
  }
  const hash = await sendTx(provider, owner, approveErc20Tx(token, spender, need));
  await waitReceipt(hash);
}

export async function ownerOf(contract: string, tokenId: string): Promise<string | null> {
  try {
    const data = erc721.encodeFunctionData("ownerOf", [BigInt(tokenId)]);
    const hex = await publicEthCall(contract, data);
    return getAddress(`0x${hex.slice(-40)}`);
  } catch {
    return null;
  }
}

export async function approvedForAll(contract: string, owner: string): Promise<boolean> {
  const data = erc721.encodeFunctionData("isApprovedForAll", [owner, SEAPORT_16]);
  const hex = await publicEthCall(contract, data);
  return BigInt(hex) !== BigInt(0);
}

export function approveCollectionTx(contract: string): TxRequest {
  return { to: contract, data: erc721.encodeFunctionData("setApprovalForAll", [SEAPORT_16, true]) };
}

export function transferNftTx(contract: string, from: string, to: string, tokenId: string): TxRequest {
  return {
    to: contract,
    data: erc721.encodeFunctionData("safeTransferFrom", [from, to, BigInt(tokenId)]),
  };
}

export async function tokenMeta(
  contract: string,
  tokenId: string,
): Promise<{ name: string; image: string | null }> {
  const col = getSanctioned(contract);
  const fallback = `${col?.name ?? "NFT"} #${tokenId}`;
  try {
    const data = erc721.encodeFunctionData("tokenURI", [BigInt(tokenId)]);
    const hex = await publicEthCall(contract, data);
    const [uri] = coder.decode(["string"], hex) as unknown as [string];
    const url = gateway(uri);
    if (!url) return { name: fallback, image: null };
    const res = await fetch(url, { cache: "force-cache" });
    const ct = res.headers.get("content-type") || "";
    if (ct.startsWith("image/")) return { name: fallback, image: url };
    const json = (await res.json()) as { name?: string; image?: string };
    return {
      name: json.name || fallback,
      image: json.image ? gateway(json.image) : null,
    };
  } catch {
    return { name: fallback, image: null };
  }
}

function gateway(uri: string): string | null {
  if (!uri) return null;
  if (uri.startsWith("ipfs://")) return `https://ipfs.io/ipfs/${uri.slice("ipfs://".length).replace(/^ipfs\//, "")}`;
  if (uri.startsWith("https://") || uri.startsWith("data:image/")) return uri;
  if (uri.startsWith("http://")) return null;
  return null;
}

export async function readCounter(offerer: string): Promise<string> {
  const data = seaport.encodeFunctionData("getCounter", [offerer]);
  return BigInt(await publicEthCall(SEAPORT_16, data)).toString();
}

export function buildSeaportOrder(opts: {
  offerer: string;
  contract: string;
  tokenId: string;
  currency: CurrencyId;
  raw: string;
  counter: string;
}): OrderComponents {
  const coin = currencyById(opts.currency);
  if (coin.kind === "invoice") throw new Error("BTC and XMR listings stay in the seller wallet.");
  const now = Math.floor(Date.now() / 1000);
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  const salt = BigInt(`0x${[...bytes].map((b) => b.toString(16).padStart(2, "0")).join("")}`).toString();
  return {
    offerer: getAddress(opts.offerer),
    zone: ZERO_ADDRESS,
    offer: [
      {
        itemType: 2,
        token: getAddress(opts.contract),
        identifierOrCriteria: BigInt(opts.tokenId).toString(),
        startAmount: "1",
        endAmount: "1",
      },
    ],
    consideration: [
      {
        itemType: coin.kind === "eth" ? 0 : 1,
        token: getAddress(coin.address),
        identifierOrCriteria: "0",
        startAmount: opts.raw,
        endAmount: opts.raw,
        recipient: getAddress(opts.offerer),
      },
    ],
    orderType: 0,
    startTime: String(now - 120),
    endTime: String(now + LIST_SECONDS),
    zoneHash: ZERO_BYTES32,
    salt,
    conduitKey: ZERO_BYTES32,
    counter: opts.counter,
  };
}

export async function signSeaport(
  provider: Eip1193Provider,
  parameters: OrderComponents,
): Promise<string> {
  const eth = new BrowserProvider(provider as EthersProvider);
  const signer = await eth.getSigner();
  return signer.signTypedData(
    { name: "Seaport", version: "1.6", chainId: 1, verifyingContract: SEAPORT_16 },
    SEAPORT_TYPES,
    parameters,
  );
}

function componentTuple(p: OrderComponents) {
  return [
    p.offerer,
    p.zone,
    p.offer.map((i) => [i.itemType, i.token, i.identifierOrCriteria, i.startAmount, i.endAmount]),
    p.consideration.map((i) => [i.itemType, i.token, i.identifierOrCriteria, i.startAmount, i.endAmount, i.recipient]),
    p.orderType,
    p.startTime,
    p.endTime,
    p.zoneHash,
    p.salt,
    p.conduitKey,
    p.counter,
  ];
}

function parameterTuple(p: OrderComponents) {
  const row = componentTuple(p);
  row[row.length - 1] = p.consideration.length;
  return row;
}

export function nativeConsideration(order: KOrder): bigint {
  const items = order.seaport?.parameters.consideration ?? [];
  return items.reduce((sum, item) => (item.itemType === 0 ? sum + BigInt(item.startAmount) : sum), BigInt(0));
}

export function erc20Consideration(order: KOrder): { token: string; amount: bigint }[] {
  const totals = new Map<string, bigint>();
  for (const item of order.seaport?.parameters.consideration ?? []) {
    if (item.itemType !== 1) continue;
    const token = getAddress(item.token);
    totals.set(token, (totals.get(token) ?? BigInt(0)) + BigInt(item.startAmount));
  }
  return [...totals.entries()].map(([token, amount]) => ({ token, amount }));
}

export function fulfillSignedTx(parameters: OrderComponents, signature: string, value: bigint): TxRequest {
  const data = seaport.encodeFunctionData("fulfillOrder", [[parameterTuple(parameters), signature], ZERO_BYTES32]);
  return { to: SEAPORT_16, data, value };
}

export function fulfillTx(order: KOrder): TxRequest {
  const p = order.seaport?.parameters;
  const signature = order.seaport?.signature;
  if (!p || !signature) throw new Error("This listing is not an on-chain sale.");
  const items = p.consideration;
  const native = nativeConsideration(order);
  const value = order.currency === "ETH" ? (items.length > 0 ? native : BigInt(order.raw)) : BigInt(0);
  return fulfillSignedTx(p, signature, value);
}

export function cancelTx(order: KOrder): TxRequest {
  const p = order.seaport?.parameters;
  if (!p) throw new Error("Nothing to cancel on Seaport.");
  return { to: SEAPORT_16, data: seaport.encodeFunctionData("cancel", [[componentTuple(p)]]) };
}

export async function orderFilledOrCancelled(order: KOrder): Promise<boolean> {
  const p = order.seaport?.parameters;
  if (!p) return false;
  try {
    const hashHex = await publicEthCall(SEAPORT_16, seaport.encodeFunctionData("getOrderHash", [componentTuple(p)]));
    const statusHex = await publicEthCall(SEAPORT_16, seaport.encodeFunctionData("getOrderStatus", [hashHex]));
    const decoded = seaport.decodeFunctionResult("getOrderStatus", statusHex);
    const cancelled = Boolean(decoded[1]);
    const filled = BigInt(decoded[2]) > BigInt(0);
    return cancelled || filled;
  } catch {
    return false;
  }
}

export async function schemaReady(): Promise<boolean> {
  const data = registry.encodeFunctionData("getSchema", [schemaUid()]);
  const hex = await publicEthCall(EAS_SCHEMA_REGISTRY, data);
  const [schema] = registry.decodeFunctionResult("getSchema", hex) as unknown as [string, string, boolean];
  return Boolean(schema);
}

export function registerSchemaTx(): TxRequest {
  return {
    to: EAS_SCHEMA_REGISTRY,
    data: registry.encodeFunctionData("register", [EAS_SCHEMA, ZERO_ADDRESS, true]),
  };
}

export function attestTx(order: KOrder, recipient: string): TxRequest {
  const data = coder.encode(["string"], [JSON.stringify(order)]);
  return {
    to: EAS,
    data: eas.encodeFunctionData("attest", [
      [schemaUid(), [recipient, 0, true, ZERO_BYTES32, data, 0]],
    ]),
  };
}

export function revokeTx(uid: string): TxRequest {
  return { to: EAS, data: eas.encodeFunctionData("revoke", [[schemaUid(), [uid, 0]]]) };
}

export async function readAttestation(uid: string): Promise<{
  attester: string;
  time: number;
  revocationTime: number;
  data: string;
} | null> {
  try {
    const hex = await publicEthCall(EAS, eas.encodeFunctionData("getAttestation", [uid]));
    const row = eas.decodeFunctionResult("getAttestation", hex);
    const revocationTime = Number(row[4]);
    const time = Number(row[2]);
    const attester = getAddress(String(row[7]));
    const payload = String(row[9]);
    if (!time || attester === ZERO_ADDRESS) return null;
    return { attester, time, revocationTime, data: payload };
  } catch {
    return null;
  }
}

export function decodeAttestedString(data: string): unknown {
  const [text] = coder.decode(["string"], data) as unknown as [string];
  return JSON.parse(text);
}
