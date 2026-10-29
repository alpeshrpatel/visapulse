import { AlertTriangle, ArrowRight, Check, CircleHelp, Minus } from 'lucide-react'
import { useState } from 'react'
import { buildGreenCardPlan } from './greenCardTimeline.js'

const stageOptions = {
  adjustment: [
    ['notFiled', 'Not filed'],
    ['pending', 'Filed, pending'],
    ['biometrics', 'Biometrics scheduled or complete'],
    ['evidence', 'Evidence review'],
    ['interview', 'Interview stage'],
    ['finalReview', 'Final review'],
    ['rfe', 'Request for evidence'],
    ['approved', 'Approved'],
  ],
  consular: [
    ['notStarted', 'Not started at NVC'],
    ['documentReview', 'NVC document review'],
    ['qualified', 'Documentarily qualified'],
    ['interview', 'Consular interview'],
    ['administrativeProcessing', 'Administrative processing'],
    ['issued', 'Immigrant visa issued'],
  ],
}

const initialInput = {
  route: 'employmentBased',
  path: 'adjustment',
  petitionerStatus: 'unknown',
  categoryCode: 'EB2',
  country: '',
  priorityDate: '',
  filingChart: 'datesForFiling',
  permRequirement: 'unknown',
  permStatus: 'notStarted',
  petitionStatus: 'notFiled',
  caseStage: 'notFiled',
  biometricsComplete: false,
  medicalComplete: false,
  supportDocsReady: 'unknown',
  interviewComplete: false,
  rfePending: false,
  securityReview: 'unknown',
  crossChargeability: false,
  crossChargeabilityCountry: '',
  derivativeBirthDate: '',
  petitionFiledDate: '',
  petitionApprovedDate: '',
  processingLocation: '',
  premiumProcessing: 'none',
  wasTransferred: false,
}

const statusLabels = {
  complete: 'Complete',
  inProgress: 'In progress',
  blocked: 'Waiting',
  upcoming: 'Upcoming',
}

function categoryGroupFor(route) {
  return route === 'employmentBased' ? 'employmentBased' : 'familySponsored'
}

function formatPlanDate(value) {
  if (!value) return 'Not entered'
  const [year, month, day] = value.split('-').map(Number)
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    timeZone: 'UTC',
  }).format(new Date(Date.UTC(year, month - 1, day)))
}

export default function GreenCardPlanner({ bulletin }) {
  const [input, setInput] = useState(initialInput)
  const categoryGroup = categoryGroupFor(input.route)
  const categoryEntries = Object.entries(bulletin.categories[categoryGroup])
  const categoryCode = input.route === 'familyImmediate'
    ? 'F2A'
    : categoryEntries.some(([code]) => code === input.categoryCode)
      ? input.categoryCode
      : categoryEntries[0]?.[0]
  const effectiveInput = { ...input, categoryGroup, categoryCode }
  const plan = buildGreenCardPlan(effectiveInput, bulletin)
  const countryEntries = Object.entries(bulletin.countryColumns)

  function updateInput(event) {
    const { name, value, type, checked } = event.target
    if (name === 'route') {
      const nextGroup = categoryGroupFor(value)
      const nextCode = Object.keys(bulletin.categories[nextGroup])[0]
      setInput((current) => ({
        ...current,
        route: value,
        categoryCode: value === 'employmentBased' ? 'EB2' : nextCode,
        petitionerStatus: value === 'familyImmediate' ? 'unknown' : current.petitionerStatus,
      }))
      return
    }
    if (name === 'path') {
      setInput((current) => ({ ...current, path: value, caseStage: value === 'adjustment' ? 'notFiled' : 'notStarted' }))
      return
    }
    const nextValue = type === 'checkbox'
      ? checked
      : name === 'supportDocsReady' && value !== 'unknown'
        ? value === 'true'
        : value
    setInput((current) => ({ ...current, [name]: nextValue }))
  }

  return (
    <section className="planner-section" aria-labelledby="planner-title">
      <div className="planner-heading">
        <div>
          <span className="section-kicker">CASE TIMELINE</span>
          <h2 id="planner-title">Green card process planner<span>.</span></h2>
        </div>
        <span className="planner-bulletin">Using {bulletin.bulletin.month} {bulletin.bulletin.year} bulletin</span>
      </div>
      <p className="planner-intro">Enter the known case details to check bulletin gates and map the next process stages. Estimates are shown only when supported by connected official data.</p>

      <div className="planner-layout">
        <form className="planner-form" onSubmit={(event) => event.preventDefault()}>
          <fieldset className="planner-fieldset">
            <legend>Case pathway</legend>
            <div className="planner-fields">
              <label className="planner-field">
                <span>Immigration route</span>
                <select name="route" value={input.route} onChange={updateInput}>
                  <option value="familyImmediate">Family immediate relative</option>
                  <option value="familyPreference">Family preference</option>
                  <option value="employmentBased">Employment-based</option>
                </select>
              </label>
              <label className="planner-field">
                <span>Processing path</span>
                <select name="path" value={input.path} onChange={updateInput}>
                  <option value="adjustment">Adjustment of status in the U.S.</option>
                  <option value="consular">Consular processing abroad</option>
                </select>
              </label>
              {input.route !== 'familyImmediate' && (
                <label className="planner-field">
                  <span>Preference category</span>
                  <select name="categoryCode" value={categoryCode} onChange={updateInput}>
                    {categoryEntries.map(([code, item]) => <option key={code} value={code}>{code} · {item.name}</option>)}
                  </select>
                </label>
              )}
              {input.route !== 'employmentBased' && (
                <label className="planner-field">
                  <span>Petitioner status</span>
                  <select name="petitionerStatus" value={input.petitionerStatus} onChange={updateInput}>
                    <option value="unknown">Not sure</option>
                    <option value="usCitizen">U.S. citizen</option>
                    <option value="permanentResident">Lawful permanent resident</option>
                  </select>
                </label>
              )}
              <label className="planner-field">
                <span>Chargeability area</span>
                <select name="country" value={input.country} onChange={updateInput}>
                  <option value="">Select area</option>
                  {countryEntries.map(([key, name]) => <option key={key} value={key}>{name}</option>)}
                </select>
              </label>
              <label className="planner-field">
                <span>Priority date{input.route === 'familyImmediate' ? ' (if assigned)' : ''}</span>
                <input name="priorityDate" type="date" value={input.priorityDate} onChange={updateInput} />
              </label>
              {input.path === 'adjustment' && input.route !== 'familyImmediate' && (
                <label className="planner-field">
                  <span>Adjustment filing chart to check</span>
                  <select name="filingChart" value={input.filingChart} onChange={updateInput}>
                    <option value="datesForFiling">Dates for Filing</option>
                    <option value="finalActionDates">Final Action Dates</option>
                  </select>
                </label>
              )}
            </div>
            {input.route === 'familyImmediate' && (
              <p className="planner-field-note">The planner treats this selected route as not subject to a preference-category visa-number cutoff. Confirm immediate-relative eligibility for the specific relationship.</p>
            )}
          </fieldset>

          {input.route === 'employmentBased' && (
            <fieldset className="planner-fieldset">
              <legend>Employment petition</legend>
              <div className="planner-fields">
                <label className="planner-field">
                  <span>PERM labor certification</span>
                  <select name="permRequirement" value={input.permRequirement} onChange={updateInput}>
                    <option value="unknown">Not sure whether required</option>
                    <option value="required">Required</option>
                    <option value="notRequired">Not required / exempt</option>
                  </select>
                </label>
                {input.permRequirement === 'required' && (
                  <label className="planner-field">
                    <span>PERM status</span>
                    <select name="permStatus" value={input.permStatus} onChange={updateInput}>
                      <option value="notStarted">Not started</option>
                      <option value="pending">Pending</option>
                      <option value="certified">Certified</option>
                    </select>
                  </label>
                )}
                <label className="planner-field">
                  <span>I-140 status</span>
                  <select name="petitionStatus" value={input.petitionStatus} onChange={updateInput}>
                    <option value="notFiled">Not filed</option>
                    <option value="pending">Pending</option>
                    <option value="approved">Approved</option>
                    <option value="denied">Denied</option>
                  </select>
                </label>
                <label className="planner-field">
                  <span>Premium processing</span>
                  <select name="premiumProcessing" value={input.premiumProcessing} onChange={updateInput}>
                    <option value="none">Not requested</option>
                    <option value="requested">Requested / pending</option>
                    <option value="approved">Approved for petition</option>
                  </select>
                </label>
              </div>
            </fieldset>
          )}

          {input.route !== 'employmentBased' && (
            <fieldset className="planner-fieldset">
              <legend>Family petition</legend>
              <div className="planner-fields">
                <label className="planner-field">
                  <span>I-130 status</span>
                  <select name="petitionStatus" value={input.petitionStatus} onChange={updateInput}>
                    <option value="notFiled">Not filed</option>
                    <option value="pending">Pending</option>
                    <option value="approved">Approved</option>
                    <option value="denied">Denied</option>
                  </select>
                </label>
                <label className="planner-field">
                  <span>Sponsor financial documents</span>
                  <select name="supportDocsReady" value={input.supportDocsReady} onChange={updateInput}>
                    <option value="unknown">Not sure / not applicable</option>
                    <option value="false">Not ready</option>
                    <option value="true">Ready</option>
                  </select>
                </label>
              </div>
            </fieldset>
          )}

          <fieldset className="planner-fieldset">
            <legend>Case progress and delays</legend>
            <div className="planner-fields">
              <label className="planner-field">
                <span>{input.path === 'adjustment' ? 'Adjustment case stage' : 'Consular case stage'}</span>
                <select name="caseStage" value={input.caseStage} onChange={updateInput}>
                  {stageOptions[input.path].map(([value, label]) => <option key={value} value={value}>{label}</option>)}
                </select>
              </label>
              <label className="planner-field">
                <span>Security or administrative review</span>
                <select name="securityReview" value={input.securityReview} onChange={updateInput}>
                  <option value="unknown">Not known / no notice</option>
                  <option value="pending">Background review reported pending</option>
                  <option value="administrativeProcessing">Administrative processing reported</option>
                  <option value="cleared">Cleared / no longer pending</option>
                </select>
              </label>
              <label className="planner-field">
                <span>Service center or consular post</span>
                <input name="processingLocation" value={input.processingLocation} onChange={updateInput} placeholder="Optional location" />
              </label>
              <label className="planner-field">
                <span>Petition filed date</span>
                <input name="petitionFiledDate" type="date" value={input.petitionFiledDate} onChange={updateInput} />
              </label>
              <label className="planner-field">
                <span>Petition approval date</span>
                <input name="petitionApprovedDate" type="date" value={input.petitionApprovedDate} onChange={updateInput} />
              </label>
              <label className="planner-field">
                <span>Derivative child birth date (optional)</span>
                <input name="derivativeBirthDate" type="date" value={input.derivativeBirthDate} onChange={updateInput} />
              </label>
              {input.crossChargeability && (
                <label className="planner-field">
                  <span>Alternative chargeability area</span>
                  <select name="crossChargeabilityCountry" value={input.crossChargeabilityCountry} onChange={updateInput}>
                    <option value="">Select alternative area</option>
                    {countryEntries.map(([key, name]) => <option key={key} value={key}>{name}</option>)}
                  </select>
                </label>
              )}
            </div>
            <div className="planner-checks">
              {input.path === 'adjustment' && <label><input type="checkbox" name="biometricsComplete" checked={input.biometricsComplete} onChange={updateInput} /> Biometrics completed</label>}
              <label><input type="checkbox" name="medicalComplete" checked={input.medicalComplete} onChange={updateInput} /> Medical exam completed</label>
              {input.path === 'adjustment' && <label><input type="checkbox" name="interviewComplete" checked={input.interviewComplete} onChange={updateInput} /> Interview completed</label>}
              <label><input type="checkbox" name="rfePending" checked={input.rfePending} onChange={updateInput} /> Request for evidence is pending</label>
              <label><input type="checkbox" name="crossChargeability" checked={input.crossChargeability} onChange={updateInput} /> Explore cross-chargeability scenario</label>
              <label><input type="checkbox" name="wasTransferred" checked={input.wasTransferred} onChange={updateInput} /> Case was transferred</label>
            </div>
          </fieldset>
        </form>

        <aside className="planner-results" aria-live="polite" aria-label="Green card timeline result">
          <div className="planner-result-heading">
            <div>
              <span className="section-kicker">NEXT STEP</span>
              <h3>{plan.nextStep.title}</h3>
            </div>
            {plan.nextStep.type === 'caution' ? <AlertTriangle size={21} /> : plan.nextStep.type === 'complete' ? <Check size={21} /> : <ArrowRight size={21} />}
          </div>
          <p className="planner-next-detail">{plan.nextStep.detail}</p>

          <div className="planner-gates">
            <div className={`planner-gate gate-${plan.finalAction.status}`}>
              <span>FINAL ACTION</span>
              <strong>{plan.finalAction.label}</strong>
              {plan.finalAction.cutoff && <small>Cutoff: {plan.finalAction.cutoff}</small>}
            </div>
            {plan.filingGate && (
              <div className={`planner-gate gate-${plan.filingGate.status}`}>
                <span>FILING CHART</span>
                <strong>{plan.filingGate.label}</strong>
                {plan.filingGate.cutoff && <small>Cutoff: {plan.filingGate.cutoff}</small>}
              </div>
            )}
          </div>

          <div className="planner-estimate">
            <span className="section-kicker">PROCESSING-TIME RANGE</span>
            <p>{plan.processingEstimate}</p>
            {plan.processingLocation && <small>Location entered: {plan.processingLocation}</small>}
          </div>

          <div className="planner-stage-heading">
            <h4>Case stages</h4>
            <span>{plan.categoryName}</span>
          </div>
          <ol className="planner-stages">
            {plan.stages.map((stage) => (
              <li className={`stage-${stage.status}`} key={stage.name}>
                <span className="stage-mark" aria-hidden="true">{stage.status === 'complete' ? <Check size={13} /> : stage.status === 'blocked' ? <Minus size={13} /> : <span />}</span>
                <span>{stage.name}</span>
                <small>{statusLabels[stage.status]}</small>
              </li>
            ))}
          </ol>

          {plan.cautions.length > 0 && (
            <div className="planner-cautions">
              <h4><AlertTriangle size={15} /> Review these factors</h4>
              <ul>{plan.cautions.map((caution) => <li key={caution}>{caution}</li>)}</ul>
            </div>
          )}

          <p className="planner-disclaimer"><CircleHelp size={14} /> Based on user-entered facts and the {plan.sourcePeriod} bulletin. This is a planning aid, not a legal eligibility determination or guaranteed timeline. Confirm current rules and notices with official sources.</p>
        </aside>
      </div>
    </section>
  )
}