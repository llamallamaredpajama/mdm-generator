import type { EncounterDocument } from '../types/encounter'
import { getEncounterMode } from '../types/encounter'

export type DisplayColumn = 'COMPOSING' | 'COMPLETE'

/**
 * Maps an encounter's status to a board display row.
 *
 * Quick mode:
 *   - 'completed' → COMPLETE
 *   - everything else (draft, processing, error) → COMPOSING
 *
 * Build mode:
 *   - 'finalized' → COMPLETE
 *   - everything else (draft, section1_done, section2_done, errors) → COMPOSING
 */
export function getDisplayColumn(encounter: EncounterDocument): DisplayColumn {
  const mode = getEncounterMode(encounter)

  if (mode === 'quick') {
    if (encounter.quickModeData?.status === 'completed') return 'COMPLETE'
    return 'COMPOSING'
  }

  // Build mode
  if (encounter.status === 'finalized') return 'COMPLETE'
  return 'COMPOSING'
}
