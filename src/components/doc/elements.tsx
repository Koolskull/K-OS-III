"use client";

/*
 *                    ☦
 *      MANUAL ARTICLE BUILDING BLOCKS
 *
 *  Reusable JSX helpers for the K-OS manual. Pixel-correct, no rounded
 *  corners, no AA. Black/white with a single yellow accent for cross-refs.
 */

import React from "react";
import { ARTICLES_BY_SLUG, DEFAULT_LANG, type Lang } from "@/lib/doc/articles";

/* ---- Article skeleton ---- */

export function Lead({ children }: { children: React.ReactNode }) {
  return (
    <p
      style={{
        fontSize: 14,
        lineHeight: 1.55,
        marginBottom: 24,
        borderLeft: "3px solid #ffff00",
        paddingLeft: 12,
        color: "#ffffff",
      }}
    >
      {children}
    </p>
  );
}

export function H2({ id, children }: { id?: string; children: React.ReactNode }) {
  return (
    <h2
      id={id}
      style={{
        fontFamily: "var(--dm-font-primary), monospace",
        fontSize: 16,
        letterSpacing: 2,
        color: "#ffff00",
        marginTop: 32,
        marginBottom: 12,
        paddingBottom: 4,
        borderBottom: "1px solid #444",
      }}
    >
      {children}
    </h2>
  );
}

export function H3({ children }: { children: React.ReactNode }) {
  return (
    <h3
      style={{
        fontFamily: "var(--dm-font-primary), monospace",
        fontSize: 13,
        letterSpacing: 1,
        color: "#ffffff",
        marginTop: 20,
        marginBottom: 8,
      }}
    >
      {children}
    </h3>
  );
}

export function P({ children }: { children: React.ReactNode }) {
  return (
    <p style={{ fontSize: 13, lineHeight: 1.6, marginBottom: 12, color: "#dddddd" }}>
      {children}
    </p>
  );
}

export function Strong({ children }: { children: React.ReactNode }) {
  return <strong style={{ color: "#ffffff" }}>{children}</strong>;
}

export function Em({ children }: { children: React.ReactNode }) {
  return <em style={{ color: "#ffffff", fontStyle: "italic" }}>{children}</em>;
}

export function Code({ children }: { children: React.ReactNode }) {
  return (
    <code
      style={{
        fontFamily: "var(--dm-font-primary), monospace",
        fontSize: 12,
        color: "#00ff88",
        backgroundColor: "#001a00",
        padding: "1px 4px",
        border: "1px solid #003300",
      }}
    >
      {children}
    </code>
  );
}

export function CodeBlock({ children, label }: { children: string; label?: string }) {
  return (
    <div style={{ margin: "12px 0", border: "1px solid #003300" }}>
      {label ? (
        <div
          style={{
            backgroundColor: "#003300",
            color: "#00ff88",
            padding: "2px 6px",
            fontFamily: "var(--dm-font-primary), monospace",
            fontSize: 10,
            letterSpacing: 1,
          }}
        >
          {label}
        </div>
      ) : null}
      <pre
        style={{
          fontFamily: "var(--dm-font-primary), monospace",
          fontSize: 12,
          color: "#00ff88",
          backgroundColor: "#001a00",
          padding: 10,
          margin: 0,
          overflowX: "auto",
          whiteSpace: "pre",
        }}
      >
        {children}
      </pre>
    </div>
  );
}

export function UList({ children }: { children: React.ReactNode }) {
  return (
    <ul
      style={{
        fontSize: 13,
        lineHeight: 1.6,
        color: "#dddddd",
        marginBottom: 12,
        paddingLeft: 24,
        listStyle: "square",
      }}
    >
      {children}
    </ul>
  );
}

export function OList({ children }: { children: React.ReactNode }) {
  return (
    <ol
      style={{
        fontSize: 13,
        lineHeight: 1.6,
        color: "#dddddd",
        marginBottom: 12,
        paddingLeft: 24,
      }}
    >
      {children}
    </ol>
  );
}

export function Li({ children }: { children: React.ReactNode }) {
  return <li style={{ marginBottom: 4 }}>{children}</li>;
}

export function Aside({
  title,
  children,
  variant = "info",
}: {
  title: string;
  children: React.ReactNode;
  variant?: "info" | "warn" | "tip";
}) {
  const palette =
    variant === "warn"
      ? { border: "#ffaa00", title: "#ffaa00", bg: "#1a1000" }
      : variant === "tip"
        ? { border: "#00ff88", title: "#00ff88", bg: "#001a00" }
        : { border: "#888888", title: "#aaaaaa", bg: "#0a0a0a" };
  return (
    <div
      style={{
        margin: "16px 0",
        border: `2px solid ${palette.border}`,
        backgroundColor: palette.bg,
        padding: 12,
      }}
    >
      <div
        style={{
          fontFamily: "var(--dm-font-primary), monospace",
          fontSize: 11,
          letterSpacing: 1,
          color: palette.title,
          marginBottom: 6,
          textTransform: "uppercase",
        }}
      >
        ☞ {title}
      </div>
      <div style={{ fontSize: 12, lineHeight: 1.5, color: "#dddddd" }}>{children}</div>
    </div>
  );
}

export function Table({
  headers,
  rows,
}: {
  headers: string[];
  rows: (string | React.ReactNode)[][];
}) {
  return (
    <div style={{ overflowX: "auto", margin: "12px 0" }}>
      <table
        style={{
          width: "100%",
          borderCollapse: "collapse",
          fontFamily: "var(--dm-font-primary), monospace",
          fontSize: 11,
          color: "#dddddd",
        }}
      >
        <thead>
          <tr style={{ backgroundColor: "#222" }}>
            {headers.map((h, i) => (
              <th
                key={i}
                style={{
                  padding: "4px 8px",
                  border: "1px solid #444",
                  color: "#ffffff",
                  textAlign: "left",
                  letterSpacing: 1,
                }}
              >
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, ri) => (
            <tr key={ri}>
              {row.map((cell, ci) => (
                <td
                  key={ci}
                  style={{
                    padding: "3px 8px",
                    border: "1px solid #333",
                    verticalAlign: "top",
                  }}
                >
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/* ---- Cross-references between articles ---- */

export interface NavContext {
  /** Currently displayed language (drives Crossref labels + Hex helper) */
  lang: Lang;
  /** Called when a cross-ref link is activated. Receives the target slug
   *  (or null for the index). Implementations either call router.push()
   *  or update local state. */
  navigate: (slug: string | null) => void;
  /** Called when the user picks a different language from the switcher. */
  setLang?: (lang: Lang) => void;
}

export const NavCtx = React.createContext<NavContext>({
  lang: DEFAULT_LANG,
  navigate: () => {
    /* no-op default; route mode wraps with real handler */
  },
});

/**
 * Cross-reference to another article. Renders a yellow link.
 * Resolves label using the current language's i18n title; the slug stays
 * language-neutral.
 */
export function Crossref({
  to,
  children,
}: {
  to: string;
  children?: React.ReactNode;
}) {
  const ctx = React.useContext(NavCtx);
  const target = ARTICLES_BY_SLUG[to];
  const label = children ?? target?.i18n?.[ctx.lang]?.title ?? target?.i18n?.en?.title ?? to;
  if (!target) {
    return <span style={{ color: "#ff5555" }}>[missing: {to}]</span>;
  }
  return (
    <a
      href={`#article=${to}`}
      onClick={(e) => {
        e.preventDefault();
        ctx.navigate(to);
      }}
      style={{
        color: "#ffff00",
        textDecoration: "underline",
        cursor: "pointer",
      }}
    >
      {label}
    </a>
  );
}

/** Inline hex literal — formats consistently and links to the hex article. */
export function Hex({
  value,
  width,
  link = true,
}: {
  value: number;
  width?: number;
  link?: boolean;
}) {
  const hex = value.toString(16).toUpperCase().padStart(width ?? 2, "0");
  const formatted = (
    <code
      style={{
        fontFamily: "var(--dm-font-primary), monospace",
        color: "#00ff88",
        backgroundColor: "#001a00",
        padding: "0 3px",
        border: "1px solid #003300",
      }}
    >
      0x{hex}
    </code>
  );
  if (!link) return formatted;
  return <Crossref to="hexadecimal">{formatted}</Crossref>;
}

/* ---- Article layout pieces ---- */

export function ArticleTitle({ children }: { children: React.ReactNode }) {
  return (
    <h1
      style={{
        fontFamily: "var(--dm-font-primary), monospace",
        fontSize: 22,
        letterSpacing: 3,
        color: "#ffffff",
        marginBottom: 4,
        textTransform: "uppercase",
      }}
    >
      {children}
    </h1>
  );
}

export function SubtleNote({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        fontFamily: "var(--dm-font-primary), monospace",
        fontSize: 10,
        color: "#888",
        letterSpacing: 1,
        marginBottom: 16,
      }}
    >
      {children}
    </div>
  );
}

export function SeeAlso({ slugs, label }: { slugs: string[]; label: string }) {
  const ctx = React.useContext(NavCtx);
  if (slugs.length === 0) return null;
  return (
    <div
      style={{
        marginTop: 32,
        paddingTop: 12,
        borderTop: "2px solid #444",
      }}
    >
      <div
        style={{
          fontFamily: "var(--dm-font-primary), monospace",
          fontSize: 11,
          letterSpacing: 2,
          color: "#aaa",
          marginBottom: 8,
        }}
      >
        {label}
      </div>
      <ul style={{ paddingLeft: 16, listStyle: "square", color: "#dddddd", fontSize: 12 }}>
        {slugs.map((s) => {
          const target = ARTICLES_BY_SLUG[s];
          const oneLiner = target?.i18n?.[ctx.lang]?.oneLiner ?? target?.i18n?.en?.oneLiner;
          return (
            <li key={s}>
              <Crossref to={s} />
              {oneLiner ? (
                <span style={{ color: "#888", marginLeft: 8 }}>— {oneLiner}</span>
              ) : null}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
