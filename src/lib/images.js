/**
 * Reads an image file and returns a resized JPEG/WebP data URL so it fits in
 * localStorage. Swap for Supabase Storage uploads once the backend is wired.
 */
export function fileToCompressedDataUrl(file, maxSize = 900, quality = 0.8) {
  return new Promise((resolve, reject) => {
    if (!file.type.startsWith('image/')) {
      reject(new Error(`${file.name} is not an image.`))
      return
    }
    if (file.size > 8 * 1024 * 1024) {
      reject(new Error(`${file.name} is larger than 8 MB.`))
      return
    }
    const reader = new FileReader()
    reader.onerror = () => reject(new Error(`Could not read ${file.name}.`))
    reader.onload = () => {
      const img = new Image()
      img.onerror = () => reject(new Error(`${file.name} could not be decoded.`))
      img.onload = () => {
        const scale = Math.min(1, maxSize / Math.max(img.width, img.height))
        const canvas = document.createElement('canvas')
        canvas.width = Math.round(img.width * scale)
        canvas.height = Math.round(img.height * scale)
        const ctx = canvas.getContext('2d')
        ctx.fillStyle = '#ffffff'
        ctx.fillRect(0, 0, canvas.width, canvas.height)
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
        resolve(canvas.toDataURL('image/jpeg', quality))
      }
      img.src = reader.result
    }
    reader.readAsDataURL(file)
  })
}
