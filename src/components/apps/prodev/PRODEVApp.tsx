"use client";

/*
 *                    ☦
 *            ╔══════════════════╗
 *            ║  K-OS III        ║
 *            ║  PRODEV          ║
 *            ╚══════════════════╝
 *
 *   Production credits & residuals — the real implementation of
 *   prodev/src/core/types.ts's Project/Shot/ChecklistItem skeleton, wired
 *   to real K-OS identity. See docs/ACCOUNTS_SPEC.md § 4 / § 4.2.
 *
 *   K-OS only ever computes/attests the credit split here — nothing in this
 *   app moves money (docs/ACCOUNTS_SPEC.md § 4, § 1's "never take custody"
 *   constraint). Actual payout is a deliberately separate, later phase.
 */

import { useEffect, useState, useCallback } from "react";
import { safeFetchJson } from "@/lib/safeFetchJson";

interface ProjectSummary {
  id: number;
  name: string;
  owner_id: number;
  role: string;
}

interface Member {
  user_id: number;
  role: string;
  display_name: string | null;
}

interface Shot {
  id: number;
  title: string;
  sort_order: number;
}

interface ProjectDetail {
  id: number;
  name: string;
  owner_id: number;
  members: Member[];
  shots: Shot[];
}

interface ChecklistItemRow {
  id: number;
  parent_id: number | null;
  title: string;
  status: "todo" | "in-progress" | "done";
  owner_id: number | null;
  owner_name: string | null;
  hours: number;
  contribution_percent: number;
  sort_order: number;
  assets: string[];
  scheduled_at: string | null;
  completed_at: string | null;
}

interface TimeEntry {
  id: number;
  user_id: number;
  user_name: string | null;
  clock_in: string;
  clock_out: string | null;
}

interface Credit {
  user_id: number;
  percent: number;
  display_name: string | null;
}

interface SearchResult {
  user_id: number;
  display_name: string | null;
  matrix_id: string;
}

const panel: React.CSSProperties = {
  border: "1px solid #333",
  background: "#0a0a0a",
};

const smallBtn: React.CSSProperties = {
  height: 20,
  padding: "0 8px",
  border: "1px solid #555",
  background: "#000",
  color: "#ccc",
  fontFamily: "var(--dm-font-primary)",
  fontSize: 7,
  letterSpacing: 1,
  cursor: "pointer",
};

const smallField: React.CSSProperties = {
  height: 20,
  background: "#000",
  color: "#fff",
  border: "1px solid #555",
  fontFamily: "var(--dm-font-primary)",
  fontSize: 8,
  padding: "0 6px",
  boxSizing: "border-box",
  outline: "none",
};

/** "3H EARLY" / "1D 2H LATE" — null if either timestamp is missing. */
function formatEarlyLate(scheduledAt: string | null, completedAt: string | null): { text: string; late: boolean } | null {
  if (!scheduledAt || !completedAt) return null;
  const diffMs = new Date(completedAt).getTime() - new Date(scheduledAt).getTime();
  const late = diffMs > 0;
  const absMin = Math.round(Math.abs(diffMs) / 60000);
  const days = Math.floor(absMin / 1440);
  const hours = Math.floor((absMin % 1440) / 60);
  const mins = absMin % 60;
  const parts = [days ? `${days}D` : null, hours ? `${hours}H` : null, !days && mins ? `${mins}M` : null].filter(Boolean);
  const text = `${parts.length ? parts.join(" ") : "0M"} ${late ? "LATE" : "EARLY"}`;
  return { text, late };
}

function formatHoursMinutes(totalSeconds: number): string {
  const totalMin = Math.round(totalSeconds / 60);
  const h = Math.floor(totalMin / 60);
  const m = totalMin % 60;
  return `${h}H ${m}M`;
}

/** <input type="datetime-local"> wants "YYYY-MM-DDTHH:mm" in local time, not an ISO string. */
function toDatetimeLocal(iso: string | null): string {
  if (!iso) return "";
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

const STATUS_LABEL: Record<ChecklistItemRow["status"], string> = {
  todo: "TODO",
  "in-progress": "DOING",
  done: "DONE",
};
const STATUS_COLOR: Record<ChecklistItemRow["status"], string> = {
  todo: "#666",
  "in-progress": "#00ff00",
  done: "#00ff88",
};

interface ShotlistSequenceSummary {
  id: number;
  name: string;
  fps: number;
}

interface PRODEVAppProps {
  /** Open Shotlist pre-loaded with this saved sequence. */
  onOpenShotlistSequence?: (sequenceId: number) => void;
}

export function PRODEVApp({ onOpenShotlistSequence }: PRODEVAppProps = {}) {
  const [projects, setProjects] = useState<ProjectSummary[]>([]);
  const [loadingProjects, setLoadingProjects] = useState(true);
  const [newProjectName, setNewProjectName] = useState("");

  const [selectedProjectId, setSelectedProjectId] = useState<number | null>(null);
  const [project, setProject] = useState<ProjectDetail | null>(null);
  const [newShotTitle, setNewShotTitle] = useState("");
  const [memberSearch, setMemberSearch] = useState("");
  const [memberResults, setMemberResults] = useState<SearchResult[]>([]);

  const [selectedShotId, setSelectedShotId] = useState<number | null>(null);
  const [items, setItems] = useState<ChecklistItemRow[]>([]);
  const [credits, setCredits] = useState<Credit[]>([]);
  const [creditDraft, setCreditDraft] = useState<Record<number, string>>({});
  const [creditMsg, setCreditMsg] = useState<string | null>(null);

  const [myUserId, setMyUserId] = useState<number | null>(null);
  const [detailItemId, setDetailItemId] = useState<number | null>(null);
  const [scheduleDraft, setScheduleDraft] = useState("");
  const [timeEntries, setTimeEntries] = useState<{ entries: TimeEntry[]; totalSeconds: number } | null>(null);
  const [clockBusy, setClockBusy] = useState(false);

  useEffect(() => {
    safeFetchJson<{ user?: { id?: string } }>("/api/auth/session").then((data) => {
      const id = data?.user?.id;
      setMyUserId(id ? Number(id) : null);
    });
  }, []);

  const loadProjects = useCallback(async () => {
    setLoadingProjects(true);
    const res = await fetch("/api/prodev/projects");
    if (res.ok) setProjects((await res.json()) as ProjectSummary[]);
    setLoadingProjects(false);
  }, []);

  useEffect(() => {
    loadProjects();
  }, [loadProjects]);

  const loadProject = useCallback(async (id: number) => {
    const res = await fetch(`/api/prodev/projects/${id}`);
    if (res.ok) setProject((await res.json()) as ProjectDetail);
  }, []);

  useEffect(() => {
    if (selectedProjectId != null) loadProject(selectedProjectId);
    else setProject(null);
  }, [selectedProjectId, loadProject]);

  const [linkedSequences, setLinkedSequences] = useState<ShotlistSequenceSummary[]>([]);
  useEffect(() => {
    if (selectedProjectId == null) {
      setLinkedSequences([]);
      return;
    }
    safeFetchJson<ShotlistSequenceSummary[]>(`/api/shotlist/sequences?projectId=${selectedProjectId}`).then(
      (data) => setLinkedSequences(data ?? []),
    );
  }, [selectedProjectId]);

  const loadItems = useCallback(async (shotId: number) => {
    const res = await fetch(`/api/prodev/checklist-items?shotId=${shotId}`);
    if (res.ok) setItems((await res.json()) as ChecklistItemRow[]);
  }, []);

  const loadCredits = useCallback(async (shotId: number) => {
    const res = await fetch(`/api/prodev/shots/${shotId}/credits`);
    if (res.ok) {
      const rows = (await res.json()) as Credit[];
      setCredits(rows);
      setCreditDraft(Object.fromEntries(rows.map((r) => [r.user_id, String(r.percent)])));
    }
  }, []);

  useEffect(() => {
    if (selectedShotId != null) {
      loadItems(selectedShotId);
      loadCredits(selectedShotId);
    } else {
      setItems([]);
      setCredits([]);
    }
  }, [selectedShotId, loadItems, loadCredits]);

  async function createProject(e: React.FormEvent) {
    e.preventDefault();
    if (!newProjectName.trim()) return;
    const res = await fetch("/api/prodev/projects", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: newProjectName.trim() }),
    });
    if (res.ok) {
      setNewProjectName("");
      await loadProjects();
    }
  }

  async function createShot(e: React.FormEvent) {
    e.preventDefault();
    if (!project || !newShotTitle.trim()) return;
    const res = await fetch("/api/prodev/shots", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ projectId: project.id, title: newShotTitle.trim() }),
    });
    if (res.ok) {
      setNewShotTitle("");
      await loadProject(project.id);
    }
  }

  async function searchMembers(q: string) {
    setMemberSearch(q);
    if (!q.trim()) {
      setMemberResults([]);
      return;
    }
    const res = await fetch(`/api/users/search?q=${encodeURIComponent(q)}`);
    if (res.ok) setMemberResults((await res.json()) as SearchResult[]);
  }

  async function addMember(userId: number) {
    if (!project) return;
    const res = await fetch(`/api/prodev/projects/${project.id}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId }),
    });
    if (res.ok) {
      setMemberSearch("");
      setMemberResults([]);
      await loadProject(project.id);
    }
  }

  async function addItem(parentId: number | null) {
    if (!selectedShotId) return;
    const title = window.prompt(parentId ? "Sub-item title:" : "Checklist item title:");
    if (!title?.trim()) return;
    const res = await fetch("/api/prodev/checklist-items", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ shotId: selectedShotId, parentId, title: title.trim() }),
    });
    if (res.ok) await loadItems(selectedShotId);
  }

  async function patchItem(id: number, patch: Record<string, unknown>) {
    await fetch(`/api/prodev/checklist-items/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(patch),
    });
    if (selectedShotId) await loadItems(selectedShotId);
  }

  async function deleteItem(id: number) {
    await fetch(`/api/prodev/checklist-items/${id}`, { method: "DELETE" });
    if (selectedShotId) await loadItems(selectedShotId);
  }

  function cycleStatus(item: ChecklistItemRow) {
    const order: ChecklistItemRow["status"][] = ["todo", "in-progress", "done"];
    const next = order[(order.indexOf(item.status) + 1) % order.length];
    patchItem(item.id, { status: next });
  }

  function openDetail(item: ChecklistItemRow) {
    setDetailItemId(item.id);
    setScheduleDraft(toDatetimeLocal(item.scheduled_at));
    setTimeEntries(null);
    loadTimeEntries(item.id);
  }

  async function loadTimeEntries(itemId: number) {
    const data = await safeFetchJson<{ entries: TimeEntry[]; totalSeconds: number }>(
      `/api/prodev/time-entries?checklistItemId=${itemId}`,
    );
    setTimeEntries(data ?? { entries: [], totalSeconds: 0 });
  }

  async function saveSchedule(itemId: number) {
    const iso = scheduleDraft ? new Date(scheduleDraft).toISOString() : null;
    await patchItem(itemId, { scheduled_at: iso });
  }

  async function markDone(itemId: number) {
    await patchItem(itemId, { status: "done", completed_at: new Date().toISOString() });
  }

  async function clockIn(itemId: number) {
    setClockBusy(true);
    await fetch("/api/prodev/time-entries", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ checklistItemId: itemId }),
    });
    await loadTimeEntries(itemId);
    setClockBusy(false);
  }

  async function clockOut(entryId: number, itemId: number) {
    setClockBusy(true);
    await fetch(`/api/prodev/time-entries/${entryId}`, { method: "PATCH" });
    await loadTimeEntries(itemId);
    setClockBusy(false);
  }

  async function saveCredits() {
    if (!selectedShotId) return;
    const entries = Object.entries(creditDraft)
      .map(([userId, pct]) => ({ user_id: Number(userId), percent: Number(pct) || 0 }))
      .filter((c) => c.percent > 0);
    const res = await fetch(`/api/prodev/shots/${selectedShotId}/credits`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ credits: entries }),
    });
    if (res.ok) {
      setCreditMsg("SAVED");
      await loadCredits(selectedShotId);
    } else {
      const body = (await res.json()) as { error?: string };
      setCreditMsg(body.error ?? "FAILED TO SAVE");
    }
    setTimeout(() => setCreditMsg(null), 2500);
  }

  function renderTree(parentId: number | null, depth: number): React.ReactNode {
    const children = items.filter((i) => i.parent_id === parentId).sort((a, b) => a.sort_order - b.sort_order);
    if (children.length === 0) return null;
    return (
      <div>
        {children.map((item) => (
          <div key={item.id}>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 6,
                padding: "3px 4px",
                marginLeft: depth * 14,
                borderBottom: "1px solid #1a1a1a",
              }}
            >
              <button
                onClick={() => cycleStatus(item)}
                title="Cycle status"
                style={{ ...smallBtn, color: STATUS_COLOR[item.status], width: 44, flexShrink: 0 }}
              >
                {STATUS_LABEL[item.status]}
              </button>
              <span style={{ fontSize: 8, color: "#eee", flex: 1 }}>{item.title}</span>
              {(() => {
                const earlyLate = formatEarlyLate(item.scheduled_at, item.completed_at);
                return earlyLate ? (
                  <span style={{ fontSize: 6, color: earlyLate.late ? "#ff6666" : "#00ff88", flexShrink: 0 }}>
                    {earlyLate.text}
                  </span>
                ) : null;
              })()}
              <span style={{ fontSize: 6, color: "#666", flexShrink: 0 }}>{item.owner_name ?? "UNASSIGNED"}</span>
              <span style={{ fontSize: 6, color: "#666", flexShrink: 0 }}>{item.hours}H</span>
              <button onClick={() => openDetail(item)} title="Schedule / clock in-out" style={{ ...smallBtn, width: 16 }}>
                ⏱
              </button>
              <button onClick={() => addItem(item.id)} title="Add sub-item" style={{ ...smallBtn, width: 16 }}>
                +
              </button>
              <button onClick={() => deleteItem(item.id)} title="Delete" style={{ ...smallBtn, width: 16, color: "#ff6666" }}>
                ×
              </button>
            </div>
            {renderTree(item.id, depth + 1)}
          </div>
        ))}
      </div>
    );
  }

  return (
    <div
      className="w-full h-full flex"
      style={{ backgroundColor: "#000", color: "#fff", fontFamily: "var(--dm-font-primary)", imageRendering: "pixelated" }}
    >
      {/* Projects rail */}
      <div style={{ width: 160, borderRight: "1px solid #333", display: "flex", flexDirection: "column", flexShrink: 0 }}>
        <div style={{ padding: 6, borderBottom: "1px solid #333", fontSize: 7, color: "#888", letterSpacing: 1 }}>
          PROJECTS
        </div>
        <div className="flex-1 overflow-y-auto">
          {loadingProjects ? (
            <div style={{ padding: 6, fontSize: 7, color: "#666" }}>LOADING…</div>
          ) : (
            projects.map((p) => (
              <button
                key={p.id}
                onClick={() => {
                  setSelectedProjectId(p.id);
                  setSelectedShotId(null);
                }}
                style={{
                  display: "block",
                  width: "100%",
                  textAlign: "left",
                  padding: "6px 8px",
                  border: "none",
                  borderBottom: "1px solid #1a1a1a",
                  background: selectedProjectId === p.id ? "#1a1a1a" : "transparent",
                  color: "#fff",
                  fontFamily: "var(--dm-font-primary)",
                  fontSize: 8,
                  cursor: "pointer",
                }}
              >
                {p.name}
              </button>
            ))
          )}
        </div>
        <form onSubmit={createProject} style={{ padding: 6, borderTop: "1px solid #333" }}>
          <input
            value={newProjectName}
            onChange={(e) => setNewProjectName(e.target.value)}
            placeholder="NEW PROJECT…"
            style={{ ...smallField, width: "100%", marginBottom: 4 }}
          />
          <button type="submit" style={{ ...smallBtn, width: "100%" }}>
            CREATE
          </button>
        </form>
      </div>

      {/* Shots rail */}
      {project && (
        <div style={{ width: 170, borderRight: "1px solid #333", display: "flex", flexDirection: "column", flexShrink: 0 }}>
          <div style={{ padding: 6, borderBottom: "1px solid #333", fontSize: 7, color: "#888", letterSpacing: 1 }}>
            SHOTS — {project.name.toUpperCase()}
          </div>
          <div className="flex-1 overflow-y-auto">
            {project.shots.map((s) => (
              <button
                key={s.id}
                onClick={() => setSelectedShotId(s.id)}
                style={{
                  display: "block",
                  width: "100%",
                  textAlign: "left",
                  padding: "6px 8px",
                  border: "none",
                  borderBottom: "1px solid #1a1a1a",
                  background: selectedShotId === s.id ? "#1a1a1a" : "transparent",
                  color: "#fff",
                  fontFamily: "var(--dm-font-primary)",
                  fontSize: 8,
                  cursor: "pointer",
                }}
              >
                {s.title}
              </button>
            ))}
          </div>
          <form onSubmit={createShot} style={{ padding: 6, borderTop: "1px solid #333" }}>
            <input
              value={newShotTitle}
              onChange={(e) => setNewShotTitle(e.target.value)}
              placeholder="NEW SHOT…"
              style={{ ...smallField, width: "100%", marginBottom: 4 }}
            />
            <button type="submit" style={{ ...smallBtn, width: "100%" }}>
              ADD SHOT
            </button>
          </form>

          {linkedSequences.length > 0 && (
            <div style={{ padding: 6, borderTop: "1px solid #333" }}>
              <div style={{ fontSize: 6, color: "#666", letterSpacing: 1, marginBottom: 4 }}>SHOTLIST</div>
              {linkedSequences.map((seq) => (
                <button
                  key={seq.id}
                  onClick={() => onOpenShotlistSequence?.(seq.id)}
                  disabled={!onOpenShotlistSequence}
                  style={{ ...smallBtn, width: "100%", marginBottom: 2, textAlign: "left" }}
                >
                  OPEN "{seq.name}"
                </button>
              ))}
            </div>
          )}

          <div style={{ padding: 6, borderTop: "1px solid #333" }}>
            <div style={{ fontSize: 6, color: "#666", letterSpacing: 1, marginBottom: 4 }}>MEMBERS</div>
            {project.members.map((m) => (
              <div key={m.user_id} style={{ fontSize: 7, color: "#ccc", marginBottom: 2 }}>
                {m.display_name ?? `USER ${m.user_id}`} <span style={{ color: "#555" }}>({m.role})</span>
              </div>
            ))}
            <input
              value={memberSearch}
              onChange={(e) => searchMembers(e.target.value)}
              placeholder="ADD MEMBER…"
              style={{ ...smallField, width: "100%", marginTop: 4 }}
            />
            {memberResults.map((r) => (
              <button
                key={r.user_id}
                onClick={() => addMember(r.user_id)}
                style={{ ...smallBtn, width: "100%", marginTop: 2, textAlign: "left" }}
              >
                {r.display_name ?? r.matrix_id}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Checklist + credits */}
      <div className="flex-1 overflow-y-auto" style={{ display: "flex", flexDirection: "column" }}>
        {!selectedShotId ? (
          <div style={{ padding: 16, fontSize: 8, color: "#666", letterSpacing: 1 }}>
            {project ? "SELECT A SHOT." : "SELECT OR CREATE A PROJECT."}
          </div>
        ) : (
          <>
            <div style={{ padding: 8, borderBottom: "1px solid #333", display: "flex", justifyContent: "space-between" }}>
              <span style={{ fontSize: 8, color: "#ddd", letterSpacing: 1 }}>CHECKLIST</span>
              <button onClick={() => addItem(null)} style={smallBtn}>
                + ITEM
              </button>
            </div>
            <div style={{ flex: 1, overflowY: "auto" }}>
              {items.length === 0 ? (
                <div style={{ padding: 8, fontSize: 7, color: "#666" }}>NO ITEMS YET.</div>
              ) : (
                renderTree(null, 0)
              )}
            </div>

            <div style={{ ...panel, margin: 8, padding: 8 }}>
              <div style={{ fontSize: 7, color: "#888", letterSpacing: 1, marginBottom: 6 }}>
                CREDIT SPLIT — WHAT % OF THIS SHOT EACH MEMBER GETS. K-OS ONLY RECORDS THIS; NO MONEY MOVES.
              </div>
              {project?.members.map((m) => (
                <div key={m.user_id} style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 4 }}>
                  <span style={{ fontSize: 7, color: "#ccc", flex: 1 }}>{m.display_name ?? `USER ${m.user_id}`}</span>
                  <input
                    type="number"
                    min={0}
                    max={100}
                    value={creditDraft[m.user_id] ?? ""}
                    onChange={(e) => setCreditDraft((prev) => ({ ...prev, [m.user_id]: e.target.value }))}
                    style={{ ...smallField, width: 50 }}
                  />
                  <span style={{ fontSize: 7, color: "#666" }}>%</span>
                </div>
              ))}
              <button onClick={saveCredits} style={{ ...smallBtn, marginTop: 4 }}>
                SAVE CREDITS
              </button>
              {creditMsg && <span style={{ fontSize: 7, color: "#888", marginLeft: 8 }}>{creditMsg}</span>}
              {credits.length > 0 && (
                <div style={{ marginTop: 6, fontSize: 6, color: "#555" }}>
                  TOTAL: {credits.reduce((s, c) => s + Number(c.percent), 0)}%
                </div>
              )}
            </div>
          </>
        )}
      </div>

      {detailItemId != null &&
        (() => {
          const item = items.find((i) => i.id === detailItemId);
          if (!item) return null;
          const myOpenEntry = timeEntries?.entries.find((e) => e.user_id === myUserId && e.clock_out === null);
          const earlyLate = formatEarlyLate(item.scheduled_at, item.completed_at);
          return (
            <div
              onClick={() => setDetailItemId(null)}
              style={{
                position: "fixed",
                inset: 0,
                zIndex: 100,
                background: "rgba(0,0,0,0.85)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                padding: 16,
              }}
            >
              <div
                onClick={(e) => e.stopPropagation()}
                style={{ ...panel, width: 280, maxHeight: "80%", overflowY: "auto", boxShadow: "3px 3px 0 #000" }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    padding: "5px 8px",
                    borderBottom: "1px solid #333",
                    background: "#1a1a1a",
                  }}
                >
                  <span style={{ fontSize: 8, color: "#ddd", letterSpacing: 1 }}>{item.title.toUpperCase()}</span>
                  <button onClick={() => setDetailItemId(null)} style={{ ...smallBtn, height: 18, padding: "0 6px" }}>
                    ×
                  </button>
                </div>

                <div style={{ padding: 10 }}>
                  <div style={{ fontSize: 7, color: "#888", letterSpacing: 1, marginBottom: 3 }}>SCHEDULED (GOAL)</div>
                  <input
                    type="datetime-local"
                    value={scheduleDraft}
                    onChange={(e) => setScheduleDraft(e.target.value)}
                    style={{ ...smallField, width: "100%" }}
                  />
                  <button onClick={() => saveSchedule(item.id)} style={{ ...smallBtn, width: "100%", marginTop: 4 }}>
                    SAVE SCHEDULE
                  </button>

                  <div style={{ fontSize: 7, color: "#888", letterSpacing: 1, marginTop: 10 }}>COMPLETED</div>
                  <div style={{ fontSize: 8, color: "#ccc", marginTop: 3 }}>
                    {item.completed_at ? new Date(item.completed_at).toLocaleString() : "NOT YET"}
                  </div>
                  {earlyLate && (
                    <div style={{ fontSize: 7, color: earlyLate.late ? "#ff6666" : "#00ff88", marginTop: 2 }}>
                      {earlyLate.text}
                    </div>
                  )}
                  {!item.completed_at && (
                    <button onClick={() => markDone(item.id)} style={{ ...smallBtn, width: "100%", marginTop: 4 }}>
                      MARK DONE NOW
                    </button>
                  )}

                  <div style={{ fontSize: 7, color: "#888", letterSpacing: 1, marginTop: 10 }}>TIME TRACKING</div>
                  {timeEntries == null ? (
                    <div style={{ fontSize: 7, color: "#666", marginTop: 3 }}>LOADING…</div>
                  ) : (
                    <>
                      <div style={{ fontSize: 8, color: "#ccc", marginTop: 3 }}>
                        LOGGED: {formatHoursMinutes(timeEntries.totalSeconds)}
                      </div>
                      <button
                        disabled={clockBusy}
                        onClick={() =>
                          myOpenEntry ? clockOut(myOpenEntry.id, item.id) : clockIn(item.id)
                        }
                        style={{
                          ...smallBtn,
                          width: "100%",
                          marginTop: 4,
                          background: myOpenEntry ? "#ff6666" : "#000",
                          color: myOpenEntry ? "#000" : "#ccc",
                        }}
                      >
                        {myOpenEntry ? "CLOCK OUT" : "CLOCK IN"}
                      </button>
                      {timeEntries.entries.length > 0 && (
                        <div style={{ marginTop: 6 }}>
                          {timeEntries.entries.map((e) => (
                            <div key={e.id} style={{ fontSize: 6, color: "#666", marginBottom: 2 }}>
                              {e.user_name ?? `USER ${e.user_id}`} — {new Date(e.clock_in).toLocaleString()}
                              {" → "}
                              {e.clock_out ? new Date(e.clock_out).toLocaleString() : "…"}
                            </div>
                          ))}
                        </div>
                      )}
                    </>
                  )}
                </div>
              </div>
            </div>
          );
        })()}
    </div>
  );
}
