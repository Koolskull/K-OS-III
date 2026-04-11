this i# 🎨 VMI Artist Quick Reference

## The One Thing to Remember

**Next.js only serves files from `public/`, but you organize images in `components/`**

## Quick Workflow

1. **Export your layers** to:
   ```
   components/[component-name]/img/[layer-name]/000000.PNG
   ```

2. **Run the sync** before testing:
   ```bash
   npm run sync-vmi
   ```

3. **That's it!** Your images are now at:
   ```
   public/[component-name]/img/[layer-name]/000000.PNG
   ```

## Why This Way?

- **Next.js limitation**: Can only serve files from `public/` folder
- **Better organization**: Keep images with component code in `components/`
- **Automatic sync**: Script copies images for you, no manual work

## VMI Naming Convention

```
SSSSXX.PNG

SSSS = State (hex)
  000 = default
  001 = hover/active
  002 = pressed
  etc...

XX = Animation frame (hex)
  00 = frame 0
  01 = frame 1
  02 = frame 2
  etc...
```

### Examples:
- `000000.PNG` - Default state, frame 0 (static image)
- `001000.PNG` - Hover state, frame 0 (button hover)
- `000001.PNG` - Default state, frame 1 (animation frame 1)
- `000002.PNG` - Default state, frame 2 (animation frame 2)

---

## 🏝️ Creating VMI Layered Scenes

### Step-by-Step: Adding a New Scene

1. **Create your folder structure** in `public/[scene-name]/`:
   ```
   public/surf-shop/exterior/img/
   ├── sky/
   │   └── 000000.PNG      # Farthest layer (background)
   ├── ocean/
   │   └── 000000.PNG
   ├── ground/
   │   └── 000000.PNG
   ├── shop/
   │   └── 000000.PNG
   └── door/
       ├── 000000.PNG      # Default state
       └── 001000.PNG      # Hover state (for interactive elements)
   ```

2. **Layer Order** (farthest to closest):
   - Layers are stacked using `z-index`
   - Lower z-index = farther back (sky = 0)
   - Higher z-index = closer to viewer (foreground elements)

3. **Create the React Component**:
   ```tsx
   // Define your layer stack
   const LAYER_STACK = [
     { id: 'sky', type: 'static', zIndex: 0 },
     { id: 'ocean', type: 'static', zIndex: 1 },
     { id: 'ground', type: 'static', zIndex: 2 },
     { id: 'shop', type: 'static', zIndex: 3 },
     { id: 'door', type: 'button', zIndex: 4, buttonName: 'door' },
   ];
   ```

4. **Render layers with proper cropping** (the key is `objectFit: "cover"`):
   ```tsx
   <Image
     src={`/[scene-name]/img/${layerId}/000000.PNG`}
     alt={layerId}
     fill                          // Makes image fill the container
     style={{
       objectFit: "cover",         // IMPORTANT: Maintains aspect ratio, crops to fill
       pointerEvents: "none",      // Allows click-through for pixel detection
     }}
     priority={layer.zIndex <= 2}  // Prioritize background layers
   />
   ```

### Image Cropping: `objectFit: "cover"` Explained

The `objectFit: "cover"` CSS property is crucial for consistent layering:

- **What it does**: Scales the image to completely fill the container while maintaining aspect ratio
- **How it works**: The image will be cropped (either top/bottom or left/right) to fit
- **Why it matters**: All layers use the same cropping, so they align perfectly

```
Container (viewport):  ┌──────────────────┐
                       │                  │
                       │   Visible area   │
                       │                  │
                       └──────────────────┘

Image (wider):         ╔══════════════════════════╗
                       ║  cropped │ visible │ cropped  ║
                       ╚══════════════════════════╝
```

**Alternative values** (not recommended for VMI):
- `contain` - Shows full image, may show background gaps
- `fill` - Stretches to fit, distorts aspect ratio

---

## 🏠 Multi-View Buildings (Exterior / Interior / Custom)

When a building or location has more than one angle or state that the player can enter, organise its assets using **view sub-folders** inside the building folder.

### Standard View Names

| View folder | When to use |
|-------------|-------------|
| `Exterior`  | The outside of a building as seen from the world/village scene |
| `Interior`  | The inside of a building once the player has entered |
| *(custom)*  | Any other named perspective — e.g. `Rooftop`, `Basement`, `BackAlley` |

### Folder Structure

```
public/[scene]/[Building Name]/
├── Exterior/
│   ├── 000000.PNG      # Default state
│   └── 001000.PNG      # Hover state (if interactive from outside)
├── Interior/
│   ├── 000000.PNG      # Default state inside the building
│   └── 001000.PNG      # Hover state for interior elements
└── Rooftop/            # Optional — only add views that exist
    └── 000000.PNG
```

**Real example — Village houses:**
```
public/village/House 1/
├── Exterior/
│   └── 000000.PNG      # House as seen in the village scene
└── Interior/
    └── 000000.PNG      # Room shown once player walks inside
```

### In the React Component

Add a `view` field to your `LayerConfig` and include it in the image path helper:

```tsx
interface LayerConfig {
  id: string
  folder: string        // e.g. "House 1"
  view?: string         // e.g. "Exterior" | "Interior" | undefined for flat layers
  ext: "PNG" | "jpg"
  // ...
}

function getImagePath(layer: LayerConfig): string {
  if (layer.view) {
    return `/village/${encodeURIComponent(layer.folder)}/${encodeURIComponent(layer.view)}/000000.${layer.ext}`
  }
  return `/village/${encodeURIComponent(layer.folder)}/000000.${layer.ext}`
}

// Layer stack — Exterior view
const LAYER_STACK = [
  { id: 'bg',      folder: 'BG',      ext: 'jpg', type: 'static', zIndex: 0 },
  { id: 'house-1', folder: 'House 1', ext: 'PNG', type: 'button', zIndex: 1, view: 'Exterior' },
  { id: 'house-2', folder: 'House 2', ext: 'PNG', type: 'button', zIndex: 2, view: 'Exterior' },
];
```

To **switch views** (e.g. player enters a house), create a second scene component that loads `view: "Interior"` layers, or pass the active view as a prop and swap `getImagePath` accordingly.

### Rules of Thumb

- **Always use `Exterior` and `Interior`** as the two baseline views for any building that has both.
- **Folder names are case-sensitive** — be consistent (`Exterior` not `exterior`).
- **Flat scene layers** (sky, ocean, BG) have no view sub-folder — omit the `view` field entirely.
- **Spaces in folder names** must be URL-encoded (`%20`) in image paths — use `encodeURIComponent()`.

---

## ☁️ Adding Cloud Shader Overlay

The cloud shader creates animated, evolving clouds that drift across the scene. Perfect for sky layers!

### Quick Usage

```tsx
import { FX } from '@/lib/vmi/components/FX';

// Add inside your sky layer div, AFTER the Image:
{layer.id === "sky" && (
  <FX
    type="clouds"
    blendMode="normal"
    zIndex={0.5}
    enabled={true}
    opacity={0.95}
    uniforms={{
      uCoverage: 0.97,    // How much sky is covered (0-1)
      uScale: 3.5,        // Size of cloud formations
      uOpacity: 0.95,     // Transparency of clouds
    }}
  />
)}
```

### Cloud Shader Parameters

| Parameter | Range | Description |
|-----------|-------|-------------|
| `opacity` | 0.0 - 1.0 | Overall visibility of the cloud layer |
| `uCoverage` | 0.0 - 1.0 | How much of the sky has clouds (0.97 = thick clouds) |
| `uScale` | 1.0 - 10.0 | Size of cloud formations (higher = larger clouds) |
| `uOpacity` | 0.0 - 1.0 | Internal opacity uniform for the shader |

### Blend Modes

The FX component supports various blend modes:
- `"normal"` - Standard overlay (recommended for clouds)
- `"multiply"` - Darkens underlying image
- `"screen"` - Lightens underlying image
- `"overlay"` - Combines multiply and screen
- `"add"` - Additive blending (good for glow effects)

### Example: Different Cloud Presets

```tsx
// Thick, mysterious clouds (like island scene)
<FX
  type="clouds"
  blendMode="normal"
  opacity={0.95}
  uniforms={{ uCoverage: 0.97, uScale: 3.5, uOpacity: 0.95 }}
/>

// Light, wispy clouds
<FX
  type="clouds"
  blendMode="normal"
  opacity={0.6}
  uniforms={{ uCoverage: 0.5, uScale: 5.0, uOpacity: 0.6 }}
/>

// Smoky effect for tooltips
<FX
  type="clouds"
  blendMode="multiply"
  opacity={0.4}
  uniforms={{ uCoverage: 0.8, uScale: 2.0, uOpacity: 0.4 }}
/>
```

---

## Current VMI Components

### Island Scene (`components/island/`)
- **Location**: `components/island/img/[layer]/`
- **Layers**: sky, water, thorax, abdomen, head, beachwaves, museum, cardshop, lab, cheese-shop, fountain, dock
- **Effects**: Cloud shader on sky, water distortion on water, lava glow on abdomen
- **After changes**: Run `npm run sync-vmi`

### Surf Shop Exterior (`components/surf-shop/`)
- **Location**: `public/surf-shop/exterior/img/[layer]/`
- **Layers**: sky, ocean, ground, shop, door
- **Effects**: Cloud shader on sky
- **Interactive**: Door has hover state (001000.PNG)

## Full Documentation

- **VMI System**: [docs/vmi/README.md](docs/vmi/README.md)
- **Island Scene**: [components/island/README.md](components/island/README.md)
- **Shaders**: [docs/SHADER_IMPLEMENTATION.md](docs/SHADER_IMPLEMENTATION.md)

## Commands

```bash
# Sync images from components to public (do this during development)
npm run sync-vmi

# Build for production (syncs automatically)
npm run build

# Start development server
npm run dev
```

---

**Remember**: Always export to `components/`, then run `npm run sync-vmi`! 🎨

