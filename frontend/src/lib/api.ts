// Simple frontend API client placeholder for future integration
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
  const res = await fetch(`${apiBaseUrl}/v1/whoami`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userIdToken }),
  })
  if (!res.ok) throw new Error(`Request failed: ${res.status}`)
  return res.json()
}

export async function generateMDM(body: GenerateRequest): Promise<GenerateResponse> {
  const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080'
  const res = await fetch(`${apiBaseUrl}/v1/generate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  if (!res.ok) throw new Error(`Request failed: ${res.status}`)
  return res.json()
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
  const res = await fetch(`${apiBaseUrl}/v1/parse-narrative`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ narrative, userIdToken }),
  })
  if (!res.ok) throw new Error(`Request failed: ${res.status}`)
  return res.json()
}