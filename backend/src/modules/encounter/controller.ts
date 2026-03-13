import type { Request, Response } from 'express'
import { z } from 'zod'
import fs from 'node:fs/promises'
import path from 'node:path'
import admin from 'firebase-admin'
import { PHYSICIAN_ATTESTATION } from '../../constants'
import { buildPrompt } from '../../promptBuilder'
import { MdmSchema, renderMdmText } from '../../outputSchema'
import { callGemini } from '../../vertex'
import { userService } from '../../services/userService'
import {
  Section1RequestSchema,
  Section2RequestSchema,
  FinalizeRequestSchema,
  MatchCdrsRequestSchema,
  SuggestDiagnosisRequestSchema,
  ParseResultsRequestSchema,
  CdrAnalysisItemSchema,
  WorkupRecommendationSchema,
  FinalMdmSchema,
  type DifferentialItem,
  type CdrAnalysisItem,
  type WorkupRecommendation,
  type MdmPreview,
  type FinalMdm,
  safeParseGaps,
  type CdrTracking,
  type TestResult,
  type ParsedResultItem,
  type GapItem,
} from '../../buildModeSchemas'
import {
  buildSection1Prompt,
  buildSection2Prompt,
  buildFinalizePrompt,
  buildCdrAutoPopulatePrompt,
  buildSuggestDiagnosisPrompt,
  buildParseResultsPrompt,
  type FinalizeStructuredData,
} from '../../promptBuilderBuildMode'
import { buildCompactCatalog } from '../../services/testCatalogFormatter'
import { getRelevantTests } from '../../services/testCatalogSearch'
import { matchCdrsFromDifferential } from '../../services/cdrMatcher'
import { buildCdrTracking, type AutoPopulatedValues } from '../../services/cdrTrackingBuilder'
import { buildPhotoCatalogPrompt, validatePhoto } from '../../photoCatalog.js'
import {
  cleanLlmJsonResponse,
  extractJsonFromText,
  coerceAndValidateDifferential,
  extractFinalMdm,
  getDifferential,
} from '../../shared/llmResponseUtils'
import { getEncounterRef } from '../../shared/db'
import { getCachedCdrLibrary, getCachedTestLibrary } from '../../shared/libraryCache'
import { checkTokenSize } from '../../shared/quotaHelpers'
import { runSurveillanceEnrichment, runCdrEnrichment, injectSurveillanceIntoMdm, incrementGapTallies } from '../../shared/surveillanceEnrichment'
import type { TestDefinition } from '../../types/libraries'

// ============================================================================
// Prompt guide cache (static files, read once)
// ============================================================================

const promptGuideCache = new Map<string, string>()

async function getPromptGuide(filename: string): Promise<string | undefined> {
  const cached = promptGuideCache.get(filename)
  if (cached) return cached

  try {
    const content = await fs.readFile(
      path.join(__dirname, '../../../prompts', filename),
      'utf8'
    )
    promptGuideCache.set(filename, content)
    return content
  } catch {
    return undefined
  }
}

// ============================================================================
// Schemas
// ============================================================================

export const GenerateSchema = z.object({
  narrative: z.string().min(1).max(16000),
  userIdToken: z.string().min(10),
})

// ============================================================================
// Helpers
// ============================================================================

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

// ============================================================================
// Handlers
// ============================================================================

/**
 * POST /v1/generate
 * Legacy one-shot MDM generation
 */
export async function generate(req: Request, res: Response) {
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

      // Strip markdown code fences
      const cleanedText = cleanLlmJsonResponse(result.text)

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
        decision_making: 'Clinical reasoning provided narrative; defaults applied where data absent.',
        risk: ['Discussed risks/benefits; return precautions given.'],
        disposition: '',
        attestation: PHYSICIAN_ATTESTATION,
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
}

/**
 * POST /v1/build-mode/process-section1
 * Process initial evaluation (Section 1) and generate worst-first differential
 */
export async function processSection1(req: Request, res: Response) {
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

    // 6. Surveillance + CDR enrichment (supplementary — failures must not block section 1)
    const [section1SurveillanceCtx, section1CdrCtx] = await Promise.all([
      section1Location ? runSurveillanceEnrichment(content, section1Location) : undefined,
      runCdrEnrichment(content),
    ])

    // 7. Build prompt and call Vertex AI
    // Use build-mode-specific S1 guide (fallback to legacy guide, fail on total absence)
    const systemPrompt = await getPromptGuide('mdm-gen-guide-build-s1.md')
      ?? await getPromptGuide('mdm-gen-guide-v2.md')
    if (!systemPrompt) {
      console.error('CRITICAL: No MDM guide found for Section 1 prompt')
      return res.status(500).json({ error: 'Internal configuration error' })
    }

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

    const photoCatalog = buildPhotoCatalogPrompt()
    const prompt = buildSection1Prompt(content, systemPrompt, section1SurveillanceCtx, section1CdrCtx, testCatalogStr, photoCatalog)

    let differential: DifferentialItem[] = []
    let cdrAnalysis: CdrAnalysisItem[] = []
    let workupRecommendations: WorkupRecommendation[] = []
    let encounterPhoto: { category: string; subcategory: string } | undefined
    try {
      const result = await callGemini(prompt, { timeoutMs: 90_000 })

      // Clean LLM response: strip code fences, preamble text, trailing commas
      const cleanedText = cleanLlmJsonResponse(result.text)

      try {
        let rawParsed = JSON.parse(cleanedText)

        // Handle both legacy (array) and new (object) response formats
        if (Array.isArray(rawParsed)) {
          // Legacy format: raw array of differential items
          differential = coerceAndValidateDifferential(rawParsed)
        } else if (rawParsed && typeof rawParsed === 'object') {
          // New format: { differential, cdrAnalysis, workupRecommendations }
          // Extract differential
          if (Array.isArray(rawParsed.differential)) {
            differential = coerceAndValidateDifferential(rawParsed.differential)
          }

          // Extract cdrAnalysis (non-blocking — failures don't affect differential)
          if (Array.isArray(rawParsed.cdrAnalysis)) {
            const cdrValidated = z.array(CdrAnalysisItemSchema).safeParse(rawParsed.cdrAnalysis)
            if (cdrValidated.success) {
              const applicableCdrs = cdrValidated.data.filter((item) => item.applicable)
              const seenCdrNames = new Set<string>()
              cdrAnalysis = applicableCdrs.filter((item) => {
                const key = item.name.toLowerCase().trim()
                if (seenCdrNames.has(key)) return false
                seenCdrNames.add(key)
                return true
              })
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

          encounterPhoto = validatePhoto(rawParsed.encounterPhoto)
        }

        // Fallback: if no differential was parsed, try extracting JSON object from text
        if (differential.length === 0) {
          const extracted = extractJsonFromText(cleanedText)
          if (extracted) {
            try {
              const fallbackParsed = JSON.parse(extracted)
              if (Array.isArray(fallbackParsed)) {
                differential = coerceAndValidateDifferential(fallbackParsed)
              } else if (fallbackParsed && typeof fallbackParsed === 'object' && Array.isArray(fallbackParsed.differential)) {
                differential = coerceAndValidateDifferential(fallbackParsed.differential)
              }
            } catch {
              // extraction attempt failed, continue to final fallback
            }
          }
        }

        if (differential.length === 0) {
          console.warn('Section 1: no valid differential parsed from model output', {
            responseLength: result.text.length,
            cleanedLength: cleanedText.length,
          })
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
      const errMsg = modelError instanceof Error ? modelError.message : String(modelError)
      const errStack = modelError instanceof Error ? modelError.stack : undefined
      console.error('Section 1 model/parse error:', { error: errMsg, stack: errStack })
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
      ...(encounterPhoto && { encounterPhoto }),
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
}

/**
 * POST /v1/build-mode/process-section2
 * Process workup & results (Section 2) and generate MDM preview
 */
export async function processSection2(req: Request, res: Response) {
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

    // ================================================================
    // REDESIGNED S2: Data persistence only — NO LLM call
    // Section 2 is now pure data entry. Structured data (tests, results,
    // working diagnosis) is persisted directly to Firestore without AI.
    // ================================================================

    // 6. Update Firestore with structured data
    const newSubmissionCount = currentSubmissionCount + 1
    const isLocked = newSubmissionCount >= 2

    await encounterRef.update({
      'section2.content': content || '',
      'section2.submissionCount': newSubmissionCount,
      'section2.status': 'completed',
      'section2.lastUpdated': admin.firestore.Timestamp.now(),
      // Persist structured data from the request
      ...(selectedTests && { 'section2.selectedTests': selectedTests }),
      ...(testResults && { 'section2.testResults': testResults }),
      ...(() => {
        const resolved = structuredDiagnosis !== undefined ? structuredDiagnosis : (workingDiagnosis || undefined)
        return resolved !== undefined ? { 'section2.workingDiagnosis': resolved } : {}
      })(),
      status: 'section2_done',
      updatedAt: admin.firestore.Timestamp.now(),
    })

    // 7. Log action (no PHI)
    console.log({
      action: 'process-section2',
      uid,
      encounterId,
      submissionCount: newSubmissionCount,
      dataOnly: true,
      timestamp: new Date().toISOString(),
    })

    // 8. Return response (no mdmPreview — S2 is data-entry only)
    return res.json({
      ok: true,
      submissionCount: newSubmissionCount,
      isLocked,
    })
  } catch (e: unknown) {
    console.error('process-section2 error:', e instanceof Error ? e.message : 'unknown error')
    return res.status(500).json({ error: 'Internal error' })
  }
}

/**
 * POST /v1/build-mode/finalize
 * Process treatment & disposition (Section 3) and generate final MDM
 */
export async function finalize(req: Request, res: Response) {
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
    const s1Diff = getDifferential(encounter.section1?.llmResponse)
    const section1Data = {
      content: encounter.section1?.content || '',
      response: { differential: s1Diff },
    }
    // S2 data: handle both old-flow (with mdmPreview) and new-flow (data-entry only)
    const rawS2 = encounter.section2?.llmResponse
    const hasMdmPreview = rawS2?.mdmPreview && typeof rawS2.mdmPreview === 'object'
    const section2Data: {
      content: string
      response?: { mdmPreview: MdmPreview }
      workingDiagnosis?: string
    } = {
      content: encounter.section2?.content || '',
      // Only include mdmPreview if S2 was processed by LLM (old flow)
      ...(hasMdmPreview && { response: { mdmPreview: rawS2.mdmPreview } }),
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

    // Read build-mode-specific S3 guide (fallback to inline instructions if not found)
    const s3GuideText = await getPromptGuide('mdm-gen-guide-build-s3.md')

    const photoCatalog = buildPhotoCatalogPrompt()
    const prompt = buildFinalizePrompt(section1Data, section2Data, content, storedSurveillanceCtx, storedCdrCtx, structuredData, s3GuideText, photoCatalog)

    let generationFailed = false
    let finalMdm: FinalMdm
    let gaps: GapItem[] = []
    let encounterPhoto: { category: string; subcategory: string } | undefined
    try {
      const result = await callGemini(prompt, { jsonMode: true, timeoutMs: 90_000 })

      // Parse response - expect text and json sections
      let cleanedText = cleanLlmJsonResponse(result.text)

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
        let rawParsed = JSON.parse(cleanedText)

        // Defensive unwrap: if LLM wraps in { finalMdm: {...} }
        if (rawParsed.finalMdm && typeof rawParsed.finalMdm === 'object') {
          rawParsed = rawParsed.finalMdm
        }

        const candidate = extractFinalMdm(rawParsed)
        gaps = safeParseGaps(rawParsed.gaps)
        encounterPhoto = validatePhoto(rawParsed.encounterPhoto)
        // Validate with Zod schema
        const validated = FinalMdmSchema.safeParse(candidate)
        if (validated.success) {
          finalMdm = validated.data
        } else {
          console.warn('Finalize Zod validation failed:', {
            zodError: validated.error.message,
            candidateKeys: Object.keys(candidate),
          })
          finalMdm = fallbackMdm
          generationFailed = true
        }
      } catch (parseError) {
        console.error('Finalize JSON parse error:', {
          error: parseError instanceof Error ? parseError.message : String(parseError),
          responseLength: cleanedText.length,
          responsePreview: cleanedText.substring(0, 200),
        })
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
            gaps = safeParseGaps(jsonObj.gaps)
            encounterPhoto = validatePhoto(jsonObj.encounterPhoto)
            const validated = FinalMdmSchema.safeParse(candidate)
            finalMdm = validated.success ? validated.data : fallbackMdm
            if (!validated.success) generationFailed = true
          } catch {
            finalMdm = fallbackMdm
            generationFailed = true
          }
        } else {
          finalMdm = fallbackMdm
          generationFailed = true
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
      const enriched = injectSurveillanceIntoMdm(reviewed, finalMdm.text, storedSurveillanceCtx)
      finalMdm.json.dataReviewed = enriched.dataReviewed
      finalMdm.text = enriched.text
    }

    // 8. Update Firestore
    const newSubmissionCount = currentSubmissionCount + 1

    await encounterRef.update({
      'section3.content': content,
      'section3.llmResponse': {
        finalMdm,
        gaps,
        processedAt: admin.firestore.Timestamp.now(),
      },
      'section3.submissionCount': newSubmissionCount,
      'section3.status': generationFailed ? 'error' : 'completed',
      'section3.lastUpdated': admin.firestore.Timestamp.now(),
      ...(encounterPhoto && { encounterPhoto }),
      status: generationFailed ? 'section3_error' : 'finalized',
      updatedAt: admin.firestore.Timestamp.now(),
    })

    // 9. Increment gap tallies on user profile
    await incrementGapTallies(uid, gaps)

    // 10. Log action (no PHI)
    console.log({
      action: 'finalize',
      uid,
      encounterId,
      submissionCount: newSubmissionCount,
      gapCount: gaps.length,
      timestamp: new Date().toISOString(),
    })

    // 11. Return response
    return res.json({
      ok: true,
      generationFailed,
      finalMdm,
      gaps,
      quotaRemaining: stats.remaining,
    })
  } catch (e: unknown) {
    console.error('finalize error:', e instanceof Error ? e.message : 'unknown error')
    return res.status(500).json({ error: 'Internal error' })
  }
}

/**
 * POST /v1/build-mode/match-cdrs
 * Match CDRs from S1 differential and auto-populate components from narrative.
 */
export async function matchCdrs(req: Request, res: Response) {
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
    const validStatuses = ['section1_done', 'section2_done', 'finalized', 'section3_error']
    if (!validStatuses.includes(encounter.status) || !encounter.section1?.llmResponse) {
      return res.status(400).json({
        error: 'Section 1 must be completed before CDR matching',
      })
    }

    // 4. EXECUTE

    // 4a. Extract differential from S1 response
    const differential = getDifferential(encounter.section1.llmResponse)

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

          const cleanedText = cleanLlmJsonResponse(result.text)

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
}

/**
 * POST /v1/build-mode/suggest-diagnosis
 * Suggest ranked working diagnoses from S1 differential refined by S2 results.
 * No quota deduction — UI helper only.
 */
export async function suggestDiagnosis(req: Request, res: Response) {
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
    const validStatuses = ['section1_done', 'section2_done', 'finalized', 'section3_error']
    if (!validStatuses.includes(encounter.status) || !encounter.section1?.llmResponse) {
      return res.status(400).json({
        error: 'Section 1 must be completed before suggesting diagnoses',
      })
    }

    // 4. EXECUTE

    // 4a. Extract differential from S1 response
    const differential = getDifferential(encounter.section1.llmResponse)

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
    const cleanedText = cleanLlmJsonResponse(result.text)

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
}

/**
 * POST /v1/build-mode/parse-results
 * AI parsing of pasted lab/EHR text into structured results mapped to ordered tests.
 * No quota deduction — UI helper only.
 */
export async function parseResults(req: Request, res: Response) {
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
    const cleanedText = cleanLlmJsonResponse(result.text)

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
}
