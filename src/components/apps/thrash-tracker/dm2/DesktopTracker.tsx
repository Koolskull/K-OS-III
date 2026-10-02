"use client";

import React, { useEffect, useRef } from "react";
import {
  CHANNELS,
  CHAIN_STEPS,
  LAYERS,
  SCREENS,
  SLOTS,
  SONG_ROWS,
  blankInstrument,
  cellAt,
  createDefault,
  deserialize,
  hex2,
  hexOrDash,
  nextFreeInstrument,
  noteName,
  seedNote,
  serialize,
  TRACKER_NAME,
  TRACKER_VERSION,
  tableRowAt,
  AMEN_URL,
  amenNeedsAudio,
  installAmenBreak,
  isUntouchedFactory,
  type Cell,
  type InstType,
  type Project,
  type ScreenName,
  type TableRow,
} from "./model";
import { WebPlayer, decodeWav, type PlayHead } from "./player";
import { loadSymbols, paintSymbols } from "./symbols";

const W = 960;
const H = 540;
const STORAGE = "dm2-web-pattern";
const OSCS = ["SINE", "SQUARE", "SAW", "TRI", "NOISE"];
const LOWER = "zsxdcvgbhnjm,l.;/";
const UPPER = "q2w3er5t6y7ui9o0p";

interface Ui {
  screen: ScreenName;
  cursorRow: number;
  cursorCol: number;
  nibble: number;
  octave: number;
  chainId: number;
  phraseId: number;
  tableId: number;
  instrumentId: number;
  songCursorRow: number;
  songCursorCol: number;
  scroll: number;
  status: string;
  sequencer: "song" | "live";
  clock: number;
}

interface Hit {
  x: number;
  y: number;
  w: number;
  h: number;
  kind: "cell" | "map" | "mixer";
  row: number;
  col: number;
}

function emptyHead(): PlayHead {
  return {
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
}

function freshUi(): Ui {
  return {
    screen: "song",
    cursorRow: 0,
    cursorCol: 0,
    nibble: 0,
    octave: 4,
    chainId: 0,
    phraseId: 0,
    tableId: 0,
    instrumentId: 0,
    songCursorRow: 0,
    songCursorCol: 0,
    scroll: 0,
    status: "SHIFT F1-F8 PAGE   SPACE PLAY   Z X C V NOTES",
    sequencer: "song",
    clock: 0,
  };
}

function loadProject(): Project {
  try {
    const raw = localStorage.getItem(STORAGE);
    if (!raw) return createDefault();
    return deserialize(raw);
  } catch {
    return createDefault();
  }
}

function hexDigit(key: string): number {
  if (key.length !== 1) return -1;
  const c = key.toLowerCase();
  if (c >= "0" && c <= "9") return c.charCodeAt(0) - 48;
  if (c >= "a" && c <= "f") return c.charCodeAt(0) - 87;
  return -1;
}

function pianoNote(key: string, octave: number): number {
  if (key.length !== 1) return -1;
  const c = key.toLowerCase();
  const base = (octave + 1) * 12;
  const low = LOWER.indexOf(c);
  if (low >= 0) return Math.max(0, Math.min(127, base + low));
  const high = UPPER.indexOf(c);
  if (high >= 0) return Math.max(0, Math.min(127, base + 12 + high));
  return -1;
}

function putHex(current: number, empty: boolean, digit: number, nibble: number): { value: number; nibble: number } {
  if (nibble === 0 || empty) return { value: digit << 4, nibble: 1 };
  return { value: (current & 0xf0) | digit, nibble: 0 };
}

/** Up and down step the high nibble. Left and right step the low nibble. */
function stepHex(value: number, delta: number, coarse: boolean, maxValue = 255): number {
  const hiMax = Math.max(0, Math.min(15, maxValue >> 4));
  if (value < 0) {
    const hi = coarse ? (delta > 0 ? Math.min(1, hiMax) : hiMax) : 0;
    const lo = coarse ? 0 : (delta > 0 ? 1 : Math.min(15, maxValue));
    return Math.min(maxValue, (hi << 4) | lo);
  }
  let hi = (value >> 4) & 0xf;
  let lo = value & 0xf;
  if (coarse) hi = clamp(hi + delta, 0, hiMax);
  else {
    const loMax = (hi << 4) + 15 <= maxValue ? 15 : (maxValue & 0xf);
    lo = clamp(lo + delta, 0, loMax);
  }
  return Math.min(maxValue, (hi << 4) | lo);
}

function stepKnob(value: number, delta: number, coarse: boolean, lo: number, hi: number, big: number): number {
  const step = coarse ? big : 1;
  if (value < lo) return delta > 0 ? lo : hi;
  return clamp(value + delta * step, lo, hi);
}

const NUDGE_ALPHABET = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ";

function stepCmd(fx: { on: boolean; cmd: string }, delta: number, coarse: boolean) {
  let text = fx.on ? fx.cmd.toUpperCase() : "";
  if (text.length < 2) text = "00";
  text = text.slice(0, 2);
  const side = coarse ? 0 : 1;
  const index = clamp(Math.max(0, NUDGE_ALPHABET.indexOf(text[side] ?? "0")) + delta, 0, NUDGE_ALPHABET.length - 1);
  const chars = text.split("");
  chars[side] = NUDGE_ALPHABET[index];
  fx.cmd = chars.join("");
  fx.on = true;
}

function cycleStep(step: number, delta: number): number {
  const order = [-1, 0, 1, 2, 3];
  const index = Math.max(0, order.indexOf(step));
  return order[clamp(index + (delta > 0 ? 1 : -1), 0, order.length - 1)];
}

function clamp(value: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, value));
}

function rowCount(project: Project, ui: Ui): number {
  if (ui.screen === "song") return SONG_ROWS;
  if (ui.screen === "chain") return CHAIN_STEPS;
  if (ui.screen === "phrase") return clamp(project.phrases[ui.phraseId]?.length ?? 16, 1, 255);
  if (ui.screen === "table") return clamp(project.tables[ui.tableId]?.length ?? 16, 1, 64);
  if (ui.screen === "layer") return LAYERS;
  if (ui.screen === "instrument") return 8;
  if (ui.screen === "project") return 5;
  return 1;
}

function colCount(screen: ScreenName): number {
  if (screen === "song") return CHANNELS + 1;
  if (screen === "chain") return 2;
  if (screen === "phrase") return 8;
  if (screen === "table") return 16;
  return 1;
}

function stepGlyph(step: number): string {
  if (step === 0) return "L";
  if (step === 1) return "D";
  if (step === 2) return "U";
  if (step === 3) return "R";
  return "--";
}

function songStepTarget(project: Project, songRow: number): { phraseId: number; row: number } | null {
  const chainId = project.song[songRow]?.[0] ?? -1;
  if (chainId < 0) return null;
  const phraseId = project.chains[chainId]?.steps[0]?.phrase ?? -1;
  if (phraseId < 0) return null;
  const phrase = project.phrases[phraseId];
  if (!phrase || songRow < 0 || songRow >= phrase.length) return null;
  return { phraseId, row: songRow };
}

function phraseText(cell: Cell, col: number): string {
  if (col === 0) return cell.note < 0 ? "---" : noteName(cell.note);
  if (col === 1) return hexOrDash(cell.instrument);
  if (col === 2) return hexOrDash(cell.volume);
  if (col === 3) return hexOrDash(cell.slice);
  if (col === 4) return cell.loop < 0 ? "----" : (cell.loop & 0xffff).toString(16).toUpperCase().padStart(4, "0");
  if (col === 5) return cell.fx.on ? cell.fx.cmd.slice(0, 2).padEnd(2, "-") : "--";
  if (col === 6) return cell.fx.on ? hex2(cell.fx.value) : "--";
  if (col === 7) return stepGlyph(cell.step ?? -1);
  return "";
}

function tableText(row: TableRow, col: number): string {
  if (col === 0) return row.transposeOn ? `${row.transpose >= 0 ? "+" : ""}${row.transpose}` : "---";
  if (col === 1) return hexOrDash(row.slice);
  if (col === 2) return hex2(row.repeatCount ?? 0);
  if (col === 3) return hex2(row.repeatRate ?? 0);
  if (col === 4) return hexOrDash(row.filterMode);
  if (col === 5) return hexOrDash(row.cutoff);
  if (col === 6) return hexOrDash(row.resonance);
  if (col === 7) return hexOrDash(row.crushRate);
  if (col === 8) return hexOrDash(row.crushBits);
  if (col === 9) return hexOrDash(row.vstSlot);
  if (col === 10) return hexOrDash(row.vstParam);
  if (col === 11) return hexOrDash(row.vstValue);
  if (col === 12) return row.fx1.on ? row.fx1.cmd.slice(0, 2) : "--";
  if (col === 13) return row.fx1.on ? hex2(row.fx1.value) : "--";
  if (col === 14) return row.fx2.on ? row.fx2.cmd.slice(0, 2) : "--";
  if (col === 15) return row.fx2.on ? hex2(row.fx2.value) : "--";
  return "";
}

function cellString(project: Project, ui: Ui, row: number, col: number): string {
  if (ui.screen === "song") {
    if (col >= CHANNELS) {
      const target = songStepTarget(project, row);
      if (!target) return "--";
      return stepGlyph(project.phrases[target.phraseId].rows[target.row]?.step ?? -1);
    }
    return hexOrDash(project.song[row]?.[col] ?? -1);
  }
  if (ui.screen === "chain") {
    const step = project.chains[ui.chainId].steps[row];
    if (col === 0) return hexOrDash(step.phrase);
    return `${step.transpose >= 0 ? "+" : ""}${step.transpose}`;
  }
  if (ui.screen === "phrase") return phraseText(cellAt(project.phrases[ui.phraseId], row), col);
  if (ui.screen === "table") return tableText(tableRowAt(project.tables[ui.tableId], row), col);
  return "";
}

function titles(screen: ScreenName): string[] {
  if (screen === "song") return ["C0", "C1", "C2", "C3", "C4", "C5", "C6", "C7", "ST"];
  if (screen === "chain") return ["PH", "TR"];
  if (screen === "phrase") return ["NT", "IN", "VL", "SL", "LP", "FX", "VA", "ST"];
  if (screen === "table") return ["TP", "SL", "RC", "RR", "FM", "CU", "RE", "CR", "CB", "VS", "VP", "VV", "F1", "V1", "F2", "V2"];
  return [];
}

function charsOf(screen: ScreenName, col: number): number {
  if (screen === "phrase" && col === 0) return 3;
  if (screen === "phrase" && col === 4) return 4;
  if (screen === "chain" && col === 1) return 3;
  if (screen === "table" && col === 0) return 3;
  if (screen === "song") return 2;
  return 2;
}

const SCREEN_TITLE: Record<ScreenName, string> = {
  song: "SONG",
  chain: "CHAIN",
  phrase: "PHRASE",
  layer: "RACK",
  table: "TABLE",
  instrument: "INST",
  live: "VIZ",
  project: "PROJECT",
};

function transportWord(ui: Ui, head: PlayHead): string {
  if (!head.playing) return ui.sequencer === "live" ? "LIVE" : "SONG";
  if (head.kind === "phrase") return "PHRASE";
  if (head.kind === "chain") return "CHAIN";
  if (head.kind === "live") return "LIVE";
  return "PLAY";
}

function drawGlyph(
  ctx: CanvasRenderingContext2D,
  value: string,
  x: number,
  y: number,
  ink: string,
  invert: boolean,
  cell = 8,
  boxH = 14,
) {
  const width = Math.max(cell, value.length * cell);
  if (invert) {
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(x - 1, y - 1, width + 2, boxH);
    ctx.fillStyle = "#000000";
  } else {
    ctx.fillStyle = ink;
  }
  ctx.fillText(value, x, y);
}

function spectrumBins(wave: Float32Array, channel: number) {
  const n = 64;
  const bins = [0, 0, 0, 0, 0, 0, 0, 0];
  if (wave.length < (channel + 1) * n) return bins;
  for (let k = 0; k < bins.length; k++) {
    let re = 0;
    let im = 0;
    const w = (2 * Math.PI * (k + 1)) / n;
    for (let i = 0; i < n; i++) {
      const sample = wave[channel * n + i] || 0;
      re += sample * Math.cos(w * i);
      im -= sample * Math.sin(w * i);
    }
    bins[k] = Math.min(1, Math.hypot(re, im) / (n * 0.2));
  }
  return bins;
}

function paint(
  ctx: CanvasRenderingContext2D,
  project: Project,
  ui: Ui,
  head: PlayHead,
  hits: Hit[],
  backdrop = true,
  phone = false,
) {
  hits.length = 0;
  ctx.imageSmoothingEnabled = false;
  ctx.font = phone ? "8px kongtext, monospace" : "12px courier-pixel, monospace";
  ctx.textBaseline = "top";
  ctx.fillStyle = "#000000";
  ctx.fillRect(0, 0, W, H);

  if (backdrop) {
    const t = ui.clock * 0.02;
    for (let i = 0; i < 18; i++) {
      const y = ((i * 37 + ui.clock) % (H + 40)) - 20;
      ctx.fillStyle = i % 2 === 0 ? "#1a1a1a" : "#111111";
      ctx.fillRect(0, y, W, 8 + (i % 5));
      ctx.fillStyle = "#222222";
      ctx.fillRect((Math.sin(t + i) * 0.5 + 0.5) * 700, y, 80, 3);
    }

    if (head.scope.length > 0) {
      ctx.fillStyle = "#dddddd";
      for (let x = 0; x < W; x += 2) {
        const sample = head.scope[(x * (head.scope.length - 1) / W) | 0] || 0;
        const y = H * 0.72 - sample * 40;
        ctx.fillRect(x, y, 2, 2);
      }
    }

    const loud = head.scope.reduce((sum, sample) => sum + Math.abs(sample), 0) / Math.max(1, head.scope.length);
    paintSymbols(ctx, ui.clock, loud);
  }

  if (ui.screen !== "live") {
  ctx.fillStyle = "rgba(0,0,0,0.82)";
  ctx.fillRect(0, 0, W, 18);
  ctx.fillRect(0, 520, W, 20);
  ctx.fillRect(4, 18, 860, 448);

  drawGlyph(ctx, TRACKER_NAME, 8, 3, "#ffffff", false);
  drawGlyph(ctx, TRACKER_VERSION, W - 8 - TRACKER_VERSION.length * 8, 3, "#ffffff", false);
  drawGlyph(ctx, SCREEN_TITLE[ui.screen], 168, 3, "#ffffff", false);
  drawGlyph(ctx, `BPM ${Math.round(project.bpm)}`, 280, 3, "#ffffff", false);
  drawGlyph(ctx, transportWord(ui, head), 360, 3, "#ffffff", false);
  drawGlyph(ctx, `OCT ${ui.octave}`, 440, 3, "#ffffff", false);
  if (ui.screen === "phrase") drawGlyph(ctx, `PH ${hex2(ui.phraseId)}`, 520, 3, "#ffffff", false);
  if (ui.screen === "chain") drawGlyph(ctx, `CH ${hex2(ui.chainId)}`, 520, 3, "#ffffff", false);
  if (ui.screen === "instrument") drawGlyph(ctx, `IN ${hex2(ui.instrumentId)}`, 520, 3, "#ffffff", false);
  drawGlyph(ctx, ui.status.slice(0, 78), 8, 524, "#ffffff", false);

  const heads = titles(ui.screen);
  const rows = rowCount(project, ui);
  const visible = 28;
  if (ui.cursorRow < ui.scroll) ui.scroll = ui.cursorRow;
  if (ui.cursorRow >= ui.scroll + visible) ui.scroll = ui.cursorRow - visible + 1;

  if (heads.length > 0) {
    let x = 56;
    heads.forEach((title, col) => {
      drawGlyph(ctx, title, x, 22, "#bbbbbb", false);
      x += charsOf(ui.screen, col) * 8 + 16;
    });
    for (let i = 0; i < visible; i++) {
      const row = ui.scroll + i;
      if (row >= rows) break;
      const y = 38 + i * 14;
      const playing = head.playing && (
        (ui.screen === "song" && row === head.songRow[0])
        || (ui.screen === "phrase" && row === head.phraseRow[ui.songCursorCol] && head.phraseId[ui.songCursorCol] === ui.phraseId)
        || (ui.screen === "chain" && row === head.chainStep[0])
      );
      if (playing) {
        ctx.fillStyle = "#202020";
        ctx.fillRect(8, y - 1, 820, 14);
      }
      drawGlyph(ctx, hex2(row), 8, y, "#bbbbbb", false);
      let cx = 56;
      for (let col = 0; col < heads.length; col++) {
        const text = cellString(project, ui, row, col);
        const selected = row === ui.cursorRow && col === ui.cursorCol;
        const blank = text.length > 0 && /^[-+0]+$/.test(text) && text.includes("-");
        drawGlyph(ctx, text, cx, y, blank ? "#777777" : "#ffffff", selected);
        const width = Math.max(8, text.length * 8) + 8;
        hits.push({ x: cx - 2, y: y - 1, w: width, h: 14, kind: "cell", row, col });
        cx += charsOf(ui.screen, col) * 8 + 16;
      }
    }
  } else if (ui.screen === "instrument") {
    const inst = project.instruments[ui.instrumentId];
    const type = inst.type === "plugin" ? "PLUGIN" : inst.type === "fm" ? "FM" : inst.type === "sampler" ? "SAMPLER" : "SYNTH";
    const lines = [
      `NAME ${inst.name}`,
      `TYPE ${type}`,
      inst.type === "fm" ? `ALG ${hex2(inst.ym.algorithm)}` : inst.type === "sampler" ? `SMP ${hex2(inst.sampleId)}` : `OSC ${OSCS[clamp(inst.osc, 0, 4)]}`,
      `VOL ${hex2(inst.volume)}`,
      `ATK ${hex2(inst.env.a)}`,
      `DEC ${hex2(inst.env.d)}`,
      `SUS ${hex2(inst.env.s)}`,
      `REL ${hex2(inst.env.r)}`,
    ];
    lines.forEach((line, row) => {
      const y = 40 + row * 16;
      drawGlyph(ctx, line, 16, y, "#ffffff", row === ui.cursorRow);
      hits.push({ x: 16, y, w: 280, h: 16, kind: "cell", row, col: 0 });
    });
    drawGlyph(ctx, "NO PLUGINS   CTRL ARROWS VALUE   CTRL SHIFT N NEW SQUARE", 16, 180, "#bbbbbb", false);
  } else if (ui.screen === "project") {
    const lines = [
      `NAME ${project.name}`,
      `BPM ${Math.round(project.bpm)}`,
      `TPB ${hex2(project.tpb)}`,
      "SAVE  ENTER DOWNLOADS DM2",
      "LOAD  ENTER OPENS A FILE",
    ];
    lines.forEach((line, row) => {
      const y = 40 + row * 16;
      drawGlyph(ctx, line, 16, y, "#ffffff", row === ui.cursorRow);
      hits.push({ x: 16, y, w: 360, h: 16, kind: "cell", row, col: 0 });
    });
  } else if (ui.screen === "layer") {
    const phrase = project.phrases[ui.phraseId];
    for (let layer = 0; layer < LAYERS; layer++) {
      const y = 40 + layer * 18;
      const line = `L${layer}  GAIN ${hex2(phrase.gain[layer] ?? 0)}  ROOT ${phrase.root[layer] ?? 0}`;
      drawGlyph(ctx, line, 16, y, "#ffffff", layer === ui.cursorRow);
      hits.push({ x: 16, y, w: 280, h: 16, kind: "cell", row: layer, col: 0 });
    }
  }
  }

  const letters = ["S", "C", "P", "L", "T", "I", "V", "R"];
  letters.forEach((letter, i) => {
    const col = i % 4;
    const row = Math.floor(i / 4);
    const x = 864 + col * 24;
    const y = 420 + row * 24;
    const on = SCREENS[i] === ui.screen;
    ctx.fillStyle = on ? "#ffffff" : "#444444";
    ctx.fillRect(x, y, 22, 22);
    drawGlyph(ctx, letter, x + 3, y + 4, on ? "#000000" : "#222222", false);
    hits.push({ x, y, w: 22, h: 22, kind: "map", row, col: i });
  });

  for (let ch = 0; ch < CHANNELS; ch++) {
    const x = 8 + ch * 118;
    const y = 472;
    ctx.fillStyle = "#000000";
    ctx.fillRect(x, y, 112, 44);
    ctx.fillStyle = head.playing && ui.screen === "song" && ui.cursorCol === ch ? "#ffffff" : "#333333";
    ctx.fillRect(x, y, 112, 1);
    ctx.fillRect(x, y + 43, 112, 1);
    ctx.fillRect(x, y, 1, 44);
    ctx.fillRect(x + 111, y, 1, 44);
    const name = head.muted[ch] ? `X${ch}` : `C${ch}`;
    drawGlyph(ctx, name, x + 4, y + 2, head.muted[ch] ? "#555555" : "#ffffff", false);
    const bins = spectrumBins(head.wave, ch);
    ctx.fillStyle = head.muted[ch] ? "#333333" : "#ffffff";
    for (let k = 0; k < bins.length; k++) {
      const bh = Math.max(1, Math.round(bins[k] * 22));
      ctx.fillRect(x + 4 + k * 13, y + 40 - bh, 11, bh);
    }
    hits.push({ x, y, w: 112, h: 44, kind: "mixer", row: 0, col: ch });
  }
}

function goTo(project: Project, ui: Ui, next: ScreenName, reset: boolean) {
  if (ui.screen === "song" && next !== "song") {
    ui.songCursorRow = clamp(ui.cursorRow, 0, SONG_ROWS - 1);
    ui.songCursorCol = clamp(ui.cursorCol, 0, CHANNELS - 1);
  }
  if (next === "chain" && ui.screen === "song") {
    const id = project.song[clamp(ui.cursorRow, 0, SONG_ROWS - 1)][clamp(ui.cursorCol, 0, CHANNELS - 1)];
    if (id >= 0) ui.chainId = id;
  }
  if (next === "phrase" && ui.screen === "chain") {
    const id = project.chains[ui.chainId].steps[clamp(ui.cursorRow, 0, CHAIN_STEPS - 1)].phrase;
    if (id >= 0) ui.phraseId = id;
  }
  ui.screen = next;
  ui.nibble = 0;
  ui.scroll = 0;
  if (reset) {
    ui.cursorRow = 0;
    ui.cursorCol = 0;
  } else {
    ui.cursorRow = clamp(ui.cursorRow, 0, Math.max(0, rowCount(project, ui) - 1));
    ui.cursorCol = clamp(ui.cursorCol, 0, Math.max(0, colCount(next) - 1));
  }
  if (next === "phrase") ui.status = `PHRASE ${hex2(ui.phraseId)}`;
  else if (next === "chain") ui.status = `CHAIN ${hex2(ui.chainId)}`;
  else if (next === "live") ui.status = "VIZ";
  else if (next === "instrument") ui.status = `INST ${hex2(ui.instrumentId)}  NO PLUGINS`;
  else ui.status = SCREEN_TITLE[next];
}

function movePage(project: Project, ui: Ui, dCol: number, dRow: number) {
  const index = SCREENS.indexOf(ui.screen);
  const col = clamp((index % 4) + dCol, 0, 3);
  const row = clamp(Math.floor(index / 4) + dRow, 0, 1);
  goTo(project, ui, SCREENS[row * 4 + col], false);
}

function nudgeInstrument(project: Project, ui: Ui, delta: number, coarse: boolean) {
  const inst = project.instruments[ui.instrumentId];
  const step = coarse ? 16 : delta;
  const signed = coarse ? (delta > 0 ? step : -step) : delta;
  inst.used = true;
  if (ui.cursorRow === 1) {
    const order: InstType[] = ["synth", "sampler", "fm"];
    const index = Math.max(0, order.indexOf(inst.type === "plugin" ? "synth" : inst.type));
    inst.type = order[(index + (delta > 0 ? 1 : order.length - 1)) % order.length];
    ui.status = `TYPE ${inst.type.toUpperCase()}`;
  } else if (ui.cursorRow === 2 && inst.type === "fm") {
    inst.ym.algorithm = clamp(inst.ym.algorithm + delta, 0, 7);
    ui.status = `ALG ${hex2(inst.ym.algorithm)}`;
  } else if (ui.cursorRow === 2 && inst.type === "sampler") {
    const ids = project.samples.map((sample) => sample.id);
    if (ids.length === 0) return;
    const index = Math.max(0, ids.indexOf(inst.sampleId));
    const next = ids[(index + (delta > 0 ? 1 : ids.length - 1)) % ids.length];
    inst.sampleId = next;
    if (inst.layers[0]) inst.layers[0].sampleId = next;
    ui.status = project.samples.find((sample) => sample.id === next)?.name ?? "SAMPLE";
  } else if (ui.cursorRow === 2) {
    inst.osc = clamp(inst.osc + delta, 0, 4);
    ui.status = OSCS[inst.osc];
  } else if (ui.cursorRow === 3) {
    inst.volume = clamp(inst.volume + signed, 0, 127);
  } else if (ui.cursorRow === 4) inst.env.a = clamp(inst.env.a + signed, 0, 127);
  else if (ui.cursorRow === 5) inst.env.d = clamp(inst.env.d + signed, 0, 127);
  else if (ui.cursorRow === 6) inst.env.s = clamp(inst.env.s + signed, 0, 127);
  else if (ui.cursorRow === 7) inst.env.r = clamp(inst.env.r + signed, 0, 127);
}

function applyHex(project: Project, ui: Ui, digit: number) {
  const put = putHex;
  if (ui.screen === "song") {
    if (ui.cursorCol >= CHANNELS) return;
    const slot = project.song[ui.cursorRow][ui.cursorCol];
    const next = put(slot < 0 ? 0 : slot, slot < 0, digit, ui.nibble);
    ui.nibble = next.nibble;
    const id = clamp(next.value, 0, 255);
    project.song[ui.cursorRow][ui.cursorCol] = id;
    project.chains[id].used = true;
    ui.status = `CHAIN ${hex2(id)}`;
    return;
  }
  if (ui.screen === "chain" && ui.cursorCol === 0) {
    const step = project.chains[ui.chainId].steps[ui.cursorRow];
    const next = put(step.phrase < 0 ? 0 : step.phrase, step.phrase < 0, digit, ui.nibble);
    ui.nibble = next.nibble;
    step.phrase = clamp(next.value, 0, 255);
    project.chains[ui.chainId].used = true;
    project.phrases[step.phrase].used = true;
    ui.status = `PHRASE ${hex2(step.phrase)}`;
    return;
  }
  if (ui.screen === "phrase") {
    const cell = cellAt(project.phrases[ui.phraseId], ui.cursorRow);
    project.phrases[ui.phraseId].used = true;
    if (ui.cursorCol === 1) {
      const next = put(cell.instrument < 0 ? 0 : cell.instrument, cell.instrument < 0, digit, ui.nibble);
      ui.nibble = next.nibble;
      cell.instrument = clamp(next.value, 0, 255);
      const inst = project.instruments[cell.instrument];
      if (!inst.used) {
        blankInstrument(project, cell.instrument);
        seedNote(cell);
        ui.instrumentId = cell.instrument;
        ui.status = `NEW INST ${hex2(cell.instrument)}  SQUARE`;
      } else {
        ui.instrumentId = cell.instrument;
        ui.status = `IN ${hex2(cell.instrument)}`;
      }
    } else if (ui.cursorCol === 2) {
      const next = put(cell.volume < 0 ? 0 : cell.volume, cell.volume < 0, digit, ui.nibble);
      ui.nibble = next.nibble;
      cell.volume = clamp(next.value, 0, 255);
    } else if (ui.cursorCol === 3) {
      const next = put(cell.slice < 0 ? 0 : cell.slice, cell.slice < 0, digit, ui.nibble);
      ui.nibble = next.nibble;
      cell.slice = clamp(next.value, 0, 255);
    } else if (ui.cursorCol === 6) {
      const next = put(cell.fx.value, !cell.fx.on, digit, ui.nibble);
      ui.nibble = next.nibble;
      cell.fx.on = true;
      cell.fx.value = clamp(next.value, 0, 255);
    }
    return;
  }
  if (ui.screen === "table") {
    const row = tableRowAt(project.tables[ui.tableId], ui.cursorRow);
    project.tables[ui.tableId].used = true;
    const write = (current: number) => {
      const next = put(current < 0 ? 0 : current, current < 0, digit, ui.nibble);
      ui.nibble = next.nibble;
      return clamp(next.value, 0, 255);
    };
    const field = [
      null,
      () => { row.slice = write(row.slice); },
      () => { row.repeatCount = write(row.repeatCount); },
      () => { row.repeatRate = write(row.repeatRate); },
      () => { row.filterMode = write(row.filterMode); },
      () => { row.cutoff = write(row.cutoff); },
      () => { row.resonance = write(row.resonance); },
      () => { row.crushRate = write(row.crushRate); },
      () => { row.crushBits = write(row.crushBits); },
      () => { row.vstSlot = write(row.vstSlot); },
      () => { row.vstParam = write(row.vstParam); },
      () => { row.vstValue = write(row.vstValue); },
      null,
      () => { row.fx1.on = true; row.fx1.value = write(row.fx1.value); },
      null,
      () => { row.fx2.on = true; row.fx2.value = write(row.fx2.value); },
    ][ui.cursorCol];
    field?.();
  }
}

function nudgeCell(project: Project, ui: Ui, delta: number, coarse: boolean) {
  if (delta === 0) return;
  if (ui.screen === "song") {
    if (ui.cursorCol >= CHANNELS) {
      const target = songStepTarget(project, ui.cursorRow);
      if (!target) {
        ui.status = "NO PHRASE";
        return;
      }
      const cell = cellAt(project.phrases[target.phraseId], target.row);
      cell.step = cycleStep(cell.step ?? -1, delta);
      project.phrases[target.phraseId].used = true;
      ui.status = `STEP ${stepGlyph(cell.step)}`;
      return;
    }
    const id = stepHex(project.song[ui.cursorRow][ui.cursorCol], delta, coarse);
    project.song[ui.cursorRow][ui.cursorCol] = id;
    project.chains[id].used = true;
    ui.status = `CHAIN ${hex2(id)}`;
    return;
  }
  if (ui.screen === "chain") {
    const step = project.chains[ui.chainId].steps[ui.cursorRow];
    project.chains[ui.chainId].used = true;
    if (ui.cursorCol === 0) {
      step.phrase = stepHex(step.phrase, delta, coarse);
      project.phrases[step.phrase].used = true;
      ui.status = `PHRASE ${hex2(step.phrase)}`;
    } else {
      step.transpose = stepKnob(step.transpose, delta, coarse, -48, 48, 12);
      ui.status = `TR ${step.transpose}`;
    }
    return;
  }
  if (ui.screen === "phrase") {
    const cell = cellAt(project.phrases[ui.phraseId], ui.cursorRow);
    project.phrases[ui.phraseId].used = true;
    if (ui.cursorCol === 0) {
      if (cell.note < 0) cell.note = clamp((ui.octave + 1) * 12, 0, 127);
      const next = cell.note + (coarse ? delta * 12 : delta);
      if (next >= 0 && next <= 127) cell.note = next;
      if (cell.instrument < 0) cell.instrument = 0;
      if (cell.volume < 0) cell.volume = 0x80;
      ui.status = noteName(cell.note);
    } else if (ui.cursorCol === 1) {
      cell.instrument = stepHex(cell.instrument, delta, coarse);
      ui.instrumentId = cell.instrument;
      ui.status = `IN ${hex2(cell.instrument)}`;
    } else if (ui.cursorCol === 2) {
      cell.volume = stepHex(cell.volume, delta, coarse);
      ui.status = `VL ${hex2(cell.volume)}`;
    } else if (ui.cursorCol === 3) {
      cell.slice = stepHex(cell.slice, delta, coarse);
      ui.status = `SL ${hex2(cell.slice)}`;
    } else if (ui.cursorCol === 4) {
      const next = stepHex(cell.loop < 0 ? -1 : cell.loop & 0xff, delta, coarse);
      cell.loop = next;
      ui.status = `LP ${next.toString(16).toUpperCase().padStart(4, "0")}`;
    } else if (ui.cursorCol === 5) {
      stepCmd(cell.fx, delta, coarse);
      ui.status = `FX ${cell.fx.cmd}`;
    } else if (ui.cursorCol === 6) {
      cell.fx.value = stepHex(cell.fx.on ? cell.fx.value : -1, delta, coarse);
      cell.fx.on = true;
      if (!cell.fx.cmd) cell.fx.cmd = "00";
      ui.status = `VA ${hex2(cell.fx.value)}`;
    } else if (ui.cursorCol === 7) {
      cell.step = cycleStep(cell.step ?? -1, delta);
      ui.status = `STEP ${stepGlyph(cell.step)}`;
    }
    return;
  }
  if (ui.screen === "table") {
    const row = tableRowAt(project.tables[ui.tableId], ui.cursorRow);
    project.tables[ui.tableId].used = true;
    if (ui.cursorCol === 0) {
      if (!row.transposeOn) row.transpose = 0;
      row.transposeOn = true;
      row.transpose = stepKnob(row.transpose, delta, coarse, -48, 48, 12);
      ui.status = `TP ${row.transpose}`;
    } else if (ui.cursorCol === 1) row.slice = stepHex(row.slice, delta, coarse);
    else if (ui.cursorCol === 2) row.repeatCount = stepHex(row.repeatCount, delta, coarse);
    else if (ui.cursorCol === 3) row.repeatRate = stepHex(row.repeatRate, delta, coarse);
    else if (ui.cursorCol === 4) row.filterMode = stepKnob(row.filterMode, delta, coarse, 0, 2, 1);
    else if (ui.cursorCol === 5) row.cutoff = stepHex(row.cutoff, delta, coarse);
    else if (ui.cursorCol === 6) row.resonance = stepHex(row.resonance, delta, coarse);
    else if (ui.cursorCol === 7) row.crushRate = stepHex(row.crushRate, delta, coarse);
    else if (ui.cursorCol === 8) row.crushBits = stepKnob(row.crushBits, delta, coarse, 0, 16, 4);
    else if (ui.cursorCol === 9) row.vstSlot = stepHex(row.vstSlot, delta, coarse);
    else if (ui.cursorCol === 10) row.vstParam = stepHex(row.vstParam, delta, coarse);
    else if (ui.cursorCol === 11) row.vstValue = stepHex(row.vstValue, delta, coarse);
    else if (ui.cursorCol === 12) stepCmd(row.fx1, delta, coarse);
    else if (ui.cursorCol === 13) {
      row.fx1.value = stepHex(row.fx1.on ? row.fx1.value : -1, delta, coarse);
      row.fx1.on = true;
    } else if (ui.cursorCol === 14) stepCmd(row.fx2, delta, coarse);
    else {
      row.fx2.value = stepHex(row.fx2.on ? row.fx2.value : -1, delta, coarse);
      row.fx2.on = true;
    }
  }
}

function clearCell(project: Project, ui: Ui) {
  if (ui.screen === "song") {
    if (ui.cursorCol >= CHANNELS) {
      const target = songStepTarget(project, ui.cursorRow);
      if (target) cellAt(project.phrases[target.phraseId], target.row).step = -1;
    } else project.song[ui.cursorRow][ui.cursorCol] = -1;
  } else if (ui.screen === "chain" && ui.cursorCol === 0) project.chains[ui.chainId].steps[ui.cursorRow].phrase = -1;
  else if (ui.screen === "phrase") {
    const cell = cellAt(project.phrases[ui.phraseId], ui.cursorRow);
    if (ui.cursorCol === 0) cell.note = -1;
    else if (ui.cursorCol === 1) cell.instrument = -1;
    else if (ui.cursorCol === 2) cell.volume = -1;
    else if (ui.cursorCol === 3) cell.slice = -1;
    else if (ui.cursorCol === 5) cell.fx.on = false;
    else if (ui.cursorCol === 7) cell.step = -1;
  }
  ui.nibble = 0;
  ui.status = "CLEARED";
}

function onEnter(project: Project, ui: Ui) {
  if (ui.screen === "song" && ui.cursorCol >= CHANNELS) {
    const target = songStepTarget(project, ui.cursorRow);
    if (!target) {
      ui.status = "NO PHRASE";
      return;
    }
    ui.phraseId = target.phraseId;
    goTo(project, ui, "phrase", true);
    ui.cursorCol = 7;
    ui.cursorRow = target.row;
    ui.status = `PHRASE ${hex2(target.phraseId)}  STEP`;
    return;
  }
  if (ui.screen === "song") {
    const row = clamp(ui.cursorRow, 0, SONG_ROWS - 1);
    const col = clamp(ui.cursorCol, 0, CHANNELS - 1);
    if (project.song[row][col] < 0) {
      const id = project.chains.findIndex((chain) => !chain.used);
      if (id < 0) {
        ui.status = "NO FREE CHAIN";
        return;
      }
      project.song[row][col] = id;
      project.chains[id].used = true;
    }
    goTo(project, ui, "chain", true);
    return;
  }
  if (ui.screen === "chain") {
    const step = project.chains[ui.chainId].steps[clamp(ui.cursorRow, 0, CHAIN_STEPS - 1)];
    if (step.phrase < 0) {
      let id = project.phrases.findIndex((phrase) => !phrase.used);
      if (id < 0) id = 0;
      step.phrase = id;
      project.phrases[id].used = true;
      project.chains[ui.chainId].used = true;
    }
    ui.phraseId = step.phrase;
    goTo(project, ui, "phrase", true);
    return;
  }
  if (ui.screen === "phrase" && ui.cursorCol === 1) {
    const cell = cellAt(project.phrases[ui.phraseId], ui.cursorRow);
    if (cell.instrument >= 0) ui.instrumentId = cell.instrument;
    goTo(project, ui, "instrument", true);
    return;
  }
  if (ui.screen === "project" && ui.cursorRow === 3) ui.status = "SAVE";
  if (ui.screen === "project" && ui.cursorRow === 4) ui.status = "LOAD";
}

interface TrackerProps {
  isFocused: boolean;
  /** Scrolling field, scope, and symbol flights behind the grid. Phone route turns this off. */
  backdrop?: boolean;
  /** Phone route: Kongtext in the grid. Desktop keeps Courier Pixel. */
  phone?: boolean;
}

export function DesktopTracker({ isFocused, backdrop = true, phone = false }: TrackerProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const projectRef = useRef<Project>(loadProject());
  const uiRef = useRef<Ui>(freshUi());
  const headRef = useRef<PlayHead>(emptyHead());
  const hitsRef = useRef<Hit[]>([]);
  const playerRef = useRef<WebPlayer | null>(null);
  const sampleInput = useRef<HTMLInputElement>(null);
  const projectInput = useRef<HTMLInputElement>(null);
  const focusedRef = useRef(isFocused);
  focusedRef.current = isFocused;
  const backdropRef = useRef(backdrop);
  backdropRef.current = backdrop;
  const phoneRef = useRef(phone);
  phoneRef.current = phone;

  useEffect(() => {
    if (backdrop) loadSymbols();
  }, [backdrop]);

  useEffect(() => {
    if (!phone) return;
    void document.fonts.load("8px kongtext");
  }, [phone]);

  useEffect(() => {
    const player = new WebPlayer();
    playerRef.current = player;
    player.onHead((head) => {
      headRef.current = head;
    });
    player.onStatus((text) => {
      uiRef.current.status = text;
    });
    return () => {
      player.close();
    };
  }, []);

  useEffect(() => {
    let cancel = false;
    const project = projectRef.current;
    const reshape = isUntouchedFactory(project);
    const refill = amenNeedsAudio(project);
    if (!reshape && !refill) return;
    void (async () => {
      try {
        const response = await fetch(AMEN_URL);
        if (!response.ok) throw new Error("missing");
        const decoded = await decodeWav(await response.arrayBuffer());
        if (cancel) return;
        installAmenBreak(
          projectRef.current,
          { id: 0, name: "AMEN", rate: decoded.rate, pcm: decoded.pcm },
          reshape,
        );
        uiRef.current.status = "AMEN";
        try {
          localStorage.setItem(STORAGE, serialize(projectRef.current, false));
        } catch {
          uiRef.current.status = "AMEN";
        }
        void playerRef.current?.resume().then(() => {
          if (!cancel) playerRef.current?.pushProject(projectRef.current);
        });
      } catch {
        if (!cancel) uiRef.current.status = "AMEN MISSING";
      }
    })();
    return () => {
      cancel = true;
    };
  }, []);

  useEffect(() => {
    let frame = 0;
    const loop = () => {
      const canvas = canvasRef.current;
      const ctx = canvas?.getContext("2d");
      if (ctx) {
        uiRef.current.clock += 1;
        paint(ctx, projectRef.current, uiRef.current, headRef.current, hitsRef.current, backdropRef.current, phoneRef.current);
      }
      frame = requestAnimationFrame(loop);
    };
    frame = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(frame);
  }, []);

  useEffect(() => {
    const sync = () => {
      const project = projectRef.current;
      try {
        localStorage.setItem(STORAGE, serialize(project, false));
      } catch {
        uiRef.current.status = "PATTERN TOO LARGE FOR THIS BROWSER";
      }
      void playerRef.current?.resume().then(() => playerRef.current?.pushProject(project));
    };

    const onKey = (event: KeyboardEvent) => {
      if (!focusedRef.current) return;
      const target = event.target as HTMLElement | null;
      if (target && (target.tagName === "INPUT" || target.tagName === "TEXTAREA")) return;
      const ui = uiRef.current;
      const project = projectRef.current;
      const key = event.key;
      const code = event.code;
      const stamped = (window as Window & { __thrashMods?: { shift: boolean; ctrl: boolean; alt: boolean } | null }).__thrashMods;
      const ctrl = event.ctrlKey || event.metaKey || !!stamped?.ctrl;
      const shift = event.shiftKey || !!stamped?.shift;
      const alt = event.altKey || !!stamped?.alt;

      if (key === " " || key.startsWith("Arrow") || key.startsWith("F") || key === "Escape" || key === "Enter" || key === "Backspace" || key === "Delete") {
        event.preventDefault();
      }

      if (phoneRef.current && (code === "PageDown" || code === "PageUp") && (shift || ctrl) && !alt) {
        event.preventDefault();
        const index = Math.max(0, SCREENS.indexOf(ui.screen));
        const delta = code === "PageDown" ? 1 : -1;
        const next = (index + delta + SCREENS.length) % SCREENS.length;
        goTo(project, ui, SCREENS[next], true);
        return;
      }

      if (ctrl && !shift && (key === "s" || key === "S")) {
        event.preventDefault();
        const blob = new Blob([serialize(project, true)], { type: "application/json" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = `${project.name || "SONG"}.dm2.json`;
        link.click();
        URL.revokeObjectURL(url);
        ui.status = "SAVED";
        return;
      }
      if (ctrl && !shift && (key === "o" || key === "O")) {
        event.preventDefault();
        projectInput.current?.click();
        return;
      }
      if (ctrl && shift && (key === "n" || key === "N")) {
        event.preventDefault();
        const id = nextFreeInstrument(project);
        blankInstrument(project, id);
        ui.instrumentId = id;
        ui.status = `NEW INST ${hex2(id)}  SQUARE`;
        sync();
        return;
      }
      if (key === "Escape") {
        playerRef.current?.send({ type: "stop" });
        ui.status = "STOP";
        return;
      }
      if (key === " " ) {
        event.preventDefault();
        const player = playerRef.current;
        void player?.resume().then(() => {
          player.pushProject(project);
          if (headRef.current.playing && !shift && ui.screen !== "chain" && ui.screen !== "phrase") {
            player.send({ type: "stop" });
            ui.status = "STOP";
            return;
          }
          if (ui.screen === "chain" && !shift) {
            player.send({
              type: "audition",
              kind: "chain",
              channel: ui.songCursorCol,
              songRow: ui.songCursorRow,
              chainStep: ui.cursorRow,
              chainId: ui.chainId,
            });
          } else if (ui.screen === "phrase" && !shift) {
            player.send({
              type: "audition",
              kind: "phrase",
              channel: ui.songCursorCol,
              songRow: ui.songCursorRow,
              chainStep: 0,
              phraseId: ui.phraseId,
            });
          } else {
            player.send({ type: "song", row: ui.screen === "song" ? ui.cursorRow : ui.songCursorRow });
          }
          ui.status = "PLAY";
        });
        return;
      }

      const pageCode = ["F1", "F2", "F3", "F4", "F5", "F6", "F7", "F8"].indexOf(code);
      if ((shift || ctrl) && !alt && pageCode >= 0) {
        event.preventDefault();
        goTo(project, ui, SCREENS[pageCode], true);
        return;
      }

      if (ui.screen === "live") {
        if (key.startsWith("Arrow") && shift && !ctrl && !alt) {
          const dCol = key === "ArrowLeft" ? -1 : key === "ArrowRight" ? 1 : 0;
          const dRow = key === "ArrowUp" ? -1 : key === "ArrowDown" ? 1 : 0;
          movePage(project, ui, dCol, dRow);
        }
        return;
      }

      const stepLetter = { l: 0, d: 1, u: 2, r: 3 }[key.toLowerCase()];
      const onStepCol = (ui.screen === "phrase" && ui.cursorCol === 7) || (ui.screen === "song" && ui.cursorCol >= CHANNELS);
      if (onStepCol && stepLetter !== undefined && !ctrl && !alt) {
        if (ui.screen === "phrase") {
          const cell = cellAt(project.phrases[ui.phraseId], ui.cursorRow);
          cell.step = stepLetter;
          project.phrases[ui.phraseId].used = true;
        } else {
          const target = songStepTarget(project, ui.cursorRow);
          if (!target) {
            ui.status = "NO PHRASE";
            return;
          }
          cellAt(project.phrases[target.phraseId], target.row).step = stepLetter;
          project.phrases[target.phraseId].used = true;
        }
        ui.status = `STEP ${stepGlyph(stepLetter)}`;
        sync();
        return;
      }

      if (ui.screen === "song" && ui.cursorCol < CHANNELS && !ctrl && !alt && (key === "x" || key === "X")) {
        playerRef.current?.send(shift ? { type: "solo", channel: ui.cursorCol } : { type: "mute", channel: ui.cursorCol });
        ui.status = shift ? `C${ui.cursorCol} ONLY` : `C${ui.cursorCol}`;
        return;
      }
      if (ui.screen === "song" && !ctrl && !alt && key.toLowerCase() === "z") {
        playerRef.current?.send({ type: "awake" });
        ui.status = "ALL AWAKE";
        return;
      }
      if (ui.screen === "song" && ui.cursorCol < CHANNELS && !ctrl && !alt && key.toLowerCase() === "l") {
        ui.sequencer = ui.sequencer === "live" ? "song" : "live";
        playerRef.current?.send({ type: "sequencer", mode: ui.sequencer });
        ui.status = ui.sequencer === "live" ? "LIVE" : "SONG";
        return;
      }

      if (key.startsWith("Arrow")) {
        event.preventDefault();
        const dCol = key === "ArrowLeft" ? -1 : key === "ArrowRight" ? 1 : 0;
        const dRow = key === "ArrowUp" ? -1 : key === "ArrowDown" ? 1 : 0;
        if (shift && !ctrl && !alt) {
          movePage(project, ui, dCol, dRow);
          return;
        }
        if (ctrl && shift && ui.screen === "phrase" && dCol !== 0) {
          ui.phraseId = clamp(ui.phraseId + dCol, 0, SLOTS - 1);
          project.phrases[ui.phraseId].used = true;
          ui.status = `PHRASE ${hex2(ui.phraseId)}`;
          return;
        }
        if (ctrl && shift && ui.screen === "chain" && dCol !== 0) {
          ui.chainId = clamp(ui.chainId + dCol, 0, SLOTS - 1);
          ui.status = `CHAIN ${hex2(ui.chainId)}`;
          return;
        }
        if (ctrl && !shift) {
          const delta = dRow !== 0 ? -dRow : dCol;
          const coarse = dRow !== 0;
          if (ui.screen === "instrument") nudgeInstrument(project, ui, delta, coarse);
          else if (ui.screen === "project" && ui.cursorRow === 1) project.bpm = clamp(project.bpm + (coarse ? delta * 4 : delta), 40, 240);
          else if (ui.screen === "project" && ui.cursorRow === 2) project.tpb = clamp(project.tpb + delta, 1, 16);
          else if (ui.screen === "layer") {
            const phrase = project.phrases[ui.phraseId];
            phrase.gain[ui.cursorRow] = clamp((phrase.gain[ui.cursorRow] ?? 0) + (coarse ? delta * 8 : delta), 0, 127);
          } else nudgeCell(project, ui, delta, coarse);
          sync();
          return;
        }
        ui.nibble = 0;
        ui.cursorRow = clamp(ui.cursorRow + dRow, 0, Math.max(0, rowCount(project, ui) - 1));
        ui.cursorCol = clamp(ui.cursorCol + dCol, 0, Math.max(0, colCount(ui.screen) - 1));
        return;
      }

      if (key === "[" || key === "]") {
        if (ui.screen === "phrase") {
          const phrase = project.phrases[ui.phraseId];
          phrase.length = clamp(phrase.length + (key === "]" ? 1 : -1), 1, 255);
          ui.status = `LEN ${hex2(phrase.length)}`;
          sync();
        }
        return;
      }
      if (key === "-" || key === "_") {
        ui.octave = clamp(ui.octave - 1, 0, 8);
        return;
      }
      if (key === "=" || key === "+") {
        ui.octave = clamp(ui.octave + 1, 0, 8);
        return;
      }
      if (key === "Backspace" || key === "Delete") {
        if (key === "Backspace" && ui.screen === "instrument" && ui.cursorRow === 0) {
          const inst = project.instruments[ui.instrumentId];
          inst.name = inst.name.slice(0, -1);
          sync();
          return;
        }
        if (key === "Backspace" && ui.screen === "project" && ui.cursorRow === 0) {
          project.name = project.name.slice(0, -1);
          sync();
          return;
        }
        clearCell(project, ui);
        sync();
        return;
      }
      if (key === "Enter") {
        const before = ui.status;
        onEnter(project, ui);
        if (ui.screen === "project" && before !== "SAVE" && ui.status === "SAVE") {
          const blob = new Blob([serialize(project, true)], { type: "application/json" });
          const url = URL.createObjectURL(blob);
          const link = document.createElement("a");
          link.href = url;
          link.download = `${project.name || "SONG"}.dm2.json`;
          link.click();
          URL.revokeObjectURL(url);
        }
        if (ui.status === "LOAD") projectInput.current?.click();
        if (ui.screen === "instrument" && project.instruments[ui.instrumentId].type === "sampler") sampleInput.current?.click();
        sync();
        return;
      }

      if (ui.screen === "phrase" && ui.cursorCol === 0 && !ctrl && !alt) {
        const note = pianoNote(key, ui.octave);
        if (note >= 0) {
          const cell = cellAt(project.phrases[ui.phraseId], ui.cursorRow);
          cell.note = note;
          if (cell.instrument < 0) cell.instrument = 0;
          if (cell.volume < 0) cell.volume = 0x80;
          project.phrases[ui.phraseId].used = true;
          ui.status = noteName(note);
          sync();
          return;
        }
      }
      if (ui.screen === "table" && (ui.cursorCol === 12 || ui.cursorCol === 14) && key.length === 1 && /[a-zA-Z]/.test(key)) {
        const row = tableRowAt(project.tables[ui.tableId], ui.cursorRow);
        const fx = ui.cursorCol === 12 ? row.fx1 : row.fx2;
        const letter = key.toUpperCase();
        project.tables[ui.tableId].used = true;
        if (ui.nibble === 0) {
          fx.cmd = letter + "-";
          fx.on = true;
          ui.nibble = 1;
        } else {
          fx.cmd = (fx.cmd[0] || "-") + letter;
          ui.nibble = 0;
        }
        sync();
        return;
      }
      if (ui.screen === "phrase" && ui.cursorCol === 5 && key.length === 1 && /[a-zA-Z]/.test(key)) {
        const cell = cellAt(project.phrases[ui.phraseId], ui.cursorRow);
        const letter = key.toUpperCase();
        if (ui.nibble === 0) {
          cell.fx.cmd = letter + "-";
          cell.fx.on = true;
          ui.nibble = 1;
        } else {
          cell.fx.cmd = (cell.fx.cmd[0] || "-") + letter;
          ui.nibble = 0;
        }
        sync();
        return;
      }
      if (ui.screen === "instrument" && ui.cursorRow === 0 && key.length === 1 && !ctrl && !alt) {
        const inst = project.instruments[ui.instrumentId];
        if (inst.name.length < 16) inst.name = (inst.name + key.toUpperCase()).slice(0, 16);
        inst.used = true;
        sync();
        return;
      }
      if (ui.screen === "project" && ui.cursorRow === 0 && key.length === 1 && !ctrl && !alt) {
        if (project.name.length < 16) project.name = (project.name + key.toUpperCase()).slice(0, 16);
        sync();
        return;
      }

      const digit = hexDigit(key);
      if (digit >= 0 && !ctrl && !alt) {
        applyHex(project, ui, digit);
        sync();
      }
    };

    const onNote = (event: Event) => {
      if (!focusedRef.current) return;
      const detail = (event as CustomEvent<{ key?: string }>).detail;
      const key = (detail?.key ?? "").toLowerCase();
      const ui = uiRef.current;
      const project = projectRef.current;
      const note = pianoNote(key, ui.octave);
      if (note < 0) return;
      if (ui.screen !== "phrase") goTo(project, ui, "phrase", false);
      ui.cursorCol = 0;
      const cell = cellAt(project.phrases[ui.phraseId], ui.cursorRow);
      cell.note = note;
      if (cell.instrument < 0) cell.instrument = 0;
      if (cell.volume < 0) cell.volume = 0x80;
      project.phrases[ui.phraseId].used = true;
      ui.status = noteName(note);
      const instrument = cell.instrument;
      try {
        localStorage.setItem(STORAGE, serialize(project, false));
      } catch {
        ui.status = "PATTERN TOO LARGE FOR THIS BROWSER";
      }
      void playerRef.current?.resume().then(() => {
        playerRef.current?.pushProject(project);
        playerRef.current?.tap(note, instrument);
      });
    };

    window.addEventListener("keydown", onKey, true);
    window.addEventListener("thrash-note", onNote);
    return () => {
      window.removeEventListener("keydown", onKey, true);
      window.removeEventListener("thrash-note", onNote);
    };
  }, []);

  const pointOf = (event: React.MouseEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    const scale = Math.min(rect.width / W, rect.height / H);
    const drawW = W * scale;
    const drawH = H * scale;
    const ox = rect.left + (rect.width - drawW) / 2;
    const oy = rect.top + (rect.height - drawH) / 2;
    return { x: (event.clientX - ox) / scale, y: (event.clientY - oy) / scale };
  };

  return (
    <div style={{ width: "100%", height: "100%", background: "#000000", position: "relative", overflow: "hidden" }}>
      <canvas
        ref={canvasRef}
        width={W}
        height={H}
        tabIndex={0}
        onMouseDown={(event) => {
          const ui = uiRef.current;
          const { x, y } = pointOf(event);
          const hit = [...hitsRef.current].reverse().find((item) => x >= item.x && y >= item.y && x < item.x + item.w && y < item.y + item.h);
          if (!hit) return;
          if (hit.kind === "map" && ui.screen !== "live") {
            goTo(projectRef.current, ui, SCREENS[hit.col], true);
            return;
          }
          if (hit.kind === "mixer") {
            ui.cursorCol = hit.col;
            if (ui.screen === "song") playerRef.current?.send({ type: "mute", channel: hit.col });
            return;
          }
          ui.cursorRow = hit.row;
          ui.cursorCol = hit.col;
          ui.nibble = 0;
        }}
        style={{
          width: "100%",
          height: "100%",
          display: "block",
          imageRendering: "pixelated",
          objectFit: "contain",
          background: "#000000",
          outline: "none",
          touchAction: "manipulation",
        }}
      />
      <input
        ref={sampleInput}
        type="file"
        accept="audio/*,.wav,.mp3,.flac,.ogg"
        style={{ display: "none" }}
        onChange={(event) => {
          const file = event.target.files?.[0];
          event.target.value = "";
          if (!file) return;
          void file.arrayBuffer().then(async (buffer) => {
            const player = playerRef.current;
            if (!player) return;
            const decoded = await player.decodeSample(buffer);
            const project = projectRef.current;
            const id = project.samples.reduce((max, sample) => Math.max(max, sample.id), -1) + 1;
            project.samples.push({ id, name: file.name.slice(0, 16).toUpperCase(), rate: decoded.rate, pcm: decoded.pcm });
            const inst = project.instruments[uiRef.current.instrumentId];
            inst.used = true;
            inst.type = "sampler";
            inst.sampleId = id;
            inst.name = file.name.replace(/\.[^.]+$/, "").slice(0, 8).toUpperCase() || "SMP";
            player.pushSample(project.samples[project.samples.length - 1]);
            player.pushProject(project);
            uiRef.current.status = `SAMPLE ${inst.name}`;
          });
        }}
      />
      <input
        ref={projectInput}
        type="file"
        accept="application/json,.json,.dm2"
        style={{ display: "none" }}
        onChange={(event) => {
          const file = event.target.files?.[0];
          event.target.value = "";
          if (!file) return;
          void file.text().then((text) => {
            try {
              projectRef.current = deserialize(text);
              playerRef.current?.send({ type: "stop" });
              playerRef.current?.pushProject(projectRef.current);
              uiRef.current.status = `OPENED ${file.name.slice(0, 24).toUpperCase()}`;
            } catch {
              uiRef.current.status = "BAD FILE";
            }
          });
        }}
      />
    </div>
  );
}
