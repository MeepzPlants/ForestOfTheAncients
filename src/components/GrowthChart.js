import { Journal } from '../db/queries.js'
import { formatDate } from '../utils/dateHelpers.js'

export async function createGrowthChart({ plantId, container }) {
  const wrapper = document.createElement('div')
  wrapper.className = 'growth-chart'

  const header = document.createElement('div')
  header.className = 'section-header'

  const label = document.createElement('div')
  label.className = 'section-label'
  label.textContent = 'Growth over time'

  const metricToggle = document.createElement('div')
  metricToggle.style.cssText = 'display:flex;gap:6px;'

  const metrics = [
    { key: 'height', label: 'Height' },
    { key: 'spread', label: 'Spread' }
  ]

  let activeMetric = 'height'
  let chartInstance = null

  const toggleBtns = {}
  metrics.forEach(({ key, label: mLabel }) => {
    const btn = document.createElement('button')
    btn.type = 'button'
    btn.className = `chip${key === activeMetric ? ' active' : ''}`
    btn.textContent = mLabel
    btn.style.fontSize = '11px'
    btn.style.padding = '3px 10px'

    btn.addEventListener('click', () => {
      activeMetric = key
      Object.entries(toggleBtns).forEach(([k, b]) => {
        b.classList.toggle('active', k === key)
      })
      renderChart(entries)
    })

    toggleBtns[key] = btn
    metricToggle.appendChild(btn)
  })

  header.appendChild(label)
  header.appendChild(metricToggle)
  wrapper.appendChild(header)

  const canvasWrapper = document.createElement('div')
  canvasWrapper.style.cssText = 'position:relative;height:180px;margin-bottom:0.5rem;'

  const canvas = document.createElement('canvas')
  canvas.setAttribute('aria-label', 'Plant growth chart')
  canvas.setAttribute('role', 'img')
  canvasWrapper.appendChild(canvas)
  wrapper.appendChild(canvasWrapper)

  const statsRow = document.createElement('div')
  statsRow.style.cssText = 'display:flex;gap:12px;font-size:12px;color:var(--color-text-tertiary);'
  wrapper.appendChild(statsRow)

  const emptyMsg = document.createElement('div')
  emptyMsg.style.cssText = `
    display:none;
    text-align:center;
    padding:2rem 1rem;
    font-size:13px;
    color:var(--color-text-tertiary);
  `
  emptyMsg.textContent = 'No growth measurements logged yet. Add height or spread to journal entries to track growth.'
  wrapper.appendChild(emptyMsg)

  if (container) container.appendChild(wrapper)

  let entries = []

  async function load() {
    entries = await Journal.getGrowthEntries(plantId)
    if (entries.length < 2) {
      canvasWrapper.style.display = 'none'
      statsRow.style.display = 'none'
      metricToggle.style.display = 'none'
      emptyMsg.style.display = 'block'
      return
    }
    canvasWrapper.style.display = 'block'
    statsRow.style.display = 'flex'
    metricToggle.style.display = 'flex'
    emptyMsg.style.display = 'none'
    renderChart(entries)
    renderStats(entries)
  }

  function renderChart(data) {
    const filtered = data.filter(e => e[activeMetric] != null)
    if (filtered.length < 2) return

    const labels = filtered.map(e => formatDate(e.createdAt))
    const values = filtered.map(e => parseFloat(e[activeMetric]))

    const unit = activeMetric === 'height' ? 'in (height)' : 'in (spread)'

    if (chartInstance) chartInstance.destroy()

    const Chart = window.Chart
    if (!Chart) {
      canvasWrapper.innerHTML = '<p style="color:var(--color-text-tertiary);font-size:13px;padding:1rem;">Chart.js not loaded.</p>'
      return
    }

    chartInstance = new Chart(canvas, {
      type: 'line',
      data: {
        labels,
        datasets: [{
          label: unit,
          data: values,
          borderColor: '#66bb6a',
          backgroundColor: 'rgba(102,187,106,0.1)',
          borderWidth: 2,
          pointBackgroundColor: '#66bb6a',
          pointRadius: 4,
          pointHoverRadius: 6,
          fill: true,
          tension: 0.3
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: {
            callbacks: {
              label: (ctx) => ` ${ctx.parsed.y}" ${activeMetric}`
            }
          }
        },
        scales: {
          x: {
            ticks: {
              color: '#6a8a6a',
              font: { size: 10 },
              maxTicksLimit: 6,
              maxRotation: 0
            },
            grid: { color: 'rgba(255,255,255,0.04)' }
          },
          y: {
            ticks: {
              color: '#6a8a6a',
              font: { size: 10 },
              callback: (v) => `${v}"`
            },
            grid: { color: 'rgba(255,255,255,0.04)' }
          }
        }
      }
    })
  }

  function renderStats(data) {
    const heightData = data.filter(e => e.height != null).map(e => e.height)
    const spreadData = data.filter(e => e.spread != null).map(e => e.spread)

    statsRow.innerHTML = ''

    if (heightData.length >= 2) {
      const gain = (heightData[heightData.length - 1] - heightData[0]).toFixed(1)
      const stat = document.createElement('span')
      stat.textContent = `Height gain: ${gain > 0 ? '+' : ''}${gain}"`
      stat.style.color = gain > 0 ? 'var(--color-success-text)' : 'var(--color-text-tertiary)'
      statsRow.appendChild(stat)
    }

    if (spreadData.length >= 2) {
      const gain = (spreadData[spreadData.length - 1] - spreadData[0]).toFixed(1)
      const stat = document.createElement('span')
      stat.textContent = `Spread gain: ${gain > 0 ? '+' : ''}${gain}"`
      stat.style.color = gain > 0 ? 'var(--color-success-text)' : 'var(--color-text-tertiary)'
      statsRow.appendChild(stat)
    }
  }

  await load()

  return { el: wrapper, reload: load }
}
