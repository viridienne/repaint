import { BaseTool } from './BaseTool'
import type { ToolContext } from './BaseTool'
import type { RGBA } from '../types'

function rgbaEqual(a: RGBA, b: RGBA): boolean {
  return a.r === b.r && a.g === b.g && a.b === b.b && a.a === b.a
}

export class AutoSelectTool extends BaseTool {
  constructor(ctx: ToolContext) {
    super(ctx)
  }

  onPointerDown(ix: number, iy: number): void {
    const color = this.ctx.engine.getPixel(ix, iy)
    if (!color) return

    const imageData = this.ctx.engine.getImageData()
    const { width, height, data } = imageData
    const pixels = new Set<number>()

    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const idx = (y * width + x) * 4
        const px: RGBA = { r: data[idx], g: data[idx + 1], b: data[idx + 2], a: data[idx + 3] }
        if (rgbaEqual(px, color)) {
          pixels.add(y * width + x)
        }
      }
    }

    this.ctx.selection.setSelection(pixels, width)
    this.ctx.engine.render()
  }

  onPointerMove(_ix: number, _iy: number): void {}
  onPointerUp(_ix: number, _iy: number): void {}

  onDeactivate(): void {
    this.ctx.selection.clear()
    this.ctx.engine.render()
  }

  repaintSelection(newColor: RGBA): void {
    if (this.ctx.selection.size === 0) return
    this.ctx.undoManager.push(this.ctx.engine.getImageData())

    const imageData = this.ctx.engine.getImageData()
    const { data } = imageData

    for (const pos of this.ctx.selection.pixels) {
      const idx = pos * 4
      data[idx] = newColor.r
      data[idx + 1] = newColor.g
      data[idx + 2] = newColor.b
      data[idx + 3] = newColor.a
    }

    this.ctx.engine.putImageData(imageData)
    this.ctx.selection.clear()
  }

  eraseSelection(): void {
    if (this.ctx.selection.size === 0) return
    this.ctx.undoManager.push(this.ctx.engine.getImageData())

    const imageData = this.ctx.engine.getImageData()
    const { data } = imageData

    for (const pos of this.ctx.selection.pixels) {
      const idx = pos * 4
      data[idx] = 0
      data[idx + 1] = 0
      data[idx + 2] = 0
      data[idx + 3] = 0
    }

    this.ctx.engine.putImageData(imageData)
    this.ctx.selection.clear()
  }
}
