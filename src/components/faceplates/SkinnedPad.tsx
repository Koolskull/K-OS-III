/*
 *  Skinned live pad — VMI art when a pack is loaded, CSS fallback otherwise.
 */

"use client";

import React from "react";
import { padUrlFallbackChain, type PadVisualState, type ResolvedSkinPack } from "@/lib/faceplates";
import { VmiImage } from "./VmiImage";

export interface SkinnedPadProps {
  index: number;
  active: boolean;
  muted?: boolean;
  soloed?: boolean;
  pressed?: boolean;
  pack: ResolvedSkinPack | null;
  onTrigger: () => void;
  /** Render slime / label glyphs — caller supplies so we don't hard-bind SlimeDigit path */
  renderLabels?: () => React.ReactNode;
}

function visualState(opts: {
  active: boolean;
  muted?: boolean;
  soloed?: boolean;
  pressed?: boolean;
}): PadVisualState {
  if (opts.muted) return "muted";
  if (opts.soloed) return "solo";
  if (opts.pressed) return "pressed";
  if (opts.active) return "active";
  return "default";
}

export function SkinnedPad({
  index,
  active,
  muted,
  soloed,
  pressed,
  pack,
  onTrigger,
  renderLabels,
}: SkinnedPadProps) {
  const state = visualState({ active, muted, soloed, pressed });
  const showLabels = pack?.manifest.layout.showPadLabels !== false;
  const urls = pack ? padUrlFallbackChain(pack, index, state) : [];
  const hasArt = urls.length > 0;

  let borderColor = active ? "#ffffff" : "#444444";
  let backgroundColor = active ? "#2a2a2a" : "#0a0a0a";
  if (muted) {
    borderColor = active ? "#ff4444" : "#331111";
    backgroundColor = active ? "#1a0808" : "#080404";
  } else if (soloed) {
    borderColor = active ? "#ffff00" : "#aaaa00";
    backgroundColor = active ? "#2a2a00" : "#0a0a00";
  }

  return (
    <button
      type="button"
      className="border-2 flex flex-col items-center justify-center cursor-pointer select-none relative overflow-hidden"
      style={{
        borderColor: hasArt ? "transparent" : borderColor,
        backgroundColor: hasArt ? "transparent" : backgroundColor,
        width: "100%",
        height: "100%",
        opacity: muted && !hasArt ? 0.5 : 1,
        padding: 0,
      }}
      onMouseDown={onTrigger}
      onTouchStart={(e) => {
        e.preventDefault();
        onTrigger();
      }}
    >
      {hasArt && (
        <div
          style={{
            position: "absolute",
            inset: 0,
            opacity: muted ? 0.55 : 1,
          }}
        >
          <VmiImage urls={urls} alt={`pad ${index}`} fit="cover" />
        </div>
      )}
      {showLabels && (
        <div
          style={{
            position: "relative",
            zIndex: 1,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            pointerEvents: "none",
          }}
        >
          {renderLabels?.()}
        </div>
      )}
    </button>
  );
}
