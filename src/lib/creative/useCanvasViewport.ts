/*
 * Shared canvas viewport gestures for drawing apps.
 * - Two-finger tap → undo
 * - Three-finger tap → redo
 * - Pinch → zoom + pan; twist → rotate (when enabled)
 * - Space + drag → pan
 * - Shift + drag (mouse only) → rotate (when enableRotation)
 *
 * Drawing must not run while multi-touch is active (onPointerDown returns true).
 * Apply rotation via CSS rotate(); map pointers with clientToCanvasBitmap(..., rotation).
 *
 * NOTE (macOS): Do NOT use Ctrl+click for rotate — macOS maps Ctrl+click to
 * a secondary/right-click. Use Shift only (not Alt).
 *
 * STYLUS / HUION / WACOM:
 * Drivers often inject a second "touch" (palm, hover, or dual-contact) while the
 * pen is down. That used to start a two-finger pinch-twist and rotate the view
 * instead of drawing. Palm rejection: while a pen pointer is active, ignore
 * touch contacts; never run multi-touch gestures involving a pen; Shift+rotate
 * is mouse-only so a pen never enters rotate mode.
 */

"use client";

import { useCallback, useEffect, useRef, useState } from "react";

export interface ViewportState {
  /** CSS px pan */
  panX: number;
  panY: number;
  /** Multiplier (1 = 100%) */
  zoom: number;
  /** Degrees clockwise (CSS rotate) */
  rotation: number;
}

export interface UseCanvasViewportOptions {
  minZoom?: number;
  maxZoom?: number;
  /** Two-finger tap */
  onUndo?: () => void;
  /** Three-finger tap */
  onRedo?: () => void;
  enabled?: boolean;
  /**
   * Allow rotate (Shift drag mouse + optional pinch twist).
   * Default true for natural drawing-app feel.
   */
  enableRotation?: boolean;
  /**
   * Two-finger twist rotates the view. Default matches enableRotation.
   * Only applies to pure touch pairs (never pen).
   */
  pinchRotate?: boolean;
}

interface ActivePointer {
  id: number;
  x: number;
  y: number;
  type: string;
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

function centroid(pts: ActivePointer[]): { x: number; y: number } {
  let x = 0;
  let y = 0;
  for (const p of pts) {
    x += p.x;
    y += p.y;
  }
  const n = Math.max(1, pts.length);
  return { x: x / n, y: y / n };
}

function mapHasType(map: Map<number, ActivePointer>, type: string): boolean {
  for (const p of map.values()) {
    if (p.type === type) return true;
  }
  return false;
}

/** Drop all non-pen contacts (palm / ghost touch while stylus is active). */
function purgeNonPen(map: Map<number, ActivePointer>): void {
  for (const [id, p] of [...map.entries()]) {
    if (p.type !== "pen") map.delete(id);
  }
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
    onRedo,
    enabled = true,
    enableRotation = true,
    pinchRotate,
  } = opts;

  const allowPinchRotate = pinchRotate ?? enableRotation;

  const [viewport, setViewport] = useState<ViewportState>(INITIAL);
  const viewportRef = useRef(viewport);
  viewportRef.current = viewport;

  const spaceDownRef = useRef(false);
  const pointersRef = useRef<Map<number, ActivePointer>>(new Map());
  const gestureRef = useRef<{
    mode: "none" | "draw" | "pan" | "rotate" | "pinch" | "multi";
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
    multiDownAt: number | null;
    multiMoved: boolean;
    /** Peak simultaneous fingers in this multi-touch episode */
    peakFingers: number;
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
    multiDownAt: null,
    multiMoved: false,
    peakFingers: 0,
  });

  const onUndoRef = useRef(onUndo);
  onUndoRef.current = onUndo;
  const onRedoRef = useRef(onRedo);
  onRedoRef.current = onRedo;

  useEffect(() => {
    if (!enabled) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (
        e.code === "Space" &&
        !(e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement)
      ) {
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

  const zoomBy = useCallback(
    (factor: number) => {
      setViewport((v) => ({
        ...v,
        zoom: Math.min(maxZoom, Math.max(minZoom, v.zoom * factor)),
      }));
    },
    [minZoom, maxZoom],
  );

  const onWheelZoom = useCallback(
    (e: { deltaY: number; preventDefault: () => void }) => {
      if (!enabled) return;
      e.preventDefault();
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
   * CSS transform for pan + rotation.
   * Prefer zoom via layout size (width/height), not transform:scale.
   */
  const transformStyle = `translate(${viewport.panX}px, ${viewport.panY}px) rotate(${viewport.rotation}deg)`;

  const beginMultiTouch = (g: (typeof gestureRef)["current"], map: Map<number, ActivePointer>) => {
    const pts = [...map.values()];
    g.peakFingers = Math.max(g.peakFingers, map.size);
    g.multiDownAt = g.multiDownAt ?? Date.now();
    if (map.size >= 2) {
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
    } else {
      g.mode = "multi";
    }
  };

  /**
   * Call at pointerdown. Returns true if the viewport consumed the event
   * (pan/rotate/pinch/multi) — caller must not draw.
   */
  const onPointerDown = useCallback(
    (e: React.PointerEvent): boolean => {
      if (!enabled) return false;
      const map = pointersRef.current;
      const g = gestureRef.current;
      const pType = e.pointerType || "mouse";

      // Palm / ghost touch while stylus is drawing — never treat as a 2nd finger.
      // Return false so callers do not cancel an in-progress pen stroke.
      if (pType === "touch" && mapHasType(map, "pen")) {
        e.preventDefault();
        return false;
      }

      // Stylus takes priority: drop palm contacts so pinch-twist never starts
      if (pType === "pen") {
        purgeNonPen(map);
        if (g.mode === "pinch" || g.mode === "multi") {
          g.mode = "none";
          g.peakFingers = 0;
          g.multiDownAt = null;
          g.multiMoved = false;
        }
      }

      map.set(e.pointerId, {
        id: e.pointerId,
        x: e.clientX,
        y: e.clientY,
        type: pType,
      });

      // Multi-touch only for pure finger/mouse pairs — never with a pen in the set
      if (map.size >= 2) {
        if (mapHasType(map, "pen")) {
          purgeNonPen(map);
          g.mode = "draw";
          return false; // let the pen stroke proceed
        }
        e.preventDefault();
        beginMultiTouch(g, map);
        return true;
      }

      // Reset peak when starting a fresh single-pointer episode
      if (map.size === 1 && g.mode !== "pinch" && g.mode !== "multi") {
        g.peakFingers = 1;
        g.multiMoved = false;
        g.multiDownAt = null;
      }

      if (e.button === 2 || e.ctrlKey || e.metaKey) {
        return false;
      }

      const wantPan = spaceDownRef.current || e.button === 1;
      // Shift+drag rotate: mouse only. Pen must always draw (Huion drivers
      // sometimes report sticky modifiers / secondary buttons oddly).
      const wantRotate =
        enableRotation && e.shiftKey && !e.altKey && pType === "mouse";

      if (wantPan) {
        g.mode = "pan";
        g.lastX = e.clientX;
        g.lastY = e.clientY;
        e.preventDefault();
        return true;
      }
      if (wantRotate) {
        g.mode = "rotate";
        g.lastX = e.clientX;
        g.lastY = e.clientY;
        e.preventDefault();
        return true;
      }

      g.mode = "draw";
      return false;
    },
    [enabled, enableRotation],
  );

  const onPointerMove = useCallback(
    (e: React.PointerEvent): boolean => {
      if (!enabled) return false;
      const map = pointersRef.current;
      const pType = e.pointerType || "mouse";

      // Ignore stray palm moves while pen is active (do not cancel pen stroke)
      if (pType === "touch" && mapHasType(map, "pen") && !map.has(e.pointerId)) {
        e.preventDefault();
        return false;
      }

      if (map.has(e.pointerId)) {
        const prev = map.get(e.pointerId)!;
        map.set(e.pointerId, {
          id: e.pointerId,
          x: e.clientX,
          y: e.clientY,
          type: prev.type || pType,
        });
      }
      const g = gestureRef.current;

      // Second contact during draw: only promote to multi if no pen is involved
      if (map.size >= 2 && (g.mode === "draw" || mapHasType(map, "pen"))) {
        if (mapHasType(map, "pen")) {
          purgeNonPen(map);
          g.mode = "draw";
        } else if (g.mode === "draw") {
          beginMultiTouch(g, map);
        }
      }

      if (
        (g.mode === "pinch" || g.mode === "multi") &&
        map.size >= 2 &&
        !mapHasType(map, "pen")
      ) {
        const pts = [...map.values()];
        g.peakFingers = Math.max(g.peakFingers, map.size);
        const [a, b] = pts;
        const d = Math.max(1, dist(a!, b!));
        const ang = angle(a!, b!);
        if (Math.abs(d - g.startDist) > 8 || Math.abs(ang - g.startAngle) > 4) {
          g.multiMoved = true;
        }
        const m = centroid(pts);
        if (Math.hypot(m.x - g.pinchMidX, m.y - g.pinchMidY) > 10) {
          g.multiMoved = true;
        }

        // Two-finger pinch/zoom/pan/twist (use first two for geometry)
        if (map.size === 2 || g.mode === "pinch") {
          const scale = d / g.startDist;
          const pairMid = mid(a!, b!);
          const dmx = pairMid.x - g.pinchMidX;
          const dmy = pairMid.y - g.pinchMidY;
          const dAng = allowPinchRotate ? ang - g.startAngle : 0;
          setViewport({
            zoom: Math.min(maxZoom, Math.max(minZoom, g.startZoom * scale)),
            rotation: g.startRotation + dAng,
            panX: g.startPanX + dmx,
            panY: g.startPanY + dmy,
          });
        }
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

      if (g.mode === "rotate" && enableRotation) {
        const dx = e.clientX - g.lastX;
        g.lastX = e.clientX;
        g.lastY = e.clientY;
        setViewport((v) => ({ ...v, rotation: v.rotation + dx * 0.4 }));
        e.preventDefault();
        return true;
      }

      // Drawing: viewport does not consume (unless multi without pen slipped through)
      if (map.size >= 2 && !mapHasType(map, "pen")) return true;
      return false;
    },
    [enabled, minZoom, maxZoom, enableRotation, allowPinchRotate],
  );

  const onPointerUp = useCallback((e: React.PointerEvent): void => {
    const map = pointersRef.current;
    map.delete(e.pointerId);
    const g = gestureRef.current;

    if (g.mode === "pinch" || g.mode === "multi" || g.peakFingers >= 2) {
      g.peakFingers = Math.max(g.peakFingers, map.size + 1);

      // Fire taps only when all fingers released
      if (map.size === 0) {
        const short =
          g.multiDownAt != null && Date.now() - g.multiDownAt < 400 && !g.multiMoved;
        if (short) {
          if (g.peakFingers >= 3) {
            onRedoRef.current?.();
          } else if (g.peakFingers === 2) {
            onUndoRef.current?.();
          }
        }
        g.mode = "none";
        g.multiDownAt = null;
        g.multiMoved = false;
        g.peakFingers = 0;
      } else if (map.size === 1) {
        // One finger left after multi — do not resume draw; wait for full release
        g.mode = "multi";
      } else if (map.size >= 2) {
        // Re-seed pinch baseline with remaining fingers
        beginMultiTouch(g, map);
        g.multiMoved = true; // already a gesture, not a tap
      }
      return;
    }

    if (map.size === 0) {
      g.mode = "none";
      g.peakFingers = 0;
      g.multiDownAt = null;
      g.multiMoved = false;
    }
  }, []);

  return {
    viewport,
    setViewport,
    setZoom,
    zoomBy,
    onWheelZoom,
    resetViewport,
    transformStyle,
    onPointerDown,
    onPointerMove,
    onPointerUp,
    isSpacePan: spaceDownRef,
    spaceDownRef,
    minZoom,
    maxZoom,
  };
}
