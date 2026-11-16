// @ts-check
/**
 * One read path for bulletin data.
 *
 * - Official records (`data/bulletins/`, schema v2) are the source of truth.
 * - The frozen legacy scrape (`data/visa-bulletins/`) is used only for months
 *   with no official record, only when structurally complete, and is always
 *   tagged `verified: false`. It is adapted in memory; files are never edited.
 */
import { existsSync, readdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { LINES } from './labels.js'
import { officialBulletinUrl } from './officialUrl.js'
import { FIRST_DATES_FOR_FILING_PERIOD } from './parseBulletin.js'
import { MONTH_NAMES, fiscalYearOf, isPeriod, parsePeriod } from './period.js'

/** @typedef {import('./labels.js').Group} Group */
/** @typedef {import('./labels.js').Chart} Chart */
/** @typedef {Record<string, string>} Cells */
/** @typedef {{ label: string, finalActionDates?: Cells, datesForFiling?: Cells }} Category */
/**
 * @typedef {{
 *   period: string, verified: boolean,
 *   bulletin: { month: string, year: number, fiscalYear: number, officialSourceUrl: string },
 *   source: Record<string, any>,
 *   areas: Record<string, string>,
 *   categories: Record<Group, Record<string, Category>>,
 * }} BulletinView
 */

const LEGACY_AREAS = {
  allChargeabilityAreasExceptThoseListed: 'all',
  chinaMainlandBorn: 'china',
  india: 'india',
  mexico: 'mexico',
  philippines: 'philippines',
}
const LEGACY_AREA_LABELS = {
  all: 'All Chargeability Areas Except Those Listed',
  china: 'China-mainland born',
  india: 'India',
  mexico: 'Mexico',
  philippines: 'Philippines',
}
/** @type {Record<string, string>} */
const LEGACY_CATEGORY_KEYS = { otherWorkers: 'EB3OW', certainReligiousWorkers: 'EB4SR' }
const LEGACY_REQUIRED = { familySponsored: ['F1', 'F2A', 'F2B', 'F3', 'F4'], employmentBased: ['EB1', 'EB2', 'EB3'] }

/**
 * Adapt a legacy file to the v2 view, or return null when it cannot be trusted
 * structurally (missing whole tables — a known failure of the old scraper,
 * which in those months also filed family dates under employment rows).
 * @param {any} legacy @param {string} period @returns {BulletinView | null}
 */
export function adaptLegacy(legacy, period) {
  const groups = legacy?.categories
  if (!groups) return null
  for (const [group, required] of Object.entries(LEGACY_REQUIRED)) {
    if (required.some((code) => !groups[group]?.[code])) return null
  }
  const filingChartExists = period >= FIRST_DATES_FOR_FILING_PERIOD
  /** @param {Record<string, string> | undefined} cells */
  const adaptCells = (cells) => {
    /** @type {Cells} */
    const adapted = {}
    for (const [legacyArea, value] of Object.entries(cells ?? {})) {
      const area = LEGACY_AREAS[/** @type {keyof typeof LEGACY_AREAS} */ (legacyArea)]
      if (area) adapted[area] = value
    }
    return 'all' in adapted ? adapted : undefined
  }
  /** @type {BulletinView['categories']} */
  const categories = { familySponsored: {}, employmentBased: {} }
  for (const group of /** @type {Group[]} */ (['familySponsored', 'employmentBased'])) {
    for (const [code, item] of Object.entries(/** @type {Record<string, any>} */ (groups[group] ?? {}))) {
      const finalActionDates = adaptCells(item.finalActionDates)
      // The old scraper filled Dates for Filing for months before that chart existed.
      const datesForFiling = filingChartExists ? adaptCells(item.datesForFiling) : undefined
      if (!finalActionDates && !datesForFiling) continue
      categories[group][LEGACY_CATEGORY_KEYS[code] ?? code] = {
        label: item.name ?? code,
        ...(finalActionDates ? { finalActionDates } : {}),
        ...(datesForFiling ? { datesForFiling } : {}),
      }
    }
  }
  const { year, month } = parsePeriod(period)
  return {
    period,
    verified: false,
    bulletin: { month: MONTH_NAMES[month - 1], year, fiscalYear: fiscalYearOf(period), officialSourceUrl: officialBulletinUrl(period) },
    source: { publisher: 'Third-party compilation (visabulletin.ai), not verified against the official page', retrievedVia: 'legacy' },
    areas: { ...LEGACY_AREA_LABELS },
    categories,
  }
}

/** @param {string} dir @returns {Map<string, any>} period → parsed JSON */
function readPeriodFiles(dir) {
  const files = new Map()
  if (!existsSync(dir)) return files
  for (const year of readdirSync(dir).sort()) {
    if (!/^\d{4}$/.test(year)) continue
    for (const name of readdirSync(join(dir, year)).sort()) {
      const period = name.replace(/\.json$/, '')
      if (name.endsWith('.json') && isPeriod(period)) files.set(period, JSON.parse(readFileSync(join(dir, year, name), 'utf8')))
    }
  }
  return files
}

/**
 * Find a line's cells in a record, following the line's key lineage.
 * @param {BulletinView} view @param {string} lineKey @param {Chart} chart
 */
export function findLine(view, lineKey, chart) {
  const line = LINES.find((item) => item.key === lineKey)
  if (!line) return null
  for (const key of line.candidates) {
    const category = view.categories[line.group]?.[key]
    if (category?.[chart]) return { key, label: category.label, cells: /** @type {Cells} */ (category[chart]) }
  }
  return null
}

/**
 * The cut-off for a line and area. An area the bulletin does not list is
 * charged to "All Chargeability Areas Except Those Listed" (`viaAll`).
 * @param {BulletinView | null | undefined} view @param {string} lineKey @param {Chart} chart @param {string} area
 * @returns {{ value: string, viaAll: boolean, sourceKey: string } | null}
 */
export function getCutoff(view, lineKey, chart, area) {
  if (!view) return null
  const found = findLine(view, lineKey, chart)
  if (!found) return null
  if (found.cells[area] !== undefined) return { value: found.cells[area], viaAll: false, sourceKey: found.key }
  if (found.cells.all !== undefined) return { value: found.cells.all, viaAll: area !== 'all', sourceKey: found.key }
  return null
}

/**
 * @param {{ officialDir: string, legacyDir?: string }} options
 */
export function loadDataset({ officialDir, legacyDir }) {
  /** @type {Map<string, BulletinView>} */
  const views = new Map()
  /** @type {string[]} */
  const legacyRejected = []
  if (legacyDir) {
    for (const [period, legacy] of readPeriodFiles(legacyDir)) {
      const view = adaptLegacy(legacy, period)
      if (view) views.set(period, view)
      else legacyRejected.push(period)
    }
  }
  for (const [period, record] of readPeriodFiles(officialDir)) {
    views.set(period, { ...record, verified: true })
  }
  const periods = [...views.keys()].sort()
  const verifiedPeriods = periods.filter((period) => views.get(period)?.verified)

  return {
    periods,
    verifiedPeriods,
    /** Legacy months withheld because the old scrape is structurally broken there. */
    withheldPeriods: legacyRejected.filter((period) => !views.has(period)).sort(),
    latestPeriod: periods.at(-1) ?? null,
    /** @param {string} period */
    get: (period) => views.get(period) ?? null,
    /** @param {string} period */
    previousOf: (period) => periods.filter((candidate) => candidate < period).at(-1) ?? null,
    /**
     * @param {string} lineKey @param {Chart} chart @param {string} area
     * @returns {{ period: string, value: string, viaAll: boolean, verified: boolean }[]}
     */
    series(lineKey, chart, area) {
      const points = []
      for (const period of periods) {
        const view = /** @type {BulletinView} */ (views.get(period))
        const cutoff = getCutoff(view, lineKey, chart, area)
        if (cutoff) points.push({ period, value: cutoff.value, viaAll: cutoff.viaAll, verified: view.verified })
      }
      return points
    },
  }
}

/** @typedef {ReturnType<typeof loadDataset>} Dataset */
