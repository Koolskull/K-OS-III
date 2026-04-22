"use client";

/*
 *                    ☦
 *              ╔═══════════╗
 *              ║ SCENE VM  ║
 *              ║  PLAYER   ║
 *              ╚═══════════╝
 *
 *  Slim, theatre-free renderer for a SceneManifest.
 *
 *  - Takes a manifest + a current frame (driven from outside, ultimately by
 *    the tracker's tick clock).
 *  - For each layer, computes interpolated transform + filter values via
 *    the keyframe-interpolation lib, plus ambient noise via simplex-noise.
 *  - Renders layers as DOM elements with CSS transforms / filters / blend modes.
 *    No Three.js in v0 — when 3d-model layers are added, those will mount a
 *    Three.js Canvas as a sibling layer; image/background layers stay DOM.
 *
 *  The player intentionally does NOT manage its own playhead. Datamoshpit's
 *  TrackerEngine ticks → frames; the bound channel's note events drive
 *  jumps via SceneVMBinding. Audio is the master clock.
 */

import React, { useMemo } from "react";
import type { SceneLayer, SceneManifest, BlendMode } from "./lib/types";
import { TIMELINE_FPS } from "./lib/types";
import { findAssetRef, resolveAssetURL } from "./lib/asset-resolver";
import { interpolateTransformKeyframes, buildCSSFilter } from "./lib/keyframe-interpolation";
import type { InterpolatedValues } from "./lib/keyframe-interpolation";
import { noiseAt, interpolateNoiseKeyframes } from "./lib/simplex-noise";

export interface SceneVMPlayerProps {
  manifest: SceneManifest;
  /** Current frame (1-indexed). Externally driven (tick-derived). */
  frame: number;
  /** Width of the player viewport in CSS pixels */
  width: number;
  /** Height of the player viewport in CSS pixels */
  height: number;
  /** Optional: visual debug overlay (frame counter, layer count) */
  debug?: boolean;
}

/**
 * Default interpolated values for a layer that has no keyframes — uses the
 * layer's initial position/scale/opacity if defined, otherwise centers it.
 */
function defaultsFromLayer(layer: SceneLayer): InterpolatedValues {
  return {
    x: layer.initialPosition?.x ?? 0.5,
    y: layer.initialPosition?.y ?? 0.5,
    scaleX: layer.initialScale?.x ?? 1,
    scaleY: layer.initialScale?.y ?? 1,
    rotation: 0,
    opacity: layer.initialOpacity ?? 1,
    brightness: 1,
    blur: 0,
    hueRotate: 0,
    saturate: 1,
  };
}

/**
 * Compute final transform values for a layer at a given frame, factoring in:
 * 1. Keyframe interpolation (if keyframes exist)
 * 2. Ambient noise (always-on per-property wobble)
 * 3. Keyframed noise shake (interpolates amplitude/frequency between noise keyframes)
 */
function computeLayerValues(
  layer: SceneLayer,
  frame: number,
): InterpolatedValues {
  const base =
    interpolateTransformKeyframes(frame, layer.transformKeyframes ?? []) ??
    defaultsFromLayer(layer);

  const time = (frame - 1) / TIMELINE_FPS;

  // Ambient noise channels (continuous wobble)
  let nx = 0, ny = 0, nrot = 0, nsx = 0, nsy = 0;
  const amb = layer.noise;
  if (amb) {
    if (amb.x?.enabled) nx += noiseAt(time, amb.x.frequency, amb.x.amplitude, amb.x.seed ?? 1);
    if (amb.y?.enabled) ny += noiseAt(time, amb.y.frequency, amb.y.amplitude, amb.y.seed ?? 2);
    if (amb.rotation?.enabled) nrot += noiseAt(time, amb.rotation.frequency, amb.rotation.amplitude, amb.rotation.seed ?? 3);
    if (amb.scaleX?.enabled) nsx += noiseAt(time, amb.scaleX.frequency, amb.scaleX.amplitude, amb.scaleX.seed ?? 4);
    if (amb.scaleY?.enabled) nsy += noiseAt(time, amb.scaleY.frequency, amb.scaleY.amplitude, amb.scaleY.seed ?? 5);
  }

  // Keyframed noise shake (stacks additively)
  if (layer.noiseKeyframes && layer.noiseKeyframes.length > 0) {
    const shake = interpolateNoiseKeyframes(frame, layer.noiseKeyframes);
    if (shake) {
      nx += noiseAt(time, shake.freq, shake.posAmp, 11);
      ny += noiseAt(time, shake.freq, shake.posAmp, 13);
      nrot += noiseAt(time, shake.freq, shake.rotAmp, 17);
      nsx += noiseAt(time, shake.freq, shake.sclAmp, 19);
      nsy += noiseAt(time, shake.freq, shake.sclAmp, 23);
    }
  }

  return {
    ...base,
    x: base.x + nx,
    y: base.y + ny,
    rotation: base.rotation + nrot,
    scaleX: base.scaleX + nsx,
    scaleY: base.scaleY + nsy,
  };
}

/** CSS mix-blend-mode value for our BlendMode union */
function cssBlend(mode: BlendMode | undefined): string {
  if (!mode || mode === "normal") return "normal";
  if (mode === "add") return "plus-lighter";
  return mode;
}

/** Render a single layer as a positioned, transformed DOM element */
function LayerView({
  layer,
  manifest,
  frame,
  viewportW,
  viewportH,
}: {
  layer: SceneLayer;
  manifest: SceneManifest;
  frame: number;
  viewportW: number;
  viewportH: number;
}) {
  const v = computeLayerValues(layer, frame);
  const asset = findAssetRef(manifest, layer.assetRef);
  const url = resolveAssetURL(asset);

  // x/y are normalized 0..1 within the viewport — center the element on that point.
  const cx = v.x * viewportW;
  const cy = v.y * viewportH;

  const baseStyle: React.CSSProperties = {
    position: "absolute",
    left: cx,
    top: cy,
    transform: `translate(-50%, -50%) rotate(${v.rotation}deg) scale(${v.scaleX}, ${v.scaleY})`,
    opacity: v.opacity,
    filter: buildCSSFilter(v),
    mixBlendMode: cssBlend(layer.blendMode) as React.CSSProperties["mixBlendMode"],
    zIndex: layer.z,
    pointerEvents: "none",
    imageRendering: "pixelated",
  };

  if (layer.type === "background") {
    // Full-viewport solid or image background driven by stageBg if present
    return (
      <div
        style={{
          position: "absolute",
          inset: 0,
          zIndex: layer.z,
          backgroundColor: manifest.stageBg?.mode === "color" ? manifest.stageBg.color : undefined,
          backgroundImage:
            manifest.stageBg?.mode === "image" && manifest.stageBg.src
              ? `url(${manifest.stageBg.src})`
              : undefined,
          backgroundSize:
            manifest.stageBg?.fit === "fit"
              ? "contain"
              : manifest.stageBg?.fit === "tile"
                ? "auto"
                : "cover",
          backgroundRepeat: manifest.stageBg?.fit === "tile" ? "repeat" : "no-repeat",
          backgroundPosition: "center",
          opacity: v.opacity,
          filter: buildCSSFilter(v),
          imageRendering: "pixelated",
        }}
      />
    );
  }

  if (layer.type === "image" && url) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={url}
        alt={asset?.label ?? layer.id}
        style={baseStyle}
        draggable={false}
      />
    );
  }

  if (layer.type === "solid") {
    const w = layer.solidSize?.w ?? 64;
    const h = layer.solidSize?.h ?? 64;
    return (
      <div
        style={{
          ...baseStyle,
          width: w,
          height: h,
          backgroundColor: layer.solidColor ?? "#ffffff",
        }}
      />
    );
  }

  if (layer.type === "3d-model") {
    // v0: 3d-model layers render a placeholder badge so the manifest stays valid.
    // Replaced in a follow-on PR with a Three.js Canvas mounted as a sibling layer.
    return (
      <div
        style={{
          ...baseStyle,
          padding: "4px 6px",
          background: "#ff00aa",
          color: "#000",
          fontFamily: "monospace",
          fontSize: 10,
          border: "2px solid #000",
        }}
      >
        3D: {asset?.label ?? layer.assetRef ?? layer.id}
      </div>
    );
  }

  // Unknown / unsupported layer type — render nothing.
  return null;
}

export function SceneVMPlayer({
  manifest,
  frame,
  width,
  height,
  debug = false,
}: SceneVMPlayerProps) {
  // Layers sorted by z so the DOM order matches stacking order
  const layers = useMemo(
    () => [...manifest.layers].sort((a, b) => a.z - b.z),
    [manifest.layers],
  );

  return (
    <div
      style={{
        position: "relative",
        width,
        height,
        overflow: "hidden",
        backgroundColor:
          manifest.stageBg?.mode === "color" ? manifest.stageBg.color : "#000",
        imageRendering: "pixelated",
      }}
    >
      {layers.map((layer) => (
        <LayerView
          key={layer.id}
          layer={layer}
          manifest={manifest}
          frame={frame}
          viewportW={width}
          viewportH={height}
        />
      ))}

      {debug ? (
        <div
          style={{
            position: "absolute",
            bottom: 4,
            left: 4,
            padding: "2px 4px",
            backgroundColor: "#000",
            color: "#0f0",
            fontFamily: "monospace",
            fontSize: 10,
            zIndex: 9999,
            pointerEvents: "none",
            border: "1px solid #0f0",
          }}
        >
          F{String(frame).padStart(4, "0")} · {layers.length} layers · {manifest.name}
        </div>
      ) : null}
    </div>
  );
}

export default SceneVMPlayer;
