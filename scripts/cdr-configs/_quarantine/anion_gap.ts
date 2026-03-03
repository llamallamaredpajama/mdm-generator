// QUARANTINE REASON: Lab calculation with only 1 user-answerable component (MUDPILES etiology select).
// Core components (anion gap value, albumin correction, delta-delta ratio) are all section2 lab values.
// Anion Gap = Na⁺ − (Cl⁻ + HCO₃⁻) is a formula, not a clinical decision rule with scored criteria.
// Cannot reach 3 user-answerable components without inventing non-published clinical criteria.

import type { CdrSeed } from '../types'

export const anionGapCdr: CdrSeed = {
  id: 'anion_gap',
  name: 'Anion Gap',
  fullName: 'Anion Gap Calculation',
  category: 'NEPHROLOGY & ELECTROLYTES',
  application:
    'Essential calculation for evaluating metabolic acidosis. Identifies unmeasured anions suggesting specific etiologies (DKA, lactic acidosis, toxic ingestions). Correct for hypoalbuminemia: AG_corrected = AG_measured + 2.5 × (4.0 − albumin). Delta-delta ratio helps identify concurrent non-AG metabolic acidosis or alkalosis.',
  applicableChiefComplaints: [
    'metabolic_acidosis',
    'altered_mental_status',
    'toxic_ingestion',
    'dka',
    'sepsis',
  ],
  keywords: [
    'anion gap',
    'AGMA',
    'metabolic acidosis',
    'MUDPILES',
    'delta-delta',
    'corrected anion gap',
    'hypoalbuminemia',
    'lactic acidosis',
    'DKA',
  ],
  requiredTests: [
    'serum sodium',
    'serum chloride',
    'serum bicarbonate',
    'albumin',
    'lactate',
    'ABG (pH)',
  ],
  components: [
    {
      id: 'anion_gap_value',
      label: 'Calculated Anion Gap: Na⁺ − (Cl⁻ + HCO₃⁻) (mEq/L)',
      type: 'select',
      source: 'section2',
      autoPopulateFrom: 'test_result',
      options: [
        { label: '≤12 mEq/L — Normal AG', value: 0 },
        { label: '13–19 mEq/L — Mildly elevated', value: 1 },
        { label: '20–29 mEq/L — Moderately elevated', value: 2 },
        { label: '≥30 mEq/L — Severely elevated', value: 3 },
      ],
    },
    {
      id: 'albumin_correction',
      label: 'Albumin level (needed for correction)',
      type: 'select',
      source: 'section2',
      autoPopulateFrom: 'test_result',
      options: [
        { label: 'Albumin ≥4.0 g/dL — no correction needed', value: 0 },
        { label: 'Albumin 3.0–3.9 g/dL — add ~2.5 mEq/L to measured AG', value: 0 },
        { label: 'Albumin 2.0–2.9 g/dL — add ~5 mEq/L to measured AG', value: 0 },
        { label: 'Albumin <2.0 g/dL — add ~5–7.5 mEq/L to measured AG', value: 0 },
      ],
    },
    {
      id: 'agma_etiology',
      label: 'Suspected AGMA Etiology (MUDPILES)',
      type: 'select',
      source: 'user_input',
      options: [
        { label: 'Not applicable / Normal AG', value: 0 },
        { label: 'Methanol ingestion', value: 1 },
        { label: 'Uremia', value: 1 },
        { label: 'Diabetic ketoacidosis (DKA)', value: 1 },
        { label: 'Propylene glycol toxicity', value: 1 },
        { label: 'Isoniazid / Iron toxicity', value: 1 },
        { label: 'Lactic acidosis (type A: ischemia; type B: drugs/toxins)', value: 1 },
        { label: 'Ethylene glycol ingestion', value: 1 },
        { label: 'Salicylate toxicity', value: 1 },
      ],
    },
    {
      id: 'delta_delta',
      label: 'Delta-Delta Ratio: (AG − 12) / (24 − HCO₃)',
      type: 'select',
      source: 'section2',
      autoPopulateFrom: 'test_result',
      options: [
        { label: '<0.4 — Concurrent hyperchloremic (non-AG) acidosis', value: 0 },
        { label: '0.4–1.0 — Mixed AGMA + non-AG acidosis', value: 0 },
        { label: '1.0–2.0 — Pure AGMA (expected)', value: 0 },
        { label: '>2.0 — Concurrent metabolic alkalosis or pre-existing compensated respiratory acidosis', value: 0 },
      ],
    },
  ],
  scoring: {
    method: 'algorithm',
    ranges: [
      {
        min: 0,
        max: 0,
        risk: 'Normal',
        interpretation:
          'Anion Gap ≤12 mEq/L (corrected for albumin): Normal AG. If acidemic, evaluate for non-anion gap metabolic acidosis (HARDUP mnemonic).',
      },
      {
        min: 1,
        max: 1,
        risk: 'Mildly Elevated',
        interpretation:
          'AG 13–19 mEq/L (albumin-corrected): Mildly elevated. AGMA etiology workup warranted.',
      },
      {
        min: 2,
        max: 2,
        risk: 'Elevated',
        interpretation:
          'AG 20–29 mEq/L (albumin-corrected): Moderately elevated AGMA. High concern for significant DKA, lactic acidosis, toxic alcohol, or uremia.',
      },
      {
        min: 3,
        max: 3,
        risk: 'Severely Elevated',
        interpretation:
          'AG ≥30 mEq/L (albumin-corrected): Severely elevated. Urgent evaluation for toxic alcohol, severe lactic acidosis, severe DKA, or salicylate toxicity.',
      },
    ],
  },
  suggestedTreatments: {
    'Severely Elevated': [
      'iv_fluid_resuscitation',
      'lactate_level',
      'abg',
      'osmolar_gap_calculation',
      'toxic_screen',
      'serum_ketones_bhb',
      'poison_control_consult',
      'nephrology_consult',
      'treat_underlying_cause',
    ],
    Elevated: [
      'lactate_level',
      'abg',
      'serum_ketones_bhb',
      'renal_function_panel',
      'treat_underlying_cause',
    ],
    'Mildly Elevated': [
      'lactate_level',
      'serum_ketones',
      'renal_function_panel',
      'treat_underlying_cause',
    ],
    Normal: ['evaluate_non_ag_acidosis_causes', 'abg_if_acidemic'],
  },
}
