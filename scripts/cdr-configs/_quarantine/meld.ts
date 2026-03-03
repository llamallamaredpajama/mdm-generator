import type { CdrSeed } from '../types'

/**
 * QUARANTINED: MELD Score
 *
 * Reason: All components are lab-based (section2). The MELD score uses serum
 * bilirubin, INR, and creatinine — all laboratory values. The original authors
 * (Kamath et al., Hepatology 2001) explicitly excluded clinical variables
 * (ascites, encephalopathy) from the model in favor of objective lab measurements.
 *
 * Source: Kamath et al., Hepatology 2001; Wiesner et al., Gastroenterology 2003
 *
 * This CDR cannot have >= 3 user-answerable components (type boolean/select
 * AND source section1/user_input) because the published source contains
 * zero clinical exam or physician judgment components.
 */
export const meld: CdrSeed = {
  id: 'meld',
  name: 'MELD Score',
  fullName: 'MELD Score / MELD-Na',
  category: 'DISPOSITION / RISK STRATIFICATION',
  application:
    'End-stage liver disease severity; transplant prioritization; predicts 90-day mortality. MELD >15 generally indicates transplant evaluation.',
  applicableChiefComplaints: [
    'liver_failure',
    'cirrhosis',
    'ascites',
    'hepatic_encephalopathy',
    'jaundice',
    'GI_bleed',
  ],
  keywords: [
    'MELD',
    'MELD-Na',
    'liver disease',
    'transplant',
    'cirrhosis',
    'creatinine',
    'bilirubin',
    'INR',
    'sodium',
    '90-day mortality',
  ],
  requiredTests: ['creatinine', 'bilirubin', 'INR', 'sodium'],
  components: [
    {
      id: 'bilirubin',
      label: 'Total Bilirubin (mg/dL)',
      type: 'select',
      source: 'section2',
      autoPopulateFrom: 'test_result',
      options: [
        { label: '<1.0 mg/dL (floor 1.0 in calculation)', value: 1 },
        { label: '1.0-1.9 mg/dL', value: 3 },
        { label: '2.0-3.9 mg/dL', value: 6 },
        { label: '4.0-7.9 mg/dL', value: 9 },
        { label: '>=8.0 mg/dL', value: 12 },
      ],
    },
    {
      id: 'inr',
      label: 'INR',
      type: 'select',
      source: 'section2',
      autoPopulateFrom: 'test_result',
      options: [
        { label: '<1.0 (floor 1.0 in calculation)', value: 0 },
        { label: '1.0-1.4', value: 2 },
        { label: '1.5-1.9', value: 5 },
        { label: '2.0-2.9', value: 8 },
        { label: '>=3.0', value: 11 },
      ],
    },
    {
      id: 'creatinine',
      label: 'Creatinine (mg/dL)',
      type: 'select',
      source: 'section2',
      autoPopulateFrom: 'test_result',
      options: [
        { label: '<1.0 mg/dL (floor 1.0 in calculation)', value: 0 },
        { label: '1.0-1.4 mg/dL', value: 3 },
        { label: '1.5-1.9 mg/dL', value: 6 },
        { label: '2.0-3.9 mg/dL', value: 9 },
        { label: '>=4.0 mg/dL (cap 4.0) or dialysis', value: 12 },
      ],
    },
  ],
  scoring: {
    method: 'algorithm',
    ranges: [
      { min: 6, max: 9, risk: 'Low', interpretation: 'MELD <10: ~2% 90-day mortality' },
      { min: 10, max: 19, risk: 'Moderate', interpretation: 'MELD 10-19: ~6% 90-day mortality' },
      { min: 20, max: 29, risk: 'High', interpretation: 'MELD 20-29: ~20% 90-day mortality; transplant evaluation strongly considered' },
      { min: 30, max: 39, risk: 'Very High', interpretation: 'MELD 30-39: ~53% 90-day mortality; high transplant priority' },
      { min: 40, max: 40, risk: 'Critical', interpretation: 'MELD >=40: ~71% 90-day mortality; urgent transplant priority' },
    ],
  },
  suggestedTreatments: {
    Critical: ['icu_admission', 'transplant_center_transfer', 'gi_hepatology_consult'],
    'Very High': ['transplant_center_transfer', 'gi_hepatology_consult', 'icu_consult'],
    High: ['gi_hepatology_consult', 'transplant_evaluation', 'admission'],
    Moderate: ['gi_hepatology_consult', 'outpatient_transplant_referral'],
    Low: ['outpatient_follow_up', 'hepatology_referral'],
  },
}
