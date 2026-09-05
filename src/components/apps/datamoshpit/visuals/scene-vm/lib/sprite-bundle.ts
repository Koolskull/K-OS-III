/*
 *                    ☦
 *        SCENE VM — KOOLDRAW BUNDLE IMPORTER
 *
 *  Parses the zip produced by KoolDraw's "BUNDLE" export
 *  (downloadAnimationBundle in src/lib/SpriteUtils.ts):
 *
 *    <AnimationName>/<AnimationName>.json   — AnimationBundleManifest
 *    <AnimationName>/<LayerName>/<hexId>.png — one PNG per pool frame
 *
 *  Frames are read back as base64 data: URLs and embedded directly on the
 *  instrument's visual (see SpriteBundle in src/types/tracker.ts) — the same
 *  convention InstrumentVisual.assetUrl already uses for drawn/loaded images,
 *  so the result round-trips through .dmpit save/load with no extra asset
 *  bookkeeping. Deliberately standalone from KoolDraw's own runtime: this
 *  module only depends on the zip/JSON *format* KoolDraw happens to write,
 *  not on any of its React components.
 */

import { sanitizeFileName, type AnimationBundleManifest } from "@/lib/SpriteUtils";
import type { SpriteBundle, SpriteBundleLayer } from "@/types/tracker";

/** Parse a KoolDraw animation bundle zip (as picked from a file input) into a SpriteBundle. */
export async function parseSpriteBundleZip(file: File | Blob): Promise<SpriteBundle> {
  const JSZip = (await import("jszip")).default;
  const zip = await JSZip.loadAsync(file);

  const jsonEntry = Object.values(zip.files).find(
    (f) => !f.dir && f.name.toLowerCase().endsWith(".json"),
  );
  if (!jsonEntry) {
    throw new Error("No animation manifest (.json) found in this bundle.");
  }
  const manifest = JSON.parse(await jsonEntry.async("string")) as AnimationBundleManifest;

  // Root folder is wherever the manifest itself lives, not a re-derivation
  // from manifest.name — robust even if the name field was hand-edited.
  const slashIdx = jsonEntry.name.lastIndexOf("/");
  const root = slashIdx >= 0 ? jsonEntry.name.slice(0, slashIdx) : "";

  const layers: SpriteBundleLayer[] = [];
  for (const l of manifest.layers ?? []) {
    const layerFolder = sanitizeFileName(l.name);
    const prefix = root ? `${root}/${layerFolder}/` : `${layerFolder}/`;
    const uniqueHexIds = Array.from(new Set(l.exposures ?? []));

    const frames: SpriteBundleLayer["frames"] = [];
    for (const hexId of uniqueHexIds) {
      const entry = zip.file(`${prefix}${hexId}.png`);
      if (!entry) continue; // tolerate a missing frame rather than failing the whole import
      const base64 = await entry.async("base64");
      frames.push({ hexId, dataUrl: `data:image/png;base64,${base64}` });
    }

    layers.push({
      name: l.name,
      opacity: l.opacity,
      visible: l.visible,
      exposures: l.exposures ?? [],
      frames,
    });
  }

  return {
    name: manifest.name,
    width: manifest.width,
    height: manifest.height,
    fps: manifest.fps,
    loopMode: manifest.loopMode,
    layers,
  };
}
