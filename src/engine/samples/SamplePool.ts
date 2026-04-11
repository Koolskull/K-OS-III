/*
 *            ☦
 *      ╔════════════════════╗
 *      ║  ST. ROMANOS THE   ║
 *      ║  MELODIST           ║
 *      ╚════════════════════╝
 *
 *   SAMPLE POOL
 *   Decodes and caches AudioBuffers from project sample data.
 *   Samples live as ArrayBuffers inside the project —
 *   this pool decodes them into Tone.js-usable buffers on demand.
 */

import * as Tone from "tone";
import type { ProjectSample } from "@/types/tracker";

export class SamplePool {
  private decoded: Map<number, Tone.ToneAudioBuffer> = new Map();

  /** Decode all project samples into audio buffers */
  async loadAll(samples: ProjectSample[]): Promise<void> {
    this.decoded.clear();
    const ctx = Tone.getContext().rawContext;

    await Promise.all(
      samples.map(async (sample) => {
        try {
          const audioBuf = await ctx.decodeAudioData(sample.data.slice(0));
          this.decoded.set(sample.id, new Tone.ToneAudioBuffer(audioBuf));
        } catch (e) {
          console.warn(`[SAMPLE POOL] Failed to decode: ${sample.name}`, e);
        }
      }),
    );
    console.log(`[SAMPLE POOL] ${this.decoded.size}/${samples.length} decoded`);
  }

  /** Decode a single sample and add to pool */
  async loadOne(sample: ProjectSample): Promise<void> {
    const ctx = Tone.getContext().rawContext;
    try {
      const audioBuf = await ctx.decodeAudioData(sample.data.slice(0));
      this.decoded.set(sample.id, new Tone.ToneAudioBuffer(audioBuf));
    } catch (e) {
      console.warn(`[SAMPLE POOL] Failed to decode: ${sample.name}`, e);
    }
  }

  /** Get a decoded buffer by sample ID */
  get(sampleId: number): Tone.ToneAudioBuffer | undefined {
    return this.decoded.get(sampleId);
  }

  has(sampleId: number): boolean {
    return this.decoded.has(sampleId);
  }

  clear(): void {
    this.decoded.clear();
  }
}
