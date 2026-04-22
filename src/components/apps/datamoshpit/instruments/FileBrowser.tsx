/*
 *            ☦
 *      ╔══════════════════╗
 *      ║  ST. GENESIUS    ║
 *      ║  Patron of       ║
 *      ║  Musicians       ║
 *      ╚══════════════════╝
 *
 *   FILE BROWSER
 *   Unified two-panel browser for the /public/Instruments/ tree.
 *   Loads FM presets (TFI, GenMDM) AND audio samples (WAV).
 *
 *   Navigation:
 *     Up/Down = scroll folder or file list
 *     Left/Right = switch panels
 *     Z/Enter = load selected file into instrument slot
 *     X/Delete/Escape = close browser
 */

"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import type { Instrument, ProjectSample } from "@/types/tracker";
import { loadTFI } from "@/engine/instruments/TFIParser";
import { loadGenMDMBank } from "@/engine/instruments/GenMDMParser";
import { assetUrl } from "@/lib/assets";

const ROW_HEIGHT = 16;
const VISIBLE_ROWS = 20;

interface FolderEntry {
  name: string;
  type: "tfi-game" | "genmdm" | "samples";
  key: string;
}

interface FileEntry {
  name: string;
  type: "tfi" | "genmdm-patch" | "wav";
  url: string;
  /** For GenMDM, the pre-parsed instrument */
  instrument?: Instrument;
}

interface FileBrowserProps {
  onLoadPreset: (inst: Instrument) => void;
  onImportSample: (sample: ProjectSample) => void;
  onClose: () => void;
  currentInstrumentId: number;
  nextSampleId: number;
}

export function FileBrowser({
  onLoadPreset,
  onImportSample,
  onClose,
  currentInstrumentId,
  nextSampleId,
}: FileBrowserProps) {
  const [folders, setFolders] = useState<FolderEntry[]>([]);
  const [files, setFiles] = useState<FileEntry[]>([]);
  const [folderCursor, setFolderCursor] = useState(0);
  const [fileCursor, setFileCursor] = useState(0);
  const [activePanel, setActivePanel] = useState<"folder" | "file">("folder");
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState("");
  const tfmManifestRef = useRef<Record<string, string[]>>({});
  /** Sample manifest: keys are folder paths ("samples", "samples/loops"), values are filename arrays */
  const sampleManifestRef = useRef<Record<string, string[]>>({});

  // Load manifests on mount
  useEffect(() => {
    Promise.all([
      fetch(assetUrl("/Instruments/genmdm-manifest.json")).then((r) => r.json()).catch(() => []),
      fetch(assetUrl("/Instruments/tfm-manifest.json")).then((r) => r.json()).catch(() => ({})),
      fetch(assetUrl("/Instruments/sample-manifest.json")).then((r) => r.json()).catch(() => ({})),
    ]).then(([genmdmFiles, tfmManifest, sampleManifest]: [string[], Record<string, string[]>, Record<string, string[]>]) => {
      tfmManifestRef.current = tfmManifest;
      sampleManifestRef.current = sampleManifest;

      const allFolders: FolderEntry[] = [];

      // Sample folders from manifest (e.g. "samples", "samples/loops")
      for (const folderPath of Object.keys(sampleManifest).sort()) {
        const files = sampleManifest[folderPath];
        if (files.length > 0) {
          const displayName = folderPath === "samples"
            ? "[ SAMPLES ]"
            : `[ ${folderPath.replace("samples/", "").toUpperCase()} ]`;
          allFolders.push({ name: displayName, type: "samples", key: folderPath });
        }
      }

      // GenMDM banks
      for (const file of genmdmFiles) {
        allFolders.push({
          name: file.replace(/\.genm$/, ""),
          type: "genmdm",
          key: file,
        });
      }

      // TFI game folders
      for (const game of Object.keys(tfmManifest).sort()) {
        allFolders.push({
          name: game,
          type: "tfi-game",
          key: game,
        });
      }

      setFolders(allFolders);
    });
  }, []);

  // Load files when folder cursor changes
  useEffect(() => {
    const folder = folders[folderCursor];
    if (!folder) return;

    setLoading(true);
    setFileCursor(0);

    if (folder.type === "samples") {
      const sampleFiles = sampleManifestRef.current[folder.key] ?? [];
      const basePath = `/Instruments/${folder.key}`;
      setFiles(
        sampleFiles.map((f) => ({
          name: f,
          type: "wav" as const,
          url: `${basePath}/${encodeURIComponent(f)}`,
        })),
      );
      setLoading(false);
    } else if (folder.type === "genmdm") {
      loadGenMDMBank(assetUrl(`/Instruments/GenMDM/${folder.key}`), 0).then((instruments) => {
        setFiles(
          instruments.map((inst) => ({
            name: inst.name,
            url: "",
            type: "genmdm-patch" as const,
            instrument: inst,
          })),
        );
        setLoading(false);
      });
    } else {
      // TFI
      const tfiFiles = tfmManifestRef.current[folder.key] ?? [];
      setFiles(
        tfiFiles.map((f) => ({
          name: f.replace(/\.tfi$/, ""),
          url: `/Instruments/TFM Music Maker/${encodeURIComponent(folder.key)}/${encodeURIComponent(f)}`,
          type: "tfi" as const,
        })),
      );
      setLoading(false);
    }
  }, [folderCursor, folders]);

  // Load selected file
  const loadSelectedFile = useCallback(async () => {
    const file = files[fileCursor];
    if (!file) return;

    if (file.type === "genmdm-patch" && file.instrument) {
      onLoadPreset({ ...file.instrument, id: currentInstrumentId });
      setStatus(`LOADED: ${file.name}`);
    } else if (file.type === "tfi") {
      const inst = await loadTFI(assetUrl(file.url), currentInstrumentId, file.name.slice(0, 16).toUpperCase());
      if (inst) {
        onLoadPreset(inst);
        setStatus(`LOADED: ${file.name}`);
      }
    } else if (file.type === "wav") {
      // Fetch WAV as ArrayBuffer and import into project sample pool
      setStatus("IMPORTING...");
      try {
        const resp = await fetch(assetUrl(file.url));
        const data = await resp.arrayBuffer();
        const name = file.name.replace(/\.wav$/i, "").slice(0, 24).toUpperCase();
        const sample: ProjectSample = {
          id: nextSampleId,
          name,
          data,
        };
        onImportSample(sample);
        setStatus(`IMPORTED: ${name}`);
      } catch (e) {
        setStatus("IMPORT FAILED");
        console.warn("[FILE BROWSER] WAV import failed:", e);
      }
    }
  }, [files, fileCursor, currentInstrumentId, nextSampleId, onLoadPreset, onImportSample]);

  // Keyboard handler
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      const key = e.key;
      const code = e.code;

      if (code === "KeyX" || key === "Escape" || key === "Delete" || key === "Backspace") {
        e.preventDefault();
        e.stopPropagation();
        onClose();
        return;
      }

      if (code === "KeyZ" || key === "Enter") {
        e.preventDefault();
        e.stopPropagation();
        loadSelectedFile();
        return;
      }

      if (key === "ArrowUp") {
        e.preventDefault();
        e.stopPropagation();
        if (activePanel === "folder") {
          setFolderCursor((c) => Math.max(0, c - 1));
        } else {
          setFileCursor((c) => Math.max(0, c - 1));
        }
        return;
      }

      if (key === "ArrowDown") {
        e.preventDefault();
        e.stopPropagation();
        if (activePanel === "folder") {
          setFolderCursor((c) => Math.min(folders.length - 1, c + 1));
        } else {
          setFileCursor((c) => Math.min(files.length - 1, c + 1));
        }
        return;
      }

      if (e.code === "KeyQ") {
        e.preventDefault();
        e.stopPropagation();
        return;
      }

      if (key === "ArrowLeft") {
        e.preventDefault();
        e.stopPropagation();
        setActivePanel("folder");
        return;
      }

      if (key === "ArrowRight") {
        e.preventDefault();
        e.stopPropagation();
        setActivePanel("file");
        return;
      }
    };

    window.addEventListener("keydown", handleKey, true);
    return () => window.removeEventListener("keydown", handleKey, true);
  }, [activePanel, folders.length, files.length, onClose, loadSelectedFile]);

  // Scroll offsets
  const folderScroll = Math.max(0, folderCursor - Math.floor(VISIBLE_ROWS / 2));
  const fileScroll = Math.max(0, fileCursor - Math.floor(VISIBLE_ROWS / 2));

  const visibleFolders = folders.slice(folderScroll, folderScroll + VISIBLE_ROWS);
  const visibleFiles = files.slice(fileScroll, fileScroll + VISIBLE_ROWS);

  const selectedFolder = folders[folderCursor];
  const typeLabel = selectedFolder?.type === "genmdm" ? "GENMDM"
    : selectedFolder?.type === "tfi-game" ? "TFI"
    : selectedFolder?.type === "samples" ? "WAV"
    : "";

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
          FILE BROWSER
        </span>
        <span style={{ color: "#555555", letterSpacing: "1px", fontSize: "7px" }}>
          Z:LOAD X:CLOSE
        </span>
      </div>

      {/* Two panels */}
      <div className="flex flex-1 overflow-hidden">
        {/* Folder list */}
        <div
          className="flex flex-col border-r"
          style={{ width: "50%", borderColor: "#333333" }}
        >
          <div
            className="px-1 border-b flex items-center"
            style={{
              borderColor: "#222222",
              height: "14px",
              color: activePanel === "folder" ? "#ffffff" : "#555555",
              letterSpacing: "1px",
              fontSize: "7px",
            }}
          >
            FOLDER [{typeLabel}]
            <span style={{ marginLeft: "auto", color: "#444444" }}>
              {folders.length > 0 ? `${folderCursor + 1}/${folders.length}` : "--"}
            </span>
          </div>
          <div className="flex-1 overflow-hidden">
            {visibleFolders.map((folder, i) => {
              const realIdx = folderScroll + i;
              const isActive = realIdx === folderCursor;
              return (
                <div
                  key={`${folder.type}-${folder.key}`}
                  className="px-1 truncate"
                  style={{
                    height: `${ROW_HEIGHT}px`,
                    lineHeight: `${ROW_HEIGHT}px`,
                    backgroundColor: isActive && activePanel === "folder" ? "#ffffff" : isActive ? "#222222" : "transparent",
                    color: isActive && activePanel === "folder" ? "#000000" : isActive ? "#ffffff" : "#888888",
                    letterSpacing: "0.5px",
                  }}
                >
                  <span style={{ color: isActive && activePanel === "folder" ? "#555555" : "#444444", marginRight: "4px", fontSize: "7px" }}>
                    {folder.type === "genmdm" ? "G" : folder.type === "samples" ? "S" : "T"}
                  </span>
                  {folder.name}
                </div>
              );
            })}
          </div>
        </div>

        {/* File list */}
        <div className="flex flex-col" style={{ width: "50%" }}>
          <div
            className="px-1 border-b flex items-center"
            style={{
              borderColor: "#222222",
              height: "14px",
              color: activePanel === "file" ? "#ffffff" : "#555555",
              letterSpacing: "1px",
              fontSize: "7px",
            }}
          >
            FILE
            <span style={{ marginLeft: "auto", color: "#444444" }}>
              {files.length > 0 ? `${fileCursor + 1}/${files.length}` : "--"}
            </span>
          </div>
          <div className="flex-1 overflow-hidden">
            {loading ? (
              <div className="px-1" style={{ color: "#555555", height: `${ROW_HEIGHT}px`, lineHeight: `${ROW_HEIGHT}px` }}>
                LOADING...
              </div>
            ) : (
              visibleFiles.map((file, i) => {
                const realIdx = fileScroll + i;
                const isActive = realIdx === fileCursor;
                return (
                  <div
                    key={`${file.name}-${realIdx}`}
                    className="px-1 truncate"
                    style={{
                      height: `${ROW_HEIGHT}px`,
                      lineHeight: `${ROW_HEIGHT}px`,
                      backgroundColor: isActive && activePanel === "file" ? "#ffffff" : isActive ? "#222222" : "transparent",
                      color: isActive && activePanel === "file" ? "#000000" : isActive ? "#ffffff" : "#888888",
                      letterSpacing: "0.5px",
                    }}
                  >
                    {file.name}
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
        {status || selectedFolder?.name || ""}
      </div>
    </div>
  );
}
