import { Photos } from '../db/queries.js'
import { formatRelative } from '../utils/dateHelpers.js'

export async function createPlantCard({ plant, onClick, onLongPress, showPhoto = true }) {
  const card = document.createElement('div')
  card.className = 'card card-hover'
  card.style.cssText = 'display:flex;align-items:center;gap:12px;padding:0.875rem 1rem;'
  card.setAttribute('role', 'button')
  card.setAttribute('tabindex', '0')
  card.setAttribute('aria-label', `${plant.name}, ${plant.species || 'unknown species'}`)

  if (showPhoto) {
    const photoEl = document.createElement('div')
    photoEl.style.cssText = `
      width: 52px;
      height: 52px;
      border-radius: var(--radius-md);
      background: var(--color-bg-tertiary);
      flex-shrink: 0;
      overflow: hidden;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 24px;
    `

    const photos = await Photos.getByPlantId(plant.id)
    if (photos.length > 0) {
      const img = document.createElement('img')
      img.src = photos[photos.length - 1].thumbnail || photos[photos.length - 1].dataURL
      img.alt = plant.name
      img.style.cssText = 'width:100%;height:100%;object-fit:cover;'
      photoEl.appendChild(img)
    } else {
      photoEl.textContent = plantEmoji(plant.species)
    }

    card.appendChild(photoEl)
  }

  const content = document.createElement('div')
  content.style.cssText = 'flex:1;min-width:0;'

  const name = document.createElement('div')
  name.className = 'card-title'
  name.style.cssText = 'white-space:nowrap;overflow:hidden;text-overflow:ellipsis;'
  name.textContent = plant.name

  const species = document.createElement('div')
  species.className = 'card-subtitle'
  species.style.cssText = 'white-space:nowrap;overflow:hidden;text-overflow:ellipsis;margin-top:2px;'
  species.textContent = plant.commonName || plant.species || 'Unknown species'

  const meta = document.createElement('div')
  meta.style.cssText = 'display:flex;gap:8px;align-items:center;margin-top:5px;flex-wrap:wrap;'

  if (plant.location) {
    const locBadge = document.createElement('span')
    locBadge.className = 'badge'
    locBadge.textContent = plant.location
    meta.appendChild(locBadge)
  }

  if (plant.updatedAt) {
    const updated = document.createElement('span')
    updated.style.cssText = 'font-size:11px;color:var(--color-text-muted);'
    updated.textContent = formatRelative(plant.updatedAt)
    meta.appendChild(updated)
  }

  content.appendChild(name)
  content.appendChild(species)
  content.appendChild(meta)
  card.appendChild(content)

  const arrow = document.createElement('span')
  arrow.textContent = '›'
  arrow.style.cssText = 'font-size:20px;color:var(--color-text-muted);flex-shrink:0;'
  card.appendChild(arrow)

  card.addEventListener('click', () => {
    if (onClick) onClick(plant)
  })

  card.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      if (onClick) onClick(plant)
    }
  })

  if (onLongPress) {
    let pressTimer = null
    card.addEventListener('touchstart', () => {
      pressTimer = setTimeout(() => onLongPress(plant), 600)
    }, { passive: true })
    card.addEventListener('touchend', () => clearTimeout(pressTimer))
    card.addEventListener('touchmove', () => clearTimeout(pressTimer))
  }

  return card
}

export function plantEmoji(species) {
  if (!species) return '🌱'
  const s = species.toLowerCase()
  if (s.includes('capsicum') || s.includes('pepper')) return '🌶️'
  if (s.includes('solanum') || s.includes('tomato')) return '🍅'
  if (s.includes('eugenia') || s.includes('plinia') || s.includes('jaboticaba')) return '🍒'
  if (s.includes('rubus') || s.includes('berry')) return '🫐'
  if (s.includes('malpighia') || s.includes('acerola')) return '🍒'
  if (s.includes('vanilla')) return '🌸'
  if (s.includes('cactus') || s.includes('mammillaria') || s.includes('echinocereus') || s.includes('stenocereus')) return '🌵'
  if (s.includes('mentha') || s.includes('mint') || s.includes('melissa')) return '🌿'
  if (s.includes('basella') || s.includes('spinach')) return '🥬'
  if (s.includes('physalis')) return '🫐'
  if (s.includes('annona') || s.includes('cherimoya')) return '🍈'
  if (s.includes('inga')) return '🌳'
  if (s.includes('citrus') || s.includes('microcitrus')) return '🍋'
  if (s.includes('nepeta') || s.includes('catnip')) return '🌿'
  if (s.includes('campsis')) return '🌺'
  return '🌱'
}
