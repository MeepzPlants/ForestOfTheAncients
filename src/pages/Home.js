import { Plants, Journal, Reminders, Propagation, Photos } from '../db/queries.js'
import { createReminderWidget } from '../components/ReminderWidget.js'
import { formatRelative, daysSince } from '../utils/dateHelpers.js'
import { plantEmoji } from '../components/PlantCard.js'

export async function HomePage() {
  const page = document.createElement('div')
  page.className = 'page'

  const appHeader = document.createElement('div')
  appHeader.style.cssText = 'display:flex;align-items:center;justify-content:space-between;margin-bottom:1.5rem;'

  const branding = document.createElement('div')

  const appName = document.createElement('div')
  appName.style.cssText = 'font-size:20px;font-weight:700;color:var(--color-text-primary);letter-spacing:-0.3px;'
  appName.textContent = 'Forest of the Ancients'

  const tagline = document.createElement('div')
  tagline.style.cssText = 'font-size:12px;color:var(--color-text-muted);margin-top:1px;'
  tagline.textContent = 'Personal plant journal'

  branding.appendChild(appName)
  branding.appendChild(tagline)

  const settingsBtn = document.createElement('button')
  settingsBtn.className = 'btn btn-ghost btn-icon'
  settingsBtn.setAttribute('aria-label', 'Settings')
  settingsBtn.style.fontSize = '22px'
  settingsBtn.textContent = '⚙'
  settingsBtn.addEventListener('click', () => window.router?.navigate('/settings'))

  appHeader.appendChild(branding)
  appHeader.appendChild(settingsBtn)
  page.appendChild(appHeader)

  const [plants, journal, reminders, propagations] = await Promise.all([
    Plants.getAll(),
    Journal.getAll(),
    Reminders.getAll(),
    Propagation.getAll()
  ])

  const overdueReminders = await Reminders.getOverdue()

  const statGrid = document.createElement('div')
  statGrid.className = 'stat-grid'
  statGrid.style.marginBottom = '1.25rem'

  const stats = [
    { value: plants.length, label: 'Plants' },
    { value: journal.length, label: 'Journal entries' },
    { value: propagations.filter(p => p.status !== 'Established' && p.status !== 'Failed').length, label: 'Propagating' },
    { value: overdueReminders.length, label: 'Overdue', highlight: overdueReminders.length > 0 }
  ]

  stats.forEach(({ value, label, highlight }) => {
    const card = document.createElement('div')
    card.className = 'stat-card'
    if (highlight) {
      card.style.background = 'var(--color-danger-bg)'
      card.style.border = '1px solid var(--color-danger-border)'
    }

    const val = document.createElement('div')
    val.className = 'stat-value'
    val.textContent = value
    if (highlight && value > 0) val.style.color = 'var(--color-danger-text)'

    const lbl = document.createElement('div')
    lbl.className = 'stat-label'
    lbl.textContent = label
    if (highlight && value > 0) lbl.style.color = 'var(--color-danger-text)'

    card.appendChild(val)
    card.appendChild(lbl)
    statGrid.appendChild(card)
  })

  page.appendChild(statGrid)

  if (plants.length === 0) {
    const welcome = document.createElement('div')
    welcome.className = 'card'
    welcome.style.cssText = 'text-align:center;padding:2rem 1rem;margin-bottom:1.25rem;'
    welcome.innerHTML = `
      <div style="font-size:48px;margin-bottom:1rem;">🌱</div>
      <div style="font-size:17px;font-weight:500;color:var(--color-text-primary);margin-bottom:0.5rem;">Welcome to the Forest</div>
      <p style="font-size:14px;color:var(--color-text-tertiary);margin-bottom:1.25rem;">Start by adding your first plant to the inventory.</p>
    `
    const addPlantBtn = document.createElement('button')
    addPlantBtn.className = 'btn btn-primary'
    addPlantBtn.textContent = '+ Add your first plant'
    addPlantBtn.addEventListener('click', () => window.router?.navigate('/inventory'))
    welcome.appendChild(addPlantBtn)

    page.appendChild(welcome)
    return page
  }

  await createReminderWidget({ container: page, limit: 3, showPlantName: true })

  page.appendChild(makeDivider())

  const recentPlants = [...plants]
    .sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt))
    .slice(0, 5)

  const photoCache = await buildPhotoCache(plants)

  const recentHeader = makeSectionHeader('Recently updated plants', '/inventory')
  page.appendChild(recentHeader)

  const recentList = document.createElement('div')
  recentList.style.marginBottom = '1.25rem'

  const journalByPlant = {}
  journal.forEach(e => {
    if (!journalByPlant[e.plantId]) journalByPlant[e.plantId] = []
    journalByPlant[e.plantId].push(e)
  })

  recentPlants.forEach(plant => {
    const item = document.createElement('div')
    item.className = 'list-item'
    item.style.cursor = 'pointer'
    item.addEventListener('click', () => window.router?.navigate(`/plant/${plant.id}`))

    const photoEl = document.createElement('div')
    photoEl.style.cssText = `
      width:44px;height:44px;border-radius:var(--radius-md);
      background:var(--color-bg-tertiary);flex-shrink:0;
      overflow:hidden;display:flex;align-items:center;justify-content:center;font-size:22px;
    `

    const cachedPhoto = photoCache[plant.id]
    if (cachedPhoto) {
      const img = document.createElement('img')
      img.src = cachedPhoto
      img.alt = plant.name
      img.style.cssText = 'width:100%;height:100%;object-fit:cover;'
      img.loading = 'lazy'
      photoEl.appendChild(img)
    } else {
      photoEl.textContent = plantEmoji(plant.species)
    }

    const content = document.createElement('div')
    content.className = 'list-item-content'

    const nameEl = document.createElement('div')
    nameEl.className = 'list-item-title'
    nameEl.textContent = plant.name

    const subEl = document.createElement('div')
    subEl.className = 'list-item-sub'
    const plantJournal = journalByPlant[plant.id] || []
    const sorted = [...plantJournal].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    subEl.textContent = sorted.length > 0
      ? `Last entry ${formatRelative(sorted[0].createdAt)}`
      : `Added ${formatRelative(plant.createdAt)}`

    content.appendChild(nameEl)
    content.appendChild(subEl)

    const arrow = document.createElement('span')
    arrow.textContent = '›'
    arrow.style.cssText = 'font-size:20px;color:var(--color-text-muted);'

    item.appendChild(photoEl)
    item.appendChild(content)
    item.appendChild(arrow)
    recentList.appendChild(item)
  })

  page.appendChild(recentList)

  if (journal.length > 0) {
    page.appendChild(makeDivider())

    const plantMap = {}
    plants.forEach(p => { plantMap[p.id] = p })

    const journalHeader = makeSectionHeader('Recent journal entries', '/journal')
    page.appendChild(journalHeader)

    const recentEntries = [...journal]
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      .slice(0, 3)

    const entriesList = document.createElement('div')

    recentEntries.forEach(entry => {
      const plant = plantMap[entry.plantId]
      const item = document.createElement('div')
      item.className = 'card card-hover'
      item.style.cssText = 'margin-bottom:0.625rem;padding:0.875rem 1rem;cursor:pointer;'
      item.addEventListener('click', () => window.router?.navigate(`/journal/${entry.id}`))

      const entryHeader = document.createElement('div')
      entryHeader.style.cssText = 'display:flex;align-items:center;gap:8px;margin-bottom:5px;'

      const tagBadge = document.createElement('span')
      tagBadge.className = 'badge'
      tagBadge.textContent = entry.tag || 'observation'

      const plantName = document.createElement('span')
      plantName.style.cssText = 'font-size:12px;color:var(--color-text-tertiary);'
      plantName.textContent = plant?.name || 'Unknown plant'

      const dateEl = document.createElement('span')
      dateEl.style.cssText = 'font-size:11px;color:var(--color-text-muted);margin-left:auto;'
      dateEl.textContent = formatRelative(entry.createdAt)

      entryHeader.appendChild(tagBadge)
      entryHeader.appendChild(plantName)
      entryHeader.appendChild(dateEl)

      const entryText = document.createElement('div')
      entryText.style.cssText = 'font-size:13px;color:var(--color-text-secondary);line-height:1.5;'
      const preview = entry.text?.length > 120 ? entry.text.substring(0, 120) + '...' : entry.text
      entryText.textContent = preview || ''

      item.appendChild(entryHeader)
      item.appendChild(entryText)
      entriesList.appendChild(item)
    })

    page.appendChild(entriesList)
  }

  const activeProp = propagations.filter(p =>
    p.status === 'Rooting' || p.status === 'Cutting taken'
  )

  if (activeProp.length > 0) {
    page.appendChild(makeDivider())

    const plantMap = {}
    plants.forEach(p => { plantMap[p.id] = p })

    const propHeader = makeSectionHeader('Active propagations', '/propagation')
    page.appendChild(propHeader)

    const propList = document.createElement('div')

    activeProp.slice(0, 3).forEach(prop => {
      const item = document.createElement('div')
      item.className = 'list-item'
      item.style.cursor = 'pointer'
      item.addEventListener('click', () => window.router?.navigate('/propagation'))

      const icon = document.createElement('div')
      icon.style.cssText = 'font-size:22px;flex-shrink:0;'
      icon.textContent = '✂️'

      const content = document.createElement('div')
      content.className = 'list-item-content'

      const nameEl = document.createElement('div')
      nameEl.className = 'list-item-title'
      nameEl.textContent = prop.name

      const subEl = document.createElement('div')
      subEl.className = 'list-item-sub'
      const parent = plantMap[prop.parentPlantId]
      const days = daysSince(prop.startDate)
      subEl.textContent = [prop.method, parent?.name, days != null ? `${days}d` : ''].filter(Boolean).join(' · ')

      content.appendChild(nameEl)
      content.appendChild(subEl)

      const statusBadge = document.createElement('span')
      statusBadge.className = `badge ${prop.status === 'Rooting' ? 'badge-w' : ''}`
      statusBadge.textContent = prop.status

      item.appendChild(icon)
      item.appendChild(content)
      item.appendChild(statusBadge)
      propList.appendChild(item)
    })

    page.appendChild(propList)
  }

  return page
}

async function buildPhotoCache(plants) {
  const cache = {}

  if (plants.length <= 10) {
    await Promise.all(
      plants.map(async plant => {
        const photos = await Photos.getByPlantId(plant.id)
        if (photos.length > 0) {
          const latest = photos[photos.length - 1]
          cache[plant.id] = latest.thumbnail || latest.dataURL
        }
      })
    )
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
    const latest = sorted[0]
    cache[parseInt(plantId)] = latest.thumbnail || latest.dataURL
  })

  return cache
}

function makeSectionHeader(labelText, linkPath) {
  const header = document.createElement('div')
  header.className = 'section-header'
  header.style.marginBottom = '0.875rem'

  const label = document.createElement('div')
  label.className = 'section-label'
  label.textContent = labelText

  const link = document.createElement('a')
  link.href = linkPath
  link.className = 'text-sm'
  link.style.color = 'var(--color-green-400)'
  link.textContent = 'View all'
  link.addEventListener('click', (e) => {
    e.preventDefault()
    window.router?.navigate(linkPath)
  })

  header.appendChild(label)
  header.appendChild(link)
  return header
}

function makeDivider() {
  const hr = document.createElement('hr')
  hr.className = 'divider'
  return hr
}
