#!/usr/bin/env node
/**
 * Write the stardrain.app engine pages.
 * index.html is the hotel terminal and is not generated here.
 * PixiJS shell in site/stardrain-www. Field manual stays in public/stardrain.
 */

import { cpSync, mkdirSync, writeFileSync, existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const site = join(root, "site/stardrain-www");

const pages = [
  ["rooms", "ROOMS", "rooms/index.html"],
  ["levels", "LEVELS", "levels/index.html"],
  ["menus", "MENUS", "menus/index.html"],
  ["games", "GAMES", "games/index.html"],
  ["playlists", "PLAYLISTS", "playlists/index.html"],
  ["scene", "SCENE", "scene/index.html"],
];

const html = (page, title) => `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${title}</title>
<link rel="stylesheet" href="/assets/shell.css">
</head>
<body data-page="${page}">
<canvas id="view"></canvas>
<div class="pad">
  <button type="button" data-act="up">U</button>
  <button type="button" data-act="down">D</button>
  <button type="button" data-act="left">L</button>
  <button type="button" data-act="right">R</button>
  <button type="button" data-act="b">B</button>
  <button type="button" data-act="a">A</button>
</div>
<script type="module" src="/assets/shell.js"></script>
</body>
</html>
`;

for (const [page, title, file] of pages) {
  const path = join(site, file);
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, html(page, title));
}

const fontDir = join(site, "assets/fonts");
mkdirSync(fontDir, { recursive: true });
cpSync(join(root, "public/fonts/kongtext-webfont.woff2"), join(fontDir, "kongtext-webfont.woff2"));

const glyphDir = join(site, "assets/glyphs");
mkdirSync(glyphDir, { recursive: true });
for (const name of "0123456789ABCDEF") {
  const code = `ST${name}`;
  cpSync(join(root, "public/sprites", `${code}.png`), join(glyphDir, `${code}.png`));
}

const pixi = join(site, "assets/pixi.min.mjs");
if (!existsSync(pixi)) {
  console.log("stardrain-www: pixi.min.mjs is missing. Download it before deploy.");
}

console.log(`stardrain-www: ${pages.length} pages`);
