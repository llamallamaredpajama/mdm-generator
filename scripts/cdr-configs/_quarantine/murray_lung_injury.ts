// QUARANTINE: murray_lung_injury
// Reason: 0 user-answerable interactive components.
// The Murray Lung Injury Score (Murray JF et al., Am Rev Respir Dis 1988) has 4 components:
// CXR consolidation (imaging/section2), PaO2/FiO2 ratio (ABG/section2),
// PEEP level (ventilator setting/section2), lung compliance (ventilator measurement/section2).
// All 4 are section2 lab/imaging/ventilator results. No clinical history or physician
// judgment components exist in the published criteria.
import type { CdrSeed } from '../types'

export const murrayLungInjury: CdrSeed = {
  id: 'murray_lung_injury',
  name: 'Murray Lung Injury Score',
  fullName: 'Murray Lung Injury Score',
  category: 'PULMONARY',
  application:
    'Quantifies severity of acute lung injury. Can be used to identify patients who may benefit from ECMO.',
  applicableChiefComplaints: ['respiratory_failure', 'shortness_of_breath', 'hypoxia', 'ards'],
  keywords: [
    'Murray score',
    'lung injury score',
    'ARDS',
    'ECMO',
    'acute lung injury',
    'PaO2/FiO2',
    'PEEP',
    'compliance',
  ],
  requiredTests: ['arterial blood gas', 'chest x-ray', 'PaO2/FiO2 ratio', 'lung compliance', 'PEEP'],
  components: [
    {
      id: 'cxr_consolidation',
      label: 'Chest X-Ray (alveolar consolidation)',
      type: 'select',
      source: 'section2',
      autoPopulateFrom: 'test_result',
      options: [
        { label: 'No alveolar consolidation', value: 0 },
        { label: 'Consolidation confined to 1 quadrant', value: 1 },
        { label: 'Consolidation confined to 2 quadrants', value: 2 },
        { label: 'Consolidation confined to 3 quadrants', value: 3 },
        { label: 'Consolidation in all 4 quadrants', value: 4 },
      ],
    },
    {
      id: 'pao2_fio2',
      label: 'PaO2/FiO2 Ratio',
      type: 'select',
      source: 'section2',
      autoPopulateFrom: 'test_result',
      options: [
        { label: '>=300', value: 0 },
        { label: '225–299', value: 1 },
        { label: '175–224', value: 2 },
        { label: '100–174', value: 3 },
        { label: '<100', value: 4 },
      ],
    },
    {
      id: 'peep',
      label: 'PEEP (cmH2O)',
      type: 'select',
      source: 'section2',
      options: [
        { label: '<=5 cmH2O', value: 0 },
        { label: '6–8 cmH2O', value: 1 },
        { label: '9–11 cmH2O', value: 2 },
        { label: '12–14 cmH2O', value: 3 },
        { label: '>=15 cmH2O', value: 4 },
      ],
    },
    {
      id: 'compliance',
      label: 'Lung Compliance (mL/cmH2O)',
      type: 'select',
      source: 'section2',
      options: [
        { label: '>=80 mL/cmH2O', value: 0 },
        { label: '60–79 mL/cmH2O', value: 1 },
        { label: '40–59 mL/cmH2O', value: 2 },
        { label: '20–39 mL/cmH2O', value: 3 },
        { label: '<=19 mL/cmH2O', value: 4 },
      ],
    },
  ],
  scoring: {
    method: 'algorithm',
    ranges: [
      {
        min: 0,
        max: 0,
        risk: 'No Injury',
        interpretation: 'Average score 0: No lung injury.',
      },
      {
        min: 0,
        max: 2,
        risk: 'Mild-Moderate',
        interpretation:
          'Average score 0.1–2.5: Mild to moderate lung injury. Continue lung-protective ventilation.',
      },
      {
        min: 2,
        max: 4,
        risk: 'Severe',
        interpretation:
          'Average score >2.5: Severe lung injury (ARDS). Consider ECMO referral if refractory hypoxemia despite optimal conventional management.',
      },
    ],
  },
  suggestedTreatments: {
    Severe: ['ecmo_referral', 'prone_positioning', 'lung_protective_ventilation', 'icu_admission'],
    'Mild-Moderate': ['lung_protective_ventilation', 'optimize_peep', 'icu_monitoring'],
    'No Injury': ['routine_monitoring'],
  },
}
