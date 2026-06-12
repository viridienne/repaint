import type { RGBA } from '../types'
import type { Viewport } from './Viewport'
import type { SelectionState } from '../state/SelectionState'
import { GRID_MIN_ZOOM, SELECTION_OVERLAY_ALPHA, HOVER_OVERLAY_ALPHA } from '../constants'

export class CanvasEngine {
  private offscreen: OffscreenCanvas | null = null
  private offCtx: OffscreenCanvasRenderingContext2D | null = null
  private displayCtx: CanvasRenderingContext2D

  private hoverColor: RGBA | null = null

  constructor(
    private displayCanvas: HTMLCanvasElement,
    private viewport: Viewport,
    private selection: SelectionState,
  ) {
    this.displayCtx = displayCanvas.getContext('2d')!
    this.displayCtx.imageSmoothingEnabled = false
  }

  get width(): number { return this.offscreen?.width ?? 0 }
  get height(): number { return this.offscreen?.height ?? 0 }
  get hasImage(): boolean { return this.offscreen !== null }

  loadImageData(imageData: ImageData): void {
    this.offscreen = new OffscreenCanvas(imageData.width, imageData.height)
    this.offCtx = this.offscreen.getContext('2d')!
    this.offCtx.putImageData(imageData, 0, 0)
    this.render()
  }

  getImageData(): ImageData {
    if (!this.offCtx || !this.offscreen) throw new Error('No image loaded')
    return this.offCtx.getImageData(0, 0, this.offscreen.width, this.offscreen.height)
  }

  putImageData(imageData: ImageData): void {
    if (!this.offCtx) throw new Error('No image loaded')
    if (!this.offscreen ||
        this.offscreen.width !== imageData.width ||
        this.offscreen.height !== imageData.height) {
      this.offscreen = new OffscreenCanvas(imageData.width, imageData.height)
      this.offCtx = this.offscreen.getContext('2d')!
    }
    this.offCtx.putImageData(imageData, 0, 0)
    this.render()
  }

  getPixel(x: number, y: number): RGBA | null {
    if (!this.offCtx || !this.offscreen) return null
    if (x < 0 || y < 0 || x >= this.offscreen.width || y >= this.offscreen.height) return null
    const d = this.offCtx.getImageData(x, y, 1, 1).data
    return { r: d[0], g: d[1], b: d[2], a: d[3] }
  }

  setPixel(x: number, y: number, color: RGBA): void {
    if (!this.offCtx || !this.offscreen) return
    if (x < 0 || y < 0 || x >= this.offscreen.width || y >= this.offscreen.height) return
    this.offCtx.fillStyle = `rgba(${color.r},${color.g},${color.b},${color.a / 255})`
    this.offCtx.fillRect(x, y, 1, 1)
  }

  paintBlock(cx: number, cy: number, brushSize: number, color: RGBA): void {
    if (!this.offCtx || !this.offscreen) return
    const half = Math.floor(brushSize / 2)
    const x0 = Math.max(0, cx - half)
    const y0 = Math.max(0, cy - half)
    const x1 = Math.min(this.offscreen.width - 1, cx - half + brushSize - 1)
    const y1 = Math.min(this.offscreen.height - 1, cy - half + brushSize - 1)
    if (x1 < x0 || y1 < y0) return
    const w = x1 - x0 + 1
    const h = y1 - y0 + 1
    this.offCtx.fillStyle = `rgba(${color.r},${color.g},${color.b},${color.a / 255})`
    this.offCtx.fillRect(x0, y0, w, h)
  }

  replaceColor(oldColor: RGBA, newColor: RGBA): void {
    if (!this.offCtx || !this.offscreen) return
    const imageData = this.offCtx.getImageData(0, 0, this.offscreen.width, this.offscreen.height)
    const data = imageData.data
    for (let i = 0; i < data.length; i += 4) {
      if (data[i] === oldColor.r && data[i + 1] === oldColor.g && data[i + 2] === oldColor.b && data[i + 3] === oldColor.a) {
        data[i] = newColor.r
        data[i + 1] = newColor.g
        data[i + 2] = newColor.b
        data[i + 3] = newColor.a
      }
    }
    this.offCtx.putImageData(imageData, 0, 0)
    this.render()
  }

  setHoverColor(color: RGBA | null): void {
    this.hoverColor = color
    this.render()
  }

  render(): void {
    if (!this.offscreen) {
      this.renderEmpty()
      return
    }

    const dw = this.displayCanvas.width
    const dh = this.displayCanvas.height
    const { zoom, panX, panY } = this.viewport
    const iw = this.offscreen.width
    const ih = this.offscreen.height

    this.displayCtx.clearRect(0, 0, dw, dh)

    // Checkerboard background for transparency
    this.drawCheckerboard(panX, panY, iw * zoom, ih * zoom)

    // Image
    this.displayCtx.imageSmoothingEnabled = false
    this.displayCtx.drawImage(this.offscreen, panX, panY, iw * zoom, ih * zoom)

    // Grid overlay
    if (zoom >= GRID_MIN_ZOOM) {
      this.drawGrid(panX, panY, iw, ih, zoom)
    }

    // Selection overlay
    if (this.selection.size > 0) {
      this.drawSelectionOverlay(panX, panY, iw, zoom)
    }

    // Hover highlight
    if (this.hoverColor) {
      this.drawHoverOverlay(panX, panY, iw, ih, zoom, this.hoverColor)
    }
  }

  private renderEmpty(): void {
    const dw = this.displayCanvas.width
    const dh = this.displayCanvas.height
    this.displayCtx.clearRect(0, 0, dw, dh)
  }

  private drawCheckerboard(x: number, y: number, w: number, h: number): void {
    const ctx = this.displayCtx
    const size = 8
    ctx.save()
    ctx.beginPath()
    ctx.rect(x, y, w, h)
    ctx.clip()

    for (let row = 0; row * size < h + size; row++) {
      for (let col = 0; col * size < w + size; col++) {
        ctx.fillStyle = (row + col) % 2 === 0 ? '#2a2a3e' : '#1e1e30'
        ctx.fillRect(x + col * size, y + row * size, size, size)
      }
    }
    ctx.restore()
  }

  private drawGrid(panX: number, panY: number, iw: number, ih: number, zoom: number): void {
    const ctx = this.displayCtx
    ctx.save()
    ctx.strokeStyle = 'rgba(255,255,255,0.08)'
    ctx.lineWidth = 1

    for (let x = 0; x <= iw; x++) {
      const sx = Math.floor(panX + x * zoom) + 0.5
      ctx.beginPath()
      ctx.moveTo(sx, panY)
      ctx.lineTo(sx, panY + ih * zoom)
      ctx.stroke()
    }
    for (let y = 0; y <= ih; y++) {
      const sy = Math.floor(panY + y * zoom) + 0.5
      ctx.beginPath()
      ctx.moveTo(panX, sy)
      ctx.lineTo(panX + iw * zoom, sy)
      ctx.stroke()
    }
    ctx.restore()
  }

  private drawSelectionOverlay(panX: number, panY: number, iw: number, zoom: number): void {
    const ctx = this.displayCtx
    ctx.save()
    ctx.fillStyle = `rgba(0, 220, 255, ${SELECTION_OVERLAY_ALPHA})`
    for (const idx of this.selection.pixels) {
      const px = idx % iw
      const py = Math.floor(idx / iw)
      ctx.fillRect(panX + px * zoom, panY + py * zoom, zoom, zoom)
    }
    ctx.restore()
  }

  private drawHoverOverlay(
    panX: number, panY: number, iw: number, ih: number, zoom: number, color: RGBA
  ): void {
    if (!this.offCtx || !this.offscreen) return
    const ctx = this.displayCtx
    ctx.save()
    ctx.fillStyle = `rgba(255, 255, 0, ${HOVER_OVERLAY_ALPHA})`
    const data = this.getImageData().data
    for (let y = 0; y < ih; y++) {
      for (let x = 0; x < iw; x++) {
        const idx = (y * iw + x) * 4
        if (
          data[idx] === color.r &&
          data[idx + 1] === color.g &&
          data[idx + 2] === color.b &&
          data[idx + 3] === color.a
        ) {
          ctx.fillRect(panX + x * zoom, panY + y * zoom, zoom, zoom)
        }
      }
    }
    ctx.restore()
  }

  resizeCanvas(containerW: number, containerH: number): void {
    this.displayCanvas.width = containerW
    this.displayCanvas.height = containerH
    this.render()
  }
}
