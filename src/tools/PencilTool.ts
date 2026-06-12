import { BaseTool } from './BaseTool'
import type { ToolContext } from './BaseTool'

export class PencilTool extends BaseTool {
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

    if (this.ctx.selection.size > 0) {
      this.fillSelection()
    } else {
      this.paint(ix, iy)
    }

    this.ctx.engine.render()
  }

  onPointerMove(ix: number, iy: number): void {
    if (!this.drawing) return
    if (this.ctx.selection.size > 0) return
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

  private paint(x: number, y: number): void {
    const color = this.ctx.appState.activeColor
    const size = this.ctx.appState.brushSize
    this.ctx.engine.paintBlock(x, y, size, color)
  }

  private fillSelection(): void {
    const color = this.ctx.appState.activeColor
    for (const idx of this.ctx.selection.pixels) {
      const x = idx % this.ctx.selection.width
      const y = Math.floor(idx / this.ctx.selection.width)
      this.ctx.engine.setPixel(x, y, color)
    }
    this.ctx.selection.clear()
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
      this.paint(x, y)
      if (x === x1 && y === y1) break
      const e2 = 2 * err
      if (e2 > -dy) { err -= dy; x += sx }
      if (e2 < dx) { err += dx; y += sy }
    }
  }
}
