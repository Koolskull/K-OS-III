/*
 *                    ☦
 *              ╔═══════════╗
 *              ║  ST. JOHN ║
 *              ║CHRYSOSTOM ║
 *              ╚═══════════╝
 *
 *   TRACKER ENGINE
 *   Steps through songs, chains, phrases, tables.
 */

import * as Tone from "tone";
import type {
  Song, Chain, Phrase, Table, Instrument,
  PhraseRow, Effect, ProjectData,
} from "@/types/tracker";
import { AudioEngine } from "@/engine/audio/AudioEngine";
import { FMSynthVoice } from "@/engine/synth/FMSynth";
import { SamplerVoice } from "@/engine/synth/SamplerVoice";
import { SamplePool } from "@/engine/samples/SamplePool";

interface ChannelState {
  songRow: number;
  chainStep: number;
  phraseRow: number;
  tableRow: number;
  fmVoice: FMSynthVoice | null;
  samplerVoice: SamplerVoice | null;
  currentInstrument: number | null;
  activeVoiceType: "fm" | "sample" | null;
}

export class TrackerEngine {
  private audio: AudioEngine;
  private project: ProjectData | null = null;
  private channelStates: ChannelState[] = [];
  private playing = false;
  private scheduleId: number | null = null;
  private tickCallback: ((tick: number, channel: number, row: number) => void) | null = null;

  /** Pre-loaded sample buffers shared across channels (legacy URL-based) */
  private sampleBuffers: Map<string, import("tone").ToneAudioBuffer> = new Map();
  /** Project-embedded sample pool */
  private samplePool: SamplePool = new SamplePool();
  private samplesLoaded = false;

  constructor() {
    this.audio = AudioEngine.getInstance();
  }

  loadProject(project: ProjectData): void {
    this.stop();
    this.project = project;

    // Dispose old voices
    this.channelStates.forEach((ch) => {
      ch.fmVoice?.dispose();
      ch.samplerVoice?.dispose();
    });
    this.sampleBuffers.clear();

    // Create per-channel voices (FM + sampler)
    this.channelStates = [];
    for (let i = 0; i < project.song.channels; i++) {
      this.channelStates.push({
        songRow: 0,
        chainStep: 0,
        phraseRow: 0,
        tableRow: 0,
        fmVoice: new FMSynthVoice(this.audio.getChannel(i)),
        samplerVoice: new SamplerVoice(this.audio.getChannel(i)),
        currentInstrument: null,
        activeVoiceType: null,
      });
    }

    this.audio.setBPM(project.song.bpm);

    // Pre-load all samples (URL-based + project-embedded)
    this.samplesLoaded = false;
    this.samplePool.clear();
    this.preloadSamples(project);

    console.log(`[ENGINE] Project "${project.name}" loaded`);
  }

  /**
   * Hot-update project data without stopping playback.
   * The sequencer reads this.project fresh each tick, so
   * updated instrument params take effect on the next note trigger.
   */
  updateProject(project: ProjectData): void {
    this.project = project;

    // Decode any new project samples not yet in pool
    for (const sample of project.samples) {
      if (!this.samplePool.has(sample.id)) {
        this.samplePool.loadOne(sample);
      }
    }

    // Preload any new sample URLs not yet cached
    for (const inst of project.instruments) {
      if (inst.type === "sample" && inst.sampleUrl && !inst.sampleId && !this.sampleBuffers.has(inst.sampleUrl)) {
        Tone.ToneAudioBuffer.fromUrl(inst.sampleUrl).then((buf) => {
          this.sampleBuffers.set(inst.sampleUrl!, buf);
        }).catch((e) => {
          console.warn(`[ENGINE] Failed to hot-load: ${inst.sampleUrl}`, e);
        });
      }
    }
  }

  private async preloadSamples(project: ProjectData): Promise<void> {
    const loads: Promise<void>[] = [];

    // Decode project-embedded samples
    if (project.samples.length > 0) {
      loads.push(this.samplePool.loadAll(project.samples));
    }

    // Load URL-based samples (legacy / fallback)
    for (const inst of project.instruments) {
      if (inst.type === "sample" && inst.sampleUrl && !inst.sampleId && !this.sampleBuffers.has(inst.sampleUrl)) {
        const url = inst.sampleUrl;
        loads.push(
          Tone.ToneAudioBuffer.fromUrl(url).then((buf) => {
            this.sampleBuffers.set(url, buf);
          }).catch((e) => {
            console.warn(`[ENGINE] Failed to load: ${url}`, e);
          })
        );
      }
    }
    await Promise.all(loads);
    this.samplesLoaded = true;
    console.log(`[ENGINE] samples ready (pool: ${project.samples.length}, url: ${this.sampleBuffers.size})`);
  }

  onTick(cb: (tick: number, channel: number, row: number) => void): void {
    this.tickCallback = cb;
  }

  async play(): Promise<void> {
    if (!this.project || this.playing) return;

    // Wait for samples if they're still loading
    if (!this.samplesLoaded) {
      console.log("[ENGINE] Waiting for samples...");
      await new Promise<void>((resolve) => {
        const check = setInterval(() => {
          if (this.samplesLoaded) {
            clearInterval(check);
            resolve();
          }
        }, 50);
      });
    }

    this.playing = true;
    console.log("[ENGINE] ▶ PLAY");

    // Reset positions
    this.channelStates.forEach((ch) => {
      ch.songRow = 0;
      ch.chainStep = 0;
      ch.phraseRow = 0;
      ch.tableRow = 0;
    });

    const tickSeconds = 60 / (this.project.song.bpm * this.project.song.tpb);
    let globalTick = 0;

    // Clear any previous schedule
    Tone.getTransport().cancel();
    Tone.getTransport().stop();
    Tone.getTransport().position = 0;

    // Schedule ticks
    this.scheduleId = Tone.getTransport().scheduleRepeat((time) => {
      if (!this.project) return;
      this.processTick(globalTick, time);
      globalTick++;
    }, tickSeconds, 0) as unknown as number;

    // Start transport
    Tone.getTransport().start();
  }

  stop(): void {
    if (!this.playing) return;
    this.playing = false;
    console.log("[ENGINE] ■ STOP");

    if (this.scheduleId !== null) {
      Tone.getTransport().clear(this.scheduleId);
      this.scheduleId = null;
    }
    Tone.getTransport().stop();
    Tone.getTransport().cancel();
    Tone.getTransport().position = 0;

    this.channelStates.forEach((ch) => {
      ch.fmVoice?.triggerRelease();
      ch.samplerVoice?.triggerRelease();
      ch.songRow = 0;
      ch.chainStep = 0;
      ch.phraseRow = 0;
    });
  }

  isPlaying(): boolean {
    return this.playing;
  }

  private processTick(tick: number, time: number): void {
    if (!this.project) return;
    const { song, chains, phrases, tables, instruments } = this.project;

    for (let ch = 0; ch < song.channels; ch++) {
      const state = this.channelStates[ch];
      const songRow = song.rows[state.songRow];
      if (!songRow) continue;

      const chainId = songRow.chains[ch];
      if (chainId === null || chainId === undefined) continue;

      const chain = chains.find((c) => c.id === chainId);
      if (!chain) continue;

      const step = chain.steps[state.chainStep];
      if (!step || step.phrase === null) continue;

      const phrase = phrases.find((p) => p.id === step.phrase);
      if (!phrase) continue;

      const row = phrase.rows[state.phraseRow];
      if (row) {
        this.processRow(row, state, instruments, step.transpose, time);
        this.tickCallback?.(tick, ch, state.phraseRow);
      }

      // Granular tick: advance movement curve every tick
      if (state.samplerVoice?.isGranularActive()) {
        state.samplerVoice.granularTick();
      }

      // Table processing
      if (state.currentInstrument !== null) {
        const inst = instruments.find((i) => i.id === state.currentInstrument);
        if (inst?.table !== null && inst?.table !== undefined) {
          const table = tables.find((t) => t.id === inst.table);
          if (table) this.processTableTick(table, state, time);
        }
      }

      // Advance
      state.phraseRow++;
      if (state.phraseRow >= phrase.rows.length) {
        state.phraseRow = 0;
        state.chainStep++;
        if (state.chainStep >= chain.steps.length || chain.steps[state.chainStep]?.phrase === null) {
          state.chainStep = 0;
          state.songRow = this.findNextSongRow(song, ch, state.songRow + 1);
        }
      }
    }
  }

  private findNextSongRow(song: Song, channel: number, fromRow: number): number {
    for (let i = fromRow; i < song.rows.length; i++) {
      if (song.rows[i]?.chains[channel] != null) return i;
    }
    for (let i = 0; i < fromRow; i++) {
      if (song.rows[i]?.chains[channel] != null) return i;
    }
    return 0;
  }

  /** Choke all voices on a channel — monophonic: only one sound at a time */
  private chokeChannel(state: ChannelState, time: number): void {
    state.fmVoice?.triggerRelease(time);
    state.samplerVoice?.triggerRelease(time);
  }

  private processRow(
    row: PhraseRow,
    state: ChannelState,
    instruments: Instrument[],
    transpose: number,
    time: number,
  ): void {
    // Set instrument
    if (row.instrument !== null) {
      state.currentInstrument = row.instrument;
      const inst = instruments.find((i) => i.id === row.instrument);
      if (inst) {
        state.activeVoiceType = inst.type === "sample" ? "sample" : "fm";
        if (inst.type !== "sample" && state.fmVoice) {
          state.fmVoice.applyInstrument(inst);
        }
      }
    }

    // Trigger note — choke previous voice first (monophonic per channel)
    if (row.note !== null) {
      this.chokeChannel(state, time);
      const note = row.note + transpose;

      if (state.activeVoiceType === "sample" && state.currentInstrument !== null) {
        const inst = this.project?.instruments.find((i) => i.id === state.currentInstrument);
        if (inst && state.samplerVoice) {
          // Resolve buffer: project pool first, then URL fallback
          const buf = (inst.sampleId != null && this.samplePool.has(inst.sampleId))
            ? this.samplePool.get(inst.sampleId)
            : (inst.sampleUrl ? this.sampleBuffers.get(inst.sampleUrl) : undefined);
          if (buf) {
            state.samplerVoice.setBuffer(buf);
            state.samplerVoice.triggerAttack(note, row.slice ?? null, time, inst);
          }
        }
      } else if (state.fmVoice) {
        state.fmVoice.triggerAttack(note, time);
      }
    }

    if (row.effect1) this.applyEffect(row.effect1, state, time);
    if (row.effect2) this.applyEffect(row.effect2, state, time);
  }

  private processTableTick(table: Table, state: ChannelState, time: number): void {
    const row = table.rows[state.tableRow];
    if (!row) return;
    if (row.effect1) this.applyEffect(row.effect1, state, time);
    if (row.effect2) this.applyEffect(row.effect2, state, time);
    state.tableRow++;
    if (state.tableRow >= table.rows.length) state.tableRow = table.loopStart;
  }

  private applyEffect(effect: Effect, state: ChannelState, time: number): void {
    switch (effect.command) {
      case "KL":
        // Kill — choke whatever is playing on this channel
        this.chokeChannel(state, time);
        break;
    }
  }

  dispose(): void {
    this.stop();
    this.channelStates.forEach((ch) => {
      ch.fmVoice?.dispose();
      ch.samplerVoice?.dispose();
    });
    this.sampleBuffers.clear();
    this.samplePool.clear();
    this.channelStates = [];
  }
}
