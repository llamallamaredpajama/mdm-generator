import type { CdrSeed } from '../types'

/**
 * QUARANTINE: ANC Calculation
 *
 * Reason: Pure lab formula — ANC = WBC × (% neutrophils + % bands) / 100.
 * All 3 components are number_range with source: section2. Zero user-answerable
 * interactive components possible from the published formula.
 *
 * Source: Dale et al., Blood 2000; NCCN Febrile Neutropenia Guidelines
 */
export const ancCalculation: CdrSeed = {
  id: 'anc_calculation',
  name: 'ANC Calculation',
  fullName: 'Absolute Neutrophil Count (ANC) Calculation',
  category: 'HEMATOLOGY / COAGULATION',
  application:
    'Determines severity of neutropenia to guide infection risk assessment and management. ANC <500 triggers febrile neutropenia protocol.',
  applicableChiefComplaints: ['fever', 'febrile_neutropenia', 'neutropenia', 'immunocompromised', 'cancer'],
  keywords: [
    'ANC',
    'absolute neutrophil count',
    'neutropenia',
    'febrile neutropenia',
    'infection risk',
    'neutrophils',
    'bands',
    'WBC',
  ],
  requiredTests: ['CBC with differential'],
  components: [
    {
      id: 'wbc',
      label: 'WBC (× 10³/µL)',
      type: 'number_range',
      source: 'section2',
      autoPopulateFrom: 'test_result',
      min: 0,
      max: 100,
    },
    {
      id: 'pct_neutrophils',
      label: '% Neutrophils (segs)',
      type: 'number_range',
      source: 'section2',
      autoPopulateFrom: 'test_result',
      min: 0,
      max: 100,
    },
    {
      id: 'pct_bands',
      label: '% Bands',
      type: 'number_range',
      source: 'section2',
      autoPopulateFrom: 'test_result',
      min: 0,
      max: 100,
    },
  ],
  scoring: {
    method: 'algorithm',
    ranges: [
      {
        min: 1500,
        max: 100000,
        risk: 'Normal',
        interpretation: 'ANC >1500/µL: Normal; baseline infection risk.',
      },
      {
        min: 1000,
        max: 1499,
        risk: 'Low',
        interpretation: 'ANC 1000–1500/µL: Mild neutropenia; slight increase in infection risk.',
      },
      {
        min: 500,
        max: 999,
        risk: 'Moderate',
        interpretation:
          'ANC 500–1000/µL: Moderate neutropenia; moderate infection risk; monitor closely.',
      },
      {
        min: 100,
        max: 499,
        risk: 'High',
        interpretation:
          'ANC 100–500/µL: Severe neutropenia; high risk — febrile neutropenia protocol: blood cultures + empiric antipseudomonal beta-lactam (e.g., cefepime, piperacillin-tazobactam).',
      },
      {
        min: 0,
        max: 99,
        risk: 'Very High',
        interpretation:
          'ANC <100/µL: Profound neutropenia; very high risk; empiric broad-spectrum antibiotics; consider empiric antifungal if fever persists >4–7 days.',
      },
    ],
  },
  suggestedTreatments: {
    'Very High': [
      'blood_cultures',
      'empiric_cefepime_or_pip_tazo',
      'consider_empiric_antifungal',
      'admission',
      'infectious_disease_consult',
    ],
    High: [
      'blood_cultures',
      'empiric_cefepime_or_pip_tazo',
      'admission',
    ],
    Moderate: ['close_monitoring', 'blood_cultures_if_febrile'],
  },
}
