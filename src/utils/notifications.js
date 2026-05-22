import { Reminders } from '../db/queries.js'
import { Settings } from '../db/queries.js'

export function notificationsSupported() {
  return 'Notification' in window
}

export function notificationsGranted() {
  return notificationsSupported() && Notification.permission === 'granted'
}

export function notificationsDenied() {
  return notificationsSupported() && Notification.permission === 'denied'
}

export async function requestPermission() {
  if (!notificationsSupported()) {
    return { granted: false, reason: 'Notifications are not supported in this browser.' }
  }

  if (notificationsDenied()) {
    return { granted: false, reason: 'Notifications have been blocked. Please enable them in your browser settings.' }
  }

  const permission = await Notification.requestPermission()

  if (permission === 'granted') {
    await Settings.set('notificationsEnabled', true)
    return { granted: true }
  }

  return { granted: false, reason: 'Notification permission was not granted.' }
}

export function sendNotification(title, body, options = {}) {
  if (!notificationsGranted()) return null

  return new Notification(title, {
    body,
    icon: '/icon-192.png',
    badge: '/icon-192.png',
    ...options
  })
}

export async function checkAndSendReminders() {
  if (!notificationsGranted()) return

  const setting = await Settings.get('notificationsEnabled')
  if (!setting?.value) return

  const overdue = await Reminders.getOverdue()
  const upcoming = await Reminders.getUpcoming(1)

  const lastChecked = await Settings.get('lastReminderCheck')
  const now = new Date()

  if (lastChecked?.value) {
    const last = new Date(lastChecked.value)
    const hoursSince = (now - last) / (1000 * 60 * 60)
    if (hoursSince < 1) return
  }

  await Settings.set('lastReminderCheck', now.toISOString())

  overdue.forEach(r => {
    sendNotification(
      'Overdue care reminder',
      `${r.type} is overdue for ${r.plantName || 'a plant'}.`,
      { tag: `reminder-overdue-${r.id}` }
    )
  })

  upcoming.forEach(r => {
    sendNotification(
      'Upcoming care reminder',
      `${r.type} is due today for ${r.plantName || 'a plant'}.`,
      { tag: `reminder-upcoming-${r.id}` }
    )
  })
}

export async function scheduleReminderCheck() {
  await checkAndSendReminders()
  setInterval(checkAndSendReminders, 60 * 60 * 1000)
}

export async function getNotificationStatus() {
  if (!notificationsSupported()) return 'unsupported'
  if (notificationsDenied()) return 'denied'
  if (notificationsGranted()) return 'granted'
  return 'default'
}
