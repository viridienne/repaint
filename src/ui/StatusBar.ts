import type { AppState } from '../state/AppState'
import type { CanvasEngine } from '../canvas/CanvasEngine'

export class StatusBar {
  private loadBtn: HTMLButtonElement
  private exportBtn: HTMLButtonElement
  private undoBtn: HTMLButtonElement
  private redoBtn: HTMLButtonElement
  private resizeBtn: HTMLButtonElement
  private canvasSizeEl: HTMLElement
  private cursorPosEl: HTMLElement

  constructor(appState: AppState, engine: CanvasEngine) {
    this.loadBtn = document.getElementById('load-btn') as HTMLButtonElement
    this.exportBtn = document.getElementById('export-btn') as HTMLButtonElement
    this.undoBtn = document.getElementById('undo-btn') as HTMLButtonElement
    this.redoBtn = document.getElementById('redo-btn') as HTMLButtonElement
    this.resizeBtn = document.getElementById('resize-btn') as HTMLButtonElement
    this.canvasSizeEl = document.getElementById('canvas-size')!
    this.cursorPosEl = document.getElementById('cursor-pos')!

    appState.on<boolean>('image:load', (has) => {
      this.exportBtn.disabled = !has
      this.resizeBtn.disabled = !has
      if (has) {
        this.canvasSizeEl.textContent = `${engine.width} × ${engine.height}px`
      } else {
        this.canvasSizeEl.textContent = '—'
      }
    })

    appState.on('history:change', (data: { canUndo: boolean; canRedo: boolean }) => {
      this.undoBtn.disabled = !data.canUndo
      this.redoBtn.disabled = !data.canRedo
    })
  }

  setCursorPos(x: number, y: number): void {
    this.cursorPosEl.textContent = `${x}, ${y}`
  }

  clearCursorPos(): void {
    this.cursorPosEl.textContent = '—'
  }

  updateCanvasSize(w: number, h: number): void {
    this.canvasSizeEl.textContent = `${w} × ${h}px`
  }

  get onLoad(): HTMLButtonElement { return this.loadBtn }
  get onExport(): HTMLButtonElement { return this.exportBtn }
  get onUndo(): HTMLButtonElement { return this.undoBtn }
  get onRedo(): HTMLButtonElement { return this.redoBtn }
  get onResize(): HTMLButtonElement { return this.resizeBtn }
}
