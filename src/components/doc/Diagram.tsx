"use client";

import React from "react";

export interface DiagramNode {
  id: string;
  text: string;
  col: number;
  row: number;
  span?: number;
  rowSpan?: number;
  accent?: boolean;
  sub?: string;
  shape?: "rect" | "diamond" | "ellipse";
}

export interface DiagramEdge {
  from: string;
  to: string;
  label?: string;
  dashed?: boolean;
  accent?: boolean;
}

export interface DiagramProps {
  caption?: string;
  cols: number;
  rows: number;
  nodes: DiagramNode[];
  edges: DiagramEdge[];
}

const CELL_W = 110;
const CELL_H = 70;
const PAD = 14;
const BOX_PAD_X = 8;
const BOX_PAD_Y = 8;

interface Bounds {
  cx: number;
  cy: number;
  x: number;
  y: number;
  w: number;
  h: number;
  shape: "rect" | "diamond" | "ellipse";
}

function intersect(a: Bounds, b: Bounds) {
  const dx = b.cx - a.cx;
  const dy = b.cy - a.cy;
  const aHalfW = a.w / 2;
  const aHalfH = a.h / 2;
  const bHalfW = b.w / 2;
  const bHalfH = b.h / 2;
  const tA = Math.min(
    dx === 0 ? Infinity : Math.abs(aHalfW / dx),
    dy === 0 ? Infinity : Math.abs(aHalfH / dy),
  );
  const tB = Math.min(
    dx === 0 ? Infinity : Math.abs(bHalfW / dx),
    dy === 0 ? Infinity : Math.abs(bHalfH / dy),
  );
  return {
    x1: a.cx + dx * tA,
    y1: a.cy + dy * tA,
    x2: b.cx - dx * tB,
    y2: b.cy - dy * tB,
  };
}

function wrapLabel(text: string, maxChars: number): string[] {
  if (!text) return [];
  const words = text.split(/\s+/);
  const lines: string[] = [];
  let line = "";
  for (const w of words) {
    if (!line.length) {
      line = w;
    } else if ((line + " " + w).length <= maxChars) {
      line += " " + w;
    } else {
      lines.push(line);
      line = w;
    }
  }
  if (line) lines.push(line);
  return lines;
}

export function Diagram({ caption, cols, rows, nodes, edges }: DiagramProps) {
  const width = cols * CELL_W + 2 * PAD;
  const captionH = caption ? 24 : 0;
  const height = rows * CELL_H + 2 * PAD + captionH;

  const bounds = new Map<string, Bounds>();
  for (const n of nodes) {
    const span = n.span ?? 1;
    const rowSpan = n.rowSpan ?? 1;
    const x = PAD + n.col * CELL_W + BOX_PAD_X;
    const y = PAD + n.row * CELL_H + BOX_PAD_Y;
    const w = span * CELL_W - 2 * BOX_PAD_X;
    const h = rowSpan * CELL_H - 2 * BOX_PAD_Y;
    bounds.set(n.id, {
      x,
      y,
      w,
      h,
      cx: x + w / 2,
      cy: y + h / 2,
      shape: n.shape ?? "rect",
    });
  }

  return (
    <div style={{ margin: "16px 0", textAlign: "center" }}>
      <svg
        viewBox={`0 0 ${width} ${height}`}
        style={{
          width: "100%",
          maxWidth: width,
          height: "auto",
          shapeRendering: "crispEdges",
          background: "#0a0a0a",
          border: "1px solid #333",
        }}
      >
        <defs>
          <marker
            id="dm-arrow"
            markerWidth="8"
            markerHeight="8"
            refX="7"
            refY="4"
            orient="auto"
            markerUnits="userSpaceOnUse"
          >
            <polygon points="0 0, 8 4, 0 8" fill="#aaaaaa" />
          </marker>
          <marker
            id="dm-arrow-accent"
            markerWidth="8"
            markerHeight="8"
            refX="7"
            refY="4"
            orient="auto"
            markerUnits="userSpaceOnUse"
          >
            <polygon points="0 0, 8 4, 0 8" fill="#ffff00" />
          </marker>
        </defs>

        {edges.map((e, i) => {
          const a = bounds.get(e.from);
          const b = bounds.get(e.to);
          if (!a || !b) return null;
          const { x1, y1, x2, y2 } = intersect(a, b);
          const stroke = e.accent ? "#ffff00" : "#aaaaaa";
          const marker = e.accent ? "url(#dm-arrow-accent)" : "url(#dm-arrow)";
          const midX = (x1 + x2) / 2;
          const midY = (y1 + y2) / 2;
          return (
            <g key={`edge-${i}`}>
              <line
                x1={x1}
                y1={y1}
                x2={x2}
                y2={y2}
                stroke={stroke}
                strokeWidth="1"
                strokeDasharray={e.dashed ? "4 3" : undefined}
                markerEnd={marker}
              />
              {e.label ? (
                <g>
                  <rect
                    x={midX - e.label.length * 3 - 2}
                    y={midY - 8}
                    width={e.label.length * 6 + 4}
                    height={11}
                    fill="#0a0a0a"
                  />
                  <text
                    x={midX}
                    y={midY}
                    textAnchor="middle"
                    fontSize="9"
                    fontFamily="var(--dm-font-primary), monospace"
                    fill="#bbbbbb"
                  >
                    {e.label}
                  </text>
                </g>
              ) : null}
            </g>
          );
        })}

        {nodes.map((n) => {
          const b = bounds.get(n.id);
          if (!b) return null;
          const stroke = n.accent ? "#ffff00" : "#aaaaaa";
          const textColor = n.accent ? "#ffff00" : "#ffffff";
          const lines = wrapLabel(n.text, Math.max(8, Math.floor(b.w / 7)));
          const lineHeight = 12;
          const totalTextH = lines.length * lineHeight;
          const subOffset = n.sub ? 12 : 0;
          const startY = b.cy - totalTextH / 2 + lineHeight / 2 - subOffset / 2;

          let shapeEl: React.ReactNode = null;
          if (b.shape === "diamond") {
            const points = `${b.cx},${b.y} ${b.x + b.w},${b.cy} ${b.cx},${b.y + b.h} ${b.x},${b.cy}`;
            shapeEl = (
              <polygon
                points={points}
                fill="#0a0a0a"
                stroke={stroke}
                strokeWidth="1"
              />
            );
          } else if (b.shape === "ellipse") {
            shapeEl = (
              <ellipse
                cx={b.cx}
                cy={b.cy}
                rx={b.w / 2}
                ry={b.h / 2}
                fill="#0a0a0a"
                stroke={stroke}
                strokeWidth="1"
              />
            );
          } else {
            shapeEl = (
              <rect
                x={b.x}
                y={b.y}
                width={b.w}
                height={b.h}
                fill="#0a0a0a"
                stroke={stroke}
                strokeWidth="1"
              />
            );
          }

          return (
            <g key={n.id}>
              {shapeEl}
              {lines.map((line, i) => (
                <text
                  key={i}
                  x={b.cx}
                  y={startY + i * lineHeight}
                  textAnchor="middle"
                  dominantBaseline="middle"
                  fontSize="11"
                  fontFamily="var(--dm-font-primary), monospace"
                  fill={textColor}
                >
                  {line}
                </text>
              ))}
              {n.sub ? (
                <text
                  x={b.cx}
                  y={startY + lines.length * lineHeight + 2}
                  textAnchor="middle"
                  dominantBaseline="middle"
                  fontSize="9"
                  fontFamily="var(--dm-font-primary), monospace"
                  fill="#888888"
                >
                  {n.sub}
                </text>
              ) : null}
            </g>
          );
        })}

        {caption ? (
          <text
            x={width / 2}
            y={height - 8}
            textAnchor="middle"
            fontSize="10"
            fontFamily="var(--dm-font-primary), monospace"
            fill="#888888"
            letterSpacing="1"
          >
            {caption}
          </text>
        ) : null}
      </svg>
    </div>
  );
}
