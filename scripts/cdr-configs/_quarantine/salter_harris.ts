/**
 * QUARANTINED: Salter-Harris Classification (Pediatric Fractures)
 *
 * Reason: Single component (fracture_type) is entirely imaging-based (section2).
 * 0 user-answerable components. This is a radiographic classification system,
 * not a clinical decision rule with user-input criteria.
 *
 * Source: Salter RB, Harris WR. Injuries involving the epiphyseal plate.
 *         J Bone Joint Surg Am 1963;45(3):587-622.
 */

import type { CdrSeed } from '../types'

export const salter_harris: CdrSeed = {
  id: 'salter_harris',
  name: 'Salter-Harris',
  fullName: 'Salter-Harris Classification (Pediatric Fractures)',
  category: 'ORTHOPEDIC & MUSCULOSKELETAL',
  application:
    'Classifies physeal (growth plate) fractures in children to guide management and predict growth disturbance risk. Type II is the most common (~75% of all Salter-Harris fractures).',
  applicableChiefComplaints: ['pediatric_fracture', 'growth_plate_injury', 'extremity_injury', 'trauma'],
  keywords: [
    'Salter-Harris',
    'growth plate',
    'physis',
    'epiphysis',
    'physeal fracture',
    'pediatric fracture',
    'SALTR',
    'avascular necrosis',
  ],
  requiredTests: ['plain radiographs'],
  components: [
    {
      id: 'fracture_type',
      label: 'Salter-Harris Fracture Type',
      type: 'select',
      source: 'section2',
      autoPopulateFrom: 'test_result',
      options: [
        {
          label: 'Type I: Fracture through physis only (widened physis, no visible fracture line; often diagnosed clinically)',
          value: 1,
        },
        {
          label: 'Type II: Fracture through physis + metaphysis (Thurston-Holland fragment; most common ~75%)',
          value: 2,
        },
        {
          label: 'Type III: Fracture through physis + epiphysis (intra-articular; requires anatomic reduction)',
          value: 3,
        },
        {
          label: 'Type IV: Fracture through metaphysis + physis + epiphysis (intra-articular; requires ORIF)',
          value: 4,
        },
        {
          label: 'Type V: Crush injury to physis (rare; often diagnosed retrospectively by growth arrest)',
          value: 5,
        },
      ],
    },
  ],
  scoring: {
    method: 'algorithm',
    ranges: [
      {
        min: 1,
        max: 2,
        risk: 'Low Growth Disturbance Risk',
        interpretation:
          'Type I-II: Good prognosis; closed reduction usually adequate; low risk of growth arrest.',
      },
      {
        min: 3,
        max: 4,
        risk: 'Moderate-High Growth Disturbance Risk',
        interpretation:
          'Type III-IV: Anatomic reduction required (often surgical); higher risk of growth arrest.',
      },
      {
        min: 5,
        max: 5,
        risk: 'Highest Growth Disturbance Risk',
        interpretation:
          'Type V: Crush injury to physis; often diagnosed retrospectively; worst prognosis for growth arrest.',
      },
    ],
  },
  suggestedTreatments: {
    'Highest Growth Disturbance Risk': ['orthopedic_consult_urgent', 'immobilization', 'growth_plate_monitoring', 'mri_consideration'],
    'Moderate-High Growth Disturbance Risk': ['orthopedic_consult', 'orif_consideration', 'anatomic_reduction', 'growth_plate_monitoring'],
    'Low Growth Disturbance Risk': ['closed_reduction', 'casting_splinting', 'orthopedic_follow_up', 'growth_plate_monitoring'],
  },
}
