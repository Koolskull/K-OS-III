"use client";

export type CartKind = "art_digital" | "album_zip" | "album_nft";

export interface CartLine {
  key: string;
  kind: CartKind;
  productId: string;
  title: string;
  thumb?: string;
  qty: number;
  unit_price_cents?: number;
  unit_price_eth?: string;
}

export interface ShopCart {
  lines: CartLine[];
}

const KEY = "kos-shop-cart-v1";
type Listener = () => void;
const listeners = new Set<Listener>();

function empty(): ShopCart {
  return { lines: [] };
}

function canStore(): boolean {
  return typeof window !== "undefined";
}

export function loadCart(): ShopCart {
  if (!canStore()) return empty();
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return empty();
    const parsed = JSON.parse(raw) as ShopCart;
    return parsed && Array.isArray(parsed.lines) ? parsed : empty();
  } catch {
    return empty();
  }
}

function persist(cart: ShopCart): void {
  if (!canStore()) return;
  window.localStorage.setItem(KEY, JSON.stringify(cart));
  listeners.forEach((l) => l());
}

export function subscribeCart(fn: Listener): () => void {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

export function addToCart(line: Omit<CartLine, "qty" | "key"> & { key?: string }): ShopCart {
  const cart = loadCart();
  const key = line.key ?? `${line.kind}:${line.productId}`;
  const existing = cart.lines.find((l) => l.key === key);
  if (existing) existing.qty += 1;
  else cart.lines.push({ ...line, key, qty: 1 });
  persist(cart);
  return cart;
}

export function removeFromCart(key: string): ShopCart {
  const cart = loadCart();
  cart.lines = cart.lines.filter((l) => l.key !== key);
  persist(cart);
  return cart;
}

export function clearCart(): ShopCart {
  const cart = empty();
  persist(cart);
  return cart;
}

export function cartCount(cart: ShopCart = loadCart()): number {
  return cart.lines.reduce((n, l) => n + l.qty, 0);
}

export function cartFiatCents(cart: ShopCart = loadCart()): number {
  return cart.lines.reduce((n, l) => n + (l.unit_price_cents ?? 0) * l.qty, 0);
}

export function formatUsd(cents: number): string {
  return `$${(cents / 100).toFixed(2)}`;
}
