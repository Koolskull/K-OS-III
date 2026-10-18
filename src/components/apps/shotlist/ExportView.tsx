/*
 * SHOTLIST — export / print screen
 * Renders Storyboard or X-Sheet pages via exportRender.ts onto real
 * <canvas> elements, then either window.print()s them (isolated via a
 * scoped @media print stylesheet) or assembles the same canvases into a
 * downloadable multi-page PDF with jsPDF (loaded on demand).
 */

"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { btn, type Sequence } from "./shotlistShared";
import {
  PAGE_H_IN,
  PAGE_W_IN,
  paginateStoryboard,
  paginateXSheet,
  renderStoryboardPage,
  renderXSheetPage,
} from "./exportRender";

type ExportMode = "storyboard" | "xsheet";
type ExportScope = "all" | "selected";

interface ExportViewProps {
  sequence: Sequence;
  selectedShotId: number | null;
  onClose: () => void;
}

interface PageEntry {
  canvas: HTMLCanvasElement;
  label: string;
}

function CanvasHost({ canvas }: { canvas: HTMLCanvasElement }) {
  const hostRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;
    host.appendChild(canvas);
    return () => {
      if (canvas.parentNode === host) host.removeChild(canvas);
    };
  }, [canvas]);
  return <div className="kos-print-page" ref={hostRef} />;
}

const printCss = `
  .kos-print-page {
    width: 300px;
    height: ${Math.round((300 * PAGE_H_IN) / PAGE_W_IN)}px;
    border: 1px solid #333;
    margin: 0 auto 18px auto;
    overflow: hidden;
    background: #fff;
  }
  .kos-print-page canvas {
    width: 100%;
    height: 100%;
    display: block;
    image-rendering: auto;
  }
  @media print {
    html, body { overflow: visible !important; height: auto !important; }
    body * { visibility: hidden !important; }
    .kos-print-root, .kos-print-root * { visibility: visible !important; }
    .kos-export-chrome { display: none !important; }
    .kos-print-root {
      position: absolute;
      inset: 0;
      background: #fff;
    }
    .kos-print-page {
      width: ${PAGE_W_IN}in;
      height: ${PAGE_H_IN}in;
      border: none;
      margin: 0;
      page-break-after: always;
    }
    @page { size: ${PAGE_W_IN}in ${PAGE_H_IN}in; margin: 0; }
  }
`;

export function ExportView({ sequence, selectedShotId, onClose }: ExportViewProps) {
  const [mode, setMode] = useState<ExportMode>("storyboard");
  const [scope, setScope] = useState<ExportScope>("all");
  const [pages, setPages] = useState<PageEntry[]>([]);
  const [busy, setBusy] = useState(false);
  const [downloading, setDownloading] = useState(false);

  const scopedShots = useMemo(() => {
    if (scope === "selected" && selectedShotId != null) {
      const shot = sequence.shots.find((s) => s.id === selectedShotId);
      if (shot) return [shot];
    }
    return sequence.shots;
  }, [sequence.shots, scope, selectedShotId]);

  useEffect(() => {
    let cancelled = false;
    async function build() {
      setBusy(true);
      const next: PageEntry[] = [];
      if (scopedShots.length > 0) {
        if (mode === "storyboard") {
          const chunks = paginateStoryboard(scopedShots);
          for (let i = 0; i < chunks.length; i++) {
            const canvas = await renderStoryboardPage(
              sequence,
              sequence.shots,
              chunks[i]!,
              i,
              chunks.length,
            );
            if (cancelled) return;
            next.push({ canvas, label: `Storyboard ${i + 1}/${chunks.length}` });
          }
        } else {
          for (const shot of scopedShots) {
            const shotNumber = sequence.shots.findIndex((s) => s.id === shot.id) + 1;
            const shotPages = paginateXSheet(shot);
            shotPages.forEach((rows, i) => {
              const canvas = renderXSheetPage(
                sequence,
                shot,
                shotNumber,
                rows,
                i,
                shotPages.length,
              );
              next.push({
                canvas,
                label: `${shot.title} · page ${i + 1}/${shotPages.length}`,
              });
            });
          }
        }
      }
      if (!cancelled) {
        setPages(next);
        setBusy(false);
      }
    }
    void build();
    return () => {
      cancelled = true;
    };
  }, [mode, scopedShots, sequence]);

  const handlePrint = useCallback(() => {
    window.print();
  }, []);

  const handleDownload = useCallback(async () => {
    if (pages.length === 0 || downloading) return;
    setDownloading(true);
    try {
      const { jsPDF } = await import("jspdf");
      const doc = new jsPDF({ unit: "in", format: [PAGE_W_IN, PAGE_H_IN], compress: true });
      pages.forEach((p, i) => {
        if (i > 0) doc.addPage([PAGE_W_IN, PAGE_H_IN]);
        const dataUrl = p.canvas.toDataURL("image/png");
        // "FAST" flate-compresses the embedded bitmap — without it jsPDF embeds
        // the raw decoded RGB data (a blank 300dpi letter page balloons to ~25MB).
        doc.addImage(dataUrl, "PNG", 0, 0, PAGE_W_IN, PAGE_H_IN, undefined, "FAST");
      });
      const base = sequence.name.trim().replace(/\s+/g, "_").toLowerCase() || "sequence";
      doc.save(`${base}_${mode}.pdf`);
    } finally {
      setDownloading(false);
    }
  }, [pages, mode, downloading, sequence.name]);

  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        zIndex: 50,
        background: "#000",
        display: "flex",
        flexDirection: "column",
        minHeight: 0,
      }}
    >
      <style>{printCss}</style>

      <div
        className="kos-export-chrome"
        style={{
          flexShrink: 0,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 8,
          padding: "6px 10px",
          borderBottom: "1px solid #333",
          background: "#000",
          flexWrap: "wrap",
        }}
      >
        <span style={{ color: "#00ff00", letterSpacing: 2, fontSize: 11 }}>
          ⎙ EXPORT / PRINT
        </span>

        <div style={{ display: "flex", gap: 6 }}>
          <button
            type="button"
            style={btn(mode === "storyboard")}
            onClick={() => setMode("storyboard")}
          >
            STORYBOARD
          </button>
          <button type="button" style={btn(mode === "xsheet")} onClick={() => setMode("xsheet")}>
            X-SHEET
          </button>
        </div>

        <div style={{ display: "flex", gap: 6 }}>
          <button type="button" style={btn(scope === "all")} onClick={() => setScope("all")}>
            ALL SHOTS
          </button>
          <button
            type="button"
            style={btn(scope === "selected")}
            onClick={() => setScope("selected")}
            disabled={selectedShotId == null}
            title={selectedShotId == null ? "Select a shot in the list first" : undefined}
          >
            SELECTED SHOT
          </button>
        </div>

        <span style={{ fontSize: 9, color: "#666", letterSpacing: 1 }}>
          {busy ? "RENDERING…" : `${pages.length} PAGE${pages.length === 1 ? "" : "S"} · 8.5×11`}
        </span>

        <div style={{ display: "flex", gap: 6 }}>
          <button type="button" style={btn()} onClick={handlePrint} disabled={busy || pages.length === 0}>
            PRINT
          </button>
          <button
            type="button"
            style={btn()}
            onClick={() => void handleDownload()}
            disabled={busy || downloading || pages.length === 0}
          >
            {downloading ? "BUILDING PDF…" : "DOWNLOAD PDF"}
          </button>
          <button type="button" style={btn(true)} onClick={onClose}>
            CLOSE
          </button>
        </div>
      </div>

      <div style={{ flex: 1, overflow: "auto", padding: "16px 10px" }}>
        {pages.length === 0 && !busy && (
          <div style={{ textAlign: "center", color: "#666", fontSize: 11, marginTop: 40 }}>
            NO SHOTS TO EXPORT
          </div>
        )}
        <div className="kos-print-root">
          {pages.map((p, i) => (
            <CanvasHost key={i} canvas={p.canvas} />
          ))}
        </div>
      </div>
    </div>
  );
}
