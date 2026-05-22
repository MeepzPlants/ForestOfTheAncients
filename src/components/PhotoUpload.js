import { processImage, formatFileSize } from '../utils/imageHelpers.js'
import { Photos } from '../db/queries.js'

export function createPhotoUpload({ plantId, journalId = null, onUpload, container, allowMultiple = true, enlarged = false }) {
  const wrapper = document.createElement('div')
  wrapper.className = 'photo-upload'

  const dropZone = document.createElement('div')
  dropZone.className = 'photo-drop-zone'
  dropZone.style.cssText = `
    border: 1px dashed var(--color-border-strong);
    border-radius: var(--radius-lg);
    padding: ${enlarged ? '2.5rem 1rem' : '1.25rem 1rem'};
    text-align: center;
    cursor: pointer;
    background: var(--color-bg-tertiary);
    transition: border-color 150ms ease, background 150ms ease;
    margin-bottom: 0.875rem;
  `

  const cameraIcon = document.createElement('div')
  cameraIcon.textContent = '📷'
  cameraIcon.style.cssText = `font-size: ${enlarged ? '40px' : '28px'}; margin-bottom: 8px;`

  const dropText = document.createElement('div')
  dropText.style.cssText = 'font-size:13px;color:var(--color-text-tertiary);'
  dropText.innerHTML = 'Tap to take a photo or choose from gallery<br><span style="font-size:11px;opacity:0.7;">JPEG, PNG up to 20MB</span>'

  dropZone.appendChild(cameraIcon)
  dropZone.appendChild(dropText)

  const fileInput = document.createElement('input')
  fileInput.type = 'file'
  fileInput.accept = 'image/*'
  fileInput.multiple = allowMultiple
  fileInput.capture = 'environment'
  fileInput.style.display = 'none'

  const galleryInput = document.createElement('input')
  galleryInput.type = 'file'
  galleryInput.accept = 'image/*'
  galleryInput.multiple = allowMultiple
  galleryInput.style.display = 'none'

  const btnRow = document.createElement('div')
  btnRow.style.cssText = 'display:flex;gap:8px;margin-bottom:0.875rem;'

  const cameraBtn = document.createElement('button')
  cameraBtn.type = 'button'
  cameraBtn.className = 'btn btn-secondary'
  cameraBtn.style.flex = '1'
  cameraBtn.textContent = '📷 Camera'

  const galleryBtn = document.createElement('button')
  galleryBtn.type = 'button'
  galleryBtn.className = 'btn btn-secondary'
  galleryBtn.style.flex = '1'
  galleryBtn.textContent = '🖼 Gallery'

  btnRow.appendChild(cameraBtn)
  btnRow.appendChild(galleryBtn)

  const statusEl = document.createElement('div')
  statusEl.style.cssText = 'font-size:12px;color:var(--color-text-tertiary);min-height:18px;margin-bottom:0.5rem;'

  const previewGrid = document.createElement('div')
  previewGrid.className = 'photo-grid'

  wrapper.appendChild(dropZone)
  wrapper.appendChild(btnRow)
  wrapper.appendChild(statusEl)
  wrapper.appendChild(fileInput)
  wrapper.appendChild(galleryInput)
  wrapper.appendChild(previewGrid)

  if (container) container.appendChild(wrapper)

  dropZone.addEventListener('click', () => cameraBtn.click())

  dropZone.addEventListener('dragover', (e) => {
    e.preventDefault()
    dropZone.style.borderColor = 'var(--color-border-focus)'
    dropZone.style.background = 'var(--color-bg-hover)'
  })

  dropZone.addEventListener('dragleave', () => {
    dropZone.style.borderColor = 'var(--color-border-strong)'
    dropZone.style.background = 'var(--color-bg-tertiary)'
  })

  dropZone.addEventListener('drop', (e) => {
    e.preventDefault()
    dropZone.style.borderColor = 'var(--color-border-strong)'
    dropZone.style.background = 'var(--color-bg-tertiary)'
    const files = [...e.dataTransfer.files].filter(f => f.type.startsWith('image/'))
    if (files.length) processFiles(files)
  })

  cameraBtn.addEventListener('click', () => fileInput.click())
  galleryBtn.addEventListener('click', () => galleryInput.click())

  fileInput.addEventListener('change', () => {
    if (fileInput.files.length) processFiles([...fileInput.files])
    fileInput.value = ''
  })

  galleryInput.addEventListener('change', () => {
    if (galleryInput.files.length) processFiles([...galleryInput.files])
    galleryInput.value = ''
  })

  async function processFiles(files) {
    statusEl.textContent = `Processing ${files.length} photo${files.length > 1 ? 's' : ''}...`
    cameraBtn.disabled = true
    galleryBtn.disabled = true

    const results = []

    for (const file of files) {
      try {
        const processed = await processImage(file)
        const photoRecord = {
          plantId,
          journalId,
          dataURL: processed.dataURL,
          thumbnail: processed.thumbnail,
          size: processed.size,
          originalName: processed.originalName,
          createdAt: new Date().toISOString()
        }
        const id = await Photos.add(photoRecord)
        photoRecord.id = id
        results.push(photoRecord)
        addPreview(photoRecord)
      } catch (err) {
        statusEl.textContent = `Error: ${err.message}`
      }
    }

    cameraBtn.disabled = false
    galleryBtn.disabled = false

    if (results.length > 0) {
      const total = results.reduce((s, r) => s + r.size, 0)
      statusEl.textContent = `${results.length} photo${results.length > 1 ? 's' : ''} saved (${formatFileSize(total)})`
      setTimeout(() => { statusEl.textContent = '' }, 4000)
      if (onUpload) onUpload(results)
    }
  }

  function addPreview(photo) {
    const img = document.createElement('img')
    img.src = photo.thumbnail || photo.dataURL
    img.className = 'photo-grid-item'
    img.alt = 'Plant photo'
    img.loading = 'lazy'

    img.addEventListener('click', () => {
      showFullPhoto(photo.dataURL)
    })

    previewGrid.appendChild(img)
  }

  async function loadExistingPhotos() {
    let photos = []
    if (journalId) {
      photos = await Photos.getByJournalId(journalId)
    } else if (plantId) {
      photos = await Photos.getByPlantId(plantId)
    }
    photos.forEach(addPreview)
  }

  function showFullPhoto(dataURL) {
    const overlay = document.createElement('div')
    overlay.style.cssText = `
      position: fixed;
      inset: 0;
      background: rgba(0,0,0,0.92);
      z-index: 1100;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 1rem;
    `
    const img = document.createElement('img')
    img.src = dataURL
    img.style.cssText = 'max-width:100%;max-height:90vh;border-radius:var(--radius-md);'
    overlay.appendChild(img)
    overlay.addEventListener('click', () => overlay.remove())
    document.body.appendChild(overlay)
  }

  loadExistingPhotos()

  return {
    el: wrapper,
    reloadPhotos: loadExistingPhotos
  }
}
