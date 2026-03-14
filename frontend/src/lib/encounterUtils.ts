/**
 * Shared extraction utilities for LLM response data.
 *
 * Build Mode stores LLM outputs in Firestore with dual shapes for
 * backward compatibility (flat legacy vs wrapped current). These helpers
 * normalize extraction so consumers don't duplicate shape-handling logic.
 */

import type {
  DifferentialItem,
  CdrAnalysisItem,
  WorkupRecommendation,
  MdmPreview,
  FinalMdm,
} from '../types/encounter'

/**
 * Extract differential items from S1 llmResponse, handling both
 * flat array (legacy) and wrapped { differential, processedAt } (current) shapes.
 */
export function getDifferential(llmResponse: unknown): DifferentialItem[] {
  if (Array.isArray(llmResponse)) return llmResponse as DifferentialItem[]
  if (llmResponse && typeof llmResponse === 'object' && 'differential' in llmResponse) {
    const wrapped = llmResponse as { differential?: unknown }
    if (Array.isArray(wrapped.differential)) return wrapped.differential as DifferentialItem[]
  }
  return []
}

/**
 * Extract CDR analysis from S1 llmResponse (optional, new field).
 */
export function getCdrAnalysis(llmResponse: unknown): CdrAnalysisItem[] {
  if (llmResponse && typeof llmResponse === 'object' && 'cdrAnalysis' in llmResponse) {
    const wrapped = llmResponse as { cdrAnalysis?: unknown }
    if (Array.isArray(wrapped.cdrAnalysis)) return wrapped.cdrAnalysis as CdrAnalysisItem[]
  }
  return []
}

/**
 * Extract workup recommendations from S1 llmResponse (optional, new field).
 */
export function getWorkupRecommendations(llmResponse: unknown): WorkupRecommendation[] {
  if (llmResponse && typeof llmResponse === 'object' && 'workupRecommendations' in llmResponse) {
    const wrapped = llmResponse as { workupRecommendations?: unknown }
    if (Array.isArray(wrapped.workupRecommendations))
      return wrapped.workupRecommendations as WorkupRecommendation[]
  }
  return []
}

/**
 * Extract MdmPreview from S2 llmResponse, handling dual shapes.
 */
export function getMdmPreview(llmResponse: unknown): MdmPreview | null {
  if (!llmResponse || typeof llmResponse !== 'object') return null
  const resp = llmResponse as Record<string, unknown>
  if (resp.mdmPreview && typeof resp.mdmPreview === 'object') {
    return resp.mdmPreview as MdmPreview
  }
  // Legacy: llmResponse might BE the preview directly
  if ('problems' in resp && 'reasoning' in resp) {
    return resp as unknown as MdmPreview
  }
  return null
}

/**
 * Extract FinalMdm from S3 llmResponse, handling dual shapes.
 */
export function getFinalMdm(llmResponse: unknown): FinalMdm | null {
  if (!llmResponse || typeof llmResponse !== 'object') return null
  const resp = llmResponse as Record<string, unknown>
  if (resp.finalMdm && typeof resp.finalMdm === 'object') {
    return resp.finalMdm as FinalMdm
  }
  // Legacy: llmResponse might BE the final MDM directly
  if ('text' in resp && 'json' in resp) {
    return resp as unknown as FinalMdm
  }
  return null
}
