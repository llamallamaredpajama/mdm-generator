import type { CdrSeed } from '../types'

/**
 * QUARANTINE: ASPECTS (Alberta Stroke Program Early CT Score)
 *
 * Reason: All 10 components are CT imaging findings (source: section2).
 * Zero user-answerable interactive components (need section1 or user_input).
 * ASPECTS is a pure radiology scoring tool — each region is scored by
 * reading a non-contrast CT head, not by clinical assessment or history.
 * Cannot add section1 components without inventing criteria outside the
 * published source (Barber et al., Lancet 2000; 355:1670–1674).
 */
export const aspects: CdrSeed = {
  id: 'aspects',
  name: 'ASPECTS',
  fullName: 'ASPECTS (Alberta Stroke Program Early CT Score)',
  category: 'NEUROLOGY',
  application: 'Standardized CT scoring system for quantifying early ischemic changes in MCA territory stroke. Used in endovascular thrombectomy eligibility.',
  applicableChiefComplaints: ['stroke', 'focal_neurological_deficit', 'mca_stroke'],
  keywords: ['ASPECTS', 'Alberta Stroke', 'CT score', 'ischemic changes', 'MCA', 'thrombectomy', 'infarct core', 'endovascular'],
  requiredTests: ['CT head non-contrast'],
  components: [
    {
      id: 'caudate',
      label: 'C — Caudate nucleus: early ischemic changes present',
      type: 'boolean',
      source: 'section2',
      autoPopulateFrom: 'test_result',
      value: -1,
    },
    {
      id: 'lentiform',
      label: 'L — Lentiform nucleus: early ischemic changes present',
      type: 'boolean',
      source: 'section2',
      autoPopulateFrom: 'test_result',
      value: -1,
    },
    {
      id: 'internal_capsule',
      label: 'IC — Internal capsule: early ischemic changes present',
      type: 'boolean',
      source: 'section2',
      autoPopulateFrom: 'test_result',
      value: -1,
    },
    {
      id: 'insular_ribbon',
      label: 'I — Insular ribbon: early ischemic changes present',
      type: 'boolean',
      source: 'section2',
      autoPopulateFrom: 'test_result',
      value: -1,
    },
    {
      id: 'mca_m1',
      label: 'M1 — Anterior MCA cortex: early ischemic changes present',
      type: 'boolean',
      source: 'section2',
      autoPopulateFrom: 'test_result',
      value: -1,
    },
    {
      id: 'mca_m2',
      label: 'M2 — MCA cortex lateral to insular ribbon: early ischemic changes present',
      type: 'boolean',
      source: 'section2',
      autoPopulateFrom: 'test_result',
      value: -1,
    },
    {
      id: 'mca_m3',
      label: 'M3 — Posterior MCA cortex: early ischemic changes present',
      type: 'boolean',
      source: 'section2',
      autoPopulateFrom: 'test_result',
      value: -1,
    },
    {
      id: 'mca_m4',
      label: 'M4 — Anterior MCA territory above M1-M3 (superior): early ischemic changes present',
      type: 'boolean',
      source: 'section2',
      autoPopulateFrom: 'test_result',
      value: -1,
    },
    {
      id: 'mca_m5',
      label: 'M5 — Lateral MCA territory above M1-M3 (superior): early ischemic changes present',
      type: 'boolean',
      source: 'section2',
      autoPopulateFrom: 'test_result',
      value: -1,
    },
    {
      id: 'mca_m6',
      label: 'M6 — Posterior MCA territory above M1-M3 (superior): early ischemic changes present',
      type: 'boolean',
      source: 'section2',
      autoPopulateFrom: 'test_result',
      value: -1,
    },
  ],
  scoring: {
    method: 'algorithm',
    ranges: [
      { min: 8, max: 10, risk: 'Favorable', interpretation: 'Small infarct core — favorable for reperfusion therapy (thrombectomy). ASPECTS ≥6 generally accepted for thrombectomy eligibility.' },
      { min: 6, max: 7, risk: 'Moderate', interpretation: 'Moderate infarct — treatment decision based on clinical factors. ASPECTS 6-7 may still qualify for thrombectomy per AHA/ASA guidelines.' },
      { min: 0, max: 5, risk: 'Unfavorable', interpretation: 'Large infarct core — generally unfavorable for thrombectomy; higher risk of hemorrhagic transformation. Consider goals of care discussion.' },
    ],
  },
  suggestedTreatments: {
    Favorable: ['tpa_if_within_window', 'thrombectomy_evaluation', 'stroke_team_activation', 'admit_stroke_unit'],
    Moderate: ['stroke_team_activation', 'thrombectomy_evaluation', 'admit_stroke_unit', 'neurology_consult'],
    Unfavorable: ['neurology_consult', 'supportive_care', 'goals_of_care_discussion', 'admit_icu'],
  },
}
