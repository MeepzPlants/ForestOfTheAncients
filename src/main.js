import './styles/global.css'
import './styles/components.css'
import './styles/responsive.css'

import { openDB } from './db/indexedDB.js'
import { createNavbar, showReminderBadge } from './components/Navbar.js'
import { scheduleReminderCheck } from './utils/notifications.js'
import { defineRoutes, setAppContainer, initRouter } from './router.js'
import { Reminders } from './db/queries.js'

import { HomePage } from './pages/Home.js'
import { InventoryPage } from './pages/Inventory.js'
import { PlantProfilePage } from './pages/PlantProfile.js'
import { JournalPage } from './pages/Journal.js'
import { JournalEntryPage } from './pages/JournalEntry.js'
import { PropagationPage } from './pages/Propagation.js'
import { HarvestPage } from './pages/Harvest.js'
import { RemindersPage } from './pages/Reminders.js'
import { SettingsPage } from './pages/Settings.js'

async function init() {
  console.log('[FOTA] init started')

  try {
    await openDB()
    console.log('[FOTA] database opened')
  } catch (err) {
    console.error('[FOTA] database error:', err)
    document.body.innerHTML = `
      <div style="display:flex;flex-direction:column;align-items:center;justify-content:center;min-height:100vh;padding:2rem;text-align:center;font-family:sans-serif;background:#0f1a0f;color:#e8f0e8;">
        <div style="font-size:48px;margin-bottom:1rem;">⚠️</div>
        <h2 style="font-size:18px;margin-bottom:0.5rem;">Unable to open database</h2>
        <p style="font-size:14px;opacity:0.6;max-width:320px;">Forest of the Ancients requires IndexedDB to store your plant data. Please use a modern browser and ensure you are not in private/incognito mode.</p>
        <p style="font-size:12px;opacity:0.4;margin-top:1rem;">${err.message}</p>
      </div>
    `
    return
  }

  const app = document.getElementById('app')
  if (!app) { console.error('[FOTA] no #app element found'); return }
  console.log('[FOTA] app element found')

  createNavbar()
  console.log('[FOTA] navbar created')

  const container = document.createElement('main')
  container.id = 'main-content'
  app.appendChild(container)

  setAppContainer(container)
  console.log('[FOTA] container set')

  defineRoutes({
    '/':               () => HomePage(),
    '/inventory':      () => InventoryPage(),
    '/plant/:id':      ({ id }) => PlantProfilePage({ id }),
    '/journal':        () => JournalPage(),
    '/journal/:id':    ({ id }) => JournalEntryPage({ id }),
    '/propagation':    () => PropagationPage(),
    '/harvest':        () => HarvestPage(),
    '/reminders':      () => RemindersPage(),
    '/settings':       () => SettingsPage()
  })
  console.log('[FOTA] routes defined')

  initRouter()
  console.log('[FOTA] router initialized')

  try {
    const overdue = await Reminders.getOverdue()
    showReminderBadge(overdue.length)
    console.log('[FOTA] reminders checked:', overdue.length, 'overdue')
  } catch (err) {
    console.error('[FOTA] reminders error:', err)
  }

  try {
    await scheduleReminderCheck()
    console.log('[FOTA] reminder check scheduled')
  } catch (err) {
    console.error('[FOTA] reminder schedule error:', err)
  }

  if ('serviceWorker' in navigator && import.meta.env.PROD) {
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      const banner = document.createElement('div')
      banner.style.cssText = `
        position:fixed;bottom:calc(var(--nav-height) + 12px);left:50%;
        transform:translateX(-50%);
        background:var(--color-bg-secondary);
        border:1px solid var(--color-border-default);
        border-radius:var(--radius-lg);
        padding:10px 16px;
        display:flex;gap:12px;align-items:center;
        z-index:500;font-size:13px;
        color:var(--color-text-primary);
        box-shadow:var(--shadow-md);
        white-space:nowrap;
      `
      banner.innerHTML = `
        <span>App updated</span>
        <button class="btn btn-primary btn-sm" id="reload-btn">Reload</button>
      `
      document.body.appendChild(banner)
      document.getElementById('reload-btn')?.addEventListener('click', () => {
        window.location.reload()
      })
    })
  }

  console.log('[FOTA] init complete')
}

init().catch(err => console.error('[FOTA] unhandled init error:', err))
