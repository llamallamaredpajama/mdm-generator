/**
 * QUARANTINED: DECAF Score
 *
 * Reason: Only 1 of 5 components is user-answerable (dyspnea eMRCD = section1).
 * The remaining 4 (eosinopenia, consolidation, acidemia, atrial fibrillation) are
 * all genuinely lab/imaging-based (section2). Published source (Steer et al., Thorax
 * 2012) confirms exactly these 5 criteria — cannot add more without fabricating.
 *
 * Source: Steer J, Gibson J, Bourke SC. The DECAF Score: predicting hospital mortality
 *         in exacerbations of chronic obstructive pulmonary disease. Thorax 2012;67:970-976.
 */

import type { CdrSeed } from '../types'

export const decaf: CdrSeed = {
  id: 'decaf',
  name: 'DECAF',
  fullName: 'DECAF Score',
  category: 'PULMONARY',
  application: 'Predicts in-hospital mortality from acute exacerbation of COPD.',
  applicableChiefComplaints: [
    'shortness_of_breath',
    'copd_exacerbation',
    'dyspnea',
  ],
  keywords: [
    'DECAF',
    'COPD',
    'exacerbation',
    'mortality',
    'eosinopenia',
    'atrial fibrillation',
    'acidemia',
    'consolidation',
  ],
  requiredTests: ['eosinophil count', 'arterial blood gas', 'chest x-ray', 'ECG'],
  components: [
    {
      id: 'dyspnea_emrcd',
      label: 'Dyspnea (eMRCD scale)',
      type: 'select',
      source: 'section1',
      autoPopulateFrom: 'narrative_analysis',
      options: [
        { label: 'eMRCD 1–4 (not too breathless to leave the house independently)', value: 0 },
        { label: 'eMRCD 5a (too breathless to leave the house but independent with washing/dressing)', value: 1 },
        { label: 'eMRCD 5b (too breathless to leave the house AND needs help with washing or dressing)', value: 2 },
      ],
    },
    {
      id: 'eosinopenia',
      label: 'Eosinopenia (eosinophils <0.05 × 10⁹/L)',
      type: 'boolean',
      value: 1,
      source: 'section2',
      autoPopulateFrom: 'test_result',
    },
    {
      id: 'consolidation',
      label: 'Consolidation on chest radiograph',
      type: 'boolean',
      value: 1,
      source: 'section2',
      autoPopulateFrom: 'test_result',
    },
    {
      id: 'acidemia',
      label: 'Acidemia (pH <7.30 on arterial blood gas)',
      type: 'boolean',
      value: 1,
      source: 'section2',
      autoPopulateFrom: 'test_result',
    },
    {
      id: 'atrial_fibrillation',
      label: 'Atrial fibrillation on ECG (including new or existing)',
      type: 'boolean',
      value: 1,
      source: 'section2',
      autoPopulateFrom: 'test_result',
    },
  ],
  scoring: {
    method: 'sum',
    ranges: [
      {
        min: 0,
        max: 1,
        risk: 'Low',
        interpretation:
          'DECAF 0–1: 0–1.4% in-hospital mortality. Consider early supported discharge or outpatient management.',
      },
      {
        min: 2,
        max: 2,
        risk: 'Intermediate',
        interpretation:
          'DECAF 2: ~5.3% in-hospital mortality. Standard inpatient management on respiratory ward.',
      },
      {
        min: 3,
        max: 3,
        risk: 'High',
        interpretation:
          'DECAF 3: ~15.3% in-hospital mortality. Consider higher-level monitoring and early escalation planning.',
      },
      {
        min: 4,
        max: 6,
        risk: 'Very High',
        interpretation:
          'DECAF 4–6: 31–50% in-hospital mortality. Consider ICU or high-dependency unit; discuss goals of care.',
      },
    ],
  },
  suggestedTreatments: {
    'Very High': [
      'icu_or_hdu_admission',
      'niv_if_acidotic',
      'iv_corticosteroids',
      'antibiotics',
      'goals_of_care_discussion',
    ],
    High: ['admit_respiratory_ward', 'niv_if_acidotic', 'systemic_corticosteroids', 'antibiotics'],
    Intermediate: ['admit_respiratory_ward', 'systemic_corticosteroids', 'bronchodilators', 'antibiotics'],
    Low: ['early_supported_discharge', 'oral_corticosteroids', 'bronchodilators', 'follow_up_48h'],
  },
}
