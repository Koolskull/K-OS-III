/*
 *        ☦
 *   ╔════════════════╗
 *   ║  SCRIPTURE     ║
 *   ║  DATA LOADER   ║
 *   ╚════════════════╝
 *
 *   Lazy-loads the KJV Bible JSON (~4.8 MB)
 *   only when the Bible reader is activated.
 */

import type { KjvBible, BibleBookMeta } from "@/types/bible";

let cachedBible: KjvBible | null = null;

/** Fetch and cache the KJV Bible text */
export async function loadKjvBible(): Promise<KjvBible> {
  if (cachedBible) return cachedBible;
  const res = await fetch("/bible/kjv.json");
  cachedBible = await res.json();
  return cachedBible!;
}

/** 66 canonical books in order, matching KJV JSON array indices */
export const BOOK_META: BibleBookMeta[] = [
  { index: 0,  name: "Genesis",         chapterCount: 50, isNewTestament: false },
  { index: 1,  name: "Exodus",          chapterCount: 40, isNewTestament: false },
  { index: 2,  name: "Leviticus",       chapterCount: 27, isNewTestament: false },
  { index: 3,  name: "Numbers",         chapterCount: 36, isNewTestament: false },
  { index: 4,  name: "Deuteronomy",     chapterCount: 34, isNewTestament: false },
  { index: 5,  name: "Joshua",          chapterCount: 24, isNewTestament: false },
  { index: 6,  name: "Judges",          chapterCount: 21, isNewTestament: false },
  { index: 7,  name: "Ruth",            chapterCount: 4,  isNewTestament: false },
  { index: 8,  name: "1 Samuel",        chapterCount: 31, isNewTestament: false },
  { index: 9,  name: "2 Samuel",        chapterCount: 24, isNewTestament: false },
  { index: 10, name: "1 Kings",         chapterCount: 22, isNewTestament: false },
  { index: 11, name: "2 Kings",         chapterCount: 25, isNewTestament: false },
  { index: 12, name: "1 Chronicles",    chapterCount: 29, isNewTestament: false },
  { index: 13, name: "2 Chronicles",    chapterCount: 36, isNewTestament: false },
  { index: 14, name: "Ezra",            chapterCount: 10, isNewTestament: false },
  { index: 15, name: "Nehemiah",        chapterCount: 13, isNewTestament: false },
  { index: 16, name: "Esther",          chapterCount: 10, isNewTestament: false },
  { index: 17, name: "Job",             chapterCount: 42, isNewTestament: false },
  { index: 18, name: "Psalms",          chapterCount: 150,isNewTestament: false },
  { index: 19, name: "Proverbs",        chapterCount: 31, isNewTestament: false },
  { index: 20, name: "Ecclesiastes",    chapterCount: 12, isNewTestament: false },
  { index: 21, name: "Song of Solomon", chapterCount: 8,  isNewTestament: false },
  { index: 22, name: "Isaiah",          chapterCount: 66, isNewTestament: false },
  { index: 23, name: "Jeremiah",        chapterCount: 52, isNewTestament: false },
  { index: 24, name: "Lamentations",    chapterCount: 5,  isNewTestament: false },
  { index: 25, name: "Ezekiel",         chapterCount: 48, isNewTestament: false },
  { index: 26, name: "Daniel",          chapterCount: 12, isNewTestament: false },
  { index: 27, name: "Hosea",           chapterCount: 14, isNewTestament: false },
  { index: 28, name: "Joel",            chapterCount: 3,  isNewTestament: false },
  { index: 29, name: "Amos",            chapterCount: 9,  isNewTestament: false },
  { index: 30, name: "Obadiah",         chapterCount: 1,  isNewTestament: false },
  { index: 31, name: "Jonah",           chapterCount: 4,  isNewTestament: false },
  { index: 32, name: "Micah",           chapterCount: 7,  isNewTestament: false },
  { index: 33, name: "Nahum",           chapterCount: 3,  isNewTestament: false },
  { index: 34, name: "Habakkuk",        chapterCount: 3,  isNewTestament: false },
  { index: 35, name: "Zephaniah",       chapterCount: 3,  isNewTestament: false },
  { index: 36, name: "Haggai",          chapterCount: 2,  isNewTestament: false },
  { index: 37, name: "Zechariah",       chapterCount: 14, isNewTestament: false },
  { index: 38, name: "Malachi",         chapterCount: 4,  isNewTestament: false },
  { index: 39, name: "Matthew",         chapterCount: 28, isNewTestament: true  },
  { index: 40, name: "Mark",            chapterCount: 16, isNewTestament: true  },
  { index: 41, name: "Luke",            chapterCount: 24, isNewTestament: true  },
  { index: 42, name: "John",            chapterCount: 21, isNewTestament: true  },
  { index: 43, name: "Acts",            chapterCount: 28, isNewTestament: true  },
  { index: 44, name: "Romans",          chapterCount: 16, isNewTestament: true  },
  { index: 45, name: "1 Corinthians",   chapterCount: 16, isNewTestament: true  },
  { index: 46, name: "2 Corinthians",   chapterCount: 13, isNewTestament: true  },
  { index: 47, name: "Galatians",       chapterCount: 6,  isNewTestament: true  },
  { index: 48, name: "Ephesians",       chapterCount: 6,  isNewTestament: true  },
  { index: 49, name: "Philippians",     chapterCount: 4,  isNewTestament: true  },
  { index: 50, name: "Colossians",      chapterCount: 4,  isNewTestament: true  },
  { index: 51, name: "1 Thessalonians", chapterCount: 5,  isNewTestament: true  },
  { index: 52, name: "2 Thessalonians", chapterCount: 3,  isNewTestament: true  },
  { index: 53, name: "1 Timothy",       chapterCount: 6,  isNewTestament: true  },
  { index: 54, name: "2 Timothy",       chapterCount: 4,  isNewTestament: true  },
  { index: 55, name: "Titus",           chapterCount: 3,  isNewTestament: true  },
  { index: 56, name: "Philemon",        chapterCount: 1,  isNewTestament: true  },
  { index: 57, name: "Hebrews",         chapterCount: 13, isNewTestament: true  },
  { index: 58, name: "James",           chapterCount: 5,  isNewTestament: true  },
  { index: 59, name: "1 Peter",         chapterCount: 5,  isNewTestament: true  },
  { index: 60, name: "2 Peter",         chapterCount: 3,  isNewTestament: true  },
  { index: 61, name: "1 John",          chapterCount: 5,  isNewTestament: true  },
  { index: 62, name: "2 John",          chapterCount: 1,  isNewTestament: true  },
  { index: 63, name: "3 John",          chapterCount: 1,  isNewTestament: true  },
  { index: 64, name: "Jude",            chapterCount: 1,  isNewTestament: true  },
  { index: 65, name: "Revelation",      chapterCount: 22, isNewTestament: true  },
];

/** Get verses for a specific chapter */
export function getChapterVerses(bible: KjvBible, bookIndex: number, chapter: number): string[] {
  return bible[bookIndex]?.Chapters[chapter] ?? [];
}
