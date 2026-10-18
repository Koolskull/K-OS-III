/**
 * Browser-safe Ethereum JSON-RPC. No API key.
 * Used on static FTP hosts where Next /api and Alchemy are unavailable.
 */

const DEFAULT_RPCS = [
  "https://ethereum.publicnode.com",
  "https://1rpc.io/eth",
];

export function hexToUint(hex: string | undefined | null): number {
  if (!hex || hex === "0x") return 0;
  try {
    return Number(BigInt(hex));
  } catch {
    return 0;
  }
}

export function padAddr(address: string): string {
  return address.replace(/^0x/i, "").toLowerCase().padStart(64, "0");
}

export function padUint(n: number | bigint): string {
  return BigInt(n).toString(16).padStart(64, "0");
}

export const SEL = {
  totalSupply: "0x18160ddd",
  maxSupply: "0xd5abeb01",
  balanceOf: "0x70a08231",
  ownerOf: "0x6352211e",
} as const;

export function dataBalanceOf(owner: string): string {
  return `${SEL.balanceOf}${padAddr(owner)}`;
}

export function dataOwnerOf(tokenId: number): string {
  return `${SEL.ownerOf}${padUint(tokenId)}`;
}

function rpcUrls(): string[] {
  const extra = (process.env.NEXT_PUBLIC_ETH_RPC_URL ?? "").trim();
  return extra ? [extra, ...DEFAULT_RPCS.filter((u) => u !== extra)] : DEFAULT_RPCS;
}

interface RpcResult {
  result?: string;
  error?: { message?: string };
}

async function rpcPost(url: string, body: unknown): Promise<unknown> {
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify(body),
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`RPC ${res.status}`);
  return res.json();
}

async function walletCall(to: string, data: string): Promise<string | null> {
  if (typeof window === "undefined" || !window.ethereum) return null;
  try {
    const result = (await window.ethereum.request({
      method: "eth_call",
      params: [{ to, data }, "latest"],
    })) as string;
    if (result && result !== "0x") return result;
  } catch {
    /* public RPC next */
  }
  return null;
}

export async function publicEthRequest(method: string, params: unknown[]): Promise<unknown> {
  let last = "rpc failed";
  for (const url of rpcUrls()) {
    try {
      const json = (await rpcPost(url, {
        jsonrpc: "2.0",
        id: 1,
        method,
        params,
      })) as { result?: unknown; error?: { message?: string } };
      if (json.error?.message) {
        last = json.error.message;
        continue;
      }
      if (json.result !== undefined) return json.result;
      last = "empty rpc result";
    } catch (e) {
      last = e instanceof Error ? e.message : "RPC error";
    }
  }
  throw new Error(last);
}

export async function publicEthCall(to: string, data: string): Promise<string> {
  const wallet = await walletCall(to, data);
  if (wallet) return wallet;
  let last = "eth_call failed";
  for (const url of rpcUrls()) {
    try {
      const json = (await rpcPost(url, {
        jsonrpc: "2.0",
        id: 1,
        method: "eth_call",
        params: [{ to, data }, "latest"],
      })) as RpcResult;
      if (json.error?.message) {
        last = json.error.message;
        continue;
      }
      if (json.result) return json.result;
      last = "empty eth_call result";
    } catch (e) {
      last = e instanceof Error ? e.message : "RPC error";
    }
  }
  throw new Error(last);
}

export async function publicEthCallMany(
  calls: { to: string; data: string }[],
): Promise<(string | null)[]> {
  if (calls.length === 0) return [];
  if (calls.length === 1) {
    try {
      return [await publicEthCall(calls[0].to, calls[0].data)];
    } catch {
      return [null];
    }
  }
  const batch = calls.map((c, i) => ({
    jsonrpc: "2.0",
    id: i + 1,
    method: "eth_call",
    params: [{ to: c.to, data: c.data }, "latest"],
  }));
  for (const url of rpcUrls()) {
    try {
      const json = await rpcPost(url, batch);
      if (!Array.isArray(json)) continue;
      const byId = new Map<number, string | null>();
      for (const row of json as Array<RpcResult & { id?: number }>) {
        byId.set(Number(row.id), row.result ?? null);
      }
      return calls.map((_, i) => byId.get(i + 1) ?? null);
    } catch {
      /* try next RPC */
    }
  }
  const out: (string | null)[] = [];
  for (const c of calls) {
    try {
      out.push(await publicEthCall(c.to, c.data));
    } catch {
      out.push(null);
    }
  }
  return out;
}

export function addressFromWord(hex: string | null | undefined): string | null {
  if (!hex || hex === "0x" || hex.length < 42) return null;
  return `0x${hex.slice(-40)}`;
}
