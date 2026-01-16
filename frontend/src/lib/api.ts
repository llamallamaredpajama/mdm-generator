// Frontend API client for MDM Generator

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
  context?: string
): Promise<T> {
  try {
    const res = await fetch(url, options)

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
    if (error instanceof TypeError && error.message.includes('fetch')) {
      throw ApiError.networkError(context)
    }
    throw ApiError.networkError(context)
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
    'MDM generation'
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
    'Narrative parsing'
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
  problems: string
  differential: string
  dataReviewed: string
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
  userIdToken: string
): Promise<Section1Response> {
  const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080'
  return apiFetch(
    `${apiBaseUrl}/v1/build-mode/process-section1`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ encounterId, content, userIdToken }),
    },
    'Section 1 processing'
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
    'Section 2 processing'
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
    'Encounter finalization'
  )
}