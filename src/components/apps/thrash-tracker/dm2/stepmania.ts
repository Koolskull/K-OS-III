/** Write a Stepmania chart. Thrash Tracker does not read these files back. */

import { CHAIN_STEPS, SONG_ROWS, type Project } from "./model";

const ROWS_PER_BEAT = 4;

export interface StepmaniaExport {
  base: string;
  sm: string;
  arrows: number;
  ticks: number;
  wav: Uint8Array | null;
  wavName: string;
}

function safeBase(name: string): string {
  const cleaned = name
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9 _-]/g, "")
    .trim()
    .slice(0, 24);
  return cleaned || "UNTITLED";
}

function smText(value: string): string {
  return value.replace(/[;\r\n]/g, " ").trim() || "UNTITLED";
}

/** One play of channel 0, in the same order the worklet walks chains and phrases. */
export function chartTicks(project: Project, channel = 0): number[] {
  const ticks: number[] = [];
  const limit = SONG_ROWS * CHAIN_STEPS * 256;
  let songRow = 0;
  let chainStep = 0;
  let phraseRow = 0;

  while (ticks.length < limit) {
    const chainId = project.song[songRow]?.[channel] ?? -1;
    if (chainId < 0 || chainId >= project.chains.length) break;
    const chain = project.chains[chainId];
    if (!chain) break;

    let phraseId = chain.steps[chainStep]?.phrase ?? -1;
    if (phraseId < 0) {
      let found = -1;
      for (let step = chainStep + 1; step < CHAIN_STEPS; step++) {
        if ((chain.steps[step]?.phrase ?? -1) >= 0) {
          found = step;
          break;
        }
      }
      if (found < 0) {
        const next = songRow + 1;
        if (next >= SONG_ROWS || (project.song[next]?.[channel] ?? -1) < 0) break;
        songRow = next;
        chainStep = 0;
        phraseRow = 0;
        continue;
      }
      chainStep = found;
      phraseRow = 0;
      phraseId = chain.steps[chainStep]?.phrase ?? -1;
    }

    const phrase = project.phrases[phraseId];
    if (!phrase) break;
    const length = Math.max(1, Math.min(255, phrase.length | 0));
    if (phraseRow >= length) phraseRow = 0;
    ticks.push(phrase.rows[phraseRow]?.step ?? -1);

    phraseRow++;
    if (phraseRow < length) continue;
    phraseRow = 0;
    chainStep++;
    const upcoming = chain.steps[chainStep]?.phrase ?? -1;
    if (chainStep < CHAIN_STEPS && upcoming >= 0) continue;
    const next = songRow + 1;
    if (next >= SONG_ROWS || (project.song[next]?.[channel] ?? -1) < 0) break;
    songRow = next;
    chainStep = 0;
  }

  return ticks;
}

function noteLine(step: number): string {
  const panels = ["0", "0", "0", "0"];
  if (step >= 0 && step < 4) panels[step] = "1";
  return panels.join("");
}

function encodeWav(pcm: Float32Array, rate: number): Uint8Array {
  const frames = pcm.length;
  const bytes = new Uint8Array(44 + frames * 2);
  const view = new DataView(bytes.buffer);
  const write = (offset: number, text: string) => {
    for (let i = 0; i < text.length; i++) bytes[offset + i] = text.charCodeAt(i);
  };
  write(0, "RIFF");
  view.setUint32(4, 36 + frames * 2, true);
  write(8, "WAVE");
  write(12, "fmt ");
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, 1, true);
  view.setUint32(24, rate, true);
  view.setUint32(28, rate * 2, true);
  view.setUint16(32, 2, true);
  view.setUint16(34, 16, true);
  write(36, "data");
  view.setUint32(40, frames * 2, true);
  for (let i = 0; i < frames; i++) {
    const sample = Math.max(-1, Math.min(1, pcm[i] || 0));
    view.setInt16(44 + i * 2, sample < 0 ? sample * 0x8000 : sample * 0x7fff, true);
  }
  return bytes;
}

export function stepmaniaSong(project: Project): StepmaniaExport {
  const base = safeBase(project.name);
  const tpb = Math.max(1, project.tpb | 0);
  const rowsPerMeasure = tpb * ROWS_PER_BEAT;
  const raw = chartTicks(project, 0);
  const ticks = raw.length > 0 ? raw.slice() : Array.from({ length: rowsPerMeasure }, () => -1);
  while (ticks.length % rowsPerMeasure !== 0) ticks.push(-1);

  const measures: string[] = [];
  let arrows = 0;
  for (let i = 0; i < ticks.length; i += rowsPerMeasure) {
    const lines: string[] = [];
    for (let row = 0; row < rowsPerMeasure; row++) {
      const step = ticks[i + row] ?? -1;
      if (step >= 0 && step < 4) arrows++;
      lines.push(noteLine(step));
    }
    measures.push(lines.join("\n"));
  }

  const bpm = Number.isFinite(project.bpm) && project.bpm > 0 ? project.bpm : 120;
  const sample = project.samples[0] ?? null;
  const wavName = `${base}.wav`;
  const sm = [
    `#TITLE:${smText(base)};`,
    "#ARTIST:THRASH TRACKER;",
    "#CREDIT:Track Stomper;",
    `#MUSIC:${sample ? wavName : ""};`,
    "#OFFSET:0.000;",
    "#SAMPLESTART:0.000;",
    "#SAMPLELENGTH:0.000;",
    "#SELECTABLE:YES;",
    `#BPMS:0.000=${bpm.toFixed(3)};`,
    "#STOPS:;",
    "#NOTES:",
    "     dance-single:",
    "     Track Stomper:",
    "     Easy:",
    `     ${Math.max(1, Math.min(20, Math.round(arrows / Math.max(1, measures.length))))}:`,
    "     0.000,0.000,0.000,0.000,0.000:",
    measures.join("\n,\n"),
    ";",
    "",
  ].join("\n");

  return {
    base,
    sm,
    arrows,
    ticks: raw.length,
    wav: sample && sample.pcm.length > 0 ? encodeWav(sample.pcm, sample.rate || 44100) : null,
    wavName,
  };
}

export function downloadStepmania(project: Project): string {
  const chart = stepmaniaSong(project);
  const save = (blob: Blob, name: string) => {
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = name;
    link.click();
    URL.revokeObjectURL(url);
  };
  save(new Blob([chart.sm], { type: "text/plain" }), `${chart.base}.sm`);
  if (chart.wav) save(new Blob([chart.wav.slice()], { type: "audio/wav" }), chart.wavName);
  const audio = chart.wav ? `  ${chart.wavName}` : "";
  return chart.arrows > 0
    ? `CHART ${chart.base}.sm  ${chart.arrows} ARROWS${audio}`
    : `CHART ${chart.base}.sm  NO ARROWS${audio}`;
}
