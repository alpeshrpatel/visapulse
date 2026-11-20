// @ts-check
/**
 * Build-time SVG line chart of cut-off dates over bulletin months.
 * No client JavaScript. Colours come from CSS custom properties so both themes work.
 */
import { formatPeriod, parsePeriod } from '../lib/period.js'
import { formatCutoff } from './format.js'
import { SafeHtml, escapeHtml } from './html.js'

/** @typedef {{ period: string, value: string }} Point */
/** @typedef {{ name: string, color: number, dashed?: boolean, points: Point[] }} Series */

const monthIndex = (/** @type {string} */ period) => {
  const { year, month } = parsePeriod(period)
  return year * 12 + (month - 1)
}
const timestamp = (/** @type {string} */ iso) => Date.parse(`${iso}T00:00:00Z`)
const isDate = (/** @type {string} */ value) => value !== 'Current' && value !== 'Unavailable'

/**
 * @param {{ title: string, series: Series[], width?: number, height?: number }} options
 * @returns {SafeHtml}
 */
export function renderCutoffChart({ title, series, width = 760, height = 340 }) {
  const all = series.flatMap((item) => item.points)
  if (all.length < 2) return new SafeHtml('<p class="chart-empty">Not enough history to draw a chart yet.</p>')

  const margin = { top: 34, right: 16, bottom: 30, left: 58 }
  const plotWidth = width - margin.left - margin.right
  const plotHeight = height - margin.top - margin.bottom
  const months = all.map((point) => monthIndex(point.period))
  const xMin = Math.min(...months)
  const xMax = Math.max(Math.max(...months), xMin + 1)
  const dates = all.filter((point) => isDate(point.value)).map((point) => timestamp(point.value))
  const hasDates = dates.length > 0
  const yMinRaw = hasDates ? Math.min(...dates) : 0
  const yMaxRaw = hasDates ? Math.max(...dates) : 1
  const pad = Math.max((yMaxRaw - yMinRaw) * 0.06, 86400000 * 30)
  const yMin = yMinRaw - pad
  const yMax = yMaxRaw + pad
  const x = (/** @type {number} */ index) => margin.left + ((index - xMin) / (xMax - xMin)) * plotWidth
  const y = (/** @type {number} */ time) => margin.top + plotHeight - ((time - yMin) / (yMax - yMin)) * plotHeight
  const fixed = (/** @type {number} */ value) => value.toFixed(1)
  const currentLaneY = margin.top - 12

  const parts = []
  // Horizontal grid: one line per calendar year of cut-off, thinned to at most 8 labels.
  if (hasDates) {
    const firstYear = new Date(yMin).getUTCFullYear() + 1
    const lastYear = new Date(yMax).getUTCFullYear()
    const step = Math.max(1, Math.ceil((lastYear - firstYear + 1) / 8))
    for (let year = firstYear; year <= lastYear; year += step) {
      const lineY = y(Date.UTC(year, 0, 1))
      parts.push(`<line class="chart-grid" x1="${margin.left}" x2="${width - margin.right}" y1="${fixed(lineY)}" y2="${fixed(lineY)}"/>`
        + `<text class="chart-tick" x="${margin.left - 8}" y="${fixed(lineY + 4)}" text-anchor="end">${year}</text>`)
    }
  }
  // Vertical ticks: bulletin years, thinned to at most 10 labels.
  const firstBulletinYear = Math.ceil(xMin / 12)
  const lastBulletinYear = Math.floor(xMax / 12)
  const xStep = Math.max(1, Math.ceil((lastBulletinYear - firstBulletinYear + 1) / 10))
  for (let year = firstBulletinYear; year <= lastBulletinYear; year += xStep) {
    const tickX = x(year * 12)
    parts.push(`<line class="chart-grid chart-grid-x" x1="${fixed(tickX)}" x2="${fixed(tickX)}" y1="${margin.top}" y2="${height - margin.bottom}"/>`
      + `<text class="chart-tick" x="${fixed(tickX)}" y="${height - margin.bottom + 18}" text-anchor="middle">${year}</text>`)
  }
  parts.push(`<text class="chart-axis-label" x="${margin.left}" y="${currentLaneY + 4}" text-anchor="end" dx="-8">Current</text>`
    + `<line class="chart-lane" x1="${margin.left}" x2="${width - margin.right}" y1="${currentLaneY}" y2="${currentLaneY}"/>`)

  for (const item of series) {
    const color = `var(--series-${item.color})`
    // Join consecutive months that both carry a date; anything else breaks the line.
    let path = ''
    let previousIndex = null
    for (const point of item.points) {
      const index = monthIndex(point.period)
      if (!isDate(point.value)) { previousIndex = null; continue }
      const command = previousIndex !== null && index - previousIndex === 1 ? 'L' : 'M'
      path += `${command}${fixed(x(index))} ${fixed(y(timestamp(point.value)))}`
      previousIndex = index
    }
    if (path) {
      parts.push(`<path class="chart-line${item.dashed ? ' chart-line-dashed' : ''}" d="${path}" style="stroke:${color}"/>`)
    }
    const markers = item.points.map((point) => {
      const pointX = fixed(x(monthIndex(point.period)))
      const label = escapeHtml(`${item.name}, ${formatPeriod(point.period)}: ${formatCutoff(point.value)}`)
      if (point.value === 'Current') {
        return `<circle class="chart-current" cx="${pointX}" cy="${currentLaneY}" r="2.6" style="fill:${color}"><title>${label}</title></circle>`
      }
      if (point.value === 'Unavailable') {
        return `<rect class="chart-unavailable" x="${fixed(Number(pointX) - 2)}" y="${height - margin.bottom - 6}" width="4" height="6"><title>${label}</title></rect>`
      }
      return `<circle class="chart-point" cx="${pointX}" cy="${fixed(y(timestamp(point.value)))}" r="5" style="fill:${color}"><title>${label}</title></circle>`
    })
    parts.push(markers.join(''))
  }

  const summary = series.map((item) => {
    const first = item.points[0]
    const last = item.points.at(-1)
    return first && last
      ? `${item.name}: ${formatCutoff(first.value)} in ${formatPeriod(first.period)} to ${formatCutoff(last.value)} in ${formatPeriod(last.period)}.`
      : ''
  }).join(' ')
  const id = `chart-${Math.abs(hash(title + summary)).toString(36)}`
  return new SafeHtml(
    `<svg class="cutoff-chart" viewBox="0 0 ${width} ${height}" role="img" aria-labelledby="${id}-t ${id}-d">`
    + `<title id="${id}-t">${escapeHtml(title)}</title><desc id="${id}-d">${escapeHtml(summary)} Dots on the top line mark months when the category was Current.</desc>`
    + parts.join('')
    + '</svg>',
  )
}

/** @param {string} text */
function hash(text) {
  let value = 0
  for (let index = 0; index < text.length; index += 1) value = (value * 31 + text.charCodeAt(index)) | 0
  return value
}
