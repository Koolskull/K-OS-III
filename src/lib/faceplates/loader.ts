/*
 *  Faceplate pack loader — fetches index + skin.json via assetUrl.
 */

import { assetUrl } from "@/lib/assets";
import type {
  ResolvedSkinPack,
  SkinPackIndex,
  SkinPackIndexEntry,
  SkinPackManifest,
} from "./types";

const INDEX_PATH = "/skins/index.json";

let indexCache: SkinPackIndex | null = null;
const packCache = new Map<string, ResolvedSkinPack>();

export async function loadSkinPackIndex(): Promise<SkinPackIndex> {
  if (indexCache) return indexCache;
  const res = await fetch(assetUrl(INDEX_PATH));
  if (!res.ok) {
    throw new Error(`Skin pack index missing (${res.status})`);
  }
  const data = (await res.json()) as SkinPackIndex;
  indexCache = data;
  return data;
}

export async function loadSkinPack(id: string): Promise<ResolvedSkinPack | null> {
  if (packCache.has(id)) return packCache.get(id)!;

  const index = await loadSkinPackIndex();
  const entry = index.packs.find((p) => p.id === id);
  if (!entry) return null;

  const root = entry.path.replace(/\/$/, "");
  const res = await fetch(assetUrl(`${root}/skin.json`));
  if (!res.ok) return null;
  const manifest = (await res.json()) as SkinPackManifest;

  const resolved: ResolvedSkinPack = { entry, manifest, root };
  packCache.set(id, resolved);
  return resolved;
}

export async function loadDefaultSkinPack(): Promise<ResolvedSkinPack | null> {
  const index = await loadSkinPackIndex();
  return loadSkinPack(index.defaultPackId);
}

export function listCachedPacks(): SkinPackIndexEntry[] {
  return indexCache?.packs ?? [];
}

/** Test helper / hot-reload escape hatch */
export function clearSkinPackCache(): void {
  indexCache = null;
  packCache.clear();
}
