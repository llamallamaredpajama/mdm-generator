// QUARANTINE: rsbi
// Reason: 0 user-answerable interactive components.
// The RSBI (Yang KL & Tobin MJ, NEJM 1991) is calculated as Respiratory Rate / Tidal Volume.
// RR is a number_range/section1 (continuous input, not boolean/select) and tidal volume is
// a select/section2. Neither qualifies as user-answerable. This is a pure ventilator
// calculation with no clinical history or physician judgment components.
import type { CdrSeed } from '../types'

export const rsbi: CdrSeed = {
  id: 'rsbi',
  name: 'RSBI',
  fullName: 'Rapid Shallow Breathing Index (RSBI)',
  category: 'PULMONARY',
  application:
    'Predicts success of weaning from mechanical ventilation (spontaneous breathing trial).',
  applicableChiefComplaints: ['mechanical_ventilation', 'respiratory_failure', 'icu'],
  keywords: [
    'RSBI',
    'rapid shallow breathing index',
    'weaning',
    'extubation',
    'mechanical ventilation',
    'spontaneous breathing trial',
    'SBT',
  ],
  components: [
    {
      id: 'respiratory_rate',
      label: 'Respiratory Rate during SBT (breaths/min)',
      type: 'number_range',
      min: 1,
      max: 60,
      source: 'section1',
      autoPopulateFrom: 'vital_signs',
    },
    {
      id: 'tidal_volume',
      label: 'Tidal Volume during SBT (liters)',
      type: 'select',
      source: 'section2',
      options: [
        { label: '>=0.5 L (adequate depth)', value: 0 },
        { label: '0.3–0.49 L (borderline)', value: 1 },
        { label: '<0.3 L (shallow)', value: 2 },
      ],
    },
  ],
  scoring: {
    method: 'algorithm',
    ranges: [
      {
        min: 0,
        max: 104,
        risk: 'Favorable',
        interpretation:
          'RSBI <105 breaths/min/L: Likely to tolerate extubation (PPV ~78%). Proceed with spontaneous breathing trial and consider extubation.',
      },
      {
        min: 105,
        max: 300,
        risk: 'Unfavorable',
        interpretation:
          'RSBI >=105 breaths/min/L: Likely to fail extubation (NPV ~95%). Continue mechanical ventilation and address reversible causes before reattempting.',
      },
    ],
  },
  suggestedTreatments: {
    Favorable: ['spontaneous_breathing_trial', 'extubation', 'post_extubation_monitoring'],
    Unfavorable: [
      'continue_mechanical_ventilation',
      'address_reversible_causes',
      'reassess_in_24_hours',
    ],
  },
}
