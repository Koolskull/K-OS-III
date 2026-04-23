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

import React, { useCallback, useState } from "react";
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

// Static article imports — bundled with the Manual chunk.
// Done this way (not React.lazy) because Turbopack's hot reload occasionally
// invalidates lazy chunk hashes mid-session and the browser can't fetch the
// renamed chunk, throwing ChunkLoadError. Static imports tie article bodies
// to the parent module — they always load when Manual loads.
// English
import EnWelcome from "@/lib/doc/articles/en/welcome";
import EnWhatIsATracker from "@/lib/doc/articles/en/what-is-a-tracker";
import EnHexadecimal from "@/lib/doc/articles/en/hexadecimal";
import EnTerminalBasics from "@/lib/doc/articles/en/terminal-basics";
import EnRunningKOSLocally from "@/lib/doc/articles/en/running-k-os-locally";
import EnSongChainPhrase from "@/lib/doc/articles/en/song-chain-phrase";
import EnEffectCommands from "@/lib/doc/articles/en/effect-commands";
import EnSlimentologika from "@/lib/doc/articles/en/slimentologika";
import EnPerInstrumentVisuals from "@/lib/doc/articles/en/per-instrument-visuals";
import EnSceneVM from "@/lib/doc/articles/en/scene-vm";
import EnDmpitFormat from "@/lib/doc/articles/en/dmpit-format";
import EnTheRules from "@/lib/doc/articles/en/the-rules";
import EnGlossary from "@/lib/doc/articles/en/glossary";
// Spanish
import EsWelcome from "@/lib/doc/articles/es/welcome";
import EsWhatIsATracker from "@/lib/doc/articles/es/what-is-a-tracker";
import EsHexadecimal from "@/lib/doc/articles/es/hexadecimal";
import EsTerminalBasics from "@/lib/doc/articles/es/terminal-basics";
import EsRunningKOSLocally from "@/lib/doc/articles/es/running-k-os-locally";
import EsSongChainPhrase from "@/lib/doc/articles/es/song-chain-phrase";
import EsEffectCommands from "@/lib/doc/articles/es/effect-commands";
import EsSlimentologika from "@/lib/doc/articles/es/slimentologika";
import EsPerInstrumentVisuals from "@/lib/doc/articles/es/per-instrument-visuals";
import EsSceneVM from "@/lib/doc/articles/es/scene-vm";
import EsDmpitFormat from "@/lib/doc/articles/es/dmpit-format";
import EsTheRules from "@/lib/doc/articles/es/the-rules";
import EsGlossary from "@/lib/doc/articles/es/glossary";
// Japanese
import JaWelcome from "@/lib/doc/articles/ja/welcome";
import JaWhatIsATracker from "@/lib/doc/articles/ja/what-is-a-tracker";
import JaHexadecimal from "@/lib/doc/articles/ja/hexadecimal";
import JaTerminalBasics from "@/lib/doc/articles/ja/terminal-basics";
import JaRunningKOSLocally from "@/lib/doc/articles/ja/running-k-os-locally";
import JaSongChainPhrase from "@/lib/doc/articles/ja/song-chain-phrase";
import JaEffectCommands from "@/lib/doc/articles/ja/effect-commands";
import JaSlimentologika from "@/lib/doc/articles/ja/slimentologika";
import JaPerInstrumentVisuals from "@/lib/doc/articles/ja/per-instrument-visuals";
import JaSceneVM from "@/lib/doc/articles/ja/scene-vm";
import JaDmpitFormat from "@/lib/doc/articles/ja/dmpit-format";
import JaTheRules from "@/lib/doc/articles/ja/the-rules";
import JaGlossary from "@/lib/doc/articles/ja/glossary";
// Chinese
import ZhWelcome from "@/lib/doc/articles/zh/welcome";
import ZhWhatIsATracker from "@/lib/doc/articles/zh/what-is-a-tracker";
import ZhHexadecimal from "@/lib/doc/articles/zh/hexadecimal";
import ZhTerminalBasics from "@/lib/doc/articles/zh/terminal-basics";
import ZhRunningKOSLocally from "@/lib/doc/articles/zh/running-k-os-locally";
import ZhSongChainPhrase from "@/lib/doc/articles/zh/song-chain-phrase";
import ZhEffectCommands from "@/lib/doc/articles/zh/effect-commands";
import ZhSlimentologika from "@/lib/doc/articles/zh/slimentologika";
import ZhPerInstrumentVisuals from "@/lib/doc/articles/zh/per-instrument-visuals";
import ZhSceneVM from "@/lib/doc/articles/zh/scene-vm";
import ZhDmpitFormat from "@/lib/doc/articles/zh/dmpit-format";
import ZhTheRules from "@/lib/doc/articles/zh/the-rules";
import ZhGlossary from "@/lib/doc/articles/zh/glossary";

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
        backgroundColor: "#000",
        color: "#fff",
        padding: "4px 12px",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        borderBottom: "2px solid #fff",
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
            color: "#fff",
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
          <span style={{ marginLeft: 8, color: "#aaa" }}>
            / {article.i18n[lang].title.toUpperCase()}
          </span>
        ) : null}
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
        <span style={{ fontSize: 9, color: "#aaa" }}>{ui.languageLabel}:</span>
        <select
          value={lang}
          onChange={(e) => setLang(e.target.value as Lang)}
          style={{
            background: "#000",
            color: "#fff",
            border: "1px solid #fff",
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
        <span style={{ fontSize: 9, color: "#666" }}>0.2.0-beta.1</span>
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

const ARTICLE_COMPONENTS: Record<Lang, Record<string, React.ComponentType>> = {
  en: {
    welcome: EnWelcome,
    "what-is-a-tracker": EnWhatIsATracker,
    hexadecimal: EnHexadecimal,
    "terminal-basics": EnTerminalBasics,
    "running-k-os-locally": EnRunningKOSLocally,
    "song-chain-phrase": EnSongChainPhrase,
    "effect-commands": EnEffectCommands,
    slimentologika: EnSlimentologika,
    "per-instrument-visuals": EnPerInstrumentVisuals,
    "scene-vm": EnSceneVM,
    "dmpit-format": EnDmpitFormat,
    "the-rules": EnTheRules,
    glossary: EnGlossary,
  },
  es: {
    welcome: EsWelcome,
    "what-is-a-tracker": EsWhatIsATracker,
    hexadecimal: EsHexadecimal,
    "terminal-basics": EsTerminalBasics,
    "running-k-os-locally": EsRunningKOSLocally,
    "song-chain-phrase": EsSongChainPhrase,
    "effect-commands": EsEffectCommands,
    slimentologika: EsSlimentologika,
    "per-instrument-visuals": EsPerInstrumentVisuals,
    "scene-vm": EsSceneVM,
    "dmpit-format": EsDmpitFormat,
    "the-rules": EsTheRules,
    glossary: EsGlossary,
  },
  ja: {
    welcome: JaWelcome,
    "what-is-a-tracker": JaWhatIsATracker,
    hexadecimal: JaHexadecimal,
    "terminal-basics": JaTerminalBasics,
    "running-k-os-locally": JaRunningKOSLocally,
    "song-chain-phrase": JaSongChainPhrase,
    "effect-commands": JaEffectCommands,
    slimentologika: JaSlimentologika,
    "per-instrument-visuals": JaPerInstrumentVisuals,
    "scene-vm": JaSceneVM,
    "dmpit-format": JaDmpitFormat,
    "the-rules": JaTheRules,
    glossary: JaGlossary,
  },
  zh: {
    welcome: ZhWelcome,
    "what-is-a-tracker": ZhWhatIsATracker,
    hexadecimal: ZhHexadecimal,
    "terminal-basics": ZhTerminalBasics,
    "running-k-os-locally": ZhRunningKOSLocally,
    "song-chain-phrase": ZhSongChainPhrase,
    "effect-commands": ZhEffectCommands,
    slimentologika: ZhSlimentologika,
    "per-instrument-visuals": ZhPerInstrumentVisuals,
    "scene-vm": ZhSceneVM,
    "dmpit-format": ZhDmpitFormat,
    "the-rules": ZhTheRules,
    glossary: ZhGlossary,
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
      {Body ? <Body /> : <div style={{ color: "#ff5555" }}>{ui.notFound}</div>}
      {article.seeAlso && article.seeAlso.length > 0 ? (
        <SeeAlso slugs={article.seeAlso} label={ui.seeAlso} />
      ) : null}
    </>
  );
}

export default Manual;
