"use client";

import { useEffect, useState } from "react";
import type { ProfileBlockType } from "@/lib/profile-sanitize";

interface OwnedNft {
  contractAddress: string;
  tokenId: string;
  name: string | null;
  image: string | null;
}

interface EditableBlock {
  block_type: ProfileBlockType;
  text?: string;
  url?: string;
  nft?: OwnedNft;
  nfts?: OwnedNft[];
}

const field: React.CSSProperties = {
  display: "block",
  width: "100%",
  height: 24,
  background: "#000",
  color: "#fff",
  border: "1px solid #555",
  fontFamily: "var(--dm-font-primary)",
  fontSize: 9,
  padding: "0 6px",
  marginTop: 3,
  boxSizing: "border-box",
  outline: "none",
};

const label: React.CSSProperties = {
  fontSize: 7,
  color: "#888",
  letterSpacing: 1,
  display: "block",
  marginTop: 8,
};

const secondaryBtn: React.CSSProperties = {
  height: 22,
  padding: "0 8px",
  border: "1px solid #555",
  background: "#000",
  color: "#ccc",
  fontFamily: "var(--dm-font-primary)",
  fontSize: 7,
  letterSpacing: 1,
  cursor: "pointer",
};

const primaryBtn: React.CSSProperties = {
  width: "100%",
  height: 26,
  marginTop: 10,
  border: "1px solid #fff",
  background: "#fff",
  color: "#000",
  fontFamily: "var(--dm-font-primary)",
  fontSize: 8,
  letterSpacing: 1,
  cursor: "pointer",
};

export function ProfileBlocksEditor() {
  const [blocks, setBlocks] = useState<EditableBlock[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [addType, setAddType] = useState<ProfileBlockType>("text");
  const [nftPickerFor, setNftPickerFor] = useState<number | null>(null);
  const [owned, setOwned] = useState<OwnedNft[]>([]);
  const [loadingNfts, setLoadingNfts] = useState(false);

  useEffect(() => {
    fetch("/api/profile/blocks")
      .then((r) => (r.ok ? r.json() : { blocks: [] }))
      .then((data: { blocks?: { block_type: ProfileBlockType; payload: Record<string, unknown> }[] }) => {
        setBlocks(
          (data.blocks ?? []).map((b) => {
            if (b.block_type === "nft") {
              return {
                block_type: "nft",
                nft: {
                  contractAddress: String(b.payload.contractAddress ?? ""),
                  tokenId: String(b.payload.tokenId ?? ""),
                  name: typeof b.payload.name === "string" ? b.payload.name : null,
                  image: typeof b.payload.image === "string" ? b.payload.image : null,
                },
              };
            }
            if (b.block_type === "nft_gallery") {
              const items = Array.isArray(b.payload.items) ? b.payload.items : [];
              return {
                block_type: "nft_gallery",
                nfts: items.map((it) => {
                  const x = it as Record<string, unknown>;
                  return {
                    contractAddress: String(x.contractAddress ?? ""),
                    tokenId: String(x.tokenId ?? ""),
                    name: typeof x.name === "string" ? x.name : null,
                    image: typeof x.image === "string" ? x.image : null,
                  };
                }),
              };
            }
            return {
              block_type: b.block_type,
              text: typeof b.payload?.body === "string" ? b.payload.body : undefined,
              url:
                typeof b.payload?.url === "string"
                  ? b.payload.url
                  : typeof b.payload?.videoId === "string"
                    ? b.payload.videoId
                    : undefined,
            };
          }),
        );
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  async function openNftPicker(index: number) {
    setNftPickerFor(index);
    setLoadingNfts(true);
    const res = await fetch("/api/nfts");
    setLoadingNfts(false);
    if (res.ok) setOwned((await res.json()) as OwnedNft[]);
    else setOwned([]);
  }

  function pickNft(nft: OwnedNft) {
    if (nftPickerFor === null) return;
    setBlocks((prev) =>
      prev.map((b, i) => {
        if (i !== nftPickerFor) return b;
        if (b.block_type === "nft_gallery") {
          const list = [...(b.nfts ?? [])];
          if (!list.some((x) => x.contractAddress === nft.contractAddress && x.tokenId === nft.tokenId)) {
            list.push(nft);
          }
          return { ...b, nfts: list };
        }
        return { ...b, nft };
      }),
    );
    setNftPickerFor(null);
  }

  function addBlock() {
    if (addType === "nft") setBlocks((prev) => [...prev, { block_type: "nft" }]);
    else if (addType === "nft_gallery") setBlocks((prev) => [...prev, { block_type: "nft_gallery", nfts: [] }]);
    else setBlocks((prev) => [...prev, { block_type: addType, text: "", url: "" }]);
  }

  function move(i: number, dir: -1 | 1) {
    setBlocks((prev) => {
      const j = i + dir;
      if (j < 0 || j >= prev.length) return prev;
      const next = [...prev];
      [next[i], next[j]] = [next[j], next[i]];
      return next;
    });
  }

  async function save() {
    setSaving(true);
    setMsg(null);
    const payload = blocks.map((b) => {
      if (b.block_type === "text") return { block_type: b.block_type, payload: { body: b.text ?? "" } };
      if (b.block_type === "youtube") return { block_type: b.block_type, payload: { url: b.url ?? "" } };
      if (b.block_type === "nft" && b.nft) {
        return {
          block_type: "nft" as const,
          payload: {
            chain: "eth-mainnet",
            contractAddress: b.nft.contractAddress,
            tokenId: b.nft.tokenId,
            name: b.nft.name,
            image: b.nft.image,
          },
        };
      }
      if (b.block_type === "nft_gallery") {
        return {
          block_type: "nft_gallery" as const,
          payload: {
            items: (b.nfts ?? []).map((n) => ({
              chain: "eth-mainnet",
              contractAddress: n.contractAddress,
              tokenId: n.tokenId,
              name: n.name,
              image: n.image,
            })),
          },
        };
      }
      return { block_type: b.block_type, payload: { url: b.url ?? "" } };
    });
    const res = await fetch("/api/profile/blocks", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ blocks: payload }),
    });
    setSaving(false);
    if (res.ok) setMsg("MODULES SAVED");
    else {
      const body = (await res.json().catch(() => null)) as { error?: string } | null;
      setMsg((body?.error ?? "FAILED").toUpperCase());
    }
    setTimeout(() => setMsg(null), 3500);
  }

  if (loading) {
    return <div style={{ fontSize: 8, color: "#666", marginTop: 10 }}>LOADING MODULES…</div>;
  }

  return (
    <div style={{ borderTop: "1px solid #333", paddingTop: 10, marginTop: 14 }}>
      <span style={{ fontSize: 8, color: "#888", letterSpacing: 2 }}>PROFILE MODULES</span>
      <div style={{ fontSize: 6, color: "#555", marginTop: 4, letterSpacing: 0.5, lineHeight: 1.4 }}>
        SIMPLE PAGE BUILDER — TEXT, MEDIA, YOUTUBE, IFRAME, NFTS. NO RAW HTML. REORDER WITH ↑↓.
      </div>

      {blocks.map((b, i) => (
        <div key={i} style={{ border: "1px solid #333", padding: 8, marginTop: 8, background: "#0a0a0a" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontSize: 7, color: "#aaa", letterSpacing: 1 }}>{b.block_type.toUpperCase()}</span>
            <div style={{ display: "flex", gap: 4 }}>
              <button type="button" style={secondaryBtn} onClick={() => move(i, -1)}>
                ↑
              </button>
              <button type="button" style={secondaryBtn} onClick={() => move(i, 1)}>
                ↓
              </button>
              <button type="button" style={secondaryBtn} onClick={() => setBlocks((p) => p.filter((_, idx) => idx !== i))}>
                ×
              </button>
            </div>
          </div>
          {b.block_type === "text" && (
            <>
              <span style={label}>TEXT</span>
              <textarea
                style={{ ...field, height: 56, padding: 6, resize: "vertical" as const }}
                value={b.text ?? ""}
                onChange={(e) => setBlocks((prev) => prev.map((x, idx) => (idx === i ? { ...x, text: e.target.value } : x)))}
              />
            </>
          )}
          {(b.block_type === "image" || b.block_type === "gif" || b.block_type === "youtube" || b.block_type === "iframe") && (
            <>
              <span style={label}>{b.block_type === "youtube" ? "YOUTUBE URL OR ID" : "HTTPS URL"}</span>
              <input
                style={field}
                value={b.url ?? ""}
                onChange={(e) => setBlocks((prev) => prev.map((x, idx) => (idx === i ? { ...x, url: e.target.value } : x)))}
              />
            </>
          )}
          {(b.block_type === "nft" || b.block_type === "nft_gallery") && (
            <>
              <button type="button" style={{ ...secondaryBtn, marginTop: 8 }} onClick={() => openNftPicker(i)}>
                PICK FROM OWNED NFTS
              </button>
              {b.block_type === "nft" && b.nft && (
                <div style={{ fontSize: 7, color: "#aaa", marginTop: 6 }}>{b.nft.name || b.nft.tokenId}</div>
              )}
              {b.block_type === "nft_gallery" && (
                <div style={{ fontSize: 7, color: "#aaa", marginTop: 6 }}>{(b.nfts ?? []).length} NFT(S) SELECTED</div>
              )}
            </>
          )}
        </div>
      ))}

      <div style={{ display: "flex", gap: 6, marginTop: 10, alignItems: "center" }}>
        <select
          value={addType}
          onChange={(e) => setAddType(e.target.value as ProfileBlockType)}
          style={{ ...field, marginTop: 0, flex: 1, height: 22 }}
        >
          <option value="text">TEXT</option>
          <option value="image">IMAGE</option>
          <option value="gif">GIF</option>
          <option value="youtube">YOUTUBE</option>
          <option value="iframe">IFRAME</option>
          <option value="nft">NFT</option>
          <option value="nft_gallery">NFT GALLERY</option>
        </select>
        <button type="button" style={secondaryBtn} onClick={addBlock}>
          ADD MODULE
        </button>
      </div>

      <button type="button" disabled={saving} style={primaryBtn} onClick={save}>
        {saving ? "SAVING…" : "SAVE MODULES"}
      </button>
      {msg && <div style={{ fontSize: 7, color: "#888", marginTop: 6, letterSpacing: 1 }}>{msg}</div>}

      {nftPickerFor !== null && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.9)",
            zIndex: 200,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: 16,
          }}
          onClick={() => setNftPickerFor(null)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{ width: "100%", maxWidth: 340, maxHeight: "70%", overflow: "auto", border: "1px solid #555", background: "#0a0a0a", padding: 8 }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
              <span style={{ fontSize: 8, letterSpacing: 1 }}>OWNED NFTS</span>
              <button type="button" style={secondaryBtn} onClick={() => setNftPickerFor(null)}>
                ×
              </button>
            </div>
            {loadingNfts ? (
              <div style={{ fontSize: 8, color: "#666" }}>LOADING…</div>
            ) : owned.length === 0 ? (
              <div style={{ fontSize: 8, color: "#666" }}>NO NFTS (LINK WALLET + ALCHEMY KEY).</div>
            ) : (
              <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 6 }}>
                {owned.map((n) => (
                  <button
                    key={`${n.contractAddress}-${n.tokenId}`}
                    type="button"
                    onClick={() => pickNft(n)}
                    style={{ border: "1px solid #333", background: "#000", padding: 0, cursor: "pointer", aspectRatio: "1" }}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={n.image ?? undefined} alt={n.name ?? ""} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
