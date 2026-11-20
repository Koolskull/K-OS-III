/**
 * Pictures on the site dither to the page palette.
 * A click opens the same file full screen in its own colors.
 * Palette is the four terminal inks: --bg, --paper, --dim, --hi.
 */

const BAYER = [
  [0, 8, 2, 10],
  [12, 4, 14, 6],
  [3, 11, 1, 9],
  [15, 7, 13, 5],
];

function clamp(value) {
  return Math.max(0, Math.min(255, value));
}

function palette() {
  const style = getComputedStyle(document.body);
  const colors = [];
  for (const name of ["--bg", "--paper", "--dim", "--hi"]) {
    const hex = style.getPropertyValue(name).trim().toLowerCase();
    if (!/^#[0-9a-f]{6}$/.test(hex)) continue;
    if (colors.some((color) => color.hex === hex)) continue;
    colors.push({
      hex,
      r: Number.parseInt(hex.slice(1, 3), 16),
      g: Number.parseInt(hex.slice(3, 5), 16),
      b: Number.parseInt(hex.slice(5, 7), 16),
    });
  }
  return colors;
}

function nearest(r, g, b, colors) {
  let best = colors[0];
  let bestDistance = Infinity;
  for (const color of colors) {
    const distance = (r - color.r) ** 2 + (g - color.g) ** 2 + (b - color.b) ** 2;
    if (distance < bestDistance) {
      bestDistance = distance;
      best = color;
    }
  }
  return best;
}

function paint(img, canvas, colors) {
  const width = Number(img.dataset.w || 160);
  const height = Math.max(1, Math.round((width * img.naturalHeight) / img.naturalWidth));
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext("2d", { willReadFrequently: true });
  context.imageSmoothingEnabled = false;
  context.drawImage(img, 0, 0, width, height);
  const frame = context.getImageData(0, 0, width, height);
  const data = frame.data;
  const spread = 36;
  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const index = (y * width + x) * 4;
      const bias = ((BAYER[y & 3][x & 3] - 7.5) / 7.5) * spread;
      const color = nearest(
        clamp(data[index] + bias),
        clamp(data[index + 1] + bias),
        clamp(data[index + 2] + bias),
        colors,
      );
      data[index] = color.r;
      data[index + 1] = color.g;
      data[index + 2] = color.b;
      data[index + 3] = 255;
    }
  }
  context.putImageData(frame, 0, 0);
}

export function redither() {
  const colors = palette();
  if (!colors.length) return;
  for (const img of document.querySelectorAll("img[data-dither]")) {
    const canvas = img.parentElement?.querySelector("canvas");
    if (!canvas || !img.complete || !img.naturalWidth) continue;
    paint(img, canvas, colors);
  }
}

export function bindDither() {
  for (const img of document.querySelectorAll("img[data-dither]")) {
    if (img.dataset.bound === "1") continue;
    img.dataset.bound = "1";
    img.addEventListener("load", () => redither());
  }
  redither();
}

export function openFull(src, caption) {
  const zoom = document.querySelector(".zoom");
  if (!zoom) return;
  const img = zoom.querySelector("img");
  const line = zoom.querySelector(".zoom-cap");
  img.src = src;
  img.alt = caption || "";
  if (line) line.textContent = caption || "";
  zoom.hidden = false;
  document.body.dataset.zoom = "open";
}

export function closeFull() {
  const zoom = document.querySelector(".zoom");
  if (!zoom || zoom.hidden) return;
  zoom.hidden = true;
  delete document.body.dataset.zoom;
}
