/*
 *                    ☦
 *        PROFILE MODULES — SANITIZE
 *
 *   Elementor-simple module stack. No raw HTML. NFT modules store refs
 *   only after ownership is verified at the API layer.
 */

export type ProfileBlockType =
  | "text"
  | "image"
  | "gif"
  | "youtube"
  | "iframe"
  | "nft"
  | "nft_gallery";

export interface ProfileBlockInput {
  block_type: ProfileBlockType;
  payload: Record<string, unknown>;
}

export interface SanitizedProfileBlock {
  block_type: ProfileBlockType;
  payload: Record<string, unknown>;
  sort_order: number;
}

export interface NftRef {
  chain: string;
  contractAddress: string;
  tokenId: string;
  name: string | null;
  image: string | null;
}

export class ProfileSanitizeError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ProfileSanitizeError";
  }
}

export const MAX_PROFILE_BLOCKS = 20;
export const MAX_NFT_GALLERY = 12;
const MAX_TEXT = 2000;
const MAX_URL = 2000;
const ADDR_RE = /^0x[a-fA-F0-9]{40}$/;
const CHAINS = new Set(["eth-mainnet", "polygon-mainnet", "base-mainnet"]);

const IFRAME_ALLOWLIST = new Set([
  "www.youtube-nocookie.com",
  "www.youtube.com",
  "player.vimeo.com",
  "w.soundcloud.com",
  "bandcamp.com",
  "www.bandcamp.com",
]);

const YOUTUBE_HOSTS = new Set([
  "youtube.com",
  "www.youtube.com",
  "m.youtube.com",
  "youtu.be",
  "www.youtu.be",
  "youtube-nocookie.com",
  "www.youtube-nocookie.com",
]);

const VIDEO_ID_RE = /^[a-zA-Z0-9_-]{11}$/;

function assertHttpsUrl(raw: string): URL {
  if (typeof raw !== "string" || raw.length === 0 || raw.length > MAX_URL) {
    throw new ProfileSanitizeError("URL missing or too long.");
  }
  let url: URL;
  try {
    url = new URL(raw.trim());
  } catch {
    throw new ProfileSanitizeError("Malformed URL.");
  }
  if (url.protocol !== "https:") {
    throw new ProfileSanitizeError("Only https:// URLs are allowed.");
  }
  if (url.username || url.password) {
    throw new ProfileSanitizeError("URLs with credentials are not allowed.");
  }
  return url;
}

function assertSafeMediaUrl(raw: string): string {
  const url = assertHttpsUrl(raw);
  const path = url.pathname.toLowerCase();
  if (path.endsWith(".svg") || path.endsWith(".svgz")) {
    throw new ProfileSanitizeError("SVG images are not allowed on profiles.");
  }
  return url.toString();
}

export function extractYoutubeVideoId(raw: string): string {
  if (VIDEO_ID_RE.test(raw.trim())) return raw.trim();

  const url = assertHttpsUrl(raw);
  const host = url.hostname.toLowerCase();
  if (!YOUTUBE_HOSTS.has(host)) {
    throw new ProfileSanitizeError("Not a recognized YouTube URL.");
  }

  if (host === "youtu.be" || host === "www.youtu.be") {
    const id = url.pathname.replace(/^\//, "").split("/")[0] ?? "";
    if (!VIDEO_ID_RE.test(id)) throw new ProfileSanitizeError("Invalid YouTube video id.");
    return id;
  }

  const v = url.searchParams.get("v");
  if (v && VIDEO_ID_RE.test(v)) return v;

  const embedMatch = url.pathname.match(/\/embed\/([a-zA-Z0-9_-]{11})/);
  if (embedMatch) return embedMatch[1];

  const shortsMatch = url.pathname.match(/\/shorts\/([a-zA-Z0-9_-]{11})/);
  if (shortsMatch) return shortsMatch[1];

  throw new ProfileSanitizeError("Could not extract a YouTube video id.");
}

export function youtubeEmbedUrl(videoId: string): string {
  if (!VIDEO_ID_RE.test(videoId)) throw new ProfileSanitizeError("Invalid YouTube video id.");
  return `https://www.youtube-nocookie.com/embed/${videoId}`;
}

function sanitizeIframeUrl(raw: string): string {
  const url = assertHttpsUrl(raw);
  const host = url.hostname.toLowerCase();
  if (!IFRAME_ALLOWLIST.has(host)) {
    throw new ProfileSanitizeError(
      `Iframe host "${host}" is not on the allowlist. Use YouTube modules for YouTube, or request a host be added.`,
    );
  }
  return url.toString();
}

export function sanitizeNftRef(raw: unknown): NftRef {
  if (!raw || typeof raw !== "object") throw new ProfileSanitizeError("Invalid NFT payload.");
  const p = raw as Record<string, unknown>;
  const chain = typeof p.chain === "string" && CHAINS.has(p.chain) ? p.chain : "eth-mainnet";
  const contractAddress = typeof p.contractAddress === "string" ? p.contractAddress.trim() : "";
  const tokenId = typeof p.tokenId === "string" ? p.tokenId.trim().slice(0, 78) : String(p.tokenId ?? "").slice(0, 78);
  if (!ADDR_RE.test(contractAddress)) throw new ProfileSanitizeError("Invalid NFT contract address.");
  if (!tokenId) throw new ProfileSanitizeError("NFT tokenId required.");
  const name = typeof p.name === "string" ? p.name.slice(0, 255) : null;
  let image: string | null = null;
  if (typeof p.image === "string" && p.image) {
    image = assertSafeMediaUrl(p.image);
  }
  return { chain, contractAddress: contractAddress.toLowerCase(), tokenId, name, image };
}

const BLOCK_TYPES = new Set<ProfileBlockType>([
  "text",
  "image",
  "gif",
  "youtube",
  "iframe",
  "nft",
  "nft_gallery",
]);

export function sanitizeProfileBlock(
  input: ProfileBlockInput,
  sortOrder: number,
): SanitizedProfileBlock {
  const type = input.block_type;
  if (!BLOCK_TYPES.has(type)) {
    throw new ProfileSanitizeError(`Unknown module type: ${String(type)}`);
  }
  const p = input.payload ?? {};

  switch (type) {
    case "text": {
      const body = typeof p.body === "string" ? p.body.slice(0, MAX_TEXT) : "";
      if (!body.trim()) throw new ProfileSanitizeError("Text module cannot be empty.");
      return { block_type: "text", payload: { body }, sort_order: sortOrder };
    }
    case "image":
    case "gif": {
      const url = typeof p.url === "string" ? assertSafeMediaUrl(p.url) : "";
      if (!url) throw new ProfileSanitizeError(`${type} module needs a https URL.`);
      return { block_type: type, payload: { url }, sort_order: sortOrder };
    }
    case "youtube": {
      const raw =
        typeof p.url === "string" ? p.url : typeof p.videoId === "string" ? p.videoId : "";
      const videoId = extractYoutubeVideoId(raw);
      return { block_type: "youtube", payload: { videoId }, sort_order: sortOrder };
    }
    case "iframe": {
      const url = typeof p.url === "string" ? sanitizeIframeUrl(p.url) : "";
      if (!url) throw new ProfileSanitizeError("Iframe module needs a https URL on the allowlist.");
      return { block_type: "iframe", payload: { url }, sort_order: sortOrder };
    }
    case "nft": {
      const nft = sanitizeNftRef(p);
      return { block_type: "nft", payload: { ...nft }, sort_order: sortOrder };
    }
    case "nft_gallery": {
      const itemsRaw = Array.isArray(p.items) ? p.items : [];
      if (itemsRaw.length === 0) throw new ProfileSanitizeError("NFT gallery needs at least one NFT.");
      if (itemsRaw.length > MAX_NFT_GALLERY) {
        throw new ProfileSanitizeError(`NFT gallery max ${MAX_NFT_GALLERY} items.`);
      }
      const items = itemsRaw.map(sanitizeNftRef);
      return { block_type: "nft_gallery", payload: { items }, sort_order: sortOrder };
    }
  }
}

export function sanitizeProfileBlocks(inputs: ProfileBlockInput[]): SanitizedProfileBlock[] {
  if (!Array.isArray(inputs)) throw new ProfileSanitizeError("Modules must be an array.");
  if (inputs.length > MAX_PROFILE_BLOCKS) {
    throw new ProfileSanitizeError(`At most ${MAX_PROFILE_BLOCKS} profile modules.`);
  }
  return inputs.map((b, i) => sanitizeProfileBlock(b, i));
}

/** Collect all NFT refs from a sanitized module list (for ownership checks). */
export function collectNftRefs(blocks: SanitizedProfileBlock[]): NftRef[] {
  const out: NftRef[] = [];
  for (const b of blocks) {
    if (b.block_type === "nft") out.push(b.payload as unknown as NftRef);
    if (b.block_type === "nft_gallery" && Array.isArray(b.payload.items)) {
      for (const item of b.payload.items) out.push(item as NftRef);
    }
  }
  return out;
}
