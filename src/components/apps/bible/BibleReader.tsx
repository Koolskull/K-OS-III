/*
 *                    ☦
 *            ╔══════════════════╗
 *            ║  ST. JEROME      ║
 *            ║  Patron of       ║
 *            ║  Translators     ║
 *            ╚══════════════════╝
 *
 *   ┌──────────────────────────────┐
 *   │  ✝ TEMPLAR GUARD ✝         │
 *   │  of the HOLY SCRIPTURE      │
 *   └──────────────────────────────┘
 *
 *   BIBLE READER
 *   An integrated e-reader for the King James Bible.
 *   Activated by the hidden sequence: Shift+Q, UP DOWN LEFT RIGHT.
 *
 *   "All Scripture is given by inspiration of God,
 *    and is profitable for doctrine, for reproof,
 *    for correction, for instruction in righteousness."
 *    — 2 Timothy 3:16
 */

"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import type { KjvBible, BibleNavigation, BibleScreen, BibleUserData, BiblePrefs } from "@/types/bible";
import { loadKjvBible, BOOK_META, getChapterVerses } from "@/lib/BibleDataLoader";
import {
  loadBibleUserData,
  saveBibleUserData,
  loadBiblePrefs,
  saveBiblePrefs,
  getHighlight,
  getNote,
  setHighlight,
  setNote,
  exportStudyBible,
  importStudyBible,
  downloadAsFile,
} from "@/lib/BibleStorage";
import { BookList } from "./BookList";
import { ChapterGrid } from "./ChapterGrid";
import { VerseReader } from "./VerseReader";
import { NoteEditor } from "./NoteEditor";
import { BiblePreferences } from "./BiblePreferences";
import { NotesList } from "./NotesList";
import { BibleScreenMap, navigateBibleScreen } from "./BibleScreenMap";

const HIGHLIGHT_COLORS = ["#8B0000", "#888888", "#006400", "#00008B", "#4B0082"];

export function BibleReader() {
  const [bible, setBible] = useState<KjvBible | null>(null);
  const [loading, setLoading] = useState(true);
  const [nav, setNav] = useState<BibleNavigation>({ bookIndex: 0, chapter: 0, verse: 0, screen: "reading" });
  const [userData, setUserData] = useState<BibleUserData>(() => loadBibleUserData());
  const [noteEditing, setNoteEditing] = useState(false);
  const [noteText, setNoteText] = useState("");
  const [prefs, setPrefs] = useState<BiblePrefs>(() => loadBiblePrefs());
  const containerRef = useRef<HTMLDivElement>(null);

  const handlePrefsChange = useCallback((next: BiblePrefs) => {
    setPrefs(next);
    saveBiblePrefs(next);
  }, []);

  // Load Bible data
  useEffect(() => {
    loadKjvBible().then((data) => {
      setBible(data);
      setLoading(false);
      // Restore last position
      const saved = loadBibleUserData();
      setUserData(saved);
      setNav((n) => ({
        ...n,
        bookIndex: saved.lastPosition.bookIndex,
        chapter: saved.lastPosition.chapter,
        verse: saved.lastPosition.verse,
      }));
    });
  }, []);

  // Save position on navigation changes
  useEffect(() => {
    const updated = { ...userData, lastPosition: { bookIndex: nav.bookIndex, chapter: nav.chapter, verse: nav.verse } };
    setUserData(updated);
    saveBibleUserData(updated);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [nav.bookIndex, nav.chapter, nav.verse]);

  const updateUserData = useCallback((updater: (prev: BibleUserData) => BibleUserData) => {
    setUserData((prev) => {
      const next = updater(prev);
      saveBibleUserData(next);
      return next;
    });
  }, []);

  const handleSelectBook = useCallback((bookIndex: number) => {
    setNav({ bookIndex, chapter: 0, verse: 0, screen: "chapters" });
  }, []);

  const handleSelectChapter = useCallback((chapter: number) => {
    setNav((n) => ({ ...n, chapter, verse: 0, screen: "reading" }));
  }, []);

  const handleBack = useCallback(() => {
    setNav((n) => {
      if (n.screen === "notes") return { ...n, screen: "reading" };
      if (n.screen === "chapters") return { ...n, screen: "books" };
      if (n.screen === "books") return { ...n, screen: "reading" };
      if (n.screen === "preferences") return { ...n, screen: "reading" };
      return { ...n, screen: "books" };
    });
  }, []);

  const handleToggleHighlight = useCallback(() => {
    updateUserData((prev) => {
      const existing = getHighlight(prev, nav.bookIndex, nav.chapter, nav.verse);
      if (existing) {
        const idx = HIGHLIGHT_COLORS.indexOf(existing.color);
        const nextIdx = idx + 1;
        if (nextIdx >= HIGHLIGHT_COLORS.length) {
          // Cycle past end = remove
          return setHighlight(prev, nav.bookIndex, nav.chapter, nav.verse, null);
        }
        return setHighlight(prev, nav.bookIndex, nav.chapter, nav.verse, HIGHLIGHT_COLORS[nextIdx]);
      }
      return setHighlight(prev, nav.bookIndex, nav.chapter, nav.verse, HIGHLIGHT_COLORS[0]);
    });
  }, [nav.bookIndex, nav.chapter, nav.verse, updateUserData]);

  const handleOpenNote = useCallback(() => {
    const existing = getNote(userData, nav.bookIndex, nav.chapter, nav.verse);
    setNoteText(existing?.text ?? "");
    setNoteEditing(true);
  }, [userData, nav.bookIndex, nav.chapter, nav.verse]);

  const handleSaveNote = useCallback((text: string) => {
    updateUserData((prev) => setNote(prev, nav.bookIndex, nav.chapter, nav.verse, text));
    setNoteEditing(false);
  }, [nav.bookIndex, nav.chapter, nav.verse, updateUserData]);

  const handleExport = useCallback(() => {
    const json = exportStudyBible(userData);
    downloadAsFile(json, `datamoshpit-study-bible-${new Date().toISOString().slice(0, 10)}.json`);
  }, [userData]);

  const handleImport = useCallback(() => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = ".json";
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = () => {
        const imported = importStudyBible(reader.result as string);
        if (imported) {
          setUserData(imported);
          saveBibleUserData(imported);
        }
      };
      reader.readAsText(file);
    };
    input.click();
  }, []);

  // Keyboard handling (capture phase)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Let the Konami sequence detector handle Shift+Q combos
      if (e.shiftKey && e.code === "KeyQ") return;
      if (e.code === "KeyQ") return;
      // Allow Shift through so Shift+Arrow screen nav works

      // Note editor captures its own input
      if (noteEditing) {
        if (e.key === "Escape") {
          e.preventDefault();
          e.stopPropagation();
          setNoteEditing(false);
          return;
        }
        // Let NoteEditor handle text input
        return;
      }

      const screen = nav.screen;
      let handled = true;

      // ── SHIFT + ARROWS = SCREEN NAVIGATION (spatial, matches map grid) ──
      if (e.shiftKey) {
        const dirMap: Record<string, "up" | "down" | "left" | "right"> = {
          ArrowUp: "up", ArrowDown: "down", ArrowLeft: "left", ArrowRight: "right",
        };
        const dir = dirMap[e.key];
        if (dir) {
          setNav((n) => {
            const next = navigateBibleScreen(n.screen, dir);
            return next ? { ...n, screen: next } : n;
          });
        } else {
          handled = false;
        }
        if (handled) {
          e.preventDefault();
          e.stopPropagation();
        }
        return;
      }

      // ── PLAIN ARROWS = CONTENT NAVIGATION ──
      switch (e.key) {
        case "ArrowUp":
          if (screen === "reading") {
            setNav((n) => ({ ...n, verse: Math.max(0, n.verse - 1) }));
          }
          break;
        case "ArrowDown":
          if (screen === "reading" && bible) {
            const verses = getChapterVerses(bible, nav.bookIndex, nav.chapter);
            setNav((n) => ({ ...n, verse: Math.min(verses.length - 1, n.verse + 1) }));
          }
          break;
        case "ArrowLeft":
          if (screen === "reading") {
            // Previous chapter
            setNav((n) => {
              if (n.chapter > 0) return { ...n, chapter: n.chapter - 1, verse: 0 };
              if (n.bookIndex > 0) {
                const prevBook = BOOK_META[n.bookIndex - 1];
                return { ...n, bookIndex: n.bookIndex - 1, chapter: prevBook.chapterCount - 1, verse: 0 };
              }
              return n;
            });
          }
          break;
        case "ArrowRight":
          if (screen === "reading") {
            // Next chapter
            setNav((n) => {
              const book = BOOK_META[n.bookIndex];
              if (n.chapter < book.chapterCount - 1) return { ...n, chapter: n.chapter + 1, verse: 0 };
              if (n.bookIndex < 65) return { ...n, bookIndex: n.bookIndex + 1, chapter: 0, verse: 0 };
              return n;
            });
          }
          break;
        case "w":
        case "W":
        case "Enter":
          // Confirm / select
          break;
        case "x":
        case "X":
        case "Backspace":
          handleBack();
          break;
        case " ":
          if (screen === "reading") handleOpenNote();
          break;
        case "Tab":
          e.preventDefault();
          if (screen === "reading") handleToggleHighlight();
          break;
        default:
          handled = false;
      }

      // F-key shortcuts for Bible screens
      if (e.key === "F1") { setNav((n) => ({ ...n, screen: "reading" })); handled = true; }
      if (e.key === "F2") { setNav((n) => ({ ...n, screen: "books" })); handled = true; }
      if (e.key === "F3") { setNav((n) => ({ ...n, screen: "chapters" })); handled = true; }
      if (e.key === "F4") { setNav((n) => ({ ...n, screen: "preferences" })); handled = true; }

      if (handled) {
        e.preventDefault();
        e.stopPropagation();
      }
    };

    window.addEventListener("keydown", handleKeyDown, true);
    return () => window.removeEventListener("keydown", handleKeyDown, true);
  }, [nav, bible, noteEditing, handleBack, handleOpenNote, handleToggleHighlight]);

  const hasCustomFont = prefs.font !== "kongtext" && prefs.font !== "sometype-mono";
  const resolvedFont = hasCustomFont
    ? `'${prefs.font}', var(--dm-font-primary)`
    : "var(--dm-font-primary)";

  const bookMeta = BOOK_META[nav.bookIndex];
  const verses = bible ? getChapterVerses(bible, nav.bookIndex, nav.chapter) : [];

  return (
    <div
      ref={containerRef}
      className="w-full h-full flex flex-col overflow-hidden"
      style={{
        backgroundColor: "#000000",
        fontFamily: resolvedFont,
        fontSize: `${prefs.fontSize}px`,
        imageRendering: "pixelated",
      }}
    >
      {/* Top status bar */}
      <div
        className="flex items-center justify-between px-2 py-0.5 border-b-2 flex-shrink-0"
        style={{ borderColor: "#1a1a1a", backgroundColor: "#000000", minHeight: "20px" }}
      >
        <div className="flex items-center gap-2">
          <BibleScreenMap active={nav.screen} />
          <span style={{ fontSize: "0.9em", color: "#ffffff", letterSpacing: "2px" }}>
            ☦ SCRIPTURE
          </span>
          <span style={{ fontSize: "0.9em", color: "#ffffff", letterSpacing: "1px" }}>
            {bookMeta?.name?.toUpperCase() ?? "---"} {nav.chapter + 1}:{nav.verse + 1}
          </span>
        </div>
        <span style={{ fontSize: "0.8em", color: "#555555", letterSpacing: "1px" }}>
          KJV
        </span>
      </div>

      {/* Screen tabs */}
      <div className="flex border-b flex-shrink-0" style={{ borderColor: "#1a1a1a" }}>
        {(["reading", "books", "chapters", "notes", "preferences"] as BibleScreen[]).map((screen) => (
          <button
            key={screen}
            className="flex-1 py-1 border-r cursor-pointer"
            style={{
              borderColor: "#1a1a1a",
              backgroundColor: screen === nav.screen ? "#1a1a1a" : "#000000",
              color: screen === nav.screen ? "#ffffff" : "#555555",
              fontFamily: "inherit",
              fontSize: "0.9em",
              letterSpacing: "1px",
            }}
            onClick={() => setNav((n) => ({ ...n, screen }))}
          >
            {screen === "reading" ? "READ" : screen === "books" ? "BOOK" : screen === "chapters" ? "CH" : screen === "notes" ? "NOTE" : "PREF"}
          </button>
        ))}
      </div>

      {/* Main content */}
      <div className="flex-1 relative overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <span style={{ color: "#ffffff", fontSize: "1em", letterSpacing: "3px" }}>
              LOADING SCRIPTURE...
            </span>
          </div>
        ) : noteEditing ? (
          <NoteEditor
            bookName={bookMeta?.name ?? ""}
            chapter={nav.chapter}
            verse={nav.verse}
            verseText={verses[nav.verse] ?? ""}
            initialText={noteText}
            onSave={handleSaveNote}
            onCancel={() => setNoteEditing(false)}
          />
        ) : nav.screen === "reading" ? (
          <VerseReader
            verses={verses}
            activeVerse={nav.verse}
            onVerseSelect={(v) => setNav((n) => ({ ...n, verse: v }))}
            highlights={userData.highlights.filter(
              (h) => h.bookIndex === nav.bookIndex && h.chapter === nav.chapter,
            )}
            notes={userData.notes.filter(
              (n) => n.bookIndex === nav.bookIndex && n.chapter === nav.chapter,
            )}
          />
        ) : nav.screen === "books" ? (
          <BookList
            activeIndex={nav.bookIndex}
            onSelect={handleSelectBook}
          />
        ) : nav.screen === "chapters" ? (
          <ChapterGrid
            bookName={bookMeta?.name ?? ""}
            chapterCount={bookMeta?.chapterCount ?? 0}
            activeChapter={nav.chapter}
            onSelect={handleSelectChapter}
          />
        ) : nav.screen === "notes" ? (
          <NotesList
            notes={userData.notes}
            bible={bible}
            onJumpToVerse={(bookIndex, chapter, verse) =>
              setNav({ bookIndex, chapter, verse, screen: "reading" })
            }
          />
        ) : nav.screen === "preferences" ? (
          <BiblePreferences
            onExport={handleExport}
            onImport={handleImport}
            onClearData={() => {
              const fresh = { highlights: [], notes: [], lastPosition: { bookIndex: 0, chapter: 0, verse: 0 } };
              setUserData(fresh);
              saveBibleUserData(fresh);
            }}
            noteCount={userData.notes.length}
            highlightCount={userData.highlights.length}
            prefs={prefs}
            onPrefsChange={handlePrefsChange}
          />
        ) : null}
      </div>

      {/* Bottom bar */}
      <div
        className="flex items-center justify-between px-2 py-1 border-t-2 flex-shrink-0"
        style={{ borderColor: "#1a1a1a", backgroundColor: "#000000", minHeight: "28px" }}
      >
        <span style={{ fontSize: "0.8em", color: "#555555", letterSpacing: "1px" }}>
          {nav.screen === "reading"
            ? "UP/DN:VERSE  L/R:CH  SHIFT+:NAV  TAB:HL  SPACE:NOTE  X:BACK"
            : nav.screen === "notes"
              ? "UP/DN:SCROLL  Q:EXPAND  W:GO TO VERSE  SHIFT+:NAV"
              : nav.screen === "preferences"
                ? "UP/DN:SELECT  Q+ARROW:CHANGE  W:CONFIRM  SHIFT+:NAV"
                : "ARROWS:MOVE  SHIFT+:NAV  W:SELECT  X:BACK"}
        </span>
        <span style={{ fontSize: "0.8em", color: "#555555", letterSpacing: "1px" }}>
          ☦
        </span>
      </div>
    </div>
  );
}
