"use client";

/*
 * Credits + CreditLedger actions for one local shot.
 * Used by SHOTLIST (expanded row), PRODEV (detail), and STUDIO (board).
 */

import React, { useMemo } from "react";
import {
  isAddress,
  keccak256,
  parseEventLogs,
  stringToHex,
  toBytes,
} from "viem";
import { creditLedgerAbi } from "@/lib/studio/abi";
import { type HexAddr } from "@/lib/studio/config";
import { useStudio } from "@/lib/studio/useStudio";
import { loadBoard, useProduction } from "@/lib/production";
import {
  chainStatusLabel,
  emptyCredit,
  fieldStyle,
  type Shot,
  type ShotChain,
  type ShotCredit,
} from "@/components/apps/shotlist/shotlistShared";
import { Btn, Field, Note } from "@/components/apps/studio/ui";

function callBase(studio: ReturnType<typeof useStudio>) {
  if (!studio.account) throw new Error("Connect a wallet first.");
  return { account: studio.account, chain: studio.chain };
}

function workUnitsOf(shot: Shot): number {
  if (shot.chain?.workUnits) return Number(shot.chain.workUnits) || 0;
  const hours = shot.credits.reduce((n, c) => n + (Number(c.hours) || 0), 0);
  return Math.round(hours * 100);
}

function withChain(shot: Shot, patch: Partial<ShotChain>): ShotChain {
  return {
    ledgerShotId: shot.chain?.ledgerShotId ?? "",
    parentShotId: shot.chain?.parentShotId ?? "0",
    branch: shot.chain?.branch ?? "main",
    workUnits: shot.chain?.workUnits ?? String(workUnitsOf(shot)),
    frozen: shot.chain?.frozen ?? false,
    published: shot.chain?.published ?? false,
    ...patch,
  };
}

export function ShotChainPanel({ shot }: { shot: Shot }) {
  const studio = useStudio();
  const { board, setBoard, patchShot } = useProduction();

  const credits = shot.credits.length > 0 ? shot.credits : [emptyCredit()];
  const chain = shot.chain;
  const ready = Boolean(studio.walletClient && studio.account);
  const ledgerId = chain?.ledgerShotId;

  const setCredits = (next: ShotCredit[]) => patchShot(shot.id, { credits: next });
  const patchCredit = (i: number, patch: Partial<ShotCredit>) =>
    setCredits(credits.map((c, j) => (j === i ? { ...c, ...patch } : c)));

  const contentSource = useMemo(
    () => shot.thumbnail || `${shot.title}:${shot.id}:${shot.description}`,
    [shot.thumbnail, shot.title, shot.id, shot.description],
  );

  const resolveAddresses = async () =>
    studio.addresses ?? (await studio.loadKit());

  const openProduction = async () => {
    const addresses = await resolveAddresses();
    if (!addresses || !studio.walletClient || !studio.account) return;
    const slug = board.slug || board.sequence.name.slice(0, 32);
    const receipt = await studio.send("openProduction", () =>
      studio.walletClient!.writeContract({
        ...callBase(studio),
        address: addresses.ledger,
        abi: creditLedgerAbi,
        functionName: "openProduction",
        args: [
          stringToHex(slug, { size: 32 }),
          board.sequence.name || "UNTITLED SEQUENCE",
          `kos://shotlist/${board.sequence.id}`,
          Number(board.defaultRoyaltyBps || "500"),
          studio.account!,
        ],
      }),
    );
    if (!receipt) return;
    const logs = parseEventLogs({
      abi: creditLedgerAbi,
      logs: receipt.logs,
      eventName: "ProductionOpened",
    });
    const id = logs[0]?.args?.productionId;
    if (id !== undefined) {
      setBoard((prev) => ({
        ...prev,
        productionId: String(id),
        slug,
      }));
    }
  };

  const commitShot = async () => {
    const addresses = await resolveAddresses();
    if (!addresses || !studio.walletClient || !studio.account) return;
    let pid = board.productionId.trim();
    if (!pid) {
      await openProduction();
      pid = loadBoard().productionId.trim();
    }
    if (!pid) return;
    const rows = credits.filter((r) => isAddress(r.account) && Number(r.weight) > 0);
    if (rows.length === 0) return;
    const work = workUnitsOf({ ...shot, credits });
    const receipt = await studio.send("commitShot", () =>
      studio.walletClient!.writeContract({
        ...callBase(studio),
        address: addresses.ledger,
        abi: creditLedgerAbi,
        functionName: "commitShot",
        args: [
          BigInt(pid),
          BigInt(chain?.parentShotId || "0"),
          stringToHex(chain?.branch || "main", { size: 32 }),
          keccak256(toBytes(contentSource)),
          `kos://shot/${shot.id}`,
          work,
          rows.map((r) => ({
            account: r.account as HexAddr,
            role: stringToHex(r.role || "crew", { size: 32 }),
            weight: Number(r.weight),
            accepted: false,
          })),
        ],
      }),
    );
    if (!receipt) return;
    const logs = parseEventLogs({
      abi: creditLedgerAbi,
      logs: receipt.logs,
      eventName: "ShotCommitted",
    });
    const id = logs[0]?.args?.shotId;
    if (id === undefined) return;
    patchShot(shot.id, {
      credits,
      chain: withChain(shot, {
        ledgerShotId: String(id),
        workUnits: String(work),
        frozen: false,
        published: false,
      }),
    });
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 8 }}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          gap: 8,
          fontSize: 9,
          letterSpacing: 1,
          color: "#888",
        }}
      >
        <span>CREDITS · {chainStatusLabel(shot)}</span>
        <span>{studio.account ? `${studio.account.slice(0, 6)}…` : "NO WALLET"}</span>
      </div>
      <Note>
        Same crew list as PRODEV. Commit writes CreditLedger. Named wallets
        must ACCEPT before freeze.
      </Note>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
        <Field
          label="PRODUCTION ID"
          value={board.productionId}
          onChange={(v) => setBoard((p) => ({ ...p, productionId: v }))}
          placeholder="open first"
        />
        <Field
          label="SLUG"
          value={board.slug}
          onChange={(v) => setBoard((p) => ({ ...p, slug: v }))}
          placeholder="demo-film"
        />
        <Field
          label="BRANCH"
          value={chain?.branch ?? "main"}
          onChange={(v) => patchShot(shot.id, { chain: withChain(shot, { branch: v }) })}
        />
        <Field
          label="WORK UNITS (hours×100)"
          value={chain?.workUnits ?? String(workUnitsOf(shot))}
          onChange={(v) =>
            patchShot(shot.id, { chain: withChain(shot, { workUnits: v }) })
          }
        />
      </div>
      {credits.map((row, i) => (
        <div
          key={i}
          style={{
            display: "grid",
            gridTemplateColumns: "2fr 1fr 70px 70px 28px",
            gap: 6,
            alignItems: "end",
          }}
        >
          <label style={{ fontSize: 9, color: "#666", letterSpacing: 1 }}>
            WALLET
            <input
              value={row.account}
              onChange={(e) => patchCredit(i, { account: e.target.value })}
              placeholder="0x…"
              spellCheck={false}
              style={fieldStyle}
            />
          </label>
          <label style={{ fontSize: 9, color: "#666", letterSpacing: 1 }}>
            ROLE
            <input
              value={row.role}
              onChange={(e) => patchCredit(i, { role: e.target.value })}
              style={fieldStyle}
            />
          </label>
          <label style={{ fontSize: 9, color: "#666", letterSpacing: 1 }}>
            WT
            <input
              value={row.weight}
              onChange={(e) => patchCredit(i, { weight: e.target.value })}
              style={fieldStyle}
            />
          </label>
          <label style={{ fontSize: 9, color: "#666", letterSpacing: 1 }}>
            HRS
            <input
              value={row.hours}
              onChange={(e) => patchCredit(i, { hours: e.target.value })}
              style={fieldStyle}
            />
          </label>
          <button
            type="button"
            onClick={() => setCredits(credits.filter((_, j) => j !== i))}
            style={{
              height: 28,
              background: "#000",
              color: "#888",
              border: "1px solid #444",
              cursor: "pointer",
              fontFamily: "inherit",
            }}
          >
            ×
          </button>
        </div>
      ))}
      <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
        <Btn onClick={() => setCredits([...credits, emptyCredit("")])}>ADD CREDIT</Btn>
        <Btn onClick={() => void studio.connect()} disabled={studio.busy}>
          {studio.account ? "CONNECTED" : "CONNECT"}
        </Btn>
        <Btn onClick={() => void openProduction()} disabled={!ready || studio.busy}>
          OPEN PRODUCTION
        </Btn>
        <Btn onClick={() => void commitShot()} disabled={!ready || studio.busy}>
          COMMIT SHOT
        </Btn>
        <Btn
          onClick={() => {
            if (!studio.addresses || !studio.walletClient || !ledgerId) return;
            void studio.send("acceptCredit", () =>
              studio.walletClient!.writeContract({
                ...callBase(studio),
                address: studio.addresses!.ledger,
                abi: creditLedgerAbi,
                functionName: "acceptCredit",
                args: [BigInt(ledgerId)],
              }),
            );
          }}
          disabled={!ready || !ledgerId}
        >
          ACCEPT
        </Btn>
        <Btn
          onClick={() => {
            if (!studio.addresses || !studio.walletClient || !ledgerId) return;
            void studio.send("freezeShot", () =>
              studio.walletClient!.writeContract({
                ...callBase(studio),
                address: studio.addresses!.ledger,
                abi: creditLedgerAbi,
                functionName: "freezeShot",
                args: [BigInt(ledgerId)],
              }),
            ).then((receipt) => {
              if (!receipt || !chain) return;
              patchShot(shot.id, { chain: { ...chain, frozen: true } });
            });
          }}
          disabled={!ready || !ledgerId}
        >
          FREEZE
        </Btn>
      </div>
      {(studio.error || studio.status) && (
        <div style={{ fontSize: 9, color: studio.error ? "#ff6666" : "#888" }}>
          {studio.error || studio.status}
        </div>
      )}
    </div>
  );
}
