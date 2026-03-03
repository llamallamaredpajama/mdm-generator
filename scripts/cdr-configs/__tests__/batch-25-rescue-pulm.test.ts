import { describe, it, expect } from 'vitest'
import { batch25RescuePulmCdrs } from '../batch-25-rescue-pulm'
import type { CdrSeed } from '../types'

describe('Batch 25 — Pulmonary Rescue CDRs', () => {
  it('exports exactly 2 CDR definitions', () => {
    expect(batch25RescuePulmCdrs).toHaveLength(2)
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

    for (const cdr of batch25RescuePulmCdrs) {
      for (const key of requiredKeys) {
        expect(cdr, `CDR "${cdr.id}" missing required field "${key}"`).toHaveProperty(key)
      }
    }
  })

  it('all IDs are unique', () => {
    const ids = batch25RescuePulmCdrs.map((c) => c.id)
    const uniqueIds = new Set(ids)
    expect(uniqueIds.size).toBe(ids.length)
  })

  it('all IDs are snake_case', () => {
    const snakeCaseRegex = /^[a-z][a-z0-9]*(_[a-z0-9]+)*$/
    for (const cdr of batch25RescuePulmCdrs) {
      expect(
        snakeCaseRegex.test(cdr.id),
        `CDR ID "${cdr.id}" is not snake_case`,
      ).toBe(true)
    }
  })

  it('every CDR has >= 3 user-answerable interactive components', () => {
    for (const cdr of batch25RescuePulmCdrs) {
      const userAnswerable = cdr.components.filter(
        (c) => (c.type === 'boolean' || c.type === 'select') &&
          (c.source === 'section1' || c.source === 'user_input'),
      )
      expect(userAnswerable.length, `CDR "${cdr.id}" has only ${userAnswerable.length} user-answerable`).toBeGreaterThanOrEqual(3)
    }
  })

  describe('component validation', () => {
    it('boolean components have a numeric "value" field', () => {
      for (const cdr of batch25RescuePulmCdrs) {
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
      for (const cdr of batch25RescuePulmCdrs) {
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
      for (const cdr of batch25RescuePulmCdrs) {
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
      for (const cdr of batch25RescuePulmCdrs) {
        for (const comp of cdr.components) {
          expect(
            validSources.includes(comp.source),
            `CDR "${cdr.id}", component "${comp.id}": invalid source "${comp.source}"`,
          ).toBe(true)
        }
      }
    })

    it('component IDs are unique within each CDR', () => {
      for (const cdr of batch25RescuePulmCdrs) {
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
      for (const cdr of batch25RescuePulmCdrs) {
        expect(
          validMethods.includes(cdr.scoring.method),
          `CDR "${cdr.id}": invalid scoring method "${cdr.scoring.method}"`,
        ).toBe(true)
      }
    })

    it('scoring ranges have no gaps between consecutive ranges', () => {
      for (const cdr of batch25RescuePulmCdrs) {
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
      for (const cdr of batch25RescuePulmCdrs) {
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
      for (const cdr of batch25RescuePulmCdrs) {
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
      for (const cdr of batch25RescuePulmCdrs) {
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
    it("Light's Criteria has 3 boolean components and algorithm scoring", () => {
      const lights = batch25RescuePulmCdrs.find((c) => c.id === 'lights_criteria')!
      expect(lights).toBeDefined()
      expect(lights.components).toHaveLength(3)
      expect(lights.scoring.method).toBe('algorithm')
      expect(lights.category).toBe('PULMONARY')
      // All 3 components are boolean with value 1
      for (const comp of lights.components) {
        expect(comp.type).toBe('boolean')
        expect(comp.value).toBe(1)
        expect(comp.source).toBe('user_input')
      }
      // Score 0 = Transudate, 1-3 = Exudate
      const ranges = [...lights.scoring.ranges].sort((a, b) => a.min - b.min)
      expect(ranges[0].min).toBe(0)
      expect(ranges[0].max).toBe(0)
      expect(ranges[0].risk).toBe('Transudate')
      expect(ranges[1].min).toBe(1)
      expect(ranges[1].max).toBe(3)
      expect(ranges[1].risk).toBe('Exudate')
    })

    it('DECAF has 5 components (1 select + 4 boolean) and sum scoring with max 6', () => {
      const decaf = batch25RescuePulmCdrs.find((c) => c.id === 'decaf')!
      expect(decaf).toBeDefined()
      expect(decaf.components).toHaveLength(5)
      expect(decaf.scoring.method).toBe('sum')
      expect(decaf.category).toBe('PULMONARY')
      // Dyspnea is a select (eMRCD scale)
      const dyspnea = decaf.components.find((c) => c.id === 'dyspnea_emrcd')!
      expect(dyspnea.type).toBe('select')
      expect(dyspnea.source).toBe('section1')
      expect(dyspnea.options).toHaveLength(3)
      // Other 4 are boolean with value 1 and user_input source
      const boolComps = decaf.components.filter((c) => c.type === 'boolean')
      expect(boolComps).toHaveLength(4)
      for (const comp of boolComps) {
        expect(comp.value).toBe(1)
        expect(comp.source).toBe('user_input')
      }
      // Score range covers 0-6
      const ranges = [...decaf.scoring.ranges].sort((a, b) => a.min - b.min)
      expect(ranges[0].min).toBe(0)
      expect(ranges[ranges.length - 1].max).toBe(6)
    })
  })
})
