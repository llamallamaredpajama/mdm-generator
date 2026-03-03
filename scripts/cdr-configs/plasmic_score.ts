import type { CdrSeed } from './types'

/**
 * RESCUED from quarantine: PLASMIC Score
 *
 * Previously quarantined because lab components used source: 'section2'.
 * Converted lab/imaging components to source: 'user_input' — physicians enter
 * categorical lab results via select/boolean UI.
 * Thresholds verified against Bendapudi et al., Lancet Haematol 2017 and MDCalc.
 */

export const plasmic_score: CdrSeed = {
  id: 'plasmic_score',
  name: 'PLASMIC Score',
  fullName: 'PLASMIC Score (for TTP)',
  category: 'ONCOLOGIC EMERGENCY',
  application:
    'Predicts likelihood of ADAMTS13 severe deficiency (thrombotic thrombocytopenic purpura) to guide empiric plasma exchange before ADAMTS13 results return.',
  applicableChiefComplaints: [
    'thrombocytopenia',
    'microangiopathic_hemolytic_anemia',
    'ttp',
    'tma',
  ],
  keywords: [
    'PLASMIC',
    'TTP',
    'thrombotic thrombocytopenic purpura',
    'ADAMTS13',
    'plasma exchange',
    'TMA',
    'thrombotic microangiopathy',
    'MAHA',
  ],
  requiredTests: [
    'platelet count',
    'reticulocyte count',
    'haptoglobin',
    'bilirubin',
    'MCV',
    'INR',
    'creatinine',
  ],
  components: [
    {
      id: 'platelet_low',
      label: 'Platelet count <30,000/uL',
      type: 'boolean',
      value: 1,
      source: 'user_input',
    },
    {
      id: 'hemolysis_variable',
      label: 'Combined hemolysis variable (reticulocyte count >2.5%, undetectable haptoglobin, OR indirect bilirubin >2.0 mg/dL)',
      type: 'boolean',
      value: 1,
      source: 'user_input',
    },
    {
      id: 'no_active_cancer',
      label: 'No active cancer (no malignancy treated or diagnosed in past year)',
      type: 'boolean',
      value: 1,
      source: 'section1',
      autoPopulateFrom: 'narrative_analysis',
    },
    {
      id: 'no_solid_organ_transplant',
      label: 'No history of solid-organ or stem-cell transplant',
      type: 'boolean',
      value: 1,
      source: 'section1',
      autoPopulateFrom: 'narrative_analysis',
    },
    {
      id: 'mcv_low',
      label: 'MCV <90 fL',
      type: 'boolean',
      value: 1,
      source: 'user_input',
    },
    {
      id: 'inr_low',
      label: 'INR <1.5',
      type: 'boolean',
      value: 1,
      source: 'user_input',
    },
    {
      id: 'creatinine_low',
      label: 'Creatinine <2.0 mg/dL',
      type: 'boolean',
      value: 1,
      source: 'user_input',
    },
  ],
  scoring: {
    method: 'sum',
    ranges: [
      {
        min: 0,
        max: 4,
        risk: 'Low Risk',
        interpretation:
          'PLASMIC 0-4: ADAMTS13 severely deficient in 0-4%. TTP unlikely; consider alternative diagnoses (HUS, DIC, HELLP, malignant HTN).',
      },
      {
        min: 5,
        max: 5,
        risk: 'Intermediate Risk',
        interpretation:
          'PLASMIC 5: ADAMTS13 severely deficient in ~24%. Close monitoring; send ADAMTS13 activity level; consider hematology consult.',
      },
      {
        min: 6,
        max: 7,
        risk: 'High Risk',
        interpretation:
          'PLASMIC 6-7: ADAMTS13 severely deficient in 62-82%. Strongly consider initiating empiric plasma exchange (TPE) before ADAMTS13 results return.',
      },
    ],
  },
  suggestedTreatments: {
    'High Risk': [
      'emergent_plasma_exchange',
      'hematology_consult',
      'steroids',
      'avoid_platelet_transfusion',
      'send_adamts13',
    ],
    'Intermediate Risk': [
      'hematology_consult',
      'send_adamts13',
      'close_monitoring',
      'prepare_for_possible_tpe',
    ],
    'Low Risk': ['evaluate_alternative_diagnoses', 'send_adamts13', 'supportive_care'],
  },
}
