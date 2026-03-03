import type { CdrSeed } from '../types'

/**
 * QUARANTINE: Bhutani Nomogram
 *
 * Reason: Core scoring is algorithm-based on total serum bilirubin (lab) plotted
 * against postnatal age in hours (continuous). The nomogram chart lookup cannot
 * be meaningfully represented with ≥3 user-answerable interactive components.
 * Only 2 user-answerable components exist (gestational_age select + neurotoxicity
 * risk factors boolean), both supplementary to the lab-driven algorithm.
 *
 * Source: Bhutani et al., Pediatrics 1999; AAP Clinical Practice Guideline 2022
 */
export const bhutaniNomogram: CdrSeed = {
  id: 'bhutani_nomogram',
  name: 'Bhutani Nomogram',
  fullName: 'Bhutani Nomogram (Neonatal Jaundice)',
  category: 'PEDIATRIC',
  application:
    'Risk-stratifies neonatal hyperbilirubinemia by plotting total serum bilirubin (TSB) against postnatal age in hours. Guides need for phototherapy.',
  applicableChiefComplaints: ['neonatal_jaundice', 'hyperbilirubinemia', 'jaundice', 'newborn_jaundice'],
  keywords: [
    'Bhutani',
    'neonatal jaundice',
    'hyperbilirubinemia',
    'bilirubin',
    'phototherapy',
    'newborn',
    'nomogram',
    'kernicterus',
    'AAP 2022',
  ],
  requiredTests: ['total serum bilirubin', 'postnatal age in hours'],
  components: [
    {
      id: 'total_serum_bilirubin',
      label: 'Total Serum Bilirubin (mg/dL)',
      type: 'number_range',
      source: 'section2',
      autoPopulateFrom: 'test_result',
      min: 0,
      max: 30,
    },
    {
      id: 'postnatal_age_hours',
      label: 'Postnatal Age (hours)',
      type: 'number_range',
      source: 'section1',
      autoPopulateFrom: 'narrative_analysis',
      min: 0,
      max: 144,
    },
    {
      id: 'gestational_age',
      label: 'Gestational Age',
      type: 'select',
      source: 'section1',
      autoPopulateFrom: 'narrative_analysis',
      options: [
        { label: '≥38 weeks (low risk)', value: 0 },
        { label: '35–37 6/7 weeks (medium risk)', value: 1 },
        { label: '<35 weeks (higher risk)', value: 2 },
      ],
    },
    {
      id: 'neurotoxicity_risk_factors',
      label: 'Neurotoxicity risk factors (isoimmune hemolytic disease, G6PD deficiency, asphyxia, lethargy, temp instability, sepsis, albumin <3.0)',
      type: 'boolean',
      value: 1,
      source: 'section1',
      autoPopulateFrom: 'narrative_analysis',
    },
  ],
  scoring: {
    method: 'algorithm',
    ranges: [
      {
        min: 0,
        max: 0,
        risk: 'Low',
        interpretation:
          'Low-risk zone (<40th percentile for age in hours): ~0% risk of subsequent significant hyperbilirubinemia; routine follow-up per AAP guidelines.',
      },
      {
        min: 1,
        max: 1,
        risk: 'Low-Intermediate',
        interpretation:
          'Low-intermediate zone (40th–75th percentile): ~2.2% risk; follow-up within 48 hours; repeat TSB if clinically indicated.',
      },
      {
        min: 2,
        max: 2,
        risk: 'High-Intermediate',
        interpretation:
          'High-intermediate zone (75th–95th percentile): ~13% risk; follow-up within 24–48 hours; consider phototherapy if rising or risk factors present.',
      },
      {
        min: 3,
        max: 3,
        risk: 'High',
        interpretation:
          'High-risk zone (>95th percentile): ~40% risk; initiate phototherapy per AAP thresholds; close follow-up within 24 hours; consider exchange transfusion if approaching critical levels.',
      },
    ],
  },
  suggestedTreatments: {
    High: ['phototherapy', 'repeat_tsb_4_6h', 'consider_exchange_transfusion'],
    'High-Intermediate': ['phototherapy_if_rising', 'repeat_tsb_12_24h', 'follow_up_24_48h'],
    'Low-Intermediate': ['repeat_tsb_if_indicated', 'follow_up_48h'],
    Low: ['routine_follow_up'],
  },
}
