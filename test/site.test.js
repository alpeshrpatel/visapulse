import assert from 'node:assert/strict'
import { join } from 'node:path'
import test from 'node:test'
import { loadDataset } from '../src/lib/dataset.js'
import { AREAS, LINES } from '../src/lib/labels.js'
import { renderCutoffChart } from '../src/site/chart.js'
import { summariseMovement } from '../src/site/components.js'
import { formatCutoff, periodFromSlug, periodSlug, urls } from '../src/site/format.js'
import { html, jsonForScript, raw } from '../src/site/html.js'
import { archivePage, bulletinPage, checkPage, lineAreaPage, plannerPage, staticPages } from '../src/site/pages.js'

const root = join(import.meta.dirname, '..', 'data')
const dataset = loadDataset({ officialDir: join(root, 'bulletins'), legacyDir: join(root, 'visa-bulletins') })
const site = { siteUrl: null, feedbackEndpoint: null, hasFeed: false, buildDate: '2026-11-16', assets: { css: '/a.css', js: '/a.js', plannerJs: '/p.js', plannerCss: '/p.css' } }
const liveSite = { ...site, siteUrl: 'https://example.org', feedbackEndpoint: 'https://forms.example.org/f/1', hasFeed: true }

test('html escapes interpolated values unless marked safe', () => {
  const hostile = '<img src=x onerror=alert(1)>&"\''
  assert.equal(String(html`<p title="${hostile}">${hostile}</p>`),
    '<p title="&lt;img src=x onerror=alert(1)&gt;&amp;&quot;&#39;">&lt;img src=x onerror=alert(1)&gt;&amp;&quot;&#39;</p>')
  assert.equal(String(html`${[html`<b>a</b>`, 'b<', null, false, 0]}`), '<b>a</b>b&lt;0')
  assert.equal(String(html`${raw('<i>ok</i>')}`), '<i>ok</i>')
  assert.equal(String(jsonForScript({ a: '</script><script>' })), '{"a":"\\u003c/script>\\u003cscript>"}')
})

test('period slugs and cut-off formatting', () => {
  assert.equal(periodSlug('2026-11'), 'november-2026')
  assert.equal(periodFromSlug('november-2026'), '2026-11')
  assert.equal(periodFromSlug('smarch-2026'), null)
  assert.equal(formatCutoff('2013-01-01'), 'Jan 1, 2013')
  assert.equal(formatCutoff('Current'), 'Current')
  assert.equal(urls.bulletin('2025-06'), '/visa-bulletin/june-2025/')
})

test('chart draws lines, breaks on gaps and labels points', () => {
  const svg = String(renderCutoffChart({
    title: 'Test <chart>',
    series: [{ name: 'Final', color: 1, points: [
      { period: '2025-01', value: '2012-01-01' }, { period: '2025-02', value: '2012-02-01' },
      { period: '2025-04', value: '2012-03-01' }, { period: '2025-05', value: 'Current' }, { period: '2025-06', value: 'Unavailable' },
    ] }],
  }))
  assert.match(svg, /^<svg class="cutoff-chart"[^>]* role="img"/)
  assert.ok(svg.includes('Test &lt;chart&gt;'))
  assert.equal((svg.match(/d="M[^"]*"/)?.[0].match(/M/g) ?? []).length, 2, 'a missing month starts a new segment')
  assert.ok(svg.includes('Final, May 2025: Current') && svg.includes('Final, June 2025: Unavailable'))
  assert.match(String(renderCutoffChart({ title: 't', series: [{ name: 'x', color: 1, points: [] }] })), /Not enough history/)
})

test('verified bulletin page shows its provenance; unverified page says so', () => {
  const verified = String(bulletinPage({ site, dataset, period: '2025-06' }))
  assert.ok(verified.includes('<h1>Visa Bulletin for June 2025</h1>'))
  assert.ok(verified.includes('Verified against the official page'))
  assert.ok(verified.includes('web.archive.org/web/'))
  assert.ok(verified.includes('visa-bulletin/2025/visa-bulletin-for-june-2025.html'))
  assert.ok(verified.includes('Apr 22, 2005'), 'F1 Mexico Final Action Date')
  assert.ok(verified.includes('Not legal advice'))
  assert.ok(!verified.includes('rel="canonical"'), 'no canonical without a site URL')
  const unverifiedPeriod = dataset.periods.find((period) => !dataset.get(period).verified)
  if (unverifiedPeriod) {
    assert.ok(String(bulletinPage({ site, dataset, period: unverifiedPeriod })).includes('not yet been checked'))
  }
})

test('pre-2015 bulletin shows one chart and marks unlisted areas', () => {
  const page = String(bulletinPage({ site, dataset, period: '2003-06' }))
  assert.ok(page.includes('single chart'))
  assert.ok(!page.includes('data-chart-switch'))
  assert.ok(page.includes('Not listed separately in this bulletin'))
})

test('site URL turns on canonical links; feedback form appears only with an endpoint', () => {
  const page = String(bulletinPage({ site: liveSite, dataset, period: dataset.latestPeriod, isHome: true }))
  assert.ok(page.includes('<link rel="canonical" href="https://example.org/">'))
  assert.ok(page.includes('data-endpoint="https://forms.example.org/f/1"'))
  assert.ok(page.includes('application/ld+json'))
  assert.ok(!String(bulletinPage({ site, dataset, period: dataset.latestPeriod, isHome: true })).includes('data-feedback'))
})

test('category and area page, planner, archive and static pages render', () => {
  const line = LINES.find((item) => item.key === 'EB2')
  const area = AREAS.find((item) => item.key === 'india')
  const page = String(lineAreaPage({ site, dataset, line, area }))
  assert.ok(page.includes('<h1>EB-2 India priority date</h1>'))
  assert.ok(page.includes('<svg class="cutoff-chart"') && page.includes('Month-by-month history'))
  assert.ok(page.includes('not a forecast'))
  const planner = String(plannerPage({ site, dataset }))
  assert.ok(planner.includes('id="planner-root"') && planner.includes('"countryColumns"'))
  assert.ok(String(archivePage({ site, dataset })).includes('Fiscal year 2003'))
  const pages = staticPages({ site, dataset })
  assert.deepEqual(pages.map((item) => item.path), ['/about/', '/methodology/', '/disclaimer/', '/privacy/', '/data/'])
  assert.ok(pages.every((item) => String(item.document).includes('Not legal advice')))
})

test('movement summary counts only pairs present in both months', () => {
  const view = dataset.get('2025-06')
  assert.deepEqual(summariseMovement(view, null), { total: 0, advances: [], retrogressions: [], unchanged: 0 })
  const same = summariseMovement(view, view)
  assert.equal(same.total, same.unchanged)
  assert.ok(same.total > 0)
})

test('checker page embeds the latest cut-offs with 12- and 24-month comparisons', () => {
  const page = String(checkPage({ site: { ...site, assets: { ...site.assets, checkJs: '/c.js' } }, dataset }))
  assert.ok(page.includes('<h1>Is my priority date current?</h1>'))
  const data = JSON.parse(page.match(/<script type="application\/json" id="check-data">(.*?)<\/script>/s)[1])
  assert.equal(data.period, dataset.latestPeriod)
  assert.equal(data.lines.length, LINES.length)
  const cell = data.cutoffs.EB2.india.finalActionDates
  assert.equal(cell.now, dataset.series('EB2', 'finalActionDates', 'india').at(-1).value)
  // Comparison months that are withheld or missing are simply absent, never invented.
  for (const key of ['m12', 'm24']) assert.ok(cell[key] === undefined || typeof cell[key] === 'string', key)
  assert.ok(page.includes('nothing you type is sent to us'))
})
