import type { CdrSeed } from './types'

/**
 * RESCUED from quarantine: Kocher Criteria
 *
 * Previously quarantined because lab components used source: 'section2'.
 * Converted lab/imaging components to source: 'user_input' — physicians enter
 * categorical lab results via select/boolean UI.
 * Thresholds verified against Kocher et al., J Bone Joint Surg Am 1999.
 */
export const kocher_criteria: CdrSeed = {
  id: 'kocher_criteria',
  name: 'Kocher Criteria',
  fullName: 'Kocher Criteria',
  category: 'INFECTIOUS DISEASE',
  application:
    'Predicts septic arthritis of the hip in children (typically age 3 months to 18 years) presenting with hip pain and/or refusal to bear weight.',
  applicableChiefComplaints: [
    'hip_pain',
    'limp',
    'joint_pain',
    'fever',
    'refusal_to_bear_weight',
  ],
  keywords: [
    'Kocher',
    'septic arthritis',
    'hip',
    'pediatric',
    'Caird',
    'ESR',
    'CRP',
    'non-weight-bearing',
  ],
  requiredTests: ['ESR', 'WBC', 'CRP'],
  components: [
    {
      id: 'non_weight_bearing',
      label: 'Non-weight-bearing on affected side',
      type: 'boolean',
      value: 1,
      source: 'section1',
      autoPopulateFrom: 'narrative_analysis',
    },
    {
      id: 'esr_gt_40',
      label: 'ESR >40 mm/hr',
      type: 'boolean',
      value: 1,
      source: 'user_input',
    },
    {
      id: 'fever_gt_38_5',
      label: 'Fever >38.5°C (101.3°F)',
      type: 'boolean',
      value: 1,
      source: 'section1',
      autoPopulateFrom: 'narrative_analysis',
    },
    {
      id: 'wbc_gt_12k',
      label: 'WBC >12,000 cells/µL',
      type: 'boolean',
      value: 1,
      source: 'user_input',
    },
  ],
  scoring: {
    method: 'threshold',
    ranges: [
      {
        min: 0,
        max: 0,
        risk: 'Very Low',
        interpretation:
          '0 predictors: ~0.2% probability; observation appropriate',
      },
      {
        min: 1,
        max: 1,
        risk: 'Low',
        interpretation:
          '1 predictor: ~3% probability; consider observation vs. aspiration based on clinical picture',
      },
      {
        min: 2,
        max: 2,
        risk: 'Moderate',
        interpretation:
          '2 predictors: ~40% probability; joint aspiration recommended',
      },
      {
        min: 3,
        max: 3,
        risk: 'High',
        interpretation:
          '3 predictors: ~93.1% probability; aspiration +/- operative intervention',
      },
      {
        min: 4,
        max: 4,
        risk: 'Very High',
        interpretation:
          '4 predictors: ~99.6% probability; operative drainage strongly recommended',
      },
    ],
  },
  suggestedTreatments: {
    'Very High': ['orthopedic_consult_emergent', 'iv_antibiotics', 'operative_drainage'],
    High: ['orthopedic_consult_urgent', 'joint_aspiration', 'iv_antibiotics'],
    Moderate: ['joint_aspiration', 'orthopedic_consult', 'iv_antibiotics'],
    Low: ['observation', 'consider_aspiration'],
    'Very Low': ['observation', 'outpatient_follow_up'],
  },
}
