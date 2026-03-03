import type { CdrSeed } from '../types'

/**
 * QUARANTINED: Garden Classification (Hip Fractures)
 *
 * Reason: The sole component (Garden Type I-IV) is imaging-based (section2).
 * 0 user-answerable components. This is a radiographic fracture classification
 * system — the physician classifies the fracture by viewing X-rays.
 * There are no clinical criteria to add from the published source
 * (Garden RS, J Bone Joint Surg Br 1961).
 */
export const garden_hip: CdrSeed = {
  id: 'garden_hip',
  name: 'Garden Classification',
  fullName: 'Garden Classification (Hip Fractures)',
  category: 'ORTHOPEDIC & MUSCULOSKELETAL',
  application:
    'Classifies femoral neck fractures by displacement to guide surgical management (internal fixation vs. arthroplasty). Garden III–IV carry high risk of avascular necrosis.',
  applicableChiefComplaints: ['hip_fracture', 'hip_pain', 'fall_injury', 'trauma'],
  keywords: [
    'Garden',
    'femoral neck fracture',
    'hip fracture',
    'avascular necrosis',
    'AVN',
    'hemiarthroplasty',
    'total hip arthroplasty',
    'intracapsular fracture',
  ],
  requiredTests: ['plain radiographs (hip AP and lateral)'],
  components: [
    {
      id: 'garden_type',
      label: 'Garden Type',
      type: 'select',
      source: 'section2',
      autoPopulateFrom: 'test_result',
      options: [
        { label: 'Type I — Incomplete / valgus impacted (trabeculae angulated but intact)', value: 1 },
        { label: 'Type II — Complete but non-displaced (trabeculae interrupted, no shift)', value: 2 },
        { label: 'Type III — Complete, partially displaced (femoral head rotated, some contact)', value: 3 },
        { label: 'Type IV — Complete, fully displaced (no contact between fragments)', value: 4 },
      ],
    },
  ],
  scoring: {
    method: 'algorithm',
    ranges: [
      {
        min: 1,
        max: 2,
        risk: 'Non-Displaced',
        interpretation:
          'Garden I–II: Non-displaced; lower AVN risk; internal fixation with cannulated screws preferred',
      },
      {
        min: 3,
        max: 4,
        risk: 'Displaced',
        interpretation:
          'Garden III–IV: Displaced; high AVN risk (20–35%); arthroplasty (hemiarthroplasty vs THA based on age/activity)',
      },
    ],
  },
  suggestedTreatments: {
    'Non-Displaced': ['cannulated_screw_fixation', 'ortho_consult', 'non_weight_bearing'],
    Displaced: ['arthroplasty', 'ortho_consult', 'admit_surgical'],
  },
}
