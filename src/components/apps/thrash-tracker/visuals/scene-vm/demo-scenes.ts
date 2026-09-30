/*
 *                    ☦
 *           SCENE VM — BUILT-IN DEMO MANIFESTS
 *
 *  Self-contained scenes that need no external assets. Used to prove the
 *  audio→visual binding while the asset registry is being designed.
 */

import type { SceneManifest } from "./lib/types";

/**
 * KICK PUNCH — a single solid square that scales up sharply on note-on then
 * decays back to small, with a brief flash of color shift. Bind to a kick
 * channel with triggerMode "play-from-start".
 */
export const DEMO_KICK_PUNCH: SceneManifest = {
  id: "demo-kick-punch",
  name: "KICK PUNCH",
  version: 1,
  duration: 0.5,         // half a second
  totalFrames: 12,        // 0.5 * 24fps = 12
  aspectRatio: "1:1",
  stageBg: { mode: "color", color: "#000000" },
  assets: [],
  layers: [
    {
      id: "punch",
      type: "solid",
      z: 1,
      solidColor: "#ffffff",
      solidSize: { w: 96, h: 96 },
      transformKeyframes: [
        { frame: 1,  mode: "linear",  x: 0.5, y: 0.5, scaleX: 0.2, scaleY: 0.2, rotation: 0,  opacity: 1, brightness: 2 },
        { frame: 3,  mode: "bezier",  x: 0.5, y: 0.5, scaleX: 2.5, scaleY: 2.5, rotation: 0,  opacity: 1, brightness: 4 },
        { frame: 12, mode: "linear",  x: 0.5, y: 0.5, scaleX: 0.4, scaleY: 0.4, rotation: 0,  opacity: 0, brightness: 1 },
      ],
    },
  ],
};

/**
 * SNARE SPIN — a diamond that rotates 360° and slides across the screen on
 * note-on. Bind to a snare channel with triggerMode "play-from-start".
 */
export const DEMO_SNARE_SPIN: SceneManifest = {
  id: "demo-snare-spin",
  name: "SNARE SPIN",
  version: 1,
  duration: 0.4,
  totalFrames: 10,
  aspectRatio: "1:1",
  stageBg: { mode: "color", color: "#000000" },
  assets: [],
  layers: [
    {
      id: "spinner",
      type: "solid",
      z: 1,
      solidColor: "#ff00aa",
      solidSize: { w: 48, h: 48 },
      transformKeyframes: [
        { frame: 1,  mode: "bezier", x: 0.1, y: 0.5, scaleX: 1.0, scaleY: 1.0, rotation: 45,  opacity: 1, hueRotate: 0   },
        { frame: 5,  mode: "bezier", x: 0.5, y: 0.5, scaleX: 1.5, scaleY: 1.5, rotation: 225, opacity: 1, hueRotate: 180 },
        { frame: 10, mode: "linear", x: 0.9, y: 0.5, scaleX: 0.8, scaleY: 0.8, rotation: 405, opacity: 0, hueRotate: 360 },
      ],
    },
  ],
};

/**
 * MELODY PIANO ROLL — a horizontal strip that lights up across its width as
 * the playhead advances. Bind with triggerMode "pitch-mapped" so each note
 * scrubs the playhead to a pitch-derived frame.
 */
export const DEMO_PITCH_SCRUB: SceneManifest = {
  id: "demo-pitch-scrub",
  name: "PITCH SCRUB",
  version: 1,
  duration: 2.0,
  totalFrames: 48,
  aspectRatio: "16:9",
  stageBg: { mode: "color", color: "#001020" },
  assets: [],
  layers: [
    {
      id: "scrubber",
      type: "solid",
      z: 1,
      solidColor: "#00ff88",
      solidSize: { w: 16, h: 64 },
      transformKeyframes: [
        { frame: 1,  mode: "linear", x: 0.05, y: 0.5, scaleX: 1, scaleY: 1, rotation: 0, opacity: 1 },
        { frame: 48, mode: "linear", x: 0.95, y: 0.5, scaleX: 1, scaleY: 1, rotation: 0, opacity: 1 },
      ],
      noise: {
        y: { enabled: true, amplitude: 0.03, frequency: 4, seed: 7 },
      },
    },
    {
      id: "trail",
      type: "solid",
      z: 0,
      solidColor: "#003322",
      solidSize: { w: 720, h: 16 },
      transformKeyframes: [
        { frame: 1, mode: "hold", x: 0.5, y: 0.5, scaleX: 1, scaleY: 1, rotation: 0, opacity: 0.6 },
      ],
    },
  ],
};
