/*
 *                ☦
 *        ╔══════════════╗
 *        ║  ST. MICHAEL ║
 *        ║  ARCHANGEL   ║
 *        ║  Guardian of ║
 *        ║  all inputs  ║
 *        ╚══════════════╝
 *
 *   INPUT ROUTER
 *   Normalizes keyboard, gamepad, touch
 *   into a unified virtual button state.
 *
 *   LGPT / LSDj / PicoTracker input model:
 *   - Arrow keys = cursor movement
 *   - Shift (held) + Arrow keys = screen navigation
 *   - Q (held) + Arrow keys = change values
 *   - Space = play/stop
 *   - A key = place note / confirm
 *   - Delete/Backspace = delete value
 */

export type VirtualButton =
  | "up" | "down" | "left" | "right"
  | "a" | "b"
  | "select" | "start";

export type InputAction =
  | "cursor_up" | "cursor_down" | "cursor_left" | "cursor_right"
  | "nav_up" | "nav_down" | "nav_left" | "nav_right"
  | "value_up" | "value_down" | "value_left" | "value_right"
  | "place" | "delete" | "play_stop"
  | "cut" | "copy" | "paste"
  | "octave_up" | "octave_down"
  | "prev_channel" | "next_channel"
  | "toggle_display"
  | "sw_up" | "sw_down" | "sw_left" | "sw_right";

interface InputState {
  shift: boolean;    // SELECT modifier (Shift key / R shoulder on PSP)
  q: boolean;        // Value edit modifier (Q key / L shoulder on PSP)
  w: boolean;        // Phrase resize modifier (W key)
  arrows: { up: boolean; down: boolean; left: boolean; right: boolean };
}

type ActionCallback = (action: InputAction) => void;

// ── GAMEPAD BUTTON INDICES (Standard Gamepad Layout) ──
const GP_A      = 0;   // A / Cross       → place
const GP_B      = 1;   // B / Circle      → delete
const GP_X      = 2;   // X / Square      → shift modifier
const GP_Y      = 3;   // Y / Triangle    → toggle display
const GP_LB     = 4;   // L Shoulder      → prev channel
const GP_RB     = 5;   // R Shoulder      → next channel
const GP_LT     = 6;   // L Trigger       → Q modifier (value edit)
const GP_RT     = 7;   // R Trigger       → W modifier
const GP_SELECT = 8;   // Select / Back
const GP_START  = 9;   // Start           → play/stop
const GP_UP     = 12;  // D-pad Up
const GP_DOWN   = 13;  // D-pad Down
const GP_LEFT   = 14;  // D-pad Left
const GP_RIGHT  = 15;  // D-pad Right

export class InputRouter {
  /** When false, all actions are suppressed (e.g. during Bible mode) */
  public enabled = true;

  private state: InputState = {
    shift: false,
    q: false,
    w: false,
    arrows: { up: false, down: false, left: false, right: false },
  };
  /** Track if Q was used as a modifier (combined with another key) */
  private qUsedAsModifier = false;

  private listeners: ActionCallback[] = [];
  private keyRepeatTimers: Map<string, number> = new Map();
  private keyRepeatDelay = 300;   // ms before repeat starts
  private keyRepeatRate = 80;     // ms between repeats

  // ── Gamepad state ──
  private gamepadRafId: number | null = null;
  private prevButtons: Map<number, boolean[]> = new Map();
  private gamepadRepeatTimers: Map<string, number> = new Map();
  private gamepadDeadZone = 0.5;

  constructor() {
    this.handleKeyDown = this.handleKeyDown.bind(this);
    this.handleKeyUp = this.handleKeyUp.bind(this);
    this.pollGamepads = this.pollGamepads.bind(this);
  }

  // ══════════════════════════════════════
  // PUBLIC API
  // ══════════════════════════════════════

  /** Start listening to keyboard + gamepad events */
  attach(): void {
    window.addEventListener("keydown", this.handleKeyDown);
    window.addEventListener("keyup", this.handleKeyUp);
    this.startGamepadPoll();
  }

  /** Stop listening */
  detach(): void {
    window.removeEventListener("keydown", this.handleKeyDown);
    window.removeEventListener("keyup", this.handleKeyUp);
    this.keyRepeatTimers.forEach((id) => clearTimeout(id));
    this.keyRepeatTimers.clear();
    this.stopGamepadPoll();
  }

  /** Subscribe to input actions */
  onAction(cb: ActionCallback): () => void {
    this.listeners.push(cb);
    return () => {
      this.listeners = this.listeners.filter((l) => l !== cb);
    };
  }

  /** Get current modifier state (for UI display) */
  getModifiers(): { shift: boolean; q: boolean; w: boolean } {
    return { shift: this.state.shift, q: this.state.q, w: this.state.w };
  }

  /** Inject a virtual action from the touch controller */
  injectAction(action: InputAction): void {
    if (!this.enabled) return;
    this.emit(action);
  }

  /** Set modifier state from touch controller */
  setModifier(mod: "shift" | "q" | "w", pressed: boolean): void {
    this.state[mod] = pressed;
  }

  /** Resolve what a directional input does given current modifier state */
  resolveDirection(dir: "up" | "down" | "left" | "right"): InputAction {
    if (this.state.shift && this.state.w) return `sw_${dir}` as InputAction;
    if (this.state.shift) return `nav_${dir}` as InputAction;
    if (this.state.q) return `value_${dir}` as InputAction;
    return `cursor_${dir}` as InputAction;
  }

  // ══════════════════════════════════════
  // INTERNAL
  // ══════════════════════════════════════

  private emit(action: InputAction): void {
    for (const cb of this.listeners) {
      cb(action);
    }
  }

  // ── KEYBOARD ──

  private handleKeyDown(e: KeyboardEvent): void {
    if (!this.enabled) return;

    const key = e.key;
    const code = e.code;

    // Modifier tracking
    if (key === "Shift") {
      this.state.shift = true;
      return;
    }
    if (code === "KeyQ") {
      this.state.q = true;
      this.qUsedAsModifier = false;
      // Q pressed while W held = delete (same as W pressed while Q held)
      if (this.state.w) {
        this.qUsedAsModifier = true;
        e.preventDefault();
        this.emit("delete");
        return;
      }
      return;
    }
    if (code === "KeyW") {
      this.state.w = true;
      if (this.state.q) {
        this.qUsedAsModifier = true;
        e.preventDefault();
        this.emit("delete");
        return;
      }
    }

    const action = this.resolveAction(key, code);
    if (!action) return;

    e.preventDefault();
    e.stopPropagation();

    this.emit(action);

    // Key repeat
    if (!this.keyRepeatTimers.has(code)) {
      const delayTimer = window.setTimeout(() => {
        const repeatTimer = window.setInterval(() => {
          const repeatAction = this.resolveAction(key, code);
          if (repeatAction) this.emit(repeatAction);
        }, this.keyRepeatRate);
        this.keyRepeatTimers.set(code, repeatTimer);
      }, this.keyRepeatDelay);
      this.keyRepeatTimers.set(code + "_delay", delayTimer);
    }
  }

  private handleKeyUp(e: KeyboardEvent): void {
    const key = e.key;
    const code = e.code;

    if (key === "Shift") {
      this.state.shift = false;
      return;
    }
    if (code === "KeyQ") {
      this.state.q = false;
      if (!this.qUsedAsModifier) {
        e.preventDefault();
        this.emit("place");
      }
      this.qUsedAsModifier = false;
      return;
    }
    if (code === "KeyW") {
      this.state.w = false;
      return;
    }

    // Clear key repeat timers
    const delayTimer = this.keyRepeatTimers.get(code + "_delay");
    if (delayTimer !== undefined) {
      clearTimeout(delayTimer);
      this.keyRepeatTimers.delete(code + "_delay");
    }
    const repeatTimer = this.keyRepeatTimers.get(code);
    if (repeatTimer !== undefined) {
      clearInterval(repeatTimer);
      this.keyRepeatTimers.delete(code);
    }
  }

  private resolveAction(key: string, code: string): InputAction | null {
    // ── ARROW KEYS → directional with modifiers ──
    if (key === "ArrowUp") {
      if (this.state.q) this.qUsedAsModifier = true;
      return this.resolveDirection("up");
    }
    if (key === "ArrowDown") {
      if (this.state.q) this.qUsedAsModifier = true;
      return this.resolveDirection("down");
    }
    if (key === "ArrowLeft") {
      if (this.state.q) this.qUsedAsModifier = true;
      return this.resolveDirection("left");
    }
    if (key === "ArrowRight") {
      if (this.state.q) this.qUsedAsModifier = true;
      return this.resolveDirection("right");
    }

    if (code === "Space") return "play_stop";
    if (code === "KeyZ" && !this.state.shift) return "place";
    if (key === "Enter") return "place";
    if (code === "KeyX") return "delete";
    if (key === "Backspace") return "delete";
    if (key === "Delete") return "delete";

    if (this.state.q && code === "KeyX") return "cut";
    if (this.state.q && code === "KeyC") return "copy";
    if (this.state.q && code === "KeyV") return "paste";
    if (this.state.q && code === "KeyS") return "octave_down";

    if (code === "BracketLeft") return "prev_channel";
    if (code === "BracketRight") return "next_channel";
    if (key === "Tab") return "toggle_display";

    return null;
  }

  // ── GAMEPAD ──

  private startGamepadPoll(): void {
    if (this.gamepadRafId !== null) return;
    this.pollGamepads();
  }

  private stopGamepadPoll(): void {
    if (this.gamepadRafId !== null) {
      cancelAnimationFrame(this.gamepadRafId);
      this.gamepadRafId = null;
    }
    this.gamepadRepeatTimers.forEach((id) => clearTimeout(id));
    this.gamepadRepeatTimers.clear();
    this.prevButtons.clear();
  }

  private pollGamepads(): void {
    this.gamepadRafId = requestAnimationFrame(this.pollGamepads);

    if (!this.enabled) return;

    const gamepads = navigator.getGamepads?.();
    if (!gamepads) return;

    for (let gi = 0; gi < gamepads.length; gi++) {
      const gp = gamepads[gi];
      if (!gp) continue;

      const prev = this.prevButtons.get(gi) ?? [];
      const curr: boolean[] = [];

      for (let bi = 0; bi < gp.buttons.length; bi++) {
        const pressed = gp.buttons[bi].pressed;
        curr[bi] = pressed;
        const wasPressed = prev[bi] ?? false;

        if (pressed && !wasPressed) {
          this.onGamepadPress(gi, bi);
        } else if (!pressed && wasPressed) {
          this.onGamepadRelease(gi, bi);
        }
      }

      // Axis-based D-pad (for gamepads that report D-pad on axes)
      if (gp.axes.length >= 2) {
        const ax = gp.axes[0];
        const ay = gp.axes[1];
        // Treat axis as buttons at indices 100-103 for tracking
        const axisLeft = ax < -this.gamepadDeadZone;
        const axisRight = ax > this.gamepadDeadZone;
        const axisUp = ay < -this.gamepadDeadZone;
        const axisDown = ay > this.gamepadDeadZone;
        const prevAxisLeft = (prev[100] ?? false);
        const prevAxisRight = (prev[101] ?? false);
        const prevAxisUp = (prev[102] ?? false);
        const prevAxisDown = (prev[103] ?? false);

        curr[100] = axisLeft;
        curr[101] = axisRight;
        curr[102] = axisUp;
        curr[103] = axisDown;

        if (axisLeft && !prevAxisLeft) this.onGamepadPress(gi, GP_LEFT);
        if (!axisLeft && prevAxisLeft) this.onGamepadRelease(gi, GP_LEFT);
        if (axisRight && !prevAxisRight) this.onGamepadPress(gi, GP_RIGHT);
        if (!axisRight && prevAxisRight) this.onGamepadRelease(gi, GP_RIGHT);
        if (axisUp && !prevAxisUp) this.onGamepadPress(gi, GP_UP);
        if (!axisUp && prevAxisUp) this.onGamepadRelease(gi, GP_UP);
        if (axisDown && !prevAxisDown) this.onGamepadPress(gi, GP_DOWN);
        if (!axisDown && prevAxisDown) this.onGamepadRelease(gi, GP_DOWN);
      }

      this.prevButtons.set(gi, curr);
    }
  }

  private onGamepadPress(gpIdx: number, button: number): void {
    // Modifier buttons — set state, don't emit action
    if (button === GP_X) { this.state.shift = true; return; }
    if (button === GP_LT) { this.state.q = true; return; }
    if (button === GP_RT) { this.state.w = true; return; }

    const action = this.resolveGamepadButton(button);
    if (!action) return;

    this.emit(action);

    // D-pad repeat
    if (button >= GP_UP && button <= GP_RIGHT) {
      const key = `gp_${gpIdx}_${button}`;
      if (!this.gamepadRepeatTimers.has(key)) {
        const delayTimer = window.setTimeout(() => {
          const repeatTimer = window.setInterval(() => {
            const repeatAction = this.resolveGamepadButton(button);
            if (repeatAction) this.emit(repeatAction);
          }, this.keyRepeatRate);
          this.gamepadRepeatTimers.set(key, repeatTimer);
        }, this.keyRepeatDelay);
        this.gamepadRepeatTimers.set(key + "_delay", delayTimer);
      }
    }
  }

  private onGamepadRelease(gpIdx: number, button: number): void {
    // Release modifiers
    if (button === GP_X) { this.state.shift = false; return; }
    if (button === GP_LT) { this.state.q = false; return; }
    if (button === GP_RT) { this.state.w = false; return; }

    // Clear D-pad repeat
    if (button >= GP_UP && button <= GP_RIGHT) {
      const key = `gp_${gpIdx}_${button}`;
      const delayTimer = this.gamepadRepeatTimers.get(key + "_delay");
      if (delayTimer !== undefined) {
        clearTimeout(delayTimer);
        this.gamepadRepeatTimers.delete(key + "_delay");
      }
      const repeatTimer = this.gamepadRepeatTimers.get(key);
      if (repeatTimer !== undefined) {
        clearInterval(repeatTimer);
        this.gamepadRepeatTimers.delete(key);
      }
    }
  }

  private resolveGamepadButton(button: number): InputAction | null {
    switch (button) {
      case GP_A:      return "place";
      case GP_B:      return "delete";
      case GP_Y:      return "toggle_display";
      case GP_LB:     return "prev_channel";
      case GP_RB:     return "next_channel";
      case GP_START:  return "play_stop";
      case GP_SELECT: return "toggle_display";
      case GP_UP:     return this.resolveDirection("up");
      case GP_DOWN:   return this.resolveDirection("down");
      case GP_LEFT:   return this.resolveDirection("left");
      case GP_RIGHT:  return this.resolveDirection("right");
      default:        return null;
    }
  }
}
