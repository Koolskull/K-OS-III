/*
 *            ☦
 *      ╔════════════════╗
 *      ║  ST. JOSEPH OF ║
 *      ║  CUPERTINO     ║
 *      ╚════════════════╝
 *
 *   SAMPLER VOICE
 *   One-shot / loop / granular sample playback.
 *   Each trigger creates a fresh BufferSource (no re-trigger issues).
 *   When granular params are set (grainSize > 0), delegates to GranularEngine.
 */

import * as Tone from "tone";
import { GranularEngine } from "./GranularEngine";
import type { GranularParams } from "./GranularEngine";
import type { Instrument } from "@/types/tracker";

export class SamplerVoice {
  private buffer: Tone.ToneAudioBuffer | null = null;
  private output: Tone.Channel;
  private activeSource: Tone.ToneBufferSource | null = null;
  private baseNote = 60; // C-4 = original pitch
  private _loaded = false;
  private granular: GranularEngine;

  constructor(output: Tone.Channel) {
    this.output = output;
    this.granular = new GranularEngine(output);
  }

  async loadSample(url: string): Promise<void> {
    try {
      this.buffer = await Tone.ToneAudioBuffer.fromUrl(url);
      this._loaded = true;
      console.log(`[SAMPLER] Loaded: ${url}`);
    } catch (e) {
      console.warn(`[SAMPLER] Failed: ${url}`, e);
    }
  }

  /** Set a pre-loaded buffer directly (for per-channel voice reuse) */
  setBuffer(buf: Tone.ToneAudioBuffer): void {
    this.buffer = buf;
    this._loaded = true;
    this.granular.setBuffer(buf);
  }

  isLoaded(): boolean {
    return this._loaded && this.buffer !== null;
  }

  /** Apply granular params from an instrument definition */
  applyGranularParams(inst: Instrument): void {
    this.granular.setParams({
      loopStart: inst.loopStart ?? 0x00,
      loopEnd: inst.loopEnd ?? 0xFF,
      moveA: inst.granMoveA ?? 0x80,
      moveB: inst.granMoveB ?? 0x80,
      grainSize: inst.granSize ?? 0x00,
      softening: inst.granSoft ?? 0x00,
      harmonic: inst.granHarm ?? 0x80,
    });
  }

  triggerAttack(note: number, slice: number | null, time?: number, inst?: Instrument): void {
    if (!this.buffer || !this._loaded) return;

    // Stop any currently playing source or granular
    this.stopCurrent(time);
    this.granular.stop();

    // Apply granular params if instrument provided
    if (inst) this.applyGranularParams(inst);

    // If granular is configured, use granular engine
    if (inst && (inst.granSize ?? 0) > 0) {
      this.granular.setBuffer(this.buffer);
      this.granular.start(note, this.baseNote, time);
      return;
    }

    // Standard one-shot / loop playback
    const isLoop = inst?.sampleLoop ?? false;
    const loopStart = inst?.loopStart ?? 0;
    const loopEnd = inst?.loopEnd ?? 0xFF;

    const source = new Tone.ToneBufferSource({
      url: this.buffer,
      loop: isLoop,
      loopStart: (loopStart / 255) * this.buffer.duration,
      loopEnd: (loopEnd / 255) * this.buffer.duration,
      onended: () => {
        source.dispose();
        if (this.activeSource === source) {
          this.activeSource = null;
        }
      },
    }).connect(this.output);

    // Set pitch via playback rate (semitone offset from base note)
    source.playbackRate.value = Math.pow(2, (note - this.baseNote) / 12);

    // Calculate start offset from slice byte
    let offset = 0;
    if (slice !== null && slice > 0 && this.buffer.duration > 0) {
      offset = (slice / 256) * this.buffer.duration;
    }

    source.start(time, offset);
    this.activeSource = source;
  }

  /** Advance granular movement by one tracker tick */
  granularTick(): void {
    this.granular.tick();
  }

  /** Is granular mode currently active? */
  isGranularActive(): boolean {
    return this.granular.isActive();
  }

  triggerRelease(time?: number): void {
    this.stopCurrent(time);
    this.granular.stop();
  }

  private stopCurrent(time?: number): void {
    if (this.activeSource) {
      try {
        this.activeSource.stop(time);
      } catch {
        // already stopped
      }
      this.activeSource = null;
    }
  }

  dispose(): void {
    this.stopCurrent();
    this.granular.dispose();
    this.buffer = null;
    this._loaded = false;
  }
}
