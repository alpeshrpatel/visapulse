// @ts-check
/** How a cut-off changed between two bulletins. Pure functions, UTC dates only. */
import { getNumericDateDelta } from '../bulletinMetrics.js'

/** @typedef {'advance' | 'retrogression' | 'unchanged' | 'unknown'} MovementType */
/** @typedef {{ type: MovementType, label: string, days: number | null }} Movement */

/**
 * @param {string | null | undefined} current
 * @param {string | null | undefined} previous
 * @returns {Movement | null} null when either side is missing
 */
export function describeChange(current, previous) {
  if (current == null || previous == null) return null
  if (current === previous) return { type: 'unchanged', label: 'No change', days: 0 }
  if (current === 'Current') return { type: 'advance', label: 'Became current', days: null }
  if (current === 'Unavailable') return { type: 'retrogression', label: 'Became unavailable', days: null }
  if (previous === 'Current') return { type: 'retrogression', label: 'Cut-off imposed', days: null }
  if (previous === 'Unavailable') return { type: 'advance', label: 'Available again', days: null }
  const days = getNumericDateDelta(current, previous)
  if (days === null) return { type: 'unknown', label: 'Change unknown', days: null }
  return {
    type: days > 0 ? 'advance' : 'retrogression',
    label: formatDays(days),
    days,
  }
}

/** "+3 mo 5 d" style label that keeps the exact day count readable. @param {number} days */
export function formatDays(days) {
  const sign = days > 0 ? '+' : '−'
  const magnitude = Math.abs(days)
  if (magnitude < 60) return `${sign}${magnitude} d`
  const years = Math.floor(magnitude / 365)
  const months = Math.round((magnitude - years * 365) / 30.44)
  if (years === 0) return `${sign}${months} mo`
  return months ? `${sign}${years} yr ${months} mo` : `${sign}${years} yr`
}

/**
 * Is a priority date current under a cut-off? A date is current when it is
 * *earlier than* the cut-off (the bulletin's own wording).
 * @param {string} priorityDate ISO date @param {string} cutoff
 * @returns {'current' | 'waiting' | 'unavailable'}
 */
export function priorityDateStatus(priorityDate, cutoff) {
  if (cutoff === 'Current') return 'current'
  if (cutoff === 'Unavailable') return 'unavailable'
  return priorityDate < cutoff ? 'current' : 'waiting'
}
