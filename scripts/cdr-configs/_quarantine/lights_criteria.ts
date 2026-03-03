// QUARANTINE: lights_criteria
// Reason: 0 user-answerable interactive components.
// Light's Criteria (Light RW et al., Ann Intern Med 1972) classifies pleural effusions
// using 3 lab ratios: pleural protein/serum protein >0.5, pleural LDH/serum LDH >0.6,
// and pleural LDH >2/3 upper limit of normal. All 3 components are section2 (lab results
// from thoracentesis). No clinical history or physician judgment components exist in the
// published criteria.
import type { CdrSeed } from '../types'

export const lightsCriteria: CdrSeed = {
  id: 'lights_criteria',
  name: "Light's Criteria",
  fullName: "Light's Criteria (Pleural Effusion)",
  category: 'PULMONARY',
  application:
    'Differentiates transudative from exudative pleural effusions. Essential for determining the etiology of pleural effusion.',
  applicableChiefComplaints: ['shortness_of_breath', 'chest_pain', 'pleural_effusion'],
  keywords: [
    "Light's criteria",
    'pleural effusion',
    'transudate',
    'exudate',
    'LDH',
    'protein',
    'thoracentesis',
  ],
  requiredTests: ['pleural fluid protein', 'serum protein', 'pleural fluid LDH', 'serum LDH'],
  components: [
    {
      id: 'protein_ratio',
      label: 'Pleural fluid protein / Serum protein ratio >0.5',
      type: 'boolean',
      value: 1,
      source: 'section2',
      autoPopulateFrom: 'test_result',
    },
    {
      id: 'ldh_ratio',
      label: 'Pleural fluid LDH / Serum LDH ratio >0.6',
      type: 'boolean',
      value: 1,
      source: 'section2',
      autoPopulateFrom: 'test_result',
    },
    {
      id: 'ldh_upper_normal',
      label: 'Pleural fluid LDH >2/3 upper limit of normal for serum LDH',
      type: 'boolean',
      value: 1,
      source: 'section2',
      autoPopulateFrom: 'test_result',
    },
  ],
  scoring: {
    method: 'algorithm',
    ranges: [
      {
        min: 0,
        max: 0,
        risk: 'Transudate',
        interpretation:
          'No criteria met. Transudative effusion — caused by systemic factors (CHF, cirrhosis, nephrotic syndrome). Treat the underlying condition.',
      },
      {
        min: 1,
        max: 3,
        risk: 'Exudate',
        interpretation:
          'One or more criteria met. Exudative effusion — caused by local/inflammatory process (infection, malignancy, PE, autoimmune). Requires further workup: cell count, glucose, pH, cytology, cultures.',
      },
    ],
  },
  suggestedTreatments: {
    Transudate: ['treat_underlying_cause', 'diuretics', 'sodium_restriction'],
    Exudate: [
      'pleural_fluid_culture',
      'pleural_fluid_cytology',
      'pulmonology_consult',
      'ct_chest_with_contrast',
    ],
  },
}
