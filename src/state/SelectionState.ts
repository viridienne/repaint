import type { AppState } from './AppState'

export class SelectionState {
  private _pixels = new Set<number>()
  private _width = 0

  constructor(private appState: AppState) {}

  setSelection(pixels: Set<number>, width: number): void {
    this._pixels = pixels
    this._width = width
    this.appState.emit('selection:change', { size: pixels.size })
  }

  clear(): void {
    this._pixels.clear()
    this.appState.emit('selection:change', { size: 0 })
  }

  has(x: number, y: number): boolean {
    return this._pixels.has(y * this._width + x)
  }

  get pixels(): Set<number> { return this._pixels }
  get size(): number { return this._pixels.size }
  get width(): number { return this._width }
}
