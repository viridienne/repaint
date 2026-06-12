import type { RGBA } from '../types'

function rgbaMatch(data: Uint8ClampedArray, idx: number, color: RGBA): boolean {
  return (
    data[idx] === color.r &&
    data[idx + 1] === color.g &&
    data[idx + 2] === color.b &&
    data[idx + 3] === color.a
  )
}

function setPixel(data: Uint8ClampedArray, idx: number, color: RGBA): void {
  data[idx] = color.r
  data[idx + 1] = color.g
  data[idx + 2] = color.b
  data[idx + 3] = color.a
}

export function floodFill(
  imageData: ImageData,
  startX: number,
  startY: number,
  fillColor: RGBA
): void {
  const { width, height, data } = imageData
  const startIdx = (startY * width + startX) * 4
  const target: RGBA = {
    r: data[startIdx],
    g: data[startIdx + 1],
    b: data[startIdx + 2],
    a: data[startIdx + 3],
  }

  if (rgbaMatch(data, startIdx, fillColor)) return

  const stack: number[] = [startY * width + startX]
  const visited = new Uint8Array(width * height)

  while (stack.length > 0) {
    const pos = stack.pop()!
    if (visited[pos]) continue
    visited[pos] = 1

    const x = pos % width
    const y = Math.floor(pos / width)
    const idx = pos * 4

    if (!rgbaMatch(data, idx, target)) continue

    setPixel(data, idx, fillColor)

    if (x > 0) stack.push(pos - 1)
    if (x < width - 1) stack.push(pos + 1)
    if (y > 0) stack.push(pos - width)
    if (y < height - 1) stack.push(pos + width)
  }
}
