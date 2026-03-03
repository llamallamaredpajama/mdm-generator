import type { CdrSeed } from '../types'

// QUARANTINE REASON: Single-dimension classification scale — Karnofsky Performance Status
// is a single holistic select (0-100 in 10-point increments) based on physician assessment.
// The published source (Karnofsky & Burchenal, 1949) defines it as one ordinal scale,
// not a composite of multiple scored criteria. Cannot decompose into >=3 user-answerable
// interactive components without inventing criteria not in the published source.

export const karnofsky_ps: CdrSeed = {
  id: 'karnofsky_ps',
  name: 'Karnofsky Performance Status',
  fullName: 'Karnofsky Performance Status (KPS)',
  category: 'ONCOLOGIC EMERGENCY',
  application:
    'Numeric rating of functional status on 0-100 scale. More granular than ECOG. Widely used in neuro-oncology and palliative care.',
  applicableChiefComplaints: [
    'oncologic_emergency',
    'cancer_related_weakness',
    'functional_decline',
    'palliative_care',
  ],
  keywords: [
    'KPS',
    'Karnofsky',
    'performance status',
    'cancer',
    'functional status',
    'neuro-oncology',
    'palliative',
  ],
  components: [
    {
      id: 'kps_score',
      label: 'Karnofsky Performance Status Score',
      type: 'select',
      source: 'section1',
      autoPopulateFrom: 'narrative_analysis',
      options: [
        { label: '100 - Normal; no complaints; no evidence of disease', value: 100 },
        { label: '90 - Able to carry on normal activity; minor signs or symptoms of disease', value: 90 },
        { label: '80 - Normal activity with effort; some signs or symptoms of disease', value: 80 },
        { label: '70 - Cares for self but unable to carry on normal activity or active work', value: 70 },
        { label: '60 - Requires occasional assistance but able to care for most personal needs', value: 60 },
        { label: '50 - Requires considerable assistance and frequent medical care', value: 50 },
        { label: '40 - Disabled; requires special care and assistance', value: 40 },
        { label: '30 - Severely disabled; hospitalization indicated though death not imminent', value: 30 },
        { label: '20 - Very sick; hospitalization and active supportive care necessary', value: 20 },
        { label: '10 - Moribund; fatal processes progressing rapidly', value: 10 },
        { label: '0 - Dead', value: 0 },
      ],
    },
  ],
  scoring: {
    method: 'algorithm',
    ranges: [
      {
        min: 0,
        max: 0,
        risk: 'Deceased',
        interpretation: 'KPS 0: Dead.',
      },
      {
        min: 10,
        max: 40,
        risk: 'Significant Disability',
        interpretation:
          'KPS 10-40: Unable to care for self; requires institutional or equivalent care. Consider hospice referral (KPS <=40 median survival ~1-3 months). Palliative focus.',
      },
      {
        min: 50,
        max: 60,
        risk: 'Moderate Disability',
        interpretation:
          'KPS 50-60: Requires varying amounts of assistance. Carefully weigh treatment benefit vs. burden with oncology. Some therapies may still improve quality of life.',
      },
      {
        min: 70,
        max: 100,
        risk: 'Independent',
        interpretation:
          'KPS 70-100: Able to live at home and care for most personal needs with varying degrees of assistance. Generally eligible for active cancer treatment.',
      },
    ],
  },
  suggestedTreatments: {
    'Significant Disability': [
      'palliative_care_consult',
      'hospice_evaluation',
      'goals_of_care_discussion',
      'symptom_management',
    ],
    'Moderate Disability': [
      'oncology_consult',
      'palliative_care_consult',
      'case_by_case_treatment_decision',
    ],
    Independent: ['standard_oncologic_therapy', 'continue_current_regimen'],
  },
}
