import type { CdrSeed } from './types'
import { labScore } from './lab_score'

/**
 * Batch 27 — Infectious Disease 2 Rescue CDRs
 *
 * CDRs rescued from quarantine by converting lab/imaging components
 * from source 'section2' to 'user_input'.
 */
export const batch27RescueId2Cdrs: CdrSeed[] = [labScore]
