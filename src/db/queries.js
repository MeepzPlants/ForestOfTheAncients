import { openDB } from './indexedDB.js'

function now() {
  return new Date().toISOString()
}

function request(store, mode, action) {
  return new Promise(async (resolve, reject) => {
    try {
      const db = await openDB()
      const tx = db.transaction(store, mode)
      const s = tx.objectStore(store)
      const req = action(s)
      req.onsuccess = () => resolve(req.result)
      req.onerror = () => reject(req.error)
    } catch (err) {
      reject(err)
    }
  })
}

function getAll(store) {
  return new Promise(async (resolve, reject) => {
    try {
      const db = await openDB()
      const tx = db.transaction(store, 'readonly')
      const s = tx.objectStore(store)
      const req = s.getAll()
      req.onsuccess = () => resolve(req.result)
      req.onerror = () => reject(req.error)
    } catch (err) {
      reject(err)
    }
  })
}

function getAllByIndex(store, indexName, value) {
  return new Promise(async (resolve, reject) => {
    try {
      const db = await openDB()
      const tx = db.transaction(store, 'readonly')
      const s = tx.objectStore(store)
      const idx = s.index(indexName)
      const req = idx.getAll(value)
      req.onsuccess = () => resolve(req.result)
      req.onerror = () => reject(req.error)
    } catch (err) {
      reject(err)
    }
  })
}

export const Plants = {
  getAll: () => getAll('plants'),

  getById: (id) => request('plants', 'readonly', (s) => s.get(id)),

  add: (plant) => request('plants', 'readwrite', (s) => s.add({
    ...plant,
    createdAt: now(),
    updatedAt: now()
  })),

  update: (plant) => request('plants', 'readwrite', (s) => s.put({
    ...plant,
    updatedAt: now()
  })),

  delete: (id) => request('plants', 'readwrite', (s) => s.delete(id)),

  search: async (query) => {
    const all = await getAll('plants')
    const q = query.toLowerCase()
    return all.filter(p =>
      p.name?.toLowerCase().includes(q) ||
      p.species?.toLowerCase().includes(q) ||
      p.location?.toLowerCase().includes(q) ||
      p.notes?.toLowerCase().includes(q)
    )
  }
}

export const Journal = {
  getAll: () => getAll('journal'),

  getById: (id) => request('journal', 'readonly', (s) => s.get(id)),

  getByPlantId: (plantId) => getAllByIndex('journal', 'plantId', plantId),

  add: (entry) => request('journal', 'readwrite', (s) => s.add({
    ...entry,
    createdAt: now(),
    updatedAt: now()
  })),

  update: (entry) => request('journal', 'readwrite', (s) => s.put({
    ...entry,
    updatedAt: now()
  })),

  delete: (id) => request('journal', 'readwrite', (s) => s.delete(id)),

  search: async (query) => {
    const all = await getAll('journal')
    const q = query.toLowerCase()
    return all.filter(e =>
      e.text?.toLowerCase().includes(q) ||
      e.tag?.toLowerCase().includes(q)
    )
  },

  getByTag: (tag) => getAllByIndex('journal', 'tag', tag),

  getGrowthEntries: async (plantId) => {
    const entries = await getAllByIndex('journal', 'plantId', plantId)
    return entries
      .filter(e => e.height != null || e.spread != null)
      .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt))
  }
}

export const Propagation = {
  getAll: () => getAll('propagation'),

  getById: (id) => request('propagation', 'readonly', (s) => s.get(id)),

  getByParentPlantId: (parentPlantId) =>
    getAllByIndex('propagation', 'parentPlantId', parentPlantId),

  add: (prop) => request('propagation', 'readwrite', (s) => s.add({
    ...prop,
    createdAt: now(),
    updatedAt: now()
  })),

  update: (prop) => request('propagation', 'readwrite', (s) => s.put({
    ...prop,
    updatedAt: now()
  })),

  delete: (id) => request('propagation', 'readwrite', (s) => s.delete(id)),

  getByStatus: (status) => getAllByIndex('propagation', 'status', status)
}

export const Harvest = {
  getAll: () => getAll('harvest'),

  getById: (id) => request('harvest', 'readonly', (s) => s.get(id)),

  getByPlantId: (plantId) => getAllByIndex('harvest', 'plantId', plantId),

  add: (entry) => request('harvest', 'readwrite', (s) => s.add({
    ...entry,
    createdAt: now(),
    updatedAt: now()
  })),

  update: (entry) => request('harvest', 'readwrite', (s) => s.put({
    ...entry,
    updatedAt: now()
  })),

  delete: (id) => request('harvest', 'readwrite', (s) => s.delete(id)),

  getTotalByPlantId: async (plantId) => {
    const entries = await getAllByIndex('harvest', 'plantId', plantId)
    return entries.reduce((sum, e) => sum + (parseFloat(e.quantity) || 0), 0)
  }
}

export const Reminders = {
  getAll: () => getAll('reminders'),

  getById: (id) => request('reminders', 'readonly', (s) => s.get(id)),

  getByPlantId: (plantId) => getAllByIndex('reminders', 'plantId', plantId),

  add: (reminder) => request('reminders', 'readwrite', (s) => s.add({
    ...reminder,
    createdAt: now()
  })),

  update: (reminder) => request('reminders', 'readwrite', (s) => s.put({
    ...reminder
  })),

  delete: (id) => request('reminders', 'readwrite', (s) => s.delete(id)),

  getOverdue: async () => {
    const all = await getAll('reminders')
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    return all.filter(r => new Date(r.dueDate) <= today)
  },

  getUpcoming: async (days = 7) => {
    const all = await getAll('reminders')
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const future = new Date(today)
    future.setDate(future.getDate() + days)
    return all.filter(r => {
      const d = new Date(r.dueDate)
      return d >= today && d <= future
    })
  },

  advanceRepeat: async (id) => {
    const db = await openDB()
    return new Promise((resolve, reject) => {
      const tx = db.transaction('reminders', 'readwrite')
      const s = tx.objectStore('reminders')
      const req = s.get(id)
      req.onsuccess = () => {
        const reminder = req.result
        if (!reminder) { reject(new Error('Reminder not found')); return }
        if (reminder.repeatDays && reminder.repeatDays > 0) {
          const next = new Date(reminder.dueDate)
          next.setDate(next.getDate() + reminder.repeatDays)
          reminder.dueDate = next.toISOString().split('T')[0]
          s.put(reminder).onsuccess = () => resolve(reminder)
        } else {
          s.delete(id).onsuccess = () => resolve(null)
        }
      }
      req.onerror = () => reject(req.error)
    })
  }
}

export const Photos = {
  getAll: () => getAll('photos'),

  getById: (id) => request('photos', 'readonly', (s) => s.get(id)),

  getByPlantId: (plantId) => getAllByIndex('photos', 'plantId', plantId),

  getByJournalId: (journalId) => getAllByIndex('photos', 'journalId', journalId),

  add: (photo) => request('photos', 'readwrite', (s) => s.add({
    ...photo,
    createdAt: now()
  })),

  delete: (id) => request('photos', 'readwrite', (s) => s.delete(id)),

  deleteByPlantId: async (plantId) => {
    const photos = await getAllByIndex('photos', 'plantId', plantId)
    return Promise.all(photos.map(p =>
      request('photos', 'readwrite', (s) => s.delete(p.id))
    ))
  }
}

export const Settings = {
  get: (key) => request('settings', 'readonly', (s) => s.get(key)),

  set: (key, value) => request('settings', 'readwrite', (s) =>
    s.put({ key, value })
  ),

  delete: (key) => request('settings', 'readwrite', (s) => s.delete(key)),

  getAll: () => getAll('settings')
}

export async function exportAllData() {
  const [plants, journal, propagation, harvest, reminders, photos, settings] =
    await Promise.all([
      Plants.getAll(),
      Journal.getAll(),
      Propagation.getAll(),
      Harvest.getAll(),
      Reminders.getAll(),
      Photos.getAll(),
      Settings.getAll()
    ])
  return {
    version: 1,
    exportedAt: now(),
    plants,
    journal,
    propagation,
    harvest,
    reminders,
    photos,
    settings
  }
}

export async function importAllData(data) {
  const db = await openDB()
  const stores = ['plants', 'journal', 'propagation', 'harvest', 'reminders', 'photos', 'settings']
  const tx = db.transaction(stores, 'readwrite')

  stores.forEach(store => tx.objectStore(store).clear())

  const storeMap = {
    plants: data.plants || [],
    journal: data.journal || [],
    propagation: data.propagation || [],
    harvest: data.harvest || [],
    reminders: data.reminders || [],
    photos: data.photos || [],
    settings: data.settings || []
  }

  Object.entries(storeMap).forEach(([store, records]) => {
    const s = tx.objectStore(store)
    records.forEach(record => s.put(record))
  })

  return new Promise((resolve, reject) => {
    tx.oncomplete = () => resolve()
    tx.onerror = () => reject(new Error('Import failed'))
  })
}
