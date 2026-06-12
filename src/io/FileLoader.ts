export function loadImageFromFile(file: File): Promise<{ imageData: ImageData; filename: string }> {
  return new Promise((resolve, reject) => {
    if (!file.type.startsWith('image/png') && !file.name.endsWith('.png')) {
      reject(new Error('Only PNG files are supported'))
      return
    }

    const reader = new FileReader()
    reader.onload = (e) => {
      const img = new Image()
      img.onload = () => {
        const canvas = document.createElement('canvas')
        canvas.width = img.naturalWidth
        canvas.height = img.naturalHeight
        const ctx = canvas.getContext('2d')!
        ctx.drawImage(img, 0, 0)
        const imageData = ctx.getImageData(0, 0, img.naturalWidth, img.naturalHeight)
        resolve({ imageData, filename: file.name })
      }
      img.onerror = () => reject(new Error('Failed to load image'))
      img.src = e.target!.result as string
    }
    reader.onerror = () => reject(new Error('Failed to read file'))
    reader.readAsDataURL(file)
  })
}
