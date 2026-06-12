import type { RGBA, ToolType, AppEventType, LibraryColor } from '../types'

type Listener<T> = (data: T) => void

class EventEmitter {
  private listeners = new Map<string, Listener<unknown>[]>()

  on<T>(event: string, fn: Listener<T>): void {
    const arr = this.listeners.get(event) ?? []
    arr.push(fn as Listener<unknown>)
    this.listeners.set(event, arr)
  }

  off<T>(event: string, fn: Listener<T>): void {
    const arr = this.listeners.get(event)
    if (!arr) return
    this.listeners.set(event, arr.filter(f => f !== (fn as Listener<unknown>)))
  }

  emit<T>(event: string, data: T): void {
    this.listeners.get(event)?.forEach(fn => fn(data as unknown))
  }
}

export class AppState extends EventEmitter {
  private _activeTool: ToolType = 'pencil'
  private _activeColor: RGBA = { r: 255, g: 71, b: 96, a: 255 }
  private _pencilBrushSize = 1
  private _eraserBrushSize = 1
  private _hasImage = false
  private _library: LibraryColor[] = []

  constructor() {
    super()
    this._loadLibrary()
  }

  get activeTool(): ToolType { return this._activeTool }
  get activeColor(): RGBA { return { ...this._activeColor } }
  get brushSize(): number {
    return this._activeTool === 'eraser' ? this._eraserBrushSize : this._pencilBrushSize
  }
  get hasImage(): boolean { return this._hasImage }
  get library(): LibraryColor[] { return [...this._library] }

  setTool(tool: ToolType): void {
    if (this._activeTool === tool) return
    this._activeTool = tool
    this.emit<ToolType>('tool:change' satisfies AppEventType, tool)
    this.emit<number>('brush:change' satisfies AppEventType, this.brushSize)
  }

  setColor(color: RGBA): void {
    this._activeColor = { ...color }
    this.emit<RGBA>('color:change' satisfies AppEventType, this.activeColor)
  }

  setBrushSize(size: number): void {
    const clamped = Math.max(1, Math.min(32, size))
    if (this._activeTool === 'eraser') {
      this._eraserBrushSize = clamped
    } else {
      this._pencilBrushSize = clamped
    }
    this.emit<number>('brush:change' satisfies AppEventType, clamped)
  }

  setHasImage(val: boolean): void {
    this._hasImage = val
    this.emit<boolean>('image:load' satisfies AppEventType, val)
  }

  getBrushSizeForTool(tool: ToolType): number {
    return tool === 'eraser' ? this._eraserBrushSize : this._pencilBrushSize
  }

  addToLibrary(color: LibraryColor): void {
    this._library.push(color)
    this.emit<LibraryColor[]>('library:change' satisfies AppEventType, this.library)
    this._persistLibrary()
  }

  removeFromLibrary(id: string): void {
    this._library = this._library.filter(c => c.id !== id)
    this.emit<LibraryColor[]>('library:change' satisfies AppEventType, this.library)
    this._persistLibrary()
  }

  setLibrary(colors: LibraryColor[]): void {
    this._library = [...colors]
    this.emit<LibraryColor[]>('library:change' satisfies AppEventType, this.library)
    this._persistLibrary()
  }

  private _persistLibrary(): void {
    localStorage.setItem('repaint:library', JSON.stringify(this._library))
  }

  private _loadLibrary(): void {
    try {
      const stored = localStorage.getItem('repaint:library')
      if (!stored) return
      const parsed = JSON.parse(stored)
      if (Array.isArray(parsed)) {
        this._library = parsed.filter(
          c => c && typeof c.id === 'string' && typeof c.name === 'string' && typeof c.hex === 'string'
        )
      }
    } catch {
      // ignore parse errors
    }
  }
}
