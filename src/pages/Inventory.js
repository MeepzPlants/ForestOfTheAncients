import { Plants, Journal, Photos } from '../db/queries.js'
import { createPlantCard } from '../components/PlantCard.js'
import { createSearchFilter, applyFilters } from '../components/SearchFilter.js'
import { validatePlant } from '../utils/validators.js'
import { confirmModal, alertModal, createModal } from '../components/Modal.js'
import { LOCATIONS } from '../data/defaultPlants.js'

export async function InventoryPage() {
  const page = document.createElement('div')
  page.className = 'page'

  const header = document.createElement('div')
  header.style.cssText = 'display:flex;align-items:center;justify-content:space-between;margin-bottom:1.25rem;'

  const title = document.createElement('h1')
  title.className = 'page-title'
  title.style.marginBottom = '0'
  title.textContent = 'Plants'

  const countEl = document.createElement('span')
  countEl.style.cssText = 'font-size:13px;color:var(--color-text-tertiary);margin-left:8px;font-weight:400;'

  const titleRow = document.createElement('div')
  titleRow.style.cssText = 'display:flex;align-items:baseline;gap:0;'
  titleRow.appendChild(title)
  titleRow.appendChild(countEl)

  header.appendChild(titleRow)
  page.appendChild(header)

  const locationChips = [
    { label: 'All', value: '' },
    ...LOCATIONS.map(l => ({ label: l, value: l }))
  ]

  let searchQuery = ''
  let activeFilters = []
  let allPlants = []
  let photoCache = {}

  const searchFilter = createSearchFilter({
    placeholder: 'Search plants...',
    chips: locationChips,
    onSearch: (q) => { searchQuery = q; renderList() },
    onFilter: (f) => { activeFilters = f; renderList() },
    container: page
  })

  const listContainer = document.createElement('div')
  page.appendChild(listContainer)

  const fab = document.createElement('button')
  fab.className = 'fab'
  fab.setAttribute('aria-label', 'Add plant')
  fab.textContent = '+'
  document.body.appendChild(fab)

  fab.addEventListener('click', () => showAddForm())

  async function load() {
    allPlants = await Plants.getAll()
    photoCache = await buildPhotoCache(allPlants)
    countEl.textContent = `${allPlants.length} plant${allPlants.length !== 1 ? 's' : ''}`
    renderList()
  }

  async function buildPhotoCache(plants) {
    const cache = {}
    if (plants.length <= 10) {
      await Promise.all(plants.map(async plant => {
        const photos = await Photos.getByPlantId(plant.id)
        if (photos.length > 0) {
          const latest = photos[photos.length - 1]
          cache[plant.id] = latest.thumbnail || latest.dataURL
        }
      }))
      return cache
    }
    const allPhotos = await Photos.getAll()
    const byPlant = {}
    allPhotos.forEach(photo => {
      if (!byPlant[photo.plantId]) byPlant[photo.plantId] = []
      byPlant[photo.plantId].push(photo)
    })
    Object.entries(byPlant).forEach(([plantId, photos]) => {
      const sorted = [...photos].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      cache[parseInt(plantId)] = sorted[0].thumbnail || sorted[0].dataURL
    })
    return cache
  }

  async function renderList() {
    listContainer.innerHTML = ''

    let filtered = applyFilters(allPlants, searchQuery, ['name', 'species', 'commonName', 'location', 'notes'], activeFilters, 'location')
    filtered = filtered.sort((a, b) => a.name.localeCompare(b.name))

    if (filtered.length === 0) {
      const empty = document.createElement('div')
      empty.className = 'empty-state'
      if (allPlants.length === 0) {
        empty.innerHTML = `
          <div class="empty-state-icon">🌱</div>
          <p>No plants yet.<br>Tap + to add your first plant.</p>
        `
      } else {
        empty.innerHTML = `
          <div class="empty-state-icon">🔍</div>
          <p>No plants match your search.</p>
        `
        const clearBtn = document.createElement('button')
        clearBtn.className = 'btn btn-secondary'
        clearBtn.textContent = 'Clear search'
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

    const groupedByLocation = {}
    filtered.forEach(plant => {
      const loc = plant.location || 'Unlisted'
      if (!groupedByLocation[loc]) groupedByLocation[loc] = []
      groupedByLocation[loc].push(plant)
    })

    const showGroups = activeFilters.length === 0 && !searchQuery

    if (showGroups) {
      for (const [location, plants] of Object.entries(groupedByLocation)) {
        const groupHeader = document.createElement('div')
        groupHeader.className = 'section-label'
        groupHeader.style.cssText = 'margin-bottom:0.5rem;margin-top:1rem;'
        groupHeader.textContent = `${location} (${plants.length})`
        listContainer.appendChild(groupHeader)

        for (const plant of plants) {
          const enriched = { ...plant, _cachedPhoto: photoCache[plant.id] }
          const card = await createPlantCard({
            plant: enriched,
            onClick: (p) => window.router?.navigate(`/plant/${p.id}`),
            onLongPress: (p) => showPlantActions(p),
            showPhoto: true
          })
          listContainer.appendChild(card)
        }
      }
    } else {
      for (const plant of filtered) {
        const enriched = { ...plant, _cachedPhoto: photoCache[plant.id] }
        const card = await createPlantCard({
          plant: enriched,
          onClick: (p) => window.router?.navigate(`/plant/${p.id}`),
          onLongPress: (p) => showPlantActions(p),
          showPhoto: true
        })
        listContainer.appendChild(card)
      }
    }
  }

  function showPlantActions(plant) {
    confirmModal({
      title: plant.name,
      message: 'What would you like to do?',
      confirmLabel: 'Delete plant',
      confirmCls: 'btn-danger',
      onConfirm: () => deletePlant(plant)
    })
  }

  async function deletePlant(plant) {
    confirmModal({
      title: 'Delete plant?',
      message: `Permanently delete ${plant.name} and all its journal entries, photos, and records? This cannot be undone.`,
      confirmLabel: 'Delete',
      confirmCls: 'btn-danger',
      onConfirm: async () => {
        try {
          await Plants.delete(plant.id)
          await Photos.deleteByPlantId(plant.id)
          await load()
        } catch (err) {
          alertModal({ title: 'Error', message: err.message })
        }
      }
    })
  }

  function showAddForm() {
    const form = document.createElement('div')
    form.style.cssText = 'display:flex;flex-direction:column;gap:0.875rem;'

    const nameGroup = fGroup('Plant name *')
    const nameInput = document.createElement('input')
    nameInput.type = 'text'
    nameInput.placeholder = 'e.g. Acerola #3'
    nameInput.maxLength = 100
    nameGroup.appendChild(nameInput)
    form.appendChild(nameGroup)

    const commonGroup = fGroup('Common name')
    const commonInput = document.createElement('input')
    commonInput.type = 'text'
    commonInput.placeholder = 'e.g. Barbados Cherry'
    commonInput.maxLength = 100
    commonGroup.appendChild(commonInput)
    form.appendChild(commonGroup)

    const speciesGroup = fGroup('Scientific name')
    const speciesInput = document.createElement('input')
    speciesInput.type = 'text'
    speciesInput.placeholder = 'e.g. Malpighia emarginata'
    speciesInput.maxLength = 200
    speciesGroup.appendChild(speciesInput)
    form.appendChild(speciesGroup)

    const locationGroup = fGroup('Location')
    const locationSelect = document.createElement('select')
    locationSelect.innerHTML = '<option value="">Select location...</option>' +
      LOCATIONS.map(l => `<option value="${l}">${l}</option>`).join('')
    locationGroup.appendChild(locationSelect)
    form.appendChild(locationGroup)

    const notesGroup = fGroup('Notes')
    const notesInput = document.createElement('textarea')
    notesInput.placeholder = 'Any initial notes about this plant...'
    notesInput.rows = 3
    notesGroup.appendChild(notesInput)
    form.appendChild(notesGroup)

    const errorEl = document.createElement('div')
    errorEl.className = 'error-text'
    form.appendChild(errorEl)

    const btnRow = document.createElement('div')
    btnRow.style.cssText = 'display:flex;gap:8px;margin-top:0.25rem;'

    const saveBtn = document.createElement('button')
    saveBtn.className = 'btn btn-primary'
    saveBtn.style.flex = '1'
    saveBtn.textContent = 'Add plant'

    const cancelBtn = document.createElement('button')
    cancelBtn.className = 'btn btn-secondary'
    cancelBtn.textContent = 'Cancel'

    btnRow.appendChild(saveBtn)
    btnRow.appendChild(cancelBtn)
    form.appendChild(btnRow)

    const modalInstance = createModal({
      title: 'Add plant',
      content: form,
      onClose: () => {}
    })

    cancelBtn.addEventListener('click', () => modalInstance?.close())

    saveBtn.addEventListener('click', async () => {
      const plant = {
        name: nameInput.value.trim(),
        commonName: commonInput.value.trim(),
        species: speciesInput.value.trim(),
        location: locationSelect.value,
        notes: notesInput.value.trim()
      }

      const { valid, errors } = validatePlant(plant)
      if (!valid) {
        errorEl.textContent = Object.values(errors)[0]
        return
      }

      if (allPlants.find(p => p.name.toLowerCase() === plant.name.toLowerCase())) {
        errorEl.textContent = 'A plant with this name already exists.'
        return
      }

      saveBtn.disabled = true
      saveBtn.textContent = 'Saving...'

      try {
        const id = await Plants.add(plant)
        modalInstance?.close()
        await load()
        window.router?.navigate(`/plant/${id}`)
      } catch (err) {
        errorEl.textContent = err.message
        saveBtn.disabled = false
        saveBtn.textContent = 'Add plant'
      }
    })

    nameInput.focus()
  }

  await load()

  return {
    el: page,
    cleanup: () => fab.remove()
  }
}

function fGroup(labelText) {
  const group = document.createElement('div')
  const label = document.createElement('label')
  label.textContent = labelText
  group.appendChild(label)
  return group
}
