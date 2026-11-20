// Priority-date checker. Runs entirely in the browser: nothing typed here is sent anywhere,
// and the shareable state lives in the URL fragment, which browsers never send to a server.
import { describeChange, priorityDateStatus } from '../lib/movement.js'

const data = JSON.parse(document.getElementById('check-data').textContent)
const form = document.getElementById('check-form')
const output = document.getElementById('check-result')
const dateFormat = new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', year: 'numeric', timeZone: 'UTC' })
const formatDate = (iso) => dateFormat.format(new Date(`${iso}T00:00:00Z`))
const formatCutoff = (value) => (value === 'Current' || value === 'Unavailable' ? value : formatDate(value))
const isRealDate = (value) => /^\d{4}-\d{2}-\d{2}$/.test(value) && !Number.isNaN(Date.parse(`${value}T00:00:00Z`))
  && new Date(`${value}T00:00:00Z`).toISOString().slice(0, 10) === value

/** Build an element without ever touching innerHTML. */
function el(tag, className, ...children) {
  const node = document.createElement(tag)
  if (className) node.className = className
  for (const child of children) node.append(child)
  return node
}

function chartResult(chart, title, priorityDate) {
  const now = chart?.now
  const card = el('div', 'stat-card')
  card.append(el('p', 'stat-label', title))
  if (now === undefined) {
    card.append(el('p', 'muted', 'This chart is not published for the category.'))
    return card
  }
  const status = priorityDateStatus(priorityDate, now)
  const headline = status === 'current' ? 'Current' : status === 'unavailable' ? 'Unavailable this month' : 'Not current yet'
  card.append(el('p', `check-status check-${status}`, headline))
  let detail
  if (now === 'Current') detail = 'This category has no cut-off this month, so every priority date is current.'
  else if (now === 'Unavailable') detail = 'No visa numbers can be used in this category this month, whatever the priority date.'
  else {
    const days = Math.round((Date.parse(`${priorityDate}T00:00:00Z`) - Date.parse(`${now}T00:00:00Z`)) / 86400000)
    detail = status === 'current'
      ? `Your priority date (${formatDate(priorityDate)}) is earlier than the cut-off (${formatDate(now)}).`
      : days === 0
        ? `Your priority date is the cut-off date itself (${formatDate(now)}). It must be earlier than the cut-off, so it is not current yet.`
        : `The cut-off is ${formatDate(now)}. Your priority date is ${days.toLocaleString('en-US')} day${days === 1 ? '' : 's'} after it. That gap is measured in priority dates, not in waiting time.`
  }
  card.append(el('p', 'check-detail', detail))
  const history = [['12 months', chart.m12], ['24 months', chart.m24]].flatMap(([label, before]) => {
    const movement = describeChange(now, before)
    if (!movement) return []
    const text = movement.type === 'unchanged' ? 'did not move' : `${movement.label} (${formatCutoff(before)} → ${formatCutoff(now)})`
    return [`Over the last ${label} this cut-off ${movement.type === 'unchanged' ? text : `moved ${text}`}.`]
  })
  if (history.length) card.append(el('p', 'check-history', history.join(' ')))
  return card
}

function render() {
  const values = Object.fromEntries(new FormData(form))
  const line = data.lines.find((item) => item.slug === values.category)
  const area = data.areas.find((item) => item.slug === values.area)
  output.replaceChildren()
  if (!values.date || !line || !area) {
    output.append(el('p', 'muted', 'Enter your priority date, category and area to see where you stand.'))
    return
  }
  if (!isRealDate(values.date) || values.date > data.today) {
    output.append(el('p', 'muted', 'That does not look like a valid past date.'))
    return
  }
  const cutoffs = data.cutoffs[line.key]?.[area.key] ?? {}
  const heading = el('h2', '', `${line.code} ${area.name}, priority date ${formatDate(values.date)}`)
  const cards = el('div', 'stat-row',
    chartResult(cutoffs.finalActionDates, 'Final Action Dates', values.date),
    chartResult(cutoffs.datesForFiling, 'Dates for Filing', values.date))
  const link = el('a', '', `Full ${line.code} ${area.name} history`)
  link.href = `/priority-dates/${line.slug}/${area.slug}/`
  output.append(heading, cards,
    el('p', 'muted', `Compared with the ${data.periodLabel} Visa Bulletin${data.verified ? '' : ' (unverified data: confirm on the official bulletin)'}. Past movement is history, not a forecast: cut-offs can stall or move backwards.`),
    el('p', '', link))
  history.replaceState(null, '', `#date=${values.date}&category=${line.slug}&area=${area.slug}`)
}

// Restore shared state from the fragment.
const shared = new URLSearchParams(location.hash.slice(1))
for (const name of ['date', 'category', 'area']) {
  const field = form.elements.namedItem(name)
  const value = shared.get(name)
  if (field && value && (name === 'date' ? isRealDate(value) : [...field.options].some((option) => option.value === value))) field.value = value
}
form.addEventListener('input', render)
form.addEventListener('submit', (event) => { event.preventDefault(); render() })
render()
