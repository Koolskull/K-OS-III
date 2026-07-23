"use client";

/*
 *                    ☦
 *      STARDRAIN WIKI — IN-OS APP
 *
 *  Simple Wikipedia-style browser for the Stardrain universe.
 *  Black / yellow K-OS aesthetic, internal navigation only.
 */

import React, { useState, useCallback } from "react";
import { LORE_ENTRIES, CATEGORY_LABELS, type LoreEntry } from "@/data/stardrain-lore";

const CATEGORY_ORDER: LoreEntry["category"][] = [
  "cosmology",
  "locations",
  "characters",
  "systems",
  "culture",
];

export function StardrainWikiApp() {
  const [currentId, setCurrentId] = useState<string | null>(null);

  const navigate = useCallback((id: string | null) => {
    setCurrentId(id);
    requestAnimationFrame(() => {
      const el = document.getElementById("stardrain-scroll");
      if (el) el.scrollTop = 0;
    });
  }, []);

  const entry = currentId ? LORE_ENTRIES.find((e) => e.id === currentId) : null;

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
          <span style={{ color: "#aaa", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            / {entry.title.toUpperCase()}
          </span>
        )}
      </div>

      <div id="stardrain-scroll" style={{ flex: 1, overflowY: "auto", display: "flex" }}>
        {/* Sidebar */}
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
          }}
        >
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
                        {e.id === currentId ? "▶ " : "  "}{e.title}
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            );
          })}
        </aside>

        {/* Main content */}
        <main style={{ flex: 1, padding: "20px 28px 60px", maxWidth: 720 }}>
          {entry ? (
            <>
              <h1
                style={{
                  fontSize: 22,
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
                    fontSize: 14,
                    lineHeight: 1.65,
                    color: "#dddddd",
                    marginBottom: 16,
                  }}
                >
                  {para}
                </p>
              ))}
            </>
          ) : (
            <>
              <h1
                style={{
                  fontSize: 22,
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
              <p style={{ fontSize: 14, lineHeight: 1.6, color: "#ddd", marginBottom: 28 }}>
                Private reference for the Stardrain universe. Cosmology, locations, characters,
                power structures, and the creative culture of the island. Click any entry in the
                sidebar or below to read.
              </p>

              {CATEGORY_ORDER.map((cat) => {
                const list = LORE_ENTRIES.filter((e) => e.category === cat);
                if (list.length === 0) return null;
                return (
                  <section key={cat} style={{ marginBottom: 28 }}>
                    <h2
                      style={{
                        fontSize: 15,
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
      </div>
    </div>
  );
}

export default StardrainWikiApp;
