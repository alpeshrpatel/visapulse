export function getUtcTimestamp(value) {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return null
  const timestamp = Date.parse(`${value}T00:00:00Z`)
  if (!Number.isFinite(timestamp) || new Date(timestamp).toISOString().slice(0, 10) !== value) return null
  return timestamp
}

export function getNumericDateDelta(current, previous) {
  const currentTimestamp = getUtcTimestamp(current)
  const previousTimestamp = getUtcTimestamp(previous)
  if (currentTimestamp === null || previousTimestamp === null) return null
  return Math.round((currentTimestamp - previousTimestamp) / 86400000)
}

export function getDatasetCoverage(periods) {
  const validPeriods = periods
    .filter((period) => /^\d{4}-(0[1-9]|1[0-2])$/.test(period))
    .sort()
  const startPeriod = validPeriods[0] ?? null
  const endPeriod = validPeriods.at(-1) ?? null
  const yearCount = startPeriod && endPeriod
    ? Number(endPeriod.slice(0, 4)) - Number(startPeriod.slice(0, 4)) + 1
    : 0
  return { startPeriod, endPeriod, yearCount, periods: validPeriods }
}

export function offsetPeriod(period, monthOffset) {
  if (!/^\d{4}-(0[1-9]|1[0-2])$/.test(period) || !Number.isInteger(monthOffset)) return null
  const [year, month] = period.split('-').map(Number)
  const offsetDate = new Date(Date.UTC(year, month - 1 + monthOffset, 1))
  return `${offsetDate.getUTCFullYear()}-${String(offsetDate.getUTCMonth() + 1).padStart(2, '0')}`
}

export function getNearestPriorDataPeriod(periods, bulletins, targetPeriod) {
  return periods
    .filter((period) => period <= targetPeriod)
    .sort()
    .reverse()
    .find((period) => Object.values(bulletins[period]?.categories ?? {}).some(
      (group) => Object.values(group).some((category) => Object.keys(category.finalActionDates ?? {}).length > 0),
    )) ?? null
}

export function buildMovementSnapshot(period, anchorPeriod, movements) {
  return {
    period,
    anchorPeriod,
    moves: movements
      .filter((item) => item.movement?.type !== 'unchanged')
      .map((item) => ({
        group: item.group,
        code: item.code,
        country: item.country,
        value: item.value,
        previousValue: item.previousValue,
        change: item.movement,
        days: Number.isFinite(item.days) ? item.days : null,
      })),
  }
}

export function formatMovementDelta(days, change) {
  if (Number.isFinite(days)) return `${days > 0 ? '+' : ''}${days}d`
  return change?.label ?? 'Date change unavailable'
}