/**
 * Encounter Orchestrator
 *
 * All business logic for encounter endpoints lives here — extracted from
 * the controller so it can be tested without HTTP. Methods throw AppError
 * subclasses for error conditions (caught by errorHandler middleware via
 * asyncHandler in the route layer).
 */

import fs from 'node:fs/promises'
import admin from 'firebase-admin'
import { promptPath } from '../../shared/paths.js'
import { PHYSICIAN_ATTESTATION } from '../../constants.js'
import { config } from '../../config.js'
import { logger } from '../../logger.js'
import { buildPrompt } from '../../promptBuilder.js'
import { MdmSchema, renderMdmText } from '../../outputSchema.js'
import {
  type CdrAnalysisItem,
  type DifferentialItem,
  type FinalMdm,
  type MdmPreview,
  type CdrTracking,
  type TestResult,
  type GapItem,
  type WorkupRecommendation,
  type SocietyGuideline,
} from '../../buildModeSchemas.js'
import {
  buildSection1Prompt,
  buildFinalizePrompt,
  buildCdrAutoPopulatePrompt,
  buildSuggestDiagnosisPrompt,
  buildParseResultsPrompt,
  type FinalizeStructuredData,
} from '../../promptBuilderBuildMode.js'
import { matchCdrsFromDifferential } from '../../services/cdrMatcher.js'
import { buildCdrTracking } from '../../services/cdrTrackingBuilder.js'
import { cleanLlmJsonResponse } from '../../llm/normalizers.js'
import { getDifferential } from '../../shared/llmResponseUtils.js'
import { checkTokenSize } from '../../shared/quotaHelpers.js'
import { injectSurveillanceIntoMdm } from '../../shared/surveillanceEnrichment.js'
import { NotFoundError, SectionLockedError, QuotaExceededError, ValidationError, LlmError } from '../../errors.js'
import type { IEncounterRepository } from '../../data/repositories/encounterRepository.js'
import type { ILlmClient } from '../../llm/llmClient.js'
import type { LlmResponseParser } from '../../llm/responseParser.js'
import type { UserService } from '../../services/userService.js'
import type { LibraryCaches } from '../../dependencies.js'
import type { EnrichmentPipeline } from './enrichmentPipeline.js'
import type { TestDefinition } from '../../types/libraries.js'
import type { Logger as PinoLogger } from '../../logger.js'

// ============================================================================
// Dependencies
// ============================================================================

export interface OrchestratorDeps {
  encounterRepo: IEncounterRepository
  userService: UserService
  llmClient: ILlmClient
  responseParser: LlmResponseParser
  enrichmentPipeline: EnrichmentPipeline
  libraryCaches: LibraryCaches
}

// ============================================================================
// Module-level helpers
// ============================================================================

const promptGuideCache = new Map<string, string>()

async function getPromptGuide(filename: string): Promise<string | undefined> {
  const cached = promptGuideCache.get(filename)
  if (cached) return cached

  try {
    const content = await fs.readFile(promptPath(filename), 'utf8')
    promptGuideCache.set(filename, content)
    return content
  } catch {
    return undefined
  }
}

/** Encounter statuses that indicate Section 1 is complete. */
const POST_S1_STATUSES = ['section1_done', 'section2_done', 'finalized', 'section3_error'] as const

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
// Orchestrator
// ============================================================================

export class EncounterOrchestrator {
  private encounterRepo: IEncounterRepository
  private userService: UserService
  private llmClient: ILlmClient
  private responseParser: LlmResponseParser
  private enrichmentPipeline: EnrichmentPipeline
  private libraryCaches: LibraryCaches

  constructor(deps: OrchestratorDeps) {
    this.encounterRepo = deps.encounterRepo
    this.userService = deps.userService
    this.llmClient = deps.llmClient
    this.responseParser = deps.responseParser
    this.enrichmentPipeline = deps.enrichmentPipeline
    this.libraryCaches = deps.libraryCaches
  }

  // --------------------------------------------------------------------------
  // Legacy one-shot generation
  // --------------------------------------------------------------------------

  async generate(
    uid: string,
    email: string,
    narrative: string,
    reqLog?: PinoLogger,
  ) {
    const log = reqLog || logger

    await this.userService.ensureUser(uid, email)

    const quotaCheck = await this.userService.checkAndIncrementQuota(uid)
    if (!quotaCheck.allowed) {
      throw new QuotaExceededError('Monthly quota exceeded', {
        remaining: 0,
        plan: 'unknown',
        limit: quotaCheck.limit,
        used: quotaCheck.used,
      })
    }

    const stats = await this.userService.getUsageStats(uid)
    const tokenCheck = checkTokenSize(narrative, stats.features.maxTokensPerRequest)
    if (tokenCheck.exceeded) {
      throw new ValidationError(tokenCheck.payload.error)
    }

    const prompt = await buildPrompt(narrative)

    let draftJson: any | null = null
    let draftText = ''
    try {
      const result = await this.llmClient.generate(prompt)

      log.info({ action: 'model-response', endpoint: 'generate', responseLength: result.text.length })

      const cleanedText = cleanLlmJsonResponse(result.text)

      const [jsonPart, textPart] = cleanedText.split('\n---TEXT---\n')
      try {
        const parsed = JSON.parse(jsonPart)
        const mdm = MdmSchema.parse(parsed)
        draftJson = mdm
        draftText = textPart?.trim() || renderMdmText(mdm)
      } catch (parseError) {
        log.info({ action: 'generate-json-fallback', error: String(parseError) })
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
      // Conservative stub fallback — intentional graceful degradation, NOT an error
      log.warn({ action: 'generate-model-fallback', error: String(e) }, 'Model parsing failed, returning conservative stub')
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

    return {
      ok: true,
      draft: draftText,
      draftJson,
      uid,
      remaining: quotaCheck.remaining,
      plan: stats.plan,
      used: quotaCheck.used,
      limit: quotaCheck.limit,
    }
  }

  // --------------------------------------------------------------------------
  // Build Mode: Section 1
  // --------------------------------------------------------------------------

  async processSection1(
    uid: string,
    email: string,
    encounterId: string,
    content: string,
    location?: { zipCode?: string; state?: string },
    reqLog?: PinoLogger,
  ) {
    const log = reqLog || logger

    const encounter = await this.encounterRepo.get(uid, encounterId)
    if (!encounter) {
      throw new NotFoundError('Encounter not found')
    }

    const currentSubmissionCount = encounter.section1?.submissionCount || 0
    if (currentSubmissionCount >= 2) {
      throw new SectionLockedError(1)
    }

    if (!encounter.quotaCounted) {
      await this.userService.ensureUser(uid, email)
      const quotaCheck = await this.userService.checkAndIncrementQuota(uid)
      if (!quotaCheck.allowed) {
        throw new QuotaExceededError('Monthly quota exceeded', {
          remaining: 0,
          plan: 'unknown',
          limit: quotaCheck.limit,
          used: quotaCheck.used,
        })
      }
      await this.encounterRepo.markQuotaCounted(uid, encounterId)
    }

    const stats = await this.userService.getUsageStats(uid)
    const quotaRemaining = stats.remaining

    const tokenCheck = checkTokenSize(content, stats.features.maxTokensPerRequest)
    if (tokenCheck.exceeded) {
      throw new ValidationError(tokenCheck.payload.error)
    }

    // Surveillance + CDR enrichment (supplementary — failures must not block section 1)
    const { surveillanceContext: section1SurveillanceCtx, cdrContext: section1CdrCtx } =
      await this.enrichmentPipeline.enrichForSection1(content, location)

    const systemPrompt = await getPromptGuide('mdm-gen-guide-build-s1.md')
      ?? await getPromptGuide('mdm-gen-guide-v2.md')
    if (!systemPrompt) {
      log.error({ action: 'missing-prompt-guide' }, 'CRITICAL: No MDM guide found for Section 1 prompt')
      throw new LlmError('Internal configuration error')
    }

    // Build compact test catalog for prompt injection
    const testCatalogStr = await this.enrichmentPipeline.resolveTestCatalog(content, log)

    const photoCatalog = this.enrichmentPipeline.buildPhotoCatalog()
    const prompt = buildSection1Prompt(content, systemPrompt, section1SurveillanceCtx, section1CdrCtx, testCatalogStr, photoCatalog)

    let differential: DifferentialItem[]
    let cdrAnalysis: CdrAnalysisItem[]
    let workupRecommendations: WorkupRecommendation[]
    let societyGuidelines: SocietyGuideline[]
    let encounterPhoto: { category: string; subcategory: string } | undefined

    try {
      const result = await this.llmClient.generate(prompt, { timeoutMs: config.llm.heavyTimeoutMs })
      const parsed = this.responseParser.parseSection1(result.text)

      differential = parsed.data.differential
      cdrAnalysis = parsed.data.cdrAnalysis
      workupRecommendations = parsed.data.workupRecommendations
      societyGuidelines = parsed.data.societyGuidelines
      encounterPhoto = parsed.data.encounterPhoto

      if ('reason' in parsed) {
        log.warn({ action: 'section1-parse-fallback', reason: parsed.reason })
      }
    } catch (modelError) {
      log.error({ action: 'section1-model-error', error: String(modelError) })
      throw new LlmError('Failed to process section 1')
    }

    // Update Firestore
    const newSubmissionCount = currentSubmissionCount + 1
    const isLocked = newSubmissionCount >= 2

    await this.encounterRepo.updateSection1(uid, encounterId, {
      'section1.content': content,
      'section1.llmResponse': {
        differential,
        ...(cdrAnalysis.length > 0 && { cdrAnalysis }),
        ...(workupRecommendations.length > 0 && { workupRecommendations }),
        ...(societyGuidelines.length > 0 && { societyGuidelines }),
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

    log.info({
      action: 'process-section1',
      uid,
      encounterId,
      submissionCount: newSubmissionCount,
      cdrAnalysisCount: cdrAnalysis.length,
      workupRecsCount: workupRecommendations.length,
    })

    return {
      ok: true,
      differential,
      ...(cdrAnalysis.length > 0 && { cdrAnalysis }),
      ...(workupRecommendations.length > 0 && { workupRecommendations }),
      ...(societyGuidelines.length > 0 && { societyGuidelines }),
      submissionCount: newSubmissionCount,
      isLocked,
      quotaRemaining,
    }
  }

  // --------------------------------------------------------------------------
  // Build Mode: Section 2 (data persistence only, no LLM)
  // --------------------------------------------------------------------------

  async processSection2(
    uid: string,
    encounterId: string,
    body: {
      content?: string
      workingDiagnosis?: string
      selectedTests?: string[]
      testResults?: Record<string, TestResult>
      structuredDiagnosis?: any
    },
    reqLog?: PinoLogger,
  ) {
    const log = reqLog || logger

    const encounter = await this.encounterRepo.get(uid, encounterId)
    if (!encounter) {
      throw new NotFoundError('Encounter not found')
    }

    if (encounter.section1?.status !== 'completed') {
      throw new ValidationError('Section 1 must be completed before processing Section 2')
    }

    const currentSubmissionCount = encounter.section2?.submissionCount || 0
    if (currentSubmissionCount >= 2) {
      throw new SectionLockedError(2)
    }

    const newSubmissionCount = currentSubmissionCount + 1
    const isLocked = newSubmissionCount >= 2

    const { content, workingDiagnosis, selectedTests, testResults, structuredDiagnosis } = body

    await this.encounterRepo.updateSection2(uid, encounterId, {
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

    log.info({
      action: 'process-section2',
      uid,
      encounterId,
      submissionCount: newSubmissionCount,
      dataOnly: true,
    })

    return {
      ok: true,
      submissionCount: newSubmissionCount,
      isLocked,
    }
  }

  // --------------------------------------------------------------------------
  // Build Mode: Finalize (Section 3)
  // --------------------------------------------------------------------------

  async finalize(
    uid: string,
    encounterId: string,
    content: string,
    workingDiagnosis?: string,
    reqLog?: PinoLogger,
  ) {
    const log = reqLog || logger

    const encounter = await this.encounterRepo.get(uid, encounterId)
    if (!encounter) {
      throw new NotFoundError('Encounter not found')
    }

    if (encounter.section2?.status !== 'completed') {
      throw new ValidationError('Section 2 must be completed before finalizing')
    }

    const currentSubmissionCount = encounter.section3?.submissionCount || 0
    if (currentSubmissionCount >= 2) {
      throw new SectionLockedError(3)
    }

    const stats = await this.userService.getUsageStats(uid)
    const tokenCheck = checkTokenSize(content, stats.features.maxTokensPerRequest)
    if (tokenCheck.exceeded) {
      throw new ValidationError(tokenCheck.payload.error)
    }

    // Build prompt with all sections
    const s1Diff = getDifferential(encounter.section1?.llmResponse)
    const section1Data = {
      content: encounter.section1?.content || '',
      response: { differential: s1Diff },
    }
    const rawS2 = encounter.section2?.llmResponse
    const hasMdmPreview = rawS2?.mdmPreview && typeof rawS2.mdmPreview === 'object'
    const rawWd = encounter.section2?.workingDiagnosis
    const resolvedWd = !rawWd ? undefined : typeof rawWd === 'string' ? rawWd : rawWd.custom || rawWd.selected || undefined
    const section2Data: {
      content: string
      response?: { mdmPreview: MdmPreview }
      workingDiagnosis?: string
    } = {
      content: encounter.section2?.content || '',
      ...(hasMdmPreview && { response: { mdmPreview: rawS2.mdmPreview } }),
      workingDiagnosis: resolvedWd,
    }

    const storedSurveillanceCtx: string | undefined = encounter.surveillanceContext || undefined
    const storedCdrCtx: string | undefined = buildCdrContextString(encounter.cdrTracking ?? {})

    const structuredData: FinalizeStructuredData = {
      selectedTests: encounter.section2?.selectedTests as string[] | undefined,
      testResults: encounter.section2?.testResults as Record<string, TestResult> | undefined,
      workingDiagnosis: workingDiagnosis ?? encounter.section2?.workingDiagnosis,
      treatments: encounter.section3?.treatments,
      cdrSuggestedTreatments: encounter.section3?.cdrSuggestedTreatments,
      disposition: encounter.section3?.disposition,
      followUp: encounter.section3?.followUp,
    }

    const s3GuideText = await getPromptGuide('mdm-gen-guide-build-s3.md')
    const photoCatalog = this.enrichmentPipeline.buildPhotoCatalog()
    const prompt = buildFinalizePrompt(section1Data, section2Data, content, storedSurveillanceCtx, storedCdrCtx, structuredData, s3GuideText, photoCatalog)

    let generationFailed: boolean
    let finalMdm: FinalMdm
    let gaps: GapItem[]
    let encounterPhoto: { category: string; subcategory: string } | undefined

    try {
      const result = await this.llmClient.generate(prompt, { jsonMode: true, timeoutMs: config.llm.heavyTimeoutMs })
      const parsed = this.responseParser.parseFinalize(result.text)

      finalMdm = parsed.data.finalMdm
      gaps = parsed.data.gaps
      encounterPhoto = parsed.data.encounterPhoto
      generationFailed = parsed.data.generationFailed

      if ('reason' in parsed) {
        log.warn({ action: 'finalize-parse-fallback', reason: parsed.reason })
      }
    } catch (modelError) {
      log.error({ action: 'finalize-model-error', error: String(modelError) })
      throw new LlmError('Failed to finalize encounter')
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

    await this.encounterRepo.finalize(uid, encounterId, {
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

    await this.userService.incrementGapTallies(uid, gaps)

    log.info({
      action: 'finalize',
      uid,
      encounterId,
      submissionCount: newSubmissionCount,
      gapCount: gaps.length,
    })

    return {
      ok: true,
      generationFailed,
      finalMdm,
      gaps,
      quotaRemaining: stats.remaining,
    }
  }

  // --------------------------------------------------------------------------
  // CDR matching
  // --------------------------------------------------------------------------

  async matchCdrs(
    uid: string,
    encounterId: string,
    reqLog?: PinoLogger,
  ) {
    const log = reqLog || logger

    const encounter = await this.encounterRepo.get(uid, encounterId)
    if (!encounter) {
      throw new NotFoundError('Encounter not found')
    }

    if (!POST_S1_STATUSES.includes(encounter.status as typeof POST_S1_STATUSES[number]) || !encounter.section1?.llmResponse) {
      throw new ValidationError('Section 1 must be completed before CDR matching')
    }

    const differential = getDifferential(encounter.section1.llmResponse)

    if (differential.length === 0) {
      return { ok: true, cdrTracking: {}, matchedCount: 0 }
    }

    const cdrs = await this.libraryCaches.getCdrs()
    const matchedCdrs = matchCdrsFromDifferential(differential, cdrs)

    if (matchedCdrs.length === 0) {
      await this.encounterRepo.updateCdrTracking(uid, encounterId, {} as CdrTracking)

      log.info({ action: 'match-cdrs', uid, encounterId, matchedCount: 0 })

      return { ok: true, cdrTracking: {}, matchedCount: 0 }
    }

    // Auto-populate components from S1 narrative (supplementary — failures don't block)
    let autoPopulated: ReturnType<typeof this.responseParser.parseCdrAutoPopulate> = null
    const s1Content = encounter.section1.content || ''

    if (s1Content) {
      try {
        const prompt = buildCdrAutoPopulatePrompt(s1Content, matchedCdrs)

        if (prompt.system) {
          const result = await this.llmClient.generate(prompt)
          autoPopulated = this.responseParser.parseCdrAutoPopulate(result.text)
        }
      } catch (autoPopError) {
        log.warn({ action: 'cdr-auto-populate-failed', error: String(autoPopError) }, 'CDR auto-populate LLM call failed (non-blocking)')
      }
    }

    const cdrTracking: CdrTracking = buildCdrTracking(matchedCdrs, autoPopulated)

    await this.encounterRepo.updateCdrTracking(uid, encounterId, cdrTracking)

    log.info({
      action: 'match-cdrs',
      uid,
      encounterId,
      matchedCount: matchedCdrs.length,
      autoPopulated: autoPopulated !== null,
    })

    return { ok: true, cdrTracking, matchedCount: matchedCdrs.length }
  }

  // --------------------------------------------------------------------------
  // Diagnosis suggestions
  // --------------------------------------------------------------------------

  async suggestDiagnosis(
    uid: string,
    encounterId: string,
    reqLog?: PinoLogger,
  ) {
    const log = reqLog || logger

    const encounter = await this.encounterRepo.get(uid, encounterId)
    if (!encounter) {
      throw new NotFoundError('Encounter not found')
    }

    if (!POST_S1_STATUSES.includes(encounter.status as typeof POST_S1_STATUSES[number]) || !encounter.section1?.llmResponse) {
      throw new ValidationError('Section 1 must be completed before suggesting diagnoses')
    }

    const differential = getDifferential(encounter.section1.llmResponse)

    if (differential.length === 0) {
      throw new ValidationError('No differential available from Section 1')
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
      const result = await this.llmClient.generate(prompt)
      const parsed = this.responseParser.parseSuggestDiagnosis(result.text, differential)
      suggestions = parsed.data
    } catch (modelError) {
      log.error({ action: 'suggest-diagnosis-model-error', error: String(modelError) })
      suggestions = differential.slice(0, 3).map((d) => d.diagnosis)
    }

    log.info({
      action: 'suggest-diagnosis',
      uid,
      encounterId,
      suggestionCount: suggestions.length,
    })

    return { ok: true, suggestions }
  }

  // --------------------------------------------------------------------------
  // Parse lab results
  // --------------------------------------------------------------------------

  async parseResults(
    uid: string,
    encounterId: string,
    pastedText: string,
    orderedTestIds: string[],
    reqLog?: PinoLogger,
  ) {
    const log = reqLog || logger

    const encounter = await this.encounterRepo.get(uid, encounterId)
    if (!encounter) {
      throw new NotFoundError('Encounter not found')
    }

    // Load test definitions for ordered tests
    const allTests = await this.libraryCaches.getTests()
    const orderedTests = orderedTestIds
      .map((id: string) => allTests.find((t) => t.id === id))
      .filter((t: TestDefinition | undefined): t is TestDefinition => t !== undefined)

    if (orderedTests.length === 0) {
      throw new ValidationError('No valid ordered tests found')
    }

    const prompt = buildParseResultsPrompt(
      pastedText,
      orderedTests.map((t: TestDefinition) => ({ id: t.id, name: t.name, unit: t.unit, normalRange: t.normalRange })),
    )

    let result
    try {
      result = await this.llmClient.generate(prompt)
    } catch (modelError) {
      log.error({ action: 'parse-results-model-error', uid, encounterId, error: String(modelError) })
      throw new LlmError('Failed to parse results')
    }

    const validTestIds = new Set(orderedTestIds as string[])
    const parsed = this.responseParser.parseResults(result.text, validTestIds)

    log.info({
      action: 'parse-results',
      uid,
      encounterId,
      parsedCount: parsed.data.parsed.length,
      unmatchedCount: parsed.data.unmatchedText.length,
    })

    return {
      ok: true,
      parsed: parsed.data.parsed,
      ...(parsed.data.unmatchedText.length > 0 ? { unmatchedText: parsed.data.unmatchedText } : {}),
    }
  }
}
