/**
 * Shared surveillance + CDR enrichment pipeline.
 *
 * Used by Section 1 and Quick Mode endpoints for non-blocking
 * supplementary context enrichment.
 */

import admin from 'firebase-admin'
import { logger } from '../logger'
import { mapToSyndromes } from '../surveillance/syndromeMapper'
import { RegionResolver } from '../surveillance/regionResolver'
import { AdapterRegistry } from '../surveillance/adapters/adapterRegistry'
import { computeCorrelations } from '../surveillance/correlationEngine'
import { buildSurveillanceContext, appendSurveillanceToMdmText } from '../surveillance/promptAugmenter'
import { searchCdrCatalog } from '../services/cdrCatalogSearch'
import { formatCdrContext } from '../services/cdrCatalogFormatter'
import { getDb } from './db'
import { getCurrentPeriodKey } from '../services/userService'
import type { GapItem } from '../buildModeSchemas'

/**
 * Run surveillance enrichment for a narrative + location.
 * Returns a surveillance context string for prompt injection, or undefined on failure.
 * Non-blocking: failures are logged and swallowed.
 */
export async function runSurveillanceEnrichment(
  narrative: string,
  location: { zipCode?: string; state?: string },
): Promise<string | undefined> {
  try {
    const syndromes = mapToSyndromes(narrative, [])
    const resolver = new RegionResolver()
    const region = await resolver.resolve(location)
    if (!region) return undefined

    const registry = new AdapterRegistry()
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
 */
export async function runCdrEnrichment(narrative: string): Promise<string | undefined> {
  try {
    const cdrResults = await searchCdrCatalog(narrative, getDb(), 15)
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

/**
 * Increment gap tallies on a user's customer profile.
 * Used by both Build Mode finalize and Quick Mode generate.
 */
export async function incrementGapTallies(uid: string, gaps: GapItem[]): Promise<void> {
  if (gaps.length === 0) return

  const period = getCurrentPeriodKey()
  const tallyUpdates: Record<string, FirebaseFirestore.FieldValue | { category: string; method: string }> = {}
  for (const gap of gaps) {
    tallyUpdates[`gapTallies.identified.${gap.id}`] = admin.firestore.FieldValue.increment(1)
    tallyUpdates[`gapTallies.identifiedByPeriod.${period}.${gap.id}`] = admin.firestore.FieldValue.increment(1)
    tallyUpdates[`gapMeta.${gap.id}`] = { category: gap.category, method: gap.method }
  }
  await getDb().collection('customers').doc(uid).update(tallyUpdates)
}
