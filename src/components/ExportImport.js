import { exportToJSON, importFromJSON, formatRecordCount } from '../utils/exportHelpers.js'
import { confirmModal, alertModal } from './Modal.js'

export function createExportImport({ container, onImportComplete }) {
  const wrapper = document.createElement('div')
  wrapper.className = 'export-import'

  const exportSection = document.createElement('div')
  exportSection.className = 'card'
  exportSection.style.marginBottom = '1rem'

  const exportLabel = document.createElement('div')
  exportLabel.className = 'section-label'
  exportLabel.style.marginBottom = '6px'
  exportLabel.textContent = 'Export data'

  const exportDesc = document.createElement('p')
  exportDesc.style.cssText = 'font-size:13px;color:var(--color-text-tertiary);margin-bottom:0.875rem;'
  exportDesc.textContent = 'Download a backup of all your plant data as a JSON file. Store it somewhere safe — this is your only backup.'

  const exportBtn = document.createElement('button')
  exportBtn.className = 'btn btn-secondary'
  exportBtn.innerHTML = '&#8595; Download backup'
  exportBtn.style.width = '100%'

  const exportStatus = document.createElement('div')
  exportStatus.className = 'status-msg'
  exportStatus.style.display = 'none'

  exportBtn.addEventListener('click', async () => {
    try {
      exportBtn.disabled = true
      exportBtn.textContent = 'Preparing...'
      const { filename, recordCount } = await exportToJSON()
      showStatus(exportStatus, `Saved as ${filename} — ${formatRecordCount(recordCount)}`, 'success')
    } catch (err) {
      showStatus(exportStatus, `Export failed: ${err.message}`, 'error')
    } finally {
      exportBtn.disabled = false
      exportBtn.innerHTML = '&#8595; Download backup'
    }
  })

  exportSection.appendChild(exportLabel)
  exportSection.appendChild(exportDesc)
  exportSection.appendChild(exportBtn)
  exportSection.appendChild(exportStatus)

  const importSection = document.createElement('div')
  importSection.className = 'card'

  const importLabel = document.createElement('div')
  importLabel.className = 'section-label'
  importLabel.style.marginBottom = '6px'
  importLabel.textContent = 'Import data'

  const importDesc = document.createElement('p')
  importDesc.style.cssText = 'font-size:13px;color:var(--color-text-tertiary);margin-bottom:0.875rem;'
  importDesc.textContent = 'Restore from a backup file. This will replace all current data. Make sure to export first if you want to keep your current data.'

  const fileInput = document.createElement('input')
  fileInput.type = 'file'
  fileInput.accept = '.json,application/json'
  fileInput.style.display = 'none'
  fileInput.id = 'import-file-input'

  const importBtn = document.createElement('button')
  importBtn.className = 'btn btn-secondary'
  importBtn.innerHTML = '&#8593; Choose backup file'
  importBtn.style.width = '100%'

  const importStatus = document.createElement('div')
  importStatus.className = 'status-msg'
  importStatus.style.display = 'none'

  importBtn.addEventListener('click', () => fileInput.click())

  fileInput.addEventListener('change', () => {
    const file = fileInput.files[0]
    if (!file) return

    confirmModal({
      title: 'Replace all data?',
      message: `Importing "${file.name}" will permanently replace all your current plant data. This cannot be undone. Continue?`,
      confirmLabel: 'Import',
      confirmCls: 'btn-danger',
      onConfirm: async () => {
        try {
          importBtn.disabled = true
          importBtn.textContent = 'Importing...'
          const { recordCount } = await importFromJSON(file)
          showStatus(importStatus, `Imported successfully — ${formatRecordCount(recordCount)}`, 'success')
          if (onImportComplete) onImportComplete()
        } catch (err) {
          showStatus(importStatus, `Import failed: ${err.message}`, 'error')
        } finally {
          importBtn.disabled = false
          importBtn.innerHTML = '&#8593; Choose backup file'
          fileInput.value = ''
        }
      }
    })
  })

  importSection.appendChild(importLabel)
  importSection.appendChild(importDesc)
  importSection.appendChild(fileInput)
  importSection.appendChild(importBtn)
  importSection.appendChild(importStatus)

  wrapper.appendChild(exportSection)
  wrapper.appendChild(importSection)

  if (container) container.appendChild(wrapper)

  return { el: wrapper }
}

function showStatus(el, message, type) {
  el.textContent = message
  el.className = `status-msg ${type}`
  el.style.display = 'block'
  setTimeout(() => {
    el.style.display = 'none'
  }, 6000)
}
