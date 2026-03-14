/**
 * Unit tests for the centralized error handler middleware.
 *
 * Verifies that each AppError subclass maps to the correct HTTP status code
 * and response body shape. Also tests ZodError handling and unknown errors.
 */

import { describe, it, expect, vi } from 'vitest'
import { ZodError, type ZodIssue } from 'zod'
import { errorHandler } from '../../middleware/errorHandler.js'
import {
  AuthenticationError,
  AuthorizationError,
  ValidationError,
  QuotaExceededError,
  NotFoundError,
  RateLimitError,
  LlmError,
  SectionLockedError,
} from '../../errors.js'

// Mock the logger to avoid real logging during tests
vi.mock('../../logger.js', () => ({
  logger: { error: vi.fn(), warn: vi.fn(), info: vi.fn() },
}))

// ============================================================================
// Helpers
// ============================================================================

function createMockReqRes() {
  const req = {
    log: { error: vi.fn(), warn: vi.fn(), info: vi.fn() },
  } as any
  const res = {
    status: vi.fn().mockReturnThis(),
    json: vi.fn().mockReturnThis(),
  } as any
  const next = vi.fn()
  return { req, res, next }
}

// ============================================================================
// Tests
// ============================================================================

describe('errorHandler', () => {
  it('AuthenticationError maps to 401 with UNAUTHORIZED code', () => {
    const { req, res, next } = createMockReqRes()

    errorHandler(new AuthenticationError(), req, res, next)

    expect(res.status).toHaveBeenCalledWith(401)
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ error: 'Unauthorized', code: 'UNAUTHORIZED' }),
    )
  })

  it('AuthorizationError maps to 403 with FORBIDDEN code and details', () => {
    const { req, res, next } = createMockReqRes()
    const details = { upgradeRequired: true, requiredPlan: 'pro' }

    errorHandler(new AuthorizationError('Upgrade required', details), req, res, next)

    expect(res.status).toHaveBeenCalledWith(403)
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        error: 'Upgrade required',
        code: 'FORBIDDEN',
        details,
      }),
    )
  })

  it('ValidationError maps to 400 with VALIDATION_ERROR code', () => {
    const { req, res, next } = createMockReqRes()

    errorHandler(new ValidationError('Bad input'), req, res, next)

    expect(res.status).toHaveBeenCalledWith(400)
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ error: 'Bad input', code: 'VALIDATION_ERROR' }),
    )
  })

  it('QuotaExceededError maps to 402 with quotaInfo', () => {
    const { req, res, next } = createMockReqRes()
    const quotaInfo = { remaining: 0, plan: 'free', limit: 10, used: 10 }

    errorHandler(new QuotaExceededError('Quota exceeded', quotaInfo), req, res, next)

    expect(res.status).toHaveBeenCalledWith(402)
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        error: 'Quota exceeded',
        code: 'QUOTA_EXCEEDED',
        quotaInfo,
      }),
    )
  })

  it('NotFoundError maps to 404 with NOT_FOUND code', () => {
    const { req, res, next } = createMockReqRes()

    errorHandler(new NotFoundError('Encounter not found'), req, res, next)

    expect(res.status).toHaveBeenCalledWith(404)
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ error: 'Encounter not found', code: 'NOT_FOUND' }),
    )
  })

  it('RateLimitError maps to 429 with retryAfterMs', () => {
    const { req, res, next } = createMockReqRes()

    errorHandler(new RateLimitError('Too many requests', 5000), req, res, next)

    expect(res.status).toHaveBeenCalledWith(429)
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        error: 'Too many requests',
        code: 'RATE_LIMITED',
        retryAfterMs: 5000,
      }),
    )
  })

  it('LlmError maps to 500 with LLM_ERROR code and logs error', () => {
    const { req, res, next } = createMockReqRes()

    errorHandler(new LlmError('Model failed'), req, res, next)

    expect(res.status).toHaveBeenCalledWith(500)
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ error: 'Model failed', code: 'LLM_ERROR' }),
    )
    // LlmError has statusCode 500, so it should be logged as error
    expect(req.log.error).toHaveBeenCalled()
  })

  it('SectionLockedError maps to 400 with SECTION_LOCKED code', () => {
    const { req, res, next } = createMockReqRes()

    errorHandler(new SectionLockedError(1), req, res, next)

    expect(res.status).toHaveBeenCalledWith(400)
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ error: 'Section 1 is locked', code: 'SECTION_LOCKED' }),
    )
  })

  it('ZodError maps to 400 with VALIDATION_ERROR code and details', () => {
    const { req, res, next } = createMockReqRes()
    const zodIssues: ZodIssue[] = [
      { code: 'invalid_type', expected: 'string', received: 'number', path: ['name'], message: 'Expected string' },
    ]
    const zodError = new ZodError(zodIssues)

    errorHandler(zodError, req, res, next)

    expect(res.status).toHaveBeenCalledWith(400)
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        error: 'Invalid request',
        code: 'VALIDATION_ERROR',
        details: zodIssues,
      }),
    )
  })

  it('unknown error maps to 500 with no stack trace exposed', () => {
    const { req, res, next } = createMockReqRes()
    const unknownError = new Error('Something unexpected')

    errorHandler(unknownError, req, res, next)

    expect(res.status).toHaveBeenCalledWith(500)
    expect(res.json).toHaveBeenCalledWith({ error: 'Internal error', code: 'INTERNAL_ERROR' })
    // Should NOT expose stack trace or original message
    const jsonBody = res.json.mock.calls[0][0]
    expect(jsonBody).not.toHaveProperty('stack')
    expect(jsonBody.error).not.toContain('Something unexpected')
  })

  it('does not log non-500 AppErrors at error level', () => {
    const { req, res, next } = createMockReqRes()

    errorHandler(new NotFoundError(), req, res, next)

    expect(req.log.error).not.toHaveBeenCalled()
  })

  it('logs unknown errors at error level', () => {
    const { req, res, next } = createMockReqRes()

    errorHandler(new Error('crash'), req, res, next)

    expect(req.log.error).toHaveBeenCalled()
  })

  it('AuthorizationError without details omits details field', () => {
    const { req, res, next } = createMockReqRes()

    errorHandler(new AuthorizationError('Forbidden'), req, res, next)

    expect(res.status).toHaveBeenCalledWith(403)
    const jsonBody = res.json.mock.calls[0][0]
    expect(jsonBody).not.toHaveProperty('details')
  })

  it('RateLimitError without retryAfterMs omits retryAfterMs field', () => {
    const { req, res, next } = createMockReqRes()

    errorHandler(new RateLimitError(), req, res, next)

    expect(res.status).toHaveBeenCalledWith(429)
    const jsonBody = res.json.mock.calls[0][0]
    expect(jsonBody).not.toHaveProperty('retryAfterMs')
  })
})
