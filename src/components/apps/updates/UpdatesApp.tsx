/*
 *                    ☦
 *            ╔═══════════════════╗
 *            ║  K-OS III        ║
 *            ║  UPDATES         ║
 *            ╚═══════════════════╝
 *
 * Weekly Build Log — in-OS surface for the Creativity track tool.
 * Static-export safe; reads typed data from src/data/build-log.ts.
 * Local editing is out of scope for v1 — copy a TS template and paste
 * into the data file to publish a new entry.
 */

"use client";

import React, { useMemo, useState } from "react";
import { BUILD_LOG, sortedBuildLog, type BuildLogEntry } from "@/data/build-log";

function h1(): React.CSSProperties {
  return {
    fontSize: 18,
    letterSpacing: 2,
    color: "#ffff00",
    margin: "0 0 10px",
    borderBottom: "1px solid #444",
    paddingBottom: 8,
  };
}

const btn: React.CSSProperties = {
  background: "#ffff00",
  color: "#000",
  border: "none",
  padding: "6px 10px",
  fontFamily: "var(--dm-font-primary), monospace",
  fontSize: 10,
  letterSpacing: 1,
  cursor: "pointer",
  fontWeight: 700,
};

const outlineBtn: React.CSSProperties = {
  background: "transparent",
  color: "#ffff00",
  border: "2px solid #ffff00",
  padding: "6px 10px",
  fontFamily: "var(--dm-font-primary), monospace",
  fontSize: 10,
  letterSpacing: 1,
  cursor: "pointer",
  fontWeight: 700,
};

function fieldLabel(): React.CSSProperties {
  return { color: "#ffff00", fontSize: 11, letterSpacing: 1, marginBottom: 4 };
}

function fieldBox(): React.CSSProperties {
  return {
    background: "#0a0a0a",
    border: "2px solid #222",
    color: "#e8e8e8",
    fontSize: 12,
    lineHeight: 1.55,
    padding: 10,
    whiteSpace: "pre-wrap",
  };
}

function copy(text: string): Promise<boolean> {
  return navigator.clipboard
    .writeText(text)
    .then(() => true)
    .catch(() => {
      try {
        window.prompt("Copy snippet:", text);
      } catch {
        /* ignore */
      }
      return false;
    });
}

function startOfWeekMonday(d: Date): Date {
  const dt = new Date(d);
  const day = dt.getDay(); // 0=Sun..6=Sat
  const diff = (day === 0 ? -6 : 1) - day; // move to Monday
  dt.setDate(dt.getDate() + diff);
  dt.setHours(0, 0, 0, 0);
  return dt;
}

function fmtIso(d: Date): string {
  return d.toISOString().slice(0, 10);
}

function fmtRange(monday: Date): string {
  const start = fmtIso(monday);
  const end = fmtIso(new Date(monday.getFullYear(), monday.getMonth(), monday.getDate() + 6));
  return `${start} — ${end}`;
}

function tsTemplateForWeek(isoMonday: string, range: string): string {
  return `{
  id: "${isoMonday}",
  weekRange: "${range}",
  built: "",
  reused: "",
  compounded: "",
},`;
}

export function UpdatesApp() {
  const entries = useMemo<BuildLogEntry[]>(() => sortedBuildLog(BUILD_LOG), []);
  const [copied, setCopied] = useState(false);

  const now = new Date();
  const monday = startOfWeekMonday(now);
  const iso = fmtIso(monday);
  const range = fmtRange(monday);
  const tsSnippet = tsTemplateForWeek(iso, range);
  const mdHeader = "| Week (date) | Built | Reused | Compounded |\n|---|---|---|---|";
  const mdRows = entries
    .map((e) => `| ${e.weekRange} | ${e.built} | ${e.reused} | ${e.compounded} |`)
    .join("\n");
  const mdTable = `${mdHeader}\n${mdRows}`;

  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        backgroundColor: "#000",
        color: "#fff",
        fontFamily: "var(--dm-font-primary), monospace",
        imageRendering: "pixelated",
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
      }}
    >
      <header
        style={{
          flexShrink: 0,
          display: "flex",
          alignItems: "center",
          gap: 8,
          padding: "6px 10px",
          borderBottom: "2px solid #fff",
          minHeight: 32,
        }}
      >
        <span style={{ color: "#ffff00", letterSpacing: 2, fontSize: 11 }}>☦ UPDATES</span>
        <span style={{ color: "#888", fontSize: 10, letterSpacing: 1 }}>WEEKLY BUILD LOG</span>
        <span style={{ flex: 1 }} />
        <button
          type="button"
          style={outlineBtn}
          onClick={async () => {
            const ok = await copy(tsSnippet);
            setCopied(ok);
            window.setTimeout(() => setCopied(false), 1500);
          }}
          title="Copy a TS snippet to paste into src/data/build-log.ts"
        >
          {copied ? "COPIED" : "COPY WEEK TEMPLATE"}
        </button>
      </header>

      <main style={{ flex: 1, overflowY: "auto", padding: 14 }}>
        <h1 style={h1()}>Weekly build log</h1>
        <p style={{ fontSize: 12, color: "#aaa", lineHeight: 1.55, marginBottom: 14 }}>
          One row per week. Built → Reused → Compounded. To add an entry, copy the week template,
          paste into <code>src/data/build-log.ts</code>, and rebuild. The worksheet lives at{" "}
          <a href="kos://academy/creativity/05-creativity-as-objective-function" style={{ color: "#66aaff", textDecoration: "underline" }}>
            kos://academy/creativity/05-creativity-as-objective-function
          </a>{" "}
          and its tool at{" "}
          <a href="kos://updates" style={{ color: "#66aaff", textDecoration: "underline" }}>
            kos://updates
          </a>
          .
        </p>

        {entries.length === 0 && (
          <div style={{ fontSize: 12, color: "#666" }}>No entries yet.</div>
        )}

        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {entries.map((e) => (
            <section key={e.id} style={{ border: "2px solid #ffff00", background: "#0a0a00", padding: 12 }}>
              <div style={{ color: "#ffff00", fontSize: 12, letterSpacing: 1, marginBottom: 8 }}>
                {e.weekRange}
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "120px 1fr", gap: 10 }}>
                <div style={fieldLabel()}>BUILT</div>
                <div style={fieldBox()}>{e.built}</div>
                <div style={fieldLabel()}>REUSED</div>
                <div style={fieldBox()}>{e.reused}</div>
                <div style={fieldLabel()}>COMPOUNDED</div>
                <div style={fieldBox()}>{e.compounded}</div>
              </div>
              {e.source && (
                <div style={{ marginTop: 10, fontSize: 10, color: "#666" }}>
                  Source: {e.source}
                </div>
              )}
            </section>
          ))}
        </div>

        <div style={{ marginTop: 20 }}>
          <div style={{ ...fieldLabel(), color: "#888" }}>EXPORT AS MARKDOWN TABLE</div>
          <div style={fieldBox()}>
            <pre
              style={{
                margin: 0,
                whiteSpace: "pre-wrap",
                fontFamily: "var(--dm-font-primary), monospace",
                fontSize: 11,
              }}
            >
              {mdTable}
            </pre>
          </div>
          <div style={{ marginTop: 8 }}>
            <button type="button" style={btn} onClick={() => void copy(mdTable)}>
              COPY MARKDOWN
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}

export default UpdatesApp;

