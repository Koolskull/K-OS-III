/*
 * SHOTLIST — Sequence / Storyboard / X-Sheet
 * Portrait or landscape mono plates · corner chrome · draw-first new shot
 * Spec: docs/SHOTLIST_SPEC.md · Mobile: docs/MOBILE_CREATIVE_UI.md
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
  thumbSize,
  upgradePlateDataUrl,
  type PlateOrientation,
  type PlateSize,
  type ShotBg,
} from "./monoDraw";
import { useCreativeWorkflow } from "@/lib/creative";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface XFrame {
  id: number;
  exposure: number;
  action: string;
  dialogue: string;
  camera: string;
  audioCue: string;
  notes: string;
  assetRef: string | null;
}

interface Shot {
  id: number;
  title: string;
  description: string;
  durationFrames: number;
  audioNotes: string;
  bg: ShotBg;
  orientation: PlateOrientation;
  plateW: number;
  plateH: number;
  thumbnail: string | null;
  hasCommittedThumbnail: boolean;
  xsheet: XFrame[];
  status: "draft" | "review" | "approved";
}

interface Sequence {
  id: number;
  name: string;
  fps: number;
  shots: Shot[];
}

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

function createEmptyShot(
  title = "SHOT",
  bg: ShotBg = "black",
  orientation: PlateOrientation = "portrait",
): Shot {
  const { width, height } = thumbSize(orientation);
  const plate = bitmapToDataURL(createBlankBitmap(bg, width, height), width, height);
  return {
    id: uid(),
    title,
    description: "",
    durationFrames: 24,
    audioNotes: "",
    bg,
    orientation,
    plateW: width,
    plateH: height,
    thumbnail: plate || null,
    hasCommittedThumbnail: false,
    xsheet: [createEmptyXFrame()],
    status: "draft",
  };
}

type EditorState =
  | { mode: "closed" }
  | { mode: "pick-start" }
  | { mode: "pick-upgrade"; shotId: number }
  | { mode: "draw"; shotId: number; isNew: boolean };

function createEmptySequence(name = "UNTITLED SEQUENCE"): Sequence {
  return { id: uid(), name, fps: 24, shots: [] };
}

interface ShotlistAppProps {
  isFocused?: boolean;
}

const btn = (active = false): React.CSSProperties => ({
  padding: "6px 10px",
  background: active ? "#ffffff" : "#000000",
  color: active ? "#000000" : "#cccccc",
  border: active ? "1px solid #ffffff" : "1px solid #555555",
  cursor: "pointer",
  fontFamily: "inherit",
  fontSize: 10,
  letterSpacing: 1,
  touchAction: "manipulation",
});

const fieldStyle: React.CSSProperties = {
  display: "block",
  width: "100%",
  marginTop: 2,
  background: "#111",
  color: "#eee",
  border: "1px solid #333",
  padding: "4px 6px",
  fontFamily: "inherit",
  fontSize: 11,
};

export default function ShotlistApp({ isFocused = true }: ShotlistAppProps) {
  return (
    <CornerHost storageKey="kos-shotlist-chrome" style={{ background: "#000000" }}>
      <ShotlistInner isFocused={isFocused} />
    </CornerHost>
  );
}

function ShotlistInner({ isFocused = true }: ShotlistAppProps) {
  const chrome = useCornerChromeOptional();
  const isNarrow = chrome?.isNarrow ?? false;
  const workflow = useCreativeWorkflow();

  const [sequence, setSequence] = useState<Sequence>(() => createEmptySequence());
  const [selectedShotId, setSelectedShotId] = useState<number | null>(null);
  const [expandedShotId, setExpandedShotId] = useState<number | null>(null);
  const [statusLine, setStatusLine] = useState(
    `SHOTLIST · offline · thumb ${SHOT_W}×${SHOT_H} / landscape · 24 fps`,
  );
  const [editor, setEditor] = useState<EditorState>({ mode: "closed" });
  const [pickOrientation, setPickOrientation] = useState<PlateOrientation>("portrait");
  const [pickBg, setPickBg] = useState<ShotBg>("black");

  /* Creative bus return */
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
      setStatusLine(`Returned from SPRITE · ${rw}×${rh}`);
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

  const beginAddShot = useCallback(() => {
    setPickOrientation("portrait");
    setPickBg("black");
    setEditor({ mode: "pick-start" });
    setStatusLine("New shot — orientation + plate color, then draw");
  }, []);

  const confirmAddShot = useCallback(() => {
    const shot = createEmptyShot(
      `SHOT ${sequence.shots.length + 1}`,
      pickBg,
      pickOrientation,
    );
    setSequence((prev) => ({ ...prev, shots: [...prev.shots, shot] }));
    setSelectedShotId(shot.id);
    setEditor({ mode: "draw", shotId: shot.id, isNew: true });
    setStatusLine(
      `Draw first · ${pickOrientation} ${shot.plateW}×${shot.plateH} · ${pickBg}`,
    );
  }, [sequence.shots.length, pickBg, pickOrientation]);

  const openDrawShot = useCallback((id: number) => {
    setSelectedShotId(id);
    setEditor({ mode: "draw", shotId: id, isNew: false });
    setStatusLine("Shot plate editor");
  }, []);

  const openDrawSelected = useCallback(() => {
    if (selectedShotId == null) return;
    openDrawShot(selectedShotId);
  }, [selectedShotId, openDrawShot]);

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
      setStatusLine(`→ SPRITE EDITOR ${shot.plateW}×${shot.plateH}`);
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
      // Stay on draw with metadata if new; close only on explicit done from meta DONE
      if (editor.isNew) {
        setStatusLine(
          `Thumbnail saved · fill metadata · unlock HD/4K (${shot?.plateW}×${shot?.plateH})`,
        );
        // Keep draw mode open so metadata dialog remains
      } else {
        setEditor({ mode: "closed" });
        setStatusLine(`Plate saved · ${shot?.plateW}×${shot?.plateH}`);
      }
    },
    [editor, sequence.shots],
  );

  const finishDrawSession = useCallback(() => {
    setEditor({ mode: "closed" });
    setStatusLine("Shot session closed");
  }, []);

  const beginUpgrade = useCallback(
    (shotId: number) => {
      const shot = sequence.shots.find((s) => s.id === shotId);
      if (!shot?.hasCommittedThumbnail) {
        setStatusLine("Save a first thumbnail drawing before HD/4K");
        return;
      }
      const opts = availableUpgrades(
        shot.hasCommittedThumbnail,
        shot.plateW,
        shot.plateH,
      );
      if (opts.length === 0) {
        setStatusLine("No upgrades available (already max)");
        return;
      }
      setSelectedShotId(shotId);
      setEditor({ mode: "pick-upgrade", shotId });
    },
    [sequence.shots],
  );

  const confirmUpgrade = useCallback(
    async (size: PlateSize) => {
      if (editor.mode !== "pick-upgrade") return;
      const shotId = editor.shotId;
      const shot = sequence.shots.find((s) => s.id === shotId);
      if (!shot?.hasCommittedThumbnail) return;
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
      setStatusLine(`Upgraded to ${size.short}`);
    },
    [editor, sequence.shots],
  );

  const cancelEditor = useCallback(() => {
    if (editor.mode === "pick-start") setStatusLine("Add shot cancelled");
    else if (editor.mode === "pick-upgrade") setStatusLine("Upgrade cancelled");
    else if (editor.mode === "draw" && editor.isNew)
      setStatusLine("Editor closed · blank plate kept");
    else setStatusLine("Editor closed");
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

  const updateShotField = useCallback((id: number, patch: Partial<Shot>) => {
    setSequence((prev) => ({
      ...prev,
      shots: prev.shots.map((s) => (s.id === id ? { ...s, ...patch } : s)),
    }));
  }, []);

  useEffect(() => {
    if (!isFocused) return;
    if (editor.mode !== "closed") return;
    const onKey = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement)
        return;
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
          setSelectedShotId(list[next]!.id);
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

  /* ---- Metadata form (used beside / below canvas) ---- */
  const metadataForm = (shot: Shot) => (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: 8,
        padding: 10,
        height: "100%",
        overflowY: "auto",
        background: "#050505",
        border: "1px solid #222",
        minWidth: 0,
      }}
    >
      <div style={{ color: "#ffff00", fontSize: 9, letterSpacing: 2 }}>
        SHOT METADATA
      </div>
      <div style={{ fontSize: 8, color: "#555", letterSpacing: 1 }}>
        {shot.orientation.toUpperCase()} · {shot.plateW}×{shot.plateH} ·{" "}
        {shot.bg.toUpperCase()}
        {shot.hasCommittedThumbnail ? " · THUMB OK" : " · DRAW & SAVE FIRST"}
      </div>
      <label style={{ fontSize: 9, color: "#888", letterSpacing: 1 }}>
        TITLE
        <input
          value={shot.title}
          onChange={(e) => updateShotField(shot.id, { title: e.target.value })}
          style={fieldStyle}
        />
      </label>
      <label style={{ fontSize: 9, color: "#888", letterSpacing: 1 }}>
        DESCRIPTION
        <textarea
          value={shot.description}
          onChange={(e) => updateShotField(shot.id, { description: e.target.value })}
          rows={3}
          style={{ ...fieldStyle, resize: "vertical" }}
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
          style={{ ...fieldStyle, width: 120 }}
        />
      </label>
      <label style={{ fontSize: 9, color: "#888", letterSpacing: 1 }}>
        AUDIO TIMING NOTES
        <textarea
          value={shot.audioNotes}
          onChange={(e) => updateShotField(shot.id, { audioNotes: e.target.value })}
          rows={2}
          placeholder="e.g. hit on beat 3 of bar 12…"
          style={{ ...fieldStyle, resize: "vertical" }}
        />
      </label>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 4 }}>
        {shot.hasCommittedThumbnail &&
          availableUpgrades(true, shot.plateW, shot.plateH).length > 0 && (
            <button type="button" style={btn()} onClick={() => beginUpgrade(shot.id)}>
              UPGRADE HD/4K
            </button>
          )}
        <button
          type="button"
          style={btn()}
          onClick={() => openInSpriteEditor(shot.id, shot.thumbnail)}
        >
          → SPRITE
        </button>
        <button type="button" style={btn(true)} onClick={finishDrawSession}>
          DONE
        </button>
      </div>
    </div>
  );

  /* ---- Shot list ---- */
  const shotList = (
    <div
      style={{
        flex: 1,
        overflowY: "auto",
        padding: isNarrow ? "48px 10px 48px 10px" : "40px 10px 8px 10px",
      }}
    >
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
          <div>Tap + SHOT (or N) — choose portrait/landscape + B/W, then draw.</div>
          <div style={{ marginTop: 8, color: "#555", fontSize: 9 }}>
            Metadata fills in beside the plate (desktop) or below (mobile).
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
              <div
                onClick={() => setSelectedShotId(shot.id)}
                onDoubleClick={() => openDrawShot(shot.id)}
                style={{
                  display: "flex",
                  alignItems: "stretch",
                  cursor: "pointer",
                  minHeight: 56,
                }}
              >
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    openDrawShot(shot.id);
                  }}
                  style={{
                    width: shot.orientation === "landscape" ? 72 : 48,
                    minHeight: 56,
                    padding: 0,
                    background: shot.bg === "white" ? "#fff" : "#000",
                    border: "none",
                    borderRight: "1px solid #222",
                    flexShrink: 0,
                    cursor: "pointer",
                    overflow: "hidden",
                  }}
                  title="Draw plate"
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
                    <span style={{ color: "#444", fontSize: 8 }}>DRAW</span>
                  )}
                </button>
                <div style={{ flex: 1, padding: "6px 10px", minWidth: 0 }}>
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      gap: 8,
                      alignItems: "baseline",
                    }}
                  >
                    <span
                      style={{
                        color: isSelected ? "#ffff00" : "#eee",
                        letterSpacing: 1,
                        fontSize: 11,
                      }}
                    >
                      {String(index + 1).padStart(2, "0")} · {shot.title}
                    </span>
                    <span style={{ color: "#666", fontSize: 9 }}>
                      {shot.orientation === "portrait" ? "P" : "L"} · {shot.plateW}×
                      {shot.plateH}
                      {shot.hasCommittedThumbnail ? "" : " · draft"}
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
                >
                  {isExpanded ? "▼" : "▶"}
                </button>
              </div>
              {isExpanded && (
                <div
                  style={{
                    borderTop: "1px solid #333",
                    padding: "10px 12px",
                    background: "#050505",
                    display: "flex",
                    flexDirection: "column",
                    gap: 6,
                  }}
                >
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                    <button
                      type="button"
                      style={btn(true)}
                      onClick={() => openDrawShot(shot.id)}
                    >
                      DRAW · {shot.plateW}×{shot.plateH}
                    </button>
                    <button
                      type="button"
                      style={btn()}
                      onClick={() => openInSpriteEditor(shot.id)}
                    >
                      → SPRITE
                    </button>
                    {shot.hasCommittedThumbnail &&
                      availableUpgrades(true, shot.plateW, shot.plateH).length >
                        0 && (
                        <button
                          type="button"
                          style={btn()}
                          onClick={() => beginUpgrade(shot.id)}
                        >
                          HD/4K
                        </button>
                      )}
                  </div>
                  {metadataForm(shot)}
                </div>
              )}
            </div>
          );
        })
      )}
    </div>
  );

  const actionsPanel = (
    <div style={{ padding: 8, display: "flex", flexDirection: "column", gap: 6 }}>
      <button type="button" style={btn(true)} onClick={beginAddShot}>
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
        onClick={() => selectedShotId != null && beginUpgrade(selectedShotId)}
        disabled={selectedShotId == null || !selectedShot?.hasCommittedThumbnail}
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
        <button type="button" style={btn()} onClick={() => toggleExpand(selectedShot.id)}>
          {expandedShotId === selectedShot.id ? "COLLAPSE" : "EXPAND"}
        </button>
      )}
    </div>
  );

  const helpPanel = (
    <div style={{ padding: 8, fontSize: 9, color: "#888", letterSpacing: 1, lineHeight: 1.7 }}>
      <div style={{ color: "#ffff00", marginBottom: 6 }}>SHOTLIST</div>
      <div>N — new shot (orient + B/W → draw → meta)</div>
      <div>E — draw plate</div>
      <div>S — sprite editor</div>
      <div>U — upgrade HD/4K (after thumb)</div>
      <div>↑↓ Enter Del · H zen</div>
      <div style={{ marginTop: 8, color: "#555" }}>
        Draw: SPACE pan · SHIFT/ALT rotate · scroll zoom · pinch · 2-finger undo
      </div>
    </div>
  );

  const infoPanel = (
    <div style={{ padding: 6, fontSize: 9, color: "#888" }}>
      <div>{sequence.name}</div>
      <div>
        {sequence.shots.length} shots · {sequence.fps} fps
      </div>
      <div style={{ marginTop: 4 }}>{statusLine}</div>
    </div>
  );

  /* Start picker: orientation + bg */
  const startPicker =
    editor.mode === "pick-start" ? (
      <div
        style={{
          position: "absolute",
          inset: 0,
          zIndex: 40,
          background: "rgba(0,0,0,0.94)",
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
            maxWidth: 420,
            width: "100%",
          }}
        >
          <div style={{ color: "#ffff00", letterSpacing: 2, fontSize: 11, marginBottom: 12 }}>
            NEW SHOT · FRAME SETUP
          </div>
          <div style={{ color: "#888", fontSize: 9, letterSpacing: 1, marginBottom: 10 }}>
            ORIENTATION
          </div>
          <div style={{ display: "flex", gap: 10, marginBottom: 16 }}>
            <button
              type="button"
              onClick={() => setPickOrientation("portrait")}
              style={{
                flex: 1,
                height: 88,
                background: pickOrientation === "portrait" ? "#fff" : "#000",
                color: pickOrientation === "portrait" ? "#000" : "#ccc",
                border: "2px solid #fff",
                cursor: "pointer",
                fontFamily: "inherit",
                letterSpacing: 1,
                fontSize: 11,
              }}
            >
              PORTRAIT
              <div style={{ fontSize: 9, marginTop: 6, opacity: 0.7 }}>480×853</div>
            </button>
            <button
              type="button"
              onClick={() => setPickOrientation("landscape")}
              style={{
                flex: 1,
                height: 88,
                background: pickOrientation === "landscape" ? "#fff" : "#000",
                color: pickOrientation === "landscape" ? "#000" : "#ccc",
                border: "2px solid #fff",
                cursor: "pointer",
                fontFamily: "inherit",
                letterSpacing: 1,
                fontSize: 11,
              }}
            >
              LANDSCAPE
              <div style={{ fontSize: 9, marginTop: 6, opacity: 0.7 }}>853×480</div>
            </button>
          </div>
          <div style={{ color: "#888", fontSize: 9, letterSpacing: 1, marginBottom: 10 }}>
            PLATE COLOR
          </div>
          <div style={{ display: "flex", gap: 10, marginBottom: 16 }}>
            <button
              type="button"
              onClick={() => setPickBg("black")}
              style={{
                flex: 1,
                height: 64,
                background: "#000",
                color: "#fff",
                border:
                  pickBg === "black" ? "2px solid #ffff00" : "2px solid #555",
                cursor: "pointer",
                fontFamily: "inherit",
                letterSpacing: 2,
              }}
            >
              BLACK
            </button>
            <button
              type="button"
              onClick={() => setPickBg("white")}
              style={{
                flex: 1,
                height: 64,
                background: "#fff",
                color: "#000",
                border:
                  pickBg === "white" ? "2px solid #ffff00" : "2px solid #555",
                cursor: "pointer",
                fontFamily: "inherit",
                letterSpacing: 2,
              }}
            >
              WHITE
            </button>
          </div>
          <button
            type="button"
            onClick={confirmAddShot}
            style={{ ...btn(true), width: "100%", padding: "10px", marginBottom: 8 }}
          >
            START DRAWING
          </button>
          <button type="button" onClick={cancelEditor} style={{ ...btn(), width: "100%" }}>
            CANCEL
          </button>
        </div>
      </div>
    ) : null;

  const upgradeShot =
    editor.mode === "pick-upgrade"
      ? sequence.shots.find((s) => s.id === editor.shotId) ?? null
      : null;
  const upgradeOptions = upgradeShot
    ? availableUpgrades(true, upgradeShot.plateW, upgradeShot.plateH)
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
          style={{ border: "2px solid #fff", background: "#000", padding: 20, maxWidth: 400, width: "100%" }}
        >
          <div style={{ color: "#ffff00", letterSpacing: 2, fontSize: 11, marginBottom: 8 }}>
            UPGRADE · {upgradeShot.title}
          </div>
          <div style={{ color: "#888", fontSize: 9, marginBottom: 12, lineHeight: 1.6 }}>
            Current {upgradeShot.plateW}×{upgradeShot.plateH}. Letterbox mono upscale.
          </div>
          {upgradeOptions.map((size) => (
            <button
              key={size.id}
              type="button"
              onClick={() => void confirmUpgrade(size)}
              style={{ ...btn(), width: "100%", marginBottom: 8, padding: "12px 10px", textAlign: "left" }}
            >
              {size.label}
            </button>
          ))}
          <button type="button" onClick={cancelEditor} style={{ ...btn(), width: "100%" }}>
            CANCEL
          </button>
        </div>
      </div>
    ) : null;

  /* Draw + metadata split */
  const drawWorkspace =
    editor.mode === "draw" && editingShot ? (
      <div
        style={{
          position: "absolute",
          inset: 0,
          zIndex: 50,
          background: "#000",
          display: "flex",
          flexDirection: isNarrow ? "column" : "row",
          minHeight: 0,
        }}
      >
        <div style={{ flex: isNarrow ? "1 1 58%" : "1 1 62%", minHeight: 0, minWidth: 0 }}>
          <ShotCanvas
            key={`${editingShot.id}-${editingShot.plateW}x${editingShot.plateH}`}
            embedded
            initialDataUrl={editingShot.thumbnail}
            bg={editingShot.bg}
            width={editingShot.plateW}
            height={editingShot.plateH}
            title={editingShot.title}
            onSave={savePlate}
            onCancel={cancelEditor}
            onOpenInSpriteEditor={(live) => openInSpriteEditor(editingShot.id, live)}
          />
        </div>
        <div
          style={{
            flex: isNarrow ? "0 0 42%" : "0 0 320px",
            minHeight: isNarrow ? 160 : 0,
            maxHeight: isNarrow ? "42%" : "none",
            borderLeft: isNarrow ? "none" : "1px solid #333",
            borderTop: isNarrow ? "1px solid #333" : "none",
            minWidth: 0,
          }}
        >
          {metadataForm(editingShot)}
        </div>
      </div>
    ) : null;

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
        userSelect: "none",
        position: "relative",
      }}
    >
      {/* Always-visible thin header with NEW shortcut */}
      <div
        style={{
          flexShrink: 0,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 8,
          padding: "5px 10px",
          borderBottom: "2px solid #fff",
          background: "#000",
          zIndex: 30,
        }}
      >
        <span style={{ color: "#ffff00", letterSpacing: 2, fontSize: 11 }}>☦ SHOTLIST</span>
        <span style={{ color: "#666", fontSize: 9, letterSpacing: 1, flex: 1, textAlign: "center" }}>
          {sequence.shots.length} SHOTS · {sequence.fps} FPS
        </span>
        <button
          type="button"
          style={btn(true)}
          onClick={beginAddShot}
          title="New shot (N) — draw first, then metadata"
        >
          + SHOT
        </button>
      </div>

      <div style={{ flex: 1, display: "flex", overflow: "hidden", position: "relative" }}>
        {editor.mode === "closed" && shotList}

        <CornerDismissLayer />

        {editor.mode === "closed" && (
          <>
            <CornerPanel id="actions" corner="top-left" label="ACT" forceCorner>
              {actionsPanel}
            </CornerPanel>
            <CornerPanel id="help" corner="top-right" label="?" forceCorner>
              {helpPanel}
            </CornerPanel>
            <CornerPanel id="info" corner="bottom-left" label="INFO" forceCorner>
              {infoPanel}
            </CornerPanel>
            <VerticalChromeToggle corner="bottom-right" />
          </>
        )}

        {startPicker}
        {upgradePicker}
        {drawWorkspace}
      </div>

      {editor.mode === "closed" && (
        <div
          style={{
            borderTop: "1px solid #222",
            padding: "4px 10px",
            fontSize: 8,
            color: "#666",
            letterSpacing: 1,
            display: "flex",
            justifyContent: "space-between",
            flexShrink: 0,
            gap: 8,
            flexWrap: "wrap",
          }}
        >
          <span>{statusLine}</span>
          <span>N +SHOT · E DRAW · S SPRITE · U HD/4K · corners ACT/?/INFO/ZEN</span>
        </div>
      )}
    </div>
  );
}
