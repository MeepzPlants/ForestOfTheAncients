import { Reminders, Plants } from '../db/queries.js'
import { dueDateLabel, formatDate } from '../utils/dateHelpers.js'
import { confirmModal } from './Modal.js'

export async function createReminderWidget({ container, limit = 5, showPlantName = true }) {
  const wrapper = document.createElement('div')
  wrapper.className = 'reminder-widget'

  const header = document.createElement('div')
  header.className = 'section-header'

  const label = document.createElement('div')
  label.className = 'section-label'
  label.textContent = 'Upcoming reminders'

  const viewAll = document.createElement('a')
  viewAll.href = '/reminders'
  viewAll.className = 'text-sm'
  viewAll.textContent = 'View all'
  viewAll.style.color = 'var(--color-green-400)'

  header.appendChild(label)
  header.appendChild(viewAll)
  wrapper.appendChild(header)

  const list = document.createElement('div')
  list.className = 'reminder-list'
  wrapper.appendChild(list)

  if (container) container.appendChild(wrapper)

  await refresh()

  async function refresh() {
    list.innerHTML = ''

    const [overdue, upcoming, plants] = await Promise.all([
      Reminders.getOverdue(),
      Reminders.getUpcoming(7),
      Plants.getAll()
    ])

    const plantMap = {}
    plants.forEach(p => { plantMap[p.id] = p })

    const combined = [
      ...overdue,
      ...upcoming.filter(u => !overdue.find(o => o.id === u.id))
    ]
      .sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate))
      .slice(0, limit)

    if (combined.length === 0) {
      const empty = document.createElement('div')
      empty.style.cssText = 'font-size:13px;color:var(--color-text-tertiary);padding:0.75rem 0;'
      empty.textContent = 'No upcoming reminders.'
      list.appendChild(empty)
      return
    }

    combined.forEach(reminder => {
      const plant = plantMap[reminder.plantId]
      const { label: dueLabel, cls } = dueDateLabel(reminder.dueDate)

      const item = document.createElement('div')
      item.className = 'list-item'
      item.style.cursor = 'default'

      const icon = document.createElement('div')
      icon.style.cssText = `
        width: 36px;
        height: 36px;
        border-radius: var(--radius-md);
        background: var(--color-bg-tertiary);
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 18px;
        flex-shrink: 0;
      `
      icon.textContent = reminderIcon(reminder.type)

      const content = document.createElement('div')
      content.className = 'list-item-content'

      const title = document.createElement('div')
      title.className = 'list-item-title'
      title.textContent = reminder.type

      const sub = document.createElement('div')
      sub.className = 'list-item-sub'
      sub.textContent = showPlantName && plant
        ? `${plant.name} · ${formatDate(reminder.dueDate)}`
        : formatDate(reminder.dueDate)

      content.appendChild(title)
      content.appendChild(sub)

      const right = document.createElement('div')
      right.style.cssText = 'display:flex;align-items:center;gap:8px;flex-shrink:0;'

      const badge = document.createElement('span')
      badge.className = `badge ${cls}`
      badge.textContent = dueLabel

      const doneBtn = document.createElement('button')
      doneBtn.className = 'btn btn-ghost btn-sm btn-icon'
      doneBtn.setAttribute('aria-label', 'Mark as done')
      doneBtn.title = 'Mark as done'
      doneBtn.innerHTML = '&#10003;'
      doneBtn.style.color = 'var(--color-success-text)'

      doneBtn.addEventListener('click', async () => {
        const next = await Reminders.advanceRepeat(reminder.id)
        await refresh()
      })

      right.appendChild(badge)
      right.appendChild(doneBtn)

      item.appendChild(icon)
      item.appendChild(content)
      item.appendChild(right)
      list.appendChild(item)
    })
  }

  return { el: wrapper, refresh }
}

export function reminderIcon(type) {
  const icons = {
    'Watering': '💧',
    'Fertilizing': '🌱',
    'Repotting': '🪴',
    'Pruning': '✂️',
    'Check on plant': '👁',
    'Treat for pests': '🔍',
    'Other': '📋'
  }
  return icons[type] || '📋'
}
