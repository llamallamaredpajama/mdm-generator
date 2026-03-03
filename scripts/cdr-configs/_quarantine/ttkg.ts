import type { CdrSeed } from '../types'

// QUARANTINE REASON: Pure lab calculation — TTKG = (Urine K / Serum K) × (Serum Osm / Urine Osm).
// All 5 components are section2 number_range (lab values). No published clinical
// scoring criteria for interactive components. Source: Ethier et al., Am J Kidney Dis 1990.

export const ttkg: CdrSeed = {
  id: 'ttkg',
  name: 'TTKG',
  fullName: 'Transtubular Potassium Gradient (TTKG)',
  category: 'NEPHROLOGY & ELECTROLYTES',
  application:
    'Assesses renal potassium handling to distinguish renal from extrarenal causes of hyperkalemia or hypokalemia. Requires urine osmolality > plasma osmolality and urine Na+ >25 mEq/L.',
  applicableChiefComplaints: ['hyperkalemia', 'hypokalemia', 'electrolyte_abnormality'],
  keywords: [
    'TTKG',
    'transtubular potassium gradient',
    'hyperkalemia',
    'hypokalemia',
    'aldosterone',
    'renal potassium wasting',
  ],
  requiredTests: [
    'urine potassium',
    'serum potassium',
    'urine osmolality',
    'plasma osmolality',
    'urine sodium',
  ],
  components: [
    {
      id: 'urine_potassium',
      label: 'Urine Potassium (mEq/L)',
      type: 'number_range',
      source: 'section2',
      autoPopulateFrom: 'test_result',
      min: 0,
      max: 200,
    },
    {
      id: 'serum_potassium',
      label: 'Serum Potassium (mEq/L)',
      type: 'number_range',
      source: 'section2',
      autoPopulateFrom: 'test_result',
      min: 1,
      max: 10,
    },
    {
      id: 'serum_osmolality',
      label: 'Serum Osmolality (mOsm/kg)',
      type: 'number_range',
      source: 'section2',
      autoPopulateFrom: 'test_result',
      min: 200,
      max: 400,
    },
    {
      id: 'urine_osmolality',
      label: 'Urine Osmolality (mOsm/kg)',
      type: 'number_range',
      source: 'section2',
      autoPopulateFrom: 'test_result',
      min: 50,
      max: 1400,
    },
    {
      id: 'urine_sodium',
      label: 'Urine Sodium (mEq/L) (must be >25 for TTKG validity)',
      type: 'number_range',
      source: 'section2',
      autoPopulateFrom: 'test_result',
      min: 0,
      max: 300,
    },
  ],
  scoring: {
    method: 'algorithm',
    ranges: [
      {
        min: 0,
        max: 2,
        risk: 'Appropriate Conservation',
        interpretation:
          'TTKG <2 in hypokalemia: Appropriate renal K+ conservation; cause is extrarenal (GI losses, transcellular shift, inadequate intake).',
      },
      {
        min: 3,
        max: 5,
        risk: 'Renal Wasting (Hypokalemia)',
        interpretation:
          'TTKG >3 in hypokalemia: Renal potassium wasting; consider hyperaldosteronism, diuretics, renal tubular acidosis, Bartter/Gitelman syndrome.',
      },
      {
        min: 6,
        max: 7,
        risk: 'Indeterminate (Hyperkalemia)',
        interpretation:
          'TTKG 6-7 in hyperkalemia: Borderline aldosterone effect; clinical correlation needed. May indicate early aldosterone deficiency or resistance.',
      },
      {
        min: 8,
        max: 20,
        risk: 'Appropriate Excretion (Hyperkalemia)',
        interpretation:
          'TTKG >8 in hyperkalemia: Appropriate renal K+ excretion; cause is extrarenal (cellular shift, tissue breakdown, exogenous load).',
      },
    ],
  },
}
