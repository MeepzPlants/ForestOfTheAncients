import { formatDate, daysSince } from '../utils/dateHelpers.js'

const STATUS_COLORS = {
  'Cutting taken': '',
  'Rooting':       'badge-w',
  'Rooted':        'badge-g',
  'Potted up':     'badge-g',
  'Established':   'badge-g',
  'Failed':        'badge-r'
}

const STATUS_STEPS = [
  'Cutting taken',
  'Rooting',
  'Rooted',
  'Potted up',
  'Established'
]

export function createPropagationCard({ prop, parentPlantName, onClick, onDelete, onStatusChange }) {
  const card = document.createElement('div')
  card.className = 'card'
  card.style.marginBottom = '0.625rem'

  const header = document.createElement('div')
  header.style.cssText = 'display:flex;align-items:flex-start;justify-content:space-between;gap:8px;margin-bottom:8px;'

  const left = document.createElement('div')
  left.style.minWidth = '0'

  const name = document.createElement('div')
  name.className = 'card-title'
  name.textContent = prop.name

  const sub = document.createElement('div')
  sub.className = 'card-subtitle'
  sub.style.marginTop = '2px'
  sub.textContent = [prop.method, parentPlantName].filter(Boolean).join(' · ')

  left.appendChild(name)
  left.appendChild(sub)

  const right = document.createElement('div')
  right.style.cssText = 'display:flex;gap:6px;align-items:center;flex-shrink:0;'

  const statusBadge = document.createElement('span')
  statusBadge.className = `badge ${STATUS_COLORS[prop.status] || ''}`
  statusBadge.textContent = prop.status

  right.appendChild(statusBadge)

  if (onDelete) {
    const deleteBtn = document.createElement('button')
    deleteBtn.type = 'button'
    deleteBtn.className = 'btn btn-ghost btn-sm btn-icon'
    deleteBtn.setAttribute('aria-label', 'Delete propagation')
    deleteBtn.style.cssText = 'color:var(--color-danger-text);padding:4px;font-size:14px;'
    deleteBtn.textContent = '✕'
    deleteBtn.addEventListener('click', (e) => {
      e.stopPropagation()
      onDelete(prop)
    })
    right.appendChild(deleteBtn)
  }

  header.appendChild(left)
  header.appendChild(right)
  card.appendChild(header)

  if (prop.status !== 'Failed') {
    const progressBar = createProgressBar(prop.status)
    card.appendChild(progressBar)
  }

  const meta = document.createElement('div')
  meta.style.cssText = 'display:flex;gap:12px;margin-top:8px;flex-wrap:wrap;'

  if (prop.startDate) {
    const started = document.createElement('span')
    started.style.cssText = 'font-size:12px;color:var(--color-text-tertiary);'
    const days = daysSince(prop.startDate)
    started.textContent = `Started ${formatDate(prop.startDate)} · ${days}d ago`
    meta.appendChild(started)
  }

  if (prop.expectedDate) {
    const expected = document.createElement('span')
    expected.style.cssText = 'font-size:12px;color:var(--color-text-tertiary);'
    expected.textContent = `Expected: ${formatDate(prop.expectedDate)}`
    meta.appendChild(expected)
  }

  if (meta.children.length > 0) card.appendChild(meta)

  if (prop.notes) {
    const notes = document.createElement('div')
    notes.style.cssText = 'font-size:13px;color:var(--color-text-secondary);margin-top:8px;line-height:1.5;'
    notes.textContent = prop.notes
    card.appendChild(notes)
  }

  if (onStatusChange && prop.status !== 'Established' && prop.status !== 'Failed') {
    const nextStatus = getNextStatus(prop.status)
    if (nextStatus) {
      const advanceBtn = document.createElement('button')
      advanceBtn.type = 'button'
      advanceBtn.className = 'btn btn-secondary btn-sm'
      advanceBtn.style.marginTop = '10px'
      advanceBtn.textContent = `Advance to: ${nextStatus}`
      advanceBtn.addEventListener('click', (e) => {
        e.stopPropagation()
        onStatusChange(prop, nextStatus)
      })
      card.appendChild(advanceBtn)
    }
  }

  if (onClick) {
    card.style.cursor = 'pointer'
    card.addEventListener('click', () => onClick(prop))
  }

  return card
}

function createProgressBar(currentStatus) {
  const wrapper = document.createElement('div')
  wrapper.style.cssText = 'margin-top:4px;'

  const steps = document.createElement('div')
  steps.style.cssText = 'display:flex;gap:3px;align-items:center;'

  const currentIdx = STATUS_STEPS.indexOf(currentStatus)

  STATUS_STEPS.forEach((step, idx) => {
    const segment = document.createElement('div')
    segment.style.cssText = `
      flex: 1;
      height: 4px;
      border-radius: var(--radius-full);
      background: ${idx <= currentIdx
        ? 'var(--color-green-600)'
        : 'var(--color-bg-tertiary)'};
      transition: background 300ms ease;
    `
    segment.title = step
    steps.appendChild(segment)
  })

  const stepLabel = document.createElement('div')
  stepLabel.style.cssText = 'display:flex;justify-content:space-between;margin-top:3px;'

  const firstLabel = document.createElement('span')
  firstLabel.style.cssText = 'font-size:10px;color:var(--color-text-muted);'
  firstLabel.textContent = STATUS_STEPS[0]

  const lastLabel = document.createElement('span')
  lastLabel.style.cssText = 'font-size:10px;color:var(--color-text-muted);'
  lastLabel.textContent = STATUS_STEPS[STATUS_STEPS.length - 1]

  stepLabel.appendChild(firstLabel)
  stepLabel.appendChild(lastLabel)

  wrapper.appendChild(steps)
  wrapper.appendChild(stepLabel)
  return wrapper
}

function getNextStatus(currentStatus) {
  const idx = STATUS_STEPS.indexOf(currentStatus)
  if (idx === -1 || idx >= STATUS_STEPS.length - 1) return null
  return STATUS_STEPS[idx + 1]
}

export function propagationStatusChips() {
  return [
    { label: 'All', value: '' },
    { label: 'Cutting taken', value: 'Cutting taken' },
    { label: 'Rooting', value: 'Rooting' },
    { label: 'Rooted', value: 'Rooted' },
    { label: 'Potted up', value: 'Potted up' },
    { label: 'Established', value: 'Established' },
    { label: 'Failed', value: 'Failed' }
  ]
}
