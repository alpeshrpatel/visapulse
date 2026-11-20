// @ts-check
/**
 * The data gate. Fails (exit 1) when:
 *  - any official record breaks the schema or semantic rules,
 *  - a record's hash disagrees with data/sources/manifest.json,
 *  - a legacy file was changed, added or removed (the legacy set is frozen, D21).
 *
 *   node scripts/validate-data.mjs
 *   node scripts/validate-data.mjs --freeze-legacy   # (re)write the legacy freeze list; first run only
 */
import { createHash } from 'node:crypto'
import { existsSync, readdirSync, readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { validateBulletin } from '../src/lib/validateBulletin.js'

const ROOT = join(import.meta.dirname, '..')
const OFFICIAL_DIR = join(ROOT, 'data', 'bulletins')
const LEGACY_DIR = join(ROOT, 'data', 'visa-bulletins')
const MANIFEST_PATH = join(ROOT, 'data', 'sources', 'manifest.json')
const FREEZE_PATH = join(ROOT, 'data', 'sources', 'legacy-freeze.json')

/** @param {string} dir @returns {string[]} relative paths of JSON files, sorted */
function listJson(dir) {
  if (!existsSync(dir)) return []
  return readdirSync(dir).sort().flatMap((year) =>
    /^\d{4}$/.test(year)
      ? readdirSync(join(dir, year)).filter((name) => name.endsWith('.json')).sort().map((name) => `${year}/${name}`)
      : [])
}
const sha256 = (/** @type {string} */ path) => createHash('sha256').update(readFileSync(path)).digest('hex')

/** @type {string[]} */
const errors = []

// 1. Official records
const manifest = existsSync(MANIFEST_PATH) ? JSON.parse(readFileSync(MANIFEST_PATH, 'utf8')) : {}
const officialFiles = listJson(OFFICIAL_DIR)
for (const relative of officialFiles) {
  const period = relative.slice(5, 12)
  let record
  try {
    record = JSON.parse(readFileSync(join(OFFICIAL_DIR, relative), 'utf8'))
  } catch {
    errors.push(`${relative}: not valid JSON`)
    continue
  }
  if (!manifest[period]) errors.push(`${relative}: no manifest entry (provenance missing)`)
  for (const error of validateBulletin(record, { expectedPeriod: period, expectedSha256: manifest[period]?.sha256 })) {
    errors.push(`${relative}: ${error}`)
  }
}

// 2. Legacy freeze
const legacyFiles = listJson(LEGACY_DIR)
const legacyHashes = Object.fromEntries(legacyFiles.map((relative) => [relative, sha256(join(LEGACY_DIR, relative))]))
if (process.argv.includes('--freeze-legacy')) {
  if (existsSync(FREEZE_PATH)) {
    console.error('data/sources/legacy-freeze.json already exists; delete it deliberately if the freeze must be redone.')
    process.exit(2)
  }
  writeFileSync(FREEZE_PATH, `${JSON.stringify(legacyHashes, null, 2)}\n`)
  console.log(`Froze ${legacyFiles.length} legacy files.`)
} else if (!existsSync(FREEZE_PATH)) {
  errors.push('data/sources/legacy-freeze.json is missing (run with --freeze-legacy once)')
} else {
  /** @type {Record<string, string>} */
  const frozen = JSON.parse(readFileSync(FREEZE_PATH, 'utf8'))
  for (const [relative, hash] of Object.entries(frozen)) {
    if (!(relative in legacyHashes)) errors.push(`legacy ${relative}: file was removed`)
    else if (legacyHashes[relative] !== hash) errors.push(`legacy ${relative}: file was altered`)
  }
  for (const relative of legacyFiles) if (!(relative in frozen)) errors.push(`legacy ${relative}: unexpected new file`)
}

if (errors.length) {
  console.error(`Data validation failed (${errors.length}):\n  ${errors.join('\n  ')}`)
  process.exit(1)
}
console.log(`Data valid: ${officialFiles.length} official record(s) verified against the manifest; ${legacyFiles.length} legacy files unchanged.`)
