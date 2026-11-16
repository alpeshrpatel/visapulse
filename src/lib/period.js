// @ts-check
/** Bulletin periods are `YYYY-MM` strings: the month a bulletin takes effect. */

export const MONTH_NAMES = Object.freeze([
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
])

const PERIOD_PATTERN = /^\d{4}-(0[1-9]|1[0-2])$/

/** @param {unknown} value @returns {value is string} */
export function isPeriod(value) {
  return typeof value === 'string' && PERIOD_PATTERN.test(value)
}

/** @param {string} period */
export function parsePeriod(period) {
  if (!isPeriod(period)) throw new Error(`Invalid period "${period}" (expected YYYY-MM)`)
  const year = Number(period.slice(0, 4))
  const month = Number(period.slice(5, 7))
  return { year, month, monthName: MONTH_NAMES[month - 1] }
}

/** @param {number} year @param {number} month 1–12 */
export function toPeriod(year, month) {
  return `${String(year).padStart(4, '0')}-${String(month).padStart(2, '0')}`
}

/** The U.S. federal fiscal year runs October through September. @param {string} period */
export function fiscalYearOf(period) {
  const { year, month } = parsePeriod(period)
  return month >= 10 ? year + 1 : year
}

/** @param {string} period @param {number} months may be negative */
export function shiftPeriod(period, months) {
  const { year, month } = parsePeriod(period)
  const shifted = new Date(Date.UTC(year, month - 1 + months, 1))
  return toPeriod(shifted.getUTCFullYear(), shifted.getUTCMonth() + 1)
}

/** @param {string} a @param {string} b */
export function comparePeriods(a, b) {
  return a < b ? -1 : a > b ? 1 : 0
}

/** Inclusive list of periods. @param {string} from @param {string} to */
export function periodRange(from, to) {
  parsePeriod(from)
  parsePeriod(to)
  const periods = []
  for (let period = from; period <= to; period = shiftPeriod(period, 1)) periods.push(period)
  return periods
}

/** "June 2025" @param {string} period */
export function formatPeriod(period) {
  const { year, monthName } = parsePeriod(period)
  return `${monthName} ${year}`
}
