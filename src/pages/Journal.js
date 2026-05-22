import { Journal, Plants, Photos } from '../db/queries.js'
import { createJournalCard, journalTagChips } from '../components/JournalCard.js'
import { createSearchFilter, applyFilters } from '../components/SearchFilter.js'
import { createPhotoUpload } from '../components/PhotoUpload.js'
import { createEnvironmentLogger } from '../components/EnvironmentLogger.js'
import { validateJournalEntry } from '../utils/validators.js'
import { confirmModal, alertModal, createModal } from '../components/Modal.js'
import { todayInputDate } from '../utils/dateHelpers.js'
import { JOURNAL_TAGS } from '../data/defaultPlants.js'

export async function JournalPage() {
  const page = document.createElement('div')
  page.className = 'page'

  const header = document.createElement('div')
  header.style.cssText = 'display:flex;align-items:center;justify-content:space-between;margin-bottom:1.25rem;'

  const title = document.createElement('h1')
  title.className = 'page-title'
  title.style.marginBottom = '0'
  title.textContent = 'Journal'

  header.appendChild(title)
  page.appendChild(header)

  const plants = await Plants.getAll()
  const plantMap = {}
  plants.forEach(p => { plantMap[p.id] = p })

  let allEntries = []
  let searchQuery = ''
  let activeFilters = []
  let selectedPlantId = null

  const preselect = sessionStorage.getItem('journal_preselect_plant')
  if (preselect) {
    selectedPlantId = parseInt(preselect)
    sessionStorage.removeItem('journal_preselect_plant')
  }

  const plantChips = [
    { label: 'All plants', value: '' },
    ...plants.map(p => ({ label: p.name, value: String(p.id) }))
  ]

  const tagChips = journalTagChips()

  const filterSection = document.createElement('div')
  filterSection.style.marginBottom = '1rem'

  const plantFilter = createSearchFilter({
    placeholder: 'Search entries...',
    chips: plantChips,
    onSearch: (q) => { searchQuery = q; renderList() },
    onFilter: (f) => {
      selectedPlantId = f.length > 0 ? parseInt(f[0]) : null
      renderList()
    },
    container: filterSection
  })

  const tagLabel = document.createElement('div')
  tagLabel.className = 'section-label'
  tagLabel.style.cssText = 'margin-bottom:6px;margin-top:8px;'
  tagLabel.textContent = 'Filter by tag'
  filterSection.appendChild(tagLabel)

  let activeTagFilter = ''
  const tagChipGroup = document.createElement('div')
  tagChipGroup.className = 'chip-group'
  tagChipGroup.style.marginBottom = '0'

  tagChips.forEach(({ label, value }) => {
    const chip = document.createElement('button')
    chip.type = 'button'
    chip.className = `chip${value === '' ? ' active' : ''}`
    chip.textContent = label
    chip.addEventListener('click', () => {
      activeTagFilter = value
      tagChipGroup.querySelectorAll('.chip').forEach(c => c.classList.remove('active'))
      chip.classList.add('active')
      renderList()
    })
    tagChipGroup.appendChild(chip)
  })

  filterSection.appendChild(tagChipGroup)
  page.appendChild(filterSection)

  const listContainer = document.createElement('div')
  page.appendChild(listContainer)

  const fab = document.createElement('button')
  fab.className = 'fab'
  fab.setAttribute('aria-label', 'Add journal entry')
  fab.textContent = '+'
  document.body.appendChild(fab)
  fab.addEventListener('click', () => showAddForm())

  async function load() {
    allEntries = await Journal.getAll()
    renderList()
  }

  async function renderList() {
    listContainer.innerHTML = ''

    let filtered = [...allEntries]

    if (selectedPlantId) {
      filtered = filtered.filter(e => e.plantId === selectedPlantId)
    }

    if (activeTagFilter) {
      filtered = filtered.filter(e => e.tag === activeTagFilter)
    }

    if (searchQuery) {
      const q = searchQuery.toLowerCase()
      filtered = filtered.filter(e =>
        e.text?.toLowerCase().includes(q) ||
        plantMap[e.plantId]?.name?.toLowerCase().includes(q) ||
        e.tag?.toLowerCase().includes(q)
      )
    }

    filtered.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))

    if (filtered.length === 0) {
      const empty = document.createElement('div')
      empty.className = 'empty-state'
      if (allEntries.length === 0) {
        empty.innerHTML = '<div class="empty-state-icon">📓</div><p>No journal entries yet.<br>Tap + to add your first entry.</p>'
      } else {
        empty.innerHTML = '<div class="empty-state-icon">🔍</div><p>No entries match your filters.</p>'
        const clearBtn = document.createElement('button')
        clearBtn.className = 'btn btn-secondary'
        clearBtn.textContent = 'Clear filters'
        clearBtn.addEventListener('click', () => {
          plantFilter.clear()
          searchQuery = ''
          selectedPlantId = null
          activeTagFilter = ''
          tagChipGroup.querySelectorAll('.chip').forEach((c, i) => {
            c.classList.toggle('active', i === 0)
          })
          renderList()
        })
        empty.appendChild(clearBtn)
      }
      listContainer.appendChild(empty)
      return
    }

    const grouped = groupByMonth(filtered)

    for (const [month, entries] of Object.entries(grouped)) {
      const monthHeader = document.createElement('div')
      monthHeader.className = 'section-label'
      monthHeader.style.cssText = 'margin-bottom:0.5rem;margin-top:1rem;'
      monthHeader.textContent = `${month} (${entries.length})`
      listContainer.appendChild(monthHeader)

      for (const entry of entries) {
        const plant = plantMap[entry.plantId]
        const card = await createJournalCard({
          entry,
          plantName: plant?.name,
          showPlantName: !selectedPlantId,
          onClick: (e) => window.router?.navigate(`/journal/${e.id}`),
          onDelete: (e) => handleDelete(e)
        })
        listContainer.appendChild(card)
      }
    }
  }

  function groupByMonth(entries) {
    const groups = {}
    entries.forEach(e => {
      const d = new Date(e.createdAt)
      const label = d.toLocaleDateString('en-US', { year: 'numeric', month: 'long' })
      if (!groups[label]) groups[label] = []
      groups[label].push(e)
    })
    return groups
  }

  async function handleDelete(entry) {
    confirmModal({
      title: 'Delete entry?',
      message: 'Permanently delete this journal entry and its photos?',
      confirmLabel: 'Delete',
      confirmCls: 'btn-danger',
      onConfirm: async () => {
        try {
          await Journal.delete(entry.id)
          await load()
        } catch (err) {
          alertModal({ title: 'Error', message: err.message })
        }
      }
    })
  }

  async function showAddForm() {
    if (plants.length === 0) {
      alertModal({
        title: 'No plants yet',
        message: 'Add a plant to your inventory before creating journal entries.'
      })
      return
    }

    const form = document.createElement('div')
    form.style.cssText = 'display:flex;flex-direction:column;gap:0.875rem;'

    const plantGroup = document.createElement('div')
    const plantLabel = document.createElement('label')
    plantLabel.textContent = 'Plant *'
    const plantSelect = document.createElement('select')
    plantSelect.innerHTML = '<option value="">Select a plant...</option>' +
      plants.map(p => `<option value="${p.id}" ${selectedPlantId === p.id ? 'selected' : ''}>${p.name}</option>`).join('')
    plantGroup.appendChild(plantLabel)
    plantGroup.appendChild(plantSelect)
    form.appendChild(plantGroup)

    const tagGroup = document.createElement('div')
    const tagLabel2 = document.createElement('label')
    tagLabel2.textContent = 'Tag *'
    const tagSelect = document.createElement('select')
    tagSelect.innerHTML = JOURNAL_TAGS.map(t => `<option value="${t}">${t}</option>`).join('')
    if (activeTagFilter) tagSelect.value = activeTagFilter
    tagGroup.appendChild(tagLabel2)
    tagGroup.appendChild(tagSelect)
    form.appendChild(tagGroup)

    const textGroup = document.createElement('div')
    const textLabel = document.createElement('label')
    textLabel.textContent = 'Entry *'
    const textArea = document.createElement('textarea')
    textArea.placeholder = 'Describe what you observed...'
    textArea.rows = 4
    textArea.style.minHeight = '100px'
    textGroup.appendChild(textLabel)
    textGroup.appendChild(textArea)
    form.appendChild(textGroup)

    const envLogger = createEnvironmentLogger({ container: form })

    const photoSection = document.createElement('div')
    const photoSectionLabel = document.createElement('div')
    photoSectionLabel.className = 'section-label'
    photoSectionLabel.style.cssText = 'margin-bottom:6px;'
    photoSectionLabel.textContent = 'Photos'
    photoSection.appendChild(photoSectionLabel)
    form.appendChild(photoSection)

    const errorEl = document.createElement('div')
    errorEl.className = 'error-text'
    form.appendChild(errorEl)

    const btnRow = document.createElement('div')
    btnRow.style.cssText = 'display:flex;gap:8px;'

    const saveBtn = document.createElement('button')
    saveBtn.className = 'btn btn-primary'
    saveBtn.style.flex = '1'
    saveBtn.textContent = 'Save entry'

    const cancelBtn = document.createElement('button')
    cancelBtn.className = 'btn btn-secondary'
    cancelBtn.textContent = 'Cancel'

    btnRow.appendChild(saveBtn)
    btnRow.appendChild(cancelBtn)
    form.appendChild(btnRow)

    let savedEntryId = null
    let photoUploader = null
    let modalInstance = null

    modalInstance = createModal({
      title: 'New journal entry',
      content: form
    })

    cancelBtn.addEventListener('click', () => modalInstance?.close())

    saveBtn.addEventListener('click', async () => {
      const plantId = parseInt(plantSelect.value)
      const envValues = envLogger.getValues()

      const entry = {
        plantId: plantId || null,
        tag: tagSelect.value,
        text: textArea.value.trim(),
        ...envValues
      }

      const { valid, errors } = validateJournalEntry(entry)
      if (!valid) {
        errorEl.textContent = Object.values(errors)[0]
        return
      }

      saveBtn.disabled = true
      saveBtn.textContent = 'Saving...'

      try {
        savedEntryId = await Journal.add(entry)

        if (photoSection.contains(photoSection.querySelector('.photo-upload'))) {
        } else {
          photoUploader = createPhotoUpload({
            plantId,
            journalId: savedEntryId,
            container: photoSection,
            allowMultiple: true,
            enlarged: true
          })
        }

        modalInstance?.close()
        await load()
      } catch (err) {
        errorEl.textContent = err.message
        saveBtn.disabled = false
        saveBtn.textContent = 'Save entry'
      }
    })

    if (selectedPlantId) {
      plantSelect.value = selectedPlantId
    }
    setTimeout(() => textArea.focus(), 100)
  }

  if (selectedPlantId) {
    showAddForm()
  }

  await load()

  return {
    el: page,
    cleanup: () => fab.remove()
  }
}
