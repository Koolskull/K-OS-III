/*
 *        ☦
 *   ╔══════════════╗
 *   ║ VERSE READER ║
 *   ║  e-reader    ║
 *   ╚══════════════╝
 *
 *   FastTracker-style centered-cursor reading.
 *   Active verse stays at vertical center.
 *   Highlights and note indicators shown inline.
 */

"use client";

import React, { useRef, useLayoutEffect } from "react";
import type { VerseHighlight, VerseNote } from "@/types/bible";

interface VerseReaderProps {
  verses: string[];
  activeVerse: number;
  onVerseSelect: (verse: number) => void;
  highlights: VerseHighlight[];
  notes: VerseNote[];
}

const VERSE_MIN_HEIGHT = 28;

export function VerseReader({ verses, activeVerse, onVerseSelect, highlights, notes }: VerseReaderProps) {
  const viewportRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const activeRef = useRef<HTMLDivElement>(null);

  // Scroll active verse to center
  useLayoutEffect(() => {
    const viewport = viewportRef.current;
    const active = activeRef.current;
    const track = trackRef.current;
    if (!viewport || !active || !track) return;

    const viewportHeight = viewport.clientHeight;
    const activeTop = active.offsetTop;
    const activeHeight = active.offsetHeight;
    const offset = activeTop - viewportHeight / 2 + activeHeight / 2;
    track.style.transform = `translateY(${-offset}px)`;
  }, [activeVerse, verses.length]);

  const getHighlightColor = (verseIdx: number): string | null => {
    const h = highlights.find((hl) => hl.verse === verseIdx);
    return h?.color ?? null;
  };

  const hasNote = (verseIdx: number): boolean => {
    return notes.some((n) => n.verse === verseIdx);
  };

  return (
    <div className="h-full flex flex-col select-none">
      {/* Scrolling viewport */}
      <div ref={viewportRef} className="flex-1 relative overflow-hidden">
        {/* Center-line indicator */}
        <div
          className="absolute left-0 right-0 pointer-events-none"
          style={{
            top: "50%",
            height: `${VERSE_MIN_HEIGHT}px`,
            marginTop: `${-VERSE_MIN_HEIGHT / 2}px`,
            backgroundColor: "rgba(255,255,255,0.03)",
            zIndex: 3,
          }}
        />

        <div ref={trackRef} style={{ willChange: "transform", padding: "0 8px" }}>
          {verses.map((text, i) => {
            const isActive = i === activeVerse;
            const hlColor = getHighlightColor(i);
            const noted = hasNote(i);

            // Strip {curly brace} annotations from KJV text
            const cleanText = text.replace(/\{[^}]*\}/g, "").trim();

            return (
              <div
                key={i}
                ref={isActive ? activeRef : undefined}
                className="flex gap-2 py-1 cursor-pointer"
                style={{
                  minHeight: `${VERSE_MIN_HEIGHT}px`,
                  backgroundColor: isActive ? "#0a0a0a" : "transparent",
                  borderLeft: hlColor
                    ? `3px solid ${hlColor}`
                    : isActive
                      ? "3px solid #ffffff"
                      : "3px solid transparent",
                  paddingLeft: "6px",
                }}
                onClick={() => onVerseSelect(i)}
              >
                {/* Verse number */}
                <span
                  className="flex-shrink-0"
                  style={{
                    width: "24px",
                    fontSize: "0.8em",
                    color: isActive ? "#ffffff" : "#555555",
                    lineHeight: "1.6",
                  }}
                >
                  {i + 1}
                  {noted && (
                    <span style={{ color: "#ffffff" }}>*</span>
                  )}
                </span>

                {/* Verse text */}
                <span
                  style={{
                    color: isActive ? "#ffffff" : hlColor ? "#cccccc" : "#333333",
                    fontSize: "inherit",
                    lineHeight: "1.6",
                    wordBreak: "break-word",
                  }}
                >
                  {cleanText}
                </span>
              </div>
            );
          })}

          {/* Bottom padding so last verse can center */}
          <div style={{ height: "50vh" }} />
        </div>
      </div>
    </div>
  );
}
