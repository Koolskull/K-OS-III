"use client";

/*
 *                    ☦
 *      NODEMAP — K-OS III APP
 *
 *  Accurate world-space hit testing, pinch zoom, node rotation,
 *  wire routing continuum (straight → smooth → circuit grid).
 *  Compact SHIFT pad lower-left. Epistemic Stance is separate.
 */

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createDemoProject } from "./demo";
import {
  applyZoomAt,
  distToPolyline,
  hitNode,
  nodeCenter,
  nodeRotation,
  routeWirePoints,
  screenToWorld,
  strokePolyline,
} from "./geometry";
import { loadProject, saveProject } from "./storage";
import {
  DEFAULT_NODE_STYLE,
  DEFAULT_WIRE_ROUTING,
  DEFAULT_WIRE_STYLE,
  type EditTarget,
  type MapNode,
  type MapProject,
  type MapWire,
  type NodeStyle,
  type ToolMode,
  type WireStyle,
  type WireStyleProps,
  uid,
} from "./types";

interface Props { isFocused?: boolean; }

type DragMode =
  | { kind: "none" }
  | { kind: "pan"; sx: number; sy: number; ox: number; oy: number }
  | { kind: "node"; id: string; ox: number; oy: number; sx: number; sy: number }
  | {
      kind: "pinch";
      id0: number;
      id1: number;
      dist0: number;
      scale0: number;
      midX: number;
      midY: number;
      vpX0: number;
      vpY0: number;
    };

function hitWire(
  wires: MapWire[],
  nodes: MapNode[],
  wx: number,
  wy: number,
  routing: number,
  scale: number,
): MapWire | null {
  const byId = new Map(nodes.map((n) => [n.id, n]));
  const threshold = 10 / Math.max(scale, 0.35);
  for (const w of wires) {
    const a = byId.get(w.from), b = byId.get(w.to);
    if (!a || !b) continue;
    const pts = routeWirePoints(a, b, routing);
    if (distToPolyline(pts, wx, wy) <= threshold + w.style.width) return w;
  }
  return null;
}

function drawHardRect(
  ctx: CanvasRenderingContext2D,
  x: number, y: number, w: number, h: number, r: number,
  fill: string, stroke: string, lineW: number,
) {
  ctx.beginPath();
  if (r <= 0) ctx.rect(x, y, w, h);
  else {
    const rr = Math.min(r, w / 2, h / 2);
    ctx.moveTo(x + rr, y);
    ctx.arcTo(x + w, y, x + w, y + h, rr);
    ctx.arcTo(x + w, y + h, x, y + h, rr);
    ctx.arcTo(x, y + h, x, y, rr);
    ctx.arcTo(x, y, x + w, y, rr);
    ctx.closePath();
  }
  ctx.fillStyle = fill; ctx.fill();
  ctx.lineWidth = lineW; ctx.strokeStyle = stroke; ctx.stroke();
}

function wrapText(
  ctx: CanvasRenderingContext2D, text: string, x: number, y: number,
  maxW: number, lineH: number, maxLines: number,
) {
  let drawn = 0;
  for (const paragraph of text.split("\n")) {
    const words = paragraph.split(/\s+/).filter(Boolean);
    let line = "";
    for (const word of words) {
      const test = line ? line + " " + word : word;
      if (ctx.measureText(test).width > maxW && line) {
        ctx.fillText(line, x, y + drawn * lineH); drawn++;
        if (drawn >= maxLines) return;
        line = word;
      } else line = test;
    }
    if (line) { ctx.fillText(line, x, y + drawn * lineH); drawn++; if (drawn >= maxLines) return; }
  }
}

export function NodeMapApp({ isFocused = true }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const dragRef = useRef<DragMode>({ kind: "none" });
  const spaceRef = useRef(false);
  const pointersRef = useRef<Map<number, { x: number; y: number }>>(new Map());
  const projectRef = useRef<MapProject>(createDemoProject());
  const [project, setProject] = useState<MapProject>(() => createDemoProject());
  const [viewport, setViewport] = useState({ x: 40, y: 40, scale: 1 });
  const [tool, setTool] = useState<ToolMode>("select");
  const [shiftHeld, setShiftHeld] = useState(false);
  const [shiftToggle, setShiftToggle] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [connectFrom, setConnectFrom] = useState<string | null>(null);
  const [editTarget, setEditTarget] = useState<EditTarget>(null);
  const [panel, setPanel] = useState<"none" | "edit" | "about" | "help">("none");
  const [hydrated, setHydrated] = useState(false);
  const shiftOn = shiftHeld || shiftToggle;
  const routing = project.wireRouting ?? DEFAULT_WIRE_ROUTING;

  useEffect(() => {
    const saved = loadProject();
    if (saved) { setProject(saved); projectRef.current = saved; }
    setHydrated(true);
  }, []);

  const persist = useCallback((p: MapProject) => { projectRef.current = p; saveProject(p); }, []);
  const updateProject = useCallback((fn: (p: MapProject) => MapProject) => {
    setProject((prev) => { const next = fn(prev); persist(next); return next; });
  }, [persist]);

  useEffect(() => { projectRef.current = project; }, [project]);

  const paint = useCallback(() => {
    const canvas = canvasRef.current; if (!canvas) return;
    const ctx = canvas.getContext("2d"); if (!ctx) return;
    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    const W = Math.max(1, Math.floor(rect.width * dpr));
    const H = Math.max(1, Math.floor(rect.height * dpr));
    if (canvas.width !== W || canvas.height !== H) { canvas.width = W; canvas.height = H; }
    const proj = projectRef.current; const vp = viewport;
    const rt = proj.wireRouting ?? DEFAULT_WIRE_ROUTING;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.imageSmoothingEnabled = true; ctx.imageSmoothingQuality = "high";
    ctx.fillStyle = "#050505"; ctx.fillRect(0, 0, rect.width, rect.height);
    ctx.save(); ctx.translate(vp.x, vp.y); ctx.scale(vp.scale, vp.scale);
    const grid = 24;
    const startX = Math.floor(-vp.x / vp.scale / grid) * grid - grid;
    const startY = Math.floor(-vp.y / vp.scale / grid) * grid - grid;
    const endX = startX + rect.width / vp.scale + grid * 3;
    const endY = startY + rect.height / vp.scale + grid * 3;
    ctx.strokeStyle = "#121212"; ctx.lineWidth = 1 / vp.scale; ctx.beginPath();
    for (let x = startX; x < endX; x += grid) { ctx.moveTo(x, startY); ctx.lineTo(x, endY); }
    for (let y = startY; y < endY; y += grid) { ctx.moveTo(startX, y); ctx.lineTo(endX, y); }
    ctx.stroke();
    const byId = new Map(proj.nodes.map((n) => [n.id, n]));
    for (const wire of proj.wires) {
      const a = byId.get(wire.from), b = byId.get(wire.to); if (!a || !b) continue;
      const pts = routeWirePoints(a, b, rt);
      strokePolyline(ctx, pts);
      ctx.lineCap = rt > 0.75 ? "square" : "round";
      ctx.lineJoin = rt > 0.75 ? "miter" : "round";
      if (wire.style.style === "dashed") ctx.setLineDash([8 / vp.scale, 6 / vp.scale]);
      else ctx.setLineDash([]);
      const baseW = wire.style.style === "thick" ? Math.max(wire.style.width, 4) : wire.style.width;
      ctx.strokeStyle = "#ffffff"; ctx.globalAlpha = 0.35; ctx.lineWidth = baseW + 2; ctx.stroke();
      ctx.globalAlpha = 1; ctx.strokeStyle = wire.style.color; ctx.lineWidth = baseW; ctx.stroke();
      ctx.setLineDash([]);
      if (wire.title && pts.length) {
        const mid = pts[Math.floor(pts.length / 2)]!;
        ctx.font = "10px var(--dm-font-primary), monospace";
        ctx.fillStyle = wire.style.color; ctx.textAlign = "center";
        ctx.fillText(wire.title, mid.x, mid.y - 8); ctx.textAlign = "left";
      }
    }
    for (const node of proj.nodes) {
      const selected = selectedIds.includes(node.id) || connectFrom === node.id;
      const rot = nodeRotation(node);
      const c = nodeCenter(node);
      ctx.save();
      ctx.translate(c.x, c.y);
      ctx.rotate((rot * Math.PI) / 180);
      ctx.translate(-node.w / 2, -node.h / 2);
      drawHardRect(ctx, 0, 0, node.w, node.h, node.style.roundness, node.style.bg,
        selected ? "#00ff00" : node.style.border,
        selected ? Math.max(node.style.borderWidth, 2) + 1 : node.style.borderWidth);
      ctx.fillStyle = node.style.border; ctx.globalAlpha = 0.12;
      ctx.fillRect(1, 1, node.w - 2, 22); ctx.globalAlpha = 1;
      ctx.fillStyle = node.style.text;
      ctx.font = "bold 11px var(--dm-font-primary), monospace";
      ctx.fillText(node.title.slice(0, 28), 10, 17);
      if (node.body) {
        ctx.font = "10px var(--dm-font-primary), monospace";
        ctx.globalAlpha = 0.85;
        wrapText(ctx, node.body, 10, 38, node.w - 20, 13, 4);
        ctx.globalAlpha = 1;
      }
      ctx.fillStyle = selected ? "#00ff00" : node.style.border;
      ctx.fillRect(node.w / 2 - 3, -3, 6, 6);
      ctx.fillRect(node.w / 2 - 3, node.h - 3, 6, 6);
      ctx.restore();
    }
    ctx.restore();
  }, [viewport, selectedIds, connectFrom, project]);

  useEffect(() => {
    let id = 0;
    const loop = () => { paint(); id = requestAnimationFrame(loop); };
    id = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(id);
  }, [paint]);

  const deleteNode = useCallback((id: string) => {
    updateProject((p) => ({
      ...p,
      nodes: p.nodes.filter((n) => n.id !== id),
      wires: p.wires.filter((w) => w.from !== id && w.to !== id),
      updatedAt: Date.now(),
    }));
    setSelectedIds((s) => s.filter((x) => x !== id));
    setEditTarget((t) => (t?.kind === "node" && t.id === id ? null : t));
    setPanel((p) => (p === "edit" ? "none" : p));
  }, [updateProject]);

  const deleteWire = useCallback((id: string) => {
    updateProject((p) => ({ ...p, wires: p.wires.filter((w) => w.id !== id), updatedAt: Date.now() }));
    setEditTarget((t) => (t?.kind === "wire" && t.id === id ? null : t));
  }, [updateProject]);

  const addNodeAtCenter = useCallback(() => {
    const canvas = canvasRef.current; if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const cx = (rect.width / 2 - viewport.x) / viewport.scale;
    const cy = (rect.height / 2 - viewport.y) / viewport.scale;
    const node: MapNode = {
      id: uid("n"), x: cx - 80, y: cy - 44, w: 160, h: 88, rotation: 0,
      title: "NEW NODE", body: "", style: { ...DEFAULT_NODE_STYLE },
    };
    updateProject((p) => ({ ...p, nodes: [...p.nodes, node], updatedAt: Date.now() }));
    setSelectedIds([node.id]); setEditTarget({ kind: "node", id: node.id }); setPanel("edit");
  }, [updateProject, viewport]);

  useEffect(() => {
    if (!isFocused) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Shift") setShiftHeld(e.type === "keydown");
      if (e.code === "Space") { spaceRef.current = e.type === "keydown"; if (e.type === "keydown") e.preventDefault(); }
      if (e.type !== "keydown") return;
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA") return;
      if (e.key === "Delete" || e.key === "Backspace") {
        if (editTarget?.kind === "node") deleteNode(editTarget.id);
        else if (editTarget?.kind === "wire") deleteWire(editTarget.id);
        else if (selectedIds[0]) deleteNode(selectedIds[0]!);
      }
      if (e.key === "n" || e.key === "N") addNodeAtCenter();
      if (e.key === "v" || e.key === "V") setTool("select");
      if (e.key === "c" || e.key === "C") setTool("connect");
      if (e.key === "h" || e.key === "H") setTool("pan");
    };
    window.addEventListener("keydown", onKey); window.addEventListener("keyup", onKey);
    return () => { window.removeEventListener("keydown", onKey); window.removeEventListener("keyup", onKey); };
  }, [isFocused, editTarget, selectedIds, deleteNode, deleteWire, addNodeAtCenter]);

  const beginPinch = () => {
    const pts = [...pointersRef.current.entries()];
    if (pts.length < 2) return;
    const [id0, a] = pts[0]!;
    const [id1, b] = pts[1]!;
    const dist0 = Math.hypot(b.x - a.x, b.y - a.y) || 1;
    const canvas = canvasRef.current; if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    dragRef.current = {
      kind: "pinch", id0, id1, dist0, scale0: viewport.scale,
      midX: (a.x + b.x) / 2 - rect.left, midY: (a.y + b.y) / 2 - rect.top,
      vpX0: viewport.x, vpY0: viewport.y,
    };
  };

  const onPointerDown = (e: React.PointerEvent) => {
    const canvas = canvasRef.current; if (!canvas) return;
    canvas.setPointerCapture(e.pointerId);
    pointersRef.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (pointersRef.current.size >= 2) { beginPinch(); return; }

    const rect = canvas.getBoundingClientRect();
    const world = screenToWorld(e.clientX, e.clientY, rect, viewport);
    const node = hitNode(project.nodes, world.x, world.y);
    const wire = !node
      ? hitWire(project.wires, project.nodes, world.x, world.y, routing, viewport.scale)
      : null;

    if (shiftOn && (node || wire)) {
      if (node) { setSelectedIds([node.id]); setEditTarget({ kind: "node", id: node.id }); setPanel("edit"); }
      else if (wire) { setSelectedIds([]); setEditTarget({ kind: "wire", id: wire.id }); setPanel("edit"); }
      dragRef.current = { kind: "none" }; return;
    }
    if (tool === "pan" || spaceRef.current || e.button === 1) {
      dragRef.current = { kind: "pan", sx: e.clientX, sy: e.clientY, ox: viewport.x, oy: viewport.y }; return;
    }
    if (tool === "connect") {
      if (node) {
        if (!connectFrom) { setConnectFrom(node.id); setSelectedIds([node.id]); }
        else if (connectFrom !== node.id) {
          const from = connectFrom, to = node.id;
          updateProject((p) => {
            if (p.wires.some((w) => (w.from === from && w.to === to) || (w.from === to && w.to === from))) return p;
            const w: MapWire = { id: uid("w"), from, to, title: "", style: { ...DEFAULT_WIRE_STYLE } };
            return { ...p, wires: [...p.wires, w], updatedAt: Date.now() };
          });
          setConnectFrom(null); setSelectedIds([node.id]);
        }
      }
      dragRef.current = { kind: "none" }; return;
    }
    if (node) {
      setSelectedIds([node.id]); setEditTarget(null); if (panel === "edit") setPanel("none");
      dragRef.current = { kind: "node", id: node.id, ox: node.x, oy: node.y, sx: e.clientX, sy: e.clientY };
    } else if (wire) {
      setSelectedIds([]); setEditTarget({ kind: "wire", id: wire.id }); dragRef.current = { kind: "none" };
    } else {
      setSelectedIds([]); setEditTarget(null); if (panel === "edit") setPanel("none");
      dragRef.current = { kind: "pan", sx: e.clientX, sy: e.clientY, ox: viewport.x, oy: viewport.y };
    }
  };

  const onPointerMove = (e: React.PointerEvent) => {
    if (pointersRef.current.has(e.pointerId)) {
      pointersRef.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    }
    const drag = dragRef.current;
    if (drag.kind === "pinch") {
      const p0 = pointersRef.current.get(drag.id0);
      const p1 = pointersRef.current.get(drag.id1);
      if (!p0 || !p1) return;
      const canvas = canvasRef.current; if (!canvas) return;
      const rect = canvas.getBoundingClientRect();
      const dist = Math.hypot(p1.x - p0.x, p1.y - p0.y) || 1;
      const midX = (p0.x + p1.x) / 2 - rect.left;
      const midY = (p0.y + p1.y) / 2 - rect.top;
      const zoomed = applyZoomAt(
        { x: drag.vpX0, y: drag.vpY0, scale: drag.scale0 },
        drag.midX, drag.midY, drag.scale0 * (dist / drag.dist0),
      );
      setViewport({
        scale: zoomed.scale,
        x: zoomed.x + (midX - drag.midX),
        y: zoomed.y + (midY - drag.midY),
      });
      return;
    }
    if (drag.kind === "pan") {
      setViewport({ x: drag.ox + (e.clientX - drag.sx), y: drag.oy + (e.clientY - drag.sy), scale: viewport.scale });
    } else if (drag.kind === "node") {
      const nx = Math.round(drag.ox + (e.clientX - drag.sx) / viewport.scale);
      const ny = Math.round(drag.oy + (e.clientY - drag.sy) / viewport.scale);
      setProject((p) => {
        const next = { ...p, nodes: p.nodes.map((n) => n.id === drag.id ? { ...n, x: nx, y: ny } : n) };
        projectRef.current = next; return next;
      });
    }
  };

  const onPointerUp = (e: React.PointerEvent) => {
    pointersRef.current.delete(e.pointerId);
    if (dragRef.current.kind === "node") persist(projectRef.current);
    if (pointersRef.current.size >= 2) beginPinch();
    else if (pointersRef.current.size === 1) {
      const [, p] = [...pointersRef.current.entries()][0]!;
      dragRef.current = { kind: "pan", sx: p.x, sy: p.y, ox: viewport.x, oy: viewport.y };
    } else dragRef.current = { kind: "none" };
  };

  const onWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const canvas = canvasRef.current; if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    setViewport(applyZoomAt(viewport, e.clientX - rect.left, e.clientY - rect.top,
      viewport.scale * (e.deltaY > 0 ? 0.9 : 1.1)));
  };

  const editNode = useMemo(
    () => editTarget?.kind === "node" ? project.nodes.find((n) => n.id === editTarget.id) ?? null : null,
    [editTarget, project.nodes],
  );
  const editWire = useMemo(
    () => editTarget?.kind === "wire" ? project.wires.find((w) => w.id === editTarget.id) ?? null : null,
    [editTarget, project.wires],
  );
  const patchNode = (id: string, patch: Partial<MapNode>) =>
    updateProject((p) => ({ ...p, nodes: p.nodes.map((n) => n.id === id ? { ...n, ...patch } : n), updatedAt: Date.now() }));
  const patchNodeStyle = (id: string, style: Partial<NodeStyle>) =>
    updateProject((p) => ({ ...p, nodes: p.nodes.map((n) => n.id === id ? { ...n, style: { ...n.style, ...style } } : n), updatedAt: Date.now() }));
  const patchWire = (id: string, patch: Partial<MapWire>) =>
    updateProject((p) => ({ ...p, wires: p.wires.map((w) => w.id === id ? { ...w, ...patch } : w), updatedAt: Date.now() }));
  const patchWireStyle = (id: string, style: Partial<WireStyleProps>) =>
    updateProject((p) => ({ ...p, wires: p.wires.map((w) => w.id === id ? { ...w, style: { ...w.style, ...style } } : w), updatedAt: Date.now() }));

  const btn: React.CSSProperties = {
    border: "1px solid #fff", background: "#000", color: "#fff",
    fontFamily: "inherit", fontSize: 10, letterSpacing: 1, padding: "5px 8px", cursor: "pointer",
  };
  const input: React.CSSProperties = {
    border: "1px solid #555", background: "#000", color: "#fff",
    fontFamily: "inherit", fontSize: 11, padding: "4px 6px", maxWidth: 140,
  };

  return (
    <div style={{
      width: "100%", height: "100%", position: "relative", background: "#050505",
      color: "#fff", fontFamily: "var(--dm-font-primary), monospace", overflow: "hidden", imageRendering: "pixelated",
    }}>
      <canvas
        ref={canvasRef}
        style={{
          position: "absolute", inset: 0, width: "100%", height: "100%", touchAction: "none",
          cursor: tool === "pan" ? "grab" : tool === "connect" ? "crosshair" : "default",
        }}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
        onWheel={onWheel}
      />

      <div style={{ position: "absolute", top: 8, left: 8, right: 8, zIndex: 20, display: "flex", flexWrap: "wrap", gap: 4, pointerEvents: "none" }}>
        <div style={{
          pointerEvents: "auto", display: "flex", flexWrap: "wrap", gap: 4, alignItems: "center",
          border: "1px solid #fff", background: "#0c0c0c", padding: "4px 6px",
        }}>
          <span style={{ fontSize: 10, letterSpacing: 2, color: "#00ff00" }}>NODEMAP</span>
          <input value={project.name}
            onChange={(e) => updateProject((p) => ({ ...p, name: e.target.value, updatedAt: Date.now() }))}
            style={input} />
          <button type="button" style={{ ...btn, ...(tool === "select" ? { background: "#fff", color: "#000" } : {}) }} onClick={() => setTool("select")}>SEL</button>
          <button type="button" style={{ ...btn, ...(tool === "connect" ? { background: "#fff", color: "#000" } : {}) }} onClick={() => setTool("connect")}>CONN</button>
          <button type="button" style={{ ...btn, ...(tool === "pan" ? { background: "#fff", color: "#000" } : {}) }} onClick={() => setTool("pan")}>PAN</button>
          <button type="button" style={btn} onClick={addNodeAtCenter}>+ NODE</button>
          <button type="button" style={{ ...btn, ...(panel === "about" ? { background: "#fff", color: "#000" } : {}) }} onClick={() => setPanel(panel === "about" ? "none" : "about")}>ABOUT</button>
          <button type="button" style={{ ...btn, ...(panel === "help" ? { background: "#fff", color: "#000" } : {}) }} onClick={() => setPanel(panel === "help" ? "none" : "help")}>HELP</button>
          <button type="button" style={btn} onClick={() => {
            if (window.confirm("Reset to demo map?")) {
              const d = createDemoProject(); setProject(d); persist(d); setEditTarget(null); setPanel("none");
            }
          }}>DEMO</button>
        </div>
      </div>

      {/* Compact SHIFT lower-left */}
      <div style={{ position: "absolute", left: 10, bottom: 12, zIndex: 40, display: "flex", flexDirection: "column", alignItems: "flex-start", gap: 4 }}>
        {shiftOn && (
          <div style={{ border: "1px solid #00ff00", background: "#0a0a0a", color: "#00ff00", fontSize: 8, letterSpacing: 1, padding: "2px 6px" }}>
            SHIFT — EDIT
          </div>
        )}
        <button type="button" aria-pressed={shiftOn} aria-label="SHIFT modifier lower left"
          onClick={() => setShiftToggle((v) => !v)}
          style={{
            width: 56, height: 44,
            border: "2px solid " + (shiftOn ? "#00ff00" : "#fff"),
            background: shiftOn ? "#00ff00" : "#0c0c0c",
            color: shiftOn ? "#000" : "#fff",
            fontFamily: "inherit", fontSize: 11, letterSpacing: 2, fontWeight: 700,
            cursor: "pointer", boxShadow: "2px 2px 0 #000",
          }}>
          SHIFT
        </button>
      </div>

      {/* Wire routing + status */}
      <div style={{
        position: "absolute", left: 74, right: 10, bottom: 12, zIndex: 30,
        display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8, pointerEvents: "none",
      }}>
        <div style={{
          pointerEvents: "auto", display: "flex", alignItems: "center", gap: 6,
          border: "1px solid #444", background: "rgba(0,0,0,0.9)", padding: "4px 8px",
        }}>
          <span style={{ fontSize: 9, letterSpacing: 1, color: "#888" }}>WIRES</span>
          <span style={{ fontSize: 8, color: "#666" }}>STR</span>
          <input type="range" min={0} max={100} value={Math.round(routing * 100)}
            onChange={(e) => updateProject((p) => ({
              ...p, wireRouting: Number(e.target.value) / 100, updatedAt: Date.now(),
            }))}
            style={{ width: 90, accentColor: "#00ff00" }}
            aria-label="Wire routing straight to grid" />
          <span style={{ fontSize: 8, color: "#666" }}>GRID</span>
        </div>
        <div style={{
          fontSize: 9, letterSpacing: 1, color: "#666", border: "1px solid #333",
          background: "rgba(0,0,0,0.85)", padding: "4px 8px",
        }}>
          {hydrated ? project.nodes.length + " nodes · " + project.wires.length + " wires · local" : "loading…"}
        </div>
      </div>

      {panel === "edit" && (editNode || editWire) && (
        <aside style={{
          position: "absolute", top: 48, right: 10, width: 260, maxHeight: "min(70%, 520px)",
          zIndex: 30, border: "1px solid #fff", background: "#0a0a0a",
          display: "flex", flexDirection: "column", overflow: "hidden", boxShadow: "3px 3px 0 #000",
        }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid #fff", padding: "6px 8px" }}>
            <span style={{ color: "#00ff00", letterSpacing: 2, fontSize: 11 }}>{editNode ? "EDIT NODE" : "EDIT WIRE"}</span>
            <button type="button" style={btn} onClick={() => { setPanel("none"); setEditTarget(null); }}>X</button>
          </div>
          <div style={{ overflowY: "auto", padding: 10, flex: 1 }}>
            {editNode && (<>
              <div style={{ fontSize: 9, color: "#888", marginBottom: 3 }}>TITLE</div>
              <input style={{ ...input, width: "100%", maxWidth: "100%", marginBottom: 8 }}
                value={editNode.title} onChange={(e) => patchNode(editNode.id, { title: e.target.value })} />
              <div style={{ fontSize: 9, color: "#888", marginBottom: 3 }}>BODY</div>
              <textarea style={{ ...input, width: "100%", maxWidth: "100%", minHeight: 64, marginBottom: 8 }}
                value={editNode.body} onChange={(e) => patchNode(editNode.id, { body: e.target.value })} />
              <div style={{ fontSize: 9, color: "#888", marginBottom: 3 }}>BACKGROUND</div>
              <input type="color" value={editNode.style.bg}
                onChange={(e) => patchNodeStyle(editNode.id, { bg: e.target.value })}
                style={{ width: "100%", marginBottom: 6, height: 32, background: "#000" }} />
              <div style={{ fontSize: 9, color: "#888", marginBottom: 3 }}>BORDER</div>
              <input type="color" value={editNode.style.border}
                onChange={(e) => patchNodeStyle(editNode.id, { border: e.target.value })}
                style={{ width: "100%", marginBottom: 6, height: 32, background: "#000" }} />
              <div style={{ fontSize: 9, color: "#888", marginBottom: 3 }}>TEXT</div>
              <input type="color" value={editNode.style.text}
                onChange={(e) => patchNodeStyle(editNode.id, { text: e.target.value })}
                style={{ width: "100%", marginBottom: 6, height: 32, background: "#000" }} />
              <div style={{ fontSize: 9, color: "#888", marginBottom: 3 }}>ROUNDNESS ({editNode.style.roundness})</div>
              <input type="range" min={0} max={24} value={editNode.style.roundness}
                onChange={(e) => patchNodeStyle(editNode.id, { roundness: Number(e.target.value) })}
                style={{ width: "100%", marginBottom: 8 }} />
              <div style={{ fontSize: 9, color: "#888", marginBottom: 3 }}>
                ROTATION ({Math.round(editNode.rotation ?? 0)}°)
              </div>
              <div style={{ display: "flex", gap: 6, marginBottom: 8, alignItems: "center" }}>
                <input type="range" min={-180} max={180} value={editNode.rotation ?? 0}
                  onChange={(e) => patchNode(editNode.id, { rotation: Number(e.target.value) })}
                  style={{ flex: 1 }} />
                <button type="button" style={{ ...btn, padding: "4px 6px" }}
                  onClick={() => patchNode(editNode.id, { rotation: 0 })}>0°</button>
              </div>
              <button type="button" style={{ ...btn, width: "100%", color: "#ff6666", borderColor: "#ff6666" }}
                onClick={() => deleteNode(editNode.id)}>DELETE NODE</button>
            </>)}
            {editWire && (<>
              <div style={{ fontSize: 9, color: "#888", marginBottom: 3 }}>TITLE</div>
              <input style={{ ...input, width: "100%", maxWidth: "100%", marginBottom: 8 }}
                value={editWire.title} onChange={(e) => patchWire(editWire.id, { title: e.target.value })} />
              <div style={{ fontSize: 9, color: "#888", marginBottom: 3 }}>COLOR</div>
              <input type="color" value={editWire.style.color}
                onChange={(e) => patchWireStyle(editWire.id, { color: e.target.value })}
                style={{ width: "100%", marginBottom: 6, height: 32, background: "#000" }} />
              <div style={{ fontSize: 9, color: "#888", marginBottom: 3 }}>STYLE</div>
              <div style={{ display: "flex", gap: 4, marginBottom: 8 }}>
                {(["solid", "dashed", "thick"] as WireStyle[]).map((s) => (
                  <button key={s} type="button"
                    style={{ ...btn, flex: 1, background: editWire.style.style === s ? "#fff" : "#000", color: editWire.style.style === s ? "#000" : "#fff" }}
                    onClick={() => patchWireStyle(editWire.id, {
                      style: s, width: s === "thick" ? Math.max(editWire.style.width, 4) : editWire.style.width,
                    })}>{s}</button>
                ))}
              </div>
              <button type="button" style={{ ...btn, width: "100%", color: "#ff6666", borderColor: "#ff6666" }}
                onClick={() => deleteWire(editWire.id)}>DELETE WIRE</button>
            </>)}
          </div>
        </aside>
      )}

      {panel === "about" && (
        <aside style={{ position: "absolute", top: 48, right: 10, width: 300, zIndex: 30, border: "1px solid #fff", background: "#0a0a0a", boxShadow: "3px 3px 0 #000" }}>
          <div style={{ display: "flex", justifyContent: "space-between", padding: "6px 8px", borderBottom: "1px solid #fff" }}>
            <span style={{ color: "#00ff00", letterSpacing: 2, fontSize: 11 }}>ABOUT NODEMAP</span>
            <button type="button" style={btn} onClick={() => setPanel("none")}>X</button>
          </div>
          <div style={{ padding: 12, fontSize: 11, lineHeight: 1.5, color: "#bbb" }}>
            <p>Modular visual node builder. Pinch to zoom, rotate nodes in edit, wire routing slider (straight → smooth → grid).</p>
            <p>Influenced by Dylan Louis Monroe (dsmp.io). Original tool — no DSMP assets.</p>
            <p style={{ color: "#666" }}>Method: open desktop app EPISTEMIC STANCE.</p>
          </div>
        </aside>
      )}

      {panel === "help" && (
        <aside style={{ position: "absolute", top: 48, right: 10, width: 280, zIndex: 30, border: "1px solid #fff", background: "#0a0a0a" }}>
          <div style={{ display: "flex", justifyContent: "space-between", padding: "6px 8px", borderBottom: "1px solid #fff" }}>
            <span style={{ color: "#00ff00", letterSpacing: 2, fontSize: 11 }}>CONTROLS</span>
            <button type="button" style={btn} onClick={() => setPanel("none")}>X</button>
          </div>
          <ul style={{ margin: 0, padding: 0, listStyle: "none", fontSize: 10 }}>
            {[
              ["SHIFT pad", "Edit modifier"],
              ["Pinch / wheel", "Zoom"],
              ["Wires slider", "Straight→smooth→grid"],
              ["Edit · rotation", "Rotate node"],
              ["CONN", "Wire nodes"],
            ].map(([k, v]) => (
              <li key={k} style={{ display: "flex", justifyContent: "space-between", padding: "8px 12px", borderBottom: "1px solid #222" }}>
                <span style={{ color: "#fff" }}>{k}</span><span style={{ color: "#888" }}>{v}</span>
              </li>
            ))}
          </ul>
        </aside>
      )}
    </div>
  );
}

export default NodeMapApp;
