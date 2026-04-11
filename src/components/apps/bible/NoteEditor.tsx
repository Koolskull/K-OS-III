/*
 *        ☦
 *   ╔══════════════╗
 *   ║ NOTE EDITOR  ║
 *   ║ Prayers &    ║
 *   ║ Reflections  ║
 *   ╚══════════════╝
 *
 *   Write notes, prayers, and reflections on any verse.
 *   Full keyboard text input + on-screen keyboard for touch.
 */

"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";

interface NoteEditorProps {
  bookName: string;
  chapter: number;
  verse: number;
  verseText: string;
  initialText: string;
  onSave: (text: string) => void;
  onCancel: () => void;
}

const ONSCREEN_ROWS = [
  ["Q", "W", "E", "R", "T", "Y", "U", "I", "O", "P"],
  ["A", "S", "D", "F", "G", "H", "J", "K", "L"],
  ["Z", "X", "C", "V", "B", "N", "M", ",", "."],
  ["SPACE", "BACK", "ENTER"],
];

export function NoteEditor({
  bookName,
  chapter,
  verse,
  verseText,
  initialText,
  onSave,
  onCancel,
}: NoteEditorProps) {
  const [text, setText] = useState(initialText);
  const [showKeyboard, setShowKeyboard] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Focus textarea on mount
  useEffect(() => {
    textareaRef.current?.focus();
  }, []);

  // Keyboard handling (capture phase) — intercept all keys for text input
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Escape = cancel
      if (e.key === "Escape") {
        e.preventDefault();
        e.stopPropagation();
        onCancel();
        return;
      }

      // Let the textarea handle normal text input naturally
      // Only intercept special combos
      if (e.ctrlKey || e.metaKey) {
        if (e.key === "s" || e.key === "S") {
          e.preventDefault();
          e.stopPropagation();
          onSave(text);
          return;
        }
        // Let Ctrl+C/V/X/Z pass through to textarea
        return;
      }

      // Stop propagation for all other keys so they don't leak to Bible/tracker
      e.stopPropagation();
    };

    window.addEventListener("keydown", handleKeyDown, true);
    return () => window.removeEventListener("keydown", handleKeyDown, true);
  }, [text, onSave, onCancel]);

  const handleOnScreenKey = useCallback((key: string) => {
    if (key === "SPACE") {
      setText((t) => t + " ");
    } else if (key === "BACK") {
      setText((t) => t.slice(0, -1));
    } else if (key === "ENTER") {
      setText((t) => t + "\n");
    } else {
      setText((t) => t + key.toLowerCase());
    }
    textareaRef.current?.focus();
  }, []);

  // Strip {annotations} for display
  const cleanVerse = verseText.replace(/\{[^}]*\}/g, "").trim();

  return (
    <div
      className="h-full flex flex-col select-none p-2"
      style={{
        fontSize: "inherit",
      }}
    >
      {/* Verse reference */}
      <div
        className="border-b mb-2 pb-1"
        style={{
          borderColor: "#ffffff",
          fontSize: "0.9em",
          letterSpacing: "2px",
          color: "#ffffff",
        }}
      >
        {bookName.toUpperCase()} {chapter + 1}:{verse + 1} - NOTE
      </div>

      {/* Verse text (dimmed) */}
      <div
        className="mb-2 px-1"
        style={{
          fontSize: "0.9em",
          color: "#555555",
          lineHeight: "14px",
          maxHeight: "60px",
          overflow: "hidden",
        }}
      >
        &ldquo;{cleanVerse}&rdquo;
      </div>

      {/* Text input area */}
      <textarea
        ref={textareaRef}
        value={text}
        onChange={(e) => setText(e.target.value)}
        className="flex-1 w-full resize-none outline-none border p-2"
        style={{
          backgroundColor: "#0a0a0a",
          borderColor: "#333333",
          color: "#ffffff",
          fontFamily: "inherit",
          fontSize: "1em",
          lineHeight: "16px",
          minHeight: "80px",
        }}
        placeholder="Write your note, prayer, or reflection..."
      />

      {/* Action buttons */}
      <div className="flex gap-2 mt-2">
        <button
          className="border px-3 py-1 cursor-pointer"
          style={{
            borderColor: "#ffffff",
            backgroundColor: "#1a1a1a",
            color: "#ffffff",
            fontFamily: "inherit",
            fontSize: "0.8em",
            letterSpacing: "1px",
          }}
          onClick={() => onSave(text)}
        >
          SAVE (CTRL+S)
        </button>
        <button
          className="border px-3 py-1 cursor-pointer"
          style={{
            borderColor: "#444444",
            backgroundColor: "#000000",
            color: "#888888",
            fontFamily: "inherit",
            fontSize: "0.8em",
            letterSpacing: "1px",
          }}
          onClick={onCancel}
        >
          CANCEL (ESC)
        </button>
        <button
          className="border px-3 py-1 cursor-pointer ml-auto"
          style={{
            borderColor: "#444444",
            backgroundColor: showKeyboard ? "#1a1a1a" : "#000000",
            color: showKeyboard ? "#ffffff" : "#666666",
            fontFamily: "inherit",
            fontSize: "0.8em",
            letterSpacing: "1px",
          }}
          onClick={() => setShowKeyboard(!showKeyboard)}
        >
          KB
        </button>
      </div>

      {/* On-screen keyboard (for touch / handheld) */}
      {showKeyboard && (
        <div className="mt-2 border-t pt-2" style={{ borderColor: "#333333" }}>
          {ONSCREEN_ROWS.map((row, ri) => (
            <div key={ri} className="flex gap-1 mb-1 justify-center">
              {row.map((key) => (
                <button
                  key={key}
                  className="border px-1 py-1 cursor-pointer"
                  style={{
                    minWidth: key === "SPACE" ? "120px" : key === "BACK" || key === "ENTER" ? "50px" : "24px",
                    borderColor: "#333333",
                    backgroundColor: "#0a0a0a",
                    color: "#888888",
                    fontFamily: "inherit",
                    fontSize: "0.8em",
                    textAlign: "center",
                  }}
                  onClick={() => handleOnScreenKey(key)}
                >
                  {key === "SPACE" ? "___" : key === "BACK" ? "DEL" : key}
                </button>
              ))}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
