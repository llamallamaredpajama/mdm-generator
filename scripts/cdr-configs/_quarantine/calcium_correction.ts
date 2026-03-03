import type { CdrSeed } from '../types'

// QUARANTINE REASON: Pure lab calculation — Corrected Ca = Measured Ca + 0.8 × (4.0 - Albumin).
// All 2 components are section2 number_range (lab values). No published clinical
// scoring criteria for interactive components. Source: Payne et al., Br Med J 1973.

export const calcium_correction: CdrSeed = {
  id: 'calcium_correction',
  name: 'Calcium Correction',
  fullName: 'Calcium Correction for Albumin',
  category: 'NEPHROLOGY & ELECTROLYTES',
  application:
    'Corrects total serum calcium for hypoalbuminemia, since approximately 40% of calcium is protein-bound. Each 1 g/dL decrease in albumin below 4.0 causes total calcium to appear ~0.8 mg/dL lower than the true value.',
  applicableChiefComplaints: ['hypocalcemia', 'hypercalcemia', 'electrolyte_abnormality'],
  keywords: [
    'calcium correction',
    'corrected calcium',
    'albumin',
    'hypocalcemia',
    'hypercalcemia',
    'ionized calcium',
    'protein-bound calcium',
  ],
  requiredTests: ['serum calcium', 'serum albumin'],
  components: [
    {
      id: 'measured_calcium',
      label: 'Measured Total Calcium (mg/dL)',
      type: 'number_range',
      source: 'section2',
      autoPopulateFrom: 'test_result',
      min: 2,
      max: 20,
    },
    {
      id: 'serum_albumin',
      label: 'Serum Albumin (g/dL)',
      type: 'number_range',
      source: 'section2',
      autoPopulateFrom: 'test_result',
      min: 0.5,
      max: 6,
    },
  ],
  scoring: {
    method: 'algorithm',
    ranges: [
      {
        min: 0,
        max: 8.4,
        risk: 'Hypocalcemia',
        interpretation:
          'Corrected calcium <8.5 mg/dL: True hypocalcemia. Evaluate for: hypoparathyroidism, vitamin D deficiency, magnesium depletion, pancreatitis, tumor lysis. Treat symptomatic patients with IV calcium gluconate.',
      },
      {
        min: 8.5,
        max: 10.5,
        risk: 'Normal',
        interpretation:
          'Corrected calcium 8.5-10.5 mg/dL: Normal range. No calcium-specific intervention needed.',
      },
      {
        min: 10.6,
        max: 20,
        risk: 'Hypercalcemia',
        interpretation:
          'Corrected calcium >10.5 mg/dL: True hypercalcemia. Evaluate for: malignancy, primary hyperparathyroidism, granulomatous disease, medication effect (thiazides, lithium). >14 mg/dL is a medical emergency.',
      },
    ],
  },
  suggestedTreatments: {
    Hypocalcemia: ['iv_calcium_gluconate', 'magnesium_repletion', 'vitamin_d_supplementation'],
    Hypercalcemia: [
      'iv_normal_saline',
      'calcitonin',
      'zoledronic_acid',
      'treat_underlying_cause',
    ],
  },
}
