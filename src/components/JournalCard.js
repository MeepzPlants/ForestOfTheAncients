import { Photos } from '../db/queries.js'
import { formatDateTime } from '../utils/dateHelpers.js'
import { formatEnvironmentSummary } from './EnvironmentLogger.js'

const TAG_COLORS = {
  'observation':   '',
  'watering':      'badge-b',
  'fertilizing':   'badge-g',
  'repotting':     '',
  'pruning':       '',
  'pest / disease': 'badge-r',
  'new growth':    'badge-g',
  'harvest':       'badge-g',
  'propagation':   '',
  'other':         ''
}

export async function createJournalCard({ entry, plantName, onClick, onDelete, showPlantName = false }) {
  const card = document.createElement('div')
  card.className = 'card'
  card.style.marginBottom = '0.625rem'

  const header = document.createElement('div')
  header.style.cssText = 'display:flex;align-items:flex-start;justify-content:space-between;gap:8px;margin-bottom:6px;'

  const left = document.createElement('div')
  left.style.cssText = 'display:flex;gap:8px;align-items:center;flex-wrap:wrap;min-width:0;'

  const tagBadge = document.createElement('span')
  tagBadge.className = `badge ${TAG_COLORS[entry.tag] || ''}`
  tagBadge.textContent = entry.tag || 'observation'

  left.appendChild(tagBadge)

  if (showPlantName && plantName) {
    const pBadge = document.createElement('span')
    pBadge.style.cssText = 'font-size:12px;color:var(--color-text-tertiary);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:140px;'
    pBadge.textContent = plantName
    left.appendChild(pBadge)
  }

  const right = document.createElement('div')
  right.style.cssText = 'display:flex;gap:4px;align-items:center;flex-shrink:0;'

  const dateEl = document.createElement('span')
  dateEl.style.cssText = 'font-size:11px;color:var(--color-text-muted);'
  dateEl.textContent = formatDateTime(entry.createdAt)

  right.appendChild(dateEl)

  if (onDelete) {
    const deleteBtn = document.createElement('button')
    deleteBtn.type = 'button'
    deleteBtn.className = 'btn btn-ghost btn-sm btn-icon'
    deleteBtn.setAttribute('aria-label', 'Delete entry')
    deleteBtn.style.cssText = 'color:var(--color-danger-text);padding:4px;font-size:14px;'
    deleteBtn.textContent = '✕'
    deleteBtn.addEventListener('click', (e) => {
      e.stopPropagation()
      onDelete(entry)
    })
    right.appendChild(deleteBtn)
  }

  header.appendChild(left)
  header.appendChild(right)
  card.appendChild(header)

  if (entry.text) {
    const text = document.createElement('div')
    text.style.cssText = 'font-size:14px;color:var(--color-text-primary);line-height:1.6;margin-bottom:8px;white-space:pre-wrap;'
    text.textContent = entry.text
    card.appendChild(text)
  }

  const envSummary = formatEnvironmentSummary(entry)
  if (envSummary) {
    const envEl = document.createElement('div')
    envEl.style.cssText = 'font-size:11px;color:var(--color-text-tertiary);margin-bottom:8px;'
    envEl.textContent = envSummary
    card.appendChild(envEl)
  }

  const photos = await Photos.getByJournalId(entry.id)
  if (photos.length > 0) {
    const photoRow = document.createElement('div')
    photoRow.style.cssText = 'display:flex;gap:6px;flex-wrap:wrap;margin-top:6px;'

    photos.slice(0, 4).forEach((photo, idx) => {
      const img = document.createElement('img')
      img.src = photo.thumbnail || photo.dataURL
      img.alt = 'Journal photo'
      img.className = 'photo-thumb'
      img.loading = 'lazy'

      if (photos.length > 4 && idx === 3) {
        const overlay = document.createElement('div')
        overlay.style.cssText = `
          position:relative;
          width:56px;height:56px;flex-shrink:0;
        `
        img.style.cssText = 'width:100%;height:100%;object-fit:cover;border-radius:var(--radius-md);opacity:0.5;'
        const count = document.createElement('div')
        count.style.cssText = `
          position:absolute;inset:0;display:flex;align-items:center;justify-content:center;
          font-size:14px;font-weight:600;color:#fff;
        `
        count.textContent = `+${photos.length - 3}`
        overlay.appendChild(img)
        overlay.appendChild(count)
        overlay.addEventListener('click', (e) => {
          e.stopPropagation()
          if (onClick) onClick(entry)
        })
        photoRow.appendChild(overlay)
      } else {
        img.addEventListener('click', (e) => {
          e.stopPropagation()
          showFullPhoto(photo.dataURL)
        })
        photoRow.appendChild(img)
      }
    })

    card.appendChild(photoRow)
  }

  if (onClick) {
    card.style.cursor = 'pointer'
    card.addEventListener('click', () => onClick(entry))
  }

  return card
}

function showFullPhoto(dataURL) {
  const overlay = document.createElement('div')
  overlay.style.cssText = `
    position:fixed;inset:0;background:rgba(0,0,0,0.92);
    z-index:1100;display:flex;align-items:center;justify-content:center;padding:1rem;
  `
  const img = document.createElement('img')
  img.src = dataURL
  img.style.cssText = 'max-width:100%;max-height:90vh;border-radius:var(--radius-md);'
  overlay.appendChild(img)
  overlay.addEventListener('click', () => overlay.remove())
  document.body.appendChild(overlay)
}

export function journalTagChips() {
  return [
    { label: 'All', value: '' },
    { label: 'Observation', value: 'observation' },
    { label: 'Watering', value: 'watering' },
    { label: 'Fertilizing', value: 'fertilizing' },
    { label: 'Repotting', value: 'repotting' },
    { label: 'Pruning', value: 'pruning' },
    { label: 'Pest / disease', value: 'pest / disease' },
    { label: 'New growth', value: 'new growth' },
    { label: 'Harvest', value: 'harvest' },
    { label: 'Propagation', value: 'propagation' },
    { label: 'Other', value: 'other' }
  ]
}
