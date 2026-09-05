/*
 * Modular freehand tool definitions.
 * Import this registry in any creative app instead of re-declaring keys/labels.
 */

import type { FreehandToolId } from "./types";

export interface FreehandToolDef {
  id: FreehandToolId;
  /** Short toolbar label (3–4 chars) */
  label: string;
  /** Keyboard shortcut (single letter, case-insensitive) */
  key: string;
  title: string;
}

/** Core freehand stack — pixel pen, soft paint, harsh, dither, eraser */
export const FREEHAND_TOOLS: readonly FreehandToolDef[] = [
  {
    id: "pen",
    label: "PEN",
    key: "B",
    title: "Hard pixel pen — size from pressure × max width",
  },
  {
    id: "paint",
    label: "PNT",
    key: "A",
    title: "Soft color paint — opacity, feather, scatter, optional AA (A)",
  },
  {
    id: "harsh",
    label: "HRS",
    key: "K",
    title: "Harsh pen — solid carve, slight pressure size",
  },
  {
    id: "dither",
    label: "DTH",
    key: "D",
    title: "Dither pencil — pressure density + size, phase-shifted Bayer",
  },
  {
    id: "eraser",
    label: "ERA",
    key: "E",
    title: "Eraser — pressure-sized disk (transparent)",
  },
] as const;

export function freehandToolByKey(key: string): FreehandToolDef | undefined {
  const k = key.toLowerCase();
  return FREEHAND_TOOLS.find((t) => t.key.toLowerCase() === k);
}

export function isFreehandToolId(id: string): id is FreehandToolId {
  return FREEHAND_TOOLS.some((t) => t.id === id);
}
