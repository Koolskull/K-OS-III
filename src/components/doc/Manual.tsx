"use client";

/*
 *                    ☦
 *      THE K-OS MANUAL
 *
 *  Wikipedia-style documentation rendered in K-OS chrome. Used in two places:
 *    - As a route under /doc + /doc/[slug] (standalone page, real URLs)
 *    - As an in-OS desktop app (window-mode, internal navigation)
 *
 *  Pass mode="route" for the route version (deep-linkable URLs) or
 *  mode="window" for the in-OS app (purely local nav state).
 */

import React, { Suspense, useCallback, useMemo, useState } from "react";
import {
  ARTICLES,
  ARTICLES_BY_SLUG,
  CATEGORY_LABELS,
  CATEGORY_DESCRIPTIONS,
  articlesInCategory,
  type ArticleCategory,
  type ArticleMeta,
} from "@/lib/doc/articles";
import { NavCtx, ArticleTitle, SubtleNote, SeeAlso, Crossref } from "./elements";

export interface ManualProps {
  /** Initial slug to display, or null/undefined for the index. */
  initialSlug?: string | null;
  /** "route" pushes URL changes; "window" keeps everything in local state. */
  mode: "route" | "window";
  /** Called when the slug changes — used by route-mode to update the URL. */
  onSlugChange?: (slug: string | null) => void;
}

const CATEGORY_ORDER: ArticleCategory[] = [
  "foundations",
  "datamoshpit",
  "visuals",
  "deeper",
  "reference",
];

export function Manual({ initialSlug, mode, onSlugChange }: ManualProps) {
  const [slug, setSlug] = useState<string | null>(initialSlug ?? null);

  // Sync internal slug state with prop changes (route navigation in route mode)
  React.useEffect(() => {
    if (initialSlug !== undefined) setSlug(initialSlug ?? null);
  }, [initialSlug]);

  const navigate = useCallback(
    (target: string | null) => {
      setSlug(target);
      if (mode === "route") onSlugChange?.(target);
      // Scroll the article container to top on nav
      requestAnimationFrame(() => {
        const el = document.getElementById("manual-scroll");
        if (el) el.scrollTop = 0;
        else window.scrollTo({ top: 0 });
      });
    },
    [mode, onSlugChange],
  );

  const article = slug ? ARTICLES_BY_SLUG[slug] : null;

  return (
    <NavCtx.Provider value={{ navigate }}>
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
        <Header slug={slug} navigate={navigate} />
        <div
          id="manual-scroll"
          style={{
            flex: 1,
            overflowY: "auto",
            display: "flex",
          }}
        >
          <Sidebar currentSlug={slug} navigate={navigate} />
          <main
            style={{
              flex: 1,
              padding: "20px 28px 60px",
              maxWidth: 760,
            }}
          >
            {article ? <ArticleView article={article} /> : <Index />}
          </main>
        </div>
      </div>
    </NavCtx.Provider>
  );
}

/* ------------------------------------------------------------------ */
/*  Header                                                             */
/* ------------------------------------------------------------------ */

function Header({
  slug,
  navigate,
}: {
  slug: string | null;
  navigate: (s: string | null) => void;
}) {
  return (
    <div
      style={{
        backgroundColor: "#fff",
        color: "#000",
        padding: "4px 12px",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        borderBottom: "2px solid #000",
        fontFamily: "var(--dm-font-primary), monospace",
        fontSize: 11,
        letterSpacing: 2,
        flexShrink: 0,
      }}
    >
      <div>
        <button
          onClick={() => navigate(null)}
          style={{
            background: "transparent",
            border: "none",
            color: "#000",
            fontFamily: "inherit",
            fontSize: "inherit",
            letterSpacing: "inherit",
            cursor: "pointer",
            padding: 0,
            textDecoration: slug !== null ? "underline" : "none",
          }}
        >
          ☦ K-OS MANUAL
        </button>
        {slug && ARTICLES_BY_SLUG[slug] ? (
          <span style={{ marginLeft: 8, color: "#444" }}>
            / {ARTICLES_BY_SLUG[slug].title.toUpperCase()}
          </span>
        ) : null}
      </div>
      <span style={{ fontSize: 9, color: "#444" }}>0.2.0-beta.1</span>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Sidebar (TOC always visible)                                       */
/* ------------------------------------------------------------------ */

function Sidebar({
  currentSlug,
  navigate,
}: {
  currentSlug: string | null;
  navigate: (s: string | null) => void;
}) {
  return (
    <aside
      style={{
        width: 220,
        flexShrink: 0,
        borderRight: "2px solid #222",
        padding: "16px 12px",
        fontSize: 10,
        letterSpacing: 1,
        backgroundColor: "#0a0a0a",
        overflowY: "auto",
      }}
    >
      <button
        onClick={() => navigate(null)}
        style={{
          background: "transparent",
          border: "none",
          color: currentSlug === null ? "#ffff00" : "#aaaaaa",
          fontFamily: "inherit",
          fontSize: "inherit",
          letterSpacing: "inherit",
          cursor: "pointer",
          padding: "2px 4px",
          marginBottom: 12,
          display: "block",
          width: "100%",
          textAlign: "left",
        }}
      >
        ◇ INDEX
      </button>
      {CATEGORY_ORDER.map((cat) => {
        const list = articlesInCategory(cat);
        if (list.length === 0) return null;
        return (
          <div key={cat} style={{ marginBottom: 14 }}>
            <div
              style={{
                color: "#888",
                marginBottom: 4,
                paddingBottom: 2,
                borderBottom: "1px solid #222",
              }}
            >
              {CATEGORY_LABELS[cat]}
            </div>
            <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
              {list.map((a) => (
                <li key={a.slug} style={{ marginBottom: 2 }}>
                  <button
                    onClick={() => navigate(a.slug)}
                    style={{
                      background: "transparent",
                      border: "none",
                      color: a.slug === currentSlug ? "#ffff00" : "#cccccc",
                      fontFamily: "inherit",
                      fontSize: "inherit",
                      letterSpacing: "inherit",
                      cursor: "pointer",
                      padding: "2px 4px",
                      display: "block",
                      width: "100%",
                      textAlign: "left",
                    }}
                  >
                    {a.slug === currentSlug ? "▶ " : "  "}{a.title.toUpperCase()}
                  </button>
                </li>
              ))}
            </ul>
          </div>
        );
      })}
    </aside>
  );
}

/* ------------------------------------------------------------------ */
/*  Index page                                                         */
/* ------------------------------------------------------------------ */

function Index() {
  return (
    <>
      <ArticleTitle>K-OS Manual</ArticleTitle>
      <SubtleNote>VERSION 0.2.0-BETA.1 · {ARTICLES.length} ARTICLES</SubtleNote>

      <p style={{ fontSize: 14, lineHeight: 1.6, color: "#ddd", marginBottom: 24 }}>
        A small, opinionated encyclopedia for K-OS III. Beginner-friendly intros
        link to deeper articles when you want to go further. Read whatever
        catches your eye, in any order. Start with{" "}
        <Crossref to="welcome" /> if you want a guided tour.
      </p>

      {CATEGORY_ORDER.map((cat) => {
        const list = articlesInCategory(cat);
        if (list.length === 0) return null;
        return (
          <section key={cat} style={{ marginBottom: 28 }}>
            <h2
              style={{
                fontFamily: "var(--dm-font-primary), monospace",
                fontSize: 16,
                letterSpacing: 2,
                color: "#ffff00",
                marginBottom: 6,
                paddingBottom: 4,
                borderBottom: "1px solid #444",
              }}
            >
              {CATEGORY_LABELS[cat]}
            </h2>
            <p style={{ fontSize: 11, color: "#888", marginBottom: 12, letterSpacing: 1 }}>
              {CATEGORY_DESCRIPTIONS[cat].toUpperCase()}
            </p>
            <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
              {list.map((a) => (
                <ArticleListItem key={a.slug} article={a} />
              ))}
            </ul>
          </section>
        );
      })}

      <div
        style={{
          marginTop: 40,
          paddingTop: 16,
          borderTop: "2px solid #444",
          fontSize: 11,
          color: "#888",
          letterSpacing: 1,
        }}
      >
        ☦ K-OS III · 2KOOL PRODUCTIONS<br />
        On contested topics, this manual presents the debate rather than the
        verdict. See{" "}
        <a
          href="https://github.com/Koolskull/K-OS-III/blob/master/docs/EPISTEMIC_STANCE.md"
          style={{ color: "#ffff00" }}
        >
          docs/EPISTEMIC_STANCE.md
        </a>
        .
      </div>
    </>
  );
}

function ArticleListItem({ article }: { article: ArticleMeta }) {
  const levelLabel =
    article.level === "beginner"
      ? "BEGINNER"
      : article.level === "intermediate"
        ? "INTERMEDIATE"
        : "ADVANCED";
  const levelColor =
    article.level === "beginner"
      ? "#00ff88"
      : article.level === "intermediate"
        ? "#ffaa00"
        : "#ff5588";
  return (
    <li style={{ marginBottom: 8, paddingLeft: 12 }}>
      <Crossref to={article.slug}>{article.title}</Crossref>
      <span
        style={{
          marginLeft: 8,
          fontSize: 9,
          padding: "1px 4px",
          color: levelColor,
          border: `1px solid ${levelColor}`,
          letterSpacing: 1,
        }}
      >
        {levelLabel}
      </span>
      <div style={{ fontSize: 11, color: "#aaaaaa", marginTop: 2 }}>
        {article.oneLiner}
      </div>
    </li>
  );
}

/* ------------------------------------------------------------------ */
/*  Article view                                                       */
/* ------------------------------------------------------------------ */

const ARTICLE_COMPONENTS: Record<string, React.LazyExoticComponent<React.ComponentType>> = {
  welcome: React.lazy(() => import("@/lib/doc/articles/welcome")),
  "what-is-a-tracker": React.lazy(() => import("@/lib/doc/articles/what-is-a-tracker")),
  hexadecimal: React.lazy(() => import("@/lib/doc/articles/hexadecimal")),
  "terminal-basics": React.lazy(() => import("@/lib/doc/articles/terminal-basics")),
  "running-k-os-locally": React.lazy(() => import("@/lib/doc/articles/running-k-os-locally")),
  "song-chain-phrase": React.lazy(() => import("@/lib/doc/articles/song-chain-phrase")),
  "effect-commands": React.lazy(() => import("@/lib/doc/articles/effect-commands")),
  slimentologika: React.lazy(() => import("@/lib/doc/articles/slimentologika")),
  "per-instrument-visuals": React.lazy(() => import("@/lib/doc/articles/per-instrument-visuals")),
  "scene-vm": React.lazy(() => import("@/lib/doc/articles/scene-vm")),
  "dmpit-format": React.lazy(() => import("@/lib/doc/articles/dmpit-format")),
  "the-rules": React.lazy(() => import("@/lib/doc/articles/the-rules")),
  glossary: React.lazy(() => import("@/lib/doc/articles/glossary")),
};

function ArticleView({ article }: { article: ArticleMeta }) {
  const Body = ARTICLE_COMPONENTS[article.slug];
  return (
    <>
      <ArticleTitle>{article.title}</ArticleTitle>
      <SubtleNote>
        {article.level.toUpperCase()} · {CATEGORY_LABELS[article.category]}
      </SubtleNote>
      <Suspense fallback={<div style={{ color: "#888" }}>Loading…</div>}>
        {Body ? <Body /> : <div style={{ color: "#ff5555" }}>Article not found.</div>}
      </Suspense>
      {article.seeAlso && article.seeAlso.length > 0 ? (
        <SeeAlso slugs={article.seeAlso} />
      ) : null}
    </>
  );
}

export default Manual;
