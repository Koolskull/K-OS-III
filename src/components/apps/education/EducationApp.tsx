"use client";

/*
 *                    ☦
 *      EDUCATION — IN-OS APP
 *
 *  Reads public/education markdown tracks. Progress + MCQ checkouts
 *  stored in localStorage + kos-user-profile-v1 (shareable transcript). Static-export safe.
 */

import React, { useCallback, useEffect, useMemo, useState } from "react";
import { peekPending, subscribeKos, openKos } from "@/lib/os/kos-nav";
import { assetUrl } from "@/lib/assets";
import { EDUCATION_TRACKS, findLesson, lessonMarkdownPath } from "@/lib/education/catalog";
import { getQuiz } from "@/lib/education/quizzes";
import {
  loadProgress,
  markReading,
  recordQuizResult,
  trackStats,
} from "@/lib/education/progress";
import type { ProgressMap } from "@/lib/education/types";
import { renderMarkdown } from "@/lib/education/renderMarkdown";
import { findMdFile, mdDownloadFilename } from "@/lib/education/mdFiles";
import {
  loadProfile,
  updateIdentity,
  formatTranscriptCard,
  downloadTranscriptJson,
  syncEducationIntoProfile,
  type KosUserProfile,
} from "@/lib/user/profile";
import {
  CornerHost,
  CornerPanel,
  VerticalChromeToggle,
  CornerDismissLayer,
  useIsNarrow,
} from "@/components/ui/CornerChrome";
import { Academy } from "@/components/academy/Academy";

type Surface = "lessons" | "observatory";

type View =
  | { kind: "home" }
  | { kind: "track"; slug: string }
  | { kind: "lesson"; lessonId: string; mode: "read" | "quiz" }
  | { kind: "mdfile"; path: string };

function statusGlyph(status: string | undefined): string {
  if (status === "passed") return "✓";
  if (status === "failed") return "✗";
  if (status === "reading") return "·";
  return "○";
}

function statusColor(status: string | undefined): string {
  if (status === "passed") return "#66ff66";
  if (status === "failed") return "#ff6666";
  if (status === "reading") return "#ffcc00";
  return "#666";
}

function SurfaceTabs({
  surface,
  onChange,
}: {
  surface: Surface;
  onChange: (next: Surface) => void;
}) {
  return (
    <div
      style={{
        flexShrink: 0,
        display: "flex",
        background: "#000",
        borderBottom: "2px solid #fff",
        fontFamily: "var(--dm-font-primary), monospace",
        fontSize: 10,
        letterSpacing: 2,
      }}
    >
      {(
        [
          ["lessons", "LESSONS"],
          ["observatory", "OBSERVATORY"],
        ] as const
      ).map(([id, label]) => {
        const active = surface === id;
        return (
          <button
            key={id}
            type="button"
            onClick={() => onChange(id)}
            style={{
              background: active ? "#ffff00" : "transparent",
              color: active ? "#000" : "#fff",
              border: "none",
              borderRight: "2px solid #fff",
              padding: "6px 14px",
              fontFamily: "inherit",
              fontSize: "inherit",
              letterSpacing: "inherit",
              cursor: "pointer",
              fontWeight: 700,
            }}
          >
            {label}
          </button>
        );
      })}
    </div>
  );
}

export function EducationApp() {
  const [surface, setSurface] = useState<Surface>("lessons");

  useEffect(() => {
    const p = peekPending();
    if (p && p.app === "education") {
      // Route mdfile targets to the Education viewer; tracks/lessons to Academy.
      if ((p as any).kind === "mdfile") setSurface("observatory");
      else setSurface("lessons");
    }
    return subscribeKos((target) => {
      if (target.app === "education") {
        if ((target as any).kind === "mdfile") setSurface("observatory");
        else setSurface("lessons");
      }
    });
  }, []);

  if (surface === "lessons") {
    return (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          background: "#000",
          overflow: "hidden",
        }}
      >
        <SurfaceTabs surface={surface} onChange={setSurface} />
        <div style={{ flex: 1, minHeight: 0 }}>
          <Academy mode="window" initialRef={null} />
        </div>
      </div>
    );
  }

  return (
    <CornerHost storageKey="kos-education-chrome" style={{ background: "#000" }}>
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
        }}
      >
        <SurfaceTabs surface={surface} onChange={setSurface} />
        <div style={{ flex: 1, minHeight: 0 }}>
          <EducationInner />
        </div>
      </div>
    </CornerHost>
  );
}

function EducationInner() {
  const [view, setView] = useState<View>({ kind: "home" });
  const [progress, setProgress] = useState<ProgressMap>({});
  const [md, setMd] = useState<string | null>(null);
  const [mdError, setMdError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const isNarrow = useIsNarrow(720);

  useEffect(() => {
    const p = loadProgress();
    setProgress(p);
    // Ensure existing local progress is mirrored into the user profile store
    try {
      syncEducationIntoProfile(p);
    } catch {
      /* ignore */
    }
  }, []);

  const openLesson = useCallback((lessonId: string) => {
    setProgress((p) => markReading(p, lessonId));
    setView({ kind: "lesson", lessonId, mode: "read" });
  }, []);

  // React to kos-open events for in-app md files
  useEffect(() => {
    return subscribeKos((target) => {
      if (target.app === "education" && (target as any).kind === "mdfile") {
        const path = (target as any).path as string;
        setView({ kind: "mdfile", path });
        requestAnimationFrame(() => {
          const el = document.getElementById("education-main-scroll");
          if (el) el.scrollTop = 0;
        });
      }
    });
  }, []);

  // Load markdown when lesson or mdfile opens
  useEffect(() => {
    if (view.kind !== "lesson" && view.kind !== "mdfile") {
      setMd(null);
      setMdError(null);
      return;
    }
    let cancelled = false;
    setLoading(true);
    setMdError(null);
    let path = "";
    if (view.kind === "lesson") {
      const found = findLesson(view.lessonId);
      if (!found) {
        setMdError("Lesson not found in catalog.");
        setLoading(false);
        return;
      }
      path = lessonMarkdownPath(found.track.slug, found.lesson.file);
    } else {
      // mdfile
      path = "/" + view.path.replace(/^\/+/, "");
    }
    fetch(assetUrl(path))
      .then(async (r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status} loading ${path}`);
        return r.text();
      })
      .then((text) => {
        if (!cancelled) {
          setMd(text);
          setLoading(false);
        }
      })
      .catch((e: Error) => {
        if (!cancelled) {
          setMdError(e.message || "Failed to load lesson");
          setLoading(false);
        }
      });
    return () => {
      cancelled = true;
    };
  }, [view]);

  const sidebar = useMemo(() => {
    return (
      <>
        <button
          type="button"
          onClick={() => setView({ kind: "home" })}
          style={navBtn(view.kind === "home")}
        >
          ◇ HOME
        </button>
        {EDUCATION_TRACKS.map((track) => {
          const stats = trackStats(
            progress,
            track.lessons.map((l) => l.id),
          );
          const open = view.kind === "track" && view.slug === track.slug;
          const lessonOpen =
            view.kind === "lesson" && view.lessonId.startsWith(track.slug + "/");
          return (
            <div key={track.slug} style={{ marginBottom: 14 }}>
              <button
                type="button"
                onClick={() => setView({ kind: "track", slug: track.slug })}
                style={navBtn(open || lessonOpen)}
              >
                {track.title.toUpperCase()} ({stats.passed}/{stats.total})
              </button>
              <ul style={{ listStyle: "none", padding: 0, margin: "4px 0 0" }}>
                {track.lessons.map((l) => {
                  const st = progress[l.id]?.status;
                  const active = view.kind === "lesson" && view.lessonId === l.id;
                  return (
                    <li key={l.id} style={{ marginBottom: 2 }}>
                      <button
                        type="button"
                        onClick={() => openLesson(l.id)}
                        style={{
                          ...navBtn(active),
                          color: active ? "#ffff00" : statusColor(st),
                          paddingLeft: 8,
                        }}
                      >
                        {statusGlyph(st)} {l.title}
                      </button>
                    </li>
                  );
                })}
              </ul>
            </div>
          );
        })}
      </>
    );
  }, [view, progress, openLesson]);

  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        backgroundColor: "#000",
        color: "#fff",
        fontFamily: "var(--dm-font-primary), monospace",
        imageRendering: "pixelated",
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
      }}
    >
      <header
        style={{
          flexShrink: 0,
          borderBottom: "2px solid #fff",
          padding: "6px 14px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          fontSize: 11,
          letterSpacing: 2,
        }}
      >
        <button type="button" onClick={() => setView({ kind: "home" })} style={plainBtn}>
          ☦ EDUCATION
        </button>
        <span style={{ color: "#888", fontSize: 10 }}>
          PROFILE TRANSCRIPT · MCQ CHECKOUT
        </span>
      </header>

      <div style={{ flex: 1, display: "flex", overflow: "hidden", position: "relative" }}>
        {!isNarrow && (
          <aside
            style={{
              width: 220,
              flexShrink: 0,
              borderRight: "2px solid #222",
              padding: "12px 8px",
              fontSize: 10,
              letterSpacing: 1,
              backgroundColor: "#0a0a0a",
              overflowY: "auto",
              height: "100%",
            }}
          >
            {sidebar}
          </aside>
        )}

        <main
          id="education-main-scroll"
          style={{
            flex: 1,
            overflowY: "auto",
            padding: isNarrow ? "16px 14px 56px" : "20px 28px 60px",
            maxWidth: isNarrow ? "100%" : 760,
            height: "100%",
          }}
        >
          {view.kind === "home" && (
            <HomeView
              progress={progress}
              onOpenTrack={(slug) => setView({ kind: "track", slug })}
              onOpenLesson={openLesson}
              onOpenMd={(path) => setView({ kind: "mdfile", path })}
            />
          )}
          {view.kind === "track" && (
            <TrackView
              slug={view.slug}
              progress={progress}
              onOpenLesson={openLesson}
              onBack={() => setView({ kind: "home" })}
            />
          )}
          {view.kind === "lesson" && view.mode === "read" && (
            <LessonReadView
              lessonId={view.lessonId}
              md={md}
              loading={loading}
              error={mdError}
              progress={progress[view.lessonId]}
              onQuiz={() => setView({ kind: "lesson", lessonId: view.lessonId, mode: "quiz" })}
              onBack={() => {
                const found = findLesson(view.lessonId);
                if (found) setView({ kind: "track", slug: found.track.slug });
                else setView({ kind: "home" });
              }}
            />
          )}
          {view.kind === "mdfile" && (
            <MdFileView
              path={view.path}
              md={md}
              loading={loading}
              error={mdError}
              onBack={() => setView({ kind: "home" })}
            />
          )}
          {view.kind === "lesson" && view.mode === "quiz" && (
            <QuizView
              lessonId={view.lessonId}
              onDone={(next) => setProgress(next)}
              onBackToLesson={() => setView({ kind: "lesson", lessonId: view.lessonId, mode: "read" })}
            />
          )}
        </main>

        {isNarrow && (
          <>
            <CornerPanel id="tracks" corner="top-left" label="TRACK">
              <div style={{ padding: "8px 6px", fontSize: 10, letterSpacing: 1, maxHeight: "60vh", overflowY: "auto" }}>
                {sidebar}
              </div>
            </CornerPanel>
            <CornerDismissLayer />
            <VerticalChromeToggle corner="bottom-right" />
          </>
        )}
      </div>
    </div>
  );
}

function HomeView({
  progress,
  onOpenTrack,
  onOpenLesson,
  onOpenMd,
}: {
  progress: ProgressMap;
  onOpenTrack: (slug: string) => void;
  onOpenLesson: (id: string) => void;
  onOpenMd: (path: string) => void;
}) {
  return (
    <>
      <h1 style={h1}>Education</h1>
      <p style={muted}>
        Offline-first curriculum. Read a lesson, then pass the multiple-choice checkout to mark it complete.
        Completions are recorded in your local user profile so you can share a transcript.
      </p>
      <p style={{ ...muted, marginBottom: 20 }}>
        Contested topics follow{" "}
        <button
          type="button"
          onClick={() => onOpenMd("docs/EPISTEMIC_STANCE.md")}
          style={{ ...plainBtn, color: "#ffff00", textDecoration: "underline", fontSize: 12 }}
        >
          EPISTEMIC_STANCE.md
        </button>
        {" "}&mdash; click to read it in-app.
      </p>
      <ProfileTranscriptCard progress={progress} />
      {EDUCATION_TRACKS.map((track) => {
        const stats = trackStats(
          progress,
          track.lessons.map((l) => l.id),
        );
        return (
          <section key={track.slug} style={{ marginBottom: 28 }}>
            <button type="button" onClick={() => onOpenTrack(track.slug)} style={{ ...plainBtn, color: "#ffff00", fontSize: 14, letterSpacing: 2, marginBottom: 8 }}>
              {track.title} — {stats.passed}/{stats.total} passed
            </button>
            <p style={{ fontSize: 12, color: "#aaa", marginBottom: 10, lineHeight: 1.5 }}>{track.summary}</p>
            <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
              {track.lessons.map((l) => (
                <li key={l.id} style={{ marginBottom: 6 }}>
                  <button type="button" onClick={() => onOpenLesson(l.id)} style={{ ...plainBtn, color: "#66aaff", textDecoration: "underline", fontSize: 13 }}>
                    <span style={{ color: statusColor(progress[l.id]?.status), textDecoration: "none", marginRight: 6 }}>
                      {statusGlyph(progress[l.id]?.status)}
                    </span>
                    {l.title}
                  </button>
                </li>
              ))}
            </ul>
          </section>
        );
      })}
      <div style={{ marginTop: 32, borderTop: "2px solid #444", paddingTop: 12, fontSize: 10, color: "#666", letterSpacing: 1 }}>
        ☦ K-OS EDUCATION · PROVE ALL THINGS
      </div>
    </>
  );
}

function MdFileView({
  path,
  md,
  loading,
  error,
  onBack,
}: {
  path: string;
  md: string | null;
  loading: boolean;
  error: string | null;
  onBack: () => void;
}) {
  const known = findMdFile(path);
  const title = known?.title ?? path;
  const download = () => {
    if (!md) return;
    const blob = new Blob([md], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = mdDownloadFilename(path);
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };
  return (
    <>
      <button type="button" onClick={onBack} style={{ ...plainBtn, color: "#888", marginBottom: 12, fontSize: 11 }}>
        ← BACK
      </button>
      <div style={{ fontSize: 10, color: "#888", letterSpacing: 1, marginBottom: 8 }}>{path}</div>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "baseline",
          marginBottom: 12,
          gap: 8,
        }}
      >
        <h1 style={h1}>{title}</h1>
        <button
          type="button"
          onClick={download}
          disabled={!md || loading}
          style={{
            background: md && !loading ? "#ffff00" : "#333",
            color: md && !loading ? "#000" : "#666",
            border: "none",
            padding: "6px 12px",
            fontFamily: "inherit",
            fontSize: 10,
            letterSpacing: 1,
            cursor: md && !loading ? "pointer" : "not-allowed",
            fontWeight: 700,
          }}
        >
          DOWNLOAD
        </button>
      </div>
      {loading && <p style={muted}>Loading document…</p>}
      {error && <p style={{ color: "#ff6666", fontSize: 12 }}>{error}</p>}
      {md && !loading && <div>{renderMarkdown(md)}</div>}
    </>
  );
}

function ProfileTranscriptCard({ progress }: { progress: ProgressMap }) {
  const [profile, setProfile] = useState<KosUserProfile>(() =>
    typeof window === "undefined" ? loadProfile() : loadProfile(),
  );
  const [name, setName] = useState(profile.displayName);
  const [handle, setHandle] = useState(profile.handle);
  const [copied, setCopied] = useState(false);
  const [saved, setSaved] = useState(false);

  // Keep card in sync when quizzes update progress
  useEffect(() => {
    try {
      const next = syncEducationIntoProfile(progress);
      setProfile(next);
    } catch {
      /* ignore */
    }
  }, [progress]);

  const saveIdentity = () => {
    const next = updateIdentity({ displayName: name, handle });
    // re-attach latest education after identity write
    const withEdu = syncEducationIntoProfile(progress);
    setProfile({ ...next, education: withEdu.education });
    setSaved(true);
    window.setTimeout(() => setSaved(false), 1500);
  };

  const copyCard = async () => {
    const card = formatTranscriptCard({
      ...profile,
      displayName: name || profile.displayName,
      handle: handle || profile.handle,
      education: progress,
    });
    try {
      await navigator.clipboard.writeText(card);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1500);
    } catch {
      // fallback
      window.prompt("Copy transcript:", card);
    }
  };

  const allIds = EDUCATION_TRACKS.flatMap((t) => t.lessons.map((l) => l.id));
  const stats = trackStats(progress, allIds);

  return (
    <section
      style={{
        marginBottom: 28,
        border: "2px solid #ffff00",
        background: "#0a0a00",
        padding: 14,
      }}
    >
      <div style={{ color: "#ffff00", letterSpacing: 2, fontSize: 11, marginBottom: 10 }}>
        YOUR PROFILE · EDUCATION TRANSCRIPT
      </div>
      <p style={{ fontSize: 11, color: "#aaa", marginBottom: 12, lineHeight: 1.5 }}>
        Completions are stored in this browser under your local profile. Set a display name / handle,
        then copy a share card or download JSON to show what you've passed. No server account —
        multi-device sync is a later layer.
      </p>
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          gap: 10,
          marginBottom: 12,
          alignItems: "flex-end",
        }}
      >
        <label style={{ display: "flex", flexDirection: "column", gap: 4, fontSize: 10, color: "#888" }}>
          DISPLAY NAME
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="operator"
            maxLength={40}
            style={inputStyle}
          />
        </label>
        <label style={{ display: "flex", flexDirection: "column", gap: 4, fontSize: 10, color: "#888" }}>
          HANDLE
          <input
            value={handle}
            onChange={(e) => setHandle(e.target.value)}
            placeholder="koolskull"
            maxLength={24}
            style={inputStyle}
          />
        </label>
        <button type="button" onClick={saveIdentity} style={yellowBtn}>
          {saved ? "SAVED" : "SAVE PROFILE"}
        </button>
      </div>
      <div style={{ fontSize: 12, color: "#66ff66", marginBottom: 12, letterSpacing: 1 }}>
        {stats.passed}/{stats.total} LESSONS PASSED
        {(name || profile.displayName) && (
          <span style={{ color: "#fff", marginLeft: 10 }}>
            · {(name || profile.displayName).toUpperCase()}
            {(handle || profile.handle) ? ` @${handle || profile.handle}` : ""}
          </span>
        )}
      </div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
        <button type="button" onClick={() => void copyCard()} style={yellowBtn}>
          {copied ? "COPIED" : "COPY SHARE CARD"}
        </button>
        <button
          type="button"
          onClick={() =>
            downloadTranscriptJson({
              ...profile,
              displayName: name || profile.displayName,
              handle: handle || profile.handle,
              education: progress,
            })
          }
          style={outlineBtn}
        >
          DOWNLOAD JSON
        </button>
      </div>
    </section>
  );
}

function TrackView({
  slug,
  progress,
  onOpenLesson,
  onBack,
}: {
  slug: string;
  progress: ProgressMap;
  onOpenLesson: (id: string) => void;
  onBack: () => void;
}) {
  const track = EDUCATION_TRACKS.find((t) => t.slug === slug);
  if (!track) return <p style={muted}>Unknown track.</p>;
  const stats = trackStats(
    progress,
    track.lessons.map((l) => l.id),
  );
  return (
    <>
      <button type="button" onClick={onBack} style={{ ...plainBtn, color: "#888", marginBottom: 12, fontSize: 11 }}>
        ← HOME
      </button>
      <h1 style={h1}>{track.title}</h1>
      <p style={muted}>{track.summary}</p>
      <p style={{ ...muted, marginBottom: 20 }}>
        Progress: {stats.passed} / {stats.total} lessons passed
      </p>
      <ol style={{ paddingLeft: 18, margin: 0 }}>
        {track.lessons.map((l, idx) => (
          <li key={l.id} style={{ marginBottom: 12, color: "#ddd" }}>
            <button type="button" onClick={() => onOpenLesson(l.id)} style={{ ...plainBtn, color: "#66aaff", textDecoration: "underline", fontSize: 13 }}>
              {idx + 1}. {l.title}
            </button>
            <div style={{ fontSize: 10, color: statusColor(progress[l.id]?.status), marginTop: 2 }}>
              {progress[l.id]?.status === "passed"
                ? `PASSED ${progress[l.id]?.score ?? ""}/${progress[l.id]?.total ?? ""}`
                : progress[l.id]?.status === "failed"
                  ? `LAST ATTEMPT ${progress[l.id]?.score}/${progress[l.id]?.total} — retry quiz`
                  : progress[l.id]?.status === "reading"
                    ? "READING — complete quiz to pass"
                    : "UNREAD"}
              {l.estimatedMinutes ? ` · ~${l.estimatedMinutes} min` : ""}
            </div>
          </li>
        ))}
      </ol>
    </>
  );
}

function LessonReadView({
  lessonId,
  md,
  loading,
  error,
  progress,
  onQuiz,
  onBack,
}: {
  lessonId: string;
  md: string | null;
  loading: boolean;
  error: string | null;
  progress?: { status: string; score?: number; total?: number };
  onQuiz: () => void;
  onBack: () => void;
}) {
  const found = findLesson(lessonId);
  const quiz = getQuiz(lessonId);
  return (
    <>
      <button type="button" onClick={onBack} style={{ ...plainBtn, color: "#888", marginBottom: 12, fontSize: 11 }}>
        ← TRACK
      </button>
      {found && (
        <div style={{ fontSize: 10, color: "#888", letterSpacing: 1, marginBottom: 8 }}>
          {found.track.title.toUpperCase()} · {found.lesson.file}
          {progress?.status === "passed" && (
            <span style={{ color: "#66ff66", marginLeft: 8 }}>✓ PASSED</span>
          )}
        </div>
      )}
      {loading && <p style={muted}>Loading lesson…</p>}
      {error && <p style={{ color: "#ff6666", fontSize: 12 }}>{error}</p>}
      {md && !loading && <div>{renderMarkdown(md)}</div>}
      {md && !loading && (
        <div
          style={{
            marginTop: 32,
            padding: 16,
            border: "2px solid #ffff00",
            background: "#0a0a00",
          }}
        >
          <div style={{ color: "#ffff00", letterSpacing: 2, fontSize: 12, marginBottom: 8 }}>CHECKOUT</div>
          <p style={{ fontSize: 12, color: "#ccc", marginBottom: 12, lineHeight: 1.5 }}>
            {quiz
              ? `Answer ${quiz.questions.length} multiple-choice questions on this lesson to mark it passed. Progress is saved to your local profile in this browser.`
              : "No quiz registered for this lesson yet."}
          </p>
          {quiz && (
            <button
              type="button"
              onClick={onQuiz}
              style={{
                background: "#ffff00",
                color: "#000",
                border: "none",
                padding: "8px 14px",
                fontFamily: "inherit",
                fontSize: 11,
                letterSpacing: 2,
                cursor: "pointer",
                fontWeight: 700,
              }}
            >
              START QUIZ
            </button>
          )}
        </div>
      )}
    </>
  );
}

function QuizView({
  lessonId,
  onDone,
  onBackToLesson,
}: {
  lessonId: string;
  onDone: (p: ProgressMap) => void;
  onBackToLesson: () => void;
}) {
  const quiz = getQuiz(lessonId);
  const found = findLesson(lessonId);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [submitted, setSubmitted] = useState(false);
  const [result, setResult] = useState<{ score: number; total: number; passed: boolean } | null>(null);

  if (!quiz) {
    return (
      <>
        <p style={muted}>No quiz for this lesson.</p>
        <button type="button" onClick={onBackToLesson} style={plainBtn}>
          ← BACK
        </button>
      </>
    );
  }

  const total = quiz.questions.length;
  const allAnswered = quiz.questions.every((q) => answers[q.id]);

  const submit = () => {
    let score = 0;
    for (const q of quiz.questions) {
      if (answers[q.id] === q.correctId) score++;
    }
    const ratio = score / total;
    const passed = ratio >= quiz.passRatio;
    const next = recordQuizResult(loadProgress(), lessonId, score, total, passed);
    onDone(next);
    setResult({ score, total, passed });
    setSubmitted(true);
  };

  return (
    <>
      <button type="button" onClick={onBackToLesson} style={{ ...plainBtn, color: "#888", marginBottom: 12, fontSize: 11 }}>
        ← LESSON
      </button>
      <h1 style={h1}>Checkout · {found?.lesson.title ?? lessonId}</h1>
      <p style={muted}>
        Select one answer per question. Pass requires {Math.round(quiz.passRatio * 100)}% correct
        {quiz.passRatio === 1 ? " (all correct)" : ""}.
      </p>

      {quiz.questions.map((q, qi) => {
        const chosen = answers[q.id];
        const show = submitted;
        return (
          <div key={q.id} style={{ marginBottom: 22, border: "1px solid #333", padding: 12 }}>
            <div style={{ fontSize: 12, color: "#ffff00", marginBottom: 10, letterSpacing: 1 }}>
              Q{qi + 1}. {q.prompt}
            </div>
            {q.choices.map((c) => {
              const isSel = chosen === c.id;
              const isCorrect = c.id === q.correctId;
              let border = isSel ? "1px solid #ffff00" : "1px solid #333";
              let bg = isSel ? "#1a1a00" : "transparent";
              let color = "#ddd";
              if (show) {
                if (isCorrect) {
                  border = "1px solid #66ff66";
                  color = "#66ff66";
                  bg = "#0a1a0a";
                } else if (isSel && !isCorrect) {
                  border = "1px solid #ff6666";
                  color = "#ff6666";
                  bg = "#1a0a0a";
                }
              }
              return (
                <label
                  key={c.id}
                  style={{
                    display: "block",
                    marginBottom: 6,
                    padding: "6px 8px",
                    border,
                    background: bg,
                    color,
                    cursor: submitted ? "default" : "pointer",
                    fontSize: 12,
                    lineHeight: 1.4,
                  }}
                >
                  <input
                    type="radio"
                    name={q.id}
                    value={c.id}
                    disabled={submitted}
                    checked={isSel}
                    onChange={() => setAnswers((a) => ({ ...a, [q.id]: c.id }))}
                    style={{ marginRight: 8 }}
                  />
                  {c.text}
                </label>
              );
            })}
            {show && q.explain && (
              <div style={{ fontSize: 11, color: "#888", marginTop: 8 }}>{q.explain}</div>
            )}
          </div>
        );
      })}

      {!submitted && (
        <button
          type="button"
          disabled={!allAnswered}
          onClick={submit}
          style={{
            background: allAnswered ? "#ffff00" : "#333",
            color: allAnswered ? "#000" : "#666",
            border: "none",
            padding: "10px 16px",
            fontFamily: "inherit",
            fontSize: 11,
            letterSpacing: 2,
            cursor: allAnswered ? "pointer" : "not-allowed",
            fontWeight: 700,
          }}
        >
          SUBMIT CHECKOUT
        </button>
      )}

      {result && (
        <div
          style={{
            marginTop: 16,
            padding: 14,
            border: `2px solid ${result.passed ? "#66ff66" : "#ff6666"}`,
            color: result.passed ? "#66ff66" : "#ff6666",
            fontSize: 13,
            letterSpacing: 1,
          }}
        >
          {result.passed
            ? `PASSED · ${result.score}/${result.total} · Lesson marked complete on this device.`
            : `NOT PASSED · ${result.score}/${result.total} · Re-read the lesson and try again.`}
          <div style={{ marginTop: 12 }}>
            <button
              type="button"
              onClick={onBackToLesson}
              style={{
                background: "transparent",
                border: "1px solid #888",
                color: "#ccc",
                padding: "6px 10px",
                fontFamily: "inherit",
                fontSize: 10,
                letterSpacing: 1,
                cursor: "pointer",
                marginRight: 8,
              }}
            >
              BACK TO LESSON
            </button>
            {!result.passed && (
              <button
                type="button"
                onClick={() => {
                  setSubmitted(false);
                  setResult(null);
                  setAnswers({});
                }}
                style={{
                  background: "#ffff00",
                  border: "none",
                  color: "#000",
                  padding: "6px 10px",
                  fontFamily: "inherit",
                  fontSize: 10,
                  letterSpacing: 1,
                  cursor: "pointer",
                  fontWeight: 700,
                }}
              >
                RETRY QUIZ
              </button>
            )}
          </div>
        </div>
      )}
    </>
  );
}

const inputStyle: React.CSSProperties = {
  background: "#000",
  color: "#fff",
  border: "2px solid #444",
  padding: "6px 8px",
  fontFamily: "inherit",
  fontSize: 12,
  minWidth: 140,
  outline: "none",
};

const yellowBtn: React.CSSProperties = {
  background: "#ffff00",
  color: "#000",
  border: "none",
  padding: "8px 12px",
  fontFamily: "inherit",
  fontSize: 10,
  letterSpacing: 1,
  cursor: "pointer",
  fontWeight: 700,
};

const outlineBtn: React.CSSProperties = {
  background: "transparent",
  color: "#ffff00",
  border: "2px solid #ffff00",
  padding: "6px 12px",
  fontFamily: "inherit",
  fontSize: 10,
  letterSpacing: 1,
  cursor: "pointer",
  fontWeight: 700,
};

const plainBtn: React.CSSProperties = {
  background: "transparent",
  border: "none",
  color: "#fff",
  fontFamily: "inherit",
  fontSize: "inherit",
  letterSpacing: "inherit",
  cursor: "pointer",
  padding: 0,
  textAlign: "left",
};

function navBtn(active: boolean): React.CSSProperties {
  return {
    ...plainBtn,
    color: active ? "#ffff00" : "#cccccc",
    padding: "2px 4px",
    display: "block",
    width: "100%",
    marginBottom: 2,
  };
}

const h1: React.CSSProperties = {
  fontSize: 20,
  letterSpacing: 2,
  color: "#ffff00",
  margin: "0 0 12px",
  borderBottom: "1px solid #444",
  paddingBottom: 8,
};

const muted: React.CSSProperties = {
  fontSize: 12,
  color: "#aaa",
  lineHeight: 1.55,
  marginBottom: 12,
};

export default EducationApp;
