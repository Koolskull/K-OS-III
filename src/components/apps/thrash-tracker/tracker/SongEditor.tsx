/*
 *            ☦
 *      ╔══════════════╗
 *      ║  ST. AMBROSE ║
 *      ║  Patron of   ║
 *      ║  Composers   ║
 *      ╚══════════════╝
 *
 *   SONG EDITOR
 *   Arrangement grid: rows of chain references across 8 channels.
 *   Each cell holds a chain ID (hex) or -- (empty).
 *
 *   PLAYBACK MODES:
 *     SONG mode — plays rows sequentially, skipping empty cells per channel
 *     LIVE mode — chains loop when followed by empty rows (like LGPT/LSDj)
 *                 launch rows like Ableton scenes
 *
 *   Controls:
 *     Arrows       = move cursor
 *     Q + Up/Down  = change chain ID (coarse ±0x10)
 *     Q + Left/Right = change chain ID (fine ±1)
 *     Z / Enter    = place chain (next unused or 00)
 *     X / Delete   = clear cell
 *     Shift+W+L/R  = solo/mute channel under cursor
 */

"use client";

import React, { useRef, useLayoutEffect } from "react";
import type { Song } from "@/types/tracker";

export const SONG_COL_COUNT = 8; // 8 channels

interface SongEditorProps {
  song: Song;
  activeRow: number;
  activeCol: number; // channel index 0-7
  playbackRow: number; // current playback row (-1 if stopped)
  playMode: "song" | "live";
  mutedChannels: Set<number>;
  soloedChannels: Set<number>;
  onRowSelect: (row: number) => void;
  onColSelect: (col: number) => void;
}

const ROW_HEIGHT = 18;
const ROW_NUM_CHARS = 2;

function toHex(value: number | null | undefined, digits = 2): string {
  if (value === null || value === undefined) return "--";
  return value.toString(16).toUpperCase().padStart(digits, "0");
}

function SongRowComponent({
  row,
  index,
  channels,
  isActiveRow,
  isPlaybackRow,
  activeCol,
  mutedChannels,
  soloedChannels,
  onClickCell,
}: {
  row: Song["rows"][number];
  index: number;
  channels: number;
  isActiveRow: boolean;
  isPlaybackRow: boolean;
  activeCol: number;
  mutedChannels: Set<number>;
  soloedChannels: Set<number>;
  onClickCell: (col: number) => void;
}) {
  const hasAnyData = row.chains.some((c) => c !== null);

  return (
    <div
      className="flex px-1 items-center"
      style={{
        height: `${ROW_HEIGHT}px`,
        gap: "0.5ch",
        backgroundColor: isPlaybackRow ? "#0a0a00" : "transparent",
      }}
    >
      {/* Row number */}
      <span style={{
        width: `${ROW_NUM_CHARS}ch`,
        color: isPlaybackRow ? "#aaaa00" : isActiveRow ? "#888888" : "#444444",
      }}>
        {toHex(index)}
      </span>

      {/* Chain cells per channel */}
      {Array.from({ length: channels }, (_, ch) => {
        const chainId = row.chains[ch] ?? null;
        const isCursor = isActiveRow && ch === activeCol;
        const isMuted = mutedChannels.has(ch);
        const isSoloed = soloedChannels.has(ch);

        let color = "#555555";
        if (chainId !== null) {
          color = isActiveRow || hasAnyData ? "#ffffff" : "#888888";
        }
        if (isMuted) color = "#331111";
        if (isSoloed && chainId !== null) color = "#aaaa00";

        return (
          <span
            key={ch}
            className="cursor-pointer"
            style={{
              width: "2ch",
              textAlign: "center",
              color: isCursor ? "#000000" : color,
              backgroundColor: isCursor ? "#ffffff" : "transparent",
              ...(isActiveRow && !isCursor ? { backgroundColor: "#0a0a0a" } : {}),
              ...(isPlaybackRow && !isCursor && !isActiveRow ? { backgroundColor: "#0a0a00" } : {}),
            }}
            onClick={() => onClickCell(ch)}
          >
            {toHex(chainId)}
          </span>
        );
      })}
    </div>
  );
}

export function SongEditor({
  song,
  activeRow,
  activeCol,
  playbackRow,
  playMode,
  mutedChannels,
  soloedChannels,
  onRowSelect,
  onColSelect,
}: SongEditorProps) {
  const viewportRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    const viewport = viewportRef.current;
    const track = trackRef.current;
    if (!viewport || !track) return;
    const viewportHeight = viewport.clientHeight;
    const offset = activeRow * ROW_HEIGHT - viewportHeight / 2 + ROW_HEIGHT / 2;
    track.style.transform = `translateY(${-offset}px)`;
  }, [activeRow, song.rows.length]);

  return (
    <div
      className="select-none h-full flex flex-col"
      style={{
        fontFamily: "var(--dm-font-primary)",
        fontSize: "10px",
        imageRendering: "pixelated",
      }}
    >
      {/* Column headers — channel numbers */}
      <div
        className="flex px-1 border-b items-center flex-shrink-0"
        style={{
          borderColor: "#333333",
          backgroundColor: "#000000",
          height: "20px",
          gap: "0.5ch",
        }}
      >
        <span style={{ width: `${ROW_NUM_CHARS}ch`, color: "#555555" }}>#</span>
        {Array.from({ length: song.channels }, (_, ch) => {
          const isMuted = mutedChannels.has(ch);
          const isSoloed = soloedChannels.has(ch);
          return (
            <span
              key={ch}
              style={{
                width: "2ch",
                textAlign: "center",
                color: isSoloed ? "#aaaa00" : isMuted ? "#331111" : ch === activeCol ? "#ffffff" : "#555555",
              }}
            >
              {ch.toString(16).toUpperCase()}{isMuted ? "M" : isSoloed ? "S" : ""}
            </span>
          );
        })}
      </div>

      {/* Scrolling viewport */}
      <div
        ref={viewportRef}
        className="flex-1 relative overflow-hidden"
      >
        {/* Center-line */}
        <div
          className="absolute left-0 right-0 pointer-events-none"
          style={{
            top: "50%",
            height: `${ROW_HEIGHT}px`,
            marginTop: `${-ROW_HEIGHT / 2}px`,
            borderTop: "1px solid #333333",
            borderBottom: "1px solid #333333",
            zIndex: 3,
          }}
        />

        <div ref={trackRef} style={{ willChange: "transform" }}>
          {song.rows.map((row, i) => (
            <SongRowComponent
              key={i}
              row={row}
              index={i}
              channels={song.channels}
              isActiveRow={i === activeRow}
              isPlaybackRow={i === playbackRow}
              activeCol={activeCol}
              mutedChannels={mutedChannels}
              soloedChannels={soloedChannels}
              onClickCell={(col) => {
                onRowSelect(i);
                onColSelect(col);
              }}
            />
          ))}
        </div>
      </div>

      {/* Bottom status */}
      <div
        className="flex-shrink-0 border-t px-1 flex items-center justify-between"
        style={{
          borderColor: "#333333",
          fontSize: "7px",
          color: "#555555",
          letterSpacing: "1px",
          height: "14px",
          lineHeight: "14px",
        }}
      >
        <span>ROW {toHex(activeRow)}/{toHex(song.rows.length - 1)}</span>
        <span style={{ color: playMode === "live" ? "#aaaa00" : "#555555" }}>
          {playMode === "live" ? "LIVE" : "SONG"}
        </span>
        <span>CH:{activeCol.toString(16).toUpperCase()}</span>
      </div>
    </div>
  );
}
