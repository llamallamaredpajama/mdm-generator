import type { CdrSeed } from '../types'

// QUARANTINE REASON: Lab formula — eGFR = k × Height(cm) / Serum Creatinine(mg/dL).
// Only 1 user-answerable component (k_constant select, source: user_input).
// The other inputs are a physical measurement (height, number_range) and a lab value
// (creatinine, section2). Cannot reach >=3 user-answerable interactive components
// without inventing criteria. Source: Schwartz et al., Pediatrics 2009.

export const schwartz_equation: CdrSeed = {
  id: 'schwartz_equation',
  name: 'Schwartz Equation',
  fullName: 'Schwartz Equation (Pediatric GFR)',
  category: 'NEPHROLOGY & ELECTROLYTES',
  application:
    'Estimates GFR in children using serum creatinine and height. Use the 2009 bedside formula (0.413 constant) with enzymatic creatinine assays.',
  applicableChiefComplaints: [
    'pediatric_renal_failure',
    'pediatric_chronic_kidney_disease',
    'elevated_creatinine',
  ],
  keywords: [
    'Schwartz',
    'pediatric GFR',
    'eGFR children',
    'creatinine clearance pediatric',
    'renal function pediatrics',
  ],
  requiredTests: ['serum creatinine', 'height'],
  components: [
    {
      id: 'height_cm',
      label: 'Height (cm)',
      type: 'number_range',
      source: 'section1',
      autoPopulateFrom: 'narrative_analysis',
      min: 30,
      max: 200,
    },
    {
      id: 'serum_creatinine',
      label: 'Serum Creatinine (mg/dL)',
      type: 'number_range',
      source: 'section2',
      autoPopulateFrom: 'test_result',
      min: 0.1,
      max: 15,
    },
    {
      id: 'k_constant',
      label: 'k Constant (formula version)',
      type: 'select',
      source: 'user_input',
      options: [
        { label: 'Bedside CKiD 2009 (k=0.413, enzymatic Cr)', value: 0 },
        { label: 'Classic - children/adolescent females (k=0.55, Jaffe Cr)', value: 1 },
        { label: 'Classic - adolescent males (k=0.70, Jaffe Cr)', value: 2 },
      ],
    },
  ],
  scoring: {
    method: 'algorithm',
    ranges: [
      {
        min: 0,
        max: 14,
        risk: 'Kidney Failure',
        interpretation:
          'eGFR <15 mL/min/1.73m2: Stage 5 CKD / Kidney failure; pediatric nephrology consult for dialysis evaluation.',
      },
      {
        min: 15,
        max: 29,
        risk: 'Severely Decreased',
        interpretation:
          'eGFR 15-29 mL/min/1.73m2: Stage 4 CKD; severely decreased renal function. Urgent nephrology referral.',
      },
      {
        min: 30,
        max: 59,
        risk: 'Moderately Decreased',
        interpretation:
          'eGFR 30-59 mL/min/1.73m2: Stage 3 CKD; moderately decreased renal function. Dose-adjust renally cleared medications.',
      },
      {
        min: 60,
        max: 89,
        risk: 'Mildly Decreased',
        interpretation:
          'eGFR 60-89 mL/min/1.73m2: Stage 2 CKD; mildly decreased. Monitor for progression, manage risk factors.',
      },
      {
        min: 90,
        max: 300,
        risk: 'Normal',
        interpretation:
          'eGFR >=90 mL/min/1.73m2: Normal or high GFR for age. Stage 1 if other markers of kidney damage are present.',
      },
    ],
  },
}
