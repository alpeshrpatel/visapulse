// @ts-check
/**
 * Validate a schema-v2 bulletin record. Returns a list of problems; an empty
 * list means the record may be published as "verified".
 */
import { FIRST_DATES_FOR_FILING_PERIOD } from './parseBulletin.js'
import { MONTH_NAMES, fiscalYearOf, isPeriod, parsePeriod } from './period.js'

const REQUIRED_FAMILY = ['F1', 'F2A', 'F2B', 'F3', 'F4']
const REQUIRED_EMPLOYMENT = ['EB1', 'EB2', 'EB3', 'EB4']
const CHARTS = /** @type {const} */ (['finalActionDates', 'datesForFiling'])
const EARLIEST_PLAUSIBLE_CUTOFF = '1970-01-01'

/** @param {unknown} value @returns {value is string} */
export function isIsoDate(value) {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false
  const timestamp = Date.parse(`${value}T00:00:00Z`)
  return Number.isFinite(timestamp) && new Date(timestamp).toISOString().slice(0, 10) === value
}

/** @param {unknown} value */
const isObject = (value) => typeof value === 'object' && value !== null && !Array.isArray(value)

/**
 * @param {any} record
 * @param {{ expectedPeriod?: string, expectedSha256?: string }} [options]
 * @returns {string[]}
 */
export function validateBulletin(record, options = {}) {
  /** @type {string[]} */
  const errors = []
  const fail = (/** @type {string} */ message) => { errors.push(message) }

  if (!isObject(record)) return ['record is not an object']
  if (record.schemaVersion !== 2) fail(`schemaVersion must be 2, got ${record.schemaVersion}`)
  if (!isPeriod(record.period)) return [...errors, `invalid period "${record.period}"`]
  const period = record.period
  if (options.expectedPeriod && options.expectedPeriod !== period) {
    fail(`period ${period} does not match file name ${options.expectedPeriod}`)
  }
  const { year, month } = parsePeriod(period)
  const lastDayOfMonth = new Date(Date.UTC(year, month, 0)).toISOString().slice(0, 10)

  const bulletin = record.bulletin
  if (!isObject(bulletin)) fail('missing bulletin block')
  else {
    if (bulletin.month !== MONTH_NAMES[month - 1]) fail(`bulletin.month "${bulletin.month}" does not match period`)
    if (bulletin.year !== year) fail(`bulletin.year ${bulletin.year} does not match period`)
    if (bulletin.fiscalYear !== fiscalYearOf(period)) fail(`bulletin.fiscalYear ${bulletin.fiscalYear} is wrong for ${period}`)
    if (typeof bulletin.officialSourceUrl !== 'string' || !bulletin.officialSourceUrl.startsWith('https://travel.state.gov/')) {
      fail('bulletin.officialSourceUrl must be a travel.state.gov URL')
    }
  }

  const source = record.source
  if (!isObject(source)) fail('missing source (provenance) block')
  else {
    if (typeof source.sha256 !== 'string' || !/^[0-9a-f]{64}$/.test(source.sha256)) fail('source.sha256 must be a SHA-256 hex digest')
    if (options.expectedSha256 && source.sha256 !== options.expectedSha256) fail('source.sha256 does not match the manifest')
    if (typeof source.officialUrl !== 'string' || !source.officialUrl.startsWith('https://travel.state.gov/')) fail('source.officialUrl must be a travel.state.gov URL')
    if (!['web.archive.org', 'manual-file'].includes(source.retrievedVia)) fail(`source.retrievedVia "${source.retrievedVia}" is not recognised`)
    if (source.retrievedVia === 'web.archive.org'
      && (typeof source.snapshotUrl !== 'string' || !source.snapshotUrl.startsWith('https://web.archive.org/web/'))) {
      fail('source.snapshotUrl must be a web.archive.org snapshot URL')
    }
    if (!Number.isInteger(source.parserVersion)) fail('source.parserVersion must be an integer')
  }

  const areas = record.areas
  if (!isObject(areas) || !('all' in areas)) fail('areas must include "all" (All Chargeability Areas Except Those Listed)')
  const areaKeys = new Set(Object.keys(isObject(areas) ? areas : {}))

  const categories = record.categories
  if (!isObject(categories) || !isObject(categories.familySponsored) || !isObject(categories.employmentBased)) {
    return [...errors, 'categories must contain familySponsored and employmentBased']
  }
  for (const code of REQUIRED_FAMILY) {
    if (!categories.familySponsored[code]?.finalActionDates) fail(`familySponsored.${code} has no Final Action dates`)
  }
  for (const code of REQUIRED_EMPLOYMENT) {
    if (!categories.employmentBased[code]?.finalActionDates) fail(`employmentBased.${code} has no Final Action dates`)
  }
  if (!Object.keys(categories.employmentBased).some((code) => code.startsWith('EB5'))) fail('no EB-5 row found')

  const filingChartExists = period >= FIRST_DATES_FOR_FILING_PERIOD
  for (const [group, items] of Object.entries(categories)) {
    for (const [code, item] of Object.entries(/** @type {Record<string, any>} */ (items))) {
      const where = `${group}.${code}`
      if (typeof item.label !== 'string' || !item.label) fail(`${where} has no label`)
      if (!item.finalActionDates && !item.datesForFiling) fail(`${where} has no chart at all`)
      if (item.datesForFiling && !filingChartExists) fail(`${where} has Dates for Filing before that chart existed`)
      for (const chart of CHARTS) {
        const cells = item[chart]
        if (cells === undefined) continue
        if (!isObject(cells) || !('all' in cells)) { fail(`${where}.${chart} must include "all"`); continue }
        for (const [area, value] of Object.entries(cells)) {
          if (!areaKeys.has(area)) fail(`${where}.${chart}.${area} is not a declared area`)
          if (value === 'Current' || value === 'Unavailable') continue
          if (!isIsoDate(value)) fail(`${where}.${chart}.${area} has invalid value "${value}"`)
          else if (value > lastDayOfMonth) fail(`${where}.${chart}.${area} (${value}) is after the bulletin month`)
          else if (value < EARLIEST_PLAUSIBLE_CUTOFF) fail(`${where}.${chart}.${area} (${value}) is implausibly old`)
        }
      }
    }
  }
  return errors
}
