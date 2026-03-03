import type { CdrSeed } from '../types'

/**
 * QUARANTINED: Done Nomogram
 *
 * Reason: Only 2 of 4 components are user-answerable (section1):
 *   - Hours since ingestion (section1)
 *   - Clinical severity findings (section1)
 * The other 2 are lab-based (section2):
 *   - Serum salicylate level
 *   - Acidemia (pH <7.35)
 * Additionally, this tool is described as "historical; largely abandoned"
 * and "NOT recommended for clinical decision-making" (Done, Pediatrics 1960).
 * The original nomogram is just a graph of salicylate level vs. time;
 * no additional clinical criteria exist in the published source.
 */
export const done_nomogram: CdrSeed = {
  id: 'done_nomogram',
  name: 'Done Nomogram',
  fullName: 'Done Nomogram',
  category: 'TOXICOLOGY',
  application:
    'Historically used to predict salicylate toxicity severity based on serum salicylate level and time since ingestion. Now considered unreliable and NOT recommended for clinical decision-making.',
  applicableChiefComplaints: [
    'salicylate_overdose',
    'aspirin_overdose',
    'toxic_ingestion',
    'tinnitus',
    'tachypnea',
  ],
  keywords: [
    'Done nomogram',
    'salicylate',
    'aspirin',
    'overdose',
    'toxicity',
    'hemodialysis',
    'historical',
  ],
  requiredTests: ['serum salicylate level', 'arterial blood gas', 'pH'],
  components: [
    {
      id: 'hours_since_ingestion',
      label: 'Hours since ingestion',
      type: 'select',
      source: 'section1',
      autoPopulateFrom: 'narrative_analysis',
      options: [
        { label: '<6 hours (level may not yet reflect peak)', value: 0 },
        { label: '6–12 hours', value: 1 },
        { label: '12–24 hours', value: 2 },
        { label: '>24 hours or unknown (nomogram unreliable)', value: 3 },
      ],
    },
    {
      id: 'serum_salicylate_level',
      label: 'Serum salicylate level (mg/dL)',
      type: 'select',
      source: 'section2',
      autoPopulateFrom: 'test_result',
      options: [
        { label: '<30 mg/dL (therapeutic range)', value: 0 },
        { label: '30–50 mg/dL (mild toxicity)', value: 1 },
        { label: '50–75 mg/dL (moderate toxicity)', value: 2 },
        { label: '75–100 mg/dL (severe toxicity)', value: 3 },
        { label: '>100 mg/dL (potentially lethal)', value: 4 },
      ],
    },
    {
      id: 'clinical_severity',
      label: 'Clinical severity findings',
      type: 'select',
      source: 'section1',
      autoPopulateFrom: 'narrative_analysis',
      options: [
        { label: 'Asymptomatic or tinnitus only', value: 0 },
        { label: 'Tachypnea, nausea, vomiting', value: 1 },
        { label: 'Altered mental status, hyperthermia, or severe acid-base disturbance', value: 2 },
        { label: 'Seizures, coma, cardiovascular collapse, or pulmonary edema', value: 3 },
      ],
    },
    {
      id: 'acidemia_present',
      label: 'Acidemia present (pH <7.35)',
      type: 'boolean',
      value: 1,
      source: 'section2',
      autoPopulateFrom: 'test_result',
    },
  ],
  scoring: {
    method: 'algorithm',
    ranges: [
      {
        min: 0,
        max: 2,
        risk: 'Mild',
        interpretation:
          'Mild toxicity: Tinnitus, nausea, vomiting; GI decontamination if early, supportive care, serial salicylate levels q2h until trending down, urine alkalinization',
      },
      {
        min: 3,
        max: 5,
        risk: 'Moderate',
        interpretation:
          'Moderate toxicity: Tachypnea, diaphoresis, acid-base disturbance; aggressive IV fluids, urine alkalinization (target urine pH 7.5–8.0), serial levels, consider nephrology/toxicology consult',
      },
      {
        min: 6,
        max: 11,
        risk: 'Severe',
        interpretation:
          'Severe toxicity: AMS, seizures, pulmonary edema, renal failure, or level >100 mg/dL — emergent hemodialysis indicated; ICU admission. Note: Done Nomogram is unreliable; treat based on clinical status, not nomogram position',
      },
    ],
  },
  suggestedTreatments: {
    Severe: [
      'emergent_hemodialysis',
      'icu_admission',
      'toxicology_consult',
      'intubation_caution_maintain_hyperventilation',
    ],
    Moderate: [
      'iv_fluids_aggressive',
      'urine_alkalinization',
      'serial_salicylate_levels',
      'toxicology_consult',
    ],
    Mild: [
      'gi_decontamination_if_early',
      'serial_salicylate_levels_q2h',
      'urine_alkalinization',
      'supportive_care',
    ],
  },
}
