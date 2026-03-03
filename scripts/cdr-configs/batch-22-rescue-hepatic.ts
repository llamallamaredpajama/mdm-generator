import type { CdrSeed } from './types'
import { child_pugh } from './child_pugh'

/**
 * Batch 22 — Hepatic Rescue CDRs
 *
 * CDRs rescued from quarantine by converting lab components
 * from source 'section2' to 'user_input'. Physicians enter categorical
 * lab ranges via select UI.
 *
 * Scoring fixes applied during rescue:
 *  - Child-Pugh: INR thresholds corrected from 2.3 → 2.2 (Pugh et al. 1973; StatPearls)
 *
 * Sources:
 *  - Child-Pugh Score: Pugh et al., Br J Surg 1973;60:646-649
 */
export const batch22RescueHepaticCdrs: CdrSeed[] = [child_pugh]
