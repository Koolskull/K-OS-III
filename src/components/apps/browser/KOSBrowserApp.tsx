"use client";

/*
 *                    ☦
 *            ╔══════════════════╗
 *            ║  K-OS III        ║
 *            ║  KOS BROWSER     ║
 *            ╚══════════════════╝
 *
 *   Browser-style shell for public K-OS profiles: an address/search bar up
 *   top, a search-results "page", and a profile "page" you navigate into —
 *   with real back-button history, like an actual browser. Only ever shows
 *   profiles their owner has explicitly made public (profiles.is_public),
 *   or your own regardless. See docs/ACCOUNTS_SPEC.md.
 */

import { useState, useCallback, useRef } from "react";

interface SearchResult {
  user_id: number;
  display_name: string | null;
  avatar_url: string | null;
  matrix_id: string;
}

interface ProfileDetail {
  user_id: number;
  display_name: string | null;
  bio: string | null;
  avatar_url: string | null;
  is_public: boolean;
  matrix_id: string;
}

type View = { kind: "search"; query: string; results: SearchResult[] } | { kind: "profile"; profile: ProfileDetail };

const barBtn: React.CSSProperties = {
  height: 22,
  width: 22,
  border: "1px solid #555",
  background: "#000",
  color: "#ccc",
  fontFamily: "var(--dm-font-primary)",
  fontSize: 10,
  cursor: "pointer",
  flexShrink: 0,
};

export function KOSBrowserApp() {
  const [history, setHistory] = useState<View[]>([{ kind: "search", query: "", results: [] }]);
  const [historyIdx, setHistoryIdx] = useState(0);
  const [addressBar, setAddressBar] = useState("");
  const [loading, setLoading] = useState(false);
  const requestSeq = useRef(0);

  const current = history[historyIdx];

  const navigate = useCallback(
    (view: View) => {
      setHistory((prev) => [...prev.slice(0, historyIdx + 1), view]);
      setHistoryIdx((i) => i + 1);
    },
    [historyIdx],
  );

  const goBack = useCallback(() => {
    setHistoryIdx((i) => Math.max(0, i - 1));
  }, []);
  const goForward = useCallback(() => {
    setHistoryIdx((i) => Math.min(history.length - 1, i + 1));
  }, [history.length]);

  async function runSearch(q: string) {
    const seq = ++requestSeq.current;
    setLoading(true);
    const res = await fetch(`/api/users/search?q=${encodeURIComponent(q)}`);
    const results = (await res.json()) as SearchResult[];
    if (seq !== requestSeq.current) return; // stale response
    setLoading(false);
    navigate({ kind: "search", query: q, results });
  }

  async function openProfile(userId: number) {
    setLoading(true);
    const res = await fetch(`/api/users/${userId}`);
    setLoading(false);
    if (!res.ok) return;
    const profile = (await res.json()) as ProfileDetail;
    navigate({ kind: "profile", profile });
  }

  function handleAddressSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!addressBar.trim()) return;
    runSearch(addressBar.trim());
  }

  return (
    <div
      className="w-full h-full flex flex-col"
      style={{ backgroundColor: "#000", color: "#fff", fontFamily: "var(--dm-font-primary)", imageRendering: "pixelated" }}
    >
      {/* Address bar */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 4,
          padding: 6,
          borderBottom: "1px solid #333",
          backgroundColor: "#0a0a0a",
          flexShrink: 0,
        }}
      >
        <button onClick={goBack} disabled={historyIdx === 0} style={{ ...barBtn, opacity: historyIdx === 0 ? 0.3 : 1 }} title="Back">
          ←
        </button>
        <button
          onClick={goForward}
          disabled={historyIdx === history.length - 1}
          style={{ ...barBtn, opacity: historyIdx === history.length - 1 ? 0.3 : 1 }}
          title="Forward"
        >
          →
        </button>
        <form onSubmit={handleAddressSubmit} style={{ flex: 1 }}>
          <input
            value={addressBar}
            onChange={(e) => setAddressBar(e.target.value)}
            placeholder="SEARCH K-OS PROFILES…"
            style={{
              width: "100%",
              height: 22,
              background: "#000",
              color: "#fff",
              border: "1px solid #555",
              fontFamily: "var(--dm-font-primary)",
              fontSize: 8,
              padding: "0 6px",
              boxSizing: "border-box",
              outline: "none",
            }}
          />
        </form>
      </div>

      {/* Page content */}
      <div className="flex-1 overflow-y-auto" style={{ padding: 12 }}>
        {loading && <div style={{ fontSize: 8, color: "#666", letterSpacing: 1 }}>LOADING…</div>}

        {!loading && current.kind === "search" && (
          <>
            {current.query === "" ? (
              <div style={{ fontSize: 8, color: "#666", letterSpacing: 1 }}>
                SEARCH FOR A PUBLIC K-OS PROFILE ABOVE.
              </div>
            ) : current.results.length === 0 ? (
              <div style={{ fontSize: 8, color: "#666", letterSpacing: 1 }}>
                NO PUBLIC PROFILES MATCH &quot;{current.query.toUpperCase()}&quot;.
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                {current.results.map((r) => (
                  <button
                    key={r.user_id}
                    onClick={() => openProfile(r.user_id)}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 8,
                      width: "100%",
                      padding: 8,
                      border: "1px solid #333",
                      background: "#0a0a0a",
                      color: "#fff",
                      cursor: "pointer",
                      textAlign: "left",
                    }}
                  >
                    {r.avatar_url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={r.avatar_url} alt="" style={{ width: 24, height: 24, objectFit: "cover", border: "1px solid #333" }} />
                    ) : (
                      <div style={{ width: 24, height: 24, border: "1px solid #333", backgroundColor: "#1a1a1a", flexShrink: 0 }} />
                    )}
                    <div>
                      <div style={{ fontSize: 9 }}>{r.display_name || r.matrix_id}</div>
                      <div style={{ fontSize: 6, color: "#666" }}>{r.matrix_id}</div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </>
        )}

        {!loading && current.kind === "profile" && (
          <div>
            {current.profile.avatar_url && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={current.profile.avatar_url}
                alt=""
                style={{ width: 64, height: 64, objectFit: "cover", border: "1px solid #333", marginBottom: 8 }}
              />
            )}
            <div style={{ fontSize: 11, letterSpacing: 1 }}>{current.profile.display_name || current.profile.matrix_id}</div>
            <div style={{ fontSize: 7, color: "#666", marginBottom: 10 }}>{current.profile.matrix_id}</div>
            {current.profile.bio && (
              <div style={{ fontSize: 8, color: "#ccc", whiteSpace: "pre-wrap", lineHeight: 1.5 }}>{current.profile.bio}</div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
