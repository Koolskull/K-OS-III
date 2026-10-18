"use client";

import { DISCOGRAPHY, type MusicAlbum } from "@/lib/discography";

export const DEFAULT_ZIP_CENTS = 1000;
export const DEFAULT_NFT_ETH = "0.02";

export interface ArtListing {
  id: string;
  title: string;
  price_cents: number;
  image: string;
  published: boolean;
  createdAt: number;
}

export interface AlbumListing {
  albumId: string;
  zip_price_cents: number;
  nft_price_eth: string;
  zip_enabled: boolean;
  nft_enabled: boolean;
  /** Hidden from the public Discography desktop app. */
  hidden?: boolean;
}

export interface CustomAlbum extends MusicAlbum {}

export interface ShopListings {
  art: ArtListing[];
  albums: Record<string, AlbumListing>;
  customAlbums: CustomAlbum[];
}

const KEY = "kos-shop-listings-v1";
type Listener = () => void;
const listeners = new Set<Listener>();

function defaultAlbums(): Record<string, AlbumListing> {
  const albums: Record<string, AlbumListing> = {};
  for (const a of DISCOGRAPHY) {
    albums[a.id] = {
      albumId: a.id,
      zip_price_cents: DEFAULT_ZIP_CENTS,
      nft_price_eth: DEFAULT_NFT_ETH,
      zip_enabled: true,
      nft_enabled: true,
    };
  }
  return albums;
}

function empty(): ShopListings {
  return { art: [], albums: defaultAlbums(), customAlbums: [] };
}

function canStore(): boolean {
  return typeof window !== "undefined";
}

export function loadListings(): ShopListings {
  const base = empty();
  if (!canStore()) return base;
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return base;
    const parsed = JSON.parse(raw) as ShopListings;
    const albums = { ...base.albums, ...(parsed.albums ?? {}) };
    return {
      art: Array.isArray(parsed.art) ? parsed.art : [],
      albums,
      customAlbums: Array.isArray(parsed.customAlbums) ? parsed.customAlbums : [],
    };
  } catch {
    return base;
  }
}

function persist(data: ShopListings): void {
  if (!canStore()) return;
  window.localStorage.setItem(KEY, JSON.stringify(data));
  listeners.forEach((l) => l());
}

export function subscribeListings(fn: Listener): () => void {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

export function publishedArt(): ArtListing[] {
  return loadListings().art.filter((a) => a.published && a.image);
}

export function upsertArt(listing: ArtListing): ShopListings {
  const data = loadListings();
  const i = data.art.findIndex((a) => a.id === listing.id);
  if (i >= 0) data.art[i] = listing;
  else data.art.push(listing);
  persist(data);
  return data;
}

export function deleteArt(id: string): ShopListings {
  const data = loadListings();
  data.art = data.art.filter((a) => a.id !== id);
  persist(data);
  return data;
}

export function saveAlbumListing(listing: AlbumListing): ShopListings {
  const data = loadListings();
  data.albums[listing.albumId] = listing;
  persist(data);
  return data;
}

export function albumListing(albumId: string): AlbumListing {
  const data = loadListings();
  return (
    data.albums[albumId] ?? {
      albumId,
      zip_price_cents: DEFAULT_ZIP_CENTS,
      nft_price_eth: DEFAULT_NFT_ETH,
      zip_enabled: true,
      nft_enabled: true,
      hidden: false,
    }
  );
}

export function allCatalogAlbums(): MusicAlbum[] {
  const data = loadListings();
  const seen = new Set(DISCOGRAPHY.map((a) => a.id));
  const extra = data.customAlbums.filter((a) => !seen.has(a.id));
  return [...DISCOGRAPHY, ...extra];
}

export function visibleAlbums(): MusicAlbum[] {
  return allCatalogAlbums().filter((a) => !albumListing(a.id).hidden);
}

export function upsertCustomAlbum(album: CustomAlbum): ShopListings {
  const data = loadListings();
  const i = data.customAlbums.findIndex((a) => a.id === album.id);
  if (i >= 0) data.customAlbums[i] = album;
  else data.customAlbums.push(album);
  if (!data.albums[album.id]) {
    data.albums[album.id] = {
      albumId: album.id,
      zip_price_cents: DEFAULT_ZIP_CENTS,
      nft_price_eth: DEFAULT_NFT_ETH,
      zip_enabled: true,
      nft_enabled: true,
      hidden: false,
    };
  }
  persist(data);
  return data;
}

export function slugAlbumId(title: string): string {
  const s = title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 80);
  return s || `album-${Date.now()}`;
}
