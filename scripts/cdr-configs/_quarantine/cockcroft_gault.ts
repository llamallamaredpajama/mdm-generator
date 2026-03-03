import type { CdrSeed } from '../types'

/**
 * QUARANTINED: Cockcroft-Gault Equation
 *
 * Reason: Only 1 user-answerable component (patient_sex, select/section1).
 * The other 3 components are number_range: patient_age (section1),
 * patient_weight (section1), and serum_creatinine (section2).
 * This is a formula calculator: CrCl = [(140 - age) × weight] / (72 × SCr) × 0.85 if female.
 * The continuous inputs cannot be converted to boolean/select categories without
 * fundamentally changing the published formula.
 *
 * Source: Cockcroft DW, Gault MH, Nephron 1976;16:31-41
 */
export const cockcroft_gault: CdrSeed = {
  id: 'cockcroft_gault',
  name: 'Cockcroft-Gault',
  fullName: 'Cockcroft-Gault Equation',
  category: 'NEPHROLOGY & ELECTROLYTES',
  application:
    'Estimates creatinine clearance (CrCl) for drug dosing. Still widely used for medication dose adjustments when package inserts reference CrCl.',
  applicableChiefComplaints: ['drug_dosing', 'renal_dosing', 'chronic_kidney_disease'],
  keywords: [
    'Cockcroft-Gault',
    'creatinine clearance',
    'CrCl',
    'drug dosing',
    'renal dosing',
    'medication adjustment',
  ],
  requiredTests: ['serum creatinine', 'weight'],
  components: [
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
      id: 'patient_weight',
      label: 'Patient Weight (kg)',
      type: 'number_range',
      source: 'section1',
      autoPopulateFrom: 'narrative_analysis',
      min: 20,
      max: 300,
    },
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
      id: 'patient_sex',
      label: 'Patient Sex (multiply by 0.85 if female)',
      type: 'select',
      source: 'section1',
      autoPopulateFrom: 'narrative_analysis',
      options: [
        { label: 'Female (× 0.85)', value: 0 },
        { label: 'Male', value: 1 },
      ],
    },
  ],
  scoring: {
    method: 'algorithm',
    ranges: [
      {
        min: 0,
        max: 15,
        risk: 'Severe Impairment',
        interpretation:
          'CrCl <15: Severe impairment; most renally-cleared drugs require significant dose reduction or avoidance',
      },
      {
        min: 16,
        max: 29,
        risk: 'Moderate-Severe',
        interpretation:
          'CrCl 16–29: Moderate-severe impairment; substantial dose adjustment required',
      },
      {
        min: 30,
        max: 59,
        risk: 'Moderate',
        interpretation:
          'CrCl 30–59: Moderate impairment; dose adjustment per drug-specific guidance',
      },
      {
        min: 60,
        max: 200,
        risk: 'Mild/Normal',
        interpretation:
          'CrCl ≥60: Mild impairment or normal; standard dosing or minor adjustment per drug label',
      },
    ],
  },
  suggestedTreatments: {
    'Severe Impairment': [
      'nephrology_consult',
      'avoid_renally_cleared_drugs',
      'significant_dose_reduction',
      'monitor_drug_levels',
    ],
    'Moderate-Severe': [
      'renal_dose_adjustment',
      'avoid_nephrotoxins',
      'monitor_drug_levels',
      'pharmacy_consult',
    ],
    Moderate: [
      'renal_dose_adjustment_per_drug_label',
      'avoid_nephrotoxins',
      'monitor_renal_function',
    ],
    'Mild/Normal': [
      'standard_dosing',
      'check_drug_label_for_minor_adjustments',
    ],
  },
}
