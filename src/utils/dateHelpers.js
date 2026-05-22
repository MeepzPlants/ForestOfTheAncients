export function formatDate(isoString) {
  if (!isoString) return '—'
  const d = new Date(isoString)
  return d.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  })
}

export function formatDateTime(isoString) {
  if (!isoString) return '—'
  const d = new Date(isoString)
  return d.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

export function formatTime(isoString) {
  if (!isoString) return '—'
  const d = new Date(isoString)
  return d.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit'
  })
}

export function formatRelative(isoString) {
  if (!isoString) return '—'
  const d = new Date(isoString)
  const now = new Date()
  const diffMs = now - d
  const diffSec = Math.floor(diffMs / 1000)
  const diffMin = Math.floor(diffSec / 60)
  const diffHr = Math.floor(diffMin / 60)
  const diffDay = Math.floor(diffHr / 24)
  const diffWeek = Math.floor(diffDay / 7)
  const diffMonth = Math.floor(diffDay / 30)
  const diffYear = Math.floor(diffDay / 365)

  if (diffSec < 60) return 'just now'
  if (diffMin < 60) return `${diffMin}m ago`
  if (diffHr < 24) return `${diffHr}h ago`
  if (diffDay === 1) return 'yesterday'
  if (diffDay < 7) return `${diffDay} days ago`
  if (diffWeek < 5) return `${diffWeek} weeks ago`
  if (diffMonth < 12) return `${diffMonth} months ago`
  return `${diffYear} years ago`
}

export function daysUntil(dateString) {
  if (!dateString) return null
  const target = new Date(dateString)
  target.setHours(0, 0, 0, 0)
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  return Math.round((target - today) / (1000 * 60 * 60 * 24))
}

export function daysSince(isoString) {
  if (!isoString) return null
  const past = new Date(isoString)
  past.setHours(0, 0, 0, 0)
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  return Math.round((today - past) / (1000 * 60 * 60 * 24))
}

export function toInputDate(isoString) {
  if (!isoString) return ''
  return new Date(isoString).toISOString().split('T')[0]
}

export function fromInputDate(dateString) {
  if (!dateString) return null
  return new Date(dateString).toISOString()
}

export function todayInputDate() {
  return new Date().toISOString().split('T')[0]
}

export function dueDateLabel(dateString) {
  const days = daysUntil(dateString)
  if (days === null) return { label: '—', cls: '' }
  if (days < 0) return { label: `overdue ${Math.abs(days)}d`, cls: 'badge-r' }
  if (days === 0) return { label: 'today', cls: 'badge-w' }
  if (days <= 3) return { label: `in ${days}d`, cls: 'badge-w' }
  return { label: `in ${days}d`, cls: 'badge' }
}

export function sortByDate(arr, key = 'createdAt', dir = 'desc') {
  return [...arr].sort((a, b) => {
    const da = new Date(a[key])
    const db = new Date(b[key])
    return dir === 'desc' ? db - da : da - db
  })
}

export function groupByMonth(arr, key = 'createdAt') {
  const groups = {}
  arr.forEach(item => {
    const d = new Date(item[key])
    const label = d.toLocaleDateString('en-US', { year: 'numeric', month: 'long' })
    if (!groups[label]) groups[label] = []
    groups[label].push(item)
  })
  return groups
}
