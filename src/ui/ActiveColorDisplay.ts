import type { AppState } from '../state/AppState'
import { rgbaToHex, rgbaCssColor } from '../color/ColorUtils'
import { getColorPicker } from './ColorPickerPopup'

export class ActiveColorDisplay {
  private swatch: HTMLElement
  private hexEl: HTMLElement
  private rgbEl: HTMLElement
  private alphaEl: HTMLElement

  constructor(appState: AppState) {
    this.swatch = document.getElementById('active-swatch')!
    this.hexEl = document.getElementById('active-hex')!
    this.rgbEl = document.getElementById('active-rgb')!
    this.alphaEl = document.getElementById('active-alpha')!

    const openPicker = (anchor: HTMLElement) =>
      getColorPicker().show(anchor, appState.activeColor, (c) => appState.setColor(c))

    this.swatch.style.cursor = 'pointer'
    this.swatch.addEventListener('click', () => openPicker(this.swatch))
    this.swatch.addEventListener('contextmenu', (e) => { e.preventDefault(); openPicker(this.swatch) })

    this.hexEl.style.cursor = 'pointer'
    this.hexEl.addEventListener('click', () => openPicker(this.hexEl))
    this.hexEl.addEventListener('contextmenu', (e) => { e.preventDefault(); openPicker(this.hexEl) })

    appState.on('color:change', () => this.update(appState))
    this.update(appState)
  }

  private update(appState: AppState): void {
    const c = appState.activeColor
    this.swatch.style.backgroundColor = rgbaCssColor(c)
    this.hexEl.textContent = rgbaToHex(c)
    this.rgbEl.textContent = `R ${c.r}  G ${c.g}  B ${c.b}`
    this.alphaEl.textContent = `A ${c.a}`
  }
}
