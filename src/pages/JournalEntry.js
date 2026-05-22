import { Journal, Plants, Photos } from '../db/queries.js'
import { createPhotoUpload } from '../components/PhotoUpload.js'
import { createEnvironmentLogger, formatEnvironmentSummary } from '../components/EnvironmentLogger.js'
import { validateJournalEntry } from '../utils/validators.js'
import { confirmModal, alertModal, createModal } from '../components/Modal.js'
import { formatDateTime } from '../utils/dateHelpers.js'
import { JOURNAL_TAGS } from '../data/defaultPlants.js'

export async function JournalEntryPage({ id }) {
  const entryId = parseInt(id)
  const page = document.createElement('div')
  page.className = 'page'

  const [entry, plants] = await Promise.all([
    Journal.getById(entryId),
    Plants.getAll()
  ])

  if (!entry) {
    page.innerHTML = `
      <div class="empty-state" style="margin-top:3rem;">
        <div class="empty-state-icon">📓</div>
        <p>Entry not found.</p>
        <button class="btn btn-secondary" onclick="window.router?.navigate('/journal')">Back to journal</button>
      </div>
    `
    return page
  }

  const plantMap = {}
  plants.forEach(p => { plantMap[p.id] = p })
  const plant = plantMap[entry.plantId]

  const backBtn = document.createElement('button')
  backBtn.className = 'btn btn-ghost btn-sm'
  backBtn.style.cssText = 'margin-bottom:1rem;padding-left:0;color:var(--color-text-tertiary);'
  backBtn.textContent = '← Journal'
  backBtn.addEventListener('click', () => window.router?.navigate('/journal'))
  page.appendChild(backBtn)

  const header = document.createElement('div')
  header.style.cssText = 'display:flex;align-items:flex-start;justify-content:space-between;gap:8px;margin-bottom:1rem;'

  const headerLeft = document.createElement('div')

  const tagBadge = document.createElement('span')
  tagBadge.className = 'badge'
  tagBadge.style.marginBottom = '8px'
  tagBadge.textContent = entry.tag || 'observation'

  const dateEl = document.createElement('div')
  dateEl.style.cssText = 'font-size:13px;color:var(--color-text-tertiary);margin-top:4px;'
  dateEl.textContent = formatDateTime(entry.createdAt)

  if (plant) {
    const plantLink = document.createElement('button')
    plantLink.className = 'btn btn-ghost btn-sm'
    plantLink.style.cssText = 'padding:0;color:var(--color-green-400);font-size:13px;margin-top:4px;display:block;'
    plantLink.textContent = `🌿 ${plant.name}`
    plantLink.addEventListener('click', () => window.router?.navigate(`/plant/${plant.id}`))
    headerLeft.appendChild(tagBadge)
    headerLeft.appendChild(plantLink)
    headerLeft.appendChild(dateEl)
  } else {
    headerLeft.appendChild(tagBadge)
    headerLeft.appendChild(dateEl)
  }

  const actionBtns = document.createElement('div')
  actionBtns.style.cssText = 'display:flex;gap:6px;flex-shrink:0;'

  const editBtn = document.createElement('button')
  editBtn.className = 'btn btn-ghost btn-sm btn-icon'
  editBtn.setAttribute('aria-label', 'Edit entry')
  editBtn.style.fontSize = '18px'
  editBtn.textContent = '✎'
  editBtn.addEventListener('click', () => showEditForm())

  const deleteBtn = document.createElement('button')
  deleteBtn.className = 'btn btn-ghost btn-sm btn-icon'
  deleteBtn.setAttribute('aria-label', 'Delete entry')
  deleteBtn.style.cssText = 'color:var(--color-danger-text);font-size:16px;'
  deleteBtn.textContent = '✕'
  deleteBtn.addEventListener('click', () => handleDelete())

  actionBtns.appendChild(editBtn)
  actionBtns.appendChild(deleteBtn)

  header.appendChild(headerLeft)
  header.appendChild(actionBtns)
  page.appendChild(header)

  if (entry.text) {
    const textEl = document.createElement('div')
    textEl.style.cssText = `
      font-size:15px;color:var(--color-text-primary);
      line-height:1.7;white-space:pre-wrap;
      margin-bottom:1.25rem;
    `
    textEl.textContent = entry.text
    page.appendChild(textEl)
  }

  const envSummary = formatEnvironmentSummary(entry)
  if (envSummary) {
    const envCard = document.createElement('div')
    envCard.className = 'card'
    envCard.style.cssText = 'margin-bottom:1.25rem;background:var(--color-bg-tertiary);'

    const envLabel = document.createElement('div')
    envLabel.className = 'section-label'
    envLabel.style.marginBottom = '0.75rem'
    envLabel.textContent = 'Environment'

    const envGrid = document.createElement('div')
    envGrid.style.cssText = 'display:grid;grid-template-columns:1fr 1fr;gap:8px;'

    const envFields = [
      { key: 'ppfd', label: 'Light', unit: 'PPFD' },
      { key: 'humidity', label: 'Humidity', unit: '%' },
      { key: 'temperature', label: 'Temperature', unit: '°F' },
      { key: 'ph', label: 'Soil pH', unit: '' },
      { key: 'height', label: 'Height', unit: '"' },
      { key: 'spread', label: 'Spread', unit: '"' }
    ]

    envFields.forEach(({ key, label, unit }) => {
      if (entry[key] == null) return
      const item = document.createElement('div')
      item.style.cssText = 'display:flex;flex-direction:column;'
      const itemLabel = document.createElement('span')
      itemLabel.style.cssText = 'font-size:11px;color:var(--color-text-muted);text-transform:uppercase;letter-spacing:0.4px;'
      itemLabel.textContent = label
      const itemValue = document.createElement('span')
      itemValue.style.cssText = 'font-size:15px;font-weight:500;color:var(--color-text-primary);'
      itemValue.textContent = `${entry[key]}${unit}`
      item.appendChild(itemLabel)
      item.appendChild(itemValue)
      envGrid.appendChild(item)
    })

    envCard.appendChild(envLabel)
    envCard.appendChild(envGrid)

    if (entry.envNotes) {
      const envNotes = document.createElement('div')
      envNotes.style.cssText = 'font-size:13px;color:var(--color-text-secondary);margin-top:10px;line-height:1.5;'
      envNotes.textContent = entry.envNotes
      envCard.appendChild(envNotes)
    }

    page.appendChild(envCard)
  }

  const photosLabel = document.createElement('div')
  photosLabel.className = 'section-label'
  photosLabel.style.marginBottom = '0.75rem'
  photosLabel.textContent = 'Photos'
  page.appendChild(photosLabel)

  createPhotoUpload({
    plantId: entry.plantId,
    journalId: entryId,
    container: page,
    allowMultiple: true,
    enlarged: true
  })

  async function handleDelete() {
    confirmModal({
      title: 'Delete entry?',
      message: 'Permanently delete this journal entry and its photos?',
      confirmLabel: 'Delete',
      confirmCls: 'btn-danger',
      onConfirm: async () => {
        try {
          await Journal.delete(entryId)
          window.router?.navigate('/journal')
        } catch (err) {
          alertModal({ title: 'Error', message: err.message })
        }
      }
    })
  }

  async function showEditForm() {
    const form = document.createElement('div')
    form.style.cssText = 'display:flex;flex-direction:column;gap:0.875rem;'

    const tagGroup = document.createElement('div')
    const tagLbl = document.createElement('label')
    tagLbl.textContent = 'Tag *'
    const tagSelect = document.createElement('select')
    tagSelect.innerHTML = JOURNAL_TAGS.map(t =>
      `<option value="${t}" ${entry.tag === t ? 'selected' : ''}>${t}</option>`
    ).join('')
    tagGroup.appendChild(tagLbl)
    tagGroup.appendChild(tagSelect)
    form.appendChild(tagGroup)

    const textGroup = document.createElement('div')
    const textLbl = document.createElement('label')
    textLbl.textContent = 'Entry *'
    const textArea = document.createElement('textarea')
    textArea.value = entry.text || ''
    textArea.rows = 5
    textArea.style.minHeight = '120px'
    textGroup.appendChild(textLbl)
    textGroup.appendChild(textArea)
    form.appendChild(textGroup)

    const envLogger = createEnvironmentLogger({
      container: form,
      initialValues: {
        ppfd: entry.ppfd,
        humidity: entry.humidity,
        temperature: entry.temperature,
        ph: entry.ph,
        height: entry.height,
        spread: entry.spread,
        envNotes: entry.envNotes
      }
    })

    const errorEl = document.createElement('div')
    errorEl.className = 'error-text'
    form.appendChild(errorEl)

    const btnRow = document.createElement('div')
    btnRow.style.cssText = 'display:flex;gap:8px;'

    const saveBtn = document.createElement('button')
    saveBtn.className = 'btn btn-primary'
    saveBtn.style.flex = '1'
    saveBtn.textContent = 'Save changes'

    const cancelBtn = document.createElement('button')
    cancelBtn.className = 'btn btn-secondary'
    cancelBtn.textContent = 'Cancel'

    btnRow.appendChild(saveBtn)
    btnRow.appendChild(cancelBtn)
    form.appendChild(btnRow)

    const modalInstance = createModal({ title: 'Edit entry', content: form })

    cancelBtn.addEventListener('click', () => modalInstance.close())

    saveBtn.addEventListener('click', async () => {
      const envValues = envLogger.getValues()
      const updated = {
        ...entry,
        tag: tagSelect.value,
        text: textArea.value.trim(),
        ...envValues
      }

      const { valid, errors } = validateJournalEntry(updated)
      if (!valid) {
        errorEl.textContent = Object.values(errors)[0]
        return
      }

      saveBtn.disabled = true
      saveBtn.textContent = 'Saving...'

      try {
        await Journal.update(updated)
        modalInstance.close()
        window.router?.navigate(`/journal/${entryId}`)
      } catch (err) {
        errorEl.textContent = err.message
        saveBtn.disabled = false
        saveBtn.textContent = 'Save changes'
      }
    })

    setTimeout(() => textArea.focus(), 100)
  }

  return page
}
