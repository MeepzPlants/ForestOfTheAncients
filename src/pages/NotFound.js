export function NotFoundPage() {
  const page = document.createElement('div')
  page.className = 'page'
  page.style.cssText = 'display:flex;flex-direction:column;align-items:center;justify-content:center;min-height:60vh;text-align:center;'

  const icon = document.createElement('div')
  icon.textContent = '🌿'
  icon.style.cssText = 'font-size:64px;margin-bottom:1.5rem;opacity:0.4;'

  const title = document.createElement('h2')
  title.textContent = 'Page not found'
  title.style.marginBottom = '0.5rem'

  const message = document.createElement('p')
  message.textContent = 'This path does not exist in the forest.'
  message.style.cssText = 'font-size:14px;color:var(--color-text-tertiary);margin-bottom:1.5rem;'

  const homeBtn = document.createElement('button')
  homeBtn.className = 'btn btn-primary'
  homeBtn.textContent = 'Return home'
  homeBtn.addEventListener('click', () => window.router?.navigate('/'))

  page.appendChild(icon)
  page.appendChild(title)
  page.appendChild(message)
  page.appendChild(homeBtn)

  return page
}
