const COLS = 12;
const CELL = 64;
const COUNT = 84;
const W = 960;
const H = 540;

let sheet: HTMLImageElement | null = null;

export function loadSymbols() {
  if (sheet) return;
  const image = new Image();
  image.onload = () => {
    sheet = image;
  };
  image.src = "/symbols/ding.png";
}

export function paintSymbols(
  ctx: CanvasRenderingContext2D,
  clock: number,
  level: number,
) {
  if (!sheet) return;
  const cycle = 230;
  const span = 150;
  const flight = Math.floor(clock / cycle);
  const t = clock % cycle;
  if (t >= span) return;
  const u = t / span;
  const marks = 1 + (flight % 2);
  const dir = flight % 2 === 0 ? 1 : -1;
  ctx.save();
  ctx.imageSmoothingEnabled = false;
  for (let i = 0; i < marks; i++) {
    const lag = i * 0.22;
    if (u < lag) continue;
    const local = Math.min(1, (u - lag) / (1 - lag));
    const z = Math.max(0.04, (1 - local) * (1 - local));
    const whipT = Math.min(1, Math.max(0, (local - 0.56) / 0.44));
    const whip = whipT * whipT;
    const heading = ((flight * 1.7 + i * 2.3) % 6.28);
    const swirl = heading + (0.45 * local + whip) * dir * 2.8;
    const radius = whip * 1400;
    const cx = W * 0.5 + Math.cos(swirl) * radius;
    const cy = H * 0.5 + Math.sin(swirl) * radius * 0.62;
    const size = 18 / z;
    const glyph = (flight * 5 + i * 11) % COUNT;
    const pitch = Math.cos(0.18 + (1 - z) * 0.55);
    const sx = (glyph % COLS) * CELL;
    const sy = Math.floor(glyph / COLS) * CELL;
    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(swirl * 0.85 + dir * local * 2);
    ctx.scale(size / CELL, (size / CELL) * pitch);
    const kick = 6 + level * 22;
    ctx.globalAlpha = 0.55;
    ctx.drawImage(sheet, sx, sy, CELL, CELL, -CELL / 2, -CELL / 2 - kick, CELL, CELL);
    ctx.globalAlpha = 1;
    ctx.drawImage(sheet, sx, sy, CELL, CELL, -CELL / 2, -CELL / 2, CELL, CELL);
    ctx.restore();
  }
  ctx.restore();
}
