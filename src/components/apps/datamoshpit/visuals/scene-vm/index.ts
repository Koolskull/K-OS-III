/*
 *                    ☦
 *           SCENE VM — PUBLIC SURFACE
 *
 *  Public exports for the Scene VM module.
 */

export { SceneVMPlayer } from "./SceneVMPlayer";
export { SceneVMWindow } from "./SceneVMWindow";
export type { SceneVMWindowMode } from "./SceneVMWindow";
export { useSceneVMBinding } from "./useSceneVMBinding";
export { useInstrumentSceneVM } from "./useInstrumentSceneVM";
export { InstrumentTimelineEditor } from "./InstrumentTimelineEditor";
export {
  DEMO_KICK_PUNCH,
  DEMO_SNARE_SPIN,
  DEMO_PITCH_SCRUB,
} from "./demo-scenes";
export {
  defaultVisualForInstrument,
  rollVisualForInstrument,
  manifestFromInstrumentVisual,
  defaultCustomKeyframes,
  PLAYER_DEFAULT_W,
  PLAYER_DEFAULT_H,
} from "./instrument-visual";
export type {
  SceneManifest,
  SceneLayer,
  SceneAssetRef,
  SceneVMBinding,
  TransformKeyframe,
  KeyframeMode,
  NoteTriggerMode,
  BlendMode,
  LayerType,
  AssetType,
  StageBgConfig,
  StageBgMode,
  StageBgFit,
  NoiseChannel,
  LayerNoiseConfig,
  NoiseKeyframe,
} from "./lib/types";
export { TIMELINE_FPS } from "./lib/types";
