"use client";

/*
 *                    ☦
 *      BACKSTAGE WIKI — IN-OS APP
 *
 *  Same reader chrome as the Stardrain Wiki.
 *  History and intended significance, read beside the in-universe lore.
 */

import React, { useState, useCallback, useEffect } from "react";
import {
  BACKSTAGE_ENTRIES,
  BACKSTAGE_CATEGORY_LABELS,
  BACKSTAGE_CATEGORY_ORDER,
  type BackstageEntry,
} from "@/data/backstage-wiki";
import { LORE_ENTRIES } from "@/data/stardrain-lore";
import {
  CornerHost,
  CornerPanel,
  VerticalChromeToggle,
  CornerDismissLayer,
  useIsNarrow,
} from "@/components/ui/CornerChrome";
import { KosProse, useKosEntry } from "@/components/os/KosLink";
import { openKos } from "@/lib/os/kos-nav";

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

export function BackstageWikiApp() {
  return (
    <CornerHost storageKey="kos-backstage-wiki-chrome" style={{ background: "#000" }}>
      <BackstageWikiInner />
    </CornerHost>
  );
}

function BackstageWikiInner() {
  const [currentId, setCurrentId] = useState<string | null>(null);
  const isNarrow = useIsNarrow(720);
  const isLarge = useIsLarge(1400);

  const bodyFont = isLarge ? 12 : 14;
  const titleFont = isLarge ? 18 : 22;
  const h2Font = isLarge ? 13 : 15;

  const navigate = useCallback((id: string | null) => {
    setCurrentId(id);
    requestAnimationFrame(() => {
      const el = document.getElementById("backstage-main-scroll");
      if (el) el.scrollTop = 0;
    });
  }, []);

  const openLinkedEntry = useCallback(
    (id: string) => {
      if (BACKSTAGE_ENTRIES.some((entry) => entry.id === id)) navigate(id);
    },
    [navigate],
  );
  useKosEntry("backstage-wiki", openLinkedEntry);

  const entry = currentId ? BACKSTAGE_ENTRIES.find((e) => e.id === currentId) : null;
  const linkedLore = (entry?.loreIds ?? [])
    .map((id) => LORE_ENTRIES.find((lore) => lore.id === id))
    .filter((lore): lore is NonNullable<typeof lore> => lore != null);

  const sidebarContent = (
    <>
      <button
        onClick={() => navigate(null)}
        style={{
          background: "transparent",
          border: "none",
          color: currentId === null ? "#ffff00" : "#aaaaaa",
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

      {BACKSTAGE_CATEGORY_ORDER.map((cat) => {
        const list = BACKSTAGE_ENTRIES.filter((e) => e.category === cat);
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
              {BACKSTAGE_CATEGORY_LABELS[cat].toUpperCase()}
            </div>
            <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
              {list.map((e) => (
                <li key={e.id} style={{ marginBottom: 2 }}>
                  <button
                    onClick={() => navigate(e.id)}
                    style={{
                      background: "transparent",
                      border: "none",
                      color: e.id === currentId ? "#ffff00" : "#cccccc",
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
        }}
      >
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
          ☦ BACKSTAGE
        </button>
        {entry && (
          <span
            style={{
              color: "#aaa",
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
              marginLeft: 12,
            }}
          >
            / {entry.title.toUpperCase()}
          </span>
        )}
      </div>

      <div
        style={{
          flex: 1,
          display: "flex",
          overflow: "hidden",
          position: "relative",
        }}
      >
        {!isNarrow && (
          <aside
            style={{
              width: 200,
              flexShrink: 0,
              borderRight: "2px solid #222",
              padding: "14px 10px",
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

        <main
          id="backstage-main-scroll"
          style={{
            flex: 1,
            overflowY: "auto",
            padding: isNarrow ? "16px 14px 48px" : "20px 28px 60px",
            maxWidth: isNarrow ? "100%" : 720,
            height: "100%",
          }}
        >
          {entry ? (
            <Article
              entry={entry}
              linkedLore={linkedLore}
              titleFont={titleFont}
              bodyFont={bodyFont}
            />
          ) : (
            <Index
              titleFont={titleFont}
              bodyFont={bodyFont}
              h2Font={h2Font}
              isLarge={isLarge}
              onOpen={navigate}
            />
          )}
        </main>

        {isNarrow && (
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
      </div>
    </div>
  );
}

function Article({
  entry,
  linkedLore,
  titleFont,
  bodyFont,
}: {
  entry: BackstageEntry;
  linkedLore: { id: string; title: string }[];
  titleFont: number;
  bodyFont: number;
}) {
  return (
    <>
      <h1
        style={{
          fontSize: titleFont,
          letterSpacing: 2,
          color: "#ffff00",
          marginBottom: 6,
          borderBottom: "1px solid #444",
          paddingBottom: 8,
        }}
      >
        {entry.title}
      </h1>
      <div style={{ fontSize: 10, color: "#888", marginBottom: 12, letterSpacing: 1 }}>
        {BACKSTAGE_CATEGORY_LABELS[entry.category].toUpperCase()}
      </div>
      {linkedLore.length > 0 && (
        <div style={{ fontSize: 11, color: "#aaaaaa", marginBottom: 20, letterSpacing: 1 }}>
          STARDRAIN:{" "}
          {linkedLore.map((lore, index) => (
            <React.Fragment key={lore.id}>
              {index > 0 ? " · " : null}
              <button
                type="button"
                onClick={() => openKos({ app: "stardrain-wiki", entry: lore.id })}
                style={{
                  background: "none",
                  border: "none",
                  padding: 0,
                  color: "#ffff00",
                  font: "inherit",
                  letterSpacing: "inherit",
                  cursor: "pointer",
                  textDecoration: "underline",
                }}
              >
                {lore.title.toUpperCase()}
              </button>
            </React.Fragment>
          ))}
        </div>
      )}
      {entry.body.split("\n\n").map((para, i) => (
        <p
          key={i}
          style={{
            fontSize: bodyFont,
            lineHeight: 1.65,
            color: "#dddddd",
            marginBottom: 16,
          }}
        >
          <KosProse text={para} />
        </p>
      ))}
    </>
  );
}

function Index({
  titleFont,
  bodyFont,
  h2Font,
  isLarge,
  onOpen,
}: {
  titleFont: number;
  bodyFont: number;
  h2Font: number;
  isLarge: boolean;
  onOpen: (id: string) => void;
}) {
  return (
    <>
      <h1
        style={{
          fontSize: titleFont,
          letterSpacing: 2,
          color: "#ffff00",
          marginBottom: 6,
          borderBottom: "1px solid #444",
          paddingBottom: 8,
        }}
      >
        Backstage
      </h1>
      <p style={{ fontSize: 11, color: "#888", marginBottom: 24, letterSpacing: 1 }}>
        {BACKSTAGE_ENTRIES.length} ENTRIES · HISTORY AND SIGNIFICANCE
      </p>
      <p
        style={{
          fontSize: bodyFont,
          lineHeight: 1.6,
          color: "#ddd",
          marginBottom: 28,
        }}
      >
        Private record of where the work came from and what it is for. Read it beside the
        STARDRAIN app. The story stays over there. The life, the tools, and the practice stay
        here.
      </p>

      {BACKSTAGE_CATEGORY_ORDER.map((cat) => {
        const list = BACKSTAGE_ENTRIES.filter((e) => e.category === cat);
        if (list.length === 0) return null;
        return (
          <section key={cat} style={{ marginBottom: 28 }}>
            <h2
              style={{
                fontSize: h2Font,
                letterSpacing: 2,
                color: "#ffff00",
                marginBottom: 8,
                paddingBottom: 4,
                borderBottom: "1px solid #333",
              }}
            >
              {BACKSTAGE_CATEGORY_LABELS[cat]}
            </h2>
            <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
              {list.map((e) => (
                <li key={e.id} style={{ marginBottom: 6 }}>
                  <button
                    onClick={() => onOpen(e.id)}
                    style={{
                      background: "transparent",
                      border: "none",
                      color: "#66aaff",
                      fontFamily: "inherit",
                      fontSize: isLarge ? 12 : 13,
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

      <div
        style={{
          marginTop: 40,
          paddingTop: 16,
          borderTop: "2px solid #444",
          fontSize: 11,
          color: "#666",
          letterSpacing: 1,
        }}
      >
        ☦ BACKSTAGE · KOOLSKULL
      </div>
    </>
  );
}

export default BackstageWikiApp;
