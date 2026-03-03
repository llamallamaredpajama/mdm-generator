import type { CdrSeed } from '../types'

/**
 * QUARANTINED: Kleihauer-Betke / RhIG Dosing
 *
 * Reason: Pure laboratory test interpretation and dosing calculation. The core
 * calculation (fetal cell % × maternal blood volume → FMH volume → RhIG vials)
 * depends entirely on lab results. Only 1 of 3 components is user-answerable
 * (maternal_blood_volume estimate). The fetal_cell_percentage (number_range,
 * section2) and rh_negative_confirmed (boolean, section2) are lab results.
 *
 * Cannot reach 3 user-answerable interactive components without inventing
 * criteria not in the published source (ACOG Practice Bulletin No. 181, 2017;
 * Sebring & Polesky, Transfusion 1990).
 */
export const kleihauerBetke: CdrSeed = {
  id: 'kleihauer_betke',
  name: 'Kleihauer-Betke / RhIG Dosing',
  fullName: 'Kleihauer-Betke Interpretation & RhIG Dosing',
  category: 'OB/GYN & OBSTETRIC EMERGENCY',
  application:
    'Quantifies fetal-maternal hemorrhage (FMH) volume to determine adequate RhIG (RhoGAM) dosing in Rh-negative mothers. Standard dose of 300 μg covers 30 mL of fetal whole blood.',
  applicableChiefComplaints: [
    'trauma_in_pregnancy',
    'vaginal_bleeding_in_pregnancy',
    'obstetric_emergency',
    'placental_abruption',
  ],
  keywords: [
    'Kleihauer-Betke',
    'KB test',
    'RhIG',
    'RhoGAM',
    'fetal-maternal hemorrhage',
    'FMH',
    'Rh negative',
    'alloimmunization',
    'anti-D',
  ],
  requiredTests: ['Kleihauer-Betke test', 'blood type', 'Rh factor'],
  components: [
    {
      id: 'fetal_cell_percentage',
      label: 'Fetal cell percentage (%)',
      type: 'number_range',
      source: 'section2',
      autoPopulateFrom: 'test_result',
      min: 0,
      max: 100,
    },
    {
      id: 'maternal_blood_volume',
      label: 'Estimated maternal blood volume (mL)',
      type: 'select',
      source: 'user_input',
      options: [
        { label: '~4000 mL (average, non-pregnant baseline)', value: 4000 },
        { label: '~5000 mL (term pregnancy, average)', value: 5000 },
        { label: '~5500 mL (large maternal habitus or multiple gestation)', value: 5500 },
      ],
    },
    {
      id: 'rh_negative_confirmed',
      label: 'Mother confirmed Rh-negative',
      type: 'boolean',
      value: 0,
      source: 'section2',
      autoPopulateFrom: 'test_result',
    },
  ],
  scoring: {
    method: 'algorithm',
    ranges: [
      {
        min: 0,
        max: 0,
        risk: 'No FMH Detected',
        interpretation:
          'Fetal cell percentage = 0%; no detectable fetal-maternal hemorrhage; administer 1 standard dose (300 μg) RhIG if Rh-negative and <20 weeks, per protocol',
      },
      {
        min: 1,
        max: 30,
        risk: 'Standard Dose',
        interpretation:
          'FMH ≤30 mL fetal whole blood: 1 standard dose (300 μg) RhIG adequate. Formula: FMH (mL) = fetal cell % × maternal blood volume (mL) / 100',
      },
      {
        min: 31,
        max: 500,
        risk: 'Additional Doses',
        interpretation:
          'FMH >30 mL: Calculate vials = FMH (mL) ÷ 30, round up, then add 1 extra vial. Example: 75 mL FMH → 75/30 = 2.5 → round up to 3 + 1 = 4 vials',
      },
    ],
  },
  suggestedTreatments: {
    'No FMH Detected': ['rhig_300mcg_standard_dose', 'ob_follow_up'],
    'Standard Dose': ['rhig_300mcg_standard_dose', 'repeat_kb_24h', 'ob_follow_up'],
    'Additional Doses': [
      'rhig_multiple_vials',
      'blood_bank_consult',
      'repeat_kb_24h',
      'ob_consult',
      'monitor_for_anemia',
    ],
  },
}
