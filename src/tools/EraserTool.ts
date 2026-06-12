import { BaseTool } from './BaseTool'
import type { ToolContext } from './BaseTool'

const TRANSPARENT = { r: 0, g: 0, b: 0, a: 0 }

export class EraserTool extends BaseTool {
  private drawing = false
  private prevX = -1
  private prevY = -1

  constructor(ctx: ToolContext) {
    super(ctx)
  }

  onPointerDown(ix: number, iy: number): void {
    this.drawing = true
    this.prevX = ix
    this.prevY = iy
    this.ctx.undoManager.push(this.ctx.engine.getImageData())
    this.erase(ix, iy)
    this.ctx.engine.render()
  }

  onPointerMove(ix: number, iy: number): void {
    if (!this.drawing) return
    this.bresenham(this.prevX, this.prevY, ix, iy)
    this.prevX = ix
    this.prevY = iy
    this.ctx.engine.render()
  }

  onPointerUp(_ix: number, _iy: number): void {
    this.drawing = false
    this.prevX = -1
    this.prevY = -1
  }

  private erase(x: number, y: number): void {
    const size = this.ctx.appState.brushSize
    this.ctx.engine.paintBlock(x, y, size, TRANSPARENT)
  }

  private bresenham(x0: number, y0: number, x1: number, y1: number): void {
    const dx = Math.abs(x1 - x0)
    const dy = Math.abs(y1 - y0)
    const sx = x0 < x1 ? 1 : -1
    const sy = y0 < y1 ? 1 : -1
    let err = dx - dy
    let x = x0
    let y = y0

    while (true) {
      this.erase(x, y)
      if (x === x1 && y === y1) break
      const e2 = 2 * err
      if (e2 > -dy) { err -= dy; x += sx }
      if (e2 < dx) { err += dx; y += sy }
    }
  }
}
