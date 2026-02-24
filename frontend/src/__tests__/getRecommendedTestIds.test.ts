/**
 * getRecommendedTestIds Tests
 */

import { describe, it, expect } from 'vitest'
import { getRecommendedTestIds } from '../components/build-mode/shared/getRecommendedTestIds'
import type { DifferentialItem } from '../types/encounter'
import type { TestDefinition } from '../types/libraries'

const mockLibrary: TestDefinition[] = [
  {
    id: 'troponin',
    name: 'Troponin',
    category: 'labs',
    subcategory: 'cardiac',
    commonIndications: ['chest pain', 'mi risk'],
    unit: 'ng/mL',
    normalRange: '<0.04',
    quickFindings: null,
    feedsCdrs: ['heart'],
  },
  {
    id: 'ecg',
    name: 'ECG',
    category: 'procedures_poc',
    subcategory: 'cardiac',
    commonIndications: ['chest pain', 'arrhythmia'],
    unit: null,
    normalRange: null,
    quickFindings: null,
    feedsCdrs: ['heart'],
  },
  {
    id: 'ct_head',
    name: 'CT Head',
    category: 'imaging',
    subcategory: 'neuro',
    commonIndications: ['head injury', 'altered mental status'],
    unit: null,
    normalRange: null,
    quickFindings: null,
    feedsCdrs: ['pecarn'],
  },
  {
    id: 'cbc',
    name: 'CBC',
    category: 'labs',
    subcategory: 'hematology',
    commonIndications: ['infection', 'anemia'],
    unit: null,
    normalRange: null,
    quickFindings: null,
    feedsCdrs: [],
  },
]

describe('getRecommendedTestIds', () => {
  it('matches tests by name appearing in reasoning text', () => {
    const differential: DifferentialItem[] = [
      {
        diagnosis: 'Acute Coronary Syndrome',
        urgency: 'emergent',
        reasoning: 'Recommend ECG, serial troponins, and CBC for initial workup',
      },
    ]

    const result = getRecommendedTestIds(differential, mockLibrary)
    expect(result).toContain('troponin')
    expect(result).toContain('ecg')
    expect(result).toContain('cbc')
  })

  it('matches tests by commonIndications overlapping with diagnosis names', () => {
    const differential: DifferentialItem[] = [
      {
        diagnosis: 'Chest Pain',
        urgency: 'urgent',
        reasoning: 'Need to rule out cardiac causes',
      },
    ]

    const result = getRecommendedTestIds(differential, mockLibrary)
    // "chest pain" is in commonIndications for troponin and ecg
    expect(result).toContain('troponin')
    expect(result).toContain('ecg')
    // CT Head has no chest pain indication
    expect(result).not.toContain('ct_head')
  })

  it('returns deduplicated results', () => {
    const differential: DifferentialItem[] = [
      {
        diagnosis: 'Chest Pain',
        urgency: 'emergent',
        reasoning: 'Order troponin and ECG',
      },
      {
        diagnosis: 'MI risk assessment',
        urgency: 'emergent',
        reasoning: 'Serial troponin monitoring',
      },
    ]

    const result = getRecommendedTestIds(differential, mockLibrary)
    const troponinCount = result.filter((id) => id === 'troponin').length
    expect(troponinCount).toBe(1)
  })

  it('returns empty array when no matches', () => {
    const differential: DifferentialItem[] = [
      {
        diagnosis: 'Ankle Sprain',
        urgency: 'routine',
        reasoning: 'Clinical exam consistent with lateral ligament injury',
      },
    ]

    const result = getRecommendedTestIds(differential, mockLibrary)
    expect(result).toEqual([])
  })

  it('returns empty array for empty inputs', () => {
    expect(getRecommendedTestIds([], mockLibrary)).toEqual([])
    expect(getRecommendedTestIds([], [])).toEqual([])
  })

  it('is case-insensitive for name matching', () => {
    const differential: DifferentialItem[] = [
      {
        diagnosis: 'Something',
        urgency: 'routine',
        reasoning: 'Consider ecg for evaluation',
      },
    ]

    const result = getRecommendedTestIds(differential, mockLibrary)
    expect(result).toContain('ecg')
  })

  it('is case-insensitive for indication matching', () => {
    const differential: DifferentialItem[] = [
      {
        diagnosis: 'HEAD INJURY',
        urgency: 'emergent',
        reasoning: 'Blunt head trauma',
      },
    ]

    const result = getRecommendedTestIds(differential, mockLibrary)
    expect(result).toContain('ct_head')
  })
})
