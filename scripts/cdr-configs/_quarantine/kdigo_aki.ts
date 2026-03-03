import type { CdrSeed } from '../types'

/**
 * QUARANTINED: KDIGO AKI Staging
 *
 * Reason: Only 1 user-answerable component (urine_output_criteria, select/section1).
 * The creatinine_criteria component is section2 (lab-based). The published KDIGO
 * AKI staging system uses exactly 2 criteria (serum creatinine rise + urine output)
 * — there are no additional clinical criteria in the published guideline to add.
 * Cannot reach ≥3 user-answerable components without inventing criteria not in
 * the published source.
 *
 * Source: KDIGO Clinical Practice Guideline for Acute Kidney Injury,
 *         Kidney Int Suppl 2012;2:1-138
 */
export const kdigo_aki: CdrSeed = {
  id: 'kdigo_aki',
  name: 'KDIGO AKI',
  fullName: 'KDIGO AKI Staging',
  category: 'NEPHROLOGY & ELECTROLYTES',
  application:
    'Standardized staging of Acute Kidney Injury (AKI) severity to guide management based on serum creatinine rise relative to baseline and/or urine output criteria.',
  applicableChiefComplaints: ['acute_kidney_injury', 'oliguria', 'renal_failure', 'elevated_creatinine'],
  keywords: [
    'KDIGO',
    'AKI',
    'acute kidney injury',
    'creatinine',
    'urine output',
    'oliguria',
    'RRT',
    'renal replacement therapy',
    'nephrology',
  ],
  requiredTests: ['serum creatinine', 'urine output measurement'],
  components: [
    {
      id: 'creatinine_criteria',
      label: 'Serum Creatinine Criteria',
      type: 'select',
      source: 'section2',
      autoPopulateFrom: 'test_result',
      options: [
        { label: 'No significant rise (< 1.5× baseline and < 0.3 mg/dL increase)', value: 0 },
        { label: 'Stage 1: ≥0.3 mg/dL increase within 48h OR 1.5–1.9× baseline within 7 days', value: 1 },
        { label: 'Stage 2: 2.0–2.9× baseline', value: 2 },
        { label: 'Stage 3: ≥3.0× baseline OR ≥4.0 mg/dL OR initiation of RRT', value: 3 },
      ],
    },
    {
      id: 'urine_output_criteria',
      label: 'Urine Output Criteria',
      type: 'select',
      source: 'section1',
      options: [
        { label: 'Normal (>0.5 mL/kg/h)', value: 0 },
        { label: 'Stage 1: <0.5 mL/kg/h for 6–12 hours', value: 1 },
        { label: 'Stage 2: <0.5 mL/kg/h for ≥12 hours', value: 2 },
        { label: 'Stage 3: <0.3 mL/kg/h for ≥24 hours OR anuria ≥12 hours', value: 3 },
      ],
    },
  ],
  scoring: {
    method: 'algorithm',
    ranges: [
      {
        min: 0,
        max: 0,
        risk: 'No AKI',
        interpretation:
          'Does not meet KDIGO AKI criteria. Monitor renal function if risk factors present.',
      },
      {
        min: 1,
        max: 1,
        risk: 'Stage 1',
        interpretation:
          'KDIGO AKI Stage 1: Creatinine 1.5–1.9× baseline or ≥0.3 mg/dL rise within 48h, and/or UOP <0.5 mL/kg/h for 6–12h. Identify and treat reversible causes, hold nephrotoxins, optimize volume status, monitor closely.',
      },
      {
        min: 2,
        max: 2,
        risk: 'Stage 2',
        interpretation:
          'KDIGO AKI Stage 2: Creatinine 2.0–2.9× baseline and/or UOP <0.5 mL/kg/h for ≥12h. Above measures plus consider nephrology consultation. Monitor for indications for RRT.',
      },
      {
        min: 3,
        max: 3,
        risk: 'Stage 3',
        interpretation:
          'KDIGO AKI Stage 3: Creatinine ≥3.0× baseline or ≥4.0 mg/dL, RRT initiation, or UOP <0.3 mL/kg/h for ≥24h or anuria ≥12h. Nephrology consultation. Evaluate RRT indications (refractory hyperkalemia, acidosis, volume overload, uremic symptoms).',
      },
    ],
  },
  suggestedTreatments: {
    'Stage 3': [
      'nephrology_consult_urgent',
      'rrt_evaluation',
      'hold_nephrotoxins',
      'optimize_volume_status',
      'correct_hyperkalemia',
      'icu_admission',
    ],
    'Stage 2': [
      'nephrology_consultation',
      'hold_nephrotoxins',
      'optimize_volume_status',
      'strict_io_monitoring',
      'renal_dosing_medications',
    ],
    'Stage 1': [
      'hold_nephrotoxins',
      'volume_assessment_and_optimization',
      'serial_creatinine_monitoring',
      'strict_io_monitoring',
      'renal_dosing_medications',
    ],
    'No AKI': [
      'monitor_renal_function',
      'avoid_nephrotoxins_if_at_risk',
    ],
  },
}
