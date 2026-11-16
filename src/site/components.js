// @ts-check
import { getCutoff } from '../lib/dataset.js'
import { AREAS, CHARTS, GROUPS, LINES, lineByKey } from '../lib/labels.js'
import { describeChange } from '../lib/movement.js'
import { FIRST_DATES_FOR_FILING_PERIOD } from '../lib/parseBulletin.js'
import { formatPeriod } from '../lib/period.js'
import { formatCutoff, urls } from './format.js'
import { html } from './html.js'

/** @typedef {import('../lib/dataset.js').BulletinView} BulletinView */
/** @typedef {import('../lib/labels.js').Chart} Chart */
/** @typedef {import('../lib/labels.js').Group} Group */

/** Printed rows that are not one of the site's own lines. @type {Record<string, string>} */
const OTHER_ROW_NAMES = {
  EB5: 'EB-5',
  EB5NRC: 'EB-5 Non-Regional Center',
  EB5RC: 'EB-5 Regional Center',
  EB5TEARC: 'EB-5 Targeted Employment Areas / Regional Centers',
}

/** @param {string} value */
export function cutoffValue(value) {
  if (value === 'Current') return html`<span class="cutoff cutoff-current">Current</span>`
  if (value === 'Unavailable') return html`<span class="cutoff cutoff-unavailable">Unavailable</span>`
  return html`<span class="cutoff">${formatCutoff(value)}</span>`
}

/** @param {import('../lib/movement.js').Movement | null} movement @param {string} [against] */
export function movementChip(movement, against) {
  if (!movement) return ''
  const symbol = movement.type === 'advance' ? '▲' : movement.type === 'retrogression' ? '▼' : ''
  const meaning = movement.type === 'advance' ? 'moved forward' : movement.type === 'retrogression' ? 'moved back' : 'did not move'
  return html`<span class="move move-${movement.type}" title="${against ? `${meaning} since ${against}` : meaning}">${symbol ? html`<span aria-hidden="true">${symbol}</span> ` : ''}${movement.type === 'unchanged' ? 'no change' : movement.label}<span class="sr-only"> (${meaning})</span></span>`
}

/** @param {BulletinView} view */
export function verificationBadge(view) {
  return view.verified
    ? html`<span class="badge badge-verified">Verified against the official page</span>`
    : html`<span class="badge badge-unverified">Unverified third-party data</span>`
}

/** Where this month's numbers come from. @param {BulletinView} view */
export function sourceLine(view) {
  const official = html`<a href="${view.bulletin.officialSourceUrl}" rel="noopener">official ${formatPeriod(view.period)} Visa Bulletin</a>`
  if (view.verified) {
    return html`<p class="source-line">${verificationBadge(view)} Read from the ${official} (U.S. Department of State)${view.source.snapshotUrl
      ? html`, as captured in <a href="${view.source.snapshotUrl}" rel="noopener">this Internet Archive snapshot</a>` : ''}. <a href="${urls.methodology}">How we verify</a>.</p>`
  }
  return html`<p class="source-line source-line-warning">${verificationBadge(view)} These dates come from a third-party compilation and have <strong>not yet been checked</strong> against the ${official}. Confirm there before relying on them. <a href="${urls.methodology}">Why</a>.</p>`
}

/**
 * One table: a preference group under one chart.
 * @param {{ view: BulletinView, previous: BulletinView | null, group: Group, chart: Chart }} options
 */
export function cutoffTable({ view, previous, group, chart }) {
  const groupInfo = GROUPS.find((item) => item.key === group)
  const chartInfo = CHARTS.find((item) => item.key === chart)
  const rows = Object.entries(view.categories[group]).filter(([, category]) => category[chart])
  if (!rows.length) return ''
  const extraAreas = Object.keys(view.areas).filter((key) => !AREAS.some((area) => area.key === key))
  const columns = [
    ...AREAS.map((area) => ({ key: area.key, name: area.name, title: area.longName, area })),
    ...extraAreas.map((key) => ({ key, name: view.areas[key], title: view.areas[key], area: null })),
  ]
  let usesFallback = false
  const body = rows.map(([key, category]) => {
    const line = lineByKey(key)
    const cells = /** @type {Record<string, string>} */ (category[chart])
    return html`<tr>
      <th scope="row">${line
        ? html`<a class="row-code" href="${urls.line(line)}">${line.code}</a><span class="row-name">${line.name}</span>`
        : html`<span class="row-code">${OTHER_ROW_NAMES[key] ?? category.label}</span><span class="row-name">As printed: ${category.label}</span>`}</th>
      ${columns.map((column) => {
        const listed = cells[column.key] !== undefined
        const value = listed ? cells[column.key] : column.area ? cells.all : undefined
        if (value === undefined) return html`<td class="cell-empty">not listed</td>`
        if (!listed) usesFallback = true
        const before = previous?.categories[group]?.[key]?.[chart]
        const previousValue = before ? before[column.key] ?? (column.area ? before.all : undefined) : undefined
        const content = html`${cutoffValue(value)}${listed ? '' : html`<sup class="via-all" title="Not listed separately this month; the All Chargeability date applies">†</sup>`}${movementChip(describeChange(value, previousValue), previous ? formatPeriod(previous.period) : undefined)}`
        return html`<td>${line && column.area ? html`<a class="cell-link" href="${urls.lineArea(line, column.area)}">${content}</a>` : content}</td>`
      })}
    </tr>`
  })
  return html`<section class="table-block">
    <h3>${groupInfo?.name} <span class="h-sub">${chartInfo?.name}</span></h3>
    <div class="table-scroll" tabindex="0" role="region" aria-label="${groupInfo?.name} ${chartInfo?.name}">
      <table class="cutoff-table">
        <thead><tr><th scope="col">Category</th>${columns.map((column) => html`<th scope="col" title="${column.title}">${column.name}</th>`)}</tr></thead>
        <tbody>${body}</tbody>
      </table>
    </div>
    ${usesFallback ? html`<p class="table-note">† Not listed separately in this bulletin, so the All Chargeability date applies.</p>` : ''}
  </section>`
}

/**
 * Deterministic month-over-month counts over the site's lines and areas (Final Action Dates).
 * @param {BulletinView} view @param {BulletinView | null} previous
 */
export function summariseMovement(view, previous) {
  /** @type {{ line: (typeof LINES)[number], area: (typeof AREAS)[number], movement: import('../lib/movement.js').Movement, value: string, previousValue: string }[]} */
  const moves = []
  if (previous) {
    for (const line of LINES) for (const area of AREAS) {
      const now = getCutoff(view, line.key, 'finalActionDates', area.key)
      const before = getCutoff(previous, line.key, 'finalActionDates', area.key)
      const movement = describeChange(now?.value, before?.value)
      if (now && before && movement) moves.push({ line, area, movement, value: now.value, previousValue: before.value })
    }
  }
  const of = (/** @type {string} */ type) => moves.filter((move) => move.movement.type === type)
  const byMagnitude = (/** @type {typeof moves} */ list) => [...list].sort((a, b) =>
    (b.movement.days === null ? Infinity : Math.abs(b.movement.days)) - (a.movement.days === null ? Infinity : Math.abs(a.movement.days)))
  return {
    total: moves.length,
    advances: byMagnitude(of('advance')),
    retrogressions: byMagnitude(of('retrogression')),
    unchanged: of('unchanged').length,
  }
}

/** Is the Dates for Filing chart part of this bulletin? @param {string} period */
export const hasFilingChart = (period) => period >= FIRST_DATES_FOR_FILING_PERIOD
