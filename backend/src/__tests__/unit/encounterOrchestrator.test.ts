/**
 * Unit tests for EncounterOrchestrator.
 *
 * Tests business logic for encounter endpoints: section progression,
 * submission locking, quota gating, LLM error handling, and happy paths.
 *
 * IMPORTANT: All medical content is fictional / educational only. No PHI.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { EncounterOrchestrator } from '../../modules/encounter/encounterOrchestrator.js'
import { EnrichmentPipeline } from '../../modules/encounter/enrichmentPipeline.js'
import { LlmResponseParser } from '../../llm/responseParser.js'
import { SectionLockedError, QuotaExceededError, NotFoundError, ValidationError, LlmError } from '../../errors.js'
import {
  createMockEncounterRepo,
  createMockUserService,
  createMockLlmClient,
  createMockLibraryCaches,
} from '../helpers/mockDependencies.js'

// ============================================================================
// Module mocks
// ============================================================================

vi.mock('../../shared/surveillanceEnrichment.js', () => ({
  runSurveillanceEnrichment: vi.fn().mockResolvedValue(undefined),
  runCdrEnrichment: vi.fn().mockResolvedValue(undefined),
  injectSurveillanceIntoMdm: vi.fn().mockImplementation((dr, text) => ({ dataReviewed: dr, text })),
}))
vi.mock('../../services/testCatalogSearch.js', () => ({
  getRelevantTests: vi.fn().mockResolvedValue([]),
}))
vi.mock('../../services/testCatalogFormatter.js', () => ({
  buildCompactCatalog: vi.fn().mockReturnValue(''),
}))
vi.mock('../../photoCatalog.js', () => ({
  buildPhotoCatalogPrompt: vi.fn().mockReturnValue(''),
  validatePhoto: vi.fn().mockReturnValue({ category: 'general', subcategory: 'unspecified' }),
}))
vi.mock('../../promptBuilder.js', () => ({
  buildPrompt: vi.fn().mockResolvedValue({ system: 'test', user: 'test' }),
}))
vi.mock('../../promptBuilderBuildMode.js', () => ({
  buildSection1Prompt: vi.fn().mockReturnValue({ system: 'test', user: 'test' }),
  buildFinalizePrompt: vi.fn().mockReturnValue({ system: 'test', user: 'test' }),
  buildCdrAutoPopulatePrompt: vi.fn().mockReturnValue({ system: 'test', user: 'test' }),
  buildSuggestDiagnosisPrompt: vi.fn().mockReturnValue({ system: 'test', user: 'test' }),
  buildParseResultsPrompt: vi.fn().mockReturnValue({ system: 'test', user: 'test' }),
}))
vi.mock('../../shared/paths.js', () => ({
  promptPath: vi.fn().mockReturnValue('/fake/path'),
}))
vi.mock('../../outputSchema.js', () => ({
  MdmSchema: { parse: vi.fn().mockImplementation((x: any) => x) },
  renderMdmText: vi.fn().mockReturnValue('mock mdm text'),
}))
vi.mock('../../services/cdrMatcher.js', () => ({
  matchCdrsFromDifferential: vi.fn().mockReturnValue([]),
}))
vi.mock('../../services/cdrTrackingBuilder.js', () => ({
  buildCdrTracking: vi.fn().mockReturnValue({}),
}))
vi.mock('../../shared/quotaHelpers.js', () => ({
  checkTokenSize: vi.fn().mockReturnValue({ exceeded: false }),
}))
vi.mock('node:fs/promises', () => ({
  default: { readFile: vi.fn().mockResolvedValue('mock prompt guide') },
}))
vi.mock('firebase-admin', () => ({
  default: {
    firestore: {
      Timestamp: { now: () => ({ seconds: 1234567890, nanoseconds: 0 }) },
    },
  },
}))

// ============================================================================
// Helpers
// ============================================================================

function createOrchestrator(overrides: Record<string, any> = {}) {
  const encounterRepo = createMockEncounterRepo()
  const userService = createMockUserService()
  const llmClient = createMockLlmClient()
  const libraryCaches = createMockLibraryCaches()
  const enrichmentPipeline = new EnrichmentPipeline(libraryCaches as any)

  const deps = {
    encounterRepo: encounterRepo as any,
    userService: userService as any,
    llmClient: llmClient as any,
    responseParser: new LlmResponseParser(),
    enrichmentPipeline,
    libraryCaches: libraryCaches as any,
    ...overrides,
  }

  return { orchestrator: new EncounterOrchestrator(deps), encounterRepo, userService, llmClient, libraryCaches }
}

/** Builds a minimal encounter doc that passes S1 preconditions. */
function makeEncounter(overrides: Record<string, any> = {}) {
  return {
    quotaCounted: true,
    status: 'created',
    section1: { submissionCount: 0, status: 'pending' },
    section2: { submissionCount: 0, status: 'pending' },
    section3: { submissionCount: 0, status: 'pending' },
    ...overrides,
  }
}

/** Default usage stats returned by userService.getUsageStats. */
function makeUsageStats(overrides: Record<string, any> = {}) {
  return {
    plan: 'pro',
    remaining: 240,
    features: { maxTokensPerRequest: 10000 },
    ...overrides,
  }
}

/** An S1 LLM response JSON that the real responseParser.parseSection1 can handle. */
const VALID_S1_LLM_JSON = JSON.stringify({
  differential: [
    { diagnosis: 'Acute Coronary Syndrome', urgency: 'emergent', reasoning: 'Chest pain with risk factors' },
    { diagnosis: 'Musculoskeletal Strain', urgency: 'routine', reasoning: 'Reproducible tenderness' },
  ],
  cdrAnalysis: [],
  workupRecommendations: [],
})

// ============================================================================
// Tests
// ============================================================================

describe('EncounterOrchestrator', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  // --------------------------------------------------------------------------
  // processSection1
  // --------------------------------------------------------------------------

  describe('processSection1', () => {
    it('throws NotFoundError when encounter does not exist', async () => {
      const { orchestrator, encounterRepo } = createOrchestrator()
      encounterRepo.get.mockResolvedValue(null)

      await expect(
        orchestrator.processSection1('uid1', 'test@test.com', 'enc1', 'Chest pain narrative'),
      ).rejects.toThrow(NotFoundError)
    })

    it('throws SectionLockedError when submissionCount >= 2', async () => {
      const { orchestrator, encounterRepo } = createOrchestrator()
      encounterRepo.get.mockResolvedValue(
        makeEncounter({ section1: { submissionCount: 2, status: 'completed' } }),
      )

      await expect(
        orchestrator.processSection1('uid1', 'test@test.com', 'enc1', 'Chest pain narrative'),
      ).rejects.toThrow(SectionLockedError)
    })

    it('throws QuotaExceededError when quota is exceeded for first encounter', async () => {
      const { orchestrator, encounterRepo, userService } = createOrchestrator()
      encounterRepo.get.mockResolvedValue(makeEncounter({ quotaCounted: false }))
      userService.ensureUser.mockResolvedValue(undefined)
      userService.checkAndIncrementQuota.mockResolvedValue({ allowed: false, limit: 10, used: 10 })

      await expect(
        orchestrator.processSection1('uid1', 'test@test.com', 'enc1', 'Chest pain narrative'),
      ).rejects.toThrow(QuotaExceededError)
    })

    it('skips quota check when encounter is already quota-counted', async () => {
      const { orchestrator, encounterRepo, userService, llmClient } = createOrchestrator()
      encounterRepo.get.mockResolvedValue(makeEncounter({ quotaCounted: true }))
      userService.getUsageStats.mockResolvedValue(makeUsageStats())
      llmClient.generate.mockResolvedValue({ text: VALID_S1_LLM_JSON })

      await orchestrator.processSection1('uid1', 'test@test.com', 'enc1', 'Chest pain narrative')

      expect(userService.checkAndIncrementQuota).not.toHaveBeenCalled()
      expect(encounterRepo.markQuotaCounted).not.toHaveBeenCalled()
    })

    it('returns differential on successful processing', async () => {
      const { orchestrator, encounterRepo, userService, llmClient } = createOrchestrator()
      encounterRepo.get.mockResolvedValue(makeEncounter({ quotaCounted: true }))
      userService.getUsageStats.mockResolvedValue(makeUsageStats())
      llmClient.generate.mockResolvedValue({ text: VALID_S1_LLM_JSON })

      const result = await orchestrator.processSection1('uid1', 'test@test.com', 'enc1', 'Chest pain narrative')

      expect(result.ok).toBe(true)
      expect(result.differential).toHaveLength(2)
      expect(result.differential[0].diagnosis).toBe('Acute Coronary Syndrome')
      expect(result.submissionCount).toBe(1)
      expect(result.isLocked).toBe(false)
    })

    it('increments submission count and locks at 2', async () => {
      const { orchestrator, encounterRepo, userService, llmClient } = createOrchestrator()
      encounterRepo.get.mockResolvedValue(
        makeEncounter({ quotaCounted: true, section1: { submissionCount: 1, status: 'completed' } }),
      )
      userService.getUsageStats.mockResolvedValue(makeUsageStats())
      llmClient.generate.mockResolvedValue({ text: VALID_S1_LLM_JSON })

      const result = await orchestrator.processSection1('uid1', 'test@test.com', 'enc1', 'Updated narrative')

      expect(result.submissionCount).toBe(2)
      expect(result.isLocked).toBe(true)
    })

    it('throws LlmError when LLM call fails', async () => {
      const { orchestrator, encounterRepo, userService, llmClient } = createOrchestrator()
      encounterRepo.get.mockResolvedValue(makeEncounter({ quotaCounted: true }))
      userService.getUsageStats.mockResolvedValue(makeUsageStats())
      llmClient.generate.mockRejectedValue(new Error('LLM timeout'))

      await expect(
        orchestrator.processSection1('uid1', 'test@test.com', 'enc1', 'Chest pain narrative'),
      ).rejects.toThrow(LlmError)
    })

    it('marks quota counted on first submission', async () => {
      const { orchestrator, encounterRepo, userService, llmClient } = createOrchestrator()
      encounterRepo.get.mockResolvedValue(makeEncounter({ quotaCounted: false }))
      userService.ensureUser.mockResolvedValue(undefined)
      userService.checkAndIncrementQuota.mockResolvedValue({ allowed: true, remaining: 9, limit: 10, used: 1 })
      userService.getUsageStats.mockResolvedValue(makeUsageStats())
      llmClient.generate.mockResolvedValue({ text: VALID_S1_LLM_JSON })

      await orchestrator.processSection1('uid1', 'test@test.com', 'enc1', 'Chest pain narrative')

      expect(encounterRepo.markQuotaCounted).toHaveBeenCalledWith('uid1', 'enc1')
    })
  })

  // --------------------------------------------------------------------------
  // processSection2
  // --------------------------------------------------------------------------

  describe('processSection2', () => {
    it('throws NotFoundError when encounter does not exist', async () => {
      const { orchestrator, encounterRepo } = createOrchestrator()
      encounterRepo.get.mockResolvedValue(null)

      await expect(
        orchestrator.processSection2('uid1', 'enc1', { content: 'Labs ordered' }),
      ).rejects.toThrow(NotFoundError)
    })

    it('requires section1 to be completed first', async () => {
      const { orchestrator, encounterRepo } = createOrchestrator()
      encounterRepo.get.mockResolvedValue(
        makeEncounter({ section1: { submissionCount: 0, status: 'pending' } }),
      )

      await expect(
        orchestrator.processSection2('uid1', 'enc1', { content: 'Labs ordered' }),
      ).rejects.toThrow(ValidationError)
    })

    it('throws SectionLockedError when submissionCount >= 2', async () => {
      const { orchestrator, encounterRepo } = createOrchestrator()
      encounterRepo.get.mockResolvedValue(
        makeEncounter({
          section1: { submissionCount: 1, status: 'completed' },
          section2: { submissionCount: 2, status: 'completed' },
        }),
      )

      await expect(
        orchestrator.processSection2('uid1', 'enc1', { content: 'Labs ordered' }),
      ).rejects.toThrow(SectionLockedError)
    })

    it('returns ok with incremented submission count on success', async () => {
      const { orchestrator, encounterRepo } = createOrchestrator()
      encounterRepo.get.mockResolvedValue(
        makeEncounter({
          section1: { submissionCount: 1, status: 'completed' },
          section2: { submissionCount: 0, status: 'pending' },
        }),
      )

      const result = await orchestrator.processSection2('uid1', 'enc1', { content: 'Troponin negative' })

      expect(result.ok).toBe(true)
      expect(result.submissionCount).toBe(1)
      expect(result.isLocked).toBe(false)
    })

    it('persists structured data when provided', async () => {
      const { orchestrator, encounterRepo } = createOrchestrator()
      encounterRepo.get.mockResolvedValue(
        makeEncounter({
          section1: { submissionCount: 1, status: 'completed' },
          section2: { submissionCount: 0, status: 'pending' },
        }),
      )

      await orchestrator.processSection2('uid1', 'enc1', {
        content: 'Results reviewed',
        workingDiagnosis: 'Musculoskeletal',
        selectedTests: ['troponin', 'cbc'],
        testResults: { troponin: { status: 'unremarkable' } },
      })

      expect(encounterRepo.updateSection2).toHaveBeenCalledWith(
        'uid1',
        'enc1',
        expect.objectContaining({
          'section2.selectedTests': ['troponin', 'cbc'],
        }),
      )
    })
  })

  // --------------------------------------------------------------------------
  // finalize
  // --------------------------------------------------------------------------

  describe('finalize', () => {
    it('throws NotFoundError when encounter does not exist', async () => {
      const { orchestrator, encounterRepo } = createOrchestrator()
      encounterRepo.get.mockResolvedValue(null)

      await expect(
        orchestrator.finalize('uid1', 'enc1', 'Discharge home'),
      ).rejects.toThrow(NotFoundError)
    })

    it('requires section2 to be completed first', async () => {
      const { orchestrator, encounterRepo } = createOrchestrator()
      encounterRepo.get.mockResolvedValue(
        makeEncounter({
          section1: { submissionCount: 1, status: 'completed' },
          section2: { submissionCount: 0, status: 'pending' },
        }),
      )

      await expect(
        orchestrator.finalize('uid1', 'enc1', 'Discharge home'),
      ).rejects.toThrow(ValidationError)
    })

    it('throws SectionLockedError when submissionCount >= 2', async () => {
      const { orchestrator, encounterRepo } = createOrchestrator()
      encounterRepo.get.mockResolvedValue(
        makeEncounter({
          section1: { submissionCount: 1, status: 'completed' },
          section2: { submissionCount: 1, status: 'completed' },
          section3: { submissionCount: 2, status: 'completed' },
        }),
      )

      await expect(
        orchestrator.finalize('uid1', 'enc1', 'Discharge home'),
      ).rejects.toThrow(SectionLockedError)
    })

    it('returns finalMdm on successful finalization', async () => {
      const { orchestrator, encounterRepo, userService, llmClient } = createOrchestrator()

      // Shape that extractFinalMdm + FinalMdmSchema expect:
      // text at top level, json object with required fields
      const finalMdmResponse = {
        text: 'Final MDM text',
        json: {
          problems: ['Chest pain'],
          differential: ['ACS'],
          dataReviewed: ['Troponin x2 negative'],
          reasoning: 'Low risk',
          risk: ['Return precautions'],
          disposition: 'Discharge',
          complexityLevel: 'moderate',
        },
        gaps: [],
      }

      encounterRepo.get.mockResolvedValue(
        makeEncounter({
          status: 'section2_done',
          section1: { submissionCount: 1, status: 'completed', content: 'Chest pain', llmResponse: { differential: [] } },
          section2: { submissionCount: 1, status: 'completed', content: 'Labs reviewed' },
          section3: { submissionCount: 0, status: 'pending' },
        }),
      )
      userService.getUsageStats.mockResolvedValue(makeUsageStats())
      llmClient.generate.mockResolvedValue({ text: JSON.stringify(finalMdmResponse) })

      const result = await orchestrator.finalize('uid1', 'enc1', 'Discharge home')

      expect(result.ok).toBe(true)
      expect(result.finalMdm).toBeDefined()
      expect(result.finalMdm.text).toBe('Final MDM text')
      expect(result.generationFailed).toBe(false)
    })

    it('throws LlmError when LLM call fails', async () => {
      const { orchestrator, encounterRepo, userService, llmClient } = createOrchestrator()
      encounterRepo.get.mockResolvedValue(
        makeEncounter({
          status: 'section2_done',
          section1: { submissionCount: 1, status: 'completed', content: 'Chest pain', llmResponse: { differential: [] } },
          section2: { submissionCount: 1, status: 'completed', content: 'Labs reviewed' },
          section3: { submissionCount: 0, status: 'pending' },
        }),
      )
      userService.getUsageStats.mockResolvedValue(makeUsageStats())
      llmClient.generate.mockRejectedValue(new Error('LLM timeout'))

      await expect(
        orchestrator.finalize('uid1', 'enc1', 'Discharge home'),
      ).rejects.toThrow(LlmError)
    })
  })

  // --------------------------------------------------------------------------
  // generate (legacy one-shot)
  // --------------------------------------------------------------------------

  describe('generate', () => {
    it('returns conservative fallback on LLM failure', async () => {
      const { orchestrator, userService, llmClient } = createOrchestrator()
      userService.ensureUser.mockResolvedValue(undefined)
      userService.checkAndIncrementQuota.mockResolvedValue({ allowed: true, remaining: 9, limit: 10, used: 1 })
      userService.getUsageStats.mockResolvedValue(makeUsageStats())
      llmClient.generate.mockRejectedValue(new Error('Model unreachable'))

      const result = await orchestrator.generate('uid1', 'test@test.com', 'Chest pain narrative')

      expect(result.ok).toBe(true)
      expect(result.draftJson).toBeDefined()
      expect(result.draftJson.differential).toEqual([])
      expect(result.draftJson.attestation).toContain('reviewed by the physician')
    })

    it('throws QuotaExceededError when quota is exceeded', async () => {
      const { orchestrator, userService } = createOrchestrator()
      userService.ensureUser.mockResolvedValue(undefined)
      userService.checkAndIncrementQuota.mockResolvedValue({ allowed: false, limit: 10, used: 10 })

      await expect(
        orchestrator.generate('uid1', 'test@test.com', 'Chest pain narrative'),
      ).rejects.toThrow(QuotaExceededError)
    })

    it('returns parsed MDM on successful LLM response', async () => {
      const { orchestrator, userService, llmClient } = createOrchestrator()
      userService.ensureUser.mockResolvedValue(undefined)
      userService.checkAndIncrementQuota.mockResolvedValue({ allowed: true, remaining: 9, limit: 10, used: 1 })
      userService.getUsageStats.mockResolvedValue(makeUsageStats())

      const mdmJson = {
        differential: [{ diagnosis: 'ACS', urgency: 'emergent' }],
        data_reviewed_ordered: 'Troponin pending',
        decision_making: 'Risk stratification',
        risk: ['Return precautions'],
        disposition: 'Discharge',
        attestation: 'Reviewed',
      }
      llmClient.generate.mockResolvedValue({ text: JSON.stringify(mdmJson) })

      const result = await orchestrator.generate('uid1', 'test@test.com', 'Chest pain narrative')

      expect(result.ok).toBe(true)
      // cleanLlmJsonResponse strips post-JSON text, so renderMdmText is used
      expect(result.draft).toBe('mock mdm text')
      expect(result.draftJson).toBeDefined()
      expect(result.remaining).toBe(9)
      expect(result.uid).toBe('uid1')
    })
  })

  // --------------------------------------------------------------------------
  // parseResults
  // --------------------------------------------------------------------------

  describe('parseResults', () => {
    it('throws LlmError when LLM call fails', async () => {
      const { orchestrator, encounterRepo, llmClient, libraryCaches } = createOrchestrator()
      encounterRepo.get.mockResolvedValue(makeEncounter({ quotaCounted: true }))
      libraryCaches.getTests.mockResolvedValue([
        { id: 'troponin', name: 'Troponin', unit: 'ng/mL', normalRange: '<0.04' },
      ])
      llmClient.generate.mockRejectedValue(new Error('LLM timeout'))

      await expect(
        orchestrator.parseResults('uid1', 'enc1', 'Troponin: 0.02 ng/mL', ['troponin']),
      ).rejects.toThrow(LlmError)
    })
  })
})
