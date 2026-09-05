/*
 * SHOTLIST — shared types + helpers
 * Split out of ShotlistApp.tsx so XSheetEditor.tsx / ExportView.tsx /
 * exportRender.ts can import them without a circular import back into
 * ShotlistApp.tsx (which itself imports those components).
 */

import type React from "react";
import type { PlateOrientation, ShotBg } from "./monoDraw";

/**
 * One X-Sheet row = one exposure GROUP, not one literal drawn frame — this is
 * how paper exposure sheets already work: write the action once, hold it for
 * `exposure` frames. A shot's frame numbers are the cumulative sum of
 * `exposure` down the array, starting at 1 (see xsheetFrameRanges below).
 */
export interface XFrame {
  id: number;
  exposure: number;
  action: string;
  dialogue: string;
  camera: string;
  audioCue: string;
  notes: string;
  assetRef: string | null;
}

export interface Shot {
  id: number;
  title: string;
  description: string;
  durationFrames: number;
  audioNotes: string;
  bg: ShotBg;
  orientation: PlateOrientation;
  plateW: number;
  plateH: number;
  thumbnail: string | null;
  hasCommittedThumbnail: boolean;
  xsheet: XFrame[];
  status: "draft" | "review" | "approved";
}

export interface Sequence {
  id: number;
  name: string;
  fps: number;
  shots: Shot[];
}

/** Cumulative [startFrame, endFrame] (inclusive, 1-based) for each xsheet row. */
export function xsheetFrameRanges(xsheet: XFrame[]): Array<{ start: number; end: number }> {
  const ranges: Array<{ start: number; end: number }> = [];
  let cursor = 1;
  for (const row of xsheet) {
    const hold = Math.max(1, row.exposure || 1);
    ranges.push({ start: cursor, end: cursor + hold - 1 });
    cursor += hold;
  }
  return ranges;
}

export function xsheetTotalFrames(xsheet: XFrame[]): number {
  return xsheet.reduce((sum, row) => sum + Math.max(1, row.exposure || 1), 0);
}

let nextId = 1;
export function uid(): number {
  return nextId++;
}

export function createEmptyXFrame(): XFrame {
  return {
    id: uid(),
    exposure: 1,
    action: "",
    dialogue: "",
    camera: "",
    audioCue: "",
    notes: "",
    assetRef: null,
  };
}

export const btn = (active = false): React.CSSProperties => ({
  padding: "6px 10px",
  background: active ? "#ffffff" : "#000000",
  color: active ? "#000000" : "#cccccc",
  border: active ? "1px solid #ffffff" : "1px solid #555555",
  cursor: "pointer",
  fontFamily: "inherit",
  fontSize: 10,
  letterSpacing: 1,
  touchAction: "manipulation",
});

export const fieldStyle: React.CSSProperties = {
  display: "block",
  width: "100%",
  marginTop: 2,
  background: "#111",
  color: "#eee",
  border: "1px solid #333",
  padding: "4px 6px",
  fontFamily: "inherit",
  fontSize: 11,
};
