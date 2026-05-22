import { formatDate } from '../utils/dateHelpers.js'

export function createHarvestCard({ entry, plantName, onClick, onDelete, showPlantName = false }) {
  const card = document.createElement('div')
  card.className = 'card'
  card.style.marginBottom = '0.625rem'

  const header = document.createElement('div')
  header.style.cssText = 'display:flex;align-items:flex-start;justify-content:space-between;gap:8px;margin-bottom:6px;'

  const left = document.createElement('div')
  left.style.minWidth = '0'

  const dateEl = document.createElement('div')
  dateEl.style.cssText = 'font-size:14px;font-weight:500;color:var(--color-text-primary);'
  dateEl.textContent = formatDate(entry.date || entry.createdAt)

  left.appendChild(dateEl)

  if (showPlantName && plantName) {
    const plant = document.createElement('div')
    plant.className = 'card-subtitle'
    plant.style.marginTop = '2px'
    plant.textContent = plantName
    left.appendChild(plant)
  }

  const right = document.createElement('div')
  right.style.cssText = 'display:flex;gap:6px;align-items:center;flex-shrink:0;'

  if (entry.quantity || entry.weight) {
    const amountBadge = document.createElement('span')
    amountBadge.className = 'badge badge-g'
    const parts = []
    if (entry.quantity) parts.push(`${entry.quantity}${entry.quantityUnit ? ' ' + entry.quantityUnit : ''}`)
    if (entry.weight) parts.push(`${entry.weight}${entry.weightUnit ? ' ' + entry.weightUnit : ''}`)
    amountBadge.textContent = parts.join(' · ')
    right.appendChild(amountBadge)
  }

  if (onDelete) {
    const deleteBtn = document.createElement('button')
    deleteBtn.type = 'button'
    deleteBtn.className = 'btn btn-ghost btn-sm btn-icon'
    deleteBtn.setAttribute('aria-label', 'Delete harvest entry')
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

  if (entry.description) {
    const desc = document.createElement('div')
    desc.style.cssText = 'font-size:13px;color:var(--color-text-secondary);line-height:1.5;margin-bottom:6px;'
    desc.textContent = entry.description
    card.appendChild(desc)
  }

  if (entry.quality) {
    const qualityRow = document.createElement('div')
    qualityRow.style.cssText = 'display:flex;align-items:center;gap:6px;margin-bottom:4px;'

    const qualityLabel = document.createElement('span')
    qualityLabel.style.cssText = 'font-size:12px;color:var(--color-text-tertiary);'
    qualityLabel.textContent = 'Quality:'

    const stars = document.createElement('span')
    stars.style.cssText = 'font-size:14px;'
    stars.textContent = '★'.repeat(parseInt(entry.quality)) + '☆'.repeat(5 - parseInt(entry.quality))
    stars.style.color = 'var(--color-amber-400)'

    qualityRow.appendChild(qualityLabel)
    qualityRow.appendChild(stars)
    card.appendChild(qualityRow)
  }

  if (entry.notes) {
    const notes = document.createElement('div')
    notes.style.cssText = 'font-size:12px;color:var(--color-text-tertiary);line-height:1.5;margin-top:4px;'
    notes.textContent = entry.notes
    card.appendChild(notes)
  }

  if (onClick) {
    card.style.cursor = 'pointer'
    card.addEventListener('click', () => onClick(entry))
  }

  return card
}

export function createHarvestSummary({ entries, plantName }) {
  const wrapper = document.createElement('div')
  wrapper.className = 'card'
  wrapper.style.cssText = 'background:var(--color-bg-tertiary);margin-bottom:1rem;'

  const label = document.createElement('div')
  label.className = 'section-label'
  label.style.marginBottom = '0.75rem'
  label.textContent = `Harvest totals — ${plantName || 'all plants'}`
  wrapper.appendChild(label)

  const totals = {}
  entries.forEach(e => {
    if (e.quantity) {
      const unit = e.quantityUnit || 'count'
      totals[unit] = (totals[unit] || 0) + parseFloat(e.quantity)
    }
    if (e.weight) {
      const unit = e.weightUnit || 'g'
      totals[unit] = (totals[unit] || 0) + parseFloat(e.weight)
    }
  })

  const grid = document.createElement('div')
  grid.className = 'stat-grid'

  const countStat = document.createElement('div')
  countStat.className = 'stat-card'
  countStat.innerHTML = `<div class="stat-value">${entries.length}</div><div class="stat-label">Harvests</div>`
  grid.appendChild(countStat)

  Object.entries(totals).forEach(([unit, total]) => {
    const stat = document.createElement('div')
    stat.className = 'stat-card'
    const rounded = Number.isInteger(total) ? total : total.toFixed(1)
    stat.innerHTML = `<div class="stat-value">${rounded}</div><div class="stat-label">Total ${unit}</div>`
    grid.appendChild(stat)
  })

  wrapper.appendChild(grid)
  return wrapper
}
