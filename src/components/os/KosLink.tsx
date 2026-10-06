"use client";

import React, { useEffect } from "react";
import {
  consumePending,
  openKos,
  parseKos,
  peekPending,
  subscribeKos,
  type KosTarget,
} from "@/lib/os/kos-nav";

const linkStyle: React.CSSProperties = {
  background: "none",
  border: "none",
  padding: 0,
  margin: 0,
  color: "#ffff00",
  font: "inherit",
  letterSpacing: "inherit",
  lineHeight: "inherit",
  cursor: "pointer",
  textDecoration: "underline",
  textUnderlineOffset: "2px",
  textAlign: "left",
};

export function KosRef({ to, children }: { to: string; children: React.ReactNode }) {
  return (
    <button
      type="button"
      style={linkStyle}
      onClick={() => {
        const target = parseKos(to);
        if (target) openKos(target);
      }}
    >
      {children}
    </button>
  );
}

export function Ext({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <a href={href} target="_blank" rel="noreferrer" style={{ color: "#ffff00" }}>
      {children}
    </a>
  );
}

/** Wiki paragraphs are strings. Markdown links and bare URLs become buttons or anchors. */
export function KosProse({ text }: { text: string }) {
  const nodes: React.ReactNode[] = [];
  const re = /(\[[^\]]+\]\([^)]+\)|https?:\/\/[^\s)]+)/g;
  let last = 0;
  let match: RegExpExecArray | null;
  let key = 0;
  while ((match = re.exec(text))) {
    if (match.index > last) nodes.push(text.slice(last, match.index));
    const token = match[0];
    const linked = token.match(/^\[([^\]]+)\]\(([^)]+)\)$/);
    if (linked) {
      const label = linked[1];
      const href = linked[2];
      if (parseKos(href)) nodes.push(<KosRef key={key++} to={href}>{label}</KosRef>);
      else nodes.push(<Ext key={key++} href={href}>{label}</Ext>);
    } else {
      let url = token;
      let trail = "";
      const trimmed = url.match(/^(.*?)([.,;:]+)$/);
      if (trimmed) {
        url = trimmed[1];
        trail = trimmed[2];
      }
      nodes.push(<Ext key={key++} href={url}>{url}</Ext>);
      if (trail) nodes.push(trail);
    }
    last = match.index + token.length;
  }
  if (last < text.length) nodes.push(text.slice(last));
  return <>{nodes}</>;
}

export function useKosEntry(
  app: "backstage-wiki" | "stardrain-wiki",
  onEntry: (id: string) => void,
) {
  useEffect(() => {
    const apply = (target: KosTarget) => {
      if (target.app !== app) return;
      onEntry(target.entry);
      consumePending(app);
    };
    const waiting = peekPending(app);
    if (waiting && waiting.app === app) apply(waiting);
    return subscribeKos(apply);
  }, [app, onEntry]);
}

export function useKosLesson(onLesson: (track: string, lesson: string) => void) {
  useEffect(() => {
    const apply = (target: KosTarget) => {
      if (target.app !== "education") return;
      if ("track" in target && "lesson" in target) {
        onLesson(target.track, target.lesson);
        consumePending("education");
      }
    };
    const waiting = peekPending("education");
    if (waiting && waiting.app === "education") apply(waiting);
    return subscribeKos(apply);
  }, [onLesson]);
}
