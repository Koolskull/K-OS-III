"use client";

/*
 * Monochrome ordered-dither generative illustrations for EDUCATION.
 * Internal resolution 640×480, pure B/W Bayer dither, Three.js WebGL.
 * Animations pause when off-screen.
 */

import React, { useEffect, useRef } from "react";
import * as THREE from "three";

export const ILLUST_W = 640;
export const ILLUST_H = 480;

export type IllustKind =
  | "open-book"
  | "judgment-scales"
  | "archive-scroll"
  | "prove-all"
  | "narrow-path"
  | "living-water"
  | "simple-table"
  | "hemi-spheres"
  | "focus-rings"
  | "body-starfield"
  | "gateway-tone"
  | "file-shred"
  | "radar-stargate"
  | "project-labyrinth"
  | "church-committee"
  | "wardenclyffe"
  | "em-waves"
  | "light-lattice"
  | "patent-grid"
  | "jekyll-night"
  | "reserve-columns"
  | "ledger-flow"
  | "american-system"
  | "two-streams"
  | "layer-stack"
  | "symbiosis-loop"
  | "effigy-desert"
  | "santa-swarm"
  | "zone-trip"
  | "saturnalia-mask"
  | "acid-kaleido"
  | "prankster-bus"
  | "lab-beaker"
  | "festival-scale"
  | "break-grid"
  | "cyber-nodes"
  | "accel-streaks"
  | "hyperstition"
  | "mindwar-field"
  | "set-geometry"
  | "dossier-stamp"
  | "presidio-fog"
  | "myth-filter"
  | "crowd-density"
  | "cryo-claim"
  | "checklist"
  | "observe-map"
  | "source-stack"
  | "four-clocks"
  | "sky-rupture"
  | "black-mat"
  | "proxy-debate"
  | "t-pillars"
  | "carved-fauna"
  | "dig-grid"
  | "flood-wave"
  | "tablet-wave"
  | "atlantis-ring"
  | "shelf-drown"
  | "ghost-map"
  | "compass-rose"
  | "sunken-colonnade"
  | "watcher-field"
  | "enoch-descent"
  | "mud-strata"
  | "clock-seams"
  | "observe-lamp";

const BAYER_GLSL = `
float bayer(vec2 p) {
  vec2 xy = floor(mod(p, 8.0));
  // Classic 8x8 Bayer threshold map via arithmetic
  float x = xy.x;
  float y = xy.y;
  float v =
    0.0
    + 32.0 * step(1.0, mod(x, 2.0))
    + 16.0 * step(1.0, mod(y, 2.0))
    + 8.0 * step(1.0, mod(floor(x/2.0), 2.0))
    + 4.0 * step(1.0, mod(floor(y/2.0), 2.0))
    + 2.0 * step(1.0, mod(floor(x/4.0), 2.0))
    + 1.0 * step(1.0, mod(floor(y/4.0), 2.0));
  // Bit-reversal style adjustment for more even distribution
  float w =
    16.0 * step(1.0, mod(y, 2.0))
    + 32.0 * step(1.0, mod(x, 2.0))
    + 4.0 * step(1.0, mod(floor(y/2.0), 2.0))
    + 8.0 * step(1.0, mod(floor(x/2.0), 2.0))
    + 1.0 * step(1.0, mod(floor(y/4.0), 2.0))
    + 2.0 * step(1.0, mod(floor(x/4.0), 2.0));
  return w / 64.0;
}
`;

function sceneShader(kind: IllustKind): string {
  // Each kind is a pure generative grayscale field in 0..1, then dithered.
  const body: Record<IllustKind, string> = {
    "open-book": `
      vec2 q = p - vec2(0.5, 0.45);
      float page = smoothstep(0.35, 0.0, abs(q.x) - 0.02) * smoothstep(0.32, 0.0, abs(q.y));
      float spine = smoothstep(0.02, 0.0, abs(q.x));
      float lines = 0.0;
      for (int i = 0; i < 12; i++) {
        float y = -0.25 + float(i) * 0.045 + 0.01 * sin(t * 0.7 + float(i));
        lines += 0.35 * smoothstep(0.006, 0.0, abs(q.y - y)) * step(abs(q.x), 0.28);
      }
      float flip = 0.15 * sin(t * 1.2 + q.x * 8.0) * page;
      g = clamp(0.15 + page * 0.55 + lines + spine * 0.4 + flip, 0.0, 1.0);
    `,
    "judgment-scales": `
      vec2 q = p - 0.5;
      float beam = smoothstep(0.015, 0.0, abs(q.y + 0.05 - 0.08 * sin(t)));
      float left = length(q - vec2(-0.22, 0.05 + 0.08 * sin(t))) - 0.08;
      float right = length(q - vec2(0.22, 0.05 - 0.08 * sin(t))) - 0.08;
      float pans = smoothstep(0.02, 0.0, abs(left)) + smoothstep(0.02, 0.0, abs(right));
      float post = smoothstep(0.02, 0.0, abs(q.x)) * step(q.y, 0.25) * step(-0.35, q.y);
      g = clamp(beam * 0.5 + pans * 0.7 + post * 0.6, 0.0, 1.0);
    `,
    "archive-scroll": `
      float row = floor(p.y * 24.0 - t * 2.0);
      float col = floor(p.x * 40.0);
      float cell = fract(sin(row * 12.9898 + col * 78.233) * 43758.5453);
      float line = step(0.55, cell);
      float scan = 0.2 * step(0.97, fract(p.y * 3.0 - t * 0.4));
      g = mix(0.08, 0.85, line) + scan;
    `,
    "prove-all": `
      vec2 q = p - 0.5;
      float ring = abs(length(q) - 0.28 - 0.02 * sin(t * 2.0));
      float cross = smoothstep(0.02, 0.0, abs(q.x)) + smoothstep(0.02, 0.0, abs(q.y));
      float text = step(0.7, fract(sin(dot(floor(p*30.0), vec2(12.1,4.3))) * 99.0));
      g = clamp(smoothstep(0.03, 0.0, ring) * 0.9 + cross * 0.25 * (1.0 - smoothstep(0.25, 0.4, length(q))) + text * 0.08, 0.0, 1.0);
    `,
    "narrow-path": `
      vec2 q = p - vec2(0.5, 0.0);
      float path = smoothstep(0.08 + 0.02 * sin(t + p.y * 6.0), 0.02, abs(q.x - 0.05 * sin(p.y * 8.0 + t)));
      float hills = 0.3 * sin(p.x * 12.0 + t * 0.3) * (1.0 - p.y);
      float light = exp(-30.0 * length(p - vec2(0.5, 0.92)));
      g = clamp(path * 0.7 + hills * 0.2 + light, 0.0, 1.0);
    `,
    "living-water": `
      float w = 0.0;
      for (int i = 1; i <= 5; i++) {
        float fi = float(i);
        w += sin(p.x * (4.0 + fi) + t * fi * 0.6 + p.y * 3.0) / fi;
      }
      float stream = smoothstep(0.15, 0.0, abs(p.y - 0.45 - 0.08 * w));
      float spark = step(0.98, fract(sin(dot(p, vec2(9.1, 4.7)) + t) * 99.0));
      g = clamp(0.12 + stream * 0.75 + spark * 0.4, 0.0, 1.0);
    `,
    "simple-table": `
      float plate = smoothstep(0.22, 0.18, length(p - vec2(0.5, 0.55)));
      float bread = smoothstep(0.08, 0.05, length(p - vec2(0.42, 0.52)));
      float cup = smoothstep(0.05, 0.02, abs(length(p - vec2(0.6, 0.52)) - 0.04));
      float glow = 0.15 * sin(t * 2.0) * plate;
      g = clamp(0.1 + plate * 0.35 + bread * 0.5 + cup * 0.7 + glow, 0.0, 1.0);
    `,
    "hemi-spheres": `
      vec2 L = p - vec2(0.35, 0.5);
      vec2 R = p - vec2(0.65, 0.5);
      float sl = smoothstep(0.18, 0.16, length(L));
      float sr = smoothstep(0.18, 0.16, length(R));
      float phase = 0.5 + 0.5 * sin(t * 3.0);
      float wave = 0.5 + 0.5 * sin(20.0 * p.x + t * 6.0);
      g = clamp(sl * (0.4 + 0.4 * phase) + sr * (0.4 + 0.4 * (1.0 - phase)) + 0.15 * wave * (sl + sr), 0.0, 1.0);
    `,
    "focus-rings": `
      vec2 q = p - 0.5;
      float r = length(q);
      float rings = 0.0;
      for (int i = 1; i <= 6; i++) {
        float target = 0.06 * float(i) + 0.02 * sin(t + float(i));
        rings += smoothstep(0.012, 0.0, abs(r - target));
      }
      g = clamp(rings * 0.85 + 0.05, 0.0, 1.0);
    `,
    "body-starfield": `
      vec2 q = p - 0.5;
      float body = smoothstep(0.12, 0.08, length((q - vec2(0.0, -0.05)) * vec2(1.4, 0.9)));
      float head = smoothstep(0.05, 0.03, length(q - vec2(0.0, 0.12)));
      float exit = length(q - vec2(0.0, 0.12 + 0.15 * fract(t * 0.15)));
      float spirit = exp(-exit * 12.0) * (0.5 + 0.5 * sin(t * 4.0));
      float stars = step(0.995, fract(sin(dot(floor(p * 80.0), vec2(12.0, 78.0))) * 43758.0));
      g = clamp(body * 0.4 + head * 0.5 + spirit + stars, 0.0, 1.0);
    `,
    "gateway-tone": `
      float y = p.y;
      float tone = 0.5 + 0.5 * sin(p.x * 40.0 + t * 8.0 + sin(y * 10.0 + t));
      float band = smoothstep(0.2, 0.0, abs(y - 0.5 - 0.1 * sin(t)));
      g = mix(0.08, tone, 0.5 + 0.5 * band);
    `,
    "file-shred": `
      float x = p.x;
      float fall = fract(p.y + t * 0.25 + x * 0.3);
      float strip = step(0.0, sin(x * 60.0));
      float paper = step(fall, 0.7) * strip;
      float conf = step(0.97, fract(sin(dot(p * 40.0, vec2(3.1, 7.4)) + t) * 99.0));
      g = clamp(paper * 0.7 + conf, 0.0, 1.0);
    `,
    "radar-stargate": `
      vec2 q = p - 0.5;
      float ang = atan(q.y, q.x);
      float sweep = abs(fract((ang / 6.28318) - t * 0.15) - 0.02);
      float blip = exp(-30.0 * length(q - 0.25 * vec2(cos(t), sin(t * 1.3))));
      float rings = smoothstep(0.02, 0.0, abs(length(q) - 0.15)) + smoothstep(0.02, 0.0, abs(length(q) - 0.28)) + smoothstep(0.02, 0.0, abs(length(q) - 0.4));
      g = clamp(0.1 + (1.0 - smoothstep(0.0, 0.08, sweep)) * 0.5 + blip + rings * 0.4, 0.0, 1.0);
    `,
    "project-labyrinth": `
      vec2 uv = p * 8.0;
      vec2 id = floor(uv);
      vec2 f = fract(uv);
      float n = fract(sin(dot(id, vec2(12.1, 4.7))) * 43758.0);
      float wall = step(0.45, n) * (smoothstep(0.08, 0.0, min(f.x, f.y)));
      float cursor = exp(-20.0 * length(p - vec2(0.5 + 0.3 * sin(t * 0.4), 0.5 + 0.3 * cos(t * 0.5))));
      g = clamp(wall * 0.8 + cursor, 0.0, 1.0);
    `,
    "church-committee": `
      float desk = step(p.y, 0.35) * step(0.15, p.y);
      float seats = 0.0;
      for (int i = 0; i < 7; i++) {
        float x = 0.15 + float(i) * 0.1;
        seats += smoothstep(0.035, 0.02, length(p - vec2(x, 0.55 + 0.02 * sin(t + float(i)))));
      }
      float mic = smoothstep(0.02, 0.0, abs(p.x - 0.5)) * step(0.35, p.y) * step(p.y, 0.5);
      g = clamp(desk * 0.3 + seats * 0.85 + mic * 0.6, 0.0, 1.0);
    `,
    "wardenclyffe": `
      vec2 q = p - vec2(0.5, 0.15);
      float tower = smoothstep(0.04, 0.0, abs(q.x)) * step(q.y, 0.55) * step(0.0, q.y);
      float dome = smoothstep(0.1, 0.07, length(q - vec2(0.0, 0.55)));
      float arc = 0.0;
      for (int i = 0; i < 5; i++) {
        float a = t * 2.0 + float(i) * 1.2;
        vec2 e = vec2(0.35 * cos(a), 0.55 + 0.25 * sin(a * 1.3));
        arc += exp(-18.0 * abs(q.y - mix(0.55, e.y, p.x)) - 8.0 * abs(q.x - e.x * (q.y)));
      }
      g = clamp(tower * 0.7 + dome * 0.9 + arc * 0.5, 0.0, 1.0);
    `,
    "em-waves": `
      float g1 = 0.5 + 0.5 * sin(p.x * 25.0 - t * 4.0);
      float g2 = 0.5 + 0.5 * sin(p.y * 18.0 + t * 3.0);
      float g3 = 0.5 + 0.5 * sin((p.x + p.y) * 20.0 - t * 5.0);
      g = (g1 * 0.4 + g2 * 0.3 + g3 * 0.3);
    `,
    "light-lattice": `
      vec2 q = (p - 0.5) * 2.0;
      float z = 0.5 + 0.5 * sin(t);
      float grid = abs(sin(q.x * 6.0 + t)) * abs(sin(q.y * 6.0 - t));
      float sphere = smoothstep(0.05, 0.0, abs(length(q) - 0.6 - 0.1 * z));
      g = clamp(grid * 0.7 + sphere, 0.0, 1.0);
    `,
    "patent-grid": `
      float col = floor(p.x * 6.0);
      float row = floor(p.y * 4.0);
      float id = fract(sin(col * 12.0 + row * 4.0) * 99.0);
      float cell = step(0.02, fract(p.x * 6.0)) * step(0.02, fract(p.y * 4.0));
      float blink = step(0.5, fract(id + t * 0.1));
      g = mix(0.1, 0.75, cell * blink);
    `,
    "jekyll-night": `
      float water = 0.3 + 0.1 * sin(p.x * 20.0 + t * 2.0) * step(p.y, 0.35);
      float island = smoothstep(0.35, 0.25, length(p - vec2(0.5, 0.45)));
      float trees = 0.0;
      for (int i = 0; i < 5; i++) {
        float x = 0.35 + float(i) * 0.07;
        trees += smoothstep(0.02, 0.0, abs(p.x - x)) * step(p.y, 0.55) * step(0.4, p.y);
      }
      float moon = exp(-40.0 * length(p - vec2(0.8, 0.8)));
      float house = step(0.42, p.x) * step(p.x, 0.58) * step(0.4, p.y) * step(p.y, 0.52);
      g = clamp(water + island * 0.4 + trees * 0.6 + moon + house * 0.7, 0.0, 1.0);
    `,
    "reserve-columns": `
      float cols = 0.0;
      for (int i = 0; i < 6; i++) {
        float x = 0.18 + float(i) * 0.12;
        cols += smoothstep(0.025, 0.015, abs(p.x - x)) * step(p.y, 0.7) * step(0.25, p.y);
      }
      float ped = step(p.y, 0.28) * step(0.2, p.y);
      float roof = step(0.68, p.y) * step(p.y, 0.78) * step(0.15, p.x) * step(p.x, 0.85);
      float flag = 0.3 + 0.3 * sin(t * 3.0 + p.x * 10.0);
      g = clamp(cols * 0.8 + ped * 0.4 + roof * 0.6 + flag * step(0.78, p.y) * step(p.y, 0.85) * step(0.45, p.x) * step(p.x, 0.55), 0.0, 1.0);
    `,
    "ledger-flow": `
      float row = floor((p.y + t * 0.05) * 30.0);
      float n = fract(sin(row * 45.0) * 99.0);
      float digits = step(0.4, fract(p.x * 50.0 + n * 10.0 + t));
      float margin = step(p.x, 0.12);
      g = mix(0.1, 0.8, digits * (1.0 - margin)) + margin * 0.25;
    `,
    "american-system": `
      vec2 q = p - 0.5;
      float gear1 = smoothstep(0.04, 0.0, abs(length(q - vec2(-0.15, 0.0)) - 0.15)) + step(0.9, cos(atan(q.y, q.x + 0.15) * 8.0 - t));
      float gear2 = smoothstep(0.04, 0.0, abs(length(q - vec2(0.15, 0.05)) - 0.12)) + step(0.9, cos(atan(q.y - 0.05, q.x - 0.15) * 8.0 + t));
      float rail = smoothstep(0.02, 0.0, abs(q.y + 0.25)) * step(abs(q.x), 0.4);
      g = clamp(gear1 * 0.4 + gear2 * 0.4 + rail * 0.5, 0.0, 1.0);
    `,
    "two-streams": `
      float a = 0.5 + 0.5 * sin(p.y * 12.0 + t * 2.0);
      float left = smoothstep(0.1, 0.0, abs(p.x - 0.3 - 0.05 * a));
      float right = smoothstep(0.1, 0.0, abs(p.x - 0.7 + 0.05 * a));
      float merge = smoothstep(0.12, 0.0, abs(p.x - 0.5)) * smoothstep(0.3, 0.7, p.y);
      g = clamp(left * 0.55 + right * 0.55 + merge * 0.5, 0.0, 1.0);
    `,
    "layer-stack": `
      float layers = 0.0;
      for (int i = 0; i < 5; i++) {
        float y = 0.2 + float(i) * 0.12 + 0.01 * sin(t + float(i));
        layers += smoothstep(0.025, 0.0, abs(p.y - y)) * step(0.2, p.x) * step(p.x, 0.8);
      }
      float arrow = smoothstep(0.02, 0.0, abs(p.x - 0.5)) * step(0.15, p.y) * step(p.y, 0.85);
      g = clamp(layers * 0.8 + arrow * 0.25, 0.0, 1.0);
    `,
    "symbiosis-loop": `
      vec2 q = p - 0.5;
      float a = atan(q.y, q.x) + t * 0.5;
      float r = length(q);
      float loop = smoothstep(0.03, 0.0, abs(r - 0.25 - 0.05 * sin(a * 3.0)));
      float dots = exp(-40.0 * length(q - 0.25 * vec2(cos(t), sin(t)))) + exp(-40.0 * length(q - 0.25 * vec2(cos(t + 3.14), sin(t + 3.14))));
      g = clamp(loop * 0.8 + dots, 0.0, 1.0);
    `,
    "effigy-desert": `
      float ground = step(p.y, 0.3 + 0.02 * sin(p.x * 10.0));
      float body = smoothstep(0.06, 0.02, abs(p.x - 0.5)) * step(0.3, p.y) * step(p.y, 0.65);
      float arms = smoothstep(0.03, 0.0, abs(p.y - 0.55)) * step(0.35, p.x) * step(p.x, 0.65);
      float head = smoothstep(0.05, 0.02, length(p - vec2(0.5, 0.7)));
      float flame = exp(-20.0 * length(p - vec2(0.5, 0.75 + 0.05 * sin(t * 5.0)))) * (0.6 + 0.4 * sin(t * 8.0));
      float stars = step(0.997, fract(sin(dot(floor(p * 60.0), vec2(3.0, 7.0))) * 99.0));
      g = clamp(ground * 0.25 + body * 0.6 + arms * 0.5 + head * 0.7 + flame + stars, 0.0, 1.0);
    `,
    "santa-swarm": `
      float gsum = 0.0;
      for (int i = 0; i < 18; i++) {
        float fi = float(i);
        vec2 c = vec2(fract(fi * 0.17 + t * 0.03), fract(fi * 0.31 + 0.2 * sin(t + fi)));
        gsum += smoothstep(0.035, 0.01, length(p - c));
      }
      g = clamp(gsum, 0.0, 1.0);
    `,
    "zone-trip": `
      vec2 q = p - 0.5;
      float tunnel = atan(q.y, q.x) / 6.28318;
      float depth = 0.5 / (length(q) + 0.05);
      float rings = sin(depth * 8.0 - t * 3.0);
      g = clamp(0.5 + 0.5 * rings * smoothstep(0.6, 0.0, length(q)), 0.0, 1.0);
    `,
    "saturnalia-mask": `
      vec2 q = p - 0.5;
      float face = smoothstep(0.25, 0.2, length(q * vec2(1.0, 1.2)));
      float eyes = smoothstep(0.04, 0.01, length(q - vec2(-0.08, 0.05))) + smoothstep(0.04, 0.01, length(q - vec2(0.08, 0.05)));
      float grin = smoothstep(0.02, 0.0, abs(q.y + 0.08 - 0.05 * sin(q.x * 10.0 + t))) * step(abs(q.x), 0.12);
      g = clamp(face * 0.35 + eyes * 0.9 + grin * 0.7, 0.0, 1.0);
    `,
    "acid-kaleido": `
      vec2 q = p - 0.5;
      float a = atan(q.y, q.x);
      float r = length(q);
      float k = abs(sin(a * 6.0 + t)) * abs(sin(r * 12.0 - t * 2.0));
      g = clamp(k, 0.0, 1.0);
    `,
    "prankster-bus": `
      float road = step(p.y, 0.35) * step(0.25, p.y);
      float dash = step(0.5, fract(p.x * 8.0 - t * 2.0)) * step(abs(p.y - 0.3), 0.01);
      float bus = step(0.35, p.x) * step(p.x, 0.7) * step(0.35, p.y) * step(p.y, 0.55);
      float win = step(0.4, p.x) * step(p.x, 0.65) * step(0.45, p.y) * step(p.y, 0.52);
      float dust = step(0.98, fract(sin(dot(p, vec2(5.0, 9.0)) + t) * 99.0)) * step(p.y, 0.35);
      g = clamp(road * 0.3 + dash + bus * 0.7 - win * 0.3 + dust, 0.0, 1.0);
    `,
    "lab-beaker": `
      float glass = smoothstep(0.03, 0.0, abs(length((p - vec2(0.5, 0.4)) * vec2(1.5, 0.8)) - 0.2));
      float liquid = step(p.y, 0.45 + 0.03 * sin(t * 3.0 + p.x * 10.0)) * step(0.25, p.y) * step(abs(p.x - 0.5), 0.12);
      float bubble = 0.0;
      for (int i = 0; i < 6; i++) {
        float fi = float(i);
        vec2 c = vec2(0.5 + 0.05 * sin(fi + t), fract(0.3 + fi * 0.1 + t * 0.15));
        bubble += smoothstep(0.02, 0.0, length(p - c));
      }
      g = clamp(glass * 0.6 + liquid * 0.5 + bubble, 0.0, 1.0);
    `,
    "festival-scale": `
      float crowd = 0.0;
      for (int i = 0; i < 40; i++) {
        float fi = float(i);
        vec2 c = vec2(fract(fi * 0.13), 0.15 + 0.25 * fract(fi * 0.37));
        crowd += smoothstep(0.02, 0.0, length(p - c - vec2(0.01 * sin(t + fi), 0.0)));
      }
      float stage = step(0.55, p.y) * step(p.y, 0.75) * step(0.2, p.x) * step(p.x, 0.8);
      float lights = exp(-30.0 * length(p - vec2(0.5, 0.7))) * (0.5 + 0.5 * sin(t * 6.0));
      g = clamp(crowd * 0.5 + stage * 0.4 + lights, 0.0, 1.0);
    `,
    "break-grid": `
      float gx = floor(p.x * 16.0);
      float gy = floor(p.y * 8.0);
      float hit = step(0.7, fract(sin(gx * 12.0 + gy * 4.0 + floor(t * 4.0)) * 99.0));
      float grid = step(0.92, fract(p.x * 16.0)) + step(0.92, fract(p.y * 8.0));
      g = clamp(hit * 0.85 + grid * 0.25, 0.0, 1.0);
    `,
    "cyber-nodes": `
      float nodes = 0.0;
      float links = 0.0;
      for (int i = 0; i < 8; i++) {
        float fi = float(i);
        vec2 a = 0.5 + 0.35 * vec2(cos(fi + t * 0.2), sin(fi * 1.3 + t * 0.15));
        nodes += smoothstep(0.03, 0.0, length(p - a));
        vec2 b = 0.5 + 0.35 * vec2(cos(fi + 1.0 + t * 0.2), sin((fi + 1.0) * 1.3 + t * 0.15));
        vec2 pa = p - a;
        vec2 ba = b - a;
        float h = clamp(dot(pa, ba) / dot(ba, ba), 0.0, 1.0);
        links += smoothstep(0.01, 0.0, length(pa - ba * h));
      }
      g = clamp(nodes * 0.9 + links * 0.5, 0.0, 1.0);
    `,
    "accel-streaks": `
      float s = 0.0;
      for (int i = 0; i < 20; i++) {
        float fi = float(i);
        float y = fract(fi * 0.05 + 0.1);
        float x = fract(p.x + t * (0.5 + fi * 0.03) + fi);
        s += smoothstep(0.01, 0.0, abs(p.y - y)) * smoothstep(0.3, 0.0, x);
      }
      g = clamp(s, 0.0, 1.0);
    `,
    "hyperstition": `
      vec2 q = p - 0.5;
      float feedback = sin(10.0 * q.x + t) * sin(10.0 * q.y - t);
      float seed = step(0.9, fract(sin(dot(floor(p * 20.0 + t), vec2(3.0, 7.0))) * 99.0));
      float grow = exp(-5.0 * length(q)) * (0.5 + 0.5 * feedback);
      g = clamp(grow + seed * 0.6, 0.0, 1.0);
    `,
    "mindwar-field": `
      float f = 0.0;
      for (int i = 1; i <= 4; i++) {
        float fi = float(i);
        f += sin(p.x * 8.0 * fi + t * fi) * sin(p.y * 6.0 * fi - t) / fi;
      }
      float broadcast = exp(-8.0 * abs(p.y - 0.5 - 0.1 * f));
      g = clamp(0.4 + 0.4 * f + broadcast * 0.4, 0.0, 1.0);
    `,
    "set-geometry": `
      vec2 q = p - 0.5;
      float tri = abs(q.x) * 1.7 + q.y;
      float inv = abs(q.x) * 1.7 - q.y;
      float shape = smoothstep(0.02, 0.0, abs(tri - 0.35)) + smoothstep(0.02, 0.0, abs(inv - 0.35));
      float spin = sin(atan(q.y, q.x) * 5.0 + t * 2.0);
      g = clamp(shape * 0.8 + 0.15 * spin * exp(-3.0 * length(q)), 0.0, 1.0);
    `,
    "dossier-stamp": `
      float page = step(0.15, p.x) * step(p.x, 0.85) * step(0.1, p.y) * step(p.y, 0.9);
      float lines = step(0.5, fract(p.y * 25.0)) * page * 0.3;
      float stamp = smoothstep(0.12, 0.08, length(p - vec2(0.65, 0.35)));
      float rot = sin(atan(p.y - 0.35, p.x - 0.65) * 2.0 + t);
      g = clamp(page * 0.25 + lines + stamp * (0.5 + 0.3 * rot), 0.0, 1.0);
    `,
    "presidio-fog": `
      float fog = 0.0;
      for (int i = 1; i <= 4; i++) {
        float fi = float(i);
        fog += sin(p.x * 3.0 * fi + t * 0.5 + fi) * sin(p.y * 2.0 * fi - t * 0.3) / fi;
      }
      float gate = smoothstep(0.03, 0.0, abs(p.x - 0.5)) * step(0.3, p.y) * step(p.y, 0.7);
      float fort = step(p.y, 0.4) * step(0.2, p.x) * step(p.x, 0.8) * 0.3;
      g = clamp(0.35 + 0.2 * fog + gate * 0.4 + fort, 0.0, 1.0);
    `,
    "myth-filter": `
      float photo = 0.4 + 0.2 * sin(p.x * 30.0) * sin(p.y * 30.0 + t);
      float x1 = smoothstep(0.03, 0.0, abs(p.x - p.y));
      float x2 = smoothstep(0.03, 0.0, abs(p.x + p.y - 1.0));
      float border = step(p.x, 0.08) + step(0.92, p.x) + step(p.y, 0.08) + step(0.92, p.y);
      g = clamp(photo * (1.0 - 0.7 * max(x1, x2)) + max(x1, x2) + border * 0.3, 0.0, 1.0);
    `,
    "crowd-density": `
      float d = 0.0;
      for (int i = 0; i < 50; i++) {
        float fi = float(i);
        vec2 c = vec2(fract(sin(fi * 12.0) * 99.0), fract(sin(fi * 4.0) * 50.0) * 0.5);
        d += smoothstep(0.025, 0.0, length(p - c - vec2(0.01 * sin(t + fi), 0.0)));
      }
      g = clamp(d * 0.6, 0.0, 1.0);
    `,
    "cryo-claim": `
      float chamber = smoothstep(0.05, 0.0, abs(length((p - vec2(0.5, 0.5)) * vec2(1.2, 1.6)) - 0.35));
      float frost = step(0.92, fract(sin(dot(floor(p * 40.0), vec2(2.0, 9.0)) + t * 0.2) * 99.0));
      float claim = step(0.4, p.x) * step(p.x, 0.6) * step(0.45, p.y) * step(p.y, 0.55) * (0.5 + 0.5 * step(0.5, fract(t * 0.5)));
      g = clamp(chamber * 0.5 + frost * 0.3 + claim * 0.4, 0.0, 1.0);
    `,
    "observe-map": `
      vec2 q = p;
      q += 0.04 * vec2(sin(t + p.y * 8.0), cos(t * 0.7 + p.x * 6.0));
      float coast = 0.0;
      for (int i = 1; i <= 5; i++) {
        float fi = float(i);
        coast += sin(q.x * (3.0 + fi) + t * 0.3 + q.y * fi) * sin(q.y * (2.0 + fi) - t * 0.2) / fi;
      }
      float land = step(0.0, coast + 0.15 * sin(q.x * 2.0 + t * 0.1));
      float grid = step(0.92, fract(q.x * 20.0 + coast)) + step(0.92, fract(q.y * 14.0));
      float star = step(0.997, fract(sin(dot(floor(p * 50.0), vec2(3.0, 7.0)) + t * 0.1) * 99.0));
      g = clamp(mix(0.08, 0.75, land) * 0.85 + grid * 0.25 + star, 0.0, 1.0);
`,
    "source-stack": `
      float layers = 0.0;
      for (int i = 0; i < 6; i++) {
        float fi = float(i);
        float y = 0.18 + fi * 0.11 + 0.02 * sin(t * 0.8 + fi + p.x * 4.0);
        float wob = 0.03 * sin(t + p.x * 10.0 + fi);
        layers += smoothstep(0.03, 0.0, abs(p.y - y)) * step(0.2 + wob, p.x) * step(p.x, 0.8 - wob);
      }
      float melt = 0.15 * sin(p.x * 12.0 + t) * (1.0 - p.y);
      g = clamp(layers * 0.85 + melt * 0.3 + 0.08, 0.0, 1.0);
`,
    "four-clocks": `
      float clocks = 0.0;
      for (int i = 0; i < 4; i++) {
        float fi = float(i);
        vec2 c = vec2(0.2 + fi * 0.2, 0.5 + 0.05 * sin(t + fi));
        float r = length(p - c);
        clocks += smoothstep(0.02, 0.0, abs(r - 0.1));
        float ang = atan(p.y - c.y, p.x - c.x);
        float hand = smoothstep(0.015, 0.0, abs(sin(ang - t * (0.5 + fi * 0.3) - fi) * r)) * step(r, 0.1);
        clocks += hand * 0.7;
      }
      g = clamp(clocks, 0.0, 1.0);
`,
    "sky-rupture": `
      vec2 q = p - vec2(0.5, 0.35);
      float burst = 0.0;
      for (int i = 0; i < 24; i++) {
        float fi = float(i);
        float a = fi * 0.26 + t * 0.4;
        vec2 d = vec2(cos(a), sin(a * 1.1));
        float streak = exp(-18.0 * abs(dot(q, vec2(-d.y, d.x)))) * exp(-2.0 * max(0.0, -dot(q, d)));
        burst += streak * (0.5 + 0.5 * sin(t * 3.0 + fi));
      }
      float horizon = smoothstep(0.04, 0.0, abs(p.y - 0.28 - 0.02 * sin(p.x * 10.0 + t)));
      float dust = step(0.985, fract(sin(dot(p * 40.0, vec2(2.0, 9.0)) + t) * 99.0));
      g = clamp(burst * 0.7 + horizon * 0.5 + dust + 0.05 * (1.0 - p.y), 0.0, 1.0);
`,
    "black-mat": `
      float y0 = 0.42 + 0.03 * sin(p.x * 8.0 + t * 0.5);
      float mat = smoothstep(0.06, 0.0, abs(p.y - y0));
      float strata = 0.0;
      for (int i = 0; i < 8; i++) {
        float y = 0.15 + float(i) * 0.08 + 0.01 * sin(t + float(i));
        strata += 0.2 * smoothstep(0.01, 0.0, abs(p.y - y));
      }
      float ash = step(0.96, fract(sin(dot(floor(p * 30.0), vec2(4.0, 1.0)) + t * 0.2) * 50.0));
      g = clamp(0.15 + strata + mat * 0.9 + ash * 0.3, 0.0, 1.0);
`,
    "proxy-debate": `
      float left = 0.5 + 0.35 * sin(p.x * 20.0 - t * 2.0) * step(p.x, 0.48);
      float right = 0.5 + 0.35 * sin(p.x * 18.0 + t * 2.2) * step(0.52, p.x);
      float seam = smoothstep(0.03, 0.0, abs(p.x - 0.5));
      float noise = 0.1 * sin(p.y * 40.0 + t);
      g = clamp((left + right) * 0.7 + seam * 0.5 + noise, 0.0, 1.0);
`,
    "t-pillars": `
      float pillars = 0.0;
      for (int i = 0; i < 5; i++) {
        float fi = float(i);
        float x = 0.18 + fi * 0.15 + 0.01 * sin(t * 0.5 + fi);
        float stem = smoothstep(0.035, 0.015, abs(p.x - x)) * step(0.25, p.y) * step(p.y, 0.62);
        float top = step(abs(p.x - x), 0.07) * step(0.58, p.y) * step(p.y, 0.68);
        pillars += stem * 0.75 + top * 0.9;
      }
      float ground = step(p.y, 0.28 + 0.02 * sin(p.x * 12.0)) * 0.35;
      float fog = 0.15 * sin(p.y * 3.0 - t * 0.3);
      g = clamp(pillars + ground + fog, 0.0, 1.0);
`,
    "carved-fauna": `
      vec2 q = p - 0.5;
      q += 0.03 * vec2(sin(t + q.y * 5.0), cos(t * 0.8 + q.x * 4.0));
      float body = smoothstep(0.18, 0.1, length(q * vec2(1.3, 0.9)));
      float leg = 0.0;
      for (int i = 0; i < 4; i++) {
        float x = -0.08 + float(i) * 0.05;
        leg += smoothstep(0.015, 0.0, abs(q.x - x)) * step(q.y, -0.05) * step(-0.22, q.y);
      }
      float horn = smoothstep(0.02, 0.0, abs(q.y - 0.12 - abs(q.x) * 0.5)) * step(abs(q.x), 0.12);
      float chip = step(0.97, fract(sin(dot(floor(p * 25.0), vec2(2.0, 5.0))) * 40.0));
      g = clamp(body * 0.55 + leg * 0.6 + horn * 0.7 + chip * 0.25, 0.0, 1.0);
`,
    "dig-grid": `
      float gx = step(0.9, fract(p.x * 12.0 + 0.05 * sin(t)));
      float gy = step(0.9, fract(p.y * 9.0));
      float pit = smoothstep(0.2, 0.05, length((p - vec2(0.5, 0.45)) * vec2(1.2, 0.8)));
      float tool = exp(-40.0 * length(p - vec2(0.5 + 0.1 * sin(t), 0.45 + 0.05 * cos(t * 1.3))));
      g = clamp(gx * 0.4 + gy * 0.4 + pit * 0.5 + tool, 0.0, 1.0);
`,
    "flood-wave": `
      float w = 0.0;
      for (int i = 1; i <= 6; i++) {
        float fi = float(i);
        w += sin(p.x * (3.0 + fi) - t * fi * 0.8 + p.y * 2.0) / fi;
      }
      float wave = smoothstep(0.2, 0.0, abs(p.y - 0.4 - 0.12 * w));
      float rain = step(0.98, fract(p.x * 40.0 + p.y * 10.0 - t * 2.0));
      float ark = smoothstep(0.06, 0.02, length((p - vec2(0.5, 0.55 + 0.05 * w)) * vec2(1.8, 1.0)));
      g = clamp(0.1 + wave * 0.8 + rain * 0.4 + ark * 0.5, 0.0, 1.0);
`,
    "tablet-wave": `
      float tablet = step(0.25, p.x) * step(p.x, 0.75) * step(0.2, p.y) * step(p.y, 0.75);
      float wedges = step(0.5, fract(p.x * 30.0 + floor(p.y * 20.0) * 0.3)) * tablet * 0.5;
      float wet = 0.3 * smoothstep(0.0, 0.4, 0.55 + 0.1 * sin(t) - p.y);
      float ripple = 0.2 * sin(p.x * 25.0 + t * 3.0) * wet;
      g = clamp(tablet * 0.35 + wedges + wet * 0.4 + ripple, 0.0, 1.0);
`,
    "atlantis-ring": `
      vec2 q = p - 0.5;
      float r = length(q);
      float rings = 0.0;
      for (int i = 1; i <= 4; i++) {
        float target = 0.08 * float(i) + 0.02 * sin(t + float(i));
        rings += smoothstep(0.015, 0.0, abs(r - target));
      }
      float canal = smoothstep(0.02, 0.0, abs(q.x)) * step(r, 0.35) + smoothstep(0.02, 0.0, abs(q.y)) * step(r, 0.35);
      float sink = exp(-8.0 * abs(r - 0.2 - 0.05 * sin(t * 2.0)));
      g = clamp(rings * 0.85 + canal * 0.35 + sink * 0.3, 0.0, 1.0);
`,
    "shelf-drown": `
      float shore = 0.45 + 0.05 * sin(p.x * 6.0) + 0.08 * sin(t * 0.3);
      float water = step(p.y, shore + 0.1 * sin(p.x * 15.0 - t));
      float shelf = step(p.y, shore - 0.15) * 0.4;
      float ruin = 0.0;
      for (int i = 0; i < 5; i++) {
        float x = 0.2 + float(i) * 0.12;
        ruin += smoothstep(0.02, 0.0, abs(p.x - x)) * step(p.y, shore - 0.05) * step(shore - 0.2, p.y) * water;
      }
      g = clamp(water * 0.35 + shelf + ruin * 0.8, 0.0, 1.0);
`,
    "ghost-map": `
      vec2 q = p;
      q += 0.05 * vec2(sin(3.0 * p.y + t * 0.4), cos(2.5 * p.x - t * 0.3));
      float n = 0.0;
      for (int i = 1; i <= 4; i++) {
        float fi = float(i);
        n += sin(q.x * 4.0 * fi + t * 0.2) * cos(q.y * 3.0 * fi) / fi;
      }
      float land = step(0.1, n);
      float stain = exp(-15.0 * length(p - vec2(0.3 + 0.1 * sin(t * 0.2), 0.6)));
      float edge = smoothstep(0.08, 0.0, min(min(p.x, 1.0 - p.x), min(p.y, 1.0 - p.y)));
      g = clamp(mix(0.2, 0.7, land) + stain * 0.4 + edge * 0.5, 0.0, 1.0);
`,
    "compass-rose": `
      vec2 q = p - 0.5;
      float a = atan(q.y, q.x);
      float r = length(q);
      float rose = pow(abs(cos(a * 4.0 + t * 0.2)), 4.0) * smoothstep(0.35, 0.05, r);
      float ring = smoothstep(0.02, 0.0, abs(r - 0.28));
      float spin = smoothstep(0.015, 0.0, abs(sin(a - t) * r)) * step(r, 0.28);
      g = clamp(rose * 0.9 + ring * 0.7 + spin * 0.5, 0.0, 1.0);
`,
    "sunken-colonnade": `
      float cols = 0.0;
      for (int i = 0; i < 6; i++) {
        float x = 0.2 + float(i) * 0.12 + 0.01 * sin(t + float(i));
        cols += smoothstep(0.03, 0.012, abs(p.x - x)) * step(0.25, p.y) * step(p.y, 0.65);
      }
      float lintel = step(0.6, p.y) * step(p.y, 0.68) * step(0.18, p.x) * step(p.x, 0.82);
      float particles = step(0.99, fract(sin(dot(p * 50.0, vec2(1.0, 3.0)) + t) * 90.0));
      float caustic = 0.2 * sin(p.x * 20.0 + t * 2.0) * sin(p.y * 15.0 - t);
      g = clamp(cols * 0.75 + lintel * 0.6 + particles + caustic * 0.4 + 0.1, 0.0, 1.0);
`,
    "watcher-field": `
      float figures = 0.0;
      for (int i = 0; i < 12; i++) {
        float fi = float(i);
        float x = 0.1 + fract(fi * 0.17) * 0.8;
        float h = 0.25 + 0.35 * fract(fi * 0.37);
        float w = 0.02 + 0.02 * fract(fi * 0.11);
        float blur = 0.01 + 0.02 * (0.5 + 0.5 * sin(t * 0.5 + fi));
        figures += smoothstep(w + blur, w, abs(p.x - x)) * step(0.2, p.y) * step(p.y, 0.25 + h);
      }
      float rain = step(0.97, fract(p.x * 60.0 + p.y * 20.0 - t * 3.0));
      float small = smoothstep(0.015, 0.0, length(p - vec2(0.5, 0.28)));
      g = clamp(figures * 0.55 + rain * 0.35 + small * 0.9, 0.0, 1.0);
`,
    "enoch-descent": `
      float rays = 0.0;
      for (int i = 0; i < 10; i++) {
        float a = -1.2 + float(i) * 0.25;
        vec2 d = normalize(vec2(sin(a), -cos(a)));
        vec2 o = p - vec2(0.5, 0.95);
        float along = dot(o, d);
        float perp = length(o - d * along);
        rays += exp(-25.0 * perp) * step(0.0, along) * exp(-along);
      }
      float ground = step(p.y, 0.25) * 0.3;
      float figure = smoothstep(0.04, 0.01, length((p - vec2(0.5, 0.35 + 0.1 * fract(t * 0.15))) * vec2(1.5, 2.0)));
      g = clamp(rays * 0.8 + ground + figure, 0.0, 1.0);
`,
    "mud-strata": `
      float mud = 0.0;
      for (int i = 0; i < 7; i++) {
        float fi = float(i);
        float y = 0.15 + fi * 0.1 + 0.03 * sin(p.x * 5.0 + t * 0.4 + fi);
        mud += smoothstep(0.04, 0.0, abs(p.y - y)) * (0.4 + 0.1 * sin(p.x * 8.0 + fi));
      }
      float column = smoothstep(0.05, 0.02, abs(p.x - 0.65)) * step(0.3, p.y) * step(p.y, 0.7);
      float ornate = 0.3 * step(0.95, fract(p.y * 20.0 + p.x * 5.0)) * column;
      g = clamp(mud * 0.7 + column * 0.6 + ornate, 0.0, 1.0);
`,
    "clock-seams": `
      float a = 0.5 + 0.5 * sin(p.x * 10.0 + t);
      float b = 0.5 + 0.5 * sin(p.y * 8.0 - t * 1.1);
      float c = 0.5 + 0.5 * sin((p.x + p.y) * 9.0 + t * 0.7);
      float seams = smoothstep(0.04, 0.0, abs(a - b)) + smoothstep(0.04, 0.0, abs(b - c));
      float glow = seams * (0.5 + 0.5 * sin(t * 4.0));
      g = clamp(0.2 + a * 0.2 + b * 0.15 + glow, 0.0, 1.0);
`,
    "observe-lamp": `
      vec2 q = p - vec2(0.5, 0.4);
      float lamp = smoothstep(0.08, 0.03, length(q * vec2(1.0, 1.4)));
      float glow = exp(-6.0 * length(q)) * (0.6 + 0.4 * sin(t * 2.0));
      float shelves = 0.0;
      for (int i = 0; i < 6; i++) {
        float y = 0.15 + float(i) * 0.12;
        shelves += smoothstep(0.01, 0.0, abs(p.y - y)) * step(0.15, p.x) * step(p.x, 0.85) * 0.25;
      }
      float books = step(0.7, fract(p.x * 25.0)) * step(0.2, p.y) * step(p.y, 0.8) * 0.15;
      g = clamp(shelves + books + lamp * 0.9 + glow, 0.0, 1.0);
`,
    "checklist": `
      float items = 0.0;
      for (int i = 0; i < 5; i++) {
        float y = 0.25 + float(i) * 0.1;
        float box = smoothstep(0.02, 0.0, abs(length(p - vec2(0.25, y)) - 0.03));
        float check = step(float(i), mod(floor(t), 6.0)) * smoothstep(0.015, 0.0, abs(p.y - y - (p.x - 0.25))) * step(0.22, p.x) * step(p.x, 0.32);
        float line = smoothstep(0.01, 0.0, abs(p.y - y)) * step(0.35, p.x) * step(p.x, 0.8);
        items += box + check + line * 0.4;
      }
      g = clamp(items, 0.0, 1.0);
    `,
  };

  return `
    precision mediump float;
    uniform float uTime;
    uniform vec2 uRes;
    varying vec2 vUv;
    ${BAYER_GLSL}
    void main() {
      vec2 p = vUv;
      float t = uTime;
      float g = 0.0;
      ${body[kind]}
      float threshold = bayer(gl_FragCoord.xy);
      float bw = step(threshold, clamp(g, 0.0, 1.0));
      gl_FragColor = vec4(vec3(bw), 1.0);
    }
  `;
}

const VERT = `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = vec4(position.xy, 0.0, 1.0);
  }
`;

export function DitherIllust({
  kind,
  caption,
}: {
  kind: IllustKind;
  caption?: string;
}) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const kindRef = useRef(kind);
  kindRef.current = kind;

  useEffect(() => {
    const canvas = canvasRef.current;
    const wrap = wrapRef.current;
    if (!canvas || !wrap) return;

    let disposed = false;
    let raf = 0;
    let visible = true;

    const renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: false,
      alpha: false,
      powerPreference: "low-power",
    });
    renderer.setSize(ILLUST_W, ILLUST_H, false);
    renderer.setPixelRatio(1);
    renderer.setClearColor(0x000000, 1);

    const scene = new THREE.Scene();
    const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);

    const uniforms = {
      uTime: { value: 0 },
      uRes: { value: new THREE.Vector2(ILLUST_W, ILLUST_H) },
    };

    const mat = new THREE.ShaderMaterial({
      vertexShader: VERT,
      fragmentShader: sceneShader(kind),
      uniforms,
      depthTest: false,
      depthWrite: false,
    });

    const quad = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), mat);
    scene.add(quad);

    // Subtle 3D accent layer: sparse points, rendered into same buffer via additive-ish second pass
    // (kept as pure shader for mono dither consistency — point cloud as extra uniforms-driven noise in shader is enough)

    const t0 = performance.now();
    const tick = () => {
      if (disposed) return;
      raf = requestAnimationFrame(tick);
      if (!visible) return;
      uniforms.uTime.value = (performance.now() - t0) / 1000;
      renderer.render(scene, camera);
    };
    raf = requestAnimationFrame(tick);

    const io = new IntersectionObserver(
      ([e]) => {
        visible = e.isIntersecting;
      },
      { threshold: 0.05 },
    );
    io.observe(wrap);

    return () => {
      disposed = true;
      cancelAnimationFrame(raf);
      io.disconnect();
      mat.dispose();
      quad.geometry.dispose();
      renderer.dispose();
    };
  }, [kind]);

  return (
    <figure
      ref={wrapRef}
      style={{
        margin: "18px 0 22px",
        padding: 0,
        border: "2px solid #fff",
        background: "#000",
        maxWidth: ILLUST_W,
        width: "100%",
        imageRendering: "pixelated",
      }}
    >
      <canvas
        ref={canvasRef}
        width={ILLUST_W}
        height={ILLUST_H}
        style={{
          display: "block",
          width: "100%",
          height: "auto",
          aspectRatio: `${ILLUST_W} / ${ILLUST_H}`,
          imageRendering: "pixelated",
          background: "#000",
        }}
      />
      {caption && (
        <figcaption
          style={{
            borderTop: "1px solid #333",
            padding: "6px 10px",
            fontSize: 10,
            letterSpacing: 1,
            color: "#888",
            lineHeight: 1.4,
          }}
        >
          ░ {caption}
        </figcaption>
      )}
    </figure>
  );
}

export function isIllustKind(s: string): s is IllustKind {
  return true; // validated by sceneShader keys at runtime — tighten below
}

const KIND_SET = new Set<string>([
  "open-book","judgment-scales","archive-scroll","prove-all","narrow-path","living-water","simple-table",
  "hemi-spheres","focus-rings","body-starfield","gateway-tone","file-shred","radar-stargate","project-labyrinth",
  "church-committee","wardenclyffe","em-waves","light-lattice","patent-grid","jekyll-night","reserve-columns",
  "ledger-flow","american-system","two-streams","layer-stack","symbiosis-loop","effigy-desert","santa-swarm",
  "zone-trip","saturnalia-mask","acid-kaleido","prankster-bus","lab-beaker","festival-scale","break-grid",
  "cyber-nodes","accel-streaks","hyperstition","mindwar-field","set-geometry","dossier-stamp","presidio-fog",
  "myth-filter","crowd-density","cryo-claim","checklist","observe-map","source-stack","four-clocks","sky-rupture","black-mat","proxy-debate","t-pillars","carved-fauna","dig-grid","flood-wave","tablet-wave","atlantis-ring","shelf-drown","ghost-map","compass-rose","sunken-colonnade","watcher-field","enoch-descent","mud-strata","clock-seams","observe-lamp",
]);

export function parseIllustKind(s: string): IllustKind | null {
  return KIND_SET.has(s) ? (s as IllustKind) : null;
}

export default DitherIllust;
