"use client";

import React, { useEffect, useState } from "react";
import { addToCart, formatUsd } from "@/lib/shop/cart";
import { publishedArt, subscribeListings, type ArtListing } from "@/lib/shop/listings";

interface ArtGalleryAppProps {
  onOpenCart?: () => void;
  onOpenMarketplace?: () => void;
}

export function ArtGalleryApp({ onOpenCart, onOpenMarketplace }: ArtGalleryAppProps) {
  const [items, setItems] = useState<ArtListing[]>([]);
  const [selected, setSelected] = useState<ArtListing | null>(null);

  useEffect(() => {
    const pull = () => setItems(publishedArt());
    pull();
    return subscribeListings(pull);
  }, []);

  if (items.length === 0) {
    return (
      <div style={root}>
        <div style={emptyWrap}>
          <div style={emptyTitle}>NO ITEMS AVAILABLE RIGHT NOW</div>
          <div style={emptyBody}>
            THIS GALLERY IS EMPTY UNTIL THE OWNER LISTS WORK IN THE K-OS MARKETPLACE.
            CONNECT YOUR WALLET THERE, UPLOAD IMAGES, AND SET PRICES.
          </div>
          {onOpenMarketplace && (
            <button type="button" style={yellow} onClick={onOpenMarketplace}>
              OPEN MARKETPLACE
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div style={root}>
      <div style={topbar}>
        <span style={{ color: "#00ff00", letterSpacing: 2, fontSize: 10 }}>ART GALLERY</span>
        <span style={dim}>{items.length} FOR SALE</span>
      </div>
      <div style={body}>
        <div style={grid}>
          {items.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setSelected(item)}
              style={{
                ...card,
                outline: selected?.id === item.id ? "1px solid #00ff00" : "1px solid #333",
              }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={item.image} alt={item.title} style={thumb} />
              <div style={cardTitle}>{item.title}</div>
              <div style={cardPrice}>{formatUsd(item.price_cents)}</div>
            </button>
          ))}
        </div>
        {selected && (
          <aside style={aside}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={selected.image} alt={selected.title} style={hero} />
            <div style={{ color: "#00ff00", fontSize: 11 }}>{selected.title}</div>
            <div style={cardPrice}>{formatUsd(selected.price_cents)} DIGITAL</div>
            <button
              type="button"
              style={yellow}
              onClick={() => {
                addToCart({
                  kind: "art_digital",
                  productId: selected.id,
                  title: selected.title,
                  thumb: selected.image,
                  unit_price_cents: selected.price_cents,
                });
                onOpenCart?.();
              }}
            >
              BUY
            </button>
          </aside>
        )}
      </div>
    </div>
  );
}

const root: React.CSSProperties = {
  height: "100%",
  display: "flex",
  flexDirection: "column",
  background: "#000",
  color: "#fff",
  fontFamily: "var(--dm-font-primary)",
  imageRendering: "pixelated",
};
const emptyWrap: React.CSSProperties = {
  margin: "auto",
  maxWidth: 420,
  textAlign: "center",
  padding: 24,
};
const emptyTitle: React.CSSProperties = {
  color: "#00ff00",
  letterSpacing: 2,
  fontSize: 12,
  marginBottom: 12,
};
const emptyBody: React.CSSProperties = {
  color: "#888",
  fontSize: 9,
  letterSpacing: 1,
  lineHeight: 1.6,
  marginBottom: 16,
};
const topbar: React.CSSProperties = {
  display: "flex",
  gap: 12,
  padding: "8px",
  borderBottom: "1px solid #333",
  alignItems: "center",
};
const dim: React.CSSProperties = { color: "#888", fontSize: 9, letterSpacing: 1 };
const body: React.CSSProperties = { flex: 1, display: "flex", minHeight: 0 };
const grid: React.CSSProperties = {
  flex: 1,
  overflow: "auto",
  display: "grid",
  gridTemplateColumns: "repeat(auto-fill, minmax(112px, 1fr))",
  gap: 6,
  padding: 8,
  alignContent: "start",
};
const card: React.CSSProperties = {
  background: "#0a0a0a",
  border: "none",
  color: "#fff",
  cursor: "pointer",
  padding: 3,
  fontFamily: "var(--dm-font-primary)",
  display: "flex",
  flexDirection: "column",
};
const thumb: React.CSSProperties = {
  width: "100%",
  aspectRatio: "1 / 1",
  objectFit: "cover",
  imageRendering: "pixelated",
};
const cardTitle: React.CSSProperties = { fontSize: 8, textAlign: "left", marginTop: 4 };
const cardPrice: React.CSSProperties = { fontSize: 8, color: "#00ff00", textAlign: "left" };
const aside: React.CSSProperties = {
  width: 260,
  borderLeft: "1px solid #333",
  padding: 8,
  display: "flex",
  flexDirection: "column",
  gap: 8,
};
const hero: React.CSSProperties = { width: "100%", maxHeight: 220, objectFit: "contain" };
const yellow: React.CSSProperties = {
  height: 28,
  border: "1px solid #00ff00",
  background: "#00ff00",
  color: "#000",
  fontFamily: "var(--dm-font-primary)",
  fontSize: 9,
  letterSpacing: 1,
  cursor: "pointer",
};
