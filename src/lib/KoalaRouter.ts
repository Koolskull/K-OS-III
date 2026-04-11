/*
 *                ☦
 *        ╔══════════════╗
 *        ║  ST. KATERI  ║
 *        ║  TEKAKWITHA  ║
 *        ║  Guardian of ║
 *        ║  live pads   ║
 *        ╚══════════════╝
 *
 *   KOALA ROUTER
 *   Koala Sampler-style keyboard layout for live performance.
 *   Capture-phase handler that takes over the keyboard when active,
 *   preventing InputRouter and LivePads from seeing events.
 *
 *   PAD GRID (left hand, 4x4):
 *     1  2  3  4   → pads 12-15  (top row)
 *     Q  W  E  R   → pads  8-11
 *     A  S  D  F   → pads  4-7
 *     Z  X  C  V   → pads  0-3   (bottom row)
 *
 *   SCENE LAUNCH (right hand, 2x4):
 *     Y  U  I  O   → scenes 0-3
 *     H  J  K  L   → scenes 4-7
 *
 *   MODIFIERS:
 *     N + pad key  → solo toggle
 *     B + pad key  → mute toggle
 *
 *   TRANSPORT & BANKS:
 *     Space        → play/stop
 *     ←/→          → switch pad bank
 *     [ / ]        → switch pad bank (alt)
 *     { / }        → switch pattern bank (Shift+[/])
 *     0            → toggle recording
 *     Backspace    → delete sample on last-triggered pad
 */

export type KoalaAction =
  | { type: "pad_down"; padIndex: number }
  | { type: "pad_up"; padIndex: number }
  | { type: "scene_launch"; sceneIndex: number }
  | { type: "play_stop" }
  | { type: "bank_prev" }
  | { type: "bank_next" }
  | { type: "pattern_bank_prev" }
  | { type: "pattern_bank_next" }
  | { type: "solo_toggle"; padIndex: number }
  | { type: "mute_toggle"; padIndex: number }
  | { type: "record_toggle" }
  | { type: "delete_sample" };

type ActionCallback = (action: KoalaAction) => void;

// ── PAD KEY MAP ──
// Maps keyboard code → pad index (0-15)
const PAD_KEYS: Record<string, number> = {
  KeyZ:   0,  KeyX:   1,  KeyC:   2,  KeyV:   3,
  KeyA:   4,  KeyS:   5,  KeyD:   6,  KeyF:   7,
  KeyQ:   8,  KeyW:   9,  KeyE:  10,  KeyR:  11,
  Digit1: 12, Digit2: 13, Digit3: 14, Digit4: 15,
};

// ── SCENE KEY MAP ──
// Maps keyboard code → scene index (0-7)
const SCENE_KEYS: Record<string, number> = {
  KeyY: 0, KeyU: 1, KeyI: 2, KeyO: 3,
  KeyH: 4, KeyJ: 5, KeyK: 6, KeyL: 7,
};

// All codes this router claims (to prevent fallthrough)
const CLAIMED_CODES = new Set([
  ...Object.keys(PAD_KEYS),
  ...Object.keys(SCENE_KEYS),
  "Space", "ArrowLeft", "ArrowRight",
  "BracketLeft", "BracketRight",  // [ ] sample bank, { } pattern bank
  "Digit0",
  "Backspace",                     // delete sample
  "KeyN", "KeyB",                  // modifier keys
]);

export class KoalaRouter {
  public enabled = false;

  private listeners: ActionCallback[] = [];
  private nHeld = false; // solo modifier
  private bHeld = false; // mute modifier
  private heldPads = new Set<number>(); // for pad_up tracking

  constructor() {
    this.handleKeyDown = this.handleKeyDown.bind(this);
    this.handleKeyUp = this.handleKeyUp.bind(this);
  }

  attach(): void {
    window.addEventListener("keydown", this.handleKeyDown, true);
    window.addEventListener("keyup", this.handleKeyUp, true);
  }

  detach(): void {
    window.removeEventListener("keydown", this.handleKeyDown, true);
    window.removeEventListener("keyup", this.handleKeyUp, true);
    this.nHeld = false;
    this.bHeld = false;
    this.heldPads.clear();
  }

  onAction(cb: ActionCallback): () => void {
    this.listeners.push(cb);
    return () => {
      this.listeners = this.listeners.filter((l) => l !== cb);
    };
  }

  private emit(action: KoalaAction): void {
    for (const cb of this.listeners) {
      cb(action);
    }
  }

  private handleKeyDown(e: KeyboardEvent): void {
    if (!this.enabled) return;
    const code = e.code;

    // Don't claim keys we don't handle
    if (!CLAIMED_CODES.has(code)) return;

    e.preventDefault();
    e.stopPropagation();

    // Modifier tracking
    if (code === "KeyN") { this.nHeld = true; return; }
    if (code === "KeyB") { this.bHeld = true; return; }

    // Pad keys
    const padIndex = PAD_KEYS[code];
    if (padIndex !== undefined) {
      if (this.nHeld) {
        this.emit({ type: "solo_toggle", padIndex });
      } else if (this.bHeld) {
        this.emit({ type: "mute_toggle", padIndex });
      } else {
        if (!this.heldPads.has(padIndex)) {
          this.heldPads.add(padIndex);
          this.emit({ type: "pad_down", padIndex });
        }
      }
      return;
    }

    // Scene keys
    const sceneIndex = SCENE_KEYS[code];
    if (sceneIndex !== undefined) {
      this.emit({ type: "scene_launch", sceneIndex });
      return;
    }

    // Transport & banks
    if (code === "Space") { this.emit({ type: "play_stop" }); return; }
    if (code === "ArrowLeft") { this.emit({ type: "bank_prev" }); return; }
    if (code === "ArrowRight") { this.emit({ type: "bank_next" }); return; }
    if (code === "BracketLeft") {
      if (e.shiftKey) { this.emit({ type: "pattern_bank_prev" }); }
      else { this.emit({ type: "bank_prev" }); }
      return;
    }
    if (code === "BracketRight") {
      if (e.shiftKey) { this.emit({ type: "pattern_bank_next" }); }
      else { this.emit({ type: "bank_next" }); }
      return;
    }
    if (code === "Digit0") { this.emit({ type: "record_toggle" }); return; }
    if (code === "Backspace") { this.emit({ type: "delete_sample" }); return; }
  }

  private handleKeyUp(e: KeyboardEvent): void {
    if (!this.enabled) return;
    const code = e.code;

    if (!CLAIMED_CODES.has(code)) return;

    e.preventDefault();
    e.stopPropagation();

    // Modifier release
    if (code === "KeyN") { this.nHeld = false; return; }
    if (code === "KeyB") { this.bHeld = false; return; }

    // Pad release
    const padIndex = PAD_KEYS[code];
    if (padIndex !== undefined && this.heldPads.has(padIndex)) {
      this.heldPads.delete(padIndex);
      this.emit({ type: "pad_up", padIndex });
    }
  }
}
