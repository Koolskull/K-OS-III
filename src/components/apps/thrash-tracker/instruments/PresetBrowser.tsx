/*
 *            ☦
 *      ╔══════════════════╗
 *      ║  ST. GENESIUS    ║
 *      ║  Patron of       ║
 *      ║  Musicians       ║
 *      ╚══════════════════╝
 *
 *   PRESET BROWSER
 *   Two-panel FM instrument preset loader.
 *   Left panel: game/bank list (TFI + GenMDM).
 *   Right panel: patches within selected bank.
 *
 *   Navigation:
 *     Up/Down = scroll bank or patch list
 *     Left/Right = switch panels
 *     Q (place) = load selected preset into instrument slot
 *     X/Delete = close browser
 */

"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import type { Instrument } from "@/types/tracker";
import { loadTFI } from "@/engine/instruments/TFIParser";
import { loadGenMDMBank } from "@/engine/instruments/GenMDMParser";
import { assetUrl } from "@/lib/assets";

const ROW_HEIGHT = 16;
const VISIBLE_ROWS = 20;

interface PresetBank {
  name: string;
  type: "tfi" | "genmdm";
  /** For TFI: game directory name. For GenMDM: filename */
  key: string;
}

interface PresetPatch {
  name: string;
  url: string;
  type: "tfi" | "genmdm";
  /** For GenMDM, the loaded instrument (from bank parse) */
  instrument?: Instrument;
}

interface PresetBrowserProps {
  onLoadPreset: (inst: Instrument) => void;
  onClose: () => void;
  currentInstrumentId: number;
}

export function PresetBrowser({ onLoadPreset, onClose, currentInstrumentId }: PresetBrowserProps) {
  const [banks, setBanks] = useState<PresetBank[]>([]);
  const [patches, setPatches] = useState<PresetPatch[]>([]);
  const [bankCursor, setBankCursor] = useState(0);
  const [patchCursor, setPatchCursor] = useState(0);
  const [activePanel, setActivePanel] = useState<"bank" | "patch">("bank");
  const [loading, setLoading] = useState(false);
  const bankScrollRef = useRef(0);
  const patchScrollRef = useRef(0);
  const tfmManifestRef = useRef<Record<string, string[]>>({});

  // Load manifests on mount
  useEffect(() => {
    Promise.all([
      fetch(assetUrl("/Instruments/genmdm-manifest.json")).then((r) => r.json()).catch(() => []),
      fetch(assetUrl("/Instruments/tfm-manifest.json")).then((r) => r.json()).catch(() => ({})),
    ]).then(([genmdmFiles, tfmManifest]: [string[], Record<string, string[]>]) => {
      tfmManifestRef.current = tfmManifest;
      const allBanks: PresetBank[] = [];

      // GenMDM banks
      for (const file of genmdmFiles) {
        allBanks.push({
          name: file.replace(/\.genm$/, ""),
          type: "genmdm",
          key: file,
        });
      }

      // TFI game folders
      for (const game of Object.keys(tfmManifest).sort()) {
        allBanks.push({
          name: game,
          type: "tfi",
          key: game,
        });
      }

      // Sort all banks alphabetically
      allBanks.sort((a, b) => a.name.localeCompare(b.name));
      setBanks(allBanks);
    });
  }, []);

  // Load patches when bank cursor changes
  useEffect(() => {
    const bank = banks[bankCursor];
    if (!bank) return;

    setLoading(true);
    setPatchCursor(0);
    patchScrollRef.current = 0;

    if (bank.type === "genmdm") {
      loadGenMDMBank(assetUrl(`/Instruments/GenMDM/${bank.key}`), 0).then((instruments) => {
        setPatches(
          instruments.map((inst) => ({
            name: inst.name,
            url: "",
            type: "genmdm" as const,
            instrument: inst,
          })),
        );
        setLoading(false);
      });
    } else {
      // TFI: use cached manifest
      const files = tfmManifestRef.current[bank.key] ?? [];
      setPatches(
        files.map((f) => ({
          name: f.replace(/\.tfi$/, ""),
          url: `/Instruments/TFM Music Maker/${encodeURIComponent(bank.key)}/${encodeURIComponent(f)}`,
          type: "tfi" as const,
        })),
      );
      setLoading(false);
    }
  }, [bankCursor, banks]);

  // Load selected preset
  const loadSelectedPreset = useCallback(async () => {
    const patch = patches[patchCursor];
    if (!patch) return;

    if (patch.type === "genmdm" && patch.instrument) {
      onLoadPreset({ ...patch.instrument, id: currentInstrumentId });
    } else if (patch.type === "tfi") {
      const inst = await loadTFI(assetUrl(patch.url), currentInstrumentId, patch.name.slice(0, 16).toUpperCase());
      if (inst) onLoadPreset(inst);
    }
  }, [patches, patchCursor, currentInstrumentId, onLoadPreset]);

  // Keyboard handler
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      const key = e.key;
      const code = e.code;

      // Close on X/Delete/Escape
      if (code === "KeyX" || key === "Escape" || key === "Delete" || key === "Backspace") {
        e.preventDefault();
        e.stopPropagation();
        onClose();
        return;
      }

      // Load preset on Q release (place) or Enter or Z
      if (code === "KeyZ" || key === "Enter") {
        e.preventDefault();
        e.stopPropagation();
        loadSelectedPreset();
        return;
      }

      if (key === "ArrowUp") {
        e.preventDefault();
        e.stopPropagation();
        if (activePanel === "bank") {
          setBankCursor((c) => Math.max(0, c - 1));
        } else {
          setPatchCursor((c) => Math.max(0, c - 1));
        }
        return;
      }

      if (key === "ArrowDown") {
        e.preventDefault();
        e.stopPropagation();
        if (activePanel === "bank") {
          setBankCursor((c) => Math.min(banks.length - 1, c + 1));
        } else {
          setPatchCursor((c) => Math.min(patches.length - 1, c + 1));
        }
        return;
      }

      // Page up/down with Q+arrows
      if (e.code === "KeyQ") {
        e.preventDefault();
        e.stopPropagation();
        return;
      }

      if (key === "ArrowLeft") {
        e.preventDefault();
        e.stopPropagation();
        setActivePanel("bank");
        return;
      }

      if (key === "ArrowRight") {
        e.preventDefault();
        e.stopPropagation();
        setActivePanel("patch");
        return;
      }
    };

    // Use capture phase to intercept before InputRouter
    window.addEventListener("keydown", handleKey, true);
    return () => window.removeEventListener("keydown", handleKey, true);
  }, [activePanel, banks.length, patches.length, onClose, loadSelectedPreset]);

  // Compute scroll offsets
  const bankScroll = Math.max(0, bankCursor - Math.floor(VISIBLE_ROWS / 2));
  const patchScroll = Math.max(0, patchCursor - Math.floor(VISIBLE_ROWS / 2));

  const visibleBanks = banks.slice(bankScroll, bankScroll + VISIBLE_ROWS);
  const visiblePatches = patches.slice(patchScroll, patchScroll + VISIBLE_ROWS);

  const selectedBank = banks[bankCursor];

  return (
    <div
      className="flex flex-col h-full select-none"
      style={{
        fontFamily: "var(--dm-font-primary)",
        fontSize: "9px",
        imageRendering: "pixelated",
        backgroundColor: "#000000",
      }}
    >
      {/* Header */}
      <div
        className="flex items-center justify-between px-1 border-b flex-shrink-0"
        style={{ borderColor: "#333333", height: "20px" }}
      >
        <span style={{ color: "#888888", letterSpacing: "2px" }}>
          FM PRESETS
        </span>
        <span style={{ color: "#555555", letterSpacing: "1px", fontSize: "7px" }}>
          Z:LOAD X:CLOSE
        </span>
      </div>

      {/* Two panels */}
      <div className="flex flex-1 overflow-hidden">
        {/* Bank list */}
        <div
          className="flex flex-col border-r"
          style={{ width: "50%", borderColor: "#333333" }}
        >
          <div
            className="px-1 border-b flex items-center"
            style={{
              borderColor: "#222222",
              height: "14px",
              color: activePanel === "bank" ? "#ffffff" : "#555555",
              letterSpacing: "1px",
              fontSize: "7px",
            }}
          >
            BANK [{selectedBank?.type === "genmdm" ? "GENMDM" : "TFI"}]
            <span style={{ marginLeft: "auto", color: "#444444" }}>
              {bankCursor + 1}/{banks.length}
            </span>
          </div>
          <div className="flex-1 overflow-hidden">
            {visibleBanks.map((bank, i) => {
              const realIdx = bankScroll + i;
              const isActive = realIdx === bankCursor;
              return (
                <div
                  key={`${bank.type}-${bank.key}`}
                  className="px-1 truncate"
                  style={{
                    height: `${ROW_HEIGHT}px`,
                    lineHeight: `${ROW_HEIGHT}px`,
                    backgroundColor: isActive && activePanel === "bank" ? "#ffffff" : isActive ? "#222222" : "transparent",
                    color: isActive && activePanel === "bank" ? "#000000" : isActive ? "#ffffff" : "#888888",
                    letterSpacing: "0.5px",
                  }}
                >
                  <span style={{ color: isActive && activePanel === "bank" ? "#555555" : "#444444", marginRight: "4px", fontSize: "7px" }}>
                    {bank.type === "genmdm" ? "G" : "T"}
                  </span>
                  {bank.name}
                </div>
              );
            })}
          </div>
        </div>

        {/* Patch list */}
        <div className="flex flex-col" style={{ width: "50%" }}>
          <div
            className="px-1 border-b flex items-center"
            style={{
              borderColor: "#222222",
              height: "14px",
              color: activePanel === "patch" ? "#ffffff" : "#555555",
              letterSpacing: "1px",
              fontSize: "7px",
            }}
          >
            PATCH
            <span style={{ marginLeft: "auto", color: "#444444" }}>
              {patches.length > 0 ? `${patchCursor + 1}/${patches.length}` : "--"}
            </span>
          </div>
          <div className="flex-1 overflow-hidden">
            {loading ? (
              <div className="px-1" style={{ color: "#555555", height: `${ROW_HEIGHT}px`, lineHeight: `${ROW_HEIGHT}px` }}>
                LOADING...
              </div>
            ) : (
              visiblePatches.map((patch, i) => {
                const realIdx = patchScroll + i;
                const isActive = realIdx === patchCursor;
                return (
                  <div
                    key={`${patch.name}-${realIdx}`}
                    className="px-1 truncate"
                    style={{
                      height: `${ROW_HEIGHT}px`,
                      lineHeight: `${ROW_HEIGHT}px`,
                      backgroundColor: isActive && activePanel === "patch" ? "#ffffff" : isActive ? "#222222" : "transparent",
                      color: isActive && activePanel === "patch" ? "#000000" : isActive ? "#ffffff" : "#888888",
                      letterSpacing: "0.5px",
                    }}
                  >
                    {patch.name}
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* Footer status */}
      <div
        className="flex-shrink-0 border-t px-1 flex items-center"
        style={{
          borderColor: "#333333",
          height: "14px",
          fontSize: "7px",
          color: "#444444",
          letterSpacing: "1px",
        }}
      >
        {selectedBank?.name ?? ""}
      </div>
    </div>
  );
}
