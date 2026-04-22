/*
 *            ☦
 *      ╔═══════════════════╗
 *      ║  BLESSED BE THIS  ║
 *      ║  DEMONSTRATION    ║
 *      ╚═══════════════════╝
 *
 *   DEMO PROJECT
 *   3 one-shot sample instruments: kick, snare, hat.
 *   One phrase with a basic pattern.
 */

import type { ProjectData, ProjectSample, Instrument, PhraseRow, Phrase, Chain, Song } from "@/types/tracker";
import { createBlankChain, createBlankTable, createDefaultInstrument } from "./ProjectFactory";
import { defaultVisualForInstrument } from "@/components/apps/datamoshpit/visuals/scene-vm";

const SAMPLE_PATH = "/Instruments/samples";

interface DemoSampleDef {
  id: number;
  name: string;
  filename: string;
}

const DEMO_SAMPLES: DemoSampleDef[] = [
  { id: 0, name: "KICK", filename: "A01_KROY KICK-002.wav" },
  { id: 1, name: "SNARE", filename: "A02_KROY SNARE-002.wav" },
  { id: 2, name: "HAT", filename: "A09_video-import.wav" },
];

function sampleInstrument(id: number, name: string, sampleId: number): Instrument {
  return {
    id,
    name,
    type: "sample",
    volume: 100,
    pan: 64,
    table: null,
    sampleId,
    sampleLoop: false,
    macros: [],
    visual: defaultVisualForInstrument(id, "sample"),
  };
}

function row(note: number | null, instrument: number | null): PhraseRow {
  return { note, instrument, effect1: null, effect2: null, slice: null };
}

function emptyRow(): PhraseRow {
  return { note: null, instrument: null, effect1: null, effect2: null, slice: null };
}

export async function createDemoProject(): Promise<ProjectData> {
  // Fetch sample WAVs as ArrayBuffers and embed in project
  const samples: ProjectSample[] = await Promise.all(
    DEMO_SAMPLES.map(async (def) => {
      const resp = await fetch(`${SAMPLE_PATH}/${def.filename}`);
      const data = await resp.arrayBuffer();
      return { id: def.id, name: def.name, data };
    }),
  );

  const instruments: Instrument[] = Array.from({ length: 256 }, (_, i) => {
    if (i === 0) return sampleInstrument(0, "KICK", 0);
    if (i === 1) return sampleInstrument(1, "SNARE", 1);
    if (i === 2) return sampleInstrument(2, "HAT", 2);
    if (i === 3) return createDefaultInstrument(3, "FM BASS");
    return createDefaultInstrument(i, "NULL");
  });

  // Simple drum pattern — all notes at C-4 (MIDI 60)
  const drumPhrase: Phrase = {
    id: 0,
    rows: [
      row(60, 0),       // KICK
      emptyRow(),
      row(60, 2),       // HAT
      emptyRow(),
      row(60, 1),       // SNARE
      emptyRow(),
      row(60, 2),       // HAT
      emptyRow(),
      row(60, 0),       // KICK
      emptyRow(),
      row(60, 2),       // HAT
      row(60, 0),       // KICK
      row(60, 1),       // SNARE
      emptyRow(),
      row(60, 2),       // HAT
      emptyRow(),
    ],
  };

  const chain: Chain = {
    id: 0,
    steps: [
      { phrase: 0, transpose: 0 },
      ...Array.from({ length: 15 }, () => ({ phrase: null, transpose: 0 })),
    ],
  };

  const song: Song = {
    id: 0,
    name: "DEMO",
    bpm: 120,
    tpb: 6,
    channels: 8,
    rows: Array.from({ length: 256 }, (_, i) => ({
      chains: i === 0
        ? [0, null, null, null, null, null, null, null]
        : Array(8).fill(null) as (number | null)[],
    })),
  };

  return {
    version: "0.1.0",
    name: "DEMO",
    song,
    chains: [chain],
    phrases: [drumPhrase],
    tables: [createBlankTable(0)],
    instruments,
    samples,
  };
}
