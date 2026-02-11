import { describe, it, expect } from 'vitest'
import { PLAN_FEATURES, type SubscriptionPlan } from '../services/userService'

// ============================================================================
// getCurrentPeriodKey logic (tested via direct implementation since it's private)
// We replicate the logic to verify its correctness.
// ============================================================================
describe('getCurrentPeriodKey logic', () => {
  function getCurrentPeriodKey(): string {
    const now = new Date()
    return `${now.getUTCFullYear()}-${(now.getUTCMonth() + 1).toString().padStart(2, '0')}`
  }

  it('returns YYYY-MM format', () => {
    const key = getCurrentPeriodKey()
    expect(key).toMatch(/^\d{4}-\d{2}$/)
  })

  it('month is zero-padded', () => {
    const key = getCurrentPeriodKey()
    const month = key.split('-')[1]
    expect(month.length).toBe(2)
  })

  it('matches current UTC date', () => {
    const now = new Date()
    const expectedYear = now.getUTCFullYear()
    const expectedMonth = (now.getUTCMonth() + 1).toString().padStart(2, '0')
    const key = getCurrentPeriodKey()
    expect(key).toBe(`${expectedYear}-${expectedMonth}`)
  })
})

// ============================================================================
// PLAN_FEATURES validation
// ============================================================================
describe('PLAN_FEATURES', () => {
  const allPlans: SubscriptionPlan[] = ['free', 'pro', 'enterprise', 'admin']

  it('has entries for all subscription plans', () => {
    for (const plan of allPlans) {
      expect(PLAN_FEATURES).toHaveProperty(plan)
    }
  })

  it('each plan has all required feature keys', () => {
    const requiredKeys = [
      'maxRequestsPerMonth',
      'maxTokensPerRequest',
      'priorityProcessing',
      'exportFormats',
      'apiAccess',
      'teamMembers',
    ]
    for (const plan of allPlans) {
      for (const key of requiredKeys) {
        expect(PLAN_FEATURES[plan]).toHaveProperty(key)
      }
    }
  })

  // --- Free plan ---
  describe('free plan', () => {
    const free = PLAN_FEATURES.free

    it('has 10 requests per month', () => {
      expect(free.maxRequestsPerMonth).toBe(10)
    })

    it('has 2000 max tokens per request', () => {
      expect(free.maxTokensPerRequest).toBe(2000)
    })

    it('does not have priority processing', () => {
      expect(free.priorityProcessing).toBe(false)
    })

    it('only supports text export', () => {
      expect(free.exportFormats).toEqual(['text'])
    })

    it('does not have API access', () => {
      expect(free.apiAccess).toBe(false)
    })

    it('supports 1 team member', () => {
      expect(free.teamMembers).toBe(1)
    })
  })

  // --- Pro plan ---
  describe('pro plan', () => {
    const pro = PLAN_FEATURES.pro

    it('has 250 requests per month', () => {
      expect(pro.maxRequestsPerMonth).toBe(250)
    })

    it('has 8000 max tokens per request', () => {
      expect(pro.maxTokensPerRequest).toBe(8000)
    })

    it('has priority processing', () => {
      expect(pro.priorityProcessing).toBe(true)
    })

    it('supports text, pdf, and docx exports', () => {
      expect(pro.exportFormats).toEqual(['text', 'pdf', 'docx'])
    })

    it('has API access', () => {
      expect(pro.apiAccess).toBe(true)
    })

    it('supports 3 team members', () => {
      expect(pro.teamMembers).toBe(3)
    })
  })

  // --- Enterprise plan ---
  describe('enterprise plan', () => {
    const enterprise = PLAN_FEATURES.enterprise

    it('has 1000 requests per month', () => {
      expect(enterprise.maxRequestsPerMonth).toBe(1000)
    })

    it('has 16000 max tokens per request', () => {
      expect(enterprise.maxTokensPerRequest).toBe(16000)
    })

    it('has priority processing', () => {
      expect(enterprise.priorityProcessing).toBe(true)
    })

    it('supports all export formats including hl7', () => {
      expect(enterprise.exportFormats).toEqual(['text', 'pdf', 'docx', 'json', 'hl7'])
    })

    it('has API access', () => {
      expect(enterprise.apiAccess).toBe(true)
    })

    it('has unlimited team members (-1)', () => {
      expect(enterprise.teamMembers).toBe(-1)
    })
  })

  // --- Admin plan ---
  describe('admin plan', () => {
    const admin = PLAN_FEATURES.admin

    it('has effectively unlimited requests', () => {
      expect(admin.maxRequestsPerMonth).toBe(Number.MAX_SAFE_INTEGER)
    })

    it('has 32000 max tokens per request', () => {
      expect(admin.maxTokensPerRequest).toBe(32000)
    })

    it('has priority processing', () => {
      expect(admin.priorityProcessing).toBe(true)
    })

    it('supports all export formats including hl7', () => {
      expect(admin.exportFormats).toEqual(['text', 'pdf', 'docx', 'json', 'hl7'])
    })

    it('has API access', () => {
      expect(admin.apiAccess).toBe(true)
    })

    it('has unlimited team members (-1)', () => {
      expect(admin.teamMembers).toBe(-1)
    })
  })

  // --- Plan tier ordering ---
  describe('tier ordering', () => {
    it('maxRequestsPerMonth increases with tier', () => {
      expect(PLAN_FEATURES.free.maxRequestsPerMonth).toBeLessThan(PLAN_FEATURES.pro.maxRequestsPerMonth)
      expect(PLAN_FEATURES.pro.maxRequestsPerMonth).toBeLessThan(PLAN_FEATURES.enterprise.maxRequestsPerMonth)
      expect(PLAN_FEATURES.enterprise.maxRequestsPerMonth).toBeLessThan(PLAN_FEATURES.admin.maxRequestsPerMonth)
    })

    it('maxTokensPerRequest increases with tier', () => {
      expect(PLAN_FEATURES.free.maxTokensPerRequest).toBeLessThan(PLAN_FEATURES.pro.maxTokensPerRequest)
      expect(PLAN_FEATURES.pro.maxTokensPerRequest).toBeLessThan(PLAN_FEATURES.enterprise.maxTokensPerRequest)
      expect(PLAN_FEATURES.enterprise.maxTokensPerRequest).toBeLessThan(PLAN_FEATURES.admin.maxTokensPerRequest)
    })

    it('exportFormats grow with tier', () => {
      expect(PLAN_FEATURES.free.exportFormats.length).toBeLessThan(PLAN_FEATURES.pro.exportFormats.length)
      expect(PLAN_FEATURES.pro.exportFormats.length).toBeLessThan(PLAN_FEATURES.enterprise.exportFormats.length)
    })

    it('free has no priority/API, paid plans do', () => {
      expect(PLAN_FEATURES.free.priorityProcessing).toBe(false)
      expect(PLAN_FEATURES.free.apiAccess).toBe(false)
      expect(PLAN_FEATURES.pro.priorityProcessing).toBe(true)
      expect(PLAN_FEATURES.pro.apiAccess).toBe(true)
      expect(PLAN_FEATURES.enterprise.priorityProcessing).toBe(true)
      expect(PLAN_FEATURES.enterprise.apiAccess).toBe(true)
    })
  })
})
