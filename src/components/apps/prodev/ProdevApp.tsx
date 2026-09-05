"use client";

/*
 * PRODEV — production spreadsheet.
 * Same board as SHOTLIST. This view is crew, hours, tasks, and vault —
 * not plates. Chain writes go through ShotChainPanel (CreditLedger).
 */

import React, { useCallback, useEffect, useMemo, useState } from "react";
import { formatUnits, isAddress } from "viem";
import { studioTreasuryAbi } from "@/lib/studio/abi";
import { type HexAddr } from "@/lib/studio/config";
import { useStudio } from "@/lib/studio/useStudio";
import { newTaskId, useProduction, type TaskItem, type TaskStatus } from "@/lib/production";
import {
  chainStatusLabel,
  type Shot,
  type ShotStatus,
} from "@/components/apps/shotlist/shotlistShared";
import { ShotChainPanel } from "@/components/apps/production/ShotChainPanel";
import { Btn, Field, Grid, Note, Section, Stat, TabBar } from "@/components/apps/studio/ui";

const TABS = [
  { id: "board", label: "BOARD" },
  { id: "crew", label: "CREW" },
  { id: "tasks", label: "TASKS" },
  { id: "vault", label: "VAULT" },
];

const SHOT_STATUSES: ShotStatus[] = ["draft", "review", "approved"];
const TASK_STATUSES: TaskStatus[] = ["todo", "in-progress", "done"];

const font = "var(--dm-font-primary)";

const th: React.CSSProperties = {
  fontFamily: font,
  fontSize: 8,
  color: "#888",
  letterSpacing: 1,
  textAlign: "left",
  padding: "6px 8px",
  borderBottom: "1px solid #333",
  fontWeight: "normal",
};

const td: React.CSSProperties = {
  fontFamily: font,
  fontSize: 10,
  color: "#eee",
  padding: "6px 8px",
  borderBottom: "1px solid #222",
  verticalAlign: "middle",
};

export function ProdevApp() {
  const { board, setBoard, sequence, setSequence, patchShot } = useProduction();
  const [tab, setTab] = useState("board");
  const [selectedId, setSelectedId] = useState<number | null>(
    sequence.shots[0]?.id ?? null,
  );

  const selected =
    selectedId != null ? sequence.shots.find((s) => s.id === selectedId) ?? null : null;

  return (
    <div
      style={{
        height: "100%",
        display: "flex",
        flexDirection: "column",
        background: "#000",
        color: "#fff",
        fontFamily: font,
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
          <div style={{ fontSize: 11, letterSpacing: 2 }}>PRODEV</div>
          <div style={{ fontSize: 8, color: "#888", letterSpacing: 1 }}>
            BOARD · CREW · TASKS · VAULT · SAME SEQUENCE AS SHOTLIST
          </div>
        </div>
        <div style={{ fontSize: 9, color: "#888" }}>
          {sequence.shots.length} SHOTS
          {board.productionId ? ` · PROD #${board.productionId}` : " · LOCAL"}
        </div>
      </header>
      <TabBar tabs={TABS} current={tab} onChange={setTab} />
      <div style={{ flex: 1, overflow: "auto", padding: 14, display: "flex", flexDirection: "column", gap: 16 }}>
        {tab === "board" && (
          <BoardTab
            sequenceName={sequence.name}
            shots={sequence.shots}
            selected={selected}
            selectedId={selectedId}
            onSelect={setSelectedId}
            onName={(name) => setSequence((s) => ({ ...s, name }))}
            onPatch={patchShot}
          />
        )}
        {tab === "crew" && <CrewTab shots={sequence.shots} />}
        {tab === "tasks" && (
          <TasksTab
            tasks={board.tasks}
            shots={sequence.shots}
            onTasks={(tasks) => setBoard((b) => ({ ...b, tasks }))}
          />
        )}
        {tab === "vault" && <VaultTab />}
      </div>
    </div>
  );
}

function BoardTab({
  sequenceName,
  shots,
  selected,
  selectedId,
  onSelect,
  onName,
  onPatch,
}: {
  sequenceName: string;
  shots: Shot[];
  selected: Shot | null;
  selectedId: number | null;
  onSelect: (id: number) => void;
  onName: (name: string) => void;
  onPatch: (id: number, patch: Partial<Shot>) => void;
}) {
  return (
    <>
      <Section title="SEQUENCE">
        <Field label="NAME" value={sequenceName} onChange={onName} />
        <Note>
          Plates and X-sheets live in SHOTLIST. Edit title, status, hours, and
          credits here — both apps share one local board.
        </Note>
      </Section>
      <Section title="SHOTS">
        {shots.length === 0 ? (
          <Note>No shots yet. Open SHOTLIST and add one.</Note>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr>
                  <th style={th}>#</th>
                  <th style={th}>TITLE</th>
                  <th style={th}>STATUS</th>
                  <th style={th}>FRAMES</th>
                  <th style={th}>HRS</th>
                  <th style={th}>CHAIN</th>
                  <th style={th}>CREW</th>
                </tr>
              </thead>
              <tbody>
                {shots.map((shot, i) => {
                  const hours = shot.credits.reduce(
                    (n, c) => n + (Number(c.hours) || 0),
                    0,
                  );
                  const on = shot.id === selectedId;
                  return (
                    <tr
                      key={shot.id}
                      onClick={() => onSelect(shot.id)}
                      style={{
                        cursor: "pointer",
                        background: on ? "#111100" : "transparent",
                      }}
                    >
                      <td style={td}>{String(i + 1).padStart(2, "0")}</td>
                      <td style={td}>{shot.title}</td>
                      <td style={td}>
                        <select
                          value={shot.status}
                          onClick={(e) => e.stopPropagation()}
                          onChange={(e) =>
                            onPatch(shot.id, { status: e.target.value as ShotStatus })
                          }
                          style={{
                            fontFamily: font,
                            fontSize: 10,
                            background: "#000",
                            color: "#eee",
                            border: "1px solid #444",
                            borderRadius: 0,
                          }}
                        >
                          {SHOT_STATUSES.map((s) => (
                            <option key={s} value={s}>
                              {s}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td style={td}>{shot.durationFrames}</td>
                      <td style={td}>{hours || "—"}</td>
                      <td style={{ ...td, color: shot.chain?.ledgerShotId ? "#ffff00" : "#888" }}>
                        {chainStatusLabel(shot)}
                      </td>
                      <td style={td}>
                        {shot.credits.filter((c) => c.account).length || "—"}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Section>
      {selected && (
        <Section title={`SHOT ${selected.title}`}>
          <Grid>
            <Field
              label="TITLE"
              value={selected.title}
              onChange={(v) => onPatch(selected.id, { title: v })}
            />
            <Field
              label="DESCRIPTION"
              value={selected.description}
              onChange={(v) => onPatch(selected.id, { description: v })}
            />
          </Grid>
          <ShotChainPanel shot={selected} />
        </Section>
      )}
    </>
  );
}

function CrewTab({ shots }: { shots: Shot[] }) {
  const rows = useMemo(() => rollupCrew(shots), [shots]);
  const totalWeight = rows.reduce((n, r) => n + r.weight, 0) || 1;
  return (
    <Section title="CREW ROLLUP">
      <Note>
        Weight is the royalty split (5% of the shot, shared). Hours are local
        until COMMIT SHOT writes workUnits.
      </Note>
      {rows.length === 0 ? (
        <Note>No credited wallets yet. Add them on BOARD or in SHOTLIST.</Note>
      ) : (
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr>
              <th style={th}>WALLET</th>
              <th style={th}>ROLES</th>
              <th style={th}>SHOTS</th>
              <th style={th}>HRS</th>
              <th style={th}>WEIGHT</th>
              <th style={th}>SHARE</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.account}>
                <td style={{ ...td, fontSize: 9 }}>{row.account}</td>
                <td style={td}>{row.roles.join(", ")}</td>
                <td style={td}>{row.shots}</td>
                <td style={td}>{row.hours}</td>
                <td style={td}>{row.weight}</td>
                <td style={td}>{((row.weight / totalWeight) * 100).toFixed(1)}%</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </Section>
  );
}

function rollupCrew(shots: Shot[]) {
  const map = new Map<
    string,
    { account: string; roles: string[]; shots: number; hours: number; weight: number }
  >();
  for (const shot of shots) {
    const seen = new Set<string>();
    for (const c of shot.credits) {
      if (!c.account) continue;
      const key = c.account.toLowerCase();
      const row = map.get(key) ?? {
        account: c.account,
        roles: [],
        shots: 0,
        hours: 0,
        weight: 0,
      };
      if (c.role && !row.roles.includes(c.role)) row.roles.push(c.role);
      row.hours += Number(c.hours) || 0;
      row.weight += Number(c.weight) || 0;
      if (!seen.has(key)) {
        row.shots += 1;
        seen.add(key);
      }
      map.set(key, row);
    }
  }
  return Array.from(map.values());
}

function TasksTab({
  tasks,
  shots,
  onTasks,
}: {
  tasks: TaskItem[];
  shots: Shot[];
  onTasks: (tasks: TaskItem[]) => void;
}) {
  const patch = (id: string, patch: Partial<TaskItem>) =>
    onTasks(tasks.map((t) => (t.id === id ? { ...t, ...patch } : t)));

  return (
    <Section title="TASKS">
      <Note>
        Extra work that is not a plate — pickup, temp audio, legal. Link a
        shot when it belongs to one.
      </Note>
      <Btn
        onClick={() =>
          onTasks([
            ...tasks,
            {
              id: newTaskId(),
              title: "NEW TASK",
              status: "todo",
              owner: "",
              hours: "0",
              shotId: null,
            },
          ])
        }
      >
        ADD TASK
      </Btn>
      {tasks.length === 0 ? (
        <Note>No tasks.</Note>
      ) : (
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr>
              <th style={th}>TITLE</th>
              <th style={th}>STATUS</th>
              <th style={th}>OWNER</th>
              <th style={th}>HRS</th>
              <th style={th}>SHOT</th>
              <th style={th} />
            </tr>
          </thead>
          <tbody>
            {tasks.map((task) => (
              <tr key={task.id}>
                <td style={td}>
                  <input
                    value={task.title}
                    onChange={(e) => patch(task.id, { title: e.target.value })}
                    style={cellInput}
                  />
                </td>
                <td style={td}>
                  <select
                    value={task.status}
                    onChange={(e) =>
                      patch(task.id, { status: e.target.value as TaskStatus })
                    }
                    style={cellInput}
                  >
                    {TASK_STATUSES.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                </td>
                <td style={td}>
                  <input
                    value={task.owner}
                    onChange={(e) => patch(task.id, { owner: e.target.value })}
                    placeholder="name or 0x…"
                    style={cellInput}
                  />
                </td>
                <td style={td}>
                  <input
                    value={task.hours}
                    onChange={(e) => patch(task.id, { hours: e.target.value })}
                    style={{ ...cellInput, width: 64 }}
                  />
                </td>
                <td style={td}>
                  <select
                    value={task.shotId == null ? "" : String(task.shotId)}
                    onChange={(e) =>
                      patch(task.id, {
                        shotId: e.target.value ? Number(e.target.value) : null,
                      })
                    }
                    style={cellInput}
                  >
                    <option value="">—</option>
                    {shots.map((s, i) => (
                      <option key={s.id} value={s.id}>
                        {String(i + 1).padStart(2, "0")} {s.title}
                      </option>
                    ))}
                  </select>
                </td>
                <td style={td}>
                  <button
                    type="button"
                    onClick={() => onTasks(tasks.filter((t) => t.id !== task.id))}
                    style={{
                      background: "#000",
                      color: "#888",
                      border: "1px solid #444",
                      cursor: "pointer",
                      fontFamily: font,
                    }}
                  >
                    ×
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </Section>
  );
}

const cellInput: React.CSSProperties = {
  fontFamily: font,
  fontSize: 10,
  color: "#eee",
  background: "#000",
  border: "1px solid #333",
  borderRadius: 0,
  padding: "4px 6px",
  width: "100%",
  boxSizing: "border-box",
};

function VaultTab() {
  const studio = useStudio();
  const { addresses, config, publicClient, busy, loadKit } = studio;
  const [surplus, setSurplus] = useState("—");
  const [hire, setHire] = useState("—");
  const [capLeft, setCapLeft] = useState("—");

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
      <Section title="VAULT">
        <Note>
          Payroll only. Surplus stays locked. Load a StudioKit in STUDIO (or
          here) to read live numbers.
        </Note>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <Btn onClick={() => void studio.connect()} disabled={busy}>
            {studio.account ? "CONNECTED" : "CONNECT"}
          </Btn>
          <Btn onClick={() => void loadKit()} disabled={busy}>
            LOAD KIT
          </Btn>
          <Btn onClick={() => void refresh()} disabled={busy || !addresses}>
            REFRESH
          </Btn>
        </div>
        <Grid>
          <Stat label="LOCKED SURPLUS" value={`${surplus} USDC`} />
          <Stat label="HIRE BUDGET" value={`${hire} USDC`} />
          <Stat label="YOUR REMAINING CAP" value={`${capLeft} USD`} />
        </Grid>
        {studio.error && (
          <div style={{ fontSize: 9, color: "#ff6666" }}>{studio.error}</div>
        )}
      </Section>
    </>
  );
}
