/*
 *                    ☦
 *            ╔══════════════════╗
 *            ║  SKULLMASH       ║
 *            ║  CUTOUT → 3D     ║
 *            ╚══════════════════╝
 *
 *   K-OS III native app — image-first cutout → balloon
 *   Freehand regions → soft inflate → pin-warp keyframes → .glb + JSON
 *
 *   Planned: optional user-initiated NFT mint of objects for a fee
 *   (commerce + K-Wallet integration later).
 *
 *   v0.4.0 — plush Poisson inflate + amount control, pin-warp, dual animate
 */

"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { GLTFExporter } from "three/examples/jsm/exporters/GLTFExporter.js";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { assetUrl } from "@/lib/assets";
import { inflatePolygon, sliderToInflate, type Point2 } from "./inflate";
import { applyPinWarp, resetToRest } from "./deform";
import "./skullmash.css";

type Mode = "DRAW" | "INFLATE" | "ANIMATE";

interface Shape {
  id: string;
  points: Point2[];
  color: string;
}

interface Pin {
  id: string;
  x: number;
  y: number;
  restX: number;
  restY: number;
}

interface Keyframe {
  time: number;
  pins: { id: string; x: number; y: number }[];
}

interface Props {
  isFocused?: boolean;
}

const CANVAS_W = 720;
const CANVAS_H = 720;
const STROKE_MIN_DIST = 2.2;
const SHAPE_COLORS = ["#ff4444", "#66aaff", "#66ff99", "#ffaa33", "#cc88ff", "#55dddd"];

function uid(prefix: string) {
  return prefix + Math.random().toString(36).slice(2, 9);
}

function hexToRgb(hex: string): [number, number, number] {
  const h = hex.replace("#", "");
  const n = parseInt(h.length === 3 ? h.split("").map((c) => c + c).join("") : h, 16);
  return [((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255];
}

export default function SkullMashApp({ isFocused = true }: Props) {
  const [mode, setMode] = useState<Mode>("DRAW");
  const modeRef = useRef<Mode>("DRAW");
  const [shapes, setShapes] = useState<Shape[]>([]);
  const shapesRef = useRef<Shape[]>([]);
  const strokeRef = useRef<Point2[]>([]);
  const [strokeVersion, setStrokeVersion] = useState(0);
  const drawingRef = useRef(false);
  const [pins, setPins] = useState<Pin[]>([]);
  const pinsRef = useRef<Pin[]>([]);
  const [keyframes, setKeyframes] = useState<Keyframe[]>([]);
  const [time, setTime] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [status, setStatus] = useState("Draw or upload an image to begin.");
  const [hasImage, setHasImage] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [ready, setReady] = useState(false);
  const [brush, setBrush] = useState(3);
  const [inflateSlider, setInflateSlider] = useState(52); // plush default
  const inflateSliderRef = useRef(52);
  const [drawTool, setDrawTool] = useState<"pen" | "select">("pen");
  const [meshTick, setMeshTick] = useState(0);

  const bgUrlRef = useRef<string | null>(null);
  const imageDataRef = useRef<ImageData | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dragPinRef = useRef<string | null>(null);
  const rootRef = useRef<HTMLDivElement>(null);

  const canvas2dRef = useRef<HTMLCanvasElement>(null);
  const threeHostRef = useRef<HTMLDivElement>(null);
  const meshGroupRef = useRef<THREE.Group | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const controlsRef = useRef<OrbitControls | null>(null);
  const sceneReadyRef = useRef(false);
  const animIdRef = useRef(0);
  const matRef = useRef<THREE.MeshStandardMaterial | null>(null);
  const userOrbitRef = useRef(false);
  const focusedRef = useRef(isFocused);
  const restPosRef = useRef(new Map<THREE.BufferGeometry, Float32Array>());

  useEffect(() => {
    focusedRef.current = isFocused;
  }, [isFocused]);

  useEffect(() => {
    modeRef.current = mode;
  }, [mode]);

  useEffect(() => {
    shapesRef.current = shapes;
  }, [shapes]);

  useEffect(() => {
    pinsRef.current = pins;
  }, [pins]);

  useEffect(() => {
    inflateSliderRef.current = inflateSlider;
  }, [inflateSlider]);

  const bakeImage = useCallback((img: HTMLImageElement) => {
    const off = document.createElement("canvas");
    off.width = CANVAS_W;
    off.height = CANVAS_H;
    const octx = off.getContext("2d")!;
    const scale = Math.max(CANVAS_W / img.width, CANVAS_H / img.height);
    const w = img.width * scale;
    const h = img.height * scale;
    octx.fillStyle = "#000000";
    octx.fillRect(0, 0, CANVAS_W, CANVAS_H);
    octx.drawImage(img, (CANVAS_W - w) / 2, (CANVAS_H - h) / 2, w, h);
    imageDataRef.current = octx.getImageData(0, 0, CANVAS_W, CANVAS_H);
  }, []);

  const applyImageElement = useCallback(
    (img: HTMLImageElement) => {
      try {
        bakeImage(img);
      } catch (e) {
        console.error(e);
        setStatus("Could not read image pixels — try another file.");
        return;
      }
      setHasImage(true);
      setReady(true);
      setMode("DRAW");
      setDrawTool("pen");
      setStatus("Trace closed shapes over the photo. Release to close a stroke.");
      setStrokeVersion((v) => v + 1);
    },
    [bakeImage],
  );

  const loadImageFile = useCallback(
    (file: File) => {
      if (!file.type.startsWith("image/")) {
        setStatus("That file is not an image.");
        return;
      }
      if (bgUrlRef.current) URL.revokeObjectURL(bgUrlRef.current);
      const url = URL.createObjectURL(file);
      bgUrlRef.current = url;
      const img = new Image();
      img.onload = () => applyImageElement(img);
      img.onerror = () => setStatus("Failed to load image.");
      img.src = url;
    },
    [applyImageElement],
  );

  const loadSampleImage = useCallback(() => {
    const img = new Image();
    img.onload = () => applyImageElement(img);
    img.onerror = () => setStatus("Sample image missing — open your own file.");
    img.src = assetUrl("/skullmash/sample-creature.png");
  }, [applyImageElement]);

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) loadImageFile(f);
    e.target.value = "";
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const f = e.dataTransfer.files?.[0];
    if (f) loadImageFile(f);
  };

  const startBlank = () => {
    imageDataRef.current = null;
    if (bgUrlRef.current) {
      URL.revokeObjectURL(bgUrlRef.current);
      bgUrlRef.current = null;
    }
    setHasImage(false);
    setReady(true);
    setMode("DRAW");
    setDrawTool("pen");
    setStatus("Blank stage. Freehand-draw closed shapes, then Next.");
    setStrokeVersion((v) => v + 1);
  };

  useEffect(() => {
    return () => {
      if (bgUrlRef.current) URL.revokeObjectURL(bgUrlRef.current);
    };
  }, []);

  const redraw2d = useCallback(() => {
    const c = canvas2dRef.current;
    if (!c) return;
    const ctx = c.getContext("2d");
    if (!ctx) return;
    const currentStroke = strokeRef.current;
    const lw = Math.max(1.5, brush * 0.9);

    ctx.fillStyle = "#000000";
    ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);

    if (imageDataRef.current) {
      ctx.putImageData(imageDataRef.current, 0, 0);
      // slight vignette so strokes read
      ctx.fillStyle = "rgba(0,0,0,0.08)";
      ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);
    } else {
      ctx.strokeStyle = "rgba(255,255,255,0.045)";
      ctx.lineWidth = 1;
      for (let i = 0; i < CANVAS_W; i += 48) {
        ctx.beginPath();
        ctx.moveTo(i, 0);
        ctx.lineTo(i, CANVAS_H);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(0, i);
        ctx.lineTo(CANVAS_W, i);
        ctx.stroke();
      }
    }

    for (const s of shapes) {
      if (s.points.length < 2) continue;
      ctx.beginPath();
      ctx.moveTo(s.points[0]!.x, s.points[0]!.y);
      for (let i = 1; i < s.points.length; i++) {
        ctx.lineTo(s.points[i]!.x, s.points[i]!.y);
      }
      ctx.closePath();
      ctx.fillStyle = s.color + "44";
      ctx.fill();
      ctx.strokeStyle = s.color;
      ctx.lineWidth = 2.5;
      ctx.lineJoin = "round";
      ctx.lineCap = "round";
      ctx.stroke();
    }

    if (currentStroke.length > 0) {
      ctx.beginPath();
      ctx.moveTo(currentStroke[0]!.x, currentStroke[0]!.y);
      for (let i = 1; i < currentStroke.length; i++) {
        ctx.lineTo(currentStroke[i]!.x, currentStroke[i]!.y);
      }
      ctx.strokeStyle = "#00ff00";
      ctx.lineWidth = lw;
      ctx.lineJoin = "round";
      ctx.lineCap = "round";
      ctx.stroke();
      if (currentStroke.length > 2) {
        ctx.setLineDash([5, 5]);
        ctx.beginPath();
        ctx.moveTo(
          currentStroke[currentStroke.length - 1]!.x,
          currentStroke[currentStroke.length - 1]!.y,
        );
        ctx.lineTo(currentStroke[0]!.x, currentStroke[0]!.y);
        ctx.strokeStyle = "rgba(255,255,0,0.35)";
        ctx.stroke();
        ctx.setLineDash([]);
      }
    }

    if (mode === "ANIMATE") {
      // rest ghosts
      for (const pin of pins) {
        if (pin.x === pin.restX && pin.y === pin.restY) continue;
        ctx.beginPath();
        ctx.arc(pin.restX, pin.restY, 5, 0, Math.PI * 2);
        ctx.strokeStyle = "rgba(255,255,0,0.35)";
        ctx.lineWidth = 1;
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(pin.restX, pin.restY);
        ctx.lineTo(pin.x, pin.y);
        ctx.strokeStyle = "rgba(255,255,0,0.4)";
        ctx.stroke();
      }
      for (const pin of pins) {
        ctx.beginPath();
        ctx.arc(pin.x, pin.y, 8, 0, Math.PI * 2);
        ctx.fillStyle = "#00ff00";
        ctx.fill();
        ctx.strokeStyle = "#000";
        ctx.lineWidth = 2;
        ctx.stroke();
      }
    }
  }, [shapes, pins, strokeVersion, brush, mode]);

  useEffect(() => {
    if (mode === "DRAW" || mode === "ANIMATE") redraw2d();
  }, [redraw2d, mode, ready, hasImage]);

  useEffect(() => {
    if (!ready) return;
    const host = threeHostRef.current;
    if (!host) return;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x000000);

    const camera = new THREE.PerspectiveCamera(36, 1, 0.05, 100);
    camera.position.set(0, 3.2, 5.6);
    camera.lookAt(0, 0.45, 0);
    cameraRef.current = camera;

    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: false,
      preserveDrawingBuffer: true,
    });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    const fit = () => {
      const w = Math.max(64, host.clientWidth || 640);
      const h = Math.max(64, host.clientHeight || 640);
      const s = Math.min(w, h, 960);
      renderer.setSize(s, s, false);
      camera.aspect = 1;
      camera.updateProjectionMatrix();
    };
    fit();
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.12;
    renderer.domElement.style.width = "100%";
    renderer.domElement.style.height = "100%";
    renderer.domElement.style.display = "block";
    renderer.domElement.style.touchAction = "none";
    host.replaceChildren(renderer.domElement);

    scene.add(new THREE.AmbientLight(0xffffff, 0.55));
    const key = new THREE.DirectionalLight(0xffffff, 1.35);
    key.position.set(3.5, 9, 4.5);
    scene.add(key);
    const fill = new THREE.DirectionalLight(0xb0c4ff, 0.45);
    fill.position.set(-5, 2.5, -2);
    scene.add(fill);
    scene.add(new THREE.HemisphereLight(0x888899, 0x111111, 0.4));

    const group = new THREE.Group();
    scene.add(group);
    meshGroupRef.current = group;

    const mat = new THREE.MeshStandardMaterial({
      vertexColors: true,
      side: THREE.DoubleSide,
      roughness: 0.62,
      metalness: 0.0,
      flatShading: false,
    });
    matRef.current = mat;
    sceneReadyRef.current = true;

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.07;
    controls.target.set(0, 0.4, 0);
    controls.enablePan = false;
    controls.minDistance = 1.8;
    controls.maxDistance = 16;
    controlsRef.current = controls;
    controls.addEventListener("start", () => {
      userOrbitRef.current = true;
    });
    controls.addEventListener("end", () => {
      setTimeout(() => {
        userOrbitRef.current = false;
      }, 2200);
    });

    let running = true;
    const tick = () => {
      if (!running) return;
      animIdRef.current = requestAnimationFrame(tick);
      controls.update();
      if (
        modeRef.current === "INFLATE" &&
        !userOrbitRef.current &&
        focusedRef.current
      ) {
        group.rotation.y += 0.007;
      }
      renderer.render(scene, camera);
    };
    tick();

    const ro = new ResizeObserver(fit);
    ro.observe(host);
    setMeshTick((t) => t + 1);

    return () => {
      running = false;
      cancelAnimationFrame(animIdRef.current);
      ro.disconnect();
      controls.dispose();
      while (group.children.length) {
        const ch = group.children[0]!;
        group.remove(ch);
        (ch as THREE.Mesh).geometry?.dispose();
      }
      mat.dispose();
      renderer.dispose();
      renderer.domElement.remove();
      meshGroupRef.current = null;
      matRef.current = null;
      cameraRef.current = null;
      controlsRef.current = null;
      sceneReadyRef.current = false;
      restPosRef.current.clear();
    };
  }, [ready]);

  const applyDeform = useCallback((list: Pin[]) => {
    const group = meshGroupRef.current;
    if (!group || !sceneReadyRef.current) return;
    if (list.length === 0) {
      resetToRest(group, restPosRef.current);
      return;
    }
    const rest = list.map((p) => ({ id: p.id, x: p.restX, y: p.restY }));
    const cur = list.map((p) => ({ id: p.id, x: p.x, y: p.y }));
    // always start from rest pose then warp (avoids drift)
    resetToRest(group, restPosRef.current);
    applyPinWarp(group, rest, cur, CANVAS_W, CANVAS_H, restPosRef.current);
  }, []);

  const rebuildMeshes = useCallback(() => {
    const group = meshGroupRef.current;
    const mat = matRef.current;
    if (!group || !mat || !sceneReadyRef.current) return 0;

    while (group.children.length) {
      const ch = group.children[0]!;
      group.remove(ch);
      (ch as THREE.Mesh).geometry?.dispose();
    }
    restPosRef.current.clear();

    const list = shapesRef.current;
    let count = 0;
    for (const s of list) {
      const geo = inflatePolygon(s.points, {
        canvasW: CANVAS_W,
        canvasH: CANVAS_H,
        imageData: imageDataRef.current,
        inflate: sliderToInflate(inflateSliderRef.current),
        fillColor: hexToRgb(s.color),
      });
      if (geo.getAttribute("position")?.count) {
        group.add(new THREE.Mesh(geo, mat));
        count++;
      }
    }

    // capture rest pose
    group.traverse((obj) => {
      if (!(obj as THREE.Mesh).isMesh) return;
      const mesh = obj as THREE.Mesh;
      const geo = mesh.geometry as THREE.BufferGeometry;
      const pos = geo.getAttribute("position") as THREE.BufferAttribute;
      if (pos) restPosRef.current.set(geo, new Float32Array(pos.array as Float32Array));
    });

    if (count > 0 && cameraRef.current && controlsRef.current) {
      const box = new THREE.Box3().setFromObject(group);
      const size = box.getSize(new THREE.Vector3());
      const center = box.getCenter(new THREE.Vector3());
      const maxDim = Math.max(size.x, size.y, size.z, 0.5);
      const dist = maxDim * 2.15;
      cameraRef.current.position.set(
        center.x + dist * 0.42,
        center.y + dist * 0.48,
        center.z + dist * 0.95,
      );
      controlsRef.current.target.copy(center);
      controlsRef.current.update();
      if (modeRef.current === "INFLATE") group.rotation.y = 0.4;
      else group.rotation.y = 0.25;
    }

    // re-apply current pin warp after rebuild
    applyDeform(pinsRef.current);
    return count;
  }, [applyDeform]);

  useEffect(() => {
    rebuildMeshes();
  }, [rebuildMeshes, shapes, mode, ready, meshTick, inflateSlider]);

  // Live pin warp
  useEffect(() => {
    if (mode !== "ANIMATE" && mode !== "INFLATE") return;
    applyDeform(pins);
  }, [pins, mode, applyDeform, meshTick]);

  useEffect(() => {
    if (!playing || keyframes.length < 2) return;
    let raf = 0;
    const t0 = performance.now();
    const loop = (now: number) => {
      const elapsed = ((now - t0) / 1000) % 1;
      setTime(elapsed);
      const sorted = [...keyframes].sort((a, b) => a.time - b.time);
      let a = sorted[0]!;
      let b = sorted[sorted.length - 1]!;
      for (let i = 0; i < sorted.length - 1; i++) {
        if (elapsed >= sorted[i]!.time && elapsed <= sorted[i + 1]!.time) {
          a = sorted[i]!;
          b = sorted[i + 1]!;
          break;
        }
      }
      const span = Math.max(1e-6, b.time - a.time);
      const u = Math.max(0, Math.min(1, (elapsed - a.time) / span));
      setPins((prev) =>
        prev.map((p) => {
          const pa = a.pins.find((x) => x.id === p.id);
          const pb = b.pins.find((x) => x.id === p.id);
          if (!pa || !pb) return p;
          return {
            ...p,
            x: pa.x + (pb.x - pa.x) * u,
            y: pa.y + (pb.y - pa.y) * u,
          };
        }),
      );
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [playing, keyframes]);

  const ptr = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    return {
      x: ((e.clientX - rect.left) / rect.width) * CANVAS_W,
      y: ((e.clientY - rect.top) / rect.height) * CANVAS_H,
    };
  };

  const commitStroke = useCallback((pts: Point2[]) => {
    if (pts.length < 8) {
      setStatus("Stroke too short — draw a fuller closed region.");
      strokeRef.current = [];
      setStrokeVersion((v) => v + 1);
      return;
    }
    const first = pts[0]!;
    const last = pts[pts.length - 1]!;
    let closed = pts;
    if (Math.hypot(first.x - last.x, first.y - last.y) > 24) {
      closed = [...pts, first];
    }
    setShapes((prev) => {
      const color = SHAPE_COLORS[prev.length % SHAPE_COLORS.length]!;
      const shape: Shape = { id: uid("s"), points: closed, color };
      const next = [...prev, shape];
      setStatus(`Region ${next.length} closed. Draw more, or press Next / Enter.`);
      return next;
    });
    strokeRef.current = [];
    setStrokeVersion((v) => v + 1);
  }, []);

  const onPointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (e.button !== 0) return;
    if (!ready) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    const p = ptr(e);
    if (mode === "DRAW" && drawTool === "pen") {
      drawingRef.current = true;
      strokeRef.current = [p];
      setStrokeVersion((v) => v + 1);
    } else if (mode === "ANIMATE") {
      const hit = pins.find((pin) => Math.hypot(pin.x - p.x, pin.y - p.y) < 16);
      if (hit) dragPinRef.current = hit.id;
      else {
        const pin: Pin = { id: uid("p"), x: p.x, y: p.y, restX: p.x, restY: p.y };
        setPins((prev) => {
          setStatus(`Pin ${prev.length + 1} · drag to warp mesh · REC KF on timeline`);
          return [...prev, pin];
        });
      }
    }
  };

  const onPointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const p = ptr(e);
    if (mode === "DRAW" && drawingRef.current) {
      const prev = strokeRef.current;
      const last = prev[prev.length - 1];
      if (!last || Math.hypot(p.x - last.x, p.y - last.y) >= STROKE_MIN_DIST) {
        strokeRef.current = [...prev, p];
        setStrokeVersion((v) => v + 1);
      }
    } else if (mode === "ANIMATE" && dragPinRef.current) {
      const id = dragPinRef.current;
      setPins((prev) => prev.map((pin) => (pin.id === id ? { ...pin, x: p.x, y: p.y } : pin)));
    }
  };

  const onPointerUp = (e: React.PointerEvent<HTMLCanvasElement>) => {
    try {
      e.currentTarget.releasePointerCapture(e.pointerId);
    } catch {
      /* already released */
    }
    dragPinRef.current = null;
    if (mode === "DRAW" && drawingRef.current) {
      drawingRef.current = false;
      commitStroke(strokeRef.current);
    }
  };

  const clearAll = () => {
    setShapes([]);
    strokeRef.current = [];
    setPins([]);
    setKeyframes([]);
    setStrokeVersion((v) => v + 1);
    setStatus("Cleared. Draw new regions or upload another image.");
  };

  const undoLast = () => {
    setShapes((prev) => prev.slice(0, -1));
    setStatus("Removed last region.");
  };

  const resetPinsToRest = () => {
    setPins((prev) => prev.map((p) => ({ ...p, x: p.restX, y: p.restY })));
    setStatus("Pins reset to rest pose.");
  };

  const goNext = useCallback(() => {
    if (modeRef.current === "DRAW") {
      if (shapesRef.current.length === 0) {
        setStatus("Draw at least one closed region first.");
        return;
      }
      setMode("INFLATE");
      setStatus("Plush inflate — drag to orbit · slider = thickness · Enter → Animate.");
      requestAnimationFrame(() => {
        const n = rebuildMeshes();
        setStatus(
          n > 0
            ? `Inflated ${n} balloon${n === 1 ? "" : "s"} — drag to orbit.`
            : "Inflate produced no mesh — try a fuller closed stroke.",
        );
      });
    } else if (modeRef.current === "INFLATE") {
      setMode("ANIMATE");
      setStatus("Yellow pins warp the mesh. Drag · REC KF · Play. Enter exports GLB.");
      requestAnimationFrame(() => rebuildMeshes());
    }
  }, [rebuildMeshes]);

  const goBack = useCallback(() => {
    if (modeRef.current === "ANIMATE") {
      setMode("INFLATE");
      setStatus("Back to inflate — orbit the balloon.");
      requestAnimationFrame(() => rebuildMeshes());
    } else if (modeRef.current === "INFLATE") {
      setMode("DRAW");
      setStatus("Back to draw — add or edit freehand regions.");
      setStrokeVersion((v) => v + 1);
    }
  }, [rebuildMeshes]);

  const recordKeyframe = () => {
    if (pins.length === 0) {
      setStatus("Place control pins first.");
      return;
    }
    const kf: Keyframe = {
      time,
      pins: pins.map((p) => ({ id: p.id, x: p.x, y: p.y })),
    };
    setKeyframes((prev) =>
      [...prev.filter((k) => Math.abs(k.time - time) > 0.02), kf].sort((a, b) => a.time - b.time),
    );
    setStatus(`Keyframe @ t=${time.toFixed(2)} · ${pins.length} pins`);
  };

  const exportGLB = useCallback(() => {
    rebuildMeshes();
    applyDeform(pinsRef.current);
    const g = meshGroupRef.current;
    if (!g || g.children.length === 0) {
      setStatus("Nothing to export — draw & inflate first.");
      return;
    }
    // freeze current deformed pose into geometry for export
    g.traverse((obj) => {
      if (!(obj as THREE.Mesh).isMesh) return;
      const mesh = obj as THREE.Mesh;
      const geo = mesh.geometry as THREE.BufferGeometry;
      const pos = geo.getAttribute("position");
      if (pos) pos.needsUpdate = true;
    });
    const exporter = new GLTFExporter();
    exporter.parse(
      g,
      (result) => {
        const blob = new Blob([result as ArrayBuffer], { type: "model/gltf-binary" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `skullmash_${Date.now()}.glb`;
        a.click();
        URL.revokeObjectURL(url);
        setStatus("Exported binary glTF (.glb) at current pose");
      },
      (err) => {
        console.error(err);
        setStatus("GLB export failed");
      },
      { binary: true },
    );
  }, [rebuildMeshes, applyDeform]);

  const exportJSON = () => {
    const data = {
      version: "0.3.2",
      tool: "SKULLMASH",
      host: "K-OS-III",
      workflow: "image → freehand cutout → balloon inflate → pin-warp keyframes",
      canvas: { w: CANVAS_W, h: CANVAS_H },
      shapes: shapes.map((s) => ({ id: s.id, points: s.points, color: s.color })),
      pins: pins.map((p) => ({
        id: p.id,
        x: p.x,
        y: p.y,
        restX: p.restX,
        restY: p.restY,
      })),
      keyframes,
      notes:
        "Pin rest vs current encodes IDW mesh warp. Pair .glb with this JSON for pin playback. Optional NFT mint planned (user-initiated, for a fee).",
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `skullmash_anim_${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
    setStatus("Exported JSON project + pin-warp animation data");
  };

  // Hotkeys when focused
  useEffect(() => {
    if (!isFocused || !ready) return;
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement | null;
      if (t && (t.tagName === "INPUT" || t.tagName === "TEXTAREA" || t.isContentEditable)) return;
      if (e.key === "Enter") {
        e.preventDefault();
        if (modeRef.current === "ANIMATE") exportGLB();
        else goNext();
      } else if (e.key === "Escape" || e.key === "Backspace") {
        if (e.key === "Backspace" && modeRef.current === "DRAW") {
          e.preventDefault();
          undoLast();
          return;
        }
        if (e.key === "Escape") {
          e.preventDefault();
          goBack();
        }
      } else if ((e.key === "z" || e.key === "Z") && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        if (modeRef.current === "DRAW") undoLast();
      } else if (e.key === "z" || e.key === "Z") {
        if (modeRef.current === "DRAW") {
          e.preventDefault();
          undoLast();
        }
      } else if (e.key === "k" || e.key === "K") {
        if (modeRef.current === "ANIMATE") {
          e.preventDefault();
          recordKeyframe();
        }
      } else if (e.key === " ") {
        if (modeRef.current === "ANIMATE" && keyframes.length >= 2) {
          e.preventDefault();
          setPlaying((p) => !p);
        }
      } else if (e.key === "r" || e.key === "R") {
        if (modeRef.current === "ANIMATE") {
          e.preventDefault();
          resetPinsToRest();
        }
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [isFocused, ready, goNext, goBack, exportGLB, keyframes.length]);

  const showSketch = mode === "DRAW" || mode === "ANIMATE";
  const show3d = mode === "INFLATE" || mode === "ANIMATE";
  const dual = mode === "ANIMATE";
  const onWelcome = !ready;

  const nextLabel = mode === "ANIMATE" ? "Export" : "Next";
  const nextAction = () => {
    if (mode === "ANIMATE") {
      exportGLB();
      return;
    }
    goNext();
  };

  return (
    <div className="sm-root" ref={rootRef} tabIndex={0}>
      <header className="sm-bar">
        <span className="sm-title">SKULLMASH</span>
        <span className="sm-chip">cutout · balloon · pin-warp</span>
        <div style={{ marginLeft: "auto", display: "flex", gap: 6 }}>
          <button type="button" className="sm-bar-btn primary" onClick={() => fileInputRef.current?.click()}>
            Image
          </button>
          <button
            type="button"
            className="sm-bar-btn"
            onClick={() => {
              setReady(false);
              setShapes([]);
              setPins([]);
              setKeyframes([]);
              strokeRef.current = [];
              setMode("DRAW");
              setPlaying(false);
              setStatus("Draw or upload an image to begin.");
            }}
          >
            New
          </button>
        </div>
      </header>

      <div
        className={`sm-stage${dragOver ? " drop" : ""}`}
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={onDrop}
      >
        {ready && (
          <div style={{ position: "absolute", left: "50%", top: 8, transform: "translateX(-50%)", zIndex: 20 }}>
            <div className="sm-steps">
              <button
                type="button"
                className={`sm-step ${mode === "DRAW" ? "active" : shapes.length ? "done" : ""}`}
                onClick={() => {
                  setMode("DRAW");
                  setStatus("Freehand closed regions. Z undo · Enter next.");
                  setStrokeVersion((v) => v + 1);
                }}
              >
                <span className="num">1</span> Draw
              </button>
              <button
                type="button"
                className={`sm-step ${mode === "INFLATE" ? "active" : ""}`}
                onClick={() => {
                  if (shapes.length === 0) {
                    setStatus("Draw a region first.");
                    return;
                  }
                  setMode("INFLATE");
                  setStatus("Plush body — orbit · tweak Inflate slider · Enter → Animate.");
                  requestAnimationFrame(() => rebuildMeshes());
                }}
              >
                <span className="num">2</span> Inflate
              </button>
              <button
                type="button"
                className={`sm-step ${mode === "ANIMATE" ? "active" : ""}`}
                onClick={() => {
                  if (shapes.length === 0) {
                    setStatus("Draw & inflate first.");
                    return;
                  }
                  setMode("ANIMATE");
                  setStatus("Yellow pins warp mesh · K = REC KF · Space play · R rest");
                  requestAnimationFrame(() => rebuildMeshes());
                }}
              >
                <span className="num">3</span> Animate
              </button>
            </div>
          </div>
        )}

        {ready && mode === "DRAW" && (
          <div style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", zIndex: 20 }}>
            <div className="sm-rail">
              <button
                type="button"
                className={`sm-rail-btn ${drawTool === "pen" ? "active" : ""}`}
                title="Pen"
                onClick={() => setDrawTool("pen")}
              >
                ✎
              </button>
              <button
                type="button"
                className={`sm-rail-btn ${drawTool === "select" ? "active" : ""}`}
                title="Select"
                onClick={() => setDrawTool("select")}
              >
                ▹
              </button>
              <button type="button" className="sm-rail-btn" title="Open image" onClick={() => fileInputRef.current?.click()}>
                ↥
              </button>
              <button type="button" className="sm-rail-btn" title="Undo (Z)" disabled={shapes.length === 0} onClick={undoLast}>
                ↺
              </button>
              <button type="button" className="sm-rail-btn danger" title="Clear" disabled={shapes.length === 0} onClick={clearAll}>
                ⌫
              </button>
            </div>
          </div>
        )}

        <div
          style={{
            position: "absolute",
            inset: 0,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: dual ? 8 : 0,
            padding: dual ? "40px 8px 56px" : 8,
          }}
        >
          {/* Sketch plane */}
          <div
            className="sm-canvas-wrap"
            style={{
              display: showSketch || onWelcome ? "block" : "none",
              flex: dual ? "1 1 50%" : undefined,
              maxWidth: dual ? "48%" : undefined,
              height: dual ? "100%" : undefined,
            }}
          >
            <canvas
              data-testid="sketch-canvas"
              ref={canvas2dRef}
              width={CANVAS_W}
              height={CANVAS_H}
              style={{
                zIndex: 10,
                opacity: 1,
                pointerEvents: showSketch ? "auto" : "none",
                touchAction: "none",
                cursor:
                  mode === "DRAW" && drawTool === "pen"
                    ? "crosshair"
                    : mode === "ANIMATE"
                      ? "pointer"
                      : "default",
              }}
              onPointerDown={onPointerDown}
              onPointerMove={onPointerMove}
              onPointerUp={onPointerUp}
              onPointerCancel={onPointerUp}
              onContextMenu={(e) => e.preventDefault()}
            />

            {onWelcome && (
              <div
                style={{
                  position: "absolute",
                  inset: 0,
                  zIndex: 30,
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 18,
                  padding: 24,
                  background: "#000",
                }}
              >
                <div className="sm-welcome">
                  <div className="sm-welcome-icon">◎</div>
                  <h1>Draw or upload an image</h1>
                  <p>Freehand cutouts inflate into soft 3D · export GLB + JSON</p>
                </div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 8, justifyContent: "center" }}>
                  <button type="button" className="sm-next" onClick={() => fileInputRef.current?.click()}>
                    Upload image
                  </button>
                  <button type="button" className="sm-back" onClick={loadSampleImage}>
                    Sample creature
                  </button>
                  <button type="button" className="sm-back" onClick={startBlank}>
                    Blank stage
                  </button>
                </div>
                <p style={{ maxWidth: 340, textAlign: "center", fontSize: 9, color: "#666", letterSpacing: 1, textTransform: "uppercase", lineHeight: 1.7, fontFamily: "var(--dm-font-primary)" }}>
                  Drop a photo · trace closed shapes ·{" "}
                  <span style={{ color: "#00ff00" }}>Next</span> · pin-warp · export.
                  Optional NFT mint (for a fee) planned.
                </p>
              </div>
            )}
          </div>

          {/* 3D balloon */}
          <div
            className="sm-canvas-wrap"
            style={{
              display: show3d ? "block" : "none",
              flex: dual ? "1 1 50%" : undefined,
              maxWidth: dual ? "48%" : mode === "INFLATE" ? undefined : 0,
              height: dual || mode === "INFLATE" ? "100%" : undefined,
            }}
          >
            <div
              ref={threeHostRef}
              className="sm-three"
              data-testid="three-host"
              style={{
                zIndex: 10,
                opacity: 1,
                pointerEvents: show3d ? "auto" : "none",
              }}
            />
            {show3d && shapes.length === 0 && (
              <div
                style={{
                  position: "absolute",
                  inset: 0,
                  zIndex: 20,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  pointerEvents: "none",
                }}
              >
                <p className="sm-hint">Draw regions first</p>
              </div>
            )}
            {dual && (
              <div
                style={{
                  position: "absolute",
                  top: 6,
                  left: 6,
                  zIndex: 15,
                  fontFamily: "var(--dm-font-primary)",
                  fontSize: 8,
                  letterSpacing: 1,
                  color: "#666",
                  textTransform: "uppercase",
                  pointerEvents: "none",
                }}
              >
                3D warp
              </div>
            )}
          </div>
        </div>

        {ready && (mode === "DRAW" || mode === "INFLATE") && (
          <div
            style={{
              position: "absolute",
              bottom: 14,
              left: "50%",
              transform: "translateX(-50%)",
              zIndex: 20,
              display: "flex",
              gap: 8,
              flexWrap: "wrap",
              justifyContent: "center",
            }}
          >
            {mode === "DRAW" && (
              <label className="sm-brush">
                Brush
                <input
                  type="range"
                  min={1}
                  max={8}
                  step={0.5}
                  value={brush}
                  onChange={(e) => setBrush(parseFloat(e.target.value))}
                />
              </label>
            )}
            <label className="sm-brush" title="Plush thickness — low = flatter, high = chunky doll">
              Inflate {Math.round(inflateSlider)}
              <input
                type="range"
                min={0}
                max={100}
                step={1}
                value={inflateSlider}
                onChange={(e) => {
                  const v = parseFloat(e.target.value);
                  setInflateSlider(v);
                  setStatus(
                    `Inflate ${Math.round(v)} · ${
                      v < 30 ? "flat sheet" : v < 55 ? "soft plush" : v < 75 ? "stuffed" : "chunky"
                    }`,
                  );
                }}
              />
            </label>
          </div>
        )}

        {ready && mode === "ANIMATE" && (
          <div style={{ position: "absolute", bottom: 12, left: "50%", transform: "translateX(-50%)", zIndex: 20 }}>
            <div className="sm-timeline">
              <button type="button" className="sm-footer-btn" onClick={recordKeyframe} title="K">
                REC KF
              </button>
              <button
                type="button"
                className="sm-footer-btn"
                disabled={keyframes.length < 2}
                onClick={() => setPlaying((p) => !p)}
                title="Space"
              >
                {playing ? "Stop" : "Play"}
              </button>
              <button type="button" className="sm-footer-btn" onClick={resetPinsToRest} title="R" disabled={pins.length === 0}>
                Rest
              </button>
              <span style={{ fontFamily: "var(--dm-font-primary)", fontSize: 9, color: "#888", letterSpacing: 1 }}>
                t={time.toFixed(2)}
              </span>
              <input
                type="range"
                min={0}
                max={1}
                step={0.01}
                value={time}
                onChange={(e) => {
                  setPlaying(false);
                  setTime(parseFloat(e.target.value));
                }}
              />
              <span style={{ fontSize: 9, color: "#666", letterSpacing: 1, fontFamily: "var(--dm-font-primary)" }}>
                {pins.length}p · {keyframes.length}kf
              </span>
              <button
                type="button"
                className="sm-footer-btn"
                disabled={pins.length === 0}
                onClick={() => {
                  setPins([]);
                  setKeyframes([]);
                  setStatus("Pins cleared.");
                }}
              >
                Clear
              </button>
            </div>
          </div>
        )}

        {ready && (
          <div style={{ position: "absolute", bottom: 12, right: 10, zIndex: 30, display: "flex", gap: 6, alignItems: "center" }}>
            {mode !== "DRAW" && (
              <button type="button" className="sm-back" onClick={goBack}>
                ← Back
              </button>
            )}
            <button
              type="button"
              className="sm-next"
              onClick={nextAction}
              disabled={mode === "DRAW" && shapes.length === 0}
              data-testid="next-btn"
            >
              {nextLabel} →
            </button>
          </div>
        )}
      </div>

      <footer className="sm-footer">
        <span className="sm-status">{status}</span>
        <span className="sm-status" style={{ flex: "none" }}>
          {shapes.length} region{shapes.length === 1 ? "" : "s"}
          {hasImage ? " · image" : ready ? " · blank" : ""}
          {mode === "ANIMATE" ? " · warp" : ""}
        </span>
        <button type="button" className="sm-footer-btn primary" onClick={exportGLB}>
          .GLB
        </button>
        <button type="button" className="sm-footer-btn primary" onClick={exportJSON}>
          JSON
        </button>
        <button
          type="button"
          className="sm-footer-btn"
          disabled
          title="Optional mint of your object as an NFT for a fee — coming later"
        >
          Mint NFT
        </button>
      </footer>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        style={{ display: "none" }}
        onChange={onFileChange}
      />
    </div>
  );
}
