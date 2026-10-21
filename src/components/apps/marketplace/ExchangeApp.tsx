"use client";

import React, { useEffect, useRef, useState } from "react";
import { getAddress } from "ethers";
import { floorCollections, isWideArt } from "@/data/sanctioned-nfts";
import { CURRENCIES, SEAPORT_16, type CurrencyId, atomicCurrency, currencyById } from "@/data/market";
import { parsePrice, payAddressOk } from "@/lib/market/money";
import { MintHeroPage } from "@/components/apps/nftmint/MintHeroPage";
import { cachedListings, dropListing, forgetPending, rememberPending, syncBook } from "@/lib/market/book";
import {
  approveCollectionTx,
  approvedForAll,
  attestTx,
  cancelTx,
  ensureErc20Allowance,
  erc20Balance,
  erc20Consideration,
  ethBalance,
  fulfillTx,
  nativeConsideration,
  orderFilledOrCancelled,
  ownerOf,
  readCounter,
  registerSchemaTx,
  revokeTx,
  schemaReady,
  sendTx,
  signSeaport,
  buildSeaportOrder,
  transferErc20Tx,
  transferNftTx,
  waitReceipt,
} from "@/lib/market/chain";
import { type FloorListing, type KOrder, parseKOrder } from "@/lib/market/orders";
import { compareAsks, groupByCollection } from "@/lib/market/saleOrder";
import {
  openSeaAsk,
  openSeaGallery,
  openSeaNfts,
  mergeSaleTiles,
  openSeaSales,
  saleTileFromBook,
  withSaleImages,
  type CatalogNft,
  type SaleTile,
} from "@/lib/market/opensea";
import {
  connectEthereumProvider,
  discoverEip6963Wallets,
  ensureChain,
  type Eip1193Provider,
  type Eip6963Detail,
} from "@/lib/walletProviders";
import { shortAddr } from "@/lib/shop/merchant";
import { visibleLayoutBox } from "@/lib/os/visibleBox";
import { FullscreenButton } from "@/components/ui/MediaStage";
import { wideStill } from "@/lib/mediaKind";

type Pane = "floor" | "mint" | "sell" | "bag" | "art";

export function ExchangeApp({ onOpenShop }: { onOpenShop: () => void }) {
  const [pane, setPane] = useState<Pane>("floor");
  const [acct, setAcct] = useState<string | null>(null);
  const [provider, setProvider] = useState<Eip1193Provider | null>(null);
  const [wallets, setWallets] = useState<Eip6963Detail[]>([]);
  const [rows, setRows] = useState<FloorListing[]>([]);
  const [sea, setSea] = useState<FloorListing[]>([]);
  const [gallery, setGallery] = useState<CatalogNft[]>([]);
  const [galleryNext, setGalleryNext] = useState<string | null>(null);
  const [sale, setSale] = useState<SaleTile[]>([]);
  const [saleNext, setSaleNext] = useState<Record<string, string | null>>({});
  const [saleReady, setSaleReady] = useState(false);
  const [stock, setStock] = useState<"sale" | "browse">("sale");
  const [browseReady, setBrowseReady] = useState(false);
  const [reload, setReload] = useState(0);
  const [colFilter, setColFilter] = useState("all");
  const [view, setView] = useState<CatalogNft | null>(null);
  const [viewAsk, setViewAsk] = useState<FloorListing | null>(null);
  const [viewBusy, setViewBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [bad, setBad] = useState(false);
  const [busy, setBusy] = useState(false);
  const [paste, setPaste] = useState("");

  const [sellCol, setSellCol] = useState(floorCollections().find((c) => c.id === "mialien-eth")?.address ?? floorCollections()[0].address);
  const [tokenId, setTokenId] = useState("");
  const [currency, setCurrency] = useState<CurrencyId>("CULT");
  const [price, setPrice] = useState("");
  const [payTo, setPayTo] = useState("");
  const [artTitle, setArtTitle] = useState("");
  const [artUrl, setArtUrl] = useState("");
  const [buyer, setBuyer] = useState("");
  const [wide, setWide] = useState(false);
  const [frame, setFrame] = useState<{ w: number; h: number } | null>(null);
  const rootRef = useRef<HTMLDivElement>(null);

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
      const fitted = next.w || box.parentW;
      setWide((v) => {
        const nextWide = fitted >= 640;
        return v === nextWide ? v : nextWide;
      });
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

  useEffect(() => discoverEip6963Wallets((w) => {
    setWallets((prev) => (prev.some((x) => x.info.uuid === w.info.uuid) ? prev : [...prev, w]));
  }), []);

  useEffect(() => {
    let stop = false;
    setSaleReady(false);
    setRows(cachedListings());
    void (async () => {
      const [bookResult, saleResult] = await Promise.allSettled([syncBook(), openSeaSales(colFilter, null)]);
      if (stop) return;
      const bookRows = bookResult.status === "fulfilled" ? bookResult.value : cachedListings();
      if (bookResult.status === "fulfilled") setRows(bookRows);
      if (saleResult.status === "fulfilled") {
        const local = bookRows.map(saleTileFromBook).filter((row): row is SaleTile => Boolean(row));
        const merged = mergeShown(saleResult.value.tiles, local, colFilter);
        const pictured = await withSaleImages(merged);
        if (stop) return;
        setSale(pictured);
        setSea(merged.map((tile) => tile.listing));
        setSaleNext(saleResult.value.next);
      } else {
        setSale([]);
        setSaleNext({});
        setBad(true);
        setMsg(saleResult.reason instanceof Error ? saleResult.reason.message : "Listings unavailable");
      }
      setSaleReady(true);
    })();
    return () => {
      stop = true;
    };
  }, [colFilter, reload]);

  useEffect(() => {
    if (stock !== "browse") return;
    let stop = false;
    setBrowseReady(false);
    void (async () => {
      try {
        const page = await openSeaGallery(colFilter, null);
        if (stop) return;
        setGallery(page.nfts);
        setGalleryNext(page.next);
      } catch (e) {
        if (stop) return;
        setBad(true);
        setMsg(e instanceof Error ? e.message : "Collection unavailable");
      }
      if (!stop) setBrowseReady(true);
    })();
    return () => {
      stop = true;
    };
  }, [colFilter, reload, stock]);

  function mergeShown(prev: SaleTile[], extra: SaleTile[], filter: string): SaleTile[] {
    const picked = extra.filter((tile) => filter === "all" || tile.nft.collectionId === filter);
    return mergeSaleTiles(prev, picked);
  }

  function matchListing(nft: CatalogNft): FloorListing | null {
    return [...sea, ...rows].find((row) => {
      const token = row.order.nft;
      if (!token) return false;
      if (token.contract.toLowerCase() !== nft.contract.toLowerCase()) return false;
      if (token.tokenId === nft.tokenId) return true;
      if (!/^\d+$/.test(token.tokenId) || !/^\d+$/.test(nft.tokenId)) return false;
      return BigInt(token.tokenId) === BigInt(nft.tokenId);
    }) ?? null;
  }

  async function openItem(nft: CatalogNft) {
    setView(nft);
    const known = matchListing(nft);
    setViewAsk(known);
    if (known) return;
    setViewBusy(true);
    try {
      const ask = await openSeaAsk(nft.slug, nft.tokenId, nft.collectionName);
      setViewAsk(ask);
      if (ask) setSea((prev) => (prev.some((row) => row.id === ask.id) ? prev : [...prev, ask]));
    } catch (e) {
      setBad(true);
      setMsg(e instanceof Error ? e.message : "OpenSea listing unavailable");
    }
    setViewBusy(false);
  }

  async function more() {
    if (!galleryNext || colFilter === "all") return;
    setBusy(true);
    setBad(false);
    try {
      const page = await openSeaNfts(colFilter, galleryNext);
      setGallery((prev) => {
        const seen = new Set(prev.map((nft) => nft.id));
        return [...prev, ...page.nfts.filter((nft) => !seen.has(nft.id))];
      });
      setGalleryNext(page.next);
    } catch (e) {
      setBad(true);
      setMsg(e instanceof Error ? e.message : "Collection unavailable");
    }
    setBusy(false);
  }

  async function moreSales() {
    if (!Object.values(saleNext).some(Boolean)) return;
    setBusy(true);
    setBad(false);
    try {
      const page = await openSeaSales(colFilter, saleNext);
      const shown = await withSaleImages(page.tiles);
      setSale((prev) => mergeShown(prev, shown, colFilter));
      setSea((prev) => {
        const seen = new Set(prev.map((row) => row.id));
        return [...prev, ...shown.map((tile) => tile.listing).filter((row) => !seen.has(row.id))];
      });
      setSaleNext((prev) => ({ ...prev, ...page.next }));
    } catch (e) {
      setBad(true);
      setMsg(e instanceof Error ? e.message : "Listings unavailable");
    }
    setBusy(false);
  }

  async function connect(p?: Eip1193Provider) {
    setMsg(null);
    const linked = p ? { provider: p, address: "" } : await connectEthereumProvider();
    const eth = linked.provider;
    await ensureChain(eth, 1);
    const accounts = (await eth.request({ method: "eth_requestAccounts" })) as string[];
    if (!accounts[0]) throw new Error("Wallet returned no account.");
    setProvider(eth);
    setAcct(getAddress(accounts[0]));
  }

  async function need(): Promise<{ eth: Eip1193Provider; address: string }> {
    if (provider && acct) {
      await ensureChain(provider, 1);
      return { eth: provider, address: acct };
    }
    const linked = await connectEthereumProvider();
    await ensureChain(linked.provider, 1);
    setProvider(linked.provider);
    setAcct(getAddress(linked.address));
    return { eth: linked.provider, address: getAddress(linked.address) };
  }

  async function run(work: () => Promise<void>) {
    setBusy(true);
    setBad(false);
    setMsg(null);
    try {
      await work();
    } catch (e) {
      setBad(true);
      setMsg(e instanceof Error ? e.message : "Failed");
    }
    setBusy(false);
  }

  const floorOrder = floorCollections().map((c) => c.id);
  const saleGroups = groupByCollection(
    sale.map((tile) => ({
      tile,
      collectionId: tile.nft.collectionId,
      currency: tile.listing.paySymbol || tile.listing.order.currency,
      raw: tile.listing.order.raw,
    })),
    floorOrder,
    compareAsks,
  );
  const saleHasMore = Object.values(saleNext).some(Boolean);

  const pasteForm = (
    <div>
      <div style={dim}>PASTE A SIGNED ORDER</div>
      <textarea value={paste} onChange={(e) => setPaste(e.target.value)} style={area} />
      <button type="button" style={btn} onClick={addOrder}>ADD ORDER</button>
    </div>
  );

  return (
    <div
      ref={rootRef}
      style={{
        ...root,
        ...(frame?.w ? { width: frame.w } : null),
        ...(frame?.h ? { height: frame.h } : null),
      }}
    >
      <div style={{ ...header, flexWrap: wide ? "nowrap" : "wrap", overflowX: wide ? "auto" : "visible" }}>
        {(["floor", "mint", "sell", "bag", "art"] as Pane[]).map((id) => (
          <button key={id} type="button" style={pane === id ? on : btn} onClick={() => setPane(id)}>
            {id.toUpperCase()}
          </button>
        ))}
        <button type="button" style={btn} onClick={onOpenShop}>SHOP</button>
        <span style={{ flex: 1 }} />
        {!acct && wallets.map((w) => (
          <button key={w.info.uuid} type="button" style={btn} onClick={() => void connect(w.provider).catch((e) => { setBad(true); setMsg(e instanceof Error ? e.message : "Connect failed"); })}>
            {w.info.name.toUpperCase()}
          </button>
        ))}
        {acct ? (
          <button type="button" style={btn} onClick={() => { setAcct(null); setProvider(null); }}>
            {shortAddr(acct)}
          </button>
        ) : (
          <button type="button" style={yellow} onClick={() => void connect().catch((e) => { setBad(true); setMsg(e instanceof Error ? e.message : "Connect failed"); })}>
            CONNECT
          </button>
        )}
      </div>
      {msg && <div style={bad ? error : status}>{msg}</div>}

      {pane === "floor" && (
        <div style={wide ? columns : scroll}>
          <div style={wide ? rail : chipRow}>
            <Chip block={wide} on={colFilter === "all"} label="ALL" click={() => { setColFilter("all"); setStock("sale"); setView(null); }} />
            {floorCollections().map((c) => (
              <Chip block={wide} key={c.id} on={colFilter === c.id} label={railName(c.id, c.name)} click={() => { setColFilter(c.id); setStock("sale"); setView(null); }} />
            ))}
            <button type="button" style={wide ? railBtn : btn} disabled={busy} onClick={() => setReload((n) => n + 1)}>REFRESH</button>
          </div>
          <div style={wide ? galleryPane : undefined}>
            {!wide && view && (
              <div>
                <div style={{ padding: "0 12px" }}>
                  <button type="button" style={btn} onClick={() => { setView(null); setViewAsk(null); }}>BACK</button>
                </div>
                {viewBusy && <div style={pad}>READING LISTING…</div>}
                {!viewBusy && viewAsk && (
                  <Detail
                    row={viewAsk}
                    image={view.image}
                    full={view.full}
                    animation={view.animation}
                    title={view.name}
                    wide={isWideArt(view.collectionId)}
                    mine={acct?.toLowerCase() === viewAsk.order.offerer.toLowerCase()}
                    busy={busy}
                    buyer={buyer}
                    setBuyer={setBuyer}
                    onBuy={() => void run(() => buy(viewAsk))}
                    onCancel={() => void run(() => cancel(viewAsk))}
                    onSend={() => void run(() => sendNft(viewAsk))}
                  />
                )}
                {!viewBusy && !viewAsk && <Quiet nft={view} />}
              </div>
            )}
            {stock === "sale" && !saleReady && <div style={pad}>READING LISTINGS…</div>}
            {stock === "sale" && saleReady && sale.length === 0 && !bad && <div style={pad}>NOTHING LISTED IN THIS WINDOW.</div>}
            {stock === "sale" && saleReady && saleGroups.map((group) => {
              const col = floorCollections().find((item) => item.id === group.collectionId);
              const banner = isWideArt(group.collectionId);
              return (
                <div key={group.collectionId || "other"}>
                  {colFilter === "all" && col && <div style={section}>{railName(col.id, col.name)}</div>}
                  <div style={banner ? bannerGrid : grid}>
                    {group.tiles.map(({ tile: ask }) => {
                      const nft = ask.nft;
                      const selected = viewAsk?.id === ask.listing.id;
                      return (
                        <NftTile
                          key={ask.listing.id}
                          nft={nft}
                          banner={banner}
                          selected={selected}
                          price={ask.listing.price}
                          priceColor="#00ff00"
                          onOpen={() => { setView(nft); setViewAsk(ask.listing); setViewBusy(false); }}
                        />
                      );
                    })}
                  </div>
                </div>
              );
            })}
            {stock === "browse" && !browseReady && <div style={pad}>READING COLLECTION…</div>}
            {stock === "browse" && browseReady && gallery.length === 0 && <div style={pad}>NO TOKENS IN THIS WINDOW.</div>}
            {stock === "browse" && (
              <div style={colFilter === "bannerz-by-koolskull" ? bannerGrid : grid}>
                {gallery.map((nft) => {
                  const ask = matchListing(nft);
                  const banner = isWideArt(nft.collectionId);
                  const selected = view?.id === nft.id;
                  return (
                    <NftTile
                      key={nft.id}
                      nft={nft}
                      banner={banner}
                      selected={selected}
                      price={ask ? ask.price : "NOT LISTED"}
                      priceColor={ask ? "#00ff00" : "#888"}
                      gridColumn={banner && colFilter !== "bannerz-by-koolskull" ? "1 / -1" : undefined}
                      onOpen={() => void openItem(nft)}
                    />
                  );
                })}
              </div>
            )}
            <div style={{ ...pad, display: "flex", gap: 8, flexWrap: "wrap" }}>
              {stock === "sale" && saleHasMore && (
                <button type="button" style={btn} disabled={busy} onClick={() => void moreSales()}>MORE</button>
              )}
              {stock === "browse" && colFilter !== "all" && galleryNext && (
                <button type="button" style={btn} disabled={busy} onClick={() => void more()}>MORE</button>
              )}
              {stock === "sale" && (
                <button type="button" style={btn} onClick={() => setStock("browse")}>BROWSE</button>
              )}
              {stock === "browse" && (
                <button type="button" style={btn} onClick={() => setStock("sale")}>FOR SALE</button>
              )}
            </div>
            {!wide && <div style={pad}>{pasteForm}</div>}
          </div>
          {wide && (
            <div style={side}>
              {!view && <div style={dim}>SELECT A PIECE</div>}
              {view && (
                <button type="button" style={{ ...btn, alignSelf: "flex-start" }} onClick={() => { setView(null); setViewAsk(null); }}>
                  BACK
                </button>
              )}
              {view && viewBusy && <div style={dim}>READING LISTING…</div>}
              {view && !viewBusy && viewAsk && (
                <Detail
                  row={viewAsk}
                  image={view.image}
                  full={view.full}
                  animation={view.animation}
                  title={view.name}
                  wide={isWideArt(view.collectionId)}
                  mine={acct?.toLowerCase() === viewAsk.order.offerer.toLowerCase()}
                  busy={busy}
                  buyer={buyer}
                  setBuyer={setBuyer}
                  onBuy={() => void run(() => buy(viewAsk))}
                  onCancel={() => void run(() => cancel(viewAsk))}
                  onSend={() => void run(() => sendNft(viewAsk))}
                />
              )}
              {view && !viewBusy && !viewAsk && <Quiet nft={view} />}
              {pasteForm}
            </div>
          )}
        </div>
      )}

      {pane === "mint" && (
        <div style={{ flex: 1, minHeight: 0, overflow: "hidden", display: "flex", flexDirection: "column" }}>
          <MintHeroPage slug="mialien-eth" />
        </div>
      )}

      {pane === "sell" && (
        <div style={wide ? columns : pad}>
          <div style={wide ? rail : chipRow}>
            {floorCollections().map((c) => (
              <Chip block={wide} key={c.id} on={sellCol.toLowerCase() === c.address.toLowerCase()} label={railName(c.id, c.name)} click={() => setSellCol(c.address)} />
            ))}
          </div>
          <div style={wide ? formPane : undefined}>
            {!wide && (
              <div style={dim}>
                LIST A TOKEN YOU HOLD. ETH, USDC, AND CULT USE SEAPORT. BTC AND XMR STAY IN YOUR WALLET UNTIL YOU TRANSFER THE NFT.
              </div>
            )}
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              <input value={tokenId} onChange={(e) => setTokenId(e.target.value.replace(/\D/g, ""))} placeholder="TOKEN ID" style={input} />
              <input value={price} onChange={(e) => setPrice(e.target.value)} placeholder="PRICE" style={input} />
            </div>
            <div style={chipRow}>
              {CURRENCIES.map((c) => (
                <Chip key={c.id} on={currency === c.id} label={c.id} click={() => setCurrency(c.id)} />
              ))}
            </div>
            {(currency === "BTC" || currency === "XMR") && (
              <input value={payTo} onChange={(e) => setPayTo(e.target.value.trim())} placeholder={`${currency} ADDRESS`} style={{ ...input, width: "100%", marginTop: 8 }} />
            )}
            {!wide && (
              <Fee
                lines={[
                  ["K-OS FEE", "0"],
                  ["PROTOCOL FEE", "0"],
                  ["SELLER RECEIVES", "THE FULL PRICE"],
                  ["LISTING", "30 DAYS · GAS IS ETH"],
                ]}
              />
            )}
            <button type="button" style={{ ...yellow, marginTop: 8 }} disabled={busy} onClick={() => void run(() => listToken(false))}>
              {busy ? "CHECK WALLET…" : "LIST"}
            </button>
          </div>
          {wide && (
            <div style={side}>
              <div style={dim}>
                ETH, USDC, AND CULT USE SEAPORT. BTC AND XMR STAY IN YOUR WALLET UNTIL YOU TRANSFER THE NFT. EACH STEP IS ITS OWN CONFIRM.
              </div>
              <Fee
                lines={[
                  ["K-OS FEE", "0"],
                  ["PROTOCOL FEE", "0"],
                  ["SELLER RECEIVES", "THE FULL PRICE"],
                  ["LISTING", "30 DAYS · GAS IS ETH"],
                ]}
              />
            </div>
          )}
        </div>
      )}

      {pane === "art" && (
        <div style={wide ? pair : pad}>
          <div style={wide ? formPane : undefined}>
            <input value={artTitle} onChange={(e) => setArtTitle(e.target.value)} placeholder="TITLE" style={{ ...input, width: "100%" }} />
            <input value={artUrl} onChange={(e) => setArtUrl(e.target.value)} placeholder="HTTPS OR IPFS URL" style={{ ...input, width: "100%", marginTop: 8 }} />
            {!wide && <input value={price} onChange={(e) => setPrice(e.target.value)} placeholder="PRICE" style={{ ...input, marginTop: 8 }} />}
            {!wide && (
              <div style={chipRow}>
                {CURRENCIES.map((c) => (
                  <Chip key={c.id} on={currency === c.id} label={c.id} click={() => setCurrency(c.id)} />
                ))}
              </div>
            )}
          </div>
          <div style={wide ? side : undefined}>
            {wide && <input value={price} onChange={(e) => setPrice(e.target.value)} placeholder="PRICE" style={input} />}
            {wide && (
              <div style={{ ...chipRow, flexDirection: "column", alignItems: "stretch" }}>
                {CURRENCIES.map((c) => (
                  <Chip key={c.id} on={currency === c.id} label={c.id} click={() => setCurrency(c.id)} />
                ))}
              </div>
            )}
            {(currency === "BTC" || currency === "XMR") && (
              <input value={payTo} onChange={(e) => setPayTo(e.target.value.trim())} placeholder={`${currency} ADDRESS`} style={{ ...input, width: "100%" }} />
            )}
            <div style={dim}>ART PAYMENTS GO STRAIGHT TO THE SELLER. THE FILE STAYS AT THE HTTPS OR IPFS URL.</div>
            <button type="button" style={{ ...yellow, marginTop: 8 }} disabled={busy} onClick={() => void run(() => listToken(true))}>
              {busy ? "CHECK WALLET…" : "LIST ART"}
            </button>
          </div>
        </div>
      )}

      {pane === "bag" && (
        <div style={wide ? bagColumns : pad}>
          <div style={wide ? galleryPane : undefined}>
            {rows.filter((row) => acct && row.order.offerer.toLowerCase() === acct.toLowerCase()).map((row) => (
              <div key={row.id} style={rowBtn}>
                <div style={{ flex: 1 }}>{row.collectionName.toUpperCase()} · {row.price}</div>
                <button type="button" style={btn} disabled={busy} onClick={() => void run(() => cancel(row))}>CANCEL</button>
              </div>
            ))}
            {acct && rows.every((row) => row.order.offerer.toLowerCase() !== acct.toLowerCase()) && <div style={{ ...dim, padding: 12 }}>NONE YET.</div>}
            {!acct && <div style={{ ...dim, padding: 12 }}>CONNECT A WALLET.</div>}
          </div>
          {wide && (
            <div style={side}>
              <div style={dim}>YOUR OPEN LISTINGS ON THIS MACHINE AND IN THE BOOK.</div>
            </div>
          )}
          {!wide && <div style={dim}>YOUR OPEN LISTINGS ON THIS MACHINE AND IN THE BOOK.</div>}
        </div>
      )}
    </div>
  );

  function addOrder() {
    const text = paste.trim();
    if (!text) {
      setBad(true);
      setMsg("Paste a signed order first.");
      return;
    }
    let parsed: unknown;
    try {
      parsed = JSON.parse(text);
    } catch {
      setBad(true);
      setMsg("That paste is not a signed order.");
      return;
    }
    const order = parseKOrder(parsed);
    if (!order) {
      setBad(true);
      setMsg("Order rejected.");
      return;
    }
    rememberPending(order);
    setRows(cachedListings());
    setPaste("");
    setBad(false);
    setMsg("Order added on this machine.");
  }

  async function post(order: KOrder, recipient: string) {
    const { eth, address } = await need();
    if (!(await schemaReady())) {
      setMsg("OPEN THE BOOK. ONE CONFIRM.");
      const opened = await sendTx(eth, address, registerSchemaTx());
      await waitReceipt(opened);
    }
    setMsg("POST THE LISTING.");
    rememberPending(order);
    const hash = await sendTx(eth, address, attestTx(order, recipient));
    await waitReceipt(hash);
    setRows(await syncBook());
    setMsg(`Listed ${hash.slice(0, 10)}…`);
  }

  async function listToken(art: boolean) {
    const { eth, address } = await need();
    const raw = parsePrice(currency, price);
    if (art) {
      const order: KOrder = {
        v: 1,
        kind: "invoice",
        currency,
        offerer: address,
        raw,
        art: { title: artTitle.trim(), image: artUrl.trim() },
        payTo: currency === "BTC" || currency === "XMR" ? payTo : address,
      };
      if (!parseKOrder(order)) throw new Error("Use a title and an https or ipfs URL.");
      if ((currency === "BTC" || currency === "XMR") && !payAddressOk(currency, payTo)) {
        throw new Error(`Enter a ${currency} address.`);
      }
      await post(order, address);
      return;
    }
    if (!/^\d+$/.test(tokenId)) throw new Error("Enter a token id.");
    const owner = await ownerOf(sellCol, tokenId);
    if (!owner || owner.toLowerCase() !== address.toLowerCase()) throw new Error("That token is not in this wallet.");
    if (currency === "BTC" || currency === "XMR") {
      if (!payAddressOk(currency, payTo)) throw new Error(`Enter a ${currency} address.`);
      const order: KOrder = {
        v: 1,
        kind: "invoice",
        currency,
        offerer: address,
        raw,
        payTo,
        nft: { contract: getAddress(sellCol), tokenId },
      };
      if (!parseKOrder(order)) throw new Error("Listing rejected.");
      await post(order, getAddress(sellCol));
      return;
    }
    if (!(await approvedForAll(sellCol, address))) {
      setMsg("APPROVE SEAPORT FOR THIS WHOLE COLLECTION.");
      const approved = await sendTx(eth, address, approveCollectionTx(sellCol));
      await waitReceipt(approved);
    }
    setMsg("SIGN THE ORDER.");
    const counter = await readCounter(address);
    const parameters = buildSeaportOrder({
      offerer: address,
      contract: sellCol,
      tokenId,
      currency,
      raw,
      counter,
    });
    const signature = await signSeaport(eth, parameters);
    const order: KOrder = {
      v: 1,
      kind: "seaport",
      currency,
      offerer: address,
      raw,
      nft: { contract: getAddress(sellCol), tokenId: BigInt(tokenId).toString() },
      seaport: { parameters, signature },
    };
    if (!parseKOrder(order)) throw new Error("Listing rejected.");
    await post(order, getAddress(sellCol));
  }

  async function buy(row: FloorListing) {
    const { eth, address } = await need();
    const order = row.order;
    if (order.kind === "seaport" && order.nft) {
      if (row.venue === "opensea" && !order.seaport) {
        throw new Error("OpenSea did not hand over the signed order. Use the OPENSEA link.");
      }
      const owner = await ownerOf(order.nft.contract, order.nft.tokenId);
      if (!owner || owner.toLowerCase() !== order.offerer.toLowerCase()) {
        dropListing(row.id);
        throw new Error("The seller no longer holds this NFT.");
      }
      if (await orderFilledOrCancelled(order)) {
        dropListing(row.id);
        throw new Error("That listing is filled or cancelled.");
      }
      const native = nativeConsideration(order);
      const coins = row.venue === "opensea" ? erc20Consideration(order) : [];
      if (row.venue === "opensea") {
        if (native > BigInt(0)) {
          const bal = await ethBalance(address);
          if (bal < native) throw new Error("Not enough ETH for the price. Gas is extra.");
        }
        for (const coin of coins) {
          const bal = await erc20Balance(coin.token, address);
          if (bal < coin.amount) throw new Error(`Not enough ${row.paySymbol || "token"}.`);
          await ensureErc20Allowance(eth, address, coin.token, SEAPORT_16, coin.amount);
        }
      } else if (order.currency === "ETH") {
        const bal = await ethBalance(address);
        if (bal < BigInt(order.raw)) throw new Error("Not enough ETH for the price. Gas is extra.");
      } else {
        const coin = currencyById(order.currency);
        const bal = await erc20Balance(coin.address, address);
        if (bal < BigInt(order.raw)) throw new Error(`Not enough ${order.currency}.`);
        await ensureErc20Allowance(eth, address, coin.address, SEAPORT_16, BigInt(order.raw));
      }
      const hash = await sendTx(eth, address, fulfillTx(order));
      await waitReceipt(hash);
      dropListing(row.id);
      if (row.venue === "opensea") setSea((prev) => prev.filter((item) => item.id !== row.id));
      setViewAsk(null);
      setMsg(`Bought ${hash.slice(0, 10)}…`);
      return;
    }
    if (order.art && atomicCurrency(order.currency)) {
      if (order.currency === "ETH") {
        const hash = await sendTx(eth, address, { to: order.offerer, value: BigInt(order.raw) });
        setMsg(`Paid ${hash.slice(0, 10)}… The file stays at the seller URL.`);
      } else {
        const coin = currencyById(order.currency);
        const hash = await sendTx(eth, address, transferErc20Tx(coin.address, order.offerer, BigInt(order.raw)));
        setMsg(`Paid ${hash.slice(0, 10)}… The file stays at the seller URL.`);
      }
      return;
    }
    if (order.payTo) {
      await navigator.clipboard.writeText(order.payTo);
      setMsg(`Copied ${order.payTo}. Send ${row.price} from your ${order.currency} wallet.`);
    }
  }

  async function cancel(row: FloorListing) {
    const { eth, address } = await need();
    if (row.order.seaport) {
      const hash = await sendTx(eth, address, cancelTx(row.order));
      await waitReceipt(hash);
    }
    if (row.venue !== "opensea" && row.id.startsWith("0x")) {
      const hash = await sendTx(eth, address, revokeTx(row.id));
      await waitReceipt(hash);
    }
    forgetPending(row.order);
    dropListing(row.id);
    if (row.venue === "opensea") setSea((prev) => prev.filter((item) => item.id !== row.id));
    setViewAsk(null);
    setRows(cachedListings());
    setMsg("Listing cancelled.");
  }

  async function sendNft(row: FloorListing) {
    const { eth, address } = await need();
    if (!row.order.nft) throw new Error("No token on this listing.");
    if (!payAddressOk("ETH", buyer)) throw new Error("Enter the buyer wallet.");
    const hash = await sendTx(eth, address, transferNftTx(row.order.nft.contract, address, getAddress(buyer), row.order.nft.tokenId));
    await waitReceipt(hash);
    setMsg(`NFT sent ${hash.slice(0, 10)}…`);
  }
}

function Detail({
  row,
  image,
  full,
  animation,
  title,
  wide,
  mine,
  busy,
  buyer,
  setBuyer,
  onBuy,
  onCancel,
  onSend,
}: {
  row: FloorListing;
  image: string | null;
  full?: string | null;
  animation?: string | null;
  title?: string;
  wide?: boolean;
  mine: boolean;
  busy: boolean;
  buyer: string;
  setBuyer: (v: string) => void;
  onBuy: () => void;
  onCancel: () => void;
  onSend: () => void;
}) {
  const order = row.order;
  const direct = order.kind === "invoice";
  return (
    <div style={detail}>
      <PieceShot src={image} full={full} animation={animation} title={title} wide={wide} />
      <div>
        <div style={{ color: "#00ff00" }}>{row.collectionName.toUpperCase()} {order.nft ? `#${order.nft.tokenId}` : order.art?.title}</div>
        <div style={dim}>{order.offerer}</div>
        <Fee
          lines={
            direct
              ? [
                  ["PRICE", row.price],
                  ["K-OS FEE", "0"],
                  ["ESCROW", "NONE"],
                  ["PAY", order.payTo || order.offerer],
                ]
              : [
                  ["PRICE", row.price],
                  ["K-OS FEE", "0"],
                  ...(row.fees ?? [
                    ["PROTOCOL FEE", "0"],
                    ["SELLER RECEIVES", row.price],
                  ]),
                  ["NETWORK", "ETH GAS IN THE WALLET"],
                ]
          }
        />
        {direct && order.nft && <div style={dim}>THE NFT STAYS IN THE SELLER WALLET UNTIL THEY SEND IT.</div>}
        {mine && direct && order.nft && (
          <input value={buyer} onChange={(e) => setBuyer(e.target.value)} placeholder="BUYER 0x" style={{ ...input, width: "100%", marginTop: 6 }} />
        )}
        <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
          {mine ? (
            <>
              <button type="button" style={btn} disabled={busy} onClick={onCancel}>CANCEL</button>
              {direct && order.nft && <button type="button" style={yellow} disabled={busy} onClick={onSend}>SEND NFT</button>}
            </>
          ) : order.seaport || order.kind !== "seaport" ? (
            <button type="button" style={yellow} disabled={busy} onClick={onBuy}>
              {direct && !atomicCurrency(order.currency) ? "COPY ADDRESS" : "BUY"}
            </button>
          ) : order.nft ? (
            <a href={`https://opensea.io/item/ethereum/${order.nft.contract}/${order.nft.tokenId}`} target="_blank" rel="noreferrer" style={{ ...yellow, display: "inline-flex", alignItems: "center", textDecoration: "none" }}>
              OPENSEA
            </a>
          ) : null}
          {order.nft && (
            <a href={`https://etherscan.io/nft/${order.nft.contract}/${order.nft.tokenId}`} target="_blank" rel="noreferrer" style={link}>
              ETHERSCAN
            </a>
          )}
          {row.venue === "opensea" && order.seaport && order.nft && (
            <a href={`https://opensea.io/item/ethereum/${order.nft.contract}/${order.nft.tokenId}`} target="_blank" rel="noreferrer" style={link}>
              OPENSEA
            </a>
          )}
        </div>
      </div>
    </div>
  );
}

function Quiet({ nft }: { nft: CatalogNft }) {
  return (
    <div style={detail}>
      <PieceShot src={nft.image} full={nft.full} animation={nft.animation} title={nft.name} wide={isWideArt(nft.collectionId)} />
      <div>
        <div style={{ color: "#00ff00" }}>{nft.name.toUpperCase()}</div>
        <div style={dim}>{nft.collectionName.toUpperCase()} · NOT LISTED</div>
        <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
          <a href={`https://etherscan.io/nft/${nft.contract}/${nft.tokenId}`} target="_blank" rel="noreferrer" style={link}>
            ETHERSCAN
          </a>
          <a href={`https://opensea.io/item/ethereum/${nft.contract}/${nft.tokenId}`} target="_blank" rel="noreferrer" style={link}>
            OPENSEA
          </a>
        </div>
      </div>
    </div>
  );
}

function Fee({ lines }: { lines: [string, string][] }) {
  return (
    <div style={{ marginTop: 8 }}>
      {lines.map(([k, v]) => (
        <div key={k} style={{ display: "flex", justifyContent: "space-between", gap: 12, fontSize: 9 }}>
          <span style={dim}>{k}</span>
          <span style={{ wordBreak: "break-all", textAlign: "right" }}>{v}</span>
        </div>
      ))}
    </div>
  );
}

function railName(id: string, name: string): string {
  if (id === "miyamaker-mini") return "MIYAMAKER";
  if (id === "mialien-eth") return "MIALIEN";
  if (id === "kool-skull-s-halloween-special") return "HALLOWEEN";
  if (id === "bannerz-by-koolskull") return "BANNERZ";
  return name.toUpperCase();
}

function Chip({ label, on: active, click, block }: { label: string; on: boolean; click: () => void; block?: boolean }) {
  const base = block ? (active ? railOn : railBtn) : active ? on : btn;
  return (
    <button type="button" style={base} onClick={click}>
      {label}
    </button>
  );
}

function PieceShot({
  src,
  full,
  animation,
  title,
  wide,
}: {
  src?: string | null;
  full?: string | null;
  animation?: string | null;
  title?: string;
  wide?: boolean;
}) {
  const frame = wide ? bannerShot : shot;
  const shown = wide ? wideStill(src) || src : src;
  const stage = animation || (wide ? wideStill(full || src) || full || src : full || src);
  const picture = shown ? <img src={shown} alt={title || ""} style={frame} /> : <div style={frame} />;
  if (!stage) return picture;
  return (
    <FullscreenButton
      title={title}
      image={full || src}
      src={stage}
      role={animation ? "animation" : "still"}
      openOnClick
    >
      {picture}
    </FullscreenButton>
  );
}

function NftTile({
  nft,
  banner,
  selected,
  price,
  priceColor,
  gridColumn,
  onOpen,
}: {
  nft: CatalogNft;
  banner: boolean;
  selected: boolean;
  price: string;
  priceColor: string;
  gridColumn?: string;
  onOpen: () => void;
}) {
  const picture = banner ? wideStill(nft.image) || nft.image : nft.image;
  const largest = banner ? wideStill(nft.full || nft.image) || nft.full || nft.image : nft.full || nft.image;
  const stage = nft.animation || largest;
  return (
    <FullscreenButton
      title={nft.name}
      image={largest}
      src={stage}
      role={nft.animation ? "animation" : "still"}
      style={banner ? { width: "100%", maxWidth: "100%", minWidth: 0, ...(gridColumn ? { gridColumn } : {}) } : gridColumn ? { gridColumn } : undefined}
    >
      <button
        type="button"
        style={{ ...tile, width: "100%", maxWidth: "100%", minWidth: 0, borderColor: selected ? "#00ff00" : "#333" }}
        onClick={onOpen}
      >
        {picture ? <img src={picture} alt="" style={banner ? bannerImg : tileImg} /> : <div style={banner ? bannerImg : tileImg} />}
        <div style={tileMeta}>
          <span>{nft.name.toUpperCase()}</span>
          <span style={{ color: priceColor }}>{price}</span>
        </div>
      </button>
    </FullscreenButton>
  );
}

const root: React.CSSProperties = {
  height: "100%",
  display: "flex",
  flexDirection: "column",
  background: "#000",
  color: "#fff",
  fontFamily: "var(--dm-font-primary)",
  fontSize: 10,
  imageRendering: "pixelated",
  minHeight: 0,
};
const header: React.CSSProperties = {
  display: "flex",
  gap: 6,
  alignItems: "center",
  padding: 8,
  borderBottom: "1px solid #333",
  flexWrap: "nowrap",
  overflowX: "auto",
  flexShrink: 0,
};
const columns: React.CSSProperties = {
  flex: 1,
  minHeight: 0,
  display: "grid",
  gridTemplateColumns: "132px minmax(0, 1fr) minmax(200px, 260px)",
};
const pair: React.CSSProperties = {
  flex: 1,
  minHeight: 0,
  display: "grid",
  gridTemplateColumns: "minmax(0, 1fr) minmax(168px, 220px)",
};
const bagColumns: React.CSSProperties = {
  flex: 1,
  minHeight: 0,
  display: "grid",
  gridTemplateColumns: "minmax(200px, 300px) minmax(0, 1fr)",
};
const rail: React.CSSProperties = {
  minHeight: 0,
  overflow: "auto",
  display: "flex",
  flexDirection: "column",
  gap: 6,
  padding: 8,
  borderRight: "1px solid #222",
};
const side: React.CSSProperties = {
  minHeight: 0,
  overflow: "auto",
  display: "flex",
  flexDirection: "column",
  gap: 8,
  padding: 10,
  borderLeft: "1px solid #222",
};
const galleryPane: React.CSSProperties = { minHeight: 0, minWidth: 0, overflow: "auto" };
const formPane: React.CSSProperties = {
  minHeight: 0,
  overflow: "auto",
  padding: 12,
  display: "flex",
  flexDirection: "column",
  gap: 8,
};
const scroll: React.CSSProperties = { flex: 1, overflow: "auto", minHeight: 0 };
const pad: React.CSSProperties = { padding: 12 };
const chipRow: React.CSSProperties = { display: "flex", gap: 6, flexWrap: "wrap", padding: "8px 12px" };
const dim: React.CSSProperties = { color: "#888", fontSize: 8, letterSpacing: 1, lineHeight: 1.5 };
const error: React.CSSProperties = { color: "#ff5555", fontSize: 9, padding: "4px 12px" };
const status: React.CSSProperties = { color: "#00ff00", fontSize: 9, padding: "4px 12px" };
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
const on: React.CSSProperties = { ...btn, border: "1px solid #00ff00", color: "#00ff00" };
const railBtn: React.CSSProperties = {
  ...btn,
  width: "100%",
  height: "auto",
  minHeight: 22,
  textAlign: "left",
  whiteSpace: "normal",
};
const railOn: React.CSSProperties = { ...railBtn, border: "1px solid #00ff00", color: "#00ff00" };
const yellow: React.CSSProperties = { ...btn, border: "1px solid #00ff00", background: "#00ff00", color: "#000" };
const input: React.CSSProperties = {
  height: 22,
  background: "#000",
  color: "#fff",
  border: "1px solid #555",
  fontFamily: "var(--dm-font-primary)",
  fontSize: 9,
  padding: "0 6px",
};
const area: React.CSSProperties = { ...input, height: 48, width: "100%", margin: "6px 0" };
const rowBtn: React.CSSProperties = {
  width: "100%",
  display: "flex",
  gap: 8,
  alignItems: "center",
  padding: 8,
  border: "none",
  borderBottom: "1px solid #222",
  background: "#000",
  color: "#fff",
  fontFamily: "var(--dm-font-primary)",
  fontSize: 10,
  cursor: "pointer",
};
const section: React.CSSProperties = {
  padding: "10px 12px 0",
  color: "#00ff00",
  fontSize: 8,
  letterSpacing: 1,
};
const grid: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fill, minmax(132px, 1fr))",
  gap: 8,
  padding: 12,
};
const bannerGrid: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "minmax(0, 1fr)",
  gap: 8,
  padding: 12,
};
const tile: React.CSSProperties = {
  display: "flex",
  flexDirection: "column",
  gap: 4,
  padding: 0,
  border: "1px solid #333",
  background: "#000",
  color: "#fff",
  fontFamily: "var(--dm-font-primary)",
  fontSize: 8,
  textAlign: "left",
  cursor: "pointer",
};
const tileImg: React.CSSProperties = {
  width: "100%",
  aspectRatio: "1",
  objectFit: "cover",
  background: "#111",
  imageRendering: "pixelated",
};
const bannerImg: React.CSSProperties = {
  width: "100%",
  height: "auto",
  minWidth: 0,
  maxWidth: "100%",
  display: "block",
  objectFit: "contain",
  background: "#111",
  imageRendering: "pixelated",
};
const tileMeta: React.CSSProperties = {
  display: "flex",
  flexDirection: "column",
  gap: 2,
  padding: "0 6px 6px",
};
const detail: React.CSSProperties = { display: "flex", flexDirection: "column", gap: 8 };
const shot: React.CSSProperties = {
  width: "100%",
  aspectRatio: "1",
  objectFit: "contain",
  background: "#000",
  imageRendering: "pixelated",
};
const bannerShot: React.CSSProperties = {
  width: "100%",
  height: "auto",
  minWidth: 0,
  maxWidth: "100%",
  display: "block",
  objectFit: "contain",
  background: "#000",
  imageRendering: "pixelated",
};
const link: React.CSSProperties = { color: "#888", fontSize: 8, letterSpacing: 1, alignSelf: "center" };
