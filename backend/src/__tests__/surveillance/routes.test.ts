/**
 * Integration tests for surveillance API routes.
 *
 * Strategy:
 *   - vi.mock() for firebase-admin, userService, and all surveillance modules.
 *   - supertest drives HTTP requests against an Express app using the surveillance router.
 *
 * IMPORTANT: All medical content here is fictional / educational only. No PHI.
 */

import { describe, it, expect, vi, beforeAll, beforeEach } from 'vitest'
import request from 'supertest'
import express from 'express'
import type { Express } from 'express'

// ---------------------------------------------------------------------------
// Module-level mocks (hoisted by vitest)
// ---------------------------------------------------------------------------

const mockVerifyIdToken = vi.fn()
const mockFirestoreDocSet = vi.fn().mockResolvedValue(undefined)
const mockFirestoreDocGet = vi.fn()

vi.mock('firebase-admin', () => {
  const Timestamp = { now: () => ({ seconds: 1700000000, nanoseconds: 0 }) }
  const FieldValue = {
    increment: (n: number) => `FieldValue.increment(${n})`,
    serverTimestamp: () => ({ _type: 'serverTimestamp' }),
  }

  const adminMock = {
    apps: [{}],
    initializeApp: vi.fn(),
    credential: { cert: vi.fn() },
    auth: () => ({ verifyIdToken: mockVerifyIdToken }),
    firestore: Object.assign(
      () => ({
        collection: vi.fn().mockReturnValue({
          doc: vi.fn().mockReturnValue({
            set: mockFirestoreDocSet,
            get: mockFirestoreDocGet,
          }),
        }),
      }),
      { Timestamp, FieldValue },
    ),
  }
  return { default: adminMock }
})

const mockGetUsageStats = vi.fn()

vi.mock('../../services/userService', () => ({
  userService: {
    getUsageStats: (...args: unknown[]) => mockGetUsageStats(...args),
  },
}))

const mockMapToSyndromes = vi.fn()
vi.mock('../../surveillance/syndromeMapper', () => ({
  mapToSyndromes: (...args: unknown[]) => mockMapToSyndromes(...args),
}))

const mockResolve = vi.fn()
vi.mock('../../surveillance/regionResolver', () => ({
  RegionResolver: function () {
    return { resolve: mockResolve }
  },
}))

const mockFetchAll = vi.fn()
vi.mock('../../surveillance/adapters/adapterRegistry', () => ({
  AdapterRegistry: function () {
    return { fetchAll: mockFetchAll }
  },
}))

const mockComputeCorrelations = vi.fn()
const mockDetectAlerts = vi.fn()
vi.mock('../../surveillance/correlationEngine', () => ({
  computeCorrelations: (...args: unknown[]) => mockComputeCorrelations(...args),
  detectAlerts: (...args: unknown[]) => mockDetectAlerts(...args),
}))

vi.mock('../../surveillance/promptAugmenter', () => ({
  buildSurveillanceContext: vi.fn().mockReturnValue(''),
}))

const mockGenerateTrendReport = vi.fn()
vi.mock('../../surveillance/pdfGenerator', () => ({
  generateTrendReport: (...args: unknown[]) => mockGenerateTrendReport(...args),
}))

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const VALID_TOKEN = 'a]valid-firebase-token-with-enough-length'
const INVALID_TOKEN = 'invalid-token-that-will-throw-error!!!!!'
const TEST_UID = 'test-user-123'
const TEST_ANALYSIS_ID = '550e8400-e29b-41d4-a716-446655440000'

const PRO_STATS = {
  plan: 'pro' as const,
  used: 5,
  limit: 250,
  remaining: 245,
  percentUsed: 2,
  periodKey: '2026-02',
  features: {
    maxRequestsPerMonth: 250,
    maxTokensPerRequest: 8000,
    priorityProcessing: true,
    exportFormats: ['text', 'pdf', 'docx'],
    apiAccess: true,
    teamMembers: 3,
  },
}

const FREE_STATS = {
  plan: 'free' as const,
  used: 2,
  limit: 10,
  remaining: 8,
  percentUsed: 20,
  periodKey: '2026-02',
  features: {
    maxRequestsPerMonth: 10,
    maxTokensPerRequest: 2000,
    priorityProcessing: false,
    exportFormats: ['text'],
    apiAccess: false,
    teamMembers: 1,
  },
}

const MOCK_REGION = {
  state: 'Texas',
  stateAbbrev: 'TX',
  hhsRegion: 6,
  geoLevel: 'state' as const,
}

const MOCK_DATA_POINT = {
  source: 'cdc_respiratory',
  condition: 'Influenza',
  syndromes: ['respiratory_upper' as const],
  region: 'TX',
  geoLevel: 'state' as const,
  periodStart: '2026-02-01',
  periodEnd: '2026-02-08',
  value: 15,
  unit: 'percent_positive',
  trend: 'rising' as const,
  trendMagnitude: 20,
}

const MOCK_CORRELATION = {
  condition: 'Influenza',
  syndromes: ['respiratory_upper' as const],
  overallScore: 65,
  tier: 'high' as const,
  components: {
    symptomMatch: 20,
    differentialMatch: 15,
    epidemiologicSignal: 15,
    seasonalPlausibility: 10,
    geographicRelevance: 5,
  },
  trendDirection: 'rising' as const,
  trendMagnitude: 20,
  dataPoints: [MOCK_DATA_POINT],
  summary: 'Influenza is trending upward (~20% increase) in the region. Clinical relevance: high.',
}

// ---------------------------------------------------------------------------
// App setup
// ---------------------------------------------------------------------------

let app: Express

beforeAll(async () => {
  const { default: router } = await import('../../surveillance/routes')
  app = express()
  app.use(express.json())
  app.use(router)
})

// ---------------------------------------------------------------------------
// Reset mocks between tests
// ---------------------------------------------------------------------------

beforeEach(() => {
  vi.clearAllMocks()

  // Default: valid token returns test user
  mockVerifyIdToken.mockImplementation((token: string) => {
    if (token === VALID_TOKEN) {
      return Promise.resolve({ uid: TEST_UID, email: 'doc@example.com' })
    }
    return Promise.reject(new Error('Invalid token'))
  })

  // Default: pro plan user
  mockGetUsageStats.mockResolvedValue(PRO_STATS)

  // Default: syndrome mapping returns respiratory
  mockMapToSyndromes.mockReturnValue(['respiratory_upper'])

  // Default: region resolves successfully
  mockResolve.mockResolvedValue(MOCK_REGION)

  // Default: adapter registry returns data
  mockFetchAll.mockResolvedValue({ dataPoints: [MOCK_DATA_POINT], errors: [] })

  // Default: correlation engine returns findings
  mockComputeCorrelations.mockReturnValue([MOCK_CORRELATION])
  mockDetectAlerts.mockReturnValue([])

  // Default: Firestore set succeeds (already set in mock)
  mockFirestoreDocSet.mockResolvedValue(undefined)

  // Default: Firestore get for report endpoint
  mockFirestoreDocGet.mockResolvedValue({
    exists: true,
    data: () => ({
      analysisId: TEST_ANALYSIS_ID,
      region: MOCK_REGION,
      regionLabel: 'Texas — HHS Region 6',
      rankedFindings: [MOCK_CORRELATION],
      alerts: [],
      summary: 'Test summary',
      dataSourcesQueried: ['CDC Respiratory'],
      dataSourceErrors: [],
      analyzedAt: '2026-02-18T00:00:00.000Z',
      uid: TEST_UID,
    }),
  })

  // Default: PDF generator returns a buffer
  mockGenerateTrendReport.mockResolvedValue(Buffer.from('%PDF-1.4 test'))
})

// ===========================================================================
// POST /v1/surveillance/analyze
// ===========================================================================

describe('POST /v1/surveillance/analyze', () => {
  const VALID_BODY = {
    userIdToken: VALID_TOKEN,
    chiefComplaint: 'fever and cough',
    differential: ['Influenza', 'Pneumonia'],
    location: { state: 'TX' },
  }

  it('returns 400 on missing/invalid body', async () => {
    const res = await request(app)
      .post('/v1/surveillance/analyze')
      .send({})

    expect(res.status).toBe(400)
    expect(res.body.error).toBe('Invalid request')
  })

  it('returns 400 when userIdToken is too short', async () => {
    const res = await request(app)
      .post('/v1/surveillance/analyze')
      .send({ ...VALID_BODY, userIdToken: '123456789' })

    expect(res.status).toBe(400)
    expect(res.body.error).toBe('Invalid request')
  })

  it('returns 400 when location has neither zip nor state', async () => {
    const res = await request(app)
      .post('/v1/surveillance/analyze')
      .send({ ...VALID_BODY, location: {} })

    expect(res.status).toBe(400)
  })

  it('returns 401 on invalid token', async () => {
    const res = await request(app)
      .post('/v1/surveillance/analyze')
      .send({ ...VALID_BODY, userIdToken: INVALID_TOKEN })

    expect(res.status).toBe(401)
    expect(res.body.error).toBe('Unauthorized')
  })

  it('returns 403 for free plan users', async () => {
    mockGetUsageStats.mockResolvedValue(FREE_STATS)

    const res = await request(app)
      .post('/v1/surveillance/analyze')
      .send(VALID_BODY)

    expect(res.status).toBe(403)
    expect(res.body.error).toBe(
      'Surveillance analysis requires a Pro or Enterprise plan',
    )
  })

  it('returns 400 when region cannot be resolved', async () => {
    mockResolve.mockResolvedValue(null)

    const res = await request(app)
      .post('/v1/surveillance/analyze')
      .send(VALID_BODY)

    expect(res.status).toBe(400)
    expect(res.body.error).toBe('Could not resolve location')
  })

  it('returns 200 with analysis on valid request', async () => {
    const res = await request(app)
      .post('/v1/surveillance/analyze')
      .send(VALID_BODY)

    expect(res.status).toBe(200)
    expect(res.body.ok).toBe(true)
    expect(res.body.analysis).toBeDefined()
    expect(res.body.analysis.region).toEqual(MOCK_REGION)
    expect(res.body.analysis.rankedFindings).toHaveLength(1)
    expect(res.body.analysis.rankedFindings[0].condition).toBe('Influenza')
    expect(res.body.analysis.analysisId).toBeDefined()
    expect(res.body.analysis.regionLabel).toBe('Texas — HHS Region 6')
    expect(res.body.analysis.dataSourcesQueried).toContain('CDC Respiratory')
    expect(res.body.warnings).toBeUndefined()

    // Verify Firestore was called to persist the analysis
    expect(mockFirestoreDocSet).toHaveBeenCalledTimes(1)
  })

  it('returns 200 with warnings when some adapters fail', async () => {
    mockFetchAll.mockResolvedValue({
      dataPoints: [MOCK_DATA_POINT],
      errors: [
        {
          source: 'cdc_wastewater',
          error: 'API timeout',
          timestamp: '2026-02-18T00:00:00.000Z',
        },
      ],
    })

    const res = await request(app)
      .post('/v1/surveillance/analyze')
      .send(VALID_BODY)

    expect(res.status).toBe(200)
    expect(res.body.ok).toBe(true)
    expect(res.body.warnings).toBeDefined()
    expect(res.body.warnings).toContain('API timeout')
    // The failed source should be excluded from dataSourcesQueried
    expect(res.body.analysis.dataSourceErrors).toHaveLength(1)
  })

  it('includes county in regionLabel when resolved from zip', async () => {
    mockResolve.mockResolvedValue({
      ...MOCK_REGION,
      county: 'Harris County',
      zipCode: '77001',
      geoLevel: 'county' as const,
    })

    const res = await request(app)
      .post('/v1/surveillance/analyze')
      .send({ ...VALID_BODY, location: { zipCode: '77001' } })

    expect(res.status).toBe(200)
    expect(res.body.analysis.regionLabel).toBe(
      'Harris County, TX area — HHS Region 6',
    )
  })
})

// ===========================================================================
// POST /v1/surveillance/report
// ===========================================================================

describe('POST /v1/surveillance/report', () => {
  const VALID_BODY = {
    userIdToken: VALID_TOKEN,
    analysisId: TEST_ANALYSIS_ID,
  }

  it('returns 400 on missing/invalid body', async () => {
    const res = await request(app)
      .post('/v1/surveillance/report')
      .send({})

    expect(res.status).toBe(400)
    expect(res.body.error).toBe('Invalid request')
  })

  it('returns 400 when analysisId is not a valid UUID', async () => {
    const res = await request(app)
      .post('/v1/surveillance/report')
      .send({ ...VALID_BODY, analysisId: 'not-a-uuid' })

    expect(res.status).toBe(400)
  })

  it('returns 401 on invalid token', async () => {
    const res = await request(app)
      .post('/v1/surveillance/report')
      .send({ ...VALID_BODY, userIdToken: INVALID_TOKEN })

    expect(res.status).toBe(401)
    expect(res.body.error).toBe('Unauthorized')
  })

  it('returns 403 when user lacks PDF export access', async () => {
    mockGetUsageStats.mockResolvedValue(FREE_STATS)

    const res = await request(app)
      .post('/v1/surveillance/report')
      .send(VALID_BODY)

    expect(res.status).toBe(403)
    expect(res.body.error).toBe('PDF export requires a Pro or Enterprise plan')
  })

  it('returns 404 when analysis not found', async () => {
    mockFirestoreDocGet.mockResolvedValue({
      exists: false,
      data: () => null,
    })

    const res = await request(app)
      .post('/v1/surveillance/report')
      .send(VALID_BODY)

    expect(res.status).toBe(404)
    expect(res.body.error).toBe('Analysis not found')
  })

  it('returns 403 when analysis belongs to a different user', async () => {
    mockFirestoreDocGet.mockResolvedValue({
      exists: true,
      data: () => ({
        analysisId: TEST_ANALYSIS_ID,
        uid: 'different-user-456',
      }),
    })

    const res = await request(app)
      .post('/v1/surveillance/report')
      .send(VALID_BODY)

    expect(res.status).toBe(403)
    expect(res.body.error).toBe('Unauthorized')
  })

  it('returns 200 with PDF content-type on valid request', async () => {
    const res = await request(app)
      .post('/v1/surveillance/report')
      .send(VALID_BODY)

    expect(res.status).toBe(200)
    expect(res.headers['content-type']).toMatch(/application\/pdf/)
    expect(res.headers['content-disposition']).toContain('attachment')
    expect(res.headers['content-disposition']).toContain(TEST_ANALYSIS_ID)
    expect(mockGenerateTrendReport).toHaveBeenCalledTimes(1)
  })
})
