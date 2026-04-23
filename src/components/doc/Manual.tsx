"use client";

/*
 *                    ☦
 *      THE K-OS MANUAL (i18n)
 *
 *  Wikipedia-style documentation rendered in K-OS chrome. Two surfaces:
 *    - Routes /doc + /doc/[slug] (English) and /doc/lang/[lang]/[slug]
 *      for other languages.
 *    - In-OS desktop app (window mode, internal navigation).
 *
 *  Article bodies live at src/lib/doc/articles/<lang>/<slug>.tsx and are
 *  pre-imported into the ARTICLE_COMPONENTS map below for static-export
 *  compatibility. Cross-references stay slug-based; they resolve into the
 *  current language via NavCtx.
 */

import React, { Suspense, useCallback, useState } from "react";
import {
  ARTICLES,
  ARTICLES_BY_SLUG,
  CATEGORY_LABELS,
  CATEGORY_DESCRIPTIONS,
  UI_STRINGS,
  LANGUAGES,
  LANG_LABELS,
  LANG_SHORT,
  DEFAULT_LANG,
  articlesInCategory,
  type ArticleCategory,
  type ArticleMeta,
  type Lang,
} from "@/lib/doc/articles";
import { NavCtx, ArticleTitle, SubtleNote, SeeAlso, Crossref } from "./elements";

export interface ManualProps {
  initialSlug?: string | null;
  lang?: Lang;
  mode: "route" | "window";
  onSlugChange?: (slug: string | null, lang: Lang) => void;
  onLangChange?: (lang: Lang, slug: string | null) => void;
}

const CATEGORY_ORDER: ArticleCategory[] = [
  "foundations",
  "datamoshpit",
  "visuals",
  "deeper",
  "reference",
];

export function Manual({
  initialSlug,
  lang: initialLang = DEFAULT_LANG,
  mode,
  onSlugChange,
  onLangChange,
}: ManualProps) {
  const [slug, setSlug] = useState<string | null>(initialSlug ?? null);
  const [lang, setLangState] = useState<Lang>(initialLang);

  React.useEffect(() => {
    if (initialSlug !== undefined) setSlug(initialSlug ?? null);
  }, [initialSlug]);
  React.useEffect(() => {
    setLangState(initialLang);
  }, [initialLang]);

  const navigate = useCallback(
    (target: string | null) => {
      setSlug(target);
      if (mode === "route") onSlugChange?.(target, lang);
      requestAnimationFrame(() => {
        const el = document.getElementById("manual-scroll");
        if (el) el.scrollTop = 0;
        else window.scrollTo({ top: 0 });
      });
    },
    [mode, onSlugChange, lang],
  );

  const setLang = useCallback(
    (next: Lang) => {
      setLangState(next);
      if (mode === "route") onLangChange?.(next, slug);
    },
    [mode, onLangChange, slug],
  );

  const article = slug ? ARTICLES_BY_SLUG[slug] : null;
  const ui = UI_STRINGS[lang];

  return (
    <NavCtx.Provider value={{ lang, navigate, setLang }}>
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
        <Header slug={slug} lang={lang} navigate={navigate} setLang={setLang} ui={ui} />
        <div id="manual-scroll" style={{ flex: 1, overflowY: "auto", display: "flex" }}>
          <Sidebar currentSlug={slug} lang={lang} navigate={navigate} ui={ui} />
          <main style={{ flex: 1, padding: "20px 28px 60px", maxWidth: 760 }}>
            {article ? <ArticleView article={article} lang={lang} ui={ui} /> : <Index lang={lang} ui={ui} />}
          </main>
        </div>
      </div>
    </NavCtx.Provider>
  );
}

function Header({
  slug,
  lang,
  navigate,
  setLang,
  ui,
}: {
  slug: string | null;
  lang: Lang;
  navigate: (s: string | null) => void;
  setLang: (l: Lang) => void;
  ui: Record<string, string>;
}) {
  const article = slug ? ARTICLES_BY_SLUG[slug] : null;
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
        gap: 12,
      }}
    >
      <div style={{ minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
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
          ☦ K-OS · {ui.indexTitle.toUpperCase()}
        </button>
        {article ? (
          <span style={{ marginLeft: 8, color: "#444" }}>
            / {article.i18n[lang].title.toUpperCase()}
          </span>
        ) : null}
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
        <span style={{ fontSize: 9, color: "#666" }}>{ui.languageLabel}:</span>
        <select
          value={lang}
          onChange={(e) => setLang(e.target.value as Lang)}
          style={{
            background: "#000",
            color: "#fff",
            border: "1px solid #000",
            fontFamily: "inherit",
            fontSize: 10,
            padding: "1px 4px",
            letterSpacing: 1,
            cursor: "pointer",
            imageRendering: "pixelated",
          }}
        >
          {LANGUAGES.map((l) => (
            <option key={l} value={l}>
              {LANG_LABELS[l]}
            </option>
          ))}
        </select>
        <span style={{ fontSize: 9, color: "#444" }}>0.2.0-beta.1</span>
      </div>
    </div>
  );
}

function Sidebar({
  currentSlug,
  lang,
  navigate,
  ui,
}: {
  currentSlug: string | null;
  lang: Lang;
  navigate: (s: string | null) => void;
  ui: Record<string, string>;
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
        ◇ {ui.backToIndex}
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
              {CATEGORY_LABELS[lang][cat]}
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
                    {a.slug === currentSlug ? "▶ " : "  "}{a.i18n[lang].title}
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

function Index({ lang, ui }: { lang: Lang; ui: Record<string, string> }) {
  return (
    <>
      <ArticleTitle>{ui.indexTitle}</ArticleTitle>
      <SubtleNote>{ui.versionLine.replace("{{count}}", String(ARTICLES.length))}</SubtleNote>

      <p style={{ fontSize: 14, lineHeight: 1.6, color: "#ddd", marginBottom: 24 }}>
        {ui.indexBlurb}
        {" "}
        <Crossref to="welcome" />.
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
              {CATEGORY_LABELS[lang][cat]}
            </h2>
            <p style={{ fontSize: 11, color: "#888", marginBottom: 12, letterSpacing: 1 }}>
              {CATEGORY_DESCRIPTIONS[lang][cat].toUpperCase()}
            </p>
            <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
              {list.map((a) => (
                <ArticleListItem key={a.slug} article={a} lang={lang} ui={ui} />
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
        {ui.epistemicNote}{" "}
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

function ArticleListItem({
  article,
  lang,
  ui,
}: {
  article: ArticleMeta;
  lang: Lang;
  ui: Record<string, string>;
}) {
  const levelLabel =
    article.level === "beginner"
      ? ui.levelBeginner
      : article.level === "intermediate"
        ? ui.levelIntermediate
        : ui.levelAdvanced;
  const levelColor =
    article.level === "beginner"
      ? "#00ff88"
      : article.level === "intermediate"
        ? "#ffaa00"
        : "#ff5588";
  return (
    <li style={{ marginBottom: 8, paddingLeft: 12 }}>
      <Crossref to={article.slug}>{article.i18n[lang].title}</Crossref>
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
        {article.i18n[lang].oneLiner}
      </div>
    </li>
  );
}

const ARTICLE_COMPONENTS: Record<Lang, Record<string, React.LazyExoticComponent<React.ComponentType>>> = {
  en: {
    welcome: React.lazy(() => import("@/lib/doc/articles/en/welcome")),
    "what-is-a-tracker": React.lazy(() => import("@/lib/doc/articles/en/what-is-a-tracker")),
    hexadecimal: React.lazy(() => import("@/lib/doc/articles/en/hexadecimal")),
    "terminal-basics": React.lazy(() => import("@/lib/doc/articles/en/terminal-basics")),
    "running-k-os-locally": React.lazy(() => import("@/lib/doc/articles/en/running-k-os-locally")),
    "song-chain-phrase": React.lazy(() => import("@/lib/doc/articles/en/song-chain-phrase")),
    "effect-commands": React.lazy(() => import("@/lib/doc/articles/en/effect-commands")),
    slimentologika: React.lazy(() => import("@/lib/doc/articles/en/slimentologika")),
    "per-instrument-visuals": React.lazy(() => import("@/lib/doc/articles/en/per-instrument-visuals")),
    "scene-vm": React.lazy(() => import("@/lib/doc/articles/en/scene-vm")),
    "dmpit-format": React.lazy(() => import("@/lib/doc/articles/en/dmpit-format")),
    "the-rules": React.lazy(() => import("@/lib/doc/articles/en/the-rules")),
    glossary: React.lazy(() => import("@/lib/doc/articles/en/glossary")),
  },
  es: {
    welcome: React.lazy(() => import("@/lib/doc/articles/es/welcome")),
    "what-is-a-tracker": React.lazy(() => import("@/lib/doc/articles/es/what-is-a-tracker")),
    hexadecimal: React.lazy(() => import("@/lib/doc/articles/es/hexadecimal")),
    "terminal-basics": React.lazy(() => import("@/lib/doc/articles/es/terminal-basics")),
    "running-k-os-locally": React.lazy(() => import("@/lib/doc/articles/es/running-k-os-locally")),
    "song-chain-phrase": React.lazy(() => import("@/lib/doc/articles/es/song-chain-phrase")),
    "effect-commands": React.lazy(() => import("@/lib/doc/articles/es/effect-commands")),
    slimentologika: React.lazy(() => import("@/lib/doc/articles/es/slimentologika")),
    "per-instrument-visuals": React.lazy(() => import("@/lib/doc/articles/es/per-instrument-visuals")),
    "scene-vm": React.lazy(() => import("@/lib/doc/articles/es/scene-vm")),
    "dmpit-format": React.lazy(() => import("@/lib/doc/articles/es/dmpit-format")),
    "the-rules": React.lazy(() => import("@/lib/doc/articles/es/the-rules")),
    glossary: React.lazy(() => import("@/lib/doc/articles/es/glossary")),
  },
  ja: {
    welcome: React.lazy(() => import("@/lib/doc/articles/ja/welcome")),
    "what-is-a-tracker": React.lazy(() => import("@/lib/doc/articles/ja/what-is-a-tracker")),
    hexadecimal: React.lazy(() => import("@/lib/doc/articles/ja/hexadecimal")),
    "terminal-basics": React.lazy(() => import("@/lib/doc/articles/ja/terminal-basics")),
    "running-k-os-locally": React.lazy(() => import("@/lib/doc/articles/ja/running-k-os-locally")),
    "song-chain-phrase": React.lazy(() => import("@/lib/doc/articles/ja/song-chain-phrase")),
    "effect-commands": React.lazy(() => import("@/lib/doc/articles/ja/effect-commands")),
    slimentologika: React.lazy(() => import("@/lib/doc/articles/ja/slimentologika")),
    "per-instrument-visuals": React.lazy(() => import("@/lib/doc/articles/ja/per-instrument-visuals")),
    "scene-vm": React.lazy(() => import("@/lib/doc/articles/ja/scene-vm")),
    "dmpit-format": React.lazy(() => import("@/lib/doc/articles/ja/dmpit-format")),
    "the-rules": React.lazy(() => import("@/lib/doc/articles/ja/the-rules")),
    glossary: React.lazy(() => import("@/lib/doc/articles/ja/glossary")),
  },
  zh: {
    welcome: React.lazy(() => import("@/lib/doc/articles/zh/welcome")),
    "what-is-a-tracker": React.lazy(() => import("@/lib/doc/articles/zh/what-is-a-tracker")),
    hexadecimal: React.lazy(() => import("@/lib/doc/articles/zh/hexadecimal")),
    "terminal-basics": React.lazy(() => import("@/lib/doc/articles/zh/terminal-basics")),
    "running-k-os-locally": React.lazy(() => import("@/lib/doc/articles/zh/running-k-os-locally")),
    "song-chain-phrase": React.lazy(() => import("@/lib/doc/articles/zh/song-chain-phrase")),
    "effect-commands": React.lazy(() => import("@/lib/doc/articles/zh/effect-commands")),
    slimentologika: React.lazy(() => import("@/lib/doc/articles/zh/slimentologika")),
    "per-instrument-visuals": React.lazy(() => import("@/lib/doc/articles/zh/per-instrument-visuals")),
    "scene-vm": React.lazy(() => import("@/lib/doc/articles/zh/scene-vm")),
    "dmpit-format": React.lazy(() => import("@/lib/doc/articles/zh/dmpit-format")),
    "the-rules": React.lazy(() => import("@/lib/doc/articles/zh/the-rules")),
    glossary: React.lazy(() => import("@/lib/doc/articles/zh/glossary")),
  },
};

function ArticleView({
  article,
  lang,
  ui,
}: {
  article: ArticleMeta;
  lang: Lang;
  ui: Record<string, string>;
}) {
  const Body = ARTICLE_COMPONENTS[lang]?.[article.slug];
  return (
    <>
      <ArticleTitle>{article.i18n[lang].title}</ArticleTitle>
      <SubtleNote>
        {article.level === "beginner"
          ? ui.levelBeginner
          : article.level === "intermediate"
            ? ui.levelIntermediate
            : ui.levelAdvanced}
        {" · "}
        {CATEGORY_LABELS[lang][article.category]}
        {" · "}
        <span style={{ color: "#ffff00" }}>{LANG_SHORT[lang]}</span>
      </SubtleNote>
      <Suspense fallback={<div style={{ color: "#888" }}>{ui.loading}</div>}>
        {Body ? <Body /> : <div style={{ color: "#ff5555" }}>{ui.notFound}</div>}
      </Suspense>
      {article.seeAlso && article.seeAlso.length > 0 ? (
        <SeeAlso slugs={article.seeAlso} label={ui.seeAlso} />
      ) : null}
    </>
  );
}

export default Manual;
