/*
 *                    ☦
 *            ╔══════════════════╗
 *            ║  ST. HILDEGARD  ║
 *            ║  OF BINGEN      ║
 *            ║  Mystic of the  ║
 *            ║  Living Light   ║
 *            ╚══════════════════╝
 *
 *   GRANULAR ENGINE
 *   Loop-window granular with two-point movement curves.
 *   Inspired by LGPT's LPOF but with acceleration envelopes
 *   and crossfade softening.
 *
 *   Movement model:
 *     MVA and MVB define the speed at the start and end of each
 *     loop cycle. The engine interpolates between them per tick,
 *     creating curves:
 *       MVA=MVB  → constant speed (classic LGPT)
 *       MVA>MVB  → deceleration (tape pause)
 *       MVA<MVB  → acceleration (tape start)
 *       signs differ → direction reversal (scratch)
 *
 *   The loop window slides through the sample buffer at the
 *   interpolated speed. Grains are scheduled with optional
 *   crossfade softening and harmonic detune.
 */

import * as Tone from "tone";

export interface GranularParams {
  loopStart: number;    // 0x00-0xFF normalized position in buffer
  loopEnd: number;      // 0x00-0xFF normalized position in buffer
  moveA: number;        // 0x00-0xFF signed speed (0x80 = 0)
  moveB: number;        // 0x00-0xFF signed speed (0x80 = 0)
  grainSize: number;    // 0x00-0xFF (0 = off, maps to 5ms-500ms)
  softening: number;    // 0x00-0xFF crossfade amount
  harmonic: number;     // 0x00-0xFF detune (0x80 = none)
}

/** Convert 0x00-0xFF to signed float: 0x80=0, 0xFF=+1, 0x00=-1 */
function signedByte(val: number): number {
  return (val - 0x80) / 128;
}

/** Convert grain size byte to seconds. 0=off, 1-FF = 5ms to 500ms */
function grainSizeSeconds(val: number): number {
  if (val === 0) return 0;
  return 0.005 + (val / 255) * 0.495;
}

/** Convert softening byte to seconds of crossfade */
function softeningSeconds(val: number, grainSec: number): number {
  // 0x00 = no crossfade, 0xFF = 50% of grain size
  const ratio = val / 255;
  return ratio * grainSec * 0.5;
}

/** Convert harmonic byte to detune cents. 0x80=0, range +-2 octaves */
function harmonicCents(val: number): number {
  return (val - 0x80) * (2400 / 128); // +-2400 cents (2 octaves)
}

export class GranularEngine {
  private output: Tone.Channel;
  private buffer: Tone.ToneAudioBuffer | null = null;
  private params: GranularParams = {
    loopStart: 0, loopEnd: 0xFF,
    moveA: 0x80, moveB: 0x80,
    grainSize: 0, softening: 0, harmonic: 0x80,
  };

  // Playback state
  private active = false;
  private windowPos = 0;     // current window position in buffer (0-1 normalized)
  private tickInCycle = 0;   // current tick within one loop cycle
  private cycleLength = 16;  // ticks per full loop cycle (one phrase row default)
  private schedulerId: ReturnType<typeof setInterval> | null = null;
  private activeSources: Tone.ToneBufferSource[] = [];
  private basePitch = 1;     // playback rate from note pitch

  constructor(output: Tone.Channel) {
    this.output = output;
  }

  setBuffer(buf: Tone.ToneAudioBuffer): void {
    this.buffer = buf;
  }

  setParams(params: Partial<GranularParams>): void {
    Object.assign(this.params, params);
  }

  isActive(): boolean {
    return this.active && this.params.grainSize > 0;
  }

  /**
   * Start granular playback.
   * Called when a note triggers on a sample instrument with grainSize > 0.
   */
  start(note: number, baseNote: number, time?: number): void {
    if (!this.buffer) return;
    this.stop();

    this.basePitch = Math.pow(2, (note - baseNote) / 12);

    // Initialize window position to loopStart
    this.windowPos = this.params.loopStart / 255;
    this.tickInCycle = 0;
    this.active = true;

    const grainSec = grainSizeSeconds(this.params.grainSize);
    if (grainSec <= 0) return;

    const fadeSec = softeningSeconds(this.params.softening, grainSec);
    // Scheduling interval: grain size minus overlap
    const intervalSec = Math.max(0.005, grainSec - fadeSec);
    const intervalMs = intervalSec * 1000;

    this.schedulerId = setInterval(() => {
      if (!this.active || !this.buffer) {
        this.stop();
        return;
      }
      this.spawnGrain(Tone.now());
    }, intervalMs);

    // Spawn first grain immediately
    this.spawnGrain(time ?? Tone.now());
  }

  /** Advance the movement curve by one tracker tick */
  tick(): void {
    if (!this.active || !this.buffer) return;

    const { moveA, moveB, loopStart, loopEnd } = this.params;
    const speedA = signedByte(moveA);
    const speedB = signedByte(moveB);

    // Interpolate speed at current tick position in cycle
    const t = this.cycleLength > 1 ? this.tickInCycle / (this.cycleLength - 1) : 0;
    const speed = speedA + (speedB - speedA) * t;

    // Advance window position
    // Speed is in "fraction of loop window per tick"
    const windowSize = Math.max(0.01, (loopEnd - loopStart) / 255);
    this.windowPos += speed * windowSize * 0.25; // scale factor for musical range

    // Wrap within loop bounds
    const lo = loopStart / 255;
    const hi = loopEnd / 255;
    if (hi > lo) {
      while (this.windowPos > hi) this.windowPos -= (hi - lo);
      while (this.windowPos < lo) this.windowPos += (hi - lo);
    }

    this.tickInCycle++;
    if (this.tickInCycle >= this.cycleLength) {
      this.tickInCycle = 0;
    }
  }

  private spawnGrain(time: number): void {
    if (!this.buffer || !this.active) return;

    const duration = this.buffer.duration;
    if (duration <= 0) return;

    const grainSec = grainSizeSeconds(this.params.grainSize);
    const fadeSec = softeningSeconds(this.params.softening, grainSec);
    const detuneCents = harmonicCents(this.params.harmonic);

    // Grain offset in seconds
    const offset = Math.max(0, Math.min(duration - grainSec, this.windowPos * duration));

    const source = new Tone.ToneBufferSource({
      url: this.buffer,
      fadeIn: fadeSec,
      fadeOut: fadeSec,
      onended: () => {
        source.dispose();
        const idx = this.activeSources.indexOf(source);
        if (idx >= 0) this.activeSources.splice(idx, 1);
      },
    }).connect(this.output);

    // Apply pitch + harmonic detune
    const detuneFactor = Math.pow(2, detuneCents / 1200);
    source.playbackRate.value = this.basePitch * detuneFactor;

    // Compensate grain duration for playback rate
    const adjustedDuration = grainSec / source.playbackRate.value;

    source.start(time, offset);
    source.stop(time + adjustedDuration);

    this.activeSources.push(source);

    // Safety: limit max concurrent grains
    while (this.activeSources.length > 8) {
      const old = this.activeSources.shift();
      try { old?.stop(); } catch { /* already stopped */ }
    }
  }

  stop(): void {
    this.active = false;
    if (this.schedulerId !== null) {
      clearInterval(this.schedulerId);
      this.schedulerId = null;
    }
    for (const src of this.activeSources) {
      try { src.stop(); } catch { /* already stopped */ }
    }
    this.activeSources = [];
  }

  dispose(): void {
    this.stop();
    this.buffer = null;
  }
}
