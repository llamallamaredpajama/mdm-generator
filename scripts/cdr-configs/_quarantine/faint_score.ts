// QUARANTINE: faint_score
// Reason: Only 2 user-answerable interactive components (heart_failure_history, arrhythmia_history).
// The FAINT score (Reed et al., Ann Emerg Med 2010) has exactly 5 components:
// F=Heart Failure history (section1), A=Arrhythmia history (section1),
// I=Initial elevated BNP (section2), N=elevated tropoNin (section2), T=abnormal ECG (section2).
// Only F and A are clinical history; I, N, and T are lab/test results.
// Cannot add components without inventing criteria not in the published source.
import type { CdrSeed } from '../types'

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
      value: 1,
      source: 'section2',
      autoPopulateFrom: 'test_result',
    },
    {
      id: 'elevated_troponin',
      label: 'N — Elevated hs-troponin (>99th percentile)',
      type: 'boolean',
      value: 1,
      source: 'section2',
      autoPopulateFrom: 'test_result',
    },
    {
      id: 'abnormal_ecg',
      label: 'T — Abnormal ECG (any non-sinus rhythm, conduction abnormality, or ischemic changes)',
      type: 'boolean',
      value: 1,
      source: 'section2',
      autoPopulateFrom: 'test_result',
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
        max: 5,
        risk: 'High',
        interpretation:
          'Score 3–5: High risk (~30%+ 30-day adverse event rate). Likely cardiac etiology — admission with telemetry monitoring.',
      },
    ],
  },
  suggestedTreatments: {
    High: ['admit_telemetry', 'cardiology_consult', 'echocardiogram', 'continuous_monitoring'],
    Intermediate: ['observation', 'cardiology_consult', 'outpatient_holter'],
    Low: ['discharge_with_follow_up', 'return_precautions'],
  },
}
