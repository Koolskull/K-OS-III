import catalog from "@/data/art-catalog.json";
import { mediaUrl } from "@/lib/buildFlags";

export interface ArtPiece {
  id: string;
  title: string;
  category: string;
  year: string | null;
  medium: string | null;
  dimensions: string | null;
  description: string | null;
  thumbnail: string;
  fullImage: string;
  digital_price_cents: number;
  active: boolean;
}

const data = catalog as {
  default_digital_price_cents: number;
  items: ArtPiece[];
};

export const ART_DEFAULT_PRICE_CENTS = data.default_digital_price_cents;
export const ART_PIECES: ArtPiece[] = data.items.filter((p) => p.active);

export const ART_CATEGORIES: string[] = Array.from(
  new Set(ART_PIECES.map((p) => p.category)),
).sort((a, b) => a.localeCompare(b));

export function getArtPiece(id: string | undefined | null): ArtPiece | undefined {
  if (!id) return undefined;
  return ART_PIECES.find((p) => p.id === id);
}

export function artThumb(piece: ArtPiece): string {
  return mediaUrl(piece.thumbnail);
}

export function artFull(piece: ArtPiece): string {
  return mediaUrl(piece.fullImage);
}

export function formatUsd(cents: number): string {
  return `$${(cents / 100).toFixed(2)}`;
}
