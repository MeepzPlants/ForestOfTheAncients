import { Harvest, Plants } from '../db/queries.js'
import { createHarvestCard, createHarvestSummary } from '../components/HarvestCard.js'
import { createSearchFilter, applyFilters } from '../components/SearchFilter.js'
import { validateHarvest } from '../utils/validators.js'
import { confirmModal, alertModal, createModal } from '../components/Modal.js'
import { todayInputDate } from '../utils/dateHelpers.js'
import { HARVEST_UNITS } from '../data/defaultPlants.js'

export async function HarvestPage() {
  const page = document.createElement('div')
  page.className = 'page'

  const header = document.createElement('div')
  header.style.cssText = 'display:flex;align-items:center;justify-content:space-between;margin-bottom:1.25rem;'

  const title = document.createElement('h1')
  title.className = 'page-title'
  title.style.marginBottom = '0'
  title.textContent = 'Harvest log'

  const countEl = document.createElement('span')
  countEl.style.cssText = 'font-size:13px;color:var(--color-text-tertiary);margin-left:8px;font-weight:400;'

  const titleRow = document.createElement('div')
  titleRow.style.cssText = 'display:flex;align-items:baseline;'
  titleRow.appendChild(title)
  titleRow.appendChild(countEl)
  header.appendChild(titleRow)
  page.appendChild(header)

  const plants = await Plants.getAll()
  const plantMap = {}
  plants.forEach(p => { plantMap[p.id] = p })

  let allHarvests = []
  let searchQuery = ''
  let activePlantFilter = null

  const plantChips = [
    { label: 'All plants', value: '' },
    ...plants.map(p => ({ label: p.name, value: String(p.id) }))
  ]

  const searchFilter = createSearchFilter({
    placeholder: 'Search harvests...',
    chips: plantChips,
    onSearch: (q) => { searchQuery = q; renderList() },
    onFilter: (f) => { activePlantFilter = f.length > 0 ? parseInt(f[0]) : null; renderList() },
    container: page
  })

  const summaryContainer = document.createElement('div')
  summaryContainer.style.marginBottom = '1rem'
  page.appendChild(summaryContainer)

  const listContainer = document.createElement('div')
  page.appendChild(listContainer)

  const fab = document.createElement('button')
  fab.className = 'fab'
  fab.setAttribute('aria-label', 'Log harvest')
  fab.textContent = '+'
  document.body.appendChild(fab)
  fab.addEventListener('click', () => showAddForm())

  async function load() {
    allHarvests = await Harvest.getAll()
    renderSummary()
    renderList()
  }

  function renderSummary() {
    summaryContainer.innerHTML = ''
    if (allHarvests.length === 0) return
    const summary = createHarvestSummary({ entries: allHarvests, plantName: null })
    summaryContainer.appendChild(summary)
  }

  async function renderList() {
    listContainer.innerHTML = ''

    let filtered = [...allHarvests]

    if (activePlantFilter) {
      filtered = filtered.filter(e => e.plantId === activePlantFilter)
    }

    if (searchQuery) {
      const q = searchQuery.toLowerCase()
      filtered = filtered.filter(e =>
        plantMap[e.plantId]?.name?.toLowerCase().includes(q) ||
        e.description?.toLowerCase().includes(q) ||
        e.notes?.toLowerCase().includes(q)
      )
    }

    filtered.sort((a, b) => new Date(b.date || b.createdAt) - new Date(a.date || a.createdAt))
    countEl.textContent = `${allHarvests.length} entr${allHarvests.length !== 1 ? 'ies' : 'y'}`

    if (filtered.length === 0) {
      const empty = document.createElement('div')
      empty.className = 'empty-state'
      if (allHarvests.length === 0) {
        empty.innerHTML = `
          <div class="empty-state-icon">🍒</div>
          <p>No harvests logged yet.<br>Tap + to record your first harvest.</p>
        `
      } else {
        empty.innerHTML = '<div class="empty-state-icon">🔍</div><p>No harvests match your filters.</p>'
        const clearBtn = document.createElement('button')
        clearBtn.className = 'btn btn-secondary'
        clearBtn.textContent = 'Clear filters'
        clearBtn.addEventListener('click', () => {
          searchFilter.clear()
          searchQuery = ''
          activePlantFilter = null
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

      entries.forEach(entry => {
        const plant = plantMap[entry.plantId]
        const card = createHarvestCard({
          entry,
          plantName: plant?.name,
          showPlantName: !activePlantFilter,
          onClick: (e) => showEditForm(e),
          onDelete: (e) => handleDelete(e)
        })
        listContainer.appendChild(card)
      })
    }
  }

  function groupByMonth(entries) {
    const groups = {}
    entries.forEach(e => {
      const d = new Date(e.date || e.createdAt)
      const label = d.toLocaleDateString('en-US', { year: 'numeric', month: 'long' })
      if (!groups[label]) groups[label] = []
      groups[label].push(e)
    })
    return groups
  }

  async function handleDelete(entry) {
    const plant = plantMap[entry.plantId]
    confirmModal({
      title: 'Delete harvest entry?',
      message: `Delete this harvest record for ${plant?.name || 'this plant'}?`,
      confirmLabel: 'Delete',
      confirmCls: 'btn-danger',
      onConfirm: async () => {
        try {
          await Harvest.delete(entry.id)
          await load()
        } catch (err) {
          alertModal({ title: 'Error', message: err.message })
        }
      }
    })
  }

  function buildForm(existing = null) {
    const form = document.createElement('div')
    form.style.cssText = 'display:flex;flex-direction:column;gap:0.875rem;'

    const plantGroup = document.createElement('div')
    const plantLbl = document.createElement('label')
    plantLbl.textContent = 'Plant *'
    const plantSelect = document.createElement('select')
    plantSelect.innerHTML = '<option value="">Select a plant...</option>' +
      plants.map(p =>
        `<option value="${p.id}" ${existing?.plantId === p.id || activePlantFilter === p.id ? 'selected' : ''}>${p.name}</option>`
      ).join('')
    plantGroup.appendChild(plantLbl)
    plantGroup.appendChild(plantSelect)
    form.appendChild(plantGroup)

    const dateGroup = document.createElement('div')
    const dateLbl = document.createElement('label')
    dateLbl.textContent = 'Harvest date *'
    const dateInput = document.createElement('input')
    dateInput.type = 'date'
    dateInput.value = existing?.date || todayInputDate()
    dateGroup.appendChild(dateLbl)
    dateGroup.appendChild(dateInput)
    form.appendChild(dateGroup)

    const quantityRow = document.createElement('div')
    quantityRow.className = 'form-row'

    const qtyGroup = document.createElement('div')
    qtyGroup.className = 'form-group'
    qtyGroup.style.marginBottom = '0'
    const qtyLbl = document.createElement('label')
    qtyLbl.textContent = 'Quantity'
    const qtyInput = document.createElement('input')
    qtyInput.type = 'number'
    qtyInput.min = '0'
    qtyInput.step = '0.1'
    qtyInput.placeholder = 'e.g. 12'
    qtyInput.value = existing?.quantity || ''
    const qtyUnitSelect = document.createElement('select')
    qtyUnitSelect.style.marginTop = '6px'
    qtyUnitSelect.innerHTML = HARVEST_UNITS.map(u =>
      `<option value="${u}" ${existing?.quantityUnit === u ? 'selected' : ''}>${u}</option>`
    ).join('')
    qtyGroup.appendChild(qtyLbl)
    qtyGroup.appendChild(qtyInput)
    qtyGroup.appendChild(qtyUnitSelect)

    const weightGroup = document.createElement('div')
    weightGroup.className = 'form-group'
    weightGroup.style.marginBottom = '0'
    const weightLbl = document.createElement('label')
    weightLbl.textContent = 'Weight'
    const weightInput = document.createElement('input')
    weightInput.type = 'number'
    weightInput.min = '0'
    weightInput.step = '0.1'
    weightInput.placeholder = 'e.g. 85'
    weightInput.value = existing?.weight || ''
    const weightUnitSelect = document.createElement('select')
    weightUnitSelect.style.marginTop = '6px'
    weightUnitSelect.innerHTML = HARVEST_UNITS.filter(u => u !== 'count' && u !== 'handful' && u !== 'cup')
      .map(u => `<option value="${u}" ${existing?.weightUnit === u ? 'selected' : ''}>${u}</option>`).join('')
    weightGroup.appendChild(weightLbl)
    weightGroup.appendChild(weightInput)
    weightGroup.appendChild(weightUnitSelect)

    quantityRow.appendChild(qtyGroup)
    quantityRow.appendChild(weightGroup)
    form.appendChild(quantityRow)

    const qualityGroup = document.createElement('div')
    const qualityLbl = document.createElement('label')
    qualityLbl.textContent = 'Quality (1–5 stars)'
    const qualitySelect = document.createElement('select')
    qualitySelect.innerHTML = '<option value="">Not rated</option>' +
      [1,2,3,4,5].map(n =>
        `<option value="${n}" ${existing?.quality === n ? 'selected' : ''}>
          ${'★'.repeat(n)}${'☆'.repeat(5-n)} (${n})
        </option>`
      ).join('')
    qualityGroup.appendChild(qualityLbl)
    qualityGroup.appendChild(qualitySelect)
    form.appendChild(qualityGroup)

    const descGroup = document.createElement('div')
    const descLbl = document.createElement('label')
    descLbl.textContent = 'Description'
    const descInput = document.createElement('input')
    descInput.type = 'text'
    descInput.placeholder = 'e.g. First ripe fruits of the season'
    descInput.value = existing?.description || ''
    descGroup.appendChild(descLbl)
    descGroup.appendChild(descInput)
    form.appendChild(descGroup)

    const notesGroup = document.createElement('div')
    const notesLbl = document.createElement('label')
    notesLbl.textContent = 'Notes'
    const notesInput = document.createElement('textarea')
    notesInput.rows = 2
    notesInput.placeholder = 'Flavor notes, observations...'
    notesInput.value = existing?.notes || ''
    notesGroup.appendChild(notesLbl)
    notesGroup.appendChild(notesInput)
    form.appendChild(notesGroup)

    const errorEl = document.createElement('div')
    errorEl.className = 'error-text'
    form.appendChild(errorEl)

    return {
      form,
      getValues: () => ({
        plantId: parseInt(plantSelect.value) || null,
        date: dateInput.value,
        quantity: qtyInput.value ? parseFloat(qtyInput.value) : null,
        quantityUnit: qtyUnitSelect.value,
        weight: weightInput.value ? parseFloat(weightInput.value) : null,
        weightUnit: weightUnitSelect.value,
        quality: qualitySelect.value ? parseInt(qualitySelect.value) : null,
        description: descInput.value.trim(),
        notes: notesInput.value.trim()
      }),
      errorEl
    }
  }

  async function showAddForm() {
    if (plants.length === 0) {
      alertModal({ title: 'No plants yet', message: 'Add a plant to your inventory before logging a harvest.' })
      return
    }

    const { form, getValues, errorEl } = buildForm()

    const btnRow = document.createElement('div')
    btnRow.style.cssText = 'display:flex;gap:8px;'

    const saveBtn = document.createElement('button')
    saveBtn.className = 'btn btn-primary'
    saveBtn.style.flex = '1'
    saveBtn.textContent = 'Log harvest'

    const cancelBtn = document.createElement('button')
    cancelBtn.className = 'btn btn-secondary'
    cancelBtn.textContent = 'Cancel'

    btnRow.appendChild(saveBtn)
    btnRow.appendChild(cancelBtn)
    form.appendChild(btnRow)

    const modalInstance = createModal({ title: 'Log harvest', content: form })
    cancelBtn.addEventListener('click', () => modalInstance.close())

    saveBtn.addEventListener('click', async () => {
      const values = getValues()
      const { valid, errors } = validateHarvest(values)
      if (!valid) { errorEl.textContent = Object.values(errors)[0]; return }

      saveBtn.disabled = true
      saveBtn.textContent = 'Saving...'

      try {
        await Harvest.add(values)
        modalInstance.close()
        await load()
      } catch (err) {
        errorEl.textContent = err.message
        saveBtn.disabled = false
        saveBtn.textContent = 'Log harvest'
      }
    })
  }

  async function showEditForm(entry) {
    const { form, getValues, errorEl } = buildForm(entry)

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

    const modalInstance = createModal({ title: 'Edit harvest', content: form })
    cancelBtn.addEventListener('click', () => modalInstance.close())

    saveBtn.addEventListener('click', async () => {
      const values = getValues()
      const { valid, errors } = validateHarvest(values)
      if (!valid) { errorEl.textContent = Object.values(errors)[0]; return }

      saveBtn.disabled = true
      saveBtn.textContent = 'Saving...'

      try {
        await Harvest.update({ ...entry, ...values })
        modalInstance.close()
        await load()
      } catch (err) {
        errorEl.textContent = err.message
        saveBtn.disabled = false
        saveBtn.textContent = 'Save changes'
      }
    })
  }

  await load()

  return {
    el: page,
    cleanup: () => fab.remove()
  }
}
