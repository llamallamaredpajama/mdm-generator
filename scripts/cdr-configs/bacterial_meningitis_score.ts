import type { CdrSeed } from '../types'

/**
 * RESCUED from quarantine: Bacterial Meningitis Score
 *
 * Previously quarantined: Only 1 of 5 criteria was user-answerable (section1).
 * Rescue: Changed 4 lab-based components (CSF Gram stain, CSF ANC, CSF protein,
 * peripheral ANC) from section2→user_input so physicians can manually enter results.
 *
 * Source: Nigrovic LE et al. Clinical prediction rule for identifying children with
 *         CSF pleocytosis at very low risk of bacterial meningitis. JAMA 2007;297:52-60.
 */
export const bacterial_meningitis_score: CdrSeed = {
  id: 'bacterial_meningitis_score',
  name: 'Bacterial Meningitis Score',
  fullName: 'Bacterial Meningitis Score',
  category: 'INFECTIOUS DISEASE',
  application:
    'Differentiates bacterial from aseptic (viral) meningitis in children (≥2 months old) with CSF pleocytosis (CSF WBC ≥10/µL). NPV 99.7–100% when all criteria negative.',
  applicableChiefComplaints: [
    'headache',
    'meningitis',
    'fever',
    'altered_mental_status',
    'stiff_neck',
    'seizure',
  ],
  keywords: [
    'bacterial meningitis score',
    'meningitis',
    'CSF',
    'pleocytosis',
    'bacterial vs viral',
    'pediatric',
    'gram stain',
    'aseptic meningitis',
  ],
  requiredTests: ['CSF gram stain', 'CSF ANC', 'CSF protein', 'peripheral ANC'],
  components: [
    {
      id: 'csf_gram_stain_positive',
      label: 'CSF Gram stain positive',
      type: 'boolean',
      value: 1,
      source: 'user_input',
    },
    {
      id: 'csf_anc_gte_1000',
      label: 'CSF ANC ≥1,000 cells/µL',
      type: 'boolean',
      value: 1,
      source: 'user_input',
    },
    {
      id: 'csf_protein_gte_80',
      label: 'CSF protein ≥80 mg/dL',
      type: 'boolean',
      value: 1,
      source: 'user_input',
    },
    {
      id: 'peripheral_anc_gte_10000',
      label: 'Peripheral blood ANC ≥10,000 cells/µL',
      type: 'boolean',
      value: 1,
      source: 'user_input',
    },
    {
      id: 'seizure_at_presentation',
      label: 'Seizure at or before presentation',
      type: 'boolean',
      value: 1,
      source: 'section1',
      autoPopulateFrom: 'narrative_analysis',
    },
  ],
  scoring: {
    method: 'threshold',
    ranges: [
      {
        min: 0,
        max: 0,
        risk: 'Low',
        interpretation:
          'ALL 5 criteria NEGATIVE → Very low risk of bacterial meningitis (NPV 99.7–100%); aseptic meningitis likely; may consider outpatient management',
      },
      {
        min: 1,
        max: 5,
        risk: 'High',
        interpretation:
          'ANY criterion POSITIVE → Cannot classify as low risk; treat empirically for bacterial meningitis',
      },
    ],
  },
  suggestedTreatments: {
    High: [
      'empiric_antibiotics_meningitis_dose',
      'dexamethasone_adjunctive',
      'admit_icu',
      'infectious_disease_consult',
    ],
    Low: ['observation', 'consider_outpatient_management', 'close_follow_up'],
  },
}
