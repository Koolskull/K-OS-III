"use client";

import { TRACKER_VERSION, playbackSnapshot, type PlaybackProject, type Project, type SampleData } from "./model";

export interface PlayHead {
  playing: boolean;
  kind: string;
  seq: string;
  songRow: number[];
  chainStep: number[];
  phraseRow: number[];
  phraseId: number[];
  muted: boolean[];
  level: number[];
  scope: Float32Array;
  wave: Float32Array;
}

type HeadListener = (head: PlayHead) => void;
type StatusListener = (text: string) => void;

export class WebPlayer {
  private ctx: AudioContext | null = null;
  private node: AudioWorkletNode | null = null;
  private ready: Promise<void> | null = null;
  private headListener: HeadListener | null = null;
  private statusListener: StatusListener | null = null;
  head: PlayHead = {
    playing: false,
    kind: "song",
    seq: "song",
    songRow: [0, 0, 0, 0, 0, 0, 0, 0],
    chainStep: [0, 0, 0, 0, 0, 0, 0, 0],
    phraseRow: [0, 0, 0, 0, 0, 0, 0, 0],
    phraseId: [-1, -1, -1, -1, -1, -1, -1, -1],
    muted: [false, false, false, false, false, false, false, false],
    level: [0, 0, 0, 0, 0, 0, 0, 0],
    scope: new Float32Array(256),
    wave: new Float32Array(8 * 64),
  };

  onHead(listener: HeadListener) {
    this.headListener = listener;
  }

  onStatus(listener: StatusListener) {
    this.statusListener = listener;
  }

  ensure(): Promise<void> {
    if (this.ready) return this.ready;
    this.ready = this.start();
    return this.ready;
  }

  private async start() {
    const ctx = new AudioContext();
    this.ctx = ctx;
    await ctx.audioWorklet.addModule(`/dm2-worklet.js?${TRACKER_VERSION}`);
    const node = new AudioWorkletNode(ctx, "dm2-player", { outputChannelCount: [2] });
    node.connect(ctx.destination);
    node.port.onmessage = (event) => {
      const msg = event.data;
      if (!msg) return;
      if (msg.type === "head") {
        this.head = {
          playing: !!msg.playing,
          kind: msg.kind,
          seq: msg.seq,
          songRow: msg.songRow,
          chainStep: msg.chainStep,
          phraseRow: msg.phraseRow,
          phraseId: msg.phraseId ?? [-1, -1, -1, -1, -1, -1, -1, -1],
          muted: msg.muted,
          level: msg.level,
          scope: msg.scope instanceof Float32Array ? msg.scope : new Float32Array(msg.scope),
          wave: msg.wave instanceof Float32Array ? msg.wave : new Float32Array(msg.wave ?? 8 * 64),
        };
        this.headListener?.(this.head);
      } else if (msg.type === "status") {
        this.statusListener?.(String(msg.text ?? ""));
      }
    };
    this.node = node;
    if (ctx.state === "suspended") await ctx.resume();
  }

  async resume() {
    await this.ensure();
    if (this.ctx && this.ctx.state === "suspended") await this.ctx.resume();
  }

  send(message: Record<string, unknown>, transfer?: Transferable[]) {
    this.node?.port.postMessage(message, transfer ?? []);
  }

  close() {
    this.send({ type: "stop" });
    const ctx = this.ctx;
    this.ctx = null;
    this.node = null;
    if (ctx && ctx.state !== "closed") void ctx.close();
  }

  pushProject(project: Project) {
    const snap: PlaybackProject = playbackSnapshot(project);
    this.send({ type: "project", project: snap });
    for (const sample of project.samples) this.pushSample(sample);
  }

  tap(note: number, instrument: number) {
    this.send({ type: "tap", note, instrument });
  }

  pushSample(sample: SampleData) {
    const pcm = sample.pcm.slice();
    this.send({ type: "sample", id: sample.id, rate: sample.rate, pcm }, [pcm.buffer]);
  }

  async decodeSample(file: ArrayBuffer): Promise<{ rate: number; pcm: Float32Array }> {
    await this.ensure();
    return decodeWav(file);
  }
}

export async function decodeWav(file: ArrayBuffer): Promise<{ rate: number; pcm: Float32Array }> {
  const ctx = new AudioContext();
  try {
    const decoded = await ctx.decodeAudioData(file.slice(0));
    return { rate: decoded.sampleRate, pcm: decoded.getChannelData(0).slice() };
  } finally {
    if (ctx.state !== "closed") void ctx.close();
  }
}
