export function createEnvironmentLogger({ container, initialValues = {}, onChange }) {
  const wrapper = document.createElement('div')
  wrapper.className = 'environment-logger'

  const header = document.createElement('div')
  header.style.cssText = 'display:flex;align-items:center;justify-content:space-between;margin-bottom:0.75rem;cursor:pointer;'

  const label = document.createElement('div')
  label.className = 'section-label'
  label.textContent = 'Environment log'

  const toggle = document.createElement('span')
  toggle.style.cssText = 'font-size:12px;color:var(--color-text-tertiary);'
  toggle.textContent = 'Show'

  header.appendChild(label)
  header.appendChild(toggle)

  const fieldsWrapper = document.createElement('div')
  fieldsWrapper.style.display = 'none'

  const FIELDS = [
    { key: 'ppfd',        label: 'Light (PPFD)',     unit: 'μmol/m²/s', type: 'number', min: 0,   max: 5000, step: 1,   placeholder: 'e.g. 200' },
    { key: 'humidity',    label: 'Humidity',          unit: '%',         type: 'number', min: 0,   max: 100,  step: 1,   placeholder: 'e.g. 60' },
    { key: 'temperature', label: 'Temperature',       unit: '°F',        type: 'number', min: -50, max: 200,  step: 0.1, placeholder: 'e.g. 75' },
    { key: 'ph',          label: 'Soil pH',           unit: '',          type: 'number', min: 0,   max: 14,   step: 0.1, placeholder: 'e.g. 6.5' },
    { key: 'height',      label: 'Height',            unit: 'in',        type: 'number', min: 0,   max: 999,  step: 0.1, placeholder: 'e.g. 4.5' },
    { key: 'spread',      label: 'Spread / width',    unit: 'in',        type: 'number', min: 0,   max: 999,  step: 0.1, placeholder: 'e.g. 3.0' }
  ]

  const inputs = {}
  const grid = document.createElement('div')
  grid.style.cssText = 'display:grid;grid-template-columns:1fr 1fr;gap:10px;'

  FIELDS.forEach(field => {
    const group = document.createElement('div')
    group.className = 'form-group'
    group.style.marginBottom = '0'

    const labelEl = document.createElement('label')
    labelEl.htmlFor = `env-${field.key}`
    labelEl.style.marginBottom = '4px'

    const labelText = document.createElement('span')
    labelText.textContent = field.label

    if (field.unit) {
      const unit = document.createElement('span')
      unit.textContent = ` (${field.unit})`
      unit.style.cssText = 'font-size:10px;color:var(--color-text-muted);font-weight:400;'
      labelEl.appendChild(labelText)
      labelEl.appendChild(unit)
    } else {
      labelEl.appendChild(labelText)
    }

    const input = document.createElement('input')
    input.type = field.type
    input.id = `env-${field.key}`
    input.name = field.key
    input.min = field.min
    input.max = field.max
    input.step = field.step
    input.placeholder = field.placeholder

    if (initialValues[field.key] != null) {
      input.value = initialValues[field.key]
    }

    input.addEventListener('input', () => {
      if (onChange) onChange(getValues())
    })

    inputs[field.key] = input
    group.appendChild(labelEl)
    group.appendChild(input)
    grid.appendChild(group)
  })

  const noteGroup = document.createElement('div')
  noteGroup.className = 'form-group'
  noteGroup.style.cssText = 'margin-top:10px;margin-bottom:0;'

  const noteLabel = document.createElement('label')
  noteLabel.htmlFor = 'env-notes'
  noteLabel.textContent = 'Environment notes'

  const noteInput = document.createElement('textarea')
  noteInput.id = 'env-notes'
  noteInput.placeholder = 'Any additional environment observations...'
  noteInput.rows = 2
  noteInput.style.minHeight = '60px'

  if (initialValues.envNotes) {
    noteInput.value = initialValues.envNotes
  }

  noteInput.addEventListener('input', () => {
    if (onChange) onChange(getValues())
  })

  inputs.envNotes = noteInput
  noteGroup.appendChild(noteLabel)
  noteGroup.appendChild(noteInput)

  fieldsWrapper.appendChild(grid)
  fieldsWrapper.appendChild(noteGroup)

  header.addEventListener('click', () => {
    const isHidden = fieldsWrapper.style.display === 'none'
    fieldsWrapper.style.display = isHidden ? 'block' : 'none'
    toggle.textContent = isHidden ? 'Hide' : 'Show'
  })

  const hasValues = Object.keys(initialValues).some(k => initialValues[k] != null && initialValues[k] !== '')
  if (hasValues) {
    fieldsWrapper.style.display = 'block'
    toggle.textContent = 'Hide'
  }

  wrapper.appendChild(header)
  wrapper.appendChild(fieldsWrapper)

  if (container) container.appendChild(wrapper)

  function getValues() {
    const values = {}
    Object.entries(inputs).forEach(([key, input]) => {
      const val = input.value
      if (val !== '' && val != null) {
        values[key] = key === 'envNotes' ? val : parseFloat(val)
      }
    })
    return values
  }

  function setValues(values) {
    Object.entries(values).forEach(([key, val]) => {
      if (inputs[key]) inputs[key].value = val ?? ''
    })
  }

  function clear() {
    Object.values(inputs).forEach(input => { input.value = '' })
  }

  return {
    el: wrapper,
    getValues,
    setValues,
    clear
  }
}

export function formatEnvironmentSummary(entry) {
  const parts = []
  if (entry.ppfd != null) parts.push(`${entry.ppfd} PPFD`)
  if (entry.humidity != null) parts.push(`${entry.humidity}% RH`)
  if (entry.temperature != null) parts.push(`${entry.temperature}°F`)
  if (entry.ph != null) parts.push(`pH ${entry.ph}`)
  if (entry.height != null) parts.push(`${entry.height}" tall`)
  if (entry.spread != null) parts.push(`${entry.spread}" wide`)
  return parts.join(' · ')
}
