/*
 *              ☦
 *          ╔═══════╗
 *          ║ SAINT ║
 *          ║ ROMAN ║
 *          ║  THE  ║
 *          ║MELODIST║
 *          ╚═══════╝
 *
 *   Hymnographer of Constantinople,
 *   pray for our frequencies.
 *
 *   FM SYNTHESIS ENGINE
 *   YM2612-inspired 4-operator FM
 *   Blessed be every harmonic.
 */

import * as Tone from "tone";
import type { FMOperator, Instrument } from "@/types/tracker";

/**
 * YM2612-style FM Synthesizer
 * 4 operators with 8 algorithms
 * Built on Tone.js for Web Audio compatibility
 */
export class FMSynthVoice {
  private synth: Tone.FMSynth;
  private output: Tone.Channel;

  constructor(output: Tone.Channel) {
    this.output = output;
    this.synth = new Tone.FMSynth({
      harmonicity: 1,
      modulationIndex: 10,
      oscillator: { type: "sine" },
      envelope: { attack: 0.01, decay: 0.2, sustain: 0.5, release: 0.3 },
      modulation: { type: "sine" },
      modulationEnvelope: { attack: 0.01, decay: 0.2, sustain: 0.5, release: 0.3 },
    }).connect(output);
  }

  /**
   * Apply instrument parameters to this voice
   */
  applyInstrument(inst: Instrument): void {
    if (inst.fmOperators && inst.fmOperators.length >= 2) {
      const carrier = inst.fmOperators[0];
      const modulator = inst.fmOperators[1];

      this.synth.harmonicity.value = modulator.ratio / Math.max(carrier.ratio, 0.01);
      this.synth.modulationIndex.value = modulator.level;

      this.synth.envelope.attack = carrier.attack / 127;
      this.synth.envelope.decay = carrier.decay / 127;
      this.synth.envelope.sustain = carrier.sustain / 127;
      this.synth.envelope.release = carrier.release / 127;

      this.synth.modulationEnvelope.attack = modulator.attack / 127;
      this.synth.modulationEnvelope.decay = modulator.decay / 127;
      this.synth.modulationEnvelope.sustain = modulator.sustain / 127;
      this.synth.modulationEnvelope.release = modulator.release / 127;
    }
  }

  triggerAttack(note: string | number, time?: number): void {
    const freq = typeof note === "number" ? Tone.Frequency(note, "midi").toFrequency() : note;
    this.synth.triggerAttack(freq, time);
  }

  triggerRelease(time?: number): void {
    this.synth.triggerRelease(time);
  }

  triggerAttackRelease(note: string | number, duration: string | number, time?: number): void {
    const freq = typeof note === "number" ? Tone.Frequency(note, "midi").toFrequency() : note;
    this.synth.triggerAttackRelease(freq, duration, time);
  }

  dispose(): void {
    this.synth.dispose();
  }
}
