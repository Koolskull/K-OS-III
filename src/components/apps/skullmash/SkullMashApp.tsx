/*
 *                    ☦
 *            ╔══════════════════╗
 *            ║  SKULLMASH       ║
 *            ║  CUTOUT → 3D     ║
 *            ╚══════════════════╝
 *
 *   K-OS III native app
 *   Draw / import cutouts → balloon inflate →
 *   keyframe pins → export .glb + JSON anim data
 *   Designed for Datamoshpit / Stardrain / visuals pipeline
 *
 *   Planned: optional user-initiated NFT minting of objects for a fee
 *   (commerce + K-Wallet integration later).
 *
 *   v0.1.1 — ported from standalone skullmash, adapted for AppWindow
 */

"use client";

import { useRef, useState, useEffect, useCallback } from "react";
import * as THREE from "three";
import { GLTFExporter } from "three/examples/jsm/exporters/GLTFExporter.js";

type Mode = "DRAW" | "INFLATE" | "ANIMATE" | "EXPORT";

interface Point2 {
  x: number;
  y: number;
}

interface Shape {
  id: string;
  points: Point2[];
  color: string;
}

interface Pin {
  id: string;
  x: number;
  y: number;
}

interface Keyframe {
  time: number;
  pins: { id: string; x: number; y: number }[];
}

const CANVAS_W = 480;
const CANVAS_H = 480;

/** Inflate a closed polygon into a soft 3D mesh (centroid radial height). */
function inflateShape(shape: Shape): THREE.BufferGeometry {
  const pts = shape.points;
  if (pts.length < 3) return new THREE.BufferGeometry();

  // Triangulate via ShapeUtils (earcut under the hood in three.js)
  const contour = pts.map((p) => new THREE.Vector2(p.x, p.y));
  const faces = THREE.ShapeUtils.triangulateShape(contour, []);

  let cx = 0,
    cy = 0;
  for (const p of pts) {
    cx += p.x;
    cy += p.y;
  }
  cx /= pts.length;
  cy /= pts.length;

  let maxDist = 0;
  for (const p of pts) {
    const d = Math.hypot(p.x - cx, p.y - cy);
    if (d > maxDist) maxDist = d;
  }
  if (maxDist < 1e-6) maxDist = 1;

  const heightScale = 0.32;
  const positions: number[] = [];
  const uvs: number[] = [];
  const colors: number[] = [];

  for (const p of pts) {
    const d = Math.hypot(p.x - cx, p.y - cy);
    const h = heightScale * Math.max(0, 1 - d / maxDist) * maxDist * 0.85;
    positions.push((p.x - CANVAS_W / 2) / 100, h, (p.y - CANVAS_H / 2) / 100);
    uvs.push(p.x / CANVAS_W, 1 - p.y / CANVAS_H);
    colors.push(0.18, 0.92, 0.52);
  }

  const indices: number[] = [];
  for (const face of faces) {
    indices.push(face[0], face[1], face[2]);
  }

  const geo = new THREE.BufferGeometry();
  geo.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
  geo.setAttribute("uv", new THREE.Float32BufferAttribute(uvs, 2));
  geo.setAttribute("color", new THREE.Float32BufferAttribute(colors, 3));
  geo.setIndex(indices);
  geo.computeVertexNormals();
  return geo;
}

function disposeObject3D(obj: THREE.Object3D) {
  if ((obj as THREE.Mesh).isMesh) {
    const mesh = obj as THREE.Mesh;
    mesh.geometry?.dispose();
    const mat = mesh.material;
    if (Array.isArray(mat)) mat.forEach((m) => m.dispose());
    else mat?.dispose();
  }
}

interface SkullMashAppProps {
  isFocused?: boolean;
}

export default function SkullMashApp({ isFocused = true }: SkullMashAppProps) {
  const [mode, setMode] = useState<Mode>("DRAW");
  const [shapes, setShapes] = useState<Shape[]>([]);
  const [currentPoints, setCurrentPoints] = useState<Point2[]>([]);
  const [pins, setPins] = useState<Pin[]>([]);
  const [keyframes, setKeyframes] = useState<Keyframe[]>([]);
  const [time, setTime] = useState(0);
  const [status, setStatus] = useState(
    "DRAW: click points. Right-click / Enter / CLOSE when ≥3 pts.",
  );
  const [bgImage, setBgImage] = useState<HTMLImageElement | null>(null);
  const bgUrlRef = useRef<string | null>(null);

  const canvas2dRef = useRef<HTMLCanvasElement>(null);
  const threeContainerRef = useRef<HTMLDivElement>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const meshGroupRef = useRef<THREE.Group | null>(null);
  const animIdRef = useRef(0);
  const sharedMatRef = useRef<THREE.MeshStandardMaterial | null>(null);

  const redraw2d = useCallback(() => {
    const c = canvas2dRef.current;
    if (!c) return;
    const ctx = c.getContext("2d");
    if (!ctx) return;

    ctx.fillStyle = "#050505";
    ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);

    if (bgImage) {
      ctx.globalAlpha = 0.42;
      ctx.drawImage(bgImage, 0, 0, CANVAS_W, CANVAS_H);
      ctx.globalAlpha = 1;
    }

    for (const s of shapes) {
      if (s.points.length < 2) continue;
      ctx.beginPath();
      ctx.moveTo(s.points[0].x, s.points[0].y);
      for (let i = 1; i < s.points.length; i++) {
        ctx.lineTo(s.points[i].x, s.points[i].y);
      }
      ctx.closePath();
      ctx.fillStyle = s.color + "44";
      ctx.fill();
      ctx.strokeStyle = s.color;
      ctx.lineWidth = 2;
      ctx.stroke();
    }

    if (currentPoints.length > 0) {
      ctx.beginPath();
      ctx.moveTo(currentPoints[0].x, currentPoints[0].y);
      for (let i = 1; i < currentPoints.length; i++) {
        ctx.lineTo(currentPoints[i].x, currentPoints[i].y);
      }
      ctx.strokeStyle = "#00ff9d";
      ctx.lineWidth = 2;
      ctx.stroke();
      for (const p of currentPoints) {
        ctx.beginPath();
        ctx.arc(p.x, p.y, 4, 0, Math.PI * 2);
        ctx.fillStyle = "#00ff9d";
        ctx.fill();
      }
    }

    for (const pin of pins) {
      ctx.beginPath();
      ctx.arc(pin.x, pin.y, 6, 0, Math.PI * 2);
      ctx.fillStyle = "#ffcc00";
      ctx.fill();
      ctx.strokeStyle = "#111";
      ctx.lineWidth = 1.5;
      ctx.stroke();
    }
  }, [shapes, currentPoints, pins, bgImage]);

  useEffect(() => {
    redraw2d();
  }, [redraw2d]);

  // Three.js setup
  useEffect(() => {
    const container = threeContainerRef.current;
    if (!container) return;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x050505);

    const camera = new THREE.PerspectiveCamera(45, 1, 0.05, 80);
    camera.position.set(0, 3.2, 5.8);
    camera.lookAt(0, 0.4, 0);

    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(CANVAS_W, CANVAS_H);
    container.replaceChildren(renderer.domElement);

    const light = new THREE.DirectionalLight(0xffffff, 1.15);
    light.position.set(2.5, 7, 4);
    scene.add(light);
    scene.add(new THREE.AmbientLight(0x404040, 0.55));

    const group = new THREE.Group();
    scene.add(group);

    const mat = new THREE.MeshStandardMaterial({
      vertexColors: true,
      side: THREE.DoubleSide,
      roughness: 0.42,
      metalness: 0.08,
    });
    sharedMatRef.current = mat;
    rendererRef.current = renderer;
    meshGroupRef.current = group;

    let running = true;
    const animate = () => {
      if (!running) return;
      animIdRef.current = requestAnimationFrame(animate);
      group.rotation.y += 0.0035;
      renderer.render(scene, camera);
    };
    animate();

    return () => {
      running = false;
      cancelAnimationFrame(animIdRef.current);
      while (group.children.length) {
        const child = group.children[0];
        group.remove(child);
        disposeObject3D(child);
      }
      mat.dispose();
      renderer.dispose();
      renderer.domElement.remove();
    };
  }, []);

  // Rebuild meshes
  useEffect(() => {
    const group = meshGroupRef.current;
    const mat = sharedMatRef.current;
    if (!group || !mat) return;

    while (group.children.length) {
      const child = group.children[0];
      group.remove(child);
      disposeObject3D(child);
    }

    for (const s of shapes) {
      const geo = inflateShape(s);
      if (geo.getAttribute("position")?.count) {
        const mesh = new THREE.Mesh(geo, mat);
        group.add(mesh);
      }
    }
  }, [shapes]);

  const closeCurrentShape = useCallback(() => {
    setCurrentPoints((pts) => {
      if (pts.length < 3) return pts;
      const newShape: Shape = {
        id: "s" + Date.now().toString(36),
        points: [...pts],
        color: "#00ff9d",
      };
      setShapes((prev) => {
        const next = [...prev, newShape];
        setStatus(`Shape closed (${newShape.points.length} pts). Total: ${next.length}`);
        return next;
      });
      return [];
    });
  }, []);

  useEffect(() => {
    if (!isFocused) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Enter" && mode === "DRAW" && currentPoints.length >= 3) {
        e.preventDefault();
        closeCurrentShape();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [isFocused, mode, currentPoints.length, closeCurrentShape]);

  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (e.button !== 0) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * CANVAS_W;
    const y = ((e.clientY - rect.top) / rect.height) * CANVAS_H;

    if (mode === "DRAW") {
      setCurrentPoints((prev) => [...prev, { x, y }]);
    } else if (mode === "ANIMATE") {
      const pin: Pin = { id: "p" + Date.now().toString(36), x, y };
      setPins((prev) => {
        const next = [...prev, pin];
        setStatus(`Pin added · ${next.length} total`);
        return next;
      });
    }
  };

  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    if (mode === "DRAW") closeCurrentShape();
  };

  const clearAll = () => {
    setShapes([]);
    setCurrentPoints([]);
    setPins([]);
    setKeyframes([]);
    setStatus("Cleared.");
  };

  const onImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (bgUrlRef.current) URL.revokeObjectURL(bgUrlRef.current);
    const url = URL.createObjectURL(file);
    bgUrlRef.current = url;
    const img = new Image();
    img.onload = () => {
      setBgImage(img);
      setStatus("Background loaded — trace cutouts over it.");
    };
    img.src = url;
  };

  useEffect(() => {
    return () => {
      if (bgUrlRef.current) URL.revokeObjectURL(bgUrlRef.current);
    };
  }, []);

  const exportGLB = () => {
    const group = meshGroupRef.current;
    if (!group || group.children.length === 0) {
      setStatus("Nothing to export. Draw shapes first.");
      return;
    }
    const exporter = new GLTFExporter();
    exporter.parse(
      group,
      (result) => {
        const blob = new Blob([result as ArrayBuffer], {
          type: "model/gltf-binary",
        });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `skullmash_${Date.now()}.glb`;
        a.click();
        URL.revokeObjectURL(url);
        setStatus("Exported binary glTF (.glb)");
      },
      (err) => {
        console.error(err);
        setStatus("GLB export failed");
      },
      { binary: true },
    );
  };

  const exportJSON = () => {
    const data = {
      version: "0.1.1",
      tool: "SKULLMASH / K-OS III",
      canvas: { w: CANVAS_W, h: CANVAS_H },
      shapes: shapes.map((s) => ({ id: s.id, points: s.points })),
      pins,
      keyframes,
      notes:
        "Pair with the .glb for keyframe-driven deformation or pin playback in Stardrain / custom players. Optional NFT minting of objects planned (user-initiated, for a fee).",
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `skullmash_anim_${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
    setStatus("Exported JSON project + animation data");
  };

  const recordKeyframe = () => {
    if (pins.length === 0) return;
    const kf: Keyframe = {
      time,
      pins: pins.map((p) => ({ id: p.id, x: p.x, y: p.y })),
    };
    setKeyframes((prev) =>
      [...prev.filter((k) => Math.abs(k.time - time) > 0.015), kf].sort(
        (a, b) => a.time - b.time,
      ),
    );
    setStatus(`Keyframe @ t=${time.toFixed(2)}`);
  };

  const btnBase: React.CSSProperties = {
    fontFamily: "inherit",
    fontSize: 11,
    background: "#111",
    color: "#c0c0c0",
    border: "1px solid #333",
    padding: "4px 10px",
    cursor: "pointer",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  };

  const btnActive: React.CSSProperties = {
    ...btnBase,
    background: "#1a2a1a",
    borderColor: "#00ff9d",
    color: "#00ff9d",
  };

  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        background: "#0a0a0a",
        color: "#c0c0c0",
        fontFamily: "var(--dm-font-primary), 'Courier New', monospace",
        fontSize: 13,
        overflow: "hidden",
        userSelect: "none",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 12,
          padding: "6px 10px",
          background: "#1a1a1a",
          borderBottom: "1px solid #333",
          flexShrink: 0,
        }}
      >
        <span style={{ color: "#00ff9d", fontSize: 16 }}>◎</span>
        <span style={{ fontWeight: "bold", letterSpacing: 1, color: "#eee" }}>
          SKULLMASH
        </span>
        <span style={{ color: "#777", fontSize: 11 }}>
          CUTOUT → BALLOON → KEYFRAME → GLB / JSON
        </span>
      </div>

      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          gap: 6,
          padding: "8px 10px",
          background: "#111",
          borderBottom: "1px solid #333",
          alignItems: "center",
          flexShrink: 0,
        }}
      >
        <button
          style={mode === "DRAW" ? btnActive : btnBase}
          onClick={() => {
            setMode("DRAW");
            setStatus("DRAW: click points. Right-click / Enter / CLOSE when ≥3.");
          }}
        >
          DRAW
        </button>
        <button
          style={mode === "INFLATE" ? btnActive : btnBase}
          onClick={() => {
            setMode("INFLATE");
            setStatus("INFLATE: meshes live. Switch to ANIMATE for pins.");
          }}
        >
          INFLATE
        </button>
        <button
          style={mode === "ANIMATE" ? btnActive : btnBase}
          onClick={() => {
            setMode("ANIMATE");
            setStatus("ANIMATE: click yellow pins. REC KF on the timeline.");
          }}
        >
          ANIMATE
        </button>
        <button
          style={mode === "EXPORT" ? btnActive : btnBase}
          onClick={() => setMode("EXPORT")}
        >
          EXPORT
        </button>
        <div style={{ width: 1, height: 20, background: "#333", margin: "0 4px" }} />
        <button
          style={btnBase}
          onClick={closeCurrentShape}
          disabled={currentPoints.length < 3}
        >
          CLOSE SHAPE
        </button>
        <button style={btnBase} onClick={clearAll}>
          CLEAR
        </button>
        <div style={{ width: 1, height: 20, background: "#333", margin: "0 4px" }} />
        <label
          style={{
            display: "flex",
            alignItems: "center",
            gap: 6,
            cursor: "pointer",
            fontSize: 11,
            color: "#777",
          }}
        >
          BG IMAGE
          <input
            type="file"
            accept="image/*"
            onChange={onImageUpload}
            style={{ fontSize: 11 }}
          />
        </label>
        <div style={{ flex: 1 }} />
        <button
          style={{ ...btnBase, opacity: 0.5, cursor: "not-allowed" }}
          disabled
          title="Coming later — optional user-initiated mint of your object as an NFT for a fee"
        >
          MINT NFT (SOON)
        </button>
      </div>

      <div style={{ flex: 1, display: "flex", minHeight: 0 }}>
        <div
          style={{
            width: CANVAS_W,
            flexShrink: 0,
            display: "flex",
            flexDirection: "column",
            borderRight: "1px solid #333",
            background: "#0d0d0d",
          }}
        >
          <div
            style={{
              padding: "4px 8px",
              fontSize: 11,
              color: "#777",
              borderBottom: "1px solid #333",
              letterSpacing: 1,
            }}
          >
            2D CUTOUT / DRAW
          </div>
          <canvas
            ref={canvas2dRef}
            width={CANVAS_W}
            height={CANVAS_H}
            onClick={handleCanvasClick}
            onContextMenu={handleContextMenu}
            style={{ width: CANVAS_W, height: CANVAS_H, cursor: "crosshair", background: "#050505" }}
          />
        </div>

        <div
          style={{
            flex: 1,
            minWidth: 0,
            display: "flex",
            flexDirection: "column",
            background: "#0d0d0d",
          }}
        >
          <div
            style={{
              padding: "4px 8px",
              fontSize: 11,
              color: "#777",
              borderBottom: "1px solid #333",
              letterSpacing: 1,
            }}
          >
            3D BALLOON VIEW (auto-rotate)
          </div>
          <div
            ref={threeContainerRef}
            style={{
              flex: 1,
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              background: "#050505",
              minHeight: 0,
            }}
          />
        </div>
      </div>

      <div
        style={{
          height: 56,
          background: "#0d0d0d",
          borderTop: "1px solid #333",
          display: "flex",
          alignItems: "center",
          gap: 8,
          padding: "0 10px",
          flexShrink: 0,
        }}
      >
        <button
          style={btnBase}
          onClick={recordKeyframe}
          disabled={pins.length === 0}
        >
          REC KF
        </button>
        <span style={{ fontSize: 11, color: "#777", minWidth: 40 }}>
          t={time.toFixed(2)}
        </span>
        <input
          type="range"
          min={0}
          max={1}
          step={0.01}
          value={time}
          onChange={(e) => setTime(parseFloat(e.target.value))}
          style={{ flex: 1, accentColor: "#00ff9d" }}
        />
        <span style={{ fontSize: 11, color: "#777" }}>{keyframes.length} kfs</span>
        <div style={{ width: 1, height: 20, background: "#333", margin: "0 4px" }} />
        <button style={btnBase} onClick={exportGLB}>
          EXPORT .GLB
        </button>
        <button style={btnBase} onClick={exportJSON}>
          EXPORT JSON
        </button>
      </div>

      <div
        style={{
          padding: "4px 10px",
          fontSize: 11,
          color: "#777",
          borderTop: "1px solid #333",
          background: "#111",
          display: "flex",
          justifyContent: "space-between",
          flexShrink: 0,
        }}
      >
        <span>{status}</span>
        <span>
          shapes: {shapes.length} · pins: {pins.length} · mode: {mode}
        </span>
      </div>
    </div>
  );
}
