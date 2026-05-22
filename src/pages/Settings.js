import { createExportImport } from '../components/ExportImport.js'
import { requestPermission, getNotificationStatus } from '../utils/notifications.js'
import { Settings as SettingsDB } from '../db/queries.js'
import { clearAllData } from '../db/indexedDB.js'
import { confirmModal, alertModal } from '../components/Modal.js'

export async function SettingsPage() {
  const page = document.createElement('div')
  page.className = 'page'

  const title = document.createElement('h1')
  title.className = 'page-title'
  title.textContent = 'Settings'
  page.appendChild(title)

  page.appendChild(sectionLabel('Notifications'))
  const notifCard = document.createElement('div')
  notifCard.className = 'card'
  notifCard.style.marginBottom = '1rem'

  const notifDesc = document.createElement('p')
  notifDesc.style.cssText = 'font-size:13px;color:var(--color-text-tertiary);margin-bottom:0.875rem;'
  notifDesc.textContent = 'Enable browser notifications to receive reminders for plant care tasks.'

  const notifBtn = document.createElement('button')
  notifBtn.className = 'btn btn-secondary'
  notifBtn.style.width = '100%'

  const notifStatus = document.createElement('div')
  notifStatus.style.cssText = 'font-size:12px;color:var(--color-text-tertiary);margin-top:8px;'

  async function refreshNotifStatus() {
    const status = await getNotificationStatus()
    if (status === 'granted') {
      notifBtn.textContent = '🔔 Notifications enabled'
      notifBtn.disabled = true
      notifStatus.textContent = 'You will receive reminders for overdue and upcoming care tasks.'
    } else if (status === 'denied') {
      notifBtn.textContent = '🔕 Notifications blocked'
      notifBtn.disabled = true
      notifStatus.textContent = 'Enable notifications in your browser settings to receive reminders.'
    } else if (status === 'unsupported') {
      notifBtn.textContent = '🔕 Notifications not supported'
      notifBtn.disabled = true
      notifStatus.textContent = 'Your browser does not support notifications.'
    } else {
      notifBtn.textContent = '🔔 Enable notifications'
      notifBtn.disabled = false
      notifStatus.textContent = ''
    }
  }

  notifBtn.addEventListener('click', async () => {
    const result = await requestPermission()
    if (!result.granted) {
      notifStatus.textContent = result.reason
      notifStatus.style.color = 'var(--color-danger-text)'
    }
    await refreshNotifStatus()
  })

  notifCard.appendChild(notifDesc)
  notifCard.appendChild(notifBtn)
  notifCard.appendChild(notifStatus)
  page.appendChild(notifCard)
  await refreshNotifStatus()

  page.appendChild(sectionLabel('Backup & restore'))
  createExportImport({
    container: page,
    onImportComplete: () => {
      alertModal({
        title: 'Import complete',
        message: 'Your data has been restored. The app will reload to apply changes.',
        buttonLabel: 'Reload'
      })
      setTimeout(() => window.location.reload(), 1500)
    }
  })

  page.appendChild(sectionLabel('Danger zone'))
  const dangerCard = document.createElement('div')
  dangerCard.className = 'card'
  dangerCard.style.cssText = 'margin-bottom:1rem;border-color:var(--color-danger-border);'

  const dangerDesc = document.createElement('p')
  dangerDesc.style.cssText = 'font-size:13px;color:var(--color-text-tertiary);margin-bottom:0.875rem;'
  dangerDesc.textContent = 'Permanently delete all plant data including inventory, journal entries, propagation records, and photos. This cannot be undone.'

  const clearBtn = document.createElement('button')
  clearBtn.className = 'btn btn-danger'
  clearBtn.style.width = '100%'
  clearBtn.textContent = '🗑 Clear all data'

  clearBtn.addEventListener('click', () => {
    confirmModal({
      title: 'Clear all data?',
      message: 'This will permanently delete everything — all plants, journal entries, propagation records, harvests, reminders, and photos. Export a backup first if you want to keep your data.',
      confirmLabel: 'Delete everything',
      confirmCls: 'btn-danger',
      onConfirm: async () => {
        try {
          await clearAllData()
          alertModal({
            title: 'Data cleared',
            message: 'All data has been deleted. The app will reload.',
            buttonLabel: 'OK'
          })
          setTimeout(() => window.location.reload(), 1500)
        } catch (err) {
          alertModal({
            title: 'Error',
            message: `Failed to clear data: ${err.message}`
          })
        }
      }
    })
  })

  dangerCard.appendChild(dangerDesc)
  dangerCard.appendChild(clearBtn)
  page.appendChild(dangerCard)

  const version = document.createElement('div')
  version.style.cssText = 'text-align:center;font-size:12px;color:var(--color-text-muted);padding:1rem 0 2rem;'
  version.textContent = 'Forest of the Ancients · v0.1.0'
  page.appendChild(version)

  return page
}

function sectionLabel(text) {
  const label = document.createElement('div')
  label.className = 'section-label'
  label.style.cssText = 'margin-bottom:0.5rem;margin-top:1.25rem;'
  label.textContent = text
  return label
}
