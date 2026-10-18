import { getAddress } from "ethers";
import { EAS } from "@/data/market";
import { publicEthRequest } from "@/lib/publicEth";
import { readAttestation, decodeAttestedString } from "@/lib/market/chain";
import {
  ATTESTED_TOPIC,
  type FloorListing,
  type KOrder,
  listingFromOrder,
  orderKey,
  orderLive,
  parseKOrder,
  schemaUid,
} from "@/lib/market/orders";

const CACHE_KEY = "kos-bazaar-book-v1";
const PENDING_KEY = "kos-bazaar-pending-v1";
const CHUNK = 2_000;
const FIRST_SPAN = 16_000;

interface LogRow {
  address: string;
  topics: string[];
  data: string;
}

interface Saved {
  floorBlock: number;
  headBlock: number;
  rows: { id: string; order: KOrder; time: number }[];
}

function empty(): Saved {
  return { floorBlock: 0, headBlock: 0, rows: [] };
}

function readCache(): Saved {
  if (typeof window === "undefined") return empty();
  try {
    const raw = JSON.parse(window.localStorage.getItem(CACHE_KEY) || "null") as Saved | null;
    if (!raw || !Array.isArray(raw.rows)) return empty();
    return raw;
  } catch {
    return empty();
  }
}

function writeCache(saved: Saved): void {
  if (typeof window === "undefined") return;
  const rows = saved.rows.slice(-300);
  window.localStorage.setItem(CACHE_KEY, JSON.stringify({ ...saved, rows }));
}

export function readPending(): KOrder[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = JSON.parse(window.localStorage.getItem(PENDING_KEY) || "[]") as unknown[];
    return raw.map(parseKOrder).filter((o): o is KOrder => Boolean(o));
  } catch {
    return [];
  }
}

export function rememberPending(order: KOrder): void {
  const next = readPending().filter((o) => orderKey(o) !== orderKey(order));
  next.push(order);
  window.localStorage.setItem(PENDING_KEY, JSON.stringify(next.slice(-40)));
}

export function forgetPending(order: KOrder): void {
  const key = orderKey(order);
  const next = readPending().filter((o) => orderKey(o) !== key);
  window.localStorage.setItem(PENDING_KEY, JSON.stringify(next));
}

async function logsBetween(from: number, to: number): Promise<LogRow[]> {
  const uid = schemaUid();
  const out: LogRow[] = [];
  let cursor = from;
  while (cursor <= to) {
    const end = Math.min(to, cursor + CHUNK - 1);
    const result = (await publicEthRequest("eth_getLogs", [
      {
        address: EAS,
        topics: [ATTESTED_TOPIC, null, null, uid],
        fromBlock: `0x${cursor.toString(16)}`,
        toBlock: `0x${end.toString(16)}`,
      },
    ])) as LogRow[];
    if (Array.isArray(result)) out.push(...result);
    cursor = end + 1;
  }
  return out;
}

async function rowsFromLogs(logs: LogRow[]): Promise<Saved["rows"]> {
  const uidTopic = schemaUid().toLowerCase();
  const rows: Saved["rows"] = [];
  for (const log of logs) {
    if ((log.topics?.[3] || "").toLowerCase() !== uidTopic) continue;
    const uid = log.data?.length >= 66 ? `0x${log.data.replace(/^0x/, "").slice(0, 64)}` : "";
    if (!uid || uid.length !== 66) continue;
    const att = await readAttestation(uid);
    if (!att || att.revocationTime > 0) continue;
    let parsed: KOrder | null = null;
    try {
      parsed = parseKOrder(decodeAttestedString(att.data));
    } catch {
      parsed = null;
    }
    if (!parsed) continue;
    if (getAddress(parsed.offerer).toLowerCase() !== att.attester.toLowerCase()) continue;
    if (!orderLive(parsed)) continue;
    rows.push({ id: uid, order: parsed, time: att.time });
  }
  return rows;
}

function merge(base: Saved["rows"], extra: Saved["rows"]): Saved["rows"] {
  const map = new Map<string, Saved["rows"][number]>();
  for (const row of [...base, ...extra]) map.set(row.id, row);
  return [...map.values()].sort((a, b) => b.time - a.time).slice(0, 300);
}

export async function syncBook(): Promise<FloorListing[]> {
  const tip = Number(await publicEthRequest("eth_blockNumber", []));
  const cache = readCache();
  const from = cache.headBlock > 0 ? cache.headBlock + 1 : Math.max(0, tip - FIRST_SPAN);
  let found: Saved["rows"] = [];
  let covered = cache.headBlock;
  if (from <= tip) {
    try {
      found = await rowsFromLogs(await logsBetween(from, tip));
      covered = tip;
    } catch {
      covered = cache.headBlock;
    }
  }
  const floor = cache.floorBlock > 0 ? cache.floorBlock : from;
  const saved: Saved = {
    floorBlock: floor,
    headBlock: covered,
    rows: merge(cache.rows, found).filter((row) => orderLive(row.order)),
  };
  writeCache(saved);
  return listings(saved);
}

export async function loadOlder(): Promise<FloorListing[]> {
  const cache = readCache();
  const tip = cache.headBlock || Number(await publicEthRequest("eth_blockNumber", []));
  const floor = cache.floorBlock || tip;
  const from = Math.max(0, floor - 32_000);
  if (from >= floor) return listings(cache);
  const found = await rowsFromLogs(await logsBetween(from, floor - 1));
  const saved: Saved = {
    floorBlock: from,
    headBlock: cache.headBlock || tip,
    rows: merge(cache.rows, found).filter((row) => orderLive(row.order)),
  };
  writeCache(saved);
  return listings(saved);
}

function listings(saved: Saved): FloorListing[] {
  const chain = saved.rows.map((row) => listingFromOrder(row.order, row.id));
  const seen = new Set(chain.map((row) => orderKey(row.order)));
  const pending = readPending()
    .filter((order) => orderLive(order) && !seen.has(orderKey(order)))
    .map((order) => listingFromOrder(order, orderKey(order)));
  return [...pending, ...chain];
}

export function cachedListings(): FloorListing[] {
  return listings(readCache());
}

export function dropListing(id: string): void {
  const cache = readCache();
  cache.rows = cache.rows.filter((row) => row.id !== id);
  writeCache(cache);
  if (typeof window === "undefined") return;
  const pending = readPending().filter((order) => orderKey(order) !== id);
  window.localStorage.setItem(PENDING_KEY, JSON.stringify(pending));
}
