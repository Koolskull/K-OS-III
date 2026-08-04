import type { LessonProgress, ProgressMap } from "./types";

const KEY = "kos-education-progress-v1";

export function loadProgress(): ProgressMap {
  if (typeof window === "undefined") return {};
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as ProgressMap;
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}

export function saveProgress(map: ProgressMap): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(KEY, JSON.stringify(map));
  } catch {
    /* quota / private mode */
  }
}

export function markReading(map: ProgressMap, lessonId: string): ProgressMap {
  const prev = map[lessonId];
  if (prev?.status === "passed") return map;
  const next: ProgressMap = {
    ...map,
    [lessonId]: {
      ...prev,
      status: "reading",
    },
  };
  saveProgress(next);
  return next;
}

export function recordQuizResult(
  map: ProgressMap,
  lessonId: string,
  score: number,
  total: number,
  passed: boolean,
): ProgressMap {
  const now = new Date().toISOString();
  const entry: LessonProgress = {
    status: passed ? "passed" : "failed",
    score,
    total,
    lastScoreAt: now,
    passedAt: passed ? now : map[lessonId]?.passedAt,
  };
  // Keep passed if they already passed earlier and this attempt failed
  if (!passed && map[lessonId]?.status === "passed") {
    entry.status = "passed";
    entry.passedAt = map[lessonId].passedAt;
  }
  const next = { ...map, [lessonId]: entry };
  saveProgress(next);
  return next;
}

export function trackStats(map: ProgressMap, lessonIds: string[]) {
  let passed = 0;
  let attempted = 0;
  for (const id of lessonIds) {
    const s = map[id]?.status;
    if (s === "passed") passed++;
    if (s === "passed" || s === "failed" || s === "reading") attempted++;
  }
  return { passed, total: lessonIds.length, attempted };
}
