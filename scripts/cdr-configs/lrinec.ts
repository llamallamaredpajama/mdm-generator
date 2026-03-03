/**
 * RESCUED from quarantine: lrinec
 *
 * Previously quarantined: Pure lab scoring — all 6 components were section2.
 * Rescue: Changed all 6 lab components (CRP, WBC, hemoglobin, sodium, creatinine,
 * glucose) from section2→user_input so physicians can manually enter lab values.
 *
 * Source: Wong CH et al. The LRINEC (Laboratory Risk Indicator for Necrotizing
 *         Fasciitis) score. Crit Care Med 2004;32(7):1535-1541.
 */

import type { CdrSeed } from '../types'

export const lrinec: CdrSeed = {
  id: 'lrinec',
  name: 'LRINEC Score',
  fullName: 'LRINEC Score (Laboratory Risk Indicator for Necrotizing Fasciitis)',
  category: 'INFECTIOUS DISEASE',
  application:
    'Distinguishes necrotizing fasciitis (NF) from other soft tissue infections using laboratory values. A low score does NOT exclude NF — clinical suspicion (pain out of proportion, skin discoloration, crepitus) always supersedes the score. PPV 92% for score ≥8. Validated by Wong et al. (2004).',
  applicableChiefComplaints: [
    'soft_tissue_infection',
    'cellulitis',
    'wound_infection',
    'pain_out_of_proportion',
    'necrotizing_fasciitis',
  ],
  keywords: [
    'LRINEC',
    'necrotizing fasciitis',
    'soft tissue infection',
    'CRP',
    'WBC',
    'sodium',
    'creatinine',
    'glucose',
    'necrotizing',
  ],
  requiredTests: ['CRP', 'WBC with differential', 'hemoglobin', 'sodium', 'creatinine', 'glucose'],
  components: [
    // CRP (mg/L)
    {
      id: 'crp',
      label: 'C-Reactive Protein (mg/L)',
      type: 'select',
      source: 'user_input',
      options: [
        { label: '<150', value: 0 },
        { label: '≥150', value: 4 },
      ],
    },
    // WBC (/mm³)
    {
      id: 'wbc',
      label: 'WBC (/mm³)',
      type: 'select',
      source: 'user_input',
      options: [
        { label: '<15,000', value: 0 },
        { label: '15,000–25,000', value: 1 },
        { label: '>25,000', value: 2 },
      ],
    },
    // Hemoglobin (g/dL)
    {
      id: 'hemoglobin',
      label: 'Hemoglobin (g/dL)',
      type: 'select',
      source: 'user_input',
      options: [
        { label: '>13.5', value: 0 },
        { label: '11.0–13.5', value: 1 },
        { label: '<11.0', value: 2 },
      ],
    },
    // Sodium (mEq/L)
    {
      id: 'sodium',
      label: 'Sodium (mEq/L)',
      type: 'select',
      source: 'user_input',
      options: [
        { label: '≥135', value: 0 },
        { label: '<135', value: 2 },
      ],
    },
    // Creatinine (mg/dL)
    {
      id: 'creatinine',
      label: 'Creatinine (mg/dL)',
      type: 'select',
      source: 'user_input',
      options: [
        { label: '≤1.6', value: 0 },
        { label: '>1.6', value: 2 },
      ],
    },
    // Glucose (mg/dL)
    {
      id: 'glucose',
      label: 'Glucose (mg/dL)',
      type: 'select',
      source: 'user_input',
      options: [
        { label: '≤180', value: 0 },
        { label: '>180', value: 1 },
      ],
    },
  ],
  scoring: {
    method: 'sum',
    ranges: [
      {
        min: 0,
        max: 5,
        risk: 'Low',
        interpretation:
          'Score ≤5: Low risk (PPV <50%). Does NOT exclude necrotizing fasciitis — do not delay surgical exploration if clinical suspicion is high (pain out of proportion, skin changes, crepitus, hemodynamic instability).',
      },
      {
        min: 6,
        max: 7,
        risk: 'Intermediate',
        interpretation:
          'Score 6–7: Intermediate risk (~73% PPV). Heightened suspicion warranted; serial exams, consider surgical consult for bedside assessment or operative exploration.',
      },
      {
        min: 8,
        max: 13,
        risk: 'High',
        interpretation:
          'Score ≥8: High risk (~93% PPV). Strong presumption of necrotizing fasciitis. Emergent surgical consult for operative exploration and debridement; broad-spectrum antibiotics immediately.',
      },
    ],
  },
  suggestedTreatments: {
    High: [
      'emergency_surgery_consult',
      'surgical_exploration_debridement',
      'vancomycin_iv',
      'piperacillin_tazobactam_iv',
      'iv_fluid_resuscitation',
      'blood_cultures_x2',
      'icu_admission',
    ],
    Intermediate: [
      'surgery_consult',
      'vancomycin_iv',
      'piperacillin_tazobactam_iv',
      'serial_wound_exams',
      'blood_cultures_x2',
    ],
    Low: ['antibiotics_cellulitis_protocol', 'serial_wound_exams', 'low_threshold_surgery_consult'],
  },
}
