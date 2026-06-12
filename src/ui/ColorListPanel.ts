import type { AppState } from '../state/AppState'
import type { CanvasEngine } from '../canvas/CanvasEngine'
import type { UndoManager } from '../state/UndoManager'
import type { SelectionState } from '../state/SelectionState'
import type { ColorAnalysisResult } from '../types'
import type { RGBA } from '../types'
import { rgbaCssColor } from '../color/ColorUtils'
import { getColorPicker } from './ColorPickerPopup'

export class ColorListPanel {
  private listEl: HTMLElement
  private countEl: HTMLElement
  private onAnalyticsChange: (() => void) | null = null

  constructor(
    private appState: AppState,
    private engine: CanvasEngine,
    private undoManager: UndoManager,
    private selection: SelectionState,
    onAnalyticsChange: () => void,
  ) {
    this.listEl = document.getElementById('color-list')!
    this.countEl = document.getElementById('color-count')!
    this.onAnalyticsChange = onAnalyticsChange

    this.appState.on('library:change', () => {
      this.onAnalyticsChange?.()
    })
  }

  update(result: ColorAnalysisResult): void {
    const { colors, transparentCount, transparentPercentage } = result

    this.countEl.textContent = `${colors.length} colors`
    this.listEl.innerHTML = ''

    const libraryHexSet = new Set(this.appState.library.map(c => c.hex.toUpperCase()))

    for (const entry of colors) {
      const row = document.createElement('div')
      row.className = 'color-row'

      const swatchEl = document.createElement('div')
      swatchEl.className = 'color-swatch color-swatch-editable'
      swatchEl.style.background = rgbaCssColor(entry.rgba)

      const inLibrary = libraryHexSet.size === 0 || libraryHexSet.has(entry.hex.toUpperCase())
      const badge = !inLibrary ? '<span class="out-of-palette" title="Not in library"></span>' : ''

      row.appendChild(swatchEl)
      row.insertAdjacentHTML('beforeend', `
        <span class="color-row-hex">${entry.hex}${badge}</span>
        <span class="color-row-pct">${entry.percentage.toFixed(1)}%</span>
        <span class="color-row-count">${entry.count}px</span>
      `)

      const removeBtn = document.createElement('button')
      removeBtn.className = 'color-row-remove'
      removeBtn.textContent = '×'
      removeBtn.title = 'Remove this color (make transparent)'
      removeBtn.addEventListener('click', (e) => {
        e.stopPropagation()
        this.undoManager.push(this.engine.getImageData())
        this.engine.deleteColor(entry.rgba)
        this.onAnalyticsChange?.()
      })
      row.appendChild(removeBtn)

      row.addEventListener('click', () => {
        this.appState.setColor(entry.rgba)

        if (this.selection.size > 0) {
          this.undoManager.push(this.engine.getImageData())
          this.fillSelection(entry.rgba)
          this.onAnalyticsChange?.()
        }
      })

      row.addEventListener('contextmenu', (e) => {
        e.preventDefault()
        let snapshot: ImageData | null = null
        let currentColor = entry.rgba
        getColorPicker().show(swatchEl, entry.rgba, (newColor: RGBA) => {
          if (!snapshot) snapshot = this.engine.getImageData()
          this.engine.replaceColor(currentColor, newColor)
          currentColor = newColor
          swatchEl.style.background = rgbaCssColor(newColor)
        }, () => {
          if (snapshot) {
            this.undoManager.push(snapshot)
            this.onAnalyticsChange?.()
          }
        })
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

  private fillSelection(color: RGBA): void {
    for (const idx of this.selection.pixels) {
      const x = idx % this.selection.width
      const y = Math.floor(idx / this.selection.width)
      this.engine.setPixel(x, y, color)
    }
    this.selection.clear()
    this.engine.render()
  }
}
