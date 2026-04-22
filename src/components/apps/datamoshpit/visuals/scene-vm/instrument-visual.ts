/*
 *                    ☦
 *      SCENE VM — INSTRUMENT VISUAL ADAPTER
 *
 *  Bridges the lightweight per-instrument visual settings (Instrument.visual,
 *  defined in src/types/tracker.ts) to the Scene VM runtime's SceneManifest.
 *
 *  The F4 Instrument page exposes a small "VISUAL" block — source, asset/color,
 *  size, position, length. Power users can later replace the auto-generated
 *  manifest with a custom one in the Cutscene Editor (future PR).
 */

import type { Instrument, InstrumentVisual, VisualSource } from "@/types/tracker";
import { VISUAL_FRAMES_MIN, VISUAL_FRAMES_MAX } from "@/types/tracker";
import type { SceneManifest, SceneLayer, NoteTriggerMode } from "./lib/types";
import { TIMELINE_FPS } from "./lib/types";

/* ------------------------------------------------------------------ */
/*  Defaults & deterministic randomization                             */
/* ------------------------------------------------------------------ */

/** Mulberry32 — fast, deterministic 32-bit PRNG seeded by an integer. */
function mulberry32(seed: number): () => number {
  let s = seed >>> 0;
  return function () {
    s = (s + 0x6D2B79F5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Pick a value from an array deterministically given a 0..1 random. */
function pick<T>(rng: () => number, arr: readonly T[]): T {
  return arr[Math.floor(rng() * arr.length)];
}

/** Random integer in [min, max] inclusive. */
function rint(rng: () => number, min: number, max: number): number {
  return Math.floor(rng() * (max - min + 1)) + min;
}

/** Random hex color, slightly biased toward saturated/bright values. */
function randomColor(rng: () => number): string {
  // Use HSL for predictable saturation, then convert to hex
  const h = Math.floor(rng() * 360);
  const s = 70 + Math.floor(rng() * 30);   // 70-100 saturation
  const l = 50 + Math.floor(rng() * 25);   // 50-75 lightness
  // HSL → RGB
  const c = (1 - Math.abs(2 * (l / 100) - 1)) * (s / 100);
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = l / 100 - c / 2;
  let r = 0, g = 0, b = 0;
  if (h < 60) { r = c; g = x; }
  else if (h < 120) { r = x; g = c; }
  else if (h < 180) { g = c; b = x; }
  else if (h < 240) { g = x; b = c; }
  else if (h < 300) { r = x; b = c; }
  else { r = c; b = x; }
  const toHex = (v: number) => Math.round((v + m) * 255).toString(16).padStart(2, "0");
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

/**
 * Generate a default visual for an instrument. Every instrument carries a
 * visual record; the record is **disabled by default** so toggling it on
 * reveals a pre-rolled starting point the user can immediately customize or
 * re-randomize.
 *
 * The randomized fields are deterministic per (id, type) so the same
 * instrument always rolls the same starting visual across sessions, until
 * the user explicitly randomizes again.
 */
export function defaultVisualForInstrument(
  id: number,
  type: Instrument["type"],
): InstrumentVisual {
  return rollVisualForInstrument(id, type, /* enabled */ false);
}

/**
 * Re-roll the randomized fields for an instrument's visual. Used by the
 * "RND" button on the F4 Instrument page. Caller can preserve enabled state.
 */
export function rollVisualForInstrument(
  id: number,
  type: Instrument["type"],
  enabled: boolean,
  /** Optional seed offset — bump it to get a different roll for the same instrument. */
  seedOffset = 0,
): InstrumentVisual {
  const seed = (id + 1) * 97 + (type === "fm" ? 13 : type === "sample" ? 29 : 41) + seedOffset;
  const rng = mulberry32(seed);

  const sources: VisualSource[] = [
    "color", "color", "color", "color",   // 4× weight on color (the demo default)
    "shader",                              // 1× shader (placeholder for now)
  ];
  const source = pick(rng, sources);

  const triggers: NoteTriggerMode[] = [
    "play-from-start", "play-from-start", "play-from-start",
    "pitch-mapped",
  ];

  return {
    enabled,
    source,
    color: source === "color" ? randomColor(rng) : undefined,
    shaderId: source === "shader" ? pick(rng, ["plasma", "crt-feedback", "glitch-block"]) : undefined,
    width: rint(rng, 32, 192),
    height: rint(rng, 32, 192),
    posX: rint(rng, 64, 192),
    posY: rint(rng, 64, 192),
    totalFrames: rint(rng, 12, 48),
    triggerMode: pick(rng, triggers),
    pitchLo: 36,   // C2
    pitchHi: 96,   // C7
  };
}

/* ------------------------------------------------------------------ */
/*  Visual → SceneManifest conversion                                  */
/* ------------------------------------------------------------------ */

const PLAYER_VIEWPORT_W = 320;
const PLAYER_VIEWPORT_H = 240;

/**
 * Build a SceneManifest from an InstrumentVisual's quick settings.
 *
 * Each source type gets a tasteful auto-generated keyframe pattern:
 * - color  → scale-up flash, fades out
 * - image  → scale-pulse with subtle rotation
 * - shader → solid placeholder (real shader rendering is a future PR)
 * - model  → magenta placeholder (3D rendering is a future PR)
 * - video / iframe → placeholder badge
 * - none   → empty manifest
 */
export function manifestFromInstrumentVisual(
  visual: InstrumentVisual,
  instName: string,
  instId: number,
): SceneManifest {
  const totalFrames = Math.max(
    VISUAL_FRAMES_MIN,
    Math.min(VISUAL_FRAMES_MAX, visual.totalFrames),
  );
  const duration = totalFrames / TIMELINE_FPS;
  const x = visual.posX / 255;
  const y = visual.posY / 255;

  const baseManifest: SceneManifest = {
    id: `inst-${instId}`,
    name: `INST ${instId.toString(16).toUpperCase().padStart(2, "0")} ${instName}`,
    version: 1,
    duration,
    totalFrames,
    aspectRatio: "4:3",
    stageBg: { mode: "color", color: "#000000" },
    assets: [],
    layers: [],
  };

  if (!visual.enabled || visual.source === "none") {
    return baseManifest;
  }

  const lastFrame = totalFrames;
  const peakFrame = Math.max(2, Math.floor(totalFrames * 0.25));

  // If the user has authored custom keyframes via the timeline editor, those
  // take precedence over the auto-generated ones for ALL source types below.
  // We still respect the source's render shape (color → solid, image → image, etc.).
  const useCustom = visual.customKeyframes && visual.customKeyframes.length > 0;

  if (visual.source === "color") {
    const layer: SceneLayer = {
      id: "v",
      type: "solid",
      z: 1,
      solidColor: visual.color ?? "#ffffff",
      solidSize: { w: visual.width, h: visual.height },
      transformKeyframes: useCustom ? visual.customKeyframes : [
        { frame: 1,         mode: "linear", x, y, scaleX: 0.2, scaleY: 0.2, rotation: 0, opacity: 1, brightness: 2 },
        { frame: peakFrame, mode: "bezier", x, y, scaleX: 1.0, scaleY: 1.0, rotation: 0, opacity: 1, brightness: 1.5 },
        { frame: lastFrame, mode: "linear", x, y, scaleX: 0.6, scaleY: 0.6, rotation: 0, opacity: 0, brightness: 1 },
      ],
    };
    baseManifest.layers.push(layer);
    return baseManifest;
  }

  if (visual.source === "image" && visual.assetUrl) {
    baseManifest.assets.push({ id: "img", type: "image", path: visual.assetUrl, label: instName });
    baseManifest.layers.push({
      id: "v",
      type: "image",
      assetRef: "img",
      z: 1,
      transformKeyframes: useCustom ? visual.customKeyframes : [
        { frame: 1,         mode: "linear", x, y, scaleX: 0.5, scaleY: 0.5, rotation: -8, opacity: 1 },
        { frame: peakFrame, mode: "bezier", x, y, scaleX: 1.1, scaleY: 1.1, rotation:  4, opacity: 1 },
        { frame: lastFrame, mode: "linear", x, y, scaleX: 0.9, scaleY: 0.9, rotation:  0, opacity: 0.8 },
      ],
      noise: useCustom ? undefined : {
        rotation: { enabled: true, amplitude: 1.5, frequency: 2, seed: instId + 1 },
      },
    });
    return baseManifest;
  }

  // Placeholder for sources we haven't implemented yet (shader, model, video, iframe)
  const placeholderColor =
    visual.source === "shader" ? "#00ffaa" :
    visual.source === "model"  ? "#ff00aa" :
    visual.source === "video"  ? "#ffaa00" :
    visual.source === "iframe" ? "#aaaaff" :
    "#888888";
  baseManifest.layers.push({
    id: "v",
    type: "solid",
    z: 1,
    solidColor: placeholderColor,
    solidSize: { w: visual.width, h: visual.height },
    transformKeyframes: useCustom ? visual.customKeyframes : [
      { frame: 1,         mode: "linear", x, y, scaleX: 0.4, scaleY: 0.4, rotation:  0, opacity: 1 },
      { frame: peakFrame, mode: "bezier", x, y, scaleX: 1.0, scaleY: 1.0, rotation: 12, opacity: 1, brightness: 1.5 },
      { frame: lastFrame, mode: "linear", x, y, scaleX: 0.6, scaleY: 0.6, rotation: -6, opacity: 0 },
    ],
  });
  return baseManifest;
}

/* ------------------------------------------------------------------ */
/*  Default keyframe set (for "EDIT TIMELINE" first-open seed)         */
/* ------------------------------------------------------------------ */

import type { TransformKeyframe } from "./lib/types";

/** Generate a starter set of 3 keyframes the user can immediately tweak. */
export function defaultCustomKeyframes(visual: InstrumentVisual): TransformKeyframe[] {
  const total = Math.max(VISUAL_FRAMES_MIN, Math.min(VISUAL_FRAMES_MAX, visual.totalFrames));
  const peak = Math.max(2, Math.floor(total * 0.25));
  const x = visual.posX / 255;
  const y = visual.posY / 255;
  return [
    { frame: 1,    mode: "linear", x, y, scaleX: 0.4, scaleY: 0.4, rotation:  0, opacity: 1, brightness: 1.5 },
    { frame: peak, mode: "bezier", x, y, scaleX: 1.0, scaleY: 1.0, rotation:  0, opacity: 1, brightness: 1.0 },
    { frame: total, mode: "linear", x, y, scaleX: 0.7, scaleY: 0.7, rotation: 0, opacity: 0, brightness: 1.0 },
  ];
}

/* ------------------------------------------------------------------ */
/*  Player viewport defaults (used by SceneVMWindow follow-instrument) */
/* ------------------------------------------------------------------ */

export const PLAYER_DEFAULT_W = PLAYER_VIEWPORT_W;
export const PLAYER_DEFAULT_H = PLAYER_VIEWPORT_H;
