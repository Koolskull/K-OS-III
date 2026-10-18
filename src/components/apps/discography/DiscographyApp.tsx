"use client";

/*
 * Discography — square / grid / list album browser.
 * Port of live koolskull.com MusicLibrary (no Music desktop icon).
 */

import React, { useEffect, useMemo, useState } from "react";
import { albumThumb, type MusicAlbum } from "@/lib/discography";
import { addToCart, formatUsd } from "@/lib/shop/cart";
import { albumListing, allCatalogAlbums, subscribeListings, visibleAlbums } from "@/lib/shop/listings";

type ViewMode = "square" | "grid" | "list";

interface DiscographyAppProps {
  onAlbumClick: (album: MusicAlbum) => void;
  onOpenCart?: () => void;
}

export function DiscographyApp({ onAlbumClick, onOpenCart }: DiscographyAppProps) {
  const [viewMode, setViewMode] = useState<ViewMode>("square");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [tick, setTick] = useState(0);

  useEffect(() => subscribeListings(() => setTick((n) => n + 1)), []);
  void tick;

  const albums = useMemo(() => visibleAlbums(), [tick]);
  const totalTracks = useMemo(
    () => albums.reduce((sum, a) => sum + a.tracks.length, 0),
    [albums],
  );

  const cycleView = () => {
    setViewMode((prev) => (prev === "square" ? "grid" : prev === "grid" ? "list" : "square"));
  };

  const viewLabel =
    viewMode === "square" ? "Grid View" : viewMode === "grid" ? "List View" : "Square View";

  return (
    <div style={root}>
      <div style={header}>
        <button type="button" onClick={cycleView} style={btn}>
          {viewLabel}
        </button>
        <span style={meta}>
          {albums.length} albums · {totalTracks} tracks — click to play
        </span>
      </div>
      <div
        style={{
          ...list,
          ...(viewMode === "square"
            ? squareGrid
            : viewMode === "grid"
              ? gridGrid
              : listCol),
        }}
      >
        {albums.map((album) => {
          const selected = selectedId === album.id;
          const src = albumThumb(album);
          if (viewMode === "square") {
            return (
              <button
                key={album.id}
                type="button"
                title={`${album.title} (${album.artist}, ${album.year})`}
                onClick={() => {
                  setSelectedId(album.id);
                  onAlbumClick(album);
                }}
                style={{
                  ...squareItem,
                  outline: selected ? "1px solid #00ff00" : "1px solid #333",
                }}
              >
                {src ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={src}
                    alt={album.title}
                    style={squareImg}
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = "none";
                    }}
                  />
                ) : (
                  <div style={fallback}>♫</div>
                )}
                <div style={squareTitle}>{album.title}</div>
                <div style={squareSub}>{album.tracks.length} Tracks</div>
              </button>
            );
          }
          return (
            <button
              key={album.id}
              type="button"
              onClick={() => {
                setSelectedId(album.id);
                onAlbumClick(album);
              }}
              style={{
                ...rowItem,
                background: selected ? "#1a1a00" : "transparent",
                outline: selected ? "1px solid #555" : "1px solid transparent",
              }}
            >
              {src ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={src} alt="" style={rowImg} />
              ) : (
                <div style={{ ...rowImg, display: "flex", alignItems: "center", justifyContent: "center" }}>
                  ♫
                </div>
              )}
              <div style={{ textAlign: "left", minWidth: 0 }}>
                <div style={rowTitle}>{album.title}</div>
                <div style={squareSub}>
                  {album.artist} · {album.year} · {album.tracks.length} Tracks
                </div>
              </div>
            </button>
          );
        })}
      </div>
      {selectedId && (
        <BuyBar albumId={selectedId} onOpenCart={onOpenCart} />
      )}
    </div>
  );
}

function BuyBar({ albumId, onOpenCart }: { albumId: string; onOpenCart?: () => void }) {
  const album = allCatalogAlbums().find((a) => a.id === albumId);
  if (!album) return null;
  const listing = albumListing(album.id);
  const thumb = albumThumb(album);
  return (
    <div style={buyBar}>
      <span style={{ color: "#00ff00", fontSize: 9, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
        {album.title}
      </span>
      <span style={{ flex: 1 }} />
      {listing.zip_enabled && (
        <button
          type="button"
          style={buyBtn}
          onClick={(e) => {
            e.stopPropagation();
            addToCart({
              kind: "album_zip",
              productId: album.id,
              title: `${album.title} (ZIP)`,
              thumb,
              unit_price_cents: listing.zip_price_cents,
            });
            onOpenCart?.();
          }}
        >
          BUY ZIP {formatUsd(listing.zip_price_cents)}
        </button>
      )}
      {listing.nft_enabled && (
        <button
          type="button"
          style={buyBtn}
          onClick={(e) => {
            e.stopPropagation();
            addToCart({
              kind: "album_nft",
              productId: album.id,
              title: `${album.title} (MUSIC NFT)`,
              thumb,
              unit_price_eth: listing.nft_price_eth,
            });
            onOpenCart?.();
          }}
        >
          BUY NFT {listing.nft_price_eth} ETH
        </button>
      )}
    </div>
  );
}

const root: React.CSSProperties = {
  display: "flex",
  flexDirection: "column",
  height: "100%",
  background: "#000",
  color: "#fff",
  fontFamily: "var(--dm-font-primary)",
  imageRendering: "pixelated",
};

const header: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: 8,
  padding: "6px 8px",
  borderBottom: "1px solid #333",
  flexShrink: 0,
};

const btn: React.CSSProperties = {
  height: 22,
  padding: "0 10px",
  border: "1px solid #555",
  background: "#000",
  color: "#fff",
  fontFamily: "var(--dm-font-primary)",
  fontSize: 9,
  letterSpacing: 1,
  cursor: "pointer",
};

const meta: React.CSSProperties = {
  color: "#888",
  fontSize: 9,
  letterSpacing: 1,
};

const list: React.CSSProperties = {
  flex: 1,
  overflow: "auto",
  padding: 8,
};

const squareGrid: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))",
  gap: 8,
  alignContent: "start",
};

const gridGrid: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))",
  gap: 6,
  alignContent: "start",
};

const listCol: React.CSSProperties = {
  display: "flex",
  flexDirection: "column",
  gap: 4,
};

const squareItem: React.CSSProperties = {
  display: "flex",
  flexDirection: "column",
  alignItems: "stretch",
  background: "#0a0a0a",
  border: "none",
  color: "#fff",
  cursor: "pointer",
  padding: 4,
  fontFamily: "var(--dm-font-primary)",
};

const squareImg: React.CSSProperties = {
  width: "100%",
  aspectRatio: "1 / 1",
  objectFit: "cover",
  imageRendering: "pixelated",
  background: "#111",
};

const fallback: React.CSSProperties = {
  width: "100%",
  aspectRatio: "1 / 1",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  background: "#111",
  color: "#888",
  fontSize: 28,
};

const squareTitle: React.CSSProperties = {
  marginTop: 4,
  fontSize: 9,
  textAlign: "left",
  overflow: "hidden",
  textOverflow: "ellipsis",
  whiteSpace: "nowrap",
};

const squareSub: React.CSSProperties = {
  fontSize: 8,
  color: "#888",
  textAlign: "left",
};

const rowItem: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: 8,
  padding: 4,
  border: "none",
  background: "transparent",
  color: "#fff",
  cursor: "pointer",
  fontFamily: "var(--dm-font-primary)",
  width: "100%",
};

const rowImg: React.CSSProperties = {
  width: 48,
  height: 48,
  objectFit: "cover",
  imageRendering: "pixelated",
  flexShrink: 0,
  background: "#111",
};

const rowTitle: React.CSSProperties = {
  fontSize: 10,
  overflow: "hidden",
  textOverflow: "ellipsis",
  whiteSpace: "nowrap",
};

const buyBar: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: 8,
  padding: "6px 8px",
  borderTop: "1px solid #333",
  flexShrink: 0,
  fontFamily: "var(--dm-font-primary)",
};

const buyBtn: React.CSSProperties = {
  height: 22,
  padding: "0 8px",
  border: "1px solid #00ff00",
  background: "#000",
  color: "#00ff00",
  fontFamily: "var(--dm-font-primary)",
  fontSize: 8,
  letterSpacing: 1,
  cursor: "pointer",
};
