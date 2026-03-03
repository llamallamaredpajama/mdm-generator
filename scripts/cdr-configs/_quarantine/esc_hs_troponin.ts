// QUARANTINE: esc_hs_troponin
// Reason: Only 2 user-answerable interactive components (ongoing_chest_pain, time_from_onset).
// The ESC 0/1h hs-Troponin algorithm (Roffi et al., Eur Heart J 2016) is fundamentally
// lab-based — the core decision points are baseline hs-cTn level and 1-hour delta,
// both of which are section2 test results. The clinical modifiers (ongoing pain, timing,
// renal function) are contextual but only 2 qualify as user-answerable. Cannot add
// additional scored components without inventing criteria not in the published source.
import type { CdrSeed } from '../types'

export const escHsTroponin: CdrSeed = {
  id: 'esc_hs_troponin',
  name: 'ESC hs-Troponin Algorithm',
  fullName: 'High-Sensitivity Troponin 0/1-Hour and 0/3-Hour Algorithms (ESC)',
  category: 'CARDIOVASCULAR',
  application:
    'Rapid rule-in/rule-out of acute MI using high-sensitivity troponin (hs-cTn).',
  applicableChiefComplaints: ['chest_pain', 'acs_rule_out', 'nstemi'],
  keywords: [
    'high sensitivity troponin',
    'hs-cTn',
    'ESC troponin algorithm',
    '0/1 hour algorithm',
    '0/3 hour algorithm',
    'rapid rule out MI',
    'delta troponin',
    'hs-cTnT',
    'hs-cTnI',
  ],
  requiredTests: ['high-sensitivity troponin (0h and 1h or 3h)'],
  components: [
    {
      id: 'baseline_hs_ctn',
      label: 'Baseline (0h) hs-cTn level',
      type: 'select',
      source: 'section2',
      autoPopulateFrom: 'test_result',
      options: [
        { label: 'Very low (below rule-out threshold, e.g., hs-cTnT <5 ng/L)', value: 0 },
        { label: 'Low-intermediate (above rule-out but below rule-in)', value: 1 },
        { label: 'Markedly elevated (above rule-in threshold, e.g., hs-cTnT ≥52 ng/L)', value: 2 },
      ],
    },
    {
      id: 'delta_1h',
      label: '1-hour delta hs-cTn change',
      type: 'select',
      source: 'section2',
      autoPopulateFrom: 'test_result',
      options: [
        { label: 'Minimal or no change (below delta threshold)', value: 0 },
        { label: 'Intermediate change (between thresholds)', value: 1 },
        { label: 'Significant rise (above delta rule-in threshold, e.g., hs-cTnT delta ≥5 ng/L)', value: 2 },
      ],
    },
    {
      id: 'ongoing_chest_pain',
      label: 'Ongoing or recurrent chest pain at time of sampling',
      type: 'boolean',
      value: 1,
      source: 'section1',
      autoPopulateFrom: 'narrative_analysis',
    },
    {
      id: 'time_from_onset',
      label: 'Time from symptom onset to first troponin draw',
      type: 'select',
      source: 'section1',
      autoPopulateFrom: 'narrative_analysis',
      options: [
        { label: '≥3 hours from onset', value: 0 },
        { label: '<3 hours from onset (early presenter)', value: 1 },
      ],
    },
    {
      id: 'renal_impairment',
      label: 'Significant renal impairment (eGFR <30 mL/min)',
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
        min: 0,
        max: 1,
        risk: 'Rule-Out',
        interpretation:
          'Baseline hs-cTn very low AND 1h delta below threshold → MI ruled out (NPV >99%). Safe for discharge if no alternative high-risk diagnosis.',
      },
      {
        min: 2,
        max: 4,
        risk: 'Observe',
        interpretation:
          'Neither ruled in nor ruled out → Serial troponin at 3 hours, clinical reassessment. Consider early presenter pathway or renal adjustment.',
      },
      {
        min: 5,
        max: 7,
        risk: 'Rule-In',
        interpretation:
          'Baseline hs-cTn markedly elevated OR 1h delta above threshold → MI rule-in (PPV ~70–75%); treat as ACS with urgent cardiology consult.',
      },
    ],
  },
  suggestedTreatments: {
    'Rule-In': ['aspirin_325', 'heparin_drip', 'cardiology_consult', 'admit_telemetry'],
    Observe: ['serial_troponins', 'observation', 'repeat_ecg'],
    'Rule-Out': ['discharge_with_follow_up'],
  },
}
