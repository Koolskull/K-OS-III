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
import { ScreenMap, navigateScreen } from "@/components/os/ScreenMap";
import { Preferences } from "@/components/os/Preferences";
import type { PreferencesData, ScalePreset } from "@/components/os/Preferences";
import { LivePads } from "@/components/apps/datamoshpit/live/LivePads";
import { InputRouter } from "@/lib/InputRouter";
import type { InputAction } from "@/lib/InputRouter";
import { AudioEngine } from "@/engine/audio/AudioEngine";
import { TrackerEngine } from "@/engine/tracker/TrackerEngine";
import { downloadProject, openProjectPicker } from "@/engine/project/ProjectIO";
import { useOrientation } from "@/hooks/useOrientation";
import { TouchController } from "@/components/os/TouchController";

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
  const [instCursorRow, setInstCursorRow] = useState(0);
  const [instCursorCol, setInstCursorCol] = useState(0);
  const [displayMode, setDisplayMode] = useState<DisplayMode>("hex");
  const [presetBrowserOpen, setPresetBrowserOpen] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [liveBank, setLiveBank] = useState(0);
  const [livePreset, setLivePreset] = useState(0);
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
  const engineRef = useRef<TrackerEngine | null>(null);

  // Refs to avoid stale closures in InputRouter callback
  const activePhraseRowRef = useRef(activePhraseRow);
  const activePhraseColRef = useRef(activePhraseCol);
  const instCursorRowRef = useRef(instCursorRow);
  const instCursorColRef = useRef(instCursorCol);
  const activeScreenRef = useRef(activeScreen);
  const activeInstrumentRef = useRef(activeInstrument);
  const projectRef = useRef(project);
  const projCursorRowRef = useRef(projCursorRow);
  const projNameCursorRef = useRef(projNameCursor);
  const lastUsedInstrumentRef = useRef(0);
  activePhraseRowRef.current = activePhraseRow;
  activePhraseColRef.current = activePhraseCol;
  instCursorRowRef.current = instCursorRow;
  instCursorColRef.current = instCursorCol;
  activeScreenRef.current = activeScreen;
  activeInstrumentRef.current = activeInstrument;
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

  // Initialize tracker engine
  useEffect(() => {
    if (!engineRef.current) {
      engineRef.current = new TrackerEngine();
    }
    return () => {
      engineRef.current?.dispose();
      engineRef.current = null;
    };
  }, []);

  // Load project into engine when project changes
  useEffect(() => {
    const engine = engineRef.current;
    if (!engine) return;
    if (engine.isPlaying()) {
      engine.updateProject(project);
      return;
    }
    engine.loadProject(project);
    engine.onTick((_tick, _ch, row) => {
      setActivePhraseRow(row);
    });
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

  // Enable/disable InputRouter based on focus
  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.enabled = isFocused && !presetBrowserOpen;
    }
  }, [isFocused, presetBrowserOpen]);

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
          }
          break;
        }

        // ── SHIFT+W DUAL-VARIABLE CONTROL ──
        case "sw_up":
          if (activeScreenRef.current === "instrument") {
            setActiveInstrument((i) => Math.min(0xFF, i + 0x10));
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
          } else if (activeScreenRef.current === "live") {
            setLiveBank((b) => Math.min(63, b + 1));
          }
          break;
        case "sw_down":
          if (activeScreenRef.current === "instrument") {
            setActiveInstrument((i) => Math.max(0, i - 0x10));
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
          } else if (activeScreenRef.current === "live") {
            setLivePreset((p) => Math.max(0, p - 1));
          }
          break;
        case "sw_right":
          if (activeScreenRef.current === "instrument") {
            setActiveInstrument((i) => Math.min(0xFF, i + 1));
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
              AudioEngine.getInstance().init().then(async () => {
                await engine.play();
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

      {/* Main content area */}
      <div className="flex-1 relative overflow-hidden overflow-y-auto">
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
          <div className="p-2" style={{ fontSize: "10px", color: "#888888" }}>
            [ SONG - CH:{activeChannel} - 8 CHANNELS x 256 ROWS ]
          </div>
        )}

        {activeScreen === "chain" && (
          <div className="p-2" style={{ fontSize: "10px", color: "#888888" }}>
            [ CHAIN EDITOR - CH:{activeChannel} - 16 STEPS ]
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
              onPadTrigger={(padIndex, bank) => {
                // TODO: trigger sample/instrument assigned to pad
              }}
              onNoteOn={(midiNote) => {
                // TODO: trigger note on active instrument
              }}
              onNoteOff={(midiNote) => {
                // TODO: release note
              }}
            />
          </div>
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
            ARROWS:MOVE  Q+:EDIT  [/]:INST  W:BROWSE  SPACE:PLAY
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

      {/* Touch controller */}
      {isPortrait && activeScreen !== "live" && (
        <TouchController
          inputRouter={inputRef.current}
          isTextInput={activeScreen === "project" && projCursorRow === PROJ_ROWS.NAME}
        />
      )}
    </div>
  );
}
