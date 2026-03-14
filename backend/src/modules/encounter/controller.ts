import type { Request, Response } from 'express'
import { z } from 'zod'
import fs from 'node:fs/promises'
import path from 'node:path'
import admin from 'firebase-admin'
import { PHYSICIAN_ATTESTATION } from '../../constants'
import { buildPrompt } from '../../promptBuilder'
import { MdmSchema, renderMdmText } from '../../outputSchema'
import {
  type CdrAnalysisItem,
  type DifferentialItem,
  type FinalMdm,
  type MdmPreview,
  type CdrTracking,
  type TestResult,
  type GapItem,
  type WorkupRecommendation,
} from '../../buildModeSchemas'
import {
  buildSection1Prompt,
  buildFinalizePrompt,
  buildCdrAutoPopulatePrompt,
  buildSuggestDiagnosisPrompt,
  buildParseResultsPrompt,
  type FinalizeStructuredData,
} from '../../promptBuilderBuildMode'
import { buildCompactCatalog } from '../../services/testCatalogFormatter'
import { getRelevantTests } from '../../services/testCatalogSearch'
import { matchCdrsFromDifferential } from '../../services/cdrMatcher'
import { buildCdrTracking } from '../../services/cdrTrackingBuilder'
import { buildPhotoCatalogPrompt, validatePhoto } from '../../photoCatalog.js'
import { cleanLlmJsonResponse } from '../../llm/normalizers'
import { getDifferential } from '../../shared/llmResponseUtils'
import { checkTokenSize } from '../../shared/quotaHelpers'
import { runSurveillanceEnrichment, runCdrEnrichment, injectSurveillanceIntoMdm, incrementGapTallies } from '../../shared/surveillanceEnrichment'
import type { TestDefinition } from '../../types/libraries'
import type { EncounterDeps } from '../../dependencies'

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

/** Encounter statuses that indicate Section 1 is complete (usable by CDR/diagnosis helpers). */
const POST_S1_STATUSES = ['section1_done', 'section2_done', 'finalized', 'section3_error'] as const

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
// Controller Factory
// ============================================================================

export function createEncounterController(deps: EncounterDeps) {
  const { encounterRepo, userService, llmClient, responseParser, libraryCaches, db } = deps

  return {
    /**
     * POST /v1/generate — Legacy one-shot MDM generation
     */
    generate: async (req: Request, res: Response) => {
      const uid = req.user!.uid
      const email = req.user!.email || ''
      const { narrative } = req.body

      await userService.ensureUser(uid, email)

      const quotaCheck = await userService.checkAndIncrementQuota(uid)
      if (!quotaCheck.allowed) {
        return res.status(402).json({
          error: 'Monthly quota exceeded',
          used: quotaCheck.used,
          limit: quotaCheck.limit,
          remaining: 0
        })
      }

      const stats = await userService.getUsageStats(uid)
      const tokenCheck = checkTokenSize(narrative, stats.features.maxTokensPerRequest)
      if (tokenCheck.exceeded) {
        return res.status(400).json(tokenCheck.payload)
      }

      const prompt = await buildPrompt(narrative)

      let draftJson: any | null = null
      let draftText = ''
      try {
        const result = await llmClient.generate(prompt)

        req.log!.info({ action: 'model-response', endpoint: 'generate', responseLength: result.text.length })

        const cleanedText = cleanLlmJsonResponse(result.text)

        const [jsonPart, textPart] = cleanedText.split('\n---TEXT---\n')
        try {
          const parsed = JSON.parse(jsonPart)
          const mdm = MdmSchema.parse(parsed)
          draftJson = mdm
          draftText = textPart?.trim() || renderMdmText(mdm)
        } catch (parseError) {
          req.log!.info({ action: 'generate-json-fallback', error: String(parseError) })
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
        req.log!.warn({ action: 'generate-model-fallback', error: String(e) }, 'Model parsing failed, returning conservative stub')
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

      return res.json({
        ok: true,
        draft: draftText,
        draftJson,
        uid,
        remaining: quotaCheck.remaining,
        plan: stats.plan,
        used: quotaCheck.used,
        limit: quotaCheck.limit
      })
    },

    /**
     * POST /v1/build-mode/process-section1
     */
    processSection1: async (req: Request, res: Response) => {
      const uid = req.user!.uid
      const email = req.user!.email || ''
      const { encounterId, content, location: section1Location } = req.body

      const encounter = await encounterRepo.get(uid, encounterId)
      if (!encounter) {
        return res.status(404).json({ error: 'Encounter not found' })
      }

      const currentSubmissionCount = encounter.section1?.submissionCount || 0
      if (currentSubmissionCount >= 2) {
        return res.status(400).json({
          error: 'Section 1 is locked after 2 submissions',
          submissionCount: currentSubmissionCount,
          isLocked: true,
        })
      }

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
        await encounterRepo.markQuotaCounted(uid, encounterId)
      }

      const stats = await userService.getUsageStats(uid)
      quotaRemaining = stats.remaining

      const tokenCheck = checkTokenSize(content, stats.features.maxTokensPerRequest)
      if (tokenCheck.exceeded) {
        return res.status(400).json(tokenCheck.payload)
      }

      // Surveillance + CDR enrichment (supplementary — failures must not block section 1)
      const [section1SurveillanceCtx, section1CdrCtx] = await Promise.all([
        section1Location ? runSurveillanceEnrichment(content, section1Location) : undefined,
        runCdrEnrichment(content),
      ])

      const systemPrompt = await getPromptGuide('mdm-gen-guide-build-s1.md')
        ?? await getPromptGuide('mdm-gen-guide-v2.md')
      if (!systemPrompt) {
        req.log!.error({ action: 'missing-prompt-guide' }, 'CRITICAL: No MDM guide found for Section 1 prompt')
        return res.status(500).json({ error: 'Internal configuration error' })
      }

      // Build compact test catalog for prompt injection
      let testCatalogStr: string | undefined
      try {
        const relevantTests = await getRelevantTests(content, 50)
        testCatalogStr = buildCompactCatalog(relevantTests)
      } catch (vectorSearchError) {
        req.log!.warn({ action: 'vector-search-fallback', error: String(vectorSearchError) }, 'Vector search failed, falling back to full catalog')
        try {
          const allTests = await libraryCaches.getTests()
          testCatalogStr = buildCompactCatalog(allTests)
        } catch (catalogError) {
          req.log!.warn({ action: 'test-catalog-failed', error: String(catalogError) }, 'Test catalog build also failed')
        }
      }

      const photoCatalog = buildPhotoCatalogPrompt()
      const prompt = buildSection1Prompt(content, systemPrompt, section1SurveillanceCtx, section1CdrCtx, testCatalogStr, photoCatalog)

      let differential: DifferentialItem[]
      let cdrAnalysis: CdrAnalysisItem[]
      let workupRecommendations: WorkupRecommendation[]
      let encounterPhoto: { category: string; subcategory: string } | undefined

      try {
        const result = await llmClient.generate(prompt, { timeoutMs: 90_000 })
        const parsed = responseParser.parseSection1(result.text)

        differential = parsed.data.differential
        cdrAnalysis = parsed.data.cdrAnalysis
        workupRecommendations = parsed.data.workupRecommendations
        encounterPhoto = parsed.data.encounterPhoto

        if ('reason' in parsed) {
          req.log!.warn({ action: 'section1-parse-fallback', reason: parsed.reason })
        }
      } catch (modelError) {
        req.log!.error({ action: 'section1-model-error', error: String(modelError) })
        return res.status(500).json({ error: 'Failed to process section 1' })
      }

      // Update Firestore
      const newSubmissionCount = currentSubmissionCount + 1
      const isLocked = newSubmissionCount >= 2

      await encounterRepo.updateSection1(uid, encounterId, {
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
        ...(section1SurveillanceCtx && { surveillanceContext: section1SurveillanceCtx }),
        ...(section1CdrCtx && { cdrContext: section1CdrCtx }),
        ...(encounterPhoto && { encounterPhoto }),
        status: 'section1_done',
        updatedAt: admin.firestore.Timestamp.now(),
      })

      req.log!.info({
        action: 'process-section1',
        uid,
        encounterId,
        submissionCount: newSubmissionCount,
        cdrAnalysisCount: cdrAnalysis.length,
        workupRecsCount: workupRecommendations.length,
      })

      return res.json({
        ok: true,
        differential,
        ...(cdrAnalysis.length > 0 && { cdrAnalysis }),
        ...(workupRecommendations.length > 0 && { workupRecommendations }),
        submissionCount: newSubmissionCount,
        isLocked,
        quotaRemaining,
      })
    },

    /**
     * POST /v1/build-mode/process-section2 — data persistence only, no LLM call
     */
    processSection2: async (req: Request, res: Response) => {
      const uid = req.user!.uid
      const { encounterId, content, workingDiagnosis, selectedTests, testResults, structuredDiagnosis } = req.body

      const encounter = await encounterRepo.get(uid, encounterId)
      if (!encounter) {
        return res.status(404).json({ error: 'Encounter not found' })
      }

      if (encounter.section1?.status !== 'completed') {
        return res.status(400).json({
          error: 'Section 1 must be completed before processing Section 2',
        })
      }

      const currentSubmissionCount = encounter.section2?.submissionCount || 0
      if (currentSubmissionCount >= 2) {
        return res.status(400).json({
          error: 'Section 2 is locked after 2 submissions',
          submissionCount: currentSubmissionCount,
          isLocked: true,
        })
      }

      const newSubmissionCount = currentSubmissionCount + 1
      const isLocked = newSubmissionCount >= 2

      await encounterRepo.updateSection2(uid, encounterId, {
        'section2.content': content || '',
        'section2.submissionCount': newSubmissionCount,
        'section2.status': 'completed',
        'section2.lastUpdated': admin.firestore.Timestamp.now(),
        ...(selectedTests && { 'section2.selectedTests': selectedTests }),
        ...(testResults && { 'section2.testResults': testResults }),
        ...(() => {
          const resolved = structuredDiagnosis !== undefined ? structuredDiagnosis : (workingDiagnosis || undefined)
          return resolved !== undefined ? { 'section2.workingDiagnosis': resolved } : {}
        })(),
        status: 'section2_done',
        updatedAt: admin.firestore.Timestamp.now(),
      })

      req.log!.info({
        action: 'process-section2',
        uid,
        encounterId,
        submissionCount: newSubmissionCount,
        dataOnly: true,
      })

      return res.json({
        ok: true,
        submissionCount: newSubmissionCount,
        isLocked,
      })
    },

    /**
     * POST /v1/build-mode/finalize
     */
    finalize: async (req: Request, res: Response) => {
      const uid = req.user!.uid
      const { encounterId, content, workingDiagnosis: s3WorkingDiagnosis } = req.body

      const encounter = await encounterRepo.get(uid, encounterId)
      if (!encounter) {
        return res.status(404).json({ error: 'Encounter not found' })
      }

      if (encounter.section2?.status !== 'completed') {
        return res.status(400).json({
          error: 'Section 2 must be completed before finalizing',
        })
      }

      const currentSubmissionCount = encounter.section3?.submissionCount || 0
      if (currentSubmissionCount >= 2) {
        return res.status(400).json({
          error: 'Section 3 is locked after 2 submissions',
          submissionCount: currentSubmissionCount,
          isLocked: true,
        })
      }

      const stats = await userService.getUsageStats(uid)
      const tokenCheck = checkTokenSize(content, stats.features.maxTokensPerRequest)
      if (tokenCheck.exceeded) {
        return res.status(400).json(tokenCheck.payload)
      }

      // Build prompt with all sections
      const s1Diff = getDifferential(encounter.section1?.llmResponse)
      const section1Data = {
        content: encounter.section1?.content || '',
        response: { differential: s1Diff },
      }
      const rawS2 = encounter.section2?.llmResponse
      const hasMdmPreview = rawS2?.mdmPreview && typeof rawS2.mdmPreview === 'object'
      const section2Data: {
        content: string
        response?: { mdmPreview: MdmPreview }
        workingDiagnosis?: string
      } = {
        content: encounter.section2?.content || '',
        ...(hasMdmPreview && { response: { mdmPreview: rawS2.mdmPreview } }),
        workingDiagnosis: encounter.section2?.workingDiagnosis,
      }

      const storedSurveillanceCtx: string | undefined = encounter.surveillanceContext || undefined
      const storedCdrCtx: string | undefined = buildCdrContextString(encounter.cdrTracking ?? {})

      const structuredData: FinalizeStructuredData = {
        selectedTests: encounter.section2?.selectedTests as string[] | undefined,
        testResults: encounter.section2?.testResults as Record<string, TestResult> | undefined,
        workingDiagnosis: s3WorkingDiagnosis ?? encounter.section2?.workingDiagnosis,
        treatments: encounter.section3?.treatments,
        cdrSuggestedTreatments: encounter.section3?.cdrSuggestedTreatments,
        disposition: encounter.section3?.disposition,
        followUp: encounter.section3?.followUp,
      }

      const s3GuideText = await getPromptGuide('mdm-gen-guide-build-s3.md')
      const photoCatalog = buildPhotoCatalogPrompt()
      const prompt = buildFinalizePrompt(section1Data, section2Data, content, storedSurveillanceCtx, storedCdrCtx, structuredData, s3GuideText, photoCatalog)

      let generationFailed: boolean
      let finalMdm: FinalMdm
      let gaps: GapItem[]
      let encounterPhoto: { category: string; subcategory: string } | undefined

      try {
        const result = await llmClient.generate(prompt, { jsonMode: true, timeoutMs: 90_000 })
        const parsed = responseParser.parseFinalize(result.text)

        finalMdm = parsed.data.finalMdm
        gaps = parsed.data.gaps
        encounterPhoto = parsed.data.encounterPhoto
        generationFailed = parsed.data.generationFailed

        if ('reason' in parsed) {
          req.log!.warn({ action: 'finalize-parse-fallback', reason: parsed.reason })
        }
      } catch (modelError) {
        req.log!.error({ action: 'finalize-model-error', error: String(modelError) })
        return res.status(500).json({ error: 'Failed to finalize encounter' })
      }

      // Deterministic surveillance enrichment of dataReviewed
      if (storedSurveillanceCtx && finalMdm.json?.dataReviewed) {
        const reviewed = Array.isArray(finalMdm.json.dataReviewed)
          ? finalMdm.json.dataReviewed
          : [finalMdm.json.dataReviewed]
        const enriched = injectSurveillanceIntoMdm(reviewed, finalMdm.text, storedSurveillanceCtx)
        finalMdm.json.dataReviewed = enriched.dataReviewed
        finalMdm.text = enriched.text
      }

      // Update Firestore
      const newSubmissionCount = currentSubmissionCount + 1

      await encounterRepo.finalize(uid, encounterId, {
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

      await incrementGapTallies(uid, gaps, db)

      req.log!.info({
        action: 'finalize',
        uid,
        encounterId,
        submissionCount: newSubmissionCount,
        gapCount: gaps.length,
      })

      return res.json({
        ok: true,
        generationFailed,
        finalMdm,
        gaps,
        quotaRemaining: stats.remaining,
      })
    },

    /**
     * POST /v1/build-mode/match-cdrs
     */
    matchCdrs: async (req: Request, res: Response) => {
      const uid = req.user!.uid
      const { encounterId } = req.body

      const encounter = await encounterRepo.get(uid, encounterId)
      if (!encounter) {
        return res.status(404).json({ error: 'Encounter not found' })
      }

      if (!POST_S1_STATUSES.includes(encounter.status as typeof POST_S1_STATUSES[number]) || !encounter.section1?.llmResponse) {
        return res.status(400).json({
          error: 'Section 1 must be completed before CDR matching',
        })
      }

      const differential = getDifferential(encounter.section1.llmResponse)

      if (differential.length === 0) {
        return res.json({ ok: true, cdrTracking: {}, matchedCount: 0 })
      }

      const cdrs = await libraryCaches.getCdrs()
      const matchedCdrs = matchCdrsFromDifferential(differential, cdrs)

      if (matchedCdrs.length === 0) {
        await encounterRepo.updateCdrTracking(uid, encounterId, {} as CdrTracking)

        req.log!.info({ action: 'match-cdrs', uid, encounterId, matchedCount: 0 })

        return res.json({ ok: true, cdrTracking: {}, matchedCount: 0 })
      }

      // Auto-populate components from S1 narrative (supplementary — failures don't block)
      let autoPopulated: ReturnType<typeof responseParser.parseCdrAutoPopulate> = null
      const s1Content = encounter.section1.content || ''

      if (s1Content) {
        try {
          const prompt = buildCdrAutoPopulatePrompt(s1Content, matchedCdrs)

          if (prompt.system) {
            const result = await llmClient.generate(prompt)
            autoPopulated = responseParser.parseCdrAutoPopulate(result.text)
          }
        } catch (autoPopError) {
          req.log!.warn({ action: 'cdr-auto-populate-failed', error: String(autoPopError) }, 'CDR auto-populate LLM call failed (non-blocking)')
        }
      }

      const cdrTracking: CdrTracking = buildCdrTracking(matchedCdrs, autoPopulated)

      await encounterRepo.updateCdrTracking(uid, encounterId, cdrTracking)

      req.log!.info({
        action: 'match-cdrs',
        uid,
        encounterId,
        matchedCount: matchedCdrs.length,
        autoPopulated: autoPopulated !== null,
      })

      return res.json({ ok: true, cdrTracking, matchedCount: matchedCdrs.length })
    },

    /**
     * POST /v1/build-mode/suggest-diagnosis
     */
    suggestDiagnosis: async (req: Request, res: Response) => {
      const uid = req.user!.uid
      const { encounterId } = req.body

      const encounter = await encounterRepo.get(uid, encounterId)
      if (!encounter) {
        return res.status(404).json({ error: 'Encounter not found' })
      }

      if (!POST_S1_STATUSES.includes(encounter.status as typeof POST_S1_STATUSES[number]) || !encounter.section1?.llmResponse) {
        return res.status(400).json({
          error: 'Section 1 must be completed before suggesting diagnoses',
        })
      }

      const differential = getDifferential(encounter.section1.llmResponse)

      if (differential.length === 0) {
        return res.status(400).json({ error: 'No differential available from Section 1' })
      }

      // Build test results summary from S2 structured data
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

      const chiefComplaint = encounter.chiefComplaint || 'Unknown'
      const prompt = buildSuggestDiagnosisPrompt(differential, chiefComplaint, testResultsSummary)

      let suggestions: string[]
      try {
        const result = await llmClient.generate(prompt)
        const parsed = responseParser.parseSuggestDiagnosis(result.text, differential)
        suggestions = parsed.data
      } catch (modelError) {
        req.log!.error({ action: 'suggest-diagnosis-model-error', error: String(modelError) })
        suggestions = differential.slice(0, 3).map((d) => d.diagnosis)
      }

      req.log!.info({
        action: 'suggest-diagnosis',
        uid,
        encounterId,
        suggestionCount: suggestions.length,
      })

      return res.json({ ok: true, suggestions })
    },

    /**
     * POST /v1/build-mode/parse-results
     */
    parseResults: async (req: Request, res: Response) => {
      const uid = req.user!.uid
      const { encounterId, pastedText, orderedTestIds } = req.body

      const encounter = await encounterRepo.get(uid, encounterId)
      if (!encounter) {
        return res.status(404).json({ error: 'Encounter not found' })
      }

      // Load test definitions for ordered tests
      const allTests = await libraryCaches.getTests()
      const orderedTests = orderedTestIds
        .map((id: string) => allTests.find((t) => t.id === id))
        .filter((t: TestDefinition | undefined): t is TestDefinition => t !== undefined)

      if (orderedTests.length === 0) {
        return res.status(400).json({ error: 'No valid ordered tests found' })
      }

      const prompt = buildParseResultsPrompt(
        pastedText,
        orderedTests.map((t: TestDefinition) => ({ id: t.id, name: t.name, unit: t.unit, normalRange: t.normalRange }))
      )

      const result = await llmClient.generate(prompt)

      const validTestIds = new Set(orderedTestIds as string[])
      const parsed = responseParser.parseResults(result.text, validTestIds)

      req.log!.info({
        action: 'parse-results',
        uid,
        encounterId,
        parsedCount: parsed.data.parsed.length,
        unmatchedCount: parsed.data.unmatchedText.length,
      })

      return res.json({
        ok: true,
        parsed: parsed.data.parsed,
        ...(parsed.data.unmatchedText.length > 0 ? { unmatchedText: parsed.data.unmatchedText } : {}),
      })
    },
  }
}
