import type { CanvasEngine } from '../canvas/CanvasEngine'
import type { UndoManager } from '../state/UndoManager'
import { showToast } from './Toast'

export class ResizeDialog {
  private overlay: HTMLElement
  private widthInput: HTMLInputElement
  private heightInput: HTMLInputElement
  private preset: HTMLSelectElement
  private lockCheckbox: HTMLInputElement
  private warning: HTMLElement
  private onConfirmCallback?: (w: number, h: number) => void

  private origW = 0
  private origH = 0

  constructor(
    private engine: CanvasEngine,
    private undoManager: UndoManager,
  ) {
    this.overlay = document.getElementById('resize-dialog')!
    this.widthInput = document.getElementById('resize-width') as HTMLInputElement
    this.heightInput = document.getElementById('resize-height') as HTMLInputElement
    this.preset = document.getElementById('resize-preset') as HTMLSelectElement
    this.lockCheckbox = document.getElementById('resize-lock') as HTMLInputElement
    this.warning = document.getElementById('resize-warning')!

    document.getElementById('resize-cancel')!.addEventListener('click', () => this.hide())
    document.getElementById('resize-confirm')!.addEventListener('click', () => this.confirm())

    this.overlay.addEventListener('click', (e) => {
      if (e.target === this.overlay) this.hide()
    })

    this.preset.addEventListener('change', () => {
      const val = parseInt(this.preset.value)
      if (!isNaN(val)) {
        this.widthInput.value = String(val)
        this.heightInput.value = String(val)
        this.updateWarning()
      }
    })

    this.widthInput.addEventListener('input', () => {
      if (this.lockCheckbox.checked) {
        const ratio = this.origH / this.origW
        this.heightInput.value = String(Math.round(parseInt(this.widthInput.value) * ratio))
      }
      this.updateWarning()
    })

    this.heightInput.addEventListener('input', () => {
      if (this.lockCheckbox.checked) {
        const ratio = this.origW / this.origH
        this.widthInput.value = String(Math.round(parseInt(this.heightInput.value) * ratio))
      }
      this.updateWarning()
    })
  }

  show(onConfirm: (w: number, h: number) => void): void {
    this.origW = this.engine.width
    this.origH = this.engine.height
    this.widthInput.value = String(this.origW)
    this.heightInput.value = String(this.origH)
    this.preset.value = ''
    this.lockCheckbox.checked = false
    this.warning.classList.add('hidden')
    this.onConfirmCallback = onConfirm
    this.overlay.classList.remove('hidden')
  }

  hide(): void {
    this.overlay.classList.add('hidden')
  }

  private updateWarning(): void {
    const newW = parseInt(this.widthInput.value)
    const newH = parseInt(this.heightInput.value)
    const isDownscale = newW < this.origW || newH < this.origH
    this.warning.classList.toggle('hidden', !isDownscale)
  }

  private confirm(): void {
    const newW = Math.max(1, Math.min(512, parseInt(this.widthInput.value) || this.origW))
    const newH = Math.max(1, Math.min(512, parseInt(this.heightInput.value) || this.origH))

    this.undoManager.push(this.engine.getImageData())

    const src = document.createElement('canvas')
    src.width = this.origW
    src.height = this.origH
    const srcCtx = src.getContext('2d')!
    srcCtx.putImageData(this.engine.getImageData(), 0, 0)

    const dst = document.createElement('canvas')
    dst.width = newW
    dst.height = newH
    const dstCtx = dst.getContext('2d')!
    dstCtx.imageSmoothingEnabled = false
    dstCtx.drawImage(src, 0, 0, newW, newH)

    const newData = dstCtx.getImageData(0, 0, newW, newH)
    this.engine.putImageData(newData)

    showToast(`Resized to ${newW} × ${newH}px`)

    this.hide()
    this.onConfirmCallback?.(newW, newH)
  }
}
