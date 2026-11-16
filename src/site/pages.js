// @ts-check
/** Page renderers: pure functions from data to a complete HTML document. */
import { getCutoff } from '../lib/dataset.js'
import { AREAS, CHARTS, GROUPS, LINES, linesInGroup } from '../lib/labels.js'
import { describeChange } from '../lib/movement.js'
import { officialBulletinUrl } from '../lib/officialUrl.js'
import { fiscalYearOf, formatPeriod, periodRange, shiftPeriod } from '../lib/period.js'
import { renderCutoffChart } from './chart.js'
import { cutoffTable, cutoffValue, hasFilingChart, movementChip, sourceLine, summariseMovement } from './components.js'
import { OFFICIAL_LINKS, formatCutoff, urls } from './format.js'
import { html, jsonForScript } from './html.js'
import { layout } from './layout.js'

/** @typedef {import('./layout.js').SiteContext} SiteContext */
/** @typedef {import('../lib/dataset.js').Dataset} Dataset */
/** @typedef {{ site: SiteContext, dataset: Dataset }} Common */

/** @param {ReturnType<typeof summariseMovement>['advances']} moves */
const moveList = (moves) => html`<ul class="move-list">${moves.slice(0, 5).map((move) => html`<li>
  <a href="${urls.lineArea(move.line, move.area)}">${move.line.code} ${move.area.name}</a>
  ${movementChip(move.movement)}<span class="move-detail">${formatCutoff(move.previousValue)} → ${formatCutoff(move.value)}</span></li>`)}</ul>`

/** @param {Common & { period: string, isHome?: boolean }} options */
export function bulletinPage({ site, dataset, period, isHome = false }) {
  const view = dataset.get(period)
  if (!view) throw new Error(`No data for ${period}`)
  const label = formatPeriod(period)
  const previousPeriod = shiftPeriod(period, -1)
  const previous = dataset.get(previousPeriod)
  const summary = summariseMovement(view, previous)
  const filing = hasFilingChart(period)
  const olderPeriod = dataset.previousOf(period)
  const newerPeriod = dataset.periods.find((candidate) => candidate > period) ?? null

  const charts = CHARTS.filter((chart) => chart.key === 'finalActionDates' || filing)
  const panels = charts.map((chart) => html`<div class="chart-panel" id="${chart.slug}" data-chart-panel="${chart.key}">
    <h2>${filing ? chart.name : 'Cut-off dates'}</h2>
    <p class="panel-help">${chart.key === 'finalActionDates'
      ? 'A green card can be approved, or an immigrant visa issued, when your priority date is earlier than the date shown.'
      : html`You may be able to file earlier than final action allows, using this chart, <em>only</em> in months when USCIS says it accepts it. <a href="${OFFICIAL_LINKS.uscisCharts}" rel="noopener">Check which chart USCIS accepts this month</a>.`}</p>
    ${GROUPS.map((group) => cutoffTable({ view, previous, group: group.key, chart: chart.key }))}
  </div>`)

  const body = html`
<section class="hero">
  <p class="kicker">Visa Bulletin · Fiscal year ${view.bulletin.fiscalYear}</p>
  <h1>${isHome ? html`${label} Visa Bulletin` : html`Visa Bulletin for ${label}`}</h1>
  <p class="lede">Priority-date cut-offs for every family and employment category${previous ? html`, with movement since ${formatPeriod(previousPeriod)}` : ''}.</p>
  ${sourceLine(view)}
  ${isHome ? html`<p class="cta-row"><a class="button" href="${urls.lines}">Find your category</a><a class="button button-quiet" href="${urls.planner}">Plan your next step</a></p>` : ''}
</section>

<section class="summary" aria-labelledby="summary-h">
  <h2 id="summary-h">What moved</h2>
  ${previous ? html`<p>Final Action Dates compared with ${formatPeriod(previousPeriod)}: <strong>${summary.advances.length} moved forward</strong>, <strong>${summary.retrogressions.length} moved back</strong> and ${summary.unchanged} did not move, across ${summary.total} category and area pairs.${previous.verified ? '' : ' (The earlier month is unverified data.)'}</p>
  <div class="summary-grid">
    <div><h3>Biggest advances</h3>${summary.advances.length ? moveList(summary.advances) : html`<p class="muted">None this month.</p>`}</div>
    <div><h3>Retrogressions</h3>${summary.retrogressions.length ? moveList(summary.retrogressions) : html`<p class="muted">None this month.</p>`}</div>
  </div>` : html`<p class="muted">${formatPeriod(previousPeriod)} is not in our data yet, so month-over-month movement is not shown.</p>`}
</section>

<section class="dates" aria-label="Cut-off dates">
  ${filing ? html`<div class="chart-switch" data-chart-switch hidden>
    ${charts.map((chart, index) => html`<button type="button" data-chart="${chart.key}" aria-pressed="${index === 0 ? 'true' : 'false'}">${chart.name}</button>`)}
  </div>` : html`<p class="muted">This bulletin has a single chart. The separate Dates for Filing chart began in October 2015.</p>`}
  ${panels}
</section>

<section class="explain">
  <h2>How to read these dates</h2>
  <ul>
    <li>Your <strong>priority date</strong> is usually the day your petition or labor certification was filed. You are current when it is <em>earlier than</em> the cut-off shown.</li>
    <li><strong>Current</strong> means there is no backlog for that category and area. <strong>Unavailable</strong> means no visa numbers can be used that month.</li>
    <li>If your country is not one of the listed areas, use <strong>All Chargeability</strong>.</li>
    <li>Dates can move backwards (retrogress). Nothing here predicts future movement.</li>
  </ul>
</section>

<nav class="pager" aria-label="Other bulletins">
  ${olderPeriod ? html`<a href="${urls.bulletin(olderPeriod)}" rel="prev">← ${formatPeriod(olderPeriod)}</a>` : html`<span></span>`}
  <a href="${urls.archive}">All bulletins</a>
  ${newerPeriod ? html`<a href="${urls.bulletin(newerPeriod)}" rel="next">${formatPeriod(newerPeriod)} →</a>` : html`<span></span>`}
</nav>`

  return layout({
    site,
    path: isHome ? urls.home : urls.bulletin(period),
    nav: isHome ? 'home' : 'archive',
    title: isHome
      ? `${label} Visa Bulletin: priority dates and movement | VisaPulse`
      : `${label} Visa Bulletin: Final Action Dates${filing ? ' and Dates for Filing' : ''}`,
    description: `Cut-off dates from the ${label} Visa Bulletin for every family and employment category${previous ? `, with movement since ${formatPeriod(previousPeriod)}` : ''}. ${view.verified ? 'Verified against the official State Department page.' : 'Not yet verified against the official page.'}`,
    body,
    jsonLd: isHome ? {
      '@context': 'https://schema.org',
      '@type': 'WebSite',
      name: 'VisaPulse',
      description: 'U.S. Visa Bulletin priority-date cut-offs, verified against the official source.',
      ...(site.siteUrl ? { url: `${site.siteUrl}/` } : {}),
    } : undefined,
  })
}

/** @param {Common} options */
export function archivePage({ site, dataset }) {
  const latest = /** @type {string} */ (dataset.latestPeriod)
  const everyPeriod = periodRange('2002-01', latest)
  /** @type {Map<number, string[]>} */
  const byFiscalYear = new Map()
  for (const period of everyPeriod) {
    const fiscalYear = fiscalYearOf(period)
    byFiscalYear.set(fiscalYear, [...(byFiscalYear.get(fiscalYear) ?? []), period])
  }
  const body = html`
<section class="hero">
  <p class="kicker">Archive</p>
  <h1>Every Visa Bulletin since 2002</h1>
  <p class="lede">${dataset.periods.length} months are available here; ${dataset.verifiedPeriods.length} of them are verified against the official page so far. Months we cannot stand behind yet link straight to the State Department.</p>
</section>
${[...byFiscalYear.keys()].sort((a, b) => b - a).map((fiscalYear) => html`<section class="archive-year">
  <h2>Fiscal year ${fiscalYear}</h2>
  <ul class="archive-list">
    ${(byFiscalYear.get(fiscalYear) ?? []).map((period) => {
      const view = dataset.get(period)
      return view
        ? html`<li><a href="${urls.bulletin(period)}">${formatPeriod(period)}</a> <span class="tag ${view.verified ? 'tag-verified' : 'tag-unverified'}">${view.verified ? 'verified' : 'unverified'}</span></li>`
        : html`<li class="archive-missing">${formatPeriod(period)} <a href="${officialBulletinUrl(period)}" rel="noopener">official page ↗</a></li>`
    })}
  </ul>
</section>`)}`
  return layout({
    site, path: urls.archive, nav: 'archive', body,
    title: 'Visa Bulletin archive: every month since 2002',
    description: 'Browse U.S. Visa Bulletin cut-off dates month by month, back to fiscal year 2002, with links to each official bulletin.',
  })
}

/** @param {Common} options */
export function linesIndexPage({ site, dataset }) {
  const latest = /** @type {string} */ (dataset.latestPeriod)
  const view = dataset.get(latest)
  const body = html`
<section class="hero">
  <p class="kicker">Priority dates</p>
  <h1>Find your category</h1>
  <p class="lede">Pick your preference category and chargeability area to see the current cut-off, its full history and every retrogression. Showing Final Action Dates from the ${formatPeriod(latest)} bulletin.</p>
  ${view ? sourceLine(view) : ''}
</section>
${GROUPS.map((group) => html`<section class="table-block">
  <h2>${group.name}</h2>
  <div class="table-scroll" tabindex="0" role="region" aria-label="${group.name} categories">
    <table class="cutoff-table">
      <thead><tr><th scope="col">Category</th>${AREAS.map((area) => html`<th scope="col" title="${area.longName}">${area.name}</th>`)}</tr></thead>
      <tbody>${linesInGroup(group.key).map((line) => html`<tr>
        <th scope="row"><a class="row-code" href="${urls.line(line)}">${line.code}</a><span class="row-name">${line.name}</span></th>
        ${AREAS.map((area) => {
          const cutoff = getCutoff(view, line.key, 'finalActionDates', area.key)
          return html`<td><a class="cell-link" href="${urls.lineArea(line, area)}">${cutoff ? cutoffValue(cutoff.value) : 'no data'}</a></td>`
        })}
      </tr>`)}</tbody>
    </table>
  </div>
</section>`)}
<p class="muted">Not sure which category is yours? Your I-797 approval notice for Form I-130 or I-140 shows the classification, or ask your attorney. If your country is not listed, use All Chargeability.</p>`
  return layout({
    site, path: urls.lines, nav: 'lines', body,
    title: 'Priority dates by category and country',
    description: 'Current Visa Bulletin cut-off dates for EB-1 to EB-5 and F1 to F4, by chargeability area, with history for each.',
  })
}

/** @param {Common & { line: (typeof LINES)[number] }} options */
export function linePage({ site, dataset, line }) {
  const latest = /** @type {string} */ (dataset.latestPeriod)
  const view = dataset.get(latest)
  const series = AREAS.map((area, index) => ({
    name: area.name,
    color: index + 1,
    points: dataset.series(line.key, 'finalActionDates', area.key),
  }))
  const body = html`
<section class="hero">
  <p class="kicker"><a href="${urls.lines}">Priority dates</a> · ${GROUPS.find((group) => group.key === line.group)?.name}</p>
  <h1>${line.code} priority dates</h1>
  <p class="lede">${line.name}. Current cut-offs by chargeability area, from the ${formatPeriod(latest)} bulletin.</p>
  ${view ? sourceLine(view) : ''}
</section>
<section class="table-block">
  <div class="table-scroll" tabindex="0" role="region" aria-label="${line.code} cut-offs by area">
    <table class="cutoff-table">
      <thead><tr><th scope="col">Area</th>${CHARTS.map((chart) => html`<th scope="col">${chart.name}</th>`)}</tr></thead>
      <tbody>${AREAS.map((area) => html`<tr>
        <th scope="row"><a class="row-code" href="${urls.lineArea(line, area)}">${area.name}</a><span class="row-name">${area.longName}</span></th>
        ${CHARTS.map((chart) => {
          const cutoff = getCutoff(view, line.key, chart.key, area.key)
          return html`<td>${cutoff ? cutoffValue(cutoff.value) : html`<span class="muted">no data</span>`}</td>`
        })}
      </tr>`)}</tbody>
    </table>
  </div>
</section>
<section class="chart-block">
  <h2>${line.code} Final Action Dates over time</h2>
  ${chartLegend(series)}
  <div class="chart-scroll">${renderCutoffChart({ title: `${line.code} Final Action Dates by area`, series })}</div>
  <p class="muted">Each line is a cut-off date as published month by month. ${line.note ?? ''} Past movement does not predict future movement.</p>
</section>`
  return layout({
    site, path: urls.line(line), nav: 'lines', body,
    title: `${line.code} priority dates: current cut-offs and history`,
    description: `${line.code} (${line.name}) Visa Bulletin cut-off dates for All Chargeability, China, India, Mexico and the Philippines, with history since 2002.`,
  })
}

/** @param {{ name: string, color: number, dashed?: boolean }[]} series */
const chartLegend = (series) => html`<ul class="chart-legend">${series.map((item) =>
  html`<li><span class="legend-swatch${item.dashed ? ' legend-dashed' : ''}" style="--swatch: var(--series-${item.color})"></span>${item.name}</li>`)}</ul>`

/** @param {Common & { line: (typeof LINES)[number], area: (typeof AREAS)[number] }} options */
export function lineAreaPage({ site, dataset, line, area }) {
  const latest = /** @type {string} */ (dataset.latestPeriod)
  const view = dataset.get(latest)
  const final = dataset.series(line.key, 'finalActionDates', area.key)
  const filing = dataset.series(line.key, 'datesForFiling', area.key)
  const finalByPeriod = new Map(final.map((point) => [point.period, point]))
  const filingByPeriod = new Map(filing.map((point) => [point.period, point]))
  const name = `${line.code} ${area.name}`

  /** @param {Map<string, { value: string }>} byPeriod @param {number} monthsBack */
  const changeOver = (byPeriod, monthsBack) =>
    describeChange(byPeriod.get(latest)?.value, byPeriod.get(shiftPeriod(latest, -monthsBack))?.value)

  const retrogressions = final.flatMap((point) => {
    const before = finalByPeriod.get(shiftPeriod(point.period, -1))
    const movement = describeChange(point.value, before?.value)
    return before && movement?.type === 'retrogression' ? [{ point, before, movement }] : []
  }).reverse()

  const verifiedCount = final.filter((point) => point.verified).length
  const cards = CHARTS.map((chart) => {
    const byPeriod = chart.key === 'finalActionDates' ? finalByPeriod : filingByPeriod
    const now = byPeriod.get(latest)
    return html`<div class="stat-card">
      <p class="stat-label">${chart.name}</p>
      <p class="stat-value">${now ? cutoffValue(now.value) : html`<span class="muted">no data</span>`}</p>
      <p class="stat-moves">${now ? html`
        <span>1 month: ${movementChip(changeOver(byPeriod, 1)) || html`<span class="muted">n/a</span>`}</span>
        <span>12 months: ${movementChip(changeOver(byPeriod, 12)) || html`<span class="muted">n/a</span>`}</span>` : ''}</p>
    </div>`
  })

  const periodsDescending = [...new Set([...final, ...filing].map((point) => point.period))].sort().reverse()
  const body = html`
<section class="hero">
  <p class="kicker"><a href="${urls.lines}">Priority dates</a> · <a href="${urls.line(line)}">${line.code}</a></p>
  <h1>${name} priority date</h1>
  <p class="lede">${line.name}, chargeable to ${area.longName}. Cut-offs from the ${formatPeriod(latest)} Visa Bulletin${getCutoff(view, line.key, 'finalActionDates', area.key)?.viaAll ? ' (not listed separately this month, so the All Chargeability date applies)' : ''}.</p>
  ${view ? sourceLine(view) : ''}
</section>
<section class="stat-row" aria-label="Current cut-offs">${cards}</section>
<p class="muted">You are current when your priority date is <em>earlier than</em> the cut-off. Whether the Dates for Filing chart can be used for an I-485 this month is decided by USCIS: <a href="${OFFICIAL_LINKS.uscisCharts}" rel="noopener">check the USCIS page</a>.</p>

<section class="chart-block">
  <h2>${name} cut-off history</h2>
  ${chartLegend([{ name: 'Final Action Date', color: 1 }, { name: 'Date for Filing', color: 2, dashed: true }])}
  <div class="chart-scroll">${renderCutoffChart({
    title: `${name} cut-off dates by bulletin month`,
    series: [
      { name: 'Final Action Date', color: 1, points: final },
      { name: 'Date for Filing', color: 2, dashed: true, points: filing },
    ],
  })}</div>
  <p class="muted">This is what happened, not a forecast. ${verifiedCount} of ${final.length} months shown are verified against the official page; the rest are unverified third-party data${verifiedCount < final.length ? ', which can contain errors (an isolated spike is a typical sign)' : ''}. ${line.note ?? ''}</p>
</section>

<section>
  <h2>Retrogressions</h2>
  ${retrogressions.length ? html`<p>The Final Action Date moved backwards, or closed, in ${retrogressions.length} of ${final.length} months on record.</p>
  <ul class="move-list">${retrogressions.slice(0, 12).map(({ point, before, movement }) => html`<li>
    <a href="${urls.bulletin(point.period)}">${formatPeriod(point.period)}</a> ${movementChip(movement)}
    <span class="move-detail">${formatCutoff(before.value)} → ${formatCutoff(point.value)}</span></li>`)}</ul>
  ${retrogressions.length > 12 ? html`<p class="muted">Showing the 12 most recent.</p>` : ''}`
    : html`<p class="muted">No backwards movement in the months on record.</p>`}
</section>

<section class="table-block">
  <h2>Month-by-month history</h2>
  <div class="table-scroll table-tall" tabindex="0" role="region" aria-label="${name} history">
    <table class="cutoff-table history-table">
      <thead><tr><th scope="col">Bulletin</th><th scope="col">Final Action Date</th><th scope="col">Date for Filing</th><th scope="col">Status</th></tr></thead>
      <tbody>${periodsDescending.map((period) => {
        const finalPoint = finalByPeriod.get(period)
        const filingPoint = filingByPeriod.get(period)
        const movement = describeChange(finalPoint?.value, finalByPeriod.get(shiftPeriod(period, -1))?.value)
        return html`<tr>
          <th scope="row"><a href="${urls.bulletin(period)}">${formatPeriod(period)}</a></th>
          <td>${finalPoint ? html`${cutoffValue(finalPoint.value)}${movementChip(movement)}` : html`<span class="muted">–</span>`}</td>
          <td>${filingPoint ? cutoffValue(filingPoint.value) : html`<span class="muted">–</span>`}</td>
          <td><span class="tag ${(finalPoint ?? filingPoint)?.verified ? 'tag-verified' : 'tag-unverified'}">${(finalPoint ?? filingPoint)?.verified ? 'verified' : 'unverified'}</span></td>
        </tr>`
      })}</tbody>
    </table>
  </div>
</section>

<nav class="related" aria-label="Related pages">
  <h2>Related</h2>
  <p>${line.code} in other areas: ${AREAS.filter((other) => other.key !== area.key).map((other) => html`<a href="${urls.lineArea(line, other)}">${other.name}</a> `)}</p>
  <p>Other categories for ${area.name}: ${linesInGroup(line.group).filter((other) => other.key !== line.key).map((other) => html`<a href="${urls.lineArea(other, area)}">${other.code}</a> `)}</p>
</nav>`

  const now = finalByPeriod.get(latest)
  return layout({
    site, path: urls.lineArea(line, area), nav: 'lines', body,
    title: `${name} priority date: current cut-off and history`,
    description: `${name} Final Action Date is ${now ? formatCutoff(now.value) : 'not available'} in the ${formatPeriod(latest)} Visa Bulletin. See movement, every retrogression and month-by-month history since 2002.`,
  })
}

/** Shape the latest bulletin for the planner island (five areas, site lines). @param {Common} options */
export function plannerPage({ site, dataset }) {
  const latest = /** @type {string} */ (dataset.latestPeriod)
  const view = dataset.get(latest)
  if (!view) throw new Error('No bulletin for the planner')
  /** @type {Record<string, Record<string, any>>} */
  const categories = { familySponsored: {}, employmentBased: {} }
  for (const line of LINES) {
    /** @type {Record<string, any>} */
    const entry = { name: line.name, finalActionDates: {}, datesForFiling: {} }
    for (const chart of CHARTS) for (const area of AREAS) {
      const cutoff = getCutoff(view, line.key, chart.key, area.key)
      if (cutoff) entry[chart.key][area.key] = cutoff.value
    }
    if (Object.keys(entry.finalActionDates).length) categories[line.group][line.key] = entry
  }
  const plannerBulletin = {
    bulletin: { month: view.bulletin.month, year: view.bulletin.year },
    countryColumns: Object.fromEntries(AREAS.map((area) => [area.key, area.longName])),
    categories,
  }
  const body = html`
<section class="hero">
  <p class="kicker">Planner</p>
  <h1>Green card process planner</h1>
  <p class="lede">Answer a few questions about your case to see where you stand against the ${formatPeriod(latest)} bulletin and what usually comes next. It applies fixed rules to what you enter; it does not predict timing and it is not legal advice.</p>
  ${sourceLine(view)}
</section>
<div id="planner-root"><noscript><p class="muted">The planner needs JavaScript. Everything else on this site works without it.</p></noscript></div>
<script type="application/json" id="planner-bulletin">${jsonForScript(plannerBulletin)}</script>`
  return layout({
    site, path: urls.planner, nav: 'planner', body,
    title: 'Green card process planner',
    description: 'A rule-based planner that checks your priority date against the latest Visa Bulletin and shows the usual next step. Not legal advice.',
    head: html`${site.assets.plannerCss ? html`<link rel="stylesheet" href="${site.assets.plannerCss}">` : ''}<script src="${site.assets.plannerJs}" defer></script>`,
  })
}

/** @param {Common} options */
export function staticPages({ site, dataset }) {
  const coverage = `${dataset.verifiedPeriods.length} of ${dataset.periods.length}`
  /** @param {string} path @param {string} title @param {string} description @param {import('./html.js').SafeHtml} content @param {string} [nav] */
  const page = (path, title, description, content, nav) => ({
    path,
    document: layout({ site, path, nav, title, description, body: html`<article class="prose"><h1>${title}</h1>${content}</article>` }),
  })
  return [
    page(urls.about, 'About VisaPulse', 'What VisaPulse is, who it is for, and what it will never do.', html`
<p>Every month the U.S. Department of State publishes the Visa Bulletin: the cut-off dates that decide who can move forward with a green card. The official page is a wall of tables in a format that has barely changed in twenty years.</p>
<p>VisaPulse puts the same numbers in a form you can read on a phone, shows how each line moved, and keeps every month since 2002 one click away. It is built for applicants waiting in line, the employers who sponsor them, and the attorneys and paralegals who look these dates up every week.</p>
<h2>What we promise</h2>
<ul>
  <li><strong>Every number traces to the official bulletin.</strong> Verified months show the official page and the exact archived copy we read.</li>
  <li><strong>No invented data.</strong> If we cannot verify a month, we say so, or we do not show it.</li>
  <li><strong>No predictions dressed up as facts.</strong> We show what happened. Nobody outside the State Department knows next month's dates.</li>
  <li><strong>No legal advice, no sign-up, no tracking cookies.</strong></li>
</ul>
<p>VisaPulse is independent and is not affiliated with any government agency or law firm. Read <a href="${urls.methodology}">how the data is sourced and checked</a>.</p>`, 'about'),
    page(urls.methodology, 'Sources and method', 'Where VisaPulse data comes from, how it is verified, and its limits.', html`
<h2>Source</h2>
<p>The only source for cut-off dates is the monthly <a href="${OFFICIAL_LINKS.bulletinIndex}" rel="noopener">Visa Bulletin</a> published by the U.S. Department of State, Bureau of Consular Affairs. As a work of the U.S. government it is in the public domain.</p>
<p>The State Department website does not allow automated requests, and we do not work around that. We read each bulletin from a copy of the official page held by the <a href="https://web.archive.org/" rel="noopener">Internet Archive</a>, or from a copy a person saved in their browser. For every verified month we record the official address, the archive snapshot, and a SHA-256 fingerprint of the exact file we parsed, so anyone can repeat the check.</p>
<h2>Verification status</h2>
<p><strong>${coverage} months on this site are verified</strong> this way. The others come from an older third-party compilation and are marked <span class="tag tag-unverified">unverified</span> wherever they appear; they are being replaced month by month. ${dataset.withheldPeriods.length} months from that compilation were incomplete or wrong, so we do not show them at all and link to the official page instead.</p>
<h2>How a month is checked</h2>
<ol>
  <li>The parser reads the official tables and stops if it meets any row, column or value it does not recognise. It never fills a gap.</li>
  <li>Automatic checks confirm the month, the required categories, valid dates, and that no cut-off is later than the bulletin itself.</li>
  <li>The result is compared with the older compilation and every difference is listed for review.</li>
</ol>
<h2>Reading rules we apply</h2>
<ul>
  <li>A priority date is current only when it is <em>earlier than</em> the cut-off, which is the bulletin's own wording.</li>
  <li>A bulletin lists only oversubscribed countries separately. For any other country, and for a listed country in a month when it is not listed, the All Chargeability date applies. We mark those cells with †.</li>
  <li>The Dates for Filing chart exists from October 2015. Earlier bulletins have one chart, shown as Final Action Dates.</li>
  <li>EB-5 changed shape twice. The "EB-5 Unreserved" history follows the non-regional-center line before May 2022 and the single fifth-preference line before October 2015.</li>
  <li>Movement is the difference in days between two published cut-offs. It describes the past and is not a forecast.</li>
</ul>
<h2>Limits</h2>
<p>We do not yet show which chart USCIS accepts each month, processing times, or anything about an individual case. A mistake is always possible: if a number here differs from the official bulletin, the official bulletin is right.</p>`),
    page(urls.disclaimer, 'Disclaimer', 'VisaPulse is general information, not legal advice.', html`
<p>VisaPulse provides general information about published U.S. Visa Bulletin cut-off dates. It is <strong>not legal advice</strong> and does not create an attorney-client relationship.</p>
<p>Immigration outcomes depend on the facts of each case. Cut-off dates can advance, stall or retrogress without notice, and being current does not guarantee approval or a timeline. The planner applies fixed rules to what you type and cannot account for your full circumstances.</p>
<p>Before you file, travel, change jobs or make any decision, confirm the dates on the <a href="${OFFICIAL_LINKS.bulletinIndex}" rel="noopener">official Visa Bulletin</a>, check <a href="${OFFICIAL_LINKS.uscisCharts}" rel="noopener">which chart USCIS accepts</a>, and consult a licensed immigration attorney or accredited representative.</p>
<p>VisaPulse is not affiliated with, endorsed by, or connected to the U.S. Department of State, U.S. Citizenship and Immigration Services, or any government agency. The site is provided as is, without warranties of any kind.</p>`),
    page(urls.privacy, 'Privacy', 'VisaPulse collects no personal data by default: no accounts, no cookies, no trackers.', html`
<p>VisaPulse is a static website. There are no accounts and no cookies, and we load no third-party scripts, fonts or trackers.</p>
<ul>
  <li><strong>Planner:</strong> everything you enter stays in your browser. It is never sent to us.</li>
  <li><strong>Theme:</strong> your light or dark choice is saved in your browser's local storage.</li>
  <li><strong>Feedback${site.feedbackEndpoint ? '' : ' (currently switched off)'}:</strong> if you send feedback, your message and the email address you choose to give are delivered to the site owner through a form service, and used only to read and answer it.</li>
  <li><strong>Hosting:</strong> like any website, the hosting provider keeps short-lived technical logs (such as IP address and requested page) to operate and protect the service.</li>
</ul>
<p>If this changes, for example if email alerts are added, this page will say so before anything is collected.</p>`),
    page(urls.data, 'Open data', 'Download VisaPulse cut-off data as JSON or CSV.', html`
<p>The cut-off dates are U.S. government data in the public domain. Our structured copies are free to use; a link back is appreciated.</p>
<ul>
  <li><a href="/data/latest.json">latest.json</a>: the newest bulletin.</li>
  <li><code>/data/bulletins/YYYY-MM.json</code>: one file per month, for example <a href="/data/bulletins/${dataset.latestPeriod}.json">${dataset.latestPeriod}.json</a>.</li>
  <li><a href="/data/cutoffs.csv">cutoffs.csv</a>: every cut-off in one table (period, verified, group, category, chart, area, value).</li>
</ul>
<p>Each record says whether it is verified and, if so, carries the official address, archive snapshot and file fingerprint. Unverified records come from a third-party compilation; treat them with care. See <a href="${urls.methodology}">sources and method</a>.</p>`),
  ]
}

/** @param {{ site: SiteContext }} options */
export function notFoundPage({ site }) {
  return layout({
    site, path: '/404.html', noindex: true,
    title: 'Page not found',
    description: 'That page does not exist.',
    body: html`<article class="prose"><h1>Page not found</h1><p>That address does not exist. Try the <a href="${urls.home}">latest bulletin</a>, the <a href="${urls.archive}">archive</a>, or <a href="${urls.lines}">find your category</a>.</p></article>`,
  })
}
