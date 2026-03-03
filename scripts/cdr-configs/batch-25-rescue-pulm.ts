import type { CdrSeed } from './types'
import { lightsCriteria } from './lights_criteria'
import { decaf } from './decaf'

/**
 * Batch 25 — Pulmonary Rescue CDRs
 *
 * Rescued from quarantine by changing lab/imaging component sources
 * from section2 to user_input (physician manually enters results).
 *
 * CDRs:
 *  - Light's Criteria (Light RW et al., Ann Intern Med 1972)
 *  - DECAF Score (Steer et al., Thorax 2012)
 */
export const batch25RescuePulmCdrs: CdrSeed[] = [lightsCriteria, decaf]
