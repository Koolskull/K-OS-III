import React from "react";
import { DitherIllust, parseIllustKind } from "@/components/apps/education/DitherIllust";
import { openKos, parseKos } from "@/lib/os/kos-nav";

/** Minimal markdown renderer for education lessons (+ {{illust:kind|caption}} shortcodes). */
export function renderMarkdown(md: string): React.ReactNode[] {
  let body = md;
  if (body.startsWith("---")) {
    const end = body.indexOf("\n---", 3);
    if (end !== -1) body = body.slice(end + 4).replace(/^\n+/, "");
  }

  const lines = body.split("\n");
  const nodes: React.ReactNode[] = [];
  let i = 0;
  let key = 0;

  const inline = (text: string): React.ReactNode[] => {
    const parts: React.ReactNode[] = [];
    const re = /(\*\*[^*]+\*\*|`[^`]+`|\[[^\]]+\]\([^)]+\))/g;
    let last = 0;
    let m: RegExpExecArray | null;
    let k = 0;
    while ((m = re.exec(text))) {
      if (m.index > last) parts.push(text.slice(last, m.index));
      const t = m[0];
      if (t.startsWith("**")) parts.push(<strong key={`b${k++}`}>{t.slice(2, -2)}</strong>);
      else if (t.startsWith("`"))
        parts.push(
          <code key={`c${k++}`} style={{ color: "#ffff88" }}>
            {t.slice(1, -1)}
          </code>,
        );
      else {
        const lm = t.match(/\[([^\]]+)\]\(([^)]+)\)/);
        if (lm) {
          const target = parseKos(lm[2]);
          if (target) {
            parts.push(
              <button
                key={`a${k++}`}
                type="button"
                onClick={() => openKos(target)}
                style={{
                  background: "none",
                  border: "none",
                  padding: 0,
                  color: "#ffff00",
                  font: "inherit",
                  cursor: "pointer",
                  textDecoration: "underline",
                }}
              >
                {lm[1]}
              </button>,
            );
          } else {
            parts.push(
              <a key={`a${k++}`} href={lm[2]} target="_blank" rel="noreferrer" style={{ color: "#66aaff" }}>
                {lm[1]}
              </a>,
            );
          }
        }
      }
      last = m.index + t.length;
    }
    if (last < text.length) parts.push(text.slice(last));
    return parts;
  };

  while (i < lines.length) {
    const line = lines[i];

    // {{illust:kind}} or {{illust:kind|caption text}}
    const illust = line.trim().match(/^\{\{illust:([a-z0-9-]+)(?:\|(.+))?\}\}$/);
    if (illust) {
      const kind = parseIllustKind(illust[1]);
      if (kind) {
        nodes.push(<DitherIllust key={key++} kind={kind} caption={illust[2]?.trim()} />);
      } else {
        nodes.push(
          <p key={key++} style={{ color: "#ff6666", fontSize: 11 }}>
            [unknown illust: {illust[1]}]
          </p>,
        );
      }
      i++;
      continue;
    }

    if (line.startsWith("# ")) {
      nodes.push(
        <h1
          key={key++}
          style={{
            fontSize: 20,
            letterSpacing: 2,
            color: "#ffff00",
            margin: "0 0 12px",
            borderBottom: "1px solid #444",
            paddingBottom: 8,
          }}
        >
          {inline(line.slice(2))}
        </h1>,
      );
      i++;
      continue;
    }
    if (line.startsWith("## ")) {
      nodes.push(
        <h2
          key={key++}
          style={{
            fontSize: 14,
            letterSpacing: 2,
            color: "#ffff00",
            margin: "22px 0 10px",
            borderBottom: "1px solid #333",
            paddingBottom: 4,
          }}
        >
          {inline(line.slice(3))}
        </h2>,
      );
      i++;
      continue;
    }
    if (line.startsWith("### ")) {
      nodes.push(
        <h3 key={key++} style={{ fontSize: 12, letterSpacing: 1, color: "#ffcc00", margin: "16px 0 8px" }}>
          {inline(line.slice(4))}
        </h3>,
      );
      i++;
      continue;
    }

    if (line.trim().startsWith("|") && line.includes("|")) {
      const rows: string[][] = [];
      while (i < lines.length && lines[i].trim().startsWith("|")) {
        const cells = lines[i]
          .split("|")
          .slice(1, -1)
          .map((c) => c.trim());
        if (!cells.every((c) => /^[-:]+$/.test(c))) rows.push(cells);
        i++;
      }
      nodes.push(
        <div key={key++} style={{ overflowX: "auto", marginBottom: 16 }}>
          <table style={{ borderCollapse: "collapse", fontSize: 11, width: "100%" }}>
            <tbody>
              {rows.map((r, ri) => (
                <tr key={ri}>
                  {r.map((c, ci) => (
                    <td
                      key={ci}
                      style={{
                        border: "1px solid #333",
                        padding: "4px 8px",
                        color: ri === 0 ? "#ffff00" : "#ddd",
                        fontWeight: ri === 0 ? 600 : 400,
                      }}
                    >
                      {inline(c)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>,
      );
      continue;
    }

    if (/^[-*] /.test(line) || /^\d+\. /.test(line)) {
      const items: string[] = [];
      while (i < lines.length && (/^[-*] /.test(lines[i]) || /^\d+\. /.test(lines[i]))) {
        items.push(lines[i].replace(/^[-*] /, "").replace(/^\d+\. /, ""));
        i++;
      }
      nodes.push(
        <ul key={key++} style={{ margin: "0 0 14px", paddingLeft: 18, color: "#ddd", fontSize: 13, lineHeight: 1.55 }}>
          {items.map((it, ii) => (
            <li key={ii} style={{ marginBottom: 4 }}>
              {inline(it)}
            </li>
          ))}
        </ul>,
      );
      continue;
    }

    if (line.trim() === "") {
      i++;
      continue;
    }

    // blockquote storytelling
    if (line.startsWith("> ")) {
      const qs: string[] = [];
      while (i < lines.length && lines[i].startsWith("> ")) {
        qs.push(lines[i].slice(2));
        i++;
      }
      nodes.push(
        <blockquote
          key={key++}
          style={{
            margin: "0 0 16px",
            padding: "10px 14px",
            borderLeft: "3px solid #ffff00",
            background: "#0a0a00",
            color: "#ccccaa",
            fontSize: 13,
            lineHeight: 1.6,
          }}
        >
          {qs.map((q, qi) => (
            <p key={qi} style={{ margin: qi ? "8px 0 0" : 0 }}>
              {inline(q)}
            </p>
          ))}
        </blockquote>,
      );
      continue;
    }

    const para: string[] = [];
    while (
      i < lines.length &&
      lines[i].trim() !== "" &&
      !lines[i].startsWith("#") &&
      !/^[-*] /.test(lines[i]) &&
      !/^\d+\. /.test(lines[i]) &&
      !lines[i].trim().startsWith("|") &&
      !lines[i].startsWith("> ") &&
      !lines[i].trim().match(/^\{\{illust:/)
    ) {
      para.push(lines[i]);
      i++;
    }
    nodes.push(
      <p key={key++} style={{ fontSize: 13, lineHeight: 1.65, color: "#dddddd", margin: "0 0 14px" }}>
        {inline(para.join(" "))}
      </p>,
    );
  }

  return nodes;
}
