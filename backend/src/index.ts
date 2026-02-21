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
import { callGeminiFlash } from './vertex'
import { userService } from './services/userService'
import {
  Section1RequestSchema,
  Section2RequestSchema,
  FinalizeRequestSchema,
  DifferentialItemSchema,
  MdmPreviewSchema,
  FinalMdmSchema,
  type DifferentialItem,
  type MdmPreview,
  type FinalMdm,
} from './buildModeSchemas'
import {
  buildSection1Prompt,
  buildSection2Prompt,
  buildFinalizePrompt,
} from './promptBuilderBuildMode'
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
import { buildSurveillanceContext } from './surveillance/promptAugmenter'

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
    res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
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
  } catch (e: any) {
    console.error(e)
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
      const result = await callGeminiFlash(prompt)

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
  } catch (e: any) {
    const status = e.status || 500
    if (status !== 500) return res.status(status).json({ error: e.message })
    console.error(e)
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
      const result = await callGeminiFlash(prompt)
      
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
  } catch (e: any) {
    const status = e.status || 500
    if (status !== 500) return res.status(status).json({ error: e.message })
    console.error(e)
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
          const { dataPoints, errors: survErrors } = await registry.fetchAll(region, syndromes)
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
            analyzedAt: new Date().toISOString(),
          }) || undefined
        }
      } catch (survError) {
        console.warn('Section 1 surveillance enrichment failed (non-blocking):', survError)
      }
    }

    // 7. Build prompt and call Vertex AI
    const systemPrompt = await fs.readFile(
      path.join(__dirname, '../../docs/mdm-gen-guide.md'),
      'utf8'
    ).catch(() => '') // Fallback to empty if guide not found

    const prompt = buildSection1Prompt(content, systemPrompt, section1SurveillanceCtx)

    let differential: DifferentialItem[] = []
    try {
      const result = await callGeminiFlash(prompt)

      // Parse response - expect JSON array of differential items
      let cleanedText = result.text
        .replace(/^```json\s*/gm, '')
        .replace(/^```\s*$/gm, '')
        .trim()

      try {
        let rawParsed = JSON.parse(cleanedText)
        // Unwrap { "differential": [...] } wrapper if present
        if (!Array.isArray(rawParsed) && rawParsed?.differential && Array.isArray(rawParsed.differential)) {
          rawParsed = rawParsed.differential
        }
        // Validate structure
        if (!Array.isArray(rawParsed)) {
          const jsonStart = cleanedText.indexOf('[')
          const jsonEnd = cleanedText.lastIndexOf(']')
          if (jsonStart >= 0 && jsonEnd > jsonStart) {
            rawParsed = JSON.parse(cleanedText.slice(jsonStart, jsonEnd + 1))
          } else {
            throw new Error('Expected array of differential items')
          }
        }
        // Validate each item with Zod schema
        const validated = z.array(DifferentialItemSchema).safeParse(rawParsed)
        if (validated.success) {
          differential = validated.data
        } else {
          console.warn('Section 1 Zod validation failed:', validated.error.message)
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
      'section1.llmResponse': differential,
      'section1.submissionCount': newSubmissionCount,
      'section1.status': 'completed',
      'section1.lastUpdated': admin.firestore.Timestamp.now(),
      // Persist surveillance context so Section 3 (finalize) can access it
      ...(section1SurveillanceCtx && { surveillanceContext: section1SurveillanceCtx }),
      status: 'section1_done',
      updatedAt: admin.firestore.Timestamp.now(),
    })

    // 8. Log action (no PHI)
    console.log({
      action: 'process-section1',
      uid,
      encounterId,
      submissionCount: newSubmissionCount,
      timestamp: new Date().toISOString(),
    })

    // 9. Return response
    return res.json({
      ok: true,
      differential,
      submissionCount: newSubmissionCount,
      isLocked,
      quotaRemaining,
    })
  } catch (e: any) {
    console.error('process-section1 error:', e)
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

    const { encounterId, content, workingDiagnosis } = parsed.data

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

    const prompt = buildSection2Prompt(section1Content, section1Response, content, workingDiagnosis)

    let mdmPreview: MdmPreview
    try {
      const result = await callGeminiFlash(prompt)

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
      'section2.llmResponse': mdmPreview,
      'section2.submissionCount': newSubmissionCount,
      'section2.status': 'completed',
      'section2.lastUpdated': admin.firestore.Timestamp.now(),
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
  } catch (e: any) {
    console.error('process-section2 error:', e)
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

    const { encounterId, content } = parsed.data

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

    const prompt = buildFinalizePrompt(section1Data, section2Data, content, storedSurveillanceCtx)

    let finalMdm: FinalMdm
    try {
      const result = await callGeminiFlash(prompt)

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

      try {
        const rawParsed = JSON.parse(cleanedText)
        const candidate: FinalMdm = {
          text: rawParsed.text || '',
          json: {
            problems: rawParsed.json?.problems || rawParsed.problems || [],
            differential: rawParsed.json?.differential || rawParsed.differential || [],
            dataReviewed: rawParsed.json?.dataReviewed || rawParsed.dataReviewed || [],
            reasoning: rawParsed.json?.reasoning || rawParsed.reasoning || '',
            risk: rawParsed.json?.risk || rawParsed.risk || [],
            disposition: rawParsed.json?.disposition || rawParsed.disposition || '',
            complexityLevel: rawParsed.json?.complexityLevel || rawParsed.complexityLevel || 'moderate',
          },
        }
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
            const jsonObj = JSON.parse(cleanedText.slice(jsonStart, jsonEnd + 1))
            const candidate: FinalMdm = {
              text: jsonObj.text || renderMdmText(jsonObj),
              json: {
                problems: jsonObj.problems || [],
                differential: jsonObj.differential || [],
                dataReviewed: jsonObj.dataReviewed || [],
                reasoning: jsonObj.reasoning || '',
                risk: jsonObj.risk || [],
                disposition: jsonObj.disposition || '',
                complexityLevel: jsonObj.complexityLevel || 'moderate',
              },
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

    // 7. Update Firestore
    const newSubmissionCount = currentSubmissionCount + 1

    await encounterRef.update({
      'section3.content': content,
      'section3.llmResponse': finalMdm,
      'section3.submissionCount': newSubmissionCount,
      'section3.status': 'completed',
      'section3.lastUpdated': admin.firestore.Timestamp.now(),
      status: 'finalized',
      updatedAt: admin.firestore.Timestamp.now(),
    })

    // 8. Log action (no PHI)
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
  } catch (e: any) {
    console.error('finalize error:', e)
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
          const { dataPoints, errors: survErrors } = await registry.fetchAll(region, syndromes)
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
            analyzedAt: new Date().toISOString(),
          }) || undefined
        }
      } catch (survError) {
        console.warn('Surveillance enrichment failed (non-blocking):', survError)
      }
    }

    // 9. Build prompt and call Vertex AI
    let result: QuickModeGenerationResult
    try {
      const prompt = await buildQuickModePrompt(narrative, surveillanceContext)
      const modelResponse = await callGeminiFlash(prompt)
      result = parseQuickModeResponse(modelResponse.text)
    } catch (modelError) {
      console.error('Quick mode model error:', modelError)
      result = getQuickModeFallback()
    }

    // 10. Update Firestore with results
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
  } catch (e: any) {
    console.error('quick-mode/generate error:', e)
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

