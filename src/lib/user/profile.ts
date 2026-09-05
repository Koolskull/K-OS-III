/**
 * Local-first user profile for K-OS III.
 * Education completions (and later app progress) live here so a single
 * "transcript" can be shown / exported / shared without accounts.
 *
 * Storage is browser localStorage only (static export safe).
 * Multi-device sync would need a later backend — not in this shell.
 */

import type { ProgressMap } from "@/lib/education/types";
import { EDUCATION_TRACKS } from "@/lib/education/catalog";

const KEY = "kos-user-profile-v1";

export interface KosUserProfile {
  version: 1;
  displayName: string;
  handle: string;
  /** Mirror of education progress (lessonId → status) */
  education: ProgressMap;
  /** When the profile was last written */
  updatedAt: string;
  /** Optional freeform blurb for share cards */
  bio?: string;
}

export function emptyProfile(): KosUserProfile {
  return {
    version: 1,
    displayName: "",
    handle: "",
    education: {},
    updatedAt: new Date().toISOString(),
  };
}

export function loadProfile(): KosUserProfile {
  if (typeof window === "undefined") return emptyProfile();
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return emptyProfile();
    const parsed = JSON.parse(raw) as Partial<KosUserProfile>;
    if (!parsed || typeof parsed !== "object") return emptyProfile();
    return {
      version: 1,
      displayName: typeof parsed.displayName === "string" ? parsed.displayName : "",
      handle: typeof parsed.handle === "string" ? parsed.handle : "",
      education:
        parsed.education && typeof parsed.education === "object" ? parsed.education : {},
      updatedAt:
        typeof parsed.updatedAt === "string" ? parsed.updatedAt : new Date().toISOString(),
      bio: typeof parsed.bio === "string" ? parsed.bio : undefined,
    };
  } catch {
    return emptyProfile();
  }
}

export function saveProfile(profile: KosUserProfile): KosUserProfile {
  const next: KosUserProfile = {
    ...profile,
    version: 1,
    updatedAt: new Date().toISOString(),
  };
  if (typeof window !== "undefined") {
    try {
      window.localStorage.setItem(KEY, JSON.stringify(next));
    } catch {
      /* quota / private mode */
    }
  }
  return next;
}

/** Merge education progress into the profile (progress is source of truth). */
export function syncEducationIntoProfile(education: ProgressMap): KosUserProfile {
  const p = loadProfile();
  return saveProfile({ ...p, education: { ...education } });
}

export function updateIdentity(partial: {
  displayName?: string;
  handle?: string;
  bio?: string;
}): KosUserProfile {
  const p = loadProfile();
  return saveProfile({
    ...p,
    displayName:
      partial.displayName !== undefined ? partial.displayName.trim() : p.displayName,
    handle: partial.handle !== undefined ? normalizeHandle(partial.handle) : p.handle,
    bio: partial.bio !== undefined ? partial.bio : p.bio,
  });
}

function normalizeHandle(h: string): string {
  const s = h.trim().replace(/^@+/, "").replace(/[^a-zA-Z0-9_-]/g, "").slice(0, 24);
  return s;
}

export interface TranscriptLine {
  trackTitle: string;
  passed: number;
  total: number;
  lessons: { id: string; title: string; status: string; score?: string }[];
}

function countPassed(education: ProgressMap, lessonIds: string[]) {
  let passed = 0;
  for (const id of lessonIds) {
    if (education[id]?.status === "passed") passed++;
  }
  return { passed, total: lessonIds.length };
}

export function buildTranscript(education: ProgressMap): TranscriptLine[] {
  return EDUCATION_TRACKS.map((track) => {
    const ids = track.lessons.map((l) => l.id);
    const stats = countPassed(education, ids);
    return {
      trackTitle: track.title,
      passed: stats.passed,
      total: stats.total,
      lessons: track.lessons.map((l) => {
        const st = education[l.id];
        return {
          id: l.id,
          title: l.title,
          status: st?.status ?? "unread",
          score:
            st?.score != null && st?.total != null ? `${st.score}/${st.total}` : undefined,
        };
      }),
    };
  });
}

/** Plaintext card for clipboard / social paste */
export function formatTranscriptCard(profile: KosUserProfile): string {
  const name =
    profile.displayName ||
    (profile.handle ? `@${profile.handle}` : "Anonymous operator");
  const handle = profile.handle ? ` (@${profile.handle})` : "";
  const lines = buildTranscript(profile.education);
  const totalPassed = lines.reduce((a, t) => a + t.passed, 0);
  const totalLessons = lines.reduce((a, t) => a + t.total, 0);

  const body = lines
    .map((t) => {
      const checks = t.lessons
        .map((l) => {
          const mark =
            l.status === "passed" ? "✓" : l.status === "failed" ? "✗" : l.status === "reading" ? "·" : "○";
          const score = l.score ? ` ${l.score}` : "";
          return `  ${mark} ${l.title}${score}`;
        })
        .join("\n");
      return `${t.trackTitle}  ${t.passed}/${t.total}\n${checks}`;
    })
    .join("\n\n");

  return [
    `K-OS EDUCATION TRANSCRIPT`,
    `${name}${handle}`,
    `Passed ${totalPassed} / ${totalLessons} lessons`,
    `Updated ${profile.updatedAt.slice(0, 10)}`,
    ``,
    body,
    ``,
    `Prove all things. Hold fast that which is good.`,
    `— 2kool.tv / K-OS III`,
  ].join("\n");
}

export function downloadTranscriptJson(profile: KosUserProfile): void {
  if (typeof window === "undefined") return;
  const blob = new Blob([JSON.stringify(profile, null, 2)], {
    type: "application/json",
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `kos-education-transcript-${(profile.handle || "operator").toLowerCase()}.json`;
  a.click();
  URL.revokeObjectURL(url);
}
