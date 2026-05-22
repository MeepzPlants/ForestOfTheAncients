export function validatePlant(plant) {
  const errors = {}

  if (!plant.name || plant.name.trim().length === 0) {
    errors.name = 'Plant name is required.'
  } else if (plant.name.trim().length > 100) {
    errors.name = 'Plant name must be 100 characters or fewer.'
  }

  if (plant.species && plant.species.length > 200) {
    errors.species = 'Species name must be 200 characters or fewer.'
  }

  if (plant.location && plant.location.length > 100) {
    errors.location = 'Location must be 100 characters or fewer.'
  }

  if (plant.notes && plant.notes.length > 2000) {
    errors.notes = 'Notes must be 2000 characters or fewer.'
  }

  return { valid: Object.keys(errors).length === 0, errors }
}

export function validateJournalEntry(entry) {
  const errors = {}

  if (!entry.plantId) {
    errors.plantId = 'A plant must be selected.'
  }

  if (!entry.text || entry.text.trim().length === 0) {
    errors.text = 'Entry text is required.'
  } else if (entry.text.trim().length > 5000) {
    errors.text = 'Entry must be 5000 characters or fewer.'
  }

  if (!entry.tag) {
    errors.tag = 'A tag is required.'
  }

  if (entry.height != null && (isNaN(entry.height) || entry.height < 0)) {
    errors.height = 'Height must be a positive number.'
  }

  if (entry.spread != null && (isNaN(entry.spread) || entry.spread < 0)) {
    errors.spread = 'Spread must be a positive number.'
  }

  if (entry.ppfd != null && (isNaN(entry.ppfd) || entry.ppfd < 0 || entry.ppfd > 5000)) {
    errors.ppfd = 'PPFD must be between 0 and 5000.'
  }

  if (entry.humidity != null && (isNaN(entry.humidity) || entry.humidity < 0 || entry.humidity > 100)) {
    errors.humidity = 'Humidity must be between 0 and 100.'
  }

  if (entry.temperature != null && (isNaN(entry.temperature) || entry.temperature < -50 || entry.temperature > 100)) {
    errors.temperature = 'Temperature must be between -50 and 100.'
  }

  if (entry.ph != null && (isNaN(entry.ph) || entry.ph < 0 || entry.ph > 14)) {
    errors.ph = 'pH must be between 0 and 14.'
  }

  return { valid: Object.keys(errors).length === 0, errors }
}

export function validatePropagation(prop) {
  const errors = {}

  if (!prop.name || prop.name.trim().length === 0) {
    errors.name = 'A name or label is required.'
  }

  if (!prop.method) {
    errors.method = 'Propagation method is required.'
  }

  if (!prop.status) {
    errors.status = 'Status is required.'
  }

  if (!prop.startDate) {
    errors.startDate = 'Start date is required.'
  }

  if (prop.notes && prop.notes.length > 2000) {
    errors.notes = 'Notes must be 2000 characters or fewer.'
  }

  return { valid: Object.keys(errors).length === 0, errors }
}

export function validateHarvest(entry) {
  const errors = {}

  if (!entry.plantId) {
    errors.plantId = 'A plant must be selected.'
  }

  if (!entry.date) {
    errors.date = 'Harvest date is required.'
  }

  if (entry.quantity != null && (isNaN(entry.quantity) || entry.quantity < 0)) {
    errors.quantity = 'Quantity must be a positive number.'
  }

  if (entry.weight != null && (isNaN(entry.weight) || entry.weight < 0)) {
    errors.weight = 'Weight must be a positive number.'
  }

  if (entry.notes && entry.notes.length > 2000) {
    errors.notes = 'Notes must be 2000 characters or fewer.'
  }

  return { valid: Object.keys(errors).length === 0, errors }
}

export function validateReminder(reminder) {
  const errors = {}

  if (!reminder.plantId) {
    errors.plantId = 'A plant must be selected.'
  }

  if (!reminder.type) {
    errors.type = 'Reminder type is required.'
  }

  if (!reminder.dueDate) {
    errors.dueDate = 'Due date is required.'
  }

  if (reminder.repeatDays != null && (isNaN(reminder.repeatDays) || reminder.repeatDays < 0)) {
    errors.repeatDays = 'Repeat interval must be a positive number.'
  }

  return { valid: Object.keys(errors).length === 0, errors }
}

export function hasErrors(errors) {
  return Object.keys(errors).length > 0
}

export function firstError(errors) {
  const keys = Object.keys(errors)
  return keys.length > 0 ? errors[keys[0]] : null
}
