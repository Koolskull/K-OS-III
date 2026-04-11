/*
 *        ☦
 *   ╔══════════════════╗
 *   ║ BIBLE SCREEN MAP ║
 *   ╚══════════════════╝
 *
 *   Permanent mini-map in the top-left status bar,
 *   same style as the tracker's ScreenMap.
 *
 *   3x5 grid layout for the Bible reader:
 *
 *     PREF  _     _     _     _
 *     NOTE  _     _     _     _
 *     READ  BOOK  CH    _     _
 */

"use client";

import React from "react";
import type { BibleScreen } from "@/types/bible";

const BIBLE_MAP: (BibleScreen | null)[][] = [
  ["preferences", null,   null,       null, null],
  ["notes",       null,   null,       null, null],
  ["reading",     "books","chapters", null, null],
];

// Position of each screen in the grid [row, col]
const BIBLE_SCREEN_POS: Record<BibleScreen, [number, number]> = {
  preferences: [0, 0],
  notes:       [1, 0],
  reading:     [2, 0],
  books:       [2, 1],
  chapters:    [2, 2],
};

/** Spatial navigation matching the grid map positions */
export function navigateBibleScreen(
  current: BibleScreen,
  direction: "up" | "down" | "left" | "right",
): BibleScreen | null {
  const pos = BIBLE_SCREEN_POS[current];
  if (!pos) return null;

  let [row, col] = pos;
  if (direction === "up") row--;
  if (direction === "down") row++;
  if (direction === "left") col--;
  if (direction === "right") col++;

  if (row < 0 || row >= BIBLE_MAP.length) return null;
  if (col < 0 || col >= BIBLE_MAP[row].length) return null;

  return BIBLE_MAP[row][col];
}

const BIBLE_MAP_LABELS: [string, BibleScreen | null][][] = [
  [["F", "preferences"], ["", null], ["", null],       ["", null], ["", null]],
  [["N", "notes"],       ["", null], ["", null],       ["", null], ["", null]],
  [["R", "reading"],     ["B", "books"], ["C", "chapters"], ["", null], ["", null]],
];

interface BibleScreenMapProps {
  active: BibleScreen;
}

export function BibleScreenMap({ active }: BibleScreenMapProps) {
  return (
    <div
      className="border p-0.5 inline-flex flex-col"
      style={{
        borderColor: "#555555",
        backgroundColor: "#000000",
        fontFamily: "inherit",
        fontSize: "0.9em",
        lineHeight: "1",
        verticalAlign: "middle",
      }}
    >
      {BIBLE_MAP_LABELS.map((row, ri) => (
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
