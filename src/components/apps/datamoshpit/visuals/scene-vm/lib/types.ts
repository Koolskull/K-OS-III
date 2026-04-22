/*
 *                    ☦
 *           SCENE VM — TYPE DEFINITIONS
 *
 *  Slimmed from BeetleGame's lib/cutscene/cutscene-types.ts.
 *  Drops: Theatre.js types, dialog/button/action systems, battle triggers,
 *  audio clips (Datamoshpit IS the audio source), NLT timeline editor types.
 *  Keeps: layer + transform-keyframe + noise model — the bits a runtime
 *  player needs to render manifest-driven visuals.
 */

/* ------------------------------------------------------------------ */
/*  Constants                                                          */
/* ------------------------------------------------------------------ */

export const TIMELINE_FPS = 24;

/* ------------------------------------------------------------------ */
/*  Asset references                                                   */
/* ------------------------------------------------------------------ */

export type AssetType = "image" | "glb" | "fbx" | "vmi";

export interface SceneAssetRef {
  id: string;
  type: AssetType;
  path: string;
  label?: string;
}

/* ------------------------------------------------------------------ */
/*  Layers                                                             */
/* ------------------------------------------------------------------ */

export type LayerType =
  | "background"
  | "image"
  | "3d-model"
  | "vmi-sprite"
  | "solid";  // K-OS addition — colored rectangle, no asset needed (demo + placeholder)

export type BlendMode =
  | "normal"
  | "multiply"
  | "screen"
  | "overlay"
  | "color-dodge"
  | "difference"
  | "add";

export type KeyframeMode =
  | "linear"
  | "bezier"
  | "hold"
  | "bounce-in"
  | "bounce-out"
  | "bounce-both";

export interface TransformKeyframe {
  frame: number;
  mode: KeyframeMode;
  x: number;
  y: number;
  scaleX: number;
  scaleY: number;
  rotation: number;
  opacity: number;
  brightness?: number;
  blur?: number;
  hueRotate?: number;
  saturate?: number;
}

export interface NoiseChannel {
  enabled: boolean;
  amplitude: number;
  frequency: number;
  seed?: number;
}

export interface LayerNoiseConfig {
  x?: NoiseChannel;
  y?: NoiseChannel;
  rotation?: NoiseChannel;
  scaleX?: NoiseChannel;
  scaleY?: NoiseChannel;
}

export interface NoiseKeyframe {
  frame: number;
  positionAmplitude: number;
  rotationAmplitude: number;
  scaleAmplitude: number;
  frequency: number;
}

export interface SceneLayer {
  id: string;
  type: LayerType;
  assetRef?: string;
  z: number;
  initialPosition?: { x: number; y: number };
  initialScale?: { x: number; y: number };
  initialOpacity?: number;
  blendMode?: BlendMode;
  fullViewport?: boolean;
  transformKeyframes?: TransformKeyframe[];
  noise?: LayerNoiseConfig;
  noiseKeyframes?: NoiseKeyframe[];
  ratioLocked?: boolean;
  /** For "solid" layers: CSS color value (hex/rgb/named). Defaults to white. */
  solidColor?: string;
  /** For "solid" layers: pixel size before scale is applied. Defaults to 64. */
  solidSize?: { w: number; h: number };
}

/* ------------------------------------------------------------------ */
/*  Datamoshpit-specific: note triggers                                */
/* ------------------------------------------------------------------ */

/**
 * How a note event from the tracker affects the scene's playhead.
 * - `play-from-start` — note resets playhead to frame 1 and plays to end
 * - `play-from-frame` — note jumps playhead to a specific frame and plays
 * - `pitch-mapped`    — note pitch maps to a frame (e.g. note 60 = frame 1, note 72 = last frame)
 * - `velocity-amp`    — note velocity scales noise amplitude; playhead unaffected
 * - `none`            — visual ignores notes entirely (continuous playback only)
 */
export type NoteTriggerMode =
  | "play-from-start"
  | "play-from-frame"
  | "pitch-mapped"
  | "velocity-amp"
  | "none";

export interface SceneVMBinding {
  /** 0–7 — which Datamoshpit channel triggers this scene */
  channel: number;
  /** The scene manifest to play */
  manifest: SceneManifest;
  /** How notes from this channel drive the playhead */
  triggerMode: NoteTriggerMode;
  /** For "play-from-frame": the target frame */
  triggerFrame?: number;
  /** For "pitch-mapped": MIDI note range (inclusive) that maps to [frame 1, totalFrames] */
  pitchRange?: { lo: number; hi: number };
  /** Whether visuals continue playing after a note ends, or stop on note-off */
  holdOnNote?: boolean;
}

/* ------------------------------------------------------------------ */
/*  Manifest                                                           */
/* ------------------------------------------------------------------ */

export type StageBgMode = "color" | "image";
export type StageBgFit = "stretch" | "fill" | "fit" | "tile";

export interface StageBgConfig {
  mode: StageBgMode;
  color?: string;
  src?: string;
  fit?: StageBgFit;
}

export interface SceneManifest {
  id: string;
  name: string;
  version: number;
  /** Duration in seconds */
  duration: number;
  /** Aspect ratio string e.g. "16:9", "4:3", "1:1" */
  aspectRatio?: string;
  stageBg?: StageBgConfig;
  assets: SceneAssetRef[];
  layers: SceneLayer[];
  /** Total duration in frames (derived: duration * TIMELINE_FPS) */
  totalFrames?: number;
}
