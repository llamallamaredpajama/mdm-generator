import type { CdrSeed } from './types'
import { faintScore } from './faint_score'
import { sgarbossa } from './sgarbossa'

/**
 * Batch 21 — Cardiovascular Rescue CDRs
 *
 * CDRs rescued from quarantine by converting lab/imaging components
 * from source 'section2' to 'user_input'. Physicians enter categorical
 * lab results via select/boolean UI.
 *
 * Scoring fixes applied during rescue:
 *  - FAINT: elevated_bnp corrected from 1 → 2 points (Probst et al. 2019)
 *
 * Sources:
 *  - FAINT Score: Probst et al., Ann Emerg Med 2020;75(2):147-158
 *  - Sgarbossa Criteria: Sgarbossa et al., NEJM 1996;334:481-487
 *    Smith-Modified: Smith et al., Ann Emerg Med 2012;60(6):766-776
 */
export const batch21RescueCardioCdrs: CdrSeed[] = [faintScore, sgarbossa]
