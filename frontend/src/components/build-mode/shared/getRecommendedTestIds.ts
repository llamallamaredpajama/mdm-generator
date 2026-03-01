import type { DifferentialItem, WorkupRecommendation } from '../../../types/encounter'
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
  testLibrary: TestDefinition[],
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

/**
 * Match LLM workup recommendations against the test library.
 *
 * Fast-path: if the recommendation carries a `testId` that exists in the library,
 * use it directly — no fuzzy matching needed. This is the primary path for new
 * encounters where the LLM was given the test catalog with exact IDs.
 *
 * Fallback (older encounters without testId): case-insensitive name matching:
 * 1. Exact name match (recommendation testName === test library name)
 * 2. Substring containment (recommendation testName contains or is contained in test name)
 *
 * Returns a deduplicated array of matching test IDs.
 */
export function getTestIdsFromWorkupRecommendations(
  workupRecommendations: WorkupRecommendation[],
  testLibrary: TestDefinition[],
): string[] {
  if (workupRecommendations.length === 0 || testLibrary.length === 0) return []

  const libraryIds = new Set(testLibrary.map((t) => t.id))
  const matched = new Set<string>()

  for (const rec of workupRecommendations) {
    // Fast-path: LLM provided an exact catalog ID
    if (rec.testId && libraryIds.has(rec.testId)) {
      matched.add(rec.testId)
      continue
    }

    // Fallback: fuzzy name matching for older encounters without testId
    const recNameLower = rec.testName.toLowerCase()

    for (const test of testLibrary) {
      if (matched.has(test.id)) continue
      const testNameLower = test.name.toLowerCase()

      // Exact match
      if (recNameLower === testNameLower) {
        matched.add(test.id)
        break
      }

      // Substring containment (either direction)
      if (recNameLower.includes(testNameLower) || testNameLower.includes(recNameLower)) {
        matched.add(test.id)
        break
      }
    }
  }

  return Array.from(matched)
}
