import { describe, it, expect } from 'vitest'
import { batch26RescueId1Cdrs } from '../batch-26-rescue-id1'
import type { CdrSeed } from '../types'

describe('Batch 26 — Infectious Disease 1 Rescue CDRs', () => {
  it('exports exactly 2 CDR definitions', () => {
    expect(batch26RescueId1Cdrs).toHaveLength(2)
  })

  it('all entries conform to CdrSeed type (required fields present)', () => {
    const requiredKeys: (keyof CdrSeed)[] = [
      'id',
      'name',
      'fullName',
      'category',
      'application',
      'applicableChiefComplaints',
      'keywords',
      'components',
      'scoring',
    ]

    for (const cdr of batch26RescueId1Cdrs) {
      for (const key of requiredKeys) {
        expect(cdr, `CDR "${cdr.id}" missing required field "${key}"`).toHaveProperty(key)
      }
    }
  })

  it('all IDs are unique', () => {
    const ids = batch26RescueId1Cdrs.map((c) => c.id)
    const uniqueIds = new Set(ids)
    expect(uniqueIds.size).toBe(ids.length)
  })

  it('all IDs are snake_case', () => {
    const snakeCaseRegex = /^[a-z][a-z0-9]*(_[a-z0-9]+)*$/
    for (const cdr of batch26RescueId1Cdrs) {
      expect(
        snakeCaseRegex.test(cdr.id),
        `CDR ID "${cdr.id}" is not snake_case`,
      ).toBe(true)
    }
  })

  it('every CDR has >= 3 user-answerable interactive components', () => {
    for (const cdr of batch26RescueId1Cdrs) {
      const userAnswerable = cdr.components.filter(
        (c) => (c.type === 'boolean' || c.type === 'select') &&
          (c.source === 'section1' || c.source === 'user_input'),
      )
      expect(userAnswerable.length, `CDR "${cdr.id}" has only ${userAnswerable.length} user-answerable`).toBeGreaterThanOrEqual(3)
    }
  })

  describe('component validation', () => {
    it('boolean components have a numeric "value" field', () => {
      for (const cdr of batch26RescueId1Cdrs) {
        const booleans = cdr.components.filter((c) => c.type === 'boolean')
        for (const comp of booleans) {
          expect(
            typeof comp.value,
            `CDR "${cdr.id}", component "${comp.id}": boolean must have numeric value`,
          ).toBe('number')
        }
      }
    })

    it('select components have a non-empty options array', () => {
      for (const cdr of batch26RescueId1Cdrs) {
        const selects = cdr.components.filter((c) => c.type === 'select')
        for (const comp of selects) {
          expect(
            Array.isArray(comp.options) && comp.options.length > 0,
            `CDR "${cdr.id}", component "${comp.id}": select must have non-empty options`,
          ).toBe(true)
        }
      }
    })

    it('select option values are numbers', () => {
      for (const cdr of batch26RescueId1Cdrs) {
        const selects = cdr.components.filter((c) => c.type === 'select')
        for (const comp of selects) {
          for (const opt of comp.options ?? []) {
            expect(
              typeof opt.value,
              `CDR "${cdr.id}", component "${comp.id}", option "${opt.label}": value must be number`,
            ).toBe('number')
          }
        }
      }
    })

    it('every component has a valid source', () => {
      const validSources = ['section1', 'section2', 'user_input']
      for (const cdr of batch26RescueId1Cdrs) {
        for (const comp of cdr.components) {
          expect(
            validSources.includes(comp.source),
            `CDR "${cdr.id}", component "${comp.id}": invalid source "${comp.source}"`,
          ).toBe(true)
        }
      }
    })

    it('component IDs are unique within each CDR', () => {
      for (const cdr of batch26RescueId1Cdrs) {
        const ids = cdr.components.map((c) => c.id)
        const unique = new Set(ids)
        expect(
          unique.size,
          `CDR "${cdr.id}" has duplicate component IDs`,
        ).toBe(ids.length)
      }
    })
  })

  describe('scoring range validation', () => {
    it('scoring method is one of sum | threshold | algorithm', () => {
      const validMethods = ['sum', 'threshold', 'algorithm']
      for (const cdr of batch26RescueId1Cdrs) {
        expect(
          validMethods.includes(cdr.scoring.method),
          `CDR "${cdr.id}": invalid scoring method "${cdr.scoring.method}"`,
        ).toBe(true)
      }
    })

    it('scoring ranges have no gaps between consecutive ranges', () => {
      for (const cdr of batch26RescueId1Cdrs) {
        if (cdr.scoring.method === 'algorithm') continue
        const ranges = [...cdr.scoring.ranges].sort((a, b) => a.min - b.min)
        for (let i = 1; i < ranges.length; i++) {
          const prevMax = ranges[i - 1].max
          const currMin = ranges[i].min
          expect(
            currMin,
            `CDR "${cdr.id}": gap between range ending at ${prevMax} and range starting at ${currMin}`,
          ).toBe(prevMax + 1)
        }
      }
    })

    it('scoring ranges have no overlaps', () => {
      for (const cdr of batch26RescueId1Cdrs) {
        const ranges = [...cdr.scoring.ranges].sort((a, b) => a.min - b.min)
        for (let i = 1; i < ranges.length; i++) {
          expect(
            ranges[i].min,
            `CDR "${cdr.id}": overlap between ranges "${ranges[i - 1].risk}" and "${ranges[i].risk}"`,
          ).toBeGreaterThanOrEqual(ranges[i - 1].max)
        }
      }
    })

    it('scoring ranges cover the full achievable score range for sum-method CDRs', () => {
      for (const cdr of batch26RescueId1Cdrs) {
        if (cdr.scoring.method !== 'sum') continue

        let minScore = 0
        let maxScore = 0

        for (const comp of cdr.components) {
          if (comp.type === 'boolean') {
            const v = comp.value ?? 0
            if (v >= 0) {
              maxScore += v
            } else {
              minScore += v
            }
          } else if (comp.type === 'select' && comp.options) {
            const values = comp.options.map((o) => o.value)
            minScore += Math.min(...values)
            maxScore += Math.max(...values)
          }
        }

        const ranges = [...cdr.scoring.ranges].sort((a, b) => a.min - b.min)
        const rangeMin = ranges[0].min
        const rangeMax = ranges[ranges.length - 1].max

        expect(
          rangeMin,
          `CDR "${cdr.id}": first range min (${rangeMin}) should be <= min achievable score (${minScore})`,
        ).toBeLessThanOrEqual(minScore)

        expect(
          rangeMax,
          `CDR "${cdr.id}": last range max (${rangeMax}) should be >= max achievable score (${maxScore})`,
        ).toBeGreaterThanOrEqual(maxScore)
      }
    })

    it('each range has non-empty risk and interpretation strings', () => {
      for (const cdr of batch26RescueId1Cdrs) {
        for (const range of cdr.scoring.ranges) {
          expect(
            range.risk.length,
            `CDR "${cdr.id}": range [${range.min}-${range.max}] has empty risk`,
          ).toBeGreaterThan(0)
          expect(
            range.interpretation.length,
            `CDR "${cdr.id}": range [${range.min}-${range.max}] has empty interpretation`,
          ).toBeGreaterThan(0)
        }
      }
    })
  })

  describe('individual CDR spot checks', () => {
    it('LRINEC has 6 select components and sum scoring with max 13', () => {
      const lrinecCdr = batch26RescueId1Cdrs.find((c) => c.id === 'lrinec')!
      expect(lrinecCdr).toBeDefined()
      expect(lrinecCdr.components).toHaveLength(6)
      expect(lrinecCdr.scoring.method).toBe('sum')
      expect(lrinecCdr.category).toBe('INFECTIOUS DISEASE')
      // All 6 components are select with user_input source
      for (const comp of lrinecCdr.components) {
        expect(comp.type).toBe('select')
        expect(comp.source).toBe('user_input')
      }
      // CRP >=150 is worth 4 points (highest single component)
      const crp = lrinecCdr.components.find((c) => c.id === 'crp')!
      const crpMax = Math.max(...crp.options!.map((o) => o.value))
      expect(crpMax).toBe(4)
      // Score range covers 0-13
      const ranges = [...lrinecCdr.scoring.ranges].sort((a, b) => a.min - b.min)
      expect(ranges[0].min).toBe(0)
      expect(ranges[ranges.length - 1].max).toBe(13)
    })

    it('Bacterial Meningitis Score has 5 boolean components and threshold scoring', () => {
      const bms = batch26RescueId1Cdrs.find((c) => c.id === 'bacterial_meningitis_score')!
      expect(bms).toBeDefined()
      expect(bms.components).toHaveLength(5)
      expect(bms.scoring.method).toBe('threshold')
      expect(bms.category).toBe('INFECTIOUS DISEASE')
      // All components are boolean with value 1
      for (const comp of bms.components) {
        expect(comp.type).toBe('boolean')
        expect(comp.value).toBe(1)
      }
      // Seizure is section1, rest are user_input
      const seizure = bms.components.find((c) => c.id === 'seizure_at_presentation')!
      expect(seizure.source).toBe('section1')
      const labComponents = bms.components.filter((c) => c.id !== 'seizure_at_presentation')
      for (const comp of labComponents) {
        expect(comp.source).toBe('user_input')
      }
      // Score 0 = Low risk, 1-5 = High risk
      const ranges = [...bms.scoring.ranges].sort((a, b) => a.min - b.min)
      expect(ranges[0].min).toBe(0)
      expect(ranges[0].max).toBe(0)
      expect(ranges[0].risk).toBe('Low')
      expect(ranges[1].min).toBe(1)
      expect(ranges[1].max).toBe(5)
      expect(ranges[1].risk).toBe('High')
    })
  })
})
