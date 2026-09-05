/*
 *                    ☦
 *            ╔═══════════════════╗
 *            ║  K-OS III        ║
 *            ║  SKULLTEXT       ║
 *            ╚═══════════════════╝
 *
 *   Local-first notes + code editor (CodeMirror 6 + K-OS theme).
 *   Soft wrap on by default. Tab indent. Syntax highlight by extension.
 *   Files live in localStorage cache; export to disk anytime.
 *
 *   Saint Jerome, patron of translators and scribes — keep these lines true.
 */

"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import dynamic from "next/dynamic";

const SkullEditor = dynamic(
  () => import("./SkullEditor").then((m) => m.SkullEditor),
  {
    ssr: false,
    loading: () => (
      <div
        style={{
          flex: 1,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "#555",
          letterSpacing: 2,
          fontSize: 11,
        }}
      >
        LOADING EDITOR…
      </div>
    ),
  },
);

interface SkullFile {
  id: string;
  name: string;
  content: string;
  updatedAt: number;
}

const STORAGE_KEY = "kos-skulltext-files-v1";
const LAST_OPEN_KEY = "kos-skulltext-last-open";

const EXTENSIONS = [
  ".txt",
  ".md",
  ".ts",
  ".tsx",
  ".js",
  ".jsx",
  ".html",
  ".css",
  ".svg",
  ".xml",
  ".json",
  ".csv",
  ".c",
  ".h",
  ".cs",
] as const;

type Ext = (typeof EXTENSIONS)[number];

const MIME: Record<string, string> = {
  ".txt": "text/plain",
  ".md": "text/markdown",
  ".ts": "text/typescript",
  ".tsx": "text/typescript",
  ".js": "text/javascript",
  ".jsx": "text/javascript",
  ".html": "text/html",
  ".css": "text/css",
  ".svg": "image/svg+xml",
  ".xml": "application/xml",
  ".json": "application/json",
  ".csv": "text/csv",
  ".c": "text/x-c",
  ".h": "text/x-c",
  ".cs": "text/x-csharp",
};

function uid(): string {
  return `f_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

function extOf(name: string): string {
  const i = name.lastIndexOf(".");
  return i >= 0 ? name.slice(i).toLowerCase() : ".txt";
}

function defaultName(ext: Ext = ".txt"): string {
  const n = new Date();
  const stamp = `${n.getFullYear()}${String(n.getMonth() + 1).padStart(2, "0")}${String(n.getDate()).padStart(2, "0")}`;
  return `note-${stamp}${ext}`;
}

function loadFiles(): SkullFile[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as SkullFile[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function saveFiles(files: SkullFile[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(files));
}

function syntaxError(name: string, content: string): string | null {
  const ext = extOf(name);
  if (ext === ".json") {
    if (!content.trim()) return null;
    try {
      JSON.parse(content);
      return null;
    } catch (e) {
      return e instanceof Error ? e.message : "Invalid JSON";
    }
  }
  if (ext === ".xml" || ext === ".svg") {
    if (!content.trim()) return null;
    const open = (content.match(/<[^/!?][^>]*>/g) || []).length;
    const close = (content.match(/<\/[^>]+>/g) || []).length;
    const self = (content.match(/\/>/g) || []).length;
    if (open > close + self + 2) return "Possible unclosed tag";
  }
  return null;
}

const btn = (active = false): React.CSSProperties => ({
  padding: "4px 8px",
  background: active ? "#ffffff" : "#000000",
  color: active ? "#000000" : "#cccccc",
  border: active ? "1px solid #ffffff" : "1px solid #555555",
  cursor: "pointer",
  fontFamily: "inherit",
  fontSize: 10,
  letterSpacing: 1,
  touchAction: "manipulation",
  whiteSpace: "nowrap",
});

interface SkullTextAppProps {
  isFocused?: boolean;
}

export function SkullTextApp({ isFocused = true }: SkullTextAppProps) {
  const [files, setFiles] = useState<SkullFile[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [dirty, setDirty] = useState(false);
  const [status, setStatus] = useState("SKULLTEXT · local cache");
  const [wrap, setWrap] = useState(true);
  const [showBrowser, setShowBrowser] = useState(true);
  const [renameId, setRenameId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState("");

  useEffect(() => {
    const list = loadFiles();
    if (list.length === 0) {
      const starter: SkullFile = {
        id: uid(),
        name: defaultName(".md"),
        content:
          "# SKULLTEXT\n\nLocal-first notes and code.\n\n- Soft wrap on by default\n- Syntax highlight by file extension (`.ts`, `.md`, `.json`, …)\n- Tab indent · Save to cache · Export to disk\n",
        updatedAt: Date.now(),
      };
      setFiles([starter]);
      setActiveId(starter.id);
      saveFiles([starter]);
      setStatus("Created starter note");
    } else {
      setFiles(list);
      const last = localStorage.getItem(LAST_OPEN_KEY);
      const pick = list.find((f) => f.id === last) ?? list[0]!;
      setActiveId(pick.id);
    }
  }, []);

  const active = useMemo(
    () => (activeId ? files.find((f) => f.id === activeId) ?? null : null),
    [files, activeId],
  );

  const err = active ? syntaxError(active.name, active.content) : null;

  const persist = useCallback((next: SkullFile[]) => {
    setFiles(next);
    saveFiles(next);
  }, []);

  const openFile = useCallback(
    (id: string) => {
      setActiveId(id);
      localStorage.setItem(LAST_OPEN_KEY, id);
      setDirty(false);
      setRenameId(null);
      const f = files.find((x) => x.id === id);
      setStatus(f ? `Opened ${f.name}` : "Opened");
    },
    [files],
  );

  const updateContent = useCallback(
    (content: string) => {
      if (!activeId) return;
      setDirty(true);
      setFiles((prev) =>
        prev.map((f) =>
          f.id === activeId ? { ...f, content, updatedAt: Date.now() } : f,
        ),
      );
    },
    [activeId],
  );

  const saveActive = useCallback(() => {
    if (!activeId) return;
    const next = files.map((f) =>
      f.id === activeId ? { ...f, updatedAt: Date.now() } : f,
    );
    persist(next);
    setDirty(false);
    const f = next.find((x) => x.id === activeId);
    setStatus(f ? `Saved ${f.name} → local cache` : "Saved");
  }, [activeId, files, persist]);

  const newFile = useCallback(
    (ext: Ext = ".txt") => {
      const f: SkullFile = {
        id: uid(),
        name: defaultName(ext),
        content: "",
        updatedAt: Date.now(),
      };
      const next = [f, ...files];
      persist(next);
      setActiveId(f.id);
      localStorage.setItem(LAST_OPEN_KEY, f.id);
      setDirty(false);
      setStatus(`New ${f.name}`);
    },
    [files, persist],
  );

  const deleteFile = useCallback(
    (id: string) => {
      const next = files.filter((f) => f.id !== id);
      persist(next);
      if (activeId === id) {
        const pick = next[0] ?? null;
        setActiveId(pick?.id ?? null);
        if (pick) localStorage.setItem(LAST_OPEN_KEY, pick.id);
        else localStorage.removeItem(LAST_OPEN_KEY);
      }
      setStatus("Deleted");
    },
    [files, activeId, persist],
  );

  const commitRename = useCallback(() => {
    if (!renameId || !renameValue.trim()) {
      setRenameId(null);
      return;
    }
    let name = renameValue.trim();
    if (!name.includes(".")) {
      const old = files.find((f) => f.id === renameId);
      const e = old ? extOf(old.name) : ".txt";
      name = name + e;
    }
    const next = files.map((f) =>
      f.id === renameId ? { ...f, name, updatedAt: Date.now() } : f,
    );
    persist(next);
    setRenameId(null);
    setStatus(`Renamed → ${name}`);
  }, [renameId, renameValue, files, persist]);

  const exportFile = useCallback(async () => {
    if (!active) return;
    const mime = MIME[extOf(active.name)] ?? "text/plain";
    const blob = new Blob([active.content], { type: mime });

    const w = window as Window & {
      showSaveFilePicker?: (opts: {
        suggestedName?: string;
        types?: { description: string; accept: Record<string, string[]> }[];
      }) => Promise<FileSystemFileHandle>;
    };
    if (typeof w.showSaveFilePicker === "function") {
      try {
        const handle = await w.showSaveFilePicker({
          suggestedName: active.name,
          types: [
            {
              description: "Text",
              accept: { [mime]: [extOf(active.name)] },
            },
          ],
        });
        const writable = await handle.createWritable();
        await writable.write(blob);
        await writable.close();
        setStatus(`Exported ${active.name} → disk`);
        return;
      } catch (e) {
        if (e instanceof Error && e.name === "AbortError") {
          setStatus("Export cancelled");
          return;
        }
      }
    }

    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = active.name;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
    setStatus(`Downloaded ${active.name}`);
  }, [active]);

  const importFile = useCallback(() => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = EXTENSIONS.join(",");
    input.onchange = async () => {
      const file = input.files?.[0];
      if (!file) return;
      const text = await file.text();
      const f: SkullFile = {
        id: uid(),
        name: file.name,
        content: text,
        updatedAt: Date.now(),
      };
      const next = [f, ...files];
      persist(next);
      setActiveId(f.id);
      localStorage.setItem(LAST_OPEN_KEY, f.id);
      setDirty(false);
      setStatus(`Imported ${file.name}`);
    };
    input.click();
  }, [files, persist]);

  useEffect(() => {
    if (!isFocused) return;
    const onKey = (e: KeyboardEvent) => {
      const mod = e.metaKey || e.ctrlKey;
      if (mod && e.key.toLowerCase() === "s") {
        e.preventDefault();
        saveActive();
      } else if (mod && e.key.toLowerCase() === "n") {
        e.preventDefault();
        newFile(".txt");
      } else if (mod && e.key.toLowerCase() === "e") {
        e.preventDefault();
        void exportFile();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [isFocused, saveActive, newFile, exportFile]);

  const sorted = useMemo(
    () => [...files].sort((a, b) => b.updatedAt - a.updatedAt),
    [files],
  );

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
        <span style={{ color: "#ffff00", letterSpacing: 2, fontSize: 11, marginRight: 4 }}>
          ☦ SKULLTEXT
        </span>
        <button type="button" style={btn()} onClick={() => newFile(".txt")} title="Ctrl+N">
          NEW
        </button>
        <button type="button" style={btn()} onClick={() => newFile(".md")}>
          .MD
        </button>
        <button type="button" style={btn()} onClick={() => newFile(".ts")}>
          .TS
        </button>
        <button type="button" style={btn(dirty)} onClick={saveActive} title="Ctrl+S">
          SAVE
        </button>
        <button type="button" style={btn()} onClick={() => void exportFile()} title="Ctrl+E">
          EXPORT
        </button>
        <button type="button" style={btn()} onClick={importFile}>
          IMPORT
        </button>
        <button type="button" style={btn(wrap)} onClick={() => setWrap((w) => !w)} title="Toggle soft wrap">
          WRAP {wrap ? "ON" : "OFF"}
        </button>
        <button type="button" style={btn(showBrowser)} onClick={() => setShowBrowser((s) => !s)}>
          FILES
        </button>
        <span style={{ flex: 1 }} />
        {active && (
          <span style={{ color: "#888", fontSize: 9, letterSpacing: 1 }}>
            {active.name}
            {dirty ? " · *" : ""}
          </span>
        )}
      </div>

      <div style={{ flex: 1, display: "flex", overflow: "hidden", minHeight: 0 }}>
        {showBrowser && (
          <aside
            style={{
              width: 180,
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
              LOCAL CACHE
            </div>
            <div style={{ flex: 1, overflowY: "auto", padding: "4px 0" }}>
              {sorted.length === 0 && (
                <div style={{ padding: 12, color: "#555", fontSize: 10 }}>No files</div>
              )}
              {sorted.map((f) => {
                const selected = f.id === activeId;
                const renaming = renameId === f.id;
                return (
                  <div
                    key={f.id}
                    style={{
                      padding: "4px 8px",
                      background: selected ? "#111100" : "transparent",
                      borderLeft: selected ? "2px solid #ffff00" : "2px solid transparent",
                      cursor: "pointer",
                    }}
                    onClick={() => !renaming && openFile(f.id)}
                    onDoubleClick={(e) => {
                      e.stopPropagation();
                      setRenameId(f.id);
                      setRenameValue(f.name);
                    }}
                  >
                    {renaming ? (
                      <input
                        autoFocus
                        value={renameValue}
                        onChange={(e) => setRenameValue(e.target.value)}
                        onBlur={commitRename}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") commitRename();
                          if (e.key === "Escape") setRenameId(null);
                        }}
                        style={{
                          width: "100%",
                          background: "#000",
                          color: "#fff",
                          border: "1px solid #555",
                          fontFamily: "inherit",
                          fontSize: 10,
                          padding: "2px 4px",
                        }}
                      />
                    ) : (
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          gap: 4,
                          alignItems: "center",
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
                          title={f.name}
                        >
                          {f.name}
                        </span>
                        <button
                          type="button"
                          title="Delete"
                          onClick={(e) => {
                            e.stopPropagation();
                            deleteFile(f.id);
                          }}
                          style={{
                            background: "transparent",
                            border: "none",
                            color: "#555",
                            cursor: "pointer",
                            fontFamily: "inherit",
                            fontSize: 10,
                            padding: 0,
                            lineHeight: 1,
                          }}
                        >
                          ×
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </aside>
        )}

        <div style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0, minHeight: 0 }}>
          {active ? (
            <SkullEditor
              key={active.id}
              value={active.content}
              filename={active.name}
              wrap={wrap}
              onChange={updateContent}
            />
          ) : (
            <div
              style={{
                flex: 1,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#555",
                letterSpacing: 2,
                fontSize: 11,
              }}
            >
              NO FILE OPEN · NEW TO START
            </div>
          )}

          <div
            style={{
              flexShrink: 0,
              borderTop: "1px solid #222",
              padding: "3px 10px",
              fontSize: 9,
              letterSpacing: 1,
              color: err ? "#ff6666" : "#666",
              display: "flex",
              justifyContent: "space-between",
              gap: 8,
              flexWrap: "wrap",
            }}
          >
            <span>
              {err ? `⚠ ${err}` : status}
              {dirty && !err ? " · unsaved" : ""}
            </span>
            <span>
              {active
                ? `${active.content.length} chars · ${active.content.split("\n").length} lines · wrap ${wrap ? "on" : "off"}`
                : "Ctrl+S save · Ctrl+N new · Ctrl+E export · highlight by ext"}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default SkullTextApp;
