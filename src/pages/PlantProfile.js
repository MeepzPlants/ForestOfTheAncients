import { Plants, Journal, Photos, Propagation, Harvest, Reminders } from '../db/queries.js'
import { createJournalCard, journalTagChips } from '../components/JournalCard.js'
import { createGrowthChart } from '../components/GrowthChart.js'
import { createPhotoUpload } from '../components/PhotoUpload.js'
import { createReminderWidget } from '../components/ReminderWidget.js'
import { createHarvestSummary } from '../components/HarvestCard.js'
import { validatePlant } from '../utils/validators.js'
import { confirmModal, alertModal, createModal } from '../components/Modal.js'
import { formatDate, formatRelative, daysSince } from '../utils/dateHelpers.js'
import { plantEmoji } from '../components/PlantCard.js'
import { LOCATIONS } from '../data/defaultPlants.js'

export async function PlantProfilePage({ id }) {
  const plantId = parseInt(id)
  const page = document.createElement('div')
  page.className = 'page'

  const plant = await Plants.getById(plantId)
  if (!plant) {
    page.innerHTML = `
      <div class="empty-state" style="margin-top:3rem;">
        <div class="empty-state-icon">🌿</div>
        <p>Plant not found.</p>
        <button class="btn btn-secondary" onclick="window.router?.navigate('/inventory')">Back to inventory</button>
      </div>
    `
    return page
  }

  const backBtn = document.createElement('button')
  backBtn.className = 'btn btn-ghost btn-sm'
  backBtn.style.cssText = 'margin-bottom:1rem;padding-left:0;color:var(--color-text-tertiary);'
  backBtn.textContent = '← Plants'
  backBtn.addEventListener('click', () => window.router?.navigate('/inventory'))
  page.appendChild(backBtn)

  const heroSection = document.createElement('div')
  heroSection.style.cssText = 'margin-bottom:1.25rem;'

  const heroHeader = document.createElement('div')
  heroHeader.style.cssText = 'display:flex;align-items:flex-start;gap:12px;margin-bottom:0.875rem;'

  const heroIcon = document.createElement('div')
  heroIcon.style.cssText = `
    width:56px;height:56px;border-radius:var(--radius-lg);
    background:var(--color-bg-tertiary);flex-shrink:0;
    overflow:hidden;display:flex;align-items:center;justify-content:center;font-size:28px;
  `

  const allPhotos = await Photos.getByPlantId(plantId)
  const latestPhoto = allPhotos.length > 0 ? allPhotos[allPhotos.length - 1] : null

  if (latestPhoto) {
    const img = document.createElement('img')
    img.src = latestPhoto.thumbnail || latestPhoto.dataURL
    img.alt = plant.name
    img.style.cssText = 'width:100%;height:100%;object-fit:cover;'
    heroIcon.appendChild(img)
  } else {
    heroIcon.textContent = plantEmoji(plant.species)
  }

  const heroText = document.createElement('div')
  heroText.style.cssText = 'flex:1;min-width:0;'

  const heroName = document.createElement('h1')
  heroName.style.cssText = 'font-size:22px;font-weight:700;color:var(--color-text-primary);margin-bottom:3px;'
  heroName.textContent = plant.name

  const heroSpecies = document.createElement('div')
  heroSpecies.style.cssText = 'font-size:13px;color:var(--color-text-tertiary);font-style:italic;margin-bottom:6px;'
  heroSpecies.textContent = plant.species || 'Unknown species'

  if (plant.commonName) {
    const heroCommon = document.createElement('div')
    heroCommon.style.cssText = 'font-size:13px;color:var(--color-text-secondary);margin-bottom:6px;'
    heroCommon.textContent = plant.commonName
    heroText.appendChild(heroName)
    heroText.appendChild(heroSpecies)
    heroText.appendChild(heroCommon)
  } else {
    heroText.appendChild(heroName)
    heroText.appendChild(heroSpecies)
  }

  const heroMeta = document.createElement('div')
  heroMeta.style.cssText = 'display:flex;gap:6px;flex-wrap:wrap;'

  if (plant.location) {
    const locBadge = document.createElement('span')
    locBadge.className = 'badge'
    locBadge.textContent = plant.location
    heroMeta.appendChild(locBadge)
  }

  const ageBadge = document.createElement('span')
  ageBadge.style.cssText = 'font-size:11px;color:var(--color-text-muted);'
  ageBadge.textContent = `Added ${formatRelative(plant.createdAt)}`
  heroMeta.appendChild(ageBadge)

  heroText.appendChild(heroMeta)

  const editBtn = document.createElement('button')
  editBtn.className = 'btn btn-ghost btn-sm btn-icon'
  editBtn.setAttribute('aria-label', 'Edit plant')
  editBtn.style.cssText = 'font-size:18px;flex-shrink:0;'
  editBtn.textContent = '✎'
  editBtn.addEventListener('click', () => showEditForm(plant))

  heroHeader.appendChild(heroIcon)
  heroHeader.appendChild(heroText)
  heroHeader.appendChild(editBtn)
  heroSection.appendChild(heroHeader)

  if (plant.notes) {
    const notesEl = document.createElement('div')
    notesEl.style.cssText = `
      font-size:13px;color:var(--color-text-secondary);
      background:var(--color-bg-tertiary);
      border-radius:var(--radius-md);padding:10px 12px;
      line-height:1.6;white-space:pre-wrap;
    `
    notesEl.textContent = plant.notes
    heroSection.appendChild(notesEl)
  }

  page.appendChild(heroSection)

  const [journalEntries, propagations, harvests] = await Promise.all([
    Journal.getByPlantId(plantId),
    Propagation.getByParentPlantId(plantId),
    Harvest.getByPlantId(plantId)
  ])

  const quickStats = document.createElement('div')
  quickStats.className = 'stat-grid'
  quickStats.style.marginBottom = '1.25rem'

  const activeProps = propagations.filter(p => p.status !== 'Established' && p.status !== 'Failed')

  ;[
    { value: journalEntries.length, label: 'Entries' },
    { value: allPhotos.length, label: 'Photos' },
    { value: activeProps.length, label: 'Propagating' },
    { value: harvests.length, label: 'Harvests' }
  ].forEach(({ value, label }) => {
    const card = document.createElement('div')
    card.className = 'stat-card'
    card.innerHTML = `<div class="stat-value">${value}</div><div class="stat-label">${label}</div>`
    quickStats.appendChild(card)
  })

  page.appendChild(quickStats)

  const tabs = ['Journal', 'Photos', 'Growth', 'Propagation', 'Harvest', 'Reminders']
  let activeTab = 'Journal'

  const tabBar = document.createElement('div')
  tabBar.style.cssText = `
    display:flex;gap:0;overflow-x:auto;
    border-bottom:1px solid var(--color-border-subtle);
    margin-bottom:1rem;scrollbar-width:none;
  `
  tabBar.style.cssText += '-ms-overflow-style:none;'

  const tabContent = document.createElement('div')

  const tabBtns = {}

  tabs.forEach(tab => {
    const btn = document.createElement('button')
    btn.type = 'button'
    btn.textContent = tab
    btn.style.cssText = `
      flex-shrink:0;padding:10px 14px;font-size:13px;font-weight:500;
      border:none;background:none;cursor:pointer;
      border-bottom:2px solid transparent;margin-bottom:-1px;
      color:var(--color-text-tertiary);transition:color 150ms,border-color 150ms;
      white-space:nowrap;
    `

    btn.addEventListener('click', () => {
      activeTab = tab
      Object.entries(tabBtns).forEach(([t, b]) => {
        const isActive = t === tab
        b.style.color = isActive ? 'var(--color-text-primary)' : 'var(--color-text-tertiary)'
        b.style.borderBottomColor = isActive ? 'var(--color-green-400)' : 'transparent'
      })
      renderTab(tab)
    })

    tabBtns[tab] = btn
    tabBar.appendChild(btn)
  })

  tabBtns['Journal'].style.color = 'var(--color-text-primary)'
  tabBtns['Journal'].style.borderBottomColor = 'var(--color-green-400)'

  page.appendChild(tabBar)
  page.appendChild(tabContent)

  const fab = document.createElement('button')
  fab.className = 'fab'
  fab.setAttribute('aria-label', 'Add entry')
  fab.textContent = '+'
  document.body.appendChild(fab)

  fab.addEventListener('click', () => {
    if (activeTab === 'Journal') navigateToJournal()
    else if (activeTab === 'Photos') document.querySelector('.photo-drop-zone')?.click()
    else if (activeTab === 'Propagation') window.router?.navigate('/propagation')
    else if (activeTab === 'Harvest') window.router?.navigate('/harvest')
    else if (activeTab === 'Reminders') window.router?.navigate('/reminders')
  })

  async function renderTab(tab) {
    tabContent.innerHTML = ''

    if (tab === 'Journal') {
      const addEntryBtn = document.createElement('button')
      addEntryBtn.className = 'btn btn-secondary btn-full'
      addEntryBtn.style.marginBottom = '1rem'
      addEntryBtn.textContent = '+ Add journal entry'
      addEntryBtn.addEventListener('click', navigateToJournal)
      tabContent.appendChild(addEntryBtn)

      const sorted = [...journalEntries].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))

      if (sorted.length === 0) {
        const empty = document.createElement('div')
        empty.className = 'empty-state'
        empty.innerHTML = '<div class="empty-state-icon">📓</div><p>No journal entries yet.</p>'
        tabContent.appendChild(empty)
        return
      }

      for (const entry of sorted) {
        const card = await createJournalCard({
          entry,
          plantName: plant.name,
          onClick: (e) => window.router?.navigate(`/journal/${e.id}`),
          onDelete: (e) => handleDeleteEntry(e)
        })
        tabContent.appendChild(card)
      }
    }

    if (tab === 'Photos') {
      createPhotoUpload({
        plantId,
        journalId: null,
        container: tabContent,
        allowMultiple: true,
        enlarged: true,
        onUpload: async () => {
          const updated = await Photos.getByPlantId(plantId)
          if (updated.length > 0) {
            const img = heroIcon.querySelector('img')
            const latest = updated[updated.length - 1]
            if (img) {
              img.src = latest.thumbnail || latest.dataURL
            } else {
              heroIcon.innerHTML = ''
              const newImg = document.createElement('img')
              newImg.src = latest.thumbnail || latest.dataURL
              newImg.alt = plant.name
              newImg.style.cssText = 'width:100%;height:100%;object-fit:cover;'
              heroIcon.appendChild(newImg)
            }
          }
        }
      })
    }

    if (tab === 'Growth') {
      await createGrowthChart({ plantId, container: tabContent })
    }

    if (tab === 'Propagation') {
      const addPropBtn = document.createElement('button')
      addPropBtn.className = 'btn btn-secondary btn-full'
      addPropBtn.style.marginBottom = '1rem'
      addPropBtn.textContent = '+ New propagation'
      addPropBtn.addEventListener('click', () => window.router?.navigate('/propagation'))
      tabContent.appendChild(addPropBtn)

      if (propagations.length === 0) {
        const empty = document.createElement('div')
        empty.className = 'empty-state'
        empty.innerHTML = '<div class="empty-state-icon">✂️</div><p>No propagations recorded for this plant.</p>'
        tabContent.appendChild(empty)
        return
      }

      const { createPropagationCard } = await import('../components/PropagationCard.js')
      const sorted = [...propagations].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      sorted.forEach(prop => {
        const card = createPropagationCard({
          prop,
          parentPlantName: plant.name,
          onStatusChange: async (p, newStatus) => {
            await import('../db/queries.js').then(({ Propagation }) =>
              Propagation.update({ ...p, status: newStatus })
            )
            renderTab('Propagation')
          }
        })
        tabContent.appendChild(card)
      })
    }

    if (tab === 'Harvest') {
      const addHarvestBtn = document.createElement('button')
      addHarvestBtn.className = 'btn btn-secondary btn-full'
      addHarvestBtn.style.marginBottom = '1rem'
      addHarvestBtn.textContent = '+ Log harvest'
      addHarvestBtn.addEventListener('click', () => window.router?.navigate('/harvest'))
      tabContent.appendChild(addHarvestBtn)

      if (harvests.length === 0) {
        const empty = document.createElement('div')
        empty.className = 'empty-state'
        empty.innerHTML = '<div class="empty-state-icon">🍒</div><p>No harvests logged for this plant.</p>'
        tabContent.appendChild(empty)
        return
      }

      const summary = createHarvestSummary({ entries: harvests, plantName: plant.name })
      tabContent.appendChild(summary)

      const { createHarvestCard } = await import('../components/HarvestCard.js')
      const sorted = [...harvests].sort((a, b) => new Date(b.date || b.createdAt) - new Date(a.date || a.createdAt))
      sorted.forEach(entry => {
        const card = createHarvestCard({ entry, plantName: plant.name })
        tabContent.appendChild(card)
      })
    }

    if (tab === 'Reminders') {
      await createReminderWidget({ container: tabContent, limit: 10, showPlantName: false })

      const manageBtn = document.createElement('button')
      manageBtn.className = 'btn btn-secondary btn-full'
      manageBtn.style.marginTop = '1rem'
      manageBtn.textContent = 'Manage all reminders'
      manageBtn.addEventListener('click', () => window.router?.navigate('/reminders'))
      tabContent.appendChild(manageBtn)
    }
  }

  async function handleDeleteEntry(entry) {
    confirmModal({
      title: 'Delete entry?',
      message: 'Permanently delete this journal entry and its photos?',
      confirmLabel: 'Delete',
      confirmCls: 'btn-danger',
      onConfirm: async () => {
        try {
          await Journal.delete(entry.id)
          const idx = journalEntries.findIndex(e => e.id === entry.id)
          if (idx > -1) journalEntries.splice(idx, 1)
          renderTab('Journal')
        } catch (err) {
          alertModal({ title: 'Error', message: err.message })
        }
      }
    })
  }

  function navigateToJournal() {
    sessionStorage.setItem('journal_preselect_plant', plantId)
    window.router?.navigate('/journal')
  }

  async function showEditForm(plant) {
    const form = document.createElement('div')
    form.style.cssText = 'display:flex;flex-direction:column;gap:0.875rem;'

    const fields = [
      { label: 'Plant name *', key: 'name', type: 'text', value: plant.name, placeholder: 'e.g. Acerola #3' },
      { label: 'Common name', key: 'commonName', type: 'text', value: plant.commonName, placeholder: 'e.g. Barbados Cherry' },
      { label: 'Scientific name', key: 'species', type: 'text', value: plant.species, placeholder: 'e.g. Malpighia emarginata' },
      { label: 'Notes', key: 'notes', type: 'textarea', value: plant.notes, placeholder: 'Notes...' }
    ]

    const inputs = {}

    fields.forEach(({ label, key, type, value, placeholder }) => {
      const group = document.createElement('div')
      const lbl = document.createElement('label')
      lbl.textContent = label
      group.appendChild(lbl)

      let input
      if (type === 'textarea') {
        input = document.createElement('textarea')
        input.rows = 3
      } else {
        input = document.createElement('input')
        input.type = type
      }
      input.value = value || ''
      input.placeholder = placeholder
      inputs[key] = input
      group.appendChild(input)
      form.appendChild(group)
    })

    const locationGroup = document.createElement('div')
    const locationLbl = document.createElement('label')
    locationLbl.textContent = 'Location'
    const locationSelect = document.createElement('select')
    locationSelect.innerHTML = '<option value="">Select location...</option>' +
      LOCATIONS.map(l => `<option value="${l}" ${plant.location === l ? 'selected' : ''}>${l}</option>`).join('')
    inputs.location = locationSelect
    locationGroup.appendChild(locationLbl)
    locationGroup.appendChild(locationSelect)
    form.appendChild(locationGroup)

    const errorEl = document.createElement('div')
    errorEl.className = 'error-text'
    form.appendChild(errorEl)

    const btnRow = document.createElement('div')
    btnRow.style.cssText = 'display:flex;gap:8px;'

    const saveBtn = document.createElement('button')
    saveBtn.className = 'btn btn-primary'
    saveBtn.style.flex = '1'
    saveBtn.textContent = 'Save changes'

    const deleteBtn = document.createElement('button')
    deleteBtn.className = 'btn btn-danger btn-sm'
    deleteBtn.textContent = 'Delete plant'

    btnRow.appendChild(saveBtn)
    btnRow.appendChild(deleteBtn)
    form.appendChild(btnRow)

    const modalInstance = createModal({ title: 'Edit plant', content: form })

    deleteBtn.addEventListener('click', () => {
      modalInstance.close()
      confirmModal({
        title: 'Delete plant?',
        message: `Permanently delete ${plant.name} and all its data?`,
        confirmLabel: 'Delete',
        confirmCls: 'btn-danger',
        onConfirm: async () => {
          await Plants.delete(plant.id)
          await Photos.deleteByPlantId(plant.id)
          window.router?.navigate('/inventory')
        }
      })
    })

    saveBtn.addEventListener('click', async () => {
      const updated = {
        ...plant,
        name: inputs.name.value.trim(),
        commonName: inputs.commonName.value.trim(),
        species: inputs.species.value.trim(),
        location: inputs.location.value,
        notes: inputs.notes.value.trim()
      }

      const { valid, errors } = validatePlant(updated)
      if (!valid) {
        errorEl.textContent = Object.values(errors)[0]
        return
      }

      saveBtn.disabled = true
      saveBtn.textContent = 'Saving...'

      try {
        await Plants.update(updated)
        modalInstance.close()
        window.router?.navigate(`/plant/${plant.id}`)
      } catch (err) {
        errorEl.textContent = err.message
        saveBtn.disabled = false
        saveBtn.textContent = 'Save changes'
      }
    })
  }

  await renderTab('Journal')

  return {
    el: page,
    cleanup: () => fab.remove()
  }
}
