/*
 *            ☦
 *      ╔════════════════════╗
 *      ║  ST. GENESIUS OF   ║
 *      ║  ROME — Patron of  ║
 *      ║  Live Performers   ║
 *      ╚════════════════════╝
 *
 *   LIVE VOICE MANAGER
 *   Polyphonic voice pool for real-time pad/keyboard triggering.
 *   Separate from TrackerEngine's sequenced playback —
 *   uses channels 8+ to avoid conflicts.
 */

import * as Tone from "tone";
import { AudioEngine } from "@/engine/audio/AudioEngine";
import { SamplerVoice } from "@/engine/synth/SamplerVoice";
import { FMSynthVoice } from "@/engine/synth/FMSynth";
import { SamplePool } from "@/engine/samples/SamplePool";
import type { Instrument } from "@/types/tracker";

const LIVE_CHANNEL_OFFSET = 8;
const VOICE_COUNT = 16;

interface ActiveVoice {
  voiceIndex: number;
  midiNote: number;
  type: "sample" | "fm";
}

export class LiveVoiceManager {
  private audio: AudioEngine;
  private samplerVoices: SamplerVoice[] = [];
  private fmVoices: FMSynthVoice[] = [];
  private nextVoice = 0;
  private activeVoices: Map<number, ActiveVoice> = new Map(); // midiNote → voice
  private samplePool: SamplePool | null = null;

  // Mute/solo state — keyed by global pad index (bank * 16 + padIndex)
  private mutedPads: Set<number> = new Set();
  private soloedPads: Set<number> = new Set();

  constructor() {
    this.audio = AudioEngine.getInstance();

    for (let i = 0; i < VOICE_COUNT; i++) {
      const channel = this.audio.getChannel(LIVE_CHANNEL_OFFSET + i);
      this.samplerVoices.push(new SamplerVoice(channel));
      this.fmVoices.push(new FMSynthVoice(channel));
    }
  }

  setSamplePool(pool: SamplePool): void {
    this.samplePool = pool;
  }

  // ── MUTE / SOLO ──

  toggleMute(padIndex: number, bank: number): void {
    const global = bank * 16 + padIndex;
    if (this.mutedPads.has(global)) {
      this.mutedPads.delete(global);
    } else {
      this.mutedPads.add(global);
    }
  }

  toggleSolo(padIndex: number, bank: number): void {
    const global = bank * 16 + padIndex;
    if (this.soloedPads.has(global)) {
      this.soloedPads.delete(global);
    } else {
      this.soloedPads.add(global);
    }
  }

  isMuted(padIndex: number, bank: number): boolean {
    return this.mutedPads.has(bank * 16 + padIndex);
  }

  isSoloed(padIndex: number, bank: number): boolean {
    return this.soloedPads.has(bank * 16 + padIndex);
  }

  getMutedPads(): Set<number> { return this.mutedPads; }
  getSoloedPads(): Set<number> { return this.soloedPads; }

  private isPadAudible(globalIndex: number): boolean {
    // Mute always wins
    if (this.mutedPads.has(globalIndex)) return false;
    // If anything is soloed, only soloed pads play
    if (this.soloedPads.size > 0 && !this.soloedPads.has(globalIndex)) return false;
    return true;
  }

  /**
   * Trigger a pad. Resolves pad index + bank to an instrument index,
   * then triggers the appropriate voice.
   *
   * Mapping: instrument index = bank * 16 + padIndex
   */
  triggerPad(
    padIndex: number,
    bank: number,
    instruments: Instrument[],
  ): void {
    const instIndex = bank * 16 + padIndex;
    if (!this.isPadAudible(instIndex)) return;

    const inst = instruments[instIndex];
    if (!inst) return;

    // Use pad's MIDI note as C4 (one-shot at original pitch)
    const midiNote = 60;
    this.triggerVoice(midiNote, inst);
  }

  /**
   * Trigger a note from the keyboard on a specific instrument.
   */
  noteOn(midiNote: number, instrument: Instrument): void {
    this.triggerVoice(midiNote, instrument);
  }

  /**
   * Release a note triggered by the keyboard.
   */
  noteOff(midiNote: number): void {
    const active = this.activeVoices.get(midiNote);
    if (!active) return;

    if (active.type === "sample") {
      this.samplerVoices[active.voiceIndex].triggerRelease();
    } else {
      this.fmVoices[active.voiceIndex].triggerRelease();
    }
    this.activeVoices.delete(midiNote);
  }

  private triggerVoice(midiNote: number, inst: Instrument): void {
    // If this note is already playing, release it first
    this.noteOff(midiNote);

    const vi = this.allocateVoice();

    if (inst.type === "sample") {
      const voice = this.samplerVoices[vi];

      // Resolve sample buffer
      const buf = this.resolveSampleBuffer(inst);
      if (!buf) return;

      voice.setBuffer(buf);
      voice.triggerAttack(midiNote, null, undefined, inst);
    } else {
      // FM / synth
      const voice = this.fmVoices[vi];
      voice.applyInstrument(inst);
      voice.triggerAttack(midiNote);
    }

    this.activeVoices.set(midiNote, {
      voiceIndex: vi,
      midiNote,
      type: inst.type === "sample" ? "sample" : "fm",
    });
  }

  private resolveSampleBuffer(inst: Instrument): Tone.ToneAudioBuffer | undefined {
    if (!this.samplePool) return undefined;

    if (inst.sampleId != null && this.samplePool.has(inst.sampleId)) {
      return this.samplePool.get(inst.sampleId);
    }
    return undefined;
  }

  private allocateVoice(): number {
    const vi = this.nextVoice;
    this.nextVoice = (this.nextVoice + 1) % VOICE_COUNT;

    // Stop whatever was on this voice slot
    this.samplerVoices[vi].triggerRelease();
    this.fmVoices[vi].triggerRelease();

    // Clean up any activeVoice entries pointing to this slot
    for (const [note, active] of this.activeVoices.entries()) {
      if (active.voiceIndex === vi) {
        this.activeVoices.delete(note);
        break;
      }
    }

    return vi;
  }

  dispose(): void {
    this.samplerVoices.forEach((v) => v.dispose());
    this.fmVoices.forEach((v) => v.dispose());
    this.samplerVoices = [];
    this.fmVoices = [];
    this.activeVoices.clear();
    this.samplePool = null;
  }
}
