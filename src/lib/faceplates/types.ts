/*
 *                    ☦
 *            ╔══════════════╗
 *            ║  FACEPLATE   ║
 *            ║  BUILD KIT   ║
 *            ╚══════════════╝
 *
 *  Drop-in skin packs for Thrash Tracker / Datamoshpit live pads,
 *  drum kits, sample kits, and FX faceplates.
 *  Artists own the look. The engine only resolves VMI frames.
 */

/** VMI state nibble pair (high 4 hex digits of SSSSXX.PNG) */
export type VmiStateCode =
  | "0000" // default
  | "0010" // active / hover
  | "0020" // pressed
  | "0030" // muted
  | "0040"; // solo

export type SkinTarget =
  | "live-pads"
  | "kit"
  | "fx"
  | "sample-kit"
  | "drum-kit"
  | "effect";

export interface SkinPackIndexEntry {
  id: string;
  name: string;
  author: string;
  path: string;
  template?: boolean;
}

export interface SkinPackIndex {
  version: number;
  defaultPackId: string;
  packs: SkinPackIndexEntry[];
}

export interface SkinPackLayout {
  pads: { cols: number; rows: number; sharedArt: boolean };
  faceplate: { fit: "cover" | "contain" | "fill" };
  showPadLabels?: boolean;
}

export interface SkinPackManifest {
  id: string;
  name: string;
  author: string;
  version: number;
  description?: string;
  targets: SkinTarget[];
  layout: SkinPackLayout;
  /** Relative folder paths inside the pack root */
  slots: {
    faceplate?: string;
    /** Shared pad art folder, or prefix when sharedArt=false (pads/00 .. pads/0F) */
    pad?: string;
    /** Optional named button slots (fx, bypass, etc.) */
    [buttonId: string]: string | undefined;
  };
  states: Record<string, string>;
}

export type PadVisualState = "default" | "active" | "pressed" | "muted" | "solo";

export interface ResolvedSkinPack {
  entry: SkinPackIndexEntry;
  manifest: SkinPackManifest;
  /** Absolute pack root under /public, e.g. /skins/factory-steel */
  root: string;
}
