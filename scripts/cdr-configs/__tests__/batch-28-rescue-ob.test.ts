import { describe, it, expect } from 'vitest'
import { batch28RescueObCdrs } from '../batch-28-rescue-ob'
import type { CdrSeed } from '../types'

describe('Batch 28 — OB Rescue CDRs', () => {
  it('exports exactly 1 CDR definition', () => {
    expect(batch28RescueObCdrs).toHaveLength(1)
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

    for (const cdr of batch28RescueObCdrs) {
      for (const key of requiredKeys) {
        expect(cdr, `CDR "${cdr.id}" missing required field "${key}"`).toHaveProperty(key)
      }
    }
  })

  it('all IDs are unique', () => {
    const ids = batch28RescueObCdrs.map((c) => c.id)
    const uniqueIds = new Set(ids)
    expect(uniqueIds.size).toBe(ids.length)
  })

  it('all IDs are snake_case', () => {
    const snakeCaseRegex = /^[a-z0-9][a-z0-9]*(_[a-z0-9]+)*$/
    for (const cdr of batch28RescueObCdrs) {
      expect(
        snakeCaseRegex.test(cdr.id),
        `CDR ID "${cdr.id}" is not snake_case`,
      ).toBe(true)
    }
  })

  it('every CDR has >= 3 user-answerable interactive components', () => {
    for (const cdr of batch28RescueObCdrs) {
      const userAnswerable = cdr.components.filter(
        (c) =>
          (c.type === 'boolean' || c.type === 'select') &&
          (c.source === 'section1' || c.source === 'user_input'),
      )
      expect(
        userAnswerable.length,
        `CDR "${cdr.id}" has only ${userAnswerable.length} user-answerable components (need >= 3)`,
      ).toBeGreaterThanOrEqual(3)
    }
  })

  describe('component validation', () => {
    it('boolean components have a numeric "value" field', () => {
      for (const cdr of batch28RescueObCdrs) {
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
      for (const cdr of batch28RescueObCdrs) {
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
      for (const cdr of batch28RescueObCdrs) {
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
      for (const cdr of batch28RescueObCdrs) {
        for (const comp of cdr.components) {
          expect(
            validSources.includes(comp.source),
            `CDR "${cdr.id}", component "${comp.id}": invalid source "${comp.source}"`,
          ).toBe(true)
        }
      }
    })

    it('component IDs are unique within each CDR', () => {
      for (const cdr of batch28RescueObCdrs) {
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
      for (const cdr of batch28RescueObCdrs) {
        expect(
          validMethods.includes(cdr.scoring.method),
          `CDR "${cdr.id}": invalid scoring method "${cdr.scoring.method}"`,
        ).toBe(true)
      }
    })

    it('scoring ranges have no gaps between consecutive ranges', () => {
      for (const cdr of batch28RescueObCdrs) {
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
      for (const cdr of batch28RescueObCdrs) {
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
      for (const cdr of batch28RescueObCdrs) {
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
      for (const cdr of batch28RescueObCdrs) {
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
    it('HELLP Mississippi has 4 components (3 select + 1 boolean) and algorithm scoring', () => {
      const hellp = batch28RescueObCdrs.find((c) => c.id === 'hellp_mississippi')!
      expect(hellp).toBeDefined()
      expect(hellp.components).toHaveLength(4)
      expect(hellp.scoring.method).toBe('algorithm')
      expect(hellp.category).toBe('OB/GYN & OBSTETRIC EMERGENCY')
      // 3 select + 1 boolean
      const selects = hellp.components.filter((c) => c.type === 'select')
      const booleans = hellp.components.filter((c) => c.type === 'boolean')
      expect(selects).toHaveLength(3)
      expect(booleans).toHaveLength(1)
      // All 4 components are user_input (no section2 remaining)
      const section2Count = hellp.components.filter((c) => c.source === 'section2').length
      expect(section2Count).toBe(0)
      const userInputCount = hellp.components.filter((c) => c.source === 'user_input').length
      expect(userInputCount).toBe(4)
      // 3 classes in scoring
      expect(hellp.scoring.ranges).toHaveLength(3)
      const ranges = [...hellp.scoring.ranges].sort((a, b) => a.min - b.min)
      expect(ranges[0].risk).toBe('Class 1 - Severe')
      expect(ranges[1].risk).toBe('Class 2 - Moderate')
      expect(ranges[2].risk).toBe('Class 3 - Mild')
    })
  })
})
