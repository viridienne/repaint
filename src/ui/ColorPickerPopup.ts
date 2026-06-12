import type { RGBA } from '../types'
import type { AppState } from '../state/AppState'
import { hexToRgba } from '../color/ColorUtils'

const SPEC_W = 252
const SPEC_H = 180
const HUE_W = 252
const HUE_H = 14

function rgbToHsv(r: number, g: number, b: number): { h: number; s: number; v: number } {
  r /= 255; g /= 255; b /= 255
  const max = Math.max(r, g, b), min = Math.min(r, g, b), d = max - min
  let h = 0
  const s = max === 0 ? 0 : d / max
  const v = max
  if (d !== 0) {
    switch (max) {
      case r: h = ((g - b) / d % 6) / 6; break
      case g: h = ((b - r) / d + 2) / 6; break
      case b: h = ((r - g) / d + 4) / 6; break
    }
    if (h < 0) h += 1
  }
  return { h: h * 360, s, v }
}

function hsvToRgb(h: number, s: number, v: number): { r: number; g: number; b: number } {
  h = h / 360
  const i = Math.floor(h * 6)
  const f = h * 6 - i
  const p = v * (1 - s), q = v * (1 - f * s), t = v * (1 - (1 - f) * s)
  let r = 0, g = 0, b = 0
  switch (i % 6) {
    case 0: r = v; g = t; b = p; break
    case 1: r = q; g = v; b = p; break
    case 2: r = p; g = v; b = t; break
    case 3: r = p; g = q; b = v; break
    case 4: r = t; g = p; b = v; break
    case 5: r = v; g = p; b = q; break
  }
  return { r: Math.round(r * 255), g: Math.round(g * 255), b: Math.round(b * 255) }
}

function toHex6(r: number, g: number, b: number): string {
  return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`.toUpperCase()
}

export class ColorPickerPopup {
  private readonly popup: HTMLElement
  private readonly specCanvas: HTMLCanvasElement
  private readonly specCtx: CanvasRenderingContext2D
  private readonly hueCanvas: HTMLCanvasElement
  private readonly hueCtx: CanvasRenderingContext2D
  private readonly specCursor: HTMLElement
  private readonly hueCursor: HTMLElement
  private readonly hexInput: HTMLInputElement
  private readonly rInput: HTMLInputElement
  private readonly gInput: HTMLInputElement
  private readonly bInput: HTMLInputElement
  private readonly previewSwatch: HTMLElement
  private readonly presetsGrid: HTMLElement

  private h = 0; private s = 1; private v = 1
  private alpha = 255
  private appState: AppState | null = null
  private onInput: ((c: RGBA) => void) | null = null
  private onClose: (() => void) | null = null
  private skipSync = false
  private outsideHandler: ((e: MouseEvent) => void) | null = null
  private keyHandler: ((e: KeyboardEvent) => void) | null = null

  constructor() {
    this.popup = document.createElement('div')
    this.popup.className = 'cp-popup hidden'
    this.popup.innerHTML = `
      <div class="cp-spectrum-wrap">
        <canvas class="cp-spectrum" width="${SPEC_W}" height="${SPEC_H}"></canvas>
        <div class="cp-spec-cursor"></div>
      </div>
      <div class="cp-hue-wrap">
        <canvas class="cp-hue" width="${HUE_W}" height="${HUE_H}"></canvas>
        <div class="cp-hue-cursor"></div>
      </div>
      <div class="cp-inputs">
        <div class="cp-hex-row">
          <div class="cp-preview-swatch"></div>
          <input class="cp-hex-input" type="text" maxlength="7" spellcheck="false" placeholder="#000000">
          <button class="cp-copy-btn" title="Copy hex">⧉</button>
        </div>
        <div class="cp-rgb-row">
          <div class="cp-rgb-field"><input class="cp-num-input" type="number" min="0" max="255"><span class="cp-field-label">R</span></div>
          <div class="cp-rgb-field"><input class="cp-num-input" type="number" min="0" max="255"><span class="cp-field-label">G</span></div>
          <div class="cp-rgb-field"><input class="cp-num-input" type="number" min="0" max="255"><span class="cp-field-label">B</span></div>
        </div>
      </div>
      <div class="cp-presets">
        <div class="cp-presets-label">LIBRARY</div>
        <div class="cp-presets-grid"></div>
      </div>
    `
    document.body.appendChild(this.popup)

    this.specCanvas = this.popup.querySelector('.cp-spectrum')!
    this.specCtx = this.specCanvas.getContext('2d')!
    this.hueCanvas = this.popup.querySelector('.cp-hue')!
    this.hueCtx = this.hueCanvas.getContext('2d')!
    this.specCursor = this.popup.querySelector('.cp-spec-cursor')!
    this.hueCursor = this.popup.querySelector('.cp-hue-cursor')!
    this.hexInput = this.popup.querySelector('.cp-hex-input')!
    this.previewSwatch = this.popup.querySelector('.cp-preview-swatch')!
    this.presetsGrid = this.popup.querySelector('.cp-presets-grid')!
    const numInputs = this.popup.querySelectorAll<HTMLInputElement>('.cp-num-input')
    this.rInput = numInputs[0]
    this.gInput = numInputs[1]
    this.bInput = numInputs[2]

    this.drawHueBar()
    this.setupDrag(this.specCanvas, (e) => this.onSpecDrag(e))
    this.setupDrag(this.hueCanvas, (e) => this.onHueDrag(e))
    this.setupInputs()

    this.popup.querySelector('.cp-copy-btn')!.addEventListener('click', () => {
      navigator.clipboard.writeText(this.hexInput.value).catch(() => {})
    })
  }

  show(anchor: HTMLElement, color: RGBA, onInput: (c: RGBA) => void, onClose?: () => void): void {
    this.onInput = onInput
    this.onClose = onClose ?? null
    this.alpha = color.a

    const { h, s, v } = rgbToHsv(color.r, color.g, color.b)
    this.h = h; this.s = s; this.v = v

    this.drawSpectrum()
    this.drawHueBar()
    this.syncCursors()
    this.syncInputs()

    this.popup.classList.remove('hidden')
    this.position(anchor)

    setTimeout(() => {
      this.outsideHandler = (e: MouseEvent) => {
        if (!this.popup.contains(e.target as Node) && !anchor.contains(e.target as Node)) {
          this.hide()
        }
      }
      this.keyHandler = (e: KeyboardEvent) => {
        if (e.key === 'Escape') this.hide()
      }
      document.addEventListener('mousedown', this.outsideHandler)
      document.addEventListener('keydown', this.keyHandler)
    }, 0)
  }

  hide(): void {
    if (this.popup.classList.contains('hidden')) return
    this.popup.classList.add('hidden')
    if (this.outsideHandler) {
      document.removeEventListener('mousedown', this.outsideHandler)
      this.outsideHandler = null
    }
    if (this.keyHandler) {
      document.removeEventListener('keydown', this.keyHandler)
      this.keyHandler = null
    }
    this.onClose?.()
    this.onClose = null
    this.onInput = null
  }

  init(appState: AppState): void {
    this.appState = appState
    this.appState.on('library:change', () => this.renderPresets())
    this.renderPresets()
  }

  private renderPresets(): void {
    if (!this.appState) return

    const library = this.appState.library
    this.presetsGrid.innerHTML = ''

    if (library.length === 0) {
      this.presetsGrid.innerHTML = '<div class="cp-presets-empty">No colors in library</div>'
      return
    }

    library.forEach(color => {
      const swatch = document.createElement('div')
      swatch.className = 'cp-preset-swatch'
      swatch.style.backgroundColor = color.hex
      swatch.title = color.name
      swatch.addEventListener('click', () => {
        const rgba = hexToRgba(color.hex)
        const { h, s, v } = rgbToHsv(rgba.r, rgba.g, rgba.b)
        this.h = h
        this.s = s
        this.v = v
        this.drawSpectrum()
        this.syncCursors()
        this.syncInputs()
        this.emit()
      })
      this.presetsGrid.appendChild(swatch)
    })
  }

  private position(anchor: HTMLElement): void {
    const r = anchor.getBoundingClientRect()
    const pw = 276
    const ph = 360

    let top = r.bottom + 6
    let left = r.left

    if (top + ph > window.innerHeight - 8) top = r.top - ph - 6
    if (left + pw > window.innerWidth - 8) left = window.innerWidth - pw - 8
    if (left < 8) left = 8

    this.popup.style.top = `${top}px`
    this.popup.style.left = `${left}px`
  }

  private drawSpectrum(): void {
    const ctx = this.specCtx
    const { r, g, b } = hsvToRgb(this.h, 1, 1)
    const gradH = ctx.createLinearGradient(0, 0, SPEC_W, 0)
    gradH.addColorStop(0, '#ffffff')
    gradH.addColorStop(1, `rgb(${r},${g},${b})`)
    ctx.fillStyle = gradH
    ctx.fillRect(0, 0, SPEC_W, SPEC_H)
    const gradV = ctx.createLinearGradient(0, 0, 0, SPEC_H)
    gradV.addColorStop(0, 'rgba(0,0,0,0)')
    gradV.addColorStop(1, 'rgba(0,0,0,1)')
    ctx.fillStyle = gradV
    ctx.fillRect(0, 0, SPEC_W, SPEC_H)
  }

  private drawHueBar(): void {
    const ctx = this.hueCtx
    const grad = ctx.createLinearGradient(0, 0, HUE_W, 0)
    for (let i = 0; i <= 6; i++) {
      const { r, g, b } = hsvToRgb(i * 60, 1, 1)
      grad.addColorStop(i / 6, `rgb(${r},${g},${b})`)
    }
    const radius = HUE_H / 2
    ctx.fillStyle = grad
    ctx.beginPath()
    ctx.moveTo(radius, 0)
    ctx.lineTo(HUE_W - radius, 0)
    ctx.arc(HUE_W - radius, radius, radius, -Math.PI / 2, Math.PI / 2)
    ctx.lineTo(radius, HUE_H)
    ctx.arc(radius, radius, radius, Math.PI / 2, -Math.PI / 2)
    ctx.closePath()
    ctx.fill()
  }

  private syncCursors(): void {
    const sx = Math.max(0, Math.min(SPEC_W, this.s * SPEC_W))
    const sy = Math.max(0, Math.min(SPEC_H, (1 - this.v) * SPEC_H))
    this.specCursor.style.left = `${sx}px`
    this.specCursor.style.top = `${sy}px`
    this.hueCursor.style.left = `${(this.h / 360) * HUE_W}px`
  }

  private syncInputs(): void {
    this.skipSync = true
    const { r, g, b } = hsvToRgb(this.h, this.s, this.v)
    const hex = toHex6(r, g, b)
    this.hexInput.value = hex
    this.rInput.value = String(r)
    this.gInput.value = String(g)
    this.bInput.value = String(b)
    this.previewSwatch.style.background = hex
    this.skipSync = false
  }

  private getCurrentRgba(): RGBA {
    const { r, g, b } = hsvToRgb(this.h, this.s, this.v)
    return { r, g, b, a: this.alpha }
  }

  private emit(): void {
    const rgba = this.getCurrentRgba()
    this.previewSwatch.style.background = toHex6(rgba.r, rgba.g, rgba.b)
    this.onInput?.(rgba)
  }

  private onSpecDrag(e: PointerEvent): void {
    const rect = this.specCanvas.getBoundingClientRect()
    this.s = Math.max(0, Math.min(1, (e.clientX - rect.left) / SPEC_W))
    this.v = Math.max(0, Math.min(1, 1 - (e.clientY - rect.top) / SPEC_H))
    this.syncCursors()
    this.syncInputs()
    this.emit()
  }

  private onHueDrag(e: PointerEvent): void {
    const rect = this.hueCanvas.getBoundingClientRect()
    this.h = Math.max(0, Math.min(360, ((e.clientX - rect.left) / HUE_W) * 360))
    this.drawSpectrum()
    this.syncCursors()
    this.syncInputs()
    this.emit()
  }

  private setupDrag(canvas: HTMLCanvasElement, handler: (e: PointerEvent) => void): void {
    canvas.addEventListener('pointerdown', (e) => {
      canvas.setPointerCapture(e.pointerId)
      handler(e)
      const onMove = (e: PointerEvent) => handler(e)
      const onUp = () => {
        canvas.removeEventListener('pointermove', onMove)
        canvas.removeEventListener('pointerup', onUp)
      }
      canvas.addEventListener('pointermove', onMove)
      canvas.addEventListener('pointerup', onUp)
    })
  }

  private setupInputs(): void {
    this.hexInput.addEventListener('input', () => {
      if (this.skipSync) return
      const raw = this.hexInput.value.trim()
      const hex = raw.startsWith('#') ? raw : `#${raw}`
      if (/^#[0-9a-fA-F]{6}$/.test(hex)) {
        const rgba = hexToRgba(hex)
        const { h, s, v } = rgbToHsv(rgba.r, rgba.g, rgba.b)
        this.h = h; this.s = s; this.v = v
        this.drawSpectrum()
        this.syncCursors()
        this.skipSync = true
        this.rInput.value = String(rgba.r)
        this.gInput.value = String(rgba.g)
        this.bInput.value = String(rgba.b)
        this.previewSwatch.style.background = hex.toUpperCase()
        this.skipSync = false
        this.emit()
      }
    })

    this.hexInput.addEventListener('paste', (e) => {
      e.preventDefault()
      const pasted = (e.clipboardData?.getData('text') ?? '').trim()
      this.hexInput.value = pasted.startsWith('#') ? pasted.slice(0, 7) : `#${pasted.slice(0, 6)}`
      this.hexInput.dispatchEvent(new Event('input'))
    })

    const syncFromRgb = () => {
      if (this.skipSync) return
      const r = Math.max(0, Math.min(255, parseInt(this.rInput.value) || 0))
      const g = Math.max(0, Math.min(255, parseInt(this.gInput.value) || 0))
      const b = Math.max(0, Math.min(255, parseInt(this.bInput.value) || 0))
      const { h, s, v } = rgbToHsv(r, g, b)
      this.h = h; this.s = s; this.v = v
      this.drawSpectrum()
      this.syncCursors()
      this.skipSync = true
      this.hexInput.value = toHex6(r, g, b)
      this.previewSwatch.style.background = toHex6(r, g, b)
      this.skipSync = false
      this.emit()
    }

    this.rInput.addEventListener('input', syncFromRgb)
    this.gInput.addEventListener('input', syncFromRgb)
    this.bInput.addEventListener('input', syncFromRgb)

    // Don't let inputs steal keyboard shortcuts
    ;[this.hexInput, this.rInput, this.gInput, this.bInput].forEach(inp => {
      inp.addEventListener('keydown', (e) => e.stopPropagation())
    })
  }
}

let _instance: ColorPickerPopup | null = null
export function getColorPicker(): ColorPickerPopup {
  if (!_instance) _instance = new ColorPickerPopup()
  return _instance
}
