/*
 *                    ☦
 *               _____|_____
 *              |           |
 *              |  HOLY     |
 *              |  SCRIPTURE|
 *              |___________|
 *              |     |     |
 *              |     |     |
 *              |_____|_____|
 *
 *   Type definitions for the integrated Bible reader.
 *   "Thy word is a lamp unto my feet,
 *    and a light unto my path." — Psalm 119:105
 */

/** KJV JSON structure: array of books, each with chapters of verse strings */
export interface KjvBook {
  Abbreviation: string;
  Chapters: string[][];
}
export type KjvBible = KjvBook[];

/** Resolved book metadata */
export interface BibleBookMeta {
  index: number;
  name: string;
  chapterCount: number;
  isNewTestament: boolean;
}

/** Which sub-screen of the Bible reader is active */
export type BibleScreen = "reading" | "books" | "chapters" | "notes" | "preferences";

/** Navigation state */
export interface BibleNavigation {
  bookIndex: number;
  chapter: number;   // 0-indexed
  verse: number;     // 0-indexed
  screen: BibleScreen;
}

/** A user highlight on a verse */
export interface VerseHighlight {
  bookIndex: number;
  chapter: number;
  verse: number;
  color: string; // hex color
}

/** A user note on a verse */
export interface VerseNote {
  bookIndex: number;
  chapter: number;
  verse: number;
  text: string;
  createdAt: string;
  updatedAt: string;
}

/** All user-generated Bible study data */
export interface BibleUserData {
  highlights: VerseHighlight[];
  notes: VerseNote[];
  lastPosition: { bookIndex: number; chapter: number; verse: number };
}

/** Persistent Bible reader preferences */
export interface BiblePrefs {
  font: string;
  fontSize: number;
  autoSave: boolean;
}

/** Export format for study Bible files */
export interface StudyBibleExport {
  version: string;
  exportedAt: string;
  translation: string;
  userData: BibleUserData;
}
