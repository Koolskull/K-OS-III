/*
 *            ☦
 *      ╔════════════════════╗
 *      ║  SAMPLE MANIFEST   ║
 *      ╚════════════════════╝
 *
 *   Hardcoded list of available sample files
 *   from /public/Instruments/samples/
 */

export const SAMPLE_MANIFEST: string[] = [
  "A01_KROY KICK-002.wav",
  "A02_KROY SNARE-002.wav",
  "A03_video-import.wav",
  "A04_video-import.wav",
  "A05_video-import.wav",
  "A06_video-import.wav",
  "A07_video-import.wav",
  "A08_video-import.wav",
  "A09_video-import.wav",
  "A10_video-import.wav",
  "A11_video-import.wav",
  "A12_video-import.wav",
  "A13_video-import.wav",
  "A14_video-import.wav",
  "A15_video-import.wav",
  "A16_video-import.wav",
  "Kool kick 1.wav",
  "Kool kick 2021 - 0002.wav",
  "Kool kick 2.wav",
  "Kool snare 1.wav",
  "Kool snare 2021 - 0002.wav",
  "Kool snare 2.wav",
  "Kool snare 3.wav",
  "KSJT23_Amen00_184bpm.wav",
  "KSJT23_Amen01_184bpm.wav",
  "KSJT23_AmenKleanVinylRip.wav",
  "KSJT23_Bass00.wav",
  "KSJT23_Bass01.wav",
  "KSJT23_Bass02.wav",
  "KSJT23_Bass03.wav",
  "KSJT23_Bass04.wav",
  "KSJT23_Brk00_115bpm.wav",
  "KSJT23_Brk01_121Bpm.wav",
  "KSJT23_Chord00.wav",
  "KSJT23_Kick00.wav",
  "KSJT23_Kick01.wav",
  "KSJT23_Noise00.wav",
  "KSJT23_Snare00.wav",
  "KSJT23_Snare01.wav",
  "KSJT23_Snare02.wav",
];

export const SAMPLE_PATH = "/Instruments/samples";

/** Get the index of a sample filename in the manifest, or 0 if not found */
export function sampleIndexFromUrl(url: string | undefined): number {
  if (!url) return 0;
  const filename = url.split("/").pop() ?? "";
  const idx = SAMPLE_MANIFEST.indexOf(filename);
  return idx >= 0 ? idx : 0;
}

/** Build the full URL from a manifest index */
export function sampleUrlFromIndex(index: number): string {
  const clamped = Math.max(0, Math.min(SAMPLE_MANIFEST.length - 1, index));
  return `${SAMPLE_PATH}/${SAMPLE_MANIFEST[clamped]}`;
}
