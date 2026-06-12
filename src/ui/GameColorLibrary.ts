import { AppState } from '../state/AppState'
import type { CanvasEngine } from '../canvas/CanvasEngine'
import type { UndoManager } from '../state/UndoManager'
import type { SelectionState } from '../state/SelectionState'
import type { LibraryColor, RGBA } from '../types'
import { getColorPicker } from './ColorPickerPopup'
import { rgbaToHex, hexToRgba } from '../color/ColorUtils'
import { showToast } from './Toast'

export class GameColorLibrary {
  private container: HTMLElement
  private addBtn: HTMLButtonElement
  private saveBtn: HTMLButtonElement
  private importBtn: HTMLButtonElement
  private fileInput: HTMLInputElement
  private nameDialog: HTMLElement
  private nameInput: HTMLInputElement
  private namePreview: HTMLElement
  private nameCancel: HTMLButtonElement
  private nameConfirm: HTMLButtonElement
  private appState: AppState
  private engine: CanvasEngine
  private undoManager: UndoManager
  private selection: SelectionState
  private onAnalyticsChange: () => void
  private pendingColor: string | null = null

  constructor(
    appState: AppState,
    engine: CanvasEngine,
    undoManager: UndoManager,
    selection: SelectionState,
    onAnalyticsChange: () => void
  ) {
    this.appState = appState
    this.engine = engine
    this.undoManager = undoManager
    this.selection = selection
    this.onAnalyticsChange = onAnalyticsChange

    this.container = document.getElementById('game-color-library')!
    this.addBtn = document.getElementById('library-add-btn') as HTMLButtonElement
    this.saveBtn = document.getElementById('library-save-btn') as HTMLButtonElement
    this.importBtn = document.getElementById('library-import-btn') as HTMLButtonElement
    this.fileInput = document.getElementById('library-file-input') as HTMLInputElement
    this.nameDialog = document.getElementById('library-name-dialog')!
    this.nameInput = document.getElementById('library-name-input') as HTMLInputElement
    this.namePreview = document.getElementById('library-name-preview')!
    this.nameCancel = document.getElementById('library-name-cancel') as HTMLButtonElement
    this.nameConfirm = document.getElementById('library-name-confirm') as HTMLButtonElement

    this.bindEvents()
    this.render()
  }

  private bindEvents(): void {
    this.appState.on('library:change', () => this.render())

    this.addBtn.addEventListener('click', () => this.handleAdd())
    this.saveBtn.addEventListener('click', () => this.handleSave())
    this.importBtn.addEventListener('click', () => this.fileInput.click())
    this.fileInput.addEventListener('change', () => this.handleImport())

    this.nameCancel.addEventListener('click', () => this.hideNameDialog())
    this.nameConfirm.addEventListener('click', () => this.handleNameConfirm())
    this.nameInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') this.handleNameConfirm()
      if (e.key === 'Escape') this.hideNameDialog()
    })

    this.nameDialog.addEventListener('click', (e) => {
      if (e.target === this.nameDialog) this.hideNameDialog()
    })
  }

  private render(): void {
    const library = this.appState.library

    if (library.length === 0) {
      this.container.innerHTML = `
        <div class="library-empty">
          <span class="library-empty-icon">◈</span>
          <span>No colors in library.</span>
          <span class="library-hint">Click + ADD to begin.</span>
        </div>
      `
      this.saveBtn.disabled = true
    } else {
      this.container.innerHTML = library
        .map(
          (color) => `
        <div class="library-swatch" data-id="${color.id}">
          <div class="library-swatch-color" style="background-color: ${color.hex};"></div>
          <span class="library-swatch-name" title="${color.name}">${color.name}</span>
          <button class="library-swatch-delete" data-id="${color.id}">×</button>
        </div>
      `
        )
        .join('')

      this.saveBtn.disabled = false

      // Bind delete buttons
      this.container.querySelectorAll('.library-swatch-delete').forEach((btn) => {
        btn.addEventListener('click', (e) => {
          e.stopPropagation()
          const id = (e.target as HTMLElement).dataset.id!
          this.appState.removeFromLibrary(id)
        })
      })

      // Bind click to set active color / fill selection
      this.container.querySelectorAll('.library-swatch').forEach((swatchEl) => {
        swatchEl.addEventListener('click', (e) => {
          if ((e.target as HTMLElement).classList.contains('library-swatch-delete')) return

          const id = (swatchEl as HTMLElement).dataset.id!
          const color = this.appState.library.find(c => c.id === id)
          if (!color) return

          const rgba = hexToRgba(color.hex)
          this.appState.setColor(rgba)

          if (this.selection.size > 0) {
            this.undoManager.push(this.engine.getImageData())
            this.fillSelection(rgba)
            this.onAnalyticsChange()
          }
        })

        // Bind right-click to edit library color
        swatchEl.addEventListener('contextmenu', (e) => {
          e.preventDefault()
          const id = (swatchEl as HTMLElement).dataset.id!
          const color = this.appState.library.find(c => c.id === id)
          if (!color) return

          const rgba = hexToRgba(color.hex)

          getColorPicker().show(
            swatchEl as HTMLElement,
            rgba,
            (newRgba) => {
              const newHex = rgbaToHex(newRgba)

              // Update visual preview
              const colorDiv = swatchEl.querySelector('.library-swatch-color') as HTMLElement
              if (colorDiv) colorDiv.style.backgroundColor = newHex

              // Update library entry
              const updated = { ...color, hex: newHex }
              const newLibrary = this.appState.library.map(c => c.id === id ? updated : c)
              this.appState.setLibrary(newLibrary)
            },
            () => {
              if (this.engine.hasImage) {
                this.onAnalyticsChange()
              }
            }
          )
        })
      })
    }
  }

  private handleAdd(): void {
    const picker = getColorPicker()
    const seedColor = this.appState.activeColor

    picker.show(
      this.addBtn,
      seedColor,
      (rgba) => {
        this.pendingColor = rgbaToHex(rgba)
        this.namePreview.style.backgroundColor = this.pendingColor
      },
      () => {
        if (this.pendingColor) {
          this.showNameDialog()
        }
      }
    )
  }

  private showNameDialog(): void {
    this.nameDialog.classList.remove('hidden')
    this.nameInput.value = ''
    this.nameInput.focus()
    if (this.pendingColor) {
      this.namePreview.style.backgroundColor = this.pendingColor
    }
  }

  private hideNameDialog(): void {
    this.nameDialog.classList.add('hidden')
    this.pendingColor = null
    this.nameInput.value = ''
  }

  private handleNameConfirm(): void {
    const name = this.nameInput.value.trim()
    if (!name || !this.pendingColor) return

    const color: LibraryColor = {
      id: Date.now().toString(),
      name,
      hex: this.pendingColor,
    }

    this.appState.addToLibrary(color)
    this.hideNameDialog()
    showToast(`Added "${name}" to library`, 'success')
  }

  private handleSave(): void {
    const library = this.appState.library
    if (library.length === 0) return

    const json = JSON.stringify(library, null, 2)
    const blob = new Blob([json], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'color-library.json'
    a.click()
    URL.revokeObjectURL(url)

    showToast('Library saved to JSON', 'success')
  }

  private handleImport(): void {
    const file = this.fileInput.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        const json = e.target?.result as string
        const parsed = JSON.parse(json)

        if (!Array.isArray(parsed)) {
          throw new Error('Invalid format: expected array')
        }

        const validated = parsed.filter(
          (c) =>
            c &&
            typeof c.id === 'string' &&
            typeof c.name === 'string' &&
            typeof c.hex === 'string' &&
            /^#[0-9A-Fa-f]{6}$/.test(c.hex)
        )

        if (validated.length === 0) {
          throw new Error('No valid colors found')
        }

        this.appState.setLibrary(validated)
        showToast(`Imported ${validated.length} colors`, 'success')
      } catch (err) {
        showToast(`Import failed: ${(err as Error).message}`, 'error')
      }
    }

    reader.onerror = () => {
      showToast('Failed to read file', 'error')
    }

    reader.readAsText(file)
    this.fileInput.value = ''
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
