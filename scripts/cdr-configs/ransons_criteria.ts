import type { CdrSeed } from './types'

/**
 * RESCUED from quarantine: Ranson's Criteria
 *
 * Previously quarantined because lab components used source: 'section2'.
 * Converted lab/imaging components to source: 'user_input' — physicians enter
 * categorical lab results via select/boolean UI.
 * Thresholds verified against Ranson et al., Surg Gynecol Obstet 1974;
 * StatPearls NBK482345 (updated 2022-09-26).
 */
export const ransonsCriteria: CdrSeed = {
  id: 'ransons_criteria',
  name: "Ranson's Criteria",
  fullName: "Ranson's Criteria",
  category: 'GASTROINTESTINAL',
  application:
    'Predicts severity and mortality in acute pancreatitis. Assessed at admission AND at 48 hours.',
  applicableChiefComplaints: ['abdominal_pain', 'pancreatitis', 'epigastric_pain'],
  keywords: [
    "Ranson's criteria",
    'pancreatitis',
    'acute pancreatitis',
    'severity',
    'mortality',
    'LDH',
    'AST',
    'calcium',
    'hematocrit',
  ],
  requiredTests: ['WBC', 'glucose', 'LDH', 'AST', 'hematocrit', 'BUN', 'calcium', 'arterial blood gas'],
  components: [
    {
      id: 'admission_age',
      label: 'At Admission: Age >55 years',
      type: 'boolean',
      value: 1,
      source: 'section1',
      autoPopulateFrom: 'narrative_analysis',
    },
    {
      id: 'admission_wbc',
      label: 'At Admission: WBC >16,000/µL',
      type: 'boolean',
      value: 1,
      source: 'user_input',
    },
    {
      id: 'admission_glucose',
      label: 'At Admission: Blood glucose >200 mg/dL (>11.1 mmol/L)',
      type: 'boolean',
      value: 1,
      source: 'user_input',
    },
    {
      id: 'admission_ldh',
      label: 'At Admission: LDH >350 IU/L',
      type: 'boolean',
      value: 1,
      source: 'user_input',
    },
    {
      id: 'admission_ast',
      label: 'At Admission: AST >250 IU/L',
      type: 'boolean',
      value: 1,
      source: 'user_input',
    },
    {
      id: '48h_hct_drop',
      label: 'At 48h: Hematocrit decrease >10%',
      type: 'boolean',
      value: 1,
      source: 'user_input',
    },
    {
      id: '48h_bun_rise',
      label: 'At 48h: BUN increase >5 mg/dL (>1.8 mmol/L)',
      type: 'boolean',
      value: 1,
      source: 'user_input',
    },
    {
      id: '48h_calcium',
      label: 'At 48h: Serum calcium <8 mg/dL (<2 mmol/L)',
      type: 'boolean',
      value: 1,
      source: 'user_input',
    },
    {
      id: '48h_pao2',
      label: 'At 48h: PaO₂ <60 mmHg',
      type: 'boolean',
      value: 1,
      source: 'user_input',
    },
    {
      id: '48h_base_deficit',
      label: 'At 48h: Base deficit >4 mEq/L',
      type: 'boolean',
      value: 1,
      source: 'user_input',
    },
    {
      id: '48h_fluid_sequestration',
      label: 'At 48h: Estimated fluid sequestration >6 L',
      type: 'boolean',
      value: 1,
      source: 'user_input',
    },
  ],
  scoring: {
    method: 'sum',
    ranges: [
      { min: 0, max: 2, risk: 'Mild', interpretation: '~1% mortality; mild pancreatitis' },
      { min: 3, max: 4, risk: 'Moderate', interpretation: '~15% mortality' },
      { min: 5, max: 6, risk: 'Severe', interpretation: '~40% mortality' },
      {
        min: 7,
        max: 11,
        risk: 'Critical',
        interpretation: '~100% mortality; requires ICU-level care',
      },
    ],
  },
  suggestedTreatments: {
    Critical: [
      'icu_admission',
      'aggressive_iv_fluid_resuscitation',
      'pain_management',
      'npo',
      'surgery_consult',
    ],
    Severe: [
      'icu_admission',
      'aggressive_iv_fluid_resuscitation',
      'pain_management',
      'npo',
      'gi_consult',
    ],
    Moderate: [
      'iv_fluid_resuscitation',
      'pain_management',
      'npo',
      'admit_monitored_bed',
    ],
    Mild: ['iv_fluids', 'pain_management', 'advance_diet_as_tolerated'],
  },
}
