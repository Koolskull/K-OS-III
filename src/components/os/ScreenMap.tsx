/*
 *            ☦
 *     ╔═══════════════╗
 *     ║  THE SCREEN   ║
 *     ║  MAP CORNER   ║
 *     ║  NAVIGATOR    ║
 *     ╚═══════════════╝
 *
 *   Permanent residence: top-left of screen,
 *   to the left of the page name in the status bar.
 *   Always visible. Current screen highlighted.
 *   Shift + Arrow keys to move between screens.
 *
 *   3x5 grid layout:
 *
 *     PREF  _     _      _     _
 *     PROJ  _     LIVE   _     _
 *     SONG  CHAIN PHRASE INST  TABLE
 */

"use client";

import React from "react";
import type { TrackerScreen } from "@/types/tracker";

const SCREEN_MAP: (TrackerScreen | null)[][] = [
  ["preferences", null,    null,      null,         null],
  ["project",     null,    "live",    null,         null],
  ["song",        "chain", "phrase",  "instrument", "table"],
];

const SCREEN_SHORT: Record<TrackerScreen, string> = {
  preferences: "F",
  project: "P",
  song: "S",
  chain: "C",
  phrase: "P",
  instrument: "I",
  table: "T",
  live: "L",
};

// Position of each screen in the map grid [row, col]
const SCREEN_POS: Record<TrackerScreen, [number, number]> = {
  preferences: [0, 0],
  project:     [1, 0],
  live:        [1, 2],
  song:        [2, 0],
  chain:       [2, 1],
  phrase:      [2, 2],
  instrument:  [2, 3],
  table:       [2, 4],
};

/** Get the screen in a given direction from the current screen */
export function navigateScreen(
  current: TrackerScreen,
  direction: "up" | "down" | "left" | "right",
): TrackerScreen | null {
  const pos = SCREEN_POS[current];
  if (!pos) return null;

  let [row, col] = pos;
  if (direction === "up") row--;
  if (direction === "down") row++;
  if (direction === "left") col--;
  if (direction === "right") col++;

  if (row < 0 || row >= SCREEN_MAP.length) return null;
  if (col < 0 || col >= SCREEN_MAP[row].length) return null;

  return SCREEN_MAP[row][col];
}

interface ScreenMapProps {
  active: TrackerScreen;
}

/**
 * Permanent screen map — always visible in the top-left status bar.
 * Inline element, not an overlay.
 */
export function ScreenMap({ active }: ScreenMapProps) {
  const mapLabels: [string, TrackerScreen | null][][] = [
    [["F", "preferences"], ["", null], ["", null], ["", null], ["", null]],
    [["P", "project"], ["", null], ["L", "live"], ["", null], ["", null]],
    [["S", "song"], ["C", "chain"], ["P", "phrase"], ["I", "instrument"], ["T", "table"]],
  ];

  return (
    <div
      className="border p-0.5 inline-flex flex-col"
      style={{
        borderColor: "#555555",
        backgroundColor: "#000000",
        fontFamily: "var(--dm-font-primary)",
        fontSize: "9px",
        lineHeight: "1",
        verticalAlign: "middle",
      }}
    >
      {mapLabels.map((row, ri) => (
        <div key={ri} className="flex gap-0">
          {row.map(([label, screen], ci) => {
            const isActive = screen === active;
            const isEmpty = !screen;
            return (
              <span
                key={ci}
                className="inline-block text-center"
                style={{
                  width: "12px",
                  height: "12px",
                  lineHeight: "12px",
                  backgroundColor: isActive ? "#ffffff" : "transparent",
                  color: isActive ? "#000000" : isEmpty ? "#1a1a1a" : "#666666",
                  fontWeight: isActive ? "bold" : "normal",
                }}
              >
                {isEmpty ? " " : label}
              </span>
            );
          })}
        </div>
      ))}
    </div>
  );
}
