"use client";

/*
 *                    ☦
 *      SCENE VM — TRACKER BINDING HOOK
 *
 *  Subscribes to a TrackerEngine's note events and computes the current
 *  scene frame for a given binding. Returns the live frame number that the
 *  SceneVMPlayer renders against.
 *
 *  Trigger modes (per SceneVMBinding.triggerMode):
 *  - play-from-start: every note resets the scene to frame 1 and plays forward
 *  - play-from-frame: every note jumps to triggerFrame and plays forward
 *  - pitch-mapped:    note pitch maps the scene playhead within pitchRange
 *  - velocity-amp:    notes don't move the playhead (continuous), velocity used elsewhere
 *  - none:            scene plays continuously, ignores notes
 *
 *  The playhead advances every animation frame at the scene's TIMELINE_FPS,
 *  driven by requestAnimationFrame. We don't sync to the audio's sample-clock;
 *  the trigger moments are sample-accurate (they fire on the same Tone.js
 *  schedule as the note attack), and visual interpolation between triggers
 *  runs on the browser's render loop. Acceptable for v0.
 */

import { useEffect, useRef, useState } from "react";
import type { TrackerEngine, NoteEvent } from "@/engine/tracker/TrackerEngine";
import type { SceneVMBinding } from "./lib/types";
import { TIMELINE_FPS } from "./lib/types";

export function useSceneVMBinding(
  engine: TrackerEngine | null,
  binding: SceneVMBinding,
): number {
  const [frame, setFrame] = useState(1);
  // Mutable refs avoid re-subscribing the listener on every render
  const playheadRef = useRef(1);
  const playingRef = useRef(false);
  const lastTickAtRef = useRef<number>(performance.now());
  const bindingRef = useRef(binding);
  bindingRef.current = binding;

  // Subscribe to note events
  useEffect(() => {
    if (!engine) return;
    const unsub = engine.onNoteEvent((ev: NoteEvent) => {
      const b = bindingRef.current;
      if (ev.channel !== b.channel) return;
      if (ev.type !== "on") return;

      switch (b.triggerMode) {
        case "play-from-start":
          playheadRef.current = 1;
          playingRef.current = true;
          break;
        case "play-from-frame":
          playheadRef.current = b.triggerFrame ?? 1;
          playingRef.current = true;
          break;
        case "pitch-mapped": {
          const range = b.pitchRange ?? { lo: 36, hi: 96 };
          const total = b.manifest.totalFrames ?? Math.ceil(b.manifest.duration * TIMELINE_FPS);
          const span = Math.max(1, range.hi - range.lo);
          const t = Math.max(0, Math.min(1, (ev.note - range.lo) / span));
          playheadRef.current = 1 + Math.round(t * (total - 1));
          playingRef.current = true;
          break;
        }
        case "velocity-amp":
        case "none":
        default:
          // Don't touch the playhead
          break;
      }
      lastTickAtRef.current = performance.now();
      setFrame(playheadRef.current);
    });
    return unsub;
  }, [engine]);

  // Continuous playback loop — advances the playhead on rAF
  useEffect(() => {
    let raf = 0;
    let cancelled = false;

    // Auto-play continuous-mode scenes from frame 1
    if (binding.triggerMode === "none") {
      playingRef.current = true;
    }

    const totalFrames = binding.manifest.totalFrames
      ?? Math.ceil(binding.manifest.duration * TIMELINE_FPS);

    const tick = () => {
      if (cancelled) return;
      const now = performance.now();
      const elapsedSec = (now - lastTickAtRef.current) / 1000;
      lastTickAtRef.current = now;

      if (playingRef.current) {
        const advance = elapsedSec * TIMELINE_FPS;
        let next = playheadRef.current + advance;
        if (next >= totalFrames) {
          if (binding.holdOnNote) {
            next = totalFrames;
            playingRef.current = false;
          } else {
            // Loop continuous scenes
            next = binding.triggerMode === "none" ? 1 : totalFrames;
            if (binding.triggerMode !== "none") playingRef.current = false;
          }
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
  }, [binding.manifest.id, binding.triggerMode, binding.holdOnNote, binding.manifest.duration, binding.manifest.totalFrames]);

  return frame;
}
