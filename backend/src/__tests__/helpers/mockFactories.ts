/**
 * Mock factories for backend integration tests.
 * Provides reusable mock objects for Firebase Admin, Vertex AI, and userService.
 *
 * IMPORTANT: All medical content here is fictional / educational only. No PHI.
 */

import { vi } from 'vitest'
import type { PLAN_FEATURES, UserDocument } from '../../services/userService'

// ---------------------------------------------------------------------------
// Firebase Auth mock helpers
// ---------------------------------------------------------------------------

export const VALID_TOKEN = 'a]valid-firebase-token-with-enough-length'
export const ADMIN_TOKEN = 'admin-firebase-token-with-enough-length!!!'
export const SHORT_TOKEN = '123456789' // exactly 9 chars – below min(10)
export const INVALID_TOKEN = 'invalid-firebase-token-will-throw-error'

export function makeDecodedToken(overrides: Record<string, unknown> = {}) {
  return {
    uid: 'test-user-123',
    email: 'doc@example.com',
    admin: false,
    ...overrides,
  }
}

// ---------------------------------------------------------------------------
// Firestore document snapshot helpers
// ---------------------------------------------------------------------------

export function makeDocSnap(data: Record<string, unknown> | null) {
  return {
    exists: data !== null,
    data: () => data,
    id: 'snap-id',
  }
}

export function makeEncounterSnap(overrides: Record<string, unknown> = {}) {
  return makeDocSnap({
    mode: 'build',
    status: 'draft',
    chiefComplaint: 'test complaint',
    quotaCounted: false,
    section1: { status: 'pending', submissionCount: 0 },
    section2: { status: 'pending', submissionCount: 0 },
    section3: { status: 'pending', submissionCount: 0 },
    ...overrides,
  })
}

// ---------------------------------------------------------------------------
// User service return stubs
// ---------------------------------------------------------------------------

const FREE_FEATURES: UserDocument['features'] = {
  maxRequestsPerMonth: 10,
  maxTokensPerRequest: 2000,
  priorityProcessing: false,
  exportFormats: ['text'],
  apiAccess: false,
  teamMembers: 1,
}

export function makeUsageStats(overrides: Record<string, unknown> = {}) {
  return {
    plan: 'free' as const,
    used: 2,
    limit: 10,
    remaining: 8,
    percentUsed: 20,
    periodKey: '2026-02',
    features: FREE_FEATURES,
    ...overrides,
  }
}

export function makeQuotaCheck(overrides: Record<string, unknown> = {}) {
  return {
    allowed: true,
    used: 2,
    limit: 10,
    remaining: 8,
    ...overrides,
  }
}

// ---------------------------------------------------------------------------
// Vertex AI / callGeminiFlash stubs
// ---------------------------------------------------------------------------

/** Valid MDM JSON the model would return for /v1/generate */
export const VALID_MDM_MODEL_RESPONSE = JSON.stringify({
  differential: ['Acute coronary syndrome', 'Pulmonary embolism', 'Costochondritis'],
  data_reviewed_ordered: 'EKG, troponin, chest X-ray reviewed. D-dimer ordered.',
  decision_making:
    'Worst-first approach: ACS ruled out with serial troponins and EKG. PE low probability by Wells.',
  risk: ['Discussed risks/benefits of discharge', 'Return precautions given'],
  disposition: 'Discharge with cardiology follow-up in 48 hours',
  disclaimers: 'Educational draft. Physician must review. No PHI.',
}) + '\n---TEXT---\nDifferential:\n- Acute coronary syndrome\n- PE\n- Costochondritis'

/** Malformed model output (not valid JSON) */
export const MALFORMED_MODEL_RESPONSE = 'This is not JSON at all <html>oops</html>'

/** Valid parse-narrative model response */
export const VALID_PARSE_RESPONSE = JSON.stringify({
  chiefComplaint: { complaint: 'chest pain', context: 'acute onset', age: '55', sex: 'M' },
  problemsConsidered: { emergent: ['ACS', 'PE'], nonEmergent: ['GERD'] },
  dataReviewed: { labs: 'troponin negative', imaging: 'CXR normal', ekg: 'NSR', externalRecords: '', independentHistorian: '' },
  riskAssessment: { patientFactors: 'HTN', diagnosticRisks: '', treatmentRisks: '', dispositionRisks: '', highestRiskElement: 'ACS risk' },
  clinicalReasoning: { evaluationApproach: 'serial troponins', keyDecisionPoints: 'HEART score', workingDiagnosis: 'atypical chest pain' },
  treatmentProcedures: { medications: 'aspirin', procedures: '', rationale: 'ACS protocol' },
  disposition: { decision: 'discharge', levelOfCare: 'home', rationale: 'low risk', dischargeInstructions: 'return if worse', followUp: 'PCP 48h', returnPrecautions: 'recurrent pain' },
  confidence: 0.85,
  warnings: [],
})

/** Valid section-1 differential response */
export const VALID_SECTION1_RESPONSE = JSON.stringify([
  { diagnosis: 'Acute MI', urgency: 'emergent', reasoning: 'Chest pain with risk factors' },
  { diagnosis: 'Pulmonary embolism', urgency: 'emergent', reasoning: 'Dyspnea and tachycardia' },
  { diagnosis: 'Costochondritis', urgency: 'routine', reasoning: 'Reproducible tenderness' },
])

/** Valid section-2 MDM preview response */
export const VALID_SECTION2_RESPONSE = JSON.stringify({
  problems: ['Chest pain', 'Hypertension'],
  differential: ['ACS', 'PE', 'Costochondritis'],
  dataReviewed: ['EKG', 'Troponin', 'D-dimer'],
  reasoning: 'Serial troponins negative, EKG unchanged, PE unlikely by Wells criteria.',
})

/** Valid finalize response */
export const VALID_FINALIZE_RESPONSE = JSON.stringify({
  text: 'MDM: Differential includes ACS, PE. Data reviewed: EKG, troponin. Disposition: discharge.',
  json: {
    problems: ['Chest pain'],
    differential: ['ACS', 'PE'],
    dataReviewed: ['EKG', 'Troponin'],
    reasoning: 'Worst-first approach applied. ACS ruled out.',
    risk: ['Return precautions given'],
    disposition: 'Discharge home with cardiology follow-up',
    complexityLevel: 'high',
  },
})

/** Valid quick-mode model response */
export const VALID_QUICK_MODE_RESPONSE = JSON.stringify({
  patientIdentifier: { age: '55', sex: 'M', chiefComplaint: 'chest pain' },
  mdm: {
    text: 'MDM: 55M with chest pain. Differential: ACS, PE. Disposition: discharge.',
    json: {
      problems: ['Chest pain'],
      differential: [{ diagnosis: 'ACS', urgency: 'emergent', reasoning: 'risk factors' }],
      dataReviewed: ['EKG', 'Troponin'],
      reasoning: 'Worst-first approach. ACS ruled out with serial troponins.',
      risk: ['Return precautions given'],
      disposition: 'Discharge',
      complexityLevel: 'high',
    },
  },
})

// ---------------------------------------------------------------------------
// Sample narrative (fictional, educational only)
// ---------------------------------------------------------------------------

export const SAMPLE_NARRATIVE =
  '55 year old male presenting with acute onset substernal chest pain radiating to left arm. ' +
  'Pain started 2 hours ago at rest. History of hypertension and hyperlipidemia. ' +
  'Vitals stable. EKG shows normal sinus rhythm. Troponin pending.'
