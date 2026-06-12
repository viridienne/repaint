import { BaseTool } from './BaseTool'
import type { ToolContext } from './BaseTool'

export class EyedropperTool extends BaseTool {
  constructor(ctx: ToolContext) {
    super(ctx)
  }

  onPointerDown(ix: number, iy: number): void {
    const color = this.ctx.engine.getPixel(ix, iy)
    if (color) {
      this.ctx.appState.setColor(color)
      // Switch back to pencil after picking
      this.ctx.appState.setTool('pencil')
    }
  }

  onPointerMove(_ix: number, _iy: number): void {}
  onPointerUp(_ix: number, _iy: number): void {}
}
