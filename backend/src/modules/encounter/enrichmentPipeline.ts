/**
 * Enrichment Pipeline
 *
 * Wraps shared enrichment functions (surveillance, CDR, test catalog, photos)
 * behind a clean interface for the EncounterOrchestrator.
 *
 * Does NOT replace shared/surveillanceEnrichment.ts — delegates to it.
 */

import { runSurveillanceEnrichment, runCdrEnrichment } from '../../shared/surveillanceEnrichment.js'
import { getRelevantTests } from '../../services/testCatalogSearch.js'
import { buildCompactCatalog } from '../../services/testCatalogFormatter.js'
import { buildPhotoCatalogPrompt } from '../../photoCatalog.js'
import { logger } from '../../logger.js'
import type { LibraryCaches } from '../../dependencies.js'
import type { Logger } from 'pino'

export interface EnrichmentResult {
  surveillanceContext?: string
  cdrContext?: string
}

export class EnrichmentPipeline {
  constructor(private libraryCaches: LibraryCaches) {}

  /** Run surveillance + CDR enrichment in parallel. Non-blocking — failures return undefined. */
  async enrichForSection1(
    content: string | Record<string, unknown>,
    location?: { zipCode?: string; state?: string },
  ): Promise<EnrichmentResult> {
    const narrativeText = typeof content === 'string' ? content : JSON.stringify(content)
    const [surveillanceContext, cdrContext] = await Promise.all([
      location ? runSurveillanceEnrichment(narrativeText, location) : undefined,
      runCdrEnrichment(narrativeText),
    ])
    return { surveillanceContext, cdrContext }
  }

  /** Resolve test catalog via vector search with full-catalog fallback. */
  async resolveTestCatalog(content: string | Record<string, unknown>, reqLog?: Logger): Promise<string | undefined> {
    const narrativeText = typeof content === 'string' ? content : JSON.stringify(content)
    try {
      const relevantTests = await getRelevantTests(narrativeText, 50)
      return buildCompactCatalog(relevantTests)
    } catch (vectorSearchError) {
      ;(reqLog || logger).warn({ action: 'vector-search-fallback', error: String(vectorSearchError) }, 'Vector search failed, falling back to full catalog')
      try {
        const allTests = await this.libraryCaches.getTests()
        return buildCompactCatalog(allTests)
      } catch (catalogError) {
        ;(reqLog || logger).warn({ action: 'test-catalog-failed', error: String(catalogError) }, 'Test catalog build also failed')
        return undefined
      }
    }
  }

  /** Build photo catalog prompt string. */
  buildPhotoCatalog(): string {
    return buildPhotoCatalogPrompt()
  }
}
