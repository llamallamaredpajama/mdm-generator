/**
 * RESCUED from quarantine: FAINT Score
 *
 * Previously quarantined because lab/ECG components used source: 'section2'.
 * Converted lab/imaging components to source: 'user_input' — physicians enter
 * categorical lab results (which they already have in hand) via boolean UI.
 * Thresholds verified against Probst et al., Ann Emerg Med 2020;75(2):147-158.
 *
 * SCORING FIX: elevated_bnp corrected from 1 → 2 points per published source.
 * Max score is 6 (F=1, A=1, I=2, N=1, T=1).
 */
import type { CdrSeed } from './types'

export const faintScore: CdrSeed = {
  id: 'faint_score',
  name: 'FAINT Score',
  fullName: 'FAINT Score',
  category: 'CARDIOVASCULAR',
  application:
    'Risk stratification for syncope, incorporating BNP.',
  applicableChiefComplaints: ['syncope', 'loss_of_consciousness'],
  keywords: [
    'FAINT score',
    'syncope BNP',
    'NT-proBNP syncope',
    'heart failure syncope',
    'arrhythmia syncope',
    'troponin syncope',
    'ECG syncope',
  ],
  requiredTests: ['ecg', 'troponin', 'nt-probnp'],
  components: [
    {
      id: 'heart_failure_history',
      label: 'F — History of heart failure',
      type: 'boolean',
      value: 1,
      source: 'section1',
      autoPopulateFrom: 'narrative_analysis',
    },
    {
      id: 'arrhythmia_history',
      label: 'A — History of arrhythmia (any documented arrhythmia or pacemaker/ICD)',
      type: 'boolean',
      value: 1,
      source: 'section1',
      autoPopulateFrom: 'narrative_analysis',
    },
    {
      id: 'elevated_bnp',
      label: 'I — Initial elevated NT-proBNP (>300 pg/mL) or BNP (>100 pg/mL)',
      type: 'boolean',
      value: 2,
      source: 'user_input',
    },
    {
      id: 'elevated_troponin',
      label: 'N — Elevated hs-troponin (>99th percentile)',
      type: 'boolean',
      value: 1,
      source: 'user_input',
    },
    {
      id: 'abnormal_ecg',
      label: 'T — Abnormal ECG (any non-sinus rhythm, conduction abnormality, or ischemic changes)',
      type: 'boolean',
      value: 1,
      source: 'user_input',
    },
  ],
  scoring: {
    method: 'sum',
    ranges: [
      {
        min: 0,
        max: 0,
        risk: 'Low',
        interpretation:
          'Score 0: Low risk (~4% 30-day adverse event rate). Likely vasovagal or benign etiology — consider discharge with follow-up.',
      },
      {
        min: 1,
        max: 2,
        risk: 'Intermediate',
        interpretation:
          'Score 1–2: Intermediate risk. Further cardiac evaluation recommended; consider observation or admission.',
      },
      {
        min: 3,
        max: 6,
        risk: 'High',
        interpretation:
          'Score 3–6: High risk (~30%+ 30-day adverse event rate). Likely cardiac etiology — admission with telemetry monitoring.',
      },
    ],
  },
  suggestedTreatments: {
    High: ['admit_telemetry', 'cardiology_consult', 'echocardiogram', 'continuous_monitoring'],
    Intermediate: ['observation', 'cardiology_consult', 'outpatient_holter'],
    Low: ['discharge_with_follow_up', 'return_precautions'],
  },
}
