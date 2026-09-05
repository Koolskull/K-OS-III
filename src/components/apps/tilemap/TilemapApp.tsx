"use client";

/**
 * K-OS-III Tilemap Painter
 * Dual-plane tilemap editor for Sega Genesis / Mega Drive level design.
 *
 * Features:
 * - Load spritesheets (PNG/GIF/WebP)
 * - Two independent planes (A / B)
 * - Custom tile size + map size
 * - Per-tile palette index 0-3
 * - Paint / Erase / Pick tools
 * - Export composed PNG
 * - Export SGDK-compatible .h (TILE_ATTR_FULL)
 *
 * Keyboard: A/S/Tab plane · B paint · E erase · I pick · 1-4 palette · [ ] zoom
 * Mobile: Corner-Collapsible Panels (docs/MOBILE_CREATIVE_UI.md) · H = zen
 */

import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  CornerHost,
  CornerPanel,
  VerticalChromeToggle,
  CornerDismissLayer,
  useCornerChromeOptional,
} from "@/components/ui/CornerChrome";

function downloadCanvasAsPng(canvas: HTMLCanvasElement, filename: string) {
  canvas.toBlob((blob) => {
    if (!blob) return;
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  }, "image/png");
}

type Tool = "paint" | "erase" | "pick";

const EMPTY = 0xffff;
const PALETTE_SHIFT = 12;
const TILE_MASK = 0x0fff;
const NUM_PLANES = 2;

function pack(tile: number, palette: number): number {
  return ((palette & 0x3) << PALETTE_SHIFT) | (tile & TILE_MASK);
}
function unpackTile(v: number): number {
  return v === EMPTY ? -1 : v & TILE_MASK;
}
function unpackPalette(v: number): number {
  return v === EMPTY ? 0 : (v >> PALETTE_SHIFT) & 0x3;
}

interface TilemapState {
  tileW: number;
  tileH: number;
  mapW: number;
  mapH: number;
  planes: Uint16Array[];
}

interface Props {
  isFocused?: boolean;
}

export default function TilemapApp({ isFocused = true }: Props) {
  return (
    <CornerHost storageKey="kos-tilemap-chrome" style={{ background: "#0f0f1a" }}>
      <TilemapInner isFocused={isFocused} />
    </CornerHost>
  );
}

function TilemapInner({ isFocused = true }: Props) {
  const chrome = useCornerChromeOptional();
  const isNarrow = chrome?.isNarrow ?? false;
  const uiHidden = chrome?.uiHidden ?? false;
  const collapse = isNarrow || uiHidden;

  const [tileW, setTileW] = useState(8);
  const [tileH, setTileH] = useState(8);
  const [mapW, setMapW] = useState(40);
  const [mapH, setMapH] = useState(28);
  const [mapName, setMapName] = useState("level1");
  const [sheetImg, setSheetImg] = useState<HTMLImageElement | null>(null);
  const [sheetCols, setSheetCols] = useState(0);
  const [sheetRows, setSheetRows] = useState(0);
  const [selectedTile, setSelectedTile] = useState(0);
  const [selectedPalette, setSelectedPalette] = useState(0);
  const [activePlane, setActivePlane] = useState(0);
  const [tool, setTool] = useState<Tool>("paint");
  const [mapZoom, setMapZoom] = useState(2);
  const [sheetZoom, setSheetZoom] = useState(2);
  const [showPlaneA, setShowPlaneA] = useState(true);
  const [showPlaneB, setShowPlaneB] = useState(true);
  const [status, setStatus] = useState("Load a spritesheet PNG to begin.");

  const mapRef = useRef<TilemapState>({
    tileW: 8, tileH: 8, mapW: 40, mapH: 28,
    planes: [new Uint16Array(40 * 28).fill(EMPTY), new Uint16Array(40 * 28).fill(EMPTY)],
  });

  const mapCanvasRef = useRef<HTMLCanvasElement>(null);
  const sheetCanvasRef = useRef<HTMLCanvasElement>(null);
  const isPainting = useRef(false);

  const rebuildMap = useCallback((tw: number, th: number, mw: number, mh: number) => {
    const old = mapRef.current;
    const planes: Uint16Array[] = [];
    for (let p = 0; p < NUM_PLANES; p++) {
      const data = new Uint16Array(mw * mh).fill(EMPTY);
      const copyW = Math.min(old.mapW, mw);
      const copyH = Math.min(old.mapH, mh);
      for (let y = 0; y < copyH; y++)
        for (let x = 0; x < copyW; x++)
          data[y * mw + x] = old.planes[p][y * old.mapW + x];
      planes.push(data);
    }
    mapRef.current = { tileW: tw, tileH: th, mapW: mw, mapH: mh, planes };
    setTileW(tw); setTileH(th); setMapW(mw); setMapH(mh);
  }, []);

  const onLoadSheet = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      setSheetImg(img);
      const cols = Math.floor(img.width / tileW);
      const rows = Math.floor(img.height / tileH);
      setSheetCols(cols); setSheetRows(rows); setSelectedTile(0);
      setStatus(`Loaded ${file.name} → ${cols}×${rows} tiles (${tileW}×${tileH})`);
    };
    img.onerror = () => setStatus("Failed to load image.");
    img.src = url;
  }, [tileW, tileH]);

  const drawSheet = useCallback(() => {
    const canvas = sheetCanvasRef.current;
    const img = sheetImg;
    if (!canvas || !img) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const z = sheetZoom;
    canvas.width = img.width * z; canvas.height = img.height * z;
    ctx.imageSmoothingEnabled = false;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    ctx.strokeStyle = "rgba(255,255,255,0.25)"; ctx.lineWidth = 1;
    for (let x = 0; x <= sheetCols; x++) { ctx.beginPath(); ctx.moveTo(x * tileW * z + 0.5, 0); ctx.lineTo(x * tileW * z + 0.5, canvas.height); ctx.stroke(); }
    for (let y = 0; y <= sheetRows; y++) { ctx.beginPath(); ctx.moveTo(0, y * tileH * z + 0.5); ctx.lineTo(canvas.width, y * tileH * z + 0.5); ctx.stroke(); }
    if (selectedTile >= 0 && selectedTile < sheetCols * sheetRows) {
      const sx = (selectedTile % sheetCols) * tileW * z;
      const sy = Math.floor(selectedTile / sheetCols) * tileH * z;
      ctx.strokeStyle = "#00ff88"; ctx.lineWidth = 2;
      ctx.strokeRect(sx + 1, sy + 1, tileW * z - 2, tileH * z - 2);
    }
  }, [sheetImg, sheetZoom, tileW, tileH, sheetCols, sheetRows, selectedTile]);

  useEffect(() => { drawSheet(); }, [drawSheet]);

  const drawMap = useCallback(() => {
    const canvas = mapCanvasRef.current;
    const img = sheetImg;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const m = mapRef.current;
    const z = mapZoom;
    const pxW = m.mapW * m.tileW * z; const pxH = m.mapH * m.tileH * z;
    if (canvas.width !== pxW || canvas.height !== pxH) { canvas.width = pxW; canvas.height = pxH; }
    ctx.imageSmoothingEnabled = false;
    ctx.fillStyle = "#1a1a2e"; ctx.fillRect(0, 0, pxW, pxH);
    if (img) {
      for (let p = 0; p < NUM_PLANES; p++) {
        if (p === 0 && !showPlaneA) continue;
        if (p === 1 && !showPlaneB) continue;
        const planeData = m.planes[p];
        for (let ty = 0; ty < m.mapH; ty++) {
          for (let tx = 0; tx < m.mapW; tx++) {
            const v = planeData[ty * m.mapW + tx];
            if (v === EMPTY) continue;
            const tile = unpackTile(v);
            const sx = (tile % sheetCols) * m.tileW;
            const sy = Math.floor(tile / sheetCols) * m.tileH;
            ctx.drawImage(img, sx, sy, m.tileW, m.tileH, tx * m.tileW * z, ty * m.tileH * z, m.tileW * z, m.tileH * z);
          }
        }
      }
    }
    if (z >= 2) {
      ctx.strokeStyle = "rgba(255,255,255,0.08)"; ctx.lineWidth = 1;
      for (let x = 0; x <= m.mapW; x++) { ctx.beginPath(); ctx.moveTo(x * m.tileW * z + 0.5, 0); ctx.lineTo(x * m.tileW * z + 0.5, pxH); ctx.stroke(); }
      for (let y = 0; y <= m.mapH; y++) { ctx.beginPath(); ctx.moveTo(0, y * m.tileH * z + 0.5); ctx.lineTo(pxW, y * m.tileH * z + 0.5); ctx.stroke(); }
    }
  }, [sheetImg, mapZoom, sheetCols, showPlaneA, showPlaneB]);

  useEffect(() => { drawMap(); }, [drawMap, mapW, mapH, tileW, tileH, activePlane]);

  const paintAt = useCallback((clientX: number, clientY: number) => {
    const canvas = mapCanvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const m = mapRef.current;
    const z = mapZoom;
    const tx = Math.floor((clientX - rect.left) / (m.tileW * z));
    const ty = Math.floor((clientY - rect.top) / (m.tileH * z));
    if (tx < 0 || ty < 0 || tx >= m.mapW || ty >= m.mapH) return;
    const idx = ty * m.mapW + tx;
    const plane = m.planes[activePlane];
    if (tool === "paint") plane[idx] = pack(selectedTile, selectedPalette);
    else if (tool === "erase") plane[idx] = EMPTY;
    else if (tool === "pick") {
      const v = plane[idx];
      if (v !== EMPTY) { setSelectedTile(unpackTile(v)); setSelectedPalette(unpackPalette(v)); setTool("paint"); }
      return;
    }
    drawMap();
  }, [tool, selectedTile, selectedPalette, mapZoom, activePlane, drawMap]);

  const onMapPointerDown = (e: React.PointerEvent) => {
    if (!isFocused) return;
    isPainting.current = true;
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
    paintAt(e.clientX, e.clientY);
  };
  const onMapPointerMove = (e: React.PointerEvent) => { if (isPainting.current) paintAt(e.clientX, e.clientY); };
  const onMapPointerUp = () => { isPainting.current = false; };

  const onSheetClick = (e: React.MouseEvent) => {
    if (!sheetImg) return;
    const canvas = sheetCanvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const z = sheetZoom;
    const tx = Math.floor((e.clientX - rect.left) / (tileW * z));
    const ty = Math.floor((e.clientY - rect.top) / (tileH * z));
    if (tx < 0 || ty < 0 || tx >= sheetCols || ty >= sheetRows) return;
    setSelectedTile(ty * sheetCols + tx);
    setTool("paint");
  };

  const exportPng = () => {
    const m = mapRef.current;
    const img = sheetImg;
    if (!img) { setStatus("No spritesheet loaded."); return; }
    const out = document.createElement("canvas");
    out.width = m.mapW * m.tileW; out.height = m.mapH * m.tileH;
    const ctx = out.getContext("2d")!;
    ctx.imageSmoothingEnabled = false;
    ctx.fillStyle = "#000"; ctx.fillRect(0, 0, out.width, out.height);
    for (let p = 0; p < NUM_PLANES; p++) {
      const planeData = m.planes[p];
      for (let ty = 0; ty < m.mapH; ty++) {
        for (let tx = 0; tx < m.mapW; tx++) {
          const v = planeData[ty * m.mapW + tx];
          if (v === EMPTY) continue;
          const tile = unpackTile(v);
          ctx.drawImage(img, (tile % sheetCols) * m.tileW, Math.floor(tile / sheetCols) * m.tileH, m.tileW, m.tileH, tx * m.tileW, ty * m.tileH, m.tileW, m.tileH);
        }
      }
    }
    downloadCanvasAsPng(out, `${mapName || "tilemap"}.png`);
    setStatus(`Exported ${out.width}×${out.height} PNG (both planes)`);
  };

  const exportSGDK = () => {
    const m = mapRef.current;
    const name = (mapName || "level").replace(/[^a-zA-Z0-9_]/g, "_");
    const w = m.mapW, h = m.mapH;
    const toSGDKWord = (v: number): number => {
      if (v === EMPTY) return 0;
      const tile = unpackTile(v) & 0x7ff;
      const pal = unpackPalette(v) & 0x3;
      return (pal << 13) | tile;
    };
    const formatArray = (plane: Uint16Array, arrName: string) => {
      let out = `const u16 ${arrName}[${w * h}] = {\n`;
      for (let y = 0; y < h; y++) {
        out += "  ";
        for (let x = 0; x < w; x++) {
          out += `0x${toSGDKWord(plane[y * w + x]).toString(16).padStart(4, "0")}`;
          if (y * w + x < w * h - 1) out += ", ";
        }
        out += "\n";
      }
      out += "};\n\n";
      return out;
    };
    let header = `/* SGDK tilemap export – generated by K-OS-III Tilemap Painter\n * Map: ${name}  ${w}×${h} tiles\n */\n\n#ifndef _${name.toUpperCase()}_H_\n#define _${name.toUpperCase()}_H_\n\n#include <genesis.h>\n\n#define ${name.toUpperCase()}_WIDTH  ${w}\n#define ${name.toUpperCase()}_HEIGHT ${h}\n\n`;
    header += formatArray(m.planes[0], `${name}_plane_a`);
    header += formatArray(m.planes[1], `${name}_plane_b`);
    header += `#endif\n`;
    const blob = new Blob([header], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = `${name}.h`; a.click();
    URL.revokeObjectURL(url);
    setStatus(`Exported SGDK header ${name}.h (${w}×${h})`);
  };

  const clearActivePlane = () => { mapRef.current.planes[activePlane].fill(EMPTY); drawMap(); setStatus(`Plane ${activePlane === 0 ? "A" : "B"} cleared.`); };
  const clearAll = () => { mapRef.current.planes.forEach((p) => p.fill(EMPTY)); drawMap(); setStatus("Both planes cleared."); };

  const applySizes = () => {
    const tw = Math.max(1, Math.min(64, tileW));
    const th = Math.max(1, Math.min(64, tileH));
    const mw = Math.max(1, Math.min(256, mapW));
    const mh = Math.max(1, Math.min(256, mapH));
    rebuildMap(tw, th, mw, mh);
    if (sheetImg) { setSheetCols(Math.floor(sheetImg.width / tw)); setSheetRows(Math.floor(sheetImg.height / th)); }
    setStatus(`Map ${mw}×${mh} tiles @ ${tw}×${th}px`);
  };

  useEffect(() => {
    if (!isFocused) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement) return;
      switch (e.key.toLowerCase()) {
        case "b": case "p": setTool("paint"); break;
        case "e": setTool("erase"); break;
        case "i": setTool("pick"); break;
        case "[": setMapZoom((z) => Math.max(1, z - 1)); break;
        case "]": setMapZoom((z) => Math.min(16, z + 1)); break;
        case "1": case "2": case "3": case "4": setSelectedPalette(parseInt(e.key) - 1); break;
        case "a": setActivePlane(0); break;
        case "s": setActivePlane(1); break;
        case "tab": e.preventDefault(); setActivePlane((p) => (p + 1) % NUM_PLANES); break;
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [isFocused]);

  const btn = (active: boolean): React.CSSProperties => ({
    padding: "3px 8px",
    background: active ? "#00ff88" : "#2a2a40",
    color: active ? "#000" : "#ccc",
    border: "1px solid #3a3a55",
    cursor: "pointer",
    fontFamily: "monospace",
    fontSize: 11,
  });
  const label: React.CSSProperties = { marginRight: 4, opacity: 0.7 };

  const controlsBar = (
    <div style={{ display: "flex", flexWrap: "wrap", gap: 6, padding: "6px 8px", background: "#16162a", alignItems: "center" }}>
      <label style={btn(false)}>Load Sheet<input type="file" accept="image/png,image/gif,image/webp" onChange={onLoadSheet} style={{ display: "none" }} /></label>
      <span style={label}>Tile</span>
      <input type="number" value={tileW} min={1} max={64} onChange={(e) => setTileW(+e.target.value)} style={{ width: 40, background: "#222", color: "#eee", border: "1px solid #444" }} />×
      <input type="number" value={tileH} min={1} max={64} onChange={(e) => setTileH(+e.target.value)} style={{ width: 40, background: "#222", color: "#eee", border: "1px solid #444" }} />
      <span style={label}>Map</span>
      <input type="number" value={mapW} min={1} max={256} onChange={(e) => setMapW(+e.target.value)} style={{ width: 48, background: "#222", color: "#eee", border: "1px solid #444" }} />×
      <input type="number" value={mapH} min={1} max={256} onChange={(e) => setMapH(+e.target.value)} style={{ width: 48, background: "#222", color: "#eee", border: "1px solid #444" }} />
      <button style={btn(false)} onClick={applySizes}>Apply</button>
      <button style={btn(activePlane === 0)} onClick={() => setActivePlane(0)}>Plane A</button>
      <button style={btn(activePlane === 1)} onClick={() => setActivePlane(1)}>Plane B</button>
      <label style={{ ...label, display: "flex", alignItems: "center", gap: 2 }}><input type="checkbox" checked={showPlaneA} onChange={(e) => setShowPlaneA(e.target.checked)} />show A</label>
      <label style={{ ...label, display: "flex", alignItems: "center", gap: 2 }}><input type="checkbox" checked={showPlaneB} onChange={(e) => setShowPlaneB(e.target.checked)} />show B</label>
      <button style={btn(tool === "paint")} onClick={() => setTool("paint")}>Paint</button>
      <button style={btn(tool === "erase")} onClick={() => setTool("erase")}>Erase</button>
      <button style={btn(tool === "pick")} onClick={() => setTool("pick")}>Pick</button>
      <span style={label}>Pal</span>
      {[0, 1, 2, 3].map((p) => (
        <button key={p} style={btn(selectedPalette === p)} onClick={() => setSelectedPalette(p)}>{p}</button>
      ))}
      <button style={btn(false)} onClick={() => setMapZoom((z) => Math.max(1, z - 1))}>−</button>
      <span>{mapZoom}×</span>
      <button style={btn(false)} onClick={() => setMapZoom((z) => Math.min(16, z + 1))}>+</button>
      <input value={mapName} onChange={(e) => setMapName(e.target.value)} placeholder="name" style={{ width: 80, background: "#222", color: "#eee", border: "1px solid #444" }} />
      <button style={btn(false)} onClick={exportPng}>Save PNG</button>
      <button style={btn(false)} onClick={exportSGDK}>SGDK .h</button>
      <button style={btn(false)} onClick={clearActivePlane}>Clear Plane</button>
      <button style={btn(false)} onClick={clearAll}>Clear All</button>
    </div>
  );

  const sheetPanel = (
    <div style={{ display: "flex", flexDirection: "column", background: "#0c0c18", minHeight: 120 }}>
      <div style={{ padding: "4px 8px", background: "#16162a", fontSize: 11, display: "flex", justifyContent: "space-between" }}>
        <span>Spritesheet</span>
        <span>
          <button style={{ ...btn(false), padding: "1px 6px" }} onClick={() => setSheetZoom((z) => Math.max(1, z - 1))}>−</button>
          {" "}{sheetZoom}×{" "}
          <button style={{ ...btn(false), padding: "1px 6px" }} onClick={() => setSheetZoom((z) => Math.min(8, z + 1))}>+</button>
        </span>
      </div>
      <div style={{ flex: 1, overflow: "auto", padding: 4 }}>
        {sheetImg ? (
          <canvas ref={sheetCanvasRef} onClick={onSheetClick} style={{ cursor: "crosshair", display: "block" }} />
        ) : (
          <div style={{ padding: 16, opacity: 0.5, textAlign: "center" }}>Load a spritesheet<br />(PNG recommended)</div>
        )}
      </div>
    </div>
  );

  return (
    <div style={{ background: "#0f0f1a", color: "#c8c8d0", fontFamily: "monospace", fontSize: 12, display: "flex", flexDirection: "column", height: "100%", overflow: "hidden", userSelect: "none" }}>
      {!collapse && (
        <>
          {controlsBar}
          <div style={{ padding: "2px 8px", background: "#0a0a12", fontSize: 11, color: "#6a6a80", borderBottom: "1px solid #1a1a2e" }}>
            {status} · editing <strong style={{ color: activePlane === 0 ? "#88aaff" : "#ffaa88" }}>Plane {activePlane === 0 ? "A" : "B"}</strong> · tile #{selectedTile} · pal {selectedPalette}
          </div>
        </>
      )}

      <div style={{ display: "flex", flex: 1, overflow: "hidden", position: "relative" }}>
        {!collapse && (
          <div style={{ width: 280, borderRight: "1px solid #2a2a40", display: "flex", flexDirection: "column" }}>
            {sheetPanel}
          </div>
        )}

        <div style={{ flex: 1, overflow: "auto", background: "#080810", position: "relative" }}>
          <canvas
            ref={mapCanvasRef}
            onPointerDown={onMapPointerDown}
            onPointerMove={onMapPointerMove}
            onPointerUp={onMapPointerUp}
            onPointerLeave={onMapPointerUp}
            style={{ cursor: tool === "erase" ? "cell" : "crosshair", display: "block", margin: 8, imageRendering: "pixelated" }}
          />
          <CornerDismissLayer />
        </div>

        {collapse && (
          <>
            <CornerPanel id="controls" corner="top-left" label="CTRL">{controlsBar}</CornerPanel>
            <CornerPanel id="sheet" corner="top-right" label="SHEET">{sheetPanel}</CornerPanel>
            <CornerPanel id="status" corner="bottom-left" label="STAT">
              <div style={{ padding: 6, fontSize: 10, color: "#888" }}>
                <div>{status}</div>
                <div style={{ marginTop: 4 }}>Plane {activePlane === 0 ? "A" : "B"} · tile #{selectedTile} · pal {selectedPalette}</div>
                <div style={{ marginTop: 4 }}>H = toggle UI</div>
              </div>
            </CornerPanel>
          </>
        )}

        <VerticalChromeToggle corner="bottom-right" />
      </div>
    </div>
  );
}
