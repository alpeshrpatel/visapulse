// @ts-check
import { MONTH_NAMES, parsePeriod, toPeriod } from '../lib/period.js'

const MEDIUM = new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', year: 'numeric', timeZone: 'UTC' })

/** "Jan 1, 2013" from an ISO date, always in UTC. @param {string} iso */
export function formatDate(iso) {
  return MEDIUM.format(new Date(`${iso}T00:00:00Z`))
}

/** @param {string} value a cut-off: ISO date, "Current" or "Unavailable" */
export function formatCutoff(value) {
  return value === 'Current' || value === 'Unavailable' ? value : formatDate(value)
}

/** "november-2026" @param {string} period */
export function periodSlug(period) {
  const { year, monthName } = parsePeriod(period)
  return `${monthName.toLowerCase()}-${year}`
}

/** @param {string} slug @returns {string | null} */
export function periodFromSlug(slug) {
  const match = slug.match(/^([a-z]+)-(\d{4})$/)
  const month = match ? MONTH_NAMES.findIndex((name) => name.toLowerCase() === match[1]) : -1
  return match && month >= 0 ? toPeriod(Number(match[2]), month + 1) : null
}

export const urls = {
  home: '/',
  archive: '/visa-bulletin/',
  /** @param {string} period */
  bulletin: (period) => `/visa-bulletin/${periodSlug(period)}/`,
  lines: '/priority-dates/',
  /** @param {{ slug: string }} line */
  line: (line) => `/priority-dates/${line.slug}/`,
  /** @param {{ slug: string }} line @param {{ slug: string }} area */
  lineArea: (line, area) => `/priority-dates/${line.slug}/${area.slug}/`,
  planner: '/planner/',
  about: '/about/',
  methodology: '/methodology/',
  disclaimer: '/disclaimer/',
  privacy: '/privacy/',
  data: '/data/',
  feed: '/feed.xml',
}

export const OFFICIAL_LINKS = {
  bulletinIndex: 'https://travel.state.gov/content/travel/en/legal/visa-law0/visa-bulletin.html',
  uscisCharts: 'https://www.uscis.gov/green-card/green-card-processes-and-procedures/visa-availability-priority-dates/adjustment-of-status-filing-charts-from-the-visa-bulletin',
  uscisPriorityDates: 'https://www.uscis.gov/green-card/green-card-processes-and-procedures/visa-availability-and-priority-dates',
}
