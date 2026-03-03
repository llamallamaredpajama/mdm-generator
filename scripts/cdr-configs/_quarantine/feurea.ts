import type { CdrSeed } from '../types'

// QUARANTINE REASON: Pure lab calculation — FEUrea = (Urine Urea × Serum Cr) / (Serum Urea × Urine Cr) × 100.
// All 4 components are section2 number_range (lab values). No published clinical
// scoring criteria for interactive components. Source: Carvounis et al., Am J Kidney Dis 2002.

export const feurea: CdrSeed = {
  id: 'feurea',
  name: 'FEUrea',
  fullName: 'Fractional Excretion of Urea (FEUrea)',
  category: 'NEPHROLOGY & ELECTROLYTES',
  application:
    'Alternative to FENa when the patient is on diuretics. Urea handling is less affected by diuretics than sodium, making this the preferred test in diuretic-treated patients.',
  applicableChiefComplaints: ['acute_kidney_injury', 'oliguria', 'elevated_creatinine'],
  keywords: [
    'FEUrea',
    'fractional excretion of urea',
    'prerenal',
    'ATN',
    'diuretics',
    'AKI differentiation',
  ],
  requiredTests: ['urine urea', 'plasma urea', 'urine creatinine', 'serum creatinine'],
  components: [
    {
      id: 'urine_urea',
      label: 'Urine Urea (mg/dL)',
      type: 'number_range',
      source: 'section2',
      autoPopulateFrom: 'test_result',
      min: 0,
      max: 3000,
    },
    {
      id: 'serum_urea',
      label: 'Serum Urea / BUN (mg/dL)',
      type: 'number_range',
      source: 'section2',
      autoPopulateFrom: 'test_result',
      min: 1,
      max: 200,
    },
    {
      id: 'urine_creatinine',
      label: 'Urine Creatinine (mg/dL)',
      type: 'number_range',
      source: 'section2',
      autoPopulateFrom: 'test_result',
      min: 0,
      max: 500,
    },
    {
      id: 'serum_creatinine',
      label: 'Serum Creatinine (mg/dL)',
      type: 'number_range',
      source: 'section2',
      autoPopulateFrom: 'test_result',
      min: 0.1,
      max: 30,
    },
  ],
  scoring: {
    method: 'algorithm',
    ranges: [
      {
        min: 0,
        max: 35,
        risk: 'Prerenal',
        interpretation:
          'FEUrea <35%: Prerenal azotemia; tubular urea reabsorption preserved despite diuretic use.',
      },
      {
        min: 35,
        max: 50,
        risk: 'Indeterminate',
        interpretation:
          'FEUrea 35-50%: Indeterminate zone; clinical correlation required. Consider repeat testing or additional workup.',
      },
      {
        min: 50,
        max: 100,
        risk: 'Intrinsic Renal',
        interpretation:
          'FEUrea >50%: Intrinsic renal disease (ATN or other parenchymal injury); impaired tubular urea reabsorption.',
      },
    ],
  },
  suggestedTreatments: {
    Prerenal: ['iv_fluid_resuscitation', 'discontinue_nephrotoxins', 'optimize_hemodynamics'],
    'Intrinsic Renal': [
      'nephrology_consult',
      'discontinue_nephrotoxins',
      'renal_supportive_care',
    ],
  },
}
