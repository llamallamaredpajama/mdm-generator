import type { CdrSeed } from '../types'

/**
 * QUARANTINED: CKD-EPI Equation (2021 Race-Free)
 *
 * Reason: Only 1 user-answerable component (patient_sex, select/section1).
 * patient_age is number_range (not user-answerable type), and serum_creatinine
 * is section2 (lab). This is fundamentally a formula calculator:
 * eGFR = 142 × min(SCr/κ, 1)^α × max(SCr/κ, 1)^-1.200 × 0.9938^Age × (1.012 if female)
 * — it requires exact lab and demographic inputs, not clinical judgment categories.
 *
 * Source: Inker et al., NEJM 2021;385:1737-1749 (2021 race-free equation)
 */
export const ckd_epi: CdrSeed = {
  id: 'ckd_epi',
  name: 'CKD-EPI',
  fullName: 'CKD-EPI Equation (2021 Race-Free)',
  category: 'NEPHROLOGY & ELECTROLYTES',
  application:
    'Estimates GFR for classification of chronic kidney disease using the 2021 race-free creatinine equation based on serum creatinine, age, and sex.',
  applicableChiefComplaints: ['chronic_kidney_disease', 'renal_failure', 'elevated_creatinine', 'drug_dosing'],
  keywords: [
    'CKD-EPI',
    'eGFR',
    'GFR',
    'chronic kidney disease',
    'renal function',
    'creatinine clearance',
    'CKD staging',
    '2021',
  ],
  requiredTests: ['serum creatinine'],
  components: [
    {
      id: 'serum_creatinine',
      label: 'Serum Creatinine (mg/dL)',
      type: 'number_range',
      source: 'section2',
      autoPopulateFrom: 'test_result',
      min: 0.1,
      max: 25,
    },
    {
      id: 'patient_age',
      label: 'Patient Age (years)',
      type: 'number_range',
      source: 'section1',
      autoPopulateFrom: 'narrative_analysis',
      min: 18,
      max: 120,
    },
    {
      id: 'patient_sex',
      label: 'Patient Sex',
      type: 'select',
      source: 'section1',
      autoPopulateFrom: 'narrative_analysis',
      options: [
        { label: 'Female', value: 0 },
        { label: 'Male', value: 1 },
      ],
    },
  ],
  scoring: {
    method: 'algorithm',
    ranges: [
      {
        min: 0,
        max: 14,
        risk: 'G5 - Kidney Failure',
        interpretation: 'eGFR <15: Kidney failure; dialysis or transplant evaluation',
      },
      {
        min: 15,
        max: 29,
        risk: 'G4 - Severely Decreased',
        interpretation:
          'eGFR 15–29: Severely decreased; nephrology follow-up, dialysis preparation',
      },
      {
        min: 30,
        max: 44,
        risk: 'G3b - Moderately-Severely Decreased',
        interpretation: 'eGFR 30–44: Moderately to severely decreased',
      },
      {
        min: 45,
        max: 59,
        risk: 'G3a - Mildly-Moderately Decreased',
        interpretation: 'eGFR 45–59: Mildly to moderately decreased',
      },
      {
        min: 60,
        max: 89,
        risk: 'G2 - Mildly Decreased',
        interpretation:
          'eGFR 60–89: Mildly decreased (CKD only if other markers present)',
      },
      {
        min: 90,
        max: 200,
        risk: 'G1 - Normal/High',
        interpretation:
          'eGFR ≥90: Normal or high (CKD only if other markers of kidney damage present)',
      },
    ],
  },
  suggestedTreatments: {
    'G5 - Kidney Failure': [
      'nephrology_consult_urgent',
      'dialysis_evaluation',
      'transplant_referral',
      'renal_diet',
      'medication_dose_adjustment',
    ],
    'G4 - Severely Decreased': [
      'nephrology_referral',
      'dialysis_access_planning',
      'renal_diet',
      'medication_dose_adjustment',
      'avoid_nephrotoxins',
    ],
    'G3b - Moderately-Severely Decreased': [
      'nephrology_referral',
      'bp_optimization',
      'medication_dose_adjustment',
      'avoid_nephrotoxins',
    ],
    'G3a - Mildly-Moderately Decreased': [
      'pcp_monitoring',
      'bp_optimization',
      'avoid_nephrotoxins',
      'annual_egfr_monitoring',
    ],
    'G2 - Mildly Decreased': [
      'pcp_monitoring',
      'address_underlying_cause',
      'annual_egfr_monitoring',
    ],
    'G1 - Normal/High': [
      'routine_monitoring',
      'address_proteinuria_if_present',
    ],
  },
}
