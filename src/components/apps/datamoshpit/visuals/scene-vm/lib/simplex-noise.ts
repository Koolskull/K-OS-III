/*
 *                    ☦
 *           SCENE VM — 2D SIMPLEX NOISE
 *
 *  Direct port from BeetleGame lib/cutscene/simplex-noise.ts.
 *  Zero external dependencies. Deterministic for a given (x, y).
 *  Used by the Scene VM runtime for ambient wobble and keyframed shake.
 *
 *  Based on Stefan Gustavson's simplex noise implementation.
 */

const F2 = 0.5 * (Math.sqrt(3) - 1);
const G2 = (3 - Math.sqrt(3)) / 6;

const GRAD = [
  [1, 1], [-1, 1], [1, -1], [-1, -1],
  [1, 0], [-1, 0], [0, 1], [0, -1],
];

const PERM = new Uint8Array(512);
const P0 = [
  151,160,137,91,90,15,131,13,201,95,96,53,194,233,7,225,140,36,103,30,69,142,
  8,99,37,240,21,10,23,190,6,148,247,120,234,75,0,26,197,62,94,252,219,203,117,
  35,11,32,57,177,33,88,237,149,56,87,174,20,125,136,171,168,68,175,74,165,71,
  134,139,48,27,166,77,146,158,231,83,111,229,122,60,211,133,230,220,105,92,41,
  55,46,245,40,244,102,143,54,65,25,63,161,1,216,80,73,209,76,132,187,208,89,
  18,169,200,196,135,130,116,188,159,86,164,100,109,198,173,186,3,64,52,217,226,
  250,124,123,5,202,38,147,118,126,255,82,85,212,207,206,59,227,47,16,58,17,182,
  189,28,42,223,183,170,213,119,248,152,2,44,154,163,70,221,153,101,155,167,43,
  172,9,129,22,39,253,19,98,108,110,79,113,224,232,178,185,112,104,218,246,97,
  228,251,34,242,193,238,210,144,12,191,179,162,241,81,51,145,235,249,14,239,
  107,49,192,214,31,181,199,106,157,184,84,204,176,115,121,50,45,127,4,150,254,
  138,236,205,93,222,114,67,29,24,72,243,141,128,195,78,66,215,61,156,180,
];
for (let i = 0; i < 256; i++) { PERM[i] = P0[i]; PERM[i + 256] = P0[i]; }

function dot2(g: number[], x: number, y: number): number {
  return g[0] * x + g[1] * y;
}

/** 2D simplex noise. Returns [-1, 1]. */
export function simplex2(x: number, y: number): number {
  const s = (x + y) * F2;
  const i = Math.floor(x + s);
  const j = Math.floor(y + s);
  const t = (i + j) * G2;
  const X0 = i - t;
  const Y0 = j - t;
  const x0 = x - X0;
  const y0 = y - Y0;

  const i1 = x0 > y0 ? 1 : 0;
  const j1 = x0 > y0 ? 0 : 1;

  const x1 = x0 - i1 + G2;
  const y1 = y0 - j1 + G2;
  const x2 = x0 - 1 + 2 * G2;
  const y2 = y0 - 1 + 2 * G2;

  const ii = i & 255;
  const jj = j & 255;
  const gi0 = PERM[ii + PERM[jj]] % 8;
  const gi1 = PERM[ii + i1 + PERM[jj + j1]] % 8;
  const gi2 = PERM[ii + 1 + PERM[jj + 1]] % 8;

  let n0 = 0;
  let t0 = 0.5 - x0 * x0 - y0 * y0;
  if (t0 >= 0) { t0 *= t0; n0 = t0 * t0 * dot2(GRAD[gi0], x0, y0); }

  let n1 = 0;
  let t1 = 0.5 - x1 * x1 - y1 * y1;
  if (t1 >= 0) { t1 *= t1; n1 = t1 * t1 * dot2(GRAD[gi1], x1, y1); }

  let n2 = 0;
  let t2 = 0.5 - x2 * x2 - y2 * y2;
  if (t2 >= 0) { t2 *= t2; n2 = t2 * t2 * dot2(GRAD[gi2], x2, y2); }

  return 70 * (n0 + n1 + n2);
}

/** Sample noise at a specific time + seed. Returns [-amplitude, +amplitude]. */
export function noiseAt(time: number, frequency: number, amplitude: number, seed = 0): number {
  return simplex2(time * frequency + seed, seed * 7.31) * amplitude;
}

/** Lerp noise-keyframe parameters between adjacent noise keyframes at a frame. */
export function interpolateNoiseKeyframes(
  frame: number,
  keyframes: { frame: number; positionAmplitude: number; rotationAmplitude: number; scaleAmplitude: number; frequency: number }[],
): { posAmp: number; rotAmp: number; sclAmp: number; freq: number } | null {
  if (keyframes.length === 0) return null;
  if (keyframes.length === 1) {
    const k = keyframes[0];
    return { posAmp: k.positionAmplitude, rotAmp: k.rotationAmplitude, sclAmp: k.scaleAmplitude, freq: k.frequency };
  }

  const sorted = [...keyframes].sort((a, b) => a.frame - b.frame);

  if (frame <= sorted[0].frame) {
    const k = sorted[0];
    return { posAmp: k.positionAmplitude, rotAmp: k.rotationAmplitude, sclAmp: k.scaleAmplitude, freq: k.frequency };
  }

  if (frame >= sorted[sorted.length - 1].frame) {
    const k = sorted[sorted.length - 1];
    return { posAmp: k.positionAmplitude, rotAmp: k.rotationAmplitude, sclAmp: k.scaleAmplitude, freq: k.frequency };
  }

  for (let i = 0; i < sorted.length - 1; i++) {
    const a = sorted[i];
    const b = sorted[i + 1];
    if (frame >= a.frame && frame <= b.frame) {
      const t = (frame - a.frame) / (b.frame - a.frame);
      return {
        posAmp: a.positionAmplitude + t * (b.positionAmplitude - a.positionAmplitude),
        rotAmp: a.rotationAmplitude + t * (b.rotationAmplitude - a.rotationAmplitude),
        sclAmp: a.scaleAmplitude + t * (b.scaleAmplitude - a.scaleAmplitude),
        freq: a.frequency + t * (b.frequency - a.frequency),
      };
    }
  }

  return null;
}
