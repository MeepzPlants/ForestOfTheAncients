const DB_NAME = 'fota-local'
const DB_VERSION = 1

let db = null

export function openDB() {
  return new Promise((resolve, reject) => {
    if (db) { resolve(db); return }

    const request = indexedDB.open(DB_NAME, DB_VERSION)

    request.onupgradeneeded = (event) => {
      const db = event.target.result

      if (!db.objectStoreNames.contains('plants')) {
        const plantStore = db.createObjectStore('plants', {
          keyPath: 'id',
          autoIncrement: true
        })
        plantStore.createIndex('name', 'name', { unique: false })
        plantStore.createIndex('species', 'species', { unique: false })
        plantStore.createIndex('location', 'location', { unique: false })
        plantStore.createIndex('createdAt', 'createdAt', { unique: false })
      }

      if (!db.objectStoreNames.contains('journal')) {
        const journalStore = db.createObjectStore('journal', {
          keyPath: 'id',
          autoIncrement: true
        })
        journalStore.createIndex('plantId', 'plantId', { unique: false })
        journalStore.createIndex('tag', 'tag', { unique: false })
        journalStore.createIndex('createdAt', 'createdAt', { unique: false })
        journalStore.createIndex('isPublic', 'isPublic', { unique: false })
      }

      if (!db.objectStoreNames.contains('propagation')) {
        const propStore = db.createObjectStore('propagation', {
          keyPath: 'id',
          autoIncrement: true
        })
        propStore.createIndex('parentPlantId', 'parentPlantId', { unique: false })
        propStore.createIndex('method', 'method', { unique: false })
        propStore.createIndex('status', 'status', { unique: false })
        propStore.createIndex('createdAt', 'createdAt', { unique: false })
      }

      if (!db.objectStoreNames.contains('harvest')) {
        const harvestStore = db.createObjectStore('harvest', {
          keyPath: 'id',
          autoIncrement: true
        })
        harvestStore.createIndex('plantId', 'plantId', { unique: false })
        harvestStore.createIndex('createdAt', 'createdAt', { unique: false })
      }

      if (!db.objectStoreNames.contains('reminders')) {
        const reminderStore = db.createObjectStore('reminders', {
          keyPath: 'id',
          autoIncrement: true
        })
        reminderStore.createIndex('plantId', 'plantId', { unique: false })
        reminderStore.createIndex('dueDate', 'dueDate', { unique: false })
        reminderStore.createIndex('type', 'type', { unique: false })
      }

      if (!db.objectStoreNames.contains('photos')) {
        const photoStore = db.createObjectStore('photos', {
          keyPath: 'id',
          autoIncrement: true
        })
        photoStore.createIndex('plantId', 'plantId', { unique: false })
        photoStore.createIndex('journalId', 'journalId', { unique: false })
        photoStore.createIndex('createdAt', 'createdAt', { unique: false })
      }

      if (!db.objectStoreNames.contains('settings')) {
        db.createObjectStore('settings', { keyPath: 'key' })
      }
    }

    request.onsuccess = (event) => {
      db = event.target.result
      resolve(db)
    }

    request.onerror = (event) => {
      reject(new Error(`IndexedDB error: ${event.target.errorCode}`))
    }
  })
}

export function getDB() {
  if (!db) throw new Error('Database not initialized. Call openDB() first.')
  return db
}

export function closeDB() {
  if (db) {
    db.close()
    db = null
  }
}

export function clearAllData() {
  return new Promise(async (resolve, reject) => {
    try {
      const database = await openDB()
      const stores = ['plants', 'journal', 'propagation', 'harvest', 'reminders', 'photos', 'settings']
      const tx = database.transaction(stores, 'readwrite')
      stores.forEach(store => tx.objectStore(store).clear())
      tx.oncomplete = () => resolve()
      tx.onerror = () => reject(new Error('Failed to clear data'))
    } catch (err) {
      reject(err)
    }
  })
}
