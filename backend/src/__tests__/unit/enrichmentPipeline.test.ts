/**
 * Unit tests for EnrichmentPipeline.
 *
 * Tests surveillance + CDR enrichment, test catalog resolution,
 * and photo catalog building.
 *
 * IMPORTANT: All medical content is fictional / educational only. No PHI.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { EnrichmentPipeline } from '../../modules/encounter/enrichmentPipeline.js'

// ============================================================================
// Module mocks
// ============================================================================

vi.mock('../../shared/surveillanceEnrichment.js', () => ({
  runSurveillanceEnrichment: vi.fn(),
  runCdrEnrichment: vi.fn(),
}))
vi.mock('../../services/testCatalogSearch.js', () => ({
  getRelevantTests: vi.fn(),
}))
vi.mock('../../services/testCatalogFormatter.js', () => ({
  buildCompactCatalog: vi.fn().mockReturnValue('formatted catalog'),
}))
vi.mock('../../photoCatalog.js', () => ({
  buildPhotoCatalogPrompt: vi.fn().mockReturnValue('photo catalog prompt'),
}))

// Import after mocking so references point to the mocked versions
const { runSurveillanceEnrichment, runCdrEnrichment } = await import('../../shared/surveillanceEnrichment.js')
const { getRelevantTests } = await import('../../services/testCatalogSearch.js')
const { buildCompactCatalog } = await import('../../services/testCatalogFormatter.js')
const { buildPhotoCatalogPrompt } = await import('../../photoCatalog.js')

// ============================================================================
// Tests
// ============================================================================

describe('EnrichmentPipeline', () => {
  let pipeline: EnrichmentPipeline

  beforeEach(() => {
    vi.clearAllMocks()
    pipeline = new EnrichmentPipeline({ getCdrs: vi.fn().mockResolvedValue([]), getTests: vi.fn().mockResolvedValue([]) })
  })

  // --------------------------------------------------------------------------
  // enrichForSection1
  // --------------------------------------------------------------------------

  describe('enrichForSection1', () => {
    it('runs surveillance + CDR enrichment in parallel when location provided', async () => {
      vi.mocked(runSurveillanceEnrichment).mockResolvedValue('surv context' as any)
      vi.mocked(runCdrEnrichment).mockResolvedValue('cdr context' as any)

      const result = await pipeline.enrichForSection1('narrative text', { zipCode: '10001' })

      expect(runSurveillanceEnrichment).toHaveBeenCalledWith('narrative text', { zipCode: '10001' })
      expect(runCdrEnrichment).toHaveBeenCalledWith('narrative text')
      expect(result.surveillanceContext).toBe('surv context')
      expect(result.cdrContext).toBe('cdr context')
    })

    it('skips surveillance when no location provided', async () => {
      vi.mocked(runCdrEnrichment).mockResolvedValue('cdr context' as any)

      const result = await pipeline.enrichForSection1('narrative text')

      expect(runSurveillanceEnrichment).not.toHaveBeenCalled()
      expect(result.surveillanceContext).toBeUndefined()
      expect(result.cdrContext).toBe('cdr context')
    })

    it('returns undefined surveillance when location is empty object', async () => {
      vi.mocked(runCdrEnrichment).mockResolvedValue('cdr context' as any)

      // location is truthy but has no zipCode or state — should still pass to runSurveillanceEnrichment
      const result = await pipeline.enrichForSection1('narrative text', {})

      // With an empty object, location is truthy so surveillance WILL be called
      expect(runSurveillanceEnrichment).toHaveBeenCalled()
      expect(result.cdrContext).toBe('cdr context')
    })

    it('stringifies non-string content', async () => {
      vi.mocked(runCdrEnrichment).mockResolvedValue('cdr context' as any)

      await pipeline.enrichForSection1({ field: 'value' } as any)

      expect(runCdrEnrichment).toHaveBeenCalledWith(JSON.stringify({ field: 'value' }))
    })

    it('returns both undefined when both enrichments return undefined', async () => {
      vi.mocked(runSurveillanceEnrichment).mockResolvedValue(undefined as any)
      vi.mocked(runCdrEnrichment).mockResolvedValue(undefined as any)

      const result = await pipeline.enrichForSection1('narrative text', { zipCode: '10001' })

      expect(result.surveillanceContext).toBeUndefined()
      expect(result.cdrContext).toBeUndefined()
    })
  })

  // --------------------------------------------------------------------------
  // resolveTestCatalog
  // --------------------------------------------------------------------------

  describe('resolveTestCatalog', () => {
    it('returns test catalog from vector search', async () => {
      const mockTests = [{ id: 'troponin', name: 'Troponin' }]
      vi.mocked(getRelevantTests).mockResolvedValue(mockTests as any)

      const result = await pipeline.resolveTestCatalog('chest pain')

      expect(getRelevantTests).toHaveBeenCalledWith('chest pain', 50)
      expect(buildCompactCatalog).toHaveBeenCalledWith(mockTests)
      expect(result).toBe('formatted catalog')
    })

    it('falls back to full catalog on vector search failure', async () => {
      vi.mocked(getRelevantTests).mockRejectedValue(new Error('vector search down'))
      const mockLibraryCaches = { getCdrs: vi.fn(), getTests: vi.fn().mockResolvedValue([{ id: 'cbc' }]) }
      pipeline = new EnrichmentPipeline(mockLibraryCaches as any)

      const result = await pipeline.resolveTestCatalog('chest pain')

      expect(mockLibraryCaches.getTests).toHaveBeenCalled()
      expect(buildCompactCatalog).toHaveBeenCalledWith([{ id: 'cbc' }])
      expect(result).toBe('formatted catalog')
    })

    it('returns undefined when both vector search and full catalog fail', async () => {
      vi.mocked(getRelevantTests).mockRejectedValue(new Error('vector search down'))
      const mockLibraryCaches = { getCdrs: vi.fn(), getTests: vi.fn().mockRejectedValue(new Error('cache failed')) }
      pipeline = new EnrichmentPipeline(mockLibraryCaches as any)

      const result = await pipeline.resolveTestCatalog('chest pain')

      expect(result).toBeUndefined()
    })

    it('stringifies non-string content', async () => {
      vi.mocked(getRelevantTests).mockResolvedValue([])

      await pipeline.resolveTestCatalog({ field: 'value' } as any)

      expect(getRelevantTests).toHaveBeenCalledWith(JSON.stringify({ field: 'value' }), 50)
    })
  })

  // --------------------------------------------------------------------------
  // buildPhotoCatalog
  // --------------------------------------------------------------------------

  describe('buildPhotoCatalog', () => {
    it('delegates to buildPhotoCatalogPrompt', () => {
      const result = pipeline.buildPhotoCatalog()

      expect(buildPhotoCatalogPrompt).toHaveBeenCalled()
      expect(result).toBe('photo catalog prompt')
    })
  })
})
