/*
 *                          ☦
 *                  ╔════════════════╗
 *                  ║    IC    XC   ║
 *                  ║   NIKA NIKA   ║
 *                  ╚════════════════╝
 *
 *        ┌──────────────────────────────┐
 *        │                              │
 *        │    ††† KNIGHTS TEMPLAR †††   │
 *        │    SHOTLIST                  │
 *        │    Sequencing / Storyboard   │
 *        │    / X-Sheet Engine          │
 *        │                              │
 *        │    "Non nobis, Domine,       │
 *     non nobis, sed nomini    │
 *     tuo da gloriam."         │
 *        │                              │
 *        └──────────────────────────────┘
 *
 *   In the name of the Father, and of the Son, and of the Holy Spirit. Amen.
 *
 *   Saint Luke, patron of artists and physicians, pray for us.
 *   Saint Cecilia, patroness of musicians, pray for us.
 *   Saint Gabriel the Archangel, messenger of the Most High, intercede for us.
 *   Saint Michael the Archangel, defend us in battle.
 *   Holy Guardian Angels, watch over this code and every frame it holds.
 *
 *   May every shot list, every X-sheet, and every thumbnail be ordered
 *   under the providence of God, that the work of our hands may serve
 *   truth, beauty, and the greater glory of His Name.
 *
 *   ╔══════════════════════════════════════════╗
 *   ║  SHOTLIST — Phase 0 Scaffold             ║
 *   ║  Sequence → Shot → 24fps X-Sheet         ║
 *   ║  Offline-first. Wallet approvals later.  ║
 *   ╚══════════════════════════════════════════╝
 *
 *   Hierarchy mirrors Datamoshpit Song → Chain → Phrase.
 *   Spec: docs/SHOTLIST_SPEC.md
 *   Mobile: docs/MOBILE_CREATIVE_UI.md (CornerChrome)
 */

"use client";

import React, { useCallback, useEffect, useState } from "react";
import {
  CornerHost,
  CornerPanel,
  VerticalChromeToggle,
  CornerDismissLayer,
  useCornerChromeOptional,
} from "@/components/ui/CornerChrome";

/* ------------------------------------------------------------------ */
/*  Types (minimal scaffold — expand in Phase 1)                      */
/* ------------------------------------------------------------------ */

/** Single frame inside an X-Sheet (24 fps) */
interface XFrame {
  id: number,
  /** Exposure / hold count in frames */
  exposure: number,
  action: string,
  dialogue: string,
  camera: string,
  audioCue: string,
  notes: string,
  /** Optional sprite / asset reference id or path */
  assetRef: string | null,
}

/** A Shot — like a Chain in Datamoshpit */
interface Shot {
  id: number,
  title: string,
  description: string,
  /** Duration in frames at 24 fps */
  durationFrames: number,
  /** High-level audio timing notes for the whole shot */
  audioNotes: string,
  /** Data-URL or path for quick thumbnail */
  thumbnail: string | null,
  /** Expandable 24 fps breakdown */
  xsheet: XFrame[],
  /** Placeholder for future wallet / approval status */
  status: "draft" | "review" | "approved",
}

/** Top-level Sequence / Storyboard — like a Song */
interface Sequence {
  id: number,
  name: string,
  fps: number, // fixed 24 for production X-sheets
  shots: Shot[],
}

/* ------------------------------------------------------------------ */
/*  Helpers under the watch of the Angels                             */
/* ------------------------------------------------------------------ */

let nextId = 1;
function uid(): number {
  return nextId++;
}

function createEmptyXFrame(): XFrame {
  return {
    id: uid(),
    exposure: 1,
    action: "",
    dialogue: "",
    camera: "",
    audioCue: "",
    notes: "",
    assetRef: null,
  };
}

function createEmptyShot(title = "SHOT"): Shot {
  return {
    id: uid(),
    title,
    description: "",
    durationFrames: 24, // 1 second default
    audioNotes: "",
    thumbnail: null,
    xsheet: [createEmptyXFrame()],
    status: "draft",
  };
}

function createEmptySequence(name = "UNTITLED SEQUENCE"): Sequence {
  return {
    id: uid(),
    name,
    fps: 24,
    shots: [],
  };
}

/* ------------------------------------------------------------------ */
/*  Public entry — wrapped in CornerHost so mobile chrome works       */
/* ------------------------------------------------------------------ */

interface ShotlistAppProps {
  isFocused?: boolean,
}

export default function ShotlistApp({ isFocused = true }: ShotlistAppProps) {
  /*
   *  Saint Joseph the Worker, pray for the builders of this OS.
   *  May the scaffolding hold, and the real work begin in order.
   */
  return (
    <CornerHost storageKey="kos-shotlist-chrome" style={{ background: "#000000" }}>
      <ShotlistInner isFocused={isFocused} />
    </CornerHost>
  );
}

/* ------------------------------------------------------------------ */
/*  Inner app                                                          */
/* ------------------------------------------------------------------ */

function ShotlistInner({ isFocused = true }: ShotlistAppProps) {
  const chrome = useCornerChromeOptional();
  const isNarrow = chrome?.isNarrow ?? false;
  const uiHidden = chrome?.uiHidden ?? false;
  const collapse = isNarrow || uiHidden;

  const [sequence, setSequence] = useState<Sequence>(() => createEmptySequence());
  const [selectedShotId, setSelectedShotId] = useState<number | null>(null);
  const [expandedShotId, setExpandedShotId] = useState<number | null>(null);
  const [statusLine, setStatusLine] = useState("SHOTLIST ready · offline · 24 fps");

  const selectedShot =
    selectedShotId != null
      ? sequence.shots.find((s) => s.id === selectedShotId) ?? null
      : null;

  /* ---- Actions ---- */

  const addShot = useCallback(() => {
    const shot = createEmptyShot(`SHOT ${sequence.shots.length + 1}`);
    setSequence((prev) => ({
      ...prev,
      shots: [...prev.shots, shot],
    }));
    setSelectedShotId(shot.id);
    setStatusLine(`Created ${shot.title}`);
  }, [sequence.shots.length]);

  const deleteSelectedShot = useCallback(() => {
    if (selectedShotId == null) return;
    setSequence((prev) => ({
      ...prev,
      shots: prev.shots.filter((s) => s.id !== selectedShotId),
    }));
    if (expandedShotId === selectedShotId) setExpandedShotId(null);
    setSelectedShotId(null);
    setStatusLine("Shot removed");
  }, [selectedShotId, expandedShotId]);

  const toggleExpand = useCallback((id: number) => {
    setExpandedShotId((prev) => (prev === id ? null : id));
    setSelectedShotId(id);
  }, []);

  const updateShotField = useCallback(
    (id: number, patch: Partial<Shot>) => {
      setSequence((prev) => ({
        ...prev,
        shots: prev.shots.map((s) => (s.id === id ? { ...s, ...patch } : s)),
      }));
    },
    [],
  );

  /* ---- Keyboard (Datamoshpit-style shell) ---- */

  useEffect(() => {
    if (!isFocused) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }
      switch (e.key.toLowerCase()) {
        case "n":
          e.preventDefault();
          addShot();
          break;
        case "delete":
        case "backspace":
          if (selectedShotId != null) {
            e.preventDefault();
            deleteSelectedShot();
          }
          break;
        case "enter":
          if (selectedShotId != null) {
            e.preventDefault();
            toggleExpand(selectedShotId);
          }
          break;
        case "arrowup":
        case "arrowdown": {
          e.preventDefault();
          const list = sequence.shots;
          if (list.length === 0) return;
          const idx = list.findIndex((s) => s.id === selectedShotId);
          const next =
            e.key === "ArrowUp"
              ? idx <= 0
                ? list.length - 1
                : idx - 1
              : idx < 0 || idx >= list.length - 1
                ? 0
                : idx + 1;
          setSelectedShotId(list[next].id);
          break;
        }
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [
    isFocused,
    addShot,
    deleteSelectedShot,
    toggleExpand,
    selectedShotId,
    sequence.shots,
  ]);

  /* ---- Styles (pixel rules) ---- */

  const rootStyle: React.CSSProperties = {
    width: "100%",
    height: "100%",
    backgroundColor: "#000000",
    color: "#ffffff",
    fontFamily: "var(--dm-font-primary), monospace",
    imageRendering: "pixelated",
    display: "flex",
    flexDirection: "column",
    overflow: "hidden",
    userSelect: "none",
  };

  const headerStyle: React.CSSProperties = {
    backgroundColor: "#000",
    color: "#fff",
    padding: "6px 12px",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    borderBottom: "2px solid #ffffff",
    fontSize: 11,
    letterSpacing: 2,
    flexShrink: 0,
  };

  const btn = (active = false): React.CSSProperties => ({
    padding: "4px 10px",
    background: active ? "#ffffff" : "#000000",
    color: active ? "#000000" : "#cccccc",
    border: active ? "1px solid #ffffff" : "1px solid #555555",
    cursor: "pointer",
    fontFamily: "inherit",
    fontSize: 10,
    letterSpacing: 1,
  });

  /* ---- Always-visible header (never covered by CornerPanels) ---- */

  const alwaysVisibleHeader = (
    <div style={{
      ...headerStyle,
      // tighter padding on mobile so it doesn't eat too much vertical space
      padding: collapse ? "5px 10px" : "6px 12px",
    }}>
      <span style={{ color: "#ffff00" }}>☦ SHOTLIST</span>
      <span style={{ color: "#888", fontSize: 9, letterSpacing: 1 }}>
        {sequence.name} · {sequence.shots.length} SHOTS · {sequence.fps} FPS
      </span>
      {/* Only show action buttons in header when we have room (desktop) */}
      {!collapse && (
        <div style={{ display: "flex", gap: 6 }}>
          <button type="button" style={btn()} onClick={addShot} title="New Shot (N)">
            + SHOT
          </button>
          <button
            type="button"
            style={btn()}
            onClick={deleteSelectedShot}
            disabled={selectedShotId == null}
            title="Delete selected (Del)"
          >
            DEL
          </button>
        </div>
      )}
    </div>
  );

  /* ---- Shot list (Sequence view) ---- */

  const shotList = (
    <div style={{
      flex: 1,
      overflowY: "auto",
      // extra top padding on mobile so first shot isn't hidden under corner chrome
      padding: collapse ? "52px 10px 8px 10px" : "8px 10px",
    }}>
      {sequence.shots.length === 0 ? (
        <div
          style={{
            padding: 24,
            textAlign: "center",
            color: "#666",
            letterSpacing: 1,
            fontSize: 11,
            lineHeight: 1.8,
          }}
        >
          <div style={{ color: "#ffff00", marginBottom: 8 }}>NO SHOTS YET</div>
          <div>Press N or click + SHOT to create the first shot.</div>
          <div style={{ marginTop: 12, color: "#444", fontSize: 9 }}>
            Hierarchy: Sequence → Shot → 24 fps X-Sheet
            <br />
            (mirrors Datamoshpit Song → Chain → Phrase)
          </div>
          <div style={{ marginTop: 16, color: "#333", fontSize: 8 }}>
            Saint Luke, guide the storyboard.
          </div>
        </div>
      ) : (
        sequence.shots.map((shot, index) => {
          const isSelected = shot.id === selectedShotId;
          const isExpanded = shot.id === expandedShotId;
          return (
            <div
              key={shot.id}
              style={{
                marginBottom: 8,
                border: isSelected ? "1px solid #ffff00" : "1px solid #333",
                background: isSelected ? "#111100" : "#0a0a0a",
              }}
            >
              {/* Shot row */}
              <div
                onClick={() => setSelectedShotId(shot.id)}
                onDoubleClick={() => toggleExpand(shot.id)}
                style={{
                  display: "flex",
                  alignItems: "stretch",
                  cursor: "pointer",
                  minHeight: 56,
                }}
              >
                {/* Thumbnail placeholder */}
                <div
                  style={{
                    width: 72,
                    minHeight: 56,
                    background: "#000",
                    borderRight: "1px solid #222",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "#444",
                    fontSize: 9,
                    letterSpacing: 1,
                    flexShrink: 0,
                  }}
                >
                  {shot.thumbnail ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={shot.thumbnail}
                      alt=""
                      style={{
                        width: "100%",
                        height: "100%",
                        objectFit: "cover",
                        imageRendering: "pixelated",
                      }}
                    >
                  ) : (
                    "THUMB"
                  )}
                </div>

                {/* Text */}
                <div style={{ flex: 1, padding: "6px 10px", minWidth: 0 }}>
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "baseline",
                      gap: 8,
                    }}
                  >
                    <span
                      style={{
                        color: isSelected ? "#ffff00" : "#eee",
                        letterSpacing: 1,
                        fontSize: 11,
                      }}
                    >
                      {String(index + 1).padStart(2, "00")} · {shot.title}
                    </span>
                    <span style={{ color: "#666", fontSize: 9 }}>
                      {shot.durationFrames}f · {(shot.durationFrames / 24).toFixed(2)}s
                    </span>
                  </div>
                  <div
                    style={{
                      color: "#888",
                      fontSize: 10,
                      marginTop: 4,
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {shot.description || "(no description)"}
                  </div>
                </div>

                {/* Expand affordance */}
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleExpand(shot.id);
                  }}
                  style={{
                    width: 36,
                    border: "none",
                    borderLeft: "1px solid #222",
                    background: "transparent",
                    color: isExpanded ? "#ffff00" : "#555",
                    cursor: "pointer",
                    fontFamily: "inherit",
                    fontSize: 14,
                  }}
                  title="Expand X-Sheet (Enter)"
                >
                  {isExpanded ? "▼" : "▶"}
                </button>
              </div>

              {/* Expanded X-Sheet (collapsible like a Phrase) */}
              {isExpanded && (
                <div
                  style={{
                    borderTop: "1px solid #333",
                    padding: "10px 12px",
                    background: "#050505",
                  }}
                >
                  <div
                    style={{
                      fontSize: 9,
                      color: "#ffff00",
                      letterSpacing: 2,
                      marginBottom: 8,
                    }}
                  >
                    X-SHEET · 24 FPS · {shot.xsheet.length} FRAME
                    {shot.xsheet.length === 1 ? "" : "S"}
                  </div>

                  <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                    <label style={{ fontSize: 9, color: "#888", letterSpacing: 1 }}>
                      TITLE
                      <input
                        value={shot.title}
                        onChange={(e) =>
                          updateShotField(shot.id, { title: e.target.value })
                        }
                        style={{
                          display: "block",
                          width: "100%",
                          marginTop: 2,
                          background: "#111",
                          color: "#eee",
                          border: "1px solid #333",
                          padding: "4px 6px",
                          fontFamily: "inherit",
                          fontSize: 11,
                        }}
                      />
                    </label>
                    <label style={{ fontSize: 9, color: "#888", letterSpacing: 1 }}>
                      DESCRIPTION
                      <textarea
                        value={shot.description}
                        onChange={(e) =>
                          updateShotField(shot.id, { description: e.target.value })
                        }
                        rows={2,
                        style={{
                          display: "block",
                          width: "100%",
                          marginTop: 2,
                          background: "#111",
                          color: "#eee",
                          border: "1px solid #333",
                          padding: "4px 6px",
                          fontFamily: "inherit",
                          fontSize: 11,
                          resize: "vertical",
                        }}
                      />
                    </label>
                    <label style={{ fontSize: 9, color: "#888", letterSpacing: 1 }}>
                      DURATION (FRAMES @ 24 FPS)
                      <input
                        type="number"
                        min={1}
                        max={24000}
                        value={shot.durationFrames}
                        onChange={(e) =>
                          updateShotField(shot.id, {
                            durationFrames: Math.max(1, Number(e.target.value) || 1),
                          })
                        }
                        style={{
                          display: "block",
                          width: 120,
                          marginTop: 2,
                          background: "#111",
                          color: "#eee",
                          border: "1px solid #333",
                          padding: "4px 6px",
                          fontFamily: "inherit",
                          fontSize: 11,
                        }}
                      />
                    </label>
                    <label style={{ fontSize: 9, color: "#888", letterSpacing: 1 }}>
                      AUDIO TIMING NOTES
                      <textarea
                        value={shot.audioNotes}
                        onChange={(e) =>
                          updateShotField(shot.id, { audioNotes: e.target.value })
                        }
                        rows={2,
                        placeholder="e.g. hit on beat 3 of bar 12…"
                        style={{
                          display: "block",
                          width: "100%",
                          marginTop: 2,
                          background: "#111",
                          color: "#eee",
                          border: "1px solid #333",
                          padding: "4px 6px",
                          fontFamily: "inherit",
                          fontSize: 11,
                          resize: "vertical",
                        }}
                      />
                    </label>
                  </div>

                  <div
                    style={{
                      marginTop: 12,
                      padding: 8,
                      border: "1px dashed #333",
                      color: "#555",
                      fontSize: 9,
                      letterSpacing: 1,
                      lineHeight: 1.6,
                    }}
                  >
                    FULL FRAME-BY-FRAME X-SHEET GRID LANDS IN PHASE 1.
                    <br />
                    Each frame will hold exposure, action, dialogue, camera,
                    audio cue, sprite ref, and notes.
                    <br />
                    <span style={{ color: "#333" }}>
                      Saint Gabriel, carry the timing true.
                    </span>
                  </div>
                </div>
              )}
            </div>
          );
        })
      )}
    </div>
  );

  /* ---- Status / help ---- */

  const statusBar = (
    <div
      style={{
        borderTop: "1px solid #222",
        padding: "4px 10px",
        fontSize: 9,
        color: "#666",
        letterSpacing: 1,
        display: "flex",
        justifyContent: "space-between",
        flexShrink: 0,
      }}
    >
      <span>{statusLine}</span>
      <span>N:NEW · ENTER:EXPAND · ↑↓:SELECT · DEL:DELETE · H:ZEN · ☦</span>
    </div>
  );

  /* ---- Help panel content (for corner on mobile) ---- */

  const helpContent = (
    <div style={{ padding: 8, fontSize: 9, color: "#888", letterSpacing: 1, lineHeight: 1.7 }}>
      <div style={{ color: "#ffff00", marginBottom: 6 }}>SHOTLIST</div>
      <div>N — new shot</div>
      <div>Enter — expand / collapse X-sheet</div>
      <div>↑ ↓ — select shot</div>
      <div>Del — delete selected</div>
      <div>H — zen / hide chrome</div>
      <div style={{ marginTop: 10, color: "#444" }}>
        Offline MVP. Wallet approvals later.
      </div>
      <div style={{ marginTop: 8, color: "#333" }}>
        Non nobis, Domine.
      </div>
    </div>
  );

  return (
    <div style={rootStyle}>
      {/* Always-visible header — never covered by CornerPanels on mobile */}
      {alwaysVisibleHeader}

      <div style={{ flex: 1, display: "flex", overflow: "hidden", position: "relative" }}>
        {shotList}
        <CornerDismissLayer />

        {collapse && (
          <>
            <CornerPanel id="actions" corner="top-left" label="ACT">
              <div style={{ padding: 8, display: "flex", flexDirection: "column", gap: 6 }}>
                <button type="button" style={btn()} onClick={addShot}>
                  + SHOT
                </button>
                <button
                  type="button"
                  style={btn()}
                  onClick={deleteSelectedShot}
                  disabled={selectedShotId == null}
                >
                  DEL
                </button>
                {selectedShot && (
                  <button
                    type="button"
                    style={btn()}
                    onClick={() => toggleExpand(selectedShot.id)}
                  >
                    {expandedShotId === selectedShot.id ? "COLLAPSE" : "EXPAND"}
                  </button>
                )}
              </div>
            </CornerPanel>
            <CornerPanel id="help" corner="top-right" label="?">
              {helpContent}
            </CornerPanel>
            <CornerPanel id="info" corner="bottom-left" label="INFO">
              <div style={{ padding: 6, fontSize: 9, color: "#888" }}>
                <div>{sequence.name}</div>
                <div>
                  {sequence.shots.length} shots · {sequence.fps} fps
                </div>
                <div style={{ marginTop: 4 }}>{statusLine}</div>
              </div>
            </CornerPanel>
          </>
        )}

        <VerticalChromeToggle corner="bottom-right" />
      </div>

      {!collapse && statusBar}
    </div>
  );
}
