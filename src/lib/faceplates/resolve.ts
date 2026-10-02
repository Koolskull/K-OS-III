/*
 *  Resolve VMI frame paths for faceplate / pad / button slots.
 *  Naming matches VMI_ARTIST_GUIDE.md: SSSSXX.PNG
 */

import { assetUrl } from "@/lib/assets";
import type { PadVisualState, ResolvedSkinPack, VmiStateCode } from "./types";

const STATE_TO_CODE: Record<PadVisualState, VmiStateCode> = {
  default: "0000",
  active: "0010",
  pressed: "0020",
  muted: "0030",
  solo: "0040",
};

/** Build SSSSXX filename (frame 00). */
export function vmiFilename(state: VmiStateCode, frame = 0): string {
  const xx = frame.toString(16).toUpperCase().padStart(2, "0");
  return `${state}${xx}.PNG`;
}

export function padStateCode(state: PadVisualState): VmiStateCode {
  return STATE_TO_CODE[state];
}

/**
 * Resolve a pack-relative slot folder + state to a fetchable URL.
 * Falls back along: requested → active → default.
 */
export function resolveSlotUrl(
  pack: ResolvedSkinPack,
  slotFolder: string,
  state: PadVisualState,
): string {
  const folder = slotFolder.replace(/^\/+|\/+$/g, "");
  const codes: VmiStateCode[] = [padStateCode(state)];
  if (state !== "active" && state !== "default") codes.push("0010");
  if (state !== "default") codes.push("0000");

  // Prefer exact file; browser 404s on <img> are fine — callers may onError cascade.
  // We return the best-guess primary URL (exact state).
  const primary = codes[0];
  return assetUrl(`${pack.root}/${folder}/${vmiFilename(primary)}`);
}

export function resolveFaceplateUrl(
  pack: ResolvedSkinPack,
  state: PadVisualState = "default",
): string | null {
  const folder = pack.manifest.slots.faceplate;
  if (!folder) return null;
  return resolveSlotUrl(pack, folder, state);
}

/**
 * Pad art: shared folder, or per-pad pads/00 .. pads/0F when sharedArt=false.
 */
export function resolvePadUrl(
  pack: ResolvedSkinPack,
  padIndex: number,
  state: PadVisualState,
): string | null {
  const shared = pack.manifest.layout.pads.sharedArt !== false;
  const base = pack.manifest.slots.pad;
  if (!base) return null;

  if (shared) {
    return resolveSlotUrl(pack, base, state);
  }

  const hex = (padIndex & 0xf).toString(16).toUpperCase().padStart(2, "0");
  // When not shared, `pad` is a parent folder (e.g. "pads") containing 00..0F
  return resolveSlotUrl(pack, `${base}/${hex}`, state);
}

export function resolveButtonUrl(
  pack: ResolvedSkinPack,
  buttonId: string,
  state: PadVisualState = "default",
): string | null {
  const folder = pack.manifest.slots[buttonId];
  if (!folder || buttonId === "faceplate" || buttonId === "pad") return null;
  return resolveSlotUrl(pack, folder, state);
}

/** Fallback chain of URLs for <img onError> cascading. */
export function padUrlFallbackChain(
  pack: ResolvedSkinPack,
  padIndex: number,
  state: PadVisualState,
): string[] {
  const shared = pack.manifest.layout.pads.sharedArt !== false;
  const base = pack.manifest.slots.pad;
  if (!base) return [];

  const folder = shared
    ? base
    : `${base}/${(padIndex & 0xf).toString(16).toUpperCase().padStart(2, "0")}`;

  const order: PadVisualState[] =
    state === "default"
      ? ["default"]
      : state === "active" || state === "pressed"
        ? [state, state === "pressed" ? "active" : "default", "default"]
        : [state, "default"];

  const seen = new Set<string>();
  const urls: string[] = [];
  for (const s of order) {
    const u = resolveSlotUrl(pack, folder, s);
    if (!seen.has(u)) {
      seen.add(u);
      urls.push(u);
    }
  }
  return urls;
}
