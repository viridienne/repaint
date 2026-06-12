import type { AppState } from '../state/AppState'
import type { CanvasEngine } from '../canvas/CanvasEngine'
import type { ColorAnalysisResult } from '../types'
import { rgbaCssColor } from '../color/ColorUtils'

export class ColorListPanel {
  private listEl: HTMLElement
  private countEl: HTMLElement

  constructor(
    private appState: AppState,
    private engine: CanvasEngine,
  ) {
    this.listEl = document.getElementById('color-list')!
    this.countEl = document.getElementById('color-count')!
  }

  update(result: ColorAnalysisResult): void {
    const { colors, transparentCount, transparentPercentage } = result

    this.countEl.textContent = `${colors.length} colors`
    this.listEl.innerHTML = ''

    for (const entry of colors) {
      const row = document.createElement('div')
      row.className = 'color-row'
      row.innerHTML = `
        <div class="color-swatch" style="background:${rgbaCssColor(entry.rgba)}"></div>
        <span class="color-row-hex">${entry.hex}</span>
        <span class="color-row-pct">${entry.percentage.toFixed(1)}%</span>
        <span class="color-row-count">${entry.count}px</span>
      `

      row.addEventListener('click', () => {
        this.appState.setColor(entry.rgba)
      })

      row.addEventListener('mouseenter', () => {
        this.engine.setHoverColor(entry.rgba)
      })

      row.addEventListener('mouseleave', () => {
        this.engine.setHoverColor(null)
      })

      this.listEl.appendChild(row)
    }

    if (transparentCount > 0) {
      const row = document.createElement('div')
      row.className = 'color-row color-row-transparent'
      row.innerHTML = `
        <div class="color-swatch color-swatch-transparent"></div>
        <span class="color-row-hex">Transparent</span>
        <span class="color-row-pct">${transparentPercentage.toFixed(1)}%</span>
        <span class="color-row-count">${transparentCount}px</span>
      `
      this.listEl.appendChild(row)
    }

    if (colors.length === 0 && transparentCount === 0) {
      this.listEl.innerHTML = '<div class="color-list-empty">No pixels found</div>'
    }
  }

  clear(): void {
    this.countEl.textContent = '—'
    this.listEl.innerHTML = '<div class="color-list-empty">Load an image to see color stats</div>'
  }
}
