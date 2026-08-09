/*
 *            ☦
 *        ✝  IHS  ✝
 *     IN HOC SIGNO VINCES
 *
 *   ╔══════════════════════╗
 *   ║  DATAMOSHPIT CONFIG  ║
 *   ║  Blessed be this     ║
 *   ║  configuration.      ║
 *   ╚══════════════════════╝
 *
 *   "For where two or three gather
 *    in my name, there am I with them."
 *    — Matthew 18:20
 */

import type { NextConfig } from "next";

/**
 * Build-time toggles:
 *   K_OS_EXPORT       set to "true" in CI to produce a static out/ folder
 *                     suitable for GitHub Pages / 2kool.tv / Cloudflare Pages
 *   NEXT_PUBLIC_BASE_PATH  the URL path prefix the app is served under
 *                          (e.g. "/k-os" for koolskull.github.io/k-os).
 *                          Local dev: leave unset.
 *
 * The same out/ artifact serves any host that uses the same BASE_PATH.
 * koolskull.github.io/k-os and 2kool.tv/k-os share one build.
 */

const isExport = process.env.K_OS_EXPORT === "true";
const basePath = (process.env.NEXT_PUBLIC_BASE_PATH ?? "").replace(/\/$/, "");

const nextConfig: NextConfig = {
  reactStrictMode: true,
  turbopack: {},

  // CodeMirror / Lezer ship as pure ESM — ensure Next bundles them for SKULLTEXT.
  transpilePackages: [
    "codemirror",
    "@codemirror/autocomplete",
    "@codemirror/commands",
    "@codemirror/lang-cpp",
    "@codemirror/lang-css",
    "@codemirror/lang-html",
    "@codemirror/lang-javascript",
    "@codemirror/lang-json",
    "@codemirror/lang-markdown",
    "@codemirror/lang-xml",
    "@codemirror/language",
    "@codemirror/lint",
    "@codemirror/search",
    "@codemirror/state",
    "@codemirror/view",
    "@lezer/highlight",
    "@lezer/common",
    "@lezer/lr",
  ],

  // Static export (only when K_OS_EXPORT=true). Skips API routes, server
  // components, image optimization. Headers below are no-ops for export but
  // kept for `npm run dev` / future server-rendered builds.
  ...(isExport ? { output: "export" as const, trailingSlash: true } : {}),

  // Required when serving under a path prefix (e.g. /k-os) and when image
  // optimization isn't available (static export).
  ...(basePath ? { basePath, assetPrefix: basePath } : {}),
  images: { unoptimized: true },

  async headers() {
    // credentialless (not require-corp): keeps COOP isolation for many
    // WASM cases while allowing third-party profile embeds (YouTube, etc.)
    // that do not send CORP. require-corp globally blocked those iframes.
    // No-op under static export; GitHub Pages strips custom headers anyway.
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "Cross-Origin-Opener-Policy", value: "same-origin" },
          { key: "Cross-Origin-Embedder-Policy", value: "credentialless" },
        ],
      },
      // /render/[id] is script-free by design (see the page's own comment) —
      // lock it down with a CSP that forbids any script execution at all,
      // and explicitly allow same-origin framing so <iframe src="/render/id">
      // embeds keep working (the global default stays unset elsewhere).
      {
        source: "/render/:id",
        headers: [
          {
            key: "Content-Security-Policy",
            value: "default-src 'self'; script-src 'none'; media-src 'self'; style-src 'unsafe-inline'; frame-ancestors *",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
