// @ts-check
/**
 * Fetch official Visa Bulletin pages (U.S. Department of State, travel.state.gov)
 * from the Internet Archive Wayback Machine and cache the unmodified HTML.
 *
 * Why the Wayback Machine: travel.state.gov answers scripted clients with HTTP 403
 * (bot protection). We do not work around that. The Internet Archive permits
 * programmatic retrieval and serves the original bytes (`id_` mode), so every
 * number we publish still traces to the official page, plus an immutable
 * snapshot URL and a SHA-256 of the exact bytes we parsed.
 *
 * Usage:
 *   node scripts/fetch-archive.mjs --all           # every month 2002-01 → latest known (explicit on purpose)
 *   node scripts/fetch-archive.mjs 2026-07         # one month
 *   node scripts/fetch-archive.mjs 2024-01 2024-12 # inclusive range
 *   node scripts/fetch-archive.mjs 2026-07 --refresh   # re-resolve the snapshot
 *
 * Output:
 *   .cache/official/YYYY-MM.html      raw page bytes (git-ignored)
 *   data/sources/manifest.json        period → { officialUrl, snapshotTimestamp, snapshotUrl, sha256, bytes }
 */
import { createHash } from 'node:crypto'
import { existsSync } from 'node:fs'
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import { officialBulletinUrl, officialUrlCandidates } from '../src/lib/officialUrl.js'
import { comparePeriods, isPeriod, periodRange } from '../src/lib/period.js'

const ROOT = join(import.meta.dirname, '..')
const CACHE_DIR = join(ROOT, '.cache', 'official')
const MANIFEST_PATH = join(ROOT, 'data', 'sources', 'manifest.json')
const MANUAL_DIR = join(ROOT, 'data', 'sources', 'manual')
const USER_AGENT = 'visapulse-data-pipeline/1.0 (static site build; archived public-domain pages only)'
const REQUEST_GAP_MS = 1200

const sleep = (/** @type {number} */ ms) => new Promise((resolve) => setTimeout(resolve, ms))

/**
 * @param {string} url
 * @param {{ binary?: boolean }} [options]
 */
async function politeFetch(url, options = {}) {
  for (let attempt = 1; attempt <= 5; attempt += 1) {
    await sleep(REQUEST_GAP_MS)
    let response
    try {
      response = await fetch(url, { headers: { 'User-Agent': USER_AGENT }, redirect: 'follow' })
    } catch (error) {
      if (attempt === 5) throw error
      await sleep(4000 * attempt)
      continue
    }
    if (response.ok) {
      return options.binary ? Buffer.from(await response.arrayBuffer()) : await response.text()
    }
    if (response.status === 404) return null
    if (attempt === 5) throw new Error(`HTTP ${response.status} for ${url}`)
    await sleep(response.status === 429 ? 20000 * attempt : 4000 * attempt)
  }
  return null
}

/**
 * Newest HTTP-200 captures of an exact URL, newest first.
 * @param {string} officialUrl
 * @returns {Promise<string[]>} Wayback timestamps (YYYYMMDDhhmmss)
 */
async function listSnapshots(officialUrl) {
  const query = new URLSearchParams({
    url: officialUrl,
    output: 'json',
    fl: 'timestamp,length',
    filter: 'statuscode:200',
    limit: '-8',
  })
  const body = /** @type {string | null} */ (await politeFetch(`https://web.archive.org/cdx/search/cdx?${query}`))
  if (!body || !body.trim()) return []
  /** @type {string[][]} */
  const rows = JSON.parse(body)
  return rows
    .slice(1)
    // Tiny captures are error or interstitial pages, never a bulletin.
    .filter(([, length]) => Number(length) > 4000)
    .map(([timestamp]) => timestamp)
    .sort()
    .reverse()
}

/** @param {Buffer} html */
function looksLikeBulletin(html) {
  const text = html.toString('utf8')
  return /<table/i.test(text) && /chargeability/i.test(text)
}

async function loadManifest() {
  if (!existsSync(MANIFEST_PATH)) return {}
  return JSON.parse(await readFile(MANIFEST_PATH, 'utf8'))
}

/** @param {Record<string, unknown>} manifest */
async function saveManifest(manifest) {
  const sorted = Object.fromEntries(Object.entries(manifest).sort(([a], [b]) => comparePeriods(a, b)))
  await mkdir(join(ROOT, 'data', 'sources'), { recursive: true })
  await writeFile(MANIFEST_PATH, `${JSON.stringify(sorted, null, 2)}\n`)
}

/**
 * @param {string} period
 * @param {Record<string, any>} manifest
 * @param {boolean} refresh
 */
async function fetchPeriod(period, manifest, refresh) {
  const cachePath = join(CACHE_DIR, `${period}.html`)
  const known = manifest[period]
  if (known?.retrievedVia === 'manual-file' && !refresh) return 'cached'
  if (known && !refresh && existsSync(cachePath)) {
    const sha256 = createHash('sha256').update(await readFile(cachePath)).digest('hex')
    if (sha256 === known.sha256) return 'cached'
  }

  // A pinned manifest entry is re-downloaded byte-for-byte rather than re-resolved.
  const candidates = known && !refresh
    ? [{ officialUrl: known.officialUrl, timestamps: [known.snapshotTimestamp] }]
    : []
  if (!candidates.length) {
    for (const officialUrl of officialUrlCandidates(period)) {
      const timestamps = await listSnapshots(officialUrl)
      if (timestamps.length) candidates.push({ officialUrl, timestamps })
    }
  }

  for (const { officialUrl, timestamps } of candidates) {
    for (const timestamp of timestamps) {
      const snapshotUrl = `https://web.archive.org/web/${timestamp}/${officialUrl}`
      const rawUrl = `https://web.archive.org/web/${timestamp}id_/${officialUrl}`
      const html = /** @type {Buffer | null} */ (await politeFetch(rawUrl, { binary: true }))
      if (!html || !looksLikeBulletin(html)) continue
      const sha256 = createHash('sha256').update(html).digest('hex')
      if (known && !refresh && known.sha256 !== sha256) {
        throw new Error(`${period}: snapshot bytes changed (expected ${known.sha256}, got ${sha256})`)
      }
      await mkdir(CACHE_DIR, { recursive: true })
      await writeFile(cachePath, html)
      manifest[period] = {
        officialUrl,
        retrievedVia: 'web.archive.org',
        snapshotTimestamp: timestamp,
        snapshotUrl,
        sha256,
        bytes: html.length,
      }
      return 'downloaded'
    }
  }
  return 'missing'
}

const args = process.argv.slice(2)
const refresh = args.includes('--refresh')
const fileIndex = args.indexOf('--file')
const manualFile = fileIndex >= 0 ? args[fileIndex + 1] : null
const all = args.includes('--all')
const periodArgs = args.filter((arg, index) => !arg.startsWith('--') && (fileIndex < 0 || index !== fileIndex + 1))
// A full-range run must be asked for explicitly; a bare invocation never downloads everything.
if (periodArgs.some((arg) => !isPeriod(arg)) || (fileIndex >= 0 && (!manualFile || periodArgs.length !== 1))
  || (!periodArgs.length && !all) || (periodArgs.length && all) || periodArgs.length > 2) {
  console.error('Usage: node scripts/fetch-archive.mjs YYYY-MM [YYYY-MM] [--refresh]\n       node scripts/fetch-archive.mjs --all            (every month since 2002-01; about 20 minutes)\n       node scripts/fetch-archive.mjs YYYY-MM --file <official page saved from a browser>')
  process.exit(2)
}

if (manualFile) {
  // Manual path: a person saved the official page from their browser. The exact
  // bytes are kept in the repository because no archive snapshot backs them.
  const [period] = periodArgs
  const html = await readFile(manualFile)
  if (!looksLikeBulletin(html)) {
    console.error(`${manualFile} does not look like a Visa Bulletin page (no cut-off tables found).`)
    process.exit(1)
  }
  await mkdir(MANUAL_DIR, { recursive: true })
  await writeFile(join(MANUAL_DIR, `${period}.html`), html)
  const manifest = await loadManifest()
  manifest[period] = {
    officialUrl: officialBulletinUrl(period),
    retrievedVia: 'manual-file',
    sha256: createHash('sha256').update(html).digest('hex'),
    bytes: html.length,
  }
  await saveManifest(manifest)
  console.log(`${period} ← ${manualFile} (stored in data/sources/manual/)`)
  process.exit(0)
}
const now = new Date()
// A bulletin is published the month before it takes effect, so look one month ahead.
const lastPeriod = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 1)).toISOString().slice(0, 7)
const periods = periodRange(periodArgs[0] ?? '2002-01', periodArgs[1] ?? periodArgs[0] ?? lastPeriod)

const manifest = await loadManifest()
const counts = { cached: 0, downloaded: 0, missing: 0 }
const missing = []
for (const period of periods) {
  const result = await fetchPeriod(period, manifest, refresh)
  counts[result] += 1
  if (result === 'missing') missing.push(period)
  if (result === 'downloaded') {
    console.log(`${period} ← ${manifest[period].snapshotUrl}`)
    await saveManifest(manifest)
  }
}
await saveManifest(manifest)
console.log(`Done: ${counts.downloaded} downloaded, ${counts.cached} cached, ${counts.missing} not archived.`)
if (missing.length) console.log(`Not archived yet: ${missing.join(' ')}`)
