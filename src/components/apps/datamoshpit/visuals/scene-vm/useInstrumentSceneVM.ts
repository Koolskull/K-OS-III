"use client";

/*
 *                    ☦
 *      SCENE VM — FOLLOW-INSTRUMENT HOOK
 *
 *  Listens to TrackerEngine note events and switches the scene manifest to
 *  whichever instrument fired most recently. Each instrument carries its own
 *  visual settings (Instrument.visual), and we lazily build a SceneManifest
 *  from those settings on every note-on.
 *
 *  Returns the current manifest + frame number for SceneVMPlayer to render.
 */

import { useEffect, useMemo, useRef, useState } from "react";
import type { TrackerEngine, NoteEvent } from "@/engine/tracker/TrackerEngine";
import type { ProjectData } from "@/types/tracker";
import type { SceneManifest } from "./lib/types";
import { TIMELINE_FPS } from "./lib/types";
import { manifestFromInstrumentVisual } from "./instrument-visual";

/** Empty placeholder manifest — shown when no instrument has fired yet, or the active one is disabled. */
function makeIdleManifest(): SceneManifest {
  return {
    id: "idle",
    name: "IDLE",
    version: 1,
    duration: 1,
    totalFrames: 24,
    aspectRatio: "4:3",
    stageBg: { mode: "color", color: "#000000" },
    assets: [],
    layers: [],
  };
}

export interface UseInstrumentSceneVMOptions {
  /** If set, only react to notes on these channels (default: all 8) */
  channelFilter?: number[];
}

export interface InstrumentSceneVMResult {
  manifest: SceneManifest;
  frame: number;
  /** ID of the instrument the current manifest came from, or null if idle */
  activeInstrumentId: number | null;
}

export function useInstrumentSceneVM(
  engine: TrackerEngine | null,
  project: ProjectData | null,
  options: UseInstrumentSceneVMOptions = {},
): InstrumentSceneVMResult {
  const idleManifest = useMemo(makeIdleManifest, []);
  const [manifest, setManifest] = useState<SceneManifest>(idleManifest);
  const [activeInstrumentId, setActiveInstrumentId] = useState<number | null>(null);
  const [frame, setFrame] = useState(1);

  const playheadRef = useRef(1);
  const playingRef = useRef(false);
  const lastTickAtRef = useRef(performance.now());
  const totalFramesRef = useRef(idleManifest.totalFrames ?? 24);
  const triggerModeRef = useRef<string>("none");
  const projectRef = useRef(project);
  projectRef.current = project;
  const channelFilterRef = useRef(options.channelFilter);
  channelFilterRef.current = options.channelFilter;

  // Subscribe to note events
  useEffect(() => {
    if (!engine) return;
    const unsub = engine.onNoteEvent((ev: NoteEvent) => {
      if (ev.type !== "on") return;
      const filter = channelFilterRef.current;
      if (filter && !filter.includes(ev.channel)) return;
      if (ev.instrument == null) return;

      const proj = projectRef.current;
      if (!proj) return;
      const inst = proj.instruments.find((i) => i.id === ev.instrument);
      if (!inst || !inst.visual || !inst.visual.enabled) return;

      // Build a fresh manifest from the instrument's quick-settings visual
      const next = manifestFromInstrumentVisual(inst.visual, inst.name, inst.id);
      const totalFrames = next.totalFrames ?? Math.ceil(next.duration * TIMELINE_FPS);

      // Apply the instrument's trigger-mode semantics to set the playhead
      switch (inst.visual.triggerMode) {
        case "play-from-frame":
          playheadRef.current = inst.visual.triggerFrame ?? 1;
          playingRef.current = true;
          break;
        case "pitch-mapped": {
          const lo = inst.visual.pitchLo ?? 36;
          const hi = inst.visual.pitchHi ?? 96;
          const span = Math.max(1, hi - lo);
          const t = Math.max(0, Math.min(1, (ev.note - lo) / span));
          playheadRef.current = 1 + Math.round(t * (totalFrames - 1));
          playingRef.current = true;
          break;
        }
        case "velocity-amp":
        case "none":
          // Don't touch the playhead
          break;
        case "play-from-start":
        default:
          playheadRef.current = 1;
          playingRef.current = true;
          break;
      }

      totalFramesRef.current = totalFrames;
      triggerModeRef.current = inst.visual.triggerMode;
      lastTickAtRef.current = performance.now();
      setManifest(next);
      setActiveInstrumentId(inst.id);
      setFrame(playheadRef.current);
    });
    return unsub;
  }, [engine]);

  // rAF loop that advances the playhead at TIMELINE_FPS
  useEffect(() => {
    let raf = 0;
    let cancelled = false;

    const tick = () => {
      if (cancelled) return;
      const now = performance.now();
      const elapsedSec = (now - lastTickAtRef.current) / 1000;
      lastTickAtRef.current = now;

      if (playingRef.current) {
        const advance = elapsedSec * TIMELINE_FPS;
        let next = playheadRef.current + advance;
        if (next >= totalFramesRef.current) {
          next = totalFramesRef.current;
          playingRef.current = false;
        }
        playheadRef.current = next;
        setFrame(Math.floor(next));
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => {
      cancelled = true;
      cancelAnimationFrame(raf);
    };
  }, []);

  return { manifest, frame, activeInstrumentId };
}
