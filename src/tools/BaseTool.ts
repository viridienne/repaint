import type { CanvasEngine } from '../canvas/CanvasEngine'
import type { Viewport } from '../canvas/Viewport'
import type { AppState } from '../state/AppState'
import type { UndoManager } from '../state/UndoManager'
import type { SelectionState } from '../state/SelectionState'

export interface ToolContext {
  engine: CanvasEngine
  viewport: Viewport
  appState: AppState
  undoManager: UndoManager
  selection: SelectionState
}

export abstract class BaseTool {
  constructor(protected ctx: ToolContext) {}

  abstract onPointerDown(ix: number, iy: number): void
  abstract onPointerMove(ix: number, iy: number): void
  abstract onPointerUp(ix: number, iy: number): void

  onDeactivate(): void {}
  onActivate(): void {}
}
