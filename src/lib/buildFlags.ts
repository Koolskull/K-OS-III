/*
 *                    ☦
 *        BUILD FLAGS — brand & backend availability
 *
 *   Two independent axes, both baked in at build time via NEXT_PUBLIC_*
 *   env vars (see scripts/build-static.sh / package.json build scripts):
 *
 *   - BRAND: which product this build presents as ("kos3" = generic K-OS
 *     III, GitHub Pages; "2kooltv" = the 2KOOL.TV-branded deploy;
 *     "koolskull" = koolskull.com OS + shop). Cosmetic plus catalog filter.
 *   - HAS_BACKEND: whether /api/* routes actually exist in this build.
 *     False for every static export (GitHub Pages, and 2kool.tv's legacy
 *     static-export fallback) — true for the live Node deploy and local
 *     dev. Apps that are entirely backend-dependent (Account, K-CHAT,
 *     PRODEV, KOS Browser) hide their desktop icons when this is false;
 *     hybrid apps (KoolDraw/Shotlist/Datamoshpit) hide just their
 *     Postgres-backed save/asset-library UI and keep local-first features
 *     (drawing, tracker, file download/export) working either way.
 */

export type Brand = "kos3" | "2kooltv" | "koolskull";

const brandEnv = process.env.NEXT_PUBLIC_BRAND;
export const BRAND: Brand =
  brandEnv === "2kooltv" ? "2kooltv" : brandEnv === "koolskull" ? "koolskull" : "kos3";

export const HAS_BACKEND = process.env.NEXT_PUBLIC_STATIC_EXPORT !== "true";

/**
 * Account app + session fetches. True on Node deploys, and on the koolskull.com
 * static FTP build when PHP proxies /api/auth/* to the 2kool.tv backend
 * (same Postgres users — wallet/email sign-in is the same account).
 */
export const HAS_ACCOUNT =
  HAS_BACKEND || process.env.NEXT_PUBLIC_HAS_ACCOUNT === "true";

export const BRAND_NAME =
  BRAND === "2kooltv" ? "2KOOL.TV" : BRAND === "koolskull" ? "KOOLSKULL OS" : "K-OS III";

/** Public media origin. Empty = same origin (local public/mp3 symlinks). */
export const MEDIA_ORIGIN = (process.env.NEXT_PUBLIC_MEDIA_ORIGIN ?? "").replace(/\/$/, "");

export function mediaUrl(path: string | undefined | null): string {
  if (!path) return "";
  if (/^https?:\/\//i.test(path)) return path;
  const p = path.startsWith("/") ? path : `/${path}`;
  return `${MEDIA_ORIGIN}${p}`;
}

/** Shop admins — only these wallets can run Marketplace. */
export const SHOP_OWNER_WALLETS: { address: string; ens: string }[] = [
  { address: "0xF065F2a89683Dd8Cd76ab15C686a781F0b351eaB".toLowerCase(), ens: "koolskull.eth" },
  { address: "0xF4A8A241f44c2a5D5bfa1115a6AF0759cCcce6cB".toLowerCase(), ens: "dozashop.eth" },
];

const extraOwners = (process.env.NEXT_PUBLIC_SHOP_OWNER_ADDRESSES ?? "")
  .split(",")
  .map((s) => s.trim().toLowerCase())
  .filter(Boolean);
for (const address of extraOwners) {
  if (!SHOP_OWNER_WALLETS.some((w) => w.address === address)) {
    SHOP_OWNER_WALLETS.push({ address, ens: "" });
  }
}

export const SHOP_OWNER_ADDRESS = SHOP_OWNER_WALLETS[0].address;
export const SHOP_OWNER_ENS = SHOP_OWNER_WALLETS.map((w) => w.ens).filter(Boolean).join(" / ");
