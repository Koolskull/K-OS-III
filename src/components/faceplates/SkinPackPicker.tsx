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
        fontSize: "8px",
        letterSpacing: "1px",
        color: "#cccccc",
        background: "#111111",
        borderWidth: 1,
        borderStyle: "solid",
        borderColor: "#666666",
        padding: "2px 6px",
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
