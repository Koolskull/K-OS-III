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
 *
 *  Layout rules (2026-07):
 *  - Left chapter menu and article body scroll independently.
 *  - On narrow / mobile the chapter menu becomes a CornerChrome toggle
 *    (same pattern as Tilemap Painter) so the article uses full phone width.
 *  - On large desktop screens (≥1400px) reading fonts are slightly tighter.
 */

import React, { useCallback, useState, useEffect } from "react";
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
import {
  CornerHost,
  CornerPanel,
  VerticalChromeToggle,
  CornerDismissLayer,
  useIsNarrow,
} from "@/components/ui/CornerChrome";

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
import EnKoolDrawTimeline from "@/lib/doc/articles/en/kooldraw-timeline";
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

function useIsLarge(breakpoint = 1400) {
  const [large, setLarge] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia(`(min-width: ${breakpoint}px)`);
    const update = () => setLarge(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, [breakpoint]);
  return large;
}

export function Manual({
  initialSlug,
  lang: initialLang = DEFAULT_LANG,
  mode,
  onSlugChange,
  onLangChange,
}: ManualProps) {
  // CornerHost only for window mode (desktop app). Route mode uses the page layout.
  if (mode === "window") {
    return (
      <CornerHost storageKey="kos-manual-chrome" style={{ background: "#000" }}>
        <ManualInner
          initialSlug={initialSlug}
          lang={initialLang}
          mode={mode}
          onSlugChange={onSlugChange}
          onLangChange={onLangChange}
        />
      </CornerHost>
    );
  }
  return (
    <ManualInner
      initialSlug={initialSlug}
      lang={initialLang}
      mode={mode}
      onSlugChange={onSlugChange}
      onLangChange={onLangChange}
    />
  );
}

function ManualInner({
  initialSlug,
  lang: initialLang = DEFAULT_LANG,
  mode,
  onSlugChange,
  onLangChange,
}: ManualProps) {
  const [slug, setSlug] = useState<string | null>(initialSlug ?? null);
  const [lang, setLangState] = useState<Lang>(initialLang);
  const isNarrow = useIsNarrow(720);
  const isLarge = useIsLarge(1400);

  // Slightly tighter reading sizes on big monitors
  const bodyFont = isLarge ? 12 : 14;

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
        const el = document.getElementById("manual-main-scroll");
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

  const sidebarContent = (
    <>
      <button
        onClick={() => navigate(null)}
        style={{
          background: "transparent",
          border: "none",
          color: slug === null ? "#ffff00" : "#aaaaaa",
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
                      color: a.slug === slug ? "#ffff00" : "#cccccc",
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
                    {a.slug === slug ? "▶ " : "  "}
                    {a.i18n[lang].title}
                  </button>
                </li>
              ))}
            </ul>
          </div>
        );
      })}
    </>
  );

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
        <Header
          slug={slug}
          lang={lang}
          navigate={navigate}
          setLang={setLang}
          ui={ui}
        />

        {/* Independent scroll columns */}
        <div
          style={{
            flex: 1,
            display: "flex",
            overflow: "hidden",
            position: "relative",
          }}
        >
          {/* Desktop sidebar — own scroll */}
          {!isNarrow && (
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
                height: "100%",
              }}
            >
              {sidebarContent}
            </aside>
          )}

          {/* Main article — independent scroll */}
          <main
            id="manual-main-scroll"
            style={{
              flex: 1,
              overflowY: "auto",
              padding: isNarrow ? "16px 14px 48px" : "20px 28px 60px",
              maxWidth: isNarrow ? "100%" : 760,
              height: "100%",
              // Slight scale-down of nested article components on large screens
              fontSize: isLarge ? "0.92em" : "1em",
            }}
          >
            {article ? (
              <ArticleView article={article} lang={lang} ui={ui} />
            ) : (
              <Index lang={lang} ui={ui} bodyFont={bodyFont} />
            )}
          </main>

          {/* Mobile: chapter menu as CornerChrome panel */}
          {isNarrow && mode === "window" && (
            <>
              <CornerPanel id="chapters" corner="top-left" label="CHAP">
                <div
                  style={{
                    padding: "8px 6px",
                    fontSize: 10,
                    letterSpacing: 1,
                    maxHeight: "60vh",
                    overflowY: "auto",
                  }}
                >
                  {sidebarContent}
                </div>
              </CornerPanel>
              <CornerDismissLayer />
              <VerticalChromeToggle corner="bottom-right" />
            </>
          )}

          {/* Route mode on mobile: simple top-left toggle button (no CornerHost) */}
          {isNarrow && mode === "route" && (
            <RouteMobileSidebar sidebarContent={sidebarContent} />
          )}
        </div>
      </div>
    </NavCtx.Provider>
  );
}

/** Simple overlay sidebar for /doc routes on mobile (no CornerHost available). */
function RouteMobileSidebar({ sidebarContent }: { sidebarContent: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        style={{
          position: "absolute",
          top: 8,
          left: 8,
          zIndex: 40,
          width: 36,
          height: 28,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: open ? "#ffffff" : "#000000",
          color: open ? "#000000" : "#888888",
          border: "1px solid #555555",
          fontFamily: "var(--dm-font-primary), monospace",
          fontSize: 8,
          letterSpacing: 1,
          cursor: "pointer",
          imageRendering: "pixelated",
        }}
      >
        CHAP
      </button>
      {open && (
        <>
          <div
            style={{ position: "absolute", inset: 0, zIndex: 30 }}
            onClick={() => setOpen(false)}
          />
          <div
            style={{
              position: "absolute",
              top: 40,
              left: 4,
              zIndex: 35,
              backgroundColor: "#000000",
              border: "1px solid #333333",
              color: "#ffffff",
              fontFamily: "var(--dm-font-primary), monospace",
              fontSize: 10,
              maxWidth: "min(92vw, 280px)",
              maxHeight: "min(70vh, 420px)",
              overflow: "auto",
              padding: 8,
            }}
          >
            {sidebarContent}
          </div>
        </>
      )}
    </>
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

function Index({
  lang,
  ui,
  bodyFont,
}: {
  lang: Lang;
  ui: Record<string, string>;
  bodyFont: number;
}) {
  return (
    <>
      <ArticleTitle>{ui.indexTitle}</ArticleTitle>
      <SubtleNote>{ui.versionLine.replace("{{count}}", String(ARTICLES.length))}</SubtleNote>

      <p style={{ fontSize: bodyFont, lineHeight: 1.6, color: "#ddd", marginBottom: 24 }}>
        {ui.indexBlurb}{" "}
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
        ☦ K-OS III · 2KOOL PRODUCTIONS
        <br />
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
    "kooldraw-timeline": EnKoolDrawTimeline,
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
