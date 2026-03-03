import type { CdrSeed } from '../types'

/**
 * QUARANTINED: Fractional Excretion of Sodium (FENa)
 *
 * Reason: 0 user-answerable components. All 4 components are number_range
 * with source section2 (lab values). This is a pure lab formula:
 * FENa = (UNa × PCr) / (PNa × UCr) × 100
 * There are no clinical/exam components to convert — the entire tool
 * calculates from urine sodium, serum sodium, urine creatinine, and
 * serum creatinine.
 *
 * Source: Espinel CH, Arch Intern Med 1976;136:370-373
 */
export const fena: CdrSeed = {
  id: 'fena',
  name: 'FENa',
  fullName: 'Fractional Excretion of Sodium (FENa)',
  category: 'NEPHROLOGY & ELECTROLYTES',
  application:
    'Differentiates prerenal azotemia from intrinsic renal injury (ATN) in oliguric AKI. Unreliable with diuretic use; use FEUrea instead in those cases.',
  applicableChiefComplaints: ['acute_kidney_injury', 'oliguria', 'elevated_creatinine'],
  keywords: [
    'FENa',
    'fractional excretion of sodium',
    'prerenal',
    'ATN',
    'acute tubular necrosis',
    'AKI differentiation',
    'urine sodium',
  ],
  requiredTests: ['urine sodium', 'serum sodium', 'urine creatinine', 'serum creatinine'],
  components: [
    {
      id: 'urine_sodium',
      label: 'Urine Sodium (mEq/L)',
      type: 'number_range',
      source: 'section2',
      autoPopulateFrom: 'test_result',
      min: 0,
      max: 300,
    },
    {
      id: 'serum_sodium',
      label: 'Serum Sodium (mEq/L)',
      type: 'number_range',
      source: 'section2',
      autoPopulateFrom: 'test_result',
      min: 100,
      max: 180,
    },
    {
      id: 'urine_creatinine',
      label: 'Urine Creatinine (mg/dL)',
      type: 'number_range',
      source: 'section2',
      autoPopulateFrom: 'test_result',
      min: 1,
      max: 500,
    },
    {
      id: 'serum_creatinine',
      label: 'Serum Creatinine (mg/dL)',
      type: 'number_range',
      source: 'section2',
      autoPopulateFrom: 'test_result',
      min: 0.1,
      max: 25,
    },
  ],
  scoring: {
    method: 'algorithm',
    ranges: [
      {
        min: 0,
        max: 1,
        risk: 'Prerenal',
        interpretation:
          'FENa <1%: Prerenal azotemia; kidney retaining sodium appropriately. Treat underlying cause (volume depletion, heart failure, hepatorenal syndrome). If on diuretics, use FEUrea instead.',
      },
      {
        min: 1,
        max: 2,
        risk: 'Indeterminate',
        interpretation:
          'FENa 1–2%: Indeterminate; clinical correlation required. May be early ATN transitioning from prerenal state, or post-obstructive AKI.',
      },
      {
        min: 2,
        max: 100,
        risk: 'Intrinsic Renal',
        interpretation:
          'FENa >2%: Intrinsic renal disease (ATN most common); tubular sodium wasting indicates tubular injury. Note: contrast nephropathy, myoglobinuria, and early obstruction may also have low FENa despite intrinsic injury.',
      },
    ],
  },
  suggestedTreatments: {
    Prerenal: [
      'iv_fluid_resuscitation',
      'treat_underlying_cause',
      'hold_diuretics',
      'hold_ace_arb_nsaids',
      'serial_creatinine_monitoring',
    ],
    Indeterminate: [
      'volume_challenge_if_hypovolemic',
      'serial_creatinine_monitoring',
      'consider_feurea_if_on_diuretics',
      'nephrology_consultation_if_worsening',
    ],
    'Intrinsic Renal': [
      'nephrology_consultation',
      'hold_nephrotoxins',
      'supportive_care',
      'monitor_for_rrt_indications',
      'renal_dosing_medications',
    ],
  },
}
