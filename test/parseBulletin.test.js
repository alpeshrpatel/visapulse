import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import test from 'node:test'
import { extractTables, toText } from '../src/lib/extractTables.js'
import { officialBulletinUrl } from '../src/lib/officialUrl.js'
import { BulletinParseError, parseBulletin } from '../src/lib/parseBulletin.js'
import { fiscalYearOf, periodRange, shiftPeriod } from '../src/lib/period.js'
import { validateBulletin } from '../src/lib/validateBulletin.js'

const fixtureDir = join(import.meta.dirname, 'fixtures', 'official')
const manifest = JSON.parse(readFileSync(join(import.meta.dirname, '..', 'data', 'sources', 'manifest.json'), 'utf8'))
const fixture = (period) => readFileSync(join(fixtureDir, `${period}.html`))
const parseFixture = (period) => parseBulletin(fixture(period).toString('utf8'), period)

test('fixtures are the exact official bytes pinned in the manifest', () => {
  for (const period of ['2003-06', '2015-10', '2025-06']) {
    const sha256 = createHash('sha256').update(fixture(period)).digest('hex')
    assert.equal(sha256, manifest[period].sha256, period)
  }
})

test('periods and fiscal years', () => {
  assert.equal(fiscalYearOf('2025-09'), 2025)
  assert.equal(fiscalYearOf('2025-10'), 2026)
  assert.equal(shiftPeriod('2026-01', -1), '2025-12')
  assert.deepEqual(periodRange('2025-11', '2026-02'), ['2025-11', '2025-12', '2026-01', '2026-02'])
})

test('official URLs use the fiscal-year folder and known irregular names', () => {
  assert.equal(
    officialBulletinUrl('2025-06'),
    'https://travel.state.gov/content/travel/en/legal/visa-law0/visa-bulletin/2025/visa-bulletin-for-june-2025.html',
  )
  assert.match(officialBulletinUrl('2025-11'), /visa-bulletin\/2026\/visa-bulletin-for-november-2025\.html$/)
  assert.match(officialBulletinUrl('2009-10'), /visa-bulletin\/2010\/visa-bulletin-october-2009\.html$/)
})

test('table extractor keeps nested tables separate and decodes entities', () => {
  const tables = extractTables(`<p>Intro &amp; note</p>
    <table><tr><td>A&nbsp;<b>1</b></td><td><table><tr><td>inner</td></tr></table>B</td></tr><tr><td>C<td>D</tr></table>`)
  assert.equal(tables.length, 2)
  assert.deepEqual(tables[0].rows, [['A 1', 'B'], ['C', 'D']])
  assert.equal(tables[0].before, 'Intro & note')
  assert.deepEqual(tables[1].rows, [['inner']])
  assert.equal(toText('x &#8211; y&#x41;'), 'x – yA')
})

test('June 2003: single chart, only the areas the bulletin lists', () => {
  const { record, warnings } = parseFixture('2003-06')
  assert.deepEqual(warnings, [])
  assert.deepEqual(Object.keys(record.areas), ['all', 'mexico', 'philippines'])
  const family = record.categories.familySponsored
  assert.deepEqual(Object.keys(family), ['F1', 'F2A', 'F2B', 'F3', 'F4'])
  assert.deepEqual(family.F1.finalActionDates, { all: '1999-11-01', mexico: '1994-05-01', philippines: '1990-06-01' })
  assert.equal(family.F4.finalActionDates.philippines, '1982-01-15')
  assert.equal(family.F2A.label, '2A*')
  assert.equal(family.F1.datesForFiling, undefined)
  const employment = record.categories.employmentBased
  assert.deepEqual(Object.keys(employment), ['EB1', 'EB2', 'EB3', 'EB3OW', 'EB4', 'EB4SR', 'EB5', 'EB5TEARC'])
  assert.ok(Object.values(employment).every((item) => item.finalActionDates.all === 'Current'))
})

test('October 2015: first bulletin with two charts', () => {
  const { record } = parseFixture('2015-10')
  assert.deepEqual(Object.keys(record.areas), ['all', 'china', 'india', 'mexico', 'philippines'])
  const { familySponsored: family, employmentBased: employment } = record.categories
  assert.equal(family.F1.finalActionDates.mexico, '1994-11-22')
  assert.equal(family.F1.datesForFiling.mexico, '1995-04-01')
  assert.equal(employment.EB2.finalActionDates.india, '2005-05-01')
  assert.equal(employment.EB2.datesForFiling.india, '2009-07-01')
  assert.equal(employment.EB4SR.finalActionDates.all, 'Unavailable')
  assert.equal(employment.EB4SR.datesForFiling.all, 'Current')
  // The two charts list different EB-5 rows this month; neither is padded.
  assert.ok(employment.EB5NRC.finalActionDates && !employment.EB5NRC.datesForFiling)
  assert.ok(employment.EB5TEARC.datesForFiling && !employment.EB5TEARC.finalActionDates)
})

test('June 2025: current layout with EB-5 set-asides', () => {
  const { record } = parseFixture('2025-06')
  const { familySponsored: family, employmentBased: employment } = record.categories
  assert.equal(family.F1.finalActionDates.mexico, '2005-04-22')
  assert.equal(family.F4.finalActionDates.india, '2006-06-15')
  assert.equal(family.F2A.datesForFiling.all, '2025-02-01')
  assert.equal(employment.EB1.finalActionDates.china, '2022-11-08')
  assert.equal(employment.EB2.finalActionDates.india, '2013-01-01')
  assert.equal(employment.EB3OW.finalActionDates.china, '2017-04-01')
  assert.equal(employment.EB4.finalActionDates.all, 'Unavailable')
  assert.equal(employment.EB4.datesForFiling.all, '2021-02-01')
  for (const code of ['EB5Unreserved', 'EB5Rural', 'EB5HighUnemployment', 'EB5Infrastructure']) {
    assert.ok(employment[code].finalActionDates && employment[code].datesForFiling, code)
  }
  assert.equal(record.bulletin.fiscalYear, 2025)
})

test('parsed fixtures pass validation once provenance is attached', () => {
  for (const period of ['2003-06', '2015-10', '2025-06']) {
    const { record } = parseFixture(period)
    record.source = {
      publisher: 'U.S. Department of State, Bureau of Consular Affairs',
      officialUrl: manifest[period].officialUrl,
      retrievedVia: 'web.archive.org',
      snapshotUrl: manifest[period].snapshotUrl,
      snapshotTimestamp: manifest[period].snapshotTimestamp,
      sha256: manifest[period].sha256,
      parserVersion: 1,
    }
    assert.deepEqual(validateBulletin(record, { expectedPeriod: period, expectedSha256: manifest[period].sha256 }), [], period)
  }
})

test('parser refuses to guess', () => {
  const html = fixture('2025-06').toString('utf8')
  assert.throws(() => parseBulletin(html, '2025-07'), BulletinParseError, 'wrong month')
  assert.throws(() => parseBulletin(html.replace('<td>F2A</td>', '<td>F9</td>'), '2025-06'), /unrecognised familySponsored row "F9"/)
  assert.throws(() => parseBulletin(html.replace('>08JUN16<', '>soon<'), '2025-06'), /unrecognised cell "soon"/)
  assert.throws(() => parseBulletin(html.replace('>08JUN16<', '>31FEB16<'), '2025-06'), /impossible date/)
  assert.throws(() => parseBulletin('<title>Visa Bulletin For June 2025</title>', '2025-06'), /no cut-off tables/)
})

test('validator catches broken records', () => {
  const { record } = parseFixture('2025-06')
  assert.ok(validateBulletin(record).some((error) => error.includes('provenance')))
  const future = structuredClone(record)
  future.categories.familySponsored.F1.finalActionDates.all = '2031-01-01'
  assert.ok(validateBulletin(future).some((error) => error.includes('after the bulletin month')))
  const missing = structuredClone(record)
  delete missing.categories.familySponsored.F3
  assert.ok(validateBulletin(missing).some((error) => error.includes('F3')))
  const early = parseFixture('2003-06').record
  early.categories.familySponsored.F1.datesForFiling = { all: 'Current' }
  assert.ok(validateBulletin(early).some((error) => error.includes('before that chart existed')))
})
