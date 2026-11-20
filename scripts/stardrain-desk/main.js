import { BrowserProvider, JsonRpcProvider, getAddress, verifyMessage } from "ethers";
import { DESK_EDITOR, approvalMessage, loginMessage } from "./messages.js";

const DRAFT_KEY = "stardrain-desk-drafts";
const SESSION_KEY = "stardrain-desk-session";
const LOCAL_LEDGER = "stardrain-desk-ledger";
const READ_URLS = ["https://ethereum.publicnode.com", "https://cloudflare-eth.com"];

const menuL = document.querySelector("#menu-l");
const menuR = document.querySelector("#menu-r");
const screenEl = document.querySelector("#screen");
const whereEl = document.querySelector("#where");
const statusEl = document.querySelector("#status");
const gbEl = document.querySelector("#gb");

let sections = [];
let byId = new Map();
let editorAddress = "";
let approvals = {};
let resolvedEditor = "";
let editing = false;
let painted = "";
let cursor = 0;

function paragraphsOf(node) {
  return Array.isArray(node.paragraphs) ? node.paragraphs : null;
}

function indexTree(nodes, parents) {
  for (const node of nodes) {
    byId.set(node.id, { node, parents });
    if (node.children) indexTree(node.children, parents.concat(node.id));
  }
}

function lessonsOf(section) {
  const rows = [];
  for (const child of section.children || []) {
    if (child.children) {
      rows.push({ kind: "group", id: child.id, title: child.title });
      for (const lesson of child.children) {
        if (paragraphsOf(lesson)) rows.push({ kind: "lesson", node: lesson });
      }
    } else if (paragraphsOf(child)) {
      rows.push({ kind: "lesson", node: child });
    }
  }
  return rows;
}

function lessonCount(section) {
  return lessonsOf(section).filter((row) => row.kind === "lesson").length;
}

function view() {
  const hash = decodeURIComponent(location.hash.replace(/^#/, ""));
  if (hash.startsWith("track/")) {
    const id = hash.slice(6);
    if (sections.some((section) => section.id === id)) return { kind: "track", id };
  }
  if (byId.has(hash) && paragraphsOf(byId.get(hash).node)) return { kind: "article", id: hash };
  return { kind: "home" };
}

function trackOf(articleId) {
  const parents = byId.get(articleId)?.parents || [];
  return parents[0] || "";
}

function shippedText(id) {
  return byId.get(id).node.paragraphs.join("\n\n");
}

function drafts() {
  try {
    const parsed = JSON.parse(localStorage.getItem(DRAFT_KEY) || "{}");
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}

function localLedger() {
  try {
    const parsed = JSON.parse(localStorage.getItem(LOCAL_LEDGER) || "{}");
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}

function publishedText(id) {
  const note = approvals[id]?.note;
  return note ? note : shippedText(id);
}

function draftText(id) {
  const draft = drafts()[id];
  return draft !== undefined ? draft : publishedText(id);
}

function glyph(id) {
  const draft = drafts()[id];
  if (editorAddress && draft !== undefined && draft !== publishedText(id)) return ".";
  if (approvals[id]) return "+";
  return "o";
}

function setStatus(text) {
  statusEl.textContent = text;
}

function button(label, onClick, className) {
  const el = document.createElement("button");
  el.type = "button";
  el.textContent = label;
  if (className) el.className = className;
  el.addEventListener("click", onClick);
  return el;
}

function go(hash) {
  editing = false;
  document.body.dataset.editing = "off";
  if (location.hash === hash) render(true);
  else location.hash = hash;
}

async function readProvider() {
  let last;
  for (const url of READ_URLS) {
    try {
      const provider = new JsonRpcProvider(url, 1, { staticNetwork: true });
      if ((await provider.getNetwork()).chainId !== 1n) continue;
      return provider;
    } catch (error) {
      last = error;
    }
  }
  throw last ?? new Error("ENS lookup failed");
}

async function editorOnChain() {
  if (resolvedEditor) return resolvedEditor;
  const resolved = await (await readProvider()).resolveName(DESK_EDITOR);
  if (!resolved) throw new Error("koolskull.eth did not resolve");
  resolvedEditor = getAddress(resolved);
  return resolvedEditor;
}

async function acceptedApprovals(raw) {
  let editor = "";
  try {
    editor = await editorOnChain();
  } catch {
    return {};
  }
  const accepted = {};
  for (const [id, record] of Object.entries(raw || {})) {
    if (!record || typeof record.note !== "string" || record.message !== approvalMessage(id, record.note)) continue;
    try {
      if (getAddress(verifyMessage(record.message, record.signature)) === editor) accepted[id] = record;
    } catch {
      /* a bad signature stays off the page */
    }
  }
  return accepted;
}

async function refreshApprovals() {
  let remote = {};
  try {
    const response = await fetch("ledger.json", { cache: "no-store" });
    if (response.ok) remote = await response.json();
  } catch {
    remote = {};
  }
  approvals = await acceptedApprovals({ ...localLedger(), ...remote });
}

function hereIds() {
  const current = view();
  if (current.kind === "article") return [...(byId.get(current.id)?.parents || []), current.id];
  if (current.kind === "track") return [current.id];
  return [];
}

function signedCount(section) {
  return lessonsOf(section).filter((row) => row.kind === "lesson" && approvals[row.node.id]).length;
}

function addTree(host, nodes, ancestors) {
  const current = view();
  const here = hereIds();
  nodes.forEach((node) => {
    const depth = ancestors.length;
    if (node.children) {
      const name = depth === 0 ? node.title.toUpperCase() : node.title;
      const count = depth === 0 ? `  ${signedCount(node)}/${lessonCount(node)}` : "";
      const trunk = button(`${name}${count}`, () => go(`#track/${ancestors[0] || node.id}`), depth === 0 ? "trunk" : "trunk rank-3");
      if (here.includes(node.id)) trunk.classList.add(current.kind === "track" && node.id === current.id ? "is-here" : "is-open");
      host.append(trunk);
      const kids = document.createElement("div");
      kids.className = depth === 0 ? "kids" : "kids kids-quiet";
      addTree(kids, node.children, ancestors.concat(node.id));
      host.append(kids);
      return;
    }
    const leaf = button(`${glyph(node.id)}  ${node.title}`, () => go(`#${node.id}`), "leaf");
    if (current.kind === "article" && current.id === node.id) leaf.classList.add("is-here");
    host.append(leaf);
  });
}

function renderCommands() {
  const current = view();
  menuR.replaceChildren();
  const title = document.createElement("p");
  title.className = "trunk";
  title.textContent = "COMMAND";
  const kids = document.createElement("div");
  kids.className = "kids";
  if (current.kind === "article" && editorAddress && editing) {
    kids.append(
      button("APPROVE", () => {
        const value = document.querySelector("#editor")?.value ?? draftText(current.id);
        approve(current.id, value).catch((error) => setStatus(error?.message || "Approval failed."));
      }, "rank-1"),
      button("SAVE", () => {
        const field = document.querySelector("#editor");
        const next = drafts();
        next[current.id] = field ? field.value : draftText(current.id);
        localStorage.setItem(DRAFT_KEY, JSON.stringify(next));
        setStatus("Draft saved on this phone.");
      }, "rank-2"),
      button("CLOSE", () => {
        editing = false;
        document.body.dataset.editing = "off";
        render(true);
      }, "rank-3"),
    );
  } else if (current.kind === "article" && editorAddress) {
    kids.append(
      button("EDIT", () => {
        editing = true;
        document.body.dataset.editing = "on";
        painted = "";
        render(true);
        document.querySelector("#editor")?.focus();
      }, "rank-1"),
      button("BACK", () => go(`#track/${trackOf(current.id)}`), "rank-2"),
    );
  } else if (current.kind === "article" || current.kind === "track") {
    kids.append(button("BACK", () => back(), "rank-2"));
  } else {
    kids.append(button("HOME", () => go("#home"), "rank-1 is-here"));
  }
  const goTitle = document.createElement("p");
  goTitle.className = "trunk rank-3";
  goTitle.textContent = "GO";
  const goKids = document.createElement("div");
  goKids.className = "kids kids-quiet";
  const hotel = document.createElement("a");
  hotel.className = "leaf";
  hotel.href = "/";
  hotel.textContent = "HOTEL";
  const manual = document.createElement("a");
  manual.className = "leaf";
  manual.href = "/stardrain/";
  manual.textContent = "FIELD MANUAL";
  goKids.append(hotel, manual);
  const session = document.createElement("p");
  session.className = "trunk rank-3";
  session.textContent = "SESSION";
  const sessionKids = document.createElement("div");
  sessionKids.className = "kids";
  const wallet = button(editorAddress ? "KOOLSKULL.ETH" : "WALLET", () => {
    connect().catch((error) => setStatus(error?.message || "Wallet failed."));
  }, "rank-2");
  wallet.id = "wallet";
  sessionKids.append(wallet);
  menuR.append(title, kids, goTitle, goKids, session, sessionKids);
}

function renderMenu() {
  const current = view();
  if (whereEl) {
    if (current.kind === "home") whereEl.textContent = "WIKI";
    else if (current.kind === "track") whereEl.textContent = (sections.find((item) => item.id === current.id)?.title || "WIKI").toUpperCase();
    else whereEl.textContent = (byId.get(current.id)?.node.title || "WIKI").toUpperCase();
  }
  menuL.replaceChildren();
  menuL.append(button("HOME", () => go("#home"), current.kind === "home" ? "trunk is-here" : "trunk"));
  addTree(menuL, sections, []);
  renderCommands();
}

function renderScreen() {
  const current = view();
  screenEl.replaceChildren();
  gbEl.scrollTop = 0;
  if (current.kind === "home") {
    const title = document.createElement("h1");
    title.textContent = "Wiki";
    const lead = document.createElement("p");
    lead.textContent = `${sections.length} tracts. Open one, then an article. The circle marks are unsigned, a dot is a draft on this phone, and a plus is signed by koolskull.eth.`;
    screenEl.append(title, lead);
    for (const section of sections) {
      const signed = lessonsOf(section).filter((row) => row.kind === "lesson" && approvals[row.node.id]).length;
      screenEl.append(button(`${section.title}  ${signed}/${lessonCount(section)}`, () => go(`#track/${section.id}`)));
      const summary = document.createElement("p");
      summary.textContent = section.summary || "";
      screenEl.append(summary);
    }
    return;
  }
  if (current.kind === "track") {
    const section = sections.find((item) => item.id === current.id);
    screenEl.append(button("HOME", () => go("#home")));
    const title = document.createElement("h1");
    title.textContent = section.title;
    const summary = document.createElement("p");
    summary.textContent = section.summary || "";
    screenEl.append(title, summary);
    let number = 0;
    for (const row of lessonsOf(section)) {
      if (row.kind === "group") {
        const label = document.createElement("p");
        label.className = "label";
        label.textContent = row.title;
        screenEl.append(label);
        continue;
      }
      number += 1;
      screenEl.append(button(`${number}. ${glyph(row.node.id)} ${row.node.title}`, () => go(`#${row.node.id}`)));
    }
    return;
  }
  const { node } = byId.get(current.id);
  screenEl.append(button("BACK", () => go(`#track/${trackOf(current.id)}`)));
  const title = document.createElement("h1");
  title.textContent = node.title;
  screenEl.append(title);
  const mark = document.createElement("p");
  mark.className = "label";
  const draft = drafts()[current.id];
  const dirty = editorAddress && draft !== undefined && draft !== publishedText(current.id);
  mark.textContent = dirty ? "Draft on this phone" : approvals[current.id] ? `Approved by ${DESK_EDITOR}` : `Unsigned. ${DESK_EDITOR} has not approved this article.`;
  screenEl.append(mark);
  if (editorAddress && editing) {
    const field = document.createElement("textarea");
    field.id = "editor";
    field.maxLength = 4000;
    field.value = draftText(current.id);
    field.addEventListener("input", () => {
      const next = drafts();
      next[current.id] = field.value;
      localStorage.setItem(DRAFT_KEY, JSON.stringify(next));
      mark.textContent = "Draft on this phone";
    });
    const row = document.createElement("p");
    row.append(
      button("CLOSE", () => {
        editing = false;
        document.body.dataset.editing = "off";
        render(true);
      }),
      button("SAVE", () => {
        const next = drafts();
        next[current.id] = field.value;
        localStorage.setItem(DRAFT_KEY, JSON.stringify(next));
        setStatus("Draft saved on this phone.");
      }),
      button("APPROVE", () => {
        approve(current.id, field.value).catch((error) => setStatus(error?.message || "Approval failed."));
      }),
    );
    screenEl.append(field, row);
    return;
  }
  const text = editorAddress ? draftText(current.id) : publishedText(current.id);
  for (const paragraph of text.split("\n\n")) {
    const p = document.createElement("p");
    p.textContent = paragraph;
    screenEl.append(p);
  }
  if (editorAddress) {
    screenEl.append(button("EDIT", () => {
      editing = true;
      document.body.dataset.editing = "on";
      painted = "";
      render(true);
      document.querySelector("#editor")?.focus();
    }));
  }
}

function render(force) {
  const current = view();
  const key = `${current.kind}:${current.id || ""}:${editing}:${editorAddress}:${Object.keys(approvals).length}`;
  renderMenu();
  if (force || key !== painted) {
    painted = key;
    cursor = 0;
    renderScreen();
  }
  const controls = [...screenEl.querySelectorAll("button")];
  controls.forEach((el, index) => el.classList.toggle("is-on", index === cursor && controls.length > 0));
}

function move(step) {
  const controls = [...screenEl.querySelectorAll("button")];
  if (!controls.length || document.activeElement?.id === "editor") return;
  cursor = (cursor + step + controls.length) % controls.length;
  controls.forEach((el, index) => el.classList.toggle("is-on", index === cursor));
  controls[cursor].scrollIntoView({ block: "nearest" });
}

function activate() {
  if (document.activeElement?.id === "editor") return;
  const controls = [...screenEl.querySelectorAll("button")];
  controls[cursor]?.click();
}

function back() {
  if (document.activeElement?.id === "editor") {
    document.activeElement.blur();
    return;
  }
  const current = view();
  if (editing) {
    editing = false;
    document.body.dataset.editing = "off";
    render(true);
    return;
  }
  if (current.kind === "article") go(`#track/${trackOf(current.id)}`);
  else if (current.kind === "track") go("#home");
}

async function connect() {
  const ethereum = window.ethereum;
  if (!ethereum) {
    setStatus("Open this page in the wallet browser.");
    return;
  }
  setStatus("Waiting for the wallet.");
  await ethereum.request({ method: "wallet_switchEthereumChain", params: [{ chainId: "0x1" }] });
  const provider = new BrowserProvider(ethereum);
  const signer = await provider.getSigner();
  const address = getAddress(await signer.getAddress());
  const resolved = getAddress(await provider.resolveName(DESK_EDITOR));
  if (address !== resolved) {
    editorAddress = "";
    sessionStorage.removeItem(SESSION_KEY);
    setStatus("This wallet is not koolskull.eth.");
    render(true);
    return;
  }
  const message = loginMessage(address);
  const signature = await signer.signMessage(message);
  if (getAddress(verifyMessage(message, signature)) !== address) {
    setStatus("The login signature did not match.");
    return;
  }
  editorAddress = address;
  resolvedEditor = resolved;
  sessionStorage.setItem(SESSION_KEY, JSON.stringify({ address, message, signature }));
  setStatus("Signed in. EDIT rewrites the article on this phone.");
  render(true);
}

async function restore() {
  const saved = JSON.parse(sessionStorage.getItem(SESSION_KEY) || "null");
  if (!saved?.message || !saved.signature) return;
  try {
    const editor = await editorOnChain();
    if (getAddress(verifyMessage(saved.message, saved.signature)) === editor && saved.message === loginMessage(editor)) {
      editorAddress = editor;
    }
  } catch {
    /* ENS down keeps the editor closed */
  }
}

async function approve(id, text) {
  if (!window.ethereum) return;
  const note = text.trim();
  const message = approvalMessage(id, note);
  setStatus("Waiting for the approval signature.");
  const signer = await new BrowserProvider(window.ethereum).getSigner();
  const address = getAddress(await signer.getAddress());
  if (address !== (await editorOnChain())) {
    setStatus("This wallet is not koolskull.eth.");
    return;
  }
  const signature = await signer.signMessage(message);
  const record = { articleId: id, address, message, signature, note };
  const kept = localLedger();
  kept[id] = record;
  localStorage.setItem(LOCAL_LEDGER, JSON.stringify(kept));
  const next = drafts();
  delete next[id];
  localStorage.setItem(DRAFT_KEY, JSON.stringify(next));
  let stored = false;
  try {
    const response = await fetch("ledger.php", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(record),
    });
    stored = response.ok;
  } catch {
    stored = false;
  }
  editing = false;
  document.body.dataset.editing = "off";
  await refreshApprovals();
  if (!approvals[id]) approvals[id] = record;
  setStatus(stored ? "Approved and stored on the site." : "Approved on this phone. The site ledger did not store it.");
  render(true);
}

function actOn(act) {
  if (act === "up") move(-1);
  if (act === "down") move(1);
  if (act === "left" || act === "b") back();
  if (act === "right" || act === "a") activate();
}

document.querySelector(".pad").addEventListener("click", (event) => {
  const act = event.target?.dataset?.act;
  if (act) actOn(act);
});
window.addEventListener("keydown", (event) => {
  if (document.activeElement?.id === "editor") return;
  const key = event.key;
  let act = "";
  if (key === "ArrowUp") act = "up";
  else if (key === "ArrowDown") act = "down";
  else if (key === "ArrowLeft") act = "left";
  else if (key === "ArrowRight") act = "right";
  else if (key === "a" || key === "A" || key === "z" || key === "Z") act = "a";
  else if (key === "b" || key === "B" || key === "x" || key === "X") act = "b";
  if (!act) return;
  event.preventDefault();
  actOn(act);
});
window.addEventListener("hashchange", () => {
  editing = false;
  document.body.dataset.editing = "off";
  render(true);
});

const catalog = await fetch("articles.json").then((response) => response.json());
sections = catalog.sections;
indexTree(sections, []);
if (!location.hash) location.replace("#home");
render(true);
try {
  await restore();
  await refreshApprovals();
  render(true);
} catch (error) {
  setStatus(error?.message || "Approvals did not load.");
}
