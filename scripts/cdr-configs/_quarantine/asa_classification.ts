import type { CdrSeed } from '../types'

/**
 * QUARANTINED: ASA Physical Status Classification
 *
 * Reason: Single-component ordinal classification scale. The ASA (American
 * Society of Anesthesiologists) Physical Status Classification is a holistic
 * physician assessment that assigns patients to one of 6 classes (I-VI).
 *
 * Source: ASA House of Delegates, Last amended 2020
 *
 * The published source does NOT support decomposition into multiple independently
 * scoreable domains. The ASA explicitly states there is "no additional information
 * that will help ASA members become more precise in their assignment." It is
 * intentionally a single gestalt classification with examples provided for
 * guidance, not a multi-component scoring system.
 *
 * High interrater variability is a known limitation acknowledged in the literature,
 * which further confirms this is a judgment-based classification rather than a
 * decomposable scoring tool.
 *
 * Cannot achieve >= 3 user-answerable components without inventing criteria
 * not in the published source.
 */
export const asa_classification: CdrSeed = {
  id: 'asa_classification',
  name: 'ASA Classification',
  fullName: 'ASA Physical Status Classification',
  category: 'PROCEDURAL / AIRWAY',
  application:
    'Pre-procedural risk stratification; standardized communication about patient baseline health. ASA I-II generally safe for ED procedural sedation by emergency physicians.',
  applicableChiefComplaints: ['procedural_sedation', 'procedure', 'sedation', 'anesthesia'],
  keywords: [
    'ASA',
    'physical status',
    'anesthesia',
    'procedural sedation',
    'pre-procedural',
    'risk stratification',
    'ASA I',
    'ASA II',
    'ASA III',
  ],
  components: [
    {
      id: 'asa_class',
      label: 'ASA Physical Status Class',
      type: 'select',
      source: 'user_input',
      options: [
        { label: 'ASA I — Normal healthy patient', value: 1 },
        { label: 'ASA II — Mild systemic disease', value: 2 },
        { label: 'ASA III — Severe systemic disease', value: 3 },
        { label: 'ASA IV — Severe systemic disease that is a constant threat to life', value: 4 },
        { label: 'ASA V — Moribund patient not expected to survive without the operation', value: 5 },
        { label: 'ASA VI — Declared brain-dead patient (organ donor)', value: 6 },
      ],
    },
  ],
  scoring: {
    method: 'algorithm',
    ranges: [
      { min: 1, max: 2, risk: 'Low', interpretation: 'ASA I-II: Generally safe for ED procedural sedation by emergency physicians' },
      { min: 3, max: 3, risk: 'Moderate', interpretation: 'ASA III: Increased risk; careful risk-benefit analysis; consider anesthesia involvement' },
      { min: 4, max: 4, risk: 'High', interpretation: 'ASA IV: Severe risk; strong consideration for anesthesia-managed sedation or operating room' },
      { min: 5, max: 5, risk: 'Very High', interpretation: 'ASA V: Moribund; not expected to survive without surgery; maximal risk' },
      { min: 6, max: 6, risk: 'Not Applicable', interpretation: 'ASA VI: Brain-dead; organ procurement only' },
    ],
  },
  suggestedTreatments: {
    'Very High': ['operating_room', 'anesthesia_managed', 'surgical_consult'],
    High: ['anesthesia_consult', 'operating_room_preferred', 'continuous_monitoring'],
    Moderate: ['anesthesia_consult', 'enhanced_monitoring', 'risk_benefit_discussion'],
    Low: ['standard_ed_procedural_sedation', 'routine_monitoring'],
  },
}
