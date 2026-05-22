import { exportAllData, importAllData } from '../db/queries.js'

export async function exportToJSON() {
  const data = await exportAllData()
  const json = JSON.stringify(data, null, 2)
  const blob = new Blob([json], { type: 'application/json' })
  const url = URL.createObjectURL(blob)

  const date = new Date().toISOString().split('T')[0]
  const filename = `fota-backup-${date}.json`

  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)

  return { filename, recordCount: countRecords(data) }
}

export function importFromJSON(file) {
  return new Promise((resolve, reject) => {
    if (!file || file.type !== 'application/json') {
      reject(new Error('Please select a valid JSON backup file.'))
      return
    }

    const reader = new FileReader()

    reader.onload = async (e) => {
      try {
        const data = JSON.parse(e.target.result)

        const valid = validateBackup(data)
        if (!valid.ok) {
          reject(new Error(valid.reason))
          return
        }

        await importAllData(data)
        resolve({ success: true, recordCount: countRecords(data) })
      } catch (err) {
        if (err instanceof SyntaxError) {
          reject(new Error('The file is not valid JSON.'))
        } else {
          reject(err)
        }
      }
    }

    reader.onerror = () => reject(new Error('Failed to read the file.'))
    reader.readAsText(file)
  })
}

function validateBackup(data) {
  if (!data || typeof data !== 'object') {
    return { ok: false, reason: 'Invalid backup file format.' }
  }

  if (!data.version) {
    return { ok: false, reason: 'Backup file is missing version information.' }
  }

  if (data.version > 1) {
    return { ok: false, reason: `Backup version ${data.version} is not supported by this version of the app.` }
  }

  const requiredKeys = ['plants', 'journal', 'propagation', 'harvest', 'reminders']
  for (const key of requiredKeys) {
    if (!Array.isArray(data[key])) {
      return { ok: false, reason: `Backup file is missing or has invalid "${key}" data.` }
    }
  }

  return { ok: true }
}

function countRecords(data) {
  return {
    plants: data.plants?.length || 0,
    journal: data.journal?.length || 0,
    propagation: data.propagation?.length || 0,
    harvest: data.harvest?.length || 0,
    reminders: data.reminders?.length || 0,
    photos: data.photos?.length || 0
  }
}

export function formatRecordCount(counts) {
  return [
    `${counts.plants} plants`,
    `${counts.journal} journal entries`,
    `${counts.propagation} propagations`,
    `${counts.harvest} harvests`,
    `${counts.reminders} reminders`,
    `${counts.photos} photos`
  ].join(', ')
}
