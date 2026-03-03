import type { CdrSeed } from './types'

/**
 * RESCUED from quarantine: HELLP Mississippi Classification
 *
 * Previously quarantined because lab components used source: 'section2'.
 * Converted lab/imaging components to source: 'user_input' — physicians enter
 * categorical lab results via select/boolean UI.
 * Thresholds verified against Martin et al., Am J Obstet Gynecol 1999 (Mississippi
 * classification) and StatPearls HELLP Syndrome review.
 */
export const hellpMississippi: CdrSeed = {
  id: 'hellp_mississippi',
  name: 'HELLP Classification',
  fullName: 'HELLP Syndrome Classification (Mississippi / Martin)',
  category: 'OB/GYN & OBSTETRIC EMERGENCY',
  application:
    'Classifies severity of HELLP syndrome (Hemolysis, Elevated Liver enzymes, Low Platelets) to guide management intensity. All classes typically require delivery.',
  applicableChiefComplaints: [
    'preeclampsia',
    'epigastric_pain',
    'obstetric_emergency',
    'thrombocytopenia',
    'right_upper_quadrant_pain',
  ],
  keywords: [
    'HELLP',
    'Mississippi classification',
    'Martin',
    'hemolysis',
    'elevated liver enzymes',
    'low platelets',
    'LDH',
    'AST',
    'obstetrics',
    'preeclampsia',
  ],
  requiredTests: ['CBC', 'LFTs', 'LDH', 'peripheral blood smear'],
  components: [
    {
      id: 'platelet_count',
      label: 'Platelet count',
      type: 'select',
      source: 'user_input',
      options: [
        { label: '≤50,000/μL', value: 1 },
        { label: '>50,000–100,000/μL', value: 2 },
        { label: '>100,000–150,000/μL', value: 3 },
      ],
    },
    {
      id: 'ast_level',
      label: 'AST (SGOT) level',
      type: 'select',
      source: 'user_input',
      options: [
        { label: 'AST ≥70 IU/L', value: 0 },
        { label: 'AST <70 IU/L', value: 1 },
      ],
    },
    {
      id: 'ldh_level',
      label: 'LDH level',
      type: 'select',
      source: 'user_input',
      options: [
        { label: 'LDH ≥600 IU/L', value: 0 },
        { label: 'LDH <600 IU/L', value: 1 },
      ],
    },
    {
      id: 'hemolysis_evidence',
      label: 'Evidence of hemolysis (schistocytes, elevated indirect bilirubin, low haptoglobin)',
      type: 'boolean',
      value: 0,
      source: 'user_input',
    },
  ],
  scoring: {
    method: 'algorithm',
    ranges: [
      {
        min: 1,
        max: 1,
        risk: 'Class 1 - Severe',
        interpretation:
          'Platelets ≤50,000 + AST ≥70 + LDH ≥600; highest maternal morbidity; most aggressive management required; delivery indicated',
      },
      {
        min: 2,
        max: 2,
        risk: 'Class 2 - Moderate',
        interpretation:
          'Platelets >50,000–100,000 + AST ≥70 + LDH ≥600; intermediate risk; delivery typically indicated',
      },
      {
        min: 3,
        max: 3,
        risk: 'Class 3 - Mild',
        interpretation:
          'Platelets >100,000–150,000 + AST ≥40 + LDH ≥600; lower risk but still requires close monitoring and likely delivery',
      },
    ],
  },
  suggestedTreatments: {
    'Class 1 - Severe': [
      'immediate_ob_consult',
      'magnesium_sulfate',
      'antihypertensives',
      'platelet_transfusion_if_below_20k',
      'emergent_delivery',
      'icu_admission',
    ],
    'Class 2 - Moderate': [
      'ob_consult',
      'magnesium_sulfate',
      'antihypertensives',
      'delivery_planning',
      'serial_labs_q6h',
    ],
    'Class 3 - Mild': [
      'ob_consult',
      'magnesium_sulfate',
      'serial_labs_q6_12h',
      'close_monitoring',
      'delivery_planning',
    ],
  },
}
