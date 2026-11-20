// @ts-check
/**
 * Parse an official Visa Bulletin page (U.S. Department of State) into schema v2.
 *
 * Contract: never guess. Any row label, cell value or table layout this parser
 * does not positively recognise throws a BulletinParseError naming the problem.
 * Unknown *area columns* are kept under a key derived from their own header and
 * reported as a warning, because the header itself says what the column is.
 */
import { extractTables, toText } from './extractTables.js'
import { officialBulletinUrl } from './officialUrl.js'
import { MONTH_NAMES, fiscalYearOf, parsePeriod } from './period.js'

export const PARSER_VERSION = 1
/** The Dates for Filing chart was introduced with the October 2015 bulletin. */
export const FIRST_DATES_FOR_FILING_PERIOD = '2015-10'

export class BulletinParseError extends Error {
  /** @param {string} period @param {string} message */
  constructor(period, message) {
    super(`${period}: ${message}`)
    this.name = 'BulletinParseError'
    this.period = period
  }
}

/** @typedef {'familySponsored' | 'employmentBased'} Group */
/** @typedef {'finalActionDates' | 'datesForFiling'} Chart */

/** @type {[RegExp, string][]} */
const AREA_PATTERNS = [
  [/^all chargeability areas except those listed$/, 'all'],
  [/^china ?- ?mainland born$/, 'china'],
  [/^india$/, 'india'],
  [/^mexico$/, 'mexico'],
  [/^philippines$/, 'philippines'],
]

/** Row label (normalised) → category key, per group. Extend only after reading the official page. */
/** @type {Record<Group, [RegExp, string][]>} */
const CATEGORY_PATTERNS = {
  familySponsored: [
    [/^(1st|f1)$/, 'F1'],
    [/^(2a|f2a)$/, 'F2A'],
    [/^(2b|f2b)$/, 'F2B'],
    [/^(3rd|f3)$/, 'F3'],
    [/^(4th|f4)$/, 'F4'],
  ],
  employmentBased: [
    [/^1st$/, 'EB1'],
    [/^2nd$/, 'EB2'],
    [/^3rd$/, 'EB3'],
    [/^other workers$/, 'EB3OW'],
    [/^4th$/, 'EB4'],
    [/^certain religious workers$/, 'EB4SR'],
    [/^5th$/, 'EB5'],
    [/^(5th )?targeted employment areas ?\/ ?regional centers( and pilot programs)?$/, 'EB5TEARC'],
    [/^5th non-regional center \(c5 and t5\)$/, 'EB5NRC'],
    [/^5th regional center \(i5 and r5\)$/, 'EB5RC'],
    [/^5th unreserved\b/, 'EB5Unreserved'],
    [/^5th set aside: \(?rural\b/, 'EB5Rural'],
    [/^5th set aside: \(?high unemployment\b/, 'EB5HighUnemployment'],
    [/^5th set aside: \(?infrastructure\b/, 'EB5Infrastructure'],
  ],
}

const MONTH_ABBREVIATIONS = MONTH_NAMES.map((name) => name.slice(0, 3).toUpperCase())

/** @param {string} text */
const normalise = (text) => text.toLowerCase().replace(/\s+/g, ' ').replace(/\s*-\s*/g, '-').trim()

/** @param {string} header @param {string[]} warnings */
function areaKeyFor(header, warnings) {
  const cleaned = header.toLowerCase().replace(/\s*-\s*/g, ' - ').replace(/\s+/g, ' ').trim()
  for (const [pattern, key] of AREA_PATTERNS) if (pattern.test(cleaned)) return key
  if (!/^[a-z][a-z .,/&-]{2,60}$/.test(cleaned)) return null
  const words = cleaned.replace(/[^a-z ]+/g, ' ').trim().split(/\s+/)
  const key = words.map((word, index) => (index ? word[0].toUpperCase() + word.slice(1) : word)).join('')
  warnings.push(`unrecognised area column "${header}" kept as "${key}" — review`)
  return key
}

/**
 * @param {string} raw
 * @param {string} period
 * @param {string} where
 */
function parseCell(raw, period, where) {
  const value = raw.replace(/\s+/g, '').toUpperCase()
  if (value === 'C') return 'Current'
  if (value === 'U') return 'Unavailable'
  const match = value.match(/^(\d{2})([A-Z]{3})(\d{2})$/)
  if (!match) throw new BulletinParseError(period, `unrecognised cell "${raw}" at ${where}`)
  const monthIndex = MONTH_ABBREVIATIONS.indexOf(match[2])
  if (monthIndex < 0) throw new BulletinParseError(period, `unrecognised month in "${raw}" at ${where}`)
  // Two-digit years: a cut-off is never later than the bulletin's own month.
  const { year, month } = parsePeriod(period)
  const lastDayOfBulletinMonth = new Date(Date.UTC(year, month, 0)).toISOString().slice(0, 10)
  for (const century of [2000, 1900]) {
    const iso = `${century + Number(match[3])}-${String(monthIndex + 1).padStart(2, '0')}-${match[1]}`
    const timestamp = Date.parse(`${iso}T00:00:00Z`)
    if (!Number.isFinite(timestamp) || new Date(timestamp).toISOString().slice(0, 10) !== iso) {
      throw new BulletinParseError(period, `impossible date "${raw}" at ${where}`)
    }
    if (iso <= lastDayOfBulletinMonth) return iso
  }
  throw new BulletinParseError(period, `date "${raw}" at ${where} is after the bulletin month`)
}

/** @param {string} html @param {string} period */
function readTitle(html, period) {
  const { year, monthName } = parsePeriod(period)
  // Only the page's own <title> counts: the body links to other months.
  const pageTitle = toText(html.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1] ?? '')
  const match = pageTitle.match(/visa\s+bulletin\s+(?:for\s+)?([a-z]+)\s+(\d{4})/i)
  if (!match || match[1].toLowerCase() !== monthName.toLowerCase() || Number(match[2]) !== year) {
    throw new BulletinParseError(period, `page title "${pageTitle}" is not the Visa Bulletin for ${monthName} ${year}`)
  }
  return `Visa Bulletin for ${monthName} ${year}`
}

/**
 * @param {string} html the official page, unmodified
 * @param {string} period `YYYY-MM`
 * @returns {{ record: Record<string, any>, warnings: string[] }} record without its `source` block
 */
export function parseBulletin(html, period) {
  const { year, monthName } = parsePeriod(period)
  /** @type {string[]} */
  const warnings = []
  const title = readTitle(html, period)
  const hasFilingChart = period >= FIRST_DATES_FOR_FILING_PERIOD

  const cutoffTables = extractTables(html).filter((table) =>
    table.rows.length >= 4 && table.rows[0].some((cell) => /^all chargeability areas except those listed$/i.test(cell.replace(/\s*-\s*/g, '-'))))
  if (!cutoffTables.length) throw new BulletinParseError(period, 'no cut-off tables found')

  /** @type {Record<string, string>} */
  const areas = {}
  /** @type {Record<Group, Record<string, any>>} */
  const categories = { familySponsored: {}, employmentBased: {} }
  /** @type {Record<Group, number>} */
  const tablesSeen = { familySponsored: 0, employmentBased: 0 }

  for (const table of cutoffTables) {
    const [header, ...body] = table.rows
    // Older pages put the group name in a label row under the header.
    const groupText = `${header[0]} ${body[0]?.slice(1).every((cell) => !cell) ? body[0][0] : ''}`
    /** @type {Group | null} */
    const group = /family/i.test(groupText) ? 'familySponsored' : /employment/i.test(groupText) ? 'employmentBased' : null
    if (!group) throw new BulletinParseError(period, `cannot tell family from employment for table headed "${header.join(' | ')}"`)

    tablesSeen[group] += 1
    const maxTables = hasFilingChart ? 2 : 1
    if (tablesSeen[group] > maxTables) {
      throw new BulletinParseError(period, `found more than ${maxTables} ${group} table(s)`)
    }
    /** @type {Chart} */
    const chart = tablesSeen[group] === 1 ? 'finalActionDates' : 'datesForFiling'

    // Cross-check the chart against the sentence that introduces the table.
    const lead = table.before.slice(-420)
    const saysIssuance = /earlier than the (cut-off|final action) date/i.test(lead)
    const saysFiling = /filing applications for adjustment of status/i.test(lead)
    if (hasFilingChart && ((chart === 'finalActionDates' && saysFiling && !saysIssuance)
      || (chart === 'datesForFiling' && saysIssuance && !saysFiling))) {
      throw new BulletinParseError(period, `${group} table ${tablesSeen[group]} is introduced as the other chart`)
    }
    if (hasFilingChart && !saysIssuance && !saysFiling) {
      warnings.push(`${group} ${chart}: chart assigned by position only (introductory sentence not recognised)`)
    }

    const areaKeys = header.slice(1).map((cell) => {
      const key = areaKeyFor(cell, warnings)
      if (!key) throw new BulletinParseError(period, `unusable column header "${cell}" in ${group} ${chart}`)
      areas[key] ??= cell
      return key
    })
    if (new Set(areaKeys).size !== areaKeys.length) {
      throw new BulletinParseError(period, `duplicate area columns in ${group} ${chart}`)
    }

    for (const row of body) {
      if (row.every((cell) => !cell)) continue
      if (row.slice(1).every((cell) => !cell) && /family|employment/i.test(row[0])) continue
      if (row.length !== header.length) {
        throw new BulletinParseError(period, `row "${row[0]}" in ${group} ${chart} has ${row.length} cells, header has ${header.length}`)
      }
      const label = row[0].replace(/\s+/g, ' ').trim()
      const lookup = normalise(label.replace(/\*+$/, ''))
      const key = CATEGORY_PATTERNS[group].find(([pattern]) => pattern.test(lookup))?.[1]
      if (!key) throw new BulletinParseError(period, `unrecognised ${group} row "${label}" in ${chart}`)
      const category = categories[group][key] ??= { label }
      if (category[chart]) throw new BulletinParseError(period, `duplicate row for ${key} in ${group} ${chart}`)
      category[chart] = Object.fromEntries(areaKeys.map((areaKey, index) =>
        [areaKey, parseCell(row[index + 1], period, `${key} / ${areaKey} / ${chart}`)]))
    }
  }

  for (const group of /** @type {Group[]} */ (['familySponsored', 'employmentBased'])) {
    const expected = hasFilingChart ? 2 : 1
    if (tablesSeen[group] !== expected) {
      throw new BulletinParseError(period, `expected ${expected} ${group} table(s), found ${tablesSeen[group]}`)
    }
  }

  return {
    record: {
      schemaVersion: 2,
      period,
      bulletin: {
        month: monthName,
        year,
        fiscalYear: fiscalYearOf(period),
        title,
        officialSourceUrl: officialBulletinUrl(period),
      },
      areas,
      categories,
    },
    warnings,
  }
}
