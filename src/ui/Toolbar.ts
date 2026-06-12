import type { AppState } from '../state/AppState'
import type { ToolType } from '../types'

export class Toolbar {
  private brushSlider: HTMLInputElement
  private brushValueEl: HTMLElement
  private zoomDisplay: HTMLElement

  constructor(private appState: AppState) {
    this.brushSlider = document.getElementById('brush-size') as HTMLInputElement
    this.brushValueEl = document.getElementById('brush-value')!
    this.zoomDisplay = document.getElementById('zoom-display')!

    this.setupToolButtons()
    this.setupBrushSlider()

    appState.on<ToolType>('tool:change', (tool) => this.onToolChange(tool))
    appState.on<number>('brush:change', (size) => this.onBrushChange(size))
    appState.on('viewport:change', (vp: { zoom: number }) => {
      this.zoomDisplay.textContent = `${vp.zoom}×`
    })
  }

  private setupToolButtons(): void {
    document.querySelectorAll<HTMLElement>('.tool-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const tool = btn.dataset.tool as ToolType
        if (tool) this.appState.setTool(tool)
      })
    })
  }

  private setupBrushSlider(): void {
    this.brushSlider.addEventListener('input', () => {
      this.appState.setBrushSize(parseInt(this.brushSlider.value))
    })
  }

  private onToolChange(tool: ToolType): void {
    document.querySelectorAll('.tool-btn').forEach(btn => {
      btn.classList.toggle('active', (btn as HTMLElement).dataset.tool === tool)
    })
    const size = this.appState.getBrushSizeForTool(tool)
    this.brushSlider.value = String(size)
    this.brushValueEl.textContent = String(size)
  }

  private onBrushChange(size: number): void {
    this.brushSlider.value = String(size)
    this.brushValueEl.textContent = String(size)
  }
}
