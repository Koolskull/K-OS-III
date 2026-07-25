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
 *   ║  SHOTLIST — Phase 1 slice                ║
 *   ║  Sequence → Shot (480×853 mono plate)    ║
 *   ║  Harsh / Pen / Dither · offline first    ║
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
import { ShotCanvas } from "./ShotCanvas";
import {
  SHOT_H,
  SHOT_W,
  availableUpgrades,
  bitmapToDataURL,
  createBlankBitmap,
  upgradePlateDataUrl,
  type PlateSize,
  type ShotBg,
} from "./monoDraw";
import { useCreativeWorkflow } from "@/lib/creative";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
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
  /** Starting plate color (new strokes carve against this) */
  bg: ShotBg,
  /**
   * Working plate size. Always starts at thumbnail 480×853.
   * After first committed thumbnail, may upgrade to 1920×1080 or 3840×2160.
   */
  plateW: number,
  plateH: number,
  /**
   * Mono PNG data-URL at plateW×plateH (list preview + working plate).
   * Blank scaffold on create does not count as a committed thumbnail.
   */
  thumbnail: string | null,
  /** True after user SAVEs first drawing or returns plate from Sprite Editor */
  hasCommittedThumbnail: boolean,
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

function createEmptyShot(title = "SHOT", bg: ShotBg = "black"): Shot {
  // First drawing is always the thumbnail plate (480×853).
  const plate = bitmapToDataURL(
    createBlankBitmap(bg, SHOT_W, SHOT_H),
    SHOT_W,
    SHOT_H,
  );
  return {
    id: uid(),
    title,
    description: "",
    durationFrames: 24, // 1 second default
    audioNotes: "",
    bg,
    plateW: SHOT_W,
    plateH: SHOT_H,
    thumbnail: plate || null,
    hasCommittedThumbnail: false,
    xsheet: [createEmptyXFrame()],
    status: "draft",
  };
}

type EditorState =
  | { mode: "closed" }
  | { mode: "pick-bg" }
  | { mode: "pick-upgrade"; shotId: number }
  | { mode: "draw"; shotId: number; isNew: boolean };

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
  const workflow = useCreativeWorkflow();

  const [sequence, setSequence] = useState<Sequence>(() => createEmptySequence());
  const [selectedShotId, setSelectedShotId] = useState<number | null>(null);
  const [expandedShotId, setExpandedShotId] = useState<number | null>(null);
  const [statusLine, setStatusLine] = useState(
    `SHOTLIST ready · offline · ${SHOT_W}×${SHOT_H} mono · 24 fps`,
  );
  const [editor, setEditor] = useState<EditorState>({ mode: "closed" });

  /* ---- Creative bus: accept plate returns from KoolDraw ---- */
  useEffect(() => {
    const ret = workflow.lastReturn;
    if (!ret || ret.session.sourceApp !== "shotlist") return;
    const shotId = ret.session.ref.shotId;
    if (typeof shotId !== "number") {
      workflow.clearReturn();
      return;
    }
    if (!ret.cancelled && ret.result?.dataUrl) {
      const rw = ret.result.width || ret.session.width;
      const rh = ret.result.height || ret.session.height;
      setSequence((prev) => ({
        ...prev,
        shots: prev.shots.map((s) =>
          s.id === shotId
            ? {
                ...s,
                thumbnail: ret.result!.dataUrl,
                plateW: rw,
                plateH: rh,
                hasCommittedThumbnail: true,
              }
            : s,
        ),
      }));
      setSelectedShotId(shotId);
      setStatusLine(
        `Plate returned from SPRITE EDITOR · ${rw}×${rh} · shot ${shotId}`,
      );
    } else if (ret.cancelled) {
      setStatusLine("Sprite handoff cancelled");
    }
    workflow.clearReturn();
  }, [workflow.lastReturn, workflow]);

  const selectedShot =
    selectedShotId != null
      ? sequence.shots.find((s) => s.id === selectedShotId) ?? null
      : null;

  const editingShot =
    editor.mode === "draw"
      ? sequence.shots.find((s) => s.id === editor.shotId) ?? null
      : null;

  /* ---- Actions ---- */

  /** Open BG picker — every new shot starts as a full mono plate. */
  const beginAddShot = useCallback(() => {
    setEditor({ mode: "pick-bg" });
    setStatusLine("Choose starting plate: BLACK or WHITE");
  }, []);

  const confirmAddShot = useCallback(
    (bg: ShotBg) => {
      const shot = createEmptyShot(`SHOT ${sequence.shots.length + 1}`, bg);
      setSequence((prev) => ({
        ...prev,
        shots: [...prev.shots, shot],
      }));
      setSelectedShotId(shot.id);
      setEditor({ mode: "draw", shotId: shot.id, isNew: true });
      setStatusLine(`Drawing ${shot.title} · ${bg.toUpperCase()} plate`);
    },
    [sequence.shots.length],
  );

  const openDrawSelected = useCallback(() => {
    if (selectedShotId == null) return;
    setEditor({ mode: "draw", shotId: selectedShotId, isNew: false });
    setStatusLine("Shot plate editor");
  }, [selectedShotId]);

  const openDrawShot = useCallback((id: number) => {
    setSelectedShotId(id);
    setEditor({ mode: "draw", shotId: id, isNew: false });
    setStatusLine("Shot plate editor");
  }, []);

  /**
   * Hand the plate to the modular Sprite Editor (full freehand + layers).
   * RETURN TO SHOTLIST writes the mono plate back onto this shot.
   */
  const openInSpriteEditor = useCallback(
    (shotId: number, plateDataUrl?: string | null) => {
      const shot = sequence.shots.find((s) => s.id === shotId);
      if (!shot) return;
      const dataUrl = plateDataUrl ?? shot.thumbnail;
      if (plateDataUrl) {
        setSequence((prev) => ({
          ...prev,
          shots: prev.shots.map((s) =>
            s.id === shotId
              ? { ...s, thumbnail: plateDataUrl, hasCommittedThumbnail: true }
              : s,
          ),
        }));
      }
      setEditor({ mode: "closed" });
      workflow.handoffTo({
        sourceApp: "shotlist",
        targetApp: "kooldraw",
        kind: "mono-plate",
        label: shot.title,
        width: shot.plateW,
        height: shot.plateH,
        dataUrl,
        mono: true,
        bg: shot.bg,
        ref: { shotId: shot.id },
      });
      setStatusLine(
        `Opened ${shot.title} (${shot.plateW}×${shot.plateH}) in SPRITE EDITOR`,
      );
    },
    [sequence.shots, workflow],
  );

  const openSelectedInSprite = useCallback(() => {
    if (selectedShotId == null) return;
    openInSpriteEditor(selectedShotId);
  }, [selectedShotId, openInSpriteEditor]);

  const savePlate = useCallback(
    (dataUrl: string) => {
      if (editor.mode !== "draw") return;
      const id = editor.shotId;
      setSequence((prev) => ({
        ...prev,
        shots: prev.shots.map((s) =>
          s.id === id
            ? { ...s, thumbnail: dataUrl, hasCommittedThumbnail: true }
            : s,
        ),
      }));
      const shot = sequence.shots.find((s) => s.id === id);
      setEditor({ mode: "closed" });
      setStatusLine(
        `Plate saved · ${shot?.plateW ?? SHOT_W}×${shot?.plateH ?? SHOT_H} mono · HD/4K unlock available`,
      );
    },
    [editor, sequence.shots],
  );

  /** Open size picker — only after first committed thumbnail. */
  const beginUpgrade = useCallback((shotId: number) => {
    const shot = sequence.shots.find((s) => s.id === shotId);
    if (!shot?.hasCommittedThumbnail) {
      setStatusLine("Save a first thumbnail drawing before HD/4K upgrade");
      return;
    }
    const opts = availableUpgrades(
      shot.hasCommittedThumbnail,
      shot.plateW,
      shot.plateH,
    );
    if (opts.length === 0) {
      setStatusLine("Already at maximum plate size (4K) or no upgrades");
      return;
    }
    setSelectedShotId(shotId);
    setEditor({ mode: "pick-upgrade", shotId });
    setStatusLine("Choose plate upgrade: HD 1920×1080 or 4K 3840×2160");
  }, [sequence.shots]);

  const confirmUpgrade = useCallback(
    async (size: PlateSize) => {
      if (editor.mode !== "pick-upgrade") return;
      const shotId = editor.shotId;
      const shot = sequence.shots.find((s) => s.id === shotId);
      if (!shot || !shot.hasCommittedThumbnail) return;

      setStatusLine(`Upgrading to ${size.short}…`);
      const nextUrl = await upgradePlateDataUrl(
        shot.thumbnail,
        shot.plateW,
        shot.plateH,
        size.width,
        size.height,
        shot.bg,
      );
      setSequence((prev) => ({
        ...prev,
        shots: prev.shots.map((s) =>
          s.id === shotId
            ? {
                ...s,
                plateW: size.width,
                plateH: size.height,
                thumbnail: nextUrl,
              }
            : s,
        ),
      }));
      setEditor({ mode: "draw", shotId, isNew: false });
      setStatusLine(`Upgraded to ${size.short} · drawing at full plate size`);
    },
    [editor, sequence.shots],
  );

  const cancelEditor = useCallback(() => {
    if (editor.mode === "pick-bg") {
      setStatusLine("Add shot cancelled");
    } else if (editor.mode === "pick-upgrade") {
      setStatusLine("Upgrade cancelled");
    } else if (editor.mode === "draw" && editor.isNew) {
      setStatusLine("Editor closed · blank plate kept");
    } else {
      setStatusLine("Editor closed");
    }
    setEditor({ mode: "closed" });
  }, [editor]);

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
    // Drawing editor owns the keyboard while open.
    if (editor.mode !== "closed") return;
    const onKey = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }
      switch (e.key.toLowerCase()) {
        case "n":
          e.preventDefault();
          beginAddShot();
          break;
        case "e":
          if (selectedShotId != null) {
            e.preventDefault();
            openDrawSelected();
          }
          break;
        case "s":
          if (selectedShotId != null && !e.metaKey && !e.ctrlKey) {
            e.preventDefault();
            openSelectedInSprite();
          }
          break;
        case "u":
          if (selectedShotId != null) {
            e.preventDefault();
            beginUpgrade(selectedShotId);
          }
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
    editor.mode,
    beginAddShot,
    openDrawSelected,
    openSelectedInSprite,
    beginUpgrade,
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
          <button type="button" style={btn()} onClick={beginAddShot} title="New Shot (N)">
            + SHOT
          </button>
          <button
            type="button"
            style={btn()}
            onClick={openDrawSelected}
            disabled={selectedShotId == null}
            title="Draw plate (E)"
          >
            DRAW
          </button>
          <button
            type="button"
            style={btn()}
            onClick={openSelectedInSprite}
            disabled={selectedShotId == null}
            title="Open plate in Sprite Editor (S)"
          >
            SPRITE
          </button>
          <button
            type="button"
            style={btn()}
            onClick={() => selectedShotId != null && beginUpgrade(selectedShotId)}
            disabled={
              selectedShotId == null || !selectedShot?.hasCommittedThumbnail
            }
            title="Upgrade to HD/4K after first thumbnail (U)"
          >
            HD/4K
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
          <div>Press N or click + SHOT — pick BLACK or WHITE plate.</div>
          <div style={{ marginTop: 8, color: "#555", fontSize: 9 }}>
            First drawing: {SHOT_W}×{SHOT_H} thumbnail plate.
            <br />
            After save: optional upgrade to 1920×1080 or 3840×2160.
            <br />
            HARSH · PEN (pressure size) · DITHER pencil
          </div>
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
                {/* 480×853 mono plate thumbnail (portrait strip) */}
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    openDrawShot(shot.id);
                  }}
                  title="Draw / edit plate (E)"
                  style={{
                    width: 48,
                    minHeight: 72,
                    padding: 0,
                    background: shot.bg === "white" ? "#fff" : "#000",
                    border: "none",
                    borderRight: "1px solid #222",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "#444",
                    fontSize: 8,
                    letterSpacing: 1,
                    flexShrink: 0,
                    cursor: "pointer",
                    overflow: "hidden",
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
                    />
                  ) : (
                    "DRAW"
                  )}
                </button>

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
                      {shot.plateW}×{shot.plateH}
                      {shot.hasCommittedThumbnail ? "" : " · draft"}
                      {" · "}
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
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                      <button
                        type="button"
                        style={btn(true)}
                        onClick={() => openDrawShot(shot.id)}
                      >
                        DRAW PLATE · {shot.plateW}×{shot.plateH}
                      </button>
                      <button
                        type="button"
                        style={btn()}
                        onClick={() => openInSpriteEditor(shot.id)}
                        title="Open in Sprite Editor (S)"
                      >
                        → SPRITE EDITOR
                      </button>
                      {shot.hasCommittedThumbnail &&
                        availableUpgrades(
                          shot.hasCommittedThumbnail,
                          shot.plateW,
                          shot.plateH,
                        ).length > 0 && (
                          <button
                            type="button"
                            style={btn()}
                            onClick={() => beginUpgrade(shot.id)}
                            title="Upgrade plate to HD or 4K (U) — after first thumbnail"
                          >
                            UPGRADE HD/4K
                          </button>
                        )}
                    </div>
                    {!shot.hasCommittedThumbnail && (
                      <div style={{ fontSize: 8, color: "#555", letterSpacing: 1 }}>
                        Save a first thumbnail drawing to unlock 1920×1080 / 3840×2160.
                      </div>
                    )}
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
                        rows={2}
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
                        rows={2}
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
      <span>
        N:NEW · E:DRAW · S:SPRITE · U:UPGRADE · ENTER:EXPAND · ↑↓ · DEL · H:ZEN · ☦
      </span>
    </div>
  );

  /* ---- Help panel content (for corner on mobile) ---- */

  const helpContent = (
    <div style={{ padding: 8, fontSize: 9, color: "#888", letterSpacing: 1, lineHeight: 1.7 }}>
      <div style={{ color: "#ffff00", marginBottom: 6 }}>SHOTLIST</div>
      <div>N — new shot (pick B/W plate)</div>
      <div>E — draw mono plate (starts {SHOT_W}×{SHOT_H})</div>
      <div>S — open plate in Sprite Editor</div>
      <div>U — upgrade to HD/4K (after first thumb)</div>
      <div>Enter — expand / collapse X-sheet</div>
      <div>↑ ↓ — select shot</div>
      <div>Del — delete selected</div>
      <div>H — zen / hide chrome</div>
      <div style={{ marginTop: 8, color: "#555" }}>
        Thumb {SHOT_W}×{SHOT_H} → HD / 4K · HARSH / PEN / DITHER
      </div>
      <div style={{ marginTop: 10, color: "#444" }}>
        Offline MVP. Wallet approvals later.
      </div>
      <div style={{ marginTop: 8, color: "#333" }}>
        Non nobis, Domine.
      </div>
    </div>
  );

  /* ---- BG picker overlay ---- */

  const upgradeShot =
    editor.mode === "pick-upgrade"
      ? sequence.shots.find((s) => s.id === editor.shotId) ?? null
      : null;
  const upgradeOptions = upgradeShot
    ? availableUpgrades(
        upgradeShot.hasCommittedThumbnail,
        upgradeShot.plateW,
        upgradeShot.plateH,
      )
    : [];

  const upgradePicker =
    editor.mode === "pick-upgrade" && upgradeShot ? (
      <div
        style={{
          position: "absolute",
          inset: 0,
          zIndex: 40,
          background: "rgba(0,0,0,0.92)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: 16,
        }}
        onClick={cancelEditor}
      >
        <div
          onClick={(e) => e.stopPropagation()}
          style={{
            border: "2px solid #fff",
            background: "#000",
            padding: 20,
            maxWidth: 400,
            width: "100%",
          }}
        >
          <div
            style={{
              color: "#ffff00",
              letterSpacing: 2,
              fontSize: 11,
              marginBottom: 8,
            }}
          >
            UPGRADE PLATE · {upgradeShot.title}
          </div>
          <div
            style={{
              color: "#888",
              fontSize: 9,
              letterSpacing: 1,
              marginBottom: 12,
              lineHeight: 1.6,
            }}
          >
            First thumbnail is locked in at {SHOT_W}×{SHOT_H}.
            <br />
            Current working size: {upgradeShot.plateW}×{upgradeShot.plateH}.
            <br />
            Upgrade letterboxes your drawing onto HD or 4K (nearest-neighbor mono).
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {upgradeOptions.map((size) => (
              <button
                key={size.id}
                type="button"
                onClick={() => void confirmUpgrade(size)}
                style={{
                  ...btn(),
                  padding: "12px 10px",
                  textAlign: "left",
                  letterSpacing: 1,
                }}
              >
                {size.label}
                <span style={{ color: "#666", marginLeft: 8 }}>
                  {size.id === "hd" ? "16:9 production" : "16:9 print / finish"}
                </span>
              </button>
            ))}
          </div>
          <button
            type="button"
            onClick={cancelEditor}
            style={{ ...btn(), width: "100%", marginTop: 12 }}
          >
            CANCEL
          </button>
        </div>
      </div>
    ) : null;

  const bgPicker =
    editor.mode === "pick-bg" ? (
      <div
        style={{
          position: "absolute",
          inset: 0,
          zIndex: 40,
          background: "rgba(0,0,0,0.92)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: 16,
        }}
        onClick={cancelEditor}
      >
        <div
          onClick={(e) => e.stopPropagation()}
          style={{
            border: "2px solid #fff",
            background: "#000",
            padding: 20,
            maxWidth: 360,
            width: "100%",
          }}
        >
          <div
            style={{
              color: "#ffff00",
              letterSpacing: 2,
              fontSize: 11,
              marginBottom: 8,
            }}
          >
            NEW SHOT · STARTING PLATE
          </div>
          <div style={{ color: "#888", fontSize: 9, letterSpacing: 1, marginBottom: 16, lineHeight: 1.6 }}>
            Start with a {SHOT_W}×{SHOT_H} monochrome thumbnail plate.
            After you save the first drawing, you may upgrade to 1920×1080 or
            3840×2160. Choose white or black to begin.
          </div>
          <div style={{ display: "flex", gap: 10 }}>
            <button
              type="button"
              onClick={() => confirmAddShot("black")}
              style={{
                flex: 1,
                height: 96,
                background: "#000",
                color: "#fff",
                border: "2px solid #fff",
                cursor: "pointer",
                fontFamily: "inherit",
                letterSpacing: 2,
                fontSize: 12,
              }}
            >
              BLACK
            </button>
            <button
              type="button"
              onClick={() => confirmAddShot("white")}
              style={{
                flex: 1,
                height: 96,
                background: "#fff",
                color: "#000",
                border: "2px solid #fff",
                cursor: "pointer",
                fontFamily: "inherit",
                letterSpacing: 2,
                fontSize: 12,
              }}
            >
              WHITE
            </button>
          </div>
          <button
            type="button"
            onClick={cancelEditor}
            style={{
              ...btn(),
              width: "100%",
              marginTop: 12,
            }}
          >
            CANCEL
          </button>
        </div>
      </div>
    ) : null;

  return (
    <div style={rootStyle}>
      {/* Always-visible header — never covered by CornerPanels on mobile */}
      {alwaysVisibleHeader}

      <div style={{ flex: 1, display: "flex", overflow: "hidden", position: "relative" }}>
        {shotList}
        <CornerDismissLayer />

        {collapse && editor.mode === "closed" && (
          <>
            <CornerPanel id="actions" corner="top-left" label="ACT">
              <div style={{ padding: 8, display: "flex", flexDirection: "column", gap: 6 }}>
                <button type="button" style={btn()} onClick={beginAddShot}>
                  + SHOT
                </button>
                <button
                  type="button"
                  style={btn()}
                  onClick={openDrawSelected}
                  disabled={selectedShotId == null}
                >
                  DRAW
                </button>
                <button
                  type="button"
                  style={btn()}
                  onClick={openSelectedInSprite}
                  disabled={selectedShotId == null}
                >
                  SPRITE
                </button>
                <button
                  type="button"
                  style={btn()}
                  onClick={() =>
                    selectedShotId != null && beginUpgrade(selectedShotId)
                  }
                  disabled={
                    selectedShotId == null ||
                    !selectedShot?.hasCommittedThumbnail
                  }
                >
                  HD/4K
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
                <div style={{ marginTop: 4 }}>
                  {selectedShot
                    ? `Plate ${selectedShot.plateW}×${selectedShot.plateH}`
                    : `Thumb ${SHOT_W}×${SHOT_H}`}
                </div>
                <div style={{ marginTop: 4 }}>{statusLine}</div>
              </div>
            </CornerPanel>
          </>
        )}

        {editor.mode === "closed" && <VerticalChromeToggle corner="bottom-right" />}

        {bgPicker}
        {upgradePicker}

        {editor.mode === "draw" && editingShot && (
          <ShotCanvas
            key={`${editingShot.id}-${editingShot.plateW}x${editingShot.plateH}`}
            initialDataUrl={editingShot.thumbnail}
            bg={editingShot.bg ?? "black"}
            width={editingShot.plateW}
            height={editingShot.plateH}
            title={editingShot.title}
            onSave={savePlate}
            onCancel={cancelEditor}
            onOpenInSpriteEditor={(livePlate) =>
              openInSpriteEditor(editingShot.id, livePlate)
            }
          />
        )}
      </div>

      {!collapse && editor.mode === "closed" && statusBar}
    </div>
  );
}
