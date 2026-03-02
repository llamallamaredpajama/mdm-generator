import { describe, it, expect } from 'vitest'
import { calculateScore } from '../cdrScoringEngine'
import type { CdrDefinition } from '../../types/libraries'
import type { CdrComponentState } from '../../types/encounter'

// ── Test Fixtures ────────────────────────────────────────────────────────

const heartScore: CdrDefinition = {
  id: 'heart',
  name: 'HEART Score',
  fullName: 'History, ECG, Age, Risk Factors, Troponin',
  applicableChiefComplaints: ['chest_pain'],
  components: [
    {
      id: 'history',
      label: 'History',
      type: 'select',
      source: 'section1',
      options: [
        { label: 'Slightly suspicious', value: 0 },
        { label: 'Moderately suspicious', value: 1 },
        { label: 'Highly suspicious', value: 2 },
      ],
    },
    {
      id: 'ecg',
      label: 'ECG',
      type: 'select',
      source: 'section2',
      options: [
        { label: 'Normal', value: 0 },
        { label: 'Non-specific', value: 1 },
        { label: 'Significant ST deviation', value: 2 },
      ],
    },
    {
      id: 'age',
      label: 'Age',
      type: 'select',
      source: 'section1',
      options: [
        { label: '<45', value: 0 },
        { label: '45-64', value: 1 },
        { label: '>=65', value: 2 },
      ],
    },
    {
      id: 'risk_factors',
      label: 'Risk Factors',
      type: 'select',
      source: 'section1',
      options: [
        { label: 'No known', value: 0 },
        { label: '1-2', value: 1 },
        { label: '>=3', value: 2 },
      ],
    },
    {
      id: 'troponin',
      label: 'Troponin',
      type: 'select',
      source: 'section2',
      options: [
        { label: '<=normal', value: 0 },
        { label: '1-3x normal', value: 1 },
        { label: '>3x normal', value: 2 },
      ],
    },
  ],
  scoring: {
    method: 'sum',
    ranges: [
      {
        min: 0,
        max: 3,
        risk: 'Low',
        interpretation: '1.7% risk of MACE. Consider early discharge.',
      },
      {
        min: 4,
        max: 6,
        risk: 'Moderate',
        interpretation: '12-16.6% risk of MACE. Consider admission.',
      },
      {
        min: 7,
        max: 10,
        risk: 'High',
        interpretation: '50-65% risk of MACE. Early invasive measures.',
      },
    ],
  },
}

const percRule: CdrDefinition = {
  id: 'perc',
  name: 'PERC Rule',
  fullName: 'Pulmonary Embolism Rule-out Criteria',
  applicableChiefComplaints: ['chest_pain', 'dyspnea'],
  components: [
    { id: 'age_gte_50', label: 'Age >= 50', type: 'boolean', source: 'section1', value: 1 },
    { id: 'hr_gte_100', label: 'HR >= 100', type: 'boolean', source: 'section1', value: 1 },
    { id: 'sao2_lt_95', label: 'SpO2 < 95%', type: 'boolean', source: 'section1', value: 1 },
    {
      id: 'leg_swelling',
      label: 'Unilateral leg swelling',
      type: 'boolean',
      source: 'section1',
      value: 1,
    },
  ],
  scoring: {
    method: 'threshold',
    ranges: [
      { min: 0, max: 0, risk: 'Low', interpretation: 'All negative. PE ruled out.' },
      {
        min: 1,
        max: 4,
        risk: 'Not Low',
        interpretation: '>=1 positive. Proceed to D-dimer or CTPA.',
      },
    ],
  },
}

const pecarn: CdrDefinition = {
  id: 'pecarn',
  name: 'PECARN',
  fullName: 'PECARN Head Injury Rule',
  applicableChiefComplaints: ['head_injury'],
  components: [
    {
      id: 'age_group',
      label: 'Age Group',
      type: 'select',
      source: 'section1',
      options: [
        { label: '<2 years', value: 0 },
        { label: '>=2 years', value: 1 },
      ],
    },
    { id: 'gcs_lte_14', label: 'GCS <= 14', type: 'boolean', source: 'section1' },
    {
      id: 'altered_mental_status',
      label: 'Altered mental status',
      type: 'boolean',
      source: 'section1',
    },
    {
      id: 'palpable_skull_fracture',
      label: 'Skull fracture signs',
      type: 'boolean',
      source: 'section1',
    },
    { id: 'scalp_hematoma', label: 'Scalp hematoma', type: 'boolean', source: 'section1' },
    { id: 'loss_of_consciousness', label: 'LOC >= 5 seconds', type: 'boolean', source: 'section1' },
    { id: 'severe_mechanism', label: 'Severe mechanism', type: 'boolean', source: 'section1' },
    { id: 'acting_abnormally', label: 'Not acting normally', type: 'boolean', source: 'section1' },
  ],
  scoring: {
    method: 'algorithm',
    ranges: [
      { min: 0, max: 0, risk: 'Low', interpretation: 'CT not recommended.' },
      { min: 1, max: 1, risk: 'Intermediate', interpretation: 'Observation vs CT.' },
      { min: 2, max: 2, risk: 'High', interpretation: 'CT recommended.' },
    ],
  },
}

// ── Helpers ───────────────────────────────────────────────────────────────

function answered(value: number): CdrComponentState {
  return { value, answered: true, source: 'user_input' }
}

function unanswered(): CdrComponentState {
  return { value: null, answered: false }
}

// ── Tests ─────────────────────────────────────────────────────────────────

describe('cdrScoringEngine', () => {
  describe('sum method (HEART Score)', () => {
    it('returns low risk for score 0-3', () => {
      const states: Record<string, CdrComponentState> = {
        history: answered(0),
        ecg: answered(0),
        age: answered(0),
        risk_factors: answered(1),
        troponin: answered(0),
      }
      const result = calculateScore(heartScore, states)
      expect(result.score).toBe(1)
      expect(result.interpretation).toContain('Low')
      expect(result.missingComponents).toEqual([])
    })

    it('returns moderate risk for score 4-6', () => {
      const states: Record<string, CdrComponentState> = {
        history: answered(1),
        ecg: answered(1),
        age: answered(1),
        risk_factors: answered(1),
        troponin: answered(1),
      }
      const result = calculateScore(heartScore, states)
      expect(result.score).toBe(5)
      expect(result.interpretation).toContain('Moderate')
    })

    it('returns high risk for score 7-10', () => {
      const states: Record<string, CdrComponentState> = {
        history: answered(2),
        ecg: answered(2),
        age: answered(2),
        risk_factors: answered(2),
        troponin: answered(1),
      }
      const result = calculateScore(heartScore, states)
      expect(result.score).toBe(9)
      expect(result.interpretation).toContain('High')
    })

    it('returns null score with missing components when incomplete', () => {
      const states: Record<string, CdrComponentState> = {
        history: answered(2),
        ecg: unanswered(),
        age: answered(1),
        risk_factors: unanswered(),
        troponin: answered(0),
      }
      const result = calculateScore(heartScore, states)
      expect(result.score).toBeNull()
      expect(result.interpretation).toBeNull()
      expect(result.missingComponents).toEqual(['ECG', 'Risk Factors'])
    })

    it('handles all components unanswered', () => {
      const result = calculateScore(heartScore, {})
      expect(result.score).toBeNull()
      expect(result.missingComponents).toHaveLength(5)
    })
  })

  describe('threshold method (PERC Rule)', () => {
    it('returns low risk when all criteria negative', () => {
      const states: Record<string, CdrComponentState> = {
        age_gte_50: answered(0),
        hr_gte_100: answered(0),
        sao2_lt_95: answered(0),
        leg_swelling: answered(0),
      }
      const result = calculateScore(percRule, states)
      expect(result.score).toBe(0)
      expect(result.interpretation).toContain('Low')
    })

    it('returns not-low risk when any criterion positive', () => {
      const states: Record<string, CdrComponentState> = {
        age_gte_50: answered(1),
        hr_gte_100: answered(0),
        sao2_lt_95: answered(0),
        leg_swelling: answered(0),
      }
      const result = calculateScore(percRule, states)
      expect(result.score).toBe(1)
      expect(result.interpretation).toContain('Not Low')
    })

    it('counts multiple positive criteria', () => {
      const states: Record<string, CdrComponentState> = {
        age_gte_50: answered(1),
        hr_gte_100: answered(1),
        sao2_lt_95: answered(1),
        leg_swelling: answered(0),
      }
      const result = calculateScore(percRule, states)
      expect(result.score).toBe(3)
      expect(result.interpretation).toContain('Not Low')
    })

    it('returns missing when incomplete', () => {
      const states: Record<string, CdrComponentState> = {
        age_gte_50: answered(0),
        hr_gte_100: answered(0),
      }
      const result = calculateScore(percRule, states)
      expect(result.score).toBeNull()
      expect(result.missingComponents).toEqual(['SpO2 < 95%', 'Unilateral leg swelling'])
    })
  })

  describe('algorithm method (PECARN)', () => {
    it('returns high risk when GCS <= 14', () => {
      const states: Record<string, CdrComponentState> = {
        age_group: answered(0),
        gcs_lte_14: answered(1),
        altered_mental_status: answered(0),
        palpable_skull_fracture: answered(0),
        scalp_hematoma: answered(0),
        loss_of_consciousness: answered(0),
        severe_mechanism: answered(0),
        acting_abnormally: answered(0),
      }
      const result = calculateScore(pecarn, states)
      expect(result.score).toBe(2)
      expect(result.interpretation).toContain('High')
    })

    it('returns high risk when altered mental status', () => {
      const states: Record<string, CdrComponentState> = {
        age_group: answered(1),
        gcs_lte_14: answered(0),
        altered_mental_status: answered(1),
        palpable_skull_fracture: answered(0),
        scalp_hematoma: answered(0),
        loss_of_consciousness: answered(0),
        severe_mechanism: answered(0),
        acting_abnormally: answered(0),
      }
      const result = calculateScore(pecarn, states)
      expect(result.score).toBe(2)
      expect(result.interpretation).toContain('High')
    })

    it('returns intermediate when secondary risk factors present', () => {
      const states: Record<string, CdrComponentState> = {
        age_group: answered(0),
        gcs_lte_14: answered(0),
        altered_mental_status: answered(0),
        palpable_skull_fracture: answered(0),
        scalp_hematoma: answered(1),
        loss_of_consciousness: answered(0),
        severe_mechanism: answered(1),
        acting_abnormally: answered(0),
      }
      const result = calculateScore(pecarn, states)
      expect(result.score).toBe(1)
      expect(result.interpretation).toContain('Intermediate')
    })

    it('returns low risk when all criteria negative', () => {
      const states: Record<string, CdrComponentState> = {
        age_group: answered(0),
        gcs_lte_14: answered(0),
        altered_mental_status: answered(0),
        palpable_skull_fracture: answered(0),
        scalp_hematoma: answered(0),
        loss_of_consciousness: answered(0),
        severe_mechanism: answered(0),
        acting_abnormally: answered(0),
      }
      const result = calculateScore(pecarn, states)
      expect(result.score).toBe(0)
      expect(result.interpretation).toContain('Low')
    })

    it('returns missing when incomplete', () => {
      const states: Record<string, CdrComponentState> = {
        age_group: answered(0),
        gcs_lte_14: answered(0),
      }
      const result = calculateScore(pecarn, states)
      expect(result.score).toBeNull()
      expect(result.missingComponents.length).toBeGreaterThan(0)
    })
  })

  describe('algorithm fallback to sum', () => {
    it('uses sum when no custom calculator registered', () => {
      const unknownAlgoCdr: CdrDefinition = {
        id: 'unknown_algo',
        name: 'Unknown Algorithm CDR',
        fullName: 'Unknown',
        applicableChiefComplaints: [],
        components: [
          { id: 'a', label: 'A', type: 'boolean', source: 'section1', value: 1 },
          { id: 'b', label: 'B', type: 'boolean', source: 'section1', value: 2 },
        ],
        scoring: {
          method: 'algorithm',
          ranges: [
            { min: 0, max: 1, risk: 'Low', interpretation: 'Low risk' },
            { min: 2, max: 3, risk: 'High', interpretation: 'High risk' },
          ],
        },
      }
      const states: Record<string, CdrComponentState> = {
        a: answered(1),
        b: answered(2),
      }
      const result = calculateScore(unknownAlgoCdr, states)
      expect(result.score).toBe(3)
      expect(result.interpretation).toContain('High')
    })
  })

  describe('edge cases', () => {
    it('handles CDR with no components', () => {
      const emptyCdr: CdrDefinition = {
        id: 'empty',
        name: 'Empty',
        fullName: 'Empty CDR',
        applicableChiefComplaints: [],
        components: [],
        scoring: { method: 'sum', ranges: [] },
      }
      const result = calculateScore(emptyCdr, {})
      expect(result.score).toBe(0)
      expect(result.missingComponents).toEqual([])
    })

    it('skips algorithm-type components when checking missing', () => {
      const cdrWithAlgoComp: CdrDefinition = {
        id: 'with_algo',
        name: 'With Algo',
        fullName: 'CDR with algorithm component',
        applicableChiefComplaints: [],
        components: [
          { id: 'manual', label: 'Manual Input', type: 'boolean', source: 'section1', value: 1 },
          { id: 'auto', label: 'Auto Calculated', type: 'algorithm', source: 'section1' },
        ],
        scoring: { method: 'sum', ranges: [] },
      }
      const states: Record<string, CdrComponentState> = {
        manual: answered(1),
      }
      // 'auto' is algorithm type, so it shouldn't appear in missing
      const result = calculateScore(cdrWithAlgoComp, states)
      expect(result.missingComponents).toEqual([])
    })
  })
})
