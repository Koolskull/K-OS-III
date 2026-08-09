/*
 *                    ☦
 *        BUILD FLAGS — brand & backend availability
 *
 *   Two independent axes, both baked in at build time via NEXT_PUBLIC_*
 *   env vars (see scripts/build-static.sh / package.json build scripts):
 *
 *   - BRAND: which product this build presents as ("kos3" = generic K-OS
 *     III, GitHub Pages; "2kooltv" = the 2KOOL.TV-branded deploy). Purely
 *     cosmetic (title, boot text, taskbar).
 *   - HAS_BACKEND: whether /api/* routes actually exist in this build.
 *     False for every static export (GitHub Pages, and 2kool.tv's legacy
 *     static-export fallback) — true for the live Node deploy and local
 *     dev. Apps that are entirely backend-dependent (Account, K-CHAT,
 *     PRODEV, KOS Browser) hide their desktop icons when this is false;
 *     hybrid apps (KoolDraw/Shotlist/Datamoshpit) hide just their
 *     Postgres-backed save/asset-library UI and keep local-first features
 *     (drawing, tracker, file download/export) working either way.
 */

export const BRAND: "kos3" | "2kooltv" = process.env.NEXT_PUBLIC_BRAND === "2kooltv" ? "2kooltv" : "kos3";

export const HAS_BACKEND = process.env.NEXT_PUBLIC_STATIC_EXPORT !== "true";

export const BRAND_NAME = BRAND === "2kooltv" ? "2KOOL.TV" : "K-OS III";
