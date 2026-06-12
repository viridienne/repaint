import type { AppState } from '../state/AppState'
import type { Viewport } from '../canvas/Viewport'

export class BrushPreview {
  private cursorCanvas: HTMLCanvasElement
  private ctx: CanvasRenderingContext2D
  private mouseX = 0
  private mouseY = 0
  private visible = false

  constructor(
    private appState: AppState,
    private viewport: Viewport,
    displayCanvas: HTMLCanvasElement,
  ) {
    this.cursorCanvas = document.getElementById('brush-cursor-canvas') as HTMLCanvasElement
    this.ctx = this.cursorCanvas.getContext('2d')!

    displayCanvas.addEventListener('mousemove', (e) => {
      const rect = displayCanvas.getBoundingClientRect()
      this.mouseX = e.clientX - rect.left
      this.mouseY = e.clientY - rect.top
      this.render()
    })

    displayCanvas.addEventListener('mouseenter', () => {
      this.visible = true
      this.render()
    })

    displayCanvas.addEventListener('mouseleave', () => {
      this.visible = false
      this.clear()
    })

    appState.on('brush:change', () => this.render())
    appState.on('viewport:change', () => this.render())
  }

  resize(w: number, h: number): void {
    this.cursorCanvas.width = w
    this.cursorCanvas.height = h
    this.render()
  }

  private render(): void {
    this.clear()
    if (!this.visible) return

    const tool = this.appState.activeTool
    if (tool === 'eyedropper' || tool === 'autoselect') return

    const size = this.appState.brushSize
    const zoom = this.viewport.zoom
    const half = Math.floor(size / 2)

    const { x: ix, y: iy } = this.viewport.screenToImage(this.mouseX, this.mouseY)
    const topLeft = this.viewport.imageToScreen(ix - half, iy - half)

    const px = topLeft.x
    const py = topLeft.y
    const pw = size * zoom
    const ph = size * zoom

    this.ctx.strokeStyle = 'rgba(255,255,255,0.9)'
    this.ctx.lineWidth = 1
    this.ctx.strokeRect(px + 0.5, py + 0.5, pw, ph)

    this.ctx.strokeStyle = 'rgba(0,0,0,0.5)'
    this.ctx.strokeRect(px - 0.5, py - 0.5, pw + 2, ph + 2)
  }

  private clear(): void {
    this.ctx.clearRect(0, 0, this.cursorCanvas.width, this.cursorCanvas.height)
  }
}
