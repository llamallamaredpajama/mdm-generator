import type { CdrSeed } from './types'

/**
 * RESCUED from quarantine: Sgarbossa Criteria
 *
 * Previously quarantined because all ECG-interpretation components used source: 'section2'.
 * Converted to source: 'user_input' — physicians interpret the ECG at bedside and enter
 * findings via boolean UI. ECG interpretation is a physician judgment call, not a raw lab value.
 * Thresholds verified against Sgarbossa et al., NEJM 1996;334:481-487 and
 * Smith et al., Ann Emerg Med 2012;60(6):766-776 (modified criteria).
 */

export const sgarbossa: CdrSeed = {
  id: 'sgarbossa',
  name: 'Sgarbossa Criteria',
  fullName: 'Sgarbossa Criteria (STEMI Diagnosis in LBBB)',
  category: 'CARDIOVASCULAR',
  application:
    'Identifies acute MI in the presence of left bundle branch block (LBBB), where standard ST criteria are unreliable.',
  applicableChiefComplaints: ['chest_pain', 'lbbb', 'stemi_equivalent', 'ventricular_paced_rhythm'],
  keywords: [
    'Sgarbossa criteria',
    'Smith-modified Sgarbossa',
    'LBBB MI',
    'STEMI LBBB',
    'concordant ST elevation',
    'discordant ST',
    'left bundle branch block ACS',
    'paced rhythm MI',
  ],
  requiredTests: ['ecg'],
  components: [
    // Original Sgarbossa — weighted points
    {
      id: 'concordant_st_elevation',
      label: 'Criterion 1: Concordant ST elevation ≥1 mm in any lead with positive QRS complex',
      type: 'boolean',
      value: 5,
      source: 'user_input',
    },
    {
      id: 'concordant_st_depression',
      label: 'Criterion 2: Concordant ST depression ≥1 mm in leads V1–V3',
      type: 'boolean',
      value: 3,
      source: 'user_input',
    },
    {
      id: 'discordant_st_elevation',
      label: 'Criterion 3 (Original): Excessively discordant ST elevation ≥5 mm in leads with negative QRS complex',
      type: 'boolean',
      value: 2,
      source: 'user_input',
    },
    // Smith-Modified criterion (replaces Criterion 3 for better sensitivity)
    {
      id: 'smith_modified',
      label: 'Criterion 3 (Smith-Modified): ST/S ratio ≤−0.25 in any lead with discordant ST deviation (excessively discordant relative to QRS amplitude)',
      type: 'boolean',
      value: 0,
      source: 'user_input',
    },
  ],
  scoring: {
    method: 'algorithm',
    ranges: [
      {
        min: 0,
        max: 2,
        risk: 'Non-Diagnostic',
        interpretation:
          'Score <3 (original criteria): Non-diagnostic for acute MI in LBBB by original weighted score alone. If Smith-Modified Criterion 3 present (ST/S ratio ≤−0.25), treat as STEMI equivalent regardless of total score.',
      },
      {
        min: 3,
        max: 10,
        risk: 'STEMI Equivalent',
        interpretation:
          'Score ≥3 (original criteria): High specificity for acute MI (~90%). Smith-Modified: ANY one of the 3 criteria present → treat as STEMI equivalent (sensitivity ~91%, specificity ~90%). Activate cath lab.',
      },
    ],
  },
  suggestedTreatments: {
    'STEMI Equivalent': [
      'aspirin_325',
      'heparin_drip',
      'p2y12_inhibitor',
      'cardiology_consult',
      'cath_lab_activation',
      'admit_telemetry',
    ],
    'Non-Diagnostic': ['serial_ecg', 'serial_troponins', 'cardiology_consult'],
  },
}
