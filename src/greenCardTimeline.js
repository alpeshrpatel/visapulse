function getCategory(bulletin, group, code) {
  const categories = bulletin.categories[group]
  return categories[code] ?? (code === 'EB5' ? categories.EB5Unreserved : undefined)
}

export function assessCutoff(priorityDate, cutoff) {
  if (!priorityDate) {
    return { status: 'missing', label: 'Enter a priority date', cutoff }
  }
  if (!/^\d{4}-\d{2}-\d{2}$/.test(priorityDate)) {
    return { status: 'invalid', label: 'Enter a valid priority date', cutoff }
  }
  if (cutoff === 'Current') {
    return { status: 'eligible', label: 'Current', cutoff }
  }
  if (!cutoff || cutoff === 'Unavailable') {
    return { status: 'unavailable', label: 'No cutoff available', cutoff: cutoff ?? 'Unavailable' }
  }
  if (!/^\d{4}-\d{2}-\d{2}$/.test(cutoff)) {
    return { status: 'unavailable', label: 'No cutoff available', cutoff }
  }
  if (priorityDate <= cutoff) {
    return { status: 'eligible', label: 'Priority date is current', cutoff }
  }
  const daysAfterCutoff = Math.round((Date.parse(`${priorityDate}T00:00:00Z`) - Date.parse(`${cutoff}T00:00:00Z`)) / 86400000)
  return {
    status: 'waiting',
    label: `${daysAfterCutoff} days after cutoff`,
    cutoff,
    daysAfterCutoff,
  }
}

function makeStep(title, detail, type = 'action') {
  return { title, detail, type }
}

export function buildGreenCardPlan(input, bulletin) {
  const {
    route,
    path,
    petitionerStatus,
    categoryGroup,
    categoryCode,
    country,
    priorityDate,
    filingChart,
    permRequirement,
    permStatus,
    petitionStatus,
    caseStage,
    biometricsComplete,
    medicalComplete,
    supportDocsReady,
    interviewComplete,
    rfePending,
    securityReview,
    crossChargeability,
    crossChargeabilityCountry,
    derivativeBirthDate,
    petitionFiledDate,
    petitionApprovedDate,
    processingLocation,
    premiumProcessing,
    wasTransferred,
  } = input
  const isImmediateRelative = route === 'familyImmediate'
  const isEmployment = route === 'employmentBased'
  const cutoffCountry = crossChargeability
    ? crossChargeabilityCountry
    : country
  const category = getCategory(bulletin, categoryGroup, categoryCode)
  const finalCutoff = isImmediateRelative ? null : category?.finalActionDates?.[cutoffCountry]
  const finalAction = isImmediateRelative
    ? { status: 'notRequired', label: 'Immediate-relative category', cutoff: null }
    : !cutoffCountry
      ? { status: 'missing', label: 'Select a chargeability area', cutoff: null }
      : assessCutoff(priorityDate, finalCutoff)
  const filingCutoff = category?.datesForFiling?.[cutoffCountry]
  const filingGate = path === 'adjustment' && !isImmediateRelative
    ? !cutoffCountry
      ? { status: 'missing', label: 'Select a chargeability area', cutoff: null }
      : assessCutoff(priorityDate, filingChart === 'datesForFiling' ? filingCutoff : finalCutoff)
    : null
  const securityStageStatus = securityReview === 'cleared'
    ? 'complete'
    : ['pending', 'administrativeProcessing'].includes(securityReview) || caseStage === 'administrativeProcessing'
      ? 'inProgress'
      : 'upcoming'

  let nextStep
  if (rfePending || caseStage === 'rfe') {
    nextStep = makeStep('Respond to the outstanding request for evidence', 'Follow the deadline and instructions on the official notice.', 'caution')
  } else if (petitionStatus === 'denied') {
    nextStep = makeStep('Review the petition denial notice', 'Deadlines and possible responses are case-specific; consult the official notice and qualified counsel.', 'caution')
  } else if (isEmployment && permRequirement === 'unknown') {
    nextStep = makeStep(
      'Confirm whether PERM labor certification is required',
      'Some employment categories require labor certification; others may be exempt. The planner does not determine the exemption.',
      'caution',
    )
  } else if (isEmployment && permRequirement === 'required' && permStatus !== 'certified') {
    nextStep = permStatus === 'pending'
      ? makeStep('Wait for the PERM decision', 'The employer-reported labor certification is still pending.')
      : makeStep('Begin the PERM labor certification process', 'The employer-reported PERM stage is not complete.')
  } else if (petitionStatus === 'notFiled') {
    nextStep = makeStep(isEmployment ? 'Prepare the I-140 petition' : 'Prepare the I-130 petition', 'The immigrant petition is reported as not yet filed.')
  } else if (petitionStatus === 'pending') {
    nextStep = makeStep('Track the immigrant petition', 'The I-140 or I-130 petition is reported as pending. The agency-time estimate is not available in this app.')
  } else if (securityReview === 'administrativeProcessing' || caseStage === 'administrativeProcessing') {
    nextStep = makeStep('Follow administrative-processing instructions', 'Timing depends on case-specific review and is not predictable from bulletin data.', 'caution')
  } else if (securityReview === 'pending') {
    nextStep = makeStep('Monitor the reported background review', 'The timing and details of security checks are not publicly predictable from this app’s data.', 'wait')
  } else if (isImmediateRelative) {
    nextStep = getPostPetitionStep(input)
  } else if (path === 'adjustment' && caseStage === 'notFiled' && filingGate) {
    if (filingGate.status === 'eligible') {
      nextStep = makeStep(
        'Check I-485 filing eligibility',
        `The selected ${filingChart === 'datesForFiling' ? 'Dates for Filing' : 'Final Action Dates'} chart is current for this priority date. Confirm USCIS designates this chart for the selected month and verify case eligibility.`,
        'caution',
      )
    } else if (filingGate.status === 'missing' || filingGate.status === 'invalid') {
      nextStep = makeStep('Complete the visa-availability details', `The selected filing chart cannot be checked yet: ${filingGate.label}.`, 'caution')
    } else if (filingGate.status === 'unavailable') {
      nextStep = makeStep('Check category availability', `The selected filing chart has no usable cutoff: ${filingGate.label}. Confirm the current official bulletin.`, 'caution')
    } else {
      nextStep = makeStep('Wait for I-485 filing eligibility', `The selected filing chart is not current: ${filingGate.label}. Confirm the chart USCIS designates for this month.`, 'wait')
    }
  } else if (finalAction.status !== 'eligible') {
    nextStep = finalAction.status === 'waiting'
      ? makeStep('Wait for the Final Action Date to reach the priority date', `The priority date is ${finalAction.label}. This difference is not a time estimate.`,'wait')
      : makeStep('Confirm visa-number availability', finalAction.label, 'caution')
  } else {
    nextStep = getPostPetitionStep(input)
  }

  const stages = []
  if (isEmployment && permRequirement === 'required') {
    stages.push({
      name: 'PERM labor certification',
      status: permStatus === 'certified' ? 'complete' : permStatus === 'pending' ? 'inProgress' : 'upcoming',
    })
  }
  stages.push({
    name: isEmployment ? 'I-140 petition' : 'I-130 petition',
    status: petitionStatus === 'approved' ? 'complete' : petitionStatus === 'denied' ? 'blocked' : petitionStatus === 'pending' ? 'inProgress' : 'upcoming',
  })
  if (!isImmediateRelative) {
    stages.push({
      name: 'Visa number available',
      status: finalAction.status === 'eligible' ? 'complete' : finalAction.status === 'waiting' ? 'blocked' : 'upcoming',
    })
  }
  if (path === 'adjustment') {
    stages.push(
      { name: 'I-485 adjustment of status', status: caseStage === 'approved' ? 'complete' : caseStage === 'notFiled' ? 'upcoming' : 'inProgress' },
      { name: 'Biometrics and evidence', status: biometricsComplete ? 'complete' : caseStage === 'notFiled' ? 'upcoming' : 'inProgress' },
      ...(rfePending || caseStage === 'rfe' ? [{ name: 'Request for evidence response', status: 'blocked' }] : []),
      { name: 'Security/background review', status: securityStageStatus },
      { name: 'Medical exam and interview', status: caseStage === 'approved' ? 'complete' : interviewComplete ? 'complete' : ['interview', 'finalReview'].includes(caseStage) ? 'inProgress' : 'upcoming' },
      { name: 'Final decision', status: caseStage === 'approved' ? 'complete' : caseStage === 'finalReview' ? 'inProgress' : 'upcoming' },
    )
  } else {
    stages.push(
      { name: 'NVC fees and documents', status: ['documentReview', 'qualified', 'interview', 'administrativeProcessing', 'issued'].includes(caseStage) ? 'complete' : 'upcoming' },
      { name: 'Document qualification', status: ['qualified', 'interview', 'administrativeProcessing', 'issued'].includes(caseStage) ? 'complete' : caseStage === 'documentReview' ? 'inProgress' : 'upcoming' },
      ...(rfePending || caseStage === 'rfe' ? [{ name: 'Request for evidence response', status: 'blocked' }] : []),
      { name: 'Security/background review', status: securityStageStatus },
      { name: 'Consular interview and medical', status: ['interview', 'administrativeProcessing', 'issued'].includes(caseStage) ? 'inProgress' : 'upcoming' },
      { name: 'Visa issuance', status: caseStage === 'issued' ? 'complete' : caseStage === 'administrativeProcessing' ? 'blocked' : 'upcoming' },
    )
  }

  const cautions = []
  if (!isImmediateRelative && priorityDate && finalAction.status === 'eligible') {
    cautions.push('Visa availability can change through retrogression; confirm against the current official bulletin before filing or travel.')
  }
  if (crossChargeability) {
    cautions.push(crossChargeabilityCountry
      ? `This scenario uses ${bulletin.countryColumns[crossChargeabilityCountry]} as the chargeability area. Confirm the qualifying relationship and applicable rules; this planner does not validate eligibility.`
      : 'Select the alternative chargeability area to model this scenario. Confirm the qualifying relationship and applicable rules; this planner does not validate eligibility.')
  }
  if (securityReview === 'pending' || securityReview === 'administrativeProcessing' || caseStage === 'administrativeProcessing') {
    cautions.push('Security and administrative reviews are case-specific; no reliable duration can be calculated from Visa Bulletin data.')
  }
  if (route === 'familyImmediate' && petitionerStatus !== 'usCitizen') {
    cautions.push('Immediate-relative classification generally requires a U.S. citizen petitioner. Confirm the correct family category before relying on this result.')
  }
  if (route === 'familyPreference' && categoryCode.startsWith('F') && petitionerStatus) {
    const requiresCitizen = ['F1', 'F3', 'F4'].includes(categoryCode)
    const requiredStatus = requiresCitizen ? 'usCitizen' : 'permanentResident'
    if (petitionerStatus !== requiredStatus) {
      cautions.push('Petitioner status may not match the selected family preference category. Verify the category and eligibility before relying on this result.')
    }
  }
  if (isEmployment && premiumProcessing !== 'none') {
    cautions.push('Premium processing may expedite only an eligible petition stage; it does not create visa availability or expedite later stages.')
  }
  if (wasTransferred) {
    cautions.push('A transfer can change the office handling the case. Verify the current location and use its official processing-time data when available.')
  }
  if (derivativeBirthDate) {
    cautions.push('A derivative child’s age can affect eligibility. CSPA may apply; this planner does not calculate CSPA age or age-out risk.')
    if (!petitionFiledDate || !petitionApprovedDate) {
      cautions.push('Petition filing and approval dates are incomplete for any case-specific CSPA review.')
    }
  }
  if (supportDocsReady === false && route !== 'employmentBased') {
    cautions.push('Sponsor financial evidence is marked incomplete; verify the affidavit of support requirements for this case.')
  }
  if (medicalComplete === false && ['interview', 'administrativeProcessing'].includes(caseStage)) {
    cautions.push('Medical exam is marked incomplete. Follow the instructions for the selected processing route and consular post.')
  }

  return {
    categoryName: isImmediateRelative ? 'Immediate relative' : category?.name ?? categoryCode,
    finalAction,
    filingGate,
    nextStep,
    stages,
    cautions,
    processingLocation: processingLocation.trim(),
    processingEstimate: 'Not available: official form- and office-level processing-time data is not connected.',
    sourcePeriod: `${bulletin.bulletin.month} ${bulletin.bulletin.year}`,
  }
}

function getPostPetitionStep(input) {
  const { path, caseStage, biometricsComplete, medicalComplete, supportDocsReady, interviewComplete } = input
  if (path === 'adjustment') {
    if (caseStage === 'approved') return makeStep('Adjustment of status approved', 'Follow the official notice for the next steps.', 'complete')
    if (caseStage === 'notFiled') return makeStep('Prepare the adjustment of status filing', 'Confirm filing eligibility and current USCIS instructions before submitting Form I-485.')
    if (caseStage === 'rfe') return makeStep('Respond to the request for evidence', 'Use the deadline and response method on the official notice.', 'caution')
    if (!biometricsComplete) return makeStep('Complete biometrics when scheduled', 'Use the appointment notice for date, location, and rescheduling instructions.')
    if (!medicalComplete) return makeStep('Check medical exam requirements', 'Follow the current USCIS instructions for Form I-693 and whether it is due with or after filing.')
    if (!supportDocsReady && input.route !== 'employmentBased') return makeStep('Complete sponsor financial evidence', 'Confirm Form I-864 and supporting-document requirements for this family case.')
    if (!interviewComplete && caseStage !== 'finalReview') return makeStep('Monitor interview scheduling', 'USCIS may schedule or waive an interview; follow case-specific notices.')
    return makeStep('Monitor the pending adjustment case', 'No reliable adjudication estimate is available for this office in the app.')
  }
  if (caseStage === 'issued') return makeStep('Immigrant visa issued', 'Follow the visa and entry instructions from the consular post.', 'complete')
  if (caseStage === 'administrativeProcessing') return makeStep('Follow consular administrative-processing instructions', 'Timing depends on case-specific review and is not predictable from bulletin data.', 'caution')
  if (caseStage === 'interview') {
    if (!medicalComplete) return makeStep('Complete the required medical exam', 'Schedule with an authorized panel physician according to the consular post instructions.')
    return makeStep('Attend or follow up on the consular interview', 'Bring the requested originals and follow any post-interview instructions.')
  }
  if (caseStage === 'qualified') return makeStep('Wait for interview scheduling', 'Scheduling depends on visa availability and consular-post capacity; no post-level queue data is connected.', 'wait')
  if (caseStage === 'documentReview') return makeStep('Complete NVC fees and document submission', 'Submit the DS-260, civil documents, and affidavit-of-support materials requested for the case.')
  return makeStep('Begin National Visa Center processing', 'Follow the NVC case-creation and document-submission instructions after petition approval.')
}