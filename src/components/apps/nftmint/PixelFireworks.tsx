"use client";

import React, { useEffect, useRef } from "react";

const BAYER = [
  [0, 8, 2, 10],
  [12, 4, 14, 6],
  [3, 11, 1, 9],
  [15, 7, 13, 5],
];

type Shard = { x: number; y: number; vx: number; vy: number; life: number; max: number; white: boolean };

/**
 * Ordered-dither pixel fireworks. Drawn in the rim around the piece
 * so the art stays readable. A burst plays only when `burst` changes.
 */
export function PixelFireworks({ burst }: { burst: number }) {
  const ref = useRef<HTMLCanvasElement>(null);
  const burstRef = useRef(burst);
  burstRef.current = burst;

  useEffect(() => {
    const canvas = ref.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;
    const W = 96;
    const H = 80;
    canvas.width = W;
    canvas.height = H;
    ctx.imageSmoothingEnabled = false;
    const shards: Shard[] = [];
    let seen = burstRef.current;
    let stop = false;

    function rim(): { x: number; y: number } {
      const edge = Math.floor(Math.random() * 4);
      if (edge === 0) return { x: 2 + Math.random() * W * 0.22, y: Math.random() * H };
      if (edge === 1) return { x: W * 0.78 + Math.random() * W * 0.2, y: Math.random() * H };
      if (edge === 2) return { x: Math.random() * W, y: 2 + Math.random() * H * 0.22 };
      return { x: Math.random() * W, y: H * 0.78 + Math.random() * H * 0.2 };
    }

    function boom(n: number) {
      const at = rim();
      for (let i = 0; i < n; i++) {
        const angle = (Math.PI * 2 * i) / n + Math.random() * 0.35;
        const speed = 0.28 + Math.random() * 0.85;
        const life = 16 + Math.floor(Math.random() * 18);
        shards.push({
          x: at.x,
          y: at.y,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed,
          life,
          max: life,
          white: Math.random() > 0.7,
        });
      }
      for (let y = H - 2; y > at.y; y -= 4) {
        shards.push({ x: at.x, y, vx: 0, vy: -1.1, life: 5, max: 5, white: false });
      }
    }

    function stamp(data: Uint8ClampedArray, x: number, y: number, white: boolean) {
      for (let dy = 0; dy < 2; dy++) {
        for (let dx = 0; dx < 2; dx++) {
          const px = x + dx;
          const py = y + dy;
          if (px >= W || py >= H) continue;
          const o = (py * W + px) * 4;
          if (white) {
            data[o] = 255;
            data[o + 1] = 255;
            data[o + 2] = 255;
          } else {
            data[o] = 0;
            data[o + 1] = 255;
            data[o + 2] = 0;
          }
          data[o + 3] = 255;
        }
      }
    }

    function tick() {
      if (stop) return;
      if (burstRef.current !== seen) {
        seen = burstRef.current;
        for (let i = 0; i < 8; i++) boom(22);
      }
      if (shards.length > 900) shards.splice(0, shards.length - 900);
      const img = ctx!.createImageData(W, H);
      const data = img.data;
      for (let i = shards.length - 1; i >= 0; i--) {
        const p = shards[i];
        p.x += p.vx;
        p.y += p.vy;
        p.vy += 0.028;
        p.life -= 1;
        if (p.life <= 0 || p.x < 0 || p.y < 0 || p.x >= W || p.y >= H) {
          shards.splice(i, 1);
          continue;
        }
        const x = p.x | 0;
        const y = p.y | 0;
        const fade = p.life / p.max;
        if (fade < BAYER[y & 3][x & 3] / 16) continue;
        stamp(data, x, y, p.white && fade > 0.45);
      }
      ctx!.putImageData(img, 0, 0);
      requestAnimationFrame(tick);
    }

    const id = requestAnimationFrame(tick);
    return () => {
      stop = true;
      cancelAnimationFrame(id);
    };
  }, []);

  return (
    <canvas
      ref={ref}
      aria-hidden
      style={{
        position: "absolute",
        inset: 0,
        width: "100%",
        height: "100%",
        imageRendering: "pixelated",
        pointerEvents: "none",
        zIndex: 0,
      }}
    />
  );
}
