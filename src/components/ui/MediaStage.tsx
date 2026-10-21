"use client";

import React, { useEffect } from "react";
import { createPortal } from "react-dom";
import { mediaKind, mediaSrc, type MediaRole } from "@/lib/mediaKind";

/** Fullscreen still, iframe NFT, audio, or video. Close is the button, Escape, or the black field. */
export function MediaStage({
  open,
  title,
  image,
  src,
  role = "still",
  onClose,
}: {
  open: boolean;
  title?: string;
  image?: string | null;
  src?: string | null;
  role?: MediaRole;
  onClose: () => void;
}) {
  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open || typeof document === "undefined") return null;
  const file = mediaSrc(src) || mediaSrc(image);
  const kind = mediaKind(file, role);
  const still = mediaSrc(image) || (kind === "image" ? file : null);
  const label = kind === "empty" ? "MEDIA" : kind.toUpperCase();

  return createPortal(
    <div role="dialog" aria-modal="true" aria-label={title || label} style={backdrop}>
      <div style={bar}>
        <span style={kindMark}>{label}</span>
        <span style={titleMark}>{title || ""}</span>
        <button type="button" onClick={onClose} style={closeBtn} autoFocus>
          CLOSE
        </button>
      </div>
      <div style={stage} onClick={onClose}>
        {kind === "image" && still && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={still} alt={title || ""} style={fit} onClick={keep} />
        )}
        {kind === "iframe" && file && (
          <iframe
            src={file}
            title={title || "NFT"}
            style={frame}
            sandbox="allow-scripts allow-same-origin"
            referrerPolicy="no-referrer"
            onClick={keep}
          />
        )}
        {kind === "audio" && file && (
          <div style={audioBox} onClick={keep}>
            {still && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={still} alt="" style={audioArt} />
            )}
            <audio src={file} controls style={audioEl} />
          </div>
        )}
        {kind === "video" && file && (
          <video src={file} poster={still || undefined} controls playsInline style={fit} onClick={keep} />
        )}
        {kind === "empty" && <div style={empty}>NO MEDIA</div>}
      </div>
    </div>,
    document.body,
  );
}

function keep(event: React.MouseEvent) {
  event.stopPropagation();
}

/** FULL sits on the image. The picture underneath keeps its own click. */
export function FullscreenButton({
  title,
  image,
  src,
  role = "still",
  openOnClick = false,
  style,
  children,
}: {
  title?: string;
  image?: string | null;
  src?: string | null;
  role?: MediaRole;
  openOnClick?: boolean;
  style?: React.CSSProperties;
  children: React.ReactNode;
}) {
  const [open, setOpen] = React.useState(false);
  const stage = src || image;
  if (!stage) return <>{children}</>;
  return (
    <div
      style={{ ...wrap, ...style }}
      onClick={openOnClick ? () => setOpen(true) : undefined}
    >
      {children}
      <button
        type="button"
        aria-label={title ? `Fullscreen ${title}` : "Fullscreen"}
        style={fullBtn}
        onClick={(event) => {
          event.preventDefault();
          event.stopPropagation();
          setOpen(true);
        }}
      >
        FULL
      </button>
      <MediaStage
        open={open}
        title={title}
        image={image}
        src={stage}
        role={role}
        onClose={() => setOpen(false)}
      />
    </div>
  );
}

const backdrop: React.CSSProperties = {
  position: "fixed",
  inset: 0,
  zIndex: 120000,
  background: "#000",
  display: "flex",
  flexDirection: "column",
  fontFamily: "var(--dm-font-primary)",
};
const bar: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: 8,
  padding: 8,
  borderBottom: "1px solid #333",
  flexShrink: 0,
};
const kindMark: React.CSSProperties = { color: "#00ff00", fontSize: 10, letterSpacing: 1 };
const titleMark: React.CSSProperties = {
  flex: 1,
  minWidth: 0,
  color: "#fff",
  fontSize: 10,
  letterSpacing: 1,
  overflow: "hidden",
  textOverflow: "ellipsis",
  whiteSpace: "nowrap",
};
const closeBtn: React.CSSProperties = {
  height: 22,
  padding: "0 8px",
  border: "1px solid #00ff00",
  background: "#000",
  color: "#00ff00",
  fontFamily: "inherit",
  fontSize: 10,
  letterSpacing: 1,
  cursor: "pointer",
};
const stage: React.CSSProperties = {
  flex: 1,
  minHeight: 0,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  background: "#000",
};
const fit: React.CSSProperties = {
  maxWidth: "100%",
  maxHeight: "100%",
  objectFit: "contain",
  background: "#000",
};
const frame: React.CSSProperties = {
  width: "100%",
  height: "100%",
  border: "none",
  background: "#000",
};
const audioBox: React.CSSProperties = {
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  gap: 16,
  maxWidth: "100%",
  maxHeight: "100%",
};
const audioArt: React.CSSProperties = {
  maxWidth: "min(72vh, 100%)",
  maxHeight: "72vh",
  objectFit: "contain",
};
const audioEl: React.CSSProperties = { width: "min(480px, 100%)" };
const empty: React.CSSProperties = { color: "#888", letterSpacing: 1, fontSize: 12 };
const wrap: React.CSSProperties = { position: "relative", minWidth: 0 };
const fullBtn: React.CSSProperties = {
  position: "absolute",
  top: 4,
  right: 4,
  zIndex: 2,
  height: 16,
  padding: "0 4px",
  border: "1px solid #fff",
  background: "#000",
  color: "#fff",
  fontFamily: "var(--dm-font-primary)",
  fontSize: 8,
  letterSpacing: 1,
  cursor: "pointer",
};
