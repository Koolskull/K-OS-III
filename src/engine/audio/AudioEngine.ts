/*
 *         ☦  ✝  ☦
 *
 *      ╔═══════════════╗
 *      ║  ST. CECILIA  ║
 *      ║  Patroness of ║
 *      ║   Musicians   ║
 *      ╚═══════════════╝
 *
 *        .  *  .  *  .
 *       /|\ /|\ /|\ /|\
 *      / | X | X | X | \
 *     /  |/ \|/ \|/ \|  \
 *
 *   "Sing to the Lord a new song."
 *    — Psalm 96:1
 *
 *   AUDIO ENGINE - Web Audio API Core
 *   Blessed be every sample and waveform.
 */

import * as Tone from "tone";

export class AudioEngine {
  private static instance: AudioEngine | null = null;
  private initialized = false;
  private masterGain: Tone.Volume;
  private channels: Map<number, Tone.Channel> = new Map();

  private constructor() {
    this.masterGain = new Tone.Volume(-6).toDestination();
  }

  static getInstance(): AudioEngine {
    if (!AudioEngine.instance) {
      AudioEngine.instance = new AudioEngine();
    }
    return AudioEngine.instance;
  }

  async init(): Promise<void> {
    if (this.initialized) return;
    await Tone.start();
    this.initialized = true;
    console.log("[DATAMOSHPIT] Audio engine initialized. ☦");
  }

  isReady(): boolean {
    return this.initialized;
  }

  getChannel(index: number): Tone.Channel {
    if (!this.channels.has(index)) {
      const ch = new Tone.Channel().connect(this.masterGain);
      this.channels.set(index, ch);
    }
    return this.channels.get(index)!;
  }

  setBPM(bpm: number): void {
    Tone.getTransport().bpm.value = bpm;
  }

  start(): void {
    Tone.getTransport().start();
  }

  stop(): void {
    Tone.getTransport().stop();
  }

  getMasterVolume(): number {
    return this.masterGain.volume.value;
  }

  setMasterVolume(db: number): void {
    this.masterGain.volume.value = db;
  }

  dispose(): void {
    this.channels.forEach((ch) => ch.dispose());
    this.channels.clear();
    this.masterGain.dispose();
    this.initialized = false;
    AudioEngine.instance = null;
  }
}
