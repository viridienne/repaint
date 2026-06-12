# PRD: Artwork Recolor Web App
### Project: Jewel Music Color — Internal Art Tool
**Version:** 1.1.0  
**Status:** Active  
**Author:** Anh Tang Hoang  
**Date:** 2026-06-12

---

## `<summary>`
A lightweight, browser-based pixel-art recolor tool designed to support the **Jewel Music Color** project. Artists can load PNG artwork, repaint individual pixels or regions, erase, pick colors, and inspect detailed color usage statistics — all without leaving the browser. A future-ready **Game Color Library** integration slot is reserved for project-specific palettes.
## `</summary>`

---

## `<remarks>`
This tool is intentionally scoped to be simpler than Photoshop. It targets pixel-level artwork (e.g., small sprite sheets, tile assets) used in the Jewel Music Color game. It is an internal productivity tool, not a consumer product.
## `</remarks>`

---

## 1. Goals & Non-Goals

### Goals
* Allow artists to quickly recolor pixel artwork without external software
* Provide accurate, real-time color analytics (usage %, pixel count)
* Be self-contained in a browser (no install, no backend required for core features)
* Reserve a clean integration point for the Game Color Library (palette system)

### Non-Goals
* Full raster editing (layers, masks, gradients, filters)
* Vector editing
* Multi-file batch processing (v1)
* Cloud save / user accounts (v1)

---

## 2. Target Users

| User | Context |
|---|---|
| Pixel Artist | Primary user; loads sprites and recolors them to match game palette |
| Game Designer | Reviews color distribution and palette compliance |
| Technical Artist | May integrate the tool into the asset pipeline later |

---

## 3. Feature Specifications

### 3.1 File Loading

```
/// <summary>
/// Handles PNG file import into the canvas.
/// </summary>
/// <param name="file">PNG file selected by the user via drag-and-drop or file picker.</param>
/// <returns>Renders the image pixel-for-pixel on the canvas at native resolution.</returns>
```

* Accept `.png` via drag-and-drop or `<input type="file">`
* Render the image at 1:1 native pixel resolution on canvas
* Support zoom (1×, 2×, 4×, 8×, 16×) for pixel-level editing
* Canvas panning via middle-mouse drag or spacebar + drag

---

### 3.2 Tools

```
/// <summary>
/// Core editing tools available in the toolbar.
/// </summary>
```

#### 3.2.1 Pencil / Repaint Tool
* Click a pixel to paint it with the **Active Color**
* Click-and-drag to paint continuously
* Optional: paint all pixels of the same color (flood-fill mode toggle)

#### 3.2.2 Eraser Tool
* Erase pixels to transparent (alpha = 0)
* Brush size: 1px (pixel-perfect mode)

#### 3.2.3 Color Picker (Eyedropper)
* Click any pixel on canvas → sets that pixel's color as the **Active Color**
* Displays the picked color immediately in the Active Color swatch on the side panel

#### 3.2.4 Auto Detect / Select by Color
* Click a pixel → automatically selects and highlights all pixels sharing the exact same RGBA value
* Provides a visual overlay (marching ants or highlight tint) on selected pixels
* Allows the user to repaint or erase the entire selection in one action

---

### 3.3 Color Analytics Panel (Side Panel)

```
/// <summary>
/// Real-time color statistics panel displayed alongside the canvas.
/// </summary>
/// <remarks>
/// Recalculates on every brush stroke completion (mouseup event).
/// </remarks>
```

The side panel displays:

| Field | Description |
|---|---|
| Active Color | The currently selected paint color (hex + RGB + alpha swatch) |
| Color List | All unique colors found in the current artwork |
| Usage % | Percentage of total opaque pixels each color occupies |
| Pixel Count | Exact count of pixels for each color |
| Transparency | Count and % of transparent (alpha = 0) pixels |

* **Left-click** a color in the list → sets it as the Active Color
* **Right-click** a color in the list → opens the Color Picker Popup to remap all pixels of that color to a new color (one undo step per remap)
* Colors are sorted by usage % descending by default
* Hovering a color in the list highlights those pixels on canvas (ghost overlay)
* Active Color swatch and hex text are both clickable → open Color Picker Popup

---

### 3.3.1 Color Picker Popup

```
/// <summary>
/// Custom color picker popup (replaces native <input type="color">).
/// Figma/Photoshop-style: HSV spectrum + hue bar + hex/RGB inputs.
/// </summary>
/// <remarks>
/// Singleton — one instance shared across all triggers.
/// Closes on outside click or Escape.
/// </remarks>
```

* **Spectrum canvas** — drag crosshair to set saturation (X) and value/brightness (Y)
* **Hue bar** — drag to set hue
* **Preview swatch** — live preview of selected color
* **Hex input** — type or paste hex (with or without `#`); updates spectrum and RGB fields live
* **RGB inputs** — type R/G/B values 0–255; updates spectrum and hex live
* **Copy button** — copies current hex to clipboard
* Opened from:
  * Active Color swatch (click)
  * Active Color hex text (click)
  * Color map row (right-click) → also triggers pixel remap on close

---

### 3.4 Game Color Library *(Reserved — Not in v1)*

```
/// <summary>
/// Integration slot for the Jewel Music Color project palette.
/// </summary>
/// <remarks>
/// Implementation deferred. The UI slot is present but shows a placeholder
/// "Library not loaded" state until palette data is provided.
/// </remarks>
/// <param name="paletteData">
/// JSON array of { name: string, hex: string, id: string } objects
/// injected at runtime when the feature is enabled.
/// </param>
```

* A **"Game Color Library"** section will appear in the side panel below the analytics
* When no palette is loaded, the section shows: *"No color library loaded. Add your palette to enable this feature."*
* When palette data is available, each game color is shown as a labeled swatch
* User can click a library color to set it as the Active Color
* Optional: highlight which pixels in the artwork are **out-of-palette** (non-compliant colors shown with a warning icon in the color list)
* Palette data will be injected via a local JSON file upload or a hardcoded import — TBD at implementation time

---

### 3.5 Canvas Resize

```
/// <summary>
/// Allows the user to change the canvas dimensions without losing artwork content.
/// </summary>
/// <param name="width">Target canvas width in pixels (1–512).</param>
/// <param name="height">Target canvas height in pixels (1–512).</param>
/// <param name="anchor">Which corner the existing content is anchored to during resize.</param>
/// <param name="fillColor">Color used to fill newly created empty space. Default: transparent.</param>
```

#### Resize Dialog (modal, triggered via `Image → Image Size` or toolbar button)

> This is **Image Size** (resample), not Photoshop's "Canvas Size" (crop/expand).
> The entire artwork is scaled to fill the new dimensions — no content is ever cropped.

| Field | Type | Values | Default |
|---|---|---|---|
| Width | Integer input | 1 – 512 px | Current width |
| Height | Integer input | 1 – 512 px | Current height |
| Preset | Dropdown | 8×8, 16×16, 32×32, 48×48, 64×64, 128×128, Custom | — |
| Lock Aspect Ratio | Checkbox | On / Off | Off |
| Resample Method | Fixed | Nearest Neighbor (pixel-perfect, no anti-aliasing) | — |

Behavior:
* Selecting a **Preset** auto-fills Width and Height fields
* On confirm, the artwork is **resampled** to fit the new dimensions using **nearest-neighbor interpolation** — this preserves hard pixel edges and avoids blurring (critical for pixel art)
* Implementation: current `ImageData` is drawn onto a temp `<canvas>`, then scaled via `ctx.drawImage(tmp, 0, 0, newW, newH)` with `imageSmoothingEnabled = false`
* A yellow warning is shown when downscaling: *"Downscaling will reduce detail. Use Undo to revert."*
* Confirming resize pushes a **single undo entry** onto the history stack (snapshot taken before resample)
* Canvas resize triggers a full **Color Analytics recalculation**

---

### 3.6 Brush Size Control

```
/// <summary>
/// Controls the effective radius of the Pencil and Eraser tools.
/// </summary>
/// <param name="size">Brush diameter in pixels (1–32).</param>
/// <remarks>
/// Brush shape is always a hard square (pixel-perfect). No anti-aliasing.
/// Matches the behavior of Photoshop's Pencil tool in pixel-art mode.
/// </remarks>
```

#### Controls
* **Toolbar slider:** visible at all times next to the active tool; range 1–32 px, step 1
* **Bracket shortcuts:** `[` decreases size by 1, `]` increases size by 1 (Photoshop standard)
* **Scroll wheel** over canvas while holding `Alt` adjusts brush size (optional, v1.1)
* Brush size **persists per tool** — Pencil and Eraser remember their last-used sizes independently

#### Brush Preview
* A real-time **cursor overlay** shows the exact pixel footprint of the brush at the current zoom level
* Overlay is a 1px-stroked rectangle matching the brush dimensions; color inverts against the canvas background (white on dark, dark on light)
* Brush preview also shown as a small swatch icon in the toolbar next to the size slider

#### Brush Behavior (Pencil)

| Size | Behavior |
|---|---|
| 1 px | Single pixel per click — true pixel-perfect drawing |
| 2–4 px | Square block stamp per click; drag draws a continuous filled stroke |
| 5–32 px | Large square stamp; useful for filling regions quickly |

#### Brush Behavior (Eraser)
* Same size rules as Pencil
* Paints affected pixels to `rgba(0,0,0,0)` (fully transparent)
* Does **not** use the Active Color

---

### 3.7 Undo / Redo — State Machine

```
/// <summary>
/// Full undo/redo command history using an ImageData snapshot stack.
/// </summary>
/// <param name="maxSteps">Maximum history depth: 50 steps (configurable in settings).</param>
/// <remarks>
/// Follows the linear history model used by Photoshop:
/// performing a new action after an undo discards all redo states.
/// </remarks>
```

#### State Machine Diagram

```
                         [User Action]
                              │
                   ┌──────────▼──────────┐
                   │  Capture snapshot   │  ← cloneImageData(canvas)
                   │  push to undoStack  │
                   │  clear redoStack    │
                   └──────────┬──────────┘
                              │
                   ┌──────────▼──────────┐
                   │   Apply Action to   │
                   │       Canvas        │
                   └─────────────────────┘

  [Ctrl+Z / Undo]                          [Ctrl+Y / Redo]
        │                                        │
┌───────▼────────┐                    ┌──────────▼────────┐
│ undoStack      │                    │ redoStack          │
│ empty?         │─── NO ──────────►  │ pop top →          │
│                │  pop top →         │ push current to    │
│  show toast:   │  push current to   │ undoStack          │
│ "Nothing to    │  redoStack         │ putImageData()     │
│  undo"         │  putImageData()    └────────────────────┘
└────────────────┘
```

#### Stack Rules

| Rule | Detail |
|---|---|
| Max depth | 50 entries (oldest entry is dropped when limit exceeded) |
| What is stored | Full `ImageData` snapshot of the canvas **before** the action |
| When a snapshot is captured | On `mousedown` (before first paint of a stroke), on canvas resize confirm, on flood-fill confirm |
| New action after undo | `redoStack` is **cleared** (linear history — matches Photoshop behavior) |
| Memory estimate | 32×32 canvas @ 50 steps ≈ ~200 KB; 128×128 @ 50 steps ≈ ~3.2 MB (acceptable) |
| History panel | Optional v1.1 feature: list of named history states in the side panel (e.g. "Pencil Stroke", "Resize 32→16", "Flood Fill") |

#### Named Actions (for future History Panel)

| User Action | History Entry Label |
|---|---|
| Single brush stroke | `Pencil` / `Eraser` |
| Flood fill | `Fill — #RRGGBB` |
| Canvas resize | `Canvas Size → W×H` |
| Auto-select repaint | `Recolor — #RRGGBB` |
| Auto-select erase | `Erase Selection` |

---

### 3.8 Export

* Export current canvas state as a `.png` file (preserving transparency)
* Filename defaults to `{original_filename}_recolored.png`

---

## 4. UI Layout

```
/// <summary>
/// Describes the spatial layout of the application.
/// </summary>
```

```
┌──────────────────────────────────────────────────────────────┐
│  [Toolbar: Pencil | Eraser | Picker | Auto-Select | Zoom]    │
├─────────────────────────────────┬────────────────────────────┤
│                                 │  SIDE PANEL                │
│                                 │  ┌──────────────────────┐  │
│         CANVAS AREA             │  │ Active Color         │  │
│                                 │  │  ██  #FF4D6A  R255   │  │
│    (pixel art rendered here)    │  ├──────────────────────┤  │
│                                 │  │ Colors in Artwork    │  │
│                                 │  │  ██ #FF4D6A  42% 512px│ │
│                                 │  │  ██ #A259FF  28% 341px│ │
│                                 │  │  ██ #FFFFFF  18% 219px│ │
│                                 │  │  ░░ Transparent 12%  │  │
│                                 │  ├──────────────────────┤  │
│                                 │  │ Game Color Library   │  │
│                                 │  │  [Not loaded]        │  │
│                                 │  └──────────────────────┘  │
├─────────────────────────────────┴────────────────────────────┤
│  [Load PNG]  [Export PNG]  [Undo]  [Redo]  Zoom: 8×          │
└──────────────────────────────────────────────────────────────┘
```

---

## 5. Technical Specifications

```
/// <summary>
/// Technology stack and implementation constraints.
/// </summary>
```

| Concern | Decision |
|---|---|
| Platform | Browser-based (no install) |
| Rendering | HTML5 `<canvas>` API |
| Language | TypeScript (or vanilla JS) |
| Framework | Vanilla or lightweight (no React required for v1) |
| Pixel manipulation | `ImageData` + `getImageData` / `putImageData` |
| File I/O | `FileReader` API (load), `canvas.toBlob()` (export) |
| State management | In-memory undo stack (array of `ImageData` snapshots) |
| Color format | Internal: RGBA (0–255); Display: HEX + RGB |
| Backend | None required for v1 |

---

## 6. Acceptance Criteria

```
/// <summary>
/// Definition of done for v1 release.
/// </summary>
```

* [x] User can load a `.png` and see it rendered on canvas
* [x] User can paint pixels with the pencil tool
* [x] User can erase pixels to transparent
* [x] User can pick a color from the canvas with the eyedropper
* [x] Auto-detect selects all matching-color pixels and allows bulk repaint
* [x] Side panel shows the correct color list, %, and pixel count after every edit
* [x] Active color swatch updates immediately on eyedropper use
* [x] Undo/Redo works up to 50 steps
* [x] Export produces a correct `.png` with transparency intact
* [x] Game Color Library section exists in UI and displays a "not loaded" state gracefully
* [x] Custom color picker popup with HSV spectrum, hex input (paste/type), RGB inputs, copy button
* [x] Color map right-click remaps all pixels of that color via color picker
* [x] Toolbar and status bar buttons show tooltips on hover
* [x] Button tooltips use CSS `data-tooltip` pseudo-element (no JS)

---

## 7. Out-of-Scope (Future Versions)

* Game Color Library full integration (v2)
* Batch recolor across multiple files
* Palette compliance auto-fix ("snap to nearest library color")
* Cloud storage / project saving
* Layer support
* Animation frame editing

---

## 8. Open Questions

| # | Question | Owner | Status |
|---|---|---|---|
| 1 | What format will the Game Color Library palette be provided in? (JSON, CSV, hardcoded?) | Game Design | Open |
| 2 | Should the tool support spritesheet grids (multiple frames)? | Art Lead | Open |
| 3 | Max expected canvas size (pixels)? Affects performance of `ImageData` scans. | Tech Art | Open |
| 4 | Should color analytics update live (on drag) or on mouseup only? | Art Lead | Open |