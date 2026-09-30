/*
 *                    ☦
 *           SCENE VM — TIMELINE UTILITIES
 *
 *  Slim port from BeetleGame lib/cutscene/timeline-utils.ts.
 *  Theatre.js helpers (readKeyframesForProp, readAllKeyframes) intentionally
 *  dropped — Scene VM is runtime-only and reads keyframes from the manifest
 *  directly, never from a Theatre sheet.
 */

import { TIMELINE_FPS } from "./types";

/** Frame N (1-indexed) → seconds */
export function frameToSeconds(frame: number): number {
  return (frame - 1) / TIMELINE_FPS;
}

/** Seconds → frame N (1-indexed) */
export function secondsToFrame(seconds: number): number {
  return Math.round(seconds * TIMELINE_FPS) + 1;
}

/** Total frames a duration in seconds covers */
export function durationToFrames(durationSeconds: number): number {
  return Math.ceil(durationSeconds * TIMELINE_FPS);
}

/** Format frame number as SS:FF timecode */
export function formatTimecode(frame: number): string {
  const totalFrames = Math.max(0, frame - 1);
  const seconds = Math.floor(totalFrames / TIMELINE_FPS);
  const remainingFrames = totalFrames % TIMELINE_FPS;
  return `${seconds.toString().padStart(2, "0")}:${remainingFrames.toString().padStart(2, "0")}`;
}

/**
 * Convert a Datamoshpit tracker tick to a scene frame.
 * The tracker fires `tickCallback` at a per-row cadence; we convert tick→time
 * via Tone.js's transport BPM, then time→frame via TIMELINE_FPS.
 *
 * `bpm` and `tpb` come from the project's song. The default mapping treats
 * one tick = (60/bpm/tpb) seconds.
 */
export function tickToFrame(tick: number, bpm: number, tpb: number): number {
  const tickSeconds = 60 / (bpm * tpb);
  const totalSeconds = tick * tickSeconds;
  return secondsToFrame(totalSeconds);
}
