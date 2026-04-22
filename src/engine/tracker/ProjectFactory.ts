/*
 *            ☦
 *     ╔═════════════════╗
 *     ║  BLESSED BE THE ║
 *     ║  NEW CREATION   ║
 *     ╚═════════════════╝
 *
 *   PROJECT FACTORY
 *   Creates blank projects and demo data.
 */

import type {
  ProjectData, Song, Chain, Phrase, Table,
  Instrument, PhraseRow, TableRow, FMOperator,
} from "@/types/tracker";
import { defaultVisualForInstrument } from "@/components/apps/datamoshpit/visuals/scene-vm";

function emptyPhraseRow(): PhraseRow {
  return { note: null, instrument: null, effect1: null, effect2: null, slice: null };
}

function emptyTableRow(): TableRow {
  return { transpose: 0, effect1: null, effect2: null };
}

function defaultFMOperator(overrides?: Partial<FMOperator>): FMOperator {
  return {
    ratio: 1, level: 100, attack: 0x1F, decay: 0x0A,
    sustain: 0x02, release: 0x0F, detune: 3, multiple: 1,
    d2r: 0, rs: 0, am: 0,
    ...overrides,
  };
}

export function createBlankPhrase(id: number): Phrase {
  return { id, rows: Array.from({ length: 16 }, emptyPhraseRow) };
}

export function createBlankChain(id: number): Chain {
  return {
    id,
    steps: Array.from({ length: 16 }, () => ({ phrase: null, transpose: 0 })),
  };
}

export function createBlankTable(id: number): Table {
  return { id, rows: Array.from({ length: 16 }, emptyTableRow), loopStart: 0 };
}

export function createDefaultInstrument(id: number, name: string): Instrument {
  return {
    id,
    name,
    type: "fm",
    volume: 100,
    pan: 64,
    table: null,
    envSpeed: 0x04,
    envTarget: 0x00,
    fmAlgorithm: 0,
    fmFeedback: 3,
    fmFMS: 0,
    fmAMS: 0,
    fmOperators: [
      defaultFMOperator({ ratio: 1, level: 100 }),
      defaultFMOperator({ ratio: 2, level: 80 }),
      defaultFMOperator({ ratio: 3, level: 40, sustain: 0 }),
      defaultFMOperator({ ratio: 4, level: 20, sustain: 0 }),
    ],
    macros: [],
    visual: defaultVisualForInstrument(id, "fm"),
  };
}

export function createBlankProject(name = "Untitled"): ProjectData {
  const song: Song = {
    id: 0,
    name,
    bpm: 120,
    tpb: 6,
    channels: 8,
    rows: Array.from({ length: 256 }, () => ({
      chains: Array(8).fill(null) as (number | null)[],
    })),
  };

  return {
    version: "0.1.0",
    name,
    song,
    chains: [createBlankChain(0)],
    phrases: [createBlankPhrase(0)],
    tables: [createBlankTable(0)],
    instruments: Array.from({ length: 256 }, (_, i) =>
      createDefaultInstrument(i, i < 4
        ? ["FM BASS", "FM LEAD", "FM PAD", "FM PERC"][i]
        : "NULL")
    ),
    samples: [],
  };
}
