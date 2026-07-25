/*
 * Shared canvas viewport gestures for drawing apps.
 * - Two-finger tap → undo
 * - Pinch → zoom + rotate
 * - Space + drag → pan
 * - Shift + drag → rotate
 * - Alt + drag → rotate
 *
 * NOTE (macOS): Do NOT use Ctrl+click for rotate — macOS maps Ctrl+click to
 * a secondary/right-click. Use Shift or Alt only.
 */

"use client";

import { useCallback, useEffect, useRef, useState } from "react";

export interface ViewportState {
  /** CSS px pan */
  panX: number;
  panY: number;
  /** Multiplier (1 = 100%) */
  zoom: number;
  /** Degrees clockwise */
  rotation: number;
}

export interface UseCanvasViewportOptions {
  minZoom?: number;
  maxZoom?: number;
  /** Called on two-finger tap */
  onUndo?: () => void;
  enabled?: boolean;
}

interface ActivePointer {
  id: number;
  x: number;
  y: number;
}

function dist(a: ActivePointer, b: ActivePointer): number {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

function mid(a: ActivePointer, b: ActivePointer): { x: number; y: number } {
  return { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 };
}

function angle(a: ActivePointer, b: ActivePointer): number {
  return (Math.atan2(b.y - a.y, b.x - a.x) * 180) / Math.PI;
}

const INITIAL: ViewportState = { panX: 0, panY: 0, zoom: 1, rotation: 0 };

/**
 * Viewport transform + pointer/keyboard gesture handlers.
 * Attach returned handlers to the canvas host element.
 */
export function useCanvasViewport(opts: UseCanvasViewportOptions = {}) {
  const {
    minZoom = 0.15,
    maxZoom = 8,
    onUndo,
    enabled = true,
  } = opts;

  const [viewport, setViewport] = useState<ViewportState>(INITIAL);
  const viewportRef = useRef(viewport);
  viewportRef.current = viewport;

  const spaceDownRef = useRef(false);
  const pointersRef = useRef<Map<number, ActivePointer>>(new Map());
  const gestureRef = useRef<{
    mode: "none" | "draw" | "pan" | "rotate" | "pinch";
    lastX: number;
    lastY: number;
    startDist: number;
    startAngle: number;
    startZoom: number;
    startRotation: number;
    startPanX: number;
    startPanY: number;
    pinchMidX: number;
    pinchMidY: number;
    /** Two-finger touch: track for tap-to-undo */
    twoFingerDownAt: number | null;
    twoFingerMoved: boolean;
  }>({
    mode: "none",
    lastX: 0,
    lastY: 0,
    startDist: 1,
    startAngle: 0,
    startZoom: 1,
    startRotation: 0,
    startPanX: 0,
    startPanY: 0,
    pinchMidX: 0,
    pinchMidY: 0,
    twoFingerDownAt: null,
    twoFingerMoved: false,
  });

  const onUndoRef = useRef(onUndo);
  onUndoRef.current = onUndo;

  useEffect(() => {
    if (!enabled) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.code === "Space" && !(e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement)) {
        // Don't preventDefault always — only when we own the gesture later
        spaceDownRef.current = true;
      }
    };
    const onKeyUp = (e: KeyboardEvent) => {
      if (e.code === "Space") spaceDownRef.current = false;
    };
    const onBlur = () => {
      spaceDownRef.current = false;
    };
    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", onKeyUp);
    window.addEventListener("blur", onBlur);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
      window.removeEventListener("blur", onBlur);
    };
  }, [enabled]);

  const resetViewport = useCallback(() => {
    setViewport(INITIAL);
  }, []);

  const setZoom = useCallback(
    (z: number) => {
      setViewport((v) => ({
        ...v,
        zoom: Math.min(maxZoom, Math.max(minZoom, z)),
      }));
    },
    [minZoom, maxZoom],
  );

  /** Multiply current zoom (e.g. wheel / buttons). factor > 1 zooms in. */
  const zoomBy = useCallback(
    (factor: number) => {
      setViewport((v) => ({
        ...v,
        zoom: Math.min(maxZoom, Math.max(minZoom, v.zoom * factor)),
      }));
    },
    [minZoom, maxZoom],
  );

  /**
   * Mouse-wheel / trackpad zoom. Always zooms the camera (desktop-friendly).
   * Call from onWheel on the canvas stage; prevents page scroll.
   */
  const onWheelZoom = useCallback(
    (e: { deltaY: number; preventDefault: () => void }) => {
      if (!enabled) return;
      e.preventDefault();
      // Smooth trackpads send small deltas; mouse wheels send larger steps.
      const dy = e.deltaY;
      const factor =
        Math.abs(dy) < 40
          ? dy > 0
            ? 0.96
            : 1.04
          : dy > 0
            ? 0.85
            : 1.18;
      zoomBy(factor);
    },
    [enabled, zoomBy],
  );

  /**
   * Map client coordinates through inverse viewport transform into
   * local plate/canvas space (origin top-left of the untransformed element).
   */
  const clientToLocal = useCallback(
    (
      clientX: number,
      clientY: number,
      el: HTMLElement,
    ): { x: number; y: number } => {
      const rect = el.getBoundingClientRect();
      const v = viewportRef.current;
      // Element center in client space
      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height / 2;
      // Point relative to center
      let dx = clientX - cx;
      let dy = clientY - cy;
      // Inverse pan is already in the rect (CSS transform pan moves the element;
      // getBoundingClientRect includes transform). Work in pre-transform space:
      // Use untransformed layout size from offsetWidth/Height.
      const w = el.offsetWidth;
      const h = el.offsetHeight;
      // Rect already includes transform — reconstruct local by inverse rotate/scale/pan.
      // Approximate: from center of transformed bounding box is imperfect when rotated.
      // Prefer matrix from computed style when available.
      const style = window.getComputedStyle(el);
      const t = style.transform;
      if (t && t !== "none") {
        // DOMMatrix inverse
        try {
          const m = new DOMMatrix(t);
          const inv = m.inverse();
          // Point relative to element top-left before transform (in parent space)
          // getBoundingClientRect is axis-aligned after transform; use offset parent chain.
          // Simpler path: map via center using inverse rotation/scale only + pan.
          const rad = (-v.rotation * Math.PI) / 180;
          const cos = Math.cos(rad);
          const sin = Math.sin(rad);
          // Remove pan: center is shifted by pan in parent coords
          dx = clientX - (cx);
          dy = clientY - (cy);
          // The center of the element in screen space already includes pan.
          // Inverse scale and rotate around center:
          dx /= v.zoom || 1;
          dy /= v.zoom || 1;
          const rx = dx * cos - dy * sin;
          const ry = dx * sin + dy * cos;
          return { x: w / 2 + rx, y: h / 2 + ry };
        } catch {
          /* fall through */
        }
      }
      // Fallback without matrix
      const rad = (-v.rotation * Math.PI) / 180;
      const cos = Math.cos(rad);
      const sin = Math.sin(rad);
      dx /= v.zoom || 1;
      dy /= v.zoom || 1;
      const rx = dx * cos - dy * sin;
      const ry = dx * sin + dy * cos;
      return { x: w / 2 + rx, y: h / 2 + ry };
    },
    [],
  );

  /**
   * CSS transform for pan + rotation only.
   * Apply zoom by scaling the element's CSS width/height (not transform:scale)
   * so hit-testing via getBoundingClientRect stays reliable on desktop.
   */
  const transformStyle = `translate(${viewport.panX}px, ${viewport.panY}px) rotate(${viewport.rotation}deg)`;

  /**
   * Call at pointerdown. Returns true if the viewport consumed the event
   * (pan/rotate/pinch) — caller should not draw.
   */
  const onPointerDown = useCallback(
    (e: React.PointerEvent): boolean => {
      if (!enabled) return false;
      const map = pointersRef.current;
      map.set(e.pointerId, { id: e.pointerId, x: e.clientX, y: e.clientY });
      const g = gestureRef.current;

      if (map.size === 2) {
        const pts = [...map.values()];
        const [a, b] = pts;
        g.mode = "pinch";
        g.startDist = Math.max(1, dist(a!, b!));
        g.startAngle = angle(a!, b!);
        g.startZoom = viewportRef.current.zoom;
        g.startRotation = viewportRef.current.rotation;
        g.startPanX = viewportRef.current.panX;
        g.startPanY = viewportRef.current.panY;
        const m = mid(a!, b!);
        g.pinchMidX = m.x;
        g.pinchMidY = m.y;
        g.twoFingerDownAt = Date.now();
        g.twoFingerMoved = false;
        return true;
      }

      // Ignore secondary / right-click (incl. macOS Ctrl+click → button 2)
      if (e.button === 2 || e.ctrlKey || e.metaKey) {
        return false;
      }

      const wantPan = spaceDownRef.current || e.button === 1;
      // Shift or Alt only — never Ctrl (macOS Ctrl+click = right-click)
      const wantRotate = e.shiftKey || e.altKey;

      if (wantPan) {
        g.mode = "pan";
        g.lastX = e.clientX;
        g.lastY = e.clientY;
        e.preventDefault();
        return true;
      }
      if (wantRotate && (e.pointerType === "mouse" || e.pointerType === "pen")) {
        g.mode = "rotate";
        g.lastX = e.clientX;
        g.lastY = e.clientY;
        e.preventDefault();
        return true;
      }

      g.mode = "draw";
      return false;
    },
    [enabled],
  );

  /**
   * Call on pointermove. Returns true if viewport consumed the event.
   */
  const onPointerMove = useCallback(
    (e: React.PointerEvent): boolean => {
      if (!enabled) return false;
      const map = pointersRef.current;
      if (map.has(e.pointerId)) {
        map.set(e.pointerId, { id: e.pointerId, x: e.clientX, y: e.clientY });
      }
      const g = gestureRef.current;

      if (g.mode === "pinch" && map.size >= 2) {
        const pts = [...map.values()];
        const [a, b] = pts;
        const d = Math.max(1, dist(a!, b!));
        const ang = angle(a!, b!);
        if (Math.abs(d - g.startDist) > 8 || Math.abs(ang - g.startAngle) > 3) {
          g.twoFingerMoved = true;
        }
        const scale = d / g.startDist;
        const dAng = ang - g.startAngle;
        const m = mid(a!, b!);
        const dmx = m.x - g.pinchMidX;
        const dmy = m.y - g.pinchMidY;
        setViewport({
          zoom: Math.min(maxZoom, Math.max(minZoom, g.startZoom * scale)),
          rotation: g.startRotation + dAng,
          panX: g.startPanX + dmx,
          panY: g.startPanY + dmy,
        });
        e.preventDefault();
        return true;
      }

      if (g.mode === "pan") {
        const dx = e.clientX - g.lastX;
        const dy = e.clientY - g.lastY;
        g.lastX = e.clientX;
        g.lastY = e.clientY;
        setViewport((v) => ({ ...v, panX: v.panX + dx, panY: v.panY + dy }));
        e.preventDefault();
        return true;
      }

      if (g.mode === "rotate") {
        const dx = e.clientX - g.lastX;
        g.lastX = e.clientX;
        g.lastY = e.clientY;
        setViewport((v) => ({ ...v, rotation: v.rotation + dx * 0.4 }));
        e.preventDefault();
        return true;
      }

      return false;
    },
    [enabled, minZoom, maxZoom],
  );

  const onPointerUp = useCallback(
    (e: React.PointerEvent): void => {
      const map = pointersRef.current;
      map.delete(e.pointerId);
      const g = gestureRef.current;

      if (g.mode === "pinch") {
        // Two-finger tap undo: short contact, little movement
        if (
          map.size === 0 &&
          g.twoFingerDownAt != null &&
          !g.twoFingerMoved &&
          Date.now() - g.twoFingerDownAt < 350
        ) {
          onUndoRef.current?.();
        }
        if (map.size < 2) {
          g.mode = "none";
          g.twoFingerDownAt = null;
        }
        return;
      }

      if (map.size === 0) {
        g.mode = "none";
      }
    },
    [],
  );

  /** True while space is held (show grab cursor) */
  const isSpacePan = spaceDownRef;

  return {
    viewport,
    setViewport,
    setZoom,
    zoomBy,
    onWheelZoom,
    resetViewport,
    transformStyle,
    clientToLocal,
    onPointerDown,
    onPointerMove,
    onPointerUp,
    isSpacePan,
    spaceDownRef,
    minZoom,
    maxZoom,
  };
}
