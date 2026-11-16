import assert from 'node:assert/strict'
import { join } from 'node:path'
import test from 'node:test'
import { adaptLegacy, getCutoff, loadDataset } from '../src/lib/dataset.js'
import { AREAS, LINES } from '../src/lib/labels.js'
import { describeChange, formatDays, priorityDateStatus } from '../src/lib/movement.js'

const root = join(import.meta.dirname, '..', 'data')
const dataset = loadDataset({ officialDir: join(root, 'bulletins'), legacyDir: join(root, 'visa-bulletins') })

test('official records win and are the only ones marked verified', () => {
  for (const period of ['2003-06', '2015-10', '2025-06']) {
    assert.equal(dataset.get(period).verified, true, period)
    assert.equal(dataset.get(period).source.retrievedVia, 'web.archive.org')
  }
  assert.ok(dataset.verifiedPeriods.length >= 3)
  const unverified = dataset.periods.find((period) => !dataset.verifiedPeriods.includes(period))
  if (unverified) assert.equal(dataset.get(unverified).verified, false)
})

test('structurally broken legacy months are withheld, not shown', () => {
  // 2003-07 has no categories at all and 2002-06 has no family table in the legacy scrape.
  for (const period of ['2003-07', '2002-06']) {
    if (dataset.verifiedPeriods.includes(period)) continue
    assert.equal(dataset.get(period), null, period)
    assert.ok(dataset.withheldPeriods.includes(period), period)
  }
  assert.equal(adaptLegacy({ categories: { familySponsored: {}, employmentBased: {} } }, '2010-02'), null)
})

test('legacy adapter drops Dates for Filing before the chart existed and fixes the official link', () => {
  const cells = { allChargeabilityAreasExceptThoseListed: '2001-01-01', india: 'Current' }
  const item = (name) => ({ name, finalActionDates: cells, datesForFiling: cells })
  const legacy = {
    categories: {
      familySponsored: { F1: item('a'), F2A: item('b'), F2B: item('c'), F3: item('d'), F4: item('e') },
      employmentBased: { EB1: item('f'), EB2: item('g'), EB3: item('h'), otherWorkers: item('i') },
    },
  }
  const early = adaptLegacy(legacy, '2012-11')
  assert.equal(early.verified, false)
  assert.equal(early.categories.familySponsored.F1.datesForFiling, undefined)
  assert.deepEqual(early.categories.employmentBased.EB3OW.finalActionDates, { all: '2001-01-01', india: 'Current' })
  assert.match(early.bulletin.officialSourceUrl, /visa-bulletin\/2013\/visa-bulletin-for-november-2012\.html$/)
  assert.ok(adaptLegacy(legacy, '2016-03').categories.familySponsored.F1.datesForFiling)
})

test('an area the bulletin does not list is charged to All Chargeability', () => {
  const june2003 = dataset.get('2003-06')
  assert.deepEqual(getCutoff(june2003, 'F1', 'finalActionDates', 'mexico'), { value: '1994-05-01', viaAll: false, sourceKey: 'F1' })
  assert.deepEqual(getCutoff(june2003, 'F1', 'finalActionDates', 'india'), { value: '1999-11-01', viaAll: true, sourceKey: 'F1' })
  assert.equal(getCutoff(june2003, 'F1', 'datesForFiling', 'india'), null)
  assert.equal(getCutoff(null, 'F1', 'finalActionDates', 'india'), null)
})

test('EB-5 unreserved follows its lineage across eras', () => {
  assert.equal(getCutoff(dataset.get('2003-06'), 'EB5Unreserved', 'finalActionDates', 'all').sourceKey, 'EB5')
  assert.equal(getCutoff(dataset.get('2015-10'), 'EB5Unreserved', 'finalActionDates', 'china').sourceKey, 'EB5NRC')
  assert.equal(getCutoff(dataset.get('2025-06'), 'EB5Unreserved', 'finalActionDates', 'china').sourceKey, 'EB5Unreserved')
})

test('series are chronological and every site line resolves in the latest bulletin', () => {
  const series = dataset.series('EB2', 'finalActionDates', 'india')
  assert.ok(series.length > 50)
  assert.deepEqual(series.map((point) => point.period), series.map((point) => point.period).sort())
  const latest = dataset.get(dataset.latestPeriod)
  for (const line of LINES) for (const area of AREAS) {
    assert.ok(getCutoff(latest, line.key, 'finalActionDates', area.key), `${line.key}/${area.key}`)
  }
})

test('movement between bulletins', () => {
  assert.deepEqual(describeChange('2013-02-01', '2013-01-01'), { type: 'advance', label: '+31 d', days: 31 })
  assert.equal(describeChange('2012-01-01', '2013-01-01').type, 'retrogression')
  assert.equal(describeChange('Current', '2020-01-01').label, 'Became current')
  assert.equal(describeChange('2020-01-01', 'Current').label, 'Cut-off imposed')
  assert.equal(describeChange('Unavailable', '2020-01-01').type, 'retrogression')
  assert.equal(describeChange('2020-01-01', 'Unavailable').type, 'advance')
  assert.equal(describeChange('2020-01-01', '2020-01-01').type, 'unchanged')
  assert.equal(describeChange('2020-01-01', undefined), null)
  assert.equal(formatDays(92), '+3 mo')
  assert.equal(formatDays(-400), '−1 yr 1 mo')
  assert.equal(formatDays(14), '+14 d')
})

test('a priority date is current only when earlier than the cut-off', () => {
  assert.equal(priorityDateStatus('2012-12-31', '2013-01-01'), 'current')
  assert.equal(priorityDateStatus('2013-01-01', '2013-01-01'), 'waiting')
  assert.equal(priorityDateStatus('2030-01-01', 'Current'), 'current')
  assert.equal(priorityDateStatus('1990-01-01', 'Unavailable'), 'unavailable')
})
