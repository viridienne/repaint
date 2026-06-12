import './styles/reset.css'
import './styles/theme.css'
import './styles/layout.css'
import './styles/toolbar.css'
import './styles/sidepanel.css'
import './styles/dialog.css'
import './styles/canvas.css'
import './styles/colorpicker.css'

import { AppState } from './state/AppState'
import { UndoManager } from './state/UndoManager'
import { SelectionState } from './state/SelectionState'
import { Viewport } from './canvas/Viewport'
import { CanvasEngine } from './canvas/CanvasEngine'
import { ToolManager } from './tools/ToolManager'
import { Toolbar } from './ui/Toolbar'
import { StatusBar } from './ui/StatusBar'
import { BrushPreview } from './ui/BrushPreview'
import { ActiveColorDisplay } from './ui/ActiveColorDisplay'
import { ColorListPanel } from './ui/ColorListPanel'
import { ResizeDialog } from './ui/ResizeDialog'
import { loadImageFromFile } from './io/FileLoader'
import { exportToPng } from './io/FileExporter'
import { analyzeColors } from './color/ColorAnalytics'
import { showToast } from './ui/Toast'

// --- Bootstrap ---

const appState = new AppState()
const undoManager = new UndoManager(appState)
const selection = new SelectionState(appState)

const displayCanvas = document.getElementById('display-canvas') as HTMLCanvasElement
const canvasContainer = document.getElementById('canvas-container')!

const viewport = new Viewport(appState)
const engine = new CanvasEngine(displayCanvas, viewport, selection)

const toolCtx = { engine, viewport, appState, undoManager, selection }
const toolManager = new ToolManager(toolCtx)

new Toolbar(appState)
const statusBar = new StatusBar(appState, engine)
const brushPreview = new BrushPreview(appState, viewport, displayCanvas)
new ActiveColorDisplay(appState)
const colorList = new ColorListPanel(appState, engine, undoManager, updateAnalytics)
const resizeDialog = new ResizeDialog(engine, undoManager)

let currentFilename = 'image'

// --- Canvas sizing ---

function resizeDisplayCanvas(): void {
  const w = canvasContainer.clientWidth
  const h = canvasContainer.clientHeight
  engine.resizeCanvas(w, h)
  brushPreview.resize(w, h)
}

const ro = new ResizeObserver(() => resizeDisplayCanvas())
ro.observe(canvasContainer)
resizeDisplayCanvas()

// --- Image loading ---

function onImageLoaded(imageData: ImageData, filename: string): void {
  currentFilename = filename.replace(/\.png$/i, '')
  engine.loadImageData(imageData)
  undoManager.clear()
  appState.setHasImage(true)
  viewport.fitToContainer(imageData.width, imageData.height, canvasContainer.clientWidth, canvasContainer.clientHeight)
  engine.render()
  colorList.update(analyzeColors(imageData))
  statusBar.updateCanvasSize(imageData.width, imageData.height)
  document.getElementById('empty-state')!.classList.add('hidden')
}

function triggerLoad(): void {
  const input = document.getElementById('file-input') as HTMLInputElement
  input.value = ''
  input.click()
}

document.getElementById('file-input')!.addEventListener('change', async (e) => {
  const file = (e.target as HTMLInputElement).files?.[0]
  if (!file) return
  try {
    const { imageData, filename } = await loadImageFromFile(file)
    onImageLoaded(imageData, filename)
  } catch (err) {
    showToast(String(err), 'error')
  }
})

// Load buttons
statusBar.onLoad.addEventListener('click', triggerLoad)
document.getElementById('empty-load-btn')!.addEventListener('click', triggerLoad)

// Export
statusBar.onExport.addEventListener('click', () => {
  if (!engine.hasImage) return
  exportToPng(engine.getImageData(), `${currentFilename}_recolored.png`)
  showToast('Exported PNG')
})

// --- Undo / Redo ---

statusBar.onUndo.addEventListener('click', doUndo)
statusBar.onRedo.addEventListener('click', doRedo)

function doUndo(): void {
  if (!engine.hasImage) return
  const prev = undoManager.undo(engine.getImageData())
  if (!prev) { showToast('Nothing to undo', 'info'); return }
  engine.putImageData(prev)
  updateAnalytics()
}

function doRedo(): void {
  if (!engine.hasImage) return
  const next = undoManager.redo(engine.getImageData())
  if (!next) return
  engine.putImageData(next)
  updateAnalytics()
}

// --- Resize ---

statusBar.onResize.addEventListener('click', () => {
  if (!engine.hasImage) return
  resizeDialog.show((w, h) => {
    statusBar.updateCanvasSize(w, h)
    viewport.fitToContainer(w, h, canvasContainer.clientWidth, canvasContainer.clientHeight)
    engine.render()
    updateAnalytics()
  })
})

// --- Color analytics refresh ---

function updateAnalytics(): void {
  if (!engine.hasImage) return
  colorList.update(analyzeColors(engine.getImageData()))
}

// Refresh after each tool stroke
displayCanvas.addEventListener('pointerup', () => {
  if (engine.hasImage) updateAnalytics()
})

// --- Canvas pointer events ---

let isPanning = false
let lastPanX = 0
let lastPanY = 0
let isSpaceDown = false

displayCanvas.addEventListener('pointerdown', (e) => {
  displayCanvas.setPointerCapture(e.pointerId)

  if (e.button === 1 || isSpaceDown) {
    isPanning = true
    lastPanX = e.clientX
    lastPanY = e.clientY
    return
  }

  if (e.button === 0 && engine.hasImage) {
    const rect = displayCanvas.getBoundingClientRect()
    toolManager.onPointerDown(e.clientX - rect.left, e.clientY - rect.top)
  }
})

displayCanvas.addEventListener('pointermove', (e) => {
  const rect = displayCanvas.getBoundingClientRect()
  const sx = e.clientX - rect.left
  const sy = e.clientY - rect.top

  if (isPanning) {
    viewport.pan(e.clientX - lastPanX, e.clientY - lastPanY)
    lastPanX = e.clientX
    lastPanY = e.clientY
    engine.render()
    return
  }

  if (engine.hasImage) {
    const { x, y } = viewport.screenToImage(sx, sy)
    statusBar.setCursorPos(x, y)
    toolManager.onPointerMove(sx, sy)
  }
})

displayCanvas.addEventListener('pointerup', (e) => {
  if (isPanning) {
    isPanning = false
    return
  }
  if (e.button === 0 && engine.hasImage) {
    const rect = displayCanvas.getBoundingClientRect()
    toolManager.onPointerUp(e.clientX - rect.left, e.clientY - rect.top)
  }
})

displayCanvas.addEventListener('mouseleave', () => {
  statusBar.clearCursorPos()
})

// Scroll zoom
displayCanvas.addEventListener('wheel', (e) => {
  e.preventDefault()
  const rect = displayCanvas.getBoundingClientRect()
  const px = e.clientX - rect.left
  const py = e.clientY - rect.top
  if (e.deltaY < 0) {
    viewport.zoomIn(px, py)
  } else {
    viewport.zoomOut(px, py)
  }
  engine.render()
}, { passive: false })

// Space pan
window.addEventListener('keydown', (e) => {
  if (e.code === 'Space' && !e.repeat) {
    isSpaceDown = true
    displayCanvas.style.cursor = 'grab'
    e.preventDefault()
  }
})

window.addEventListener('keyup', (e) => {
  if (e.code === 'Space') {
    isSpaceDown = false
    displayCanvas.style.cursor = ''
  }
})

// --- Keyboard shortcuts ---

window.addEventListener('keydown', (e) => {
  // Don't intercept when typing in inputs
  if (e.target instanceof HTMLInputElement || e.target instanceof HTMLSelectElement) return

  if (e.ctrlKey || e.metaKey) {
    if (e.key === 'z') { e.preventDefault(); doUndo(); return }
    if (e.key === 'y') { e.preventDefault(); doRedo(); return }
  }

  switch (e.key) {
    case 'b': case 'B': appState.setTool('pencil'); break
    case 'e': case 'E': appState.setTool('eraser'); break
    case 'i': case 'I': appState.setTool('eyedropper'); break
    case 'w': case 'W': appState.setTool('autoselect'); break
    case '[': appState.setBrushSize(appState.brushSize - 1); break
    case ']': appState.setBrushSize(appState.brushSize + 1); break
  }
})

// --- Drag & drop ---

const dropOverlay = document.getElementById('drop-overlay')!

window.addEventListener('dragover', (e) => {
  e.preventDefault()
  dropOverlay.classList.remove('hidden')
})

window.addEventListener('dragleave', (e) => {
  if (!e.relatedTarget || !(e.relatedTarget as Node).isConnected) {
    dropOverlay.classList.add('hidden')
  }
})

window.addEventListener('drop', async (e) => {
  e.preventDefault()
  dropOverlay.classList.add('hidden')
  const file = e.dataTransfer?.files[0]
  if (!file) return
  try {
    const { imageData, filename } = await loadImageFromFile(file)
    onImageLoaded(imageData, filename)
  } catch (err) {
    showToast(String(err), 'error')
  }
})

