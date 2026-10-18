"use client";

import { getScatterMint, type ScatterMintDef } from "@/data/scatter-mints";

export interface MintPageOverlay {
  title?: string;
  tagline?: string;
  body?: string;
  heroImage?: string;
  maxQuantity?: number;
  networkLabel?: string;
  priceNote?: string;
}

export interface MintPageContent {
  slug: string;
  title: string;
  tagline: string;
  body: string;
  heroImage: string | null;
  maxQuantity: number;
  networkLabel: string;
  priceNote: string;
  scatterUrl: string;
  chainId: number;
  address: string;
  shortName: string;
  avatarUrl: string;
  bannerUrl: string;
  symbol: string;
}

const KEY = "kos-mint-pages-v1";
type Store = Record<string, MintPageOverlay>;
type Listener = () => void;
const listeners = new Set<Listener>();

function canStore(): boolean {
  return typeof window !== "undefined";
}

function loadStore(): Store {
  if (!canStore()) return {};
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as Store;
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}

function persist(data: Store): void {
  if (!canStore()) return;
  window.localStorage.setItem(KEY, JSON.stringify(data));
  listeners.forEach((l) => l());
}

export function subscribeMintPages(fn: Listener): () => void {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

export function clampMintQty(n: number, fallback = 10): number {
  if (!Number.isFinite(n)) return fallback;
  return Math.max(1, Math.min(20, Math.round(n)));
}

function fromDef(def: ScatterMintDef, overlay: MintPageOverlay = {}): MintPageContent {
  return {
    slug: def.slug,
    title: overlay.title?.trim() || def.title,
    tagline: overlay.tagline?.trim() || def.tagline,
    body: overlay.body?.trim() || def.body,
    heroImage: overlay.heroImage || null,
    maxQuantity: clampMintQty(overlay.maxQuantity ?? def.maxQuantity, def.maxQuantity),
    networkLabel: overlay.networkLabel?.trim() || def.networkLabel,
    priceNote: overlay.priceNote?.trim() || "",
    scatterUrl: def.scatterUrl,
    chainId: def.chainId,
    address: def.address,
    shortName: def.shortName,
    avatarUrl: def.avatarUrl,
    bannerUrl: def.bannerUrl,
    symbol: def.symbol,
  };
}

export function getMintPage(slug: string): MintPageContent | null {
  const def = getScatterMint(slug);
  if (!def) return null;
  return fromDef(def, loadStore()[slug] ?? {});
}

export function getMintOverlay(slug: string): MintPageOverlay {
  return loadStore()[slug] ?? {};
}

export function saveMintPage(slug: string, overlay: MintPageOverlay): MintPageContent | null {
  const def = getScatterMint(slug);
  if (!def) return null;
  const next = { ...loadStore(), [slug]: overlay };
  persist(next);
  return fromDef(def, overlay);
}

export function resetMintPage(slug: string): MintPageContent | null {
  const def = getScatterMint(slug);
  if (!def) return null;
  const data = loadStore();
  delete data[slug];
  persist(data);
  return fromDef(def);
}

export function readHeroImage(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    if (file.size > 6_000_000) {
      reject(new Error("Image too large (max 6MB)."));
      return;
    }
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      const max = 1600;
      const scale = Math.min(1, max / Math.max(img.width, img.height));
      const canvas = document.createElement("canvas");
      canvas.width = Math.max(1, Math.round(img.width * scale));
      canvas.height = Math.max(1, Math.round(img.height * scale));
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        URL.revokeObjectURL(url);
        reject(new Error("Canvas failed"));
        return;
      }
      ctx.imageSmoothingEnabled = false;
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      URL.revokeObjectURL(url);
      resolve(canvas.toDataURL("image/jpeg", 0.82));
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Could not read image"));
    };
    img.src = url;
  });
}
