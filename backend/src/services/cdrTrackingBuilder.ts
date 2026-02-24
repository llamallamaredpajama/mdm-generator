/**
 * CDR Tracking Builder
 *
 * Builds the CdrTracking structure from matched CDR definitions
 * and auto-populated component values from Gemini.
 */

import type { CdrTracking, CdrTrackingEntry, CdrComponentState, CdrStatus } from '../buildModeSchemas'
import type { CdrDefinition } from '../types/libraries'

/** Shape of auto-populated values from Gemini */
export interface AutoPopulatedValues {
  [cdrId: string]: {
    [componentId: string]: {
      value: number
    }
  }
}

/**
 * Determine CDR status from component answered states.
 */
function computeCdrStatus(components: Record<string, CdrComponentState>): CdrStatus {
  const entries = Object.values(components)
  if (entries.length === 0) return 'pending'

  const answeredCount = entries.filter((c) => c.answered).length
  if (answeredCount === 0) return 'pending'
  if (answeredCount === entries.length) return 'completed'
  return 'partial'
}

/**
 * Calculate score for a completed CDR using sum scoring method.
 * Returns null if any component is unanswered.
 */
function calculateScore(
  cdr: CdrDefinition,
  components: Record<string, CdrComponentState>
): { score: number | null; interpretation: string | null } {
  const allAnswered = Object.values(components).every((c) => c.answered)
  if (!allAnswered) return { score: null, interpretation: null }

  if (cdr.scoring.method === 'sum') {
    let score = 0
    for (const [, state] of Object.entries(components)) {
      if (state.value != null) {
        score += state.value
      }
    }

    // Find matching risk range
    const range = cdr.scoring.ranges.find(
      (r) => score >= r.min && score <= r.max
    )

    return {
      score,
      interpretation: range ? `${range.risk}: ${range.interpretation}` : null,
    }
  }

  // For threshold/algorithm scoring methods, return score without interpretation
  // (would need more complex logic for these methods)
  return { score: null, interpretation: null }
}

/**
 * Build CdrTracking from matched CDR definitions and optional auto-populated values.
 *
 * For each matched CDR:
 * - Creates a CdrTrackingEntry with component states
 * - Auto-populated values are marked as answered
 * - section2 components are left pending (need lab results)
 * - Computes initial status (pending/partial/completed)
 */
export function buildCdrTracking(
  matchedCdrs: CdrDefinition[],
  autoPopulated: AutoPopulatedValues | null
): CdrTracking {
  const tracking: CdrTracking = {}

  for (const cdr of matchedCdrs) {
    const components: Record<string, CdrComponentState> = {}

    for (const component of cdr.components) {
      const autoValue = autoPopulated?.[cdr.id]?.[component.id]

      if (autoValue != null) {
        // Auto-populated from Gemini
        components[component.id] = {
          value: autoValue.value,
          source: component.source,
          answered: true,
        }
      } else if (component.source === 'section2') {
        // Needs lab/imaging results — leave pending
        components[component.id] = {
          value: null,
          source: 'section2',
          answered: false,
        }
      } else {
        // section1 or user_input — not auto-populated
        components[component.id] = {
          value: null,
          source: component.source,
          answered: false,
        }
      }
    }

    const status = computeCdrStatus(components)
    const { score, interpretation } = calculateScore(cdr, components)

    const entry: CdrTrackingEntry = {
      name: cdr.name,
      status,
      identifiedInSection: 1,
      completedInSection: status === 'completed' ? 1 : null,
      dismissed: false,
      components,
      score,
      interpretation,
    }

    tracking[cdr.id] = entry
  }

  return tracking
}
