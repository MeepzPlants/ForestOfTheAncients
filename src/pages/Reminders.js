import { Reminders, Plants } from '../db/queries.js'
import { validateReminder } from '../utils/validators.js'
import { formatDate, dueDateLabel, todayInputDate } from '../utils/dateHelpers.js'
import { reminderIcon } from '../components/ReminderWidget.js'
import { confirmModal } from '../components/Modal.js'
import { REMINDER_TYPES } from '../data/defaultPlants.js'
import { requestPermission, getNotificationStatus } from '../utils/notifications.js'
import { showReminderBadge } from '../components/Navbar.js'

export async function RemindersPage() {
  const page = document.createElement('div')
  page.className = 'page'

  const header = document.createElement('div')
  header.style.cssText = 'display:flex;align-items:center;justify-content:space-between;margin-bottom:1.25rem;'

  const title = document.createElement('h1')
  title.className = 'page-title'
  title.style.marginBottom = '0'
  title.textContent = 'Reminders'

  const addBtn = document.createElement('button')
  addBtn.className = 'btn btn-primary btn-sm'
  addBtn.textContent = '+ Add'

  header.appendChild(title)
  header.appendChild(addBtn)
  page.appendChild(header)

  const notifBanner = document.createElement('div')
  notifBanner.style.display = 'none'
  notifBanner.className = 'status-msg warning'
  notifBanner.style.marginBottom = '1rem'
  page.appendChild(notifBanner)

  const status = await getNotificationStatus()
  if (status !== 'granted') {
    notifBanner.style.display = 'block'
    notifBanner.innerHTML = 'Enable notifications to receive reminders. <button id="enable-notif-btn" style="background:none;border:none;color:var(--color-warning-text);font-weight:600;text-decoration:underline;cursor:pointer;font-size:13px;">Enable</button>'
    notifBanner.querySelector('#enable-notif-btn')?.addEventListener('click', async () => {
      await requestPermission()
      const newStatus = await getNotificationStatus()
      if (newStatus === 'granted') notifBanner.style.display = 'none'
    })
  }

  const formCard = document.createElement('div')
  formCard.className = 'card'
  formCard.style.cssText = 'margin-bottom:1.25rem;display:none;'

  const formTitle = document.createElement('div')
  formTitle.className = 'section-label'
  formTitle.style.marginBottom = '0.875rem'
  formTitle.textContent = 'New reminder'

  const plants = await Plants.getAll()
  const plantOptions = plants.map(p => `<option value="${p.id}">${p.name}</option>`).join('')

  formCard.innerHTML += ''
  formCard.appendChild(formTitle)

  const plantGroup = formGroup('Plant')
  const plantSelect = document.createElement('select')
  plantSelect.innerHTML = `<option value="">Select a plant...</option>${plantOptions}`
  plantGroup.appendChild(plantSelect)
  formCard.appendChild(plantGroup)

  const typeGroup = formGroup('Reminder type')
  const typeSelect = document.createElement('select')
  typeSelect.innerHTML = REMINDER_TYPES.map(t => `<option value="${t}">${t}</option>`).join('')
  typeGroup.appendChild(typeSelect)
  formCard.appendChild(typeGroup)

  const dateGroup = formGroup('Due date')
  const dateInput = document.createElement('input')
  dateInput.type = 'date'
  dateInput.value = todayInputDate()
  dateGroup.appendChild(dateInput)
  formCard.appendChild(dateGroup)

  const repeatGroup = formGroup('Repeat every (days, 0 = no repeat)')
  const repeatInput = document.createElement('input')
  repeatInput.type = 'number'
  repeatInput.min = '0'
  repeatInput.max = '365'
  repeatInput.value = '0'
  repeatInput.placeholder = '0'
  repeatGroup.appendChild(repeatInput)
  formCard.appendChild(repeatGroup)

  const formErrorEl = document.createElement('div')
  formErrorEl.className = 'error-text'
  formCard.appendChild(formErrorEl)

  const formBtnRow = document.createElement('div')
  formBtnRow.style.cssText = 'display:flex;gap:8px;margin-top:1rem;'

  const saveBtn = document.createElement('button')
  saveBtn.className = 'btn btn-primary'
  saveBtn.style.flex = '1'
  saveBtn.textContent = 'Save reminder'

  const cancelBtn = document.createElement('button')
  cancelBtn.className = 'btn btn-secondary'
  cancelBtn.textContent = 'Cancel'

  formBtnRow.appendChild(saveBtn)
  formBtnRow.appendChild(cancelBtn)
  formCard.appendChild(formBtnRow)
  page.appendChild(formCard)

  addBtn.addEventListener('click', () => {
    formCard.style.display = formCard.style.display === 'none' ? 'block' : 'none'
    addBtn.textContent = formCard.style.display === 'none' ? '+ Add' : '✕ Close'
    if (formCard.style.display === 'block') {
      plantSelect.focus()
    }
  })

  cancelBtn.addEventListener('click', () => {
    formCard.style.display = 'none'
    addBtn.textContent = '+ Add'
    formErrorEl.textContent = ''
  })

  saveBtn.addEventListener('click', async () => {
    const plantId = parseInt(plantSelect.value)
    const plantName = plants.find(p => p.id === plantId)?.name || ''
    const reminder = {
      plantId: plantId || null,
      plantName,
      type: typeSelect.value,
      dueDate: dateInput.value,
      repeatDays: parseInt(repeatInput.value) || 0
    }

    const { valid, errors } = validateReminder(reminder)
    if (!valid) {
      formErrorEl.textContent = Object.values(errors)[0]
      return
    }

    saveBtn.disabled = true
    saveBtn.textContent = 'Saving...'

    try {
      await Reminders.add(reminder)
      formCard.style.display = 'none'
      addBtn.textContent = '+ Add'
      plantSelect.value = ''
      dateInput.value = todayInputDate()
      repeatInput.value = '0'
      formErrorEl.textContent = ''
      await renderList()
    } catch (err) {
      formErrorEl.textContent = err.message
    } finally {
      saveBtn.disabled = false
      saveBtn.textContent = 'Save reminder'
    }
  })

  const listContainer = document.createElement('div')
  page.appendChild(listContainer)

  async function renderList() {
    listContainer.innerHTML = ''

    const [reminders, plantList] = await Promise.all([
      Reminders.getAll(),
      Plants.getAll()
    ])

    const plantMap = {}
    plantList.forEach(p => { plantMap[p.id] = p })

    const sorted = [...reminders].sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate))

    const overdue = sorted.filter(r => {
      const d = new Date(r.dueDate)
      d.setHours(0, 0, 0, 0)
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      return d < today
    })

    const upcoming = sorted.filter(r => {
      const d = new Date(r.dueDate)
      d.setHours(0, 0, 0, 0)
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      return d >= today
    })

    showReminderBadge(overdue.length)

    if (sorted.length === 0) {
      const empty = document.createElement('div')
      empty.className = 'empty-state'
      empty.innerHTML = '<div class="empty-state-icon">🔔</div><p>No reminders set yet.<br>Add one to stay on top of plant care.</p>'
      listContainer.appendChild(empty)
      return
    }

    if (overdue.length > 0) {
      listContainer.appendChild(groupLabel(`Overdue (${overdue.length})`))
      overdue.forEach(r => listContainer.appendChild(createReminderItem(r, plantMap, renderList)))
    }

    if (upcoming.length > 0) {
      listContainer.appendChild(groupLabel('Upcoming'))
      upcoming.forEach(r => listContainer.appendChild(createReminderItem(r, plantMap, renderList)))
    }
  }

  await renderList()
  return page
}

function createReminderItem(reminder, plantMap, onRefresh) {
  const card = document.createElement('div')
  card.className = 'card'
  card.style.cssText = 'display:flex;align-items:center;gap:12px;margin-bottom:0.625rem;padding:0.875rem 1rem;'

  const icon = document.createElement('div')
  icon.style.cssText = `
    width:40px;height:40px;border-radius:var(--radius-md);
    background:var(--color-bg-tertiary);
    display:flex;align-items:center;justify-content:center;
    font-size:20px;flex-shrink:0;
  `
  icon.textContent = reminderIcon(reminder.type)

  const content = document.createElement('div')
  content.style.cssText = 'flex:1;min-width:0;'

  const plant = plantMap[reminder.plantId]
  const typeEl = document.createElement('div')
  typeEl.style.cssText = 'font-size:14px;font-weight:500;color:var(--color-text-primary);'
  typeEl.textContent = reminder.type

  const subEl = document.createElement('div')
  subEl.style.cssText = 'font-size:12px;color:var(--color-text-tertiary);margin-top:2px;'
  const parts = []
  if (plant) parts.push(plant.name)
  parts.push(formatDate(reminder.dueDate))
  if (reminder.repeatDays > 0) parts.push(`repeats every ${reminder.repeatDays}d`)
  subEl.textContent = parts.join(' · ')

  content.appendChild(typeEl)
  content.appendChild(subEl)

  const right = document.createElement('div')
  right.style.cssText = 'display:flex;align-items:center;gap:6px;flex-shrink:0;'

  const { label, cls } = dueDateLabel(reminder.dueDate)
  const badge = document.createElement('span')
  badge.className = `badge ${cls}`
  badge.textContent = label

  const doneBtn = document.createElement('button')
  doneBtn.className = 'btn btn-ghost btn-sm btn-icon'
  doneBtn.setAttribute('aria-label', 'Mark done')
  doneBtn.title = 'Mark as done'
  doneBtn.style.color = 'var(--color-success-text)'
  doneBtn.textContent = '✓'
  doneBtn.addEventListener('click', async () => {
    await Reminders.advanceRepeat(reminder.id)
    await onRefresh()
  })

  const deleteBtn = document.createElement('button')
  deleteBtn.className = 'btn btn-ghost btn-sm btn-icon'
  deleteBtn.setAttribute('aria-label', 'Delete reminder')
  deleteBtn.style.cssText = 'color:var(--color-danger-text);font-size:14px;'
  deleteBtn.textContent = '✕'
  deleteBtn.addEventListener('click', () => {
    confirmModal({
      title: 'Delete reminder?',
      message: `Delete the ${reminder.type} reminder for ${plant?.name || 'this plant'}?`,
      confirmLabel: 'Delete',
      onConfirm: async () => {
        await Reminders.delete(reminder.id)
        await onRefresh()
      }
    })
  })

  right.appendChild(badge)
  right.appendChild(doneBtn)
  right.appendChild(deleteBtn)

  card.appendChild(icon)
  card.appendChild(content)
  card.appendChild(right)
  return card
}

function formGroup(labelText) {
  const group = document.createElement('div')
  group.className = 'form-group'
  const label = document.createElement('label')
  label.textContent = labelText
  group.appendChild(label)
  return group
}

function groupLabel(text) {
  const el = document.createElement('div')
  el.className = 'section-label'
  el.style.cssText = 'margin-bottom:0.5rem;margin-top:1rem;'
  el.textContent = text
  return el
}
