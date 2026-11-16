// Progressive enhancement for every page. The site is fully readable without this file.
const THEME_KEY = 'visa-visapulse-theme'
const root = document.documentElement

document.querySelector('[data-theme-toggle]')?.addEventListener('click', () => {
  const systemDark = window.matchMedia('(prefers-color-scheme: dark)').matches
  const current = root.dataset.theme ?? (systemDark ? 'dark' : 'light')
  const next = current === 'dark' ? 'light' : 'dark'
  root.dataset.theme = next
  try { localStorage.setItem(THEME_KEY, next) } catch { /* private mode: the choice lasts for this page only */ }
})

// Final Action / Dates for Filing switch. Without JavaScript both charts are shown.
const chartSwitch = document.querySelector('[data-chart-switch]')
if (chartSwitch) {
  const container = chartSwitch.closest('.dates')
  const buttons = [...chartSwitch.querySelectorAll('button[data-chart]')]
  const show = (chart) => {
    container.dataset.activeChart = chart
    for (const button of buttons) button.setAttribute('aria-pressed', String(button.dataset.chart === chart))
  }
  for (const button of buttons) button.addEventListener('click', () => show(button.dataset.chart))
  chartSwitch.hidden = false
  show(location.hash === '#dates-for-filing' ? 'datesForFiling' : 'finalActionDates')
}

// Feedback form: present only when the site was built with an endpoint.
const feedback = document.querySelector('[data-feedback]')
if (feedback) {
  const form = feedback.querySelector('form')
  const status = feedback.querySelector('.feedback-status')
  const LAST_SENT_KEY = 'visapulse-feedback-sent-at'
  form.addEventListener('submit', async (event) => {
    event.preventDefault()
    const data = new FormData(form)
    const message = String(data.get('message') ?? '').trim()
    if (data.get('website')) return // honeypot: a person never fills this in
    if (!message) { status.textContent = 'Please write your feedback first.'; return }
    let lastSent = 0
    try { lastSent = Number(sessionStorage.getItem(LAST_SENT_KEY)) || 0 } catch { /* ignore */ }
    if (Date.now() - lastSent < 30000) { status.textContent = 'Please wait a moment before sending again.'; return }
    status.textContent = 'Sending…'
    try {
      const response = await fetch(feedback.dataset.endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({ message, email: String(data.get('email') ?? '').trim() || 'not provided', page: location.pathname }),
      })
      if (!response.ok) throw new Error(String(response.status))
      try { sessionStorage.setItem(LAST_SENT_KEY, String(Date.now())) } catch { /* ignore */ }
      form.reset()
      status.textContent = 'Thank you. Your feedback was sent.'
    } catch {
      status.textContent = 'Could not send right now. Please try again later.'
    }
  })
}
