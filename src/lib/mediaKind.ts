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
