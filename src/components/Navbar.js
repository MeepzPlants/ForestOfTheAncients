const NAV_ITEMS = [
  { path: '/',            label: 'Home',        icon: '⌂' },
  { path: '/inventory',   label: 'Plants',       icon: '🌿' },
  { path: '/journal',     label: 'Journal',      icon: '📓' },
  { path: '/propagation', label: 'Propagation',  icon: '✂️' },
  { path: '/harvest',     label: 'Harvest',      icon: '🍒' },
  { path: '/reminders',   label: 'Reminders',    icon: '🔔' }
]

let navEl = null

export function createNavbar() {
  const nav = document.createElement('nav')
  nav.className = 'bottom-nav'
  nav.setAttribute('aria-label', 'Main navigation')
  nav.style.cssText = `
    position: fixed;
    bottom: 0;
    left: 0;
    right: 0;
    height: var(--nav-height);
    background: var(--color-bg-secondary);
    border-top: 1px solid var(--color-border-subtle);
    display: flex;
    align-items: stretch;
    justify-content: space-around;
    z-index: 200;
    -webkit-tap-highlight-color: transparent;
  `

  NAV_ITEMS.forEach(({ path, label, icon }) => {
    const btn = document.createElement('a')
    btn.href = path
    btn.className = 'nav-item'
    btn.dataset.path = path
    btn.setAttribute('aria-label', label)
    btn.style.cssText = `
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 3px;
      flex: 1;
      padding: 6px 4px;
      text-decoration: none;
      color: var(--color-text-tertiary);
      font-size: 11px;
      font-weight: 500;
      transition: color 150ms ease;
      -webkit-tap-highlight-color: transparent;
    `

    const iconEl = document.createElement('span')
    iconEl.textContent = icon
    iconEl.style.cssText = 'font-size: 20px; line-height: 1;'
    iconEl.setAttribute('aria-hidden', 'true')

    const labelEl = document.createElement('span')
    labelEl.textContent = label
    labelEl.style.cssText = 'font-size: 10px; line-height: 1;'

    btn.appendChild(iconEl)
    btn.appendChild(labelEl)

    btn.addEventListener('click', (e) => {
      e.preventDefault()
      window.router?.navigate(path)
    })

    nav.appendChild(btn)
  })

  navEl = nav
  document.body.appendChild(nav)
  updateActiveItem(window.location.pathname)
  return nav
}

export function updateActiveItem(pathname) {
  if (!navEl) return

  navEl.querySelectorAll('.nav-item').forEach(item => {
    const itemPath = item.dataset.path
    const isActive = itemPath === '/'
      ? pathname === '/'
      : pathname.startsWith(itemPath)

    if (isActive) {
      item.style.color = 'var(--color-green-400)'
    } else {
      item.style.color = 'var(--color-text-tertiary)'
    }
  })
}

export function showReminderBadge(count) {
  if (!navEl) return
  const reminderItem = navEl.querySelector('[data-path="/reminders"]')
  if (!reminderItem) return

  const existing = reminderItem.querySelector('.nav-badge')
  if (existing) existing.remove()

  if (count > 0) {
    const badge = document.createElement('span')
    badge.className = 'nav-badge'
    badge.textContent = count > 9 ? '9+' : count
    badge.style.cssText = `
      position: absolute;
      top: 4px;
      right: calc(50% - 18px);
      background: var(--color-red-400);
      color: #fff;
      font-size: 9px;
      font-weight: 700;
      min-width: 16px;
      height: 16px;
      border-radius: var(--radius-full);
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 0 4px;
    `
    reminderItem.style.position = 'relative'
    reminderItem.appendChild(badge)
  }
}

export function destroyNavbar() {
  if (navEl) {
    navEl.remove()
    navEl = null
  }
}
