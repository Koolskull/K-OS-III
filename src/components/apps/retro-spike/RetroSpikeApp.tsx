"use client";

/*
 *                    ☦
 *      RETRO SPIKE APP — EMULATOR SHELL (RESEARCH)
 *
 *  Plugin-ready emulator host. Mounts a canvas at the core's native
 *  framebuffer size, scales it up with image-rendering: pixelated,
 *  drives a requestAnimationFrame tick, and maps the K-OS 8-button
 *  input model (D-pad + Q/W/Space/Shift) to core.setButton().
 *
 *  Not wired into the desktop shell — this is a research spike. Mount
 *  at /spike/retro for verification. Once a real core (binjgb, mGBA,
 *  libretro-web) proves out, promote to a real Retro app category.
 *
 *  NOTE: no overrides of AppWindow or any OS chrome. This is a
 *  self-contained component that can live inside any container.
 */

import React, { useCallback, useEffect, useRef, useState } from "react";
import type { EmulatorCore, KosButton } from "./EmulatorCore";
import { TestPatternCore } from "./TestPatternCore";

const KEY_TO_BUTTON: Readonly<Record<string, KosButton>> = {
  ArrowUp: "Up",
  ArrowDown: "Down",
  ArrowLeft: "Left",
  ArrowRight: "Right",
  KeyQ: "A",
  KeyW: "B",
  Space: "C",
  ShiftLeft: "D",
  ShiftRight: "D",
};

interface RetroSpikeAppProps {
  /** Core factory — defaults to the test-pattern stub. */
  coreFactory?: () => EmulatorCore;
}

export function RetroSpikeApp({
  coreFactory = () => new TestPatternCore(),
}: RetroSpikeAppProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const coreRef = useRef<EmulatorCore | null>(null);
  const rafRef = useRef<number>(0);
  const lastTickRef = useRef<number>(0);

  const [ready, setReady] = useState(false);
  const [romName, setRomName] = useState<string | null>(null);
  const [fps, setFps] = useState(0);
  const [heldButtons, setHeldButtons] = useState<Set<KosButton>>(new Set());

  // Boot the core once on mount.
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const core = coreFactory();
    coreRef.current = core;

    canvas.width = core.canvasWidth;
    canvas.height = core.canvasHeight;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.imageSmoothingEnabled = false;

    let cancelled = false;
    core.init(ctx).then(() => {
      if (cancelled) return;
      setReady(true);
    });

    return () => {
      cancelled = true;
      cancelAnimationFrame(rafRef.current);
      core.dispose();
      coreRef.current = null;
    };
  }, [coreFactory]);

  // Drive the emulator tick with requestAnimationFrame.
  useEffect(() => {
    if (!ready) return;

    let frameTimestamps: number[] = [];

    const tick = (now: number) => {
      const core = coreRef.current;
      if (!core) return;

      const last = lastTickRef.current;
      const dt = last > 0 ? Math.min(100, now - last) : 16.7;
      lastTickRef.current = now;

      core.step(dt);

      frameTimestamps.push(now);
      frameTimestamps = frameTimestamps.filter((t) => now - t < 1000);
      setFps(frameTimestamps.length);

      rafRef.current = requestAnimationFrame(tick);
    };

    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, [ready]);

  // Input bridge: keyboard → K-OS buttons → core.
  useEffect(() => {
    if (!ready) return;

    const handle = (e: KeyboardEvent, pressed: boolean) => {
      const btn = KEY_TO_BUTTON[e.code];
      if (!btn) return;
      e.preventDefault();
      coreRef.current?.setButton(btn, pressed);
      setHeldButtons((prev) => {
        const next = new Set(prev);
        if (pressed) next.add(btn);
        else next.delete(btn);
        return next;
      });
    };

    const onDown = (e: KeyboardEvent) => {
      if (e.repeat) return;
      handle(e, true);
    };
    const onUp = (e: KeyboardEvent) => handle(e, false);

    window.addEventListener("keydown", onDown);
    window.addEventListener("keyup", onUp);
    return () => {
      window.removeEventListener("keydown", onDown);
      window.removeEventListener("keyup", onUp);
    };
  }, [ready]);

  const onPickRom = useCallback(async (file: File) => {
    const core = coreRef.current;
    if (!core) return;
    const bytes = await file.arrayBuffer();
    await core.loadRom(bytes);
    setRomName(file.name);
  }, []);

  const core = coreRef.current;
  const aspectPadding = core
    ? `${(core.canvasHeight / core.canvasWidth) * 100}%`
    : "56.25%";

  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        backgroundColor: "#000000",
        color: "#ffffff",
        fontFamily: "var(--dm-font-primary), monospace",
        fontSize: 10,
        letterSpacing: 1,
        display: "flex",
        flexDirection: "column",
        imageRendering: "pixelated",
      }}
    >
      {/* Header */}
      <div
        style={{
          padding: "4px 8px",
          borderBottom: "2px solid #1a1a1a",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexShrink: 0,
        }}
      >
        <span style={{ letterSpacing: 2 }}>
          ☦ RETRO SPIKE · {core?.systemLabel ?? "---"} · {core?.name ?? "LOADING"}
        </span>
        <span style={{ color: "#888" }}>
          {romName ? `${romName}` : "NO ROM"} · {fps} FPS
        </span>
      </div>

      {/* Canvas stage — scales up with pixelated rendering */}
      <div
        style={{
          flex: 1,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          minHeight: 0,
          padding: 16,
        }}
      >
        <div
          style={{
            position: "relative",
            width: "100%",
            maxWidth: 640,
            paddingTop: 0,
            aspectRatio: core ? `${core.canvasWidth} / ${core.canvasHeight}` : undefined,
          }}
        >
          <canvas
            ref={canvasRef}
            style={{
              width: "100%",
              height: "100%",
              imageRendering: "pixelated",
              backgroundColor: "#000",
              display: "block",
            }}
          />
          {/* Overlay when no ROM is loaded */}
          {!core?.isRunning() && (
            <div
              style={{
                position: "absolute",
                inset: 0,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                backgroundColor: "rgba(0,0,0,0.7)",
                pointerEvents: "none",
              }}
            >
              <span style={{ color: "#ffff00", letterSpacing: 2 }}>
                LOAD ROM TO START
              </span>
            </div>
          )}
          {/* Hidden padding trick to maintain aspect if aspectRatio unsupported */}
          <div style={{ paddingTop: aspectPadding, visibility: "hidden" }} />
        </div>
      </div>

      {/* Footer — ROM picker + held-button readout */}
      <div
        style={{
          padding: "4px 8px",
          borderTop: "2px solid #1a1a1a",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexShrink: 0,
          gap: 12,
        }}
      >
        <label
          style={{
            cursor: "pointer",
            color: "#ffff00",
            textDecoration: "underline",
            letterSpacing: 1,
          }}
        >
          [ LOAD ROM ]
          <input
            type="file"
            accept={
              core && !core.romExtensions.includes("*")
                ? core.romExtensions.join(",")
                : undefined
            }
            style={{ display: "none" }}
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) onPickRom(file);
              e.target.value = "";
            }}
          />
        </label>
        <span style={{ color: "#555" }}>
          ARROWS:D-PAD Q:A W:B SPACE:C SHIFT:D
        </span>
        <span style={{ color: "#888", minWidth: 120, textAlign: "right" }}>
          {heldButtons.size > 0 ? Array.from(heldButtons).join("+") : "---"}
        </span>
      </div>
    </div>
  );
}
