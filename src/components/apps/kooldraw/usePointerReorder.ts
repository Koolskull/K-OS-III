/*
 * KOOLDRAW — shared pointer-drag-reorder mechanic
 * Native Pointer Events + setPointerCapture (house style, matches
 * PixelKnob/PixelColorPicker) rather than HTML5 draggable. Used by both
 * LayerPanel (vertical list) and Timeline (horizontal or vertical track).
 */

"use client";

import { useCallback, useRef, useState } from "react";

interface UsePointerReorderOpts {
  count: number;
  /** Row/cell size along the drag axis, in CSS px — used to convert drag distance into an index delta. */
  cellSize: number;
  axis: "x" | "y";
  onReorder: (from: number, to: number) => void;
}

export function usePointerReorder({ count, cellSize, axis, onReorder }: UsePointerReorderOpts) {
  const dragRef = useRef<{ index: number; start: number } | null>(null);
  // Mirrors dragOverIndex synchronously so onPointerUp always reads the
  // latest value via ref rather than a closure over React state — state
  // updates from onPointerMove can still be unflushed when onPointerUp
  // fires (React batches renders; a fast drag can deliver pointerdown,
  // several pointermoves, and pointerup before a single re-render happens),
  // which would otherwise make onPointerUp see a stale (often null) value.
  const dragOverRef = useRef<number | null>(null);
  const [dragOverIndex, setDragOverIndexState] = useState<number | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  const setDragOverIndex = useCallback((v: number | null) => {
    dragOverRef.current = v;
    setDragOverIndexState(v);
  }, []);

  const onPointerDown = useCallback(
    (e: React.PointerEvent, index: number) => {
      e.preventDefault();
      (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
      dragRef.current = { index, start: axis === "y" ? e.clientY : e.clientX };
      setDragOverIndex(index);
      setIsDragging(true);
    },
    [axis, setDragOverIndex],
  );

  const onPointerMove = useCallback(
    (e: React.PointerEvent) => {
      const d = dragRef.current;
      if (!d) return;
      const pos = axis === "y" ? e.clientY : e.clientX;
      const delta = Math.round((pos - d.start) / Math.max(1, cellSize));
      const target = Math.min(count - 1, Math.max(0, d.index + delta));
      setDragOverIndex(target);
    },
    [axis, cellSize, count, setDragOverIndex],
  );

  const onPointerUp = useCallback(
    (e: React.PointerEvent) => {
      const d = dragRef.current;
      dragRef.current = null;
      try {
        (e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId);
      } catch {
        /* ignore */
      }
      const target = dragOverRef.current;
      if (d && target != null && target !== d.index) {
        onReorder(d.index, target);
      }
      setDragOverIndex(null);
      setIsDragging(false);
    },
    [onReorder, setDragOverIndex],
  );

  return { dragOverIndex, isDragging, onPointerDown, onPointerMove, onPointerUp };
}
