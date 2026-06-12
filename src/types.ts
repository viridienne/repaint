export interface RGBA {
  r: number
  g: number
  b: number
  a: number
}

export type ToolType = 'pencil' | 'eraser' | 'eyedropper' | 'autoselect'

export interface ColorEntry {
  rgba: RGBA
  hex: string
  count: number
  percentage: number
}

export interface ColorAnalysisResult {
  colors: ColorEntry[]
  transparentCount: number
  transparentPercentage: number
  totalPixels: number
  opaquePIxels: number
}

export interface ViewportState {
  zoom: number
  panX: number
  panY: number
}

export interface AppStateData {
  activeTool: ToolType
  activeColor: RGBA
  brushSize: number
  pencilBrushSize: number
  eraserBrushSize: number
  hasImage: boolean
}

export type AppEventType =
  | 'tool:change'
  | 'color:change'
  | 'brush:change'
  | 'image:load'
  | 'history:change'
  | 'selection:change'
  | 'viewport:change'
