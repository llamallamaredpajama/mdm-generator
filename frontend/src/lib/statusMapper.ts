import type { EncounterDocument } from '../types/encounter'
import { getEncounterMode } from '../types/encounter'

export type DisplayColumn = 'COMPOSING' | 'BUILDING' | 'COMPLETE'

/**
 * Maps an encounter's status to a board display column.
 *
 * Quick mode mapping:
 *   - 'processing' → BUILDING
 *   - 'completed' → COMPLETE
 *   - everything else (draft, error) → COMPOSING
 *
 * Build mode mapping:
 *   - 'section1_done' or 'section2_done' → BUILDING
 *   - 'finalized' → COMPLETE
 *   - everything else (draft) → COMPOSING
 */
export function getDisplayColumn(encounter: EncounterDocument): DisplayColumn {
  const mode = getEncounterMode(encounter)

  if (mode === 'quick') {
    const qs = encounter.quickModeData?.status
    if (qs === 'processing') return 'BUILDING'
    if (qs === 'completed') return 'COMPLETE'
    return 'COMPOSING'
  }

  // Build mode
  if (encounter.status === 'section1_done' || encounter.status === 'section2_done')
    return 'BUILDING'
  if (encounter.status === 'finalized') return 'COMPLETE'
  return 'COMPOSING'
}
