import { ZOOM_STEPS, ZOOM_MIN, ZOOM_MAX } from '../constants'
import type { AppState } from '../state/AppState'

export class Viewport {
  zoom = 1
  panX = 0
  panY = 0

  constructor(private appState: AppState) {}

  screenToImage(sx: number, sy: number): { x: number; y: number } {
    return {
      x: Math.floor((sx - this.panX) / this.zoom),
      y: Math.floor((sy - this.panY) / this.zoom),
    }
  }

  imageToScreen(ix: number, iy: number): { x: number; y: number } {
    return {
      x: ix * this.zoom + this.panX,
      y: iy * this.zoom + this.panY,
    }
  }

  zoomIn(pivotX: number, pivotY: number): void {
    const idx = ZOOM_STEPS.indexOf(this.zoom)
    const next = idx < ZOOM_STEPS.length - 1 ? ZOOM_STEPS[idx + 1] : this.zoom
    this.applyZoom(next, pivotX, pivotY)
  }

  zoomOut(pivotX: number, pivotY: number): void {
    const idx = ZOOM_STEPS.indexOf(this.zoom)
    const next = idx > 0 ? ZOOM_STEPS[idx - 1] : this.zoom
    this.applyZoom(next, pivotX, pivotY)
  }

  private applyZoom(newZoom: number, pivotX: number, pivotY: number): void {
    const ratio = newZoom / this.zoom
    this.panX = pivotX - (pivotX - this.panX) * ratio
    this.panY = pivotY - (pivotY - this.panY) * ratio
    this.zoom = Math.max(ZOOM_MIN, Math.min(ZOOM_MAX, newZoom))
    this.emitChange()
  }

  pan(dx: number, dy: number): void {
    this.panX += dx
    this.panY += dy
    this.emitChange()
  }

  fitToContainer(imgW: number, imgH: number, containerW: number, containerH: number): void {
    const scaleX = containerW / imgW
    const scaleY = containerH / imgH
    const scale = Math.min(scaleX, scaleY, ZOOM_MAX)
    const snapped = ZOOM_STEPS.reduce((prev, cur) =>
      Math.abs(cur - scale) < Math.abs(prev - scale) ? cur : prev
    )
    this.zoom = snapped
    this.panX = Math.round((containerW - imgW * this.zoom) / 2)
    this.panY = Math.round((containerH - imgH * this.zoom) / 2)
    this.emitChange()
  }

  private emitChange(): void {
    this.appState.emit('viewport:change', { zoom: this.zoom, panX: this.panX, panY: this.panY })
  }
}
