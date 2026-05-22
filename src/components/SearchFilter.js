export function createSearchFilter({ placeholder = 'Search...', chips = [], onSearch, onFilter, container }) {
  const wrapper = document.createElement('div')
  wrapper.className = 'search-filter'
  wrapper.style.cssText = 'margin-bottom:1rem;'

  const searchRow = document.createElement('div')
  searchRow.style.cssText = 'display:flex;gap:8px;align-items:center;margin-bottom:8px;'

  const searchInput = document.createElement('input')
  searchInput.type = 'search'
  searchInput.placeholder = placeholder
  searchInput.style.cssText = 'flex:1;'
  searchInput.setAttribute('aria-label', placeholder)

  searchRow.appendChild(searchInput)
  wrapper.appendChild(searchRow)

  let activeChips = new Set()
  let chipEls = []

  if (chips.length > 0) {
    const chipGroup = document.createElement('div')
    chipGroup.className = 'chip-group'
    chipGroup.style.marginBottom = '0'

    chips.forEach(({ label, value }) => {
      const chip = document.createElement('button')
      chip.type = 'button'
      chip.className = 'chip'
      chip.textContent = label
      chip.dataset.value = value

      chip.addEventListener('click', () => {
        if (activeChips.has(value)) {
          activeChips.delete(value)
          chip.classList.remove('active')
        } else {
          activeChips.add(value)
          chip.classList.add('active')
        }
        if (onFilter) onFilter([...activeChips])
      })

      chipEls.push(chip)
      chipGroup.appendChild(chip)
    })

    wrapper.appendChild(chipGroup)
  }

  let debounceTimer = null
  searchInput.addEventListener('input', () => {
    clearTimeout(debounceTimer)
    debounceTimer = setTimeout(() => {
      if (onSearch) onSearch(searchInput.value.trim())
    }, 250)
  })

  searchInput.addEventListener('search', () => {
    if (onSearch) onSearch(searchInput.value.trim())
  })

  if (container) container.appendChild(wrapper)

  return {
    el: wrapper,

    getValue() {
      return searchInput.value.trim()
    },

    getActiveFilters() {
      return [...activeChips]
    },

    clear() {
      searchInput.value = ''
      activeChips.clear()
      chipEls.forEach(c => c.classList.remove('active'))
      if (onSearch) onSearch('')
      if (onFilter) onFilter([])
    },

    setChips(newChips) {
      chipEls.forEach(c => c.remove())
      chipEls = []
      activeChips.clear()

      const chipGroup = wrapper.querySelector('.chip-group')
      if (!chipGroup) return

      newChips.forEach(({ label, value }) => {
        const chip = document.createElement('button')
        chip.type = 'button'
        chip.className = 'chip'
        chip.textContent = label
        chip.dataset.value = value

        chip.addEventListener('click', () => {
          if (activeChips.has(value)) {
            activeChips.delete(value)
            chip.classList.remove('active')
          } else {
            activeChips.add(value)
            chip.classList.add('active')
          }
          if (onFilter) onFilter([...activeChips])
        })

        chipEls.push(chip)
        chipGroup.appendChild(chip)
      })
    },

    focus() {
      searchInput.focus()
    }
  }
}

export function filterBySearch(items, query, fields) {
  if (!query) return items
  const q = query.toLowerCase()
  return items.filter(item =>
    fields.some(field => {
      const val = item[field]
      return val && String(val).toLowerCase().includes(q)
    })
  )
}

export function filterByChips(items, activeFilters, field) {
  if (!activeFilters || activeFilters.length === 0) return items
  return items.filter(item => activeFilters.includes(item[field]))
}

export function applyFilters(items, query, searchFields, activeFilters, filterField) {
  let result = filterBySearch(items, query, searchFields)
  result = filterByChips(result, activeFilters, filterField)
  return result
}
