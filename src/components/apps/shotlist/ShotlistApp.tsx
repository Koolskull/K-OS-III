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
import { XSheetEditor } from "./XSheetEditor";
import { ExportView } from "./ExportView";
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
import { safeFetchJson } from "@/lib/safeFetchJson";
import { HAS_BACKEND } from "@/lib/buildFlags";
import {
  btn,
  createEmptyXFrame,
  fieldStyle,
  uid,
  xsheetFrameRanges,
  xsheetTotalFrames,
  type Sequence,
  type Shot,
  type XFrame,
} from "./shotlistShared";

export type { Sequence, Shot, XFrame } from "./shotlistShared";
export {
  btn,
  createEmptyXFrame,
  fieldStyle,
  uid,
  xsheetFrameRanges,
  xsheetTotalFrames,
} from "./shotlistShared";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

function createEmptyShot(
  title = "SHOT",
  bg: ShotBg = "white",
  orientation: PlateOrientation = "landscape",
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
  | { mode: "draw"; shotId: number; isNew: boolean }
  | { mode: "xsheet"; shotId: number }
  | { mode: "export" }
  | { mode: "sequences" }
  | { mode: "assets"; shotId: number };

interface SequenceSummary {
  id: number;
  name: string;
  fps: number;
  project_id: number | null;
  project_name: string | null;
  updated_at: string;
}

interface ProdevProjectOption {
  id: number;
  name: string;
}

interface LibraryAsset {
  id: number;
  kind: "kooldraw_project" | "datamoshpit_render" | "image" | "audio";
  title: string;
  thumbnail_url: string | null;
  file_path: string | null;
  kooldraw_project_id: number | null;
  datamoshpit_render_id: number | null;
  created_at: string;
}

function createEmptySequence(name = "UNTITLED SEQUENCE"): Sequence {
  return { id: uid(), name, fps: 24, shots: [] };
}

interface ShotlistAppProps {
  isFocused?: boolean;
  /** Auto-load this saved sequence on mount/change — e.g. "OPEN IN SHOTLIST" from PRODEV. */
  launchSequenceId?: number;
  /** Deep-link into KoolDraw for a given project id — "EDIT" on an attached kooldraw_project asset. */
  onOpenKoolDrawProject?: (projectId: number) => void;
}

export default function ShotlistApp({ isFocused = true, launchSequenceId, onOpenKoolDrawProject }: ShotlistAppProps) {
  return (
    <CornerHost storageKey="kos-shotlist-chrome" style={{ background: "#000000" }}>
      <ShotlistInner isFocused={isFocused} launchSequenceId={launchSequenceId} onOpenKoolDrawProject={onOpenKoolDrawProject} />
    </CornerHost>
  );
}

function ShotlistInner({ isFocused = true, launchSequenceId, onOpenKoolDrawProject }: ShotlistAppProps) {
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
  /** Defaults: landscape + white (incl. mobile browsers) */
  const [pickOrientation, setPickOrientation] = useState<PlateOrientation>("landscape");
  const [pickBg, setPickBg] = useState<ShotBg>("white");
  /** Shot info dialog while drawing (lower-right toggle) */
  const [shotInfoOpen, setShotInfoOpen] = useState(false);

  /* ---- Persistence (Postgres save/load — explicit, not autosave) ---- */
  const [serverSequenceId, setServerSequenceId] = useState<number | null>(null);
  const [linkedProjectId, setLinkedProjectId] = useState<number | null>(null);
  const [shotServerIds, setShotServerIds] = useState<Record<number, number>>({});
  const [deletedShotServerIds, setDeletedShotServerIds] = useState<number[]>([]);
  const [savingSequence, setSavingSequence] = useState(false);
  const [sequencesList, setSequencesList] = useState<SequenceSummary[]>([]);
  const [loadingSequences, setLoadingSequences] = useState(false);
  const [prodevProjects, setProdevProjects] = useState<ProdevProjectOption[]>([]);

  /* ---- Asset library / per-shot attachments ---- */
  const [libraryAssets, setLibraryAssets] = useState<LibraryAsset[]>([]);
  const [attachedAssets, setAttachedAssets] = useState<LibraryAsset[]>([]);
  const [loadingAssets, setLoadingAssets] = useState(false);

  const openSequencesPicker = useCallback(async () => {
    setEditor({ mode: "sequences" });
    setLoadingSequences(true);
    const [seqs, projects] = await Promise.all([
      safeFetchJson<SequenceSummary[]>("/api/shotlist/sequences"),
      safeFetchJson<ProdevProjectOption[]>("/api/prodev/projects"),
    ]);
    setSequencesList(seqs ?? []);
    setProdevProjects(projects ?? []);
    setLoadingSequences(false);
  }, []);

  const loadSequence = useCallback(async (id: number) => {
    const data = await safeFetchJson<{
      id: number;
      name: string;
      fps: number;
      project_id: number | null;
      shots: Array<{
        id: number;
        prodev_shot_id: number | null;
        title: string;
        description: string;
        duration_frames: number;
        audio_notes: string;
        bg: ShotBg;
        orientation: PlateOrientation;
        plate_w: number;
        plate_h: number;
        thumbnail_url: string | null;
        has_committed_thumbnail: boolean;
        xsheet: XFrame[];
        status: Shot["status"];
        sort_order: number;
      }>;
    }>(`/api/shotlist/sequences/${id}`);
    if (!data) {
      setStatusLine("Failed to load sequence");
      return;
    }
    const idMap: Record<number, number> = {};
    const shots: Shot[] = data.shots.map((s) => {
      const localId = uid();
      idMap[localId] = s.id;
      return {
        id: localId,
        title: s.title,
        description: s.description,
        durationFrames: s.duration_frames,
        audioNotes: s.audio_notes,
        bg: s.bg,
        orientation: s.orientation,
        plateW: s.plate_w,
        plateH: s.plate_h,
        thumbnail: s.thumbnail_url,
        hasCommittedThumbnail: s.has_committed_thumbnail,
        xsheet: s.xsheet.length ? s.xsheet : [createEmptyXFrame()],
        status: s.status,
      };
    });
    setSequence({ id: uid(), name: data.name, fps: data.fps, shots });
    setServerSequenceId(data.id);
    setLinkedProjectId(data.project_id);
    setShotServerIds(idMap);
    setDeletedShotServerIds([]);
    setSelectedShotId(null);
    setEditor({ mode: "closed" });
    setStatusLine(`Loaded "${data.name}" (${shots.length} shots)`);
  }, []);

  useEffect(() => {
    if (launchSequenceId != null) loadSequence(launchSequenceId);
    // Only re-run when the launch target itself changes (e.g. a new
    // "OPEN IN SHOTLIST" click) — loadSequence is stable across renders.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [launchSequenceId]);

  const createNewSequenceOnServer = useCallback(async () => {
    setSequence(createEmptySequence());
    setServerSequenceId(null);
    setLinkedProjectId(null);
    setShotServerIds({});
    setDeletedShotServerIds([]);
    setSelectedShotId(null);
    setEditor({ mode: "closed" });
    setStatusLine("New sequence (unsaved)");
  }, []);

  const saveSequence = useCallback(async () => {
    setSavingSequence(true);
    try {
      let seqId = serverSequenceId;
      if (seqId == null) {
        const created = await safeFetchJson<{ id: number }>("/api/shotlist/sequences", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name: sequence.name, fps: sequence.fps, projectId: linkedProjectId }),
        });
        if (!created) throw new Error("Failed to create sequence");
        seqId = created.id;
        setServerSequenceId(seqId);
      } else {
        await fetch(`/api/shotlist/sequences/${seqId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name: sequence.name, fps: sequence.fps, project_id: linkedProjectId }),
        });
      }

      for (const removedId of deletedShotServerIds) {
        await fetch(`/api/shotlist/shots/${removedId}`, { method: "DELETE" });
      }
      setDeletedShotServerIds([]);

      const nextIdMap: Record<number, number> = {};
      for (let i = 0; i < sequence.shots.length; i++) {
        const shot = sequence.shots[i];
        const payload = {
          title: shot.title,
          description: shot.description,
          duration_frames: shot.durationFrames,
          audio_notes: shot.audioNotes,
          bg: shot.bg,
          orientation: shot.orientation,
          plate_w: shot.plateW,
          plate_h: shot.plateH,
          thumbnail_url: shot.thumbnail,
          has_committed_thumbnail: shot.hasCommittedThumbnail,
          xsheet: shot.xsheet,
          status: shot.status,
          sort_order: i,
        };
        const existingServerId = shotServerIds[shot.id];
        if (existingServerId != null) {
          await fetch(`/api/shotlist/shots/${existingServerId}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
          });
          nextIdMap[shot.id] = existingServerId;
        } else {
          const created = await safeFetchJson<{ id: number }>(`/api/shotlist/sequences/${seqId}/shots`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
          });
          if (created) nextIdMap[shot.id] = created.id;
        }
      }
      setShotServerIds(nextIdMap);
      setStatusLine(`Saved "${sequence.name}"`);
    } catch {
      setStatusLine("Save failed");
    } finally {
      setSavingSequence(false);
    }
  }, [serverSequenceId, sequence, linkedProjectId, shotServerIds, deletedShotServerIds]);

  const openAssetsPanel = useCallback(
    async (shotId: number) => {
      setEditor({ mode: "assets", shotId });
      setLoadingAssets(true);
      const serverShotId = shotServerIds[shotId];
      const [library, attached] = await Promise.all([
        safeFetchJson<LibraryAsset[]>("/api/assets"),
        serverShotId != null
          ? safeFetchJson<LibraryAsset[]>(`/api/shotlist/shots/${serverShotId}/assets`)
          : Promise.resolve([]),
      ]);
      setLibraryAssets(library ?? []);
      setAttachedAssets(attached ?? []);
      setLoadingAssets(false);
    },
    [shotServerIds],
  );

  const attachAsset = useCallback(
    async (shotId: number, assetId: number) => {
      const serverShotId = shotServerIds[shotId];
      if (serverShotId == null) {
        setStatusLine("Save the sequence before attaching assets");
        return;
      }
      await fetch(`/api/shotlist/shots/${serverShotId}/assets`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ assetId }),
      });
      const attached = await safeFetchJson<LibraryAsset[]>(`/api/shotlist/shots/${serverShotId}/assets`);
      setAttachedAssets(attached ?? []);
    },
    [shotServerIds],
  );

  const detachAsset = useCallback(
    async (shotId: number, assetId: number) => {
      const serverShotId = shotServerIds[shotId];
      if (serverShotId == null) return;
      await fetch(`/api/shotlist/shots/${serverShotId}/assets/${assetId}`, { method: "DELETE" });
      setAttachedAssets((prev) => prev.filter((a) => a.id !== assetId));
    },
    [shotServerIds],
  );

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
      setStatusLine(`Returned from KOOLDRAW · ${rw}×${rh}`);
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

  const xsheetShot =
    editor.mode === "xsheet"
      ? sequence.shots.find((s) => s.id === editor.shotId) ?? null
      : null;

  const beginAddShot = useCallback(() => {
    // Always re-seed defaults so mobile/desktop get the same start state
    setPickOrientation("landscape");
    setPickBg("white");
    setEditor({ mode: "pick-start" });
    setStatusLine("New shot — landscape · white (change if needed), then draw");
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
        xsheetSnapshot: {
          fps: sequence.fps,
          durationFrames: shot.durationFrames,
          rows: xsheetFrameRanges(shot.xsheet).map((r, i) => ({
            ...r,
            label: shot.xsheet[i]?.action || shot.xsheet[i]?.dialogue || "",
          })),
        },
      });
      setStatusLine(`→ KOOLDRAW ${shot.plateW}×${shot.plateH}`);
    },
    [sequence.shots, sequence.fps, workflow],
  );

  const openSelectedInSprite = useCallback(() => {
    if (selectedShotId == null) return;
    openInSpriteEditor(selectedShotId);
  }, [selectedShotId, openInSpriteEditor]);

  const savePlate = useCallback(
    (dataUrl: string) => {
      if (editor.mode !== "draw") return;
      const id = editor.shotId;
      const shot = sequence.shots.find((s) => s.id === id);
      // Commit plate, select shot, always return to the list
      setSequence((prev) => ({
        ...prev,
        shots: prev.shots.map((s) =>
          s.id === id
            ? { ...s, thumbnail: dataUrl, hasCommittedThumbnail: true }
            : s,
        ),
      }));
      setSelectedShotId(id);
      setEditor({ mode: "closed" });
      setStatusLine(
        `Saved · ${shot?.plateW ?? "?"}×${shot?.plateH ?? "?"} · expand for metadata / HD-4K`,
      );
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
    const removedServerId = shotServerIds[selectedShotId];
    if (removedServerId != null) {
      setDeletedShotServerIds((prev) => [...prev, removedServerId]);
      setShotServerIds((prev) => {
        const next = { ...prev };
        delete next[selectedShotId];
        return next;
      });
    }
    if (expandedShotId === selectedShotId) setExpandedShotId(null);
    setSelectedShotId(null);
    setStatusLine("Shot removed (save to persist deletion)");
  }, [selectedShotId, expandedShotId, shotServerIds]);

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

  const openXSheet = useCallback((shotId: number) => {
    setSelectedShotId(shotId);
    setEditor({ mode: "xsheet", shotId });
    setStatusLine("X-Sheet editor");
  }, []);

  const openXSheetSelected = useCallback(() => {
    if (selectedShotId == null) return;
    openXSheet(selectedShotId);
  }, [selectedShotId, openXSheet]);

  const updateXSheetFrames = useCallback((shotId: number, frames: XFrame[]) => {
    setSequence((prev) => ({
      ...prev,
      shots: prev.shots.map((s) => (s.id === shotId ? { ...s, xsheet: frames } : s)),
    }));
  }, []);

  const closeXSheet = useCallback(() => {
    setEditor({ mode: "closed" });
    setStatusLine("X-Sheet closed");
  }, []);

  const openExport = useCallback(() => {
    setEditor({ mode: "export" });
    setStatusLine("Export / print");
  }, []);

  const closeExport = useCallback(() => {
    setEditor({ mode: "closed" });
    setStatusLine("Export closed");
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
        case "x":
          if (selectedShotId != null) {
            e.preventDefault();
            openXSheetSelected();
          }
          break;
        case "p":
          e.preventDefault();
          openExport();
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
    openXSheetSelected,
    openExport,
    deleteSelectedShot,
    toggleExpand,
    selectedShotId,
    sequence.shots,
  ]);

  /* ---- Shot info panel fields ---- */
  const shotInfoBody = (shot: Shot) => (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: 8,
        padding: 10,
        overflowY: "auto",
        flex: 1,
        minHeight: 0,
        background: "#0a0a0a",
      }}
    >
      <div style={{ fontSize: 8, color: "#555", letterSpacing: 1 }}>
        {shot.orientation.toUpperCase()} · {shot.plateW}×{shot.plateH} ·{" "}
        {shot.bg.toUpperCase()}
        {shot.hasCommittedThumbnail ? " · THUMB OK" : " · DRAW & SAVE FIRST"}
      </div>
      <label style={{ fontSize: 9, color: "#666", letterSpacing: 1 }}>
        TITLE
        <input
          value={shot.title}
          onChange={(e) => updateShotField(shot.id, { title: e.target.value })}
          style={fieldStyle}
        />
      </label>
      <label style={{ fontSize: 9, color: "#666", letterSpacing: 1 }}>
        DESCRIPTION
        <textarea
          value={shot.description}
          onChange={(e) => updateShotField(shot.id, { description: e.target.value })}
          rows={2}
          style={{ ...fieldStyle, resize: "vertical" }}
        />
      </label>
      <label style={{ fontSize: 9, color: "#666", letterSpacing: 1 }}>
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
      <label style={{ fontSize: 9, color: "#666", letterSpacing: 1 }}>
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
          KOOL
        </button>
        <button type="button" style={btn()} onClick={() => openXSheet(shot.id)}>
          X-SHEET · {xsheetTotalFrames(shot.xsheet)}/{shot.durationFrames}
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
          <div>Tap + SHOT (or N) — defaults landscape + white; change if needed, then draw.</div>
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
                      → KOOL
                    </button>
                    <button type="button" style={btn()} onClick={() => openXSheet(shot.id)}>
                      X-SHEET
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
                  <div style={{ marginTop: 8 }}>{shotInfoBody(shot)}</div>
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
        KOOL
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
        onClick={openXSheetSelected}
        disabled={selectedShotId == null}
      >
        X-SHEET
      </button>
      <button type="button" style={btn()} onClick={openExport}>
        EXPORT
      </button>
      {HAS_BACKEND && (
        <button
          type="button"
          style={btn()}
          onClick={() => selectedShotId != null && openAssetsPanel(selectedShotId)}
          disabled={selectedShotId == null}
        >
          ASSETS
        </button>
      )}
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
      {HAS_BACKEND && (
        <>
          <div style={{ height: 1, background: "#333", margin: "4px 0" }} />
          <button type="button" style={btn()} onClick={openSequencesPicker}>
            SEQUENCES…
          </button>
          <button type="button" style={btn()} onClick={saveSequence} disabled={savingSequence}>
            {savingSequence ? "SAVING…" : "SAVE"}
          </button>
        </>
      )}
    </div>
  );

  const helpPanel = (
    <div style={{ padding: 8, fontSize: 9, color: "#888", letterSpacing: 1, lineHeight: 1.7 }}>
      <div style={{ color: "#ffff00", marginBottom: 6 }}>SHOTLIST</div>
      <div>N — new shot (orient + B/W → draw → meta)</div>
      <div>E — draw plate</div>
      <div>S — KoolDraw</div>
      <div>U — upgrade HD/4K (after thumb)</div>
      <div>X — X-Sheet (exposure notes)</div>
      <div>P — export / print</div>
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
            ORIENTATION · default landscape
          </div>
          <div style={{ display: "flex", gap: 10, marginBottom: 16 }}>
            <button
              type="button"
              onClick={() => setPickOrientation("landscape")}
              style={{
                flex: 1,
                height: 88,
                minHeight: 88,
                background: pickOrientation === "landscape" ? "#fff" : "#000",
                color: pickOrientation === "landscape" ? "#000" : "#ccc",
                border:
                  pickOrientation === "landscape" ? "2px solid #ffff00" : "2px solid #fff",
                cursor: "pointer",
                fontFamily: "inherit",
                letterSpacing: 1,
                fontSize: 11,
                touchAction: "manipulation",
              }}
            >
              LANDSCAPE
              <div style={{ fontSize: 9, marginTop: 6, opacity: 0.7 }}>853×480</div>
            </button>
            <button
              type="button"
              onClick={() => setPickOrientation("portrait")}
              style={{
                flex: 1,
                height: 88,
                minHeight: 88,
                background: pickOrientation === "portrait" ? "#fff" : "#000",
                color: pickOrientation === "portrait" ? "#000" : "#ccc",
                border:
                  pickOrientation === "portrait" ? "2px solid #ffff00" : "2px solid #fff",
                cursor: "pointer",
                fontFamily: "inherit",
                letterSpacing: 1,
                fontSize: 11,
                touchAction: "manipulation",
              }}
            >
              PORTRAIT
              <div style={{ fontSize: 9, marginTop: 6, opacity: 0.7 }}>480×853</div>
            </button>
          </div>
          <div style={{ color: "#888", fontSize: 9, letterSpacing: 1, marginBottom: 10 }}>
            PLATE COLOR · default white
          </div>
          <div style={{ display: "flex", gap: 10, marginBottom: 16 }}>
            <button
              type="button"
              onClick={() => setPickBg("white")}
              style={{
                flex: 1,
                height: 64,
                minHeight: 64,
                background: "#fff",
                color: "#000",
                border:
                  pickBg === "white" ? "2px solid #ffff00" : "2px solid #555",
                cursor: "pointer",
                fontFamily: "inherit",
                letterSpacing: 2,
                touchAction: "manipulation",
              }}
            >
              WHITE
            </button>
            <button
              type="button"
              onClick={() => setPickBg("black")}
              style={{
                flex: 1,
                height: 64,
                minHeight: 64,
                background: "#000",
                color: "#fff",
                border:
                  pickBg === "black" ? "2px solid #ffff00" : "2px solid #555",
                cursor: "pointer",
                fontFamily: "inherit",
                letterSpacing: 2,
                touchAction: "manipulation",
              }}
            >
              BLACK
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

  /**
   * Draw workspace: canvas + optional Shot info dock.
   * Horizontal (wide) → panel on the RIGHT.
   * Vertical (narrow) → panel on the BOTTOM.
   * INFO toggles hide/show.
   */
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
        <div style={{ flex: 1, minHeight: 0, minWidth: 0, position: "relative" }}>
          <ShotCanvas
            key={`${editingShot.id}-${editingShot.plateW}x${editingShot.plateH}`}
            embedded
            initialDataUrl={editingShot.thumbnail}
            bg={editingShot.bg}
            width={editingShot.plateW}
            height={editingShot.plateH}
            title={editingShot.title}
            onSave={savePlate}
            onCancel={finishDrawSession}
            onOpenInSpriteEditor={(live) => openInSpriteEditor(editingShot.id, live)}
          />
          {/* Toggle — stays on the canvas edge so it works when panel is hidden */}
          <button
            type="button"
            onClick={() => setShotInfoOpen((v) => !v)}
            title={
              shotInfoOpen
                ? "Hide Shot info"
                : isNarrow
                  ? "Show Shot info (bottom)"
                  : "Show Shot info (right)"
            }
            style={{
              position: "absolute",
              bottom: 6,
              right: 44,
              zIndex: 60,
              height: 28,
              padding: "0 8px",
              border: shotInfoOpen ? "1px solid #fff" : "1px solid #555",
              background: shotInfoOpen ? "#fff" : "#000",
              color: shotInfoOpen ? "#000" : "#888",
              fontFamily: "inherit",
              fontSize: 8,
              letterSpacing: 1,
              cursor: "pointer",
            }}
          >
            INFO
          </button>
        </div>

        {shotInfoOpen && (
          <div
            style={{
              flexShrink: 0,
              display: "flex",
              flexDirection: "column",
              background: "#0a0a0a",
              minWidth: 0,
              minHeight: 0,
              ...(isNarrow
                ? {
                    // Vertical window → bottom dock
                    width: "100%",
                    height: "min(38vh, 280px)",
                    borderTop: "1px solid #333",
                  }
                : {
                    // Horizontal window → right dock
                    width: 300,
                    maxWidth: "40vw",
                    height: "100%",
                    borderLeft: "1px solid #333",
                  }),
            }}
          >
            <div
              style={{
                flexShrink: 0,
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "6px 10px",
                borderBottom: "1px solid #333",
                background: "#0c0c0c",
              }}
            >
              <span style={{ color: "#666", fontSize: 9, letterSpacing: 2 }}>
                Shot info
              </span>
              <button
                type="button"
                style={btn()}
                onClick={() => setShotInfoOpen(false)}
                title="Hide Shot info"
              >
                HIDE
              </button>
            </div>
            {shotInfoBody(editingShot)}
          </div>
        )}
      </div>
    ) : null;

  const xsheetWorkspace =
    editor.mode === "xsheet" && xsheetShot ? (
      <XSheetEditor
        shot={xsheetShot}
        onChange={(frames) => updateXSheetFrames(xsheetShot.id, frames)}
        onDurationChange={(durationFrames) =>
          updateShotField(xsheetShot.id, { durationFrames })
        }
        onClose={closeXSheet}
        isNarrow={isNarrow}
      />
    ) : null;

  const exportWorkspace =
    editor.mode === "export" ? (
      <ExportView
        sequence={sequence}
        selectedShotId={selectedShotId}
        onClose={closeExport}
      />
    ) : null;

  const modalOverlayStyle: React.CSSProperties = {
    position: "fixed",
    inset: 0,
    zIndex: 200,
    background: "rgba(0,0,0,0.85)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: 16,
  };
  const modalPanelStyle: React.CSSProperties = {
    width: 320,
    maxHeight: "80%",
    overflowY: "auto",
    border: "1px solid #333",
    background: "#0a0a0a",
    boxShadow: "3px 3px 0 #000",
  };
  const modalHeaderStyle: React.CSSProperties = {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "5px 8px",
    borderBottom: "1px solid #333",
    background: "#1a1a1a",
  };

  const sequencesWorkspace =
    editor.mode === "sequences" ? (
      <div onClick={() => setEditor({ mode: "closed" })} style={modalOverlayStyle}>
        <div onClick={(e) => e.stopPropagation()} style={modalPanelStyle}>
          <div style={modalHeaderStyle}>
            <span style={{ fontSize: 10, color: "#ddd", letterSpacing: 1 }}>SEQUENCES</span>
            <button onClick={() => setEditor({ mode: "closed" })} style={btn()}>
              ×
            </button>
          </div>
          <div style={{ padding: 8 }}>
            <button type="button" style={{ ...btn(true), width: "100%", marginBottom: 8 }} onClick={createNewSequenceOnServer}>
              + NEW SEQUENCE
            </button>
            {loadingSequences ? (
              <div style={{ fontSize: 10, color: "#666" }}>LOADING…</div>
            ) : sequencesList.length === 0 ? (
              <div style={{ fontSize: 10, color: "#666" }}>NO SAVED SEQUENCES YET.</div>
            ) : (
              sequencesList.map((s) => (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => loadSequence(s.id)}
                  style={{ ...btn(), width: "100%", textAlign: "left", marginBottom: 4 }}
                >
                  {s.name} · {s.fps}FPS
                  {s.project_name && <div style={{ fontSize: 8, color: "#888" }}>↳ {s.project_name}</div>}
                </button>
              ))
            )}

            <div style={{ height: 1, background: "#333", margin: "10px 0" }} />
            <div style={{ fontSize: 9, color: "#888", letterSpacing: 1, marginBottom: 4 }}>
              LINK CURRENT SEQUENCE TO PRODEV PROJECT
            </div>
            <select
              value={linkedProjectId ?? ""}
              onChange={(e) => setLinkedProjectId(e.target.value ? Number(e.target.value) : null)}
              style={{ ...fieldStyle, marginTop: 0 }}
            >
              <option value="">— NONE —</option>
              {prodevProjects.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>
    ) : null;

  const assetsWorkspace =
    editor.mode === "assets" ? (
      <div onClick={() => setEditor({ mode: "closed" })} style={modalOverlayStyle}>
        <div onClick={(e) => e.stopPropagation()} style={modalPanelStyle}>
          <div style={modalHeaderStyle}>
            <span style={{ fontSize: 10, color: "#ddd", letterSpacing: 1 }}>SHOT ASSETS</span>
            <button onClick={() => setEditor({ mode: "closed" })} style={btn()}>
              ×
            </button>
          </div>
          <div style={{ padding: 8 }}>
            {loadingAssets ? (
              <div style={{ fontSize: 10, color: "#666" }}>LOADING…</div>
            ) : (
              <>
                <div style={{ fontSize: 9, color: "#888", letterSpacing: 1, marginBottom: 4 }}>ATTACHED</div>
                {attachedAssets.length === 0 ? (
                  <div style={{ fontSize: 9, color: "#666", marginBottom: 8 }}>NONE YET.</div>
                ) : (
                  attachedAssets.map((a) => (
                    <div key={a.id} style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 4 }}>
                      <span style={{ fontSize: 9, color: "#ccc", flex: 1 }}>
                        [{a.kind.toUpperCase()}] {a.title}
                      </span>
                      {a.kind === "kooldraw_project" && a.kooldraw_project_id != null && (
                        <button
                          type="button"
                          style={btn()}
                          onClick={() => onOpenKoolDrawProject?.(a.kooldraw_project_id!)}
                        >
                          EDIT
                        </button>
                      )}
                      {a.kind === "datamoshpit_render" && a.datamoshpit_render_id != null && (
                        <a
                          href={`/render/${a.datamoshpit_render_id}`}
                          target="_blank"
                          rel="noreferrer"
                          style={{ ...btn(), display: "inline-block", textDecoration: "none", textAlign: "center" }}
                        >
                          PLAY
                        </a>
                      )}
                      <button
                        type="button"
                        style={btn()}
                        onClick={() => editor.mode === "assets" && detachAsset(editor.shotId, a.id)}
                      >
                        REMOVE
                      </button>
                    </div>
                  ))
                )}

                <div style={{ height: 1, background: "#333", margin: "10px 0" }} />
                <div style={{ fontSize: 9, color: "#888", letterSpacing: 1, marginBottom: 4 }}>LIBRARY</div>
                {libraryAssets.length === 0 ? (
                  <div style={{ fontSize: 9, color: "#666" }}>
                    NOTHING IN YOUR LIBRARY YET — SAVE A KOOLDRAW PROJECT OR DATAMOSHPIT RENDER TO SEE IT HERE.
                  </div>
                ) : (
                  libraryAssets
                    .filter((a) => !attachedAssets.some((x) => x.id === a.id))
                    .map((a) => (
                      <button
                        key={a.id}
                        type="button"
                        style={{ ...btn(), width: "100%", textAlign: "left", marginBottom: 4 }}
                        onClick={() => editor.mode === "assets" && attachAsset(editor.shotId, a.id)}
                      >
                        [{a.kind.toUpperCase()}] {a.title}
                      </button>
                    ))
                )}
              </>
            )}
          </div>
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
      {/* List-mode header only — hidden while drawing so the plate has one chrome bar */}
      {editor.mode === "closed" && (
        <div
          style={{
            flexShrink: 0,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 8,
            padding: "5px 10px",
            borderBottom: "1px solid #333",
            background: "#000",
            zIndex: 30,
            minHeight: 32,
          }}
        >
          <span style={{ color: "#ffff00", letterSpacing: 2, fontSize: 11 }}>☦ SHOTLIST</span>
          <span style={{ color: "#666", fontSize: 9, letterSpacing: 1, flex: 1, textAlign: "center" }}>
            {sequence.shots.length} SHOTS · {sequence.fps} FPS
          </span>
          <button type="button" style={btn()} onClick={openExport} title="Export / print (P)">
            EXPORT
          </button>
          <button
            type="button"
            style={btn(true)}
            onClick={beginAddShot}
            title="New shot (N)"
          >
            + SHOT
          </button>
        </div>
      )}

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
        {xsheetWorkspace}
        {exportWorkspace}
        {sequencesWorkspace}
        {assetsWorkspace}
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
          <span>N +SHOT · E DRAW · S KOOL · U HD/4K · X X-SHEET · P EXPORT</span>
        </div>
      )}
    </div>
  );
}
