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