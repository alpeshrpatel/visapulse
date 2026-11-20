// @ts-check
/** UTC date helpers shared by the planner rules and the movement calculations. */

/** @param {unknown} value @returns {number | null} UTC timestamp of an ISO date, or null if it is not a real date */
export function getUtcTimestamp(value) {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return null
  const timestamp = Date.parse(`${value}T00:00:00Z`)
  if (!Number.isFinite(timestamp) || new Date(timestamp).toISOString().slice(0, 10) !== value) return null
  return timestamp
}

/** @param {unknown} current @param {unknown} previous @returns {number | null} whole days from previous to current */
export function getNumericDateDelta(current, previous) {
  const currentTimestamp = getUtcTimestamp(current)
  const previousTimestamp = getUtcTimestamp(previous)
  if (currentTimestamp === null || previousTimestamp === null) return null
  return Math.round((currentTimestamp - previousTimestamp) / 86400000)
}
