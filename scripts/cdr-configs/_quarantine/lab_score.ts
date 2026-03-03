import type { CdrSeed } from '../types'

/**
 * QUARANTINED: lab_score
 *
 * Reason: 0 user-answerable components.
 * Lab-Score (Galetto-Lacour et al., Pediatrics 2003, 2008) is a purely biomarker-based
 * scoring tool using: Procalcitonin (PCT), C-Reactive Protein (CRP), and urine dipstick.
 * All 3 components are lab results (section2). There are no clinical assessment components
 * in the published scoring system. Cannot reach the minimum 3 user-answerable components
 * without inventing criteria not in the original publication.
 */
export const labScore: CdrSeed = {
  id: 'lab_score',
  name: 'Lab-Score',
  fullName: 'Lab-Score',
  category: 'INFECTIOUS DISEASE',
  application:
    'Biomarker-based risk stratification for febrile infants (7–90 days). Uses procalcitonin, CRP, and urine dipstick to estimate serious bacterial infection risk.',
  applicableChiefComplaints: ['fever', 'infant_fever', 'neonatal_fever'],
  keywords: [
    'Lab-Score',
    'febrile infant',
    'procalcitonin',
    'CRP',
    'serious bacterial infection',
    'SBI',
    '7-90 days',
    'biomarker',
  ],
  requiredTests: ['procalcitonin', 'CRP', 'urinalysis'],
  components: [
    {
      id: 'procalcitonin',
      label: 'Procalcitonin (PCT)',
      type: 'select',
      source: 'section2',
      autoPopulateFrom: 'test_result',
      options: [
        { label: 'PCT <0.5 ng/mL', value: 0 },
        { label: 'PCT ≥0.5 ng/mL', value: 2 },
      ],
    },
    {
      id: 'crp',
      label: 'C-Reactive Protein (CRP)',
      type: 'select',
      source: 'section2',
      autoPopulateFrom: 'test_result',
      options: [
        { label: 'CRP <40 mg/L', value: 0 },
        { label: 'CRP ≥40 mg/L', value: 4 },
      ],
    },
    {
      id: 'urine_dipstick',
      label: 'Urine Dipstick (leukocyte esterase or nitrites)',
      type: 'select',
      source: 'section2',
      autoPopulateFrom: 'test_result',
      options: [
        { label: 'Negative (no leukocyte esterase, no nitrites)', value: 0 },
        { label: 'Positive (leukocyte esterase and/or nitrites)', value: 1 },
      ],
    },
  ],
  scoring: {
    method: 'sum',
    ranges: [
      {
        min: 0,
        max: 0,
        risk: 'Very Low',
        interpretation: 'Score 0: Very low risk of SBI (<3%)',
      },
      {
        min: 1,
        max: 2,
        risk: 'Low',
        interpretation: 'Score 1–2: Low-intermediate risk; close monitoring and re-evaluation',
      },
      {
        min: 3,
        max: 7,
        risk: 'High',
        interpretation:
          'Score ≥3: High risk of SBI; full workup and empiric treatment indicated',
      },
    ],
  },
  suggestedTreatments: {
    High: [
      'full_sepsis_workup',
      'empiric_iv_antibiotics',
      'admit',
      'blood_culture',
      'urine_culture',
      'csf_if_indicated',
    ],
    Low: ['observation', 'close_follow_up', 'consider_outpatient_if_well_appearing'],
    'Very Low': ['outpatient_management', 'close_follow_up_24h', 'return_precautions'],
  },
}
