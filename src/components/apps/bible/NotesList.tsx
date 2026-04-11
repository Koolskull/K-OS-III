/*
 *        ☦
 *   ╔══════════════╗
 *   ║  NOTES LIST  ║
 *   ║  Study Index ║
 *   ╚══════════════╝
 *
 *   Scrollable list of all saved notes.
 *   Up/Down to browse, Q to expand/collapse,
 *   Z/Enter to jump to verse.
 *   FastTracker-style centered-cursor scrolling.
 */

"use client";

import React, { useState, useEffect, useRef, useLayoutEffect } from "react";
import type { VerseNote } from "@/types/bible";
import { BOOK_META, getChapterVerses } from "@/lib/BibleDataLoader";
import type { KjvBible } from "@/types/bible";

interface NotesListProps {
  notes: VerseNote[];
  bible: KjvBible | null;
  onJumpToVerse: (bookIndex: number, chapter: number, verse: number) => void;
}

const ROW_HEIGHT_COLLAPSED = 36;
const ROW_HEIGHT_EXPANDED = 120;

export function NotesList({ notes, bible, onJumpToVerse }: NotesListProps) {
  const [cursor, setCursor] = useState(0);
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null);
  const viewportRef = useRef<HTMLDivElement>(null);
  const activeRef = useRef<HTMLDivElement>(null);

  // Keyboard navigation (capture phase)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Shift" || e.code === "KeyQ" && e.shiftKey) return;
      if (notes.length === 0) return;

      switch (e.key) {
        case "ArrowUp":
          if (e.shiftKey) return; // let screen nav handle it
          e.preventDefault();
          e.stopPropagation();
          setCursor((c) => Math.max(0, c - 1));
          break;
        case "ArrowDown":
          if (e.shiftKey) return;
          e.preventDefault();
          e.stopPropagation();
          setCursor((c) => Math.min(notes.length - 1, c + 1));
          break;
        case "q":
        case "Q":
          e.preventDefault();
          e.stopPropagation();
          setExpandedIndex((prev) => (prev === cursor ? null : cursor));
          break;
        case "w":
        case "W":
        case "Enter":
          e.preventDefault();
          e.stopPropagation();
          if (notes[cursor]) {
            const n = notes[cursor];
            onJumpToVerse(n.bookIndex, n.chapter, n.verse);
          }
          break;
      }
    };

    window.addEventListener("keydown", handleKeyDown, true);
    return () => window.removeEventListener("keydown", handleKeyDown, true);
  }, [cursor, notes, onJumpToVerse]);

  // Scroll active note to center
  useLayoutEffect(() => {
    const viewport = viewportRef.current;
    const active = activeRef.current;
    if (!viewport || !active) return;

    const viewportHeight = viewport.clientHeight;
    const activeTop = active.offsetTop;
    const activeHeight = active.offsetHeight;
    const offset = activeTop - viewportHeight / 2 + activeHeight / 2;
    viewport.scrollTop = Math.max(0, offset);
  }, [cursor, expandedIndex]);

  if (notes.length === 0) {
    return (
      <div
        className="h-full flex flex-col select-none p-2"
        style={{ fontSize: "inherit" }}
      >
        <div
          className="border-b mb-2 pb-0.5"
          style={{ borderColor: "#ffffff", fontSize: "0.9em", letterSpacing: "2px", color: "#ffffff" }}
        >
          ALL NOTES (0)
        </div>
        <div style={{ color: "#555555", fontSize: "0.9em" }}>
          NO NOTES YET. PRESS SPACE ON A VERSE TO WRITE ONE.
        </div>
      </div>
    );
  }

  return (
    <div
      className="h-full flex flex-col select-none"
      style={{ fontSize: "inherit" }}
    >
      {/* Header */}
      <div
        className="border-b mb-0 pb-0.5 px-2 pt-2 flex-shrink-0"
        style={{ borderColor: "#ffffff", fontSize: "0.9em", letterSpacing: "2px", color: "#ffffff" }}
      >
        ALL NOTES ({notes.length})
      </div>

      {/* Scrolling viewport */}
      <div ref={viewportRef} className="flex-1 overflow-y-auto px-2">
        {notes.map((note, i) => {
          const isCursor = i === cursor;
          const isExpanded = expandedIndex === i;
          const bk = BOOK_META[note.bookIndex];
          const bookName = bk?.name?.toUpperCase() ?? "?";
          const ref = `${bookName} ${note.chapter + 1}:${note.verse + 1}`;

          // Get the verse text if expanded and bible is loaded
          let verseText = "";
          if (isExpanded && bible) {
            const verses = getChapterVerses(bible, note.bookIndex, note.chapter);
            verseText = (verses[note.verse] ?? "").replace(/\{[^}]*\}/g, "").trim();
          }

          return (
            <div
              key={i}
              ref={isCursor ? activeRef : undefined}
              className="border-b py-1 cursor-pointer"
              style={{
                borderColor: "#1a1a1a",
                backgroundColor: isCursor ? "#0a0a0a" : "transparent",
                borderLeft: isCursor ? "3px solid #ffffff" : "3px solid transparent",
                paddingLeft: "6px",
              }}
              onClick={() => {
                setCursor(i);
                onJumpToVerse(note.bookIndex, note.chapter, note.verse);
              }}
            >
              {/* Collapsed: reference + truncated note */}
              <div style={{ color: "#ffffff", fontSize: "0.8em", letterSpacing: "1px" }}>
                {ref}
              </div>
              <div style={{ color: "#999999", fontSize: "0.9em", marginTop: "2px" }}>
                {isExpanded
                  ? null
                  : (note.text.length > 80 ? note.text.slice(0, 80) + "..." : note.text)}
              </div>

              {/* Expanded: verse text + full note */}
              {isExpanded && (
                <div style={{ marginTop: "4px" }}>
                  {/* The verse */}
                  <div
                    className="border-l-2 pl-2 mb-2"
                    style={{
                      borderColor: "#333333",
                      color: "#666666",
                      fontSize: "0.9em",
                      lineHeight: "14px",
                    }}
                  >
                    &ldquo;{verseText}&rdquo;
                  </div>

                  {/* The full note */}
                  <div
                    style={{
                      color: "#ffffff",
                      fontSize: "0.9em",
                      lineHeight: "14px",
                      whiteSpace: "pre-wrap",
                      wordBreak: "break-word",
                    }}
                  >
                    {note.text}
                  </div>

                  {/* Timestamp */}
                  <div style={{ color: "#333333", fontSize: "0.7em", marginTop: "4px" }}>
                    {new Date(note.updatedAt).toLocaleDateString()}
                  </div>
                </div>
              )}
            </div>
          );
        })}

        {/* Bottom padding */}
        <div style={{ height: "40vh" }} />
      </div>

      {/* Footer */}
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
        {cursor + 1}/{notes.length} {expandedIndex === cursor ? "Q:COLLAPSE" : "Q:EXPAND"} W:GO TO VERSE
      </div>
    </div>
  );
}
