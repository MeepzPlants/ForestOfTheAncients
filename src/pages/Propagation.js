import { Propagation, Plants } from '../db/queries.js'
import { createPropagationCard, propagationStatusChips } from '../components/PropagationCard.js'
import { createSearchFilter, applyFilters } from '../components/SearchFilter.js'
import { validatePropagation } from '../utils/validators.js'
import { confirmModal, alertModal, createModal } from '../components/Modal.js'
import { todayInputDate } from '../utils/dateHelpers.js'
import { PROPAGATION_METHODS, PROPAGATION_STATUSES } from '../data/defaultPlants.js'

export async function PropagationPage() {
  const page = document.createElement('div')
  page.className = 'page'

  const header = document.createElement('div')
  header.style.cssText = 'display:flex;align-items:center;justify-content:space-between;margin-bottom:1.25rem;'

  const title = document.createElement('h1')
  title.className = 'page-title'
  title.style.marginBottom = '0'
  title.textContent = 'Propagation'

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

  let allProps = []
  let searchQuery = ''
  let activeFilters = []

  const statusChips = propagationStatusChips()

  const searchFilter = createSearchFilter({
    placeholder: 'Search propagations...',
    chips: statusChips,
    onSearch: (q) => { searchQuery = q; renderList() },
    onFilter: (f) => { activeFilters = f; renderList() },
    container: page
  })

  const summaryCards = document.createElement('div')
  summaryCards.className = 'stat-grid'
  summaryCards.style.marginBottom = '1rem'
  page.appendChild(summaryCards)

  const listContainer = document.createElement('div')
  page.appendChild(listContainer)

  const fab = document.createElement('button')
  fab.className = 'fab'
  fab.setAttribute('aria-label', 'Add propagation')
  fab.textContent = '+'
  document.body.appendChild(fab)
  fab.addEventListener('click', () => showAddForm())

  async function load() {
    allProps = await Propagation.getAll()
    renderSummary()
    renderList()
  }

  function renderSummary() {
    summaryCards.innerHTML = ''
    const active = allProps.filter(p => !['Established', 'Failed'].includes(p.status))
    const established = allProps.filter(p => p.status === 'Established')
    const failed = allProps.filter(p => p.status === 'Failed')
    const rooting = allProps.filter(p => p.status === 'Rooting')

    ;[
      { value: active.length, label: 'Active' },
      { value: rooting.length, label: 'Rooting' },
      { value: established.length, label: 'Established' },
      { value: failed.length, label: 'Failed' }
    ].forEach(({ value, label }) => {
      const card = document.createElement('div')
      card.className = 'stat-card'
      card.innerHTML = `<div class="stat-value">${value}</div><div class="stat-label">${label}</div>`
      summaryCards.appendChild(card)
    })
  }

  async function renderList() {
    listContainer.innerHTML = ''

    let filtered = applyFilters(
      allProps,
      searchQuery,
      ['name', 'method', 'status', 'notes'],
      activeFilters,
      'status'
    )

    filtered.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    countEl.textContent = `${allProps.length} total`

    if (filtered.length === 0) {
      const empty = document.createElement('div')
      empty.className = 'empty-state'
      if (allProps.length === 0) {
        empty.innerHTML = `
          <div class="empty-state-icon">✂️</div>
          <p>No propagations recorded yet.<br>Tap + to track a cutting or seed.</p>
        `
      } else {
        empty.innerHTML = '<div class="empty-state-icon">🔍</div><p>No propagations match your filters.</p>'
        const clearBtn = document.createElement('button')
        clearBtn.className = 'btn btn-secondary'
        clearBtn.textContent = 'Clear filters'
        clearBtn.addEventListener('click', () => {
          searchFilter.clear()
          searchQuery = ''
          activeFilters = []
          renderList()
        })
        empty.appendChild(clearBtn)
      }
      listContainer.appendChild(empty)
      return
    }

    filtered.forEach(prop => {
      const parentPlant = plantMap[prop.parentPlantId]
      const card = createPropagationCard({
        prop,
        parentPlantName: parentPlant?.name,
        onClick: (p) => showEditForm(p),
        onDelete: (p) => handleDelete(p),
        onStatusChange: async (p, newStatus) => {
          await Propagation.update({ ...p, status: newStatus })
          await load()
        }
      })
      listContainer.appendChild(card)
    })
  }

  async function handleDelete(prop) {
    confirmModal({
      title: 'Delete propagation?',
      message: `Permanently delete "${prop.name}"?`,
      confirmLabel: 'Delete',
      confirmCls: 'btn-danger',
      onConfirm: async () => {
        try {
          await Propagation.delete(prop.id)
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

    const nameGroup = document.createElement('div')
    const nameLbl = document.createElement('label')
    nameLbl.textContent = 'Name / label *'
    const nameInput = document.createElement('input')
    nameInput.type = 'text'
    nameInput.placeholder = 'e.g. Acerola cutting #1'
    nameInput.value = existing?.name || ''
    nameGroup.appendChild(nameLbl)
    nameGroup.appendChild(nameInput)
    form.appendChild(nameGroup)

    const parentGroup = document.createElement('div')
    const parentLbl = document.createElement('label')
    parentLbl.textContent = 'Parent plant'
    const parentSelect = document.createElement('select')
    parentSelect.innerHTML = '<option value="">None / unknown</option>' +
      plants.map(p => `<option value="${p.id}" ${existing?.parentPlantId === p.id ? 'selected' : ''}>${p.name}</option>`).join('')
    parentGroup.appendChild(parentLbl)
    parentGroup.appendChild(parentSelect)
    form.appendChild(parentGroup)

    const methodGroup = document.createElement('div')
    const methodLbl = document.createElement('label')
    methodLbl.textContent = 'Method *'
    const methodSelect = document.createElement('select')
    methodSelect.innerHTML = PROPAGATION_METHODS.map(m =>
      `<option value="${m}" ${existing?.method === m ? 'selected' : ''}>${m}</option>`
    ).join('')
    methodGroup.appendChild(methodLbl)
    methodGroup.appendChild(methodSelect)
    form.appendChild(methodGroup)

    const statusGroup = document.createElement('div')
    const statusLbl = document.createElement('label')
    statusLbl.textContent = 'Status *'
    const statusSelect = document.createElement('select')
    statusSelect.innerHTML = PROPAGATION_STATUSES.map(s =>
      `<option value="${s}" ${existing?.status === s ? 'selected' : ''}>${s}</option>`
    ).join('')
    statusGroup.appendChild(statusLbl)
    statusGroup.appendChild(statusSelect)
    form.appendChild(statusGroup)

    const dateRow = document.createElement('div')
    dateRow.className = 'form-row'

    const startGroup = document.createElement('div')
    startGroup.className = 'form-group'
    startGroup.style.marginBottom = '0'
    const startLbl = document.createElement('label')
    startLbl.textContent = 'Start date *'
    const startInput = document.createElement('input')
    startInput.type = 'date'
    startInput.value = existing?.startDate || todayInputDate()
    startGroup.appendChild(startLbl)
    startGroup.appendChild(startInput)

    const expectedGroup = document.createElement('div')
    expectedGroup.className = 'form-group'
    expectedGroup.style.marginBottom = '0'
    const expectedLbl = document.createElement('label')
    expectedLbl.textContent = 'Expected date'
    const expectedInput = document.createElement('input')
    expectedInput.type = 'date'
    expectedInput.value = existing?.expectedDate || ''
    expectedGroup.appendChild(expectedLbl)
    expectedGroup.appendChild(expectedInput)

    dateRow.appendChild(startGroup)
    dateRow.appendChild(expectedGroup)
    form.appendChild(dateRow)

    const notesGroup = document.createElement('div')
    const notesLbl = document.createElement('label')
    notesLbl.textContent = 'Notes'
    const notesInput = document.createElement('textarea')
    notesInput.rows = 3
    notesInput.placeholder = 'Growing medium, conditions, observations...'
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
        name: nameInput.value.trim(),
        parentPlantId: parseInt(parentSelect.value) || null,
        method: methodSelect.value,
        status: statusSelect.value,
        startDate: startInput.value,
        expectedDate: expectedInput.value || null,
        notes: notesInput.value.trim()
      }),
      errorEl,
      nameInput
    }
  }

  async function showAddForm() {
    const { form, getValues, errorEl, nameInput } = buildForm()

    const btnRow = document.createElement('div')
    btnRow.style.cssText = 'display:flex;gap:8px;'

    const saveBtn = document.createElement('button')
    saveBtn.className = 'btn btn-primary'
    saveBtn.style.flex = '1'
    saveBtn.textContent = 'Add propagation'

    const cancelBtn = document.createElement('button')
    cancelBtn.className = 'btn btn-secondary'
    cancelBtn.textContent = 'Cancel'

    btnRow.appendChild(saveBtn)
    btnRow.appendChild(cancelBtn)
    form.appendChild(btnRow)

    const modalInstance = createModal({ title: 'New propagation', content: form })
    cancelBtn.addEventListener('click', () => modalInstance.close())

    saveBtn.addEventListener('click', async () => {
      const values = getValues()
      const { valid, errors } = validatePropagation(values)
      if (!valid) { errorEl.textContent = Object.values(errors)[0]; return }

      saveBtn.disabled = true
      saveBtn.textContent = 'Saving...'
      try {
        await Propagation.add(values)
        modalInstance.close()
        await load()
      } catch (err) {
        errorEl.textContent = err.message
        saveBtn.disabled = false
        saveBtn.textContent = 'Add propagation'
      }
    })

    setTimeout(() => nameInput.focus(), 100)
  }

  async function showEditForm(prop) {
    const { form, getValues, errorEl } = buildForm(prop)

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

    const modalInstance = createModal({ title: 'Edit propagation', content: form })
    cancelBtn.addEventListener('click', () => modalInstance.close())

    saveBtn.addEventListener('click', async () => {
      const values = getValues()
      const { valid, errors } = validatePropagation(values)
      if (!valid) { errorEl.textContent = Object.values(errors)[0]; return }

      saveBtn.disabled = true
      saveBtn.textContent = 'Saving...'
      try {
        await Propagation.update({ ...prop, ...values })
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
