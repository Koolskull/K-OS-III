/*
 * Creative workflow types — cross-app handoffs for drawing tools.
 * Apps stay independent; the OS bus carries the plate/sprite payload.
 */

/** Apps that participate in creative handoffs */
export type CreativeAppId =
  | "kooldraw"
  | "shotlist"
  | "datamoshpit"
  | "tilemap";

/** What kind of asset is traveling */
export type CreativeAssetKind = "sprite" | "mono-plate" | "image";

/**
 * One in-flight handoff from source → target.
 * Target app loads this; on complete/cancel, source is focused again.
 */
export interface CreativeSession {
  id: string;
  sourceApp: CreativeAppId;
  targetApp: CreativeAppId;
  kind: CreativeAssetKind;
  /** Human label for chrome (“SHOT 3 plate”, etc.) */
  label: string;
  width: number;
  height: number;
  /** PNG (or other) data URL — null means blank canvas at width×height */
  dataUrl: string | null;
  /** Prefer mono tools / threshold on return (SHOTLIST plates) */
  mono?: boolean;
  bg?: "black" | "white";
  /**
   * Opaque bag for the source app (e.g. { shotId: 12 }).
   * Target must echo this back unchanged via complete/cancel path.
   */
  ref: Record<string, unknown>;
  createdAt: number;
}

export interface CreativeResult {
  dataUrl: string;
  width: number;
  height: number;
}

/** Delivered to the source app after target finishes or cancels */
export interface CreativeReturn {
  session: CreativeSession;
  result: CreativeResult | null;
  cancelled: boolean;
}

/** Freehand tool ids shared by SHOTLIST + KoolDraw (+ future apps) */
export type FreehandToolId = "pen" | "paint" | "harsh" | "dither" | "eraser";
