"use client";

/*
 *                    ☦
 *      NODEMAP — K-OS III APP
 *
 *  Modular node/tree builder. SHIFT pad lower-left.
 *  Epistemic Stance is a SEPARATE desktop app.
 *  Influence: Dylan Louis Monroe (dsmp.io) — original tool only.
 */

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createDemoProject } from "./demo";
import { loadProject, saveProject } from "./storage";
import {
  DEFAULT_NODE_STYLE,
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
  | { kind: "node"; id: string; ox: number; oy: number; sx: number; sy: number };

function wirePath(a: MapNode, b: MapNode) {
  const x1 = a.x + a.w / 2, y1 = a.y + a.h / 2, x2 = b.x + b.w / 2, y2 = b.y + b.h / 2;
  const dx = Math.abs(x2 - x1) * 0.4;
  return { x1, y1, x2, y2, c1x: x1 + dx, c1y: y1, c2x: x2 - dx, c2y: y2 };
}

function hitNode(nodes: MapNode[], wx: number, wy: number): MapNode | null {
  for (let i = nodes.length - 1; i >= 0; i--) {
    const n = nodes[i]!;
    if (wx >= n.x && wx <= n.x + n.w && wy >= n.y && wy <= n.y + n.h) return n;
  }
  return null;
}

function hitWire(wires: MapWire[], nodes: MapNode[], wx: number, wy: number): MapWire | null {
  const byId = new Map(nodes.map((n) => [n.id, n]));
  for (const w of wires) {
    const a = byId.get(w.from), b = byId.get(w.to);
    if (!a || !b) continue;
    const p = wirePath(a, b);
    for (let t = 0; t <= 1; t += 0.04) {
      const u = 1 - t;
      const x = u*u*u*p.x1 + 3*u*u*t*p.c1x + 3*u*t*t*p.c2x + t*t*t*p.x2;
      const y = u*u*u*p.y1 + 3*u*u*t*p.c1y + 3*u*t*t*p.c2y + t*t*t*p.y2;
      if (Math.hypot(wx - x, wy - y) <= 8 + w.style.width) return w;
    }
  }
  return null;
}

function drawHardRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number, fill: string, stroke: string, lineW: number) {
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

function wrapText(ctx: CanvasRenderingContext2D, text: string, x: number, y: number, maxW: number, lineH: number, maxLines: number) {
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
      const p = wirePath(a, b);
      ctx.beginPath(); ctx.moveTo(p.x1, p.y1); ctx.bezierCurveTo(p.c1x, p.c1y, p.c2x, p.c2y, p.x2, p.y2);
      ctx.lineCap = "square";
      if (wire.style.style === "dashed") ctx.setLineDash([8 / vp.scale, 6 / vp.scale]); else ctx.setLineDash([]);
      const baseW = wire.style.style === "thick" ? Math.max(wire.style.width, 4) : wire.style.width;
      ctx.strokeStyle = "#ffffff"; ctx.globalAlpha = 0.35; ctx.lineWidth = baseW + 2; ctx.stroke();
      ctx.globalAlpha = 1; ctx.strokeStyle = wire.style.color; ctx.lineWidth = baseW; ctx.stroke();
      ctx.setLineDash([]);
      if (wire.title) {
        ctx.font = "10px var(--dm-font-primary), monospace"; ctx.fillStyle = wire.style.color; ctx.textAlign = "center";
        ctx.fillText(wire.title, (p.x1 + p.x2) / 2, (p.y1 + p.y2) / 2 - 8); ctx.textAlign = "left";
      }
    }
    for (const node of proj.nodes) {
      const selected = selectedIds.includes(node.id) || connectFrom === node.id;
      drawHardRect(ctx, node.x, node.y, node.w, node.h, node.style.roundness, node.style.bg, selected ? "#ffff00" : node.style.border, selected ? Math.max(node.style.borderWidth, 2) + 1 : node.style.borderWidth);
      ctx.fillStyle = node.style.border; ctx.globalAlpha = 0.12; ctx.fillRect(node.x + 1, node.y + 1, node.w - 2, 22); ctx.globalAlpha = 1;
      ctx.fillStyle = node.style.text; ctx.font = "bold 11px var(--dm-font-primary), monospace";
      ctx.fillText(node.title.slice(0, 28), node.x + 10, node.y + 17);
      if (node.body) { ctx.font = "10px var(--dm-font-primary), monospace"; ctx.globalAlpha = 0.85; wrapText(ctx, node.body, node.x + 10, node.y + 38, node.w - 20, 13, 4); ctx.globalAlpha = 1; }
      ctx.fillStyle = selected ? "#ffff00" : node.style.border;
      ctx.fillRect(node.x + node.w / 2 - 3, node.y - 3, 6, 6);
      ctx.fillRect(node.x + node.w / 2 - 3, node.y + node.h - 3, 6, 6);
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
    updateProject((p) => ({ ...p, nodes: p.nodes.filter((n) => n.id !== id), wires: p.wires.filter((w) => w.from !== id && w.to !== id), updatedAt: Date.now() }));
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
    const node: MapNode = { id: uid("n"), x: cx - 80, y: cy - 44, w: 160, h: 88, title: "NEW NODE", body: "", style: { ...DEFAULT_NODE_STYLE } };
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

  const clientToWorld = (clientX: number, clientY: number) => {
    const canvas = canvasRef.current!; const rect = canvas.getBoundingClientRect();
    return { x: (clientX - rect.left - viewport.x) / viewport.scale, y: (clientY - rect.top - viewport.y) / viewport.scale };
  };

  const onPointerDown = (e: React.PointerEvent) => {
    const canvas = canvasRef.current; if (!canvas) return;
    canvas.setPointerCapture(e.pointerId);
    const world = clientToWorld(e.clientX, e.clientY);
    const node = hitNode(project.nodes, world.x, world.y);
    const wire = !node ? hitWire(project.wires, project.nodes, world.x, world.y) : null;
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
    } else if (wire) { setSelectedIds([]); setEditTarget({ kind: "wire", id: wire.id }); }
    else {
      setSelectedIds([]); setEditTarget(null); if (panel === "edit") setPanel("none");
      dragRef.current = { kind: "pan", sx: e.clientX, sy: e.clientY, ox: viewport.x, oy: viewport.y };
    }
  };

  const onPointerMove = (e: React.PointerEvent) => {
    const drag = dragRef.current;
    if (drag.kind === "pan") setViewport({ ...viewport, x: drag.ox + (e.clientX - drag.sx), y: drag.oy + (e.clientY - drag.sy) });
    else if (drag.kind === "node") {
      const nx = Math.round(drag.ox + (e.clientX - drag.sx) / viewport.scale);
      const ny = Math.round(drag.oy + (e.clientY - drag.sy) / viewport.scale);
      setProject((p) => { const next = { ...p, nodes: p.nodes.map((n) => n.id === drag.id ? { ...n, x: nx, y: ny } : n) }; projectRef.current = next; return next; });
    }
  };
  const onPointerUp = () => { if (dragRef.current.kind === "node") persist(projectRef.current); dragRef.current = { kind: "none" }; };
  const onWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const canvas = canvasRef.current; if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const mx = e.clientX - rect.left, my = e.clientY - rect.top, old = viewport.scale;
    const next = Math.min(2.5, Math.max(0.35, old * (e.deltaY > 0 ? 0.9 : 1.1)));
    setViewport({ scale: next, x: mx - ((mx - viewport.x) / old) * next, y: my - ((my - viewport.y) / old) * next });
  };

  const editNode = useMemo(() => editTarget?.kind === "node" ? project.nodes.find((n) => n.id === editTarget.id) ?? null : null, [editTarget, project.nodes]);
  const editWire = useMemo(() => editTarget?.kind === "wire" ? project.wires.find((w) => w.id === editTarget.id) ?? null : null, [editTarget, project.wires]);
  const patchNode = (id: string, patch: Partial<MapNode>) => updateProject((p) => ({ ...p, nodes: p.nodes.map((n) => n.id === id ? { ...n, ...patch } : n), updatedAt: Date.now() }));
  const patchNodeStyle = (id: string, style: Partial<NodeStyle>) => updateProject((p) => ({ ...p, nodes: p.nodes.map((n) => n.id === id ? { ...n, style: { ...n.style, ...style } } : n), updatedAt: Date.now() }));
  const patchWire = (id: string, patch: Partial<MapWire>) => updateProject((p) => ({ ...p, wires: p.wires.map((w) => w.id === id ? { ...w, ...patch } : w), updatedAt: Date.now() }));
  const patchWireStyle = (id: string, style: Partial<WireStyleProps>) => updateProject((p) => ({ ...p, wires: p.wires.map((w) => w.id === id ? { ...w, style: { ...w.style, ...style } } : w), updatedAt: Date.now() }));

  const btn: React.CSSProperties = { border: "1px solid #fff", background: "#000", color: "#fff", fontFamily: "inherit", fontSize: 10, letterSpacing: 1, padding: "5px 8px", cursor: "pointer" };
  const input: React.CSSProperties = { border: "1px solid #555", background: "#000", color: "#fff", fontFamily: "inherit", fontSize: 11, padding: "4px 6px", maxWidth: 140 };

  return (
    <div style={{ width: "100%", height: "100%", position: "relative", background: "#050505", color: "#fff", fontFamily: "var(--dm-font-primary), monospace", overflow: "hidden", imageRendering: "pixelated" }}>
      <canvas ref={canvasRef} style={{ position: "absolute", inset: 0, width: "100%", height: "100%", touchAction: "none", cursor: tool === "pan" ? "grab" : tool === "connect" ? "crosshair" : "default" }}
        onPointerDown={onPointerDown} onPointerMove={onPointerMove} onPointerUp={onPointerUp} onPointerCancel={onPointerUp} onWheel={onWheel} />

      <div style={{ position: "absolute", top: 8, left: 8, right: 8, zIndex: 20, display: "flex", flexWrap: "wrap", gap: 4, pointerEvents: "none" }}>
        <div style={{ pointerEvents: "auto", display: "flex", flexWrap: "wrap", gap: 4, alignItems: "center", border: "1px solid #fff", background: "#0c0c0c", padding: "4px 6px" }}>
          <span style={{ fontSize: 10, letterSpacing: 2, color: "#ffff00" }}>NODEMAP</span>
          <input value={project.name} onChange={(e) => updateProject((p) => ({ ...p, name: e.target.value, updatedAt: Date.now() }))} style={input} />
          <button type="button" style={{ ...btn, ...(tool === "select" ? { background: "#fff", color: "#000" } : {}) }} onClick={() => setTool("select")}>SEL</button>
          <button type="button" style={{ ...btn, ...(tool === "connect" ? { background: "#fff", color: "#000" } : {}) }} onClick={() => setTool("connect")}>CONN</button>
          <button type="button" style={{ ...btn, ...(tool === "pan" ? { background: "#fff", color: "#000" } : {}) }} onClick={() => setTool("pan")}>PAN</button>
          <button type="button" style={btn} onClick={addNodeAtCenter}>+ NODE</button>
          <button type="button" style={{ ...btn, ...(panel === "about" ? { background: "#fff", color: "#000" } : {}) }} onClick={() => setPanel(panel === "about" ? "none" : "about")}>ABOUT</button>
          <button type="button" style={{ ...btn, ...(panel === "help" ? { background: "#fff", color: "#000" } : {}) }} onClick={() => setPanel(panel === "help" ? "none" : "help")}>HELP</button>
          <button type="button" style={btn} onClick={() => { if (window.confirm("Reset to demo map?")) { const d = createDemoProject(); setProject(d); persist(d); setEditTarget(null); setPanel("none"); } }}>DEMO</button>
        </div>
      </div>

      <div style={{ position: "absolute", left: 12, bottom: 12, zIndex: 40, display: "flex", flexDirection: "column", alignItems: "flex-start", gap: 6 }}>
        {shiftOn && <div style={{ border: "1px solid #ffff00", background: "#0a0a0a", color: "#ffff00", fontSize: 9, letterSpacing: 1, padding: "4px 8px" }}>SHIFT ON — TAP NODE/WIRE</div>}
        <button type="button" aria-pressed={shiftOn} aria-label="SHIFT modifier lower left" onClick={() => setShiftToggle((v) => !v)}
          style={{ width: 88, height: 72, border: "2px solid " + (shiftOn ? "#ffff00" : "#fff"), background: shiftOn ? "#ffff00" : "#0c0c0c", color: shiftOn ? "#000" : "#fff", fontFamily: "inherit", fontSize: 14, letterSpacing: 3, fontWeight: 700, cursor: "pointer", boxShadow: "3px 3px 0 #000", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
          <span style={{ fontSize: 9, letterSpacing: 2, opacity: 0.75 }}>HOLD</span>SHIFT
        </button>
      </div>

      <div style={{ position: "absolute", right: 10, bottom: 12, zIndex: 20, fontSize: 9, letterSpacing: 1, color: "#666", border: "1px solid #333", background: "rgba(0,0,0,0.85)", padding: "4px 8px" }}>
        {hydrated ? project.nodes.length + " nodes · " + project.wires.length + " wires · local" : "loading…"}
      </div>

      {panel === "edit" && (editNode || editWire) && (
        <aside style={{ position: "absolute", top: 48, right: 10, width: 260, maxHeight: "min(70%, 520px)", zIndex: 30, border: "1px solid #fff", background: "#0a0a0a", display: "flex", flexDirection: "column", overflow: "hidden", boxShadow: "3px 3px 0 #000" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid #fff", padding: "6px 8px" }}>
            <span style={{ color: "#ffff00", letterSpacing: 2, fontSize: 11 }}>{editNode ? "EDIT NODE" : "EDIT WIRE"}</span>
            <button type="button" style={btn} onClick={() => { setPanel("none"); setEditTarget(null); }}>X</button>
          </div>
          <div style={{ overflowY: "auto", padding: 10, flex: 1 }}>
            {editNode && (<>
              <div style={{ fontSize: 9, color: "#888", marginBottom: 3 }}>TITLE</div>
              <input style={{ ...input, width: "100%", maxWidth: "100%", marginBottom: 8 }} value={editNode.title} onChange={(e) => patchNode(editNode.id, { title: e.target.value })} />
              <div style={{ fontSize: 9, color: "#888", marginBottom: 3 }}>BODY</div>
              <textarea style={{ ...input, width: "100%", maxWidth: "100%", minHeight: 64, marginBottom: 8 }} value={editNode.body} onChange={(e) => patchNode(editNode.id, { body: e.target.value })} />
              <div style={{ fontSize: 9, color: "#888", marginBottom: 3 }}>BACKGROUND</div>
              <input type="color" value={editNode.style.bg} onChange={(e) => patchNodeStyle(editNode.id, { bg: e.target.value })} style={{ width: "100%", marginBottom: 6, height: 32, background: "#000" }} />
              <div style={{ fontSize: 9, color: "#888", marginBottom: 3 }}>BORDER</div>
              <input type="color" value={editNode.style.border} onChange={(e) => patchNodeStyle(editNode.id, { border: e.target.value })} style={{ width: "100%", marginBottom: 6, height: 32, background: "#000" }} />
              <div style={{ fontSize: 9, color: "#888", marginBottom: 3 }}>TEXT</div>
              <input type="color" value={editNode.style.text} onChange={(e) => patchNodeStyle(editNode.id, { text: e.target.value })} style={{ width: "100%", marginBottom: 6, height: 32, background: "#000" }} />
              <div style={{ fontSize: 9, color: "#888", marginBottom: 3 }}>ROUNDNESS ({editNode.style.roundness}) — 0 HARD</div>
              <input type="range" min={0} max={24} value={editNode.style.roundness} onChange={(e) => patchNodeStyle(editNode.id, { roundness: Number(e.target.value) })} style={{ width: "100%", marginBottom: 8 }} />
              <button type="button" style={{ ...btn, width: "100%", color: "#ff6666", borderColor: "#ff6666" }} onClick={() => deleteNode(editNode.id)}>DELETE NODE</button>
            </>)}
            {editWire && (<>
              <div style={{ fontSize: 9, color: "#888", marginBottom: 3 }}>TITLE</div>
              <input style={{ ...input, width: "100%", maxWidth: "100%", marginBottom: 8 }} value={editWire.title} onChange={(e) => patchWire(editWire.id, { title: e.target.value })} />
              <div style={{ fontSize: 9, color: "#888", marginBottom: 3 }}>COLOR</div>
              <input type="color" value={editWire.style.color} onChange={(e) => patchWireStyle(editWire.id, { color: e.target.value })} style={{ width: "100%", marginBottom: 6, height: 32, background: "#000" }} />
              <div style={{ fontSize: 9, color: "#888", marginBottom: 3 }}>STYLE</div>
              <div style={{ display: "flex", gap: 4, marginBottom: 8 }}>
                {(["solid", "dashed", "thick"] as WireStyle[]).map((s) => (
                  <button key={s} type="button" style={{ ...btn, flex: 1, background: editWire.style.style === s ? "#fff" : "#000", color: editWire.style.style === s ? "#000" : "#fff" }}
                    onClick={() => patchWireStyle(editWire.id, { style: s, width: s === "thick" ? Math.max(editWire.style.width, 4) : editWire.style.width })}>{s}</button>
                ))}
              </div>
              <button type="button" style={{ ...btn, width: "100%", color: "#ff6666", borderColor: "#ff6666" }} onClick={() => deleteWire(editWire.id)}>DELETE WIRE</button>
            </>)}
          </div>
        </aside>
      )}

      {panel === "about" && (
        <aside style={{ position: "absolute", top: 48, right: 10, width: 300, zIndex: 30, border: "1px solid #fff", background: "#0a0a0a", boxShadow: "3px 3px 0 #000" }}>
          <div style={{ display: "flex", justifyContent: "space-between", padding: "6px 8px", borderBottom: "1px solid #fff" }}>
            <span style={{ color: "#ffff00", letterSpacing: 2, fontSize: 11 }}>ABOUT NODEMAP</span>
            <button type="button" style={btn} onClick={() => setPanel("none")}>X</button>
          </div>
          <div style={{ padding: 12, fontSize: 11, lineHeight: 1.5, color: "#bbb" }}>
            <p>Modular visual node builder for notes, projects, tasks, workflows, mind maps, and research. SHIFT pad (lower-left) edits styles.</p>
            <p>Influenced by Dylan Louis Monroe (Deep State Mapping Project). Thanks for the influence. Does <b style={{ color: "#fff" }}>not</b> use his maps/assets.</p>
            <p><a href="https://dsmp.io" target="_blank" rel="noreferrer" style={{ color: "#ffff00" }}>dsmp.io</a> · <a href="https://dsmp.io/product-category/downloads/" target="_blank" rel="noreferrer" style={{ color: "#ffff00" }}>free PDFs</a></p>
            <p style={{ color: "#666" }}>Method rules: open desktop app EPISTEMIC STANCE.</p>
          </div>
        </aside>
      )}

      {panel === "help" && (
        <aside style={{ position: "absolute", top: 48, right: 10, width: 280, zIndex: 30, border: "1px solid #fff", background: "#0a0a0a" }}>
          <div style={{ display: "flex", justifyContent: "space-between", padding: "6px 8px", borderBottom: "1px solid #fff" }}>
            <span style={{ color: "#ffff00", letterSpacing: 2, fontSize: 11 }}>CONTROLS</span>
            <button type="button" style={btn} onClick={() => setPanel("none")}>X</button>
          </div>
          <ul style={{ margin: 0, padding: 0, listStyle: "none", fontSize: 10 }}>
            {[["SHIFT pad lower-left", "Edit modifier"], ["SHIFT + click", "Edit node/wire"], ["CONN", "Wire nodes"], ["Wheel", "Zoom"], ["Desktop STANCE", "Epistemic Stance app"]].map(([k, v]) => (
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
