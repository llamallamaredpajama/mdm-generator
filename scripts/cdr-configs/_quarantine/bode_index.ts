// QUARANTINE: bode_index
// Reason: Only 2 user-answerable interactive components (bmi select/section1, mmrc_dyspnea select/section1).
// The BODE Index (Celli BR et al., NEJM 2004) has exactly 4 components:
// B=BMI (section1), O=FEV1% predicted (section2), D=mMRC Dyspnea (section1),
// E=6-Minute Walk Distance (section2). Only BMI and mMRC qualify as user-answerable.
// FEV1 requires spirometry and 6MWD requires the walk test — both are section2.
// Cannot add components without inventing criteria not in the published source.
import type { CdrSeed } from '../types'

export const bodeIndex: CdrSeed = {
  id: 'bode_index',
  name: 'BODE Index',
  fullName: 'BODE Index (COPD Prognosis)',
  category: 'PULMONARY',
  application:
    'Multidimensional assessment of COPD prognosis. Predicts mortality better than FEV1 alone.',
  applicableChiefComplaints: ['shortness_of_breath', 'copd', 'dyspnea', 'exercise_intolerance'],
  keywords: [
    'BODE',
    'COPD',
    'prognosis',
    'mortality',
    'FEV1',
    'BMI',
    'dyspnea',
    'mMRC',
    '6-minute walk',
  ],
  requiredTests: ['FEV1', '6-minute walk test', 'BMI'],
  components: [
    {
      id: 'bmi',
      label: 'Body Mass Index (BMI)',
      type: 'select',
      source: 'section1',
      autoPopulateFrom: 'narrative_analysis',
      options: [
        { label: 'BMI >21', value: 0 },
        { label: 'BMI <=21', value: 1 },
      ],
    },
    {
      id: 'fev1_percent',
      label: 'FEV1 (% predicted)',
      type: 'select',
      source: 'section2',
      autoPopulateFrom: 'test_result',
      options: [
        { label: '>=65%', value: 0 },
        { label: '50–64%', value: 1 },
        { label: '36–49%', value: 2 },
        { label: '<=35%', value: 3 },
      ],
    },
    {
      id: 'six_mwd',
      label: '6-Minute Walk Distance (meters)',
      type: 'select',
      source: 'section2',
      autoPopulateFrom: 'test_result',
      options: [
        { label: '>=350 m', value: 0 },
        { label: '250–349 m', value: 1 },
        { label: '150–249 m', value: 2 },
        { label: '<=149 m', value: 3 },
      ],
    },
    {
      id: 'mmrc_dyspnea',
      label: 'mMRC Dyspnea Scale',
      type: 'select',
      source: 'section1',
      autoPopulateFrom: 'narrative_analysis',
      options: [
        { label: '0 — Dyspnea only with strenuous exercise', value: 0 },
        { label: '1 — Dyspnea when hurrying on level or walking up slight hill', value: 0 },
        { label: '2 — Walks slower than people of same age or stops for breath on level', value: 1 },
        { label: '3 — Stops for breath after ~100 m or a few minutes on level', value: 2 },
        { label: '4 — Too dyspneic to leave house or breathless dressing/undressing', value: 3 },
      ],
    },
  ],
  scoring: {
    method: 'sum',
    ranges: [
      {
        min: 0,
        max: 2,
        risk: 'Low',
        interpretation: 'Quartile 1: ~15% 4-year mortality. Optimize medical therapy.',
      },
      {
        min: 3,
        max: 4,
        risk: 'Moderate',
        interpretation:
          'Quartile 2: ~25% 4-year mortality. Pulmonary rehabilitation, optimize bronchodilators.',
      },
      {
        min: 5,
        max: 6,
        risk: 'High',
        interpretation:
          'Quartile 3: ~45% 4-year mortality. Consider lung volume reduction surgery evaluation.',
      },
      {
        min: 7,
        max: 10,
        risk: 'Very High',
        interpretation:
          'Quartile 4: ~80% 4-year mortality. Discuss palliative care, goals of care, transplant evaluation.',
      },
    ],
  },
  suggestedTreatments: {
    'Very High': ['palliative_care_consult', 'transplant_evaluation', 'pulmonology_consult'],
    High: ['pulmonary_rehabilitation', 'pulmonology_consult', 'lvrs_evaluation'],
    Moderate: ['pulmonary_rehabilitation', 'optimize_bronchodilators'],
    Low: ['continue_current_therapy', 'smoking_cessation'],
  },
}
