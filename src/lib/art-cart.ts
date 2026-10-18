"use client";

import type { ArtPiece } from "./art-catalog";

const KEY = "kos-art-cart-v1";

export interface ArtCartLine {
  pieceId: string;
  title: string;
  thumbnail: string;
  unit_price_cents: number;
  qty: number;
}

export interface ArtCart {
  lines: ArtCartLine[];
}

type Listener = () => void;
const listeners = new Set<Listener>();

function empty(): ArtCart {
  return { lines: [] };
}

function canStore(): boolean {
  return typeof window !== "undefined" && typeof window.localStorage !== "undefined";
}

export function loadArtCart(): ArtCart {
  if (!canStore()) return empty();
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return empty();
    const parsed = JSON.parse(raw) as ArtCart;
    if (!parsed || !Array.isArray(parsed.lines)) return empty();
    return parsed;
  } catch {
    return empty();
  }
}

function persist(cart: ArtCart): void {
  if (!canStore()) return;
  window.localStorage.setItem(KEY, JSON.stringify(cart));
  listeners.forEach((l) => l());
}

export function subscribeArtCart(fn: Listener): () => void {
  listeners.add(fn);
  return () => {
    listeners.delete(fn);
  };
}

export function addArtToCart(piece: ArtPiece): ArtCart {
  const cart = loadArtCart();
  const existing = cart.lines.find((l) => l.pieceId === piece.id);
  if (existing) {
    existing.qty += 1;
  } else {
    cart.lines.push({
      pieceId: piece.id,
      title: piece.title,
      thumbnail: piece.thumbnail,
      unit_price_cents: piece.digital_price_cents,
      qty: 1,
    });
  }
  persist(cart);
  return cart;
}

export function removeArtFromCart(pieceId: string): ArtCart {
  const cart = loadArtCart();
  cart.lines = cart.lines.filter((l) => l.pieceId !== pieceId);
  persist(cart);
  return cart;
}

export function clearArtCart(): ArtCart {
  const cart = empty();
  persist(cart);
  return cart;
}

export function artCartTotalCents(cart: ArtCart = loadArtCart()): number {
  return cart.lines.reduce((sum, l) => sum + l.unit_price_cents * l.qty, 0);
}

export function artCartCount(cart: ArtCart = loadArtCart()): number {
  return cart.lines.reduce((sum, l) => sum + l.qty, 0);
}
