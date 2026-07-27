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

const STATUS_LABEL: Record<ChecklistItemRow["status"], string> = {
  todo: "TODO",
  "in-progress": "DOING",
  done: "DONE",
};
const STATUS_COLOR: Record<ChecklistItemRow["status"], string> = {
  todo: "#666",
  "in-progress": "#ffff00",
  done: "#00ff88",
};

export function PRODEVApp() {
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
              <span style={{ fontSize: 6, color: "#666", flexShrink: 0 }}>{item.owner_name ?? "UNASSIGNED"}</span>
              <span style={{ fontSize: 6, color: "#666", flexShrink: 0 }}>{item.hours}H</span>
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
    </div>
  );
}
