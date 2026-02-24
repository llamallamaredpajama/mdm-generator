import type { DifferentialItem } from '../../../types/encounter'
import type { TestDefinition } from '../../../types/libraries'

/**
 * Match AI-recommended tests from the differential diagnosis reasoning.
 *
 * Matching strategy:
 * 1. Check if the test's name (case-insensitive) appears in any differential item's reasoning
 * 2. Check if any of the test's commonIndications overlap with any diagnosis name (case-insensitive substring)
 *
 * Returns a deduplicated array of matching test IDs.
 * False positives are acceptable — the physician reviews and adjusts.
 */
export function getRecommendedTestIds(
  differential: DifferentialItem[],
  testLibrary: TestDefinition[]
): string[] {
  if (differential.length === 0 || testLibrary.length === 0) return []

  const allReasoning = differential.map((d) => d.reasoning.toLowerCase()).join(' ')
  const allDiagnoses = differential.map((d) => d.diagnosis.toLowerCase())

  const matched = new Set<string>()

  for (const test of testLibrary) {
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

  return Array.from(matched)
}
