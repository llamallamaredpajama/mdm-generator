import type { CdrSeed } from '../types'

/**
 * QUARANTINED: Modified Fisher Scale
 *
 * Reason: All components are CT-based (section2). The Modified Fisher Scale grades
 * SAH thickness and IVH presence on CT imaging. There are NO clinical exam (section1)
 * or physician judgment (user_input) components in the published source.
 *
 * Source: Frontera JA et al. Stroke. 2006;37(7):1705-1709
 *
 * The scale evaluates:
 *   1. SAH thickness on CT (thin <1mm vs thick >=1mm) — imaging
 *   2. Intraventricular hemorrhage (IVH) presence on CT — imaging
 *
 * Neither component can be assessed without CT imaging, making this CDR
 * impossible to make interactive with >= 3 user-answerable components
 * (type boolean/select AND source section1/user_input).
 */
export const modified_fisher: CdrSeed = {
  id: 'modified_fisher',
  name: 'Modified Fisher Scale',
  fullName: 'Modified Fisher Scale (SAH CT Grading)',
  category: 'NEUROLOGY',
  application:
    'CT-based classification of subarachnoid hemorrhage extent and intraventricular hemorrhage (IVH) presence. Predicts risk of delayed cerebral ischemia (DCI) due to vasospasm. Applied after SAH diagnosis is established. Grades 0-4.',
  applicableChiefComplaints: [
    'headache',
    'subarachnoid_hemorrhage',
    'thunderclap_headache',
  ],
  keywords: [
    'Modified Fisher',
    'Fisher scale',
    'SAH',
    'subarachnoid hemorrhage',
    'vasospasm',
    'CT',
    'IVH',
    'intraventricular hemorrhage',
    'delayed cerebral ischemia',
  ],
  requiredTests: ['CT head non-contrast'],
  components: [
    {
      id: 'modified_fisher_grade',
      label: 'Modified Fisher Grade (CT findings)',
      type: 'select',
      source: 'section2',
      autoPopulateFrom: 'test_result',
      options: [
        { label: 'Grade 0 — No SAH and no IVH', value: 0 },
        { label: 'Grade 1 — Thin SAH (<1 mm in basal cisterns), no IVH', value: 1 },
        { label: 'Grade 2 — Thin SAH (<1 mm), WITH IVH', value: 2 },
        { label: 'Grade 3 — Thick SAH (>=1 mm in basal cisterns or diffuse SAH), no IVH', value: 3 },
        { label: 'Grade 4 — Thick SAH (>=1 mm), WITH IVH', value: 4 },
      ],
    },
  ],
  scoring: {
    method: 'algorithm',
    ranges: [
      { min: 0, max: 0, risk: 'Grade 0 — Negligible Risk', interpretation: 'No SAH on CT. DCI risk negligible.' },
      { min: 1, max: 1, risk: 'Grade 1 — Low Vasospasm Risk', interpretation: 'Thin SAH, no IVH. ~15% risk of symptomatic vasospasm/DCI.' },
      { min: 2, max: 2, risk: 'Grade 2 — Moderate Vasospasm Risk', interpretation: 'Thin SAH with IVH. ~20% risk of symptomatic vasospasm/DCI.' },
      { min: 3, max: 3, risk: 'Grade 3 — High Vasospasm Risk', interpretation: 'Thick SAH, no IVH. ~30-35% risk of symptomatic vasospasm/DCI.' },
      { min: 4, max: 4, risk: 'Grade 4 — Highest Vasospasm Risk', interpretation: 'Thick SAH with IVH. ~40% risk of symptomatic vasospasm/DCI.' },
    ],
  },
}
