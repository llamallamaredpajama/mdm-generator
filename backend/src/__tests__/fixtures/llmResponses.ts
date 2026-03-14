/**
 * Captured LLM response fixtures for response parser testing.
 *
 * IMPORTANT: All medical content is fictional / educational only. No PHI.
 */

// ============================================================================
// Section 1 Fixtures
// ============================================================================

/** Clean JSON object with differential + CDR analysis */
export const S1_CLEAN_OBJECT = JSON.stringify({
  differential: [
    { diagnosis: 'Acute Coronary Syndrome', urgency: 'emergent', reasoning: 'Chest pain with risk factors' },
    { diagnosis: 'Pulmonary Embolism', urgency: 'emergent', reasoning: 'Acute onset dyspnea' },
    { diagnosis: 'Costochondritis', urgency: 'routine', reasoning: 'Reproducible chest wall pain' },
  ],
  cdrAnalysis: [
    { name: 'HEART Score', applicable: true, reason: 'Chest pain evaluation' },
    { name: 'PERC Rule', applicable: true, reason: 'PE evaluation' },
    { name: 'Ottawa Ankle', applicable: false, reason: 'Not relevant' },
  ],
  workupRecommendations: [
    { testName: 'Troponin', testId: 'troponin', reason: 'Rule out ACS', source: 'differential', priority: 'stat' },
  ],
})

/** Clean JSON array (legacy format) */
export const S1_LEGACY_ARRAY = JSON.stringify([
  { diagnosis: 'Appendicitis', urgency: 'urgent', reasoning: 'RLQ pain' },
  { diagnosis: 'Ovarian Torsion', urgency: 'emergent', reasoning: 'Acute pelvic pain' },
])

/** Code-fenced response */
export const S1_CODE_FENCED = '```json\n' + S1_CLEAN_OBJECT + '\n```'

/** Double-fenced response */
export const S1_DOUBLE_FENCED = '````json\n' + S1_CLEAN_OBJECT + '\n````'

/** Preamble text before JSON */
export const S1_WITH_PREAMBLE = 'Here is the differential diagnosis analysis:\n\n' + S1_CLEAN_OBJECT

/** Trailing commas (common LLM artifact) */
export const S1_TRAILING_COMMAS = JSON.stringify({
  differential: [
    { diagnosis: 'Meningitis', urgency: 'emergent', reasoning: 'Fever and neck stiffness' },
  ],
}).replace('}]', '},]').replace(']}', '],}')

/** Non-standard urgency values */
export const S1_NONSTANDARD_URGENCY = JSON.stringify({
  differential: [
    { diagnosis: 'STEMI', urgency: 'critical', reasoning: 'ST elevation' },
    { diagnosis: 'Gastritis', urgency: 'low', reasoning: 'Epigastric pain' },
    { diagnosis: 'Unstable Angina', urgency: 'high', reasoning: 'ACS spectrum' },
    { diagnosis: 'GERD', urgency: 'non-urgent', reasoning: 'Chronic symptoms' },
  ],
})

/** Completely unparseable garbage */
export const S1_UNPARSEABLE = 'This is not JSON at all. The patient has chest pain and I recommend further evaluation.'

/** Partial valid items (some fail Zod, some pass) */
export const S1_PARTIAL_VALID = JSON.stringify({
  differential: [
    { diagnosis: 'Valid Diagnosis', urgency: 'emergent', reasoning: 'Good reasoning' },
    { urgency: 'urgent' }, // missing diagnosis
    { diagnosis: 'Another Valid', urgency: 'routine', reasoning: 'Also good' },
  ],
})

// ============================================================================
// Finalize Fixtures
// ============================================================================

/** Clean finalize response */
export const FINALIZE_CLEAN = JSON.stringify({
  text: 'MEDICAL DECISION MAKING\n\nProblems Addressed:\n1. Chest pain\n\nAttestation: I personally performed...',
  json: {
    problems: ['Chest pain, acute'],
    differential: ['ACS', 'PE', 'Costochondritis'],
    dataReviewed: ['Troponin negative x2', 'ECG normal sinus rhythm'],
    reasoning: 'Serial troponins negative with normal ECG reduces ACS probability.',
    risk: ['Discussed risks of discharge vs admission'],
    disposition: 'Discharge with cardiology follow-up in 48 hours',
    complexityLevel: 'high',
  },
  gaps: [
    {
      id: 'gap-001',
      category: 'medicolegal',
      method: 'data_collection',
      title: 'Risk Stratification Tool Missing',
      description: 'No validated risk score documented',
      toggleItems: [{ id: 'add-heart-score', label: 'Add HEART Score', defaultValue: false }],
    },
  ],
})

/** Wrapped in { finalMdm: {...} } */
export const FINALIZE_WRAPPED = JSON.stringify({
  finalMdm: JSON.parse(FINALIZE_CLEAN),
})

/** Finalize with non-standard field names */
export const FINALIZE_ALT_FIELDS = JSON.stringify({
  text: 'MDM text content here',
  json: {
    problemsAddressed: ['Headache'],
    differential: ['Migraine', 'SAH'],
    dataReviewedOrdered: { labs: ['CBC normal'], imaging: ['CT head negative'] },
    clinicalReasoning: 'CT negative rules out SAH.',
    riskAssessment: { return: 'Return if thunderclap headache' },
    disposition: { decision: 'Discharge', levelOfCare: 'Home', rationale: 'Low risk' },
    complexityLevel: 'moderate',
  },
})

/** Invalid JSON that needs brace extraction */
export const FINALIZE_NEEDS_EXTRACTION = 'Here is the final MDM:\n\n' + FINALIZE_CLEAN + '\n\nPlease review.'

// ============================================================================
// Quick Mode Fixtures
// ============================================================================

/** Clean quick mode response */
export const QUICK_MODE_CLEAN = JSON.stringify({
  mdm: {
    text: 'MEDICAL DECISION MAKING\n\nComplete MDM text...',
    json: {
      problems: ['Ankle injury'],
      differential: ['Fracture', 'Sprain'],
      dataReviewed: ['X-ray ankle'],
      reasoning: 'Ottawa rules negative.',
      risk: ['Return if unable to bear weight'],
      disposition: 'Discharge with orthopedic follow-up',
      complexityLevel: 'low',
    },
  },
  patientIdentifier: {
    age: '34',
    sex: 'Female',
    chiefComplaint: 'Left ankle pain after fall',
  },
  gaps: [],
})

// ============================================================================
// Narrative Parse Fixtures
// ============================================================================

/** Clean narrative parse response */
export const NARRATIVE_CLEAN = JSON.stringify({
  chiefComplaint: {
    complaint: 'Chest pain',
    context: 'Acute onset, 2 hours ago',
    age: '55',
    sex: 'Male',
  },
  problemsConsidered: {
    emergent: ['ACS', 'PE', 'Aortic Dissection'],
    nonEmergent: ['GERD', 'Costochondritis'],
  },
  dataReviewed: {
    labs: 'Troponin, CBC, BMP',
    imaging: 'CXR, CT-PE protocol',
    ekg: '12-lead ECG',
    externalRecords: 'None',
    independentHistorian: 'Wife present',
  },
  riskAssessment: {
    patientFactors: 'HTN, DM, smoker',
    diagnosticRisks: 'High risk for ACS',
    treatmentRisks: 'Anticoagulation risk',
    dispositionRisks: 'Discharge risk if ACS missed',
    highestRiskElement: 'Missed ACS',
  },
  clinicalReasoning: {
    evaluationApproach: 'Serial troponins + ECG',
    keyDecisionPoints: 'Troponin trend',
    workingDiagnosis: 'Chest pain, rule out ACS',
  },
  treatmentProcedures: {
    medications: 'Aspirin, nitroglycerin PRN',
    procedures: 'IV access',
    rationale: 'Standard ACS workup',
  },
  disposition: {
    decision: 'Observation',
    levelOfCare: 'Chest pain unit',
    rationale: 'Awaiting serial troponins',
    dischargeInstructions: 'N/A (observation)',
    followUp: 'Cardiology',
    returnPrecautions: 'Return if worsening pain',
  },
  confidence: 0.85,
  warnings: [],
})
