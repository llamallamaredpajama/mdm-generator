/**
 * QUARANTINED: Lund-Mackay Score (Sinus CT)
 *
 * Reason: All 12 components are imaging-based (section2 — CT sinus findings).
 * 0 user-answerable components. This score is entirely dependent on CT interpretation
 * and cannot be made interactive without fabricating clinical criteria.
 *
 * Source: Lund VJ, Mackay IS. Staging in rhinosinusitis. Rhinology 1993;31(4):183-184.
 */

import type { CdrSeed } from '../types'

export const lund_mackay: CdrSeed = {
  id: 'lund_mackay',
  name: 'Lund-Mackay Score',
  fullName: 'Lund-Mackay Score (Sinus CT)',
  category: 'ENT / OTOLARYNGOLOGY',
  application:
    'Standardized scoring of sinus CT opacification used to assess chronic rhinosinusitis severity. Scores each sinus bilaterally 0-2, with total bilateral score 0-24.',
  applicableChiefComplaints: ['sinusitis', 'chronic_rhinosinusitis', 'nasal_congestion', 'facial_pain'],
  keywords: [
    'Lund-Mackay',
    'sinus CT',
    'rhinosinusitis',
    'chronic sinusitis',
    'CT scoring',
    'opacification',
    'FESS',
    'ostiomeatal complex',
  ],
  requiredTests: ['CT sinuses'],
  components: [
    // Right sinuses
    {
      id: 'r_maxillary',
      label: 'Right Maxillary Sinus',
      type: 'select',
      source: 'section2',
      autoPopulateFrom: 'test_result',
      options: [
        { label: 'No opacification (0)', value: 0 },
        { label: 'Partial opacification (1)', value: 1 },
        { label: 'Total opacification (2)', value: 2 },
      ],
    },
    {
      id: 'r_anterior_ethmoid',
      label: 'Right Anterior Ethmoid',
      type: 'select',
      source: 'section2',
      autoPopulateFrom: 'test_result',
      options: [
        { label: 'No opacification (0)', value: 0 },
        { label: 'Partial opacification (1)', value: 1 },
        { label: 'Total opacification (2)', value: 2 },
      ],
    },
    {
      id: 'r_posterior_ethmoid',
      label: 'Right Posterior Ethmoid',
      type: 'select',
      source: 'section2',
      autoPopulateFrom: 'test_result',
      options: [
        { label: 'No opacification (0)', value: 0 },
        { label: 'Partial opacification (1)', value: 1 },
        { label: 'Total opacification (2)', value: 2 },
      ],
    },
    {
      id: 'r_sphenoid',
      label: 'Right Sphenoid Sinus',
      type: 'select',
      source: 'section2',
      autoPopulateFrom: 'test_result',
      options: [
        { label: 'No opacification (0)', value: 0 },
        { label: 'Partial opacification (1)', value: 1 },
        { label: 'Total opacification (2)', value: 2 },
      ],
    },
    {
      id: 'r_frontal',
      label: 'Right Frontal Sinus',
      type: 'select',
      source: 'section2',
      autoPopulateFrom: 'test_result',
      options: [
        { label: 'No opacification (0)', value: 0 },
        { label: 'Partial opacification (1)', value: 1 },
        { label: 'Total opacification (2)', value: 2 },
      ],
    },
    {
      id: 'r_ostiomeatal',
      label: 'Right Ostiomeatal Complex',
      type: 'select',
      source: 'section2',
      autoPopulateFrom: 'test_result',
      options: [
        { label: 'Not obstructed (0)', value: 0 },
        { label: 'Obstructed (2)', value: 2 },
      ],
    },
    // Left sinuses
    {
      id: 'l_maxillary',
      label: 'Left Maxillary Sinus',
      type: 'select',
      source: 'section2',
      autoPopulateFrom: 'test_result',
      options: [
        { label: 'No opacification (0)', value: 0 },
        { label: 'Partial opacification (1)', value: 1 },
        { label: 'Total opacification (2)', value: 2 },
      ],
    },
    {
      id: 'l_anterior_ethmoid',
      label: 'Left Anterior Ethmoid',
      type: 'select',
      source: 'section2',
      autoPopulateFrom: 'test_result',
      options: [
        { label: 'No opacification (0)', value: 0 },
        { label: 'Partial opacification (1)', value: 1 },
        { label: 'Total opacification (2)', value: 2 },
      ],
    },
    {
      id: 'l_posterior_ethmoid',
      label: 'Left Posterior Ethmoid',
      type: 'select',
      source: 'section2',
      autoPopulateFrom: 'test_result',
      options: [
        { label: 'No opacification (0)', value: 0 },
        { label: 'Partial opacification (1)', value: 1 },
        { label: 'Total opacification (2)', value: 2 },
      ],
    },
    {
      id: 'l_sphenoid',
      label: 'Left Sphenoid Sinus',
      type: 'select',
      source: 'section2',
      autoPopulateFrom: 'test_result',
      options: [
        { label: 'No opacification (0)', value: 0 },
        { label: 'Partial opacification (1)', value: 1 },
        { label: 'Total opacification (2)', value: 2 },
      ],
    },
    {
      id: 'l_frontal',
      label: 'Left Frontal Sinus',
      type: 'select',
      source: 'section2',
      autoPopulateFrom: 'test_result',
      options: [
        { label: 'No opacification (0)', value: 0 },
        { label: 'Partial opacification (1)', value: 1 },
        { label: 'Total opacification (2)', value: 2 },
      ],
    },
    {
      id: 'l_ostiomeatal',
      label: 'Left Ostiomeatal Complex',
      type: 'select',
      source: 'section2',
      autoPopulateFrom: 'test_result',
      options: [
        { label: 'Not obstructed (0)', value: 0 },
        { label: 'Obstructed (2)', value: 2 },
      ],
    },
  ],
  scoring: {
    method: 'sum',
    ranges: [
      {
        min: 0,
        max: 0,
        risk: 'Normal',
        interpretation:
          'Score 0: Normal; does not exclude chronic sinusitis (clinical diagnosis).',
      },
      {
        min: 1,
        max: 4,
        risk: 'Mild',
        interpretation: 'Score 1-4: Mild disease.',
      },
      {
        min: 5,
        max: 12,
        risk: 'Moderate',
        interpretation: 'Score 5-12: Moderate disease.',
      },
      {
        min: 13,
        max: 24,
        risk: 'Severe',
        interpretation:
          'Score >12: Severe disease; may support surgical intervention if medical therapy fails.',
      },
    ],
  },
}
