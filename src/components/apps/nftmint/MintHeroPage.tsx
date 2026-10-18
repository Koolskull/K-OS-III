"use client";

import React, { useCallback, useEffect, useState } from "react";
import { Interface } from "ethers";
import { getScatterMint, isMiyamakerMint } from "@/data/scatter-mints";
import { MIYAMAKER_MINI } from "@/data/sanctioned-nfts";
import {
  type ScatterCollection,
  chainInfo,
  listCap,
  priceLabel,
  scatterImage,
  shortContract,
} from "@/lib/scatter";
import { loadMintCollection, requestScatterMintPrepared } from "@/lib/mintClient";
import { listSettlement, openPayableLists, scaleListPrice, settlementLabel } from "@/lib/market/money";
import { ensureErc20Allowance, sendTx } from "@/lib/market/chain";
import {
  type MintPageOverlay,
  clampMintQty,
  getMintOverlay,
  getMintPage,
  readHeroImage,
  resetMintPage,
  saveMintPage,
  subscribeMintPages,
} from "@/lib/shop/mintPages";
import {
  SHOP_OWNER_ENS,
  connectMerchantWallet,
  isMerchant,
  merchantAddress,
} from "@/lib/shop/merchant";
import { connectEthereumProvider, ensureChain } from "@/lib/walletProviders";

const MIYA_MINT = new Interface(["function mint(uint256 _mintAmount)"]);

export function MintHeroPage({
  slug,
  onBack,
  standalone = false,
}: {
  slug: string;
  onBack?: () => void;
  onOpenSlug?: (next: string) => void;
  standalone?: boolean;
}) {
  const def = getScatterMint(slug);
  const [page, setPage] = useState(() => getMintPage(slug));
  const [col, setCol] = useState<ScatterCollection | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [msg, setMsg] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [qty, setQty] = useState(1);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState<MintPageOverlay>({});
  const [admin, setAdmin] = useState<string | null>(null);
  const [showNetwork, setShowNetwork] = useState(false);
  const [listId, setListId] = useState<string | null>(null);

  const refreshPage = useCallback(() => {
    setPage(getMintPage(slug));
  }, [slug]);

  const loadLive = useCallback(async () => {
    setErr(null);
    try {
      let minter: string | undefined;
      try {
        const accs = (await window.ethereum?.request({ method: "eth_accounts" })) as string[] | undefined;
        minter = accs?.[0];
      } catch {
        minter = undefined;
      }
      setCol(await loadMintCollection(slug, minter));
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Network error");
    }
  }, [slug]);

  useEffect(() => {
    setPage(getMintPage(slug));
    setCol(null);
    setQty(1);
    setEditing(false);
    setShowNetwork(false);
    setMsg(null);
    setErr(null);
    setAdmin(merchantAddress());
    void loadLive();
    return subscribeMintPages(refreshPage);
  }, [slug, loadLive, refreshPage]);

  const payable = col ? openPayableLists(col.lists) : [];
  const list = payable.find((L) => L.id === listId) ?? payable[0];
  const settle = list ? listSettlement(list) : null;
  const soldOut = col?.soldOut ?? false;
  const remaining = col?.remaining ?? 0;
  const cap = listCap(list);
  const maxQty = Math.max(
    1,
    Math.min(page?.maxQuantity ?? 10, remaining > 0 ? remaining : page?.maxQuantity ?? 10, cap ?? 20),
  );
  const chain = chainInfo(col?.chainId ?? page?.chainId ?? 1);
  const contract = col?.address || page?.address || "";
  const hero =
    page?.heroImage ||
    scatterImage(col?.banner || page?.bannerUrl || null, "1600x520") ||
    scatterImage(page?.avatarUrl || col?.avatar, "800x800");
  const avatar = scatterImage(col?.avatar || page?.avatarUrl || null, "72x72");

  useEffect(() => {
    setQty((q) => Math.max(1, Math.min(q, soldOut ? 1 : maxQty)));
  }, [maxQty, soldOut, slug]);

  async function openEdit() {
    setMsg(null);
    if (!isMerchant()) {
      try {
        const a = await connectMerchantWallet();
        setAdmin(a);
      } catch (e) {
        setMsg(e instanceof Error ? e.message : "Admin wallet required");
        return;
      }
    }
    setDraft(getMintOverlay(slug));
    setEditing(true);
  }

  function saveEdit() {
    try {
      saveMintPage(slug, {
        title: draft.title,
        tagline: draft.tagline,
        body: draft.body,
        heroImage: draft.heroImage,
        maxQuantity: draft.maxQuantity,
        networkLabel: draft.networkLabel,
        priceNote: draft.priceNote,
      });
      setEditing(false);
      setMsg("Page saved");
      refreshPage();
    } catch {
      setMsg("Could not save — hero image may be too large");
    }
  }

  async function mint() {
    setMsg(null);
    if (!col || soldOut) return;
    if (!list) {
      setMsg("No ETH, USDC, or CULT list is open.");
      return;
    }
    setBusy(true);
    try {
      const { address: minter, provider: eth } = await connectEthereumProvider();
      await ensureChain(eth, chain.chainId);
      const amount = Math.max(1, Math.min(qty, maxQty));
      let to = "";
      let data = "";
      let value = "0x0";
      if (isMiyamakerMint(slug)) {
        to = MIYAMAKER_MINI.address;
        data = MIYA_MINT.encodeFunctionData("mint", [amount]);
        value = "0x" + (BigInt(MIYAMAKER_MINI.mintPriceWei) * BigInt(amount)).toString(16);
      } else {
        const prepared = await requestScatterMintPrepared({
          slug,
          collectionAddress: col.address,
          chainId: col.chainId,
          minterAddress: minter,
          listId: list.id,
          quantity: amount,
        });
        for (const token of prepared.erc20s) {
          await ensureErc20Allowance(eth, minter, token.address, col.address, BigInt(token.amount));
        }
        to = prepared.tx.to;
        data = prepared.tx.data;
        value = "0x" + BigInt(prepared.tx.value || "0").toString(16);
      }
      const hash = await sendTx(eth, minter, { to, data, value: BigInt(value) });
      setMsg(`Mint submitted ${hash.slice(0, 10)}…`);
      await loadLive();
    } catch (e) {
      setMsg(e instanceof Error ? e.message : "Mint failed");
    }
    setBusy(false);
  }

  if (!def || !page) {
    return (
      <div style={root}>
        <div style={pad}>Unknown mint.</div>
      </div>
    );
  }

  const explorer = chain.explorer && contract ? `${chain.explorer}/address/${contract}` : null;
  const pct = col && col.max > 0 ? Math.min(100, (col.minted / col.max) * 100) : 0;

  return (
    <div style={root}>
      <div style={header}>
        {onBack ? (
          <button type="button" style={btn} onClick={onBack}>
            ← ALL MINTS
          </button>
        ) : standalone ? (
          <a href="/" style={navLink}>
            ← OS
          </a>
        ) : null}
        <span style={{ color: "#00ff00", letterSpacing: 2 }}>{page.title}</span>
        <span style={{ flex: 1 }} />
        <button type="button" style={btn} onClick={() => void openEdit()}>
          {admin || isMerchant() ? "EDIT PAGE" : "ADMIN EDIT"}
        </button>
        <button type="button" style={btn} onClick={() => void loadLive()}>
          REFRESH
        </button>
      </div>

      {(msg || err) && <div style={banner}>{((msg || err) ?? "").toUpperCase()}</div>}

      <div style={scroll}>
        <div style={heroWrap}>
          {hero ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={hero} alt="" style={heroImg} />
          ) : (
            <div style={{ ...heroImg, background: "#111" }} />
          )}
          <div style={heroShade}>
            <div style={heroTitle}>{page.title}</div>
            <div style={heroTag}>{page.tagline}</div>
          </div>
        </div>

        <div className="nft-mint-hero-grid" style={grid}>
          <div className="nft-mint-hero-info" style={colLeft}>
            <div style={sectionLabel}>INFO</div>
            <div style={bodyText}>{page.body}</div>
            {col?.description && col.description !== page.body && (
              <div style={{ ...dim, marginTop: 10 }}>SCATTER: {col.description}</div>
            )}
          </div>

          <div className="nft-mint-hero-mint" style={colRight}>
            <div style={mintPanel}>
              <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                {avatar && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={avatar} alt="" style={avatarImg} />
                )}
                <div>
                  <div style={panelTitle}>{page.title}</div>
                  <div style={dim}>
                    {col
                      ? `${col.minted} / ${col.max} MINTED`
                      : err
                        ? err.toUpperCase()
                        : "LOADING LIVE SUPPLY…"}
                    {col && !soldOut ? ` · ${col.remaining} LEFT` : ""}
                  </div>
                </div>
              </div>

              {col && (
                <div style={barTrack}>
                  <div style={{ ...barFill, width: `${pct}%`, background: soldOut ? "#ff5555" : "#00ff00" }} />
                </div>
              )}

              <div style={sectionLabel}>PRICE</div>
              {payable.length > 1 && (
                <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 8 }}>
                  {payable.map((L) => (
                    <button
                      key={L.id}
                      type="button"
                      style={L.id === list?.id ? chipOn : btn}
                      onClick={() => setListId(L.id)}
                    >
                      {L.name.toUpperCase()} · {settlementLabel(L)}
                    </button>
                  ))}
                </div>
              )}
              {soldOut ? (
                <div style={priceBig}>SOLD OUT</div>
              ) : list && settle ? (
                <>
                  <div style={priceBig}>{priceLabel(list)}</div>
                  <div style={dim}>
                    EACH · {list.name.toUpperCase()}
                    {qty > 1 ? ` · TOTAL ${scaleListPrice(list, qty)} ${settle}` : ""}
                  </div>
                  <div style={dim}>K-OS FEE 0. SCATTER&apos;S CUT IS TAKEN INSIDE THIS PRICE.</div>
                  {settle !== "ETH" && (
                    <div style={dim}>WALLET APPROVES {settle} FOR THIS CONTRACT, THEN MINTS.</div>
                  )}
                </>
              ) : (
                <div style={dim}>{col ? "NO ETH, USDC, OR CULT LIST OPEN" : "LOADING PRICE…"}</div>
              )}
              {page.priceNote && <div style={note}>{page.priceNote}</div>}

              <div style={sectionLabel}>AMOUNT TO MINT</div>
              {soldOut ? (
                <div style={sold}>SOLD OUT</div>
              ) : (
                <>
                  <div style={qtyRow}>
                    <button
                      type="button"
                      style={qtyBtn}
                      disabled={qty <= 1}
                      onClick={() => setQty((q) => Math.max(1, q - 1))}
                    >
                      −
                    </button>
                    <input
                      style={qtyInput}
                      type="number"
                      min={1}
                      max={maxQty}
                      value={qty}
                      onChange={(e) => {
                        const n = Math.round(Number(e.target.value) || 1);
                        setQty(Math.max(1, Math.min(maxQty, n)));
                      }}
                    />
                    <button
                      type="button"
                      style={qtyBtn}
                      disabled={qty >= maxQty}
                      onClick={() => setQty((q) => Math.min(maxQty, q + 1))}
                    >
                      +
                    </button>
                  </div>
                  <div style={dim}>
                    MAX {page.maxQuantity} PER TX
                    {col ? ` · ${remaining} LEFT ON CHAIN` : ""}
                    {cap ? ` · LIST CAP ${cap}` : ""}
                  </div>
                  <button
                    type="button"
                    style={!col || !list || busy ? mintBtnOff : mintBtn}
                    disabled={!col || !list || busy}
                    onClick={() => void mint()}
                  >
                    {busy ? "CHECK WALLET…" : !col ? "LOADING…" : `MINT ${qty > 1 ? qty + " " : ""}${settle ?? ""}`.trim()}
                  </button>
                </>
              )}

              <button type="button" style={btn} onClick={() => setShowNetwork((v) => !v)}>
                {showNetwork ? "HIDE NETWORK" : "NETWORK DETAILS"}
              </button>
              {showNetwork && (
                <div style={netBox}>
                  <NetRow k="NETWORK" v={(page.networkLabel || chain.name).toUpperCase()} />
                  <NetRow k="CHAIN ID" v={String(chain.chainId)} />
                  <NetRow k="CURRENCY" v={chain.currency} />
                  <NetRow k="CONTRACT" v={shortContract(contract)} />
                  {explorer && (
                    <a href={explorer} target="_blank" rel="noreferrer" style={link}>
                      VIEW ON ETHERSCAN
                    </a>
                  )}
                </div>
              )}

              {!isMiyamakerMint(slug) && (
                <a href={page.scatterUrl} target="_blank" rel="noreferrer" style={link}>
                  OPEN ON SCATTER
                </a>
              )}
            </div>
          </div>
        </div>

        {editing && (
          <div style={editBox}>
            <div style={sectionLabel}>EDIT THIS PAGE · {SHOP_OWNER_ENS.toUpperCase()}</div>
            <label style={field}>
              TITLE
              <input
                style={input}
                value={draft.title ?? page.title}
                onChange={(e) => setDraft((d) => ({ ...d, title: e.target.value }))}
              />
            </label>
            <label style={field}>
              TAGLINE
              <input
                style={input}
                value={draft.tagline ?? page.tagline}
                onChange={(e) => setDraft((d) => ({ ...d, tagline: e.target.value }))}
              />
            </label>
            <label style={field}>
              INFO
              <textarea
                style={{ ...input, height: 120, resize: "vertical" }}
                value={draft.body ?? page.body}
                onChange={(e) => setDraft((d) => ({ ...d, body: e.target.value }))}
              />
            </label>
            <label style={field}>
              PRICE NOTE (SHOWN UNDER LIVE SCATTER PRICE)
              <input
                style={input}
                value={draft.priceNote ?? page.priceNote}
                placeholder="e.g. PUBLIC MINT — HOLDERS CHECK SCATTER FOR FREE LISTS"
                onChange={(e) => setDraft((d) => ({ ...d, priceNote: e.target.value }))}
              />
            </label>
            <label style={field}>
              NETWORK LABEL
              <input
                style={input}
                value={draft.networkLabel ?? page.networkLabel}
                onChange={(e) => setDraft((d) => ({ ...d, networkLabel: e.target.value }))}
              />
            </label>
            <label style={field}>
              MAX AMOUNT PER TRANSACTION (1–20)
              <input
                style={input}
                type="number"
                min={1}
                max={20}
                value={draft.maxQuantity ?? page.maxQuantity}
                onChange={(e) =>
                  setDraft((d) => ({ ...d, maxQuantity: clampMintQty(Number(e.target.value), page.maxQuantity) }))
                }
              />
            </label>
            <label style={yellow}>
              REPLACE HERO IMAGE
              <input
                type="file"
                accept="image/*"
                hidden
                onChange={async (e) => {
                  const f = e.target.files?.[0];
                  e.target.value = "";
                  if (!f) return;
                  try {
                    const image = await readHeroImage(f);
                    setDraft((d) => ({ ...d, heroImage: image }));
                  } catch (er) {
                    setMsg(er instanceof Error ? er.message : "Image failed");
                  }
                }}
              />
            </label>
            {draft.heroImage && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={draft.heroImage} alt="" style={{ width: "100%", maxHeight: 120, objectFit: "cover" }} />
            )}
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              <button type="button" style={mintBtn} onClick={saveEdit}>
                SAVE PAGE
              </button>
              <button type="button" style={btn} onClick={() => setEditing(false)}>
                CANCEL
              </button>
              <button
                type="button"
                style={btn}
                onClick={() => {
                  resetMintPage(slug);
                  setEditing(false);
                  setMsg("Reset to defaults");
                  refreshPage();
                }}
              >
                RESET DEFAULTS
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function NetRow({ k, v }: { k: string; v: string }) {
  return (
    <div style={netRow}>
      <span style={dim}>{k}</span>
      <span style={{ color: "#fff" }}>{v}</span>
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
  gap: 8,
  alignItems: "center",
  padding: 8,
  borderBottom: "1px solid #333",
  fontSize: 10,
};
const dim: React.CSSProperties = { color: "#888", fontSize: 8, letterSpacing: 1 };
const banner: React.CSSProperties = {
  padding: "6px 8px",
  borderBottom: "1px solid #333",
  color: "#00ff00",
  fontSize: 8,
  letterSpacing: 1,
};
const scroll: React.CSSProperties = { flex: 1, overflow: "auto" };
const heroWrap: React.CSSProperties = { position: "relative", borderBottom: "1px solid #333" };
const heroImg: React.CSSProperties = {
  width: "100%",
  height: 148,
  objectFit: "cover",
  display: "block",
  imageRendering: "pixelated",
};
const heroShade: React.CSSProperties = {
  position: "absolute",
  left: 0,
  right: 0,
  bottom: 0,
  padding: "18px 12px 10px",
  background: "linear-gradient(transparent, #000)",
};
const heroTitle: React.CSSProperties = { fontSize: 14, color: "#00ff00", letterSpacing: 2 };
const heroTag: React.CSSProperties = { fontSize: 8, color: "#ccc", letterSpacing: 1, marginTop: 4 };
const grid: React.CSSProperties = {
  display: "flex",
  flexWrap: "wrap",
  gap: 12,
  padding: 12,
  alignItems: "start",
};
const colLeft: React.CSSProperties = { display: "flex", flexDirection: "column", gap: 8, flex: "2 1 340px", minWidth: 0, order: 2 };
const colRight: React.CSSProperties = { flex: "1 1 300px", minWidth: 0, position: "sticky", top: 0, order: 1 };
const sectionLabel: React.CSSProperties = {
  color: "#00ff00",
  fontSize: 8,
  letterSpacing: 2,
  marginTop: 8,
};
const bodyText: React.CSSProperties = { fontSize: 9, lineHeight: 1.5, color: "#ddd", whiteSpace: "pre-wrap" };
const netBox: React.CSSProperties = {
  border: "1px solid #333",
  padding: 10,
  display: "flex",
  flexDirection: "column",
  gap: 6,
  background: "#0a0a0a",
};
const netRow: React.CSSProperties = { display: "flex", justifyContent: "space-between", gap: 12, fontSize: 9 };
const mintPanel: React.CSSProperties = {
  border: "1px solid #333",
  background: "#0a0a0a",
  padding: 12,
  display: "flex",
  flexDirection: "column",
  gap: 8,
};
const panelTitle: React.CSSProperties = { fontSize: 9, color: "#00ff00", letterSpacing: 1 };
const avatarImg: React.CSSProperties = { width: 40, height: 40, objectFit: "cover", border: "1px solid #444" };
const barTrack: React.CSSProperties = { height: 8, border: "1px solid #333", background: "#111" };
const barFill: React.CSSProperties = { height: "100%" };
const priceBig: React.CSSProperties = { fontSize: 16, color: "#00ff00", letterSpacing: 1 };
const note: React.CSSProperties = { fontSize: 8, color: "#ccc", letterSpacing: 1 };
const qtyRow: React.CSSProperties = { display: "flex", gap: 6, alignItems: "center" };
const qtyBtn: React.CSSProperties = {
  width: 32,
  height: 28,
  border: "1px solid #555",
  background: "#000",
  color: "#fff",
  fontFamily: "var(--dm-font-primary)",
  fontSize: 14,
  cursor: "pointer",
};
const qtyInput: React.CSSProperties = {
  width: 64,
  height: 28,
  border: "1px solid #555",
  background: "#000",
  color: "#00ff00",
  textAlign: "center",
  fontFamily: "var(--dm-font-primary)",
  fontSize: 12,
};
const sold: React.CSSProperties = {
  border: "1px solid #ff5555",
  color: "#ff5555",
  textAlign: "center",
  padding: "12px 0",
  letterSpacing: 2,
  fontSize: 14,
};
const mintBtn: React.CSSProperties = {
  height: 32,
  border: "1px solid #00ff00",
  background: "#00ff00",
  color: "#000",
  fontFamily: "var(--dm-font-primary)",
  fontSize: 10,
  letterSpacing: 2,
  cursor: "pointer",
};
const mintBtnOff: React.CSSProperties = {
  ...mintBtn,
  background: "#222",
  border: "1px solid #555",
  color: "#888",
  cursor: "not-allowed",
};
const chipOn: React.CSSProperties = {
  height: 22,
  padding: "0 8px",
  border: "1px solid #00ff00",
  background: "#00ff00",
  color: "#000",
  fontFamily: "var(--dm-font-primary)",
  fontSize: 8,
  cursor: "pointer",
};
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
const yellow: React.CSSProperties = {
  ...btn,
  border: "1px solid #00ff00",
  color: "#000",
  background: "#00ff00",
  display: "inline-flex",
  alignItems: "center",
  width: "fit-content",
};
const input: React.CSSProperties = {
  width: "100%",
  border: "1px solid #444",
  background: "#000",
  color: "#fff",
  fontFamily: "var(--dm-font-primary)",
  fontSize: 9,
  padding: 6,
};
const field: React.CSSProperties = { display: "flex", flexDirection: "column", gap: 4, fontSize: 8, color: "#888" };
const editBox: React.CSSProperties = {
  margin: 12,
  border: "1px solid #00ff00",
  padding: 12,
  display: "flex",
  flexDirection: "column",
  gap: 10,
  background: "#0a0a0a",
};
const link: React.CSSProperties = { color: "#888", fontSize: 8, letterSpacing: 1 };
const navLink: React.CSSProperties = { ...link, textDecoration: "none", color: "#fff" };
const pad: React.CSSProperties = { padding: 12, fontSize: 10 };
