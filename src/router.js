import { updateActiveItem } from './components/Navbar.js'

const routes = []
let currentCleanup = null
let appContainer = null

export function defineRoutes(routeMap) {
  Object.entries(routeMap).forEach(([path, handler]) => {
    const paramNames = []
    const regexStr = path
      .replace(/:[^/]+/g, (match) => {
        paramNames.push(match.slice(1))
        return '([^/]+)'
      })
      .replace(/\//g, '\\/')
    routes.push({
      regex: new RegExp(`^${regexStr}$`),
      paramNames,
      handler
    })
  })
}

export function setAppContainer(el) {
  appContainer = el
}

function removeSplash() {
  const splash = document.getElementById('splash')
  if (splash) splash.remove()
}

export async function navigate(path, pushState = true) {
  if (pushState) {
    window.history.pushState({}, '', path)
  }

  updateActiveItem(path)

  if (currentCleanup) {
    try { currentCleanup() } catch (e) {}
    currentCleanup = null
  }

  if (appContainer) {
    appContainer.innerHTML = ''
    const loader = document.createElement('div')
    loader.className = 'loading'
    loader.textContent = 'Loading...'
    appContainer.appendChild(loader)
  }

  let matched = false

  for (const route of routes) {
    const match = path.match(route.regex)
    if (match) {
      matched = true
      const params = {}
      route.paramNames.forEach((name, idx) => {
        params[name] = match[idx + 1]
      })

      try {
        const result = await route.handler(params)

        removeSplash()

        if (appContainer) {
          appContainer.innerHTML = ''
          if (result instanceof HTMLElement) {
            appContainer.appendChild(result)
          } else if (result?.el instanceof HTMLElement) {
            appContainer.appendChild(result.el)
            if (result.cleanup) currentCleanup = result.cleanup
          }
        }

        window.scrollTo({ top: 0, behavior: 'instant' })
      } catch (err) {
        console.error('Router error:', err)
        removeSplash()
        if (appContainer) {
          appContainer.innerHTML = `
            <div class="page">
              <div class="empty-state" style="margin-top:3rem;">
                <div class="empty-state-icon">⚠️</div>
                <p>Something went wrong loading this page.</p>
                <p style="font-size:12px;color:var(--color-text-muted);margin-top:4px;">${err.message}</p>
                <button class="btn btn-secondary" style="margin-top:1rem;" onclick="window.router?.navigate('/')">Go home</button>
              </div>
            </div>
          `
        }
      }

      break
    }
  }

  if (!matched) {
    removeSplash()
    const { NotFoundPage } = await import('./pages/NotFound.js')
    if (appContainer) {
      appContainer.innerHTML = ''
      appContainer.appendChild(NotFoundPage())
    }
  }
}

export function initRouter() {
  window.router = { navigate }

  window.addEventListener('popstate', () => {
    navigate(window.location.pathname, false)
  })

  document.addEventListener('click', (e) => {
    const link = e.target.closest('a[href]')
    if (!link) return
    const href = link.getAttribute('href')
    if (!href || href.startsWith('http') || href.startsWith('mailto') || href.startsWith('#')) return
    e.preventDefault()
    navigate(href)
  })

  navigate(window.location.pathname, false)
}
