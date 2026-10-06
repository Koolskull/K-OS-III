/*
 *                    ☦
 *            ╔═══════════════════╗
 *            ║  K-OS III        ║
 *            ║  WEEKLY BUILD    ║
 *            ║  LOG DATA        ║
 *            ╚═══════════════════╝
 *
 * Static, typed weekly build log entries for the in-OS UPDATES app.
 * Minimal schema: week id, display range, and three worksheet columns
 * from public/education/creativity/tools/weekly-build-log.md:
 *   Built · Reused · Compounded
 */

export interface BuildLogEntry {
  /** Week identifier, usually the Monday start date YYYY-MM-DD */
  id: string;
  /** Human display range, e.g. "2026-10-05 — 2026-10-11" */
  weekRange: string;
  /** What was made this week */
  built: string;
  /** Where it showed up again (reuse across the system) */
  reused: string;
  /** What that reuse multiplied (compounding) */
  compounded: string;
  /** Optional freeform source note (commit shas, PR link, etc.) */
  source?: string;
}

export const BUILD_LOG: BuildLogEntry[] = [
  {
    id: "2026-10-05",
    weekRange: "2026-10-05 — 2026-10-11",
    built:
      "Wired Creativity as the Way Out as a full in-OS EDUCATION track: 6 lessons + 6 offline tools, catalog + quizzes, and repo docs alignment.",
    reused:
      "Education app renders markdown tracks offline; cross-links across Sovereignty, Culture Machines, and Backstage; shells and kos:// deep-links reused for in-OS navigation.",
    compounded:
      "Curriculum value compounds: more users can learn completely offline; future lessons and tools slot into the same app without new infra.",
    source:
      "Commits this week include 934cbac7, 25051825, 9baa736e, e6791f73, efac5713, 7916c7fd, a2f55950, 5cbdd65d.",
  },
  // Add future weeks above this comment — newest first in the UI
];

/** Derive a sorted copy (newest first by id when ids are ISO dates) */
export function sortedBuildLog(entries: readonly BuildLogEntry[]): BuildLogEntry[] {
  return entries.slice().sort((a, b) => (a.id < b.id ? 1 : a.id > b.id ? -1 : 0));
}

