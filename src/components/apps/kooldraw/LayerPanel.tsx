/*
 * KOOLDRAW — layer panel
 * Drag-to-reorder stacking order, delete, rename, opacity (PixelKnob).
 * Drag uses native Pointer Events + setPointerCapture — same house style as
 * PixelKnob/PixelColorPicker, not HTML5 draggable (unused elsewhere in K-OS).
 */

"use client";

import React, { useCallback, useState } from "react";
import type { SpriteLayer } from "@/types/sprite";
import { PixelKnob } from "@/components/ui/PixelKnob";
import { usePointerReorder } from "./usePointerReorder";

interface LayerPanelProps {
  layers: SpriteLayer[];
  activeLayerIndex: number;
  onSelect: (index: number) => void;
  onToggleVisibility: (index: number) => void;
  onAdd: () => void;
  onDelete: (index: number) => void;
  onRename: (index: number, name: string) => void;
  onOpacityChange: (index: number, opacity: number) => void;
  onReorder: (from: number, to: number) => void;
}

const ROW_H = 34;

const rowBtn: React.CSSProperties = {
  border: "none",
  background: "transparent",
  fontFamily: "var(--dm-font-primary)",
  cursor: "pointer",
  padding: 0,
};

export function LayerPanel({
  layers,
  activeLayerIndex,
  onSelect,
  onToggleVisibility,
  onAdd,
  onDelete,
  onRename,
  onOpacityChange,
  onReorder,
}: LayerPanelProps) {
  const [renamingIndex, setRenamingIndex] = useState<number | null>(null);
  const [renameValue, setRenameValue] = useState("");

  const beginRename = useCallback((index: number, name: string) => {
    setRenamingIndex(index);
    setRenameValue(name);
  }, []);

  const commitRename = useCallback(() => {
    if (renamingIndex != null) {
      const trimmed = renameValue.trim();
      if (trimmed) onRename(renamingIndex, trimmed);
    }
    setRenamingIndex(null);
  }, [renamingIndex, renameValue, onRename]);

  const {
    dragOverIndex,
    isDragging,
    onPointerDown: onHandlePointerDown,
    onPointerMove: onHandlePointerMove,
    onPointerUp: onHandlePointerUp,
  } = usePointerReorder({ count: layers.length, cellSize: ROW_H, axis: "y", onReorder });

  const onRowKeyDown = useCallback(
    (e: React.KeyboardEvent, index: number) => {
      if (e.altKey && (e.key === "ArrowUp" || e.key === "ArrowDown")) {
        e.preventDefault();
        const target = index + (e.key === "ArrowUp" ? -1 : 1);
        if (target >= 0 && target < layers.length) onReorder(index, target);
        return;
      }
      if (e.key === "ArrowUp" || e.key === "ArrowDown") {
        e.preventDefault();
        const target = index + (e.key === "ArrowUp" ? -1 : 1);
        if (target >= 0 && target < layers.length) onSelect(target);
        return;
      }
      if (e.key === "Enter") {
        e.preventDefault();
        beginRename(index, layers[index]!.name);
        return;
      }
      if (e.key === "Delete" || e.key === "Backspace") {
        e.preventDefault();
        onDelete(index);
      }
    },
    [layers, onReorder, onSelect, beginRename, onDelete],
  );

  return (
    <div
      role="list"
      aria-label="Layers"
      className="flex-1 overflow-y-auto"
      style={{ padding: 4, minHeight: 0 }}
    >
      <div className="flex items-center justify-between mb-1">
        <span style={{ fontSize: 7, color: "#888", letterSpacing: 1 }}>LAYERS</span>
        <button
          type="button"
          onClick={onAdd}
          aria-label="Add layer"
          title="Add layer"
          style={{
            border: "1px solid #555",
            background: "#000",
            color: "#888",
            fontFamily: "var(--dm-font-primary)",
            fontSize: 7,
            padding: "1px 4px",
            cursor: "pointer",
          }}
        >
          +
        </button>
      </div>

      {layers.map((layer, i) => {
        const isActive = i === activeLayerIndex;
        const isDragOver = dragOverIndex === i && isDragging;
        return (
          <div
            key={layer.id}
            role="listitem"
            tabIndex={0}
            aria-label={`Layer ${i + 1}, ${layer.name}, ${layer.visible ? "visible" : "hidden"}${isActive ? ", active" : ""}`}
            aria-current={isActive}
            onClick={() => onSelect(i)}
            onKeyDown={(e) => onRowKeyDown(e, i)}
            style={{
              minHeight: ROW_H,
              padding: "2px 4px",
              backgroundColor: isDragOver ? "#222200" : isActive ? "#1a1a1a" : "transparent",
              outline: isDragOver ? "1px solid #00ff00" : "none",
              borderLeft: isActive ? "2px solid #fff" : "2px solid transparent",
              display: "flex",
              alignItems: "center",
              gap: 4,
              cursor: "pointer",
              marginBottom: 1,
            }}
          >
            {/* Drag handle */}
            <span
              role="button"
              aria-label={`Reorder layer ${i + 1} (drag, or focus the row and use Alt+Up/Alt+Down)`}
              title="Drag to reorder"
              onPointerDown={(e) => {
                e.stopPropagation();
                onHandlePointerDown(e, i);
              }}
              onPointerMove={onHandlePointerMove}
              onPointerUp={onHandlePointerUp}
              onPointerCancel={onHandlePointerUp}
              style={{
                width: 10,
                flexShrink: 0,
                color: "#444",
                fontSize: 8,
                cursor: "grab",
                touchAction: "none",
                userSelect: "none",
              }}
            >
              ⠿
            </span>

            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onToggleVisibility(i);
              }}
              aria-label={layer.visible ? "Hide layer" : "Show layer"}
              title={layer.visible ? "Hide" : "Show"}
              style={{
                ...rowBtn,
                color: layer.visible ? "#888" : "#333",
                fontSize: 7,
                flexShrink: 0,
                width: 12,
              }}
            >
              {layer.visible ? "V" : "-"}
            </button>

            {renamingIndex === i ? (
              <input
                autoFocus
                value={renameValue}
                onChange={(e) => setRenameValue(e.target.value)}
                onBlur={commitRename}
                onKeyDown={(e) => {
                  e.stopPropagation();
                  if (e.key === "Enter") commitRename();
                  if (e.key === "Escape") setRenamingIndex(null);
                }}
                onClick={(e) => e.stopPropagation()}
                style={{
                  flex: 1,
                  minWidth: 0,
                  background: "#000",
                  color: "#fff",
                  border: "1px solid #555",
                  fontFamily: "inherit",
                  fontSize: 7,
                  padding: "1px 3px",
                }}
              />
            ) : (
              <span
                onDoubleClick={(e) => {
                  e.stopPropagation();
                  beginRename(i, layer.name);
                }}
                title="Double-click to rename"
                style={{
                  flex: 1,
                  minWidth: 0,
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                  fontSize: 7,
                  color: isActive ? "#fff" : "#555",
                }}
              >
                {layer.name}
              </span>
            )}

            <PixelKnob
              label="OP"
              value={layer.opacity}
              min={0}
              max={1}
              step={0.01}
              displayValue={`${Math.round(layer.opacity * 100)}`}
              onChange={(v) => onOpacityChange(i, v)}
              title="Layer opacity"
              size={20}
              layout="horizontal"
            />

            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onDelete(i);
              }}
              disabled={layers.length <= 1}
              aria-label="Delete layer"
              title="Delete layer"
              style={{
                ...rowBtn,
                color: layers.length <= 1 ? "#333" : "#a55",
                fontSize: 8,
                flexShrink: 0,
                cursor: layers.length <= 1 ? "default" : "pointer",
              }}
            >
              ✕
            </button>
          </div>
        );
      })}
    </div>
  );
}
