import type { CdrSeed } from '../types'

// QUARANTINE REASON: Pure lab calculation — Expected PaCO2 = (1.5 × HCO3⁻) + 8 ± 2.
// All 2 components are section2 number_range (ABG/lab values). No published clinical
// scoring criteria for interactive components. Source: Albert et al., Ann Intern Med 1967.

export const winters_formula: CdrSeed = {
  id: 'winters_formula',
  name: "Winter's Formula",
  fullName: "Winter's Formula",
  category: 'NEPHROLOGY & ELECTROLYTES',
  application:
    "Predicts expected PaCO2 compensation for metabolic acidosis to identify concurrent respiratory acid-base disorders. Formula: Expected PaCO2 = (1.5 × HCO3⁻) + 8 ± 2.",
  applicableChiefComplaints: ['metabolic_acidosis', 'respiratory_failure', 'acid_base_disorder'],
  keywords: [
    "Winter's formula",
    'metabolic acidosis',
    'respiratory compensation',
    'PaCO2',
    'acid-base',
    'bicarbonate',
    'mixed disorder',
  ],
  requiredTests: ['ABG', 'serum bicarbonate'],
  components: [
    {
      id: 'serum_bicarb',
      label: 'Serum Bicarbonate / HCO3 (mEq/L)',
      type: 'number_range',
      source: 'section2',
      autoPopulateFrom: 'test_result',
      min: 1,
      max: 45,
    },
    {
      id: 'measured_paco2',
      label: 'Measured PaCO2 (mmHg)',
      type: 'number_range',
      source: 'section2',
      autoPopulateFrom: 'test_result',
      min: 5,
      max: 120,
    },
  ],
  scoring: {
    method: 'algorithm',
    ranges: [
      {
        min: 0,
        max: 0,
        risk: 'Appropriate Compensation',
        interpretation:
          'Measured PaCO2 within expected range (1.5 x HCO3 + 8 +/- 2): Appropriate respiratory compensation for simple metabolic acidosis.',
      },
      {
        min: 1,
        max: 1,
        risk: 'Concurrent Respiratory Acidosis',
        interpretation:
          'Measured PaCO2 ABOVE expected range: Concurrent respiratory acidosis (inadequate compensation). Evaluate for respiratory failure, airway compromise, sedation.',
      },
      {
        min: 2,
        max: 2,
        risk: 'Concurrent Respiratory Alkalosis',
        interpretation:
          'Measured PaCO2 BELOW expected range: Concurrent respiratory alkalosis (hyperventilation beyond compensation). Evaluate for pain, anxiety, sepsis, salicylate toxicity, hepatic encephalopathy.',
      },
    ],
  },
}
