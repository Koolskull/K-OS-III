/**
 * Engine status pages: rooms, levels, menus, games, playlists, scene.
 * The hotel terminal at / is the front. Each page keeps its own palette in shell.css.
 * Hard edges, no anti-aliasing, kongtext.
 */

import { Application, Assets, Container, Graphics, Sprite, Text, TextureStyle } from "./pixi.min.mjs";
import { mountCrt } from "./crt.js";

TextureStyle.defaultOptions.scaleMode = "nearest";

const PLACES = [
  { label: "ROOMS", href: "/rooms/", glyph: "ST1" },
  { label: "LEVELS", href: "/levels/", glyph: "ST2" },
  { label: "MENUS", href: "/menus/", glyph: "ST3" },
  { label: "GAMES", href: "/games/", glyph: "ST4" },
  { label: "PLAYLISTS", href: "/playlists/", glyph: "ST5" },
  { label: "SCENE", href: "/scene/", glyph: "ST6" },
  { label: "FIELD MANUAL", href: "/stardrain/", glyph: "ST7" },
];

const LEVELS = ["ST1", "ST2", "ST3", "ST4", "ST5", "ST6", "ST7", "ST8"];
const PLAYLISTS = ["PLAYLIST 01", "PLAYLIST 02", "PLAYLIST 03", "PLAYLIST 04"];
const GAMES = [
  { name: "SQUARE", blurb: "A moving square." },
  { name: "EMPTY", blurb: "No game hooked." },
  { name: "EMPTY", blurb: "No game hooked." },
  { name: "EMPTY", blurb: "No game hooked." },
];

const MENU = [
  { label: "PLACES", children: PLACES.map((place) => ({ label: place.label, href: place.href })) },
  {
    label: "VIEW",
    children: [
      { label: "2D", view: "2d" },
      { label: "3D", view: "3d" },
    ],
  },
];

const input = {
  held: new Set(),
  edge: [],
  shift: false,
  w: false,
};

function press(code) {
  if (!input.held.has(code)) input.edge.push(code);
  input.held.add(code);
}

function release(code) {
  input.held.delete(code);
}

function bindInput() {
  const fromKey = (key) => {
    if (key === "ArrowUp") return "up";
    if (key === "ArrowDown") return "down";
    if (key === "ArrowLeft") return "left";
    if (key === "ArrowRight") return "right";
    if (key === "z" || key === "Z") return "a";
    if (key === "x" || key === "X") return "b";
    if (key === "Enter") return "start";
    return "";
  };
  window.addEventListener("keydown", (event) => {
    if (event.key === "Shift") input.shift = true;
    if (event.key === "w" || event.key === "W") input.w = true;
    const code = fromKey(event.key);
    if (!code) return;
    event.preventDefault();
    press(code);
  });
  window.addEventListener("keyup", (event) => {
    if (event.key === "Shift") input.shift = false;
    if (event.key === "w" || event.key === "W") input.w = false;
    const code = fromKey(event.key);
    if (code) release(code);
  });
  for (const button of document.querySelectorAll("[data-act]")) {
    const code = button.getAttribute("data-act");
    button.addEventListener("pointerdown", (event) => {
      event.preventDefault();
      press(code);
    });
    button.addEventListener("pointerup", () => release(code));
    button.addEventListener("pointerleave", () => release(code));
  }
}

let repeat = 0;

function consume() {
  const look = input.shift && input.w;
  const edge = input.edge.splice(0);
  repeat += 1;
  const fireHeld = repeat >= 8;
  if (fireHeld) repeat = 0;
  const dir = (code) => edge.includes(code) || (fireHeld && input.held.has(code));
  return {
    up: dir("up"),
    down: dir("down"),
    left: dir("left"),
    right: dir("right"),
    a: edge.includes("a") || edge.includes("start"),
    b: edge.includes("b"),
    look,
  };
}

function theme() {
  const raw = (name) => getComputedStyle(document.body).getPropertyValue(name).trim();
  const num = (name) => Number.parseInt(raw(name).slice(1), 16);
  return {
    bg: raw("--bg"),
    ink: raw("--ink"),
    dim: raw("--dim"),
    hi: raw("--hi"),
    wall: num("--wall"),
    floor: num("--floor"),
    mark: num("--hi"),
    line: num("--ink"),
    idle: num("--dim"),
  };
}

function label(text, x, y, color = theme().ink) {
  const node = new Text({
    text,
    style: { fontFamily: "kongtext", fontSize: 8, fill: color },
  });
  node.scale.set(2);
  node.position.set(x, y);
  node.roundPixels = true;
  return node;
}

function glyphSprite(name) {
  const sprite = new Sprite(Assets.get(`/assets/glyphs/${name}.png`));
  sprite.scale.set(2);
  sprite.roundPixels = true;
  return sprite;
}

function go(href) {
  window.location.assign(href);
}

function back() {
  go("/");
}

const pages = {
  gate() {
    let index = 0;
    return (shell, pad) => {
      if (pad.up) index = (index + PLACES.length - 1) % PLACES.length;
      if (pad.down) index = (index + 1) % PLACES.length;
      if (pad.a) go(PLACES[index].href);
      shell.draw((view) => {
        const t = theme();
        view.addChild(label("STARDRAIN", 24, 20, t.ink));
        view.addChild(label("ARROWS MOVE   Z ENTER", 24, 44, t.dim));
        PLACES.forEach((place, row) => {
          const y = 84 + row * 28;
          const mark = glyphSprite(place.glyph);
          mark.position.set(24, y);
          view.addChild(mark);
          view.addChild(label(place.label, 64, y, row === index ? t.hi : t.dim));
        });
      });
    };
  },

  rooms() {
    const width = 20;
    const height = 12;
    const tile = 16;
    let x = 2;
    let y = 2;
    const door = { x: 17, y: 6 };
    let note = "";
    return (shell, pad) => {
      if (pad.b) back();
      if (pad.left) x = Math.max(1, x - 1);
      if (pad.right) x = Math.min(width - 2, x + 1);
      if (pad.up) y = Math.max(1, y - 1);
      if (pad.down) y = Math.min(height - 2, y + 1);
      if (pad.a) note = x === door.x && y === door.y ? "NO LEVEL HOOKED" : "";
      shell.draw((view) => {
        const t = theme();
        const grid = new Graphics();
        for (let row = 0; row < height; row += 1) {
          for (let col = 0; col < width; col += 1) {
            const wall = row === 0 || col === 0 || row === height - 1 || col === width - 1;
            const isDoor = col === door.x && row === door.y;
            grid.rect(col * tile, row * tile, tile, tile).fill(isDoor ? t.mark : wall ? t.wall : t.floor);
          }
        }
        grid.rect(x * tile, y * tile, tile, tile).fill(t.mark);
        grid.position.set(24, 72);
        view.addChild(grid);
        view.addChild(label("ROOM 01", 24, 20, t.ink));
        view.addChild(label(note || "ARROWS MOVE   Z DOOR   X BACK", 24, 44, t.dim));
      });
    };
  },

  levels() {
    let index = 0;
    let note = "EMPTY SLOT";
    return (shell, pad) => {
      if (pad.b) back();
      if (pad.left) index = Math.max(0, index - 1);
      if (pad.right) index = Math.min(LEVELS.length - 1, index + 1);
      if (pad.up) index = Math.max(0, index - 4);
      if (pad.down) index = Math.min(LEVELS.length - 1, index + 4);
      if (pad.a) note = "NO LEVEL HOOKED";
      shell.draw((view) => {
        const t = theme();
        view.addChild(label("LEVELS", 24, 20, t.ink));
        view.addChild(label(`${note}   X BACK`, 24, 44, t.dim));
        LEVELS.forEach((name, slot) => {
          const col = slot % 4;
          const row = Math.floor(slot / 4);
          const x = 24 + col * 72;
          const y = 88 + row * 72;
          const box = new Graphics();
          box.rect(x, y, 56, 56).stroke({ width: 2, color: slot === index ? t.mark : t.idle });
          view.addChild(box);
          const mark = glyphSprite(name);
          mark.position.set(x + 20, y + 20);
          view.addChild(mark);
        });
      });
    };
  },

  menus() {
    const stack = [{ title: "MENUS", items: MENU }];
    let index = 0;
    let note = "";
    return (shell, pad) => {
      const frame = stack[stack.length - 1];
      if (pad.up) index = (index + frame.items.length - 1) % frame.items.length;
      if (pad.down) index = (index + 1) % frame.items.length;
      if (pad.b) {
        if (stack.length === 1) back();
        else {
          stack.pop();
          index = 0;
        }
      }
      if (pad.a) {
        const item = frame.items[index];
        if (item.href) go(item.href);
        else if (item.view) {
          localStorage.setItem("stardrain-view", item.view);
          note = `VIEW ${item.view.toUpperCase()}`;
        } else if (item.children) {
          stack.push({ title: item.label, items: item.children });
          index = 0;
          note = "";
        }
      }
      shell.draw((view) => {
        const t = theme();
        view.addChild(label(frame.title, 24, 20, t.ink));
        view.addChild(label(note || "Z IN   X OUT", 24, 44, t.dim));
        frame.items.forEach((item, row) => {
          const y = 84 + row * 28;
          view.addChild(label(item.label, 24, y, row === index ? t.hi : t.dim));
        });
      });
    };
  },

  games() {
    let index = 0;
    let playing = false;
    let square = 40;
    let dir = 2;
    return (shell, pad) => {
      if (playing) {
        if (pad.b) playing = false;
        square += dir;
        if (square > 200 || square < 24) dir *= -1;
      } else {
        if (pad.b) back();
        if (pad.up) index = (index + GAMES.length - 1) % GAMES.length;
        if (pad.down) index = (index + 1) % GAMES.length;
        if (pad.a && GAMES[index].name === "SQUARE") playing = true;
      }
      shell.draw((view) => {
        const t = theme();
        if (playing) {
          const body = new Graphics();
          body.rect(square, 120, 32, 32).fill(t.mark);
          view.addChild(body);
          view.addChild(label("SQUARE", 24, 20, t.ink));
          view.addChild(label("X BACK", 24, 44, t.dim));
          return;
        }
        view.addChild(label("GAMES", 24, 20, t.ink));
        view.addChild(label("Z PLAY   X BACK", 24, 44, t.dim));
        GAMES.forEach((game, row) => {
          const y = 84 + row * 36;
          view.addChild(label(game.name, 24, y, row === index ? t.hi : t.dim));
          view.addChild(label(game.blurb, 24, y + 16, t.dim));
        });
      });
    };
  },

  playlists() {
    let index = 0;
    let open = false;
    return (shell, pad) => {
      if (pad.b) {
        if (open) open = false;
        else back();
      }
      if (!open) {
        if (pad.up) index = (index + PLAYLISTS.length - 1) % PLAYLISTS.length;
        if (pad.down) index = (index + 1) % PLAYLISTS.length;
        if (pad.a) open = true;
      }
      shell.draw((view) => {
        const t = theme();
        view.addChild(label(open ? PLAYLISTS[index] : "PLAYLISTS", 24, 20, t.ink));
        view.addChild(label(open ? "NO TRACKS   X BACK" : "Z OPEN   X BACK", 24, 44, t.dim));
        if (open) return;
        PLAYLISTS.forEach((name, row) => {
          const y = 84 + row * 28;
          const tens = glyphSprite("ST0");
          const ones = glyphSprite("ST0");
          tens.position.set(24, y);
          ones.position.set(48, y);
          view.addChild(tens, ones);
          view.addChild(label(name, 80, y, row === index ? t.hi : t.dim));
        });
      });
    };
  },

  scene() {
    const cam = { x: 0, y: 1.2, z: 4, yaw: 0, pitch: 0 };
    const lines = boxLines();
    return (shell, pad) => {
      if (pad.b) back();
      const step = 0.15;
      if (pad.look) {
        if (pad.up) cam.pitch = Math.max(-1, cam.pitch - 0.04);
        if (pad.down) cam.pitch = Math.min(1, cam.pitch + 0.04);
        if (pad.left) cam.x -= step;
        if (pad.right) cam.x += step;
      } else {
        if (pad.left) cam.yaw -= 0.06;
        if (pad.right) cam.yaw += 0.06;
        if (pad.up) {
          cam.x += Math.sin(cam.yaw) * step;
          cam.z -= Math.cos(cam.yaw) * step;
        }
        if (pad.down) {
          cam.x -= Math.sin(cam.yaw) * step;
          cam.z += Math.cos(cam.yaw) * step;
        }
      }
      cam.x = clamp(cam.x, -3.2, 3.2);
      cam.z = clamp(cam.z, -3.2, 3.2);
      shell.draw((view) => {
        const t = theme();
        const width = shell.app.screen.width;
        const height = shell.app.screen.height;
        const grid = new Graphics();
        for (const [a, b] of lines) {
          const pa = project(a, cam, width, height);
          const pb = project(b, cam, width, height);
          if (!pa || !pb) continue;
          grid.moveTo(pa.x, pa.y).lineTo(pb.x, pb.y).stroke({ width: 1, color: t.line });
        }
        view.addChild(grid);
        view.addChild(label("SCENE", 24, 20, t.ink));
        view.addChild(label("ARROWS WALK/TURN   SHIFT+W LOOK/STRAFE   X BACK", 24, 44, t.dim));
      });
    };
  },
};

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function boxLines() {
  const corners = [];
  for (const x of [-4, 4]) {
    for (const y of [0, 3]) {
      for (const z of [-4, 4]) corners.push([x, y, z]);
    }
  }
  const lines = [];
  for (let i = 0; i < corners.length; i += 1) {
    for (let j = i + 1; j < corners.length; j += 1) {
      const same = ["x", "y", "z"].filter((axis, index) => corners[i][index] === corners[j][index]).length;
      if (same === 2) lines.push([corners[i], corners[j]]);
    }
  }
  for (let z = -4; z <= 4; z += 2) lines.push([[-4, 0, z], [4, 0, z]]);
  for (let x = -4; x <= 4; x += 2) lines.push([[x, 0, -4], [x, 0, 4]]);
  return lines;
}

function project(point, cam, width, height) {
  const dx = point[0] - cam.x;
  const dy = point[1] - cam.y;
  const dz = point[2] - cam.z;
  const cos = Math.cos(cam.yaw);
  const sin = Math.sin(cam.yaw);
  const rx = dx * cos - dz * sin;
  const rz = dx * sin + dz * cos;
  const cosP = Math.cos(cam.pitch);
  const sinP = Math.sin(cam.pitch);
  const ry = dy * cosP - rz * sinP;
  const depth = dy * sinP + rz * cosP;
  if (depth < 0.25) return null;
  const scale = 280 / depth;
  return { x: width / 2 + rx * scale, y: height / 2 - ry * scale };
}

class Shell {
  constructor(app) {
    this.app = app;
    this.view = new Container();
    app.stage.addChild(this.view);
  }

  draw(build) {
    this.view.removeChildren();
    build(this.view);
  }
}

async function main() {
  mountCrt();
  const pageName = document.body.dataset.page || "gate";
  const factory = pages[pageName];
  if (!factory) throw new Error(`unknown page ${pageName}`);
  const face = new FontFace("kongtext", "url(/assets/fonts/kongtext-webfont.woff2)");
  await face.load();
  document.fonts.add(face);
  await Assets.load(Array.from({ length: 16 }, (_, index) => `/assets/glyphs/ST${index.toString(16).toUpperCase()}.png`));
  const app = new Application();
  await app.init({
    canvas: document.querySelector("#view"),
    background: theme().bg,
    antialias: false,
    roundPixels: true,
    resolution: 1,
    autoDensity: true,
    resizeTo: window,
    preference: "webgl",
  });
  app.canvas.style.imageRendering = "pixelated";
  bindInput();
  const shell = new Shell(app);
  const tick = factory();
  app.ticker.add(() => tick(shell, consume()));
}

main().catch((error) => {
  document.body.textContent = `STARDRAIN SHELL FAILED: ${error.message}`;
});
