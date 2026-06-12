import type { BaseTool, ToolContext } from './BaseTool'
import { PencilTool } from './PencilTool'
import { EraserTool } from './EraserTool'
import { EyedropperTool } from './EyedropperTool'
import { AutoSelectTool } from './AutoSelectTool'
import type { ToolType } from '../types'

export class ToolManager {
  private tools: Map<ToolType, BaseTool>
  private _active: BaseTool

  readonly pencil: PencilTool
  readonly eraser: EraserTool
  readonly autoSelect: AutoSelectTool

  constructor(private toolCtx: ToolContext) {
    this.pencil = new PencilTool(toolCtx)
    this.eraser = new EraserTool(toolCtx)
    this.autoSelect = new AutoSelectTool(toolCtx)

    this.tools = new Map<ToolType, BaseTool>([
      ['pencil', this.pencil],
      ['eraser', this.eraser],
      ['eyedropper', new EyedropperTool(toolCtx)],
      ['autoselect', this.autoSelect],
    ])

    this._active = this.pencil

    toolCtx.appState.on<ToolType>('tool:change', (tool) => {
      this._active.onDeactivate()
      this._active = this.tools.get(tool) ?? this.pencil
      this._active.onActivate()
    })
  }

  get active(): BaseTool { return this._active }

  onPointerDown(sx: number, sy: number): void {
    const { x, y } = this.toolCtx.viewport.screenToImage(sx, sy)
    this._active.onPointerDown(x, y)
  }

  onPointerMove(sx: number, sy: number): void {
    const { x, y } = this.toolCtx.viewport.screenToImage(sx, sy)
    this._active.onPointerMove(x, y)
  }

  onPointerUp(sx: number, sy: number): void {
    const { x, y } = this.toolCtx.viewport.screenToImage(sx, sy)
    this._active.onPointerUp(x, y)
  }
}
