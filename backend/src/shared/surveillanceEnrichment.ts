/**
 * Shared surveillance + CDR enrichment pipeline.
 *
 * Used by Section 1 and Quick Mode endpoints for non-blocking
 * supplementary context enrichment.
 */

import { logger } from '../logger.js'
import { mapToSyndromes } from '../surveillance/syndromeMapper.js'
import { RegionResolver } from '../surveillance/regionResolver.js'
import { AdapterRegistry } from '../surveillance/adapters/adapterRegistry.js'
import { computeCorrelations } from '../surveillance/correlationEngine.js'
import { buildSurveillanceContext, appendSurveillanceToMdmText } from '../surveillance/promptAugmenter.js'
import { searchCdrCatalog } from '../services/cdrCatalogSearch.js'
import { formatCdrContext } from '../services/cdrCatalogFormatter.js'
import { getDb } from './db.js'

/**
 * Run surveillance enrichment for a narrative + location.
 * Returns a surveillance context string for prompt injection, or undefined on failure.
 * Non-blocking: failures are logged and swallowed.
 *
 * @param narrative - Clinical narrative text
 * @param location - User location (zip code and/or state)
 * @param db - Optional Firestore instance (falls back to getDb() if not provided)
 */
export async function runSurveillanceEnrichment(
  narrative: string,
  location: { zipCode?: string; state?: string },
  db?: FirebaseFirestore.Firestore,
): Promise<string | undefined> {
  try {
    const firestore = db ?? getDb()
    const syndromes = mapToSyndromes(narrative, [])
    const resolver = new RegionResolver(firestore)
    const region = await resolver.resolve(location)
    if (!region) return undefined

    const registry = new AdapterRegistry(firestore)
    const { dataPoints, errors: survErrors } = await registry.fetchAll(region, syndromes)
    const correlations = computeCorrelations({
      chiefComplaint: narrative,
      differential: [],
      dataPoints,
    })

    const allSourceNames = ['CDC Respiratory', 'NWSS Wastewater', 'CDC NNDSS']
    const allSourceKeys = ['cdc_respiratory', 'cdc_wastewater', 'cdc_nndss']
    const failedSources = new Set(survErrors.map((e: { source: string }) => e.source))
    const dataSourcesQueried = allSourceNames.filter(
      (_, i) => !failedSources.has(allSourceKeys[i]),
    )

    return buildSurveillanceContext({
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
  } catch (survError) {
    logger.warn({ action: 'surveillance-enrichment-failed', error: String(survError) }, 'Surveillance enrichment failed (non-blocking)')
    return undefined
  }
}

/**
 * Run CDR enrichment for a narrative.
 * Returns a CDR context string for prompt injection, or undefined on failure.
 * Non-blocking: failures are logged and swallowed.
 *
 * @param narrative - Clinical narrative text
 * @param db - Optional Firestore instance (falls back to getDb() if not provided)
 */
export async function runCdrEnrichment(narrative: string, db?: FirebaseFirestore.Firestore): Promise<string | undefined> {
  try {
    const firestore = db ?? getDb()
    const cdrResults = await searchCdrCatalog(narrative, firestore, 15)
    if (cdrResults.length > 0) {
      return formatCdrContext(cdrResults) || undefined
    }
    return undefined
  } catch (cdrError) {
    logger.warn({ action: 'cdr-enrichment-failed', error: String(cdrError) }, 'CDR enrichment failed (non-blocking)')
    return undefined
  }
}

/**
 * Deterministic post-processing: inject surveillance data into MDM dataReviewed.
 * Mutates the provided dataReviewed array and MDM text.
 */
export function injectSurveillanceIntoMdm(
  dataReviewed: string[],
  mdmText: string,
  surveillanceContext: string,
): { dataReviewed: string[]; text: string } {
  const hasSurveillance = dataReviewed.some((item: string) =>
    /surveillance|regional/i.test(item)
  )
  if (!hasSurveillance) {
    return {
      dataReviewed: [...dataReviewed, 'Regional Surveillance Data: CDC Respiratory (hospital admission trends), NWSS Wastewater (pathogen PCR), CDC NNDSS (notifiable diseases) — reviewed and integrated'],
      text: appendSurveillanceToMdmText(mdmText, surveillanceContext),
    }
  }
  return { dataReviewed, text: mdmText }
}
