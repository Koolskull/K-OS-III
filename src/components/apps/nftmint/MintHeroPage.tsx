"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import { Interface } from "ethers";
import { ALL_MINTS, getScatterMint, isMiyamakerMint } from "@/data/scatter-mints";
import { MIYAMAKER_MINI, getSanctioned } from "@/data/sanctioned-nfts";
import { chainInfo, listCap, priceLabel, shortContract, type ScatterCollection } from "@/lib/scatter";
import { loadMintCollection, requestScatterMintPrepared } from "@/lib/mintClient";
import { listSettlement, openPayableLists, scaleListPrice } from "@/lib/market/money";
import { ensureErc20Allowance, sendTx, waitReceipt } from "@/lib/market/chain";
import { openSeaTraitCounts } from "@/lib/market/opensea";
import {
  type MintPiece,
  type PieceSort,
  type TraitCounts,
  applyRarity,
  attachQuotes,
  blankPiece,
  findTemplate,
  knownImages,
  loadPiece,
  loadRecent,
  loadSpan,
  loadWalletPieces,
  mintedIds,
  provisionalRecent,
  sortPieces,
} from "@/lib/mint/pieces";
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
import { SHOP_OWNER_ENS, connectMerchantWallet, isMerchant, merchantAddress } from "@/lib/shop/merchant";
import { connectEthereumProvider, ensureChain } from "@/lib/walletProviders";
import { PixelFireworks } from "./PixelFireworks";

const MIYA_MINT = new Interface(["function mint(uint256 _mintAmount)"]);
const SORTS: PieceSort[] = ["asset", "rarity", "price", "offer"];
const SORT_LABEL: Record<PieceSort, string> = {
  asset: "ASSET",
  rarity: "RARITY",
  price: "PRICE",
  offer: "OFFER",
};

type Stage = "piece" | "gallery";
type Gallery = "recent" | "wallet";
type Extra = "none" | "info" | "network" | "edit";
type MenuId = "main" | "gallery" | null;

export function MintHeroPage({
  slug: slugProp,
  onOpenSlug,
  standalone = false,
  initialGallery = false,
}: {
  slug: string;
  onBack?: () => void;
  onOpenSlug?: (next: string) => void;
  standalone?: boolean;
  initialGallery?: boolean;
}) {
  const [slug, setSlug] = useState(slugProp);
  const [page, setPage] = useState(() => getMintPage(slugProp));
  const [col, setCol] = useState<ScatterCollection | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [msg, setMsg] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [qty, setQty] = useState(1);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState<MintPageOverlay>({});
  const [admin, setAdmin] = useState<string | null>(null);
  const [listId, setListId] = useState<string | null>(null);
  const [nonce, setNonce] = useState(0);
  const [wide, setWide] = useState(false);
  const [mid, setMid] = useState(false);
  const [frame, setFrame] = useState<{ w: number; h: number } | null>(null);
  const [stage, setStage] = useState<Stage>(initialGallery ? "gallery" : "piece");
  const [gallery, setGallery] = useState<Gallery>(initialGallery ? "wallet" : "recent");
  const [sort, setSort] = useState<PieceSort>("asset");
  const [menu, setMenu] = useState<MenuId>(null);
  const [extra, setExtra] = useState<Extra>("none");
  const [burst, setBurst] = useState(0);
  const [preview, setPreview] = useState<MintPiece[]>([]);
  const [recent, setRecent] = useState<MintPiece[]>([]);
  const [wallet, setWallet] = useState<MintPiece[]>([]);
  const [walletNote, setWalletNote] = useState<string | null>(null);
  const [galleryReady, setGalleryReady] = useState(false);
  const [revealed, setRevealed] = useState(false);
  const [focus, setFocus] = useState<MintPiece | null>(null);
  const [templateTick, setTemplateTick] = useState(0);
  const [counts, setCounts] = useState<TraitCounts>({});

  const rootRef = useRef<HTMLDivElement>(null);
  const templateRef = useRef<{ uri: string; lastId: number } | null>(null);
  const revealedRef = useRef(false);
  const countsRef = useRef<TraitCounts>({});
  const walletRef = useRef<string | null>(null);
  const holdRef = useRef<number | null>(null);
  const wantWallet = useRef(initialGallery);
  const walletGen = useRef(0);

  const def = getScatterMint(slug);
  const stacked = !wide && !mid;

  useEffect(() => {
    setSlug(slugProp);
  }, [slugProp]);

  useEffect(() => {
    if (!initialGallery) return;
    setStage("gallery");
    setGallery("wallet");
    wantWallet.current = true;
  }, [initialGallery]);

  useEffect(() => {
    countsRef.current = counts;
  }, [counts]);

  useEffect(() => {
    const el = rootRef.current;
    if (!el) return;
    const apply = () => {
      const box = visibleLayoutBox(el);
      const next = {
        w: box.w >= 160 && box.w < box.parentW - 4 ? box.w : 0,
        h: box.h >= 160 && box.h < box.parentH - 4 ? box.h : 0,
      };
      setFrame((prev) => {
        if (prev && Math.abs(prev.w - next.w) <= 1 && Math.abs(prev.h - next.h) <= 1) return prev;
        return next;
      });
      const nextWide = (next.w || box.parentW) >= 640;
      const nextMid = !nextWide && (next.w || box.parentW) >= 460;
      setWide((v) => (v === nextWide ? v : nextWide));
      setMid((v) => (v === nextMid ? v : nextMid));
    };
    apply();
    const ro = new ResizeObserver(apply);
    ro.observe(el);
    if (el.parentElement) ro.observe(el.parentElement);
    window.addEventListener("resize", apply);
    return () => {
      ro.disconnect();
      window.removeEventListener("resize", apply);
    };
  }, []);

  useEffect(() => {
    setPage(getMintPage(slug));
    setQty(1);
    setExtra("none");
    setEditing(false);
    setMenu(null);
    setFocus(null);
    setListId(null);
    setRevealed(false);
    revealedRef.current = false;
    return subscribeMintPages(() => setPage(getMintPage(slug)));
  }, [slug]);

  useEffect(() => {
    let stop = false;
    templateRef.current = null;
    revealedRef.current = false;
    setRevealed(false);
    setErr(null);
    setPreview([]);
    setRecent([]);
    setWallet([]);
    setWalletNote(null);
    setGalleryReady(false);
    setCounts({});
    setAdmin(merchantAddress());
    void (async () => {
      let minter: string | undefined;
      try {
        const accs = (await window.ethereum?.request({ method: "eth_accounts" })) as string[] | undefined;
        minter = accs?.[0];
      } catch {
        minter = undefined;
      }
      const live = await loadMintCollection(slug, minter);
      if (stop) return;
      setCol(live);
      const lastId = live.minted;
      if (live.soldOut) {
        const known = knownImages(live.address, String(lastId));
        if (known.length) setPreview([blankPiece(String(lastId), known)]);
      } else if (lastId >= 0) {
        const id = String(lastId + 1);
        const known = knownImages(live.address, id);
        if (known.length) setPreview([blankPiece(id, known)]);
      }
      const guess = provisionalRecent(live.address, lastId, 18);
      if (guess.some((row) => row.images.length)) setRecent(guess);
      const found = await findTemplate(live.address, lastId);
      if (stop) return;
      templateRef.current = found;
      setTemplateTick((n) => n + 1);
      if (!found) {
        setGalleryReady(true);
        return;
      }
      const rec = await loadRecent(found.uri, live.address, found.lastId, 18);
      if (stop) return;
      const sea = getSanctioned(live.address)?.openseaSlug;
      let nextCounts: TraitCounts = {};
      if (sea) {
        nextCounts = await openSeaTraitCounts(sea).catch(() => ({}));
        if (stop) return;
        setCounts(nextCounts);
      }
      setRecent(applyRarity(rec, nextCounts, live.minted));
      setGalleryReady(true);
      if (sea) {
        const quoted = await attachQuotes(sea, rec);
        if (!stop) {
          setRecent((current) => mergeQuotes(current, applyRarity(quoted, nextCounts, live.minted)));
        }
      }
    })().catch((e) => {
      if (!stop) setErr(e instanceof Error ? e.message : "Network error");
    });
    return () => {
      stop = true;
    };
  }, [slug, nonce]);

  useEffect(() => {
    const found = templateRef.current;
    if (!found || !col || revealedRef.current) return;
    let stop = false;
    const run = col.soldOut
      ? loadPiece(found.uri, col.address, String(found.lastId)).then((piece) => [piece])
      : loadSpan(found.uri, col.address, found.lastId + 1, qty);
    void run.then((rows) => {
      if (!stop && rows.length) setPreview(applyRarity(rows, countsRef.current, col.minted));
    });
    return () => {
      stop = true;
    };
  }, [templateTick, qty, col, revealed]);

  useEffect(() => {
    return () => {
      if (holdRef.current) window.clearTimeout(holdRef.current);
    };
  }, []);

  const loadWallet = useCallback(async (address: string, live: ScatterCollection) => {
    const gen = walletGen.current + 1;
    walletGen.current = gen;
    setWalletNote(null);
    const result = await loadWalletPieces(address, live.address);
    if (walletGen.current !== gen) return;
    const ranked = applyRarity(result.pieces, countsRef.current, live.minted);
    setWallet(ranked);
    if (!ranked.length) setWalletNote(result.holding ? "HELD. IMAGES DID NOT LOAD." : "NONE IN THIS WALLET.");
    const sea = getSanctioned(live.address)?.openseaSlug;
    if (sea && ranked.length) {
      const quoted = await attachQuotes(sea, ranked);
      if (walletGen.current !== gen) return;
      setWallet((current) => mergeQuotes(current, quoted));
    }
  }, []);

  useEffect(() => {
    const address = walletRef.current;
    if (!address || !col || gallery !== "wallet") return;
    let stop = false;
    void loadWallet(address, col).catch(() => {
      if (!stop) setWalletNote("WALLET LOOKUP FAILED.");
    });
    return () => {
      stop = true;
    };
  }, [slug, nonce, col, gallery, loadWallet]);

  const payable = col ? openPayableLists(col.lists) : [];
  const list = payable.find((item) => item.id === listId) ?? payable[0];
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
  const hero = preview[0];
  const shown = sortPieces(gallery === "wallet" ? wallet : recent, sort);
  const tab = stacked && stage === "gallery" ? (gallery === "wallet" ? "WALLET" : "RECENT") : (def?.shortName || "MINT");

  useEffect(() => {
    setQty((q) => Math.max(1, Math.min(q, soldOut ? 1 : maxQty)));
  }, [maxQty, soldOut]);

  function chooseSlug(next: string) {
    setMenu(null);
    setStage("piece");
    setSlug(next);
    onOpenSlug?.(next);
  }

  function chooseGallery(next: Gallery) {
    setMenu(null);
    setGallery(next);
    if (stacked) setStage("gallery");
    if (next === "wallet") {
      wantWallet.current = true;
      void connectWallet();
    }
  }

  useEffect(() => {
    if (!col || !wantWallet.current || walletRef.current) return;
    wantWallet.current = false;
    void connectWallet();
    // connectWallet closes over the latest collection. Re-run only when it arrives.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [col]);

  async function connectWallet() {
    if (!col) return;
    setErr(null);
    try {
      const linked = walletRef.current
        ? { address: walletRef.current, provider: null }
        : await connectEthereumProvider();
      if (linked.provider) await ensureChain(linked.provider, 1);
      walletRef.current = linked.address;
      await loadWallet(linked.address, col);
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Wallet connect failed");
    }
  }

  async function openEdit() {
    setMenu(null);
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
    setExtra("edit");
    setStage("piece");
  }

  function saveEdit() {
    if (!page) return;
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
      setExtra("none");
      setMsg("Page saved");
      setPage(getMintPage(slug));
    } catch {
      setMsg("Could not save — hero image may be too large");
    }
  }

  function holdYours(pieces: MintPiece[]) {
    if (holdRef.current) window.clearTimeout(holdRef.current);
    revealedRef.current = true;
    setRevealed(true);
    setPreview(pieces);
    setStage("piece");
    setBurst((n) => n + 1);
    holdRef.current = window.setTimeout(() => {
      revealedRef.current = false;
      setRevealed(false);
      setNonce((n) => n + 1);
    }, 4200);
  }

  async function mint() {
    setMsg(null);
    if (!col || soldOut) return;
    if (!list) {
      setMsg("No ETH, USDC, or CULT list is open.");
      return;
    }
    setBusy(true);
    setBurst((n) => n + 1);
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
      setMsg(hash.slice(0, 10));
      const receipt = await waitReceipt(hash);
      const ids = mintedIds(receipt.logs, col.address, minter);
      const template = templateRef.current;
      if (ids.length && template) {
        const got = await Promise.all(ids.map((id) => loadPiece(template.uri, col.address, id)));
        holdYours(applyRarity(got, countsRef.current, col.minted));
      } else {
        setNonce((n) => n + 1);
      }
    } catch (e) {
      setMsg(e instanceof Error ? e.message : "Mint failed");
    }
    setBusy(false);
  }

  function cycleList() {
    if (!list || payable.length < 2) return;
    const index = payable.findIndex((item) => item.id === list.id);
    setListId(payable[(index + 1) % payable.length].id);
  }

  if (!def || !page) {
    return (
      <div style={root}>
        <div style={pad}>UNKNOWN</div>
      </div>
    );
  }

  const explorer = chain.explorer && contract ? `${chain.explorer}/address/${contract}` : null;
  const caption = revealed ? "YOURS" : soldOut ? "LAST" : "NEXT";
  const showPiece = !stacked || stage === "piece";
  const showGallery = !stacked || stage === "gallery";
  const mainGroups = stacked
    ? [collectionItems(), viewItems(), sortItems(), toolItems()]
    : [collectionItems(), toolItems()];
  const galleryGroups = [viewItems(), sortItems()];

  function collectionItems(): MenuItem[] {
    return ALL_MINTS.map((item) => ({
      id: item.slug,
      label: item.shortName,
      on: item.slug === slug && !(stacked && stage === "gallery"),
      act: () => chooseSlug(item.slug),
    }));
  }
  function viewItems(): MenuItem[] {
    return [
      { id: "recent", label: "RECENT", on: gallery === "recent" && (!stacked || stage === "gallery"), act: () => chooseGallery("recent") },
      { id: "wallet", label: "WALLET", on: gallery === "wallet" && (!stacked || stage === "gallery"), act: () => chooseGallery("wallet") },
    ];
  }
  function sortItems(): MenuItem[] {
    return SORTS.map((key) => ({
      id: key,
      label: SORT_LABEL[key],
      on: sort === key,
      act: () => {
        setSort(key);
        setMenu(null);
      },
    }));
  }
  function toolItems(): MenuItem[] {
    return [
      {
        id: "info",
        label: "INFO",
        on: extra === "info",
        act: () => {
          setExtra((v) => (v === "info" ? "none" : "info"));
          setStage("piece");
          setMenu(null);
        },
      },
      {
        id: "network",
        label: "NETWORK",
        on: extra === "network",
        act: () => {
          setExtra((v) => (v === "network" ? "none" : "network"));
          setStage("piece");
          setMenu(null);
        },
      },
      {
        id: "refresh",
        label: "REFRESH",
        on: false,
        act: () => {
          setMenu(null);
          setNonce((n) => n + 1);
        },
      },
      {
        id: "edit",
        label: admin || isMerchant() ? "EDIT" : "ADMIN",
        on: extra === "edit",
        act: () => void openEdit(),
      },
    ];
  }

  return (
    <div
      ref={rootRef}
      style={{
        ...root,
        ...(frame?.w ? { width: frame.w } : null),
        ...(frame?.h ? { height: frame.h } : null),
      }}
      onMouseDown={() => setMenu(null)}
    >
      <div style={header}>
        {standalone && (
          <a href={homeHref()} style={iconBtn}>
            ←
          </a>
        )}
        <span style={menuAnchor} onMouseDown={(e) => e.stopPropagation()}>
          <button type="button" style={tabBtn} aria-expanded={menu === "main"} onClick={() => setMenu((m) => (m === "main" ? null : "main"))}>
            {tab} ▾
          </button>
          {menu === "main" && <Menu groups={mainGroups} />}
        </span>
        {stacked && stage === "gallery" && <span style={dim}>{SORT_LABEL[sort]}</span>}
        <span style={{ flex: 1 }} />
        {(msg || err) && <span style={statusLine}>{((msg || err) ?? "").toUpperCase()}</span>}
      </div>

      <div style={showPiece && showGallery && !stacked ? (wide ? gridWide : gridMid) : { ...stackCol, justifyContent: "center" }}>
        {showPiece && (
          <div style={stacked ? previewStack : previewCol}>
            <PixelFireworks burst={burst} />
            {hero ? (
              <PieceImg piece={hero} style={heroImg} />
            ) : (
              <div style={{ ...heroImg, background: "#050505" }} />
            )}
            <div style={captionBar}>
              <span style={{ color: "#00ff00" }}>{caption}</span>
              {hero ? <span> #{hero.tokenId}</span> : null}
              {hero && hero.asset !== hero.name && hero.asset !== `#${hero.tokenId}` ? (
                <span style={dim}> {hero.asset.toUpperCase()}</span>
              ) : null}
            </div>
          </div>
        )}

        {showPiece && (
          <div style={controls}>
            {soldOut ? (
              <div style={priceBig}>SOLD OUT</div>
            ) : payable.length > 1 && list ? (
              <button type="button" style={priceBtn} onClick={cycleList}>
                {priceLabel(list)} ▾
              </button>
            ) : (
              <div style={priceBig}>{list ? priceLabel(list) : col ? "NO LIST" : "…"}</div>
            )}
            {list && settle && qty > 1 && !soldOut && (
              <div style={dim}>
                {scaleListPrice(list, qty)} {settle}
              </div>
            )}
            <div style={dim}>
              {col ? `${col.minted}/${col.max}` : "…"}
              {" · K-OS 0"}
              {settle && settle !== "ETH" ? ` · APPROVE ${settle}` : ""}
            </div>
            {col && (
              <div style={barTrack}>
                <div
                  style={{
                    ...barFill,
                    width: `${col.max > 0 ? Math.min(100, (col.minted / col.max) * 100) : 0}%`,
                    background: soldOut ? "#ff5555" : "#00ff00",
                  }}
                />
              </div>
            )}
            {page.priceNote && <div style={dim}>{page.priceNote}</div>}
            {!soldOut && (
              <div style={qtyRow}>
                <button type="button" style={qtyBtn} disabled={qty <= 1} onClick={() => setQty((q) => Math.max(1, q - 1))}>
                  −
                </button>
                <span style={qtyNum}>{qty}</span>
                <button type="button" style={qtyBtn} disabled={qty >= maxQty} onClick={() => setQty((q) => Math.min(maxQty, q + 1))}>
                  +
                </button>
              </div>
            )}
            {preview.length > 1 && (
              <div style={strip}>
                {preview.map((piece) => (
                  <button key={piece.tokenId} type="button" style={stripBtn} onClick={() => setFocus(piece)}>
                    <PieceImg piece={piece} style={stripImg} />
                  </button>
                ))}
              </div>
            )}
            {soldOut ? (
              <div style={sold}>SOLD OUT</div>
            ) : (
              <button type="button" style={!col || !list || busy ? mintBtnOff : mintBtn} disabled={!col || !list || busy} onClick={() => void mint()}>
                {busy ? "…" : "MINT"}
              </button>
            )}
            {extra === "info" && <div style={bodyText}>{page.body}</div>}
            {extra === "network" && (
              <div style={netBox}>
                <NetRow k="NETWORK" v={(page.networkLabel || chain.name).toUpperCase()} />
                <NetRow k="CHAIN" v={String(chain.chainId)} />
                <NetRow k="CONTRACT" v={shortContract(contract)} />
                {explorer && (
                  <a href={explorer} target="_blank" rel="noreferrer" style={link}>
                    ETHERSCAN
                  </a>
                )}
                {!isMiyamakerMint(slug) && (
                  <a href={page.scatterUrl} target="_blank" rel="noreferrer" style={link}>
                    SCATTER
                  </a>
                )}
              </div>
            )}
            {extra === "edit" && editing && (
              <EditBox
                pageTitle={page.title}
                pageTagline={page.tagline}
                pageBody={page.body}
                pagePriceNote={page.priceNote}
                pageNetwork={page.networkLabel}
                pageMax={page.maxQuantity}
                draft={draft}
                setDraft={setDraft}
                onSave={saveEdit}
                onCancel={() => {
                  setEditing(false);
                  setExtra("none");
                }}
                onReset={() => {
                  resetMintPage(slug);
                  setEditing(false);
                  setExtra("none");
                  setMsg("Reset to defaults");
                  setPage(getMintPage(slug));
                }}
                onImage={(image) => setDraft((d) => ({ ...d, heroImage: image }))}
                onImageErr={(text) => setMsg(text)}
              />
            )}
          </div>
        )}

        {showGallery && (
          <div style={{ ...galleryCol, gridColumn: !stacked && !wide ? "1 / -1" : undefined }}>
            {!stacked && (
              <div style={galleryHead}>
                <span style={menuAnchor} onMouseDown={(e) => e.stopPropagation()}>
                  <button
                    type="button"
                    style={tabBtn}
                    aria-expanded={menu === "gallery"}
                    onClick={() => setMenu((m) => (m === "gallery" ? null : "gallery"))}
                  >
                    {gallery === "wallet" ? "WALLET" : "RECENT"} ▾
                  </button>
                  {menu === "gallery" && <Menu groups={galleryGroups} />}
                </span>
                <span style={dim}>{SORT_LABEL[sort]}</span>
              </div>
            )}
            {gallery === "recent" && !galleryReady && shown.length === 0 && <div style={pad}>…</div>}
            {gallery === "recent" && galleryReady && shown.length === 0 && <div style={pad}>NONE</div>}
            {gallery === "wallet" && walletNote && shown.length === 0 && <div style={pad}>{walletNote}</div>}
            <div style={tileGrid}>
              {shown.map((piece) => (
                <button key={`${gallery}-${piece.tokenId}`} type="button" style={tile} onClick={() => setFocus(piece)}>
                  <PieceImg piece={piece} style={tileImg} />
                  <div style={tileMeta}>
                    <span>#{piece.tokenId}</span>
                    {piece.asset !== piece.name && piece.asset !== `#${piece.tokenId}` && (
                      <span style={dim}>{piece.asset.toUpperCase()}</span>
                    )}
                    {piece.priceLabel && <span style={{ color: "#00ff00" }}>{piece.priceLabel}</span>}
                    {piece.offerLabel && <span style={dim}>BID {piece.offerLabel}</span>}
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {focus && (
        <div style={modal} onClick={() => setFocus(null)}>
          <div style={modalCard} onClick={(e) => e.stopPropagation()}>
            <PieceImg piece={focus} style={{ width: "100%", aspectRatio: "1", objectFit: "contain", imageRendering: "pixelated", background: "#000" }} />
            <div style={{ padding: 10, display: "flex", flexDirection: "column", gap: 4 }}>
              <div style={{ color: "#00ff00" }}>#{focus.tokenId}</div>
              {focus.asset !== `#${focus.tokenId}` && <div>{focus.asset.toUpperCase()}</div>}
              {focus.priceLabel && <div style={{ color: "#00ff00" }}>{focus.priceLabel}</div>}
              {focus.offerLabel && <div style={dim}>BID {focus.offerLabel}</div>}
              {contract && (
                <a href={`https://etherscan.io/nft/${contract}/${focus.tokenId}`} target="_blank" rel="noreferrer" style={link}>
                  ETHERSCAN
                </a>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function mergeQuotes(current: MintPiece[], quoted: MintPiece[]): MintPiece[] {
  const byId = new Map(quoted.map((row) => [row.tokenId, row]));
  return current.map((row) => {
    const next = byId.get(row.tokenId);
    if (!next) return row;
    return {
      ...row,
      traits: next.traits.length ? next.traits : row.traits,
      asset: next.traits.length ? next.asset : row.asset,
      rarity: next.rarity ?? row.rarity,
      price: next.price,
      priceLabel: next.priceLabel,
      priceSymbol: next.priceSymbol,
      offer: next.offer,
      offerLabel: next.offerLabel,
      offerSymbol: next.offerSymbol,
      images: row.images.length ? row.images : next.images,
      name: next.name || row.name,
    };
  });
}

function PieceImg({ piece, style }: { piece: MintPiece; style: React.CSSProperties }) {
  const key = `${piece.tokenId}:${piece.images[0] || ""}`;
  const [stamp, setStamp] = useState(key);
  const [n, setN] = useState(0);
  if (stamp !== key) {
    setStamp(key);
    setN(0);
  }
  const src = piece.images[n];
  if (!src) return <div style={{ ...style, background: "#050505" }} />;
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={src} alt={piece.name} draggable={false} style={style} onError={() => setN((i) => i + 1)} />
  );
}

interface MenuItem {
  id: string;
  label: string;
  on: boolean;
  act: () => void;
}

function Menu({ groups }: { groups: MenuItem[][] }) {
  return (
    <div style={menuPop} onMouseDown={(e) => e.stopPropagation()}>
      {groups.map((group, index) => (
        <div key={group[0]?.id || index} style={{ display: "flex", flexDirection: "column", ...(index ? menuSplit : null) }}>
          {group.map((item) => (
            <button key={item.id} type="button" style={item.on ? menuOn : menuItem} onClick={item.act}>
              {item.label}
            </button>
          ))}
        </div>
      ))}
    </div>
  );
}

function NetRow({ k, v }: { k: string; v: string }) {
  return (
    <div style={netRow}>
      <span style={dim}>{k}</span>
      <span>{v}</span>
    </div>
  );
}

function EditBox({
  pageTitle,
  pageTagline,
  pageBody,
  pagePriceNote,
  pageNetwork,
  pageMax,
  draft,
  setDraft,
  onSave,
  onCancel,
  onReset,
  onImage,
  onImageErr,
}: {
  pageTitle: string;
  pageTagline: string;
  pageBody: string;
  pagePriceNote: string;
  pageNetwork: string;
  pageMax: number;
  draft: MintPageOverlay;
  setDraft: React.Dispatch<React.SetStateAction<MintPageOverlay>>;
  onSave: () => void;
  onCancel: () => void;
  onReset: () => void;
  onImage: (image: string) => void;
  onImageErr: (text: string) => void;
}) {
  return (
    <div style={editBox}>
      <div style={dim}>{SHOP_OWNER_ENS.toUpperCase()}</div>
      <label style={field}>
        TITLE
        <input style={input} value={draft.title ?? pageTitle} onChange={(e) => setDraft((d) => ({ ...d, title: e.target.value }))} />
      </label>
      <label style={field}>
        TAGLINE
        <input style={input} value={draft.tagline ?? pageTagline} onChange={(e) => setDraft((d) => ({ ...d, tagline: e.target.value }))} />
      </label>
      <label style={field}>
        INFO
        <textarea style={{ ...input, height: 90, resize: "vertical" }} value={draft.body ?? pageBody} onChange={(e) => setDraft((d) => ({ ...d, body: e.target.value }))} />
      </label>
      <label style={field}>
        PRICE NOTE
        <input style={input} value={draft.priceNote ?? pagePriceNote} onChange={(e) => setDraft((d) => ({ ...d, priceNote: e.target.value }))} />
      </label>
      <label style={field}>
        NETWORK
        <input style={input} value={draft.networkLabel ?? pageNetwork} onChange={(e) => setDraft((d) => ({ ...d, networkLabel: e.target.value }))} />
      </label>
      <label style={field}>
        MAX
        <input
          style={input}
          type="number"
          min={1}
          max={20}
          value={draft.maxQuantity ?? pageMax}
          onChange={(e) => setDraft((d) => ({ ...d, maxQuantity: clampMintQty(Number(e.target.value), pageMax) }))}
        />
      </label>
      <label style={fileBtn}>
        HERO
        <input
          type="file"
          accept="image/*"
          hidden
          onChange={async (e) => {
            const file = e.target.files?.[0];
            e.target.value = "";
            if (!file) return;
            try {
              onImage(await readHeroImage(file));
            } catch (er) {
              onImageErr(er instanceof Error ? er.message : "Image failed");
            }
          }}
        />
      </label>
      {draft.heroImage && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={draft.heroImage} alt="" style={{ width: "100%", maxHeight: 80, objectFit: "cover" }} />
      )}
      <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
        <button type="button" style={mintBtn} onClick={onSave}>
          SAVE
        </button>
        <button type="button" style={iconBtn} onClick={onCancel}>
          ×
        </button>
        <button type="button" style={iconBtn} onClick={onReset}>
          RESET
        </button>
      </div>
    </div>
  );
}

function zoomOf(el: Element): number {
  const raw = parseFloat(getComputedStyle(el).zoom || "1");
  return Number.isFinite(raw) && raw > 0 ? raw : 1;
}

/** Layout size of `el`'s parent that is actually on screen.
 * html and body both set zoom, and Chrome multiplies them, so a 1400px
 * desktop paints near 2× and clips. Wide/narrow follows that visible box.
 */
function visibleLayoutBox(el: HTMLElement): { w: number; h: number; parentW: number; parentH: number } {
  const base = el.parentElement ?? el;
  const parentW = base.clientWidth || window.innerWidth;
  const parentH = base.clientHeight || window.innerHeight;
  const rect = base.getBoundingClientRect();
  const rectScale = parentW > 8 ? rect.width / parentW : 1;
  const scale = zoomOf(document.documentElement) * zoomOf(document.body);
  const paint = rectScale > 1.08 ? rectScale : scale > 1.08 ? scale : 1;
  const left = rectScale > 1.08 ? rect.left / rectScale : rect.left;
  const top = rectScale > 1.08 ? rect.top / rectScale : rect.top;
  const viewW = window.innerWidth / paint;
  const viewH = window.innerHeight / paint;
  return {
    w: Math.floor(Math.min(parentW, Math.max(0, viewW - Math.max(0, left)))),
    h: Math.floor(Math.min(parentH, Math.max(0, viewH - Math.max(0, top)))),
    parentW,
    parentH,
  };
}

function homeHref(): string {
  const base = (process.env.NEXT_PUBLIC_BASE_PATH || "").replace(/\/$/, "");
  return `${base}/`;
}

const root: React.CSSProperties = {
  height: "100%",
  minHeight: 0,
  display: "flex",
  flexDirection: "column",
  background: "#000",
  color: "#fff",
  fontFamily: "var(--dm-font-primary)",
  imageRendering: "pixelated",
  position: "relative",
};
const header: React.CSSProperties = {
  display: "flex",
  gap: 8,
  alignItems: "center",
  padding: 8,
  borderBottom: "1px solid #333",
  flexShrink: 0,
};
const menuAnchor: React.CSSProperties = { position: "relative", display: "inline-flex" };
const tabBtn: React.CSSProperties = {
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
const iconBtn: React.CSSProperties = {
  height: 22,
  minWidth: 22,
  padding: "0 6px",
  border: "1px solid #555",
  background: "#000",
  color: "#fff",
  fontFamily: "var(--dm-font-primary)",
  fontSize: 10,
  cursor: "pointer",
  textDecoration: "none",
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
};
const dim: React.CSSProperties = { color: "#888", fontSize: 8, letterSpacing: 1 };
const statusLine: React.CSSProperties = {
  color: "#00ff00",
  fontSize: 8,
  letterSpacing: 1,
  maxWidth: "46%",
  overflow: "hidden",
  textOverflow: "ellipsis",
  whiteSpace: "nowrap",
};
const gridWide: React.CSSProperties = {
  flex: 1,
  minHeight: 0,
  display: "grid",
  gridTemplateColumns: "minmax(0,1.4fr) minmax(128px,0.58fr) minmax(0,0.95fr)",
};
const gridMid: React.CSSProperties = {
  flex: 1,
  minHeight: 0,
  display: "grid",
  gridTemplateColumns: "minmax(0,1.2fr) minmax(180px,0.8fr)",
  gridTemplateRows: "minmax(0,1.15fr) minmax(140px,0.8fr)",
};
const stackCol: React.CSSProperties = { flex: 1, minHeight: 0, display: "flex", flexDirection: "column" };
const previewStack: React.CSSProperties = {
  position: "relative",
  width: "100%",
  maxHeight: "68%",
  aspectRatio: "1",
  flex: "0 1 auto",
  overflow: "hidden",
};
const previewCol: React.CSSProperties = {
  minWidth: 0,
  minHeight: 0,
  position: "relative",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  borderRight: "1px solid #222",
  overflow: "hidden",
  flex: 1,
};
const heroImg: React.CSSProperties = {
  position: "absolute",
  zIndex: 1,
  left: "7%",
  top: "7%",
  width: "86%",
  height: "86%",
  objectFit: "contain",
  imageRendering: "pixelated",
  background: "transparent",
};
const captionBar: React.CSSProperties = {
  position: "absolute",
  left: 8,
  top: 8,
  zIndex: 2,
  fontSize: 8,
  letterSpacing: 1,
  color: "#fff",
  background: "#000",
  border: "1px solid #333",
  padding: "3px 6px",
};
const controls: React.CSSProperties = {
  minWidth: 0,
  minHeight: 0,
  overflow: "auto",
  padding: 10,
  display: "flex",
  flexDirection: "column",
  gap: 8,
  borderRight: "1px solid #222",
  justifyContent: "center",
};
const priceBig: React.CSSProperties = { fontSize: 13, color: "#00ff00", letterSpacing: 1, lineHeight: 1.2, whiteSpace: "nowrap" };
const priceBtn: React.CSSProperties = {
  ...priceBig,
  border: "none",
  background: "transparent",
  fontFamily: "var(--dm-font-primary)",
  cursor: "pointer",
  textAlign: "left",
  padding: 0,
};
const barTrack: React.CSSProperties = { height: 6, border: "1px solid #333", background: "#111" };
const barFill: React.CSSProperties = { height: "100%" };
const qtyRow: React.CSSProperties = { display: "flex", gap: 6, alignItems: "center" };
const qtyBtn: React.CSSProperties = {
  width: 28,
  height: 28,
  border: "1px solid #555",
  background: "#000",
  color: "#fff",
  fontFamily: "var(--dm-font-primary)",
  fontSize: 14,
  cursor: "pointer",
};
const qtyNum: React.CSSProperties = { color: "#00ff00", minWidth: 24, textAlign: "center", fontSize: 12 };
const strip: React.CSSProperties = { display: "flex", gap: 4, overflow: "auto" };
const stripBtn: React.CSSProperties = { border: "1px solid #333", background: "#000", padding: 0, cursor: "pointer" };
const stripImg: React.CSSProperties = { width: 36, height: 36, objectFit: "contain", imageRendering: "pixelated", display: "block" };
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
const mintBtnOff: React.CSSProperties = { ...mintBtn, background: "#222", border: "1px solid #555", color: "#888", cursor: "not-allowed" };
const sold: React.CSSProperties = { border: "1px solid #ff5555", color: "#ff5555", textAlign: "center", padding: "10px 0", letterSpacing: 2, fontSize: 12 };
const bodyText: React.CSSProperties = { fontSize: 9, lineHeight: 1.5, color: "#ddd", whiteSpace: "pre-wrap" };
const netBox: React.CSSProperties = { border: "1px solid #333", padding: 8, display: "flex", flexDirection: "column", gap: 6 };
const netRow: React.CSSProperties = { display: "flex", justifyContent: "space-between", gap: 8, fontSize: 9 };
const link: React.CSSProperties = { color: "#888", fontSize: 8, letterSpacing: 1 };
const galleryCol: React.CSSProperties = { minWidth: 0, minHeight: 0, overflow: "auto", display: "flex", flexDirection: "column" };
const galleryHead: React.CSSProperties = {
  display: "flex",
  gap: 8,
  alignItems: "center",
  padding: 8,
  borderBottom: "1px solid #222",
  position: "sticky",
  top: 0,
  background: "#000",
  zIndex: 2,
};
const tileGrid: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fill, minmax(72px, 1fr))",
  gap: 8,
  padding: 8,
  alignContent: "start",
};
const tile: React.CSSProperties = {
  border: "1px solid #333",
  background: "#000",
  padding: 0,
  color: "inherit",
  cursor: "pointer",
  textAlign: "left",
  fontFamily: "var(--dm-font-primary)",
};
const tileImg: React.CSSProperties = {
  width: "100%",
  aspectRatio: "1",
  objectFit: "contain",
  imageRendering: "pixelated",
  display: "block",
  background: "#050505",
};
const tileMeta: React.CSSProperties = { padding: 6, display: "flex", flexDirection: "column", gap: 2, fontSize: 8 };
const menuPop: React.CSSProperties = {
  position: "absolute",
  top: "100%",
  left: 0,
  zIndex: 30,
  marginTop: 4,
  minWidth: 148,
  background: "#000",
  border: "1px solid #00ff00",
  padding: 4,
  display: "flex",
  flexDirection: "column",
};
const menuSplit: React.CSSProperties = { borderTop: "1px solid #333", marginTop: 4, paddingTop: 4 };
const menuItem: React.CSSProperties = {
  display: "block",
  width: "100%",
  height: 22,
  border: "none",
  background: "transparent",
  color: "#fff",
  fontFamily: "var(--dm-font-primary)",
  fontSize: 8,
  letterSpacing: 1,
  textAlign: "left",
  cursor: "pointer",
  padding: "0 8px",
};
const menuOn: React.CSSProperties = { ...menuItem, color: "#00ff00" };
const pad: React.CSSProperties = { padding: 12, fontSize: 8, color: "#888", letterSpacing: 1 };
const modal: React.CSSProperties = {
  position: "absolute",
  inset: 0,
  background: "rgba(0,0,0,0.82)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  zIndex: 40,
  padding: 16,
};
const modalCard: React.CSSProperties = {
  width: "min(420px, 100%)",
  maxHeight: "100%",
  overflow: "auto",
  background: "#000",
  border: "1px solid #00ff00",
};
const editBox: React.CSSProperties = { display: "flex", flexDirection: "column", gap: 8, borderTop: "1px solid #333", paddingTop: 8 };
const field: React.CSSProperties = { display: "flex", flexDirection: "column", gap: 4, fontSize: 8, color: "#888" };
const input: React.CSSProperties = {
  width: "100%",
  border: "1px solid #444",
  background: "#000",
  color: "#fff",
  fontFamily: "var(--dm-font-primary)",
  fontSize: 9,
  padding: 6,
};
const fileBtn: React.CSSProperties = {
  ...mintBtn,
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  width: "fit-content",
  padding: "0 8px",
};
