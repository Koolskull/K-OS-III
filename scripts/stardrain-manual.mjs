/**
 * Write public/stardrain/index.html from the catalog the builder just validated.
 * The page is the field manual served at https://stardrain.app/stardrain/.
 */

import { cpSync, mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const CATEGORIES = ["cosmology", "locations", "characters", "systems", "culture", "economy", "manual"];

function esc(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

export function loreEntries(source) {
  const entries = [];
  const re = /id:\s*"([^"]+)",\s*title:\s*"((?:\\.|[^"\\])*)",\s*category:\s*"([^"]+)",\s*body:\s*"((?:\\.|[^"\\])*)"/g;
  for (const match of source.matchAll(re)) {
    entries.push({
      id: match[1],
      title: JSON.parse(`"${match[2]}"`),
      category: match[3],
      body: JSON.parse(`"${match[4]}"`),
    });
  }
  return entries;
}

function inline(text) {
  const parts = text.split(/\[\[([A-Z0-9-]+)\]\]/g);
  let html = "";
  for (let index = 0; index < parts.length; index += 1) {
    if (index % 2 === 0) html += esc(parts[index]).replaceAll("\n", "<br>\n");
    else html += `<a href="#${esc(parts[index])}">${esc(parts[index])}</a>`;
  }
  return html;
}

function prose(body) {
  return body
    .split(/\n\n/)
    .map((paragraph) => `<p>${inline(paragraph)}</p>`)
    .join("\n");
}

function pictures(row) {
  const filled = row.images.filter((image) => image.status === "filled");
  if (!filled.length) return "";
  const label = row.code === "TEEF" ? "TEEFZ logo" : "Mark";
  const images = filled
    .map(
      (image) =>
        `<img src="/${esc(image.path)}" alt="${esc(row.code)} ${image.px}" width="${Math.min(image.px, 64)}" height="${Math.min(image.px, 64)}">`,
    )
    .join("");
  return `<p class="label">${label}</p><div class="faces">${images}</div>`;
}

function sheet(group) {
  if (!group?.sprites) return "";
  const cells = group.sprites.cells
    .map(
      (cell) =>
        `<img src="/${esc(cell.sizes[32])}" alt="teef drawing ${cell.index}" width="32" height="32">`,
    )
    .join("");
  return `<p class="label">64 coin drawings</p><div class="sheet">${cells}</div>`;
}

function fact(label, value) {
  if (value === null || value === undefined || value === "") return "";
  return `<div class="fact"><span>${esc(label)}</span><span>${esc(value)}</span></div>`;
}

function rowBlock(row, group) {
  const value = row.value === null ? "" : row.display ? `${row.display} (${row.value} atomic)` : String(row.value);
  return `<article id="${esc(row.code)}">
<h3>${esc(row.name)} <code>${esc(row.code)}</code></h3>
${pictures(row)}
${row.code === "TEEF" ? sheet(group) : ""}
${prose(row.summary)}
${fact("Group", row.groupId)}
${fact("Token id", row.tokenId)}
${fact("Exact inventory", row.exactInventory ? "on" : "off")}
${fact("Zone", row.zone)}
${fact("Value", value)}
${fact("Glyph", row.glyph)}
${fact("Function", row.functionId)}
${fact("Currency", row.currency)}
${fact("Price", row.priceStatus)}
${fact("Craft", row.craftRole ? `${row.craftRole}, ${row.craftStatus}` : "")}
${fact("Grows", row.grows)}
</article>`;
}

export function writeStardrainManual({ root, groups, tokens, accounts, collections, earnings, lore, publisher }) {
  const entries = loreEntries(lore);
  const nav = CATEGORIES.map((category) => `<a href="#lore-${category}">${esc(category)}</a>`).join("");
  const essays = CATEGORIES.map((category) => {
    const section = entries
      .filter((entry) => entry.category === category)
      .map((entry) => `<article id="lore-${esc(entry.id)}"><h3>${esc(entry.title)}</h3>${prose(entry.body)}</article>`)
      .join("\n");
    if (!section) return "";
    return `<section id="lore-${category}"><h2>${esc(category)}</h2>${section}</section>`;
  }).join("\n");
  const groupsHtml = groups
    .map((group) => {
      const mode = group.exactInventory ? "exact inventory on" : "change mode on";
      const rows = group.rows.map((row) => rowBlock(row, group)).join("\n");
      return `<section id="group-${esc(group.id)}">
<h2>${esc(group.name)}</h2>
<p class="label">${esc(group.id)} · ${esc(group.kind)} · ${mode} · ${esc(group.atomicName)}${group.zone ? ` · ${esc(group.zone)}` : ""}</p>
${rows}
</section>`;
    })
    .join("\n");
  const records = [
    ...tokens.map((token) => `${token.id}: ERC-721${token.account ? `, account ${token.account}` : ""}${token.craft ? `, craft ${token.craft}` : ""}`),
    ...accounts.map((account) => `${account.id}: ${account.hosts.join(", ")}`),
    ...collections.map((collection) => `${collection.id}: ${collection.standard} on ${collection.host}`),
    ...earnings.map((earning) => `${earning.id}: ${earning.summary}`),
    ...(publisher ? [`publisher: ${publisher.line}`] : []),
  ]
    .map((line) => `<li>${esc(line)}</li>`)
    .join("\n");

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="author" content="${esc(publisher?.line ?? "")}">
<meta name="copyright" content="${esc(publisher?.name ?? "")}">
<title>Stardrain field manual</title>
<style>
  @font-face {
    font-family: "kongtext";
    src: url("fonts/kongtext-webfont.woff2") format("woff2");
    font-display: block;
  }
  :root {
    --bg: #091a1f;
    --paper: #0b221d;
    --dim: #456254;
    --ink: #90b08e;
    --hi: #729277;
    color-scheme: dark;
  }
  html { -webkit-font-smoothing: none; text-rendering: optimizeSpeed; }
  body {
    margin: 0;
    background: var(--bg);
    color: var(--ink);
    font-family: "kongtext", monospace;
    font-size: 16px;
    line-height: 1.5;
  }
  ::selection { background: var(--hi); color: var(--bg); }
  header, main { max-width: 960px; margin: 0 auto; padding: 16px 16px 48px; }
  h1, h2, h3 { color: var(--hi); font-weight: normal; font-size: 16px; letter-spacing: 0; line-height: 1.5; }
  h2 { margin-top: 32px; border-top: 2px solid var(--dim); padding-top: 16px; text-transform: uppercase; }
  a { color: var(--ink); }
  a:hover, a:focus { color: var(--hi); outline: 2px solid var(--hi); outline-offset: 2px; }
  code { color: var(--ink); }
  p { margin: 0 0 16px; }
  .label { color: var(--dim); font-size: 8px; letter-spacing: 0; text-transform: uppercase; line-height: 2; }
  nav { margin-top: 16px; }
  nav a { display: inline-block; margin: 0 16px 8px 0; color: var(--hi); text-decoration: none; }
  img { image-rendering: pixelated; image-rendering: crisp-edges; background: var(--paper); border-radius: 0; }
  .faces { display: flex; gap: 8px; align-items: end; margin-bottom: 16px; }
  .sheet { display: grid; grid-template-columns: repeat(8, 32px); gap: 4px; margin-bottom: 16px; overflow-x: auto; }
  article { border-top: 2px solid var(--paper); padding: 16px 0; }
  .fact { display: flex; gap: 16px; font-size: 8px; line-height: 2; }
  .fact span:first-child { width: 160px; color: var(--dim); flex: none; }
  ul { padding-left: 24px; }
</style>
</head>
<body data-crt="on">
<header>
  <h1>Stardrain field manual</h1>
  <p class="label">Architecture · MD-420 reading · not a published contract</p>
  <p class="label">${esc(publisher?.line ?? "")}</p>
  <p>This page is the inventory and the reference manual. The spreadsheet is <a href="catalog.xml">catalog.xml</a>. Drawings sit in <a href="art/">art/</a>. <a href="/">stardrain.app</a> opens on the hotel at night. Rooms, levels, menus, games, playlists, and the scene are the engine. <a href="/mialien/">/mialien/</a> stays the metadata tree.</p>
  <p>Prices are unset. Nothing on this page is for sale. Slime, TEEFZ, and SMILE do not convert inside a token.</p>
  <nav>${nav}<a href="desk/">wiki</a><a href="#inventory">inventory</a><a href="#records">records</a></nav>
</header>
<main>
${essays}
<section id="records">
  <h2>Records</h2>
  <ul>
${records}
  </ul>
</section>
<section id="inventory">
  <h2>Inventory</h2>
${groupsHtml}
</section>
</main>
<script type="module" src="/assets/crt.js"></script>
</body>
</html>
`;

  const manualDir = join(root, "public/stardrain");
  writeFileSync(join(manualDir, "index.html"), html);
  const fontDir = join(manualDir, "fonts");
  mkdirSync(fontDir, { recursive: true });
  cpSync(join(root, "public/fonts/kongtext-webfont.woff2"), join(fontDir, "kongtext-webfont.woff2"));
  return entries.length;
}
