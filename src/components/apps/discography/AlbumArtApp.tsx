"use client";

import React from "react";
import { albumLarge, type MusicAlbum } from "@/lib/discography";

interface AlbumArtAppProps {
  album: MusicAlbum | null;
  isMaximized?: boolean;
}

export function AlbumArtApp({ album, isMaximized }: AlbumArtAppProps) {
  if (!album) {
    return <div style={empty}>No album selected</div>;
  }
  const src = albumLarge(album, isMaximized);
  return (
    <div style={root}>
      {src ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={src} alt={album.title} style={img} />
      ) : (
        <div style={empty}>No artwork</div>
      )}
      {!isMaximized && (
        <div style={info}>
          <div style={{ color: "#00ff00", letterSpacing: 1 }}>{album.title}</div>
          <div style={{ color: "#ccc", marginTop: 4 }}>
            {album.artist} · {album.year}
          </div>
          <div style={{ color: "#888", marginTop: 2 }}>{album.tracks.length} Tracks</div>
        </div>
      )}
    </div>
  );
}

const root: React.CSSProperties = {
  height: "100%",
  background: "#000",
  display: "flex",
  flexDirection: "column",
  fontFamily: "var(--dm-font-primary)",
  imageRendering: "pixelated",
};

const img: React.CSSProperties = {
  width: "100%",
  flex: 1,
  objectFit: "contain",
  background: "#000",
  imageRendering: "pixelated",
};

const info: React.CSSProperties = {
  padding: "8px 10px",
  borderTop: "1px solid #333",
  fontSize: 10,
};

const empty: React.CSSProperties = {
  height: "100%",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  color: "#888",
  background: "#000",
  fontFamily: "var(--dm-font-primary)",
  fontSize: 10,
};
