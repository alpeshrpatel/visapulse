// @ts-check
import { fiscalYearOf, parsePeriod } from './period.js'

const BASE = 'https://travel.state.gov/content/travel/en/legal/visa-law0/visa-bulletin'

/**
 * A handful of bulletins were published under a file name that breaks the
 * usual `visa-bulletin-for-<month>-<year>.html` pattern.
 * @type {Record<string, string>}
 */
const IRREGULAR_FILE_NAMES = {
  '2009-03': 'visa-bulletin-march-2009.html',
  '2009-09': 'visa-bulletin-september-2009.html',
  '2009-10': 'visa-bulletin-october-2009.html',
  '2009-11': 'visa-bulletin-november-2009.html',
  '2012-10': 'visa-bulletin-october-2012.html',
}

/**
 * The State Department files each bulletin under its fiscal year, so the
 * October–December bulletins live in the following year's folder.
 * @param {string} period
 */
export function officialBulletinUrl(period) {
  const { year, monthName } = parsePeriod(period)
  const fileName = IRREGULAR_FILE_NAMES[period]
    ?? `visa-bulletin-for-${monthName.toLowerCase()}-${year}.html`
  return `${BASE}/${fiscalYearOf(period)}/${fileName}`
}

/** URLs worth trying when locating a bulletin, most likely first. @param {string} period */
export function officialUrlCandidates(period) {
  const { year, monthName } = parsePeriod(period)
  const month = monthName.toLowerCase()
  const folder = `${BASE}/${fiscalYearOf(period)}`
  return [...new Set([
    officialBulletinUrl(period),
    `${folder}/visa-bulletin-for-${month}-${year}.html`,
    `${folder}/visa-bulletin-${month}-${year}.html`,
  ])]
}

export const OFFICIAL_BULLETIN_INDEX_URL = `${BASE}.html`
