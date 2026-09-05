/*
 *                    ☦
 *            ╔══════════════════╗
 *            ║  KOOLDRAW        ║
 *            ║  SPRITE TYPES    ║
 *            ╚══════════════════╝
 *
 *   Core data model for the sprite/animation editor.
 *   Frame pixels stored as Uint32Array (ABGR packed 32-bit).
 */

/** Packed ABGR pixel color (canvas ImageData native format) */
export type PackedColor = number;

/** RGBA color tuple */
export interface RGBA {
  r: number;
  g: number;
  b: number;
  a: number;
}

/** A single drawing, permanently named within its layer's pool (see SpriteLayer). */
export interface SpriteFrame {
  id: number;
  /**
   * Permanent hex name, "000"–"FFF", assigned once at creation and never
   * reassigned — this is what's shown in the timeline and is how a drawing
   * gets reused at another timeline position (see SpriteLayer.exposures).
   */
  hexId: string;
  width: number;
  height: number;
  /** Flat pixel array, length = width * height. Index = y * width + x */
  pixels: Uint32Array;
}

/**
 * A named layer with two parallel arrays:
 *  - `frames` is the drawing POOL (every distinct drawing that exists on
 *    this layer, keyed by its permanent `hexId`).
 *  - `exposures` is the timeline TRACK: for each timeline position, the
 *    hexId of the pool frame shown there. The same hexId can appear at
 *    multiple non-contiguous positions (reuse, CSP/OpenToonz-style) without
 *    duplicating pixel data.
 *
 * For a project that never reuses a frame, `exposures[i] === frames[i].hexId`
 * for every i — behaviorally identical to a flat per-position frame list.
 */
export interface SpriteLayer {
  id: number;
  name: string;
  opacity: number; // 0-1
  visible: boolean;
  frames: SpriteFrame[];
  exposures: string[];
}

/** Playback pattern for the timeline preview and exported animation bundles. */
export type LoopMode = "oneshot" | "loop" | "pingpong" | "random";

/** Root sprite/animation project */
export interface SpriteProject {
  name: string;
  width: number;
  height: number;
  fps: number;
  loopMode: LoopMode;
  layers: SpriteLayer[];
  palette: string[]; // hex color strings
}

/** Drawing tool identifiers */
export type ToolId =
  | "pen"
  | "paint"
  | "harsh"
  | "dither"
  | "eraser"
  | "fill"
  | "picker"
  | "line"
  | "rect"
  | "select"
  | "move";

/** History entry for undo/redo — a full structural snapshot of every layer. */
export interface HistoryEntry {
  /**
   * Full snapshot of `project.layers` (order, pool frames incl. pixels, and
   * exposures track) so structural edits — reorder, reuse, delete-layer —
   * are undoable, not just pixel painting. Applied by replacing
   * `project.layers` wholesale rather than patching by id/index.
   */
  layers: SpriteLayer[];
  /** Which frame/layer was active */
  activeFrameIndex: number;
  activeLayerIndex: number;
}

/** Export format options */
export type ExportFormat = "png-sequence" | "sprite-sheet" | "gif";

/** Export settings */
export interface ExportSettings {
  format: ExportFormat;
  scale: number; // 1x, 2x, etc.
  columns?: number; // for sprite sheet layout
  name: string;
}
