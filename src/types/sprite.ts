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

/** A single animation frame */
export interface SpriteFrame {
  id: number;
  width: number;
  height: number;
  /** Flat pixel array, length = width * height. Index = y * width + x */
  pixels: Uint32Array;
}

/** A named layer containing one frame per animation step */
export interface SpriteLayer {
  id: number;
  name: string;
  opacity: number; // 0-1
  visible: boolean;
  frames: SpriteFrame[];
}

/** Root sprite/animation project */
export interface SpriteProject {
  name: string;
  width: number;
  height: number;
  fps: number;
  layers: SpriteLayer[];
  palette: string[]; // hex color strings
}

/** Drawing tool identifiers */
export type ToolId =
  | "pen"
  | "eraser"
  | "fill"
  | "picker"
  | "line"
  | "rect"
  | "select"
  | "move";

/** History entry for undo/redo */
export interface HistoryEntry {
  /** Snapshot of all layer frame pixels at this point */
  layerSnapshots: { layerId: number; frameIndex: number; pixels: Uint32Array }[];
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
