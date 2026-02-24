import type { DifferentialItem } from '../../../types/encounter'
import type { CdrDefinition } from '../../../types/libraries'

export interface IdentifiedCdr {
  cdr: CdrDefinition
  readiness: 'completable' | 'needs_results'
}

/**
 * Match CDRs from the library against a differential diagnosis.
 *
 * Two-pass matching:
 * 1. For each DifferentialItem with a cdrContext string, check if any CDR's
 *    name or fullName appears (case-insensitive substring) in the cdrContext text.
 * 2. For each CDR in the library, check if any of its applicableChiefComplaints
 *    appear (case-insensitive substring) in any differential diagnosis name.
 *
 * Returns deduplicated results with readiness indicators.
 */
export function getIdentifiedCdrs(
  differential: DifferentialItem[],
  cdrLibrary: CdrDefinition[]
): IdentifiedCdr[] {
  if (differential.length === 0 || cdrLibrary.length === 0) return []

  const matched = new Map<string, CdrDefinition>()

  // Pass 1: Match cdrContext text against CDR name/fullName
  for (const item of differential) {
    if (!item.cdrContext) continue
    const contextLower = item.cdrContext.toLowerCase()

    for (const cdr of cdrLibrary) {
      if (matched.has(cdr.id)) continue
      if (
        contextLower.includes(cdr.name.toLowerCase()) ||
        contextLower.includes(cdr.fullName.toLowerCase())
      ) {
        matched.set(cdr.id, cdr)
      }
    }
  }

  // Pass 2: Match applicableChiefComplaints against diagnosis names
  const allDiagnoses = differential.map((d) => d.diagnosis.toLowerCase())

  for (const cdr of cdrLibrary) {
    if (matched.has(cdr.id)) continue

    for (const complaint of cdr.applicableChiefComplaints) {
      const complaintLower = complaint.toLowerCase()
      if (allDiagnoses.some((dx) => dx.includes(complaintLower))) {
        matched.set(cdr.id, cdr)
        break
      }
    }
  }

  // Compute readiness for each matched CDR
  return Array.from(matched.values()).map((cdr) => ({
    cdr,
    readiness: computeReadiness(cdr),
  }))
}

function computeReadiness(cdr: CdrDefinition): 'completable' | 'needs_results' {
  const hasSection2 = cdr.components.some((c) => c.source === 'section2')
  return hasSection2 ? 'needs_results' : 'completable'
}
