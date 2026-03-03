/**
 * QUARANTINED: SINS Score (Spinal Instability Neoplastic Score)
 *
 * Reason: Only 1 of 6 components is user-answerable (pain = section1).
 * The remaining 5 (location, bone lesion type, alignment, vertebral body collapse,
 * posterolateral involvement) are all imaging-based findings (section2).
 * Published source (Fisher et al., J Clin Oncol 2010) confirms these 6 criteria.
 *
 * Source: Fisher CG, DiPaola CP, Ryken TC, et al. A novel classification system for
 *         spinal instability in neoplastic disease. Spine 2010;35(22):E1221-E1229.
 */

import type { CdrSeed } from '../types'

export const sins_score: CdrSeed = {
  id: 'sins_score',
  name: 'SINS Score',
  fullName: 'Spinal Instability Neoplastic Score (SINS)',
  category: 'ONCOLOGIC EMERGENCY',
  application:
    'Assesses spinal instability from metastatic disease to determine need for surgical consultation. Incorporates location, pain, bone lesion type, alignment, collapse, and posterolateral involvement.',
  applicableChiefComplaints: ['back_pain', 'spinal_metastasis', 'oncologic_emergency', 'neurologic_deficit'],
  keywords: [
    'SINS',
    'spinal instability',
    'neoplastic',
    'spinal metastasis',
    'spine surgery',
    'vertebral collapse',
    'bone metastasis',
  ],
  components: [
    {
      id: 'location',
      label: 'Spinal Location',
      type: 'select',
      source: 'section2',
      autoPopulateFrom: 'test_result',
      options: [
        { label: 'Junctional (occiput-C2, C7-T2, T11-L1, L5-S1)', value: 3 },
        { label: 'Mobile spine (C3-C6)', value: 2 },
        { label: 'Semi-rigid (T3-T10)', value: 1 },
        { label: 'Rigid (S2-S5)', value: 0 },
      ],
    },
    {
      id: 'pain',
      label: 'Mechanical Pain',
      type: 'select',
      source: 'section1',
      autoPopulateFrom: 'narrative_analysis',
      options: [
        { label: 'Yes (pain relieved by recumbency and/or worsened with movement/loading)', value: 3 },
        { label: 'Occasional pain but not mechanical', value: 1 },
        { label: 'Pain-free lesion', value: 0 },
      ],
    },
    {
      id: 'bone_lesion',
      label: 'Bone Lesion Type',
      type: 'select',
      source: 'section2',
      autoPopulateFrom: 'test_result',
      options: [
        { label: 'Lytic', value: 2 },
        { label: 'Mixed (lytic/blastic)', value: 1 },
        { label: 'Blastic', value: 0 },
      ],
    },
    {
      id: 'alignment',
      label: 'Spinal Alignment',
      type: 'select',
      source: 'section2',
      autoPopulateFrom: 'test_result',
      options: [
        { label: 'Subluxation/translation present', value: 4 },
        { label: 'De novo deformity (kyphosis/scoliosis)', value: 2 },
        { label: 'Normal alignment', value: 0 },
      ],
    },
    {
      id: 'vertebral_body_collapse',
      label: 'Vertebral Body Collapse',
      type: 'select',
      source: 'section2',
      autoPopulateFrom: 'test_result',
      options: [
        { label: '>50% collapse', value: 3 },
        { label: '<50% collapse', value: 2 },
        { label: 'No collapse with >50% body involved', value: 1 },
        { label: 'None of the above', value: 0 },
      ],
    },
    {
      id: 'posterolateral_involvement',
      label: 'Posterolateral Involvement of Spinal Elements',
      type: 'select',
      source: 'section2',
      autoPopulateFrom: 'test_result',
      options: [
        { label: 'Bilateral', value: 3 },
        { label: 'Unilateral', value: 1 },
        { label: 'None of the above', value: 0 },
      ],
    },
  ],
  scoring: {
    method: 'sum',
    ranges: [
      {
        min: 0,
        max: 6,
        risk: 'Stable',
        interpretation: 'Score 0-6: Stable; no surgical consultation needed.',
      },
      {
        min: 7,
        max: 12,
        risk: 'Indeterminate',
        interpretation:
          'Score 7-12: Indeterminate instability; surgical consultation recommended.',
      },
      {
        min: 13,
        max: 18,
        risk: 'Unstable',
        interpretation:
          'Score 13-18: Unstable; surgical consultation required urgently.',
      },
    ],
  },
  suggestedTreatments: {
    Unstable: ['spine_surgery_consult_urgent', 'immobilization', 'pain_management', 'oncology_consult'],
    Indeterminate: ['spine_surgery_consult', 'advanced_imaging', 'pain_management', 'oncology_consult'],
    Stable: ['pain_management', 'radiation_oncology_consult', 'oncology_follow_up'],
  },
}
