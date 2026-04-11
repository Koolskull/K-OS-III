/*
 *                          ☦
 *                  ╔═══════════════╗
 *                  ║    IC    XC   ║
 *                  ║   NIKA NIKA   ║
 *                  ╚═══════════════╝
 *
 *        ┌──────────────────────────────┐
 *        │                              │
 *        │    ††† KNIGHTS TEMPLAR †††   │
 *        │    GUARDIANS OF THE GATE     │
 *        │    TO THE DATAMOSHPIT        │
 *        │                              │
 *        │    "Non nobis, Domine,       │
 *        │     non nobis, sed nomini    │
 *        │     tuo da gloriam."         │
 *        │                              │
 *        └──────────────────────────────┘
 *
 *   DATAMOSHPIT APP
 *   The music tracker, extracted from page.tsx for windowed mode.
 *
 *   CONTROLS (LGPT / LSDj / PicoTracker style):
 *   Arrow keys      = move cursor
 *   Shift + Arrows  = navigate screens (shows screen map)
 *   Q + Arrows      = change values
 *   Space           = play / stop
 *   Z               = place note / confirm
 *   X / Delete      = delete
 *   Tab             = toggle HEX / SLIME
 *   [ / ]           = prev / next channel
 */

"use client";

import React, { useState, useCallback, useEffect, useRef } from "react";
import type { TrackerScreen, Instrument, ProjectData, DisplayMode } from "@/types/tracker";
import { createBlankProject } from "@/engine/tracker/ProjectFactory";
import { createDemoProject } from "@/engine/tracker/DemoProject";
import { InstrumentPlayground } from "@/components/apps/datamoshpit/instruments/InstrumentPlayground";
import { buildFieldLayout, getNavigableRows } from "@/components/apps/datamoshpit/instruments/instrumentFields";
import { FileBrowser } from "@/components/apps/datamoshpit/instruments/FileBrowser";
import { PhraseEditor, PHRASE_COL_COUNT, PHRASE_COLS } from "@/components/apps/datamoshpit/tracker/PhraseEditor";
import { ChainEditor, CHAIN_COL_COUNT, CHAIN_COLS } from "@/components/apps/datamoshpit/tracker/ChainEditor";
import { SongEditor, SONG_COL_COUNT } from "@/components/apps/datamoshpit/tracker/SongEditor";
import { ScreenMap, navigateScreen } from "@/components/os/ScreenMap";
import { Preferences } from "@/components/os/Preferences";
import type { PreferencesData, ScalePreset } from "@/components/os/Preferences";
import { LivePads } from "@/components/apps/datamoshpit/live/LivePads";
import { InputRouter } from "@/lib/InputRouter";
import type { InputAction } from "@/lib/InputRouter";
import { AudioEngine } from "@/engine/audio/AudioEngine";
import { TrackerEngine } from "@/engine/tracker/TrackerEngine";
import { LiveVoiceManager } from "@/engine/live/LiveVoiceManager";
import { PadRecorder } from "@/engine/live/PadRecorder";
import { KoalaRouter } from "@/lib/KoalaRouter";
import type { KoalaAction } from "@/lib/KoalaRouter";

export type InputMode = "tracker" | "sampler";
import { downloadProject, openProjectPicker } from "@/engine/project/ProjectIO";
import { useOrientation } from "@/hooks/useOrientation";
import { TouchController, TouchRailLeft, TouchRailRight } from "@/components/os/TouchController";

// ── PROJECT SCREEN FIELDS ──
const PROJ_ROWS = {
  NAME: 0,
  BPM: 1,
  TPB: 2,
  SAVE: 3,
  LOAD: 4,
} as const;
const PROJ_ROW_COUNT = 5;

const NAME_CHARS = " ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789-_.!";
const MAX_NAME_LEN = 16;

function estimateProjectSize(project: ProjectData): number {
  const jsonSize = JSON.stringify({
    ...project,
    samples: project.samples.map((s) => ({ id: s.id, name: s.name, file: "" })),
  }).length;
  const sampleSize = project.samples.reduce((sum, s) => sum + s.data.byteLength, 0);
  return Math.round(jsonSize * 0.5) + sampleSize;
}

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes}B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)}KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)}MB`;
}

const SCREEN_LABELS: Record<TrackerScreen, string> = {
  preferences: "PREF",
  instrument: "INST",
  song: "SONG",
  chain: "CHAIN",
  phrase: "PHRA",
  table: "TABL",
  project: "PROJ",
  live: "LIVE",
};

const SCALE_CLASS_MAP: Record<ScalePreset, string> = {
  auto: "",
  tiny: "dm-scale-tiny",
  "1x": "dm-scale-1x",
  "2x": "dm-scale-2x",
  "3x": "dm-scale-3x",
  "4x": "dm-scale-4x",
};

interface DatamoshpitAppProps {
  isFocused: boolean;
}

export function DatamoshpitApp({ isFocused }: DatamoshpitAppProps) {
  const { isPortrait } = useOrientation();
  const [project, setProject] = useState<ProjectData>(() => createBlankProject("UNTITLED"));
  const [activeScreen, setActiveScreen] = useState<TrackerScreen>("instrument");
  const [activeInstrument, setActiveInstrument] = useState(0);
  const [activePhraseRow, setActivePhraseRow] = useState(0);
  const [activePhraseCol, setActivePhraseCol] = useState(0);
  const [activeChannel, setActiveChannel] = useState(0);
  const [activeChain, setActiveChain] = useState(0);
  const [chainCursorRow, setChainCursorRow] = useState(0);
  const [chainCursorCol, setChainCursorCol] = useState(0);
  const [songCursorRow, setSongCursorRow] = useState(0);
  const [songCursorCol, setSongCursorCol] = useState(0);
  const [playMode, setPlayMode] = useState<"song" | "live">("song");
  const [mutedChannels, setMutedChannels] = useState<Set<number>>(new Set());
  const [soloedChannels, setSoloedChannels] = useState<Set<number>>(new Set());
  const [instCursorRow, setInstCursorRow] = useState(0);
  const [instCursorCol, setInstCursorCol] = useState(0);
  const [displayMode, setDisplayMode] = useState<DisplayMode>("hex");
  const [presetBrowserOpen, setPresetBrowserOpen] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [liveBank, setLiveBank] = useState(0);
  const [livePreset, setLivePreset] = useState(0);
  const [inputMode, setInputMode] = useState<InputMode>("tracker");
  const [mutedPads, setMutedPads] = useState<Set<number>>(new Set());
  const [soloedPads, setSoloedPads] = useState<Set<number>>(new Set());
  const [activeScene, setActiveScene] = useState(0);
  const [pendingScene, setPendingScene] = useState<number | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [lastTriggeredPad, setLastTriggeredPad] = useState(0);
  const [patternBank, setPatternBank] = useState(0); // offsets scene indices by 8
  const [playbackInfo, setPlaybackInfo] = useState<Array<{
    chainId: number | null; phraseId: number | null; phraseRow: number;
  }>>([]);
  const [preferences, setPreferences] = useState<PreferencesData>({
    displayScale: "auto",
    font: "kongtext",
    fontSize: 10,
    defaultSampleRate: 44100,
    defaultBitDepth: 16,
    defaultFileFormat: "WAV",
    masterVolume: 100,
  });
  const [projCursorRow, setProjCursorRow] = useState(0);
  const [projNameCursor, setProjNameCursor] = useState(0);

  const [demoLoaded, setDemoLoaded] = useState(false);
  const inputRef = useRef<InputRouter | null>(null);
  const koalaRef = useRef<KoalaRouter | null>(null);
  const engineRef = useRef<TrackerEngine | null>(null);
  const liveRef = useRef<LiveVoiceManager | null>(null);
  const recorderRef = useRef<PadRecorder | null>(null);

  // Refs to avoid stale closures in InputRouter callback
  const activePhraseRowRef = useRef(activePhraseRow);
  const activePhraseColRef = useRef(activePhraseCol);
  const instCursorRowRef = useRef(instCursorRow);
  const instCursorColRef = useRef(instCursorCol);
  const activeScreenRef = useRef(activeScreen);
  const activeInstrumentRef = useRef(activeInstrument);
  const activeChainRef = useRef(activeChain);
  const chainCursorRowRef = useRef(chainCursorRow);
  const chainCursorColRef = useRef(chainCursorCol);
  const songCursorRowRef = useRef(songCursorRow);
  const songCursorColRef = useRef(songCursorCol);
  const projectRef = useRef(project);
  const projCursorRowRef = useRef(projCursorRow);
  const projNameCursorRef = useRef(projNameCursor);
  const lastUsedInstrumentRef = useRef(0);
  const inputModeRef = useRef(inputMode);
  const liveBankRef = useRef(liveBank);
  const patternBankRef = useRef(patternBank);
  const lastTriggeredPadRef = useRef(lastTriggeredPad);
  inputModeRef.current = inputMode;
  liveBankRef.current = liveBank;
  patternBankRef.current = patternBank;
  lastTriggeredPadRef.current = lastTriggeredPad;
  activePhraseRowRef.current = activePhraseRow;
  activePhraseColRef.current = activePhraseCol;
  instCursorRowRef.current = instCursorRow;
  instCursorColRef.current = instCursorCol;
  activeScreenRef.current = activeScreen;
  activeInstrumentRef.current = activeInstrument;
  activeChainRef.current = activeChain;
  chainCursorRowRef.current = chainCursorRow;
  chainCursorColRef.current = chainCursorCol;
  songCursorRowRef.current = songCursorRow;
  songCursorColRef.current = songCursorCol;
  projectRef.current = project;
  projCursorRowRef.current = projCursorRow;
  projNameCursorRef.current = projNameCursor;

  // Load demo project on mount
  useEffect(() => {
    if (demoLoaded) return;
    createDemoProject().then((demo) => {
      setProject(demo);
      setDemoLoaded(true);
      console.log("[DATAMOSHPIT] Demo project loaded. ☦");
    });
  }, [demoLoaded]);

  // Initialize tracker engine + live voice manager
  useEffect(() => {
    if (!engineRef.current) {
      engineRef.current = new TrackerEngine();
    }
    if (!liveRef.current) {
      liveRef.current = new LiveVoiceManager();
    }
    if (!recorderRef.current) {
      recorderRef.current = new PadRecorder();
    }
    return () => {
      engineRef.current?.dispose();
      engineRef.current = null;
      liveRef.current?.dispose();
      liveRef.current = null;
      recorderRef.current?.dispose();
      recorderRef.current = null;
    };
  }, []);

  // Load project into engine when project changes
  useEffect(() => {
    const engine = engineRef.current;
    if (!engine) return;
    if (engine.isPlaying()) {
      engine.updateProject(project);
    } else {
      engine.loadProject(project);
      engine.onTick((_tick, _ch, row) => {
        setActivePhraseRow(row);
        // Update playback info for live display (throttled to channel 0)
        if (_ch === 0) {
          setPlaybackInfo(engine.getPlaybackState());
        }
      });
      engine.onSceneChange((active, pending) => {
        setActiveScene(active);
        setPendingScene(pending);
      });
    }
    // Share sample pool with live voice manager
    if (liveRef.current) {
      liveRef.current.setSamplePool(engine.getSamplePool());
    }
  }, [project]);

  // Apply user-chosen display scale override to body
  useEffect(() => {
    const body = document.body;
    Object.values(SCALE_CLASS_MAP).forEach((cls) => {
      if (cls) body.classList.remove(cls);
    });
    const cls = SCALE_CLASS_MAP[preferences.displayScale];
    if (cls) body.classList.add(cls);
    return () => {
      if (cls) body.classList.remove(cls);
    };
  }, [preferences.displayScale]);

  // Sometype Mono weight cycle on HD displays
  useEffect(() => {
    if (window.innerWidth >= 1280) {
      document.body.classList.add("dm-font-cycle");
    }
  }, []);

  // Enable/disable InputRouter and KoalaRouter based on focus + mode
  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.enabled = isFocused && !presetBrowserOpen && inputMode === "tracker";
    }
    if (koalaRef.current) {
      koalaRef.current.enabled = isFocused && inputMode === "sampler";
    }
  }, [isFocused, presetBrowserOpen, inputMode]);

  // W key toggles preset browser on instrument screen
  useEffect(() => {
    if (!isFocused) return;
    let wDown = false;
    let wUsedAsModifier = false;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === "KeyW") {
        wDown = true;
        wUsedAsModifier = false;
      }
      if (wDown && e.code !== "KeyW") {
        wUsedAsModifier = true;
      }
    };
    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.code === "KeyW") {
        if (!wUsedAsModifier && activeScreenRef.current === "instrument") {
          setPresetBrowserOpen((prev) => !prev);
        }
        wDown = false;
        wUsedAsModifier = false;
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
    };
  }, [isFocused]);

  // ── INPUT ROUTER SETUP ──
  useEffect(() => {
    const router = new InputRouter();
    inputRef.current = router;
    router.attach();

    const unsub = router.onAction((action: InputAction) => {
      switch (action) {
        // ── SCREEN NAVIGATION (Shift + Arrows) ──
        case "nav_up":
        case "nav_down":
        case "nav_left":
        case "nav_right": {
          const dir = action.replace("nav_", "") as "up" | "down" | "left" | "right";
          setActiveScreen((current) => {
            const next = navigateScreen(current, dir);
            if (!next) return current;
            // Song → Chain: jump to the chain under cursor
            if (next === "chain" && current === "song") {
              const songRow = projectRef.current.song.rows[songCursorRowRef.current];
              const chainId = songRow?.chains[songCursorColRef.current];
              if (chainId != null) {
                const chainIdx = projectRef.current.chains.findIndex((c) => c.id === chainId);
                if (chainIdx >= 0) setActiveChain(chainIdx);
              }
            }
            // Chain → Phrase: jump to the phrase under cursor
            if (next === "phrase" && current === "chain") {
              const chain = projectRef.current.chains[activeChainRef.current];
              const step = chain?.steps[chainCursorRowRef.current];
              if (step?.phrase != null) {
                // Phrase exists, we'll view it
                // TODO: setActivePhrase when multi-phrase editing is supported
              }
            }
            // Phrase → Instrument: select instrument under cursor
            if (next === "instrument" && current === "phrase") {
              const phrase = projectRef.current.phrases[0];
              const row = phrase?.rows[activePhraseRowRef.current];
              if (row?.instrument != null) {
                setActiveInstrument(row.instrument);
              }
            }
            return next;
          });
          break;
        }

        // ── CURSOR MOVEMENT (Plain Arrows) ──
        case "cursor_up":
          if (activeScreenRef.current === "instrument") {
            setInstCursorRow((r) => Math.max(0, r - 1));
          } else if (activeScreenRef.current === "project") {
            setProjCursorRow((r) => Math.max(0, r - 1));
          } else if (activeScreenRef.current === "chain") {
            setChainCursorRow((r) => Math.max(0, r - 1));
          } else if (activeScreenRef.current === "song") {
            setSongCursorRow((r) => Math.max(0, r - 1));
          } else {
            setActivePhraseRow((r) => Math.max(0, r - 1));
          }
          break;
        case "cursor_down":
          if (activeScreenRef.current === "instrument") {
            setInstCursorRow((r) => {
              const inst = projectRef.current.instruments[activeInstrumentRef.current];
              if (!inst) return r;
              const navRows = getNavigableRows(buildFieldLayout(inst, projectRef.current.samples));
              return Math.min(navRows.length - 1, r + 1);
            });
          } else if (activeScreenRef.current === "project") {
            setProjCursorRow((r) => Math.min(PROJ_ROW_COUNT - 1, r + 1));
          } else if (activeScreenRef.current === "chain") {
            setChainCursorRow((r) => {
              const chain = projectRef.current.chains[activeChainRef.current];
              return Math.min((chain?.steps.length ?? 16) - 1, r + 1);
            });
          } else if (activeScreenRef.current === "song") {
            setSongCursorRow((r) => Math.min(projectRef.current.song.rows.length - 1, r + 1));
          } else {
            setActivePhraseRow((r) => Math.min((projectRef.current.phrases[0]?.rows.length ?? 16) - 1, r + 1));
          }
          break;
        case "cursor_left":
          if (activeScreenRef.current === "instrument") {
            setInstCursorCol((c) => Math.max(0, c - 1));
          } else if (activeScreenRef.current === "project") {
            if (projCursorRowRef.current === PROJ_ROWS.NAME) {
              setProjNameCursor((c) => Math.max(0, c - 1));
            }
          } else if (activeScreenRef.current === "chain") {
            setChainCursorCol((c) => Math.max(0, c - 1));
          } else if (activeScreenRef.current === "song") {
            setSongCursorCol((c) => Math.max(0, c - 1));
          } else if (activeScreenRef.current === "phrase") {
            setActivePhraseCol((c) => Math.max(0, c - 1));
          }
          break;
        case "cursor_right":
          if (activeScreenRef.current === "instrument") {
            setInstCursorCol((c) => {
              const inst = projectRef.current.instruments[activeInstrumentRef.current];
              if (!inst) return c;
              const navRows = getNavigableRows(buildFieldLayout(inst, projectRef.current.samples));
              const row = navRows[instCursorRowRef.current];
              return Math.min((row?.length ?? 1) - 1, c + 1);
            });
          } else if (activeScreenRef.current === "project") {
            if (projCursorRowRef.current === PROJ_ROWS.NAME) {
              setProjNameCursor((c) => Math.min(MAX_NAME_LEN - 1, c + 1));
            }
          } else if (activeScreenRef.current === "chain") {
            setChainCursorCol((c) => Math.min(CHAIN_COL_COUNT - 1, c + 1));
          } else if (activeScreenRef.current === "song") {
            setSongCursorCol((c) => Math.min(projectRef.current.song.channels - 1, c + 1));
          } else if (activeScreenRef.current === "phrase") {
            setActivePhraseCol((c) => Math.min(PHRASE_COL_COUNT - 1, c + 1));
          }
          break;

        // ── VALUE EDITING (Q + Arrows) ──
        case "value_up":
        case "value_down":
        case "value_left":
        case "value_right": {
          if (activeScreenRef.current === "project") {
            const dir = action === "value_up" || action === "value_right" ? 1 : -1;
            const coarse = action === "value_up" || action === "value_down";
            const pRow = projCursorRowRef.current;
            setProject((prev) => {
              switch (pRow) {
                case PROJ_ROWS.NAME: {
                  const name = prev.name.padEnd(MAX_NAME_LEN, " ");
                  const charPos = projNameCursorRef.current;
                  const currentChar = name[charPos] ?? " ";
                  const idx = NAME_CHARS.indexOf(currentChar);
                  const nextIdx = (idx + dir + NAME_CHARS.length) % NAME_CHARS.length;
                  const newName = name.slice(0, charPos) + NAME_CHARS[nextIdx] + name.slice(charPos + 1);
                  return { ...prev, name: newName.trimEnd() || " " };
                }
                case PROJ_ROWS.BPM: {
                  const step = coarse ? 10 * dir : dir;
                  const bpm = Math.max(1, Math.min(999, prev.song.bpm + step));
                  return { ...prev, song: { ...prev.song, bpm } };
                }
                case PROJ_ROWS.TPB: {
                  const tpb = Math.max(1, Math.min(32, prev.song.tpb + dir));
                  return { ...prev, song: { ...prev.song, tpb } };
                }
                default:
                  return prev;
              }
            });
          } else if (activeScreenRef.current === "instrument") {
            const dir = action === "value_up" || action === "value_right" ? 1 : -1;
            const coarse = action === "value_up" || action === "value_down";
            const iRow = instCursorRowRef.current;
            const iCol = instCursorColRef.current;
            setProject((prev) => {
              const inst = prev.instruments[activeInstrumentRef.current];
              if (!inst) return prev;
              const navRows = getNavigableRows(buildFieldLayout(inst, projectRef.current.samples));
              const fields = navRows[iRow];
              if (!fields) return prev;
              const col = Math.min(iCol, fields.length - 1);
              const field = fields[col];
              if (!field) return prev;

              const current = field.get(inst);
              const step = coarse ? Math.max(1, Math.ceil((field.max - field.min) / 16)) * dir : dir;
              const newVal = Math.max(field.min, Math.min(field.max, current + step));
              if (newVal === current) return prev;

              const updated = field.set(inst, newVal);
              return {
                ...prev,
                instruments: prev.instruments.map((i) => i.id === inst.id ? updated : i),
              };
            });
          } else if (activeScreenRef.current === "phrase") {
            const dir = action === "value_up" || action === "value_right" ? 1 : -1;
            const coarse = action === "value_up" || action === "value_down";
            const curRow = activePhraseRowRef.current;
            const curCol = activePhraseColRef.current;
            setProject((prev) => {
              const phrases = [...prev.phrases];
              const p = phrases[0];
              if (!p) return prev;
              const rows = [...p.rows];
              const row = { ...rows[curRow] };

              switch (curCol) {
                case PHRASE_COLS.NOTE: {
                  const step = coarse ? 12 * dir : dir;
                  if (row.note === null) {
                    row.note = 60;
                  } else {
                    row.note = Math.max(0, Math.min(127, row.note + step));
                  }
                  break;
                }
                case PHRASE_COLS.INST: {
                  const step = coarse ? 0x10 * dir : dir;
                  if (row.instrument === null) {
                    row.instrument = lastUsedInstrumentRef.current;
                  } else {
                    row.instrument = Math.max(0, Math.min(prev.instruments.length - 1, row.instrument + step));
                  }
                  lastUsedInstrumentRef.current = row.instrument;
                  break;
                }
                case PHRASE_COLS.SLICE: {
                  const step = coarse ? 0x10 * dir : dir;
                  if (row.slice === null) {
                    row.slice = 0;
                  } else {
                    row.slice = Math.max(0, Math.min(0xFF, row.slice + step));
                  }
                  break;
                }
                case PHRASE_COLS.VAL1: {
                  const step = coarse ? 0x10 * dir : dir;
                  if (row.effect1) {
                    row.effect1 = { ...row.effect1, value: Math.max(0, Math.min(0xFF, row.effect1.value + step)) };
                  }
                  break;
                }
                case PHRASE_COLS.VAL2: {
                  const step = coarse ? 0x10 * dir : dir;
                  if (row.effect2) {
                    row.effect2 = { ...row.effect2, value: Math.max(0, Math.min(0xFF, row.effect2.value + step)) };
                  }
                  break;
                }
                case PHRASE_COLS.CMD1:
                case PHRASE_COLS.CMD2:
                  break;
              }

              rows[curRow] = row;
              phrases[0] = { ...p, rows };
              return { ...prev, phrases };
            });
          } else if (activeScreenRef.current === "chain") {
            const dir = action === "value_up" || action === "value_right" ? 1 : -1;
            const coarse = action === "value_up" || action === "value_down";
            const curRow = chainCursorRowRef.current;
            const curCol = chainCursorColRef.current;
            setProject((prev) => {
              const chains = [...prev.chains];
              const chain = chains[activeChainRef.current];
              if (!chain) return prev;
              const steps = [...chain.steps];
              const step = { ...steps[curRow] };

              if (curCol === CHAIN_COLS.PHRASE) {
                const inc = coarse ? 0x10 * dir : dir;
                if (step.phrase === null) {
                  // Find next unused phrase ID
                  const usedIds = new Set(prev.phrases.map((p) => p.id));
                  let nextId = 0;
                  while (usedIds.has(nextId)) nextId++;
                  step.phrase = nextId;
                } else {
                  step.phrase = Math.max(0, Math.min(0xFF, step.phrase + inc));
                }
              } else if (curCol === CHAIN_COLS.TRANS) {
                const inc = coarse ? 12 * dir : dir;
                step.transpose = Math.max(-24, Math.min(24, step.transpose + inc));
              }

              steps[curRow] = step;
              chains[activeChainRef.current] = { ...chain, steps };
              return { ...prev, chains };
            });
          } else if (activeScreenRef.current === "song") {
            const dir = action === "value_up" || action === "value_right" ? 1 : -1;
            const coarse = action === "value_up" || action === "value_down";
            const curRow = songCursorRowRef.current;
            const curCol = songCursorColRef.current;
            setProject((prev) => {
              const rows = [...prev.song.rows];
              const row = { ...rows[curRow], chains: [...rows[curRow].chains] };
              const current = row.chains[curCol];
              const inc = coarse ? 0x10 * dir : dir;
              if (current === null) {
                row.chains[curCol] = 0;
              } else {
                row.chains[curCol] = Math.max(0, Math.min(0xFF, current + inc));
              }
              rows[curRow] = row;
              return { ...prev, song: { ...prev.song, rows } };
            });
          }
          break;
        }

        // ── SHIFT+W DUAL-VARIABLE CONTROL ──
        case "sw_up":
          if (activeScreenRef.current === "instrument") {
            setActiveInstrument((i) => Math.min(0xFF, i + 0x10));
          } else if (activeScreenRef.current === "chain") {
            // Switch to next chain (create if needed)
            setActiveChain((c) => {
              const next = c + 1;
              const proj = projectRef.current;
              if (next >= proj.chains.length) {
                // Create a new chain
                const newChain = {
                  id: proj.chains.length,
                  steps: Array.from({ length: 16 }, () => ({ phrase: null, transpose: 0 })),
                };
                setProject((prev) => ({ ...prev, chains: [...prev.chains, newChain] }));
              }
              return next;
            });
            setChainCursorRow(0);
          } else if (activeScreenRef.current === "phrase") {
            setProject((prev) => {
              if (prev.phrases.length === 0) return prev;
              const phrases = [...prev.phrases];
              const p = phrases[0];
              if (p.rows.length >= 256) return prev;
              phrases[0] = {
                ...p,
                rows: [...p.rows, { note: null, instrument: null, effect1: null, effect2: null, slice: null }],
              };
              return { ...prev, phrases };
            });
          } else if (activeScreenRef.current === "song") {
            // Toggle live/song mode
            setPlayMode((m) => {
              const next = m === "song" ? "live" : "song";
              engineRef.current?.setPlayMode(next);
              return next;
            });
          } else if (activeScreenRef.current === "live") {
            setLiveBank((b) => Math.min(63, b + 1));
          }
          break;
        case "sw_down":
          if (activeScreenRef.current === "instrument") {
            setActiveInstrument((i) => Math.max(0, i - 0x10));
          } else if (activeScreenRef.current === "chain") {
            setActiveChain((c) => Math.max(0, c - 1));
            setChainCursorRow(0);
          } else if (activeScreenRef.current === "song") {
            // Toggle live/song mode (same as sw_up)
            setPlayMode((m) => {
              const next = m === "song" ? "live" : "song";
              engineRef.current?.setPlayMode(next);
              return next;
            });
          } else if (activeScreenRef.current === "phrase") {
            setProject((prev) => {
              if (prev.phrases.length === 0) return prev;
              const phrases = [...prev.phrases];
              const p = phrases[0];
              if (p.rows.length <= 2) return prev;
              phrases[0] = { ...p, rows: p.rows.slice(0, -1) };
              return { ...prev, phrases };
            });
            setActivePhraseRow((r) => {
              const maxRow = (projectRef.current.phrases[0]?.rows.length ?? 16) - 2;
              return Math.min(r, Math.max(0, maxRow));
            });
          } else if (activeScreenRef.current === "live") {
            setLiveBank((b) => Math.max(0, b - 1));
          }
          break;
        case "sw_left":
          if (activeScreenRef.current === "instrument") {
            setActiveInstrument((i) => Math.max(0, i - 1));
          } else if (activeScreenRef.current === "song") {
            // Mute channel under cursor
            const engine = engineRef.current;
            if (engine) {
              engine.toggleChannelMute(songCursorColRef.current);
              setMutedChannels(engine.getMutedChannels());
            }
          } else if (activeScreenRef.current === "live") {
            setLivePreset((p) => Math.max(0, p - 1));
          }
          break;
        case "sw_right":
          if (activeScreenRef.current === "instrument") {
            setActiveInstrument((i) => Math.min(0xFF, i + 1));
          } else if (activeScreenRef.current === "song") {
            // Solo channel under cursor
            const engine = engineRef.current;
            if (engine) {
              engine.toggleChannelSolo(songCursorColRef.current);
              setSoloedChannels(engine.getSoloedChannels());
            }
          } else if (activeScreenRef.current === "live") {
            setLivePreset((p) => Math.min(63, p + 1));
          }
          break;

        // ── PLAY / STOP (Space) ──
        case "play_stop": {
          const engine = engineRef.current;
          if (engine) {
            if (engine.isPlaying()) {
              engine.stop();
              setPlaying(false);
            } else {
              const startRow = activeScreenRef.current === "song" ? songCursorRowRef.current : 0;
              AudioEngine.getInstance().init().then(async () => {
                await engine.play(startRow);
                setPlaying(true);
              });
            }
          }
          break;
        }

        // ── PLACE / DELETE ──
        case "place":
          if (activeScreenRef.current === "project") {
            const pRow = projCursorRowRef.current;
            if (pRow === PROJ_ROWS.SAVE) {
              downloadProject(projectRef.current);
            } else if (pRow === PROJ_ROWS.LOAD) {
              openProjectPicker().then((loaded) => {
                if (loaded) {
                  setProject(loaded);
                  setDemoLoaded(true);
                }
              });
            }
          } else if (activeScreenRef.current === "instrument") {
            const audio = AudioEngine.getInstance();
            const inst = projectRef.current.instruments[activeInstrumentRef.current];
            if (inst) {
              audio.init().then(async () => {
                if (inst.type === "sample") {
                  // Sample playback handled by component
                } else {
                  const voice = new (await import("@/engine/synth/FMSynth")).FMSynthVoice(audio.getChannel(0));
                  voice.applyInstrument(inst);
                  voice.triggerAttackRelease(60, "8n");
                }
              });
            }
          } else if (activeScreenRef.current === "phrase") {
            const placeRow = activePhraseRowRef.current;
            const placeCol = activePhraseColRef.current;
            setProject((prev) => {
              const phrases = [...prev.phrases];
              const p = phrases[0];
              if (!p) return prev;
              const rows = [...p.rows];
              const row = { ...rows[placeRow] };

              switch (placeCol) {
                case PHRASE_COLS.NOTE:
                  if (row.note === null) row.note = 60;
                  if (row.instrument === null) row.instrument = lastUsedInstrumentRef.current;
                  break;
                case PHRASE_COLS.INST:
                  if (row.instrument === null) row.instrument = lastUsedInstrumentRef.current;
                  if (row.note === null) row.note = 60;
                  lastUsedInstrumentRef.current = row.instrument;
                  break;
                case PHRASE_COLS.SLICE:
                  if (row.slice === null) row.slice = 0;
                  break;
              }

              rows[placeRow] = row;
              phrases[0] = { ...p, rows };
              return { ...prev, phrases };
            });
          } else if (activeScreenRef.current === "chain") {
            const placeRow = chainCursorRowRef.current;
            const placeCol = chainCursorColRef.current;
            setProject((prev) => {
              const chains = [...prev.chains];
              const chain = chains[activeChainRef.current];
              if (!chain) return prev;
              const steps = [...chain.steps];
              const step = { ...steps[placeRow] };

              if (placeCol === CHAIN_COLS.PHRASE) {
                if (step.phrase === null) {
                  // Find next unused phrase ID, or use 0
                  const usedIds = new Set(prev.phrases.map((p) => p.id));
                  let nextId = 0;
                  while (usedIds.has(nextId)) nextId++;
                  step.phrase = nextId;
                  // Create the phrase if it doesn't exist
                  if (!prev.phrases.find((p) => p.id === nextId)) {
                    const newPhrase = {
                      id: nextId,
                      rows: Array.from({ length: 16 }, () => ({
                        note: null, instrument: null, effect1: null, effect2: null, slice: null,
                      })),
                    };
                    steps[placeRow] = step;
                    chains[activeChainRef.current] = { ...chain, steps };
                    return { ...prev, chains, phrases: [...prev.phrases, newPhrase] };
                  }
                }
              } else if (placeCol === CHAIN_COLS.TRANS) {
                // Reset transpose to 0
                step.transpose = 0;
              }

              steps[placeRow] = step;
              chains[activeChainRef.current] = { ...chain, steps };
              return { ...prev, chains };
            });
          } else if (activeScreenRef.current === "song") {
            const placeRow = songCursorRowRef.current;
            const placeCol = songCursorColRef.current;
            setProject((prev) => {
              const rows = [...prev.song.rows];
              const row = { ...rows[placeRow], chains: [...rows[placeRow].chains] };
              if (row.chains[placeCol] === null) {
                // Find next unused chain ID
                const usedIds = new Set(prev.chains.map((c) => c.id));
                let nextId = 0;
                while (usedIds.has(nextId)) nextId++;
                row.chains[placeCol] = nextId;
                // Create the chain if it doesn't exist
                if (!prev.chains.find((c) => c.id === nextId)) {
                  const newChain = {
                    id: nextId,
                    steps: Array.from({ length: 16 }, () => ({ phrase: null, transpose: 0 })),
                  };
                  rows[placeRow] = row;
                  return { ...prev, song: { ...prev.song, rows }, chains: [...prev.chains, newChain] };
                }
              }
              rows[placeRow] = row;
              return { ...prev, song: { ...prev.song, rows } };
            });
          }
          break;
        case "delete":
          if (activeScreenRef.current === "instrument") {
            const dRow = instCursorRowRef.current;
            const dCol = instCursorColRef.current;
            setProject((prev) => {
              const inst = prev.instruments[activeInstrumentRef.current];
              if (!inst) return prev;
              const navRows = getNavigableRows(buildFieldLayout(inst, projectRef.current.samples));
              const fields = navRows[dRow];
              if (!fields) return prev;
              const col = Math.min(dCol, fields.length - 1);
              const field = fields[col];
              if (!field) return prev;

              const defaultVal = field.min;
              const updated = field.set(inst, defaultVal);
              return {
                ...prev,
                instruments: prev.instruments.map((i) => i.id === inst.id ? updated : i),
              };
            });
          } else if (activeScreenRef.current === "phrase") {
            const delRow = activePhraseRowRef.current;
            const delCol = activePhraseColRef.current;
            setProject((prev) => {
              const phrases = [...prev.phrases];
              const p = phrases[0];
              if (!p) return prev;
              const rows = [...p.rows];
              const row = { ...rows[delRow] };

              switch (delCol) {
                case PHRASE_COLS.NOTE:
                  row.note = null;
                  break;
                case PHRASE_COLS.INST:
                  row.instrument = null;
                  break;
                case PHRASE_COLS.SLICE:
                  row.slice = null;
                  break;
                case PHRASE_COLS.CMD1:
                case PHRASE_COLS.VAL1:
                  row.effect1 = null;
                  break;
                case PHRASE_COLS.CMD2:
                case PHRASE_COLS.VAL2:
                  row.effect2 = null;
                  break;
              }

              rows[delRow] = row;
              phrases[0] = { ...p, rows };
              return { ...prev, phrases };
            });
          } else if (activeScreenRef.current === "chain") {
            const delRow = chainCursorRowRef.current;
            const delCol = chainCursorColRef.current;
            setProject((prev) => {
              const chains = [...prev.chains];
              const chain = chains[activeChainRef.current];
              if (!chain) return prev;
              const steps = [...chain.steps];
              const step = { ...steps[delRow] };

              if (delCol === CHAIN_COLS.PHRASE) {
                step.phrase = null;
              } else if (delCol === CHAIN_COLS.TRANS) {
                step.transpose = 0;
              }

              steps[delRow] = step;
              chains[activeChainRef.current] = { ...chain, steps };
              return { ...prev, chains };
            });
          } else if (activeScreenRef.current === "song") {
            const delRow = songCursorRowRef.current;
            const delCol = songCursorColRef.current;
            setProject((prev) => {
              const rows = [...prev.song.rows];
              const row = { ...rows[delRow], chains: [...rows[delRow].chains] };
              row.chains[delCol] = null;
              rows[delRow] = row;
              return { ...prev, song: { ...prev.song, rows } };
            });
          }
          break;

        // ── DISPLAY MODE (Tab) ──
        case "toggle_display":
          setDisplayMode((m) => (m === "hex" ? "slime" : "hex"));
          break;

        // ── CHANNEL SWITCHING ([ and ]) ──
        case "prev_channel":
          setActiveChannel((c) => Math.max(0, c - 1));
          break;
        case "next_channel":
          setActiveChannel((c) => Math.min(project.song.channels - 1, c + 1));
          break;
      }
    });

    return () => {
      unsub();
      router.detach();
    };
  }, [project.song.channels]);

  // ── KOALA ROUTER SETUP ──
  useEffect(() => {
    const router = new KoalaRouter();
    koalaRef.current = router;
    router.attach();

    const unsub = router.onAction(async (action: KoalaAction) => {
      switch (action.type) {
        case "pad_down": {
          await AudioEngine.getInstance().init();
          const bank = liveBankRef.current;
          const instIndex = bank * 16 + action.padIndex;
          const inst = projectRef.current.instruments[instIndex];
          const recorder = recorderRef.current;

          // If recorder is active and this is the recording pad, stop recording
          if (recorder?.isRecording()) {
            const recPad = recorder.getRecordingPad();
            if (recPad && recPad.padIndex === action.padIndex && recPad.bank === bank) {
              const sample = await recorder.stopRecording();
              if (sample) {
                // Add sample to project and assign to instrument
                setProject((prev) => {
                  const newSamples = [...prev.samples, sample];
                  const newInstruments = [...prev.instruments];
                  if (newInstruments[instIndex]) {
                    newInstruments[instIndex] = {
                      ...newInstruments[instIndex],
                      type: "sample",
                      sampleId: sample.id,
                    };
                  }
                  return { ...prev, samples: newSamples, instruments: newInstruments };
                });
              }
              setIsRecording(false);
              break;
            }
          }

          // If pad has no sample, start recording
          if (!inst || (inst.type === "sample" && inst.sampleId == null && !inst.sampleUrl)) {
            if (recorder && !recorder.isRecording()) {
              const started = await recorder.startRecording(action.padIndex, bank);
              if (started) setIsRecording(true);
            }
            break;
          }

          // Otherwise trigger the pad
          setLastTriggeredPad(action.padIndex);
          liveRef.current?.triggerPad(action.padIndex, bank, projectRef.current.instruments);
          break;
        }
        case "pad_up":
          break;
        case "play_stop": {
          const engine = engineRef.current;
          if (engine) {
            if (engine.isPlaying()) {
              engine.stop();
              setPlaying(false);
            } else {
              await AudioEngine.getInstance().init();
              await engine.play();
              setPlaying(true);
            }
          }
          break;
        }
        case "bank_prev":
          setLiveBank((b) => Math.max(0, b - 1));
          break;
        case "bank_next":
          setLiveBank((b) => Math.min(63, b + 1));
          break;
        case "pattern_bank_prev":
          setPatternBank((b) => Math.max(0, b - 1));
          break;
        case "pattern_bank_next":
          setPatternBank((b) => b + 1);
          break;
        case "scene_launch": {
          const engine = engineRef.current;
          if (engine) {
            // Scene index offset by pattern bank (8 scenes per bank)
            const sceneRow = patternBankRef.current * 8 + action.sceneIndex;
            engine.queueScene(sceneRow);
            setPendingScene(sceneRow);
          }
          break;
        }
        case "solo_toggle": {
          const live = liveRef.current;
          if (live) {
            live.toggleSolo(action.padIndex, liveBankRef.current);
            setSoloedPads(new Set(live.getSoloedPads()));
          }
          break;
        }
        case "mute_toggle": {
          const live = liveRef.current;
          if (live) {
            live.toggleMute(action.padIndex, liveBankRef.current);
            setMutedPads(new Set(live.getMutedPads()));
          }
          break;
        }
        case "delete_sample": {
          // Delete sample from last-triggered pad
          const bank = liveBankRef.current;
          const padIdx = lastTriggeredPadRef.current;
          const idx = bank * 16 + padIdx;
          setProject((prev) => {
            const newInstruments = [...prev.instruments];
            if (newInstruments[idx] && newInstruments[idx].type === "sample") {
              newInstruments[idx] = {
                ...newInstruments[idx],
                sampleId: undefined,
                sampleUrl: undefined,
              };
            }
            return { ...prev, instruments: newInstruments };
          });
          break;
        }
        case "record_toggle":
          break;
      }
    });

    return () => {
      unsub();
      router.detach();
    };
  }, []);

  // ── INPUT MODE TOGGLE (backtick key) ──
  useEffect(() => {
    const handleToggle = (e: KeyboardEvent) => {
      if (e.code === "Backquote") {
        e.preventDefault();
        e.stopPropagation();
        setInputMode((m) => {
          const next = m === "tracker" ? "sampler" : "tracker";
          // Auto-switch to live screen when entering sampler mode
          if (next === "sampler") setActiveScreen("live");
          return next;
        });
      }
    };
    // Use capture phase so this fires before both routers
    window.addEventListener("keydown", handleToggle, true);
    return () => window.removeEventListener("keydown", handleToggle, true);
  }, []);

  // Clamp instrument cursor when instrument type or slot changes
  const currentInst = project.instruments[activeInstrument];
  const currentInstType = currentInst?.type;
  useEffect(() => {
    if (!currentInst) return;
    const navRows = getNavigableRows(buildFieldLayout(currentInst, project.samples));
    setInstCursorRow((r) => Math.min(r, navRows.length - 1));
    setInstCursorCol((c) => {
      const row = navRows[Math.min(instCursorRowRef.current, navRows.length - 1)];
      return Math.min(c, (row?.length ?? 1) - 1);
    });
  }, [activeInstrument, currentInstType]);

  const handleInstrumentChange = useCallback(
    (inst: Instrument) => {
      setProject((prev) => ({
        ...prev,
        instruments: prev.instruments.map((i) => (i.id === inst.id ? inst : i)),
      }));
    },
    [],
  );

  const handlePresetLoad = useCallback(
    (preset: Instrument) => {
      setProject((prev) => {
        const target = prev.instruments[activeInstrument];
        if (!target) return prev;
        const updated = {
          ...preset,
          id: target.id,
          volume: target.volume,
          pan: target.pan,
          table: target.table,
        };
        return {
          ...prev,
          instruments: prev.instruments.map((i) => (i.id === target.id ? updated : i)),
        };
      });
    },
    [activeInstrument],
  );

  const handleImportSample = useCallback(
    (sample: import("@/types/tracker").ProjectSample) => {
      setProject((prev) => {
        const target = prev.instruments[activeInstrument];
        const newSamples = [...prev.samples, sample];
        const instruments = target
          ? prev.instruments.map((i) =>
              i.id === target.id
                ? { ...i, type: "sample" as const, sampleId: sample.id, sampleUrl: undefined }
                : i,
            )
          : prev.instruments;
        return { ...prev, samples: newSamples, instruments };
      });
    },
    [activeInstrument],
  );

  const hasCustomFont = preferences.font !== "kongtext";

  return (
    <div
      className="w-full h-full flex flex-col overflow-hidden relative"
      style={{
        backgroundColor: "#000000",
        ...(hasCustomFont ? { fontFamily: `'${preferences.font}', var(--dm-font-primary)` } : {}),
        ...(preferences.fontSize !== 10 ? { fontSize: `${preferences.fontSize}px` } : {}),
      }}
    >
      {/* Top status bar */}
      <div
        className="flex items-center justify-between px-2 py-0.5 border-b-2"
        style={{
          borderColor: "#1a1a1a",
          backgroundColor: "#000000",
          minHeight: "20px",
        }}
      >
        <div className="flex items-center gap-2">
          <ScreenMap active={activeScreen} />
          <span
            style={{
              fontFamily: "var(--dm-font-primary)",
              fontSize: "9px",
              color: "#ffffff",
              letterSpacing: "3px",
            }}
          >
            {SCREEN_LABELS[activeScreen]} {activeChannel.toString(16).toUpperCase()}
          </span>
        </div>
        <div className="flex gap-2 items-center">
          <span
            style={{
              fontFamily: "var(--dm-font-primary)",
              fontSize: "9px",
              color: playing ? "#ffffff" : "#555555",
            }}
          >
            {playing ? "PLAY" : "STOP"}
          </span>
          <span
            style={{
              fontFamily: "var(--dm-font-primary)",
              fontSize: "8px",
              color: "#888888",
            }}
          >
            {displayMode === "hex" ? "HEX" : "SLM"}
          </span>
          <span
            style={{
              fontFamily: "var(--dm-font-primary)",
              fontSize: "8px",
              color: inputMode === "sampler" ? "#ffffff" : "#555555",
              backgroundColor: inputMode === "sampler" ? "#333333" : "transparent",
              padding: "0 2px",
            }}
          >
            {inputMode === "tracker" ? "TRKR" : "SMPL"}
          </span>
          {inputMode === "sampler" && (
            <span
              style={{
                fontFamily: "var(--dm-font-primary)",
                fontSize: "8px",
                color: pendingScene !== null ? "#ffff00" : "#888888",
                letterSpacing: "1px",
              }}
            >
              SC:{activeScene}{pendingScene !== null ? `→${pendingScene}` : ""}
            </span>
          )}
          <span
            style={{
              fontFamily: "var(--dm-font-primary)",
              fontSize: "9px",
              color: "#888888",
            }}
          >
            BPM:{project.song.bpm}
          </span>
        </div>
      </div>

      {/* Screen navigation tabs */}
      <div
        className="flex border-b"
        style={{ borderColor: "#1a1a1a" }}
      >
        {(Object.keys(SCREEN_LABELS) as TrackerScreen[]).map((screen) => (
          <button
            key={screen}
            className="flex-1 py-1 border-r cursor-pointer"
            style={{
              borderColor: "#1a1a1a",
              backgroundColor: screen === activeScreen ? "#1a1a1a" : "#000000",
              color: screen === activeScreen ? "#ffffff" : "#555555",
              fontFamily: "var(--dm-font-primary)",
              fontSize: "9px",
              letterSpacing: "1px",
            }}
            onClick={() => setActiveScreen(screen)}
          >
            {SCREEN_LABELS[screen]}
          </button>
        ))}
      </div>

      {/* Main row: optional left rail, content, optional right rail */}
      <div className="flex-1 flex min-h-0" style={{ flexDirection: "row" }}>
        {!isPortrait && activeScreen !== "live" && (
          <TouchRailLeft inputRouter={inputRef.current} />
        )}
        <div className="flex-1 relative overflow-hidden overflow-y-auto min-w-0">
        {activeScreen === "preferences" && (
          <Preferences
            preferences={preferences}
            onPreferencesChange={setPreferences}
          />
        )}

        {activeScreen === "instrument" && (() => {
          const inst = project.instruments[activeInstrument];
          const hexId = activeInstrument.toString(16).toUpperCase().padStart(2, "0");
          return (
          <div className="flex flex-col h-full">
            <div
              className="flex items-center justify-between border-b flex-shrink-0 px-1"
              style={{
                borderColor: "#333333",
                height: "20px",
                fontFamily: "var(--dm-font-primary)",
                fontSize: "9px",
              }}
            >
              <span
                style={{ color: "#555555", cursor: "pointer" }}
                onClick={() => setActiveInstrument((i) => Math.max(0, i - 1))}
              >
                [
              </span>
              <span style={{ color: "#ffffff", letterSpacing: "2px" }}>
                {hexId} {inst?.name ?? "---"}
              </span>
              <span
                style={{ color: "#555555", cursor: "pointer" }}
                onClick={() => setActiveInstrument((i) => Math.min(0xFF, i + 1))}
              >
                ]
              </span>
            </div>

            <div className="flex-1 overflow-hidden">
              {presetBrowserOpen ? (
                <FileBrowser
                  onLoadPreset={handlePresetLoad}
                  onImportSample={handleImportSample}
                  onClose={() => setPresetBrowserOpen(false)}
                  currentInstrumentId={project.instruments[activeInstrument]?.id ?? 0}
                  nextSampleId={project.samples.length > 0 ? Math.max(...project.samples.map((s) => s.id)) + 1 : 0}
                />
              ) : (
                <InstrumentPlayground
                  instrument={project.instruments[activeInstrument]}
                  onInstrumentChange={handleInstrumentChange}
                  slotIndex={activeInstrument}
                  cursorRow={instCursorRow}
                  cursorCol={instCursorCol}
                  onCursorMove={(row, col) => {
                    setInstCursorRow(row);
                    setInstCursorCol(col);
                  }}
                  projectSamples={project.samples}
                />
              )}
            </div>
          </div>
          );
        })()}

        {activeScreen === "phrase" && project.phrases.length > 0 && (
          <div className="h-full">
            <PhraseEditor
              phrase={project.phrases[0]}
              instruments={project.instruments}
              activeRow={activePhraseRow}
              activeCol={activePhraseCol}
              onRowSelect={setActivePhraseRow}
              onColSelect={setActivePhraseCol}
            />
          </div>
        )}

        {activeScreen === "song" && (
          <div className="h-full">
            <SongEditor
              song={project.song}
              activeRow={songCursorRow}
              activeCol={songCursorCol}
              playbackRow={playing ? activeScene : -1}
              playMode={playMode}
              mutedChannels={mutedChannels}
              soloedChannels={soloedChannels}
              onRowSelect={setSongCursorRow}
              onColSelect={setSongCursorCol}
            />
          </div>
        )}

        {activeScreen === "chain" && project.chains.length > 0 && (
          <div className="h-full">
            <ChainEditor
              chain={project.chains[activeChain] ?? project.chains[0]}
              activeRow={chainCursorRow}
              activeCol={chainCursorCol}
              phraseCount={project.phrases.length}
              onRowSelect={setChainCursorRow}
              onColSelect={setChainCursorCol}
            />
          </div>
        )}

        {activeScreen === "table" && (
          <div className="p-2" style={{ fontSize: "10px", color: "#888888" }}>
            [ TABLE EDITOR - SUBROUTINE LOOPS ]
          </div>
        )}

        {activeScreen === "project" && (() => {
          const ROW_H = 18;
          const LABEL_W = 64;
          const paddedName = project.name.padEnd(MAX_NAME_LEN, " ");
          const projFields: Array<{ label: string; row: number; render: () => React.ReactNode }> = [
            {
              label: "NAME",
              row: PROJ_ROWS.NAME,
              render: () => (
                <span style={{ letterSpacing: "2px" }}>
                  {paddedName.split("").map((ch, ci) => (
                    <span
                      key={ci}
                      style={{
                        backgroundColor: projCursorRow === PROJ_ROWS.NAME && projNameCursor === ci ? "#ffffff" : "transparent",
                        color: projCursorRow === PROJ_ROWS.NAME && projNameCursor === ci ? "#000000" : "#ffffff",
                      }}
                    >
                      {ch}
                    </span>
                  ))}
                </span>
              ),
            },
            {
              label: "BPM",
              row: PROJ_ROWS.BPM,
              render: () => (
                <span style={{
                  backgroundColor: projCursorRow === PROJ_ROWS.BPM ? "#ffffff" : "transparent",
                  color: projCursorRow === PROJ_ROWS.BPM ? "#000000" : "#ffffff",
                  paddingLeft: "2px",
                  paddingRight: "2px",
                }}>
                  {project.song.bpm.toString().padStart(3, "0")}
                </span>
              ),
            },
            {
              label: "TPB",
              row: PROJ_ROWS.TPB,
              render: () => (
                <span style={{
                  backgroundColor: projCursorRow === PROJ_ROWS.TPB ? "#ffffff" : "transparent",
                  color: projCursorRow === PROJ_ROWS.TPB ? "#000000" : "#ffffff",
                  paddingLeft: "2px",
                  paddingRight: "2px",
                }}>
                  {project.song.tpb.toString().padStart(2, "0")}
                </span>
              ),
            },
            {
              label: "SAVE",
              row: PROJ_ROWS.SAVE,
              render: () => (
                <span style={{
                  backgroundColor: projCursorRow === PROJ_ROWS.SAVE ? "#ffffff" : "transparent",
                  color: projCursorRow === PROJ_ROWS.SAVE ? "#000000" : "#ffffff",
                  paddingLeft: "2px",
                  paddingRight: "2px",
                }}>
                  SAVE .DMPIT
                </span>
              ),
            },
            {
              label: "LOAD",
              row: PROJ_ROWS.LOAD,
              render: () => (
                <span style={{
                  backgroundColor: projCursorRow === PROJ_ROWS.LOAD ? "#ffffff" : "transparent",
                  color: projCursorRow === PROJ_ROWS.LOAD ? "#000000" : "#ffffff",
                  paddingLeft: "2px",
                  paddingRight: "2px",
                }}>
                  LOAD .DMPIT
                </span>
              ),
            },
          ];

          return (
            <div
              className="flex flex-col h-full select-none"
              style={{
                fontFamily: "var(--dm-font-primary)",
                fontSize: "10px",
                imageRendering: "pixelated",
              }}
            >
              {projFields.map((f) => (
                <div
                  key={f.row}
                  className="flex items-center px-1"
                  style={{
                    height: `${ROW_H}px`,
                    backgroundColor: projCursorRow === f.row ? "#0a0a0a" : "transparent",
                  }}
                  onClick={() => setProjCursorRow(f.row)}
                >
                  <span
                    style={{
                      width: `${LABEL_W}px`,
                      color: projCursorRow === f.row ? "#888888" : "#555555",
                      letterSpacing: "1px",
                    }}
                  >
                    {f.label}
                  </span>
                  {f.render()}
                </div>
              ))}

              <div className="px-1 mt-2" style={{ color: "#555555", fontSize: "9px", letterSpacing: "1px" }}>
                <div style={{ height: `${ROW_H}px`, display: "flex", alignItems: "center" }}>
                  <span style={{ width: `${LABEL_W}px` }}>CHAN</span>
                  <span style={{ color: "#888888" }}>{project.song.channels}</span>
                </div>
                <div style={{ height: `${ROW_H}px`, display: "flex", alignItems: "center" }}>
                  <span style={{ width: `${LABEL_W}px` }}>SMPL</span>
                  <span style={{ color: "#888888" }}>{project.samples.length}</span>
                </div>
                <div style={{ height: `${ROW_H}px`, display: "flex", alignItems: "center" }}>
                  <span style={{ width: `${LABEL_W}px` }}>SIZE</span>
                  <span style={{ color: "#888888" }}>~{formatSize(estimateProjectSize(project))}</span>
                </div>
                <div style={{ height: `${ROW_H}px`, display: "flex", alignItems: "center" }}>
                  <span style={{ width: `${LABEL_W}px` }}>VER</span>
                  <span style={{ color: "#888888" }}>{project.version}</span>
                </div>
              </div>
            </div>
          );
        })()}

        {activeScreen === "live" && (
          <div className="h-full">
            <LivePads
              bank={liveBank}
              preset={livePreset}
              inputMode={inputMode}
              mutedPads={mutedPads}
              soloedPads={soloedPads}
              isRecording={isRecording}
              playbackInfo={playbackInfo}
              patternBank={patternBank}
              onPadTrigger={async (padIndex, bank) => {
                await AudioEngine.getInstance().init();
                liveRef.current?.triggerPad(padIndex, bank, project.instruments);
              }}
              onNoteOn={async (midiNote) => {
                await AudioEngine.getInstance().init();
                const inst = project.instruments[activeInstrumentRef.current];
                if (inst) liveRef.current?.noteOn(midiNote, inst);
              }}
              onNoteOff={(midiNote) => {
                liveRef.current?.noteOff(midiNote);
              }}
            />
          </div>
        )}
        </div>
        {!isPortrait && activeScreen !== "live" && (
          <TouchRailRight inputRouter={inputRef.current} />
        )}
      </div>

      {/* Bottom bar */}
      <div
        className="flex items-center justify-between px-2 py-1 border-t-2"
        style={{
          borderColor: "#1a1a1a",
          backgroundColor: "#000000",
          minHeight: "28px",
        }}
      >
        <div className="flex gap-2 items-center">
          <span
            style={{
              fontFamily: "var(--dm-font-primary)",
              fontSize: "8px",
              color: "#555555",
              letterSpacing: "1px",
            }}
          >
            {inputMode === "tracker"
              ? "ARROWS:MOVE  Q+:EDIT  [/]:INST  W:BROWSE  SPACE:PLAY  `:SMPL"
              : "PADS:ZXCV/1234  SCENE:YUIO/HJKL  [/]:BANK  {/}:PTN  N+:SOLO  B+:MUTE  BS:DEL  `:TRKR"}
          </span>
        </div>
        <span
          style={{
            fontFamily: "var(--dm-font-primary)",
            fontSize: "8px",
            color: "#555555",
            letterSpacing: "1px",
          }}
        >
          ☦
        </span>
      </div>

      {/* Touch controller — bottom bar in portrait only (landscape uses side rails) */}
      {isPortrait && activeScreen !== "live" && (
        <TouchController
          inputRouter={inputRef.current}
          isTextInput={activeScreen === "project" && projCursorRow === PROJ_ROWS.NAME}
        />
      )}
    </div>
  );
}
