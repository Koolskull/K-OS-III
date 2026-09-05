/*
 * SHOTLIST — print/export page renderers
 * Pure canvas drawing (no React). Every page is a single offscreen <canvas>
 * reused for both browser print (shown 1:1 in a print-isolated container)
 * and PDF download (fed straight into jsPDF as an image) — one rendering
 * path, two outputs.
 *
 * Pages target US Letter at 300 DPI. Printed copy uses a plain monospace
 * font rather than the house pixel font: production paperwork prioritizes
 * legibility for handwritten notes over on-screen house style.
 */

import { xsheetFrameRanges, type Sequence, type Shot, type XFrame } from "./shotlistShared";

export const PAGE_DPI = 300;
export const PAGE_W_IN = 8.5;
export const PAGE_H_IN = 11;
export const PAGE_W_PX = Math.round(PAGE_W_IN * PAGE_DPI); // 2550
export const PAGE_H_PX = Math.round(PAGE_H_IN * PAGE_DPI); // 3300
export const MARGIN_PX = Math.round(0.4 * PAGE_DPI); // 120

const INK = "#000000";
const RULE = "#000000";
const MUTED = "#555555";
const FONT = "'Courier New', Courier, monospace";

function pt(n: number): number {
  return Math.round((n * PAGE_DPI) / 72);
}

function makeCanvas(): HTMLCanvasElement {
  const canvas = document.createElement("canvas");
  canvas.width = PAGE_W_PX;
  canvas.height = PAGE_H_PX;
  return canvas;
}

function baseCtx(canvas: HTMLCanvasElement): CanvasRenderingContext2D {
  const ctx = canvas.getContext("2d")!;
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = INK;
  ctx.strokeStyle = RULE;
  ctx.textBaseline = "alphabetic";
  return ctx;
}

function truncate(ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string {
  if (!text) return "";
  if (ctx.measureText(text).width <= maxWidth) return text;
  let s = text;
  while (s.length > 1 && ctx.measureText(`${s}…`).width > maxWidth) {
    s = s.slice(0, -1);
  }
  return `${s}…`;
}

function loadImage(url: string): Promise<HTMLImageElement | null> {
  return new Promise((resolve) => {
    if (!url || typeof Image === "undefined") {
      resolve(null);
      return;
    }
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => resolve(null);
    img.src = url;
  });
}

function drawPageHeader(
  ctx: CanvasRenderingContext2D,
  left: string,
  right: string,
): number {
  const y = MARGIN_PX;
  ctx.font = `${pt(9)}px ${FONT}`;
  ctx.fillStyle = MUTED;
  ctx.textAlign = "left";
  ctx.fillText(left.toUpperCase(), MARGIN_PX, y);
  ctx.textAlign = "right";
  ctx.fillText(right.toUpperCase(), PAGE_W_PX - MARGIN_PX, y);
  ctx.fillStyle = INK;
  ctx.textAlign = "left";
  const ruleY = y + pt(6);
  ctx.beginPath();
  ctx.moveTo(MARGIN_PX, ruleY);
  ctx.lineTo(PAGE_W_PX - MARGIN_PX, ruleY);
  ctx.lineWidth = 2;
  ctx.stroke();
  return ruleY + pt(14);
}

/* ------------------------------------------------------------------ */
/*  Storyboard export — thumbnails + description, no per-frame grid   */
/* ------------------------------------------------------------------ */

export const STORYBOARD_PER_PAGE = 4;

export function paginateStoryboard(shots: Shot[]): Shot[][] {
  const pages: Shot[][] = [];
  for (let i = 0; i < shots.length; i += STORYBOARD_PER_PAGE) {
    pages.push(shots.slice(i, i + STORYBOARD_PER_PAGE));
  }
  return pages.length > 0 ? pages : [[]];
}

function shotDialogue(shot: Shot): string {
  const lines = shot.xsheet.map((r) => r.dialogue.trim()).filter(Boolean);
  const deduped = lines.filter((line, i) => line !== lines[i - 1]);
  return deduped.join(" / ");
}

export async function renderStoryboardPage(
  sequence: Sequence,
  allShots: Shot[],
  pageShots: Shot[],
  pageIndex: number,
  totalPages: number,
): Promise<HTMLCanvasElement> {
  const canvas = makeCanvas();
  const ctx = baseCtx(canvas);
  const top = drawPageHeader(
    ctx,
    `${sequence.name} — STORYBOARD`,
    `PAGE ${pageIndex + 1} / ${totalPages}`,
  );

  const cols = 2;
  const rows = 2;
  const gap = pt(18);
  const contentW = PAGE_W_PX - MARGIN_PX * 2;
  const contentH = PAGE_H_PX - top - MARGIN_PX;
  const cardW = (contentW - gap * (cols - 1)) / cols;
  const cardH = (contentH - gap * (rows - 1)) / rows;

  const images = await Promise.all(pageShots.map((s) => loadImage(s.thumbnail ?? "")));

  pageShots.forEach((shot, i) => {
    const col = i % cols;
    const row = Math.floor(i / cols);
    const x = MARGIN_PX + col * (cardW + gap);
    const y = top + row * (cardH + gap);
    const shotNumber = allShots.findIndex((s) => s.id === shot.id) + 1;

    ctx.lineWidth = 2;
    ctx.strokeRect(x, y, cardW, cardH);

    // Thumbnail area (contain-fit, letterboxed)
    const thumbH = cardH * 0.55;
    const img = images[i];
    if (img) {
      const scale = Math.min(cardW / img.width, thumbH / img.height);
      const dw = img.width * scale;
      const dh = img.height * scale;
      const dx = x + (cardW - dw) / 2;
      const dy = y + (thumbH - dh) / 2;
      ctx.imageSmoothingEnabled = false;
      ctx.drawImage(img, dx, dy, dw, dh);
    }
    ctx.lineWidth = 1.5;
    ctx.strokeRect(x, y, cardW, thumbH);

    // Text block
    let ty = y + thumbH + pt(16);
    ctx.font = `bold ${pt(11)}px ${FONT}`;
    ctx.fillStyle = INK;
    ctx.fillText(
      truncate(ctx, `SHOT ${String(shotNumber).padStart(2, "0")} — ${shot.title}`, cardW),
      x,
      ty,
    );
    ty += pt(16);
    const seconds = (shot.durationFrames / (sequence.fps || 24)).toFixed(1);
    ctx.font = `${pt(8)}px ${FONT}`;
    ctx.fillStyle = MUTED;
    ctx.fillText(`${shot.durationFrames} FRAMES · ${seconds}s @ ${sequence.fps}fps`, x, ty);
    ty += pt(16);

    ctx.fillStyle = INK;
    ctx.font = `${pt(9)}px ${FONT}`;
    if (shot.description) {
      ctx.fillText(truncate(ctx, shot.description, cardW), x, ty);
      ty += pt(14);
    }
    const dialogue = shotDialogue(shot);
    if (dialogue) {
      ctx.fillText(truncate(ctx, `"${dialogue}"`, cardW), x, ty);
      ty += pt(14);
    }
    if (shot.audioNotes) {
      ctx.fillStyle = MUTED;
      ctx.fillText(truncate(ctx, `AUDIO: ${shot.audioNotes}`, cardW), x, ty);
    }
  });

  return canvas;
}

/* ------------------------------------------------------------------ */
/*  X-Sheet export — classic exposure sheet, frame 1 at top            */
/*  (matches OpenToonz / Tahoma2D's on-screen Xsheet panel order)      */
/* ------------------------------------------------------------------ */

interface XRow {
  row: XFrame;
  start: number;
  end: number;
}

const XSHEET_COLS: Array<{ key: keyof XFrame | "frame"; label: string; width: number }> = [
  { key: "frame", label: "FRAME", width: 130 },
  { key: "exposure", label: "HOLD", width: 100 },
  { key: "camera", label: "CAMERA", width: 220 },
  { key: "action", label: "ACTION", width: 420 },
  { key: "dialogue", label: "DIALOGUE", width: 420 },
  { key: "audioCue", label: "AUDIO CUE", width: 340 },
  { key: "notes", label: "NOTES", width: 420 },
  { key: "assetRef", label: "REF", width: 260 },
];

const ROW_H = pt(30);
const TABLE_HEADER_H = pt(20);
/** Page-header height is fixed (drawPageHeader always returns MARGIN_PX + pt(20)). */
const PAGE_HEADER_BOTTOM = MARGIN_PX + pt(20);

function xsheetRowsPerPage(): number {
  const footerReserve = pt(24);
  const available = PAGE_H_PX - PAGE_HEADER_BOTTOM - TABLE_HEADER_H - MARGIN_PX - footerReserve;
  return Math.max(1, Math.floor(available / ROW_H));
}

export function paginateXSheet(shot: Shot): XRow[][] {
  const ranges = xsheetFrameRanges(shot.xsheet);
  const all: XRow[] = shot.xsheet.map((row, i) => ({
    row,
    start: ranges[i]!.start,
    end: ranges[i]!.end,
  }));
  const rowsPerPage = xsheetRowsPerPage();
  const pages: XRow[][] = [];
  for (let i = 0; i < all.length; i += rowsPerPage) {
    pages.push(all.slice(i, i + rowsPerPage));
  }
  return pages.length > 0 ? pages : [[]];
}

export function renderXSheetPage(
  sequence: Sequence,
  shot: Shot,
  shotNumber: number,
  pageRows: XRow[],
  pageIndex: number,
  totalPages: number,
): HTMLCanvasElement {
  const canvas = makeCanvas();
  const ctx = baseCtx(canvas);
  const top = drawPageHeader(
    ctx,
    `${sequence.name} — SHOT ${String(shotNumber).padStart(2, "0")} — ${shot.title}`,
    `X-SHEET · ${sequence.fps}FPS · PAGE ${pageIndex + 1} / ${totalPages}`,
  );

  const tableX = MARGIN_PX;
  const tableW = PAGE_W_PX - MARGIN_PX * 2;
  const totalColW = XSHEET_COLS.reduce((s, c) => s + c.width, 0);
  const scale = tableW / totalColW;

  // Column header row
  ctx.font = `bold ${pt(8)}px ${FONT}`;
  ctx.textAlign = "left";
  let cx = tableX;
  ctx.lineWidth = 2;
  ctx.strokeRect(tableX, top, tableW, TABLE_HEADER_H);
  for (const col of XSHEET_COLS) {
    const w = col.width * scale;
    ctx.fillStyle = INK;
    ctx.fillText(col.label, cx + pt(4), top + TABLE_HEADER_H - pt(6));
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(cx, top);
    ctx.lineTo(cx, top + TABLE_HEADER_H);
    ctx.stroke();
    cx += w;
  }

  // Rows
  let ry = top + TABLE_HEADER_H;
  ctx.font = `${pt(8.5)}px ${FONT}`;
  for (const { row, start, end } of pageRows) {
    ctx.lineWidth = 1;
    ctx.strokeRect(tableX, ry, tableW, ROW_H);
    cx = tableX;
    for (const col of XSHEET_COLS) {
      const w = col.width * scale;
      const padX = cx + pt(4);
      const textY = ry + ROW_H / 2 + pt(3);
      ctx.fillStyle = INK;
      if (col.key === "frame") {
        const label = start === end ? `${start}` : `${start}–${end}`;
        ctx.fillText(label, padX, textY);
      } else if (col.key === "exposure") {
        ctx.fillText(`${row.exposure}`, padX, textY);
      } else {
        const value = String(row[col.key as Exclude<typeof col.key, "frame">] ?? "");
        ctx.fillText(truncate(ctx, value, w - pt(8)), padX, textY);
      }
      ctx.beginPath();
      ctx.moveTo(cx, ry);
      ctx.lineTo(cx, ry + ROW_H);
      ctx.stroke();
      cx += w;
    }
    ry += ROW_H;
  }

  // Trailing ruled (blank) rows to fill the page, for handwritten notes
  const rowsPerPage = xsheetRowsPerPage();
  for (let i = pageRows.length; i < rowsPerPage; i++) {
    ctx.lineWidth = 1;
    ctx.strokeStyle = "#bbbbbb";
    ctx.strokeRect(tableX, ry, tableW, ROW_H);
    ctx.strokeStyle = RULE;
    ry += ROW_H;
  }

  return canvas;
}
