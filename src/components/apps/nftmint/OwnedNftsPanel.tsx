"use client";

import React, { useCallback, useState } from "react";
import { SANCTIONED_NFTS } from "@/data/sanctioned-nfts";
import { shortContract } from "@/lib/scatter";
import { loadOwnedNfts, type OwnedNftItem } from "@/lib/mintClient";
import { connectEthereumProvider, ensureChain } from "@/lib/walletProviders";

function tokenLabel(item: OwnedNftItem): string {
  const id = item.tokenId.startsWith("0x") ? String(parseInt(item.tokenId, 16)) : item.tokenId;
  return item.name || `#${id}`;
}

export function OwnedNftsPanel({ accent = "#00ff00" }: { accent?: string }) {
  const [wallet, setWallet] = useState<string | null>(null);
  const [owned, setOwned] = useState<OwnedNftItem[]>([]);
  const [held, setHeld] = useState<string[]>([]);
  const [balances, setBalances] = useState<Record<string, number>>({});
  const [source, setSource] = useState<"api" | "rpc" | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [filter, setFilter] = useState<string>("all");
  const [focus, setFocus] = useState<OwnedNftItem | null>(null);

  const load = useCallback(async (address: string) => {
    setBusy(true);
    setErr(null);
    try {
      const data = await loadOwnedNfts(address);
      setOwned(data.items);
      setHeld(data.held);
      setBalances(data.balances);
      setSource(data.source);
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Lookup failed");
    }
    setBusy(false);
  }, []);

  async function connect() {
    setErr(null);
    try {
      const { address: addr, provider } = await connectEthereumProvider();
      await ensureChain(provider, 1);
      setWallet(addr);
      await load(addr);
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Wallet connect failed");
    }
  }

  const shown = owned.filter((n) => filter === "all" || n.collectionId === filter);

  return (
    <div style={root}>
      <div style={ownedHead}>
        <div>
          <div style={{ ...label, color: accent }}>SANCTIONED COLLECTIONS</div>
          <div style={dim}>
            KOOLSKULL AND REMILIA COLLECTIONS ON ETHEREUM, INCLUDING BONKLER. TOKEN IMAGES USE LIVE
            METADATA WHEN THE CONTRACT PUBLISHES THEM.
          </div>
        </div>
        <button type="button" style={{ ...ghost, border: `1px solid ${accent}`, color: accent }} onClick={() => void connect()}>
          {wallet ? `${shortContract(wallet)} · REFRESH` : "CONNECT WALLET"}
        </button>
      </div>
      <div style={chipRow}>
        <Chip
          accent={accent}
          on={filter === "all"}
          onClick={() => setFilter("all")}
          label={`ALL ${owned.length}`}
        />
        {SANCTIONED_NFTS.map((c) => {
          const n = owned.filter((i) => i.collectionId === c.id).length;
          const bal = balances[c.id] ?? n;
          return (
            <Chip
              key={c.id}
              accent={accent}
              on={filter === c.id}
              onClick={() => setFilter(c.id)}
              label={`${c.name.toUpperCase()}${bal ? ` ${bal}` : ""}`}
            />
          );
        })}
      </div>
      {busy && <div style={pad}>LOADING YOUR NFTS…</div>}
      {err && <div style={{ ...pad, color: "#ff5555" }}>{err.toUpperCase()}</div>}
      {!busy && wallet && owned.length === 0 && (
        <div style={pad}>
          {held.length > 0
            ? "THIS WALLET HOLDS SANCTIONED COLLECTIONS. FULL TOKEN IMAGES NEED AN OPTIONAL ALCHEMY KEY ON THE SERVER — MINI TOKENS STILL SCAN ON-CHAIN."
            : "NO SANCTIONED NFTS IN THIS WALLET."}
        </div>
      )}
      {!wallet && !busy && <div style={pad}>CONNECT A WALLET TO LOAD YOUR NFTS.</div>}
      {held.length > 0 && (
        <div style={{ ...dim, padding: "0 12px 8px" }}>
          HOLDING: {held.map((id) => id.toUpperCase()).join(" · ")}
          {source === "rpc" ? " · ON-CHAIN COUNTS" : ""}
        </div>
      )}
      <div style={nftGrid}>
        {shown.map((item) => (
          <button
            key={`${item.contractAddress}-${item.tokenId}`}
            type="button"
            style={nftCard}
            onClick={() => setFocus(item)}
          >
            {item.image ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={item.image} alt="" style={nftImg} />
            ) : (
              <div style={{ ...nftImg, background: "#111" }} />
            )}
            <div style={nftMeta}>
              <div style={{ color: accent, fontSize: 8 }}>{(item.collectionName || "NFT").toUpperCase()}</div>
              <div style={dim}>{tokenLabel(item)}</div>
            </div>
          </button>
        ))}
      </div>
      {focus && (
        <div style={modal} onClick={() => setFocus(null)}>
          <div style={{ ...modalCard, border: `1px solid ${accent}` }} onClick={(e) => e.stopPropagation()}>
            {focus.image && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={focus.image} alt="" style={{ width: "100%", imageRendering: "pixelated" }} />
            )}
            <div style={{ padding: 10, display: "flex", flexDirection: "column", gap: 6 }}>
              <div style={{ color: accent, fontSize: 10 }}>{(focus.collectionName || "").toUpperCase()}</div>
              <div>{tokenLabel(focus)}</div>
              <a
                href={`https://etherscan.io/nft/${focus.contractAddress}/${focus.tokenId}`}
                target="_blank"
                rel="noreferrer"
                style={link}
              >
                ETHERSCAN
              </a>
              <button type="button" style={btn} onClick={() => setFocus(null)}>
                CLOSE
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function Chip({
  label,
  on,
  onClick,
  accent,
}: {
  label: string;
  on: boolean;
  onClick: () => void;
  accent: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={
        on
          ? { ...btn, height: 20, background: accent, color: "#000", border: `1px solid ${accent}` }
          : { ...btn, height: 20 }
      }
    >
      {label}
    </button>
  );
}

const root: React.CSSProperties = { flex: 1, overflow: "auto", position: "relative" };
const dim: React.CSSProperties = { color: "#888", fontSize: 8, letterSpacing: 1 };
const label: React.CSSProperties = { fontSize: 8, letterSpacing: 2 };
const pad: React.CSSProperties = { padding: 12, fontSize: 9, color: "#aaa" };
const ownedHead: React.CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  gap: 12,
  padding: 12,
  alignItems: "flex-start",
  borderBottom: "1px solid #333",
};
const chipRow: React.CSSProperties = { display: "flex", flexWrap: "wrap", gap: 6, padding: 10 };
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
const ghost: React.CSSProperties = { ...btn };
const link: React.CSSProperties = { color: "#888", fontSize: 8, letterSpacing: 1 };
const nftGrid: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fill, minmax(120px, 1fr))",
  gap: 8,
  padding: 10,
};
const nftCard: React.CSSProperties = {
  border: "1px solid #333",
  background: "#0a0a0a",
  padding: 0,
  color: "inherit",
  cursor: "pointer",
  textAlign: "left",
  fontFamily: "var(--dm-font-primary)",
};
const nftImg: React.CSSProperties = {
  width: "100%",
  aspectRatio: "1",
  objectFit: "cover",
  imageRendering: "pixelated",
  display: "block",
};
const nftMeta: React.CSSProperties = { padding: 6, display: "flex", flexDirection: "column", gap: 2 };
const modal: React.CSSProperties = {
  position: "absolute",
  inset: 0,
  background: "rgba(0,0,0,0.8)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  zIndex: 20,
  padding: 16,
};
const modalCard: React.CSSProperties = {
  width: "min(420px, 100%)",
  maxHeight: "100%",
  overflow: "auto",
  background: "#000",
};
