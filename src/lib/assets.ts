/*
 *                    ☦
 *      ASSET URL HELPER
 *
 *  Routes every runtime asset reference through one place so we can swap
 *  where assets live at build time without touching call sites.
 *
 *  Two env vars:
 *    NEXT_PUBLIC_BASE_PATH   the URL path prefix the app is served under
 *                            (e.g. "/k-os" for koolskull.github.io/k-os
 *                            or 2kool.tv/k-os; empty for local dev)
 *    NEXT_PUBLIC_ASSET_BASE  absolute URL where bundled assets live
 *                            (e.g. "https://koolskull.github.io/k-os-assets")
 *                            When unset, falls back to BASE_PATH-prefixed
 *                            local /public so dev still works.
 *
 *  Behavior:
 *    assetUrl("/sprites/ST0.png")
 *      local dev (no env vars)            → "/sprites/ST0.png"
 *      Pages build (BASE_PATH=/k-os)      → "/k-os/sprites/ST0.png"
 *      Pages build + ASSET_BASE set       → "https://.../sprites/ST0.png"
 *
 *  Use this for ANY runtime asset reference:
 *    fetch(assetUrl("/bible/kjv.json"))
 *    <img src={assetUrl(slimeSpritePath(d))}>
 *    new Image().src = assetUrl(...)
 *    iframe src={assetUrl("/games/keen/...")}
 *
 *  CSS url() in globals.css is a separate concern — keep CSS-served assets
 *  (fonts, fixed background gifs) inside /public alongside the deployed app
 *  so the basePath prefix from Next.js's automatic CSS rewriting handles it.
 */

const BASE_PATH = (process.env.NEXT_PUBLIC_BASE_PATH ?? "").replace(/\/$/, "");
const ASSET_BASE = (process.env.NEXT_PUBLIC_ASSET_BASE ?? "").replace(/\/$/, "");

function ensureLeadingSlash(p: string): string {
  return p.startsWith("/") ? p : "/" + p;
}

/**
 * Resolve a relative asset path to a fetchable URL, honoring the build's
 * basePath and (if set) the absolute asset base.
 *
 * Returns absolute http(s) URLs and data: URLs unchanged.
 */
export function assetUrl(path: string): string {
  if (!path) return path;
  if (path.startsWith("http://") || path.startsWith("https://") || path.startsWith("data:")) {
    return path;
  }
  const p = ensureLeadingSlash(path);
  if (ASSET_BASE) return `${ASSET_BASE}${p}`;
  if (BASE_PATH) return `${BASE_PATH}${p}`;
  return p;
}

/**
 * Build URL of a game (e.g. "keen", "supertux") relative to the assets host.
 * Games are bigger than the app shell and deserve a separate dimension —
 * GAMES_BASE can override per-game-asset hosting (e.g. point at a GitHub
 * Releases artifact URL when shipping the SuperTux 245MB WASM data).
 */
const GAMES_BASE = (process.env.NEXT_PUBLIC_GAMES_BASE ?? "").replace(/\/$/, "");

export function gameAssetUrl(path: string): string {
  if (!path) return path;
  if (path.startsWith("http://") || path.startsWith("https://")) return path;
  const p = ensureLeadingSlash(path);
  if (GAMES_BASE) return `${GAMES_BASE}${p}`;
  return assetUrl(path);
}

/** Build-time-resolved BASE_PATH, exported for components that need to know
 *  the URL prefix (e.g. for href="/about" client-side nav). */
export const BASE_PATH_PREFIX = BASE_PATH;
