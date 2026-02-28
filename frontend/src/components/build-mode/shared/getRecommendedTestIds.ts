import type { DifferentialItem, RecommendedOrder } from '../../../types/encounter'
import type { TestDefinition } from '../../../types/libraries'

/**
 * Get recommended test IDs, preferring S1 AI-generated recommendedOrders
 * when available, falling back to heuristic differential-based matching.
 *
 * Priority:
 * 1. If `recommendedOrders` is provided (from S1 LLM response), use those testIds directly
 *    and merge with any additional heuristic matches for broader coverage
 * 2. Otherwise, fall back to pure heuristic matching from differential reasoning
 *
 * Heuristic matching strategy:
 * 1. Check if the test's name (case-insensitive) appears in any differential item's reasoning
 * 2. Check if any of the test's commonIndications overlap with any diagnosis name (case-insensitive substring)
 *
 * Returns a deduplicated array of matching test IDs.
 * False positives are acceptable — the physician reviews and adjusts.
 */
export function getRecommendedTestIds(
  differential: DifferentialItem[],
  testLibrary: TestDefinition[],
  recommendedOrders?: RecommendedOrder[]
): string[] {
  const matched = new Set<string>()

  // Strategy 0: Use S1 AI-generated recommendedOrders (highest confidence)
  if (recommendedOrders && recommendedOrders.length > 0) {
    // Validate each testId exists in the test library to avoid stale references
    const libraryIds = new Set(testLibrary.map((t) => t.id))
    for (const order of recommendedOrders) {
      if (libraryIds.has(order.testId)) {
        matched.add(order.testId)
      }
    }
  }

  // Also run heuristic matching for additional coverage (merges with AI orders)
  if (differential.length > 0 && testLibrary.length > 0) {
    const allReasoning = differential.map((d) => d.reasoning.toLowerCase()).join(' ')
    const allDiagnoses = differential.map((d) => d.diagnosis.toLowerCase())

    for (const test of testLibrary) {
      if (matched.has(test.id)) continue // Already matched by AI orders

      const testNameLower = test.name.toLowerCase()

      // Strategy 1: test name appears in any reasoning text
      if (allReasoning.includes(testNameLower)) {
        matched.add(test.id)
        continue
      }

      // Strategy 2: any commonIndication is a substring of any diagnosis name
      for (const indication of test.commonIndications) {
        const indicationLower = indication.toLowerCase()
        if (allDiagnoses.some((dx) => dx.includes(indicationLower))) {
          matched.add(test.id)
          break
        }
      }
    }
  }

  return Array.from(matched)
}
