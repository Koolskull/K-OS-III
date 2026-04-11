/*
 *        ☦
 *   ╔══════════════╗
 *   ║  BOOK LIST   ║
 *   ║  66 Books    ║
 *   ╚══════════════╝
 */

"use client";

import React, { useRef, useLayoutEffect, useEffect, useState } from "react";
import { BOOK_META } from "@/lib/BibleDataLoader";

interface BookListProps {
  activeIndex: number;
  onSelect: (bookIndex: number) => void;
}

const ROW_HEIGHT = 20;

export function BookList({ activeIndex, onSelect }: BookListProps) {
  const [cursor, setCursor] = useState(activeIndex);
  const viewportRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);

  // Keyboard navigation (capture phase)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Shift" || e.code === "KeyQ") return;

      switch (e.key) {
        case "ArrowUp":
          e.preventDefault();
          e.stopPropagation();
          setCursor((c) => Math.max(0, c - 1));
          break;
        case "ArrowDown":
          e.preventDefault();
          e.stopPropagation();
          setCursor((c) => Math.min(65, c + 1));
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
  }, [cursor, onSelect]);

  // FastTracker-style centered-cursor scrolling
  useLayoutEffect(() => {
    const viewport = viewportRef.current;
    const track = trackRef.current;
    if (!viewport || !track) return;
    const viewportHeight = viewport.clientHeight;
    const offset = cursor * ROW_HEIGHT - viewportHeight / 2 + ROW_HEIGHT / 2;
    track.style.transform = `translateY(${-offset}px)`;
  }, [cursor]);

  return (
    <div className="h-full flex flex-col select-none">
      {/* Header */}
      <div
        className="flex items-center px-2 border-b flex-shrink-0"
        style={{
          borderColor: "#333333",
          height: "20px",
          fontSize: "0.8em",
          color: "#999999",
          letterSpacing: "1px",
        }}
      >
        <span className="w-7">#</span>
        <span className="flex-1">BOOK</span>
        <span className="w-8 text-right">CH</span>
      </div>

      {/* Scrolling viewport */}
      <div ref={viewportRef} className="flex-1 relative overflow-hidden">
        {/* Center-line indicator */}
        <div
          className="absolute left-0 right-0 pointer-events-none"
          style={{
            top: "50%",
            height: `${ROW_HEIGHT}px`,
            marginTop: `${-ROW_HEIGHT / 2}px`,
            borderTop: "1px solid #444444",
            borderBottom: "1px solid #444444",
            backgroundColor: "rgba(255,255,255,0.03)",
            zIndex: 3,
          }}
        />
        <div ref={trackRef} style={{ willChange: "transform" }}>
          {BOOK_META.map((book) => {
            const isCursor = book.index === cursor;
            const isOT = !book.isNewTestament;
            return (
              <div
                key={book.index}
                className="flex items-center px-2 cursor-pointer"
                style={{
                  height: `${ROW_HEIGHT}px`,
                  backgroundColor: isCursor ? "#1a1a1a" : "transparent",
                  borderLeft: isCursor ? "2px solid #ffffff" : "2px solid transparent",
                  color: isCursor ? "#ffffff" : isOT ? "#888888" : "#aaaaaa",
                  fontSize: "0.9em",
                  letterSpacing: "1px",
                }}
                onClick={() => {
                  setCursor(book.index);
                  onSelect(book.index);
                }}
              >
                <span className="w-7" style={{ color: "#666666" }}>
                  {(book.index + 1).toString().padStart(2, "0")}
                </span>
                <span className="flex-1">{book.name.toUpperCase()}</span>
                <span className="w-8 text-right" style={{ color: "#555555" }}>
                  {book.chapterCount}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Testament indicator */}
      <div
        className="flex-shrink-0 border-t px-2"
        style={{
          borderColor: "#333333",
          fontSize: "0.7em",
          color: "#555555",
          letterSpacing: "1px",
          height: "14px",
          lineHeight: "14px",
        }}
      >
        {BOOK_META[cursor]?.isNewTestament ? "NEW TESTAMENT" : "OLD TESTAMENT"} - {cursor + 1}/66
      </div>
    </div>
  );
}
