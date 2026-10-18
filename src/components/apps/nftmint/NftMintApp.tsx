"use client";

import React, { useCallback, useEffect, useState } from "react";
import { ALL_MINTS, isKnownMintSlug, isMiyamakerMint } from "@/data/scatter-mints";
import {
  type ScatterCollection,
  pickPublicEthList,
  priceLabel,
  scatterImage,
} from "@/lib/scatter";
import { MIYAMAKER_MINI } from "@/data/sanctioned-nfts";
import { loadMintCollection } from "@/lib/mintClient";
import { getMintPage, subscribeMintPages } from "@/lib/shop/mintPages";
import { MintHeroPage } from "./MintHeroPage";
import { OwnedNftsPanel } from "./OwnedNftsPanel";

function hashSlug(): string | null {
  if (typeof window === "undefined") return null;
  const m = window.location.hash.match(/^#mint\/([a-z0-9-]+)/i);
  return m && isKnownMintSlug(m[1]) ? m[1] : null;
}

function hashOwned(): boolean {
  if (typeof window === "undefined") return false;
  return window.location.hash === "#nfts";
}

async function loadMint(slug: string): Promise<ScatterCollection | { slug: string; error: string }> {
  try {
    return await loadMintCollection(slug);
  } catch {
    return { slug, error: "Network error" };
  }
}

export function NftMintApp() {
  const [slug, setSlug] = useState<string | null>(null);
  const [showOwned, setShowOwned] = useState(false);
  const [rows, setRows] = useState<(ScatterCollection | { slug: string; error: string })[]>([]);
  const [, setTick] = useState(0);

  const load = useCallback(async () => {
    setRows(await Promise.all(ALL_MINTS.map((c) => loadMint(c.slug))));
  }, []);

  useEffect(() => {
    setSlug(hashSlug());
    setShowOwned(hashOwned());
    const onHash = () => {
      setSlug(hashSlug());
      setShowOwned(hashOwned());
    };
    window.addEventListener("hashchange", onHash);
    const unsub = subscribeMintPages(() => setTick((n) => n + 1));
    void load();
    return () => {
      window.removeEventListener("hashchange", onHash);
      unsub();
    };
  }, [load]);

  function openSlug(next: string) {
    setShowOwned(false);
    setSlug(next);
    if (typeof window !== "undefined") {
      window.history.replaceState(null, "", `#mint/${next}`);
    }
  }

  function openOwned() {
    setSlug(null);
    setShowOwned(true);
    if (typeof window !== "undefined") {
      window.history.replaceState(null, "", "#nfts");
    }
  }

  function back() {
    setSlug(null);
    setShowOwned(false);
    if (typeof window !== "undefined") {
      window.history.replaceState(null, "", window.location.pathname + window.location.search);
    }
  }

  if (slug) {
    return <MintHeroPage slug={slug} onBack={back} />;
  }

  if (showOwned) {
    return (
      <div style={root}>
        <div style={header}>
          <button type="button" style={btn} onClick={back}>
            ← ALL MINTS
          </button>
          <span style={{ color: "#00ff00", letterSpacing: 2 }}>MY NFTS</span>
          <span style={dim}>SANCTIONED COLLECTIONS</span>
        </div>
        <OwnedNftsPanel />
      </div>
    );
  }

  return (
    <div style={root}>
      <div style={header}>
        <span style={{ color: "#00ff00", letterSpacing: 2 }}>NFT MINTS</span>
        <span style={dim}>SCATTER + MIYAMAKER · ETHEREUM</span>
        <span style={{ flex: 1 }} />
        <button type="button" style={btn} onClick={openOwned}>
          MY NFTS
        </button>
        <button type="button" style={btn} onClick={() => void load()}>
          REFRESH
        </button>
      </div>
      <div style={grid}>
        {ALL_MINTS.map((def) => {
          const row = rows.find((r) => r.slug === def.slug);
          const col = row && "name" in row ? row : null;
          const fail = row && "error" in row ? row.error : null;
          const page = getMintPage(def.slug);
          const soldOut = col?.soldOut ?? false;
          const list = col ? pickPublicEthList(col.lists) : undefined;
          const hero =
            page?.heroImage ||
            (isMiyamakerMint(def.slug) ? MIYAMAKER_MINI.heroGif : null) ||
            scatterImage(col?.banner || def.bannerUrl, "800x280") ||
            scatterImage(def.avatarUrl, "400x400");
          return (
            <button key={def.slug} type="button" style={card} onClick={() => openSlug(def.slug)}>
              {hero ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={hero} alt="" style={heroImg} />
              ) : (
                <div style={{ ...heroImg, background: "#111" }} />
              )}
              <div style={cardBody}>
                <div style={title}>{(page?.title ?? def.title).toUpperCase()}</div>
                <div style={dim}>{(page?.tagline ?? def.tagline).toUpperCase()}</div>
                <div style={dim}>
                  {col
                    ? soldOut
                      ? `${col.minted} / ${col.max} MINTED`
                      : `${col.minted} / ${col.max} MINTED · ${col.remaining} LEFT`
                    : fail
                      ? fail.toUpperCase()
                      : "LOADING…"}
                </div>
                <div style={netLine}>
                  NETWORK · {(page?.networkLabel ?? def.networkLabel).toUpperCase()} · CHAIN {def.chainId}
                </div>
                {soldOut ? (
                  <div style={sold}>SOLD OUT</div>
                ) : (
                  <div style={open}>{list ? `PRICE ${priceLabel(list)}` : "LOADING PRICE…"}</div>
                )}
              </div>
            </button>
          );
        })}
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
const header: React.CSSProperties = {
  display: "flex",
  gap: 12,
  alignItems: "center",
  padding: 8,
  borderBottom: "1px solid #333",
  fontSize: 10,
};
const dim: React.CSSProperties = { color: "#888", fontSize: 8, letterSpacing: 1 };
const grid: React.CSSProperties = {
  flex: 1,
  overflow: "auto",
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
  gap: 10,
  padding: 10,
  alignContent: "start",
};
const card: React.CSSProperties = {
  border: "1px solid #333",
  background: "#0a0a0a",
  display: "flex",
  flexDirection: "column",
  textAlign: "left",
  color: "inherit",
  cursor: "pointer",
  padding: 0,
  fontFamily: "var(--dm-font-primary)",
};
const heroImg: React.CSSProperties = {
  width: "100%",
  height: 96,
  objectFit: "cover",
  imageRendering: "pixelated",
  display: "block",
};
const cardBody: React.CSSProperties = { padding: 10, display: "flex", flexDirection: "column", gap: 6 };
const title: React.CSSProperties = { fontSize: 10, color: "#00ff00", letterSpacing: 1 };
const netLine: React.CSSProperties = { color: "#aaa", fontSize: 8, letterSpacing: 1 };
const sold: React.CSSProperties = {
  border: "1px solid #ff5555",
  color: "#ff5555",
  textAlign: "center",
  padding: "8px 0",
  letterSpacing: 2,
  fontSize: 12,
};
const open: React.CSSProperties = { color: "#00ff00", fontSize: 9, letterSpacing: 1 };
const btn: React.CSSProperties = {
  height: 22,
  padding: "0 8px",
  border: "1px solid #555",
  background: "#000",
  color: "#fff",
  fontFamily: "var(--dm-font-primary)",
  fontSize: 8,
  cursor: "pointer",
};
