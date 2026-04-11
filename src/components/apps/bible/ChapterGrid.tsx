/*
 *        ☦
 *   ╔══════════════╗
 *   ║ CHAPTER GRID ║
 *   ╚══════════════╝
 */

"use client";

import React, { useState, useEffect } from "react";

interface ChapterGridProps {
  bookName: string;
  chapterCount: number;
  activeChapter: number;
  onSelect: (chapter: number) => void;
}

const COLS = 8;

export function ChapterGrid({ bookName, chapterCount, activeChapter, onSelect }: ChapterGridProps) {
  const [cursor, setCursor] = useState(activeChapter);
  const rows = Math.ceil(chapterCount / COLS);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Shift" || e.code === "KeyQ") return;

      switch (e.key) {
        case "ArrowUp":
          e.preventDefault();
          e.stopPropagation();
          setCursor((c) => Math.max(0, c - COLS));
          break;
        case "ArrowDown":
          e.preventDefault();
          e.stopPropagation();
          setCursor((c) => Math.min(chapterCount - 1, c + COLS));
          break;
        case "ArrowLeft":
          e.preventDefault();
          e.stopPropagation();
          setCursor((c) => Math.max(0, c - 1));
          break;
        case "ArrowRight":
          e.preventDefault();
          e.stopPropagation();
          setCursor((c) => Math.min(chapterCount - 1, c + 1));
          break;
        case "w":
        case "W":
        case "Enter":
          e.preventDefault();
          e.stopPropagation();
          onSelect(cursor);
          break;
      }
    };
    window.addEventListener("keydown", handleKeyDown, true);
    return () => window.removeEventListener("keydown", handleKeyDown, true);
  }, [cursor, chapterCount, onSelect]);

  const cells = Array.from({ length: chapterCount }, (_, i) => i);

  return (
    <div className="h-full flex flex-col select-none p-2">
      <div
        className="border-b mb-2 pb-1"
        style={{
          borderColor: "#ffffff",
          fontSize: "0.9em",
          letterSpacing: "2px",
          color: "#ffffff",
        }}
      >
        {bookName.toUpperCase()} - SELECT CHAPTER
      </div>

      <div className="flex-1 overflow-y-auto">
        {Array.from({ length: rows }, (_, row) => (
          <div key={row} className="flex gap-1 mb-1">
            {cells.slice(row * COLS, (row + 1) * COLS).map((ch) => {
              const isCursor = ch === cursor;
              return (
                <button
                  key={ch}
                  className="border px-1 py-1 cursor-pointer"
                  style={{
                    width: "36px",
                    borderColor: isCursor ? "#ffffff" : "#333333",
                    backgroundColor: isCursor ? "#1a1a1a" : "#000000",
                    color: isCursor ? "#ffffff" : ch === activeChapter ? "#ffffff" : "#888888",
                    fontFamily: "inherit",
                    fontSize: "0.9em",
                    textAlign: "center",
                  }}
                  onClick={() => {
                    setCursor(ch);
                    onSelect(ch);
                  }}
                >
                  {ch + 1}
                </button>
              );
            })}
          </div>
        ))}
      </div>

      <div
        className="flex-shrink-0 border-t pt-1"
        style={{
          borderColor: "#333333",
          fontSize: "0.7em",
          color: "#555555",
          letterSpacing: "1px",
        }}
      >
        CHAPTER {cursor + 1} OF {chapterCount}
      </div>
    </div>
  );
}
