"use client";

/*
 *                    ☦
 *      STARDRAIN WIKI — IN-OS APP
 *
 *  Simple Wikipedia-style browser for the Stardrain universe.
 *  Black / yellow K-OS aesthetic, internal navigation only.
 *
 *  Layout rules (2026-07):
 *  - Sidebar and article body scroll independently.
 *  - On narrow / mobile viewports the chapter menu collapses into a
 *    CornerChrome panel (same pattern as Tilemap Painter) so the
 *    article can use the full phone width.
 *  - On large desktop screens body text is slightly tighter.
 */

import React, { useState, useCallback, useEffect } from "react";
import { LORE_ENTRIES, CATEGORY_LABELS, type LoreEntry } from "@/data/stardrain-lore";
import {
  CornerHost,
  CornerPanel,
  VerticalChromeToggle,
  CornerDismissLayer,
  useIsNarrow,
} from "@/components/ui/CornerChrome";
import { KosProse, KosRef, useKosEntry } from "@/components/os/KosLink";

const CATEGORY_ORDER: LoreEntry["category"][] = [
  "cosmology",
  "locations",
  "characters",
  "systems",
  "culture",
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

export function StardrainWikiApp() {
  return (
    <CornerHost storageKey="kos-stardrain-wiki-chrome" style={{ background: "#000" }}>
      <StardrainWikiInner />
    </CornerHost>
  );
}

function StardrainWikiInner() {
  const [currentId, setCurrentId] = useState<string | null>(null);
  const isNarrow = useIsNarrow(720);
  const isLarge = useIsLarge(1400);

  // Slightly tighter reading sizes on big monitors
  const bodyFont = isLarge ? 12 : 14;
  const titleFont = isLarge ? 18 : 22;
  const h2Font = isLarge ? 13 : 15;

  const navigate = useCallback((id: string | null) => {
    setCurrentId(id);
    requestAnimationFrame(() => {
      const el = document.getElementById("stardrain-main-scroll");
      if (el) el.scrollTop = 0;
    });
  }, []);

  const openLinkedEntry = useCallback(
    (id: string) => {
      if (LORE_ENTRIES.some((entry) => entry.id === id)) navigate(id);
    },
    [navigate],
  );
  useKosEntry("stardrain-wiki", openLinkedEntry);

  const entry = currentId ? LORE_ENTRIES.find((e) => e.id === currentId) : null;

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

      {CATEGORY_ORDER.map((cat) => {
        const list = LORE_ENTRIES.filter((e) => e.category === cat);
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
              {CATEGORY_LABELS[cat].toUpperCase()}
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
      {/* Header */}
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
          ☦ STARDRAIN WIKI
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

      {/* Body: independent scroll columns on desktop; full-width article + corner menu on mobile */}
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

        {/* Main article — independent scroll, max width of phone on mobile */}
        <main
          id="stardrain-main-scroll"
          style={{
            flex: 1,
            overflowY: "auto",
            padding: isNarrow ? "16px 14px 48px" : "20px 28px 60px",
            maxWidth: isNarrow ? "100%" : 720,
            height: "100%",
          }}
        >
          {entry ? (
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
              <div style={{ fontSize: 10, color: "#888", marginBottom: 20, letterSpacing: 1 }}>
                {CATEGORY_LABELS[entry.category].toUpperCase()}
              </div>
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
          ) : (
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
                Stardrain Wiki
              </h1>
              <p style={{ fontSize: 11, color: "#888", marginBottom: 24, letterSpacing: 1 }}>
                {LORE_ENTRIES.length} ENTRIES · IN-OS LORE BROWSER
              </p>
              <p
                style={{
                  fontSize: bodyFont,
                  lineHeight: 1.6,
                  color: "#ddd",
                  marginBottom: 28,
                }}
              >
                Private reference for the Stardrain universe. Cosmology, locations, characters,
                power structures, and the creative culture of the island. The history and the
                intended significance live in the{" "}
                <KosRef to="kos://backstage/how-to-read">BACKSTAGE</KosRef> app on the
                desktop. Click any entry
                in the sidebar or below to read.
              </p>

              {CATEGORY_ORDER.map((cat) => {
                const list = LORE_ENTRIES.filter((e) => e.category === cat);
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
                      {CATEGORY_LABELS[cat]}
                    </h2>
                    <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
                      {list.map((e) => (
                        <li key={e.id} style={{ marginBottom: 6 }}>
                          <button
                            onClick={() => navigate(e.id)}
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
                ☦ STARDRAIN · KOOLSKULL
              </div>
            </>
          )}
        </main>

        {/* Mobile / narrow: chapter menu as CornerChrome panel (same as Tilemap) */}
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

export default StardrainWikiApp;
