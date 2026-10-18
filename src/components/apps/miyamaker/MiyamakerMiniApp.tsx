"use client";

import React, { useCallback, useEffect, useState } from "react";
import { Interface } from "ethers";
import { MIYAMAKER_MINI } from "@/data/sanctioned-nfts";
import { shortContract } from "@/lib/scatter";
import { loadMiyamakerStatus, type MiyamakerStatus } from "@/lib/mintClient";
import { connectEthereumProvider, ensureChain } from "@/lib/walletProviders";
import { OwnedNftsPanel } from "@/components/apps/nftmint/OwnedNftsPanel";

type Tab = "mint" | "owned";

const MINT_IFACE = new Interface(["function mint(uint256 _mintAmount)"]);

export function MiyamakerMiniApp() {
  const [tab, setTab] = useState<Tab>("mint");
  const [status, setStatus] = useState<MiyamakerStatus | null>(null);
  const [statusErr, setStatusErr] = useState<string | null>(null);
  const [wallet, setWallet] = useState<string | null>(null);
  const [msg, setMsg] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const loadStatus = useCallback(async () => {
    setStatusErr(null);
    try {
      setStatus(await loadMiyamakerStatus());
    } catch (e) {
      setStatusErr(e instanceof Error ? e.message : "Status error");
    }
  }, []);

  useEffect(() => {
    void loadStatus();
  }, [loadStatus]);

  async function connect() {
    setMsg(null);
    try {
      const { address: addr, provider } = await connectEthereumProvider();
      await ensureChain(provider, 1);
      setWallet(addr);
    } catch (e) {
      setMsg(e instanceof Error ? e.message : "Wallet connect failed");
    }
  }

  async function mint() {
    setMsg(null);
    if (status?.soldOut) return;
    setBusy(true);
    try {
      const { address: from, provider: eth } = await connectEthereumProvider();
      await ensureChain(eth, 1);
      const data = MINT_IFACE.encodeFunctionData("mint", [1]);
      const value = "0x" + BigInt(MIYAMAKER_MINI.mintPriceWei).toString(16);
      const hash = (await eth.request({
        method: "eth_sendTransaction",
        params: [{ from, to: MIYAMAKER_MINI.address, data, value }],
      })) as string;
      setMsg(`Mint submitted ${hash.slice(0, 10)}…`);
      setWallet(from);
      await loadStatus();
    } catch (e) {
      setMsg(e instanceof Error ? e.message : "Mint failed");
    }
    setBusy(false);
  }

  const soldOut = status?.soldOut ?? false;
  const pct = status && status.max > 0 ? Math.min(100, (status.minted / status.max) * 100) : 0;
  return (
    <div style={root}>
      <div style={header}>
        <span style={{ color: "#ff00ff", letterSpacing: 2 }}>MIYAMAKER MINI</span>
        <span style={dim}>ERC721M · ETHEREUM · 0.4444 ETH</span>
        <span style={{ flex: 1 }} />
        <button type="button" style={btn} onClick={() => void loadStatus()}>
          REFRESH
        </button>
      </div>
      <div style={navRow}>
        <button type="button" style={tab === "mint" ? navOn : navOff} onClick={() => setTab("mint")}>
          MINT
        </button>
        <button type="button" style={tab === "owned" ? navOn : navOff} onClick={() => setTab("owned")}>
          MY NFTS
        </button>
      </div>
      {msg && <div style={banner}>{msg.toUpperCase()}</div>}

      {tab === "mint" && (
        <div style={scroll}>
          <div style={heroWrap}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={MIYAMAKER_MINI.heroGif} alt="" style={heroImg} />
          </div>
          <div style={grid}>
            <div style={col}>
              <div style={label}>INFO</div>
              <div style={body}>
                Miyamaker Mini is a short-run ERC721M test NFT (1024 supply). 75% of mint funds go to the
                Milady Maker NFTX vault. Holders can receive a custom hand-drawn portrait update. Copyleft
                under the Viral Public License.
              </div>
              <div style={body}>DEUS VULT.</div>
              <div style={label}>NETWORK</div>
              <div style={box}>
                <Row k="NETWORK" v="ETHEREUM MAINNET" />
                <Row k="CHAIN ID" v="1" />
                <Row k="PRICE" v={`${MIYAMAKER_MINI.mintPriceEth} ETH`} />
                <Row k="CONTRACT" v={shortContract(MIYAMAKER_MINI.address)} />
                <a
                  href={`https://etherscan.io/address/${MIYAMAKER_MINI.address}`}
                  target="_blank"
                  rel="noreferrer"
                  style={link}
                >
                  VIEW ON ETHERSCAN
                </a>
                <a href={MIYAMAKER_MINI.liveMintUrl} target="_blank" rel="noreferrer" style={link}>
                  OPEN ORIGINAL MINT PAGE
                </a>
                <a href={MIYAMAKER_MINI.licenseUrl} target="_blank" rel="noreferrer" style={link}>
                  MIYAMAKER.COM
                </a>
              </div>
            </div>
            <div style={col}>
              <div style={panel}>
                <div style={label}>SUPPLY</div>
                <div style={dim}>
                  {status
                    ? soldOut
                      ? `${status.minted} / ${status.max} MINTED`
                      : `${status.minted} / ${status.max} MINTED · ${status.remaining} LEFT`
                    : statusErr
                      ? statusErr.toUpperCase()
                      : "LOADING…"}
                </div>
                <div style={barTrack}>
                  <div style={{ ...barFill, width: `${pct}%`, background: soldOut ? "#ff5555" : "#ff00ff" }} />
                </div>
                <div style={label}>PRICE</div>
                {soldOut ? (
                  <div style={sold}>SOLD OUT</div>
                ) : (
                  <div style={price}>{MIYAMAKER_MINI.mintPriceEth} ETH</div>
                )}
                <div style={dim}>1 PER TRANSACTION · ETHEREUM MAINNET</div>
                {soldOut ? (
                  <div style={sold}>SOLD OUT</div>
                ) : (
                  <>
                    {!wallet && (
                      <button type="button" style={ghost} onClick={() => void connect()}>
                        CONNECT WALLET
                      </button>
                    )}
                    {wallet && <div style={dim}>WALLET {shortContract(wallet)}</div>}
                    <button
                      type="button"
                      style={!status || busy ? mintOff : mintBtn}
                      disabled={!status || busy}
                      onClick={() => void mint()}
                    >
                      {busy ? "CHECK WALLET…" : !status ? "LOADING…" : `MINT · ${MIYAMAKER_MINI.mintPriceEth} ETH`}
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {tab === "owned" && <OwnedNftsPanel accent="#ff00ff" />}
    </div>
  );
}

function Row({ k, v }: { k: string; v: string }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", gap: 12, fontSize: 9 }}>
      <span style={dim}>{k}</span>
      <span>{v}</span>
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
const navRow: React.CSSProperties = { display: "flex", borderBottom: "1px solid #333" };
const navOn: React.CSSProperties = {
  flex: 1,
  height: 26,
  border: "none",
  borderRight: "1px solid #333",
  background: "#ff00ff",
  color: "#000",
  fontFamily: "var(--dm-font-primary)",
  fontSize: 8,
  letterSpacing: 1,
  cursor: "pointer",
};
const navOff: React.CSSProperties = { ...navOn, background: "#000", color: "#888" };
const dim: React.CSSProperties = { color: "#888", fontSize: 8, letterSpacing: 1 };
const banner: React.CSSProperties = {
  padding: "6px 8px",
  borderBottom: "1px solid #333",
  color: "#00ff00",
  fontSize: 8,
  letterSpacing: 1,
};
const scroll: React.CSSProperties = { flex: 1, overflow: "auto" };
const heroWrap: React.CSSProperties = { borderBottom: "1px solid #333", background: "#000" };
const heroImg: React.CSSProperties = {
  display: "block",
  width: "100%",
  maxHeight: 160,
  objectFit: "contain",
  imageRendering: "pixelated",
};
const grid: React.CSSProperties = {
  display: "flex",
  flexWrap: "wrap",
  gap: 12,
  padding: 12,
  alignItems: "start",
};
const col: React.CSSProperties = { flex: "1 1 280px", minWidth: 0, display: "flex", flexDirection: "column", gap: 8 };
const label: React.CSSProperties = { color: "#ff00ff", fontSize: 8, letterSpacing: 2 };
const body: React.CSSProperties = { fontSize: 9, lineHeight: 1.5, color: "#ddd" };
const box: React.CSSProperties = {
  border: "1px solid #333",
  padding: 10,
  display: "flex",
  flexDirection: "column",
  gap: 6,
  background: "#0a0a0a",
};
const panel: React.CSSProperties = { ...box, gap: 8 };
const barTrack: React.CSSProperties = { height: 8, border: "1px solid #333", background: "#111" };
const barFill: React.CSSProperties = { height: "100%" };
const price: React.CSSProperties = { fontSize: 16, color: "#ff00ff", letterSpacing: 1 };
const sold: React.CSSProperties = {
  border: "1px solid #ff5555",
  color: "#ff5555",
  textAlign: "center",
  padding: "10px 0",
  letterSpacing: 2,
  fontSize: 12,
};
const mintBtn: React.CSSProperties = {
  height: 32,
  border: "1px solid #ff00ff",
  background: "#ff00ff",
  color: "#000",
  fontFamily: "var(--dm-font-primary)",
  fontSize: 10,
  letterSpacing: 1,
  cursor: "pointer",
};
const mintOff: React.CSSProperties = { ...mintBtn, background: "#222", border: "1px solid #555", color: "#888", cursor: "not-allowed" };
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
const ghost: React.CSSProperties = { ...btn, border: "1px solid #ff00ff", color: "#ff00ff" };
const link: React.CSSProperties = { color: "#888", fontSize: 8, letterSpacing: 1 };
