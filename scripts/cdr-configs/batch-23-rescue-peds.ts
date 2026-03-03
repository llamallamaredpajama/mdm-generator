import type { CdrSeed } from './types'
import { kocher_criteria } from './kocher_criteria'
import { stepByStepFebrileInfant } from './step_by_step_febrile_infant'

/**
 * Batch 23 — Pediatric Rescue CDRs
 *
 * CDRs rescued from quarantine by converting lab/imaging components
 * from source 'section2' to 'user_input'.
 */
export const batch23RescuePedsCdrs: CdrSeed[] = [kocher_criteria, stepByStepFebrileInfant]
