# Faceplate Build Kit

A drop-in kit so artists and musicians can skin **Thrash Tracker** / **Datamoshpit** live pads, drum kits, sample kits, and FX panels with their own art — without waiting on engine changes.

This is creative freedom with a clear contract: you draw PNGs, you name them the VMI way, you drop a folder in `public/skins/`, and the tracker wears it.

Companion docs:

- [`VMI_ARTIST_GUIDE.md`](../VMI_ARTIST_GUIDE.md) — state/frame naming (`SSSSXX.PNG`)
- [`koolskull-os-ui-notes.md`](../koolskull-os-ui-notes.md) — Maximalistic Minimalism, no rounded corners, no AA

---

## What you can skin

| Slot | Purpose |
|------|---------|
| `faceplate/` | Full plate behind the 4×4 pad grid **and** the Thrash phone control deck |
| `pads/shared/` | One set of pad graphics reused for all 16 LIVE pads (also dresses phone keys if per-key art is missing) |
| `pads/00` … `pads/0F` | Optional per-pad art (`sharedArt: false`) |
| `buttons/<name>/` | FX / bypass / kit controls (any name you declare in `skin.json`) |
| `buttons/up` `left` `right` `down` `shift` `ctrl` `space` | Optional Thrash phone D-pad / action keys |

Targets in the manifest (`live-pads`, `kit`, `fx`, `sample-kit`, `drum-kit`) are tags for future filtering — draw what you need; the LIVE screen reads `live-pads` packs today.

---

## Quick start (blank canvas)

```bash
cp -R public/skins/_blank public/skins/my-wild-kit
```

1. Edit `public/skins/my-wild-kit/skin.json` — set `id`, `name`, `author`.
2. Replace the PNG files. **Keep the filenames.**
3. Register the pack in `public/skins/index.json`:

```json
{
  "id": "my-wild-kit",
  "name": "MY WILD KIT",
  "author": "you",
  "path": "/skins/my-wild-kit"
}
```

4. Open **Thrash Tracker** from the K-OS desktop (or `/thrash`).
5. Click **SKIN:** above the phone controls to cycle packs until yours shows up.
6. Same cycler also appears on Datamoshpit **LIVE** when that app is open.

No build step. No sync script. Next.js serves `public/` as-is.

---

## VMI filename contract

Same system as the rest of K-OS:

```
SSSSXX.PNG

SSSS = state (hex)
  0000  default
  0010  active / hover
  0020  pressed
  0030  muted
  0040  solo

XX = animation frame (hex)
  00 = first frame (static art uses this)
```

Examples:

- `000000.PNG` — idle pad
- `001000.PNG` — lit / active
- `002000.PNG` — pressed
- `003000.PNG` — muted
- `004000.PNG` — solo

Missing states fall back (pressed → active → default). Missing packs fall back to the plain CSS pads. Your kit never bricks the tracker.

---

## Folder layout

```
public/skins/<pack-id>/
  skin.json
  preview.PNG              # optional thumbnail
  faceplate/
    000000.PNG
  pads/
    shared/                # when layout.pads.sharedArt = true (default)
      000000.PNG
      001000.PNG
      002000.PNG
      003000.PNG
      004000.PNG
    00/ … 0F/              # only if sharedArt = false
  buttons/
    fx/
      000000.PNG
      001000.PNG
      002000.PNG
```

Suggested canvas sizes (not enforced — use what looks right at pixel scale):

| Asset | Suggested size |
|-------|----------------|
| Faceplate | 128×128 or 256×256 |
| Pad | 64×64 |
| FX button | 48×24 |

`image-rendering: pixelated` is forced. Draw crisp pixels. No anti-aliasing. No rounded corners unless *you* draw them into the PNG on purpose (the shell will not round for you).

---

## `skin.json` fields

```json
{
  "id": "my-wild-kit",
  "name": "MY WILD KIT",
  "author": "you",
  "version": 1,
  "description": "Whatever you want people to know.",
  "targets": ["live-pads", "kit", "fx", "sample-kit", "drum-kit"],
  "layout": {
    "pads": { "cols": 4, "rows": 4, "sharedArt": true },
    "faceplate": { "fit": "cover" },
    "showPadLabels": true
  },
  "slots": {
    "faceplate": "faceplate",
    "pad": "pads/shared",
    "fx": "buttons/fx"
  },
  "states": {
    "0000": "default",
    "0010": "active",
    "0020": "pressed",
    "0030": "muted",
    "0040": "solo"
  }
}
```

When `sharedArt` is `false`, set `"pad": "pads"` and put art in `pads/00` … `pads/0F`.

---

## Runtime API (for app code)

```ts
import { useSkinPack, FaceplateShell, SkinnedPad, SkinPackPicker } from "@/components/faceplates";
import { loadSkinPackIndex, resolvePadUrl } from "@/lib/faceplates";
```

- `useSkinPack()` — loads catalog, remembers last choice in `localStorage` (`kos-faceplate-skin-pack`)
- `FaceplateShell` — paints the plate behind children
- `SkinnedPad` — pad button with VMI art + slime label overlay
- `SkinPackPicker` — header control that cycles packs

---

## Design freedom (what we will not police)

- Style: vaporwave, steel, pulp comic, Orthodox icon collage, pure noise — yours
- Color depth: 1-bit through full RGB
- Animation: add `000001.PNG`, `000002.PNG`, … when the player gains frame advance (static `00` works today)
- Per-instrument packs later: same folder format; bind via instrument / kit metadata when that ships

What we *do* ask: keep filenames and the `skin.json` contract so other people's packs keep loading.

---

## Shipping a pack for others

1. Zip the folder (`my-wild-kit/` including `skin.json`).
2. Drop it under `public/skins/` (or a community mirror) and add an `index.json` entry.
3. Future: IPFS / Commerce Layer listing (see `docs/COMMERCE_SPEC.md`) — same folder is the unit of trade.

---

## Included starter packs

| Id | Role |
|----|------|
| `factory-steel` | Default plate shipped with the OS |
| `_blank` | Checker guide canvas — duplicate this to start |

---

**Remember:** the build kit is a permission slip. Draw the machine you want to play.
