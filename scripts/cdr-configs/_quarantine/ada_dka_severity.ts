// QUARANTINE REASON: ADA DKA Severity classification is primarily lab-based.
// Only 1 of 6 components is user-answerable (mental_status/section1).
// Other 5 components are all section2 lab values: arterial pH, bicarbonate, ketones, glucose, anion gap.
// ADA Standards of Medical Care define DKA severity by pH, bicarb, and mental status — cannot add
// clinical criteria not in the published classification without distorting the tool.

import type { CdrSeed } from '../types'

export const adaDkaSeverityCdr: CdrSeed = {
  id: 'ada_dka_severity',
  name: 'ADA DKA Severity',
  fullName: 'ADA DKA Severity Criteria',
  category: 'ENDOCRINE',
  application:
    'Classifies diabetic ketoacidosis (DKA) severity as mild, moderate, or severe to guide management intensity and disposition.',
  applicableChiefComplaints: [
    'DKA',
    'diabetic_ketoacidosis',
    'hyperglycemia',
    'nausea_vomiting',
    'altered_mental_status',
    'abdominal_pain',
  ],
  keywords: [
    'DKA',
    'diabetic ketoacidosis',
    'ADA',
    'severity',
    'pH',
    'bicarbonate',
    'anion gap',
    'insulin',
    'glucose',
    'SGLT2',
  ],
  requiredTests: [
    'arterial blood gas (pH)',
    'serum bicarbonate',
    'blood glucose',
    'anion gap',
    'serum/urine ketones',
    'BMP (sodium, potassium, creatinine)',
    'CBC',
    'urinalysis',
    'phosphate',
  ],
  components: [
    {
      id: 'arterial_ph',
      label: 'Arterial pH',
      type: 'select',
      source: 'section2',
      autoPopulateFrom: 'test_result',
      options: [
        { label: '7.25–7.30 (Mild)', value: 1 },
        { label: '7.00–7.24 (Moderate)', value: 2 },
        { label: '<7.00 (Severe)', value: 3 },
      ],
    },
    {
      id: 'bicarbonate',
      label: 'Serum Bicarbonate (mEq/L)',
      type: 'select',
      source: 'section2',
      autoPopulateFrom: 'test_result',
      options: [
        { label: '15–18 mEq/L (Mild)', value: 1 },
        { label: '10–14.9 mEq/L (Moderate)', value: 2 },
        { label: '<10 mEq/L (Severe)', value: 3 },
      ],
    },
    {
      id: 'mental_status',
      label: 'Mental Status',
      type: 'select',
      source: 'section1',
      autoPopulateFrom: 'narrative_analysis',
      options: [
        { label: 'Alert (Mild)', value: 1 },
        { label: 'Alert/drowsy (Moderate)', value: 2 },
        { label: 'Stupor / Coma (Severe)', value: 3 },
      ],
    },
    {
      id: 'ketones',
      label: 'Urine Ketones / Serum Ketones',
      type: 'select',
      source: 'section2',
      autoPopulateFrom: 'test_result',
      options: [
        { label: 'Positive (present in all severities)', value: 0 },
        { label: 'Strongly positive', value: 0 },
      ],
    },
    {
      id: 'glucose',
      label: 'Blood Glucose (mg/dL)',
      type: 'select',
      source: 'section2',
      autoPopulateFrom: 'test_result',
      options: [
        { label: '>250 (typical DKA)', value: 0 },
        { label: '≤250 (euglycemic DKA)', value: 0 },
      ],
    },
    {
      id: 'anion_gap',
      label: 'Anion Gap >10 mEq/L',
      type: 'boolean',
      value: 0,
      source: 'section2',
      autoPopulateFrom: 'test_result',
    },
  ],
  scoring: {
    method: 'algorithm',
    ranges: [
      { min: 1, max: 1, risk: 'Low', interpretation: 'Mild DKA' },
      { min: 2, max: 2, risk: 'Moderate', interpretation: 'Moderate DKA' },
      { min: 3, max: 3, risk: 'High', interpretation: 'Severe DKA' },
    ],
  },
}
