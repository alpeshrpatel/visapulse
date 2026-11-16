// @ts-check
/**
 * Build the static site into dist/.
 *   node scripts/build-site.mjs
 * Environment (public values only): SITE_URL (or Netlify's URL), FEEDBACK_ENDPOINT.
 */
import { cpSync, existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { gzipSync } from 'node:zlib'
import { build } from 'esbuild'
import { loadDataset } from '../src/lib/dataset.js'
import { AREAS, LINES } from '../src/lib/labels.js'
import { formatPeriod } from '../src/lib/period.js'
import { urls } from '../src/site/format.js'
import { escapeHtml } from '../src/site/html.js'
import {
  archivePage, bulletinPage, checkPage, lineAreaPage, linePage, linesIndexPage, notFoundPage, plannerPage, staticPages,
} from '../src/site/pages.js'

const ROOT = join(import.meta.dirname, '..')
const OUT = join(ROOT, 'dist')
const started = Date.now()

/** A public https address, or null. Canonicals and the sitemap are omitted without one. @param {string | undefined} value */
function publicUrl(value) {
  if (!value) return null
  try {
    const url = new URL(value)
    return url.protocol === 'https:' || url.hostname === 'localhost' ? url.origin : null
  } catch {
    return null
  }
}
const siteUrl = publicUrl(process.env.SITE_URL) ?? publicUrl(process.env.URL)
const feedbackEndpoint = publicUrl(process.env.FEEDBACK_ENDPOINT) ? /** @type {string} */ (process.env.FEEDBACK_ENDPOINT) : null

rmSync(OUT, { recursive: true, force: true })
mkdirSync(OUT, { recursive: true })
if (existsSync(join(ROOT, 'public'))) cpSync(join(ROOT, 'public'), OUT, { recursive: true })

// 1. Assets (content-hashed)
const bundle = await build({
  absWorkingDir: ROOT,
  entryPoints: {
    site: 'src/client/site.js',
    planner: 'src/client/planner.jsx',
    check: 'src/client/check.js',
    styles: 'src/site/site.css',
    'planner-styles': 'src/client/planner.css',
  },
  outdir: 'dist/assets',
  entryNames: '[name]-[hash]',
  bundle: true,
  minify: true,
  format: 'iife',
  target: ['es2020'],
  jsx: 'automatic',
  define: { 'process.env.NODE_ENV': '"production"' },
  metafile: true,
  logLevel: 'warning',
})
/** @type {Record<string, string>} */
const assetByEntry = {}
for (const [file, output] of Object.entries(bundle.metafile.outputs)) {
  if (output.entryPoint) assetByEntry[output.entryPoint] = `/${file.replace(/^dist\//, '')}`
}
const site = {
  siteUrl,
  feedbackEndpoint,
  hasFeed: Boolean(siteUrl),
  buildDate: new Date().toISOString().slice(0, 10),
  assets: {
    css: assetByEntry['src/site/site.css'],
    js: assetByEntry['src/client/site.js'],
    plannerJs: assetByEntry['src/client/planner.jsx'],
    plannerCss: assetByEntry['src/client/planner.css'],
    checkJs: assetByEntry['src/client/check.js'],
  },
}

// 2. Pages
const dataset = loadDataset({ officialDir: join(ROOT, 'data', 'bulletins'), legacyDir: join(ROOT, 'data', 'visa-bulletins') })
const latest = dataset.latestPeriod
if (!latest) throw new Error('No bulletin data found')
/** @type {{ path: string, document: { toString(): string } }[]} */
const pages = [
  { path: urls.home, document: bulletinPage({ site, dataset, period: latest, isHome: true }) },
  { path: urls.archive, document: archivePage({ site, dataset }) },
  { path: urls.lines, document: linesIndexPage({ site, dataset }) },
  { path: urls.planner, document: plannerPage({ site, dataset }) },
  { path: urls.check, document: checkPage({ site, dataset }) },
  { path: '/404.html', document: notFoundPage({ site }) },
  ...staticPages({ site, dataset }),
  ...dataset.periods.map((period) => ({ path: urls.bulletin(period), document: bulletinPage({ site, dataset, period }) })),
  ...LINES.map((line) => ({ path: urls.line(line), document: linePage({ site, dataset, line }) })),
  ...LINES.flatMap((line) => AREAS.map((area) => ({ path: urls.lineArea(line, area), document: lineAreaPage({ site, dataset, line, area }) }))),
]
/** @param {string} path @param {string} content */
const write = (path, content) => {
  const file = join(OUT, path.endsWith('/') ? `${path}index.html` : path)
  mkdirSync(dirname(file), { recursive: true })
  writeFileSync(file, content)
}
for (const page of pages) write(page.path, String(page.document))

// 3. Open data
write('/data/latest.json', `${JSON.stringify(dataset.get(latest))}\n`)
const csv = ['period,verified,group,category,chart,area,value']
for (const period of dataset.periods) {
  const view = dataset.get(period)
  if (!view) continue
  write(`/data/bulletins/${period}.json`, `${JSON.stringify(view)}\n`)
  for (const [group, categories] of Object.entries(view.categories)) {
    for (const [category, item] of Object.entries(categories)) {
      for (const chart of /** @type {const} */ (['finalActionDates', 'datesForFiling'])) {
        for (const [area, value] of Object.entries(item[chart] ?? {})) {
          csv.push([period, view.verified, group, category, chart, area, value].join(','))
        }
      }
    }
  }
}
write('/data/cutoffs.csv', `${csv.join('\n')}\n`)

// 4. Crawlers and feed (absolute URLs need a known site address)
const indexable = pages.filter((page) => page.path !== '/404.html')
write('/robots.txt', `User-agent: *\nAllow: /\n${siteUrl ? `Sitemap: ${siteUrl}/sitemap.xml\n` : ''}`)
if (siteUrl) {
  write('/sitemap.xml', `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${
    indexable.map((page) => `<url><loc>${escapeHtml(siteUrl + page.path)}</loc></url>`).join('\n')}\n</urlset>\n`)
  const entries = [...dataset.periods].reverse().slice(0, 24).map((period) => {
    const link = siteUrl + urls.bulletin(period)
    return `<entry><title>Visa Bulletin for ${escapeHtml(formatPeriod(period))}</title><link href="${escapeHtml(link)}"/><id>${escapeHtml(link)}</id>`
      + `<updated>${period}-01T00:00:00Z</updated><summary>Cut-off dates effective ${escapeHtml(formatPeriod(period))}, with movement since the previous month.</summary></entry>`
  })
  write('/feed.xml', `<?xml version="1.0" encoding="utf-8"?>\n<feed xmlns="http://www.w3.org/2005/Atom"><title>VisaPulse: Visa Bulletins</title>`
    + `<link href="${escapeHtml(siteUrl)}/"/><link rel="self" href="${escapeHtml(siteUrl)}/feed.xml"/><id>${escapeHtml(siteUrl)}/</id>`
    + `<updated>${latest}-01T00:00:00Z</updated><author><name>VisaPulse</name></author>\n${entries.join('\n')}\n</feed>\n`)
}

// 5. Report
const gz = (/** @type {string} */ file) => (gzipSync(readFileSync(join(OUT, file))).length / 1024).toFixed(1)
console.log(`Built ${pages.length} pages in ${Date.now() - started} ms → dist/`)
console.log(`  data: ${dataset.periods.length} months (${dataset.verifiedPeriods.length} verified, ${dataset.withheldPeriods.length} withheld); latest ${latest}`)
console.log(`  gzip: home ${gz('index.html')} kB · css ${gz(site.assets.css)} kB · site js ${gz(site.assets.js)} kB · planner js ${gz(site.assets.plannerJs)} kB`)
console.log(`  site URL: ${siteUrl ?? 'not set (no canonical, sitemap or feed)'} · feedback: ${feedbackEndpoint ? 'on' : 'off'}`)
