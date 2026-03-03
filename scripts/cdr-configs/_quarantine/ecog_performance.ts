import type { CdrSeed } from '../types'

// QUARANTINE REASON: Single-dimension classification scale — ECOG Performance Status
// is a single holistic select (0-5) based on physician assessment. The published
// source (Oken et al., Am J Clin Oncol 1982) defines it as one ordinal scale,
// not a composite of multiple scored criteria. Cannot decompose into >=3 user-answerable
// interactive components without inventing criteria not in the published source.

export const ecog_performance: CdrSeed = {
  id: 'ecog_performance',
  name: 'ECOG Performance Status',
  fullName: 'ECOG Performance Status',
  category: 'ONCOLOGIC EMERGENCY',
  application:
    'Standardized assessment of cancer patient functional status used for treatment decisions and clinical trial eligibility. Correlates with survival across most cancer types.',
  applicableChiefComplaints: [
    'oncologic_emergency',
    'cancer_related_weakness',
    'functional_decline',
  ],
  keywords: [
    'ECOG',
    'performance status',
    'functional status',
    'cancer',
    'oncology',
    'clinical trial eligibility',
    'Eastern Cooperative Oncology Group',
  ],
  components: [
    {
      id: 'ecog_grade',
      label: 'ECOG Performance Status Grade',
      type: 'select',
      source: 'section1',
      autoPopulateFrom: 'narrative_analysis',
      options: [
        {
          label: '0 - Fully active, able to carry on all pre-disease performance without restriction',
          value: 0,
        },
        {
          label: '1 - Restricted in physically strenuous activity but ambulatory and able to carry out work of a light or sedentary nature',
          value: 1,
        },
        {
          label: '2 - Ambulatory and capable of all self-care but unable to carry out any work activities; up and about >50% of waking hours',
          value: 2,
        },
        {
          label: '3 - Capable of only limited self-care; confined to bed or chair >50% of waking hours',
          value: 3,
        },
        {
          label: '4 - Completely disabled; cannot carry on any self-care; totally confined to bed or chair',
          value: 4,
        },
        { label: '5 - Dead', value: 5 },
      ],
    },
  ],
  scoring: {
    method: 'sum',
    ranges: [
      {
        min: 0,
        max: 1,
        risk: 'Good',
        interpretation:
          'ECOG 0-1: Good functional status. Generally eligible for aggressive chemotherapy regimens and clinical trials.',
      },
      {
        min: 2,
        max: 2,
        risk: 'Moderate',
        interpretation:
          'ECOG 2: Moderate functional limitation. May still benefit from treatment; case-by-case decision with oncology. Some clinical trials accept ECOG 0-2.',
      },
      {
        min: 3,
        max: 4,
        risk: 'Poor',
        interpretation:
          'ECOG 3-4: Poor functional status. Limited benefit from most cytotoxic therapies; consider palliative/supportive care focus. Discuss goals of care.',
      },
      {
        min: 5,
        max: 5,
        risk: 'Deceased',
        interpretation: 'ECOG 5: Dead.',
      },
    ],
  },
  suggestedTreatments: {
    Poor: ['palliative_care_consult', 'goals_of_care_discussion', 'symptom_management'],
    Moderate: ['oncology_consult', 'case_by_case_treatment_decision'],
    Good: ['standard_oncologic_therapy', 'clinical_trial_eligibility'],
  },
}
