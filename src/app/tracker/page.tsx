/*
 *                    ☦
 *           K-OS III — DIGITAL TRACKER VIEW
 *
 *  Mobile experiment route: full-screen Datamoshpit tracker without
 *  background visuals, with on-screen controls enabled.
 */

"use client";

import React from "react";
import { DatamoshpitApp } from "@/components/apps/DatamoshpitApp";

export default function TrackerPage() {
  return (
    <div
      className="w-full h-full"
      style={{
        position: "fixed",
        inset: 0,
        backgroundColor: "#000000",
        overflow: "hidden",
      }}
    >
      <DatamoshpitApp
        isFocused
        disableVisuals
        controlsLayout="bottom-only"
        controlsPosition="below-content"
      />
    </div>
  );
}

