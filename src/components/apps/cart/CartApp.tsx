"use client";

import React, { useEffect, useState } from "react";
import {
  cartCount,
  cartFiatCents,
  clearCart,
  formatUsd,
  loadCart,
  removeFromCart,
  subscribeCart,
  type CartKind,
  type ShopCart,
} from "@/lib/shop/cart";

const KIND_LABEL: Record<CartKind, string> = {
  art_digital: "ART DIGITAL",
  album_zip: "ALBUM ZIP",
  album_nft: "MUSIC NFT (ETH)",
};

export function CartApp() {
  const [cart, setCart] = useState<ShopCart>({ lines: [] });
  const [note, setNote] = useState<string | null>(null);

  useEffect(() => {
    setCart(loadCart());
    return subscribeCart(() => setCart(loadCart()));
  }, []);

  const fiat = cartFiatCents(cart);
  const nftLines = cart.lines.filter((l) => l.kind === "album_nft");

  return (
    <div style={root}>
      <div style={header}>
        <span style={{ color: "#00ff00", letterSpacing: 2 }}>CART</span>
        <span style={dim}>{cartCount(cart)} ITEMS</span>
      </div>
      <div style={body}>
        {cart.lines.length === 0 ? (
          <div style={empty}>EMPTY. ADD A ZIP OR NFT FROM DISCOGRAPHY, OR ART FROM THE GALLERY.</div>
        ) : (
          cart.lines.map((line) => (
            <div key={line.key} style={row}>
              {line.thumb ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={line.thumb} alt="" style={thumb} />
              ) : (
                <div style={thumb}>♫</div>
              )}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={title}>{line.title}</div>
                <div style={dim}>
                  {KIND_LABEL[line.kind]} · QTY {line.qty}
                  {line.unit_price_cents != null ? ` · ${formatUsd(line.unit_price_cents)}` : ""}
                  {line.unit_price_eth ? ` · ${line.unit_price_eth} ETH` : ""}
                </div>
              </div>
              <button type="button" style={btn} onClick={() => removeFromCart(line.key)}>
                X
              </button>
            </div>
          ))
        )}
      </div>
      <div style={footer}>
        {fiat > 0 && <div style={total}>FIAT {formatUsd(fiat)}</div>}
        {nftLines.length > 0 && (
          <div style={total}>
            ETH{" "}
            {nftLines
              .map((l) => `${Number(l.unit_price_eth ?? 0) * l.qty}`)
              .join(" + ")}
          </div>
        )}
        <button
          type="button"
          style={buy}
          disabled={cart.lines.length === 0}
          onClick={() =>
            setNote(
              "Zips settle later on Stripe/PayPal. Music NFTs mint on Ethereum from this cart. Nothing is charged in this preview.",
            )
          }
        >
          CHECKOUT
        </button>
        <button type="button" style={btn} onClick={() => clearCart()}>
          CLEAR
        </button>
      </div>
      {note && <div style={{ ...dim, padding: "0 8px 8px" }}>{note}</div>}
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
const header: React.CSSProperties = {
  display: "flex",
  gap: 12,
  alignItems: "center",
  padding: "8px",
  borderBottom: "1px solid #333",
  fontSize: 11,
};
const body: React.CSSProperties = { flex: 1, overflow: "auto", padding: 8 };
const footer: React.CSSProperties = {
  display: "flex",
  gap: 8,
  alignItems: "center",
  padding: 8,
  borderTop: "1px solid #333",
};
const row: React.CSSProperties = {
  display: "flex",
  gap: 8,
  alignItems: "center",
  padding: "6px 0",
  borderBottom: "1px solid #222",
};
const thumb: React.CSSProperties = {
  width: 40,
  height: 40,
  objectFit: "cover",
  background: "#111",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  fontSize: 14,
  flexShrink: 0,
};
const title: React.CSSProperties = { fontSize: 10, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" };
const dim: React.CSSProperties = { color: "#888", fontSize: 8, letterSpacing: 1 };
const empty: React.CSSProperties = { color: "#888", fontSize: 10, padding: 24, letterSpacing: 1 };
const btn: React.CSSProperties = {
  height: 22,
  padding: "0 8px",
  border: "1px solid #555",
  background: "#000",
  color: "#fff",
  fontFamily: "var(--dm-font-primary)",
  fontSize: 9,
  cursor: "pointer",
};
const buy: React.CSSProperties = { ...btn, border: "1px solid #00ff00", background: "#00ff00", color: "#000" };
const total: React.CSSProperties = { color: "#00ff00", fontSize: 10, letterSpacing: 1, flex: 1 };
