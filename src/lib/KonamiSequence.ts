/*
 *            ☦
 *     ╔══════════════╗
 *     ║ THE HIDDEN   ║
 *     ║ GATES        ║
 *     ╚══════════════╝
 *
 *   Hold Shift+Q, then enter an arrow sequence
 *   to unlock hidden modes.
 *
 *   Bible:  Shift+Q → UP DOWN LEFT RIGHT
 *   Games:  Shift+Q → UP UP DOWN DOWN
 */

type SequenceCallback = () => void;

const DEFAULT_SEQUENCE: string[] = ["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"];

export class KonamiSequence {
  private progress = 0;
  private shiftHeld = false;
  private qHeld = false;
  private callback: SequenceCallback;
  private sequence: string[];

  constructor(callback: SequenceCallback, sequence?: string[]) {
    this.callback = callback;
    this.sequence = sequence ?? DEFAULT_SEQUENCE;
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
  }

  private handleKeyDown(e: KeyboardEvent): void {
    if (e.key === "Shift") {
      this.shiftHeld = true;
      return;
    }
    if (e.code === "KeyQ") {
      this.qHeld = true;
      return;
    }

    // Only track sequence when both Shift and Q are held
    if (!this.shiftHeld || !this.qHeld) {
      this.progress = 0;
      return;
    }

    if (e.key === this.sequence[this.progress]) {
      e.preventDefault();
      this.progress++;
      if (this.progress === this.sequence.length) {
        this.progress = 0;
        e.stopImmediatePropagation();
        this.callback();
      }
    } else if (["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].includes(e.key)) {
      // Wrong arrow while in sequence — reset
      e.preventDefault();
      this.progress = 0;
    }
  }

  private handleKeyUp(e: KeyboardEvent): void {
    if (e.key === "Shift") {
      this.shiftHeld = false;
      this.progress = 0;
    }
    if (e.code === "KeyQ") {
      this.qHeld = false;
      this.progress = 0;
    }
  }
}
