import { findMdFile } from "@/lib/education/mdFiles";

/**
 * Resolve an href used in markdown [text](href) into an in-corpus markdown file path.
 * Returns a normalized path (no leading slash) suitable for assetUrl("/" + path),
 * or null when the link is not a known markdown file.
 */
export function resolveMdLink(href: string): string | null {
  if (!href) return null;
  const raw = href.trim();
  // Ignore mailto:, http(s), data, and explicit kos:// — those are handled elsewhere.
  if (/^(mailto:|https?:\/\/|data:|kos:\/\/)/i.test(raw)) return null;
  // Strip leading ./ or / and any fragment/query
  const cleaned = raw.replace(/^\.?\//, "").replace(/^\/+/, "").split(/[?#]/)[0];
  const found = findMdFile(cleaned);
  return found ? found.path : null;
}

