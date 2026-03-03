import type { CdrSeed } from '../types'

/**
 * QUARANTINE: ISTH DIC Score
 *
 * Reason: All 4 scoring components are lab-based (platelet count, D-dimer/FDP,
 * prolonged PT, fibrinogen level) with source: section2. Zero user-answerable
 * interactive components possible from the published ISTH SSC criteria.
 *
 * Source: Taylor et al., Thromb Haemost 2001 (ISTH SSC criteria)
 */
export const isthDic: CdrSeed = {
  id: 'isth_dic',
  name: 'ISTH DIC Score',
  fullName: 'ISTH DIC Score',
  category: 'HEMATOLOGY / COAGULATION',
  application:
    'Diagnoses overt disseminated intravascular coagulation. Requires underlying condition known to be associated with DIC (sepsis, trauma, malignancy, obstetric complications).',
  applicableChiefComplaints: ['DIC', 'coagulopathy', 'sepsis', 'bleeding', 'thrombocytopenia'],
  keywords: [
    'ISTH',
    'DIC',
    'disseminated intravascular coagulation',
    'coagulopathy',
    'platelets',
    'D-dimer',
    'fibrinogen',
    'PT',
  ],
  requiredTests: ['platelet count', 'D-dimer', 'fibrin degradation products', 'PT', 'fibrinogen'],
  components: [
    {
      id: 'platelet_count',
      label: 'Platelet Count',
      type: 'select',
      source: 'section2',
      autoPopulateFrom: 'test_result',
      options: [
        { label: '≥100 × 10⁹/L', value: 0 },
        { label: '50–99 × 10⁹/L', value: 1 },
        { label: '<50 × 10⁹/L', value: 2 },
      ],
    },
    {
      id: 'd_dimer',
      label: 'D-dimer / Fibrin Degradation Products (FDP)',
      type: 'select',
      source: 'section2',
      autoPopulateFrom: 'test_result',
      options: [
        { label: 'No increase (normal)', value: 0 },
        { label: 'Moderate increase (elevated but <5× ULN)', value: 2 },
        { label: 'Strong increase (≥5× ULN or markedly elevated)', value: 3 },
      ],
    },
    {
      id: 'prolonged_pt',
      label: 'Prolonged Prothrombin Time (PT)',
      type: 'select',
      source: 'section2',
      autoPopulateFrom: 'test_result',
      options: [
        { label: '<3 seconds above upper limit of normal', value: 0 },
        { label: '3–6 seconds above upper limit of normal', value: 1 },
        { label: '>6 seconds above upper limit of normal', value: 2 },
      ],
    },
    {
      id: 'fibrinogen',
      label: 'Fibrinogen Level',
      type: 'select',
      source: 'section2',
      autoPopulateFrom: 'test_result',
      options: [
        { label: '≥100 mg/dL (≥1.0 g/L)', value: 0 },
        { label: '<100 mg/dL (<1.0 g/L)', value: 1 },
      ],
    },
  ],
  scoring: {
    method: 'sum',
    ranges: [
      {
        min: 0,
        max: 4,
        risk: 'Low',
        interpretation:
          'Score <5: Not suggestive of overt DIC; repeat in 1–2 days if clinical suspicion remains. Monitor for evolving coagulopathy.',
      },
      {
        min: 5,
        max: 8,
        risk: 'High',
        interpretation:
          'Score ≥5: Compatible with overt DIC; treat underlying cause aggressively + supportive care (platelets if <20 or bleeding, FFP/cryoprecipitate if fibrinogen <100). Repeat score daily.',
      },
    ],
  },
  suggestedTreatments: {
    High: [
      'treat_underlying_cause',
      'platelet_transfusion_if_bleeding',
      'ffp_cryoprecipitate',
      'monitor_coags_q6_12h',
    ],
  },
}
