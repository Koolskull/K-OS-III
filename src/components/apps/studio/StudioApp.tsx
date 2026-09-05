"use client";

/*
 *                    ☦
 *      2KOOL STUDIO DESK
 *
 *  In-OS minting and credit desk for the Production Protocol.
 *  Injected wallet only — no local keystore.
 */

import React, { useCallback, useEffect, useState } from "react";
import {
  formatUnits,
  isAddress,
  keccak256,
  parseEventLogs,
  parseUnits,
  stringToHex,
  toBytes,
} from "viem";
import {
  creditLedgerAbi,
  erc20Abi,
  instrumentRegistryAbi,
  shotNFTAbi,
  studioTreasuryAbi,
} from "@/lib/studio/abi";
import {
  CHAIN_PRESETS,
  INSTRUMENT_KINDS,
  KNOWN_USDC,
  type HexAddr,
  type StudioConfig,
} from "@/lib/studio/config";
import { COUNSEL_SECTIONS } from "@/lib/studio/counsel";
import { useStudio } from "@/lib/studio/useStudio";
import { useProduction } from "@/lib/production";
import { ShotChainPanel } from "@/components/apps/production/ShotChainPanel";
import { chainStatusLabel } from "@/components/apps/shotlist/shotlistShared";
import { Btn, Field, Grid, Note, Section, SelectField, Stat, TabBar } from "./ui";

const TABS = [
  { id: "desk", label: "DESK" },
  { id: "board", label: "BOARD" },
  { id: "credits", label: "CREDITS" },
  { id: "mint", label: "MINT" },
  { id: "sale", label: "SALE" },
  { id: "books", label: "BOOKS" },
  { id: "counsel", label: "COUNSEL" },
];

type CreditRow = { account: string; role: string; weight: string };

export function StudioApp() {
  const studio = useStudio();
  const [tab, setTab] = useState("desk");

  return (
    <div
      style={{
        height: "100%",
        display: "flex",
        flexDirection: "column",
        background: "#000",
        color: "#fff",
        fontFamily: "var(--dm-font-primary)",
        imageRendering: "pixelated",
      }}
    >
      <header
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          padding: "8px 12px",
          borderBottom: "2px solid #333",
          flexShrink: 0,
          gap: 8,
        }}
      >
        <div>
          <div style={{ fontSize: 11, letterSpacing: 2 }}>2KOOL STUDIO</div>
          <div style={{ fontSize: 8, color: "#888", letterSpacing: 1 }}>
            PRODUCTION DESK · CREDITS · CELS · 5%
          </div>
        </div>
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <span style={{ fontSize: 8, color: "#888" }}>
            {studio.account
              ? `${studio.account.slice(0, 6)}…${studio.account.slice(-4)}`
              : "NO WALLET"}
          </span>
          <Btn onClick={studio.connect} disabled={studio.busy}>
            {studio.account ? "CONNECTED" : "CONNECT"}
          </Btn>
        </div>
      </header>

      <TabBar tabs={TABS} current={tab} onChange={setTab} />

      <div
        style={{
          flex: 1,
          overflow: "auto",
          padding: 14,
          display: "flex",
          flexDirection: "column",
          gap: 16,
        }}
      >
        {tab === "desk" && <Desk studio={studio} />}
        {tab === "board" && <Board />}
        {tab === "credits" && <Credits studio={studio} />}
        {tab === "mint" && <Mint studio={studio} />}
        {tab === "sale" && <Sale studio={studio} />}
        {tab === "books" && <Books studio={studio} />}
        {tab === "counsel" && <Counsel />}
      </div>

      <footer
        style={{
          borderTop: "2px solid #333",
          padding: "6px 12px",
          fontSize: 9,
          color: studio.error ? "#ff6666" : "#888",
          flexShrink: 0,
          minHeight: 28,
        }}
      >
        {studio.error || studio.status || "Ready. Connect a wallet. Load a StudioKit."}
      </footer>
    </div>
  );
}

type S = ReturnType<typeof useStudio>;

function callBase(studio: S) {
  if (!studio.account) throw new Error("Connect a wallet first.");
  return { account: studio.account, chain: studio.chain };
}

function Desk({ studio }: { studio: S }) {
  const { config, setConfig, addresses, loadKit, publicClient, busy } = studio;
  const [surplus, setSurplus] = useState<string>("—");
  const [hire, setHire] = useState<string>("—");
  const [capLeft, setCapLeft] = useState<string>("—");

  const patch = (k: keyof StudioConfig, v: string | number) =>
    setConfig({ ...config, [k]: v });

  const refresh = useCallback(async () => {
    if (!addresses || !isAddress(config.paymentToken)) return;
    const token = config.paymentToken as HexAddr;
    const [s, h] = await Promise.all([
      publicClient.readContract({
        address: addresses.treasury,
        abi: studioTreasuryAbi,
        functionName: "lockedSurplus",
        args: [token],
      }),
      publicClient.readContract({
        address: addresses.treasury,
        abi: studioTreasuryAbi,
        functionName: "hireBudget",
        args: [token],
      }),
    ]);
    setSurplus(formatUnits(s, 6));
    setHire(formatUnits(h, 6));
    if (studio.account) {
      const left = await publicClient.readContract({
        address: addresses.treasury,
        abi: studioTreasuryAbi,
        functionName: "remainingCapUsd6",
        args: [studio.account],
      });
      setCapLeft(formatUnits(left, 6));
    }
  }, [addresses, config.paymentToken, publicClient, studio.account]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return (
    <>
      <Section title="CHAIN">
        <Note>
          Paste the StudioKit address from deploy. The kit exposes every module.
          Admin should be a Safe, not this browser wallet, once you go live.
        </Note>
        <Grid>
          <SelectField
            label="CHAIN"
            value={String(config.chainId)}
            onChange={(v) => {
              const id = Number(v);
              setConfig({
                ...config,
                chainId: id,
                paymentToken: KNOWN_USDC[id] ?? config.paymentToken,
              });
            }}
            options={CHAIN_PRESETS.map((c) => ({ value: String(c.id), label: c.label }))}
          />
          <Field
            label="RPC (blank = public)"
            value={config.rpcUrl}
            onChange={(v) => patch("rpcUrl", v)}
            placeholder="https://"
          />
          <Field
            label="STUDIOKIT"
            value={config.kit}
            onChange={(v) => patch("kit", v)}
            placeholder="0x…"
            mono
          />
          <Field
            label="PAYMENT TOKEN (USDC)"
            value={config.paymentToken}
            onChange={(v) => patch("paymentToken", v)}
            placeholder="0x…"
            mono
          />
        </Grid>
        <div style={{ display: "flex", gap: 8 }}>
          <Btn onClick={loadKit} disabled={busy}>
            LOAD KIT
          </Btn>
          <Btn onClick={() => void refresh()} disabled={busy || !addresses}>
            REFRESH VAULT
          </Btn>
        </div>
      </Section>

      {addresses && (
        <Section title="MODULES">
          <Grid>
            <Stat label="TREASURY" value={addresses.treasury} />
            <Stat label="LEDGER" value={addresses.ledger} />
            <Stat label="SHOT NFT" value={addresses.nft} />
            <Stat label="REGISTRY" value={addresses.registry} />
          </Grid>
        </Section>
      )}

      <Section title="VAULT">
        <Grid>
          <Stat label="LOCKED SURPLUS" value={`${surplus} USDC`} />
          <Stat label="HIRE BUDGET" value={`${hire} USDC`} />
          <Stat label="YOUR REMAINING CAP" value={`${capLeft} USD`} />
        </Grid>
        <Note>
          Surplus cannot be withdrawn to a pocket. Payroll is the only path to
          an active member, capped at $100k / rolling year.
        </Note>
      </Section>
    </>
  );
}

function Board() {
  const { board, sequence } = useProduction();
  const [selectedId, setSelectedId] = useState<number | null>(
    sequence.shots[0]?.id ?? null,
  );
  const selected =
    selectedId != null ? sequence.shots.find((s) => s.id === selectedId) ?? null : null;

  return (
    <>
      <Section title="PRODUCTION BOARD">
        <Note>
          SHOTLIST plates and PRODEV crew write the same local sequence.
          Commit from here, or from those apps — CreditLedger is the log.
        </Note>
        <Grid>
          <Stat label="SEQUENCE" value={sequence.name} />
          <Stat
            label="PRODUCTION ID"
            value={board.productionId || "not opened"}
          />
        </Grid>
      </Section>
      <Section title="SHOTS">
        {sequence.shots.length === 0 ? (
          <Note>Open SHOTLIST and add a shot. It will appear here.</Note>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            {sequence.shots.map((shot, i) => {
              const on = shot.id === selectedId;
              return (
                <button
                  key={shot.id}
                  type="button"
                  onClick={() => setSelectedId(shot.id)}
                  style={{
                    textAlign: "left",
                    padding: "8px 10px",
                    background: on ? "#111100" : "#000",
                    color: on ? "#ffff00" : "#eee",
                    border: on ? "1px solid #ffff00" : "1px solid #333",
                    cursor: "pointer",
                    fontFamily: "inherit",
                    fontSize: 10,
                    letterSpacing: 1,
                  }}
                >
                  {String(i + 1).padStart(2, "0")} · {shot.title} · {shot.status} ·{" "}
                  {chainStatusLabel(shot)}
                </button>
              );
            })}
          </div>
        )}
      </Section>
      {selected && (
        <Section title={selected.title}>
          <ShotChainPanel shot={selected} />
        </Section>
      )}
    </>
  );
}

function Credits({ studio }: { studio: S }) {
  const { addresses, account, walletClient, send } = studio;
  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [prodUri, setProdUri] = useState("ipfs://");
  const [bps, setBps] = useState("500");
  const [productionId, setProductionId] = useState("");
  const [parentId, setParentId] = useState("0");
  const [branch, setBranch] = useState("main");
  const [uri, setUri] = useState("ipfs://");
  const [hashInput, setHashInput] = useState("");
  const [work, setWork] = useState("40");
  const [rows, setRows] = useState<CreditRow[]>([
    { account: "", role: "animator", weight: "1" },
    { account: "", role: "composer", weight: "1" },
  ]);
  const [shotId, setShotId] = useState("");

  const ready = Boolean(addresses && walletClient && account);

  const openProduction = () => {
    if (!addresses || !walletClient || !account) return;
    void send("openProduction", () =>
              walletClient.writeContract({
                ...callBase(studio),
        address: addresses.ledger,
        abi: creditLedgerAbi,
        functionName: "openProduction",
        args: [
          stringToHex(slug || title.slice(0, 32), { size: 32 }),
          title,
          prodUri,
          Number(bps),
          account,
        ],
      }),
    ).then(async (receipt) => {
      if (!receipt) return;
      const logs = parseEventLogs({
        abi: creditLedgerAbi,
        logs: receipt.logs,
        eventName: "ProductionOpened",
      });
      const id = logs[0]?.args?.productionId;
      if (id !== undefined) setProductionId(String(id));
    });
  };

  const commitShot = () => {
    if (!addresses || !walletClient || !account) return;
    const credits = rows
      .filter((r) => isAddress(r.account) && r.weight)
      .map((r) => ({
        account: r.account as HexAddr,
        role: stringToHex(r.role, { size: 32 }),
        weight: Number(r.weight),
        accepted: false,
      }));
    const contentHash =
      hashInput.startsWith("0x") && hashInput.length === 66
        ? (hashInput as `0x${string}`)
        : keccak256(toBytes(hashInput || uri));
    void send("commitShot", () =>
              walletClient.writeContract({
                ...callBase(studio),
        address: addresses.ledger,
        abi: creditLedgerAbi,
        functionName: "commitShot",
        args: [
          BigInt(productionId || "0"),
          BigInt(parentId || "0"),
          stringToHex(branch, { size: 32 }),
          contentHash,
          uri,
          Number(work),
          credits,
        ],
      }),
    ).then(async (receipt) => {
      if (!receipt) return;
      const logs = parseEventLogs({
        abi: creditLedgerAbi,
        logs: receipt.logs,
        eventName: "ShotCommitted",
      });
      const id = logs[0]?.args?.shotId;
      if (id !== undefined) setShotId(String(id));
    });
  };

  return (
    <>
      <Section title="OPEN PRODUCTION">
        <Grid>
          <Field label="SLUG" value={slug} onChange={setSlug} placeholder="demo-film" />
          <Field label="TITLE" value={title} onChange={setTitle} placeholder="Demo Film" />
          <Field label="METADATA URI" value={prodUri} onChange={setProdUri} />
          <Field label="DEFAULT ROYALTY BPS" value={bps} onChange={setBps} placeholder="500 = 5%" />
        </Grid>
        <Btn onClick={openProduction} disabled={!ready}>
          OPEN PRODUCTION
        </Btn>
      </Section>

      <Section title="COMMIT SHOT (git commit)">
        <Note>
          Named wallets must later ACCEPT their credit. Freeze only when they
          have signed — or force-freeze if a wallet is gone, which stays visible.
        </Note>
        <Grid>
          <Field label="PRODUCTION ID" value={productionId} onChange={setProductionId} />
          <Field label="PARENT SHOT (0 = original)" value={parentId} onChange={setParentId} />
          <Field label="BRANCH" value={branch} onChange={setBranch} />
          <Field label="WORK UNITS" value={work} onChange={setWork} />
          <Field label="METADATA URI" value={uri} onChange={setUri} />
          <Field
            label="CONTENT HASH (blank = hash of uri)"
            value={hashInput}
            onChange={setHashInput}
            placeholder="0x… or any string"
            mono
          />
        </Grid>
        {rows.map((row, i) => (
          <Grid key={i}>
            <Field
              label={`WALLET ${i + 1}`}
              value={row.account}
              onChange={(v) =>
                setRows((prev) => prev.map((r, j) => (j === i ? { ...r, account: v } : r)))
              }
              placeholder="0x…"
              mono
            />
            <Field
              label="ROLE"
              value={row.role}
              onChange={(v) =>
                setRows((prev) => prev.map((r, j) => (j === i ? { ...r, role: v } : r)))
              }
            />
            <Field
              label="WEIGHT"
              value={row.weight}
              onChange={(v) =>
                setRows((prev) => prev.map((r, j) => (j === i ? { ...r, weight: v } : r)))
              }
            />
          </Grid>
        ))}
        <div style={{ display: "flex", gap: 8 }}>
          <Btn
            onClick={() =>
              setRows((prev) => [...prev, { account: "", role: "", weight: "1" }])
            }
          >
            ADD CREDIT
          </Btn>
          <Btn onClick={commitShot} disabled={!ready}>
            COMMIT SHOT
          </Btn>
        </div>
      </Section>

      <Section title="ACCEPT / FREEZE">
        <Field label="SHOT ID" value={shotId} onChange={setShotId} />
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <Btn
            onClick={() => {
              if (!addresses || !walletClient || !account) return;
              void send("acceptCredit", () =>
              walletClient.writeContract({
                ...callBase(studio),
                  address: addresses.ledger,
                  abi: creditLedgerAbi,
                  functionName: "acceptCredit",
                  args: [BigInt(shotId || "0")],
                }),
              );
            }}
            disabled={!ready}
          >
            ACCEPT MY CREDIT
          </Btn>
          <Btn
            onClick={() => {
              if (!addresses || !walletClient || !account) return;
              void send("freezeShot", () =>
              walletClient.writeContract({
                ...callBase(studio),
                  address: addresses.ledger,
                  abi: creditLedgerAbi,
                  functionName: "freezeShot",
                  args: [BigInt(shotId || "0")],
                }),
              );
            }}
            disabled={!ready}
          >
            FREEZE (all accepted)
          </Btn>
          <Btn
            danger
            onClick={() => {
              if (!addresses || !walletClient || !account) return;
              void send("forceFreeze", () =>
              walletClient.writeContract({
                ...callBase(studio),
                  address: addresses.ledger,
                  abi: creditLedgerAbi,
                  functionName: "forceFreeze",
                  args: [BigInt(shotId || "0")],
                }),
              );
            }}
            disabled={!ready}
          >
            FORCE FREEZE
          </Btn>
        </div>
      </Section>
    </>
  );
}

function Mint({ studio }: { studio: S }) {
  const { addresses, account, walletClient, send, publicClient } = studio;
  const [shotId, setShotId] = useState("");
  const [to, setTo] = useState("");
  const [info, setInfo] = useState("");

  useEffect(() => {
    if (addresses && account && !to) setTo(addresses.treasury);
  }, [addresses, account, to]);

  const lookup = async () => {
    if (!addresses) return;
    const id = BigInt(shotId || "0");
    const [can, frozen, bps, uri] = await Promise.all([
      publicClient.readContract({
        address: addresses.ledger,
        abi: creditLedgerAbi,
        functionName: "canPublish",
        args: [id],
      }),
      publicClient.readContract({
        address: addresses.ledger,
        abi: creditLedgerAbi,
        functionName: "shotIsFrozen",
        args: [id],
      }),
      publicClient.readContract({
        address: addresses.ledger,
        abi: creditLedgerAbi,
        functionName: "royaltyBpsOf",
        args: [id],
      }),
      publicClient.readContract({
        address: addresses.ledger,
        abi: creditLedgerAbi,
        functionName: "uriOf",
        args: [id],
      }),
    ]);
    setInfo(
      `frozen=${frozen} canPublish=${can} royalty=${Number(bps) / 100}% uri=${uri}`,
    );
  };

  return (
    <Section title="PUBLISH CEL">
      <Note>
        Minting a Shot NFT is publishing a cel. The token usually lands in the
        vault. Aftermarket 5% goes to the credited team, not 5% each.
      </Note>
      <Grid>
        <Field label="SHOT ID" value={shotId} onChange={setShotId} />
        <Field
          label="MINT TO"
          value={to}
          onChange={setTo}
          placeholder="treasury"
          mono
        />
      </Grid>
      <div style={{ display: "flex", gap: 8 }}>
        <Btn onClick={() => void lookup()} disabled={!addresses}>
          LOOK UP
        </Btn>
        <Btn
          onClick={() => {
            if (!addresses || !walletClient || !account || !isAddress(to)) return;
            void send("publish", () =>
              walletClient.writeContract({
                ...callBase(studio),
                address: addresses.nft,
                abi: shotNFTAbi,
                functionName: "publish",
                args: [BigInt(shotId || "0"), to as HexAddr],
              }),
            );
          }}
          disabled={!addresses || !walletClient}
        >
          PUBLISH NFT
        </Btn>
      </div>
      {info && <Note>{info}</Note>}
    </Section>
  );
}

function Sale({ studio }: { studio: S }) {
  const { addresses, account, walletClient, send, publicClient, config } = studio;
  const [shotId, setShotId] = useState("");
  const [price, setPrice] = useState("1000");
  const [split, setSplit] = useState("");

  const preview = async () => {
    if (!addresses) return;
    const bps = await publicClient.readContract({
      address: addresses.ledger,
      abi: creditLedgerAbi,
      functionName: "royaltyBpsOf",
      args: [BigInt(shotId || "0")],
    });
    const sale = Number(price);
    const creator = (sale * Number(bps)) / 10_000;
    setSplit(
      `${Number(bps) / 100}% to credited team ($${creator.toFixed(2)}) · ${((10000 - Number(bps)) / 100).toFixed(2)}% to vault ($${(sale - creator).toFixed(2)})`,
    );
  };

  const approveAndSettle = async () => {
    if (!addresses || !walletClient || !account || !isAddress(config.paymentToken)) return;
    const token = config.paymentToken as HexAddr;
    const amount = parseUnits(price || "0", 6);
    await send("approve", () =>
              walletClient.writeContract({
                ...callBase(studio),
        address: token,
        abi: erc20Abi,
        functionName: "approve",
        args: [addresses.nft, amount],
      }),
    );
    await send("settleSale", () =>
              walletClient.writeContract({
                ...callBase(studio),
        address: addresses.nft,
        abi: shotNFTAbi,
        functionName: "settleSale",
        args: [BigInt(shotId || "0"), token, amount],
      }),
    );
  };

  return (
    <Section title="SETTLE SALE">
      <Note>
        Studio-run checkout for shot NFTs, cards, toys, merch. Always use this
        path so the 5% is actually paid. OpenSea may ignore ERC-2981.
      </Note>
      <Grid>
        <Field label="SHOT ID" value={shotId} onChange={setShotId} />
        <Field label="PRICE (USDC)" value={price} onChange={setPrice} />
      </Grid>
      <div style={{ display: "flex", gap: 8 }}>
        <Btn onClick={() => void preview()} disabled={!addresses}>
          PREVIEW SPLIT
        </Btn>
        <Btn
          onClick={() => void approveAndSettle()}
          disabled={!addresses || !walletClient}
        >
          APPROVE + SETTLE
        </Btn>
      </div>
      {split && <Note>{split}</Note>}
    </Section>
  );
}

function Books({ studio }: { studio: S }) {
  const { addresses, account, walletClient, send, config } = studio;
  const [kind, setKind] = useState("0");
  const [collection, setCollection] = useState("");
  const [projectId, setProjectId] = useState("402");
  const [label, setLabel] = useState("Juicebox V2 project 402");
  const [notes, setNotes] = useState("https://old.juicebox.money/v2/p/402");
  const [instrumentId, setInstrumentId] = useState("");
  const [amount, setAmount] = useState("1000");

  return (
    <>
      <Section title="REGISTER INSTRUMENT">
        <Note>
          Already-released NFTs and Juicebox 402 cannot be rewritten. Register
          them so proceeds count as company profit and hit the vault.
        </Note>
        <Grid>
          <SelectField
            label="KIND"
            value={kind}
            onChange={setKind}
            options={INSTRUMENT_KINDS.map((k, i) => ({ value: String(i), label: k }))}
          />
          <Field
            label="COLLECTION / JBPROJECTS"
            value={collection}
            onChange={setCollection}
            placeholder="0xD8e9d4cf0C2d464BC0759d1C1B8a99D7A4159b0F"
            mono
          />
          <Field label="PROJECT / TOKEN ID" value={projectId} onChange={setProjectId} />
          <Field label="LABEL" value={label} onChange={setLabel} />
          <Field label="NOTES URI" value={notes} onChange={setNotes} />
        </Grid>
        <Btn
          onClick={() => {
            if (!addresses || !walletClient || !account || !isAddress(collection)) return;
            void send("register", () =>
              walletClient.writeContract({
                ...callBase(studio),
                address: addresses.registry,
                abi: instrumentRegistryAbi,
                functionName: "register",
                args: [
                  {
                    kind: Number(kind),
                    chainId: BigInt(studio.config.chainId),
                    collection: collection as HexAddr,
                    projectOrTokenId: BigInt(projectId || "0"),
                    label,
                    notesUri: notes,
                    countsAsProfit: true,
                    registeredAt: BigInt(0),
                    registeredBy: "0x0000000000000000000000000000000000000000",
                  },
                ],
              }),
            );
          }}
          disabled={!addresses || !walletClient}
        >
          REGISTER
        </Btn>
      </Section>

      <Section title="ROUTE PROCEEDS">
        <Grid>
          <Field label="INSTRUMENT ID" value={instrumentId} onChange={setInstrumentId} />
          <Field label="AMOUNT (USDC)" value={amount} onChange={setAmount} />
        </Grid>
        <Btn
          onClick={async () => {
            if (!addresses || !walletClient || !account || !isAddress(config.paymentToken))
              return;
            const token = config.paymentToken as HexAddr;
            const amt = parseUnits(amount || "0", 6);
            await send("approve treasury", () =>
              walletClient.writeContract({
                ...callBase(studio),
                address: token,
                abi: erc20Abi,
                functionName: "approve",
                args: [addresses.treasury, amt],
              }),
            );
            await send("routeProceeds", () =>
              walletClient.writeContract({
                ...callBase(studio),
                address: addresses.registry,
                abi: instrumentRegistryAbi,
                functionName: "routeProceeds",
                args: [BigInt(instrumentId || "0"), token, amt],
              }),
            );
          }}
          disabled={!addresses || !walletClient}
        >
          APPROVE + ROUTE TO VAULT
        </Btn>
      </Section>
    </>
  );
}

function Counsel() {
  const [copied, setCopied] = useState(false);
  const text = COUNSEL_SECTIONS.map((s) => `${s.title}\n\n${s.body}`).join("\n\n");
  return (
    <Section title="FOR COUNSEL">
      <Note>
        This is a briefing, not a signed agreement. Give it to a lawyer with
        the Solidity in contracts/ and docs/PRODUCTION_PROTOCOL.md.
      </Note>
      <Btn
        onClick={async () => {
          await navigator.clipboard.writeText(text);
          setCopied(true);
        }}
      >
        {copied ? "COPIED" : "COPY BRIEFING"}
      </Btn>
      {COUNSEL_SECTIONS.map((s) => (
        <div key={s.title} style={{ border: "1px solid #333", padding: 12 }}>
          <div
            style={{
              fontSize: 10,
              letterSpacing: 1,
              marginBottom: 8,
              color: "#fff",
            }}
          >
            {s.title.toUpperCase()}
          </div>
          <p style={{ fontSize: 10, color: "#ccc", lineHeight: 1.55, margin: 0 }}>
            {s.body}
          </p>
        </div>
      ))}
    </Section>
  );
}

export default StudioApp;
