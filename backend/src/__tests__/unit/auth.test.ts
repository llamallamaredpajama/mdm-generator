/**
 * Unit tests for createRequirePlan middleware.
 *
 * Tests plan-gating logic: free users blocked from pro features,
 * pro users allowed, admin bypass, and edge cases.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { createRequirePlan } from '../../middleware/auth.js'
import { AuthenticationError, AuthorizationError } from '../../errors.js'
import { createMockUserService } from '../helpers/mockDependencies.js'

// Mock firebase-admin to avoid initialization side effects
vi.mock('firebase-admin', () => ({
  default: {
    auth: () => ({
      verifyIdToken: vi.fn(),
    }),
  },
}))

// ============================================================================
// Helpers
// ============================================================================

function createMockReq(user?: { uid?: string; email?: string; admin?: boolean }) {
  return { user } as any
}

function createMockRes() {
  return {} as any
}

// ============================================================================
// Tests
// ============================================================================

describe('createRequirePlan', () => {
  let userService: ReturnType<typeof createMockUserService>

  beforeEach(() => {
    vi.clearAllMocks()
    userService = createMockUserService()
  })

  it('blocks free user from pro feature with AuthorizationError', async () => {
    userService.getUsageStats.mockResolvedValue({ plan: 'free' })
    const requirePlan = createRequirePlan(userService as any)
    const middleware = requirePlan('pro')
    const next = vi.fn()

    await middleware(createMockReq({ uid: 'u1' }), createMockRes(), next)

    expect(next).toHaveBeenCalledTimes(1)
    const err = next.mock.calls[0][0]
    expect(err).toBeInstanceOf(AuthorizationError)
    expect(err.statusCode).toBe(403)
  })

  it('includes upgradeRequired and requiredPlan in error details', async () => {
    userService.getUsageStats.mockResolvedValue({ plan: 'free' })
    const requirePlan = createRequirePlan(userService as any)
    const middleware = requirePlan('pro')
    const next = vi.fn()

    await middleware(createMockReq({ uid: 'u1' }), createMockRes(), next)

    const err = next.mock.calls[0][0] as AuthorizationError
    expect(err.details).toEqual(
      expect.objectContaining({ upgradeRequired: true, requiredPlan: 'pro' }),
    )
  })

  it('allows pro user for pro feature', async () => {
    userService.getUsageStats.mockResolvedValue({ plan: 'pro' })
    const requirePlan = createRequirePlan(userService as any)
    const middleware = requirePlan('pro')
    const next = vi.fn()

    await middleware(createMockReq({ uid: 'u1' }), createMockRes(), next)

    expect(next).toHaveBeenCalledWith() // called with no args = pass
  })

  it('allows enterprise user for pro feature', async () => {
    userService.getUsageStats.mockResolvedValue({ plan: 'enterprise' })
    const requirePlan = createRequirePlan(userService as any)
    const middleware = requirePlan('pro')
    const next = vi.fn()

    await middleware(createMockReq({ uid: 'u1' }), createMockRes(), next)

    expect(next).toHaveBeenCalledWith() // called with no args = pass
  })

  it('blocks pro user from enterprise feature', async () => {
    userService.getUsageStats.mockResolvedValue({ plan: 'pro' })
    const requirePlan = createRequirePlan(userService as any)
    const middleware = requirePlan('enterprise')
    const next = vi.fn()

    await middleware(createMockReq({ uid: 'u1' }), createMockRes(), next)

    const err = next.mock.calls[0][0]
    expect(err).toBeInstanceOf(AuthorizationError)
    expect(err.statusCode).toBe(403)
  })

  it('admin bypasses all plan checks', async () => {
    // getUsageStats should NOT be called for admin
    const requirePlan = createRequirePlan(userService as any)
    const middleware = requirePlan('enterprise')
    const next = vi.fn()

    await middleware(createMockReq({ uid: 'u1', admin: true }), createMockRes(), next)

    expect(next).toHaveBeenCalledWith() // called with no args = pass
    expect(userService.getUsageStats).not.toHaveBeenCalled()
  })

  it('returns AuthenticationError when uid is missing', async () => {
    const requirePlan = createRequirePlan(userService as any)
    const middleware = requirePlan('pro')
    const next = vi.fn()

    await middleware(createMockReq({}), createMockRes(), next)

    const err = next.mock.calls[0][0]
    expect(err).toBeInstanceOf(AuthenticationError)
  })

  it('returns AuthenticationError when user is undefined', async () => {
    const requirePlan = createRequirePlan(userService as any)
    const middleware = requirePlan('pro')
    const next = vi.fn()

    await middleware(createMockReq(), createMockRes(), next)

    const err = next.mock.calls[0][0]
    expect(err).toBeInstanceOf(AuthenticationError)
  })

  it('treats unknown plan as free tier (blocked from pro)', async () => {
    userService.getUsageStats.mockResolvedValue({ plan: 'unknown_plan' })
    const requirePlan = createRequirePlan(userService as any)
    const middleware = requirePlan('pro')
    const next = vi.fn()

    await middleware(createMockReq({ uid: 'u1' }), createMockRes(), next)

    const err = next.mock.calls[0][0]
    expect(err).toBeInstanceOf(AuthorizationError)
  })

  it('forwards unexpected errors via next', async () => {
    const dbError = new Error('Database connection lost')
    userService.getUsageStats.mockRejectedValue(dbError)
    const requirePlan = createRequirePlan(userService as any)
    const middleware = requirePlan('pro')
    const next = vi.fn()

    await middleware(createMockReq({ uid: 'u1' }), createMockRes(), next)

    expect(next).toHaveBeenCalledWith(dbError)
  })
})
