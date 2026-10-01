/*
 *                    ☦
 *      EMULATOR CORE INTERFACE — K-OS RETRO SPIKE
 *
 *  A minimum contract that any pluggable emulator core must satisfy so
 *  it can mount inside the K-OS RetroSpike app shell. Keeps the shell
 *  agnostic about whether the core is a hand-rolled TS emulator, a
 *  WASM-compiled C/C++ core (binjgb, mGBA, Genesis Plus GX via
 *  libretro-web), or anything else.
 *
 *  The K-OS 8-button input model is the canonical input surface. A core
 *  wrapping a libretro-style backend is expected to map these to
 *  whatever buttons the underlying system expects.
 */

export type KosButton =
  | "Up"
  | "Down"
  | "Left"
  | "Right"
  | "A"   // KeyQ
  | "B"   // KeyW
  | "C"   // Space
  | "D"   // Shift
  ;

export interface EmulatorCore {
  /** Human-readable core name, shown in the shell's header. */
  readonly name: string;
  /** Short system label (e.g. "GB", "GBA", "GEN", "NES"). */
  readonly systemLabel: string;
  /** Accepted ROM file extensions, lowercased with leading dot. Use ["*"] to accept anything (test cores). */
  readonly romExtensions: readonly string[];
  /** Native framebuffer width in pixels — canvas scales up from this. */
  readonly canvasWidth: number;
  /** Native framebuffer height in pixels. */
  readonly canvasHeight: number;

  /**
   * Called once after the canvas is available. Core may allocate
   * framebuffers, compile shaders, download WASM, etc. The ctx is a
   * 2d context pre-sized to (canvasWidth, canvasHeight).
   */
  init(ctx: CanvasRenderingContext2D): Promise<void>;

  /**
   * Load a ROM. Cores that don't need a ROM (e.g. a test pattern) may
   * no-op this. Called after init, may be called again to hot-swap.
   */
  loadRom(bytes: ArrayBuffer): Promise<void>;

  /**
   * Advance one frame of emulation and draw to the 2d context.
   * dtMs is the wall-clock time since the previous step() call, clamped
   * by the caller. Cores should run at their own native tick rate and
   * discard excess time rather than trying to catch up.
   */
  step(dtMs: number): void;

  /** Report whether a ROM is currently loaded and running. */
  isRunning(): boolean;

  /** Push a K-OS button press/release to the core. */
  setButton(btn: KosButton, pressed: boolean): void;

  /** Release any WASM memory, stop background workers, etc. */
  dispose(): void;
}
