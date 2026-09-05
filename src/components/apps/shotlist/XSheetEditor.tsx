/*
 * SHOTLIST — X-Sheet editor
 * Per-shot exposure sheet: rows are exposure GROUPS (action held for N frames),
 * matching how a paper exposure sheet is actually filled in. Frame numbers
 * shown per row are derived, not stored — see xsheetFrameRanges().
 */

"use client";

import React, { useCallback } from "react";
import {
  btn,
  createEmptyXFrame,
  fieldStyle,
  uid,
  xsheetFrameRanges,
  xsheetTotalFrames,
  type Shot,
  type XFrame,
} from "./shotlistShared";

interface XSheetEditorProps {
  shot: Shot;
  onChange: (frames: XFrame[]) => void;
  onDurationChange: (durationFrames: number) => void;
  onClose: () => void;
  isNarrow: boolean;
}

const cellInput: React.CSSProperties = {
  ...fieldStyle,
  marginTop: 0,
  width: "100%",
  minWidth: 44,
  background: "transparent",
  border: "1px solid #222",
};

const th: React.CSSProperties = {
  textAlign: "left",
  padding: "6px 6px",
  fontSize: 9,
  letterSpacing: 1,
  color: "#888",
  borderBottom: "1px solid #333",
  whiteSpace: "nowrap",
  position: "sticky",
  top: 0,
  background: "#0a0a0a",
};

const td: React.CSSProperties = {
  padding: "3px 6px",
  borderBottom: "1px solid #1a1a1a",
  verticalAlign: "top",
};

export function XSheetEditor({
  shot,
  onChange,
  onDurationChange,
  onClose,
  isNarrow,
}: XSheetEditorProps) {
  const ranges = xsheetFrameRanges(shot.xsheet);
  const total = xsheetTotalFrames(shot.xsheet);
  const diff = shot.durationFrames - total;

  const patchRow = useCallback(
    (id: number, patch: Partial<XFrame>) => {
      onChange(shot.xsheet.map((row) => (row.id === id ? { ...row, ...patch } : row)));
    },
    [onChange, shot.xsheet],
  );

  const addRow = useCallback(() => {
    onChange([...shot.xsheet, createEmptyXFrame()]);
  }, [onChange, shot.xsheet]);

  const duplicateRow = useCallback(
    (index: number) => {
      const copy = { ...shot.xsheet[index]!, id: uid() };
      const next = [...shot.xsheet];
      next.splice(index + 1, 0, copy);
      onChange(next);
    },
    [onChange, shot.xsheet],
  );

  const deleteRow = useCallback(
    (id: number) => {
      const next = shot.xsheet.filter((row) => row.id !== id);
      onChange(next.length > 0 ? next : [createEmptyXFrame()]);
    },
    [onChange, shot.xsheet],
  );

  const moveRow = useCallback(
    (index: number, dir: -1 | 1) => {
      const target = index + dir;
      if (target < 0 || target >= shot.xsheet.length) return;
      const next = [...shot.xsheet];
      const [row] = next.splice(index, 1);
      next.splice(target, 0, row!);
      onChange(next);
    },
    [onChange, shot.xsheet],
  );

  const matchDuration = useCallback(() => {
    if (diff === 0) return;
    if (shot.xsheet.length === 0) {
      onChange([{ ...createEmptyXFrame(), exposure: Math.max(1, shot.durationFrames) }]);
      return;
    }
    const lastIdx = shot.xsheet.length - 1;
    const last = shot.xsheet[lastIdx]!;
    const nextExposure = Math.max(1, (last.exposure || 1) + diff);
    const next = [...shot.xsheet];
    next[lastIdx] = { ...last, exposure: nextExposure };
    onChange(next);
  }, [diff, onChange, shot.xsheet, shot.durationFrames]);

  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        zIndex: 50,
        background: "#000",
        display: "flex",
        flexDirection: "column",
        minHeight: 0,
      }}
    >
      <div
        style={{
          flexShrink: 0,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 8,
          padding: "6px 10px",
          borderBottom: "1px solid #333",
          background: "#000",
          flexWrap: "wrap",
        }}
      >
        <span style={{ color: "#ffff00", letterSpacing: 2, fontSize: 11 }}>
          ☰ X-SHEET · {shot.title}
        </span>
        <span
          style={{
            fontSize: 9,
            letterSpacing: 1,
            color: diff === 0 ? "#4a4" : "#ffcc00",
          }}
        >
          {total} / {shot.durationFrames} FRAMES
          {diff !== 0 ? ` (${diff > 0 ? "+" : ""}${diff})` : " ✓"}
        </span>
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
          <button type="button" style={btn()} onClick={addRow}>
            + ROW
          </button>
          <button type="button" style={btn()} onClick={matchDuration} disabled={diff === 0}>
            MATCH DURATION
          </button>
          <label style={{ fontSize: 9, color: "#666", display: "flex", alignItems: "center", gap: 4 }}>
            DUR
            <input
              type="number"
              min={1}
              max={24000}
              value={shot.durationFrames}
              onChange={(e) =>
                onDurationChange(Math.max(1, Number(e.target.value) || 1))
              }
              style={{ ...fieldStyle, marginTop: 0, width: 70 }}
            />
          </label>
          <button type="button" style={btn(true)} onClick={onClose}>
            DONE
          </button>
        </div>
      </div>

      <div style={{ flex: 1, overflow: "auto", minHeight: 0 }}>
        <table
          style={{
            borderCollapse: "collapse",
            width: "100%",
            minWidth: isNarrow ? 900 : undefined,
            fontFamily: "inherit",
            fontSize: 11,
            color: "#eee",
          }}
        >
          <thead>
            <tr>
              <th style={{ ...th, width: 64 }}>FRAME</th>
              <th style={{ ...th, width: 56 }}>HOLD</th>
              <th style={{ ...th, width: 110 }}>CAMERA</th>
              <th style={{ ...th, minWidth: 160 }}>ACTION</th>
              <th style={{ ...th, minWidth: 160 }}>DIALOGUE</th>
              <th style={{ ...th, minWidth: 140 }}>AUDIO CUE</th>
              <th style={{ ...th, minWidth: 160 }}>NOTES</th>
              <th style={{ ...th, width: 110 }}>ASSET REF</th>
              <th style={{ ...th, width: 96 }} />
            </tr>
          </thead>
          <tbody>
            {shot.xsheet.map((row, index) => {
              const range = ranges[index]!;
              const label =
                range.start === range.end ? `${range.start}` : `${range.start}–${range.end}`;
              return (
                <tr key={row.id}>
                  <td style={{ ...td, color: "#ffff00", fontSize: 10, letterSpacing: 1 }}>
                    {label}
                  </td>
                  <td style={td}>
                    <input
                      type="number"
                      min={1}
                      max={9999}
                      value={row.exposure}
                      onChange={(e) =>
                        patchRow(row.id, {
                          exposure: Math.max(1, Number(e.target.value) || 1),
                        })
                      }
                      style={cellInput}
                    />
                  </td>
                  <td style={td}>
                    <input
                      value={row.camera}
                      onChange={(e) => patchRow(row.id, { camera: e.target.value })}
                      style={cellInput}
                      placeholder="pan, zoom…"
                    />
                  </td>
                  <td style={td}>
                    <input
                      value={row.action}
                      onChange={(e) => patchRow(row.id, { action: e.target.value })}
                      style={cellInput}
                      placeholder="what happens"
                    />
                  </td>
                  <td style={td}>
                    <input
                      value={row.dialogue}
                      onChange={(e) => patchRow(row.id, { dialogue: e.target.value })}
                      style={cellInput}
                    />
                  </td>
                  <td style={td}>
                    <input
                      value={row.audioCue}
                      onChange={(e) => patchRow(row.id, { audioCue: e.target.value })}
                      style={cellInput}
                      placeholder="beat / SFX"
                    />
                  </td>
                  <td style={td}>
                    <input
                      value={row.notes}
                      onChange={(e) => patchRow(row.id, { notes: e.target.value })}
                      style={cellInput}
                    />
                  </td>
                  <td style={td}>
                    <input
                      value={row.assetRef ?? ""}
                      onChange={(e) =>
                        patchRow(row.id, { assetRef: e.target.value || null })
                      }
                      style={cellInput}
                    />
                  </td>
                  <td style={{ ...td, whiteSpace: "nowrap" }}>
                    <button
                      type="button"
                      style={{ ...btn(), padding: "3px 5px" }}
                      onClick={() => moveRow(index, -1)}
                      disabled={index === 0}
                      title="Move up"
                    >
                      ▲
                    </button>
                    <button
                      type="button"
                      style={{ ...btn(), padding: "3px 5px" }}
                      onClick={() => moveRow(index, 1)}
                      disabled={index === shot.xsheet.length - 1}
                      title="Move down"
                    >
                      ▼
                    </button>
                    <button
                      type="button"
                      style={{ ...btn(), padding: "3px 5px" }}
                      onClick={() => duplicateRow(index)}
                      title="Duplicate row"
                    >
                      ⧉
                    </button>
                    <button
                      type="button"
                      style={{ ...btn(), padding: "3px 5px" }}
                      onClick={() => deleteRow(row.id)}
                      title="Delete row"
                    >
                      ✕
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div
        style={{
          flexShrink: 0,
          padding: "4px 10px",
          borderTop: "1px solid #222",
          fontSize: 8,
          color: "#666",
          letterSpacing: 1,
        }}
      >
        HOLD = frames this row is exposed for · frame numbers run 1→N top-down, matching
        OpenToonz / Tahoma2D&apos;s Xsheet panel
      </div>
    </div>
  );
}
