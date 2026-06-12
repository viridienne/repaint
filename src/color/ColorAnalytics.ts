import type { ColorAnalysisResult, ColorEntry, RGBA } from '../types'
import { rgbaKey, rgbaToHex } from './ColorUtils'

export function analyzeColors(imageData: ImageData): ColorAnalysisResult {
  const { data, width, height } = imageData
  const totalPixels = width * height
  const counts = new Map<string, { rgba: RGBA; count: number }>()
  let transparentCount = 0

  for (let i = 0; i < data.length; i += 4) {
    const r = data[i]
    const g = data[i + 1]
    const b = data[i + 2]
    const a = data[i + 3]

    if (a === 0) {
      transparentCount++
      continue
    }

    const key = rgbaKey({ r, g, b, a })
    const existing = counts.get(key)
    if (existing) {
      existing.count++
    } else {
      counts.set(key, { rgba: { r, g, b, a }, count: 1 })
    }
  }

  const opaquePixels = totalPixels - transparentCount
  const colors: ColorEntry[] = Array.from(counts.values())
    .map(({ rgba, count }) => ({
      rgba,
      hex: rgbaToHex(rgba),
      count,
      percentage: opaquePixels > 0 ? (count / opaquePixels) * 100 : 0,
    }))
    .sort((a, b) => b.count - a.count)

  return {
    colors,
    transparentCount,
    transparentPercentage: totalPixels > 0 ? (transparentCount / totalPixels) * 100 : 0,
    totalPixels,
    opaquePIxels: opaquePixels,
  }
}
