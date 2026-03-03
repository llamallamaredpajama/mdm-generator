import type { CdrSeed } from '../types'

/**
 * QUARANTINED: ACR/EULAR 2010 Rheumatoid Arthritis Classification Criteria
 *
 * Reason: Only 2 of 4 domains are user-answerable (section1):
 *   - Joint Involvement (section1) — clinical exam
 *   - Duration of Symptoms (section1) — history
 * The other 2 are lab-based (section2):
 *   - Serology: RF and anti-CCP
 *   - Acute Phase Reactants: CRP and ESR
 * The published source (Aletaha et al., Arthritis Rheum 2010) defines exactly
 * these 4 domains with no additional clinical criteria.
 * Cannot reach 3 user-answerable components without inventing criteria.
 */
export const acr_eular_ra: CdrSeed = {
  id: 'acr_eular_ra',
  name: 'ACR/EULAR RA Criteria',
  fullName: 'ACR/EULAR 2010 Rheumatoid Arthritis Classification Criteria',
  category: 'RHEUMATOLOGY',
  application:
    'Classifies definite RA in patients with at least 1 joint with synovitis not better explained by another disease. Score >=6/10 defines definite RA.',
  applicableChiefComplaints: ['joint_swelling', 'polyarthritis', 'rheumatoid_arthritis', 'inflammatory_arthritis'],
  keywords: [
    'ACR',
    'EULAR',
    'rheumatoid arthritis',
    'RA classification',
    'RF',
    'anti-CCP',
    'synovitis',
    'DMARD',
    '2010 criteria',
  ],
  requiredTests: ['RF', 'anti-CCP', 'CRP', 'ESR', 'joint examination'],
  components: [
    {
      id: 'joint_involvement',
      label: 'Joint Involvement',
      type: 'select',
      source: 'section1',
      autoPopulateFrom: 'narrative_analysis',
      options: [
        { label: '1 large joint (shoulder, elbow, hip, knee, ankle)', value: 0 },
        { label: '2–10 large joints', value: 1 },
        { label: '1–3 small joints (MCP, PIP, MTP, thumb IP, wrist)', value: 2 },
        { label: '4–10 small joints', value: 3 },
        { label: '>10 joints (at least 1 small joint)', value: 5 },
      ],
    },
    {
      id: 'serology',
      label: 'Serology (RF and anti-CCP)',
      type: 'select',
      source: 'section2',
      autoPopulateFrom: 'test_result',
      options: [
        { label: 'Negative RF AND negative anti-CCP', value: 0 },
        { label: 'Low-positive RF OR low-positive anti-CCP (<=3x ULN)', value: 2 },
        { label: 'High-positive RF OR high-positive anti-CCP (>3x ULN)', value: 3 },
      ],
    },
    {
      id: 'acute_phase_reactants',
      label: 'Acute Phase Reactants',
      type: 'select',
      source: 'section2',
      autoPopulateFrom: 'test_result',
      options: [
        { label: 'Normal CRP AND normal ESR', value: 0 },
        { label: 'Abnormal CRP OR abnormal ESR', value: 1 },
      ],
    },
    {
      id: 'duration',
      label: 'Duration of Symptoms',
      type: 'select',
      source: 'section1',
      autoPopulateFrom: 'narrative_analysis',
      options: [
        { label: '<6 weeks', value: 0 },
        { label: '>=6 weeks', value: 1 },
      ],
    },
  ],
  scoring: {
    method: 'sum',
    ranges: [
      {
        min: 0,
        max: 5,
        risk: 'Not Classifiable',
        interpretation: 'Score <6: Not classifiable as RA at this time; monitor and reassess',
      },
      {
        min: 6,
        max: 10,
        risk: 'Definite RA',
        interpretation: 'Score >=6: Definite RA; initiate disease-modifying therapy (DMARD)',
      },
    ],
  },
  suggestedTreatments: {
    'Definite RA': ['methotrexate', 'rheumatology_consult', 'baseline_labs', 'xrays_hands_feet'],
    'Not Classifiable': ['monitor_and_reassess', 'nsaids_symptomatic', 'follow_up_rheumatology'],
  },
}
