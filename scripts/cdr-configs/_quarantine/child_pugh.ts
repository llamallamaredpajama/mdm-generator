import type { CdrSeed } from '../types'

/**
 * QUARANTINED: Child-Pugh Score
 *
 * Reason: Only 2 of 5 components are user-answerable (ascites and encephalopathy
 * are section1 clinical assessments). The remaining 3 components (bilirubin,
 * albumin, INR) are lab values (section2). The published source (Pugh et al.,
 * Br J Surg 1973) defines exactly these 5 variables with no additional clinical
 * components that could bring the user-answerable count to >= 3.
 *
 * Note: The original Child-Turcotte classification (1964) included "nutritional
 * status" as a clinical variable, but the Pugh 1973 modification (the standard
 * used today) replaced it with prothrombin time (a lab value).
 */
export const child_pugh: CdrSeed = {
  id: 'child_pugh',
  name: 'Child-Pugh Score',
  fullName: 'Child-Pugh Score',
  category: 'DISPOSITION / RISK STRATIFICATION',
  application:
    'Classifies cirrhosis severity; predicts surgical risk and survival. Class C (score 10-15) associated with 45% 1-year and 35% 2-year survival.',
  applicableChiefComplaints: [
    'cirrhosis',
    'liver_disease',
    'ascites',
    'hepatic_encephalopathy',
    'jaundice',
    'GI_bleed',
  ],
  keywords: [
    'Child-Pugh',
    'cirrhosis',
    'liver failure',
    'surgical risk',
    'ascites',
    'encephalopathy',
    'bilirubin',
    'albumin',
    'INR',
    'hepatic',
  ],
  requiredTests: ['bilirubin', 'albumin', 'INR'],
  components: [
    {
      id: 'bilirubin',
      label: 'Total Bilirubin',
      type: 'select',
      source: 'section2',
      autoPopulateFrom: 'test_result',
      options: [
        { label: '<2 mg/dL (<34 umol/L)', value: 1 },
        { label: '2-3 mg/dL (34-50 umol/L)', value: 2 },
        { label: '>3 mg/dL (>50 umol/L)', value: 3 },
      ],
    },
    {
      id: 'albumin',
      label: 'Serum Albumin',
      type: 'select',
      source: 'section2',
      autoPopulateFrom: 'test_result',
      options: [
        { label: '>3.5 g/dL', value: 1 },
        { label: '2.8-3.5 g/dL', value: 2 },
        { label: '<2.8 g/dL', value: 3 },
      ],
    },
    {
      id: 'inr',
      label: 'INR (Prothrombin Time)',
      type: 'select',
      source: 'section2',
      autoPopulateFrom: 'test_result',
      options: [
        { label: 'INR <1.7', value: 1 },
        { label: 'INR 1.7-2.3', value: 2 },
        { label: 'INR >2.3', value: 3 },
      ],
    },
    {
      id: 'ascites',
      label: 'Ascites',
      type: 'select',
      source: 'section1',
      autoPopulateFrom: 'narrative_analysis',
      options: [
        { label: 'Absent', value: 1 },
        { label: 'Slight (controlled with diuretics)', value: 2 },
        { label: 'Moderate-severe (refractory)', value: 3 },
      ],
    },
    {
      id: 'encephalopathy',
      label: 'Hepatic Encephalopathy',
      type: 'select',
      source: 'section1',
      autoPopulateFrom: 'narrative_analysis',
      options: [
        { label: 'None', value: 1 },
        { label: 'Grade 1-2 (mild confusion, asterixis)', value: 2 },
        { label: 'Grade 3-4 (somnolence to coma)', value: 3 },
      ],
    },
  ],
  scoring: {
    method: 'sum',
    ranges: [
      { min: 5, max: 6, risk: 'Low', interpretation: 'Class A (5-6): Well-compensated cirrhosis; 1-year survival 100%, 2-year 85%' },
      { min: 7, max: 9, risk: 'Moderate', interpretation: 'Class B (7-9): Significant compromise; 1-year survival 81%, 2-year 57%' },
      { min: 10, max: 15, risk: 'High', interpretation: 'Class C (10-15): Decompensated cirrhosis; 1-year survival 45%, 2-year 35%; high surgical mortality' },
    ],
  },
  suggestedTreatments: {
    High: ['icu_consult', 'gi_hepatology_consult', 'transplant_evaluation', 'avoid_elective_procedures'],
    Moderate: ['gi_hepatology_consult', 'medical_optimization', 'transplant_referral'],
    Low: ['outpatient_follow_up', 'hepatology_referral'],
  },
}
