const MAX_WIDTH = 1200
const MAX_HEIGHT = 1200
const QUALITY = 0.82
const THUMB_SIZE = 300

export function fileToDataURL(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result)
    reader.onerror = () => reject(new Error('Failed to read file.'))
    reader.readAsDataURL(file)
  })
}

export function compressImage(file, maxWidth = MAX_WIDTH, maxHeight = MAX_HEIGHT, quality = QUALITY) {
  return new Promise((resolve, reject) => {
    const img = new Image()
    const url = URL.createObjectURL(file)

    img.onload = () => {
      URL.revokeObjectURL(url)

      let { width, height } = img

      if (width > maxWidth || height > maxHeight) {
        const ratio = Math.min(maxWidth / width, maxHeight / height)
        width = Math.round(width * ratio)
        height = Math.round(height * ratio)
      }

      const canvas = document.createElement('canvas')
      canvas.width = width
      canvas.height = height

      const ctx = canvas.getContext('2d')
      ctx.drawImage(img, 0, 0, width, height)

      canvas.toBlob(
        (blob) => {
          if (!blob) { reject(new Error('Image compression failed.')); return }
          const compressed = new File([blob], file.name, { type: 'image/jpeg', lastModified: Date.now() })
          resolve(compressed)
        },
        'image/jpeg',
        quality
      )
    }

    img.onerror = () => {
      URL.revokeObjectURL(url)
      reject(new Error('Failed to load image.'))
    }

    img.src = url
  })
}

export function generateThumbnail(file, size = THUMB_SIZE) {
  return new Promise((resolve, reject) => {
    const img = new Image()
    const url = URL.createObjectURL(file)

    img.onload = () => {
      URL.revokeObjectURL(url)

      const { width, height } = img
      const ratio = Math.min(size / width, size / height)
      const w = Math.round(width * ratio)
      const h = Math.round(height * ratio)

      const canvas = document.createElement('canvas')
      canvas.width = w
      canvas.height = h

      const ctx = canvas.getContext('2d')
      ctx.drawImage(img, 0, 0, w, h)

      resolve(canvas.toDataURL('image/jpeg', 0.7))
    }

    img.onerror = () => {
      URL.revokeObjectURL(url)
      reject(new Error('Failed to generate thumbnail.'))
    }

    img.src = url
  })
}

export async function processImage(file) {
  if (!file || !file.type.startsWith('image/')) {
    throw new Error('File must be an image.')
  }

  if (file.size > 20 * 1024 * 1024) {
    throw new Error('Image must be smaller than 20MB.')
  }

  const compressed = await compressImage(file)
  const dataURL = await fileToDataURL(compressed)
  const thumbnail = await generateThumbnail(compressed)

  return {
    dataURL,
    thumbnail,
    size: compressed.size,
    type: 'image/jpeg',
    originalName: file.name
  }
}

export function formatFileSize(bytes) {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

export function isImageFile(file) {
  return file && file.type.startsWith('image/')
}

export function dataURLtoBlob(dataURL) {
  const [header, data] = dataURL.split(',')
  const mime = header.match(/:(.*?);/)[1]
  const binary = atob(data)
  const array = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i++) {
    array[i] = binary.charCodeAt(i)
  }
  return new Blob([array], { type: mime })
}
