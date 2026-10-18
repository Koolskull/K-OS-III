"use client";

import React, { useEffect, useState } from "react";
import { albumThumb } from "@/lib/discography";
import {
  type AlbumListing,
  type ArtListing,
  allCatalogAlbums,
  deleteArt,
  loadListings,
  saveAlbumListing,
  slugAlbumId,
  subscribeListings,
  upsertArt,
  upsertCustomAlbum,
} from "@/lib/shop/listings";
import {
  SHOP_OWNER_ENS,
  connectMerchantWallet,
  disconnectMerchant,
  isMerchant,
  merchantAddress,
  shortAddr,
  watchWallets,
} from "@/lib/shop/merchant";
import type { Eip6963Detail } from "@/lib/walletProviders";
import { ExchangeApp } from "@/components/apps/marketplace/ExchangeApp";

type Tab = "art" | "albums";

function readImage(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    if (file.size > 4_000_000) {
      reject(new Error("Image too large (max 4MB for local listings)."));
      return;
    }
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      const max = 1200;
      const scale = Math.min(1, max / Math.max(img.width, img.height));
      const canvas = document.createElement("canvas");
      canvas.width = Math.max(1, Math.round(img.width * scale));
      canvas.height = Math.max(1, Math.round(img.height * scale));
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        reject(new Error("Canvas failed"));
        return;
      }
      ctx.imageSmoothingEnabled = false;
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      URL.revokeObjectURL(url);
      resolve(canvas.toDataURL("image/jpeg", 0.85));
    };
    img.onerror = () => reject(new Error("Could not read image"));
    img.src = url;
  });
}

export function MarketplaceApp() {
  const [shop, setShop] = useState(false);
  if (shop) return <ShopAdmin onBack={() => setShop(false)} />;
  return <ExchangeApp onOpenShop={() => setShop(true)} />;
}

function ShopAdmin({ onBack }: { onBack: () => void }) {
  const [tab, setTab] = useState<Tab>("art");
  const [addr, setAddr] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [art, setArt] = useState<ArtListing[]>([]);
  const [albums, setAlbums] = useState<Record<string, AlbumListing>>({});
  const [title, setTitle] = useState("");
  const [price, setPrice] = useState("25");
  const [busy, setBusy] = useState(false);
  const [wallets, setWallets] = useState<Eip6963Detail[]>([]);
  const [newAlbumTitle, setNewAlbumTitle] = useState("");
  const [newAlbumYear, setNewAlbumYear] = useState("");

  const refresh = () => {
    const data = loadListings();
    setArt(data.art);
    setAlbums(data.albums);
  };

  useEffect(() => {
    setAddr(merchantAddress());
    refresh();
    const stop = watchWallets((w) => setWallets((prev) => (prev.some((x) => x.info.uuid === w.info.uuid) ? prev : [...prev, w])));
    const unsub = subscribeListings(refresh);
    return () => {
      stop();
      unsub();
    };
  }, []);

  const connect = async (provider?: Eip6963Detail["provider"]) => {
    setErr(null);
    try {
      const a = await connectMerchantWallet(provider);
      setAddr(a);
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Wallet connect failed");
    }
  };

  if (!isMerchant() && !addr) {
    return (
      <div style={root}>
        <div style={pad}>
          <div style={h1}>SHOP ADMIN</div>
          <button type="button" style={{ ...btn, marginBottom: 12 }} onClick={onBack}>
            BACK TO FLOOR
          </button>
          <div style={dim}>
            ADMIN WALLETS: {SHOP_OWNER_ENS.toUpperCase()}
            <br />
            SIGN IN FROM ANY MACHINE WITH THAT WALLET TO LIST ART, HIDE ALBUMS, ADD RELEASES, AND SET ZIP / NFT PRICES.
            {typeof window !== "undefined" && window.location.protocol === "http:" ? (
              <>
                <br />
                <br />
                PHANTOM BLOCKS HTTP://LOCALHOST. USE HTTPS://LOCALHOST:5555 (ACCEPT THE CERT).
              </>
            ) : null}
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 16, maxWidth: 280 }}>
            {wallets.map((w) => (
              <button key={w.info.uuid} type="button" style={yellow} onClick={() => connect(w.provider)}>
                {w.info.name.toUpperCase()}
              </button>
            ))}
            {wallets.length === 0 && (
              <button type="button" style={yellow} onClick={() => connect()}>
                CONNECT WALLET
              </button>
            )}
          </div>
          {err && <div style={error}>{err}</div>}
        </div>
      </div>
    );
  }

  const addArt = async (file: File) => {
    setBusy(true);
    setErr(null);
    try {
      const image = await readImage(file);
      const cents = Math.max(0, Math.round(Number(price) * 100) || 0);
      upsertArt({
        id: `art-${Date.now()}`,
        title: title.trim() || file.name.replace(/\.[^.]+$/, ""),
        price_cents: cents,
        image,
        published: true,
        createdAt: Date.now(),
      });
      setTitle("");
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Upload failed");
    }
    setBusy(false);
  };

  return (
    <div style={root}>
      <div style={header}>
        <button type="button" style={btn} onClick={onBack}>
          BACK
        </button>
        <span style={{ color: "#00ff00", letterSpacing: 2 }}>SHOP</span>
        <span style={dim}>{addr ? shortAddr(addr) : ""}</span>
        <button type="button" style={tab === "art" ? on : btn} onClick={() => setTab("art")}>
          ART
        </button>
        <button type="button" style={tab === "albums" ? on : btn} onClick={() => setTab("albums")}>
          ALBUMS
        </button>
        <span style={{ flex: 1 }} />
        <button
          type="button"
          style={btn}
          onClick={() => {
            disconnectMerchant();
            setAddr(null);
          }}
        >
          DISCONNECT
        </button>
      </div>

      {err && <div style={{ ...error, padding: "4px 8px" }}>{err}</div>}

      {tab === "art" && (
        <div style={pad}>
          <div style={dim}>NEW LISTING — PUBLISHES TO ART GALLERY</div>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 8 }}>
            <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="TITLE" style={input} />
            <input
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              placeholder="USD"
              style={{ ...input, width: 80 }}
            />
            <label style={yellow}>
              {busy ? "…" : "UPLOAD IMAGE"}
              <input
                type="file"
                accept="image/*"
                hidden
                disabled={busy}
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  e.target.value = "";
                  if (f) void addArt(f);
                }}
              />
            </label>
          </div>
          <div style={{ marginTop: 16 }}>
            {art.length === 0 && <div style={dim}>NO ART LISTED YET. GALLERY WILL STAY EMPTY UNTIL YOU PUBLISH.</div>}
            {art.map((item) => (
              <div key={item.id} style={row}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={item.image} alt="" style={thumb} />
                <div style={{ flex: 1 }}>
                  <input
                    value={item.title}
                    style={input}
                    onChange={(e) => upsertArt({ ...item, title: e.target.value })}
                  />
                  <div style={{ display: "flex", gap: 8, marginTop: 4 }}>
                    <input
                      value={(item.price_cents / 100).toFixed(2)}
                      style={{ ...input, width: 80 }}
                      onChange={(e) =>
                        upsertArt({ ...item, price_cents: Math.round(Number(e.target.value) * 100) || 0 })
                      }
                    />
                    <button
                      type="button"
                      style={item.published ? on : btn}
                      onClick={() => upsertArt({ ...item, published: !item.published })}
                    >
                      {item.published ? "LIVE" : "HIDDEN"}
                    </button>
                    <button type="button" style={btn} onClick={() => deleteArt(item.id)}>
                      DELETE
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {tab === "albums" && (
        <div style={{ ...pad, overflow: "auto" }}>
          <div style={dim}>HIDE A RECORD FROM DISCOGRAPHY, SET ZIP / NFT PRICES, OR ADD A NEW RELEASE.</div>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", margin: "10px 0 16px" }}>
            <input
              value={newAlbumTitle}
              onChange={(e) => setNewAlbumTitle(e.target.value)}
              placeholder="NEW ALBUM TITLE"
              style={input}
            />
            <input
              value={newAlbumYear}
              onChange={(e) => setNewAlbumYear(e.target.value)}
              placeholder="YEAR"
              style={{ ...input, width: 72 }}
            />
            <label style={yellow}>
              ADD + COVER
              <input
                type="file"
                accept="image/*"
                hidden
                onChange={async (e) => {
                  const f = e.target.files?.[0];
                  e.target.value = "";
                  if (!f || !newAlbumTitle.trim()) {
                    setErr("Title required to add an album.");
                    return;
                  }
                  try {
                    const cover = await readImage(f);
                    const id = slugAlbumId(newAlbumTitle);
                    upsertCustomAlbum({
                      id,
                      title: newAlbumTitle.trim(),
                      artist: "KOOL SKULL",
                      year: newAlbumYear.trim() || String(new Date().getFullYear()),
                      coverUrl: cover,
                      thumbUrl: cover,
                      largeUrl: cover,
                      tracks: [],
                    });
                    setNewAlbumTitle("");
                    setNewAlbumYear("");
                  } catch (er) {
                    setErr(er instanceof Error ? er.message : "Add album failed");
                  }
                }}
              />
            </label>
          </div>
          {allCatalogAlbums().map((album) => {
            const listing = albums[album.id] ?? {
              albumId: album.id,
              zip_price_cents: 1000,
              nft_price_eth: "0.02",
              zip_enabled: true,
              nft_enabled: true,
              hidden: false,
            };
            return (
              <div key={album.id} style={row}>
                {albumThumb(album) ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={albumThumb(album)} alt="" style={thumb} />
                ) : (
                  <div style={thumb}>♫</div>
                )}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 10 }}>
                    {album.title}
                    {listing.hidden ? "  [HIDDEN]" : ""}
                  </div>
                  <div style={{ display: "flex", gap: 6, marginTop: 4, flexWrap: "wrap" }}>
                    <button
                      type="button"
                      style={listing.hidden ? btn : on}
                      onClick={() => saveAlbumListing({ ...listing, hidden: !listing.hidden })}
                    >
                      {listing.hidden ? "SHOW" : "HIDE"}
                    </button>
                    <button
                      type="button"
                      style={listing.zip_enabled ? on : btn}
                      onClick={() => saveAlbumListing({ ...listing, zip_enabled: !listing.zip_enabled })}
                    >
                      ZIP
                    </button>
                    <input
                      value={(listing.zip_price_cents / 100).toFixed(2)}
                      style={{ ...input, width: 72 }}
                      onChange={(e) =>
                        saveAlbumListing({
                          ...listing,
                          zip_price_cents: Math.round(Number(e.target.value) * 100) || 0,
                        })
                      }
                    />
                    <span style={dim}>USD</span>
                    <button
                      type="button"
                      style={listing.nft_enabled ? on : btn}
                      onClick={() => saveAlbumListing({ ...listing, nft_enabled: !listing.nft_enabled })}
                    >
                      NFT
                    </button>
                    <input
                      value={listing.nft_price_eth}
                      style={{ ...input, width: 72 }}
                      onChange={(e) => saveAlbumListing({ ...listing, nft_price_eth: e.target.value })}
                    />
                    <span style={dim}>ETH</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
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
  overflow: "auto",
};
const header: React.CSSProperties = {
  display: "flex",
  gap: 8,
  alignItems: "center",
  padding: 8,
  borderBottom: "1px solid #333",
  fontSize: 10,
};
const pad: React.CSSProperties = { padding: 12 };
const h1: React.CSSProperties = { color: "#00ff00", letterSpacing: 2, fontSize: 14, marginBottom: 12 };
const dim: React.CSSProperties = { color: "#888", fontSize: 9, letterSpacing: 1, lineHeight: 1.5 };
const error: React.CSSProperties = { color: "#ff5555", fontSize: 9, marginTop: 8 };
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
const on: React.CSSProperties = { ...btn, border: "1px solid #00ff00", color: "#00ff00" };
const yellow: React.CSSProperties = {
  ...btn,
  border: "1px solid #00ff00",
  background: "#00ff00",
  color: "#000",
  display: "inline-flex",
  alignItems: "center",
};
const input: React.CSSProperties = {
  height: 22,
  background: "#000",
  color: "#fff",
  border: "1px solid #555",
  fontFamily: "var(--dm-font-primary)",
  fontSize: 9,
  padding: "0 6px",
};
const row: React.CSSProperties = {
  display: "flex",
  gap: 8,
  padding: "8px 0",
  borderBottom: "1px solid #222",
  alignItems: "flex-start",
};
const thumb: React.CSSProperties = {
  width: 48,
  height: 48,
  objectFit: "cover",
  background: "#111",
  flexShrink: 0,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
};
