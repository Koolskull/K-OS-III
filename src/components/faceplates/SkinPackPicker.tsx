/*
 *  Tiny skin-pack cycle control for the LIVE header.
 *  Click to rotate packs — artists get immediate feedback.
 */

"use client";

import React from "react";
import type { SkinPackIndexEntry } from "@/lib/faceplates";

interface SkinPackPickerProps {
  catalog: SkinPackIndexEntry[];
  activeId: string | null | undefined;
  onCycle: () => void;
  onSelect?: (id: string) => void;
}

export function SkinPackPicker({
  catalog,
  activeId,
  onCycle,
}: SkinPackPickerProps) {
  if (catalog.length === 0) return null;
  const active = catalog.find((p) => p.id === activeId) ?? catalog[0];
  const label = (active?.name ?? "SKIN").slice(0, 14);

  return (
    <button
      type="button"
      onClick={onCycle}
      title="Cycle faceplate skin pack (build kit)"
      style={{
        fontFamily: "var(--dm-font-primary)",
        fontSize: "7px",
        letterSpacing: "1px",
        color: "#888888",
        background: "transparent",
        border: "1px solid #444444",
        padding: "1px 4px",
        cursor: "pointer",
        imageRendering: "pixelated",
        maxWidth: "96px",
        overflow: "hidden",
        textOverflow: "ellipsis",
        whiteSpace: "nowrap",
      }}
    >
      SKIN:{label}
    </button>
  );
}
