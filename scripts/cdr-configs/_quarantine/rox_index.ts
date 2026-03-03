// QUARANTINE: rox_index
// Reason: Only 1 user-answerable interactive component (assessment_time select/user_input).
// The ROX Index (Roca O et al., J Crit Care 2016) is calculated as (SpO2/FiO2)/RR.
// SpO2 and RR are number_range (continuous inputs, not boolean/select), and FiO2 is
// number_range/section2. The only qualifying component is the assessment_time select.
// Cannot add scored components without inventing criteria not in the published source.
import type { CdrSeed } from '../types'

export const roxIndex: CdrSeed = {
  id: 'rox_index',
  name: 'ROX Index',
  fullName: 'ROX Index (HFNC Failure Prediction)',
  category: 'PULMONARY',
  application:
    'Predicts failure of high-flow nasal cannula (HFNC) oxygen therapy, identifying patients who may need intubation.',
  applicableChiefComplaints: ['shortness_of_breath', 'respiratory_failure', 'hypoxia'],
  keywords: [
    'ROX index',
    'HFNC',
    'high flow nasal cannula',
    'intubation',
    'respiratory failure',
    'oxygen therapy',
  ],
  components: [
    {
      id: 'spo2',
      label: 'SpO2 (%)',
      type: 'number_range',
      min: 50,
      max: 100,
      source: 'section1',
      autoPopulateFrom: 'vital_signs',
    },
    {
      id: 'fio2',
      label: 'FiO2 (%, e.g. 60 for 60%)',
      type: 'number_range',
      min: 21,
      max: 100,
      source: 'section2',
    },
    {
      id: 'respiratory_rate',
      label: 'Respiratory Rate (breaths/min)',
      type: 'number_range',
      min: 1,
      max: 60,
      source: 'section1',
      autoPopulateFrom: 'vital_signs',
    },
    {
      id: 'assessment_time',
      label: 'Time on HFNC',
      type: 'select',
      source: 'user_input',
      options: [
        { label: '2 hours', value: 0 },
        { label: '6 hours', value: 1 },
        { label: '12 hours', value: 2 },
      ],
    },
  ],
  scoring: {
    method: 'algorithm',
    ranges: [
      {
        min: 0,
        max: 3,
        risk: 'High Risk',
        interpretation:
          'ROX <3.85 at 2h or <3.47 at 6h or <3.85 at 12h: High risk of HFNC failure. Strongly consider intubation and mechanical ventilation.',
      },
      {
        min: 3,
        max: 4,
        risk: 'Intermediate',
        interpretation:
          'ROX 3.85–4.87: Intermediate risk. Reassess frequently (every 1–2 hours) and trend ROX values.',
      },
      {
        min: 4,
        max: 20,
        risk: 'Low Risk',
        interpretation:
          'ROX >=4.88 at 2, 6, or 12 hours: Low risk of HFNC failure. Continue current HFNC settings with routine monitoring.',
      },
    ],
  },
  suggestedTreatments: {
    'High Risk': ['intubation', 'mechanical_ventilation', 'icu_admission', 'rapid_sequence_intubation'],
    Intermediate: ['continue_hfnc', 'frequent_reassessment', 'icu_monitoring'],
    'Low Risk': ['continue_hfnc', 'routine_monitoring'],
  },
}
