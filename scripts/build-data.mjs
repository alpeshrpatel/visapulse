// @ts-check
/**
 * Parse cached official pages into verified records.
 *
 *   node scripts/build-data.mjs                # every period in the manifest
 *   node scripts/build-data.mjs 2026-07        # one period
 *   node scripts/build-data.mjs 2026-07 --force   # allow replacing a record whose content changed
 *
 * A record is written only when the cached bytes match the manifest hash, the
 * parser recognises everything on the page, and the validator passes. Periods
 * that fail are reported and left untouched; the exit code is non-zero if any failed.
 */
import { createHash } from 'node:crypto'
import { existsSync } from 'node:fs'
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import { PARSER_VERSION, parseBulletin } from '../src/lib/parseBulletin.js'
import { isPeriod } from '../src/lib/period.js'
import { validateBulletin } from '../src/lib/validateBulletin.js'

const ROOT = join(import.meta.dirname, '..')
const CACHE_DIR = join(ROOT, '.cache', 'official')
const OUT_DIR = join(ROOT, 'data', 'bulletins')
const MANIFEST_PATH = join(ROOT, 'data', 'sources', 'manifest.json')

const args = process.argv.slice(2)
const force = args.includes('--force')
const requested = args.filter((arg) => !arg.startsWith('--'))
if (requested.some((arg) => !isPeriod(arg))) {
  console.error('Usage: node scripts/build-data.mjs [YYYY-MM ...] [--force]')
  process.exit(2)
}

/** @type {Record<string, any>} */
const manifest = existsSync(MANIFEST_PATH) ? JSON.parse(await readFile(MANIFEST_PATH, 'utf8')) : {}
const periods = (requested.length ? requested : Object.keys(manifest)).sort()

const summary = { written: 0, unchanged: 0, skipped: 0 }
/** @type {string[]} */
const failures = []
/** @type {string[]} */
const warnings = []

for (const period of periods) {
  const entry = manifest[period]
  const manualPath = join(ROOT, 'data', 'sources', 'manual', `${period}.html`)
  const cachePath = entry?.retrievedVia === 'manual-file' ? manualPath : join(CACHE_DIR, `${period}.html`)
  if (!entry) { failures.push(`${period}: not in data/sources/manifest.json (run fetch-archive first)`); continue }
  if (!existsSync(cachePath)) { summary.skipped += 1; continue }

  const bytes = await readFile(cachePath)
  const sha256 = createHash('sha256').update(bytes).digest('hex')
  if (sha256 !== entry.sha256) { failures.push(`${period}: cached page does not match the manifest hash`); continue }

  let parsed
  try {
    parsed = parseBulletin(bytes.toString('utf8'), period)
  } catch (error) {
    failures.push(error instanceof Error ? error.message : String(error))
    continue
  }
  warnings.push(...parsed.warnings.map((warning) => `${period}: ${warning}`))

  const { schemaVersion, period: recordPeriod, bulletin, areas, categories } = parsed.record
  const record = {
    schemaVersion,
    period: recordPeriod,
    bulletin,
    source: {
      publisher: 'U.S. Department of State, Bureau of Consular Affairs',
      officialUrl: entry.officialUrl,
      retrievedVia: entry.retrievedVia ?? 'web.archive.org',
      ...(entry.snapshotUrl ? { snapshotUrl: entry.snapshotUrl, snapshotTimestamp: entry.snapshotTimestamp } : {}),
      sha256,
      parserVersion: PARSER_VERSION,
    },
    areas,
    categories,
  }
  const errors = validateBulletin(record, { expectedPeriod: period, expectedSha256: entry.sha256 })
  if (errors.length) { failures.push(...errors.map((error) => `${period}: ${error}`)); continue }

  const outPath = join(OUT_DIR, period.slice(0, 4), `${period}.json`)
  const json = `${JSON.stringify(record, null, 2)}\n`
  if (existsSync(outPath)) {
    const existing = await readFile(outPath, 'utf8')
    if (existing === json) { summary.unchanged += 1; continue }
    if (!force) { failures.push(`${period}: record would change; re-run with --force after reviewing the diff`); continue }
  }
  await mkdir(join(OUT_DIR, period.slice(0, 4)), { recursive: true })
  await writeFile(outPath, json)
  summary.written += 1
}

console.log(`Records: ${summary.written} written, ${summary.unchanged} unchanged, ${summary.skipped} without a cached page.`)
if (warnings.length) console.log(`\nWarnings (${warnings.length}):\n  ${warnings.join('\n  ')}`)
if (failures.length) {
  console.error(`\nNot verified (${failures.length}) — these periods were left untouched:\n  ${failures.join('\n  ')}`)
  process.exit(1)
}
