import type { CdrSeed } from '../types'

/**
 * QUARANTINED: Baux Score (Burn Mortality)
 *
 * Reason: Only 1 user-answerable component (inhalation_injury boolean).
 * The other 2 components (patient_age, tbsa_percent) are number_range
 * representing continuous formula inputs: Score = Age + %TBSA (+ 17 if
 * inhalation). The Baux score was published as a continuous formula, not
 * a categorized scoring system. Converting age/TBSA to select categories
 * would alter the published tool and lose precision.
 *
 * Source: Baux S, Contribution à l'étude du traitement local des brûlures
 *         thermiques étendues, 1961
 */
export const baux_score: CdrSeed = {
  id: 'baux_score',
  name: 'Baux Score',
  fullName: 'Baux Score (Burn Mortality)',
  category: 'BURNS & WOUND MANAGEMENT',
  application:
    'Simple predictor of mortality in burn patients. Original: Age + %TBSA. Modified version adds 17 points for inhalation injury.',
  applicableChiefComplaints: ['burns', 'burn_injury', 'thermal_injury', 'inhalation_injury'],
  keywords: [
    'Baux score',
    'burn mortality',
    'modified Baux',
    'inhalation injury',
    'TBSA',
    'burn prognosis',
  ],
  components: [
    {
      id: 'patient_age',
      label: 'Patient Age (years)',
      type: 'number_range',
      source: 'section1',
      autoPopulateFrom: 'narrative_analysis',
      min: 0,
      max: 120,
    },
    {
      id: 'tbsa_percent',
      label: 'TBSA Burned (%)',
      type: 'number_range',
      source: 'section1',
      min: 0,
      max: 100,
    },
    {
      id: 'inhalation_injury',
      label: 'Inhalation injury present (adds 17 points in modified Baux)',
      type: 'boolean',
      value: 17,
      source: 'section1',
      autoPopulateFrom: 'narrative_analysis',
    },
  ],
  scoring: {
    method: 'algorithm',
    ranges: [
      {
        min: 0,
        max: 79,
        risk: 'Generally Survivable',
        interpretation: 'Score <80: Generally survivable with modern burn care',
      },
      {
        min: 80,
        max: 109,
        risk: 'Significant Risk',
        interpretation:
          'Score 80–109: Significant mortality risk; aggressive management warranted',
      },
      {
        min: 110,
        max: 129,
        risk: 'Near LD50',
        interpretation:
          'Score 110–120: LD50 in modern burn centers; serious prognosis discussion',
      },
      {
        min: 130,
        max: 237,
        risk: 'Near-Fatal',
        interpretation:
          'Score >130 (modified) or >140 (original): Near-uniformly fatal; consider comfort care discussion',
      },
    ],
  },
  suggestedTreatments: {
    'Near-Fatal': [
      'burn_center_transfer',
      'goals_of_care_discussion',
      'palliative_care_consultation',
      'comfort_measures',
    ],
    'Near LD50': [
      'burn_center_icu',
      'aggressive_fluid_resuscitation',
      'goals_of_care_discussion',
      'intubation_if_inhalation_injury',
    ],
    'Significant Risk': [
      'burn_center_transfer',
      'parkland_fluid_resuscitation',
      'intubation_if_inhalation_injury',
      'escharotomy_evaluation',
    ],
    'Generally Survivable': [
      'burn_center_referral_if_criteria_met',
      'fluid_resuscitation',
      'wound_care',
      'pain_management',
    ],
  },
}
