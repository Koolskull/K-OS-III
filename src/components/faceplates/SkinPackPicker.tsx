/*
 *  Skin-pack cycle control — big enough to hit on phone + desktop.
 *  Click to rotate packs so artists get immediate feedback.
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
  const lastFire = React.useRef(0);
  if (catalog.length === 0) return null;
  const active = catalog.find((p) => p.id === activeId) ?? catalog[0];
  const label = (active?.name ?? "SKIN").slice(0, 16);

  const fire = () => {
    const now = Date.now();
    // Debounce: pointerup + click often both fire for one press
    if (now - lastFire.current < 250) return;
    lastFire.current = now;
    onCycle();
  };

  return (
    <button
      type="button"
      data-testid="skin-pack-picker"
      data-active-id={activeId ?? ""}
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        fire();
      }}
      onPointerUp={(e) => {
        if (e.button !== 0) return;
        e.preventDefault();
        e.stopPropagation();
        fire();
      }}
      onPointerDown={(e) => {
        e.stopPropagation();
      }}
      title={`Faceplate pack: ${active?.name ?? "?"} — click to cycle (${catalog.length} packs)`}
      style={{
        position: "relative",
        zIndex: 5,
        fontFamily: "var(--dm-font-primary), kongtext, monospace",
        fontSize: "10px",
        letterSpacing: "1px",
        color: "#eeeeee",
        background: "#1a1a1a",
        borderWidth: 2,
        borderStyle: "solid",
        borderColor: "#ffffff",
        padding: "4px 8px",
        cursor: "pointer",
        imageRendering: "pixelated",
        minWidth: "140px",
        minHeight: "32px",
        textAlign: "center",
        overflow: "hidden",
        textOverflow: "ellipsis",
        whiteSpace: "nowrap",
      }}
    >
      SKIN:{label}
    </button>
  );
}
