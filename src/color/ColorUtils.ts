import type { RGBA } from '../types'

export function rgbaToHex(c: RGBA): string {
  const toHex = (v: number) => v.toString(16).padStart(2, '0').toUpperCase()
  if (c.a === 255) return `#${toHex(c.r)}${toHex(c.g)}${toHex(c.b)}`
  return `#${toHex(c.r)}${toHex(c.g)}${toHex(c.b)}${toHex(c.a)}`
}

export function hexToRgba(hex: string): RGBA {
  const clean = hex.replace('#', '')
  if (clean.length === 6) {
    return {
      r: parseInt(clean.slice(0, 2), 16),
      g: parseInt(clean.slice(2, 4), 16),
      b: parseInt(clean.slice(4, 6), 16),
      a: 255,
    }
  }
  return {
    r: parseInt(clean.slice(0, 2), 16),
    g: parseInt(clean.slice(2, 4), 16),
    b: parseInt(clean.slice(4, 6), 16),
    a: parseInt(clean.slice(6, 8), 16),
  }
}

export function rgbaKey(c: RGBA): string {
  return `${c.r},${c.g},${c.b},${c.a}`
}

export function rgbaCssColor(c: RGBA): string {
  return `rgba(${c.r},${c.g},${c.b},${c.a / 255})`
}
