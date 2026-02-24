/**
 * CDR Matching Service
 *
 * Matches Clinical Decision Rules from the CDR library against
 * S1 differential diagnoses using case-insensitive substring matching.
 */

import type { DifferentialItem } from '../buildModeSchemas'
import type { CdrDefinition } from '../types/libraries'

/**
 * Match CDR library entries against S1 differential items.
 *
 * Two matching strategies:
 * 1. CDR `applicableChiefComplaints` against differential `diagnosis` names
 * 2. CDR `name`/`fullName` against differential `cdrContext` strings
 *
 * Results are deduplicated by CDR id.
 */
export function matchCdrsFromDifferential(
  differential: DifferentialItem[],
  cdrLibrary: CdrDefinition[]
): CdrDefinition[] {
  if (differential.length === 0 || cdrLibrary.length === 0) {
    return []
  }

  const matchedIds = new Set<string>()
  const matched: CdrDefinition[] = []

  // Lowercase all diagnosis names and cdrContext strings for matching
  const diagnosisTexts = differential.map((d) => d.diagnosis.toLowerCase())
  const cdrContextTexts = differential
    .filter((d) => d.cdrContext)
    .map((d) => d.cdrContext!.toLowerCase())

  for (const cdr of cdrLibrary) {
    if (matchedIds.has(cdr.id)) continue

    let isMatch = false

    // Strategy 1: Check applicableChiefComplaints against diagnoses
    for (const complaint of cdr.applicableChiefComplaints) {
      const lowerComplaint = complaint.toLowerCase()
      if (diagnosisTexts.some((dx) => dx.includes(lowerComplaint) || lowerComplaint.includes(dx))) {
        isMatch = true
        break
      }
    }

    // Strategy 2: Check CDR name/fullName against cdrContext strings
    if (!isMatch && cdrContextTexts.length > 0) {
      const lowerName = cdr.name.toLowerCase()
      const lowerFullName = cdr.fullName.toLowerCase()
      if (
        cdrContextTexts.some(
          (ctx) => ctx.includes(lowerName) || ctx.includes(lowerFullName)
        )
      ) {
        isMatch = true
      }
    }

    if (isMatch) {
      matchedIds.add(cdr.id)
      matched.push(cdr)
    }
  }

  return matched
}
