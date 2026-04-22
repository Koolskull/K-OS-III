/*
 *                    ☦
 *      SCENE VM — KEYFRAME INTERPOLATION
 *
 *  Direct port from BeetleGame lib/cutscene/keyframe-interpolation.ts.
 *  Pure functions, no theatre, no react.
 *
 *  Three modes (Blender convention):
 *  - linear: straight-line interpolation between values
 *  - bezier: smooth ease-in/ease-out (organic, cinematic motion)
 *  - hold:   value stays constant until the next keyframe, then jumps
 *  - bounce-in / bounce-out / bounce-both: elastic accent variants
 */

import type { TransformKeyframe } from "./types";

export interface InterpolatedValues {
  x: number;
  y: number;
  scaleX: number;
  scaleY: number;
  rotation: number;
  opacity: number;
  brightness: number;
  blur: number;
  hueRotate: number;
  saturate: number;
}

function bezierEase(t: number): number {
  return t * t * (3 - 2 * t);
}

function bounceOut(t: number): number {
  if (t < 1 / 2.75) return 7.5625 * t * t;
  if (t < 2 / 2.75) { const t2 = t - 1.5 / 2.75; return 7.5625 * t2 * t2 + 0.75; }
  if (t < 2.5 / 2.75) { const t2 = t - 2.25 / 2.75; return 7.5625 * t2 * t2 + 0.9375; }
  const t2 = t - 2.625 / 2.75;
  return 7.5625 * t2 * t2 + 0.984375;
}

function bounceIn(t: number): number {
  return 1 - bounceOut(1 - t);
}

function bounceBoth(t: number): number {
  return t < 0.5 ? bounceIn(t * 2) * 0.5 : bounceOut(t * 2 - 1) * 0.5 + 0.5;
}

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

function valuesFromKF(k: TransformKeyframe): InterpolatedValues {
  return {
    x: k.x, y: k.y, scaleX: k.scaleX, scaleY: k.scaleY,
    rotation: k.rotation, opacity: k.opacity,
    brightness: k.brightness ?? 1,
    blur: k.blur ?? 0,
    hueRotate: k.hueRotate ?? 0,
    saturate: k.saturate ?? 1,
  };
}

function lerpKF(a: TransformKeyframe, b: TransformKeyframe, t: number): InterpolatedValues {
  return {
    x: lerp(a.x, b.x, t),
    y: lerp(a.y, b.y, t),
    scaleX: lerp(a.scaleX, b.scaleX, t),
    scaleY: lerp(a.scaleY, b.scaleY, t),
    rotation: lerp(a.rotation, b.rotation, t),
    opacity: lerp(a.opacity, b.opacity, t),
    brightness: lerp(a.brightness ?? 1, b.brightness ?? 1, t),
    blur: lerp(a.blur ?? 0, b.blur ?? 0, t),
    hueRotate: lerp(a.hueRotate ?? 0, b.hueRotate ?? 0, t),
    saturate: lerp(a.saturate ?? 1, b.saturate ?? 1, t),
  };
}

export function interpolateTransformKeyframes(
  frame: number,
  keyframes: TransformKeyframe[],
): InterpolatedValues | null {
  if (keyframes.length === 0) return null;
  const sorted = [...keyframes].sort((a, b) => a.frame - b.frame);

  if (frame <= sorted[0].frame) return valuesFromKF(sorted[0]);
  if (frame >= sorted[sorted.length - 1].frame) return valuesFromKF(sorted[sorted.length - 1]);

  for (let i = 0; i < sorted.length - 1; i++) {
    const a = sorted[i];
    const b = sorted[i + 1];
    if (frame >= a.frame && frame <= b.frame) {
      const rawT = (frame - a.frame) / (b.frame - a.frame);
      switch (a.mode) {
        case "hold": return valuesFromKF(a);
        case "bezier": return lerpKF(a, b, bezierEase(rawT));
        case "bounce-in": return lerpKF(a, b, bounceIn(rawT));
        case "bounce-out": return lerpKF(a, b, bounceOut(rawT));
        case "bounce-both": return lerpKF(a, b, bounceBoth(rawT));
        case "linear":
        default: return lerpKF(a, b, rawT);
      }
    }
  }
  return null;
}

/**
 * Build a CSS filter string from interpolated values.
 * Used by the Scene VM runtime when a layer is rendered as DOM/HTML.
 */
export function buildCSSFilter(v: InterpolatedValues): string {
  const parts: string[] = [];
  if (v.brightness !== 1) parts.push(`brightness(${v.brightness})`);
  if (v.blur > 0) parts.push(`blur(${v.blur}px)`);
  if (v.hueRotate !== 0) parts.push(`hue-rotate(${v.hueRotate}deg)`);
  if (v.saturate !== 1) parts.push(`saturate(${v.saturate})`);
  return parts.length > 0 ? parts.join(" ") : "none";
}
