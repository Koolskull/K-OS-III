"use client";

/*
 *                    ☦
 *      WIKI / TEXT READER BOILERPLATE
 *
 *  Copy this file to start a new text-based reading app inside K-OS III.
 *
 *  WHAT THIS GIVES YOU
 *  ───────────────────
 *  • Left chapter / section menu that scrolls independently of the article.
 *  • On mobile / narrow viewports the menu becomes a CornerChrome toggle
 *    (identical pattern to the Tilemap Painter) so the article can use
 *    the full width of the phone.
 *  • On large desktop screens (≥1400px) body text is slightly tighter for
 *    comfortable long-form reading.
 *  • Black / yellow pixel aesthetic matching the rest of K-OS.
 *
 *  HOW TO USE
 *  ──────────
 *  1. Copy this entire folder (or just this file) to
 *        src/components/apps/your-app-name/
 *  2. Rename the component and the storageKey.
 *  3. Replace SAMPLE_ENTRIES with your own data (or load from a JSON /
 *     markdown source).
 *  4. Register the app in two places if you want it visible on the desktop:
 *        • src/components/os/Desktop.tsx  → add to the ICONS array
 *        • src/app/page.tsx              → add to AppId, APP_DEFAULTS,
 *                                          the import, and the render switch
 *     Until you do that, the app stays invisible (safe for experiments).
 *
 *  This file itself is intentionally NOT registered anywhere, so it never
 *  appears as a live desktop icon.
 */

import React, { useState, useCallback, useEffect } from "react";
import {
  CornerHost,
  CornerPanel,
  VerticalChromeToggle,
  CornerDismissLayer,
  useIsNarrow,
} from "@/components/ui/CornerChrome";

/* ------------------------------------------------------------------ */
/*  1. Your data model                                                */
/* ------------------------------------------------------------------ */

export interface WikiEntry {
  id: string;
  title: string;
  category: string;
  body: string; // plain paragraphs separated by \n\n
}

/** Example categories — replace with your own. */
const CATEGORY_ORDER = ["intro", "core", "advanced"] as const;

const CATEGORY_LABELS: Record<(typeof CATEGORY_ORDER)[number], string> = {
  intro: "Introduction",
  core: "Core Concepts",
  advanced: "Advanced",
};

/** Sample content so the boilerplate is immediately runnable. */
const SAMPLE_ENTRIES: WikiEntry[] = [
  {
    id: "welcome",
    title: "Welcome",
    category: "intro",
    body: "This is the starter page for a new wiki-style app.\n\nReplace SAMPLE_ENTRIES with your real content. The left menu lists every entry grouped by category.",
  },
  {
    id: "layout",
    title: "Layout Rules",
    category: "core",
    body: "The sidebar and the article body scroll independently.\n\nOn phones the sidebar collapses into a corner toggle labelled CHAP so the text can use the full screen width.",
  },
  {
    id: "fonts",
    title: "Large Screens",
    category: "advanced",
    body: "When the viewport is wider than 1400 px the body font size drops a couple of points so long articles stay readable on big monitors.",
  },
];

/* ------------------------------------------------------------------ */
/*  2. Small responsive helpers                                       */
/* ------------------------------------------------------------------ */

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

/* ------------------------------------------------------------------ */
/*  3. The app shell                                                  */
/* ------------------------------------------------------------------ */

/**
 * Public entry point. Wrap everything in CornerHost so the mobile
 * chrome system works.
 */
export function WikiReaderBoilerplate() {
  return (
    <CornerHost storageKey="kos-wiki-boilerplate-chrome" style={{ background: "#000" }}>
      <WikiReaderInner />
    </CornerHost>
  );
}

function WikiReaderInner() {
  const [currentId, setCurrentId] = useState<string | null>(null);
  const isNarrow = useIsNarrow(720);
  const isLarge = useIsLarge(1400);

  // Font sizes: a little tighter on large monitors
  const bodyFont = isLarge ? 12 : 14;
  const titleFont = isLarge ? 18 : 22;

  const navigate = useCallback((id: string | null) => {
    setCurrentId(id);
    // Always scroll the article back to the top when changing pages
    requestAnimationFrame(() => {
      const el = document.getElementById("wiki-main-scroll");
      if (el) el.scrollTop = 0;
    });
  }, []);

  const entry = currentId ? SAMPLE_ENTRIES.find((e) => e.id === currentId) : null;

  /* ---- Sidebar content (shared between desktop & mobile) ---- */
  const sidebarContent = (
    <>
      <button
        onClick={() => navigate(null)}
        style={navBtnStyle(currentId === null)}
      >
        ◇ INDEX
      </button>

      {CATEGORY_ORDER.map((cat) => {
        const list = SAMPLE_ENTRIES.filter((e) => e.category === cat);
        if (list.length === 0) return null;
        return (
          <div key={cat} style={{ marginBottom: 14 }}>
            <div style={categoryHeaderStyle}>
              {CATEGORY_LABELS[cat].toUpperCase()}
            </div>
            <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
              {list.map((e) => (
                <li key={e.id} style={{ marginBottom: 2 }}>
                  <button
                    onClick={() => navigate(e.id)}
                    style={navBtnStyle(e.id === currentId)}
                  >
                    {e.id === currentId ? "▶ " : "  "}
                    {e.title}
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
    <div style={rootStyle}>
      {/* ---- Header bar ---- */}
      <div style={headerStyle}>
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
            textDecoration: currentId !== null ? "underline" : "none",
          }}
        >
          ☦ YOUR WIKI TITLE
        </button>
        {entry && (
          <span style={{ color: "#aaa", marginLeft: 12, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            / {entry.title.toUpperCase()}
          </span>
        )}
      </div>

      {/* ---- Body: two independent scroll columns ---- */}
      <div style={{ flex: 1, display: "flex", overflow: "hidden", position: "relative" }}>
        {/* Desktop sidebar */}
        {!isNarrow && (
          <aside style={sidebarStyle}>
            {sidebarContent}
          </aside>
        )}

        {/* Main article pane */}
        <main
          id="wiki-main-scroll"
          style={{
            flex: 1,
            overflowY: "auto",
            padding: isNarrow ? "16px 14px 48px" : "20px 28px 60px",
            maxWidth: isNarrow ? "100%" : 720,
            height: "100%",
          }}
        >
          {entry ? (
            <ArticlePage entry={entry} bodyFont={bodyFont} titleFont={titleFont} />
          ) : (
            <IndexPage
              bodyFont={bodyFont}
              titleFont={titleFont}
              onNavigate={navigate}
            />
          )}
        </main>

        {/* Mobile: CornerChrome chapter panel */}
        {isNarrow && (
          <>
            <CornerPanel id="chapters" corner="top-left" label="CHAP">
              <div style={{ padding: "8px 6px", fontSize: 10, letterSpacing: 1, maxHeight: "60vh", overflowY: "auto" }}>
                {sidebarContent}
              </div>
            </CornerPanel>
            <CornerDismissLayer />
            <VerticalChromeToggle corner="bottom-right" />
          </>
        )}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  4. Page views                                                     */
/* ------------------------------------------------------------------ */

function ArticlePage({
  entry,
  bodyFont,
  titleFont,
}: {
  entry: WikiEntry;
  bodyFont: number;
  titleFont: number;
}) {
  return (
    <>
      <h1 style={{ fontSize: titleFont, letterSpacing: 2, color: "#ffff00", marginBottom: 6, borderBottom: "1px solid #444", paddingBottom: 8 }}>
        {entry.title}
      </h1>
      <div style={{ fontSize: 10, color: "#888", marginBottom: 20, letterSpacing: 1 }}>
        {(CATEGORY_LABELS as any)[entry.category]?.toUpperCase() ?? entry.category.toUpperCase()}
      </div>
      {entry.body.split("\n\n").map((para, i) => (
        <p key={i} style={{ fontSize: bodyFont, lineHeight: 1.65, color: "#dddddd", marginBottom: 16 }}>
          {para}
        </p>
      ))}
    </>
  );
}

function IndexPage({
  bodyFont,
  titleFont,
  onNavigate,
}: {
  bodyFont: number;
  titleFont: number;
  onNavigate: (id: string) => void;
}) {
  return (
    <>
      <h1 style={{ fontSize: titleFont, letterSpacing: 2, color: "#ffff00", marginBottom: 6, borderBottom: "1px solid #444", paddingBottom: 8 }}>
        Your Wiki Title
      </h1>
      <p style={{ fontSize: 11, color: "#888", marginBottom: 24, letterSpacing: 1 }}>
        {SAMPLE_ENTRIES.length} ENTRIES · BOILERPLATE
      </p>
      <p style={{ fontSize: bodyFont, lineHeight: 1.6, color: "#ddd", marginBottom: 28 }}>
        Replace this blurb and the SAMPLE_ENTRIES array with your own content.
        The left menu (or the CHAP corner button on mobile) lists every page.
      </p>

      {CATEGORY_ORDER.map((cat) => {
        const list = SAMPLE_ENTRIES.filter((e) => e.category === cat);
        if (list.length === 0) return null;
        return (
          <section key={cat} style={{ marginBottom: 28 }}>
            <h2 style={{ fontSize: 15, letterSpacing: 2, color: "#ffff00", marginBottom: 8, paddingBottom: 4, borderBottom: "1px solid #333" }}>
              {CATEGORY_LABELS[cat]}
            </h2>
            <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
              {list.map((e) => (
                <li key={e.id} style={{ marginBottom: 6 }}>
                  <button
                    onClick={() => onNavigate(e.id)}
                    style={{
                      background: "transparent",
                      border: "none",
                      color: "#66aaff",
                      fontFamily: "inherit",
                      fontSize: 13,
                      cursor: "pointer",
                      padding: 0,
                      textDecoration: "underline",
                      textAlign: "left",
                    }}
                  >
                    {e.title}
                  </button>
                </li>
              ))}
            </ul>
          </section>
        );
      })}
    </>
  );
}

/* ------------------------------------------------------------------ */
/*  5. Shared styles (kept inline so the file is self-contained)      */
/* ------------------------------------------------------------------ */

const rootStyle: React.CSSProperties = {
  width: "100%",
  height: "100%",
  backgroundColor: "#000000",
  color: "#ffffff",
  fontFamily: "var(--dm-font-primary), monospace",
  imageRendering: "pixelated",
  display: "flex",
  flexDirection: "column",
  overflow: "hidden",
};

const headerStyle: React.CSSProperties = {
  backgroundColor: "#000",
  color: "#fff",
  padding: "6px 14px",
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  borderBottom: "2px solid #fff",
  fontSize: 11,
  letterSpacing: 2,
  flexShrink: 0,
};

const sidebarStyle: React.CSSProperties = {
  width: 200,
  flexShrink: 0,
  borderRight: "2px solid #222",
  padding: "14px 10px",
  fontSize: 10,
  letterSpacing: 1,
  backgroundColor: "#0a0a0a",
  overflowY: "auto",
  height: "100%",
};

const categoryHeaderStyle: React.CSSProperties = {
  color: "#888",
  marginBottom: 4,
  paddingBottom: 2,
  borderBottom: "1px solid #222",
};

function navBtnStyle(active: boolean): React.CSSProperties {
  return {
    background: "transparent",
    border: "none",
    color: active ? "#ffff00" : "#cccccc",
    fontFamily: "inherit",
    fontSize: "inherit",
    letterSpacing: "inherit",
    cursor: "pointer",
    padding: "2px 4px",
    display: "block",
    width: "100%",
    textAlign: "left",
  };
}

export default WikiReaderBoilerplate;
