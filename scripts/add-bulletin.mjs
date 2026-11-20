// @ts-check
/**
 * Add one bulletin end to end: pin the official page, parse, validate, cross-check.
 *   npm run data:add -- 2026-12
 *   npm run data:add -- 2026-12 --file ~/Downloads/visa-bulletin-for-december-2026.html
 */
import { execFileSync } from 'node:child_process'
import { existsSync } from 'node:fs'
import { join } from 'node:path'
import { isPeriod } from '../src/lib/period.js'

const args = process.argv.slice(2)
const period = args.find((arg) => isPeriod(arg))
if (!period) {
  console.error('Usage: npm run data:add -- YYYY-MM [--file <saved official page>]')
  process.exit(2)
}
const scripts = import.meta.dirname
const run = (/** @type {string} */ script, /** @type {string[]} */ scriptArgs) =>
  execFileSync(process.execPath, [join(scripts, script), ...scriptArgs], { stdio: 'inherit' })

run('fetch-archive.mjs', args)
const recordPath = join(scripts, '..', 'data', 'bulletins', period.slice(0, 4), `${period}.json`)
run('build-data.mjs', [period, ...(args.includes('--force') ? ['--force'] : [])])
if (!existsSync(recordPath)) {
  console.error(`\n${period} was not added: no archived snapshot yet. Save the official page from a browser and re-run with --file.`)
  process.exit(1)
}
run('validate-data.mjs', [])
run('crosscheck.mjs', [])
console.log(`\n${period} added. Review the diff, spot-check three cells against the official page, then commit.`)
