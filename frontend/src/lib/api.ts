// Frontend API client for MDM Generator

import type {
  OrderSet,
  DispositionFlow,
  ReportTemplate,
  CustomizableOptions,
} from '../types/userProfile'

/**
 * Custom API error class with user-friendly messages and error classification
 */
export class ApiError extends Error {
  statusCode: number
  errorType: 'network' | 'auth' | 'validation' | 'quota' | 'server' | 'unknown'
  isRetryable: boolean

  constructor(
    message: string,
    statusCode: number,
    errorType: 'network' | 'auth' | 'validation' | 'quota' | 'server' | 'unknown',
    isRetryable: boolean = false
  ) {
    super(message)
    this.name = 'ApiError'
    this.statusCode = statusCode
    this.errorType = errorType
    this.isRetryable = isRetryable
  }

  static fromResponse(res: Response, context?: string): ApiError {
    const prefix = context ? `${context}: ` : ''

    switch (res.status) {
      case 401:
        return new ApiError(
          `${prefix}Your session has expired. Please sign in again.`,
          401,
          'auth',
          false
        )
      case 403:
        return new ApiError(
          `${prefix}You don't have permission to perform this action.`,
          403,
          'auth',
          false
        )
      case 400:
        return new ApiError(
          `${prefix}Invalid request. Please check your input and try again.`,
          400,
          'validation',
          false
        )
      case 429:
        return new ApiError(
          `${prefix}You've reached your usage limit. Please upgrade your plan or wait until your quota resets.`,
          429,
          'quota',
          false
        )
      case 500:
      case 502:
      case 503:
        return new ApiError(
          `${prefix}The server is temporarily unavailable. Please try again in a moment.`,
          res.status,
          'server',
          true
        )
      case 504:
        return new ApiError(
          `${prefix}The request timed out. Please try again.`,
          504,
          'server',
          true
        )
      default:
        return new ApiError(
          `${prefix}An unexpected error occurred. Please try again.`,
          res.status,
          'unknown',
          res.status >= 500
        )
    }
  }

  static networkError(context?: string): ApiError {
    const prefix = context ? `${context}: ` : ''
    return new ApiError(
      `${prefix}Unable to connect. Please check your internet connection and try again.`,
      0,
      'network',
      true
    )
  }
}

/**
 * Wrapper for fetch with standardized error handling
 */
async function apiFetch<T>(
  url: string,
  options: RequestInit,
  context?: string,
  timeoutMs: number = 30_000
): Promise<T> {
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs)
  try {
    const res = await fetch(url, { ...options, signal: controller.signal })

    if (!res.ok) {
      // Try to parse error response for more specific message
      try {
        const errorData = await res.json()
        if (errorData.error && typeof errorData.error === 'string') {
          const error = ApiError.fromResponse(res, context)
          // Use server-provided message if it's user-friendly
          if (!errorData.error.includes('Error:') && errorData.error.length < 200) {
            error.message = errorData.error
          }
          throw error
        }
      } catch (parseError) {
        if (parseError instanceof ApiError) throw parseError
        // Fall through to default error
      }
      throw ApiError.fromResponse(res, context)
    }

    return res.json()
  } catch (error) {
    if (error instanceof ApiError) throw error
    if (error instanceof DOMException && error.name === 'AbortError') {
      throw new ApiError(
        `${context ? `${context}: ` : ''}Request timed out. Please try again.`,
        0,
        'network',
        true
      )
    }
    if (error instanceof TypeError && error.message.includes('fetch')) {
      throw ApiError.networkError(context)
    }
    throw ApiError.networkError(context)
  } finally {
    clearTimeout(timeoutId)
  }
}

export type GenerateRequest = {
  narrative: string
  userIdToken?: string
}

export type GenerateResponse = {
  ok: boolean
  guideBytes: number
  draft: string
  uid?: string
  remaining?: number
}

export async function whoAmI(userIdToken: string): Promise<{
  ok: boolean
  uid: string
  email?: string
  plan: 'free' | 'pro' | 'enterprise'
  used: number
  limit: number
  remaining: number
  percentUsed: number
  periodKey: string
  features: {
    maxRequestsPerMonth: number
    maxTokensPerRequest: number
    priorityProcessing: boolean
    exportFormats: string[]
    apiAccess: boolean
    teamMembers: number
  }
}> {
  const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080'
  return apiFetch(
    `${apiBaseUrl}/v1/whoami`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userIdToken }),
    },
    'Authentication check'
  )
}

export async function generateMDM(body: GenerateRequest): Promise<GenerateResponse> {
  const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080'
  return apiFetch(
    `${apiBaseUrl}/v1/generate`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    },
    'MDM generation',
    60_000
  )
}

export interface ParseNarrativeResponse {
  ok: boolean
  parsed: {
    chiefComplaint?: { complaint?: string; context?: string; age?: string; sex?: string }
    problemsConsidered?: { emergent?: string[]; nonEmergent?: string[] }
    dataReviewed?: {
      labs?: string
      imaging?: string
      ekg?: string
      externalRecords?: string
      independentHistorian?: string
    }
    riskAssessment?: {
      patientFactors?: string
      diagnosticRisks?: string
      treatmentRisks?: string
      dispositionRisks?: string
      highestRiskElement?: string
    }
    clinicalReasoning?: {
      evaluationApproach?: string
      keyDecisionPoints?: string
      workingDiagnosis?: string
    }
    treatmentProcedures?: { medications?: string; procedures?: string; rationale?: string }
    disposition?: {
      decision?: string
      levelOfCare?: string
      rationale?: string
      dischargeInstructions?: string
      followUp?: string
      returnPrecautions?: string
    }
  }
  confidence: number
  warnings?: string[]
}

export async function parseNarrative(
  narrative: string,
  userIdToken: string
): Promise<ParseNarrativeResponse> {
  const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080'
  return apiFetch(
    `${apiBaseUrl}/v1/parse-narrative`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ narrative, userIdToken }),
    },
    'Narrative parsing',
    60_000
  )
}

// =============================================================================
// Build Mode API Types & Functions
// =============================================================================

export interface DifferentialItem {
  diagnosis: string
  urgency: 'emergent' | 'urgent' | 'routine'
  reasoning: string
}

export interface MdmPreview {
  problems: string | string[] | Record<string, unknown>[]
  differential: string | string[] | Record<string, unknown>[]
  dataReviewed: string | string[] | Record<string, unknown>[]
  reasoning: string
}

export interface FinalMdm {
  text: string
  json: Record<string, unknown>
}

export interface Section1Response {
  differential: DifferentialItem[]
  submissionCount: number
  isLocked: boolean
  quotaRemaining: number
}

export interface Section2Response {
  mdmPreview: MdmPreview
  submissionCount: number
  isLocked: boolean
}

export interface FinalizeResponse {
  finalMdm: FinalMdm
  quotaRemaining: number
}

/**
 * Process Section 1 (Initial Evaluation) - generates differential diagnosis
 */
export async function processSection1(
  encounterId: string,
  content: string,
  userIdToken: string,
  location?: { zipCode?: string; state?: string }
): Promise<Section1Response> {
  const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080'
  return apiFetch(
    `${apiBaseUrl}/v1/build-mode/process-section1`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ encounterId, content, userIdToken, ...(location && { location }) }),
    },
    'Section 1 processing',
    60_000
  )
}

/**
 * Process Section 2 (Workup & Results) - generates MDM preview
 */
export async function processSection2(
  encounterId: string,
  content: string,
  userIdToken: string,
  workingDiagnosis?: string
): Promise<Section2Response> {
  const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080'
  return apiFetch(
    `${apiBaseUrl}/v1/build-mode/process-section2`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ encounterId, content, userIdToken, workingDiagnosis }),
    },
    'Section 2 processing',
    60_000
  )
}

/**
 * Finalize encounter (Section 3 - Treatment & Disposition) - generates final MDM
 */
export async function finalizeEncounter(
  encounterId: string,
  content: string,
  userIdToken: string
): Promise<FinalizeResponse> {
  const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080'
  return apiFetch(
    `${apiBaseUrl}/v1/build-mode/finalize`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ encounterId, content, userIdToken }),
    },
    'Encounter finalization',
    120_000
  )
}

// =============================================================================
// Quick Mode API Types & Functions
// =============================================================================

export interface PatientIdentifier {
  age?: string
  sex?: string
  chiefComplaint?: string
}

export interface QuickModeResponse {
  ok: boolean
  mdm: {
    text: string
    json: Record<string, unknown>
  }
  patientIdentifier: PatientIdentifier
  quotaRemaining: number
}

/**
 * Generate MDM in Quick Mode - one-shot processing with patient identifier extraction
 */
export async function generateQuickMode(
  encounterId: string,
  narrative: string,
  userIdToken: string,
  location?: { zipCode?: string; state?: string }
): Promise<QuickModeResponse> {
  const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080'
  return apiFetch(
    `${apiBaseUrl}/v1/quick-mode/generate`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ encounterId, narrative, userIdToken, ...(location && { location }) }),
    },
    'Quick mode MDM generation',
    60_000
  )
}

// =============================================================================
// User Profile CRUD API Functions
// =============================================================================

// ── Order Sets ─────────────────────────────────────────────────────────

export async function getOrderSets(userIdToken: string): Promise<{ ok: boolean; items: OrderSet[] }> {
  const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080'
  return apiFetch(
    `${apiBaseUrl}/v1/user/order-sets`,
    {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${userIdToken}`,
      },
    },
    'Fetching order sets'
  )
}

export async function createOrderSet(
  userIdToken: string,
  data: { name: string; tests: string[]; tags?: string[] }
): Promise<{ ok: boolean; item: OrderSet }> {
  const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080'
  return apiFetch(
    `${apiBaseUrl}/v1/user/order-sets`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${userIdToken}`,
      },
      body: JSON.stringify(data),
    },
    'Creating order set'
  )
}

export async function updateOrderSet(
  userIdToken: string,
  id: string,
  data: { name: string; tests: string[]; tags?: string[] }
): Promise<{ ok: boolean; item: OrderSet }> {
  const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080'
  return apiFetch(
    `${apiBaseUrl}/v1/user/order-sets/${id}`,
    {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${userIdToken}`,
      },
      body: JSON.stringify(data),
    },
    'Updating order set'
  )
}

export async function deleteOrderSet(
  userIdToken: string,
  id: string
): Promise<{ ok: boolean; id: string }> {
  const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080'
  return apiFetch(
    `${apiBaseUrl}/v1/user/order-sets/${id}`,
    {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${userIdToken}`,
      },
    },
    'Deleting order set'
  )
}

export async function useOrderSet(
  userIdToken: string,
  id: string
): Promise<{ ok: boolean; usageCount: number }> {
  const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080'
  return apiFetch(
    `${apiBaseUrl}/v1/user/order-sets/${id}/use`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${userIdToken}`,
      },
    },
    'Recording order set usage'
  )
}

// ── Disposition Flows ──────────────────────────────────────────────────

export async function getDispoFlows(userIdToken: string): Promise<{ ok: boolean; items: DispositionFlow[] }> {
  const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080'
  return apiFetch(
    `${apiBaseUrl}/v1/user/dispo-flows`,
    {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${userIdToken}`,
      },
    },
    'Fetching disposition flows'
  )
}

export async function createDispoFlow(
  userIdToken: string,
  data: { name: string; disposition: string; followUp?: string[] }
): Promise<{ ok: boolean; item: DispositionFlow }> {
  const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080'
  return apiFetch(
    `${apiBaseUrl}/v1/user/dispo-flows`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${userIdToken}`,
      },
      body: JSON.stringify(data),
    },
    'Creating disposition flow'
  )
}

export async function updateDispoFlow(
  userIdToken: string,
  id: string,
  data: { name: string; disposition: string; followUp?: string[] }
): Promise<{ ok: boolean; item: DispositionFlow }> {
  const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080'
  return apiFetch(
    `${apiBaseUrl}/v1/user/dispo-flows/${id}`,
    {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${userIdToken}`,
      },
      body: JSON.stringify(data),
    },
    'Updating disposition flow'
  )
}

export async function deleteDispoFlow(
  userIdToken: string,
  id: string
): Promise<{ ok: boolean; id: string }> {
  const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080'
  return apiFetch(
    `${apiBaseUrl}/v1/user/dispo-flows/${id}`,
    {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${userIdToken}`,
      },
    },
    'Deleting disposition flow'
  )
}

export async function useDispoFlow(
  userIdToken: string,
  id: string
): Promise<{ ok: boolean; usageCount: number }> {
  const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080'
  return apiFetch(
    `${apiBaseUrl}/v1/user/dispo-flows/${id}/use`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${userIdToken}`,
      },
    },
    'Recording disposition flow usage'
  )
}

// ── Report Templates ───────────────────────────────────────────────────

export async function getReportTemplates(userIdToken: string): Promise<{ ok: boolean; items: ReportTemplate[] }> {
  const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080'
  return apiFetch(
    `${apiBaseUrl}/v1/user/report-templates`,
    {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${userIdToken}`,
      },
    },
    'Fetching report templates'
  )
}

export async function createReportTemplate(
  userIdToken: string,
  data: { testId: string; name: string; text: string; defaultStatus: 'unremarkable' | 'abnormal' }
): Promise<{ ok: boolean; item: ReportTemplate }> {
  const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080'
  return apiFetch(
    `${apiBaseUrl}/v1/user/report-templates`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${userIdToken}`,
      },
      body: JSON.stringify(data),
    },
    'Creating report template'
  )
}

export async function updateReportTemplate(
  userIdToken: string,
  id: string,
  data: { testId: string; name: string; text: string; defaultStatus: 'unremarkable' | 'abnormal' }
): Promise<{ ok: boolean; item: ReportTemplate }> {
  const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080'
  return apiFetch(
    `${apiBaseUrl}/v1/user/report-templates/${id}`,
    {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${userIdToken}`,
      },
      body: JSON.stringify(data),
    },
    'Updating report template'
  )
}

export async function deleteReportTemplate(
  userIdToken: string,
  id: string
): Promise<{ ok: boolean; id: string }> {
  const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080'
  return apiFetch(
    `${apiBaseUrl}/v1/user/report-templates/${id}`,
    {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${userIdToken}`,
      },
    },
    'Deleting report template'
  )
}

export async function useReportTemplate(
  userIdToken: string,
  id: string
): Promise<{ ok: boolean; usageCount: number }> {
  const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080'
  return apiFetch(
    `${apiBaseUrl}/v1/user/report-templates/${id}/use`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${userIdToken}`,
      },
    },
    'Recording report template usage'
  )
}

// ── Customizable Options ───────────────────────────────────────────────

export async function getCustomizableOptions(userIdToken: string): Promise<{ ok: boolean; options: CustomizableOptions }> {
  const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080'
  return apiFetch(
    `${apiBaseUrl}/v1/user/options`,
    {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${userIdToken}`,
      },
    },
    'Fetching customizable options'
  )
}

export async function updateCustomizableOptions(
  userIdToken: string,
  data: CustomizableOptions
): Promise<{ ok: boolean; options: CustomizableOptions }> {
  const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080'
  return apiFetch(
    `${apiBaseUrl}/v1/user/options`,
    {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${userIdToken}`,
      },
      body: JSON.stringify(data),
    },
    'Updating customizable options'
  )
}

// =============================================================================
// Test Library API Functions
// =============================================================================

/**
 * Fetch the master test library (test definitions and categories)
 */
export async function fetchTestLibrary(
  userIdToken: string
): Promise<import('../types/libraries').TestLibraryResponse> {
  const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080'
  return apiFetch(
    `${apiBaseUrl}/v1/libraries/tests`,
    {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${userIdToken}`,
      },
    },
    'Fetching test library'
  )
}

// =============================================================================
// Surveillance Trend Analysis API Functions
// =============================================================================

export async function analyzeSurveillance(
  chiefComplaint: string,
  differential: string[],
  location: { zipCode?: string; state?: string },
  userIdToken: string,
  encounterId?: string
): Promise<{
  ok: boolean
  analysis: import('../types/surveillance').TrendAnalysisResult | null
  warnings?: string[]
}> {
  const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080'
  return apiFetch(
    `${apiBaseUrl}/v1/surveillance/analyze`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chiefComplaint, differential, location, userIdToken, encounterId }),
    },
    'Surveillance analysis',
    30_000
  )
}

export async function downloadSurveillanceReport(
  analysisId: string,
  userIdToken: string
): Promise<Blob> {
  const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080'
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), 30_000)

  try {
    const res = await fetch(`${apiBaseUrl}/v1/surveillance/report`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ analysisId, userIdToken }),
      signal: controller.signal,
    })

    if (!res.ok) {
      throw ApiError.fromResponse(res, 'PDF download')
    }

    return await res.blob()
  } catch (error) {
    if (error instanceof ApiError) throw error
    throw ApiError.networkError('PDF download')
  } finally {
    clearTimeout(timeoutId)
  }
}