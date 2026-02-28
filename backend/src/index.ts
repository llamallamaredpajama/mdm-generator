import 'dotenv/config'
import express from 'express'
import helmet from 'helmet'
import rateLimit from 'express-rate-limit'
import { z } from 'zod'
import fs from 'node:fs/promises'
import path from 'node:path'
import admin from 'firebase-admin'
import { buildPrompt } from './promptBuilder'
import { buildParsePrompt, getEmptyParsedNarrative, type ParsedNarrative } from './parsePromptBuilder'
import { MdmSchema, renderMdmText } from './outputSchema'
import { callGemini } from './vertex'
import { userService } from './services/userService'
import {
  Section1RequestSchema,
  Section2RequestSchema,
  FinalizeRequestSchema,
  MatchCdrsRequestSchema,
  SuggestDiagnosisRequestSchema,
  ParseResultsRequestSchema,
  DifferentialItemSchema,
  CdrAnalysisItemSchema,
  WorkupRecommendationSchema,
  MdmPreviewSchema,
  FinalMdmSchema,
  type DifferentialItem,
  type CdrAnalysisItem,
  type WorkupRecommendation,
  type MdmPreview,
  type FinalMdm,
  type CdrTracking,
  type TestResult,
  type ParsedResultItem,
} from './buildModeSchemas'
import {
  buildSection1Prompt,
  buildSection2Prompt,
  buildFinalizePrompt,
  buildCdrAutoPopulatePrompt,
  buildSuggestDiagnosisPrompt,
  buildParseResultsPrompt,
  type FinalizeStructuredData,
} from './promptBuilderBuildMode'
import { buildCompactCatalog } from './services/testCatalogFormatter'
import { getRelevantTests } from './services/testCatalogSearch'
import { matchCdrsFromDifferential } from './services/cdrMatcher'
import { buildCdrTracking, type AutoPopulatedValues } from './services/cdrTrackingBuilder'
import {
  buildQuickModePrompt,
  parseQuickModeResponse,
  getQuickModeFallback,
  type QuickModeGenerationResult,
} from './promptBuilderQuickMode'
import surveillanceRouter from './surveillance/routes'
import { mapToSyndromes } from './surveillance/syndromeMapper'
import { RegionResolver } from './surveillance/regionResolver'
import { AdapterRegistry } from './surveillance/adapters/adapterRegistry'
import { computeCorrelations } from './surveillance/correlationEngine'
import { buildSurveillanceContext, appendSurveillanceToMdmText } from './surveillance/promptAugmenter'
import { searchCdrCatalog } from './services/cdrCatalogSearch'
import { formatCdrContext } from './services/cdrCatalogFormatter'
import type { TestDefinition, TestCategory, TestLibraryResponse, CdrDefinition } from './types/libraries'
import {
  OrderSetCreateSchema,
  OrderSetUpdateSchema,
  DispositionFlowCreateSchema,
  DispositionFlowUpdateSchema,
  ReportTemplateCreateSchema,
  CustomizableOptionsSchema,
} from './types/userProfile'

const app = express()

// CORS configuration
const allowedOrigins = [
  process.env.FRONTEND_URL, // Production frontend URL
].filter(Boolean) as string[]

app.use((req, res, next) => {
  const origin = req.headers.origin
  // Allow any localhost origin (Vite auto-increments ports) or listed/Firebase origins
  const isLocalhost = origin?.match(/^http:\/\/localhost:\d+$/)
  if (origin && (isLocalhost || allowedOrigins.includes(origin) || origin.match(/^https:\/\/mdm-generator[^.]*\.web\.app$/))) {
    res.header('Access-Control-Allow-Origin', origin)
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
    res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization')
    res.header('Access-Control-Allow-Credentials', 'true')
  }
  if (req.method === 'OPTIONS') {
    return res.sendStatus(204)
  }
  next()
})

app.use(express.json({ limit: '1mb' }))

// Security headers
app.use(helmet())

// Rate limiting — global: 60 req/min per IP
const globalLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 60,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests, please try again later' },
})
app.use(globalLimiter)

// Strict LLM rate limit: 10 req/min per IP (for endpoints that call Vertex AI)
const llmLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Rate limit exceeded for AI operations' },
})

// Very strict limit for unquoted LLM calls: 5 req/min
const parseLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Rate limit exceeded for parse operations' },
})

// In-memory cache for test library (rarely changes)
const TEST_LIBRARY_CACHE_TTL = 5 * 60 * 1000 // 5 minutes
let testLibraryCache: TestLibraryResponse | null = null
let testLibraryCacheTime = 0

// In-memory cache for CDR library (rarely changes — only via seed script)
const CDR_LIBRARY_CACHE_TTL = 5 * 60 * 1000 // 5 minutes
let cdrLibraryCache: { ok: true; cdrs: CdrDefinition[] } | null = null
let cdrLibraryCacheTime = 0

/**
 * Shared helper: read CDR library from cache or Firestore.
 * Used by GET /v1/libraries/cdrs and POST /v1/build-mode/match-cdrs.
 */
async function getCachedCdrLibrary(): Promise<CdrDefinition[]> {
  const now = Date.now()
  if (cdrLibraryCache && (now - cdrLibraryCacheTime) < CDR_LIBRARY_CACHE_TTL) {
    return cdrLibraryCache.cdrs
  }

  const snapshot = await getDb().collection('cdrLibrary').get()
  const cdrs: CdrDefinition[] = []
  for (const doc of snapshot.docs) {
    const d = doc.data()
    if (d.id && d.name && d.components && d.scoring) {
      cdrs.push(d as CdrDefinition)
    } else {
      console.warn({ action: 'cdr-cache-refresh', warning: 'skipped malformed doc', docId: doc.id })
    }
  }

  cdrLibraryCache = { ok: true as const, cdrs }
  cdrLibraryCacheTime = now
  return cdrs
}

/**
 * Shared helper: read test library from cache or Firestore.
 * Used by GET /v1/libraries/tests and POST /v1/build-mode/parse-results.
 */
async function getCachedTestLibrary(): Promise<TestDefinition[]> {
  const now = Date.now()
  if (testLibraryCache && (now - testLibraryCacheTime) < TEST_LIBRARY_CACHE_TTL) {
    return testLibraryCache.tests
  }

  const snapshot = await getDb().collection('testLibrary').get()
  const tests: TestDefinition[] = []
  for (const doc of snapshot.docs) {
    const d = doc.data()
    if (d.id && d.name && d.category) {
      tests.push(d as TestDefinition)
    }
  }
  const categories = [...new Set(tests.map(t => t.category))] as TestCategory[]

  testLibraryCache = { ok: true, tests, categories, cachedAt: new Date().toISOString() }
  testLibraryCacheTime = now
  return tests
}

/**
 * Build a structured cdrContext string from encounter cdrTracking for the finalize prompt.
 * Skips dismissed CDRs. Returns undefined if no non-dismissed CDRs exist.
 */
function buildCdrContextString(cdrTracking: CdrTracking): string | undefined {
  const entries = Object.entries(cdrTracking)
  if (entries.length === 0) return undefined

  const lines: string[] = []

  for (const [, entry] of entries) {
    if (entry.dismissed || entry.excluded) continue

    const components = Object.entries(entry.components)
    const answeredCount = components.filter(([, c]) => c.answered).length
    const totalCount = components.length

    if (entry.status === 'completed' && entry.score != null) {
      lines.push(`${entry.name}: Score ${entry.score} — ${entry.interpretation || 'No interpretation'}`)
      for (const [compId, compState] of components) {
        if (compState.answered) {
          lines.push(`  - ${compId}: ${compState.value ?? 'N/A'} (source: ${compState.source || 'unknown'})`)
        }
      }
    } else if (entry.status === 'partial') {
      lines.push(`${entry.name}: Partial (${answeredCount}/${totalCount} answered)`)
      for (const [compId, compState] of components) {
        if (compState.answered) {
          lines.push(`  - ${compId}: ${compState.value ?? 'N/A'} (source: ${compState.source || 'unknown'})`)
        }
      }
      const pendingCount = totalCount - answeredCount
      if (pendingCount > 0) {
        lines.push(`  - (${pendingCount} pending)`)
      }
    } else if (entry.status === 'pending') {
      lines.push(`${entry.name}: Pending (0/${totalCount} answered)`)
    }

    lines.push('')
  }

  const result = lines.join('\n').trim()
  return result || undefined
}

// Initialize Firebase Admin (expects GOOGLE_APPLICATION_CREDENTIALS_JSON or GOOGLE_APPLICATION_CREDENTIALS or default creds in Cloud Run)
async function initFirebase() {
  try {
    if (!admin.apps.length) {
      const serviceAccountJson = process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON
      const serviceAccountPath = process.env.GOOGLE_APPLICATION_CREDENTIALS
      
      if (serviceAccountJson) {
        // Initialize with JSON content from environment variable
        console.log('Initializing Firebase Admin with JSON credentials from environment')
        const serviceAccount = JSON.parse(serviceAccountJson)
        admin.initializeApp({
          credential: admin.credential.cert(serviceAccount),
          projectId: process.env.PROJECT_ID || 'mdm-generator'
        })
      } else if (serviceAccountPath && serviceAccountPath.includes('.json')) {
        // Initialize with service account file
        console.log('Initializing Firebase Admin with service account file:', serviceAccountPath)
        const serviceAccountContent = await fs.readFile(path.resolve(serviceAccountPath), 'utf8')
        const serviceAccount = JSON.parse(serviceAccountContent)
        admin.initializeApp({
          credential: admin.credential.cert(serviceAccount),
          projectId: process.env.PROJECT_ID || 'mdm-generator'
        })
      } else {
        // Initialize with default credentials
        console.log('Initializing Firebase Admin with default credentials')
        admin.initializeApp()
      }
      console.log('Firebase Admin initialized successfully')
    }
  } catch (e) {
    console.error('Firebase Admin initialization error:', e)
    // swallow init errors in local dev; will throw on verify if misconfigured
  }
}

const GenerateSchema = z.object({
  narrative: z.string().min(1).max(16000),
  userIdToken: z.string().min(10),
})

/** Reusable token-size check against plan limits */
function checkTokenSize(text: string, maxTokensPerRequest: number) {
  const tokenEstimate = Math.ceil(text.length / 4)
  if (tokenEstimate > maxTokensPerRequest) {
    return {
      exceeded: true as const,
      payload: {
        error: `Input too large for your plan. Maximum ${maxTokensPerRequest} tokens allowed.`,
        tokenEstimate,
        maxAllowed: maxTokensPerRequest,
      },
    }
  }
  return { exceeded: false as const }
}

app.get('/health', (_req, res) => res.json({ ok: true }))

// ============================================================================
// Library Endpoints
// ============================================================================

/**
 * GET /v1/libraries/tests
 * Returns the canonical ER test catalog from the testLibrary Firestore collection.
 * In-memory cached for 5 minutes since test library data rarely changes.
 */
app.get('/v1/libraries/tests', async (req, res) => {
  try {
    // 1. AUTHENTICATE
    const idToken = req.headers.authorization?.split('Bearer ')[1]
    if (!idToken) return res.status(401).json({ error: 'Unauthorized' })
    try {
      await admin.auth().verifyIdToken(idToken)
    } catch {
      return res.status(401).json({ error: 'Unauthorized' })
    }

    // 2. No request body to VALIDATE (GET request)
    // 3. No special AUTHORIZATION needed (any authenticated user can read tests)

    // 4. EXECUTE — return from cache or read Firestore
    const now = Date.now()
    if (testLibraryCache && (now - testLibraryCacheTime) < TEST_LIBRARY_CACHE_TTL) {
      console.log({ action: 'get-test-library', cached: true, timestamp: new Date().toISOString() })
      return res.json(testLibraryCache)
    }

    const snapshot = await getDb().collection('testLibrary').get()
    const tests: TestDefinition[] = []
    for (const doc of snapshot.docs) {
      const d = doc.data()
      if (d.id && d.name && d.category) {
        tests.push(d as TestDefinition)
      } else {
        console.warn({ action: 'get-test-library', warning: 'skipped malformed doc', docId: doc.id })
      }
    }
    const categories = [...new Set(tests.map(t => t.category))] as TestCategory[]

    const response: TestLibraryResponse = {
      ok: true,
      tests,
      categories,
      cachedAt: new Date().toISOString(),
    }

    testLibraryCache = response
    testLibraryCacheTime = now

    // 5. AUDIT
    console.log({ action: 'get-test-library', testCount: tests.length, timestamp: new Date().toISOString() })

    // 6. RESPOND
    return res.json(response)
  } catch (e: unknown) {
    console.error('get-test-library error:', e instanceof Error ? e.message : 'unknown error')
    return res.status(500).json({ error: 'Internal error' })
  }
})

/**
 * GET /v1/libraries/cdrs
 * Returns all CDR definitions from the cdrLibrary Firestore collection.
 */
app.get('/v1/libraries/cdrs', async (req, res) => {
  try {
    // 1. AUTHENTICATE
    const idToken = req.headers.authorization?.split('Bearer ')[1]
    if (!idToken) return res.status(401).json({ error: 'Unauthorized' })
    try {
      await admin.auth().verifyIdToken(idToken)
    } catch {
      return res.status(401).json({ error: 'Unauthorized' })
    }

    // 2. VALIDATE — no body for GET
    // 3. AUTHORIZE — any authenticated user can read CDR library

    // 4. EXECUTE — use shared cache helper
    const cdrs = await getCachedCdrLibrary()

    // 5. AUDIT
    console.log({ action: 'list-cdrs', cdrCount: cdrs.length, timestamp: new Date().toISOString() })

    // 6. RESPOND
    return res.json({ ok: true, cdrs })
  } catch (error) {
    console.error('list-cdrs error:', error)
    return res.status(500).json({ error: 'Internal error' })
  }
})

// Admin endpoint to set user plan (protected by admin check)
app.post('/v1/admin/set-plan', async (req, res) => {
  try {
    const AdminPlanSchema = z.object({
      adminToken: z.string().min(10),
      targetUid: z.string().min(1),
      plan: z.enum(['free', 'pro', 'enterprise'])
    })
    
    const parsed = AdminPlanSchema.safeParse(req.body)
    if (!parsed.success) return res.status(400).json({ error: 'Invalid request' })
    
    // Verify admin token
    try {
      const decoded = await admin.auth().verifyIdToken(parsed.data.adminToken)
      // Check if user has admin custom claim
      if (!decoded.admin) {
        return res.status(403).json({ error: 'Admin access required' })
      }
    } catch (e) {
      return res.status(401).json({ error: 'Invalid admin token' })
    }
    
    // Update user plan
    await userService.adminSetPlan(parsed.data.targetUid, parsed.data.plan)
    
    return res.json({ 
      ok: true, 
      message: `User ${parsed.data.targetUid} updated to ${parsed.data.plan} plan`
    })
  } catch (e: unknown) {
    console.error('admin/set-plan error:', e instanceof Error ? e.message : 'unknown error')
    return res.status(500).json({ error: 'Internal error' })
  }
})

app.post('/v1/whoami', async (req, res) => {
  try {
    const TokenSchema = z.object({ userIdToken: z.string().min(10) })
    const parsed = TokenSchema.safeParse(req.body)
    if (!parsed.success) return res.status(400).json({ error: 'Invalid request' })
    
    try {
      const decoded = await admin.auth().verifyIdToken(parsed.data.userIdToken)
      const uid = decoded.uid
      const email = decoded.email || ''
      
      // Ensure user exists
      await userService.ensureUser(uid, email)
      
      // Get usage stats
      const stats = await userService.getUsageStats(uid)
      
      return res.json({ 
        ok: true, 
        uid,
        email,
        ...stats
      })
    } catch (e) {
      return res.status(401).json({ error: 'Unauthorized' })
    }
  } catch (e) {
    console.error(e)
    return res.status(500).json({ error: 'Internal error' })
  }
})

// Parse narrative into structured MDM fields (Build Mode helper)
// Does NOT count against user quota - this is a UI helper
const ParseNarrativeSchema = z.object({
  narrative: z.string().min(1).max(16000),
  userIdToken: z.string().min(10),
})

app.post('/v1/parse-narrative', parseLimiter, async (req, res) => {
  try {
    const parsed = ParseNarrativeSchema.safeParse(req.body)
    if (!parsed.success) return res.status(400).json({ error: 'Invalid request' })

    // Verify Firebase ID token
    let uid = 'anonymous'
    try {
      const decoded = await admin.auth().verifyIdToken(parsed.data.userIdToken)
      uid = decoded.uid
    } catch (e) {
      return res.status(401).json({ error: 'Unauthorized' })
    }

    const { narrative } = parsed.data

    // Build prompt and call model
    const prompt = buildParsePrompt(narrative)

    let parsedNarrative: ParsedNarrative
    try {
      const result = await callGemini(prompt)

      console.log({ action: 'model-response', endpoint: 'parse-narrative', responseLength: result.text.length })

      // Strip markdown code fences if present
      let cleanedText = result.text
        .replace(/^```json\s*/gm, '')
        .replace(/^```\s*$/gm, '')
        .trim()

      // Try to parse the JSON response
      try {
        parsedNarrative = JSON.parse(cleanedText) as ParsedNarrative
      } catch (parseError) {
        console.log('JSON parsing failed:', parseError)
        // Fallback: try to find JSON in the response
        const jsonStart = cleanedText.indexOf('{')
        const jsonEnd = cleanedText.lastIndexOf('}')
        if (jsonStart >= 0 && jsonEnd > jsonStart) {
          const jsonStr = cleanedText.slice(jsonStart, jsonEnd + 1)
          parsedNarrative = JSON.parse(jsonStr) as ParsedNarrative
        } else {
          throw new Error('Invalid model output - no valid JSON found')
        }
      }

      // Ensure required fields exist with defaults
      if (typeof parsedNarrative.confidence !== 'number') {
        parsedNarrative.confidence = 0.5
      }
      if (!Array.isArray(parsedNarrative.warnings)) {
        parsedNarrative.warnings = []
      }

    } catch (e) {
      console.warn('Parse model failed, returning empty structure:', e)
      parsedNarrative = getEmptyParsedNarrative()
    }

    // Note: This endpoint does NOT increment usage - it's a UI helper
    console.log('Parse narrative completed', { uid, confidence: parsedNarrative.confidence })

    return res.json({
      ok: true,
      parsed: parsedNarrative,
      confidence: parsedNarrative.confidence,
      warnings: parsedNarrative.warnings
    })
  } catch (e: unknown) {
    const err = e instanceof Error ? e : new Error('unknown error')
    const status = (e as { status?: number })?.status || 500
    if (status !== 500) return res.status(status).json({ error: err.message })
    console.error('parse-narrative error:', err.message)
    return res.status(500).json({ error: 'Internal error' })
  }
})

app.post('/v1/generate', llmLimiter, async (req, res) => {
  try {
    const parsed = GenerateSchema.safeParse(req.body)
    if (!parsed.success) return res.status(400).json({ error: 'Invalid request' })

    // Verify Firebase ID token
    let uid = 'anonymous'
    let email = ''
    try {
      const decoded = await admin.auth().verifyIdToken(parsed.data.userIdToken)
      uid = decoded.uid
      email = decoded.email || ''
    } catch (e) {
      return res.status(401).json({ error: 'Unauthorized' })
    }

    const { narrative } = parsed.data
    
    // Ensure user exists
    await userService.ensureUser(uid, email)
    
    // Check and atomically increment quota
    const quotaCheck = await userService.checkAndIncrementQuota(uid)
    if (!quotaCheck.allowed) {
      return res.status(402).json({
        error: 'Monthly quota exceeded',
        used: quotaCheck.used,
        limit: quotaCheck.limit,
        remaining: 0
      })
    }
    
    // Check token limit per request based on plan
    const stats = await userService.getUsageStats(uid)
    const tokenCheck = checkTokenSize(narrative, stats.features.maxTokensPerRequest)
    if (tokenCheck.exceeded) {
      return res.status(400).json(tokenCheck.payload)
    }

    // Build prompt and call model
    const prompt = await buildPrompt(narrative)

    let draftJson: any | null = null
    let draftText = ''
    try {
      const result = await callGemini(prompt)
      
      console.log({ action: 'model-response', endpoint: 'generate', responseLength: result.text.length })
      
      // Strip markdown code fences if present
      let cleanedText = result.text
        .replace(/^```json\s*/gm, '')
        .replace(/^```\s*$/gm, '')
        .trim()

      // Expect model to return JSON first, then '---TEXT---' and text rendering. Try to parse.
      const [jsonPart, textPart] = cleanedText.split('\n---TEXT---\n')
      try {
        const parsed = JSON.parse(jsonPart)
        const mdm = MdmSchema.parse(parsed)
        draftJson = mdm
        draftText = textPart?.trim() || renderMdmText(mdm)
      } catch (parseError) {
        console.log('JSON parsing failed:', parseError)
        // Fallback: try to coerce by searching for JSON braces
        const jsonStart = cleanedText.indexOf('{')
        const jsonEnd = cleanedText.lastIndexOf('}')
        if (jsonStart >= 0 && jsonEnd > jsonStart) {
          const jsonStr = cleanedText.slice(jsonStart, jsonEnd + 1)
          const mdm = MdmSchema.parse(JSON.parse(jsonStr))
          draftJson = mdm
          draftText = renderMdmText(mdm)
        } else {
          throw new Error('Invalid model output')
        }
      }
    } catch (e) {
      console.warn('Model parsing failed, returning conservative stub:', e)
      draftJson = {
        differential: [],
        data_reviewed_ordered: 'Labs were considered but not indicated based on presentation; clinical monitoring prioritized.',
        decision_making: 'Clinical reasoning provided narrative; defaults applied where data absent. Physician must review.',
        risk: ['Discussed risks/benefits; return precautions given.'],
        disposition: '',
        disclaimers: 'Educational draft. Physician must review. No PHI.',
      }
      draftText = renderMdmText(draftJson)
    }

    // Usage already incremented atomically by checkAndIncrementQuota
    
    // Get updated stats
    const updatedStats = await userService.getUsageStats(uid)

    return res.json({ 
      ok: true, 
      draft: draftText, 
      draftJson, 
      uid, 
      remaining: updatedStats.remaining,
      plan: updatedStats.plan,
      used: updatedStats.used,
      limit: updatedStats.limit
    })
  } catch (e: unknown) {
    const err = e instanceof Error ? e : new Error('unknown error')
    const status = (e as { status?: number })?.status || 500
    if (status !== 500) return res.status(status).json({ error: err.message })
    console.error('generate error:', err.message)
    return res.status(500).json({ error: 'Internal error' })
  }
})

// ============================================================================
// Build Mode Endpoints
// ============================================================================

// Helper to get Firestore instance
const getDb = () => admin.firestore()

// Helper to get encounter document reference
const getEncounterRef = (userId: string, encounterId: string) =>
  getDb().collection('customers').doc(userId).collection('encounters').doc(encounterId)

/**
 * POST /v1/build-mode/process-section1
 * Process initial evaluation (Section 1) and generate worst-first differential
 */
app.post('/v1/build-mode/process-section1', llmLimiter, async (req, res) => {
  try {
    // 1. Validate request
    const parsed = Section1RequestSchema.safeParse(req.body)
    if (!parsed.success) {
      return res.status(400).json({ error: 'Invalid request', details: parsed.error.errors })
    }

    // 2. Authenticate
    let uid: string
    let email = ''
    try {
      const decoded = await admin.auth().verifyIdToken(parsed.data.userIdToken)
      uid = decoded.uid
      email = decoded.email || ''
    } catch {
      return res.status(401).json({ error: 'Unauthorized' })
    }

    const { encounterId, content, location: section1Location } = parsed.data

    // 3. Get encounter and verify ownership
    const encounterRef = getEncounterRef(uid, encounterId)
    const encounterSnap = await encounterRef.get()

    if (!encounterSnap.exists) {
      return res.status(404).json({ error: 'Encounter not found' })
    }

    const encounter = encounterSnap.data()!

    // 4. Check submission count (max 2 submissions per section)
    const currentSubmissionCount = encounter.section1?.submissionCount || 0
    if (currentSubmissionCount >= 2) {
      return res.status(400).json({
        error: 'Section 1 is locked after 2 submissions',
        submissionCount: currentSubmissionCount,
        isLocked: true,
      })
    }

    // 5. Handle quota - only count first submission per encounter
    let quotaRemaining: number
    if (!encounter.quotaCounted) {
      // Ensure user exists, atomically check and increment quota
      await userService.ensureUser(uid, email)
      const quotaCheck = await userService.checkAndIncrementQuota(uid)
      if (!quotaCheck.allowed) {
        return res.status(402).json({
          error: 'Monthly quota exceeded',
          used: quotaCheck.used,
          limit: quotaCheck.limit,
          remaining: 0,
        })
      }
      // Mark as counted
      await encounterRef.update({ quotaCounted: true })
    }

    // Get updated quota
    const stats = await userService.getUsageStats(uid)
    quotaRemaining = stats.remaining

    // Check token limit per request based on plan
    const tokenCheck = checkTokenSize(content, stats.features.maxTokensPerRequest)
    if (tokenCheck.exceeded) {
      return res.status(400).json(tokenCheck.payload)
    }

    // 6. Surveillance enrichment (supplementary — failures must not block section 1)
    let section1SurveillanceCtx: string | undefined
    if (section1Location) {
      try {
        const syndromes = mapToSyndromes(content, [])
        const resolver = new RegionResolver()
        const region = await resolver.resolve(section1Location)
        if (region) {
          const registry = new AdapterRegistry()
          const { dataPoints, errors: survErrors, queriedSources } = await registry.fetchAll(region, syndromes)
          const correlations = computeCorrelations({
            chiefComplaint: content,
            differential: [],
            dataPoints,
          })
          // Determine which data sources were successfully queried
          const allSourceNames = ['CDC Respiratory', 'NWSS Wastewater', 'CDC NNDSS']
          const allSourceKeys = ['cdc_respiratory', 'cdc_wastewater', 'cdc_nndss']
          const failedSources = new Set(survErrors.map((e: any) => e.source))
          const dataSourcesQueried = allSourceNames.filter(
            (_, i) => !failedSources.has(allSourceKeys[i]),
          )
          section1SurveillanceCtx = buildSurveillanceContext({
            analysisId: '',
            region,
            regionLabel: region.county
              ? `${region.county}, ${region.stateAbbrev}`
              : region.state,
            rankedFindings: correlations,
            alerts: [],
            summary: '',
            dataSourcesQueried,
            dataSourceErrors: survErrors,
            dataSourceSummaries: [],
            analyzedAt: new Date().toISOString(),
          }) || undefined
        }
      } catch (survError) {
        console.warn('Section 1 surveillance enrichment failed (non-blocking):', survError)
      }
    }

    // 6b. CDR enrichment (supplementary — failures must not block section 1)
    let section1CdrCtx: string | undefined
    try {
      const cdrResults = await searchCdrCatalog(content, getDb(), 15)
      if (cdrResults.length > 0) {
        section1CdrCtx = formatCdrContext(cdrResults) || undefined
      }
    } catch (cdrError) {
      console.warn('Section 1 CDR enrichment failed (non-blocking):', cdrError)
    }

    // 7. Build prompt and call Vertex AI
    const systemPrompt = await fs.readFile(
      path.join(__dirname, '../../docs/mdm-gen-guide.md'),
      'utf8'
    ).catch(() => '') // Fallback to empty if guide not found

    // Build compact test catalog for prompt injection (enables LLM to return exact testIds)
    // Vector search: embed the narrative and retrieve only the most relevant tests.
    // Falls back to full cached catalog if vector search fails (same pattern as surveillance).
    let testCatalogStr: string | undefined
    try {
      const relevantTests = await getRelevantTests(content, 50)
      testCatalogStr = buildCompactCatalog(relevantTests)
    } catch (vectorSearchError) {
      console.warn('Vector search failed, falling back to full catalog (non-blocking):', vectorSearchError)
      try {
        const allTests = await getCachedTestLibrary()
        testCatalogStr = buildCompactCatalog(allTests)
      } catch (catalogError) {
        console.warn('Test catalog build also failed (non-blocking):', catalogError)
      }
    }

    const prompt = buildSection1Prompt(content, systemPrompt, section1SurveillanceCtx, section1CdrCtx, testCatalogStr)

    let differential: DifferentialItem[] = []
    let cdrAnalysis: CdrAnalysisItem[] = []
    let workupRecommendations: WorkupRecommendation[] = []
    try {
      const result = await callGemini(prompt)

      // Parse response - expect JSON object with differential, cdrAnalysis, workupRecommendations
      let cleanedText = result.text
        .replace(/^```json\s*/gm, '')
        .replace(/^```\s*$/gm, '')
        .trim()

      try {
        let rawParsed = JSON.parse(cleanedText)

        // Handle both legacy (array) and new (object) response formats
        if (Array.isArray(rawParsed)) {
          // Legacy format: raw array of differential items
          const validated = z.array(DifferentialItemSchema).safeParse(rawParsed)
          if (validated.success) {
            differential = validated.data
          }
        } else if (rawParsed && typeof rawParsed === 'object') {
          // New format: { differential, cdrAnalysis, workupRecommendations }
          // Extract differential
          let diffArray = rawParsed.differential
          if (Array.isArray(diffArray)) {
            const validated = z.array(DifferentialItemSchema).safeParse(diffArray)
            if (validated.success) {
              differential = validated.data
            } else {
              console.warn('Section 1 differential validation failed:', validated.error.message)
            }
          }

          // Extract cdrAnalysis (non-blocking — failures don't affect differential)
          if (Array.isArray(rawParsed.cdrAnalysis)) {
            const cdrValidated = z.array(CdrAnalysisItemSchema).safeParse(rawParsed.cdrAnalysis)
            if (cdrValidated.success) {
              cdrAnalysis = cdrValidated.data.filter((item) => item.applicable)
            } else {
              console.warn('Section 1 cdrAnalysis validation failed (non-blocking)')
            }
          }

          // Extract workupRecommendations (non-blocking)
          if (Array.isArray(rawParsed.workupRecommendations)) {
            const workupValidated = z.array(WorkupRecommendationSchema).safeParse(rawParsed.workupRecommendations)
            if (workupValidated.success) {
              workupRecommendations = workupValidated.data
            } else {
              console.warn('Section 1 workupRecommendations validation failed (non-blocking)')
            }
          }
        }

        // Fallback: if no differential was parsed, try array extraction from text
        if (differential.length === 0) {
          const jsonStart = cleanedText.indexOf('[')
          const jsonEnd = cleanedText.lastIndexOf(']')
          if (jsonStart >= 0 && jsonEnd > jsonStart) {
            const arrayParsed = JSON.parse(cleanedText.slice(jsonStart, jsonEnd + 1))
            const validated = z.array(DifferentialItemSchema).safeParse(arrayParsed)
            if (validated.success) {
              differential = validated.data
            }
          }
        }

        if (differential.length === 0) {
          differential = [
            {
              diagnosis: 'Unable to validate differential',
              urgency: 'urgent' as const,
              reasoning: 'Model output did not match expected schema. Please review and resubmit.',
            },
          ]
        }
      } catch (parseError) {
        console.error('Section 1 JSON parse error:', parseError)
        // Return minimal fallback
        differential = [
          {
            diagnosis: 'Unable to parse differential',
            urgency: 'urgent' as const,
            reasoning: 'Please review input and resubmit',
          },
        ]
      }
    } catch (modelError) {
      console.error('Section 1 model error:', modelError)
      return res.status(500).json({ error: 'Failed to process section 1' })
    }

    // 7. Update Firestore
    const newSubmissionCount = currentSubmissionCount + 1
    const isLocked = newSubmissionCount >= 2

    await encounterRef.update({
      'section1.content': content,
      'section1.llmResponse': {
        differential,
        ...(cdrAnalysis.length > 0 && { cdrAnalysis }),
        ...(workupRecommendations.length > 0 && { workupRecommendations }),
        processedAt: admin.firestore.Timestamp.now(),
      },
      'section1.submissionCount': newSubmissionCount,
      'section1.status': 'completed',
      'section1.lastUpdated': admin.firestore.Timestamp.now(),
      // Persist surveillance context so Section 3 (finalize) can access it
      ...(section1SurveillanceCtx && { surveillanceContext: section1SurveillanceCtx }),
      // Persist CDR context so Section 2 and Section 3 can access it
      ...(section1CdrCtx && { cdrContext: section1CdrCtx }),
      status: 'section1_done',
      updatedAt: admin.firestore.Timestamp.now(),
    })

    // 8. Log action (no PHI)
    console.log({
      action: 'process-section1',
      uid,
      encounterId,
      submissionCount: newSubmissionCount,
      cdrAnalysisCount: cdrAnalysis.length,
      workupRecsCount: workupRecommendations.length,
      timestamp: new Date().toISOString(),
    })

    // 9. Return response
    return res.json({
      ok: true,
      differential,
      ...(cdrAnalysis.length > 0 && { cdrAnalysis }),
      ...(workupRecommendations.length > 0 && { workupRecommendations }),
      submissionCount: newSubmissionCount,
      isLocked,
      quotaRemaining,
    })
  } catch (e: unknown) {
    console.error('process-section1 error:', e instanceof Error ? e.message : 'unknown error')
    return res.status(500).json({ error: 'Internal error' })
  }
})

/**
 * POST /v1/build-mode/process-section2
 * Process workup & results (Section 2) and generate MDM preview
 */
app.post('/v1/build-mode/process-section2', llmLimiter, async (req, res) => {
  try {
    // 1. Validate request
    const parsed = Section2RequestSchema.safeParse(req.body)
    if (!parsed.success) {
      return res.status(400).json({ error: 'Invalid request', details: parsed.error.errors })
    }

    // 2. Authenticate
    let uid: string
    try {
      const decoded = await admin.auth().verifyIdToken(parsed.data.userIdToken)
      uid = decoded.uid
    } catch {
      return res.status(401).json({ error: 'Unauthorized' })
    }

    const { encounterId, content, workingDiagnosis, selectedTests, testResults, structuredDiagnosis } = parsed.data

    // 3. Get encounter and verify ownership
    const encounterRef = getEncounterRef(uid, encounterId)
    const encounterSnap = await encounterRef.get()

    if (!encounterSnap.exists) {
      return res.status(404).json({ error: 'Encounter not found' })
    }

    const encounter = encounterSnap.data()!

    // 4. Verify section 1 is completed
    if (encounter.section1?.status !== 'completed') {
      return res.status(400).json({
        error: 'Section 1 must be completed before processing Section 2',
      })
    }

    // 5. Check submission count
    const currentSubmissionCount = encounter.section2?.submissionCount || 0
    if (currentSubmissionCount >= 2) {
      return res.status(400).json({
        error: 'Section 2 is locked after 2 submissions',
        submissionCount: currentSubmissionCount,
        isLocked: true,
      })
    }

    // Check token limit per request based on plan
    const stats = await userService.getUsageStats(uid)
    const tokenCheck = checkTokenSize(content, stats.features.maxTokensPerRequest)
    if (tokenCheck.exceeded) {
      return res.status(400).json(tokenCheck.payload)
    }

    // 6. Build prompt with section 1 context and call Vertex AI
    const section1Content = encounter.section1?.content || ''
    const rawS1Response = encounter.section1?.llmResponse
    let s1Differential: DifferentialItem[] = []
    if (Array.isArray(rawS1Response)) {
      s1Differential = rawS1Response
    } else if (rawS1Response?.differential && Array.isArray(rawS1Response.differential)) {
      s1Differential = rawS1Response.differential
    }
    const section1Response = { differential: s1Differential }

    // 6b. CDR enrichment for Section 2 (non-blocking)
    let section2CdrCtx: string | undefined
    const storedS1CdrCtx: string | undefined = encounter.cdrContext || undefined
    try {
      const combinedText = `${section1Content} ${content}`
      const cdrResults = await searchCdrCatalog(combinedText, getDb(), 15)
      if (cdrResults.length > 0) {
        section2CdrCtx = formatCdrContext(cdrResults) || undefined
      }
    } catch (cdrError) {
      console.warn('Section 2 CDR enrichment failed (non-blocking):', cdrError)
    }

    // Build structured data for the prompt (prefer request data, fall back to Firestore)
    const s2StructuredData = {
      selectedTests: selectedTests || encounter.section2?.selectedTests,
      testResults: testResults || encounter.section2?.testResults,
      structuredDiagnosis: structuredDiagnosis !== undefined ? structuredDiagnosis : encounter.section2?.workingDiagnosis,
    }

    const prompt = buildSection2Prompt(section1Content, section1Response, content, workingDiagnosis, section2CdrCtx, storedS1CdrCtx, s2StructuredData)

    let mdmPreview: MdmPreview
    try {
      const result = await callGemini(prompt)

      // Parse response - expect MDM preview object
      let cleanedText = result.text
        .replace(/^```json\s*/gm, '')
        .replace(/^```\s*$/gm, '')
        .trim()

      try {
        let rawParsed = JSON.parse(cleanedText)
        // Unwrap { "mdmPreview": { ... } } wrapper if present
        if (rawParsed.mdmPreview && typeof rawParsed.mdmPreview === 'object') {
          rawParsed = rawParsed.mdmPreview
        }
        // Try to extract JSON if top-level parse isn't an object
        if (typeof rawParsed !== 'object' || rawParsed === null) {
          const jsonStart = cleanedText.indexOf('{')
          const jsonEnd = cleanedText.lastIndexOf('}')
          if (jsonStart >= 0 && jsonEnd > jsonStart) {
            rawParsed = JSON.parse(cleanedText.slice(jsonStart, jsonEnd + 1))
          } else {
            throw new Error('No valid JSON object found')
          }
        }
        // Validate with Zod schema
        const validated = MdmPreviewSchema.safeParse(rawParsed)
        if (validated.success) {
          mdmPreview = validated.data
        } else {
          console.warn('Section 2 Zod validation failed:', validated.error.message)
          mdmPreview = {
            problems: ['Unable to validate MDM preview'],
            differential: section1Response.differential.map((d: DifferentialItem) => d.diagnosis),
            dataReviewed: [],
            reasoning: 'Model output did not match expected schema. Please review and resubmit.',
          }
        }
      } catch (parseError) {
        console.error('Section 2 JSON parse error:', parseError)
        // Try to extract JSON
        const jsonStart = cleanedText.indexOf('{')
        const jsonEnd = cleanedText.lastIndexOf('}')
        if (jsonStart >= 0 && jsonEnd > jsonStart) {
          const extracted = JSON.parse(cleanedText.slice(jsonStart, jsonEnd + 1))
          const validated = MdmPreviewSchema.safeParse(extracted)
          if (validated.success) {
            mdmPreview = validated.data
          } else {
            mdmPreview = {
              problems: ['Unable to parse MDM preview'],
              differential: section1Response.differential.map((d: DifferentialItem) => d.diagnosis),
              dataReviewed: [],
              reasoning: 'Please review input and resubmit',
            }
          }
        } else {
          mdmPreview = {
            problems: ['Unable to parse MDM preview'],
            differential: section1Response.differential.map((d: DifferentialItem) => d.diagnosis),
            dataReviewed: [],
            reasoning: 'Please review input and resubmit',
          }
        }
      }
    } catch (modelError) {
      console.error('Section 2 model error:', modelError)
      return res.status(500).json({ error: 'Failed to process section 2' })
    }

    // 7. Update Firestore
    const newSubmissionCount = currentSubmissionCount + 1
    const isLocked = newSubmissionCount >= 2

    await encounterRef.update({
      'section2.content': content,
      'section2.llmResponse': {
        mdmPreview,
        processedAt: admin.firestore.Timestamp.now(),
      },
      'section2.submissionCount': newSubmissionCount,
      'section2.status': 'completed',
      'section2.lastUpdated': admin.firestore.Timestamp.now(),
      // Persist structured data from the request (if provided)
      ...(selectedTests && { 'section2.selectedTests': selectedTests }),
      ...(testResults && { 'section2.testResults': testResults }),
      ...(structuredDiagnosis !== undefined && { 'section2.workingDiagnosis': structuredDiagnosis }),
      status: 'section2_done',
      updatedAt: admin.firestore.Timestamp.now(),
    })

    // 8. Log action (no PHI)
    console.log({
      action: 'process-section2',
      uid,
      encounterId,
      submissionCount: newSubmissionCount,
      timestamp: new Date().toISOString(),
    })

    // 9. Return response
    return res.json({
      ok: true,
      mdmPreview,
      submissionCount: newSubmissionCount,
      isLocked,
    })
  } catch (e: unknown) {
    console.error('process-section2 error:', e instanceof Error ? e.message : 'unknown error')
    return res.status(500).json({ error: 'Internal error' })
  }
})

/**
 * POST /v1/build-mode/finalize
 * Process treatment & disposition (Section 3) and generate final MDM
 */
app.post('/v1/build-mode/finalize', llmLimiter, async (req, res) => {
  try {
    // 1. Validate request
    const parsed = FinalizeRequestSchema.safeParse(req.body)
    if (!parsed.success) {
      return res.status(400).json({ error: 'Invalid request', details: parsed.error.errors })
    }

    // 2. Authenticate
    let uid: string
    try {
      const decoded = await admin.auth().verifyIdToken(parsed.data.userIdToken)
      uid = decoded.uid
    } catch {
      return res.status(401).json({ error: 'Unauthorized' })
    }

    const { encounterId, content, workingDiagnosis: s3WorkingDiagnosis } = parsed.data

    // 3. Get encounter and verify ownership
    const encounterRef = getEncounterRef(uid, encounterId)
    const encounterSnap = await encounterRef.get()

    if (!encounterSnap.exists) {
      return res.status(404).json({ error: 'Encounter not found' })
    }

    const encounter = encounterSnap.data()!

    // 4. Verify section 2 is completed
    if (encounter.section2?.status !== 'completed') {
      return res.status(400).json({
        error: 'Section 2 must be completed before finalizing',
      })
    }

    // 5. Check submission count
    const currentSubmissionCount = encounter.section3?.submissionCount || 0
    if (currentSubmissionCount >= 2) {
      return res.status(400).json({
        error: 'Section 3 is locked after 2 submissions',
        submissionCount: currentSubmissionCount,
        isLocked: true,
      })
    }

    // Check token limit per request based on plan
    const stats = await userService.getUsageStats(uid)
    const tokenCheck = checkTokenSize(content, stats.features.maxTokensPerRequest)
    if (tokenCheck.exceeded) {
      return res.status(400).json(tokenCheck.payload)
    }

    // 6. Build prompt with all sections and call Vertex AI
    const rawS1 = encounter.section1?.llmResponse
    const s1Diff: DifferentialItem[] = Array.isArray(rawS1)
      ? rawS1
      : (rawS1?.differential && Array.isArray(rawS1.differential))
        ? rawS1.differential
        : []
    const section1Data = {
      content: encounter.section1?.content || '',
      response: { differential: s1Diff },
    }
    const rawS2 = encounter.section2?.llmResponse
    const s2Preview = (rawS2?.mdmPreview && typeof rawS2.mdmPreview === 'object')
      ? rawS2.mdmPreview
      : rawS2 || {}
    const section2Data = {
      content: encounter.section2?.content || '',
      response: { mdmPreview: s2Preview },
      workingDiagnosis: encounter.section2?.workingDiagnosis,
    }

    // Retrieve surveillance context stored during Section 1
    const storedSurveillanceCtx: string | undefined = encounter.surveillanceContext || undefined

    // Build CDR context dynamically from cdrTracking (BM-3.3: replaces static encounter.cdrContext)
    const storedCdrCtx: string | undefined = buildCdrContextString(encounter.cdrTracking ?? {})

    // Build structured data from S2/S3 fields (BM-6.3: enriches finalize prompt)
    // D1: Prefer workingDiagnosis from S3 request body, fall back to S2 Firestore data
    const structuredData: FinalizeStructuredData = {
      selectedTests: encounter.section2?.selectedTests,
      testResults: encounter.section2?.testResults,
      workingDiagnosis: s3WorkingDiagnosis ?? encounter.section2?.workingDiagnosis,
      treatments: encounter.section3?.treatments,
      cdrSuggestedTreatments: encounter.section3?.cdrSuggestedTreatments,
      disposition: encounter.section3?.disposition,
      followUp: encounter.section3?.followUp,
    }

    const prompt = buildFinalizePrompt(section1Data, section2Data, content, storedSurveillanceCtx, storedCdrCtx, structuredData)

    let finalMdm: FinalMdm
    try {
      const result = await callGemini(prompt, 90_000)

      // Parse response - expect text and json sections
      let cleanedText = result.text
        .replace(/^```json\s*/gm, '')
        .replace(/^```\s*$/gm, '')
        .trim()

      // Try to parse as complete FinalMdm object
      const fallbackMdm: FinalMdm = {
        text: 'Unable to generate final MDM. Please review and try again.',
        json: {
          problems: [],
          differential: [],
          dataReviewed: [],
          reasoning: 'Generation failed',
          risk: [],
          disposition: '',
          complexityLevel: 'moderate',
        },
      }

      // --- Helpers for coercing LLM objects to schema-expected types ---
      const flattenToStrings = (val: unknown): string[] | undefined => {
        if (!val) return undefined
        if (Array.isArray(val)) return val.map((v) => typeof v === 'object' ? JSON.stringify(v) : String(v))
        return undefined
      }
      const flattenNestedObj = (val: unknown): string[] | undefined => {
        if (!val || typeof val !== 'object') return undefined
        if (Array.isArray(val)) return val.map(String)
        const entries: string[] = []
        for (const [k, v] of Object.entries(val as Record<string, unknown>)) {
          if (Array.isArray(v)) entries.push(...v.map((item) => `${k}: ${item}`))
          else if (v) entries.push(`${k}: ${v}`)
        }
        return entries.length ? entries : undefined
      }
      const stringifyDisposition = (val: unknown): string => {
        if (!val) return ''
        if (typeof val === 'string') return val
        if (typeof val === 'object') {
          const d = val as Record<string, unknown>
          const parts = [d.decision, d.levelOfCare, d.rationale].filter(Boolean)
          return parts.join(' — ') || JSON.stringify(val)
        }
        return String(val)
      }
      const normalizeComplexity = (val: unknown): 'low' | 'moderate' | 'high' => {
        const s = String(val || 'moderate').toLowerCase()
        if (s === 'low' || s === 'moderate' || s === 'high') return s
        return 'moderate'
      }
      const asStringOrArr = (val: unknown): string | string[] | undefined => {
        if (typeof val === 'string') return val
        if (Array.isArray(val)) return val.map(String)
        return undefined
      }
      const extractFinalMdm = (raw: Record<string, unknown>): FinalMdm => {
        const j = (raw.json && typeof raw.json === 'object' ? raw.json : {}) as Record<string, unknown>
        return {
          text: (raw.text as string) || '',
          json: {
            problems: asStringOrArr(j.problems) || asStringOrArr(raw.problems)
              || flattenToStrings(j.problemsAddressed) || flattenToStrings(raw.problemsAddressed) || [],
            differential: asStringOrArr(j.differential) || asStringOrArr(raw.differential) || [],
            dataReviewed: asStringOrArr(j.dataReviewed) || asStringOrArr(raw.dataReviewed)
              || flattenNestedObj(j.dataReviewedOrdered) || flattenNestedObj(raw.dataReviewedOrdered) || [],
            reasoning: (j.reasoning || raw.reasoning
              || j.clinicalReasoning || raw.clinicalReasoning || '') as string,
            risk: asStringOrArr(j.risk) || asStringOrArr(raw.risk)
              || flattenNestedObj(j.riskAssessment) || flattenNestedObj(raw.riskAssessment) || [],
            disposition: stringifyDisposition(j.disposition || raw.disposition),
            complexityLevel: normalizeComplexity(j.complexityLevel || raw.complexityLevel),
          },
        }
      }

      try {
        let rawParsed = JSON.parse(cleanedText)

        // Defensive unwrap: if LLM wraps in { finalMdm: {...} }
        if (rawParsed.finalMdm && typeof rawParsed.finalMdm === 'object') {
          rawParsed = rawParsed.finalMdm
        }

        const candidate = extractFinalMdm(rawParsed)
        // Validate with Zod schema
        const validated = FinalMdmSchema.safeParse(candidate)
        if (validated.success) {
          finalMdm = validated.data
        } else {
          console.warn('Finalize Zod validation failed:', validated.error.message)
          finalMdm = fallbackMdm
        }
      } catch (parseError) {
        console.error('Finalize JSON parse error:', parseError)
        // Try to extract JSON
        const jsonStart = cleanedText.indexOf('{')
        const jsonEnd = cleanedText.lastIndexOf('}')
        if (jsonStart >= 0 && jsonEnd > jsonStart) {
          try {
            let jsonObj = JSON.parse(cleanedText.slice(jsonStart, jsonEnd + 1))
            // Defensive unwrap for fallback path too
            if (jsonObj.finalMdm && typeof jsonObj.finalMdm === 'object') {
              jsonObj = jsonObj.finalMdm
            }
            const candidate: FinalMdm = {
              ...extractFinalMdm(jsonObj),
              text: jsonObj.text || renderMdmText(jsonObj),
            }
            const validated = FinalMdmSchema.safeParse(candidate)
            finalMdm = validated.success ? validated.data : fallbackMdm
          } catch {
            finalMdm = fallbackMdm
          }
        } else {
          finalMdm = fallbackMdm
        }
      }
    } catch (modelError) {
      console.error('Finalize model error:', modelError)
      return res.status(500).json({ error: 'Failed to finalize encounter' })
    }

    // 7. Deterministic surveillance enrichment of dataReviewed
    if (storedSurveillanceCtx && finalMdm.json?.dataReviewed) {
      const reviewed = Array.isArray(finalMdm.json.dataReviewed)
        ? finalMdm.json.dataReviewed
        : [finalMdm.json.dataReviewed]
      const hasSurveillance = reviewed.some((item: string) =>
        /surveillance|regional/i.test(item)
      )
      if (!hasSurveillance) {
        reviewed.push('Regional Surveillance Data: CDC Respiratory (hospital admission trends), NWSS Wastewater (pathogen PCR), CDC NNDSS (notifiable diseases) — reviewed and integrated')
        finalMdm.json.dataReviewed = reviewed
        finalMdm.text = appendSurveillanceToMdmText(finalMdm.text, storedSurveillanceCtx)
      }
    }

    // 8. Update Firestore
    const newSubmissionCount = currentSubmissionCount + 1

    await encounterRef.update({
      'section3.content': content,
      'section3.llmResponse': {
        finalMdm,
        processedAt: admin.firestore.Timestamp.now(),
      },
      'section3.submissionCount': newSubmissionCount,
      'section3.status': 'completed',
      'section3.lastUpdated': admin.firestore.Timestamp.now(),
      status: 'finalized',
      updatedAt: admin.firestore.Timestamp.now(),
    })

    // 9. Log action (no PHI)
    console.log({
      action: 'finalize',
      uid,
      encounterId,
      submissionCount: newSubmissionCount,
      timestamp: new Date().toISOString(),
    })

    // 10. Return response
    return res.json({
      ok: true,
      finalMdm,
      quotaRemaining: stats.remaining,
    })
  } catch (e: unknown) {
    console.error('finalize error:', e instanceof Error ? e.message : 'unknown error')
    return res.status(500).json({ error: 'Internal error' })
  }
})

// ============================================================================
// CDR Matching Endpoint
// ============================================================================

/**
 * POST /v1/build-mode/match-cdrs
 * Match CDRs from S1 differential and auto-populate components from narrative.
 */
app.post('/v1/build-mode/match-cdrs', llmLimiter, async (req, res) => {
  try {
    // 1. VALIDATE
    const parsed = MatchCdrsRequestSchema.safeParse(req.body)
    if (!parsed.success) {
      return res.status(400).json({ error: 'Invalid request', details: parsed.error.errors })
    }

    // 2. AUTHENTICATE
    let uid: string
    try {
      const decoded = await admin.auth().verifyIdToken(parsed.data.userIdToken)
      uid = decoded.uid
    } catch {
      return res.status(401).json({ error: 'Unauthorized' })
    }

    const { encounterId } = parsed.data

    // 3. AUTHORIZE — verify encounter ownership
    const encounterRef = getEncounterRef(uid, encounterId)
    const encounterSnap = await encounterRef.get()

    if (!encounterSnap.exists) {
      return res.status(404).json({ error: 'Encounter not found' })
    }

    const encounter = encounterSnap.data()!

    // Verify encounter has S1 completed (status check + data check)
    const validStatuses = ['section1_done', 'section2_done', 'finalized']
    if (!validStatuses.includes(encounter.status) || !encounter.section1?.llmResponse) {
      return res.status(400).json({
        error: 'Section 1 must be completed before CDR matching',
      })
    }

    // 4. EXECUTE

    // 4a. Extract differential from S1 response
    const s1Response = encounter.section1.llmResponse
    let differential: DifferentialItem[] = []
    if (Array.isArray(s1Response)) {
      differential = s1Response as DifferentialItem[]
    } else if (s1Response?.differential && Array.isArray(s1Response.differential)) {
      differential = s1Response.differential as DifferentialItem[]
    }

    if (differential.length === 0) {
      // No differential to match against — return empty tracking
      return res.json({
        ok: true,
        cdrTracking: {},
        matchedCount: 0,
      })
    }

    // 4b. Get CDR library (shared cache helper)
    const cdrs = await getCachedCdrLibrary()

    // 4c. Match CDRs against differential
    const matchedCdrs = matchCdrsFromDifferential(differential, cdrs)

    if (matchedCdrs.length === 0) {
      // No matches — write empty tracking and return
      await encounterRef.update({
        cdrTracking: {},
        updatedAt: admin.firestore.Timestamp.now(),
      })

      console.log({
        action: 'match-cdrs',
        uid,
        encounterId,
        matchedCount: 0,
        timestamp: new Date().toISOString(),
      })

      return res.json({
        ok: true,
        cdrTracking: {},
        matchedCount: 0,
      })
    }

    // 4d. Auto-populate components from S1 narrative (supplementary — failures don't block)
    let autoPopulated: AutoPopulatedValues | null = null
    const s1Content = encounter.section1.content || ''

    if (s1Content) {
      try {
        const prompt = buildCdrAutoPopulatePrompt(s1Content, matchedCdrs)

        // Only call Gemini if there are extractable components
        if (prompt.system) {
          const result = await callGemini(prompt)

          const cleanedText = result.text
            .replace(/^```json\s*/gm, '')
            .replace(/^```\s*$/gm, '')
            .trim()

          try {
            autoPopulated = JSON.parse(cleanedText) as AutoPopulatedValues
          } catch {
            console.warn('CDR auto-populate JSON parse failed (non-blocking)')
          }
        }
      } catch (autoPopError) {
        console.warn('CDR auto-populate LLM call failed (non-blocking):', autoPopError)
      }
    }

    // 4e. Build CdrTracking
    const cdrTracking: CdrTracking = buildCdrTracking(matchedCdrs, autoPopulated)

    // 4f. Write to Firestore
    await encounterRef.update({
      cdrTracking,
      updatedAt: admin.firestore.Timestamp.now(),
    })

    // 5. AUDIT (no PHI)
    console.log({
      action: 'match-cdrs',
      uid,
      encounterId,
      matchedCount: matchedCdrs.length,
      autoPopulated: autoPopulated !== null,
      timestamp: new Date().toISOString(),
    })

    // 6. RESPOND
    return res.json({
      ok: true,
      cdrTracking,
      matchedCount: matchedCdrs.length,
    })
  } catch (e: unknown) {
    console.error('match-cdrs error:', e instanceof Error ? e.message : 'unknown error')
    return res.status(500).json({ error: 'Internal error' })
  }
})

/**
 * POST /v1/build-mode/suggest-diagnosis
 * Suggest ranked working diagnoses from S1 differential refined by S2 results.
 * No quota deduction — UI helper only.
 */
app.post('/v1/build-mode/suggest-diagnosis', llmLimiter, async (req, res) => {
  try {
    // 1. VALIDATE
    const parsed = SuggestDiagnosisRequestSchema.safeParse(req.body)
    if (!parsed.success) {
      return res.status(400).json({ error: 'Invalid request', details: parsed.error.errors })
    }

    // 2. AUTHENTICATE
    let uid: string
    try {
      const decoded = await admin.auth().verifyIdToken(parsed.data.userIdToken)
      uid = decoded.uid
    } catch {
      return res.status(401).json({ error: 'Unauthorized' })
    }

    const { encounterId } = parsed.data

    // 3. AUTHORIZE — verify encounter ownership
    const encounterRef = getEncounterRef(uid, encounterId)
    const encounterSnap = await encounterRef.get()

    if (!encounterSnap.exists) {
      return res.status(404).json({ error: 'Encounter not found' })
    }

    const encounter = encounterSnap.data()!

    // Verify S1 is completed
    const validStatuses = ['section1_done', 'section2_done', 'finalized']
    if (!validStatuses.includes(encounter.status) || !encounter.section1?.llmResponse) {
      return res.status(400).json({
        error: 'Section 1 must be completed before suggesting diagnoses',
      })
    }

    // 4. EXECUTE

    // 4a. Extract differential from S1 response
    const s1Response = encounter.section1.llmResponse
    let differential: DifferentialItem[] = []
    if (Array.isArray(s1Response)) {
      differential = s1Response as DifferentialItem[]
    } else if (s1Response?.differential && Array.isArray(s1Response.differential)) {
      differential = s1Response.differential as DifferentialItem[]
    }

    if (differential.length === 0) {
      return res.status(400).json({ error: 'No differential available from Section 1' })
    }

    // 4b. Build test results summary from S2 structured data
    const testResults: Record<string, TestResult> = encounter.section2?.testResults ?? {}
    const testResultsSummary = Object.entries(testResults)
      .filter(([, r]) => r.status !== 'pending')
      .map(([testId, r]) => {
        const parts = [`${testId}: ${r.status}`]
        if (r.quickFindings?.length) parts.push(`(${r.quickFindings.join(', ')})`)
        if (r.value) parts.push(`value: ${r.value}${r.unit ? ' ' + r.unit : ''}`)
        if (r.notes) parts.push(`notes: ${r.notes}`)
        return parts.join(' ')
      })
      .join('\n')

    // 4c. Build prompt and call Gemini Flash
    const chiefComplaint = encounter.chiefComplaint || 'Unknown'
    const prompt = buildSuggestDiagnosisPrompt(differential, chiefComplaint, testResultsSummary)
    const result = await callGemini(prompt)

    // 4d. Parse response as JSON array of strings
    const cleanedText = result.text
      .replace(/^```json\s*/gm, '')
      .replace(/^```\s*$/gm, '')
      .trim()

    let suggestions: string[]
    try {
      const parsed = JSON.parse(cleanedText)
      if (!Array.isArray(parsed) || parsed.length === 0) {
        throw new Error('Expected non-empty array')
      }
      suggestions = parsed
        .filter((s: unknown) => typeof s === 'string' && s.trim().length > 0)
        .slice(0, 7)
    } catch {
      // Fallback: use top 3 differential diagnoses as suggestions
      suggestions = differential.slice(0, 3).map((d) => d.diagnosis)
    }

    if (suggestions.length === 0) {
      suggestions = differential.slice(0, 3).map((d) => d.diagnosis)
    }

    // 5. AUDIT (no PHI)
    console.log({
      action: 'suggest-diagnosis',
      uid,
      encounterId,
      suggestionCount: suggestions.length,
      timestamp: new Date().toISOString(),
    })

    // 6. RESPOND
    return res.json({
      ok: true,
      suggestions,
    })
  } catch (e: unknown) {
    console.error('suggest-diagnosis error:', e instanceof Error ? e.message : 'unknown error')
    return res.status(500).json({ error: 'Internal error' })
  }
})

/**
 * POST /v1/build-mode/parse-results
 * AI parsing of pasted lab/EHR text into structured results mapped to ordered tests.
 * No quota deduction — UI helper only.
 */
app.post('/v1/build-mode/parse-results', llmLimiter, async (req, res) => {
  try {
    // 1. VALIDATE
    const parsed = ParseResultsRequestSchema.safeParse(req.body)
    if (!parsed.success) {
      return res.status(400).json({ error: 'Invalid request', details: parsed.error.errors })
    }

    // 2. AUTHENTICATE
    let uid: string
    try {
      const decoded = await admin.auth().verifyIdToken(parsed.data.userIdToken)
      uid = decoded.uid
    } catch {
      return res.status(401).json({ error: 'Unauthorized' })
    }

    const { encounterId, pastedText, orderedTestIds } = parsed.data

    // 3. AUTHORIZE — verify encounter ownership
    const encounterRef = getEncounterRef(uid, encounterId)
    const encounterSnap = await encounterRef.get()

    if (!encounterSnap.exists) {
      return res.status(404).json({ error: 'Encounter not found' })
    }

    // 4. EXECUTE

    // 4a. Load test definitions for ordered tests
    const allTests = await getCachedTestLibrary()
    const orderedTests = orderedTestIds
      .map((id) => allTests.find((t) => t.id === id))
      .filter((t): t is TestDefinition => t !== undefined)

    if (orderedTests.length === 0) {
      return res.status(400).json({ error: 'No valid ordered tests found' })
    }

    // 4b. Build prompt and call Gemini Flash
    const prompt = buildParseResultsPrompt(
      pastedText,
      orderedTests.map((t) => ({ id: t.id, name: t.name, unit: t.unit, normalRange: t.normalRange }))
    )
    const result = await callGemini(prompt)

    // 4c. Parse response
    const cleanedText = result.text
      .replace(/^```json\s*/gm, '')
      .replace(/^```\s*$/gm, '')
      .trim()

    let parsedResults: ParsedResultItem[] = []
    let unmatchedText: string[] = []

    try {
      const jsonResponse = JSON.parse(cleanedText)

      if (Array.isArray(jsonResponse.parsed)) {
        // Validate each item: only include items that map to an ordered test
        const validTestIds = new Set(orderedTestIds)
        parsedResults = jsonResponse.parsed
          .filter((item: any) => item.testId && validTestIds.has(item.testId))
          .map((item: any) => ({
            testId: String(item.testId),
            testName: String(item.testName || ''),
            status: item.status === 'abnormal' ? 'abnormal' as const : 'unremarkable' as const,
            ...(item.value ? { value: String(item.value) } : {}),
            ...(item.unit ? { unit: String(item.unit) } : {}),
            ...(item.notes ? { notes: String(item.notes) } : {}),
          }))
      }

      if (Array.isArray(jsonResponse.unmatchedText)) {
        unmatchedText = jsonResponse.unmatchedText.map(String)
      }
    } catch {
      // LLM response parse failed — return empty results
      return res.json({
        ok: true,
        parsed: [],
        unmatchedText: ['Failed to parse results from the pasted text. Please try again.'],
      })
    }

    // 5. AUDIT (no PHI)
    console.log({
      action: 'parse-results',
      uid,
      encounterId,
      parsedCount: parsedResults.length,
      unmatchedCount: unmatchedText.length,
      timestamp: new Date().toISOString(),
    })

    // 6. RESPOND
    return res.json({
      ok: true,
      parsed: parsedResults,
      ...(unmatchedText.length > 0 ? { unmatchedText } : {}),
    })
  } catch (e: unknown) {
    console.error('parse-results error:', e instanceof Error ? e.message : 'unknown error')
    return res.status(500).json({ error: 'Internal error' })
  }
})

// ============================================================================
// Quick Mode Endpoints
// ============================================================================

const QuickModeGenerateSchema = z.object({
  encounterId: z.string().min(1),
  narrative: z.string().min(1).max(16000),
  userIdToken: z.string().min(10),
  location: z.object({
    zipCode: z.string().optional(),
    state: z.string().optional(),
  }).optional(),
})

/**
 * POST /v1/quick-mode/generate
 * One-shot MDM generation for Quick Mode encounters
 * Extracts patient identifier and generates complete MDM in a single call
 */
app.post('/v1/quick-mode/generate', llmLimiter, async (req, res) => {
  try {
    // 1. Validate request
    const parsed = QuickModeGenerateSchema.safeParse(req.body)
    if (!parsed.success) {
      return res.status(400).json({ error: 'Invalid request', details: parsed.error.errors })
    }

    // 2. Authenticate
    let uid: string
    let email = ''
    try {
      const decoded = await admin.auth().verifyIdToken(parsed.data.userIdToken)
      uid = decoded.uid
      email = decoded.email || ''
    } catch {
      return res.status(401).json({ error: 'Unauthorized' })
    }

    const { encounterId, narrative, location } = parsed.data

    // 3. Get encounter and verify ownership
    const encounterRef = getEncounterRef(uid, encounterId)
    const encounterSnap = await encounterRef.get()

    if (!encounterSnap.exists) {
      return res.status(404).json({ error: 'Encounter not found' })
    }

    const encounter = encounterSnap.data()!

    // 4. Verify this is a quick mode encounter
    if (encounter.mode !== 'quick') {
      return res.status(400).json({
        error: 'This endpoint is for quick mode encounters only',
        mode: encounter.mode,
      })
    }

    // 5. Check if already processed
    if (encounter.quickModeData?.status === 'completed') {
      return res.status(400).json({
        error: 'Encounter already processed',
        status: 'completed',
      })
    }

    // 6. Handle quota - only count if not already counted
    let quotaRemaining: number
    if (!encounter.quotaCounted) {
      await userService.ensureUser(uid, email)
      const quotaCheck = await userService.checkAndIncrementQuota(uid)
      if (!quotaCheck.allowed) {
        return res.status(402).json({
          error: 'Monthly quota exceeded',
          used: quotaCheck.used,
          limit: quotaCheck.limit,
          remaining: 0,
        })
      }
      // Mark as counted
      await encounterRef.update({
        quotaCounted: true,
        quotaCountedAt: admin.firestore.Timestamp.now(),
      })
    }

    // Get updated quota
    const stats = await userService.getUsageStats(uid)
    quotaRemaining = stats.remaining

    // Check token limit per request based on plan
    const tokenCheck = checkTokenSize(narrative, stats.features.maxTokensPerRequest)
    if (tokenCheck.exceeded) {
      return res.status(400).json(tokenCheck.payload)
    }

    // 7. Mark as processing
    await encounterRef.update({
      'quickModeData.status': 'processing',
      'quickModeData.narrative': narrative,
      updatedAt: admin.firestore.Timestamp.now(),
    })

    // 8. Surveillance enrichment (supplementary — failures must not block MDM)
    let surveillanceContext: string | undefined
    if (location) {
      try {
        const syndromes = mapToSyndromes(narrative, [])
        const resolver = new RegionResolver()
        const region = await resolver.resolve(location)
        if (region) {
          const registry = new AdapterRegistry()
          const { dataPoints, errors: survErrors, queriedSources: survQueriedSources } = await registry.fetchAll(region, syndromes)
          const correlations = computeCorrelations({
            chiefComplaint: narrative,
            differential: [],
            dataPoints,
          })
          // Determine which data sources were successfully queried
          const allSourceNames = ['CDC Respiratory', 'NWSS Wastewater', 'CDC NNDSS']
          const allSourceKeys = ['cdc_respiratory', 'cdc_wastewater', 'cdc_nndss']
          const failedSources = new Set(survErrors.map((e: any) => e.source))
          const dataSourcesQueried = allSourceNames.filter(
            (_, i) => !failedSources.has(allSourceKeys[i]),
          )
          surveillanceContext = buildSurveillanceContext({
            analysisId: '',
            region,
            regionLabel: region.county
              ? `${region.county}, ${region.stateAbbrev}`
              : region.state,
            rankedFindings: correlations,
            alerts: [],
            summary: '',
            dataSourcesQueried,
            dataSourceErrors: survErrors,
            dataSourceSummaries: [],
            analyzedAt: new Date().toISOString(),
          }) || undefined
        }
      } catch (survError) {
        console.warn('Surveillance enrichment failed (non-blocking):', survError)
      }
    }

    // 8b. CDR enrichment (supplementary — failures must not block MDM)
    let quickCdrContext: string | undefined
    try {
      const cdrResults = await searchCdrCatalog(narrative, getDb(), 15)
      if (cdrResults.length > 0) {
        quickCdrContext = formatCdrContext(cdrResults) || undefined
      }
    } catch (cdrError) {
      console.warn('Quick mode CDR enrichment failed (non-blocking):', cdrError)
    }

    // 9. Build prompt and call Vertex AI
    let result: QuickModeGenerationResult
    try {
      const prompt = await buildQuickModePrompt(narrative, surveillanceContext, quickCdrContext)
      const modelResponse = await callGemini(prompt)
      result = parseQuickModeResponse(modelResponse.text)
    } catch (modelError) {
      console.error('Quick mode model error:', modelError)
      result = getQuickModeFallback()
    }

    // 10. Deterministic surveillance enrichment of dataReviewed
    if (surveillanceContext && result.json?.dataReviewed) {
      const reviewed = Array.isArray(result.json.dataReviewed)
        ? result.json.dataReviewed
        : [result.json.dataReviewed]
      const hasSurveillance = reviewed.some((item: string) =>
        /surveillance|regional/i.test(item)
      )
      if (!hasSurveillance) {
        reviewed.push('Regional Surveillance Data: CDC Respiratory (hospital admission trends), NWSS Wastewater (pathogen PCR), CDC NNDSS (notifiable diseases) — reviewed and integrated')
        result.json.dataReviewed = reviewed
        result.text = appendSurveillanceToMdmText(result.text, surveillanceContext)
      }
    }

    // 11. Update Firestore with results
    await encounterRef.update({
      'quickModeData.status': 'completed',
      'quickModeData.narrative': narrative,
      'quickModeData.patientIdentifier': result.patientIdentifier,
      'quickModeData.mdmOutput': {
        text: result.text,
        json: result.json,
      },
      'quickModeData.processedAt': admin.firestore.Timestamp.now(),
      // Update chief complaint with extracted identifier for card display
      chiefComplaint: [
        result.patientIdentifier.age,
        result.patientIdentifier.sex?.charAt(0).toUpperCase(),
        result.patientIdentifier.chiefComplaint,
      ].filter(Boolean).join(' ').trim() || encounter.chiefComplaint,
      status: 'finalized',
      updatedAt: admin.firestore.Timestamp.now(),
    })

    // 11. Log action (no PHI)
    console.log({
      action: 'quick-mode-generate',
      uid,
      encounterId,
      timestamp: new Date().toISOString(),
    })

    // 12. Return response
    return res.json({
      ok: true,
      mdm: {
        text: result.text,
        json: result.json,
      },
      patientIdentifier: result.patientIdentifier,
      quotaRemaining,
    })
  } catch (e: unknown) {
    console.error('quick-mode/generate error:', e instanceof Error ? e.message : 'unknown error')
    return res.status(500).json({ error: 'Internal error' })
  }
})

// ============================================================================
// User Profile CRUD Endpoints
// ============================================================================

const getOrderSetsCollection = (userId: string) =>
  getDb().collection('customers').doc(userId).collection('orderSets')

const getDispoFlowsCollection = (userId: string) =>
  getDb().collection('customers').doc(userId).collection('dispoFlows')

const getReportTemplatesCollection = (userId: string) =>
  getDb().collection('customers').doc(userId).collection('reportTemplates')

const getUserDoc = (userId: string) =>
  getDb().collection('customers').doc(userId)

/** Convert Firestore doc to JSON-safe object, serializing Timestamps to ISO strings */
function serializeUserDoc(doc: admin.firestore.DocumentSnapshot): Record<string, unknown> {
  const data = doc.data()
  if (!data) return { id: doc.id }
  const result: Record<string, unknown> = { id: doc.id }
  for (const [key, value] of Object.entries(data)) {
    if (value && typeof value === 'object' && typeof value.toDate === 'function') {
      result[key] = value.toDate().toISOString()
    } else {
      result[key] = value
    }
  }
  return result
}

/** Authenticate request and return uid, or send error response */
async function authenticateRequest(req: express.Request, res: express.Response): Promise<string | null> {
  const idToken = req.headers.authorization?.split('Bearer ')[1]
  if (!idToken) {
    res.status(401).json({ error: 'Unauthorized' })
    return null
  }
  try {
    const decoded = await admin.auth().verifyIdToken(idToken)
    return decoded.uid
  } catch {
    res.status(401).json({ error: 'Unauthorized' })
    return null
  }
}

// ── Order Sets CRUD ────────────────────────────────────────────────────

app.get('/v1/user/order-sets', async (req, res) => {
  try {
    const uid = await authenticateRequest(req, res)
    if (!uid) return

    const snapshot = await getOrderSetsCollection(uid).get()
    const items = snapshot.docs.map(serializeUserDoc)
    console.log({ userId: uid, action: 'list-order-sets', timestamp: new Date().toISOString() })
    return res.json({ ok: true, items })
  } catch (error) {
    return res.status(500).json({ error: 'Internal error' })
  }
})

app.post('/v1/user/order-sets', async (req, res) => {
  try {
    const uid = await authenticateRequest(req, res)
    if (!uid) return

    const parsed = OrderSetCreateSchema.safeParse(req.body)
    if (!parsed.success) {
      return res.status(400).json({ error: 'Invalid request', details: parsed.error.errors })
    }

    const docRef = await getOrderSetsCollection(uid).add({
      ...parsed.data,
      createdAt: admin.firestore.Timestamp.now(),
      usageCount: 0,
    })
    const doc = await docRef.get()
    console.log({ userId: uid, action: 'create-order-set', timestamp: new Date().toISOString() })
    return res.status(201).json({ ok: true, item: serializeUserDoc(doc) })
  } catch (error) {
    return res.status(500).json({ error: 'Internal error' })
  }
})

app.put('/v1/user/order-sets/:id', async (req, res) => {
  try {
    const uid = await authenticateRequest(req, res)
    if (!uid) return

    const { id } = req.params
    if (!id) return res.status(400).json({ error: 'Missing id' })

    const parsed = OrderSetUpdateSchema.safeParse(req.body)
    if (!parsed.success) {
      return res.status(400).json({ error: 'Invalid request', details: parsed.error.errors })
    }

    const docRef = getOrderSetsCollection(uid).doc(id)
    const existing = await docRef.get()
    if (!existing.exists) {
      return res.status(404).json({ error: 'Not found' })
    }

    const updateData = Object.fromEntries(
      Object.entries(parsed.data).filter(([, v]) => v !== undefined)
    )
    await docRef.update(updateData)
    const updated = await docRef.get()
    console.log({ userId: uid, action: 'update-order-set', timestamp: new Date().toISOString() })
    return res.json({ ok: true, item: serializeUserDoc(updated) })
  } catch (error) {
    return res.status(500).json({ error: 'Internal error' })
  }
})

app.delete('/v1/user/order-sets/:id', async (req, res) => {
  try {
    const uid = await authenticateRequest(req, res)
    if (!uid) return

    const { id } = req.params
    if (!id) return res.status(400).json({ error: 'Missing id' })

    const docRef = getOrderSetsCollection(uid).doc(id)
    const existing = await docRef.get()
    if (!existing.exists) {
      return res.status(404).json({ error: 'Not found' })
    }

    await docRef.delete()
    console.log({ userId: uid, action: 'delete-order-set', timestamp: new Date().toISOString() })
    return res.json({ ok: true, id })
  } catch (error) {
    return res.status(500).json({ error: 'Internal error' })
  }
})

// ── Disposition Flows CRUD ─────────────────────────────────────────────

app.get('/v1/user/dispo-flows', async (req, res) => {
  try {
    const uid = await authenticateRequest(req, res)
    if (!uid) return

    const snapshot = await getDispoFlowsCollection(uid).get()
    const items = snapshot.docs.map(serializeUserDoc)
    console.log({ userId: uid, action: 'list-dispo-flows', timestamp: new Date().toISOString() })
    return res.json({ ok: true, items })
  } catch (error) {
    return res.status(500).json({ error: 'Internal error' })
  }
})

app.post('/v1/user/dispo-flows', async (req, res) => {
  try {
    const uid = await authenticateRequest(req, res)
    if (!uid) return

    const parsed = DispositionFlowCreateSchema.safeParse(req.body)
    if (!parsed.success) {
      return res.status(400).json({ error: 'Invalid request', details: parsed.error.errors })
    }

    const docRef = await getDispoFlowsCollection(uid).add({
      ...parsed.data,
      createdAt: admin.firestore.Timestamp.now(),
      usageCount: 0,
    })
    const doc = await docRef.get()
    console.log({ userId: uid, action: 'create-dispo-flow', timestamp: new Date().toISOString() })
    return res.status(201).json({ ok: true, item: serializeUserDoc(doc) })
  } catch (error) {
    return res.status(500).json({ error: 'Internal error' })
  }
})

app.put('/v1/user/dispo-flows/:id', async (req, res) => {
  try {
    const uid = await authenticateRequest(req, res)
    if (!uid) return

    const { id } = req.params
    if (!id) return res.status(400).json({ error: 'Missing id' })

    const parsed = DispositionFlowUpdateSchema.safeParse(req.body)
    if (!parsed.success) {
      return res.status(400).json({ error: 'Invalid request', details: parsed.error.errors })
    }

    const docRef = getDispoFlowsCollection(uid).doc(id)
    const existing = await docRef.get()
    if (!existing.exists) {
      return res.status(404).json({ error: 'Not found' })
    }

    const updateData = Object.fromEntries(
      Object.entries(parsed.data).filter(([, v]) => v !== undefined)
    )
    await docRef.update(updateData)
    const updated = await docRef.get()
    console.log({ userId: uid, action: 'update-dispo-flow', timestamp: new Date().toISOString() })
    return res.json({ ok: true, item: serializeUserDoc(updated) })
  } catch (error) {
    return res.status(500).json({ error: 'Internal error' })
  }
})

app.delete('/v1/user/dispo-flows/:id', async (req, res) => {
  try {
    const uid = await authenticateRequest(req, res)
    if (!uid) return

    const { id } = req.params
    if (!id) return res.status(400).json({ error: 'Missing id' })

    const docRef = getDispoFlowsCollection(uid).doc(id)
    const existing = await docRef.get()
    if (!existing.exists) {
      return res.status(404).json({ error: 'Not found' })
    }

    await docRef.delete()
    console.log({ userId: uid, action: 'delete-dispo-flow', timestamp: new Date().toISOString() })
    return res.json({ ok: true, id })
  } catch (error) {
    return res.status(500).json({ error: 'Internal error' })
  }
})

// ── Report Templates CRUD ──────────────────────────────────────────────

app.get('/v1/user/report-templates', async (req, res) => {
  try {
    const uid = await authenticateRequest(req, res)
    if (!uid) return

    const snapshot = await getReportTemplatesCollection(uid).get()
    const items = snapshot.docs.map(serializeUserDoc)
    console.log({ userId: uid, action: 'list-report-templates', timestamp: new Date().toISOString() })
    return res.json({ ok: true, items })
  } catch (error) {
    return res.status(500).json({ error: 'Internal error' })
  }
})

app.post('/v1/user/report-templates', async (req, res) => {
  try {
    const uid = await authenticateRequest(req, res)
    if (!uid) return

    const parsed = ReportTemplateCreateSchema.safeParse(req.body)
    if (!parsed.success) {
      return res.status(400).json({ error: 'Invalid request', details: parsed.error.errors })
    }

    const docRef = await getReportTemplatesCollection(uid).add({
      ...parsed.data,
      createdAt: admin.firestore.Timestamp.now(),
      usageCount: 0,
    })
    const doc = await docRef.get()
    console.log({ userId: uid, action: 'create-report-template', timestamp: new Date().toISOString() })
    return res.status(201).json({ ok: true, item: serializeUserDoc(doc) })
  } catch (error) {
    return res.status(500).json({ error: 'Internal error' })
  }
})

app.put('/v1/user/report-templates/:id', async (req, res) => {
  try {
    const uid = await authenticateRequest(req, res)
    if (!uid) return

    const { id } = req.params
    if (!id) return res.status(400).json({ error: 'Missing id' })

    const parsed = ReportTemplateCreateSchema.safeParse(req.body)
    if (!parsed.success) {
      return res.status(400).json({ error: 'Invalid request', details: parsed.error.errors })
    }

    const docRef = getReportTemplatesCollection(uid).doc(id)
    const existing = await docRef.get()
    if (!existing.exists) {
      return res.status(404).json({ error: 'Not found' })
    }

    await docRef.update(parsed.data)
    const updated = await docRef.get()
    console.log({ userId: uid, action: 'update-report-template', timestamp: new Date().toISOString() })
    return res.json({ ok: true, item: serializeUserDoc(updated) })
  } catch (error) {
    return res.status(500).json({ error: 'Internal error' })
  }
})

app.delete('/v1/user/report-templates/:id', async (req, res) => {
  try {
    const uid = await authenticateRequest(req, res)
    if (!uid) return

    const { id } = req.params
    if (!id) return res.status(400).json({ error: 'Missing id' })

    const docRef = getReportTemplatesCollection(uid).doc(id)
    const existing = await docRef.get()
    if (!existing.exists) {
      return res.status(404).json({ error: 'Not found' })
    }

    await docRef.delete()
    console.log({ userId: uid, action: 'delete-report-template', timestamp: new Date().toISOString() })
    return res.json({ ok: true, id })
  } catch (error) {
    return res.status(500).json({ error: 'Internal error' })
  }
})

// ── Usage Tracking ─────────────────────────────────────────────────────

app.post('/v1/user/order-sets/:id/use', async (req, res) => {
  try {
    const uid = await authenticateRequest(req, res)
    if (!uid) return

    const { id } = req.params
    if (!id) return res.status(400).json({ error: 'Missing id' })

    const docRef = getOrderSetsCollection(uid).doc(id)
    const existing = await docRef.get()
    if (!existing.exists) {
      return res.status(404).json({ error: 'Not found' })
    }

    await docRef.update({ usageCount: admin.firestore.FieldValue.increment(1) })
    const updated = await docRef.get()
    console.log({ userId: uid, action: 'use-order-set', timestamp: new Date().toISOString() })
    return res.json({ ok: true, usageCount: updated.data()?.usageCount ?? 0 })
  } catch (error) {
    return res.status(500).json({ error: 'Internal error' })
  }
})

app.post('/v1/user/dispo-flows/:id/use', async (req, res) => {
  try {
    const uid = await authenticateRequest(req, res)
    if (!uid) return

    const { id } = req.params
    if (!id) return res.status(400).json({ error: 'Missing id' })

    const docRef = getDispoFlowsCollection(uid).doc(id)
    const existing = await docRef.get()
    if (!existing.exists) {
      return res.status(404).json({ error: 'Not found' })
    }

    await docRef.update({ usageCount: admin.firestore.FieldValue.increment(1) })
    const updated = await docRef.get()
    console.log({ userId: uid, action: 'use-dispo-flow', timestamp: new Date().toISOString() })
    return res.json({ ok: true, usageCount: updated.data()?.usageCount ?? 0 })
  } catch (error) {
    return res.status(500).json({ error: 'Internal error' })
  }
})

app.post('/v1/user/report-templates/:id/use', async (req, res) => {
  try {
    const uid = await authenticateRequest(req, res)
    if (!uid) return

    const { id } = req.params
    if (!id) return res.status(400).json({ error: 'Missing id' })

    const docRef = getReportTemplatesCollection(uid).doc(id)
    const existing = await docRef.get()
    if (!existing.exists) {
      return res.status(404).json({ error: 'Not found' })
    }

    await docRef.update({ usageCount: admin.firestore.FieldValue.increment(1) })
    const updated = await docRef.get()
    console.log({ userId: uid, action: 'use-report-template', timestamp: new Date().toISOString() })
    return res.json({ ok: true, usageCount: updated.data()?.usageCount ?? 0 })
  } catch (error) {
    return res.status(500).json({ error: 'Internal error' })
  }
})

// ── Customizable Options ───────────────────────────────────────────────

app.get('/v1/user/options', async (req, res) => {
  try {
    const uid = await authenticateRequest(req, res)
    if (!uid) return

    const doc = await getUserDoc(uid).get()
    const data = doc.data()
    const options = data?.customizableOptions ?? { dispositionOptions: [], followUpOptions: [] }
    console.log({ userId: uid, action: 'get-options', timestamp: new Date().toISOString() })
    return res.json({ ok: true, options })
  } catch (error) {
    return res.status(500).json({ error: 'Internal error' })
  }
})

app.put('/v1/user/options', async (req, res) => {
  try {
    const uid = await authenticateRequest(req, res)
    if (!uid) return

    const parsed = CustomizableOptionsSchema.safeParse(req.body)
    if (!parsed.success) {
      return res.status(400).json({ error: 'Invalid request', details: parsed.error.errors })
    }

    await getUserDoc(uid).set({ customizableOptions: parsed.data }, { merge: true })
    console.log({ userId: uid, action: 'update-options', timestamp: new Date().toISOString() })
    return res.json({ ok: true, options: parsed.data })
  } catch (error) {
    return res.status(500).json({ error: 'Internal error' })
  }
})

app.use(surveillanceRouter)

// Initialize Firebase and start server
async function main() {
  await initFirebase()

  const port = process.env.PORT || 8080
  app.listen(port, () => {
    console.log(`backend listening on :${port}`)
  })
}

main().catch(console.error)

