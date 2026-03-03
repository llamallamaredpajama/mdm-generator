import type { CdrSeed } from '../types'

/**
 * QUARANTINED: QTc Calculation (Bazett and Fridericia)
 *
 * Reason: Only 2 of 5 components are user-answerable (section1):
 *   - Patient sex (section1)
 *   - QT-prolonging medications (section1)
 * The other 3 are measurement/lab-based:
 *   - QT interval (number_range, section2) — not boolean/select
 *   - Heart rate (number_range, section2) — not boolean/select
 *   - Electrolyte abnormality (boolean, section2)
 * The QTc calculation is fundamentally a mathematical formula (QTc = QT / sqrt(RR)),
 * not a clinical decision rule with scored criteria. Cannot reach 3 user-answerable
 * components without inventing criteria not in the published sources
 * (Bazett, Heart 1920; Fridericia, Acta Med Scand 1920).
 */
export const qtc_calculation: CdrSeed = {
  id: 'qtc_calculation',
  name: 'QTc Calculation',
  fullName: 'QTc Calculation (Bazett and Fridericia)',
  category: 'TOXICOLOGY',
  application:
    'Corrects QT interval for heart rate. Prolonged QTc increases risk of torsades de pointes. QTc >500 ms carries significant risk for TdP.',
  applicableChiefComplaints: [
    'palpitations',
    'syncope',
    'overdose',
    'arrhythmia',
    'QT_prolongation',
    'torsades_de_pointes',
  ],
  keywords: [
    'QTc',
    'QT prolongation',
    'Bazett',
    'Fridericia',
    'torsades de pointes',
    'TdP',
    'arrhythmia',
    'corrected QT',
    'ECG',
  ],
  requiredTests: ['ECG', 'QT interval measurement', 'heart rate'],
  components: [
    {
      id: 'qt_interval',
      label: 'Measured QT interval (ms)',
      type: 'number_range',
      min: 200,
      max: 700,
      source: 'section2',
      autoPopulateFrom: 'test_result',
    },
    {
      id: 'heart_rate',
      label: 'Heart rate (bpm)',
      type: 'number_range',
      min: 30,
      max: 250,
      source: 'section2',
      autoPopulateFrom: 'test_result',
    },
    {
      id: 'patient_sex',
      label: 'Patient sex (QTc thresholds differ)',
      type: 'select',
      source: 'section1',
      autoPopulateFrom: 'narrative_analysis',
      options: [
        { label: 'Male (prolonged >450 ms)', value: 0 },
        { label: 'Female (prolonged >470 ms)', value: 1 },
      ],
    },
    {
      id: 'qt_prolonging_meds',
      label: 'Currently on QT-prolonging medication(s)',
      type: 'boolean',
      value: 1,
      source: 'section1',
      autoPopulateFrom: 'narrative_analysis',
    },
    {
      id: 'electrolyte_abnormality',
      label: 'Electrolyte abnormality (hypokalemia, hypomagnesemia, hypocalcemia)',
      type: 'boolean',
      value: 1,
      source: 'section2',
      autoPopulateFrom: 'test_result',
    },
  ],
  scoring: {
    method: 'algorithm',
    ranges: [
      {
        min: 200,
        max: 449,
        risk: 'Normal',
        interpretation:
          'Normal QTc (Male <450 ms, Female <470 ms); no immediate TdP risk. Continue monitoring if on QT-prolonging medications.',
      },
      {
        min: 450,
        max: 499,
        risk: 'Borderline',
        interpretation:
          'Borderline-prolonged QTc; review and discontinue QT-prolonging medications if possible; correct electrolytes (K⁺ >4.0, Mg²⁺ >2.0); serial ECGs',
      },
      {
        min: 500,
        max: 700,
        risk: 'High',
        interpretation:
          'QTc ≥500 ms: Significant risk for torsades de pointes; discontinue ALL QT-prolonging drugs; correct electrolytes aggressively (IV Mg²⁺, K⁺, Ca²⁺); continuous telemetry; consider isoproterenol or temporary pacing if TdP occurs. Increase >60 ms from baseline also concerning.',
      },
    ],
  },
  suggestedTreatments: {
    High: [
      'discontinue_qt_prolonging_drugs',
      'iv_magnesium_2g',
      'correct_potassium_gt_4',
      'continuous_telemetry',
      'cardiology_consult',
      'isoproterenol_or_pacing_if_tdp',
    ],
    Borderline: [
      'review_qt_prolonging_medications',
      'correct_electrolytes',
      'serial_ecg',
      'telemetry_monitoring',
    ],
    Normal: ['continue_monitoring_if_on_qt_prolonging_meds'],
  },
}
