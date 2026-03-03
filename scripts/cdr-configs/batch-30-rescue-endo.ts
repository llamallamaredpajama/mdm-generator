import type { CdrSeed } from './types'
import { adaDkaSeverityCdr } from './ada_dka_severity'

/**
 * Batch 30 — Endocrine Rescue CDRs
 *
 * CDRs rescued from quarantine by converting lab/imaging components
 * from source 'section2' to 'user_input'.
 */
export const batch30RescueEndoCdrs: CdrSeed[] = [adaDkaSeverityCdr]
