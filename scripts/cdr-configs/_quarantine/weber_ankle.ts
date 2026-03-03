/**
 * QUARANTINED: Weber Classification (Ankle Fractures)
 *
 * Reason: Single component (fracture_type) is entirely imaging-based (section2).
 * 0 user-answerable components. This is a radiographic classification system
 * (Danis-Weber), not a clinical decision rule with user-input criteria.
 *
 * Source: Weber BG. Die Verletzungen des oberen Sprunggelenkes. 2nd ed.
 *         Bern: Huber; 1972. AO Foundation classification.
 */

import type { CdrSeed } from '../types'

export const weber_ankle: CdrSeed = {
  id: 'weber_ankle',
  name: 'Weber Classification',
  fullName: 'Weber Classification (Ankle Fractures)',
  category: 'ORTHOPEDIC & MUSCULOSKELETAL',
  application:
    'Classifies lateral malleolus fractures by location relative to the syndesmosis to determine stability and need for surgical fixation.',
  applicableChiefComplaints: ['ankle_fracture', 'ankle_injury', 'ankle_pain', 'trauma'],
  keywords: [
    'Weber',
    'ankle fracture',
    'fibula fracture',
    'syndesmosis',
    'lateral malleolus',
    'infrasyndesmotic',
    'transsyndesmotic',
    'suprasyndesmotic',
  ],
  requiredTests: ['plain radiographs (ankle AP, lateral, mortise)'],
  components: [
    {
      id: 'fracture_type',
      label: 'Weber Fracture Classification',
      type: 'select',
      source: 'section2',
      autoPopulateFrom: 'test_result',
      options: [
        {
          label: 'Type A: Infrasyndesmotic (below tibiotalar joint line); tibiofibular ligaments intact',
          value: 1,
        },
        {
          label: 'Type B: Transsyndesmotic (at level of syndesmosis); syndesmosis may be partially disrupted',
          value: 2,
        },
        {
          label: 'Type C: Suprasyndesmotic (above syndesmosis); obligatory syndesmotic disruption',
          value: 3,
        },
      ],
    },
  ],
  scoring: {
    method: 'algorithm',
    ranges: [
      {
        min: 1,
        max: 1,
        risk: 'Weber A - Stable',
        interpretation:
          'Below syndesmosis; tibiofibular ligaments intact; typically non-operative (walking boot or cast).',
      },
      {
        min: 2,
        max: 2,
        risk: 'Weber B - Potentially Unstable',
        interpretation:
          'At level of syndesmosis; may be disrupted; stress test to determine stability; fixation if unstable.',
      },
      {
        min: 3,
        max: 3,
        risk: 'Weber C - Unstable',
        interpretation:
          'Above syndesmosis; obligatory syndesmotic disruption; almost always requires operative fixation.',
      },
    ],
  },
  suggestedTreatments: {
    'Weber C - Unstable': ['orthopedic_consult_urgent', 'orif', 'syndesmotic_fixation', 'non_weight_bearing'],
    'Weber B - Potentially Unstable': ['stress_radiographs', 'orthopedic_consult', 'orif_if_unstable', 'cast_boot_if_stable'],
    'Weber A - Stable': ['walking_boot_or_cast', 'weight_bearing_as_tolerated', 'orthopedic_follow_up'],
  },
}
