/*
 * KOOLDRAW — animation timeline
 * One component, two orientations (mirrors OpenToonz's single Xsheet/Timeline
 * widget with a layout-direction flag, rather than two parallel components):
 *  - horizontal: a composited scrub strip across all layers (the classic
 *    frame-by-frame filmstrip).
 *  - vertical: a true per-layer exposure-sheet grid — rows are timeline
 *    positions, columns are layers — sized/grouped by an optional
 *    xsheetSnapshot from a Shotlist handoff so it lines up with that shot's
 *    X-Sheet.
 *
 * Frame cells show their hex id ("000"–"FFF", permanent per pool frame —
 * see src/types/sprite.ts). Drag reorders exposures (usePointerReorder,
 * same pointer-capture mechanic as LayerPanel); a REUSE popover points the
 * active slot at any existing pool frame without creating a new one.
 */

"use client";

import React, { useEffect, useRef, useState } from "react";
import type { SpriteLayer } from "@/types/sprite";
import { compositeFrame, frameToCanvas, getExposedFrame } from "@/lib/SpriteUtils";
import type { XSheetSnapshot } from "@/lib/creative";
import { usePointerReorder } from "./usePointerReorder";

export type TimelineOrientation = "horizontal" | "vertical";

export interface OnionMark {
  isPrev: boolean;
  isNext: boolean;
}

export interface TimelineProps {
  layers: SpriteLayer[];
  activeLayerIndex: number;
  activeFrameIndex: number;
  displayFrameIndex: number;
  spriteWidth: number;
  spriteHeight: number;
  playing: boolean;
  orientation: TimelineOrientation;
  /**
   * Bumped by the parent after any in-place pixel mutation (freehand stroke,
   * fill, shape commit) — frame content is mutated directly on the
   * SpriteFrame's Uint32Array, so `layers` keeps the same object references
   * and thumbnails won't otherwise know to redraw.
   */
  renderTick: number;
  /** Shot X-Sheet snapshot from a Shotlist handoff (fps/duration/row labels) — vertical mode mirrors it when present. */
  xsheetSnapshot?: XSheetSnapshot | null;
  onionMarks?: OnionMark[];
  onSelectFrame: (index: number) => void;
  onSelectLayer: (index: number) => void;
  onTogglePlayback: () => void;
  /** Shift+F */
  onInsertBlank: () => void;
  /** Shift+D */
  onDuplicate: () => void;
  onDelete: () => void;
  onReorder: (from: number, to: number) => void;
  onReuse: (hexId: string) => void;
}

const CELL = 36;
const ROW = 30;

function useThumb(getFrame: () => import("@/types/sprite").SpriteFrame | undefined, w: number, h: number, deps: unknown[]) {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    canvas.width = Math.max(1, w);
    canvas.height = Math.max(1, h);
    ctx.imageSmoothingEnabled = false;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    const frame = getFrame();
    if (frame) ctx.drawImage(frameToCanvas(frame, 1), 0, 0);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
  return ref;
}

const iconBtn: React.CSSProperties = {
  width: 32,
  height: 32,
  border: "1px solid #333",
  background: "#000",
  color: "#888",
  fontFamily: "var(--dm-font-primary)",
  fontSize: 8,
  cursor: "pointer",
  flexShrink: 0,
};

export function Timeline({
  layers,
  activeLayerIndex,
  activeFrameIndex,
  displayFrameIndex,
  spriteWidth,
  spriteHeight,
  playing,
  orientation,
  renderTick,
  xsheetSnapshot,
  onionMarks,
  onSelectFrame,
  onSelectLayer,
  onTogglePlayback,
  onInsertBlank,
  onDuplicate,
  onDelete,
  onReorder,
  onReuse,
}: TimelineProps) {
  const frameCount = layers[0]?.exposures.length ?? 0;
  const cellSize = orientation === "horizontal" ? CELL + 3 : ROW;
  const axis: "x" | "y" = orientation === "horizontal" ? "x" : "y";

  const { dragOverIndex, isDragging, onPointerDown, onPointerMove, onPointerUp } = usePointerReorder({
    count: frameCount,
    cellSize,
    axis,
    onReorder,
  });

  const activeLayer = layers[activeLayerIndex];
  const activePool = activeLayer?.frames ?? [];

  if (orientation === "vertical") {
    return (
      <div className="flex flex-col" style={{ minHeight: 0, height: "100%" }}>
        <div style={{ padding: 4, flexShrink: 0 }}>
          <TimelineToolbar
            playing={playing}
            frameCount={frameCount}
            activePool={activePool}
            spriteWidth={spriteWidth}
            spriteHeight={spriteHeight}
            renderTick={renderTick}
            onTogglePlayback={onTogglePlayback}
            onInsertBlank={onInsertBlank}
            onDuplicate={onDuplicate}
            onDelete={onDelete}
            onReuse={onReuse}
          />
        </div>
        <div
          role="grid"
          aria-label="Vertical exposure sheet"
          className="flex-1 overflow-y-auto"
          style={{ minHeight: 0 }}
        >
          {/* Column headers: one per layer */}
          <div style={{ display: "flex", position: "sticky", top: 0, background: "#0a0a0a", zIndex: 1, borderBottom: "1px solid #333" }}>
            <div style={{ width: 40, flexShrink: 0, fontSize: 6, color: "#555", padding: 2 }}>FRM</div>
            {layers.map((layer, li) => (
              <div
                key={layer.id}
                style={{
                  width: CELL,
                  flexShrink: 0,
                  fontSize: 6,
                  color: li === activeLayerIndex ? "#fff" : "#555",
                  padding: 2,
                  textAlign: "center",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}
                title={layer.name}
              >
                {layer.name}
              </div>
            ))}
            {xsheetSnapshot && (
              <div style={{ flex: 1, fontSize: 6, color: "#555", padding: 2 }}>SHOT NOTES</div>
            )}
          </div>

          {Array.from({ length: frameCount }, (_, position) => (
            <VerticalRow
              key={position}
              position={position}
              layers={layers}
              activeLayerIndex={activeLayerIndex}
              isActive={position === displayFrameIndex}
              isDragOver={isDragging && dragOverIndex === position}
              spriteWidth={spriteWidth}
              spriteHeight={spriteHeight}
              renderTick={renderTick}
              xsheetSnapshot={xsheetSnapshot}
              onion={onionMarks?.[position]}
              onSelect={(li) => {
                onSelectFrame(position);
                if (li != null) onSelectLayer(li);
              }}
              onPointerDown={(e) => onPointerDown(e, position)}
              onPointerMove={onPointerMove}
              onPointerUp={onPointerUp}
            />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center overflow-x-auto" style={{ minHeight: 48, padding: 4, gap: 3 }}>
      {Array.from({ length: frameCount }, (_, position) => (
        <HorizontalCell
          key={position}
          position={position}
          layers={layers}
          activeLayerIndex={activeLayerIndex}
          isActive={position === displayFrameIndex}
          isDragOver={isDragging && dragOverIndex === position}
          spriteWidth={spriteWidth}
          spriteHeight={spriteHeight}
          renderTick={renderTick}
          onion={onionMarks?.[position]}
          onSelect={() => onSelectFrame(position)}
          onPointerDown={(e) => onPointerDown(e, position)}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
        />
      ))}
    </div>
  );
}

export interface TimelineToolbarProps {
  playing: boolean;
  frameCount: number;
  /** Active layer's drawing pool, for the REUSE picker. */
  activePool: import("@/types/sprite").SpriteFrame[];
  spriteWidth: number;
  spriteHeight: number;
  renderTick: number;
  onTogglePlayback: () => void;
  onInsertBlank: () => void;
  onDuplicate: () => void;
  onDelete: () => void;
  onReuse: (hexId: string) => void;
}

/**
 * Play / +F / DUP / DEL / REUSE — shared by the vertical grid (rendered
 * inline above it) and the horizontal filmstrip (rendered externally, in
 * KoolDrawApp's timeline drag-handle bar, so it doesn't sit to the left of
 * frame 1 inside the scrolling strip itself).
 */
export function TimelineToolbar({
  playing,
  frameCount,
  activePool,
  spriteWidth,
  spriteHeight,
  renderTick,
  onTogglePlayback,
  onInsertBlank,
  onDuplicate,
  onDelete,
  onReuse,
}: TimelineToolbarProps) {
  const [reuseOpen, setReuseOpen] = useState(false);

  return (
    <div
      role="toolbar"
      aria-label="Timeline controls"
      style={{ display: "flex", alignItems: "center", gap: 4, flexShrink: 0 }}
    >
      <button
        type="button"
        onClick={onTogglePlayback}
        aria-label={playing ? "Pause" : "Play"}
        title={playing ? "Pause" : "Play"}
        style={{
          ...iconBtn,
          border: playing ? "1px solid #fff" : "1px solid #555",
          background: playing ? "#fff" : "#000",
          color: playing ? "#000" : "#888",
          fontSize: 12,
        }}
      >
        {playing ? "||" : ">"}
      </button>
      <button type="button" onClick={onInsertBlank} aria-label="New blank frame (Shift+F)" title="New blank frame — Shift+F" style={iconBtn}>
        +F
      </button>
      <button type="button" onClick={onDuplicate} aria-label="Duplicate frame (Shift+D)" title="Duplicate frame — Shift+D" style={iconBtn}>
        DUP
      </button>
      <button type="button" onClick={onDelete} disabled={frameCount <= 1} aria-label="Delete frame" title="Delete frame" style={iconBtn}>
        DEL
      </button>
      <div style={{ position: "relative" }}>
        <button
          type="button"
          onClick={() => setReuseOpen((v) => !v)}
          aria-label="Reuse an existing frame at this position"
          aria-expanded={reuseOpen}
          title="Point this slot at an existing drawing (no new copy)"
          style={{ ...iconBtn, width: 48, color: reuseOpen ? "#fff" : "#888", borderColor: reuseOpen ? "#fff" : "#333" }}
        >
          REUSE ▾
        </button>
        {reuseOpen && (
          <div
            role="listbox"
            aria-label="Pick a drawing to reuse"
            style={{
              position: "absolute",
              top: "100%",
              left: 0,
              zIndex: 50,
              background: "#111",
              border: "1px solid #555",
              padding: 4,
              display: "flex",
              flexWrap: "wrap",
              gap: 3,
              width: 160,
              maxHeight: 160,
              overflowY: "auto",
              boxShadow: "4px 4px 0 #000",
            }}
          >
            {activePool.map((f) => (
              <ReuseSwatch
                key={f.hexId}
                frame={f}
                w={spriteWidth}
                h={spriteHeight}
                renderTick={renderTick}
                onClick={() => {
                  onReuse(f.hexId);
                  setReuseOpen(false);
                }}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function ReuseSwatch({
  frame,
  w,
  h,
  renderTick,
  onClick,
}: {
  frame: import("@/types/sprite").SpriteFrame;
  w: number;
  h: number;
  renderTick: number;
  onClick: () => void;
}) {
  const ref = useThumb(() => frame, w, h, [frame, w, h, renderTick]);
  return (
    <button
      type="button"
      onClick={onClick}
      title={`Reuse ${frame.hexId}`}
      aria-label={`Reuse drawing ${frame.hexId}`}
      style={{
        width: 28,
        height: 28,
        padding: 0,
        border: "1px solid #333",
        background: "#0a0a0a",
        cursor: "pointer",
        position: "relative",
      }}
    >
      <canvas ref={ref} style={{ width: "100%", height: "100%", imageRendering: "pixelated", display: "block" }} />
      <span
        style={{
          position: "absolute",
          bottom: 0,
          left: 0,
          right: 0,
          fontSize: 5,
          color: "#ffff00",
          background: "rgba(0,0,0,0.7)",
          textAlign: "center",
        }}
      >
        {frame.hexId}
      </span>
    </button>
  );
}

interface CellCommonProps {
  position: number;
  layers: SpriteLayer[];
  activeLayerIndex: number;
  isActive: boolean;
  isDragOver: boolean;
  spriteWidth: number;
  spriteHeight: number;
  renderTick: number;
  onion?: OnionMark;
  onPointerDown: (e: React.PointerEvent) => void;
  onPointerMove: (e: React.PointerEvent) => void;
  onPointerUp: (e: React.PointerEvent) => void;
}

function HorizontalCell({
  position,
  layers,
  activeLayerIndex,
  isActive,
  isDragOver,
  spriteWidth,
  spriteHeight,
  renderTick,
  onion,
  onSelect,
  onPointerDown,
  onPointerMove,
  onPointerUp,
}: CellCommonProps & { onSelect: () => void }) {
  const ref = useThumb(
    () => compositeFrame(layers, position, spriteWidth, spriteHeight),
    spriteWidth,
    spriteHeight,
    [layers, position, spriteWidth, spriteHeight, renderTick],
  );
  const hexId = layers[activeLayerIndex]?.exposures[position] ?? "";

  let borderColor = isActive ? "#ffffff" : "#333333";
  if (!isActive && onion?.isPrev) borderColor = "#b850ff";
  if (!isActive && onion?.isNext) borderColor = "#3cdc78";

  return (
    <button
      type="button"
      onClick={onSelect}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerUp}
      aria-label={`Frame ${position + 1}, ${hexId}${isActive ? ", active" : ""}`}
      aria-current={isActive}
      style={{
        flexShrink: 0,
        cursor: "pointer",
        border: isActive ? "2px solid #ffffff" : `1px solid ${borderColor}`,
        outline: isDragOver ? "2px solid #ffff00" : "none",
        backgroundColor: "#0a0a0a",
        padding: 2,
        touchAction: "none",
      }}
    >
      <canvas ref={ref} style={{ width: CELL, height: CELL, imageRendering: "pixelated", display: "block" }} />
      <div
        style={{
          fontFamily: "var(--dm-font-primary)",
          fontSize: 6,
          color: isActive ? "#fff" : onion?.isPrev ? "#b850ff" : onion?.isNext ? "#3cdc78" : "#555",
          textAlign: "center",
          marginTop: 1,
        }}
      >
        {hexId}
      </div>
    </button>
  );
}

function VerticalRow({
  position,
  layers,
  activeLayerIndex,
  isActive,
  isDragOver,
  spriteWidth,
  spriteHeight,
  renderTick,
  xsheetSnapshot,
  onion,
  onSelect,
  onPointerDown,
  onPointerMove,
  onPointerUp,
}: CellCommonProps & {
  xsheetSnapshot?: XSheetSnapshot | null;
  onSelect: (layerIndex?: number) => void;
}) {
  const row = xsheetSnapshot?.rows.find((r) => position + 1 >= r.start && position + 1 <= r.end);
  const isRowStart = !row || row.start === position + 1;
  let rowBorder = "1px solid #1a1a1a";
  if (isActive) rowBorder = "1px solid #fff";
  else if (isRowStart && xsheetSnapshot) rowBorder = "1px solid #333";

  return (
    <div
      role="row"
      aria-label={`Frame ${position + 1}${isActive ? ", active" : ""}`}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerUp}
      style={{
        display: "flex",
        alignItems: "stretch",
        minHeight: ROW,
        borderTop: isRowStart ? rowBorder : "1px solid #111",
        background: isActive ? "#1a1a1a" : isDragOver ? "#222200" : "transparent",
        outline: isDragOver ? "1px solid #ffff00" : "none",
        touchAction: "none",
      }}
    >
      <button
        type="button"
        onClick={() => onSelect()}
        aria-label={`Select frame ${position + 1}`}
        style={{
          width: 40,
          flexShrink: 0,
          border: "none",
          background: "transparent",
          color: isActive ? "#ffff00" : "#666",
          fontSize: 8,
          fontFamily: "var(--dm-font-primary)",
          cursor: "pointer",
          textAlign: "left",
          padding: "0 4px",
        }}
      >
        {position + 1}
      </button>
      {layers.map((layer, li) => (
        <VerticalCell
          key={layer.id}
          layer={layer}
          layerIndex={li}
          isActiveLayer={li === activeLayerIndex}
          position={position}
          spriteWidth={spriteWidth}
          spriteHeight={spriteHeight}
          renderTick={renderTick}
          onClick={() => onSelect(li)}
        />
      ))}
      {xsheetSnapshot && (
        <div
          style={{
            flex: 1,
            fontSize: 7,
            color: "#666",
            padding: "2px 4px",
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
        >
          {isRowStart ? row?.label ?? "" : ""}
        </div>
      )}
    </div>
  );
}

function VerticalCell({
  layer,
  layerIndex,
  isActiveLayer,
  position,
  spriteWidth,
  spriteHeight,
  renderTick,
  onClick,
}: {
  layer: SpriteLayer;
  layerIndex: number;
  isActiveLayer: boolean;
  position: number;
  spriteWidth: number;
  spriteHeight: number;
  renderTick: number;
  onClick: () => void;
}) {
  const hexId = layer.exposures[position] ?? "";
  const isHold = position > 0 && layer.exposures[position - 1] === hexId;
  const ref = useThumb(
    () => getExposedFrame(layer, position),
    spriteWidth,
    spriteHeight,
    [layer, position, spriteWidth, spriteHeight, renderTick],
  );

  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={`Layer ${layerIndex + 1}, frame ${position + 1}, drawing ${hexId}${isActiveLayer ? ", active layer" : ""}`}
      title={hexId}
      style={{
        width: CELL,
        flexShrink: 0,
        display: "flex",
        alignItems: "center",
        gap: 2,
        border: "none",
        borderLeft: isActiveLayer ? "1px solid #333" : "1px solid transparent",
        background: "transparent",
        cursor: "pointer",
        padding: "0 2px",
      }}
    >
      {isHold ? (
        // Held frame: OpenToonz-style thin continuation mark instead of repeating the thumbnail/label.
        <div style={{ width: "100%", textAlign: "center", color: "#333" }}>┆</div>
      ) : (
        <>
          <canvas ref={ref} style={{ width: 14, height: 14, imageRendering: "pixelated", flexShrink: 0 }} />
          <span style={{ fontSize: 6, color: isActiveLayer ? "#ffff00" : "#666" }}>{hexId}</span>
        </>
      )}
    </button>
  );
}
