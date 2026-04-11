/*
 *       ╔══════════════════════════╗
 *       ║  PICOTRACKER             ║
 *       ║  ──────────────────────  ║
 *       ║  RP2040 MUSIC TRACKER   ║
 *       ║  EMULATED FOR K-OS III  ║
 *       ╚══════════════════════════╝
 *
 *   PicoTracker: 8-channel tracker inspired by LittleGPTracker.
 *   Data hierarchy: Song → Chain → Phrase → Table
 *
 *   K-OS controls:
 *     ARROWS  → Navigate cursor
 *     Q       → NAV modifier (Q+Arrow = change screen)
 *     W       → EDIT / enter value
 *     SPACE   → PLAY / STOP
 *     SHIFT   → ALT modifier (selection, tempo nudge)
 *     ESC     → Back / exit
 *
 *   Screen hierarchy (left→right):
 *     Project ← Song → Chain → Phrase → Table
 *                 ↓
 *              Mixer
 */

"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";

// ── Types ──

type ViewType =
  | "project"
  | "song"
  | "chain"
  | "phrase"
  | "table"
  | "instrument"
  | "groove"
  | "mixer";

interface CursorPos {
  row: number;
  col: number;
}

// ── Constants ──

const SONG_ROWS = 64;
const SONG_CHANNELS = 8;
const CHAIN_ROWS = 16;
const PHRASE_ROWS = 16;
const TABLE_ROWS = 16;
const INSTRUMENT_COUNT = 32;
const GROOVE_ROWS = 16;

const EMPTY = 0xff;

const NOTE_NAMES = [
  "C-", "C#", "D-", "D#", "E-", "F-", "F#", "G-", "G#", "A-", "A#", "B-",
];

function noteToString(n: number): string {
  if (n === EMPTY) return "---";
  if (n === 0xfe) return "OFF";
  const octave = Math.floor(n / 12);
  const name = NOTE_NAMES[n % 12];
  return `${name}${octave}`;
}

function hexByte(v: number): string {
  if (v === EMPTY) return "--";
  return v.toString(16).toUpperCase().padStart(2, "0");
}

function hexWord(v: number): string {
  if (v === EMPTY) return "----";
  return v.toString(16).toUpperCase().padStart(4, "0");
}

// ── Data Model ──

function createSongData(): number[][] {
  return Array.from({ length: SONG_ROWS }, () =>
    Array(SONG_CHANNELS).fill(EMPTY),
  );
}

function createChainData(): { phrase: number; transpose: number }[] {
  return Array.from({ length: CHAIN_ROWS }, () => ({
    phrase: EMPTY,
    transpose: 0,
  }));
}

function createPhraseData(): {
  note: number;
  instr: number;
  cmd1: string;
  val1: number;
  cmd2: string;
  val2: number;
}[] {
  return Array.from({ length: PHRASE_ROWS }, () => ({
    note: EMPTY,
    instr: EMPTY,
    cmd1: "----",
    val1: EMPTY,
    cmd2: "----",
    val2: EMPTY,
  }));
}

function createTableData(): {
  cmd1: string;
  val1: number;
  cmd2: string;
  val2: number;
  cmd3: string;
  val3: number;
}[] {
  return Array.from({ length: TABLE_ROWS }, () => ({
    cmd1: "----",
    val1: EMPTY,
    cmd2: "----",
    val2: EMPTY,
    cmd3: "----",
    val3: EMPTY,
  }));
}

interface InstrumentData {
  name: string;
  type: "SAMPLE" | "MIDI" | "NONE";
  volume: number;
  pan: number;
  filterCut: number;
  filterRes: number;
  table: number;
}

function createInstrument(i: number): InstrumentData {
  return {
    name: `INSTR ${hexByte(i)}`,
    type: "NONE",
    volume: 0x80,
    pan: 0x80,
    filterCut: 0xff,
    filterRes: 0x00,
    table: EMPTY,
  };
}

interface ProjectSettings {
  tempo: number;
  masterVolume: number;
  transpose: number;
  scale: string;
  wrap: boolean;
}

// ── Color Scheme (PicoTracker-inspired) ──

const COLORS = {
  bg: "#000000",
  fg: "#ffffff",
  dim: "#555555",
  cursor: "#ffffff",
  cursorBg: "#333333",
  header: "#888888",
  rowNum: "#555555",
  playing: "#aaaaaa",
  muted: "#333333",
  border: "#1a1a1a",
  highlight: "#111111",
};

// ── Main Component ──

export function PicoTrackerApp({ isFocused }: { isFocused: boolean }) {
  // Data state
  const [songData] = useState(() => createSongData());
  const [chains] = useState<Map<number, ReturnType<typeof createChainData>>>(
    () => new Map(),
  );
  const [phrases] = useState<Map<number, ReturnType<typeof createPhraseData>>>(
    () => new Map(),
  );
  const [tables] = useState<Map<number, ReturnType<typeof createTableData>>>(
    () => new Map(),
  );
  const [instruments] = useState(() =>
    Array.from({ length: INSTRUMENT_COUNT }, (_, i) => createInstrument(i)),
  );
  const [projectSettings] = useState<ProjectSettings>({
    tempo: 120,
    masterVolume: 100,
    transpose: 0,
    scale: "CHROMATIC",
    wrap: false,
  });
  const [grooveData] = useState(() =>
    Array.from({ length: GROOVE_ROWS }, () => ({ tick1: 6, tick2: 6 })),
  );

  // Navigation state
  const [view, setView] = useState<ViewType>("song");
  const [cursor, setCursor] = useState<CursorPos>({ row: 0, col: 0 });
  const [scroll, setScroll] = useState(0);
  const [currentChain, setCurrentChain] = useState(0);
  const [currentPhrase, setCurrentPhrase] = useState(0);
  const [currentTable, setCurrentTable] = useState(0);
  const [currentInstrument, setCurrentInstrument] = useState(0);
  const [currentChannel, setCurrentChannel] = useState(0);
  const [channelMutes, setChannelMutes] = useState<boolean[]>(
    Array(SONG_CHANNELS).fill(false),
  );
  const [channelVolumes] = useState<number[]>(Array(SONG_CHANNELS).fill(100));

  // Playback state
  const [playing, setPlaying] = useState(false);
  const [playMode, setPlayMode] = useState<"SONG" | "LIVE">("SONG");
  const [playRow, setPlayRow] = useState(0);

  // Edit state
  const [editing, setEditing] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);

  // Focus management
  useEffect(() => {
    if (isFocused && containerRef.current) {
      containerRef.current.focus();
    }
  }, [isFocused]);

  // Max visible rows for each view
  const visibleRows = useCallback(
    (v: ViewType) => {
      switch (v) {
        case "song":
          return 16;
        case "chain":
        case "phrase":
        case "table":
        case "groove":
          return 16;
        default:
          return 16;
      }
    },
    [],
  );

  // Max columns for cursor
  const maxCols = useCallback(
    (v: ViewType) => {
      switch (v) {
        case "song":
          return SONG_CHANNELS - 1;
        case "chain":
          return 1; // phrase, transpose
        case "phrase":
          return 5; // note, instr, cmd1, val1, cmd2, val2
        case "table":
          return 5; // cmd1, val1, cmd2, val2, cmd3, val3
        case "instrument":
          return 0;
        case "project":
          return 0;
        case "mixer":
          return SONG_CHANNELS - 1;
        case "groove":
          return 1;
        default:
          return 0;
      }
    },
    [],
  );

  const maxRows = useCallback(
    (v: ViewType) => {
      switch (v) {
        case "song":
          return SONG_ROWS - 1;
        case "chain":
          return CHAIN_ROWS - 1;
        case "phrase":
          return PHRASE_ROWS - 1;
        case "table":
          return TABLE_ROWS - 1;
        case "instrument":
          return 6; // number of editable fields
        case "project":
          return 4;
        case "mixer":
          return 1; // volume row + mute row
        case "groove":
          return GROOVE_ROWS - 1;
        default:
          return 0;
      }
    },
    [],
  );

  // Ensure chain/phrase/table data exists
  const getChain = useCallback(
    (id: number) => {
      if (!chains.has(id)) {
        chains.set(id, createChainData());
      }
      return chains.get(id)!;
    },
    [chains],
  );

  const getPhrase = useCallback(
    (id: number) => {
      if (!phrases.has(id)) {
        phrases.set(id, createPhraseData());
      }
      return phrases.get(id)!;
    },
    [phrases],
  );

  const getTable = useCallback(
    (id: number) => {
      if (!tables.has(id)) {
        tables.set(id, createTableData());
      }
      return tables.get(id)!;
    },
    [tables],
  );

  // Value editing (Q + arrow to change values)
  const changeValue = useCallback(
    (delta: number) => {
      if (view === "song") {
        const val = songData[cursor.row][cursor.col];
        if (val === EMPTY) {
          songData[cursor.row][cursor.col] = 0;
        } else {
          songData[cursor.row][cursor.col] = Math.max(
            0,
            Math.min(0xfe, val + delta),
          );
        }
      } else if (view === "chain") {
        const chain = getChain(currentChain);
        if (cursor.col === 0) {
          const val = chain[cursor.row].phrase;
          if (val === EMPTY) {
            chain[cursor.row].phrase = 0;
          } else {
            chain[cursor.row].phrase = Math.max(
              0,
              Math.min(0xfe, val + delta),
            );
          }
        } else {
          chain[cursor.row].transpose = Math.max(
            -12,
            Math.min(12, chain[cursor.row].transpose + delta),
          );
        }
      } else if (view === "phrase") {
        const phrase = getPhrase(currentPhrase);
        const step = phrase[cursor.row];
        if (cursor.col === 0) {
          // Note
          if (step.note === EMPTY) {
            step.note = 60; // Middle C
          } else if (step.note === 0xfe) {
            // OFF stays OFF
          } else {
            step.note = Math.max(0, Math.min(119, step.note + delta));
          }
        } else if (cursor.col === 1) {
          // Instrument
          if (step.instr === EMPTY) {
            step.instr = 0;
          } else {
            step.instr = Math.max(
              0,
              Math.min(INSTRUMENT_COUNT - 1, step.instr + delta),
            );
          }
        }
      } else if (view === "project") {
        if (cursor.row === 0) {
          projectSettings.tempo = Math.max(
            40,
            Math.min(300, projectSettings.tempo + delta),
          );
        } else if (cursor.row === 1) {
          projectSettings.masterVolume = Math.max(
            0,
            Math.min(200, projectSettings.masterVolume + delta),
          );
        } else if (cursor.row === 2) {
          projectSettings.transpose = Math.max(
            -12,
            Math.min(12, projectSettings.transpose + delta),
          );
        }
      } else if (view === "mixer") {
        channelVolumes[cursor.col] = Math.max(
          0,
          Math.min(200, channelVolumes[cursor.col] + delta),
        );
      }
    },
    [
      view,
      cursor,
      songData,
      currentChain,
      currentPhrase,
      getChain,
      getPhrase,
      projectSettings,
      channelVolumes,
    ],
  );

  // Navigate to deeper view based on value under cursor
  const navigateRight = useCallback(() => {
    if (view === "song") {
      const val = songData[cursor.row][cursor.col];
      if (val !== EMPTY) {
        setCurrentChain(val);
        setCurrentChannel(cursor.col);
        setView("chain");
        setCursor({ row: 0, col: 0 });
        setScroll(0);
      }
    } else if (view === "chain") {
      const chain = getChain(currentChain);
      const val = chain[cursor.row].phrase;
      if (val !== EMPTY) {
        setCurrentPhrase(val);
        setView("phrase");
        setCursor({ row: 0, col: 0 });
        setScroll(0);
      }
    } else if (view === "phrase") {
      // Navigate to instrument or table
      const phrase = getPhrase(currentPhrase);
      const step = phrase[cursor.row];
      if (cursor.col === 1 && step.instr !== EMPTY) {
        setCurrentInstrument(step.instr);
        setView("instrument");
        setCursor({ row: 0, col: 0 });
        setScroll(0);
      }
    }
  }, [view, cursor, songData, currentChain, currentPhrase, getChain, getPhrase]);

  const navigateLeft = useCallback(() => {
    if (view === "chain") {
      setView("song");
      setCursor({ row: 0, col: currentChannel });
      setScroll(0);
    } else if (view === "phrase") {
      setView("chain");
      setCursor({ row: 0, col: 0 });
      setScroll(0);
    } else if (view === "table") {
      setView("phrase");
      setCursor({ row: 0, col: 0 });
      setScroll(0);
    } else if (view === "instrument") {
      setView("phrase");
      setCursor({ row: 0, col: 1 });
      setScroll(0);
    }
  }, [view, currentChannel]);

  // Keyboard handler
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (!isFocused) return;

      const shift = e.shiftKey;
      const q = e.code === "KeyQ";

      // Q + Arrow = navigate screens / change values
      if (e.code === "KeyQ") {
        // Q alone does nothing, it's a modifier
        e.preventDefault();
        return;
      }

      let handled = true;

      switch (e.code) {
        // Navigation
        case "ArrowUp":
          if (shift) {
            // Q held via shift? No - Shift+Arrow = page scroll
            setCursor((c) => ({
              ...c,
              row: Math.max(0, c.row - 8),
            }));
          } else {
            setCursor((c) => ({
              ...c,
              row: Math.max(0, c.row - 1),
            }));
          }
          break;
        case "ArrowDown":
          if (shift) {
            setCursor((c) => ({
              ...c,
              row: Math.min(maxRows(view), c.row + 8),
            }));
          } else {
            setCursor((c) => ({
              ...c,
              row: Math.min(maxRows(view), c.row + 1),
            }));
          }
          break;
        case "ArrowLeft":
          if (shift) {
            // Shift+Left = tempo nudge down (visual only)
          } else {
            setCursor((c) => ({
              ...c,
              col: Math.max(0, c.col - 1),
            }));
          }
          break;
        case "ArrowRight":
          if (shift) {
            // Shift+Right = tempo nudge up
          } else {
            setCursor((c) => ({
              ...c,
              col: Math.min(maxCols(view), c.col + 1),
            }));
          }
          break;

        // W = Edit / Enter value / step increment
        case "KeyW":
          if (shift) {
            // Shift+W = insert note off in phrase
            if (view === "phrase") {
              const phrase = getPhrase(currentPhrase);
              phrase[cursor.row].note = 0xfe;
            }
          } else {
            // W = increment value by 1 (like ENTER on picotracker)
            changeValue(1);
          }
          break;

        // Space = Play/Stop
        case "Space":
          if (shift) {
            // Shift+Space = toggle play mode
            setPlayMode((m) => (m === "SONG" ? "LIVE" : "SONG"));
          } else {
            setPlaying((p) => !p);
            if (!playing) {
              setPlayRow(cursor.row);
            }
          }
          break;

        // Escape = navigate back / exit
        case "Escape":
          if (view === "song") {
            setView("project");
            setCursor({ row: 0, col: 0 });
          } else {
            navigateLeft();
          }
          break;

        // Enter = navigate deeper
        case "Enter":
          navigateRight();
          break;

        // Q-modifier combos detected via held state
        // For now, use number keys for direct screen access
        case "Digit1":
          setView("song");
          setCursor({ row: 0, col: 0 });
          setScroll(0);
          break;
        case "Digit2":
          setView("chain");
          setCursor({ row: 0, col: 0 });
          setScroll(0);
          break;
        case "Digit3":
          setView("phrase");
          setCursor({ row: 0, col: 0 });
          setScroll(0);
          break;
        case "Digit4":
          setView("table");
          setCursor({ row: 0, col: 0 });
          setScroll(0);
          break;
        case "Digit5":
          setView("instrument");
          setCursor({ row: 0, col: 0 });
          setScroll(0);
          break;
        case "Digit6":
          setView("project");
          setCursor({ row: 0, col: 0 });
          setScroll(0);
          break;
        case "Digit7":
          setView("groove");
          setCursor({ row: 0, col: 0 });
          setScroll(0);
          break;
        case "Digit8":
          setView("mixer");
          setCursor({ row: 0, col: 0 });
          setScroll(0);
          break;

        // Delete / Backspace = clear value
        case "Backspace":
        case "Delete":
          if (view === "song") {
            songData[cursor.row][cursor.col] = EMPTY;
          } else if (view === "chain") {
            const chain = getChain(currentChain);
            if (cursor.col === 0) chain[cursor.row].phrase = EMPTY;
            else chain[cursor.row].transpose = 0;
          } else if (view === "phrase") {
            const phrase = getPhrase(currentPhrase);
            const step = phrase[cursor.row];
            if (cursor.col === 0) step.note = EMPTY;
            else if (cursor.col === 1) step.instr = EMPTY;
          }
          break;

        // M = mute channel (in song/mixer)
        case "KeyM":
          if (view === "song" || view === "mixer") {
            const ch = view === "mixer" ? cursor.col : cursor.col;
            setChannelMutes((prev) => {
              const next = [...prev];
              next[ch] = !next[ch];
              return next;
            });
          }
          break;

        default:
          handled = false;
      }

      if (handled) {
        e.preventDefault();
        e.stopPropagation();
      }
    },
    [
      isFocused,
      view,
      cursor,
      playing,
      maxRows,
      maxCols,
      changeValue,
      navigateRight,
      navigateLeft,
      songData,
      currentChain,
      currentPhrase,
      getChain,
      getPhrase,
    ],
  );

  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown, true);
    return () => window.removeEventListener("keydown", handleKeyDown, true);
  }, [handleKeyDown]);

  // Playback animation
  useEffect(() => {
    if (!playing) return;
    const interval = setInterval(() => {
      setPlayRow((r) => {
        const max =
          view === "song" ? SONG_ROWS - 1 : view === "chain" ? 15 : 15;
        return r >= max ? 0 : r + 1;
      });
    }, (60000 / projectSettings.tempo / 4) | 0);
    return () => clearInterval(interval);
  }, [playing, projectSettings.tempo, view]);

  // ── Renderers ──

  const renderHeader = () => (
    <div
      className="flex items-center justify-between px-2 py-0.5 border-b-2 flex-shrink-0"
      style={{
        borderColor: COLORS.border,
        backgroundColor: COLORS.bg,
        minHeight: "20px",
      }}
    >
      <span
        style={{
          fontSize: "9px",
          color: COLORS.fg,
          letterSpacing: "2px",
        }}
      >
        PICOTRACKER
      </span>
      <span
        style={{
          fontSize: "8px",
          color: COLORS.dim,
          letterSpacing: "1px",
        }}
      >
        {view.toUpperCase()}
        {view === "chain" && ` ${hexByte(currentChain)}`}
        {view === "phrase" && ` ${hexByte(currentPhrase)}`}
        {view === "table" && ` ${hexByte(currentTable)}`}
        {view === "instrument" && ` ${hexByte(currentInstrument)}`}
      </span>
      <span
        style={{
          fontSize: "8px",
          color: playing ? COLORS.fg : COLORS.dim,
          letterSpacing: "1px",
        }}
      >
        {playing ? "▶" : "■"} {playMode} BPM:{projectSettings.tempo}
      </span>
    </div>
  );

  const renderFooter = () => {
    const hints: Record<ViewType, string> = {
      song: "ARROWS:NAV  W:EDIT  ENTER:CHAIN  SPACE:PLAY  M:MUTE",
      chain: "ARROWS:NAV  W:EDIT  ENTER:PHRASE  ESC:SONG",
      phrase: "ARROWS:NAV  W:EDIT  ENTER:INSTR  ESC:CHAIN",
      table: "ARROWS:NAV  W:EDIT  ESC:PHRASE",
      instrument: "ARROWS:NAV  W:EDIT  ESC:BACK",
      project: "ARROWS:NAV  W:EDIT  1-8:SCREENS",
      mixer: "ARROWS:NAV  W:EDIT  M:MUTE  ESC:SONG",
      groove: "ARROWS:NAV  W:EDIT  ESC:BACK",
    };

    return (
      <div
        className="flex items-center justify-between px-2 py-1 border-t-2 flex-shrink-0"
        style={{
          borderColor: COLORS.border,
          backgroundColor: COLORS.bg,
          minHeight: "24px",
        }}
      >
        <span
          style={{
            fontSize: "7px",
            color: COLORS.dim,
            letterSpacing: "1px",
          }}
        >
          {hints[view]}
        </span>
        <span
          style={{
            fontSize: "7px",
            color: COLORS.dim,
            letterSpacing: "1px",
          }}
        >
          CH:{currentChannel} R:{hexByte(cursor.row)}
        </span>
      </div>
    );
  };

  const cellStyle = (
    isActive: boolean,
    isPlaying: boolean,
    isMuted: boolean,
  ): React.CSSProperties => ({
    backgroundColor: isActive ? COLORS.cursorBg : "transparent",
    color: isMuted
      ? COLORS.muted
      : isPlaying
        ? COLORS.playing
        : isActive
          ? COLORS.cursor
          : COLORS.dim,
    padding: "0 3px",
    display: "inline-block",
    minWidth: "24px",
    textAlign: "center",
  });

  const renderSong = () => {
    const startRow = Math.max(
      0,
      Math.min(cursor.row - 8, SONG_ROWS - 16),
    );
    const rows = [];

    // Column headers
    rows.push(
      <div key="header" className="flex" style={{ marginBottom: "2px" }}>
        <span
          style={{
            color: COLORS.header,
            width: "24px",
            display: "inline-block",
            textAlign: "right",
            marginRight: "4px",
            fontSize: "8px",
          }}
        >
          {"  "}
        </span>
        {Array.from({ length: SONG_CHANNELS }, (_, ch) => (
          <span
            key={ch}
            style={{
              color: channelMutes[ch] ? COLORS.muted : COLORS.header,
              width: "30px",
              display: "inline-block",
              textAlign: "center",
              fontSize: "8px",
            }}
          >
            {channelMutes[ch] ? "×" : `${ch}`}
          </span>
        ))}
      </div>,
    );

    for (let i = 0; i < 16 && startRow + i < SONG_ROWS; i++) {
      const row = startRow + i;
      const isPlayingRow = playing && row === playRow;

      rows.push(
        <div key={row} className="flex" style={{ lineHeight: "14px" }}>
          <span
            style={{
              color: isPlayingRow ? COLORS.fg : COLORS.rowNum,
              width: "24px",
              display: "inline-block",
              textAlign: "right",
              marginRight: "4px",
            }}
          >
            {hexByte(row)}
          </span>
          {Array.from({ length: SONG_CHANNELS }, (_, ch) => {
            const val = songData[row][ch];
            const isActive = cursor.row === row && cursor.col === ch;
            return (
              <span
                key={ch}
                style={{
                  ...cellStyle(isActive, isPlayingRow, channelMutes[ch]),
                  width: "30px",
                }}
              >
                {hexByte(val)}
              </span>
            );
          })}
        </div>,
      );
    }

    return rows;
  };

  const renderChain = () => {
    const chain = getChain(currentChain);
    const rows = [];

    rows.push(
      <div key="header" className="flex" style={{ marginBottom: "2px" }}>
        <span
          style={{
            color: COLORS.header,
            width: "24px",
            display: "inline-block",
            textAlign: "right",
            marginRight: "4px",
            fontSize: "8px",
          }}
        >
          {"  "}
        </span>
        <span
          style={{
            color: COLORS.header,
            width: "30px",
            display: "inline-block",
            textAlign: "center",
            fontSize: "8px",
          }}
        >
          PHR
        </span>
        <span
          style={{
            color: COLORS.header,
            width: "30px",
            display: "inline-block",
            textAlign: "center",
            fontSize: "8px",
          }}
        >
          TSP
        </span>
      </div>,
    );

    for (let row = 0; row < CHAIN_ROWS; row++) {
      const step = chain[row];
      const isPlayingRow = playing && row === playRow % CHAIN_ROWS;
      const isActive0 = cursor.row === row && cursor.col === 0;
      const isActive1 = cursor.row === row && cursor.col === 1;

      rows.push(
        <div key={row} className="flex" style={{ lineHeight: "14px" }}>
          <span
            style={{
              color: isPlayingRow ? COLORS.fg : COLORS.rowNum,
              width: "24px",
              display: "inline-block",
              textAlign: "right",
              marginRight: "4px",
            }}
          >
            {hexByte(row)}
          </span>
          <span style={{ ...cellStyle(isActive0, isPlayingRow, false), width: "30px" }}>
            {hexByte(step.phrase)}
          </span>
          <span style={{ ...cellStyle(isActive1, isPlayingRow, false), width: "30px" }}>
            {step.transpose >= 0
              ? `+${step.transpose.toString().padStart(2, "0")}`
              : `${step.transpose.toString().padStart(3, " ")}`}
          </span>
        </div>,
      );
    }

    return rows;
  };

  const renderPhrase = () => {
    const phrase = getPhrase(currentPhrase);
    const rows = [];

    rows.push(
      <div key="header" className="flex" style={{ marginBottom: "2px" }}>
        <span
          style={{
            color: COLORS.header,
            width: "24px",
            display: "inline-block",
            textAlign: "right",
            marginRight: "4px",
            fontSize: "8px",
          }}
        >
          {"  "}
        </span>
        {["NOTE", "INS", "CMD", "VAL", "CMD", "VAL"].map((h, i) => (
          <span
            key={i}
            style={{
              color: COLORS.header,
              width: i === 0 ? "36px" : "30px",
              display: "inline-block",
              textAlign: "center",
              fontSize: "8px",
            }}
          >
            {h}
          </span>
        ))}
      </div>,
    );

    for (let row = 0; row < PHRASE_ROWS; row++) {
      const step = phrase[row];
      const isPlayingRow = playing && row === playRow % PHRASE_ROWS;

      rows.push(
        <div key={row} className="flex" style={{ lineHeight: "14px" }}>
          <span
            style={{
              color: isPlayingRow ? COLORS.fg : COLORS.rowNum,
              width: "24px",
              display: "inline-block",
              textAlign: "right",
              marginRight: "4px",
            }}
          >
            {hexByte(row)}
          </span>
          <span
            style={{
              ...cellStyle(cursor.row === row && cursor.col === 0, isPlayingRow, false),
              width: "36px",
            }}
          >
            {noteToString(step.note)}
          </span>
          <span
            style={{
              ...cellStyle(cursor.row === row && cursor.col === 1, isPlayingRow, false),
              width: "30px",
            }}
          >
            {hexByte(step.instr)}
          </span>
          <span
            style={{
              ...cellStyle(cursor.row === row && cursor.col === 2, isPlayingRow, false),
              width: "30px",
            }}
          >
            {step.cmd1 === "----" ? "--" : step.cmd1.slice(0, 2)}
          </span>
          <span
            style={{
              ...cellStyle(cursor.row === row && cursor.col === 3, isPlayingRow, false),
              width: "30px",
            }}
          >
            {hexByte(step.val1)}
          </span>
          <span
            style={{
              ...cellStyle(cursor.row === row && cursor.col === 4, isPlayingRow, false),
              width: "30px",
            }}
          >
            {step.cmd2 === "----" ? "--" : step.cmd2.slice(0, 2)}
          </span>
          <span
            style={{
              ...cellStyle(cursor.row === row && cursor.col === 5, isPlayingRow, false),
              width: "30px",
            }}
          >
            {hexByte(step.val2)}
          </span>
        </div>,
      );
    }

    return rows;
  };

  const renderTable = () => {
    const table = getTable(currentTable);
    const rows = [];

    rows.push(
      <div key="header" className="flex" style={{ marginBottom: "2px" }}>
        <span
          style={{
            color: COLORS.header,
            width: "24px",
            display: "inline-block",
            textAlign: "right",
            marginRight: "4px",
            fontSize: "8px",
          }}
        >
          {"  "}
        </span>
        {["CMD", "VAL", "CMD", "VAL", "CMD", "VAL"].map((h, i) => (
          <span
            key={i}
            style={{
              color: COLORS.header,
              width: "30px",
              display: "inline-block",
              textAlign: "center",
              fontSize: "8px",
            }}
          >
            {h}
          </span>
        ))}
      </div>,
    );

    for (let row = 0; row < TABLE_ROWS; row++) {
      const step = table[row];
      const isPlayingRow = playing && row === playRow % TABLE_ROWS;

      rows.push(
        <div key={row} className="flex" style={{ lineHeight: "14px" }}>
          <span
            style={{
              color: isPlayingRow ? COLORS.fg : COLORS.rowNum,
              width: "24px",
              display: "inline-block",
              textAlign: "right",
              marginRight: "4px",
            }}
          >
            {hexByte(row)}
          </span>
          {[
            { cmd: step.cmd1, val: step.val1 },
            { cmd: step.cmd2, val: step.val2 },
            { cmd: step.cmd3, val: step.val3 },
          ].map((pair, pi) => (
            <React.Fragment key={pi}>
              <span
                style={{
                  ...cellStyle(
                    cursor.row === row && cursor.col === pi * 2,
                    isPlayingRow,
                    false,
                  ),
                  width: "30px",
                }}
              >
                {pair.cmd === "----" ? "--" : pair.cmd.slice(0, 2)}
              </span>
              <span
                style={{
                  ...cellStyle(
                    cursor.row === row && cursor.col === pi * 2 + 1,
                    isPlayingRow,
                    false,
                  ),
                  width: "30px",
                }}
              >
                {hexByte(pair.val)}
              </span>
            </React.Fragment>
          ))}
        </div>,
      );
    }

    return rows;
  };

  const renderInstrument = () => {
    const instr = instruments[currentInstrument];
    const fields = [
      { label: "NAME", value: instr.name },
      { label: "TYPE", value: instr.type },
      { label: "VOLUME", value: hexByte(instr.volume) },
      { label: "PAN", value: hexByte(instr.pan) },
      { label: "FILT CUT", value: hexByte(instr.filterCut) },
      { label: "FILT RES", value: hexByte(instr.filterRes) },
      { label: "TABLE", value: hexByte(instr.table) },
    ];

    return fields.map((f, i) => (
      <div
        key={i}
        className="flex"
        style={{
          lineHeight: "16px",
          backgroundColor: cursor.row === i ? COLORS.cursorBg : "transparent",
        }}
      >
        <span
          style={{
            color: COLORS.header,
            width: "80px",
            display: "inline-block",
          }}
        >
          {f.label}
        </span>
        <span
          style={{
            color: cursor.row === i ? COLORS.cursor : COLORS.dim,
          }}
        >
          {f.value}
        </span>
      </div>
    ));
  };

  const renderProject = () => {
    const fields = [
      { label: "TEMPO", value: `${projectSettings.tempo} BPM` },
      { label: "MASTER VOL", value: `${projectSettings.masterVolume}%` },
      { label: "TRANSPOSE", value: `${projectSettings.transpose >= 0 ? "+" : ""}${projectSettings.transpose}` },
      { label: "SCALE", value: projectSettings.scale },
      { label: "WRAP", value: projectSettings.wrap ? "ON" : "OFF" },
    ];

    return (
      <>
        <div
          style={{
            color: COLORS.header,
            fontSize: "9px",
            letterSpacing: "2px",
            marginBottom: "8px",
          }}
        >
          PROJECT SETTINGS
        </div>
        {fields.map((f, i) => (
          <div
            key={i}
            className="flex"
            style={{
              lineHeight: "16px",
              backgroundColor: cursor.row === i ? COLORS.cursorBg : "transparent",
            }}
          >
            <span
              style={{
                color: COLORS.header,
                width: "100px",
                display: "inline-block",
              }}
            >
              {f.label}
            </span>
            <span
              style={{
                color: cursor.row === i ? COLORS.cursor : COLORS.dim,
              }}
            >
              {f.value}
            </span>
          </div>
        ))}
      </>
    );
  };

  const renderMixer = () => {
    return (
      <>
        <div
          style={{
            color: COLORS.header,
            fontSize: "9px",
            letterSpacing: "2px",
            marginBottom: "8px",
          }}
        >
          MIXER
        </div>
        {/* Channel labels */}
        <div className="flex" style={{ marginBottom: "4px" }}>
          <span
            style={{
              width: "60px",
              display: "inline-block",
              color: COLORS.header,
            }}
          >
            {"  "}
          </span>
          {Array.from({ length: SONG_CHANNELS }, (_, ch) => (
            <span
              key={ch}
              style={{
                width: "30px",
                display: "inline-block",
                textAlign: "center",
                color: channelMutes[ch] ? COLORS.muted : COLORS.header,
                fontSize: "8px",
              }}
            >
              CH{ch}
            </span>
          ))}
        </div>
        {/* Volume row */}
        <div className="flex" style={{ lineHeight: "14px" }}>
          <span
            style={{
              width: "60px",
              display: "inline-block",
              color: COLORS.header,
            }}
          >
            VOL
          </span>
          {Array.from({ length: SONG_CHANNELS }, (_, ch) => (
            <span
              key={ch}
              style={{
                ...cellStyle(
                  cursor.row === 0 && cursor.col === ch,
                  false,
                  channelMutes[ch],
                ),
                width: "30px",
              }}
            >
              {channelVolumes[ch].toString().padStart(3, " ")}
            </span>
          ))}
        </div>
        {/* Mute row */}
        <div className="flex" style={{ lineHeight: "14px", marginTop: "2px" }}>
          <span
            style={{
              width: "60px",
              display: "inline-block",
              color: COLORS.header,
            }}
          >
            MUTE
          </span>
          {Array.from({ length: SONG_CHANNELS }, (_, ch) => (
            <span
              key={ch}
              style={{
                ...cellStyle(
                  cursor.row === 1 && cursor.col === ch,
                  false,
                  false,
                ),
                width: "30px",
                color: channelMutes[ch] ? "#ff5555" : COLORS.dim,
              }}
            >
              {channelMutes[ch] ? "M" : "-"}
            </span>
          ))}
        </div>
        {/* VU meters (visual) */}
        <div style={{ marginTop: "16px" }}>
          <div className="flex">
            <span
              style={{
                width: "60px",
                display: "inline-block",
                color: COLORS.header,
                fontSize: "8px",
              }}
            >
              LEVEL
            </span>
            {Array.from({ length: SONG_CHANNELS }, (_, ch) => {
              const level = channelMutes[ch] ? 0 : playing ? Math.random() * channelVolumes[ch] : 0;
              const bars = Math.floor(level / 10);
              return (
                <span
                  key={ch}
                  style={{
                    width: "30px",
                    display: "inline-block",
                    textAlign: "center",
                    color: level > 80 ? "#ffffff" : COLORS.dim,
                    fontSize: "8px",
                  }}
                >
                  {"█".repeat(Math.min(bars, 10))}
                </span>
              );
            })}
          </div>
        </div>
      </>
    );
  };

  const renderGroove = () => {
    const rows = [];

    rows.push(
      <div key="title" style={{ color: COLORS.header, fontSize: "9px", letterSpacing: "2px", marginBottom: "4px" }}>
        GROOVE
      </div>,
    );

    rows.push(
      <div key="header" className="flex" style={{ marginBottom: "2px" }}>
        <span style={{ color: COLORS.header, width: "24px", display: "inline-block", textAlign: "right", marginRight: "4px", fontSize: "8px" }}>
          {"  "}
        </span>
        <span style={{ color: COLORS.header, width: "30px", display: "inline-block", textAlign: "center", fontSize: "8px" }}>
          TK1
        </span>
        <span style={{ color: COLORS.header, width: "30px", display: "inline-block", textAlign: "center", fontSize: "8px" }}>
          TK2
        </span>
      </div>,
    );

    for (let row = 0; row < GROOVE_ROWS; row++) {
      const step = grooveData[row];
      rows.push(
        <div key={row} className="flex" style={{ lineHeight: "14px" }}>
          <span style={{ color: COLORS.rowNum, width: "24px", display: "inline-block", textAlign: "right", marginRight: "4px" }}>
            {hexByte(row)}
          </span>
          <span style={{ ...cellStyle(cursor.row === row && cursor.col === 0, false, false), width: "30px" }}>
            {hexByte(step.tick1)}
          </span>
          <span style={{ ...cellStyle(cursor.row === row && cursor.col === 1, false, false), width: "30px" }}>
            {hexByte(step.tick2)}
          </span>
        </div>,
      );
    }

    return rows;
  };

  const renderContent = () => {
    switch (view) {
      case "song":
        return renderSong();
      case "chain":
        return renderChain();
      case "phrase":
        return renderPhrase();
      case "table":
        return renderTable();
      case "instrument":
        return renderInstrument();
      case "project":
        return renderProject();
      case "mixer":
        return renderMixer();
      case "groove":
        return renderGroove();
    }
  };

  // Screen tab bar
  const renderTabs = () => {
    const tabs: { id: ViewType; label: string; key: string }[] = [
      { id: "project", label: "PRJ", key: "6" },
      { id: "song", label: "SNG", key: "1" },
      { id: "chain", label: "CHN", key: "2" },
      { id: "phrase", label: "PHR", key: "3" },
      { id: "table", label: "TBL", key: "4" },
      { id: "instrument", label: "INS", key: "5" },
      { id: "groove", label: "GRV", key: "7" },
      { id: "mixer", label: "MIX", key: "8" },
    ];

    return (
      <div
        className="flex items-center px-1 border-b flex-shrink-0"
        style={{
          borderColor: COLORS.border,
          backgroundColor: COLORS.bg,
          minHeight: "16px",
          gap: "1px",
        }}
      >
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => {
              setView(t.id);
              setCursor({ row: 0, col: 0 });
              setScroll(0);
            }}
            style={{
              backgroundColor: view === t.id ? "#222222" : "transparent",
              color: view === t.id ? COLORS.fg : COLORS.dim,
              border: "none",
              padding: "1px 4px",
              fontSize: "7px",
              fontFamily: "var(--dm-font-primary)",
              letterSpacing: "1px",
              cursor: "pointer",
            }}
          >
            {t.key}:{t.label}
          </button>
        ))}
      </div>
    );
  };

  return (
    <div
      ref={containerRef}
      className="w-full h-full flex flex-col overflow-hidden"
      style={{
        backgroundColor: COLORS.bg,
        fontFamily: "var(--dm-font-primary)",
        fontSize: "10px",
        imageRendering: "pixelated",
      }}
      tabIndex={0}
    >
      {renderHeader()}
      {renderTabs()}

      {/* Main content area */}
      <div
        className="flex-1 overflow-hidden p-2"
        style={{ fontFamily: "var(--dm-font-primary)", fontSize: "10px" }}
      >
        {renderContent()}
      </div>

      {renderFooter()}
    </div>
  );
}
