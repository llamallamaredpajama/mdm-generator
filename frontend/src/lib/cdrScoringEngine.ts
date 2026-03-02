/**
 * CDR Scoring Engine
 *
 * Calculates scores for Clinical Decision Rules using three methods:
 * - sum: Sum all component values, find matching range
 * - threshold: Count components with value > 0, map to ranges (0 = low, ≥1 = not low)
 * - algorithm: Registry of custom calculators per CDR ID; fallback to sum
 */

import type { CdrDefinition, CdrComponent } from '../types/libraries'
import type { CdrComponentState } from '../types/encounter'

export interface ScoreResult {
  score: number | null
  interpretation: string | null
  /** Labels of unanswered non-algorithm components */
  missingComponents: string[]
}

/**
 * Get labels of components that haven't been answered yet.
 * Excludes algorithm-type components (auto-calculated) and section2 pending components
 * from the "missing" list since users can't directly answer those.
 */
function getMissingComponents(
  components: CdrComponent[],
  states: Record<string, CdrComponentState>,
): string[] {
  return components
    .filter((c) => c.type !== 'algorithm' && !states[c.id]?.answered)
    .map((c) => c.label)
}

/**
 * Sum scoring: add up all component values, find matching range.
 */
function calculateSum(
  cdr: CdrDefinition,
  states: Record<string, CdrComponentState>,
): { score: number; interpretation: string | null } {
  const score = Object.values(states).reduce((sum, c) => sum + (c.value ?? 0), 0)
  const range = cdr.scoring.ranges.find((r) => score >= r.min && score <= r.max)
  return {
    score,
    interpretation: range ? `${range.risk}: ${range.interpretation}` : null,
  }
}

/**
 * Threshold scoring: count components with value > 0, map to ranges.
 * Typically: 0 positive = low risk, ≥1 positive = not low risk.
 */
function calculateThreshold(
  cdr: CdrDefinition,
  states: Record<string, CdrComponentState>,
): { score: number; interpretation: string | null } {
  const positiveCount = Object.values(states).filter((c) => (c.value ?? 0) > 0).length
  const range = cdr.scoring.ranges.find((r) => positiveCount >= r.min && positiveCount <= r.max)
  return {
    score: positiveCount,
    interpretation: range ? `${range.risk}: ${range.interpretation}` : null,
  }
}

// ── Algorithm Calculator Registry ────────────────────────────────────────

type AlgorithmCalculator = (
  cdr: CdrDefinition,
  states: Record<string, CdrComponentState>,
) => { score: number; interpretation: string | null }

/**
 * Registry of custom algorithm calculators keyed by CDR ID.
 * Add entries here for CDRs that need non-standard scoring logic
 * (e.g., step-based decision trees like PECARN).
 */
const algorithmCalculators: Record<string, AlgorithmCalculator> = {
  // PECARN uses a decision tree, not a simple sum.
  // If GCS ≤14 or altered mental status → high risk (CT recommended)
  // If palpable skull fracture → high risk (CT recommended)
  // Otherwise assess remaining criteria for intermediate vs low risk
  pecarn: (cdr, states) => {
    const gcsLow = (states['gcs_lte_14']?.value ?? 0) > 0
    const alteredMental = (states['altered_mental_status']?.value ?? 0) > 0
    const skullFracture = (states['palpable_skull_fracture']?.value ?? 0) > 0

    if (gcsLow || alteredMental || skullFracture) {
      const range = cdr.scoring.ranges.find((r) => r.risk === 'High')
      return {
        score: 2,
        interpretation: range ? `${range.risk}: ${range.interpretation}` : 'High: CT recommended',
      }
    }

    // Count remaining risk factors
    const riskFactors = [
      'scalp_hematoma',
      'loss_of_consciousness',
      'severe_mechanism',
      'acting_abnormally',
    ]
    const positiveCount = riskFactors.filter((id) => (states[id]?.value ?? 0) > 0).length

    if (positiveCount > 0) {
      const range = cdr.scoring.ranges.find((r) => r.risk === 'Intermediate')
      return {
        score: 1,
        interpretation: range
          ? `${range.risk}: ${range.interpretation}`
          : 'Intermediate: Observation vs CT based on clinical judgment',
      }
    }

    const range = cdr.scoring.ranges.find((r) => r.risk === 'Low')
    return {
      score: 0,
      interpretation: range ? `${range.risk}: ${range.interpretation}` : 'Low: CT not recommended',
    }
  },
}

/**
 * Register a custom algorithm calculator for a CDR ID.
 * Useful for Phase 1 batch CDRs that need algorithm scoring.
 */
export function registerAlgorithmCalculator(cdrId: string, calculator: AlgorithmCalculator): void {
  algorithmCalculators[cdrId] = calculator
}

// ── Main Entry Point ─────────────────────────────────────────────────────

/**
 * Calculate score for a CDR using its scoring method.
 *
 * Returns score + interpretation if all scorable components are answered,
 * otherwise returns nulls with a list of missing component labels.
 */
export function calculateScore(
  cdr: CdrDefinition,
  components: Record<string, CdrComponentState>,
): ScoreResult {
  const missing = getMissingComponents(cdr.components, components)

  // Can't score if there are unanswered components
  if (missing.length > 0) {
    return { score: null, interpretation: null, missingComponents: missing }
  }

  const method = cdr.scoring.method

  if (method === 'threshold') {
    const result = calculateThreshold(cdr, components)
    return { ...result, missingComponents: [] }
  }

  if (method === 'algorithm') {
    const calculator = algorithmCalculators[cdr.id]
    if (calculator) {
      const result = calculator(cdr, components)
      return { ...result, missingComponents: [] }
    }
    // Fallback to sum for unregistered algorithms
    const result = calculateSum(cdr, components)
    return { ...result, missingComponents: [] }
  }

  // Default: sum
  const result = calculateSum(cdr, components)
  return { ...result, missingComponents: [] }
}
