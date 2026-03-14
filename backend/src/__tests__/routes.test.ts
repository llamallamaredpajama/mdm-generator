/**
 * Integration tests for backend API routes.
 *
 * Strategy:
 *   - DI-based: createApp(mockDeps) with injected mock dependencies.
 *   - Module-level vi.mock() only for singletons the DI doesn't reach:
 *     firebase-admin (auth middleware), helmet, rate-limit, fs/promises,
 *     surveillanceEnrichment, testCatalogSearch.
 *   - supertest drives HTTP requests against the Express app.
 *
 * IMPORTANT: All medical content is fictional / educational. No PHI.
 */

import { describe, it, expect, vi, beforeAll, beforeEach } from 'vitest'
import type { Application } from 'express'
import request from 'supertest'
import { createApp } from '../app'
import {
  VALID_TOKEN,
  ADMIN_TOKEN,
  SHORT_TOKEN,
  INVALID_TOKEN,
  makeDecodedToken,
  makeEncounterDoc,
  makeUsageStats,
  makeQuotaCheck,
  VALID_MDM_MODEL_RESPONSE,
  MALFORMED_MODEL_RESPONSE,
  VALID_PARSE_RESPONSE,
  VALID_SECTION1_RESPONSE,
  LEGACY_SECTION1_RESPONSE,
  FENCED_SECTION1_RESPONSE,
  NONSTANDARD_URGENCY_SECTION1_RESPONSE,
  TRAILING_COMMA_SECTION1_RESPONSE,
  VALID_FINALIZE_RESPONSE,
  WRAPPED_FINALIZE_RESPONSE,
  VALID_QUICK_MODE_RESPONSE,
  PARTIAL_VALID_SECTION1_RESPONSE,
  ALL_UNMAPPED_URGENCY_SECTION1_RESPONSE,
  EXTRA_FIELDS_SECTION1_RESPONSE,
  SAMPLE_NARRATIVE,
} from './helpers/mockFactories'
import {
  createMockDependencies,
  type MockLlmClient,
  type MockEncounterRepo,
  type MockUserService,
} from './helpers/mockDependencies'

// ============================================================================
// Module-level mocks (hoisted by vitest)
// ============================================================================

// Bypass security middleware in tests
vi.mock('helmet', () => ({
  default: () => (_req: unknown, _res: unknown, next: () => void) => next(),
}))

vi.mock('express-rate-limit', () => ({
  default: () => (_req: unknown, _res: unknown, next: () => void) => next(),
}))

// ---------------------------------------------------------------------------
// firebase-admin mock — auth only (DI handles Firestore data operations)
// ---------------------------------------------------------------------------

const mockVerifyIdToken = vi.fn()

vi.mock('firebase-admin', () => {
  const Timestamp = { now: () => ({ seconds: 1700000000, nanoseconds: 0 }) }
  const FieldValue = { increment: (n: number) => `FieldValue.increment(${n})` }

  return {
    default: {
      apps: [{}], // non-empty so initFirebase() skips initialization
      initializeApp: vi.fn(),
      credential: { cert: vi.fn() },
      auth: () => ({ verifyIdToken: mockVerifyIdToken }),
      firestore: Object.assign(
        () => ({}), // callable stub (static properties only needed in tests)
        { Timestamp, FieldValue },
      ),
    },
  }
})

// ---------------------------------------------------------------------------
// fs/promises mock — prompt guide file reads in controllers
// ---------------------------------------------------------------------------

vi.mock('node:fs/promises', () => ({
  default: {
    readFile: vi.fn().mockResolvedValue('# MDM Guide stub for testing'),
  },
  readFile: vi.fn().mockResolvedValue('# MDM Guide stub for testing'),
}))

// ---------------------------------------------------------------------------
// Side-effect-heavy modules — mock to prevent real network calls
// ---------------------------------------------------------------------------

vi.mock('../shared/surveillanceEnrichment', () => ({
  runSurveillanceEnrichment: vi.fn().mockResolvedValue(undefined),
  runCdrEnrichment: vi.fn().mockResolvedValue(undefined),
  injectSurveillanceIntoMdm: vi.fn().mockReturnValue({ dataReviewed: [], text: '' }),
  incrementGapTallies: vi.fn().mockResolvedValue(undefined),
}))

vi.mock('../services/testCatalogSearch', () => ({
  getRelevantTests: vi.fn().mockResolvedValue([]),
}))

// ============================================================================
// App setup via DI — no Express capture hack, no module-level business mocks
// ============================================================================

let app: Application
let m: {
  llmClient: MockLlmClient
  encounterRepo: MockEncounterRepo
  userService: MockUserService
}

beforeAll(() => {
  const kit = createMockDependencies()
  app = createApp(kit.deps)
  m = {
    llmClient: kit.llmClient,
    encounterRepo: kit.encounterRepo,
    userService: kit.userService,
  }
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
  m.userService.ensureUser.mockResolvedValue({ uid: 'test-user-123', email: 'doc@example.com', plan: 'free' })
  m.userService.getUser.mockResolvedValue(null)
  m.userService.getUsageStats.mockResolvedValue(makeUsageStats())
  m.userService.checkQuota.mockResolvedValue(makeQuotaCheck())
  m.userService.checkAndIncrementQuota.mockResolvedValue(makeQuotaCheck())
  m.userService.incrementUsage.mockResolvedValue(undefined)
  m.userService.adminSetPlan.mockResolvedValue(undefined)

  // Default encounter: exists, build mode, draft
  m.encounterRepo.get.mockResolvedValue(makeEncounterDoc())

  // Default LLM response
  m.llmClient.generate.mockResolvedValue({ text: VALID_MDM_MODEL_RESPONSE, latencyMs: 100 })
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
      it('returns 401 when userIdToken is missing (auth middleware)', async () => {
        const res = await request(app)[ep.method](ep.path).send(ep.body)
        expect(res.status).toBe(401)
        expect(res.body.error).toBeDefined()
      })

      it('returns 401 when userIdToken is too short (auth middleware rejects)', async () => {
        const res = await request(app)
          [ep.method](ep.path)
          .send({ ...ep.body, userIdToken: SHORT_TOKEN })
        expect(res.status).toBe(401)
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

    expect(m.userService.ensureUser).toHaveBeenCalledWith('test-user-123', 'doc@example.com')
  })
})

// ============================================================================
// POST /v1/generate
// ============================================================================

describe('POST /v1/generate', () => {
  it('returns 402 when monthly quota is exceeded', async () => {
    m.userService.checkAndIncrementQuota.mockResolvedValueOnce(makeQuotaCheck({
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
    m.llmClient.generate.mockResolvedValueOnce({ text: MALFORMED_MODEL_RESPONSE, latencyMs: 100 })

    const res = await request(app)
      .post('/v1/generate')
      .send({ narrative: SAMPLE_NARRATIVE, userIdToken: VALID_TOKEN })

    expect(res.status).toBe(200)
    expect(res.body.ok).toBe(true)
    expect(res.body.draftJson).toBeDefined()
    expect(res.body.draftJson.attestation).toMatch(/treating physician/i)
  })

  it('increments usage on successful generation', async () => {
    await request(app)
      .post('/v1/generate')
      .send({ narrative: SAMPLE_NARRATIVE, userIdToken: VALID_TOKEN })

    // Usage is now incremented atomically by checkAndIncrementQuota
    expect(m.userService.checkAndIncrementQuota).toHaveBeenCalledWith('test-user-123')
  })
})

// ============================================================================
// POST /v1/parse-narrative
// ============================================================================

describe('POST /v1/parse-narrative', () => {
  it('returns 200 with parsed structure on valid request', async () => {
    m.llmClient.generate.mockResolvedValueOnce({ text: VALID_PARSE_RESPONSE, latencyMs: 100 })

    const res = await request(app)
      .post('/v1/parse-narrative')
      .send({ narrative: SAMPLE_NARRATIVE, userIdToken: VALID_TOKEN })

    expect(res.status).toBe(200)
    expect(res.body.ok).toBe(true)
    expect(res.body.parsed).toBeDefined()
    expect(res.body.confidence).toBe(0.85)
  })

  it('does NOT increment usage counter', async () => {
    m.llmClient.generate.mockResolvedValueOnce({ text: VALID_PARSE_RESPONSE, latencyMs: 100 })

    await request(app)
      .post('/v1/parse-narrative')
      .send({ narrative: SAMPLE_NARRATIVE, userIdToken: VALID_TOKEN })

    expect(m.userService.incrementUsage).not.toHaveBeenCalled()
  })

  it('returns empty structure when model fails', async () => {
    m.llmClient.generate.mockRejectedValueOnce(new Error('Model unavailable'))

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
      .send({ userIdToken: ADMIN_TOKEN })
    expect(res.status).toBe(400)
  })

  it('returns 401 when userIdToken is too short (auth middleware rejects)', async () => {
    const res = await request(app)
      .post('/v1/admin/set-plan')
      .send({ userIdToken: SHORT_TOKEN, targetUid: 'user-1', plan: 'pro' })
    expect(res.status).toBe(401)
  })

  it('returns 401 when Firebase token verification fails', async () => {
    const res = await request(app)
      .post('/v1/admin/set-plan')
      .send({ userIdToken: INVALID_TOKEN, targetUid: 'user-1', plan: 'pro' })
    expect(res.status).toBe(401)
  })

  it('returns 403 when token lacks admin claim', async () => {
    const res = await request(app)
      .post('/v1/admin/set-plan')
      .send({ userIdToken: VALID_TOKEN, targetUid: 'user-1', plan: 'pro' })
    expect(res.status).toBe(403)
    expect(res.body.error).toMatch(/admin/i)
  })

  it('returns 200 and updates plan for admin token', async () => {
    const res = await request(app)
      .post('/v1/admin/set-plan')
      .send({ userIdToken: ADMIN_TOKEN, targetUid: 'user-1', plan: 'pro' })

    expect(res.status).toBe(200)
    expect(res.body.ok).toBe(true)
    expect(res.body.message).toMatch(/pro/)
    expect(m.userService.adminSetPlan).toHaveBeenCalledWith('user-1', 'pro')
  })

  /**
   * Regression test: error response must NOT leak e.message.
   *
   * Errors now flow through asyncHandler → errorHandler middleware.
   * Unhandled errors return generic { error: 'Internal error', code: 'INTERNAL_ERROR' }.
   */
  it('does not leak internal error details in 500 response', async () => {
    m.userService.adminSetPlan.mockRejectedValueOnce(
      new Error('Firestore PERMISSION_DENIED: Missing permissions for users/user-1'),
    )

    const res = await request(app)
      .post('/v1/admin/set-plan')
      .send({ userIdToken: ADMIN_TOKEN, targetUid: 'user-1', plan: 'pro' })

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
    m.encounterRepo.get.mockResolvedValueOnce(null)

    const res = await request(app)
      .post('/v1/build-mode/process-section1')
      .send(validBody)
    expect(res.status).toBe(404)
  })

  it('returns 400 with isLocked when submission count >= 2', async () => {
    m.encounterRepo.get.mockResolvedValueOnce(
      makeEncounterDoc({ section1: { status: 'completed', submissionCount: 2 } }),
    )

    const res = await request(app)
      .post('/v1/build-mode/process-section1')
      .send(validBody)

    expect(res.status).toBe(400)
    expect(res.body.isLocked).toBe(true)
    expect(res.body.submissionCount).toBe(2)
  })

  it('counts quota only on first submission per encounter', async () => {
    m.encounterRepo.get.mockResolvedValueOnce(
      makeEncounterDoc({ quotaCounted: false }),
    )
    m.llmClient.generate.mockResolvedValueOnce({ text: VALID_SECTION1_RESPONSE, latencyMs: 100 })

    const res = await request(app)
      .post('/v1/build-mode/process-section1')
      .send(validBody)

    expect(res.status).toBe(200)
    // quota should have been atomically checked and incremented
    expect(m.userService.checkAndIncrementQuota).toHaveBeenCalledWith('test-user-123')
    // encounterRepo.markQuotaCounted should have been called
    expect(m.encounterRepo.markQuotaCounted).toHaveBeenCalledWith('test-user-123', 'enc-001')
  })

  it('does not re-count quota on subsequent submissions', async () => {
    m.encounterRepo.get.mockResolvedValueOnce(
      makeEncounterDoc({
        quotaCounted: true,
        section1: { status: 'completed', submissionCount: 1 },
      }),
    )
    m.llmClient.generate.mockResolvedValueOnce({ text: VALID_SECTION1_RESPONSE, latencyMs: 100 })

    const res = await request(app)
      .post('/v1/build-mode/process-section1')
      .send(validBody)

    expect(res.status).toBe(200)
    // quota check and increment should NOT be called (already counted)
    expect(m.userService.checkAndIncrementQuota).not.toHaveBeenCalled()
  })

  it('returns 402 when quota exceeded on first submission', async () => {
    m.encounterRepo.get.mockResolvedValueOnce(
      makeEncounterDoc({ quotaCounted: false }),
    )
    m.userService.checkAndIncrementQuota.mockResolvedValueOnce(makeQuotaCheck({
      allowed: false, used: 10, limit: 10, remaining: 0,
    }))

    const res = await request(app)
      .post('/v1/build-mode/process-section1')
      .send(validBody)

    expect(res.status).toBe(402)
    expect(res.body.error).toMatch(/quota/i)
  })

  it('returns 200 with differential on valid request', async () => {
    m.llmClient.generate.mockResolvedValueOnce({ text: VALID_SECTION1_RESPONSE, latencyMs: 100 })

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

  it('handles legacy flat-array response format', async () => {
    m.llmClient.generate.mockResolvedValueOnce({ text: LEGACY_SECTION1_RESPONSE, latencyMs: 100 })

    const res = await request(app)
      .post('/v1/build-mode/process-section1')
      .send(validBody)

    expect(res.status).toBe(200)
    expect(res.body.ok).toBe(true)
    expect(res.body.differential).toBeInstanceOf(Array)
    expect(res.body.differential.length).toBe(3)
    expect(res.body.differential[0].diagnosis).toBe('Acute MI')
  })

  it('handles response with code fences and preamble text', async () => {
    m.llmClient.generate.mockResolvedValueOnce({ text: FENCED_SECTION1_RESPONSE, latencyMs: 100 })

    const res = await request(app)
      .post('/v1/build-mode/process-section1')
      .send(validBody)

    expect(res.status).toBe(200)
    expect(res.body.ok).toBe(true)
    expect(res.body.differential).toBeInstanceOf(Array)
    expect(res.body.differential.length).toBe(3)
  })

  it('coerces non-standard urgency values from LLM output', async () => {
    m.llmClient.generate.mockResolvedValueOnce({ text: NONSTANDARD_URGENCY_SECTION1_RESPONSE, latencyMs: 100 })

    const res = await request(app)
      .post('/v1/build-mode/process-section1')
      .send(validBody)

    expect(res.status).toBe(200)
    expect(res.body.ok).toBe(true)
    expect(res.body.differential).toBeInstanceOf(Array)
    expect(res.body.differential.length).toBe(3)
    // Verify coercion: "critical" → "emergent", "moderate" → "urgent", "low" → "routine"
    expect(res.body.differential[0].urgency).toBe('emergent')
    expect(res.body.differential[1].urgency).toBe('urgent')
    expect(res.body.differential[2].urgency).toBe('routine')
  })

  it('handles response with trailing commas (common LLM artifact)', async () => {
    m.llmClient.generate.mockResolvedValueOnce({ text: TRAILING_COMMA_SECTION1_RESPONSE, latencyMs: 100 })

    const res = await request(app)
      .post('/v1/build-mode/process-section1')
      .send(validBody)

    expect(res.status).toBe(200)
    expect(res.body.ok).toBe(true)
    expect(res.body.differential).toBeInstanceOf(Array)
    expect(res.body.differential.length).toBe(2)
  })

  it('returns fallback differential when model returns garbage text', async () => {
    m.llmClient.generate.mockResolvedValueOnce({ text: 'This is not JSON at all, just random thoughts about medicine.', latencyMs: 100 })

    const res = await request(app)
      .post('/v1/build-mode/process-section1')
      .send(validBody)

    expect(res.status).toBe(200)
    expect(res.body.ok).toBe(true)
    expect(res.body.differential).toBeInstanceOf(Array)
    expect(res.body.differential.length).toBe(1)
    expect(res.body.differential[0].diagnosis).toMatch(/unable to parse/i)
  })

  it('extracts cdrAnalysis and workupRecommendations from new format', async () => {
    m.llmClient.generate.mockResolvedValueOnce({ text: VALID_SECTION1_RESPONSE, latencyMs: 100 })

    const res = await request(app)
      .post('/v1/build-mode/process-section1')
      .send(validBody)

    expect(res.status).toBe(200)
    // cdrAnalysis should be present in the response
    expect(res.body.cdrAnalysis).toBeInstanceOf(Array)
    expect(res.body.cdrAnalysis.length).toBeGreaterThan(0)
    expect(res.body.cdrAnalysis[0].name).toBe('HEART Score')
    // workupRecommendations should be present
    expect(res.body.workupRecommendations).toBeInstanceOf(Array)
    expect(res.body.workupRecommendations.length).toBeGreaterThan(0)
    expect(res.body.workupRecommendations[0].testId).toBe('troponin')
  })

  it('preserves valid items when some differential items fail validation (partial failure)', async () => {
    m.llmClient.generate.mockResolvedValueOnce({ text: PARTIAL_VALID_SECTION1_RESPONSE, latencyMs: 100 })

    const res = await request(app)
      .post('/v1/build-mode/process-section1')
      .send(validBody)

    expect(res.status).toBe(200)
    expect(res.body.ok).toBe(true)
    expect(res.body.differential).toBeInstanceOf(Array)
    // 6 items in, 2 invalid (null diagnosis + missing reasoning) → 4 survive
    expect(res.body.differential.length).toBe(4)
    expect(res.body.differential.map((d: { diagnosis: string }) => d.diagnosis)).toEqual([
      'Acute MI',
      'PE',
      'Pneumothorax',
      'Costochondritis',
    ])
  })

  it('defaults unmapped urgency to urgent instead of rejecting the item', async () => {
    m.llmClient.generate.mockResolvedValueOnce({ text: ALL_UNMAPPED_URGENCY_SECTION1_RESPONSE, latencyMs: 100 })

    const res = await request(app)
      .post('/v1/build-mode/process-section1')
      .send(validBody)

    expect(res.status).toBe(200)
    expect(res.body.ok).toBe(true)
    expect(res.body.differential).toBeInstanceOf(Array)
    expect(res.body.differential.length).toBe(2)
    // Both "semi-urgent" and "somewhat-concerning" should default to "urgent"
    expect(res.body.differential[0].urgency).toBe('urgent')
    expect(res.body.differential[1].urgency).toBe('urgent')
  })

  it('strips extra LLM fields without rejecting the item', async () => {
    m.llmClient.generate.mockResolvedValueOnce({ text: EXTRA_FIELDS_SECTION1_RESPONSE, latencyMs: 100 })

    const res = await request(app)
      .post('/v1/build-mode/process-section1')
      .send(validBody)

    expect(res.status).toBe(200)
    expect(res.body.ok).toBe(true)
    expect(res.body.differential).toBeInstanceOf(Array)
    expect(res.body.differential.length).toBe(2)
    // Extra fields (confidence, severity, likelihood) should be stripped by Zod
    expect(res.body.differential[0]).not.toHaveProperty('confidence')
    expect(res.body.differential[0]).not.toHaveProperty('severity')
    expect(res.body.differential[1]).not.toHaveProperty('likelihood')
  })
})

// ============================================================================
// BUILD MODE — Section ordering enforcement
// ============================================================================

describe('Build Mode section ordering', () => {
  it('returns 400 when submitting section2 before section1 is completed', async () => {
    m.encounterRepo.get.mockResolvedValueOnce(
      makeEncounterDoc({ section1: { status: 'pending', submissionCount: 0 } }),
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
    m.encounterRepo.get.mockResolvedValueOnce(
      makeEncounterDoc({
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
    m.encounterRepo.get.mockResolvedValue(
      makeEncounterDoc({
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

  it('returns 200 with data persistence confirmation', async () => {
    const res = await request(app)
      .post('/v1/build-mode/process-section2')
      .send(validBody)

    expect(res.status).toBe(200)
    expect(res.body.ok).toBe(true)
    expect(res.body.isLocked).toBe(false)
    expect(res.body.submissionCount).toBe(1)
  })

  it('returns 400 with isLocked after 2 submissions', async () => {
    m.encounterRepo.get.mockResolvedValueOnce(
      makeEncounterDoc({
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
    m.encounterRepo.get.mockResolvedValueOnce(null)

    const res = await request(app)
      .post('/v1/build-mode/process-section2')
      .send(validBody)
    expect(res.status).toBe(404)
  })

  /**
   * Regression test: raw-array format mismatch between section1 storage and section2 retrieval.
   *
   * Section 1 route stores `section1.llmResponse` as a raw DifferentialItem[] array.
   * Section 2 is now data-only (no LLM call), so it doesn't access llmResponse.
   * This test verifies the handler doesn't crash regardless of llmResponse shape.
   */
  it('handles section1 llmResponse stored as raw array', async () => {
    m.encounterRepo.get.mockResolvedValueOnce(
      makeEncounterDoc({
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
    m.encounterRepo.get.mockResolvedValue(
      makeEncounterDoc({
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
    m.llmClient.generate.mockResolvedValueOnce({ text: VALID_FINALIZE_RESPONSE, latencyMs: 100 })

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
    m.encounterRepo.get.mockResolvedValueOnce(
      makeEncounterDoc({
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
    m.llmClient.generate.mockResolvedValueOnce({ text: WRAPPED_FINALIZE_RESPONSE, latencyMs: 100 })

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
    m.llmClient.generate.mockResolvedValueOnce({ text: WRAPPED_FINALIZE_RESPONSE, latencyMs: 100 })

    const res = await request(app)
      .post('/v1/build-mode/finalize')
      .send(validBody)

    expect(res.status).toBe(200)
    expect(res.body.finalMdm.json.complexityLevel).toBe('high')
  })

  it('maps prompt field names to schema field names', async () => {
    m.llmClient.generate.mockResolvedValueOnce({ text: WRAPPED_FINALIZE_RESPONSE, latencyMs: 100 })

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
    m.llmClient.generate.mockResolvedValueOnce({ text: 'This is not JSON at all <html>oops</html>', latencyMs: 100 })

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
    m.encounterRepo.get.mockResolvedValue(
      makeEncounterDoc({
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
    m.encounterRepo.get.mockResolvedValueOnce(null)

    const res = await request(app)
      .post('/v1/quick-mode/generate')
      .send(validBody)
    expect(res.status).toBe(404)
  })

  it('returns 400 when encounter is not quick mode', async () => {
    m.encounterRepo.get.mockResolvedValueOnce(
      makeEncounterDoc({ mode: 'build' }),
    )

    const res = await request(app)
      .post('/v1/quick-mode/generate')
      .send(validBody)
    expect(res.status).toBe(400)
    expect(res.body.error).toMatch(/quick mode/i)
  })

  it('returns 400 when encounter is already processed', async () => {
    m.encounterRepo.get.mockResolvedValueOnce(
      makeEncounterDoc({
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
    m.userService.checkAndIncrementQuota.mockResolvedValueOnce(makeQuotaCheck({
      allowed: false, used: 10, limit: 10, remaining: 0,
    }))

    const res = await request(app)
      .post('/v1/quick-mode/generate')
      .send(validBody)
    expect(res.status).toBe(402)
    expect(res.body.error).toMatch(/quota/i)
  })

  it('returns 200 with MDM on valid request', async () => {
    m.llmClient.generate.mockResolvedValueOnce({ text: VALID_QUICK_MODE_RESPONSE, latencyMs: 100 })

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
    m.llmClient.generate.mockReset()
    m.llmClient.generate.mockRejectedValue(new Error('Model unavailable'))

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
    m.llmClient.generate.mockResolvedValueOnce({ text: VALID_QUICK_MODE_RESPONSE, latencyMs: 100 })

    const res = await request(app)
      .post('/v1/quick-mode/generate')
      .send({ ...validBody, narrative: oversizedNarrative })

    expect(res.status).toBe(400)
    expect(res.body.error).toMatch(/too large/i)
    expect(res.body.tokenEstimate).toBeGreaterThan(2000)
    expect(res.body.maxAllowed).toBe(2000)
  })
})
