/** What a URL should open as. A still is an image. An animation with no
 * picture, audio, or video suffix is an iframe NFT page.
 */

export type MediaKind = "image" | "iframe" | "audio" | "video" | "empty";
export type MediaRole = "animation" | "still";

const AUDIO = /\.(mp3|wav|ogg|flac|m4a|aac)(?:$|\?)/i;
const VIDEO = /\.(mp4|webm|mov|m4v|ogv)(?:$|\?)/i;
const HTML = /\.(html?)(?:$|\?)/i;
const IMAGE = /\.(png|jpe?g|gif|webp|avif|svg|bmp)(?:$|\?)/i;

export function mediaSrc(src: string | null | undefined): string | null {
  if (!src) return null;
  const text = src.trim();
  if (!text || /^javascript:/i.test(text)) return null;
  return text;
}

const SEADN = /(^|\.)seadn\.io$/i;
/** stardrain.app answers with a connection reset, so a FILE link must not open it. */
const DEAD_HOST = /(^|\.)stardrain\.app$/i;

/** OpenSea's bare seadn link is a square crop. A width-only request is the
 * original ratio. Thrash Bannerz are 1555×555, and w=1600 returns that file.
 * A square Mialien at w=1600 is the original 1444×1444 file, not the 500 crop.
 */
export function wideStill(src: string | null | undefined): string | null {
  const text = mediaSrc(src);
  if (!text) return null;
  let url: URL;
  try {
    url = new URL(text);
  } catch {
    return text;
  }
  if (!SEADN.test(url.hostname)) return text;
  url.searchParams.delete("h");
  url.searchParams.delete("height");
  url.searchParams.delete("crop");
  url.searchParams.delete("fit");
  url.searchParams.set("w", "1600");
  return url.toString();
}

/** A still that can be opened. stardrain.app is skipped. seadn.io is the full file. */
export function fileStill(src: string | null | undefined): string | null {
  const text = wideStill(src);
  if (!text) return null;
  try {
    if (DEAD_HOST.test(new URL(text).hostname)) return null;
  } catch {
    return text;
  }
  return text;
}

function firstStill(...srcs: (string | null | undefined)[]): string | null {
  for (const src of srcs) {
    const file = fileStill(src);
    if (file) return file;
  }
  return null;
}

function rawStill(src: string | null | undefined): string | null {
  if (!fileStill(src)) return null;
  return mediaSrc(src);
}

/** Tile picture and the file the FILE button opens.
 * A reachable original on our own host wins. The dead stardrain host does not.
 */
export function stillPair(
  wide: boolean,
  local: string | null | undefined,
  display: string | null | undefined,
  original: string | null | undefined,
): { image: string | null; full: string | null } {
  const own = fileStill(local);
  if (wide) {
    const full = firstStill(original, display, local);
    return { image: full, full };
  }
  const shown = rawStill(display) || rawStill(original);
  const full = own || firstStill(original, display) || shown;
  const image = own || shown || full;
  return { image, full };
}

export function mediaKind(src: string | null | undefined, role: MediaRole = "still"): MediaKind {
  const text = mediaSrc(src);
  if (!text) return "empty";
  const lower = text.toLowerCase();
  if (AUDIO.test(text) || lower.includes("audio/")) return "audio";
  if (VIDEO.test(text) || lower.includes("video/")) return "video";
  if (HTML.test(text) || lower.includes("text/html")) return "iframe";
  if (IMAGE.test(text) || lower.includes("image/")) return "image";
  if (role === "animation") return "iframe";
  return "image";
}

/** OpenSea stills plus the animation file, when the token has one. */
export function nftMedia(row: Record<string, unknown>): { image: string; full: string; animation: string } {
  const display = typeof row.display_image_url === "string" ? row.display_image_url : "";
  const raw = typeof row.image_url === "string" ? row.image_url : "";
  const animation = typeof row.animation_url === "string" ? row.animation_url.trim() : "";
  return {
    image: display || raw,
    full: raw || display,
    animation,
  };
}
