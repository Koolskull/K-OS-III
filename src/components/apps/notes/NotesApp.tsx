/*
 *                    ☦
 *            ╔═══════════════════╗
 *            ║  K-OS III        ║
 *            ║  NOTES           ║
 *            ╚═══════════════════╝
 *
 *   Personal notes + per-note to-do lists.
 *   Private by default. Toggle public to share on the PUBLIC feed.
 *   Local-first (localStorage) so every install works offline.
 *   Each browser profile gets a stable user id — private notes never
 *   leak to other profiles. Public notes appear in the shared feed.
 *
 *   Saint Jerome, patron of scribes — keep these lines true.
 */

"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";

export interface NoteTodo {
  id: string;
  text: string;
  done: boolean;
  sortOrder: number;
}

export interface Note {
  id: string;
  userId: string;
  authorName: string;
  title: string;
  body: string;
  isPublic: boolean;
  todos: NoteTodo[];
  createdAt: number;
  updatedAt: number;
}

const NOTES_KEY = "kos-notes-v1";
const USER_KEY = "kos-notes-user-v1";
const PROFILE_KEY = "kos-notes-profile-v1";

function uid(prefix = "n"): string {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 9)}`;
}

function loadUserId(): string {
  try {
    const existing = localStorage.getItem(USER_KEY);
    if (existing) return existing;
    const id = uid("user");
    localStorage.setItem(USER_KEY, id);
    return id;
  } catch {
    return "local-user";
  }
}

function loadProfileName(): string {
  try {
    return localStorage.getItem(PROFILE_KEY) || "Operator";
  } catch {
    return "Operator";
  }
}

function loadNotes(): Note[] {
  try {
    const raw = localStorage.getItem(NOTES_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as Note[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function saveNotes(notes: Note[]) {
  localStorage.setItem(NOTES_KEY, JSON.stringify(notes));
}

const btn = (active = false, danger = false): React.CSSProperties => ({
  padding: "4px 8px",
  background: active ? "#ffff00" : "#000000",
  color: active ? "#000000" : danger ? "#ff6666" : "#cccccc",
  border: active
    ? "1px solid #ffff00"
    : danger
      ? "1px solid #663333"
      : "1px solid #555555",
  cursor: "pointer",
  fontFamily: "inherit",
  fontSize: 10,
  letterSpacing: 1,
  touchAction: "manipulation",
  whiteSpace: "nowrap",
  display: "inline-flex",
  alignItems: "center",
  gap: 4,
});

interface NotesAppProps {
  isFocused?: boolean;
}

type Tab = "mine" | "public";

export function NotesApp({ isFocused = true }: NotesAppProps) {
  const [userId, setUserId] = useState("local-user");
  const [authorName, setAuthorName] = useState("Operator");
  const [notes, setNotes] = useState<Note[]>([]);
  const [tab, setTab] = useState<Tab>("mine");
  const [activeId, setActiveId] = useState<string | null>(null);
  const [todoDraft, setTodoDraft] = useState("");
  const [status, setStatus] = useState("NOTES · local vault");
  const [showSidebar, setShowSidebar] = useState(true);
  const [editingProfile, setEditingProfile] = useState(false);
  const [profileDraft, setProfileDraft] = useState("");
  const titleRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const id = loadUserId();
    const name = loadProfileName();
    setUserId(id);
    setAuthorName(name);
    setProfileDraft(name);
    const all = loadNotes();
    setNotes(all);
    const mine = all.filter((n) => n.userId === id);
    if (mine.length > 0) {
      setActiveId(mine.sort((a, b) => b.updatedAt - a.updatedAt)[0]!.id);
    }
  }, []);

  const persist = useCallback((next: Note[]) => {
    setNotes(next);
    saveNotes(next);
  }, []);

  const active = useMemo(
    () => (activeId ? notes.find((n) => n.id === activeId) ?? null : null),
    [notes, activeId],
  );

  const isOwner = Boolean(active && active.userId === userId);

  const list = useMemo(() => {
    const filtered =
      tab === "mine"
        ? notes.filter((n) => n.userId === userId)
        : notes.filter((n) => n.isPublic);
    return filtered.sort((a, b) => b.updatedAt - a.updatedAt);
  }, [notes, tab, userId]);

  const createNote = useCallback(() => {
    const n: Note = {
      id: uid("note"),
      userId,
      authorName,
      title: "Untitled",
      body: "",
      isPublic: false,
      todos: [],
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    persist([n, ...notes]);
    setActiveId(n.id);
    setTab("mine");
    setStatus("Created · private");
    setTimeout(() => titleRef.current?.focus(), 40);
  }, [userId, authorName, notes, persist]);

  const updateActive = useCallback(
    (patch: Partial<Note>) => {
      if (!activeId || !isOwner) return;
      const next = notes.map((n) =>
        n.id === activeId ? { ...n, ...patch, updatedAt: Date.now() } : n,
      );
      persist(next);
    },
    [activeId, isOwner, notes, persist],
  );

  const deleteActive = useCallback(() => {
    if (!active || !isOwner) return;
    if (!confirm("Delete this note and its to-dos?")) return;
    const next = notes.filter((n) => n.id !== active.id);
    persist(next);
    setActiveId(next.find((n) => n.userId === userId)?.id ?? null);
    setStatus("Deleted");
  }, [active, isOwner, notes, persist, userId]);

  const togglePublic = useCallback(() => {
    if (!active || !isOwner) return;
    const next = !active.isPublic;
    updateActive({ isPublic: next });
    setStatus(next ? "Published · visible on PUBLIC feed" : "Now private");
  }, [active, isOwner, updateActive]);

  const addTodo = useCallback(() => {
    if (!active || !isOwner) return;
    const text = todoDraft.trim();
    if (!text) return;
    const max = active.todos.reduce((m, t) => Math.max(m, t.sortOrder), -1);
    const t: NoteTodo = {
      id: uid("todo"),
      text,
      done: false,
      sortOrder: max + 1,
    };
    updateActive({ todos: [...active.todos, t] });
    setTodoDraft("");
    setStatus("To-do added");
  }, [active, isOwner, todoDraft, updateActive]);

  const toggleTodo = useCallback(
    (id: string) => {
      if (!active || !isOwner) return;
      updateActive({
        todos: active.todos.map((t) =>
          t.id === id ? { ...t, done: !t.done } : t,
        ),
      });
    },
    [active, isOwner, updateActive],
  );

  const deleteTodo = useCallback(
    (id: string) => {
      if (!active || !isOwner) return;
      updateActive({ todos: active.todos.filter((t) => t.id !== id) });
    },
    [active, isOwner, updateActive],
  );

  const saveProfile = useCallback(() => {
    const name = profileDraft.trim() || "Operator";
    setAuthorName(name);
    localStorage.setItem(PROFILE_KEY, name);
    const next = notes.map((n) =>
      n.userId === userId ? { ...n, authorName: name } : n,
    );
    persist(next);
    setEditingProfile(false);
    setStatus(`Profile → ${name}`);
  }, [profileDraft, notes, userId, persist]);

  useEffect(() => {
    if (!isFocused) return;
    const onKey = (e: KeyboardEvent) => {
      const mod = e.metaKey || e.ctrlKey;
      if (mod && e.key.toLowerCase() === "n") {
        e.preventDefault();
        createNote();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [isFocused, createNote]);

  const fmt = (ts: number) => {
    try {
      return new Date(ts).toLocaleString(undefined, {
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return "";
    }
  };

  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        backgroundColor: "#000000",
        color: "#ffffff",
        fontFamily: "var(--dm-font-primary), monospace",
        imageRendering: "pixelated",
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
      }}
    >
      <div
        style={{
          flexShrink: 0,
          display: "flex",
          alignItems: "center",
          gap: 6,
          padding: "5px 8px",
          borderBottom: "1px solid #333",
          flexWrap: "wrap",
          minHeight: 32,
        }}
      >
        <span
          style={{
            color: "#ffff00",
            letterSpacing: 2,
            fontSize: 11,
            marginRight: 4,
          }}
        >
          ☦ NOTES
        </span>

        <div
          style={{
            display: "inline-flex",
            border: "1px solid #333",
            padding: 2,
            gap: 2,
          }}
        >
          <button
            type="button"
            style={btn(tab === "mine")}
            onClick={() => setTab("mine")}
          >
            MINE
          </button>
          <button
            type="button"
            style={btn(tab === "public")}
            onClick={() => setTab("public")}
          >
            PUBLIC
          </button>
        </div>

        <button type="button" style={btn()} onClick={createNote} title="Ctrl+N">
          NEW
        </button>
        <button
          type="button"
          style={btn(showSidebar)}
          onClick={() => setShowSidebar((s) => !s)}
        >
          FILES
        </button>

        <span style={{ flex: 1 }} />

        {editingProfile ? (
          <span style={{ display: "inline-flex", gap: 4, alignItems: "center" }}>
            <input
              autoFocus
              value={profileDraft}
              onChange={(e) => setProfileDraft(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") saveProfile();
                if (e.key === "Escape") setEditingProfile(false);
              }}
              style={{
                background: "#000",
                color: "#fff",
                border: "1px solid #555",
                fontFamily: "inherit",
                fontSize: 10,
                padding: "2px 6px",
                width: 120,
              }}
            />
            <button type="button" style={btn(true)} onClick={saveProfile}>
              OK
            </button>
          </span>
        ) : (
          <button
            type="button"
            style={btn()}
            onClick={() => {
              setProfileDraft(authorName);
              setEditingProfile(true);
            }}
            title="Set display name for public notes"
          >
            {authorName}
          </button>
        )}
      </div>

      <div style={{ flex: 1, display: "flex", overflow: "hidden", minHeight: 0 }}>
        {showSidebar && (
          <aside
            style={{
              width: 200,
              flexShrink: 0,
              borderRight: "2px solid #222",
              background: "#0a0a0a",
              display: "flex",
              flexDirection: "column",
              overflow: "hidden",
            }}
          >
            <div
              style={{
                padding: "6px 8px",
                fontSize: 9,
                letterSpacing: 2,
                color: "#666",
                borderBottom: "1px solid #222",
              }}
            >
              {tab === "mine" ? "YOUR NOTEBOOK" : "PUBLIC FEED"}
            </div>
            <div style={{ flex: 1, overflowY: "auto", padding: "4px 0" }}>
              {list.length === 0 && (
                <div
                  style={{
                    padding: 12,
                    color: "#555",
                    fontSize: 10,
                    lineHeight: 1.5,
                  }}
                >
                  {tab === "mine"
                    ? "No private notes. NEW creates one — private until you publish."
                    : "No public notes yet. Open one of yours and hit PUBLISH."}
                </div>
              )}
              {list.map((n) => {
                const selected = n.id === activeId;
                const done = n.todos.filter((t) => t.done).length;
                return (
                  <div
                    key={n.id}
                    onClick={() => {
                      setActiveId(n.id);
                      setStatus(`Opened ${n.title}`);
                    }}
                    style={{
                      padding: "6px 8px",
                      background: selected ? "#111100" : "transparent",
                      borderLeft: selected
                        ? "2px solid #ffff00"
                        : "2px solid transparent",
                      cursor: "pointer",
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        gap: 4,
                      }}
                    >
                      <span
                        style={{
                          fontSize: 10,
                          color: selected ? "#ffff00" : "#ccc",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {n.title || "Untitled"}
                      </span>
                      <span
                        style={{
                          fontSize: 9,
                          color: n.isPublic ? "#88ff88" : "#555",
                        }}
                      >
                        {n.isPublic ? "◎" : "●"}
                      </span>
                    </div>
                    {tab === "public" && (
                      <div style={{ fontSize: 9, color: "#666", marginTop: 2 }}>
                        {n.authorName}
                      </div>
                    )}
                    <div style={{ fontSize: 9, color: "#555", marginTop: 2 }}>
                      {fmt(n.updatedAt)}
                      {n.todos.length > 0 ? ` · ${done}/${n.todos.length}` : ""}
                    </div>
                  </div>
                );
              })}
            </div>
          </aside>
        )}

        <div
          style={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            minWidth: 0,
            minHeight: 0,
          }}
        >
          {!active ? (
            <div
              style={{
                flex: 1,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                gap: 12,
                color: "#555",
                padding: 24,
                textAlign: "center",
              }}
            >
              <div style={{ fontSize: 12, letterSpacing: 2, color: "#888" }}>
                SELECT OR CREATE
              </div>
              <div style={{ fontSize: 10, maxWidth: 320, lineHeight: 1.6 }}>
                Notes are private by default. Attach a to-do list to any entry.
                Publish when you want it on the PUBLIC feed for other users of
                this OS install.
              </div>
              <button type="button" style={btn(true)} onClick={createNote}>
                NEW NOTE
              </button>
            </div>
          ) : (
            <>
              <div
                style={{
                  flexShrink: 0,
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                  padding: "5px 10px",
                  borderBottom: "1px solid #222",
                  flexWrap: "wrap",
                }}
              >
                <span
                  style={{
                    fontSize: 9,
                    letterSpacing: 1,
                    color: active.isPublic ? "#88ff88" : "#666",
                  }}
                >
                  {active.isPublic ? "◎ PUBLIC" : "● PRIVATE"}
                  {" · "}
                  {active.authorName}
                  {" · "}
                  {fmt(active.updatedAt)}
                </span>
                <span style={{ flex: 1 }} />
                {isOwner && (
                  <>
                    <button
                      type="button"
                      style={btn(active.isPublic)}
                      onClick={togglePublic}
                      title={
                        active.isPublic
                          ? "Make private again"
                          : "Publish to PUBLIC feed"
                      }
                    >
                      {active.isPublic ? "MAKE PRIVATE" : "PUBLISH"}
                    </button>
                    <button
                      type="button"
                      style={btn(false, true)}
                      onClick={deleteActive}
                    >
                      DELETE
                    </button>
                  </>
                )}
              </div>

              <div
                style={{
                  flex: 1,
                  overflowY: "auto",
                  padding: "12px 14px",
                  display: "flex",
                  flexDirection: "column",
                  gap: 12,
                }}
              >
                {isOwner ? (
                  <input
                    ref={titleRef}
                    value={active.title}
                    onChange={(e) => updateActive({ title: e.target.value })}
                    placeholder="Title"
                    style={{
                      width: "100%",
                      background: "transparent",
                      border: "none",
                      borderBottom: "1px solid #333",
                      color: "#fff",
                      fontFamily: "inherit",
                      fontSize: 16,
                      letterSpacing: 1,
                      padding: "4px 0 8px",
                      outline: "none",
                    }}
                  />
                ) : (
                  <div
                    style={{
                      fontSize: 16,
                      letterSpacing: 1,
                      borderBottom: "1px solid #333",
                      paddingBottom: 8,
                    }}
                  >
                    {active.title}
                  </div>
                )}

                {isOwner ? (
                  <textarea
                    value={active.body}
                    onChange={(e) => updateActive({ body: e.target.value })}
                    placeholder="Write freely… stays private until you publish."
                    rows={10}
                    style={{
                      width: "100%",
                      minHeight: 160,
                      background: "#0a0a0a",
                      border: "1px solid #333",
                      color: "#e8e8e8",
                      fontFamily: "inherit",
                      fontSize: 12,
                      lineHeight: 1.55,
                      padding: 10,
                      resize: "vertical",
                      outline: "none",
                    }}
                  />
                ) : (
                  <div
                    style={{
                      whiteSpace: "pre-wrap",
                      background: "#0a0a0a",
                      border: "1px solid #333",
                      padding: 10,
                      fontSize: 12,
                      lineHeight: 1.55,
                      minHeight: 120,
                      color: active.body ? "#e8e8e8" : "#555",
                    }}
                  >
                    {active.body || "(empty)"}
                  </div>
                )}

                <div style={{ border: "1px solid #333", background: "#0a0a0a" }}>
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      padding: "6px 10px",
                      borderBottom: "1px solid #222",
                      fontSize: 9,
                      letterSpacing: 2,
                      color: "#ffff00",
                    }}
                  >
                    <span>TO-DO LIST</span>
                    <span style={{ color: "#666" }}>
                      {active.todos.filter((t) => t.done).length}/
                      {active.todos.length} done
                    </span>
                  </div>
                  {active.todos.length === 0 && (
                    <div style={{ padding: 12, fontSize: 10, color: "#555" }}>
                      {isOwner
                        ? "Add checklist items tied to this note."
                        : "No to-dos."}
                    </div>
                  )}
                  {active.todos
                    .slice()
                    .sort((a, b) => a.sortOrder - b.sortOrder)
                    .map((t) => (
                      <div
                        key={t.id}
                        style={{
                          display: "flex",
                          alignItems: "flex-start",
                          gap: 8,
                          padding: "6px 10px",
                          borderBottom: "1px solid #1a1a1a",
                        }}
                      >
                        <button
                          type="button"
                          disabled={!isOwner}
                          onClick={() => toggleTodo(t.id)}
                          style={{
                            width: 16,
                            height: 16,
                            marginTop: 1,
                            flexShrink: 0,
                            background: t.done ? "#88ff88" : "#000",
                            border: t.done
                              ? "1px solid #88ff88"
                              : "1px solid #555",
                            color: "#000",
                            cursor: isOwner ? "pointer" : "default",
                            fontSize: 10,
                            lineHeight: "14px",
                            padding: 0,
                          }}
                        >
                          {t.done ? "✓" : ""}
                        </button>
                        <span
                          style={{
                            flex: 1,
                            fontSize: 11,
                            color: t.done ? "#666" : "#ccc",
                            textDecoration: t.done ? "line-through" : "none",
                          }}
                        >
                          {t.text}
                        </span>
                        {isOwner && (
                          <button
                            type="button"
                            onClick={() => deleteTodo(t.id)}
                            style={{
                              background: "transparent",
                              border: "none",
                              color: "#555",
                              cursor: "pointer",
                              fontFamily: "inherit",
                              fontSize: 12,
                              padding: 0,
                            }}
                          >
                            ×
                          </button>
                        )}
                      </div>
                    ))}
                  {isOwner && (
                    <form
                      onSubmit={(e) => {
                        e.preventDefault();
                        addTodo();
                      }}
                      style={{
                        display: "flex",
                        gap: 6,
                        padding: 8,
                        borderTop: "1px solid #222",
                      }}
                    >
                      <input
                        value={todoDraft}
                        onChange={(e) => setTodoDraft(e.target.value)}
                        placeholder="Add a to-do…"
                        style={{
                          flex: 1,
                          background: "#000",
                          border: "1px solid #333",
                          color: "#fff",
                          fontFamily: "inherit",
                          fontSize: 11,
                          padding: "4px 8px",
                          outline: "none",
                        }}
                      />
                      <button
                        type="submit"
                        style={btn()}
                        disabled={!todoDraft.trim()}
                      >
                        ADD
                      </button>
                    </form>
                  )}
                </div>
              </div>
            </>
          )}

          <div
            style={{
              flexShrink: 0,
              borderTop: "1px solid #222",
              padding: "3px 10px",
              fontSize: 9,
              letterSpacing: 1,
              color: "#666",
              display: "flex",
              justifyContent: "space-between",
              gap: 8,
              flexWrap: "wrap",
            }}
          >
            <span>{status}</span>
            <span>private by default · publish to share · Ctrl+N new</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default NotesApp;
