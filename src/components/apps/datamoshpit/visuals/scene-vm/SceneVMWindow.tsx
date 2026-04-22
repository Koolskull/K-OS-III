"use client";

/*
 *                    ☦
 *           SCENE VM — FLOATING WINDOW
 *
 *  Pixel-correct floating panel hosting a SceneVMPlayer in either:
 *  - "binding" mode: plays a fixed manifest bound to one channel (demos)
 *  - "follow" mode: plays whichever instrument fired most recently, using
 *    the per-instrument visual settings (Instrument.visual)
 */

import React, { useState } from "react";
import type { TrackerEngine } from "@/engine/tracker/TrackerEngine";
import type { ProjectData } from "@/types/tracker";
import type { SceneVMBinding } from "./lib/types";
import { SceneVMPlayer } from "./SceneVMPlayer";
import { useSceneVMBinding } from "./useSceneVMBinding";
import { useInstrumentSceneVM } from "./useInstrumentSceneVM";

export type SceneVMWindowMode =
  | { kind: "binding"; binding: SceneVMBinding }
  | { kind: "follow"; project: ProjectData | null };

export interface SceneVMWindowProps {
  engine: TrackerEngine | null;
  mode: SceneVMWindowMode;
  onClose?: () => void;
  initialX?: number;
  initialY?: number;
  width?: number;
  height?: number;
}

function BindingWindowBody({
  engine,
  binding,
  width,
  height,
}: {
  engine: TrackerEngine | null;
  binding: SceneVMBinding;
  width: number;
  height: number;
}) {
  const frame = useSceneVMBinding(engine, binding);
  return (
    <>
      <SceneVMPlayer manifest={binding.manifest} frame={frame} width={width} height={height} debug />
      <FooterRow
        left={`MODE: ${binding.triggerMode.toUpperCase()}`}
        right={`FRAME: ${String(frame).padStart(4, "0")}`}
      />
    </>
  );
}

function FollowWindowBody({
  engine,
  project,
  width,
  height,
}: {
  engine: TrackerEngine | null;
  project: ProjectData | null;
  width: number;
  height: number;
}) {
  const { manifest, frame, activeInstrumentId } = useInstrumentSceneVM(engine, project);
  const instLabel =
    activeInstrumentId !== null
      ? `INST ${activeInstrumentId.toString(16).toUpperCase().padStart(2, "0")}`
      : "IDLE";
  return (
    <>
      <SceneVMPlayer manifest={manifest} frame={frame} width={width} height={height} debug />
      <FooterRow left={`FOLLOW: ${instLabel}`} right={`FRAME: ${String(frame).padStart(4, "0")}`} />
    </>
  );
}

function FooterRow({ left, right }: { left: string; right: string }) {
  return (
    <div
      style={{
        backgroundColor: "#000",
        color: "#fff",
        padding: "2px 6px",
        fontSize: 10,
        borderTop: "2px solid #fff",
        display: "flex",
        justifyContent: "space-between",
        fontFamily: "monospace",
      }}
    >
      <span>{left}</span>
      <span>{right}</span>
    </div>
  );
}

export function SceneVMWindow({
  engine,
  mode,
  onClose,
  initialX = 24,
  initialY = 24,
  width = 320,
  height = 240,
}: SceneVMWindowProps) {
  const [pos, setPos] = useState({ x: initialX, y: initialY });
  const [dragging, setDragging] = useState<{ dx: number; dy: number } | null>(null);

  function onMouseDown(e: React.MouseEvent) {
    setDragging({ dx: e.clientX - pos.x, dy: e.clientY - pos.y });
  }
  React.useEffect(() => {
    if (!dragging) return;
    function move(e: MouseEvent) {
      setPos({ x: e.clientX - dragging!.dx, y: e.clientY - dragging!.dy });
    }
    function up() { setDragging(null); }
    window.addEventListener("mousemove", move);
    window.addEventListener("mouseup", up);
    return () => {
      window.removeEventListener("mousemove", move);
      window.removeEventListener("mouseup", up);
    };
  }, [dragging]);

  const title =
    mode.kind === "binding"
      ? `SCENE VM · CH${mode.binding.channel} · ${mode.binding.manifest.name}`
      : "SCENE VM · FOLLOW INSTRUMENT";

  return (
    <div
      style={{
        position: "fixed",
        left: pos.x,
        top: pos.y,
        zIndex: 9000,
        backgroundColor: "#000",
        border: "2px solid #fff",
        boxShadow: "4px 4px 0 #000",
        fontFamily: "monospace",
        imageRendering: "pixelated",
        userSelect: "none",
      }}
    >
      <div
        onMouseDown={onMouseDown}
        style={{
          backgroundColor: "#fff",
          color: "#000",
          padding: "2px 6px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          cursor: dragging ? "grabbing" : "grab",
          fontSize: 10,
          letterSpacing: 1,
          borderBottom: "2px solid #000",
        }}
      >
        <span>{title}</span>
        {onClose ? (
          <button
            onClick={onClose}
            style={{
              background: "#000",
              color: "#fff",
              border: "1px solid #000",
              padding: "0 4px",
              fontFamily: "monospace",
              fontSize: 10,
              cursor: "pointer",
              imageRendering: "pixelated",
            }}
          >
            X
          </button>
        ) : null}
      </div>

      {mode.kind === "binding" ? (
        <BindingWindowBody engine={engine} binding={mode.binding} width={width} height={height} />
      ) : (
        <FollowWindowBody engine={engine} project={mode.project} width={width} height={height} />
      )}
    </div>
  );
}

export default SceneVMWindow;
