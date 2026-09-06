"use client";

/*
 *                    ✠
 *      ACADEMY SEARCH
 *
 *  Wikipedia-style full-text search across all Academy lessons.
 *  Builds an in-memory index lazily on first focus by walking each
 *  lesson component's React element tree and extracting prose. The
 *  index is rebuilt when the lesson bundle or language changes.
 */

import React, { useState, useCallback, useMemo, useRef, useEffect } from "react";
import { TRACKS_BY_SLUG, type Lang } from "@/lib/education/tracks";
import type { LessonRef } from "./Academy";

type IndexEntry = {
  track: string;
  lesson: string;
  title: string;
  oneLiner: string;
  body: string;
  bodyLower: string;
};

type LessonBundle = Record<string, Record<string, React.ComponentType>>;

function extractText(node: React.ReactNode): string {
  if (node === null || node === undefined || node === false || node === true) return "";
  if (typeof node === "string") return node;
  if (typeof node === "number") return String(node);
  if (Array.isArray(node)) return node.map(extractText).join(" ");
  if (React.isValidElement(node)) {
    const children = (node.props as { children?: React.ReactNode }).children;
    return extractText(children);
  }
  return "";
}

function buildIndex(bundle: LessonBundle, lang: Lang): IndexEntry[] {
  const entries: IndexEntry[] = [];
  for (const trackSlug of Object.keys(bundle)) {
    const trackMeta = TRACKS_BY_SLUG[trackSlug];
    if (!trackMeta) continue;
    for (const lessonSlug of Object.keys(bundle[trackSlug])) {
      const Component = bundle[trackSlug][lessonSlug];
      const lessonMeta = trackMeta.lessons.find((l) => l.slug === lessonSlug);
      if (!lessonMeta) continue;
      let body = "";
      try {
        const tree = (Component as React.FC)({});
        body = extractText(tree).replace(/\s+/g, " ").trim();
      } catch {
        body = "";
      }
      entries.push({
        track: trackSlug,
        lesson: lessonSlug,
        title: lessonMeta.i18n[lang].title,
        oneLiner: lessonMeta.i18n[lang].oneLiner,
        body,
        bodyLower: body.toLowerCase(),
      });
    }
  }
  return entries;
}

function searchIndex(query: string, index: IndexEntry[]): IndexEntry[] {
  const tokens = query.toLowerCase().split(/\s+/).filter(Boolean);
  if (!tokens.length) return [];
  const scored: { entry: IndexEntry; score: number }[] = [];
  for (const entry of index) {
    const titleLower = entry.title.toLowerCase();
    const oneLinerLower = entry.oneLiner.toLowerCase();
    let score = 0;
    let allMatch = true;
    for (const tok of tokens) {
      if (titleLower.includes(tok)) score += 10;
      else if (oneLinerLower.includes(tok)) score += 5;
      else if (entry.bodyLower.includes(tok)) score += 1;
      else {
        allMatch = false;
        break;
      }
    }
    if (allMatch) scored.push({ entry, score });
  }
  scored.sort((a, b) => b.score - a.score);
  return scored.slice(0, 10).map((s) => s.entry);
}

function snippetFor(entry: IndexEntry, query: string): string {
  const tokens = query.toLowerCase().split(/\s+/).filter(Boolean);
  for (const tok of tokens) {
    const idx = entry.bodyLower.indexOf(tok);
    if (idx !== -1) {
      const start = Math.max(0, idx - 60);
      const end = Math.min(entry.body.length, idx + tok.length + 100);
      let snip = entry.body.slice(start, end);
      if (start > 0) snip = "…" + snip;
      if (end < entry.body.length) snip = snip + "…";
      return snip;
    }
  }
  return entry.oneLiner;
}

function highlightSnippet(snippet: string, query: string): React.ReactNode {
  const tokens = query.toLowerCase().split(/\s+/).filter(Boolean);
  if (!tokens.length) return snippet;
  const pattern = new RegExp(
    `(${tokens.map((t) => t.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")).join("|")})`,
    "gi",
  );
  const parts = snippet.split(pattern);
  return parts.map((part, i) =>
    pattern.test(part) ? (
      <mark
        key={i}
        style={{ background: "#ffff00", color: "#000", padding: "0 2px" }}
      >
        {part}
      </mark>
    ) : (
      <span key={i}>{part}</span>
    ),
  );
}

export function SearchBar({
  bundle,
  lang,
  navigate,
  ui,
}: {
  bundle: LessonBundle;
  lang: Lang;
  navigate: (target: LessonRef) => void;
  ui: Record<string, string>;
}) {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const indexRef = useRef<IndexEntry[] | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  const ensureIndex = useCallback(() => {
    if (indexRef.current === null) {
      indexRef.current = buildIndex(bundle, lang);
    }
    return indexRef.current;
  }, [bundle, lang]);

  useEffect(() => {
    indexRef.current = null;
  }, [bundle, lang]);

  useEffect(() => {
    if (!open) return;
    function onDoc(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onDoc);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDoc);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const results = useMemo(() => {
    if (!query.trim()) return [];
    return searchIndex(query, ensureIndex());
  }, [query, ensureIndex]);

  return (
    <div
      ref={containerRef}
      style={{ position: "relative", display: "flex", alignItems: "center", gap: 6 }}
    >
      <span style={{ color: "#aaa", fontSize: 11, fontFamily: "inherit" }}>⌕</span>
      <input
        type="text"
        value={query}
        placeholder={ui.searchPlaceholder ?? "SEARCH"}
        onFocus={() => {
          ensureIndex();
          setOpen(true);
        }}
        onChange={(e) => {
          setQuery(e.target.value);
          setOpen(true);
        }}
        style={{
          background: "#000",
          color: "#fff",
          border: "1px solid #fff",
          fontFamily: "inherit",
          fontSize: 11,
          letterSpacing: 1,
          padding: "2px 6px",
          width: 180,
          imageRendering: "pixelated",
          borderRadius: 0,
          outline: "none",
        }}
      />
      {open && query.trim() && (
        <div
          style={{
            position: "absolute",
            top: "calc(100% + 4px)",
            right: 0,
            width: 380,
            maxHeight: 420,
            overflowY: "auto",
            background: "#000",
            border: "2px solid #fff",
            zIndex: 1000,
            fontFamily: "inherit",
            fontSize: 10,
            letterSpacing: 1,
            imageRendering: "pixelated",
          }}
        >
          {results.length === 0 ? (
            <div style={{ padding: "10px 12px", color: "#aaa" }}>
              {ui.searchNoResults ?? "NO RESULTS"}
            </div>
          ) : (
            <>
              <div
                style={{
                  padding: "4px 12px",
                  color: "#aaa",
                  borderBottom: "1px solid #333",
                  fontSize: 9,
                }}
              >
                {(ui.searchResults ?? "{{count}} RESULTS").replace(
                  "{{count}}",
                  String(results.length),
                )}
              </div>
              {results.map((r) => {
                const trackMeta = TRACKS_BY_SLUG[r.track];
                return (
                  <button
                    key={`${r.track}/${r.lesson}`}
                    onClick={() => {
                      navigate({ track: r.track, lesson: r.lesson });
                      setOpen(false);
                      setQuery("");
                    }}
                    style={{
                      display: "block",
                      width: "100%",
                      textAlign: "left",
                      background: "transparent",
                      border: "none",
                      borderBottom: "1px solid #222",
                      color: "#fff",
                      fontFamily: "inherit",
                      fontSize: "inherit",
                      letterSpacing: "inherit",
                      padding: "8px 12px",
                      cursor: "pointer",
                      borderRadius: 0,
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = "#1a1a1a")}
                    onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                  >
                    <div style={{ color: "#888", fontSize: 8, marginBottom: 3 }}>
                      {trackMeta?.glyph}{" "}
                      {trackMeta?.i18n[lang].title.toUpperCase()}
                    </div>
                    <div
                      style={{
                        color: "#fff",
                        fontWeight: "bold",
                        marginBottom: 4,
                        fontSize: 11,
                      }}
                    >
                      {highlightSnippet(r.title, query)}
                    </div>
                    <div style={{ color: "#bbb", fontSize: 9, lineHeight: 1.5 }}>
                      {highlightSnippet(snippetFor(r, query), query)}
                    </div>
                  </button>
                );
              })}
            </>
          )}
        </div>
      )}
    </div>
  );
}
