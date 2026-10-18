"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { Interface, getAddress } from "ethers";
import { SANCTIONED_NFTS } from "@/data/sanctioned-nfts";
import { CURRENCIES, SEAPORT_16, type CurrencyId, atomicCurrency, currencyById } from "@/data/market";
import { ALL_MINTS } from "@/data/scatter-mints";
import { MIYAMAKER_MINI } from "@/data/sanctioned-nfts";
import { loadMintCollection, requestScatterMintPrepared } from "@/lib/mintClient";
import { type ScatterCollection, priceLabel, scatterImage } from "@/lib/scatter";
import { listSettlement, openPayableLists, parsePrice, payAddressOk, scaleListPrice } from "@/lib/market/money";
import { cachedListings, dropListing, forgetPending, loadOlder, rememberPending, syncBook } from "@/lib/market/book";
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
  tokenMeta,
  transferErc20Tx,
  transferNftTx,
  waitReceipt,
} from "@/lib/market/chain";
import { type FloorListing, type KOrder, parseKOrder } from "@/lib/market/orders";
import { openSeaFloor } from "@/lib/market/opensea";
import {
  connectEthereumProvider,
  discoverEip6963Wallets,
  ensureChain,
  type Eip1193Provider,
  type Eip6963Detail,
} from "@/lib/walletProviders";
import { shortAddr } from "@/lib/shop/merchant";

type Pane = "floor" | "mint" | "sell" | "bag" | "art";

const MIYA_MINT = new Interface(["function mint(uint256 _mintAmount)"]);

export function ExchangeApp({ onOpenShop }: { onOpenShop: () => void }) {
  const [pane, setPane] = useState<Pane>("floor");
  const [acct, setAcct] = useState<string | null>(null);
  const [provider, setProvider] = useState<Eip1193Provider | null>(null);
  const [wallets, setWallets] = useState<Eip6963Detail[]>([]);
  const [rows, setRows] = useState<FloorListing[]>([]);
  const [sea, setSea] = useState<FloorListing[]>([]);
  const [seaReady, setSeaReady] = useState(false);
  const [colFilter, setColFilter] = useState("all");
  const [curFilter, setCurFilter] = useState<"all" | CurrencyId>("all");
  const [picked, setPicked] = useState<FloorListing | null>(null);
  const [images, setImages] = useState<Record<string, string | null>>({});
  const [msg, setMsg] = useState<string | null>(null);
  const [bad, setBad] = useState(false);
  const [busy, setBusy] = useState(false);
  const [paste, setPaste] = useState("");
  const asked = useRef(new Set<string>());

  const [mintSlug, setMintSlug] = useState(ALL_MINTS[0]?.slug ?? "mialien-eth");
  const [mintCol, setMintCol] = useState<ScatterCollection | null>(null);
  const [mintList, setMintList] = useState<string | null>(null);
  const [qty, setQty] = useState(1);

  const [sellCol, setSellCol] = useState(SANCTIONED_NFTS.find((c) => c.id === "mialien-eth")?.address ?? SANCTIONED_NFTS[0].address);
  const [tokenId, setTokenId] = useState("");
  const [currency, setCurrency] = useState<CurrencyId>("CULT");
  const [price, setPrice] = useState("");
  const [payTo, setPayTo] = useState("");
  const [artTitle, setArtTitle] = useState("");
  const [artUrl, setArtUrl] = useState("");
  const [buyer, setBuyer] = useState("");

  useEffect(() => discoverEip6963Wallets((w) => {
    setWallets((prev) => (prev.some((x) => x.info.uuid === w.info.uuid) ? prev : [...prev, w]));
  }), []);

  const refresh = async () => {
    const bookPromise = syncBook().then((book) => setRows(book));
    const seaPromise = openSeaFloor().then((asks) => {
      setSea(asks);
      setSeaReady(true);
    });
    const [book, asks] = await Promise.allSettled([bookPromise, seaPromise]);
    if (asks.status === "rejected") throw asks.reason;
    if (book.status === "rejected") throw book.reason;
  };

  useEffect(() => {
    setRows(cachedListings());
    void refresh().catch((e) => {
      setBad(true);
      setMsg(e instanceof Error ? e.message : "Book unavailable");
    });
  }, []);

  const shown = useMemo(() => {
    return [...sea, ...rows].filter((row) => {
      const symbol = row.paySymbol || row.order.currency;
      if (curFilter !== "all" && symbol !== curFilter) return false;
      if (colFilter === "all") return true;
      if (colFilter === "art") return Boolean(row.order.art);
      return SANCTIONED_NFTS.find((c) => c.address.toLowerCase() === row.order.nft?.contract.toLowerCase())?.id === colFilter;
    });
  }, [rows, sea, colFilter, curFilter]);

  const imageKey = shown.map((row) => row.id).join("|");
  useEffect(() => {
    let stop = false;
    for (const row of shown) {
      const nft = row.order.nft;
      if (!nft || asked.current.has(row.id)) continue;
      asked.current.add(row.id);
      void tokenMeta(nft.contract, nft.tokenId).then((meta) => {
        if (!stop) setImages((m) => ({ ...m, [row.id]: meta.image }));
      });
    }
    return () => {
      stop = true;
    };
    // imageKey tracks the visible set. `shown` is derived from it.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [imageKey]);

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

  const payable = mintCol ? openPayableLists(mintCol.lists) : [];
  const list = payable.find((L) => L.id === mintList) ?? payable[0];

  useEffect(() => {
    let stop = false;
    setMintCol(null);
    void loadMintCollection(mintSlug, acct ?? undefined).then((col) => {
      if (!stop) setMintCol(col);
    }).catch(() => {
      if (!stop) setMintCol(null);
    });
    return () => {
      stop = true;
    };
  }, [mintSlug, acct]);

  return (
    <div style={root}>
      <div style={header}>
        <span style={{ color: "#00ff00", letterSpacing: 2 }}>MARKET</span>
        {(["floor", "mint", "sell", "bag", "art"] as Pane[]).map((id) => (
          <button key={id} type="button" style={pane === id ? on : btn} onClick={() => setPane(id)}>
            {id.toUpperCase()}
          </button>
        ))}
        <button type="button" style={btn} onClick={onOpenShop}>SHOP</button>
        <span style={{ flex: 1 }} />
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
      {!acct && wallets.length > 0 && (
        <div style={chipRow}>
          {wallets.map((w) => (
            <button key={w.info.uuid} type="button" style={btn} onClick={() => void connect(w.provider).catch((e) => { setBad(true); setMsg(e instanceof Error ? e.message : "Connect failed"); })}>
              {w.info.name.toUpperCase()}
            </button>
          ))}
        </div>
      )}
      <div style={note}>
        OPENSEA ASKS FOR THESE COLLECTIONS ARE ON THE FLOOR. ETH, USDC, AND CULT MOVE WITH THE NFT IN ONE TRANSACTION.
        K-OS FEE IS 0. AN OPENSEA FEE IS SHOWN ON THAT LISTING. NETWORK FEE IS ETH GAS, SHOWN IN THE WALLET.
      </div>
      {msg && <div style={bad ? error : status}>{msg}</div>}

      {pane === "floor" && (
        <div style={scroll}>
          <div style={chipRow}>
            <Chip on={colFilter === "all"} label="ALL" click={() => setColFilter("all")} />
            {SANCTIONED_NFTS.map((c) => (
              <Chip key={c.id} on={colFilter === c.id} label={c.name.toUpperCase()} click={() => setColFilter(c.id)} />
            ))}
            <Chip on={colFilter === "art"} label="ART" click={() => setColFilter("art")} />
          </div>
          <div style={chipRow}>
            <Chip on={curFilter === "all"} label="ANY COIN" click={() => setCurFilter("all")} />
            {CURRENCIES.map((c) => (
              <Chip key={c.id} on={curFilter === c.id} label={c.id} click={() => setCurFilter(c.id)} />
            ))}
            <button type="button" style={btn} disabled={busy} onClick={() => void run(async () => setRows(await syncBook()))}>REFRESH</button>
            <button type="button" style={btn} disabled={busy} onClick={() => void run(async () => setRows(await loadOlder()))}>OLDER</button>
          </div>
          {shown.length === 0 && <div style={pad}>{seaReady ? "NO LISTINGS IN THIS WINDOW." : "READING OPENSEA…"}</div>}
          {shown.map((row) => (
            <button key={row.id} type="button" style={rowBtn} onClick={() => setPicked(row)}>
              <Thumb src={row.order.art?.image || images[row.id]} />
              <div style={{ flex: 1, textAlign: "left" }}>
                <div>{row.collectionName.toUpperCase()} {row.order.nft ? `#${row.order.nft.tokenId}` : row.order.art?.title}</div>
                <div style={dim}>{shortAddr(row.order.offerer)} · {row.venue === "opensea" ? "OPENSEA" : row.order.kind === "seaport" ? "ATOMIC" : "DIRECT"}</div>
              </div>
              <div style={{ color: "#00ff00" }}>{row.price}</div>
            </button>
          ))}
          {picked && <Detail row={picked} image={picked.order.art?.image || images[picked.id] || null} mine={acct?.toLowerCase() === picked.order.offerer.toLowerCase()} busy={busy} buyer={buyer} setBuyer={setBuyer} onBuy={() => void run(() => buy(picked))} onCancel={() => void run(() => cancel(picked))} onSend={() => void run(() => sendNft(picked))} />}
          <div style={pad}>
            <div style={dim}>PASTE A SIGNED ORDER</div>
            <textarea value={paste} onChange={(e) => setPaste(e.target.value)} style={area} />
            <button type="button" style={btn} onClick={() => {
              try {
                const order = parseKOrder(JSON.parse(paste));
                if (!order) throw new Error("Order rejected.");
                rememberPending(order);
                setRows(cachedListings());
                setPaste("");
                setBad(false);
                setMsg("Order added on this machine.");
              } catch (e) {
                setBad(true);
                setMsg(e instanceof Error ? e.message : "Paste rejected");
              }
            }}>ADD ORDER</button>
          </div>
        </div>
      )}

      {pane === "mint" && (
        <div style={scroll}>
          <div style={chipRow}>
            {ALL_MINTS.map((c) => (
              <Chip key={c.slug} on={mintSlug === c.slug} label={c.shortName} click={() => { setMintSlug(c.slug); setMintList(null); }} />
            ))}
          </div>
          <div style={pad}>
            {mintCol?.banner && <img src={scatterImage(mintCol.banner, "800x280") || ""} alt="" style={banner} />}
            <div style={{ marginTop: 8 }}>{mintCol ? `${mintCol.minted} / ${mintCol.max} MINTED` : "LOADING MINT…"}</div>
            <div style={chipRow}>
              {payable.map((L) => (
                <Chip key={L.id} on={list?.id === L.id} label={`${L.name.toUpperCase()} ${priceLabel(L)}`} click={() => setMintList(L.id)} />
              ))}
            </div>
            {mintCol && payable.length === 0 && <div style={dim}>NO ETH, USDC, OR CULT LIST OPEN.</div>}
            {list && listSettlement(list) && (
              <Fee
                lines={[
                  ["PRICE", `${scaleListPrice(list, qty)} ${listSettlement(list)}`],
                  ["K-OS FEE", "0"],
                  ["SCATTER", "TAKEN INSIDE THE LIST PRICE"],
                  ["NETWORK", "ETH GAS IN THE WALLET"],
                ]}
              />
            )}
            <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
              <button type="button" style={btn} onClick={() => setQty((q) => Math.max(1, q - 1))}>−</button>
              <span style={{ color: "#00ff00" }}>{qty}</span>
              <button type="button" style={btn} onClick={() => setQty((q) => Math.min(10, q + 1))}>+</button>
              <button type="button" style={yellow} disabled={busy || !list} onClick={() => void run(mint)}>
                {busy ? "CHECK WALLET…" : `MINT ${list ? listSettlement(list) : ""}`}
              </button>
            </div>
          </div>
        </div>
      )}

      {pane === "sell" && (
        <div style={pad}>
          <div style={dim}>
            LIST A TOKEN YOU HOLD. ETH, USDC, AND CULT USE SEAPORT. BTC AND XMR STAY IN YOUR WALLET UNTIL YOU TRANSFER THE NFT.
            THE WALLET APPROVES SEAPORT FOR THIS WHOLE COLLECTION, THEN SIGNS THE ORDER, THEN POSTS IT. EACH STEP IS ITS OWN CONFIRM.
          </div>
          <div style={chipRow}>
            {SANCTIONED_NFTS.map((c) => (
              <Chip key={c.id} on={sellCol.toLowerCase() === c.address.toLowerCase()} label={c.name.toUpperCase()} click={() => setSellCol(c.address)} />
            ))}
          </div>
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
          <Fee
            lines={[
              ["K-OS FEE", "0"],
              ["PROTOCOL FEE", "0"],
              ["SELLER RECEIVES", "THE FULL PRICE"],
              ["LISTING", "30 DAYS · GAS IS ETH"],
            ]}
          />
          <button type="button" style={{ ...yellow, marginTop: 8 }} disabled={busy} onClick={() => void run(() => listToken(false))}>
            {busy ? "CHECK WALLET…" : "LIST"}
          </button>
        </div>
      )}

      {pane === "art" && (
        <div style={pad}>
          <div style={dim}>ART PAYMENTS GO STRAIGHT TO THE SELLER. THE FILE STAYS AT THE HTTPS OR IPFS URL.</div>
          <input value={artTitle} onChange={(e) => setArtTitle(e.target.value)} placeholder="TITLE" style={{ ...input, width: "100%", marginTop: 8 }} />
          <input value={artUrl} onChange={(e) => setArtUrl(e.target.value)} placeholder="HTTPS OR IPFS URL" style={{ ...input, width: "100%", marginTop: 8 }} />
          <input value={price} onChange={(e) => setPrice(e.target.value)} placeholder="PRICE" style={{ ...input, marginTop: 8 }} />
          <div style={chipRow}>
            {CURRENCIES.map((c) => (
              <Chip key={c.id} on={currency === c.id} label={c.id} click={() => setCurrency(c.id)} />
            ))}
          </div>
          {(currency === "BTC" || currency === "XMR") && (
            <input value={payTo} onChange={(e) => setPayTo(e.target.value.trim())} placeholder={`${currency} ADDRESS`} style={{ ...input, width: "100%" }} />
          )}
          <button type="button" style={{ ...yellow, marginTop: 8 }} disabled={busy} onClick={() => void run(() => listToken(true))}>
            {busy ? "CHECK WALLET…" : "LIST ART"}
          </button>
        </div>
      )}

      {pane === "bag" && (
        <div style={pad}>
          <div style={dim}>YOUR OPEN LISTINGS ON THIS MACHINE AND IN THE BOOK.</div>
          {rows.filter((row) => acct && row.order.offerer.toLowerCase() === acct.toLowerCase()).map((row) => (
            <div key={row.id} style={rowBtn}>
              <div style={{ flex: 1 }}>{row.collectionName.toUpperCase()} · {row.price}</div>
              <button type="button" style={btn} disabled={busy} onClick={() => void run(() => cancel(row))}>CANCEL</button>
            </div>
          ))}
          {acct && rows.every((row) => row.order.offerer.toLowerCase() !== acct.toLowerCase()) && <div style={dim}>NONE YET.</div>}
          {!acct && <div style={dim}>CONNECT A WALLET.</div>}
        </div>
      )}
    </div>
  );

  async function mint() {
    if (!list || !mintCol) throw new Error("Mint list is still loading.");
    const { eth, address } = await need();
    const amount = Math.max(1, Math.min(10, qty));
    if (mintSlug === "miyamaker-mini") {
      const value = BigInt(MIYAMAKER_MINI.mintPriceWei) * BigInt(amount);
      const hash = await sendTx(eth, address, {
        to: MIYAMAKER_MINI.address,
        data: MIYA_MINT.encodeFunctionData("mint", [amount]),
        value,
      });
      setMsg(`Mint submitted ${hash.slice(0, 10)}…`);
      return;
    }
    const prepared = await requestScatterMintPrepared({
      slug: mintSlug,
      collectionAddress: mintCol.address,
      chainId: mintCol.chainId,
      minterAddress: address,
      listId: list.id,
      quantity: amount,
    });
    for (const token of prepared.erc20s) {
      await ensureErc20Allowance(eth, address, token.address, mintCol.address, BigInt(token.amount));
    }
    const hash = await sendTx(eth, address, {
      to: prepared.tx.to,
      data: prepared.tx.data,
      value: BigInt(prepared.tx.value || "0"),
    });
    setMsg(`Mint submitted ${hash.slice(0, 10)}…`);
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
      setPicked(null);
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
    setPicked(null);
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
      <Thumb src={image} big />
      <div style={{ flex: 1 }}>
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
          ) : (
            <button type="button" style={yellow} disabled={busy} onClick={onBuy}>
              {direct && !atomicCurrency(order.currency) ? "COPY ADDRESS" : "BUY"}
            </button>
          )}
          {order.nft && (
            <a href={`https://etherscan.io/nft/${order.nft.contract}/${order.nft.tokenId}`} target="_blank" rel="noreferrer" style={link}>
              ETHERSCAN
            </a>
          )}
          {row.venue === "opensea" && order.nft && (
            <a href={`https://opensea.io/item/ethereum/${order.nft.contract}/${order.nft.tokenId}`} target="_blank" rel="noreferrer" style={link}>
              OPENSEA
            </a>
          )}
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

function Chip({ label, on: active, click }: { label: string; on: boolean; click: () => void }) {
  return (
    <button type="button" style={active ? on : btn} onClick={click}>
      {label}
    </button>
  );
}

function Thumb({ src, big }: { src?: string | null; big?: boolean }) {
  const size = big ? 96 : 42;
  if (!src) return <div style={{ ...thumb, width: size, height: size }} />;
  return <img src={src} alt="" style={{ ...thumb, width: size, height: size }} />;
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
  flexWrap: "wrap",
};
const scroll: React.CSSProperties = { flex: 1, overflow: "auto", minHeight: 0 };
const pad: React.CSSProperties = { padding: 12 };
const chipRow: React.CSSProperties = { display: "flex", gap: 6, flexWrap: "wrap", padding: "8px 12px" };
const dim: React.CSSProperties = { color: "#888", fontSize: 8, letterSpacing: 1, lineHeight: 1.5 };
const note: React.CSSProperties = { ...dim, padding: "6px 12px", borderBottom: "1px solid #222" };
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
const thumb: React.CSSProperties = {
  width: 42,
  height: 42,
  objectFit: "cover",
  background: "#111",
  imageRendering: "pixelated",
  flexShrink: 0,
};
const detail: React.CSSProperties = { display: "flex", gap: 10, padding: 12, borderTop: "1px solid #00ff00" };
const banner: React.CSSProperties = { width: "100%", maxHeight: 140, objectFit: "cover", imageRendering: "pixelated" };
const link: React.CSSProperties = { color: "#888", fontSize: 8, letterSpacing: 1, alignSelf: "center" };
