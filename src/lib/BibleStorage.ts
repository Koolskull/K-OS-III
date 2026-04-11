/*
 *        ☦
 *   ╔════════════════╗
 *   ║  STUDY BIBLE   ║
 *   ║  STORAGE       ║
 *   ╚════════════════╝
 *
 *   Persists notes, highlights, and reading position
 *   to localStorage. Export/import as JSON study files.
 */

import type { BibleUserData, BiblePrefs, StudyBibleExport, VerseHighlight, VerseNote } from "@/types/bible";

const STORAGE_KEY = "datamoshpit_bible_userdata";
const PREFS_KEY = "datamoshpit_bible_prefs";

function defaultUserData(): BibleUserData {
  return {
    highlights: [],
    notes: [],
    lastPosition: { bookIndex: 0, chapter: 0, verse: 0 },
  };
}

export function loadBibleUserData(): BibleUserData {
  if (typeof window === "undefined") return defaultUserData();
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return defaultUserData();
    return JSON.parse(raw) as BibleUserData;
  } catch {
    return defaultUserData();
  }
}

export function saveBibleUserData(data: BibleUserData): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

export function defaultBiblePrefs(): BiblePrefs {
  return { font: "kongtext", fontSize: 10, autoSave: true };
}

export function loadBiblePrefs(): BiblePrefs {
  if (typeof window === "undefined") return defaultBiblePrefs();
  try {
    const raw = localStorage.getItem(PREFS_KEY);
    if (!raw) return defaultBiblePrefs();
    const parsed = JSON.parse(raw);
    const merged = { ...defaultBiblePrefs(), ...parsed };
    if (typeof merged.fontSize !== "number" || isNaN(merged.fontSize)) {
      merged.fontSize = 10;
    }
    return merged;
  } catch {
    return defaultBiblePrefs();
  }
}

export function saveBiblePrefs(prefs: BiblePrefs): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(PREFS_KEY, JSON.stringify(prefs));
}

export function getHighlight(
  data: BibleUserData,
  bookIndex: number,
  chapter: number,
  verse: number,
): VerseHighlight | undefined {
  return data.highlights.find(
    (h) => h.bookIndex === bookIndex && h.chapter === chapter && h.verse === verse,
  );
}

export function getNote(
  data: BibleUserData,
  bookIndex: number,
  chapter: number,
  verse: number,
): VerseNote | undefined {
  return data.notes.find(
    (n) => n.bookIndex === bookIndex && n.chapter === chapter && n.verse === verse,
  );
}

export function setHighlight(
  data: BibleUserData,
  bookIndex: number,
  chapter: number,
  verse: number,
  color: string | null,
): BibleUserData {
  const filtered = data.highlights.filter(
    (h) => !(h.bookIndex === bookIndex && h.chapter === chapter && h.verse === verse),
  );
  if (color) {
    filtered.push({ bookIndex, chapter, verse, color });
  }
  return { ...data, highlights: filtered };
}

export function setNote(
  data: BibleUserData,
  bookIndex: number,
  chapter: number,
  verse: number,
  text: string,
): BibleUserData {
  const now = new Date().toISOString();
  const filtered = data.notes.filter(
    (n) => !(n.bookIndex === bookIndex && n.chapter === chapter && n.verse === verse),
  );
  if (text.trim()) {
    filtered.push({ bookIndex, chapter, verse, text, createdAt: now, updatedAt: now });
  }
  return { ...data, notes: filtered };
}

export function exportStudyBible(data: BibleUserData): string {
  const exp: StudyBibleExport = {
    version: "1.0",
    exportedAt: new Date().toISOString(),
    translation: "KJV",
    userData: data,
  };
  return JSON.stringify(exp, null, 2);
}

export function importStudyBible(json: string): BibleUserData | null {
  try {
    const parsed = JSON.parse(json) as StudyBibleExport;
    if (parsed.userData && Array.isArray(parsed.userData.highlights)) {
      return parsed.userData;
    }
    return null;
  } catch {
    return null;
  }
}

export function downloadAsFile(content: string, filename: string): void {
  const blob = new Blob([content], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
