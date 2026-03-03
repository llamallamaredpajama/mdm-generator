import type { CdrSeed } from './types'
import { lrinec } from './lrinec'
import { bacterial_meningitis_score } from './bacterial_meningitis_score'

/**
 * Batch 26 — Infectious Disease 1 Rescue CDRs
 *
 * Rescued from quarantine by changing lab component sources
 * from section2 to user_input (physician manually enters results).
 *
 * CDRs:
 *  - LRINEC Score (Wong et al., Crit Care Med 2004)
 *  - Bacterial Meningitis Score (Nigrovic et al., JAMA 2007)
 */
export const batch26RescueId1Cdrs: CdrSeed[] = [lrinec, bacterial_meningitis_score]
