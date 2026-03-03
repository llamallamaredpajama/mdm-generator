import type { CdrSeed } from '../types'

/**
 * QUARANTINE: Modified Rankin Scale (mRS)
 *
 * Reason: Single-item ordinal scale (0-6) with only 1 user-answerable component.
 * The mRS is fundamentally a single-grade assessment of functional disability.
 * The structured interview version (Wilson et al., Stroke 2002) decomposes it
 * into a DECISION TREE of yes/no questions, but these are not additive — they
 * form branching logic to arrive at the same single grade. Decomposing into
 * 3+ sum-able boolean/select components would distort the published instrument
 * (van Swieten et al., Stroke 1988; 19:604–607).
 *
 * The scoring engine's algorithm method falls back to sum for unregistered
 * calculators, so a decision-tree implementation is not currently feasible.
 */
export const modifiedRankin: CdrSeed = {
  id: 'modified_rankin',
  name: 'Modified Rankin Scale',
  fullName: 'Modified Rankin Scale (mRS)',
  category: 'NEUROLOGY',
  application: 'Measures degree of disability/dependence after stroke. Primary outcome measure in stroke clinical trials.',
  applicableChiefComplaints: ['stroke', 'neurological_disability', 'functional_impairment'],
  keywords: ['mRS', 'modified Rankin scale', 'disability', 'stroke outcome', 'functional independence', 'dependence', 'clinical trial'],
  components: [
    {
      id: 'mrs_grade',
      label: 'Modified Rankin Scale grade',
      type: 'select',
      source: 'section1',
      autoPopulateFrom: 'narrative_analysis',
      options: [
        { label: '0 — No symptoms', value: 0 },
        { label: '1 — No significant disability: able to carry out all usual activities despite some symptoms', value: 1 },
        { label: '2 — Slight disability: able to look after own affairs without assistance, but unable to carry out all previous activities', value: 2 },
        { label: '3 — Moderate disability: requires some help, but able to walk unassisted', value: 3 },
        { label: '4 — Moderately severe disability: unable to attend to own bodily needs without assistance, unable to walk unassisted', value: 4 },
        { label: '5 — Severe disability: requires constant nursing care and attention, bedridden, incontinent', value: 5 },
        { label: '6 — Dead', value: 6 },
      ],
    },
  ],
  scoring: {
    method: 'sum',
    ranges: [
      { min: 0, max: 1, risk: 'Excellent Outcome', interpretation: 'mRS 0–1: No symptoms to no significant disability; excellent outcome' },
      { min: 2, max: 2, risk: 'Good Outcome', interpretation: 'mRS 2: Slight disability; independent but unable to carry out all previous activities' },
      { min: 3, max: 3, risk: 'Moderate Disability', interpretation: 'mRS 3: Moderate disability; requires some help but able to walk unassisted' },
      { min: 4, max: 4, risk: 'Moderate-Severe Disability', interpretation: 'mRS 4: Moderately severe disability; unable to walk or attend to bodily needs unassisted' },
      { min: 5, max: 5, risk: 'Severe Disability', interpretation: 'mRS 5: Severe disability; bedridden, incontinent, requires constant nursing care' },
      { min: 6, max: 6, risk: 'Dead', interpretation: 'mRS 6: Death' },
    ],
  },
}
