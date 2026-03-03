import type { CdrSeed } from './types'
import { plasmic_score } from './plasmic_score'
import { isthDic } from './isth_dic'

/**
 * Batch 24 — Hematology Rescue CDRs
 *
 * CDRs rescued from quarantine by converting lab/imaging components
 * from source 'section2' to 'user_input'.
 */
export const batch24RescueHemeCdrs: CdrSeed[] = [plasmic_score, isthDic]
