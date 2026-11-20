#!/usr/bin/env node
/**
 * Validate src/data/stardrain-catalog.xml, stamp empty LOD slots,
 * and write src/data/stardrain-catalog.ts, public/stardrain/catalog.xml,
 * and public/stardrain/index.html.
 *
 * Usage: node scripts/build-stardrain-catalog.mjs
 */

import { existsSync, readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { loreEntries, writeStardrainManual } from "./stardrain-manual.mjs";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const attribution = JSON.parse(readFileSync(join(root, "src/data/attribution.json"), "utf8"));
const sourcePath = join(root, "src/data/stardrain-catalog.xml");
const lorePath = join(root, "src/data/stardrain-lore.ts");
const tsPath = join(root, "src/data/stardrain-catalog.ts");
const publicPath = join(root, "public/stardrain/catalog.xml");

const IMAGE_PX = [8, 16, 32, 64, 128, 512, 1920, 3840];
const MODEL_LODS = [0, 1, 2, 3, 4, 5, 6, 7];
const FUNCTIONS = new Set([
  "xy-pad",
  "oscillator",
  "cable",
  "drum-voice",
  "sampler",
  "sequencer",
  "mixer",
  "audio-driver",
  "filter",
  "tape",
  "cd",
  "video-mixer",
  "synth-voice",
  "effect-chorus",
  "effect-flanger",
  "effect-delay",
  "monorave",
  "ym2612",
  "drum-pack",
  "limiter",
]);
const ZONES = new Set(["stardrain-island", "mediocricity"]);
const CURRENCIES = new Set(["teefz", "smile"]);

const errors = [];
function fail(message) {
  errors.push(message);
}

function decode(value) {
  return value
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&amp;/g, "&");
}

function encode(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function parseAttrs(source) {
  const attrs = {};
  const re = /([A-Za-z_][\w:-]*)="([^"]*)"/g;
  let match;
  while ((match = re.exec(source))) attrs[match[1]] = decode(match[2]);
  return attrs;
}

function parseChildren(xml, start) {
  const nodes = [];
  let i = start;
  while (i < xml.length) {
    while (i < xml.length && /\s/.test(xml[i])) i += 1;
    if (i >= xml.length || xml.startsWith("</", i)) break;
    if (xml.startsWith("<!--", i)) {
      const end = xml.indexOf("-->", i);
      if (end < 0) {
        fail("Unclosed XML comment");
        break;
      }
      i = end + 3;
      continue;
    }
    if (xml.startsWith("<?", i)) {
      const end = xml.indexOf("?>", i);
      if (end < 0) {
        fail("Unclosed XML declaration");
        break;
      }
      i = end + 2;
      continue;
    }
    if (xml[i] !== "<") {
      const end = xml.indexOf("<", i);
      const text = decode(xml.slice(i, end < 0 ? xml.length : end).trim());
      if (text) nodes.push({ type: "text", text });
      i = end < 0 ? xml.length : end;
      continue;
    }
    const gt = xml.indexOf(">", i);
    if (gt < 0) {
      fail("Unclosed tag");
      break;
    }
    const open = xml.slice(i + 1, gt).trim();
    const selfClosing = open.endsWith("/");
    const body = selfClosing ? open.slice(0, -1).trim() : open;
    const name = body.split(/\s/)[0];
    const attrs = parseAttrs(body);
    if (selfClosing) {
      nodes.push({ type: "el", name, attrs, children: [] });
      i = gt + 1;
      continue;
    }
    const inner = parseChildren(xml, gt + 1);
    nodes.push({ type: "el", name, attrs, children: inner.nodes });
    i = inner.i;
    const close = `</${name}>`;
    if (!xml.startsWith(close, i)) {
      fail(`Expected ${close}`);
      break;
    }
    i += close.length;
  }
  return { nodes, i };
}

function elements(node, name) {
  return node.children.filter((child) => child.type === "el" && child.name === name);
}

function textOf(node) {
  return node.children
    .filter((child) => child.type === "text")
    .map((child) => child.text)
    .join(" ")
    .trim();
}

function childText(node, name) {
  const found = elements(node, name);
  if (found.length !== 1) return "";
  return textOf(found[0]);
}

function requireAttr(node, key, label) {
  const value = node.attrs[key];
  if (value === undefined || value === "") fail(`${label} is missing ${key}`);
  return value ?? "";
}

function cents(display) {
  if (!/^\d+(\.\d{1,2})?$/.test(display)) {
    fail(`Bad display amount "${display}"`);
    return NaN;
  }
  const [whole, frac = ""] = display.split(".");
  return Number(whole) * 100 + Number((frac + "00").slice(0, 2));
}

function imageMap(node, label) {
  const map = new Map();
  if (!node) return map;
  for (const image of elements(node, "image")) {
    const px = Number(image.attrs.px);
    if (!IMAGE_PX.includes(px)) fail(`${label} image ${image.attrs.px} is not a slot`);
    const status = image.attrs.status || "filled";
    if (status !== "filled" && status !== "empty") fail(`${label} image status ${status} is unknown`);
    const path = image.attrs.path || "";
    if (status === "filled" && !path) fail(`${label} filled image ${px} needs a path`);
    map.set(px, { px, status, path });
  }
  return map;
}

function slotsFor(code, animationSet, overrides) {
  return {
    images: IMAGE_PX.map((px) => overrides.get(px) ?? ({
      px,
      status: "empty",
      path: `stardrain/art/${code}/img/${px}.png`,
    })),
    models: MODEL_LODS.map((lod) => ({
      lod,
      status: "empty",
      animationSet,
      glb: `stardrain/art/${code}/model/lod${lod}.glb`,
      usdz: `stardrain/art/${code}/model/lod${lod}.usdz`,
    })),
  };
}

function checkLodSpec(catalog) {
  const specs = elements(catalog, "lodSpec");
  if (specs.length !== 1) {
    fail("Catalog needs one lodSpec");
    return;
  }
  const images = elements(specs[0], "image").map((node) => Number(node.attrs.px));
  const models = elements(specs[0], "model").map((node) => Number(node.attrs.lod));
  if (images.join(",") !== IMAGE_PX.join(",")) {
    fail(`Image slots must be ${IMAGE_PX.join(", ")}`);
  }
  if (models.join(",") !== MODEL_LODS.join(",")) {
    fail(`Model slots must be lod ${MODEL_LODS.join(", ")}`);
  }
}

function checkId(raw, label) {
  if (!/^\d+$/.test(raw)) {
    fail(`${label} id must be an integer`);
    return -1;
  }
  const id = Number(raw);
  if (id < 0 || id > 255) fail(`${label} id ${id} is outside 0-255`);
  return id;
}

const xml = readFileSync(sourcePath, "utf8");
const parsed = parseChildren(xml, 0);
const catalogs = parsed.nodes.filter((node) => node.type === "el" && node.name === "stardrainCatalog");
if (catalogs.length !== 1) fail("Expected one stardrainCatalog root");
const catalog = catalogs[0];
if (catalog) checkLodSpec(catalog);

const seenCodes = new Set();
const groups = [];
const tokens = [];
const accounts = [];
const collections = [];
const earnings = [];
const publishers = catalog ? elements(catalog, "publisher") : [];
let publisher = { name: "", locality: "", region: "", line: "" };
if (publishers.length !== 1) fail("Expected one publisher");
else {
  const publisherNode = publishers[0];
  publisher = {
    name: requireAttr(publisherNode, "name", "publisher"),
    locality: requireAttr(publisherNode, "locality", "publisher"),
    region: requireAttr(publisherNode, "region", "publisher"),
    line: textOf(publisherNode),
  };
  if (
    publisher.name !== attribution.name ||
    publisher.locality !== attribution.locality ||
    publisher.region !== attribution.region ||
    publisher.line !== attribution.line
  ) {
    fail("publisher does not match src/data/attribution.json");
  }
}

if (catalog) {
  for (const account of elements(catalog, "account")) {
    const id = requireAttr(account, "id", "account");
    accounts.push({
      id,
      hosts: requireAttr(account, "hosts", id).split(/\s+/),
      wiki: requireAttr(account, "wiki", id),
    });
  }
  for (const collection of elements(catalog, "collection")) {
    const id = requireAttr(collection, "id", "collection");
    collections.push({
      id,
      standard: requireAttr(collection, "standard", id),
      host: requireAttr(collection, "host", id),
      kinds: collection.attrs.kinds ? collection.attrs.kinds.split(",") : [],
      wiki: requireAttr(collection, "wiki", id),
    });
  }
  for (const earning of elements(catalog, "earning")) {
    const id = requireAttr(earning, "id", "earning");
    const summary = textOf(earning);
    if (!summary) fail(`${id} earning is missing its text`);
    earnings.push({
      id,
      credit: requireAttr(earning, "credit", id),
      status: requireAttr(earning, "status", id),
      kinds: earning.attrs.kinds ? earning.attrs.kinds.split(",") : [],
      wiki: requireAttr(earning, "wiki", id),
      summary,
    });
    if (earnings.at(-1).status !== "oversight") fail(`${id} earning status must be oversight`);
  }

  for (const token of elements(catalog, "token")) {
    const id = requireAttr(token, "id", "token");
    const standard = requireAttr(token, "standard", id);
    if (standard !== "erc-721") fail(`${id} standard must be erc-721`);
    const wiki = requireAttr(token, "wiki", id);
    tokens.push({
      id,
      standard: "erc-721",
      account: token.attrs.account ?? null,
      craft: token.attrs.craft ?? null,
      craftStatus: token.attrs.craftStatus ?? null,
      wiki,
    });
  }

  for (const group of elements(catalog, "group")) {
    const groupId = requireAttr(group, "id", "group");
    const name = requireAttr(group, "name", groupId);
    const kind = requireAttr(group, "kind", groupId);
    const exactRaw = requireAttr(group, "exactInventory", groupId);
    if (exactRaw !== "true" && exactRaw !== "false") {
      fail(`${groupId} exactInventory must be true or false`);
    }
    const exactInventory = exactRaw === "true";
    const atomicName = requireAttr(group, "atomicName", groupId);
    const zone = group.attrs.zone ?? "";
    const displayScale = group.attrs.displayScale ? Number(group.attrs.displayScale) : null;
    const idSpace = Number(group.attrs.idSpace ?? "256");
    if (idSpace !== 256) fail(`${groupId} idSpace must be 256`);

    const mark = elements(group, "mark")[0] ?? null;
    const markImages = imageMap(mark, groupId);
    let sprites = null;
    const spritesNode = elements(group, "sprites")[0];
    if (spritesNode) {
      const cols = Number(requireAttr(spritesNode, "cols", groupId));
      const spriteRows = Number(requireAttr(spritesNode, "rows", groupId));
      const cell = Number(requireAttr(spritesNode, "cell", groupId));
      const dir = requireAttr(spritesNode, "dir", groupId);
      const sheet = requireAttr(spritesNode, "sheet", groupId);
      if (cols !== 8 || spriteRows !== 8 || cell !== 64) fail(`${groupId} sprite sheet must be 8 by 8 cells of 64`);
      if (!existsSync(join(root, "public", sheet))) fail(`missing ${sheet}`);
      const cells = [];
      for (let index = 0; index < cols * spriteRows; index += 1) {
        const name = String(index).padStart(2, "0");
        const sizes = {};
        for (const px of [64, 32, 16, 8]) {
          const path = `${dir}/${name}/${px}.png`;
          if (!existsSync(join(root, "public", path))) fail(`missing ${path}`);
          sizes[px] = path;
        }
        cells.push({ index, col: index % cols, row: Math.floor(index / cols), path: sizes[64], sizes });
      }
      sprites = { cols, rows: spriteRows, cell, sheet, cells };
    }

    const rows = [];
    const seenIds = new Set();
    const rowNodes = [...elements(group, "denomination"), ...elements(group, "item")];
    if (rowNodes.length > 256) fail(`${groupId} has more than 256 rows`);

    for (const row of rowNodes) {
      const isGear = row.name === "item";
      const code = requireAttr(row, "code", groupId);
      if (seenCodes.has(code)) fail(`Duplicate code ${code}`);
      seenCodes.add(code);
      const tokenId = checkId(requireAttr(row, "id", code), code);
      if (seenIds.has(tokenId)) fail(`${groupId} reuses id ${tokenId}`);
      seenIds.add(tokenId);
      const rowName = requireAttr(row, "name", code);
      const summary = childText(row, "summary");
      if (!summary) fail(`${code} is missing a summary`);
      const wiki = requireAttr(row, "wiki", code);
      const value = isGear ? null : Number(requireAttr(row, "value", code));
      if (!isGear && !Number.isInteger(value)) fail(`${code} value must be an integer`);

      let display = null;
      if (row.attrs.display !== undefined) {
        display = row.attrs.display;
        if (displayScale !== 100) fail(`${code} has a display amount without displayScale 100`);
        if (cents(display) !== value) fail(`${code} value ${value} is not ${display} times 100`);
      } else if (displayScale === 100) {
        fail(`${code} is missing display`);
      }

      let functionId = null;
      let currency = null;
      let priceStatus = null;
      let craftRole = null;
      let craftStatus = null;
      let grows = null;
      let rowZone = zone;
      let animationSet = code.toLowerCase();
      const glyph = row.attrs.glyph ?? null;
      const images = new Map(markImages);
      for (const [px, image] of imageMap(row, code)) images.set(px, image);

      if (isGear) {
        if (kind !== "sku") fail(`${code} is an item outside a sku group`);
        if (!exactInventory) fail(`${groupId} gear must be exact inventory`);
        functionId = requireAttr(row, "function", code);
        if (!FUNCTIONS.has(functionId)) fail(`${code} function ${functionId} is not in the allowlist`);
        rowZone = requireAttr(row, "zone", code);
        if (!ZONES.has(rowZone)) fail(`${code} zone ${rowZone} is unknown`);
        currency = requireAttr(row, "currency", code);
        if (!CURRENCIES.has(currency)) fail(`${code} currency ${currency} is unknown`);
        priceStatus = requireAttr(row, "priceStatus", code);
        if (priceStatus !== "unset") fail(`${code} priceStatus must stay unset`);
        if (row.attrs.price !== undefined) fail(`${code} must not set a price yet`);
        craftRole = requireAttr(row, "craftRole", code);
        if (craftRole !== "ingredient" && craftRole !== "fixture") {
          fail(`${code} craftRole must be ingredient or fixture`);
        }
        craftStatus = requireAttr(row, "craftStatus", code);
        if (craftStatus !== "oversight") fail(`${code} craftStatus must be oversight`);
        grows = row.attrs.grows ?? "";
        animationSet = requireAttr(row, "animationSet", code);
      } else if (kind === "sku") {
        fail(`${code} denomination does not belong on a sku group`);
      }

      const faceValue = value;
      rows.push({
        kind: isGear ? "sku" : "denomination",
        groupId,
        exactInventory,
        tokenId,
        code,
        name: rowName,
        summary,
        wiki,
        value: faceValue,
        display,
        functionId,
        zone: rowZone,
        currency,
        priceStatus,
        craftRole,
        craftStatus,
        grows,
        animationSet,
        glyph,
        ...slotsFor(code, animationSet, images),
      });
    }

    groups.push({
      id: groupId,
      name,
      kind,
      exactInventory,
      atomicName,
      zone,
      displayScale,
      sprites,
      rows,
    });
  }
}

function groupById(id) {
  return groups.find((group) => group.id === id);
}

function rowByCode(group, code) {
  return group?.rows.find((row) => row.code === code);
}

const teefz = groupById("teefz");
if (!teefz) fail("Missing teefz group");
else if (teefz.exactInventory) fail("teefz must be change mode");
else {
  const tee = rowByCode(teefz, "TEEF");
  const jaw = rowByCode(teefz, "JAW");
  const mouf = rowByCode(teefz, "MOUF");
  const skull = rowByCode(teefz, "SKULL");
  const tonne = rowByCode(teefz, "SKELETONNE");
  const faces = [tee, jaw, mouf, skull, tonne];
  if (faces.some((row) => !row)) fail("TEEFZ is missing a face");
  else if (tee.value !== 1 || jaw.value !== 16 || mouf.value !== 32 || skull.value !== 128 || tonne.value !== 1024) {
    fail("TEEFZ faces must be 1, 16, 32, 128, 1024");
  } else if (jaw.value !== 16 * tee.value || mouf.value !== 2 * jaw.value || skull.value !== 4 * mouf.value || tonne.value !== 8 * skull.value) {
    fail("TEEFZ composition broke");
  } else if (teefz.rows.length !== 5) fail("TEEFZ must keep ids 5-255 reserved");
  else if (!teefz.sprites) fail("TEEFZ needs the 64-drawing sheet");
  else {
    const logo = tee.images.find((image) => image.px === 64);
    if (!logo || logo.status !== "filled" || logo.path !== "stardrain/art/teefz/img/64.png") {
      fail("TEEF picture must be the ghost logo at stardrain/art/teefz/img/64.png");
    }
  }
}

for (const id of ["smile-card", "smile-note"]) {
  const group = groupById(id);
  if (!group) {
    fail(`Missing ${id}`);
    continue;
  }
  if (id === "smile-card" && group.exactInventory) fail("smile-card must be change mode");
  if (id === "smile-note" && !group.exactInventory) fail("smile-note must be exact inventory");
  if (group.rows.length !== 11) fail(`${id} must have the eleven SMILE faces`);
}

const card = groupById("smile-card");
const notes = groupById("smile-note");
if (card && notes) {
  const noteByDisplay = new Map(notes.rows.map((row) => [row.display, row.value]));
  for (const row of card.rows) {
    if (noteByDisplay.get(row.display) !== row.value) {
      fail(`SMILE note face ${row.display} does not match the card`);
    }
  }
}

const slime = groupById("slime");
if (!slime) fail("Missing slime group");
else if (slime.exactInventory) fail("slime must be change mode");
else if (slime.rows.map((row) => row.value).join(",") !== "1,2,3,4,5,6,7,8") {
  fail("slime faces must be 1, 2, 3, 4, 5, 6, 7, 8");
} else if (rowByCode(slime, "SLIME-S10").value !== 8 * rowByCode(slime, "SLIME-S1").value) {
  fail("SLIME-S10 must equal eight SLIME-S1");
}

const gear = groupById("stardrain-gear");
if (!gear) fail("Missing stardrain-gear");
else if (!gear.exactInventory) fail("stardrain-gear must be exact inventory");

const lore = readFileSync(lorePath, "utf8");
const loreIds = new Set([...lore.matchAll(/id:\s*"([^"]+)"/g)].map((match) => match[1]));
const parsedLore = loreEntries(lore);
if (parsedLore.length !== loreIds.size) {
  fail(`Lore parser found ${parsedLore.length} essays, file has ${loreIds.size} ids`);
}
for (const group of groups) {
  for (const row of group.rows) {
    if (!loreIds.has(row.wiki)) fail(`${row.code} wiki "${row.wiki}" is not a lore id`);
  }
}
for (const token of tokens) {
  if (!loreIds.has(token.wiki)) fail(`${token.id} wiki "${token.wiki}" is not a lore id`);
}
for (const account of accounts) {
  if (!loreIds.has(account.wiki)) fail(`${account.id} wiki "${account.wiki}" is not a lore id`);
}
for (const collection of collections) {
  if (!loreIds.has(collection.wiki)) fail(`${collection.id} wiki "${collection.wiki}" is not a lore id`);
}
for (const earning of earnings) {
  if (!loreIds.has(earning.wiki)) fail(`${earning.id} wiki "${earning.wiki}" is not a lore id`);
}
for (const group of groups) {
  for (const row of group.rows) {
    for (const image of row.images) {
      if (image.status === "filled" && !existsSync(join(root, "public", image.path))) {
        fail(`missing filled image ${image.path}`);
      }
    }
  }
}
for (const match of lore.matchAll(/\[\[([A-Z0-9-]+)\]\]/g)) {
  if (!seenCodes.has(match[1])) fail(`Lore links [[${match[1]}]] and that code is not in the catalog`);
}

if (errors.length) {
  for (const message of errors) console.error(`stardrain-catalog: ${message}`);
  process.exit(1);
}

const banner = `/* Generated by scripts/build-stardrain-catalog.mjs from src/data/stardrain-catalog.xml. Do not edit. */\n`;

const ts = `${banner}
export const IMAGE_SLOTS = ${JSON.stringify(IMAGE_PX)} as const;

export const MODEL_SLOTS = ${JSON.stringify(MODEL_LODS)} as const;

export interface LodImage {
  px: number;
  status: "empty" | "filled";
  path: string;
}

export interface LodModel {
  lod: number;
  status: "empty";
  animationSet: string;
  glb: string;
  usdz: string;
}

export interface CatalogRow {
  kind: "denomination" | "sku";
  groupId: string;
  exactInventory: boolean;
  tokenId: number;
  code: string;
  name: string;
  summary: string;
  wiki: string;
  value: number | null;
  display: string | null;
  functionId: string | null;
  zone: string;
  currency: string | null;
  priceStatus: "unset" | null;
  craftRole: "ingredient" | "fixture" | null;
  craftStatus: "oversight" | null;
  grows: string | null;
  animationSet: string;
  glyph: string | null;
  images: LodImage[];
  models: LodModel[];
}

export interface SpriteCell {
  index: number;
  col: number;
  row: number;
  path: string;
  sizes: Record<string, string>;
}

export interface CatalogSprites {
  cols: number;
  rows: number;
  cell: number;
  sheet: string;
  cells: SpriteCell[];
}

export interface CatalogGroup {
  id: string;
  name: string;
  kind: "currency" | "currency-bearer" | "sku";
  exactInventory: boolean;
  atomicName: string;
  zone: string;
  displayScale: number | null;
  sprites: CatalogSprites | null;
  rows: CatalogRow[];
}

export interface CatalogToken {
  id: string;
  standard: "erc-721";
  account: string | null;
  craft: string | null;
  craftStatus: string | null;
  wiki: string;
}

export const CATALOG_GROUPS: CatalogGroup[] = ${JSON.stringify(groups, null, 2)};

export const CATALOG_ROWS: CatalogRow[] = CATALOG_GROUPS.flatMap((group) => group.rows);

export const CATALOG_BY_CODE: Record<string, CatalogRow> = Object.fromEntries(
  CATALOG_ROWS.map((row) => [row.code, row]),
);

export const CATALOG_TOKENS: CatalogToken[] = ${JSON.stringify(tokens, null, 2)};

export interface CatalogAccount {
  id: string;
  hosts: string[];
  wiki: string;
}

export interface CatalogCollection {
  id: string;
  standard: string;
  host: string;
  kinds: string[];
  wiki: string;
}

export interface CatalogEarning {
  id: string;
  credit: string;
  status: string;
  kinds: string[];
  wiki: string;
  summary: string;
}

export const CATALOG_ACCOUNTS: CatalogAccount[] = ${JSON.stringify(accounts, null, 2)};

export const CATALOG_COLLECTIONS: CatalogCollection[] = ${JSON.stringify(collections, null, 2)};

export const CATALOG_EARNINGS: CatalogEarning[] = ${JSON.stringify(earnings, null, 2)};

export const CATALOG_PUBLISHER = ${JSON.stringify(publisher, null, 2)} as const;
`;

writeFileSync(tsPath, ts);

function attrList(attrs) {
  return Object.entries(attrs)
    .map(([key, value]) => `${key}="${encode(value)}"`)
    .join(" ");
}

function lodXml(row, indent) {
  const images = row.images
    .map((image) => `${indent}  <image px="${image.px}" status="${image.status}" path="${encode(image.path)}"/>`)
    .join("\n");
  const models = row.models
    .map(
      (model) =>
        `${indent}  <model lod="${model.lod}" status="empty" animationSet="${encode(model.animationSet)}" glb="${encode(model.glb)}" usdz="${encode(model.usdz)}"/>`,
    )
    .join("\n");
  return `${indent}<lod>\n${images}\n${models}\n${indent}</lod>`;
}

function rowXml(row) {
  const tag = row.kind === "sku" ? "item" : "denomination";
  const attrs = {
    id: String(row.tokenId),
    code: row.code,
    name: row.name,
    wiki: row.wiki,
  };
  if (row.value !== null) attrs.value = String(row.value);
  if (row.display) attrs.display = row.display;
  if (row.functionId) attrs.function = row.functionId;
  if (row.kind === "sku") {
    attrs.zone = row.zone;
    attrs.currency = row.currency ?? "";
    attrs.priceStatus = row.priceStatus ?? "";
    attrs.craftRole = row.craftRole ?? "";
    attrs.craftStatus = row.craftStatus ?? "";
    attrs.grows = row.grows ?? "";
    attrs.animationSet = row.animationSet;
  }
  return `    <${tag} ${attrList(attrs)}>
      <summary>${encode(row.summary)}</summary>
${lodXml(row, "      ")}
    </${tag}>`;
}

const publicXml = `<?xml version="1.0" encoding="UTF-8"?>
<!-- Generated by scripts/build-stardrain-catalog.mjs. Do not edit. -->
<stardrainCatalog version="0.2" standard="MD-420">
  <publisher name="${encode(publisher.name)}" locality="${encode(publisher.locality)}" region="${encode(publisher.region)}">${encode(publisher.line)}</publisher>
${groups
  .map((group) => {
    const attrs = {
      id: group.id,
      name: group.name,
      kind: group.kind,
      exactInventory: String(group.exactInventory),
      atomicName: group.atomicName,
      zone: group.zone,
    };
    if (group.displayScale) attrs.displayScale = String(group.displayScale);
    return `  <group ${attrList(attrs)}>
${group.rows.map(rowXml).join("\n")}
  </group>`;
  })
  .join("\n")}
</stardrainCatalog>
`;

mkdirSync(dirname(publicPath), { recursive: true });
writeFileSync(publicPath, publicXml);
const manualCount = writeStardrainManual({ root, groups, tokens, accounts, collections, earnings, lore, publisher });
console.log(`stardrain-catalog: ${groups.reduce((sum, group) => sum + group.rows.length, 0)} rows, ${tokens.length} erc-721 stubs, ${manualCount} essays`);
