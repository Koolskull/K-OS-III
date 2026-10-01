/*
 *  Faceplate shell — optional full-bleed plate behind the pad grid.
 */

"use client";

import React from "react";
import { resolveFaceplateUrl, type ResolvedSkinPack } from "@/lib/faceplates";
import { VmiImage } from "./VmiImage";

interface FaceplateShellProps {
  pack: ResolvedSkinPack | null;
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
}

export function FaceplateShell({ pack, children, className, style }: FaceplateShellProps) {
  const url = pack ? resolveFaceplateUrl(pack, "default") : null;
  const fit = pack?.manifest.layout.faceplate.fit ?? "cover";

  return (
    <div
      className={className}
      style={{
        position: "relative",
        ...style,
      }}
    >
      {url && (
        <div
          aria-hidden
          style={{
            position: "absolute",
            inset: 0,
            zIndex: 0,
            pointerEvents: "none",
            opacity: 0.85,
          }}
        >
          <VmiImage urls={[url]} alt="" fit={fit} />
        </div>
      )}
      <div style={{ position: "relative", zIndex: 1, height: "100%" }}>{children}</div>
    </div>
  );
}
