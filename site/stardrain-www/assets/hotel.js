import { bindDither, closeFull, openFull, redither } from "./dither.js";

const STORY = {
  island: "South side. The hotel faces the night.",
  talk: "I live at the top of the hotel.",
  city: "Mediocricity is its own orb, off the coast. Counters take SMILE.",
  drawings: "Reference drawings. Open one for full color.",
};

const WHERE = {
  island: "ISLAND",
  talk: "HOLLYWOOD",
  city: "MEDIOCRICITY",
  drawings: "DRAWINGS",
};

const SIGN = {
  S: ["###", "#..", ".#.", "..#", "###"],
  T: ["###", ".#.", ".#.", ".#.", ".#."],
  A: [".#.", "#.#", "###", "#.#", "#.#"],
  R: ["##.", "#.#", "##.", "#.#", "#.#"],
  D: ["##.", "#.#", "#.#", "#.#", "##."],
  I: ["###", ".#.", ".#.", ".#.", ".#."],
  N: ["#.#", "##.", "#.#", "#.#", "#.#"],
};

const DRAWINGS = [
  ["hotel-craft.jpg", "HOTEL AND CRAFT", "The hotel, with a craft above it."],
  ["hotel-tower.jpg", "HOTEL TOWER", "Tower on the market base. Cross on the roof."],
  ["hotel-roof.jpg", "ROOF", "Roof, cross, and stairs."],
  ["hotel-slope.jpg", "SOUTH SLOPE", "The hotel on the south slope. Star Drain on the cliff."],
  ["hollywood-pencil.jpg", "HOLLYWOOD", "Hollywood Cowboy."],
  ["plant-bodies.jpg", "PLANT BODIES", "Plant bodies."],
  ["plant-modules.jpg", "PLANT MODULES", "Plant modules. Mixer, filter, oscillator."],
  ["smile-pass.jpg", "SMILE PASS", "Smiley Teeth Records pass."],
  ["winged-case.jpg", "WINGED CASE", "A case with wings."],
  ["winged-camera.jpg", "WINGED CAMERA", "A camera with wings."],
];

let index = 0;

function mountSign() {
  const host = document.querySelector(".sign");
  let x = 0;
  for (const char of "STARDRAIN") {
    SIGN[char].forEach((row, y) => {
      [...row].forEach((bit, dx) => {
        if (bit !== "#") return;
        const cell = document.createElement("span");
        cell.className = "px lit";
        cell.style.setProperty("--x", String(x + dx));
        cell.style.setProperty("--y", String(y));
        cell.style.setProperty("--w", "1");
        cell.style.setProperty("--h", "1");
        host.append(cell);
      });
    });
    x += 4;
  }
}

function mountDrawings() {
  const host = document.getElementById("drawings");
  for (const [file, title, line] of DRAWINGS) {
    const figure = document.createElement("figure");
    const button = document.createElement("button");
    button.type = "button";
    button.className = "plate";
    button.dataset.full = `/assets/ref/${file}`;
    button.dataset.line = line;
    button.setAttribute("aria-label", title);
    const img = document.createElement("img");
    img.alt = "";
    img.dataset.dither = "";
    img.dataset.w = "96";
    img.src = `/assets/ref/${file}`;
    button.append(img, document.createElement("canvas"));
    const caption = document.createElement("figcaption");
    caption.textContent = title;
    figure.append(button, caption);
    host.append(figure);
  }
}

function items() {
  return [...document.querySelectorAll("#screen [data-hot], #screen [data-full], #menu-l button, #menu-l a, #menu-r button, #menu-r a")].filter(
    (node) => node.getClientRects().length > 0,
  );
}

function paintCursor() {
  const list = items();
  if (!list.length) return;
  index = (index + list.length) % list.length;
  list.forEach((node, slot) => node.classList.toggle("is-on", slot === index));
  const current = list[index];
  const story = document.getElementById("story");
  if (current.dataset.line) story.textContent = current.dataset.line;
  else if (current.dataset.view) story.textContent = STORY[current.dataset.view];
  else story.textContent = STORY[document.body.dataset.view] || STORY.island;
  current.scrollIntoView({ block: "nearest", inline: "nearest" });
}

function setView(name) {
  document.body.dataset.view = name;
  document.body.dataset.theme = name === "talk" || name === "city" ? "mint" : "dmg";
  document.getElementById("where").textContent = WHERE[name];
  document.getElementById("story").textContent = STORY[name];
  for (const panel of document.querySelectorAll("[data-panel]")) {
    panel.hidden = panel.dataset.panel !== name;
  }
  for (const node of document.querySelectorAll("#menu-l [data-view]")) {
    node.classList.toggle("is-here", node.dataset.view === name);
  }
  redither();
  const list = items();
  const found = list.findIndex((node) => node.dataset.view === name);
  index = found >= 0 ? found : 0;
  paintCursor();
}

function activate(node) {
  if (!node) return;
  if (node.dataset.full) {
    openFull(node.dataset.full, node.dataset.line || node.getAttribute("aria-label") || "");
    return;
  }
  if (node.dataset.hot === "top") {
    setView("talk");
    return;
  }
  if (node.dataset.view) {
    setView(node.dataset.view);
    return;
  }
  if (node.href) {
    window.location.assign(node.href);
    return;
  }
  paintCursor();
}

function move(step) {
  index += step;
  paintCursor();
}

function fromKey(key) {
  if (key === "ArrowUp") return "up";
  if (key === "ArrowDown") return "down";
  if (key === "ArrowLeft") return "left";
  if (key === "ArrowRight") return "right";
  if (key === "z" || key === "Z" || key === "Enter") return "a";
  if (key === "x" || key === "X" || key === "Escape") return "b";
  return "";
}

function onCode(code) {
  if (!code) return;
  if (document.body.dataset.zoom) {
    if (code === "a" || code === "b") closeFull();
    return;
  }
  if (code === "b") {
    if (document.body.dataset.view !== "island") setView("island");
    return;
  }
  if (code === "up" || code === "left") move(-1);
  if (code === "down" || code === "right") move(1);
  if (code === "a") activate(items()[index]);
}

function bindInput() {
  window.addEventListener("keydown", (event) => {
    const code = fromKey(event.key);
    if (!code) return;
    event.preventDefault();
    onCode(code);
  });
  for (const button of document.querySelectorAll("[data-act]")) {
    button.addEventListener("pointerdown", (event) => {
      event.preventDefault();
      onCode(button.getAttribute("data-act"));
    });
  }
  document.getElementById("screen").addEventListener("click", (event) => {
    const node = event.target.closest("[data-hot], [data-full]");
    if (!node) return;
    index = items().indexOf(node);
    activate(node);
  });
  document.getElementById("menu-l").addEventListener("click", (event) => {
    const node = event.target.closest("button");
    if (!node) return;
    event.preventDefault();
    index = items().indexOf(node);
    activate(node);
  });
  document.querySelector(".zoom").addEventListener("click", () => closeFull());
}

mountSign();
mountDrawings();
bindDither();
bindInput();
setView("island");
