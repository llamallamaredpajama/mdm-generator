import type { CdrSeed } from '../types'

/**
 * QUARANTINE: Reticulocyte Production Index (RPI)
 *
 * Reason: Primarily lab-based formula — RPI = Reticulocyte% × (Patient Hct / Normal Hct) / Maturation factor.
 * Only 2 user-answerable components (normal_hct and maturation_factor selects with source: user_input),
 * which are lookup/conversion factors derived from lab values. Cannot reach ≥3 user-answerable
 * components without inventing criteria not in the published source.
 *
 * Source: Piva et al., Am J Clin Pathol 2015; Hoffbrand & Moss, Essential Haematology
 */
export const rpi: CdrSeed = {
  id: 'rpi',
  name: 'Reticulocyte Production Index',
  fullName: 'Reticulocyte Production Index (RPI)',
  category: 'HEMATOLOGY / COAGULATION',
  application:
    'Corrects reticulocyte count for anemia severity and reticulocyte maturation time. Distinguishes hypoproliferative vs. hyperproliferative anemia.',
  applicableChiefComplaints: ['anemia', 'fatigue', 'weakness', 'pallor'],
  keywords: [
    'RPI',
    'reticulocyte production index',
    'anemia',
    'reticulocyte',
    'hemolysis',
    'bone marrow',
    'hypoproliferative',
    'hyperproliferative',
  ],
  requiredTests: ['CBC', 'reticulocyte count', 'hematocrit'],
  components: [
    {
      id: 'reticulocyte_pct',
      label: 'Reticulocyte Count (%)',
      type: 'number_range',
      source: 'section2',
      autoPopulateFrom: 'test_result',
      min: 0,
      max: 30,
    },
    {
      id: 'patient_hct',
      label: 'Patient Hematocrit (%)',
      type: 'number_range',
      source: 'section2',
      autoPopulateFrom: 'test_result',
      min: 5,
      max: 65,
    },
    {
      id: 'normal_hct',
      label: 'Normal Hematocrit (% — typically 45 for males, 40 for females)',
      type: 'select',
      source: 'user_input',
      options: [
        { label: 'Male (normal Hct = 45%)', value: 45 },
        { label: 'Female (normal Hct = 40%)', value: 40 },
      ],
    },
    {
      id: 'maturation_factor',
      label: 'Maturation Factor (based on Hct)',
      type: 'select',
      source: 'user_input',
      options: [
        { label: 'Hct ≥35% → Factor 1.0', value: 1 },
        { label: 'Hct 25–34% → Factor 1.5', value: 2 },
        { label: 'Hct 15–24% → Factor 2.0', value: 3 },
        { label: 'Hct <15% → Factor 2.5', value: 4 },
      ],
    },
  ],
  scoring: {
    method: 'algorithm',
    ranges: [
      {
        min: 0,
        max: 1,
        risk: 'Hypoproliferative',
        interpretation:
          'RPI <2: Inadequate bone marrow response (hypoproliferative) — consider iron deficiency, B12/folate deficiency, anemia of chronic disease, myelodysplastic syndrome, or bone marrow failure. Order iron studies, B12, folate, reticulocyte count.',
      },
      {
        min: 2,
        max: 30,
        risk: 'Hyperproliferative',
        interpretation:
          'RPI ≥2: Appropriate bone marrow response (hyperproliferative) — consistent with hemolysis or acute blood loss. Order LDH, haptoglobin, indirect bilirubin, peripheral smear, direct Coombs test.',
      },
    ],
  },
  suggestedTreatments: {
    Hypoproliferative: [
      'iron_studies',
      'b12_folate_levels',
      'consider_bone_marrow_biopsy',
      'hematology_consult',
    ],
    Hyperproliferative: [
      'ldh_haptoglobin_indirect_bilirubin',
      'peripheral_smear',
      'direct_coombs',
      'type_and_screen',
      'transfuse_if_symptomatic',
    ],
  },
}
