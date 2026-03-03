/**
 * QUARANTINED: rumack_matthew
 *
 * Reason: Nomogram with only 2 user-answerable components (hours since ingestion,
 * risk factors). Core component (APAP level vs treatment line) is a lab-based
 * nomogram lookup. Cannot add a 3rd clinical criterion from the published
 * Rumack-Matthew source.
 */

import type { CdrSeed } from '../types'

export const rumackMatthew: CdrSeed = {
  id: 'rumack_matthew',
  name: 'Rumack-Matthew Nomogram',
  fullName: 'Rumack-Matthew Nomogram',
  category: 'TOXICOLOGY',
  application:
    'Determines need for N-acetylcysteine (NAC) treatment in acute acetaminophen (APAP) overdose based on serum APAP level and hours since ingestion. Only valid for single acute ingestion with a reliably known time. Not applicable to chronic ingestions, unknown time of ingestion, or ingestions <4 hours prior.',
  applicableChiefComplaints: [
    'overdose',
    'acetaminophen_overdose',
    'APAP_overdose',
    'intentional_ingestion',
    'toxic_ingestion',
  ],
  keywords: [
    'Rumack-Matthew',
    'acetaminophen',
    'APAP',
    'NAC',
    'N-acetylcysteine',
    'overdose',
    'nomogram',
    'hepatotoxicity',
    'Tylenol',
  ],
  requiredTests: ['serum acetaminophen level (4-hour post-ingestion minimum)', 'LFTs', 'INR', 'BMP'],
  components: [
    // Time since ingestion
    {
      id: 'hours_since_ingestion',
      label: 'Hours since ingestion (must be ≥4h for valid level)',
      type: 'select',
      source: 'section1',
      autoPopulateFrom: 'narrative_analysis',
      options: [
        { label: '<4 hours (level not yet interpretable)', value: 0 },
        { label: '4 hours', value: 1 },
        { label: '6 hours', value: 2 },
        { label: '8 hours', value: 3 },
        { label: '10 hours', value: 4 },
        { label: '12 hours', value: 5 },
        { label: '16 hours', value: 6 },
        { label: '20 hours', value: 7 },
        { label: '24 hours', value: 8 },
      ],
    },
    // APAP level relative to Rumack-Matthew treatment line
    {
      id: 'apap_level_vs_treatment_line',
      label: 'Serum APAP level relative to Rumack-Matthew treatment line',
      type: 'select',
      source: 'section2',
      autoPopulateFrom: 'test_result',
      options: [
        { label: 'Below treatment line — NAC not indicated (single acute ingestion)', value: 0 },
        {
          label:
            'At or above treatment line (≥150 µg/mL at 4h; ≥75 at 8h; ≥37.5 at 12h; ≥18.75 at 16h) — Start NAC',
          value: 1,
        },
        {
          label: 'Cannot plot — unknown time, chronic ingestion, or extended-release product',
          value: 2,
        },
      ],
    },
    // Risk factors increasing hepatotoxicity risk
    {
      id: 'risk_factors',
      label: 'High-risk features present (chronic EtOH, malnourishment, CYP inducers, fasting)',
      type: 'boolean',
      value: 1,
      source: 'section1',
      autoPopulateFrom: 'narrative_analysis',
    },
  ],
  scoring: {
    method: 'algorithm',
    ranges: [
      {
        min: 0,
        max: 0,
        risk: 'Low',
        interpretation:
          'APAP level BELOW treatment line on nomogram for known single acute ingestion: NAC not indicated. Continue to monitor LFTs if level was drawn early; reassess if clinical picture changes.',
      },
      {
        min: 1,
        max: 1,
        risk: 'High',
        interpretation:
          'APAP level AT or ABOVE treatment line: Start NAC immediately. IV NAC (21-hour protocol): 150 mg/kg over 1h → 50 mg/kg over 4h → 100 mg/kg over 16h. Oral NAC also effective. Treatment threshold: 150 µg/mL at 4h, 75 µg/mL at 8h, 37.5 µg/mL at 12h, 18.75 µg/mL at 16h.',
      },
      {
        min: 2,
        max: 3,
        risk: 'Indeterminate',
        interpretation:
          'Unknown time of ingestion, extended-release product, chronic ingestion, or high-risk features: Empirically treat with NAC pending clinical and laboratory evaluation. Consult Poison Control (1-800-222-1222).',
      },
    ],
  },
  suggestedTreatments: {
    High: [
      'nac_iv_21hr_protocol',
      'nac_oral_72hr_if_iv_unavailable',
      'poison_control_consult',
      'serial_lfts_inr',
      'admission_hepatology_if_elevated_ast',
      'iv_fluid_support',
    ],
    Indeterminate: [
      'nac_empiric_iv',
      'poison_control_consult',
      'serial_apap_levels',
      'serial_lfts_inr',
      'admission',
    ],
    Low: ['serial_lfts_if_symptomatic', 'discharge_with_return_precautions', 'psychiatry_consult_if_intentional'],
  },
}
