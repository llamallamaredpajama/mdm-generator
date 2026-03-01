/**
 * Integration tests for backend API routes.
 *
 * Strategy:
 *   - vi.mock() for firebase-admin (auth + Firestore encounters), vertex,
 *     services/userService, node:fs/promises, and dotenv/config.
 *   - supertest drives HTTP requests against the captured Express app.
 *   - Express app captured by wrapping express() to intercept app.listen().
 *
 * IMPORTANT: All medical content is fictional / educational. No PHI.
 */

import { describe, it, expect, vi, beforeAll, beforeEach } from 'vitest'
import type { Express } from 'express'
import request from 'supertest'
import {
  VALID_TOKEN,
  ADMIN_TOKEN,
  SHORT_TOKEN,
  INVALID_TOKEN,
  makeDecodedToken,
  makeDocSnap,
  makeEncounterSnap,
  makeUsageStats,
  makeQuotaCheck,
  VALID_MDM_MODEL_RESPONSE,
  MALFORMED_MODEL_RESPONSE,
  VALID_PARSE_RESPONSE,
  VALID_SECTION1_RESPONSE,
  VALID_SECTION2_RESPONSE,
  VALID_FINALIZE_RESPONSE,
  WRAPPED_FINALIZE_RESPONSE,
  VALID_QUICK_MODE_RESPONSE,
  SAMPLE_NARRATIVE,
} from './helpers/mockFactories'

// ============================================================================
// Module-level mocks (hoisted by vitest)
// ============================================================================

vi.mock('dotenv/config', () => ({}))

// Bypass security middleware in tests
vi.mock('helmet', () => ({
  default: () => (_req: unknown, _res: unknown, next: () => void) => next(),
}))

vi.mock('express-rate-limit', () => ({
  default: () => (_req: unknown, _res: unknown, next: () => void) => next(),
}))


// ---------------------------------------------------------------------------
// firebase-admin mock — auth + Firestore (encounter docs only)
// ---------------------------------------------------------------------------

const mockVerifyIdToken = vi.fn()

// Encounter document operations (customers/{uid}/encounters/{id})
const mockEncounterDocRef = {
  get: vi.fn(),
  update: vi.fn().mockResolvedValue(undefined),
  set: vi.fn().mockResolvedValue(undefined),
}

// Build a stable chain that always terminates at mockEncounterDocRef.
// Every .doc() call returns an object whose .collection() returns { doc: -> encounterDocRef }
const makeChainableDoc = () => ({
  get: mockEncounterDocRef.get,
  update: mockEncounterDocRef.update,
  set: mockEncounterDocRef.set,
  collection: vi.fn().mockReturnValue({
    doc: vi.fn().mockReturnValue(mockEncounterDocRef),
    where: vi.fn().mockReturnValue({
      limit: vi.fn().mockReturnValue({
        get: vi.fn().mockResolvedValue({ empty: true, docs: [] }),
      }),
    }),
  }),
})

vi.mock('firebase-admin', () => {
  const Timestamp = { now: () => ({ seconds: 1700000000, nanoseconds: 0 }) }
  const FieldValue = { increment: (n: number) => `FieldValue.increment(${n})` }

  const adminMock = {
    apps: [{}], // non-empty so initFirebase() skips initialization
    initializeApp: vi.fn(),
    credential: { cert: vi.fn() },
    auth: () => ({ verifyIdToken: mockVerifyIdToken }),
    firestore: Object.assign(
      () => ({
        collection: vi.fn().mockReturnValue({
          doc: vi.fn().mockReturnValue(makeChainableDoc()),
        }),
      }),
      { Timestamp, FieldValue },
    ),
  }
  return { default: adminMock }
})

// ---------------------------------------------------------------------------
// userService mock — direct module mock avoids complex Firestore chaining
// ---------------------------------------------------------------------------

const mockEnsureUser = vi.fn()
const mockGetUsageStats = vi.fn()
const mockCheckQuota = vi.fn()
const mockCheckAndIncrementQuota = vi.fn()
const mockIncrementUsage = vi.fn()
const mockAdminSetPlan = vi.fn()

vi.mock('../services/userService', () => ({
  userService: {
    ensureUser: (...args: unknown[]) => mockEnsureUser(...args),
    getUsageStats: (...args: unknown[]) => mockGetUsageStats(...args),
    checkQuota: (...args: unknown[]) => mockCheckQuota(...args),
    checkAndIncrementQuota: (...args: unknown[]) => mockCheckAndIncrementQuota(...args),
    incrementUsage: (...args: unknown[]) => mockIncrementUsage(...args),
    adminSetPlan: (...args: unknown[]) => mockAdminSetPlan(...args),
  },
}))

// ---------------------------------------------------------------------------
// vertex mock
// ---------------------------------------------------------------------------

const mockCallGemini = vi.fn()
vi.mock('../vertex', () => ({
  callGemini: (...args: unknown[]) => mockCallGemini(...args),
}))

// ---------------------------------------------------------------------------
// fs/promises mock — buildPrompt and buildQuickModePrompt read guide file
// ---------------------------------------------------------------------------

vi.mock('node:fs/promises', () => ({
  default: {
    readFile: vi.fn().mockResolvedValue('# MDM Guide stub for testing'),
  },
  readFile: vi.fn().mockResolvedValue('# MDM Guide stub for testing'),
}))

// ============================================================================
// Capture the Express app via express mock
// ============================================================================

let capturedApp: Express | null = null

vi.mock('express', async () => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const actual = await vi.importActual('express') as any
  const originalDefault = actual.default as (...args: any[]) => Express
  const wrappedExpress = (...args: Parameters<typeof originalDefault>) => {
    const expressApp = originalDefault(...args)
    expressApp.listen = vi.fn().mockReturnValue({ close: vi.fn() })
    capturedApp = expressApp
    return expressApp
  }
  Object.assign(wrappedExpress, originalDefault)
  return { ...actual, default: wrappedExpress }
})

let app: Express

beforeAll(async () => {
  await import('../index')
  app = capturedApp!
  expect(app).toBeDefined()
})

// ============================================================================
// Reset mocks between tests
// ============================================================================

beforeEach(() => {
  vi.clearAllMocks()

  // Auth: VALID_TOKEN → normal user, ADMIN_TOKEN → admin, others → throw
  mockVerifyIdToken.mockImplementation(async (token: string) => {
    if (token === VALID_TOKEN) return makeDecodedToken()
    if (token === ADMIN_TOKEN) return makeDecodedToken({ admin: true, uid: 'admin-uid' })
    throw new Error('Invalid token')
  })

  // userService defaults
  mockEnsureUser.mockResolvedValue({ uid: 'test-user-123', email: 'doc@example.com', plan: 'free' })
  mockGetUsageStats.mockResolvedValue(makeUsageStats())
  mockCheckQuota.mockResolvedValue(makeQuotaCheck())
  mockCheckAndIncrementQuota.mockResolvedValue(makeQuotaCheck())
  mockIncrementUsage.mockResolvedValue(undefined)
  mockAdminSetPlan.mockResolvedValue(undefined)

  // Default encounter: exists, build mode, draft
  mockEncounterDocRef.get.mockResolvedValue(makeEncounterSnap())
  mockEncounterDocRef.update.mockResolvedValue(undefined)

  // Default Gemini response
  mockCallGemini.mockResolvedValue({ text: VALID_MDM_MODEL_RESPONSE })
})

// ============================================================================
// HEALTH CHECK
// ============================================================================

describe('GET /health', () => {
  it('returns ok: true', async () => {
    const res = await request(app).get('/health')
    expect(res.status).toBe(200)
    expect(res.body).toEqual({ ok: true })
  })
})

// ============================================================================
// AUTH & VALIDATION — shared patterns across endpoints
// ============================================================================

describe('Auth & Validation (shared patterns)', () => {
  const endpoints = [
    { method: 'post' as const, path: '/v1/whoami', body: {} },
    { method: 'post' as const, path: '/v1/generate', body: { narrative: SAMPLE_NARRATIVE } },
    { method: 'post' as const, path: '/v1/parse-narrative', body: { narrative: SAMPLE_NARRATIVE } },
  ]

  for (const ep of endpoints) {
    describe(`${ep.method.toUpperCase()} ${ep.path}`, () => {
      it('returns 400 when userIdToken is missing', async () => {
        const res = await request(app)[ep.method](ep.path).send(ep.body)
        expect(res.status).toBe(400)
        expect(res.body.error).toBeDefined()
      })

      it('returns 400 when userIdToken is too short (9 chars)', async () => {
        const res = await request(app)
          [ep.method](ep.path)
          .send({ ...ep.body, userIdToken: SHORT_TOKEN })
        expect(res.status).toBe(400)
      })

      it('returns 401 when Firebase token is invalid', async () => {
        const res = await request(app)
          [ep.method](ep.path)
          .send({ ...ep.body, userIdToken: INVALID_TOKEN })
        expect(res.status).toBe(401)
        expect(res.body.error).toMatch(/unauthorized/i)
      })
    })
  }
})

// ============================================================================
// POST /v1/whoami
// ============================================================================

describe('POST /v1/whoami', () => {
  it('returns user info and usage stats for existing user', async () => {
    const res = await request(app)
      .post('/v1/whoami')
      .send({ userIdToken: VALID_TOKEN })

    expect(res.status).toBe(200)
    expect(res.body.ok).toBe(true)
    expect(res.body.uid).toBe('test-user-123')
    expect(res.body.email).toBe('doc@example.com')
    expect(res.body.plan).toBe('free')
    expect(res.body.remaining).toBe(8)
  })

  it('calls ensureUser for first-time user setup', async () => {
    await request(app)
      .post('/v1/whoami')
      .send({ userIdToken: VALID_TOKEN })

    expect(mockEnsureUser).toHaveBeenCalledWith('test-user-123', 'doc@example.com')
  })
})

// ============================================================================
// POST /v1/generate
// ============================================================================

describe('POST /v1/generate', () => {
  it('returns 402 when monthly quota is exceeded', async () => {
    mockCheckAndIncrementQuota.mockResolvedValueOnce(makeQuotaCheck({
      allowed: false, used: 10, limit: 10, remaining: 0,
    }))

    const res = await request(app)
      .post('/v1/generate')
      .send({ narrative: SAMPLE_NARRATIVE, userIdToken: VALID_TOKEN })

    expect(res.status).toBe(402)
    expect(res.body.error).toMatch(/quota/i)
    expect(res.body.used).toBe(10)
    expect(res.body.limit).toBe(10)
    expect(res.body.remaining).toBe(0)
  })

  it('returns 400 when token estimate exceeds plan limit', async () => {
    // Free plan maxTokensPerRequest = 2000 → narrative > 8000 chars triggers check
    const longNarrative = 'x'.repeat(8004) // ceil(8004/4) = 2001 > 2000

    const res = await request(app)
      .post('/v1/generate')
      .send({ narrative: longNarrative, userIdToken: VALID_TOKEN })

    expect(res.status).toBe(400)
    expect(res.body.error).toMatch(/too large/i)
    expect(res.body.tokenEstimate).toBeGreaterThan(2000)
    expect(res.body.maxAllowed).toBe(2000)
  })

  it('returns 200 with MDM output on valid request', async () => {
    const res = await request(app)
      .post('/v1/generate')
      .send({ narrative: SAMPLE_NARRATIVE, userIdToken: VALID_TOKEN })

    expect(res.status).toBe(200)
    expect(res.body.ok).toBe(true)
    expect(res.body.draft).toBeDefined()
    expect(res.body.draftJson).toBeDefined()
    expect(res.body.draftJson.differential).toBeDefined()
    expect(res.body.uid).toBe('test-user-123')
    expect(res.body.plan).toBe('free')
  })

  it('returns fallback stub (not 500) when model returns malformed JSON', async () => {
    mockCallGemini.mockResolvedValueOnce({ text: MALFORMED_MODEL_RESPONSE })

    const res = await request(app)
      .post('/v1/generate')
      .send({ narrative: SAMPLE_NARRATIVE, userIdToken: VALID_TOKEN })

    expect(res.status).toBe(200)
    expect(res.body.ok).toBe(true)
    expect(res.body.draftJson).toBeDefined()
    expect(res.body.draftJson.disclaimers).toMatch(/physician must review/i)
  })

  it('increments usage on successful generation', async () => {
    await request(app)
      .post('/v1/generate')
      .send({ narrative: SAMPLE_NARRATIVE, userIdToken: VALID_TOKEN })

    // Usage is now incremented atomically by checkAndIncrementQuota
    expect(mockCheckAndIncrementQuota).toHaveBeenCalledWith('test-user-123')
  })
})

// ============================================================================
// POST /v1/parse-narrative
// ============================================================================

describe('POST /v1/parse-narrative', () => {
  it('returns 200 with parsed structure on valid request', async () => {
    mockCallGemini.mockResolvedValueOnce({ text: VALID_PARSE_RESPONSE })

    const res = await request(app)
      .post('/v1/parse-narrative')
      .send({ narrative: SAMPLE_NARRATIVE, userIdToken: VALID_TOKEN })

    expect(res.status).toBe(200)
    expect(res.body.ok).toBe(true)
    expect(res.body.parsed).toBeDefined()
    expect(res.body.confidence).toBe(0.85)
  })

  it('does NOT increment usage counter', async () => {
    mockCallGemini.mockResolvedValueOnce({ text: VALID_PARSE_RESPONSE })

    await request(app)
      .post('/v1/parse-narrative')
      .send({ narrative: SAMPLE_NARRATIVE, userIdToken: VALID_TOKEN })

    expect(mockIncrementUsage).not.toHaveBeenCalled()
  })

  it('returns empty structure when model fails', async () => {
    mockCallGemini.mockRejectedValueOnce(new Error('Model unavailable'))

    const res = await request(app)
      .post('/v1/parse-narrative')
      .send({ narrative: SAMPLE_NARRATIVE, userIdToken: VALID_TOKEN })

    expect(res.status).toBe(200)
    expect(res.body.ok).toBe(true)
    expect(res.body.parsed).toBeDefined()
    expect(res.body.parsed.confidence).toBe(0)
  })
})

// ============================================================================
// POST /v1/admin/set-plan
// ============================================================================

describe('POST /v1/admin/set-plan', () => {
  it('returns 400 when required fields are missing', async () => {
    const res = await request(app)
      .post('/v1/admin/set-plan')
      .send({ adminToken: ADMIN_TOKEN })
    expect(res.status).toBe(400)
  })

  it('returns 400 when adminToken is too short', async () => {
    const res = await request(app)
      .post('/v1/admin/set-plan')
      .send({ adminToken: SHORT_TOKEN, targetUid: 'user-1', plan: 'pro' })
    expect(res.status).toBe(400)
  })

  it('returns 401 when Firebase token verification fails', async () => {
    const res = await request(app)
      .post('/v1/admin/set-plan')
      .send({ adminToken: INVALID_TOKEN, targetUid: 'user-1', plan: 'pro' })
    expect(res.status).toBe(401)
  })

  it('returns 403 when token lacks admin claim', async () => {
    const res = await request(app)
      .post('/v1/admin/set-plan')
      .send({ adminToken: VALID_TOKEN, targetUid: 'user-1', plan: 'pro' })
    expect(res.status).toBe(403)
    expect(res.body.error).toMatch(/admin/i)
  })

  it('returns 200 and updates plan for admin token', async () => {
    const res = await request(app)
      .post('/v1/admin/set-plan')
      .send({ adminToken: ADMIN_TOKEN, targetUid: 'user-1', plan: 'pro' })

    expect(res.status).toBe(200)
    expect(res.body.ok).toBe(true)
    expect(res.body.message).toMatch(/pro/)
    expect(mockAdminSetPlan).toHaveBeenCalledWith('user-1', 'pro')
  })

  /**
   * Regression test: error response must NOT leak e.message.
   *
   * Previously (before security hardening), the catch block at line ~135 did:
   *   return res.status(500).json({ error: e.message || 'Internal error' })
   * which leaked raw error messages to the client. Now fixed to always return
   * a generic "Internal error" message.
   */
  it('does not leak internal error details in 500 response', async () => {
    mockAdminSetPlan.mockRejectedValueOnce(
      new Error('Firestore PERMISSION_DENIED: Missing permissions for users/user-1'),
    )

    const res = await request(app)
      .post('/v1/admin/set-plan')
      .send({ adminToken: ADMIN_TOKEN, targetUid: 'user-1', plan: 'pro' })

    expect(res.status).toBe(500)
    expect(res.body.error).toBe('Internal error')
    // Must NOT contain the internal error message
    expect(res.body.error).not.toContain('PERMISSION_DENIED')
  })
})

// ============================================================================
// BUILD MODE — POST /v1/build-mode/process-section1
// ============================================================================

describe('POST /v1/build-mode/process-section1', () => {
  const validBody = {
    encounterId: 'enc-001',
    content: 'Middle-aged male with acute substernal chest pain. Diaphoretic. HTN history.',
    userIdToken: VALID_TOKEN,
  }

  it('returns 401 with invalid token', async () => {
    const res = await request(app)
      .post('/v1/build-mode/process-section1')
      .send({ ...validBody, userIdToken: INVALID_TOKEN })
    expect(res.status).toBe(401)
  })

  it('returns 404 when encounter does not exist (wrong uid ownership)', async () => {
    mockEncounterDocRef.get.mockResolvedValueOnce(makeDocSnap(null))

    const res = await request(app)
      .post('/v1/build-mode/process-section1')
      .send(validBody)
    expect(res.status).toBe(404)
  })

  it('returns 400 with isLocked when submission count >= 2', async () => {
    mockEncounterDocRef.get.mockResolvedValueOnce(
      makeEncounterSnap({ section1: { status: 'completed', submissionCount: 2 } }),
    )

    const res = await request(app)
      .post('/v1/build-mode/process-section1')
      .send(validBody)

    expect(res.status).toBe(400)
    expect(res.body.isLocked).toBe(true)
    expect(res.body.submissionCount).toBe(2)
  })

  it('counts quota only on first submission per encounter', async () => {
    mockEncounterDocRef.get.mockResolvedValueOnce(
      makeEncounterSnap({ quotaCounted: false }),
    )
    mockCallGemini.mockResolvedValueOnce({ text: VALID_SECTION1_RESPONSE })

    const res = await request(app)
      .post('/v1/build-mode/process-section1')
      .send(validBody)

    expect(res.status).toBe(200)
    // quota should have been atomically checked and incremented
    expect(mockCheckAndIncrementQuota).toHaveBeenCalledWith('test-user-123')
    // encounterRef.update should be called with quotaCounted: true
    const updateCalls = mockEncounterDocRef.update.mock.calls
    const quotaUpdate = updateCalls.find((c: any[]) => c[0]?.quotaCounted === true)
    expect(quotaUpdate).toBeDefined()
  })

  it('does not re-count quota on subsequent submissions', async () => {
    mockEncounterDocRef.get.mockResolvedValueOnce(
      makeEncounterSnap({
        quotaCounted: true,
        section1: { status: 'completed', submissionCount: 1 },
      }),
    )
    mockCallGemini.mockResolvedValueOnce({ text: VALID_SECTION1_RESPONSE })

    const res = await request(app)
      .post('/v1/build-mode/process-section1')
      .send(validBody)

    expect(res.status).toBe(200)
    // quota check and increment should NOT be called (already counted)
    expect(mockCheckAndIncrementQuota).not.toHaveBeenCalled()
  })

  it('returns 402 when quota exceeded on first submission', async () => {
    mockEncounterDocRef.get.mockResolvedValueOnce(
      makeEncounterSnap({ quotaCounted: false }),
    )
    mockCheckAndIncrementQuota.mockResolvedValueOnce(makeQuotaCheck({
      allowed: false, used: 10, limit: 10, remaining: 0,
    }))

    const res = await request(app)
      .post('/v1/build-mode/process-section1')
      .send(validBody)

    expect(res.status).toBe(402)
    expect(res.body.error).toMatch(/quota/i)
  })

  it('returns 200 with differential on valid request', async () => {
    mockCallGemini.mockResolvedValueOnce({ text: VALID_SECTION1_RESPONSE })

    const res = await request(app)
      .post('/v1/build-mode/process-section1')
      .send(validBody)

    expect(res.status).toBe(200)
    expect(res.body.ok).toBe(true)
    expect(res.body.differential).toBeInstanceOf(Array)
    expect(res.body.differential.length).toBeGreaterThan(0)
    expect(res.body.submissionCount).toBe(1)
  })

  /**
   * Regression: token-size check added and Zod char limit aligned to 2000.
   *
   * Previously, build-mode had no token-size check and a higher Zod char limit,
   * allowing oversized content through. Now both defenses are in place:
   * - Zod limit = SECTION1_MAX_CHARS (2000 chars)
   * - checkTokenSize() added at route level
   *
   * The Zod limit is the tighter constraint (2000 chars ≈ 500 tokens, well
   * under the free plan's 2000-token limit), so oversized content is now
   * correctly rejected at the Zod validation layer.
   */
  it('rejects content exceeding SECTION1_MAX_CHARS', async () => {
    const oversizedContent = 'A'.repeat(2001) // exceeds SECTION1_MAX_CHARS = 2000

    const res = await request(app)
      .post('/v1/build-mode/process-section1')
      .send({ ...validBody, content: oversizedContent })

    expect(res.status).toBe(400)
  })
})

// ============================================================================
// BUILD MODE — Section ordering enforcement
// ============================================================================

describe('Build Mode section ordering', () => {
  it('returns 400 when submitting section2 before section1 is completed', async () => {
    mockEncounterDocRef.get.mockResolvedValueOnce(
      makeEncounterSnap({ section1: { status: 'pending', submissionCount: 0 } }),
    )

    const res = await request(app)
      .post('/v1/build-mode/process-section2')
      .send({
        encounterId: 'enc-001',
        content: 'Labs: troponin negative x2. EKG: NSR.',
        userIdToken: VALID_TOKEN,
      })

    expect(res.status).toBe(400)
    expect(res.body.error).toMatch(/section 1/i)
  })

  it('returns 400 when submitting finalize before section2 is completed', async () => {
    mockEncounterDocRef.get.mockResolvedValueOnce(
      makeEncounterSnap({
        section1: { status: 'completed', submissionCount: 1 },
        section2: { status: 'pending', submissionCount: 0 },
      }),
    )

    const res = await request(app)
      .post('/v1/build-mode/finalize')
      .send({
        encounterId: 'enc-001',
        content: 'Discharged with follow-up.',
        userIdToken: VALID_TOKEN,
      })

    expect(res.status).toBe(400)
    expect(res.body.error).toMatch(/section 2/i)
  })
})

// ============================================================================
// BUILD MODE — POST /v1/build-mode/process-section2
// ============================================================================

describe('POST /v1/build-mode/process-section2', () => {
  const validBody = {
    encounterId: 'enc-001',
    content: 'Labs: troponin negative x2. D-dimer normal. EKG: NSR. CXR: clear.',
    userIdToken: VALID_TOKEN,
  }

  beforeEach(() => {
    // NOTE: buildSection2Prompt expects section1Response as { differential: DifferentialItem[] }
    // but the section1 route stores llmResponse as a raw DifferentialItem[] array.
    // Using the wrapped format here so the prompt builder works. See BUG test below.
    mockEncounterDocRef.get.mockResolvedValue(
      makeEncounterSnap({
        section1: {
          status: 'completed',
          submissionCount: 1,
          content: 'Chest pain presentation',
          llmResponse: { differential: [{ diagnosis: 'ACS', urgency: 'emergent', reasoning: 'risk factors' }] },
        },
        section2: { status: 'pending', submissionCount: 0 },
        quotaCounted: true,
      }),
    )
  })

  it('returns 200 with MDM preview', async () => {
    mockCallGemini.mockResolvedValueOnce({ text: VALID_SECTION2_RESPONSE })

    const res = await request(app)
      .post('/v1/build-mode/process-section2')
      .send(validBody)

    expect(res.status).toBe(200)
    expect(res.body.ok).toBe(true)
    expect(res.body.mdmPreview).toBeDefined()
    expect(res.body.submissionCount).toBe(1)
  })

  it('returns 400 with isLocked after 2 submissions', async () => {
    mockEncounterDocRef.get.mockResolvedValueOnce(
      makeEncounterSnap({
        section1: { status: 'completed', submissionCount: 1 },
        section2: { status: 'completed', submissionCount: 2 },
        quotaCounted: true,
      }),
    )

    const res = await request(app)
      .post('/v1/build-mode/process-section2')
      .send(validBody)

    expect(res.status).toBe(400)
    expect(res.body.isLocked).toBe(true)
  })

  it('returns 404 when encounter does not exist', async () => {
    mockEncounterDocRef.get.mockResolvedValueOnce(makeDocSnap(null))

    const res = await request(app)
      .post('/v1/build-mode/process-section2')
      .send(validBody)
    expect(res.status).toBe(404)
  })

  /**
   * Regression test: raw-array format mismatch between section1 storage and section2 retrieval.
   *
   * Section 1 route stores `section1.llmResponse` as a raw DifferentialItem[] array.
   * Section 2 route reads it and passes directly to buildSection2Prompt(), which
   * expects `Pick<Section1Response, 'differential'>` = { differential: DifferentialItem[] }.
   *
   * When llmResponse is a raw array, `section1Response.differential` is undefined,
   * causing a TypeError in buildSection2Prompt() → 500.
   *
   * Expected: Route should wrap the array as { differential: llmResponse }
   * Actual: Passes raw array, causing buildSection2Prompt to crash
   */
  it('handles section1 llmResponse stored as raw array', async () => {
    mockEncounterDocRef.get.mockResolvedValueOnce(
      makeEncounterSnap({
        section1: {
          status: 'completed',
          submissionCount: 1,
          content: 'Chest pain presentation',
          // Raw array — how section1 route actually stores it
          llmResponse: [{ diagnosis: 'ACS', urgency: 'emergent', reasoning: 'risk factors' }],
        },
        section2: { status: 'pending', submissionCount: 0 },
        quotaCounted: true,
      }),
    )
    mockCallGemini.mockResolvedValueOnce({ text: VALID_SECTION2_RESPONSE })

    const res = await request(app)
      .post('/v1/build-mode/process-section2')
      .send(validBody)

    expect(res.status).toBe(200)
  })
})

// ============================================================================
// BUILD MODE — POST /v1/build-mode/finalize
// ============================================================================

describe('POST /v1/build-mode/finalize', () => {
  const validBody = {
    encounterId: 'enc-001',
    content: 'Aspirin given. Pain resolved. Discharged with cardiology follow-up 48h.',
    userIdToken: VALID_TOKEN,
  }

  beforeEach(() => {
    mockEncounterDocRef.get.mockResolvedValue(
      makeEncounterSnap({
        section1: {
          status: 'completed',
          submissionCount: 1,
          content: 'Chest pain presentation',
          llmResponse: [{ diagnosis: 'ACS', urgency: 'emergent', reasoning: 'risk factors' }],
        },
        section2: {
          status: 'completed',
          submissionCount: 1,
          content: 'Labs and imaging results',
          llmResponse: {
            problems: ['chest pain'],
            differential: ['ACS'],
            dataReviewed: ['EKG'],
            reasoning: 'workup',
          },
        },
        section3: { status: 'pending', submissionCount: 0 },
        quotaCounted: true,
      }),
    )
  })

  it('returns 200 with final MDM', async () => {
    mockCallGemini.mockResolvedValueOnce({ text: VALID_FINALIZE_RESPONSE })

    const res = await request(app)
      .post('/v1/build-mode/finalize')
      .send(validBody)

    expect(res.status).toBe(200)
    expect(res.body.ok).toBe(true)
    expect(res.body.finalMdm).toBeDefined()
    expect(res.body.finalMdm.text).toBeDefined()
    expect(res.body.finalMdm.json).toBeDefined()
    expect(res.body.quotaRemaining).toBeDefined()
  })

  it('returns 400 with isLocked after 2 submissions', async () => {
    mockEncounterDocRef.get.mockResolvedValueOnce(
      makeEncounterSnap({
        section1: { status: 'completed', submissionCount: 1 },
        section2: { status: 'completed', submissionCount: 1 },
        section3: { status: 'completed', submissionCount: 2 },
        quotaCounted: true,
      }),
    )

    const res = await request(app)
      .post('/v1/build-mode/finalize')
      .send(validBody)

    expect(res.status).toBe(400)
    expect(res.body.isLocked).toBe(true)
  })

  it('parses wrapped finalMdm response from LLM', async () => {
    mockCallGemini.mockResolvedValueOnce({ text: WRAPPED_FINALIZE_RESPONSE })

    const res = await request(app)
      .post('/v1/build-mode/finalize')
      .send(validBody)

    expect(res.status).toBe(200)
    expect(res.body.ok).toBe(true)
    expect(res.body.finalMdm.text).toBeTruthy()
    expect(res.body.finalMdm.text).not.toMatch(/unable to generate/i)
    expect(res.body.finalMdm.json.problems).toBeDefined()
    expect(res.body.finalMdm.json.problems.length).toBeGreaterThan(0)
  })

  it('normalizes title-case complexityLevel to lowercase', async () => {
    mockCallGemini.mockResolvedValueOnce({ text: WRAPPED_FINALIZE_RESPONSE })

    const res = await request(app)
      .post('/v1/build-mode/finalize')
      .send(validBody)

    expect(res.status).toBe(200)
    expect(res.body.finalMdm.json.complexityLevel).toBe('high')
  })

  it('maps prompt field names to schema field names', async () => {
    mockCallGemini.mockResolvedValueOnce({ text: WRAPPED_FINALIZE_RESPONSE })

    const res = await request(app)
      .post('/v1/build-mode/finalize')
      .send(validBody)

    expect(res.status).toBe(200)
    const json = res.body.finalMdm.json
    // Schema names should be populated (mapped from prompt names)
    expect(json.problems).toBeDefined()
    expect(json.dataReviewed).toBeDefined()
    expect(json.risk).toBeDefined()
    expect(json.reasoning).toBeDefined()
    expect(json.disposition).toBeDefined()
    // Prompt field names should NOT appear at top level
    expect(json.problemsAddressed).toBeUndefined()
    expect(json.dataReviewedOrdered).toBeUndefined()
    expect(json.riskAssessment).toBeUndefined()
    expect(json.clinicalReasoning).toBeUndefined()
  })

  it('returns fallback MDM when JSON is completely unparseable', async () => {
    mockCallGemini.mockResolvedValueOnce({ text: 'This is not JSON at all <html>oops</html>' })

    const res = await request(app)
      .post('/v1/build-mode/finalize')
      .send(validBody)

    expect(res.status).toBe(200)
    expect(res.body.ok).toBe(true)
    expect(res.body.finalMdm).toBeDefined()
    expect(res.body.finalMdm.text).toMatch(/unable to generate/i)
  })
})

// ============================================================================
// QUICK MODE — POST /v1/quick-mode/generate
// ============================================================================

describe('POST /v1/quick-mode/generate', () => {
  const validBody = {
    encounterId: 'enc-q-001',
    narrative: SAMPLE_NARRATIVE,
    userIdToken: VALID_TOKEN,
  }

  beforeEach(() => {
    mockEncounterDocRef.get.mockResolvedValue(
      makeEncounterSnap({
        mode: 'quick',
        status: 'draft',
        chiefComplaint: 'chest pain',
        quotaCounted: false,
        quickModeData: { status: 'pending' },
      }),
    )
  })

  it('returns 401 with invalid token', async () => {
    const res = await request(app)
      .post('/v1/quick-mode/generate')
      .send({ ...validBody, userIdToken: INVALID_TOKEN })
    expect(res.status).toBe(401)
  })

  it('returns 404 when encounter does not exist', async () => {
    mockEncounterDocRef.get.mockResolvedValueOnce(makeDocSnap(null))

    const res = await request(app)
      .post('/v1/quick-mode/generate')
      .send(validBody)
    expect(res.status).toBe(404)
  })

  it('returns 400 when encounter is not quick mode', async () => {
    mockEncounterDocRef.get.mockResolvedValueOnce(
      makeEncounterSnap({ mode: 'build' }),
    )

    const res = await request(app)
      .post('/v1/quick-mode/generate')
      .send(validBody)
    expect(res.status).toBe(400)
    expect(res.body.error).toMatch(/quick mode/i)
  })

  it('returns 400 when encounter is already processed', async () => {
    mockEncounterDocRef.get.mockResolvedValueOnce(
      makeEncounterSnap({
        mode: 'quick',
        quickModeData: { status: 'completed' },
      }),
    )

    const res = await request(app)
      .post('/v1/quick-mode/generate')
      .send(validBody)
    expect(res.status).toBe(400)
    expect(res.body.error).toMatch(/already processed/i)
  })

  it('returns 402 when quota exceeded', async () => {
    mockCheckAndIncrementQuota.mockResolvedValueOnce(makeQuotaCheck({
      allowed: false, used: 10, limit: 10, remaining: 0,
    }))

    const res = await request(app)
      .post('/v1/quick-mode/generate')
      .send(validBody)
    expect(res.status).toBe(402)
    expect(res.body.error).toMatch(/quota/i)
  })

  it('returns 200 with MDM on valid request', async () => {
    mockCallGemini.mockResolvedValueOnce({ text: VALID_QUICK_MODE_RESPONSE })

    const res = await request(app)
      .post('/v1/quick-mode/generate')
      .send(validBody)

    expect(res.status).toBe(200)
    expect(res.body.ok).toBe(true)
    expect(res.body.mdm).toBeDefined()
    expect(res.body.mdm.text).toBeDefined()
    expect(res.body.patientIdentifier).toBeDefined()
    expect(res.body.quotaRemaining).toBeDefined()
  })

  it('returns fallback when model fails (not 500)', async () => {
    // Reset fully then set rejection as the default to avoid any residual state
    mockCallGemini.mockReset()
    mockCallGemini.mockRejectedValue(new Error('Model unavailable'))

    const res = await request(app)
      .post('/v1/quick-mode/generate')
      .send(validBody)

    expect(res.status).toBe(200)
    expect(res.body.ok).toBe(true)
    expect(res.body.mdm.text).toMatch(/unable to generate/i)
  })

  /**
   * Regression test: token-size check on quick mode narrative.
   *
   * Previously, /v1/quick-mode/generate did NOT check token size against the
   * plan limit (only the Zod `.max(16000)` char limit applied). A free plan user
   * (maxTokensPerRequest=2000 → max ~8000 chars) could submit up to 16000 chars.
   *
   * Security hardening added checkTokenSize() to quick-mode (index.ts ~line 1039),
   * fixing this gap. Now correctly returns 400 for oversized narratives.
   */
  it('rejects oversized narrative that exceeds plan token limit', async () => {
    const oversizedNarrative = 'X'.repeat(12000) // ~3000 tokens, exceeds free plan's 2000
    mockCallGemini.mockResolvedValueOnce({ text: VALID_QUICK_MODE_RESPONSE })

    const res = await request(app)
      .post('/v1/quick-mode/generate')
      .send({ ...validBody, narrative: oversizedNarrative })

    expect(res.status).toBe(400)
    expect(res.body.error).toMatch(/too large/i)
    expect(res.body.tokenEstimate).toBeGreaterThan(2000)
    expect(res.body.maxAllowed).toBe(2000)
  })
})
