/*
 *                    ☦
 *           SCENE VM — ASSET RESOLVER
 *
 *  Stub for the asset library. BeetleGame's lib/cutscene/cutscene-asset-library
 *  is hardcoded to BeetleGame's public/ folder; we replace it with a
 *  manifest-local lookup. Manifests carry their assets inline (SceneAssetRef[])
 *  and layers reference them by id.
 *
 *  Future work: a K-OS-wide asset registry indexed across the user's filesystem.
 */

import type { SceneAssetRef, SceneManifest } from "./types";

/** Look up an asset reference inside a manifest by id. */
export function findAssetRef(manifest: SceneManifest, id: string | undefined): SceneAssetRef | null {
  if (!id) return null;
  return manifest.assets.find((a) => a.id === id) ?? null;
}

/**
 * Resolve an asset path to a URL the browser can load.
 * For v0, paths under the manifest are treated as relative to /public/.
 * Absolute http(s) URLs are returned as-is.
 */
export function resolveAssetURL(asset: SceneAssetRef | null): string | null {
  if (!asset) return null;
  const p = asset.path;
  if (p.startsWith("http://") || p.startsWith("https://") || p.startsWith("data:")) return p;
  if (p.startsWith("/")) return p;
  return `/${p}`;
}
