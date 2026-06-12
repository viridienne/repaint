import { MAX_UNDO_STEPS } from '../constants'
import type { AppState } from './AppState'

export class UndoManager {
  private undoStack: ImageData[] = []
  private redoStack: ImageData[] = []

  constructor(private state: AppState) {}

  push(snapshot: ImageData): void {
    this.redoStack = []
    this.undoStack.push(snapshot)
    if (this.undoStack.length > MAX_UNDO_STEPS) {
      this.undoStack.shift()
    }
    this.notifyChange()
  }

  undo(currentSnapshot: ImageData): ImageData | null {
    if (this.undoStack.length === 0) return null
    this.redoStack.push(currentSnapshot)
    const prev = this.undoStack.pop()!
    this.notifyChange()
    return prev
  }

  redo(currentSnapshot: ImageData): ImageData | null {
    if (this.redoStack.length === 0) return null
    this.undoStack.push(currentSnapshot)
    const next = this.redoStack.pop()!
    this.notifyChange()
    return next
  }

  clear(): void {
    this.undoStack = []
    this.redoStack = []
    this.notifyChange()
  }

  get canUndo(): boolean { return this.undoStack.length > 0 }
  get canRedo(): boolean { return this.redoStack.length > 0 }

  private notifyChange(): void {
    this.state.emit('history:change', { canUndo: this.canUndo, canRedo: this.canRedo })
  }
}
