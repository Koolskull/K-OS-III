"use client";

/*
 *                    ☦
 *      INSTRUMENT TIMELINE EDITOR
 *
 *  A small in-OS modal for editing an instrument's per-visual keyframe
 *  sequence (Instrument.visual.customKeyframes).
 *
 *  Not a full cutscene editor — that's a separate K-OS app. This is the
 *  "EDIT TIMELINE" door from F4 that lets the user add/remove/edit
 *  individual keyframes against the visual's frame length, with a live
 *  preview of the result on the right.
 *
 *  Pixel-correct chrome. No rounded corners. No anti-aliasing.
 */

import React, { useEffect, useMemo, useState } from "react";
import type { Instrument, VisualKeyframe } from "@/types/tracker";
import { VISUAL_FRAMES_MIN, VISUAL_FRAMES_MAX } from "@/types/tracker";
import type { TransformKeyframe, KeyframeMode } from "./lib/types";
import { manifestFromInstrumentVisual, defaultCustomKeyframes } from "./instrument-visual";
import { SceneVMPlayer } from "./SceneVMPlayer";

const KEYFRAME_MODES: KeyframeMode[] = [
  "linear", "bezier", "hold", "bounce-in", "bounce-out", "bounce-both",
];

export interface InstrumentTimelineEditorProps {
  instrument: Instrument;
  onSave: (keyframes: VisualKeyframe[]) => void;
  onCancel: () => void;
}

export function InstrumentTimelineEditor({
  instrument,
  onSave,
  onCancel,
}: InstrumentTimelineEditorProps) {
  // Seed editor state with the instrument's existing custom keyframes, or a
  // fresh starter set if it doesn't have any yet.
  const initial: VisualKeyframe[] = useMemo(() => {
    const existing = instrument.visual?.customKeyframes;
    if (existing && existing.length > 0) return existing.map((k) => ({ ...k }));
    if (!instrument.visual) return [];
    return defaultCustomKeyframes(instrument.visual);
  }, [instrument]);

  const [keyframes, setKeyframes] = useState<VisualKeyframe[]>(initial);
  const totalFrames = instrument.visual?.totalFrames ?? 24;

  // Live preview state
  const [previewFrame, setPreviewFrame] = useState(1);
  const [previewPlaying, setPreviewPlaying] = useState(false);

  // Build a manifest using the editor's draft keyframes (not committed yet)
  const draftManifest = useMemo(() => {
    if (!instrument.visual) {
      // Should never happen — the F4 TLINE row only opens this for instruments
      // that already have a visual record. Render an idle empty stage.
      return {
        id: "no-visual", name: "NO VISUAL", version: 1,
        duration: 1, totalFrames: 24, aspectRatio: "4:3",
        stageBg: { mode: "color" as const, color: "#000000" },
        assets: [], layers: [],
      };
    }
    return manifestFromInstrumentVisual(
      { ...instrument.visual, customKeyframes: keyframes },
      instrument.name,
      instrument.id,
    );
  }, [instrument, keyframes]);

  // Preview playback rAF loop
  useEffect(() => {
    if (!previewPlaying) return;
    let raf = 0;
    let last = performance.now();
    const total = draftManifest.totalFrames ?? totalFrames;
    const tick = () => {
      const now = performance.now();
      const advance = ((now - last) / 1000) * 24; // TIMELINE_FPS = 24
      last = now;
      setPreviewFrame((f) => {
        const next = f + advance;
        if (next >= total) {
          setPreviewPlaying(false);
          return total;
        }
        return next;
      });
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [previewPlaying, draftManifest.totalFrames, totalFrames]);

  function updateKeyframe(idx: number, patch: Partial<VisualKeyframe>) {
    setKeyframes((kfs) => kfs.map((k, i) => (i === idx ? { ...k, ...patch } : k)));
  }
  function deleteKeyframe(idx: number) {
    setKeyframes((kfs) => kfs.filter((_, i) => i !== idx));
  }
  function addKeyframe() {
    // Insert at the next free frame number, halfway between the last KF and totalFrames
    const lastKf = keyframes[keyframes.length - 1];
    const nextFrame = lastKf
      ? Math.min(totalFrames, lastKf.frame + Math.max(1, Math.floor((totalFrames - lastKf.frame) / 2)))
      : 1;
    const seed: VisualKeyframe = lastKf
      ? { ...lastKf, frame: nextFrame, mode: "linear" }
      : {
          frame: nextFrame, mode: "linear",
          x: 0.5, y: 0.5, scaleX: 1, scaleY: 1, rotation: 0, opacity: 1,
        };
    setKeyframes((kfs) => [...kfs, seed].sort((a, b) => a.frame - b.frame));
  }
  function resetToDefault() {
    if (!instrument.visual) return;
    setKeyframes(defaultCustomKeyframes(instrument.visual));
  }

  // Inline-edit number cell. Value clamped to [min, max]. NaN ignored.
  function NumCell({
    value, onChange, min, max, step = 1, width = 56,
  }: {
    value: number;
    onChange: (v: number) => void;
    min: number;
    max: number;
    step?: number;
    width?: number;
  }) {
    return (
      <input
        type="number"
        value={value}
        min={min}
        max={max}
        step={step}
        onChange={(e) => {
          const n = parseFloat(e.target.value);
          if (Number.isNaN(n)) return;
          onChange(Math.max(min, Math.min(max, n)));
        }}
        style={{
          width,
          background: "#000",
          color: "#fff",
          border: "1px solid #555",
          fontFamily: "monospace",
          fontSize: 11,
          padding: "1px 3px",
          imageRendering: "pixelated",
        }}
      />
    );
  }

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 10001,
        backgroundColor: "rgba(0,0,0,0.85)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontFamily: "monospace",
        imageRendering: "pixelated",
      }}
    >
      <div
        style={{
          backgroundColor: "#000",
          color: "#fff",
          border: "2px solid #fff",
          boxShadow: "6px 6px 0 #000",
          width: "min(900px, 95vw)",
          maxHeight: "90vh",
          display: "flex",
          flexDirection: "column",
        }}
      >
        {/* Header */}
        <div
          style={{
            backgroundColor: "#fff",
            color: "#000",
            padding: "4px 8px",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            letterSpacing: 1,
            borderBottom: "2px solid #000",
            fontSize: 11,
          }}
        >
          <span>
            INSTRUMENT TIMELINE — INST {instrument.id.toString(16).toUpperCase().padStart(2, "0")} {instrument.name} · {totalFrames}f
          </span>
          <div style={{ display: "flex", gap: 4 }}>
            <button
              onClick={() => setPreviewFrame(1)}
              style={btnSecondary}
            >
              ⏮
            </button>
            <button
              onClick={() => setPreviewPlaying((p) => !p)}
              style={btnSecondary}
            >
              {previewPlaying ? "⏸" : "▶"}
            </button>
            <button onClick={resetToDefault} style={btnSecondary}>RESET</button>
            <button onClick={onCancel} style={btnSecondary}>CANCEL</button>
            <button onClick={() => onSave(keyframes)} style={btnPrimary}>SAVE</button>
          </div>
        </div>

        {/* Body */}
        <div style={{ display: "flex", overflow: "hidden", flex: 1 }}>
          {/* Left: keyframe table */}
          <div style={{ flex: 1, overflow: "auto", borderRight: "2px solid #fff" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 11 }}>
              <thead>
                <tr style={{ backgroundColor: "#222", color: "#fff" }}>
                  {[
                    "#", "FRAME", "MODE",
                    "X", "Y", "SX", "SY", "ROT", "OPA",
                    "BRT", "BLR", "HUE", "SAT",
                    "",
                  ].map((h) => (
                    <th key={h} style={{
                      padding: "3px 4px",
                      borderBottom: "1px solid #555",
                      textAlign: "left",
                      letterSpacing: 1,
                    }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {keyframes.length === 0 ? (
                  <tr><td colSpan={14} style={{ padding: 12, color: "#888" }}>
                    No keyframes. Click ADD KEYFRAME to start.
                  </td></tr>
                ) : keyframes.map((kf, i) => (
                  <tr key={i} style={{ borderBottom: "1px solid #222" }}>
                    <td style={cellStyle}>{i + 1}</td>
                    <td style={cellStyle}>
                      <NumCell
                        value={kf.frame}
                        onChange={(v) => updateKeyframe(i, { frame: Math.round(v) })}
                        min={1} max={totalFrames}
                        width={48}
                      />
                    </td>
                    <td style={cellStyle}>
                      <select
                        value={kf.mode}
                        onChange={(e) => updateKeyframe(i, { mode: e.target.value as KeyframeMode })}
                        style={selectStyle}
                      >
                        {KEYFRAME_MODES.map((m) => <option key={m} value={m}>{m}</option>)}
                      </select>
                    </td>
                    <td style={cellStyle}><NumCell value={kf.x} onChange={(v) => updateKeyframe(i, { x: v })} min={-2} max={3} step={0.05} /></td>
                    <td style={cellStyle}><NumCell value={kf.y} onChange={(v) => updateKeyframe(i, { y: v })} min={-2} max={3} step={0.05} /></td>
                    <td style={cellStyle}><NumCell value={kf.scaleX} onChange={(v) => updateKeyframe(i, { scaleX: v })} min={0} max={10} step={0.1} /></td>
                    <td style={cellStyle}><NumCell value={kf.scaleY} onChange={(v) => updateKeyframe(i, { scaleY: v })} min={0} max={10} step={0.1} /></td>
                    <td style={cellStyle}><NumCell value={kf.rotation} onChange={(v) => updateKeyframe(i, { rotation: v })} min={-1080} max={1080} step={5} /></td>
                    <td style={cellStyle}><NumCell value={kf.opacity} onChange={(v) => updateKeyframe(i, { opacity: v })} min={0} max={1} step={0.05} /></td>
                    <td style={cellStyle}><NumCell value={kf.brightness ?? 1} onChange={(v) => updateKeyframe(i, { brightness: v })} min={0} max={5} step={0.1} /></td>
                    <td style={cellStyle}><NumCell value={kf.blur ?? 0} onChange={(v) => updateKeyframe(i, { blur: v })} min={0} max={20} step={0.5} /></td>
                    <td style={cellStyle}><NumCell value={kf.hueRotate ?? 0} onChange={(v) => updateKeyframe(i, { hueRotate: v })} min={-360} max={360} step={5} /></td>
                    <td style={cellStyle}><NumCell value={kf.saturate ?? 1} onChange={(v) => updateKeyframe(i, { saturate: v })} min={0} max={5} step={0.1} /></td>
                    <td style={cellStyle}>
                      <button onClick={() => deleteKeyframe(i)} style={btnDanger}>X</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div style={{ padding: 8, borderTop: "1px solid #222" }}>
              <button onClick={addKeyframe} style={btnPrimary}>+ ADD KEYFRAME</button>
            </div>
          </div>

          {/* Right: live preview */}
          <div style={{ width: 320, padding: 8, display: "flex", flexDirection: "column", gap: 6 }}>
            <div style={{ fontSize: 10, color: "#aaa", letterSpacing: 1 }}>PREVIEW</div>
            <div style={{ border: "1px solid #444", width: 304, height: 228, position: "relative" }}>
              <SceneVMPlayer
                manifest={draftManifest}
                frame={previewFrame}
                width={304}
                height={228}
                debug
              />
            </div>
            <div style={{ fontSize: 10, color: "#888", display: "flex", justifyContent: "space-between" }}>
              <span>FRAME</span>
              <span>{Math.floor(previewFrame).toString().padStart(3, "0")} / {totalFrames}</span>
            </div>
            <input
              type="range"
              min={1}
              max={totalFrames}
              value={Math.floor(previewFrame)}
              onChange={(e) => {
                setPreviewPlaying(false);
                setPreviewFrame(parseInt(e.target.value, 10));
              }}
              style={{ width: "100%" }}
            />
            <div style={{ fontSize: 9, color: "#666", lineHeight: 1.4 }}>
              X/Y are normalized 0–1 of viewport.<br />
              Scale 1 = native size. Rotation in degrees.<br />
              Mode controls easing into the next keyframe.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

const cellStyle: React.CSSProperties = {
  padding: "2px 4px",
  borderRight: "1px solid #222",
  whiteSpace: "nowrap",
};

const btnPrimary: React.CSSProperties = {
  background: "#ffff00",
  color: "#000",
  border: "1px solid #000",
  fontFamily: "monospace",
  fontSize: 11,
  padding: "2px 8px",
  cursor: "pointer",
  imageRendering: "pixelated",
  letterSpacing: 1,
};
const btnSecondary: React.CSSProperties = {
  background: "#000",
  color: "#fff",
  border: "1px solid #fff",
  fontFamily: "monospace",
  fontSize: 11,
  padding: "2px 8px",
  cursor: "pointer",
  imageRendering: "pixelated",
  letterSpacing: 1,
};
const btnDanger: React.CSSProperties = {
  background: "#ff3344",
  color: "#000",
  border: "1px solid #000",
  fontFamily: "monospace",
  fontSize: 10,
  padding: "1px 6px",
  cursor: "pointer",
  imageRendering: "pixelated",
};
const selectStyle: React.CSSProperties = {
  background: "#000",
  color: "#fff",
  border: "1px solid #555",
  fontFamily: "monospace",
  fontSize: 10,
  padding: "1px 2px",
  imageRendering: "pixelated",
};
