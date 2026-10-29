import assert from 'node:assert/strict'
import test from 'node:test'
import { assessCutoff, buildGreenCardPlan } from '../src/greenCardTimeline.js'

const bulletin = {
  bulletin: { month: 'October', year: 2026 },
  countryColumns: { india: 'India', mexico: 'Mexico' },
  categories: {
    familySponsored: {
      F1: {
        name: 'Unmarried sons and daughters of U.S. citizens',
        finalActionDates: { india: '2020-01-01' },
        datesForFiling: { india: '2021-01-01' },
      },
      F2A: {
        name: 'Spouses and children of permanent residents',
        finalActionDates: { india: 'Current' },
        datesForFiling: { india: 'Current' },
      },
    },
    employmentBased: {
      EB2: {
        name: 'Employment-Based Second Preference',
        finalActionDates: { india: '2023-11-01', mexico: 'Current' },
        datesForFiling: { india: '2025-01-01', mexico: 'Current' },
      },
    },
  },
}

const baseInput = {
  route: 'employmentBased',
  path: 'adjustment',
  petitionerStatus: 'unknown',
  categoryGroup: 'employmentBased',
  categoryCode: 'EB2',
  country: 'india',
  priorityDate: '2024-01-01',
  filingChart: 'datesForFiling',
  permRequirement: 'notRequired',
  permStatus: 'certified',
  petitionStatus: 'approved',
  caseStage: 'notFiled',
  biometricsComplete: false,
  medicalComplete: false,
  supportDocsReady: 'unknown',
  interviewComplete: false,
  rfePending: false,
  crossChargeability: false,
  derivativeBirthDate: '',
  petitionFiledDate: '',
  petitionApprovedDate: '',
  processingLocation: '',
  premiumProcessing: 'none',
  wasTransferred: false,
}

test('assessCutoff handles current, unavailable, waiting, and missing dates', () => {
  assert.equal(assessCutoff('2013-01-01', 'Current').status, 'eligible')
  assert.equal(assessCutoff('2013-01-01', 'Unavailable').status, 'unavailable')
  assert.equal(assessCutoff('2024-01-01', '2023-11-01').status, 'waiting')
  assert.equal(assessCutoff('', '2023-11-01').status, 'missing')
})

test('filing eligibility does not imply final-action availability', () => {
  const plan = buildGreenCardPlan(baseInput, bulletin)
  assert.equal(plan.filingGate.status, 'eligible')
  assert.equal(plan.finalAction.status, 'waiting')
  assert.match(plan.nextStep.title, /I-485 filing eligibility/)
})

test('cross-chargeability scenario uses the selected alternative area cutoff', () => {
  const plan = buildGreenCardPlan({
    ...baseInput,
    crossChargeability: true,
    crossChargeabilityCountry: 'mexico',
  }, bulletin)
  assert.equal(plan.finalAction.status, 'eligible')
  assert.equal(plan.filingGate.status, 'eligible')
  assert.ok(plan.cautions.some((caution) => caution.includes('Mexico as the chargeability area')))
})

test('non-current filing chart blocks an unfiled adjustment case', () => {
  const plan = buildGreenCardPlan({ ...baseInput, filingChart: 'finalActionDates' }, bulletin)
  assert.equal(plan.finalAction.status, 'waiting')
  assert.equal(plan.filingGate.status, 'waiting')
  assert.match(plan.nextStep.title, /Wait for I-485 filing eligibility/)
})

test('missing chargeability and priority date request input instead of suggesting a wait', () => {
  const plan = buildGreenCardPlan({ ...baseInput, country: '', priorityDate: '' }, bulletin)
  assert.equal(plan.filingGate.status, 'missing')
  assert.match(plan.nextStep.title, /Complete the visa-availability details/)
})

test('RFE response is prioritized above visa waiting', () => {
  const plan = buildGreenCardPlan({ ...baseInput, rfePending: true }, bulletin)
  assert.match(plan.nextStep.title, /request for evidence/)
  assert.ok(plan.stages.some((stage) => stage.name === 'Request for evidence response' && stage.status === 'blocked'))
})

test('security review is represented without estimating its duration', () => {
  const plan = buildGreenCardPlan({ ...baseInput, securityReview: 'administrativeProcessing' }, bulletin)
  assert.match(plan.nextStep.title, /administrative-processing/)
  assert.ok(plan.stages.some((stage) => stage.name === 'Security/background review' && stage.status === 'inProgress'))
  assert.ok(plan.cautions.some((caution) => caution.includes('no reliable duration')))
})

test('immediate-relative route bypasses the preference cutoff and checks petitioner status', () => {
  const plan = buildGreenCardPlan({
    ...baseInput,
    route: 'familyImmediate',
    categoryGroup: 'familySponsored',
    categoryCode: 'F2A',
    petitionerStatus: 'permanentResident',
  }, bulletin)
  assert.equal(plan.finalAction.status, 'notRequired')
  assert.ok(plan.cautions.some((caution) => caution.includes('U.S. citizen petitioner')))
})

test('PERM uncertainty is surfaced before employment petition steps', () => {
  const plan = buildGreenCardPlan({ ...baseInput, permRequirement: 'unknown' }, bulletin)
  assert.match(plan.nextStep.title, /Confirm whether PERM/)
})

test('premium processing and transfer do not imply an overall ETA', () => {
  const plan = buildGreenCardPlan({ ...baseInput, premiumProcessing: 'approved', wasTransferred: true }, bulletin)
  assert.ok(plan.cautions.some((caution) => caution.includes('does not create visa availability')))
  assert.ok(plan.cautions.some((caution) => caution.includes('transfer can change the office')))
  assert.match(plan.processingEstimate, /not connected/)
})

test('consular document-review state recommends NVC documents', () => {
  const plan = buildGreenCardPlan({
    ...baseInput,
    path: 'consular',
    priorityDate: '2023-01-01',
    caseStage: 'documentReview',
  }, bulletin)
  assert.match(plan.nextStep.title, /NVC fees and document submission/)
  assert.ok(plan.stages.some((stage) => stage.name === 'Document qualification'))
})