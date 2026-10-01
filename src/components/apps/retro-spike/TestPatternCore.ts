/*
 *                    ☦
 *      TEST PATTERN CORE — RETRO SPIKE REFERENCE IMPL
 *
 *  A stub EmulatorCore that doesn't emulate anything real. It draws
 *  animated stripes with the arrow keys scrolling the pattern and the
 *  four action buttons cycling palettes. Its job: prove that the shell's
 *  canvas / tick / input pipeline works end-to-end without pulling in a
 *  real WASM core.
 *
 *  When a real core (binjgb, mGBA, etc.) lands, drop a new file beside
 *  this one that satisfies the EmulatorCore contract and the shell will
 *  host it with zero other changes.
 */

import type { EmulatorCore, KosButton } from "./EmulatorCore";

// Four retro-flavored 4-color palettes, RGBA tuples.
const PALETTES: readonly (readonly [number, number, number][])[] = [
  // Game Boy DMG greens
  [
    [15, 56, 15],
    [48, 98, 48],
    [139, 172, 15],
    [155, 188, 15],
  ],
  // Monochrome
  [
    [0, 0, 0],
    [85, 85, 85],
    [170, 170, 170],
    [255, 255, 255],
  ],
  // K-OS yellow/black
  [
    [0, 0, 0],
    [34, 34, 0],
    [136, 136, 0],
    [255, 255, 0],
  ],
  // CGA-ish magenta/cyan
  [
    [0, 0, 0],
    [85, 255, 255],
    [255, 85, 255],
    [255, 255, 255],
  ],
];

export class TestPatternCore implements EmulatorCore {
  readonly name = "TEST PATTERN";
  readonly systemLabel = "TEST";
  readonly romExtensions = ["*"] as const;
  readonly canvasWidth = 160;    // Game Boy-ish native resolution
  readonly canvasHeight = 144;

  private ctx: CanvasRenderingContext2D | null = null;
  private imageData: ImageData | null = null;
  private romLoaded = false;
  private frame = 0;
  private scrollX = 0;
  private scrollY = 0;
  private paletteIndex = 0;
  private buttons: Record<KosButton, boolean> = {
    Up: false, Down: false, Left: false, Right: false,
    A: false, B: false, C: false, D: false,
  };

  async init(ctx: CanvasRenderingContext2D): Promise<void> {
    this.ctx = ctx;
    this.imageData = ctx.createImageData(this.canvasWidth, this.canvasHeight);
  }

  async loadRom(_bytes: ArrayBuffer): Promise<void> {
    // No-op — but we flip the running flag so the shell knows a ROM
    // was "accepted." A real core would parse header, set up banks, etc.
    this.romLoaded = true;
  }

  step(dtMs: number): void {
    if (!this.ctx || !this.imageData || !this.romLoaded) return;

    this.frame++;

    // Arrow keys scroll the pattern, roughly pixels per second scaled by dt.
    const speed = 60; // px/sec
    const dx = (this.buttons.Right ? 1 : 0) - (this.buttons.Left ? 1 : 0);
    const dy = (this.buttons.Down ? 1 : 0) - (this.buttons.Up ? 1 : 0);
    this.scrollX += dx * speed * (dtMs / 1000);
    this.scrollY += dy * speed * (dtMs / 1000);

    // A/B/C/D pick one of the four palettes on press; shell calls setButton.
    // paletteIndex is mutated in setButton, so nothing to do here.

    const palette = PALETTES[this.paletteIndex];
    const data = this.imageData.data;
    const w = this.canvasWidth;
    const h = this.canvasHeight;
    const sx = Math.floor(this.scrollX);
    const sy = Math.floor(this.scrollY);

    // Diagonal-stripe test pattern, tile size 8 pixels, picking from 4 shades.
    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        const tile = (((x + sx) >> 3) + ((y + sy) >> 3)) & 3;
        const [r, g, b] = palette[tile];
        const i = (y * w + x) * 4;
        data[i] = r;
        data[i + 1] = g;
        data[i + 2] = b;
        data[i + 3] = 255;
      }
    }

    this.ctx.putImageData(this.imageData, 0, 0);
  }

  isRunning(): boolean {
    return this.romLoaded;
  }

  setButton(btn: KosButton, pressed: boolean): void {
    const wasPressed = this.buttons[btn];
    this.buttons[btn] = pressed;
    if (!wasPressed && pressed) {
      if (btn === "A") this.paletteIndex = 0;
      else if (btn === "B") this.paletteIndex = 1;
      else if (btn === "C") this.paletteIndex = 2;
      else if (btn === "D") this.paletteIndex = 3;
    }
  }

  dispose(): void {
    this.ctx = null;
    this.imageData = null;
    this.romLoaded = false;
  }
}
