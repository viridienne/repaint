# Repaint — Pixel Art Recolor

A browser-based tool for editing and recoloring pixel art sprites.

**Live:** https://repaint-iota.vercel.app

---

## Features

- **Load PNG** — drag & drop or file picker
- **Pencil** — draw pixels at any brush size (1–32px); fills selection if active
- **Eraser** — erase to transparent; clears selection if active
- **Eyedropper** — pick color from canvas
- **Auto Select** — select all pixels of same color
- **Rectangular Selection** — right-click drag to select area; click color to fill
- **Flood Fill** — bucket fill connected region
- **Color palette** — live list of all colors in artwork with pixel counts; X button deletes color
- **Game Color Library** — build and manage a named color palette
  - **+ ADD** — add colors via HSV picker with custom names
  - **SAVE/IMPORT** — export/import library as JSON
  - **Click swatch** — set as active color; fills selection if active
  - **Right-click swatch** — edit color using picker
  - **Out-of-palette warnings** — artwork colors not in library show ⚠ badge
  - **Picker presets** — library colors appear as quick-pick presets in color picker popup
  - **localStorage** — library persists across sessions
- **Resize** — resize canvas with presets (8×8 up to 128×128) or custom dimensions, with aspect ratio lock
- **Undo / Redo** — full history (Ctrl+Z / Ctrl+Y)
- **Export PNG** — save result

## Keyboard Shortcuts

| Key | Tool |
|-----|------|
| `B` | Pencil |
| `E` | Eraser |
| `I` | Eyedropper |
| `W` | Auto Select |
| `Escape` | Clear Selection |
| `Ctrl+Z` | Undo |
| `Ctrl+Y` | Redo |

Scroll to zoom. Middle-click or Space+drag to pan.

## Stack

Vanilla TypeScript + Vite. No runtime dependencies.

## Dev

```bash
npm install
npm run dev
```

## Build

```bash
npm run build   # outputs to dist/
```

## Deploy

```bash
npm i -g vercel
vercel
```
