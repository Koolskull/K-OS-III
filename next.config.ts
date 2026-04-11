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

const nextConfig: NextConfig = {
  reactStrictMode: true,
  turbopack: {},
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "Cross-Origin-Opener-Policy", value: "same-origin" },
          { key: "Cross-Origin-Embedder-Policy", value: "require-corp" },
        ],
      },
    ];
  },
};

export default nextConfig;
