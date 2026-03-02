import { describe, it, expect } from 'vitest'
import { batch1CardioCdrs } from '../batch-1-cardio'
import type { CdrSeed, CdrComponent } from '../types'

describe('Batch 1 — Cardiovascular CDRs', () => {
  it('exports exactly 10 CDR definitions', () => {
    expect(batch1CardioCdrs).toHaveLength(10)
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

    for (const cdr of batch1CardioCdrs) {
      for (const key of requiredKeys) {
        expect(cdr, `CDR "${cdr.id}" missing required field "${key}"`).toHaveProperty(key)
      }
    }
  })

  it('all IDs are unique', () => {
    const ids = batch1CardioCdrs.map((c) => c.id)
    const uniqueIds = new Set(ids)
    expect(uniqueIds.size).toBe(ids.length)
  })

  it('all IDs are snake_case', () => {
    const snakeCaseRegex = /^[a-z][a-z0-9]*(_[a-z0-9]+)*$/
    for (const cdr of batch1CardioCdrs) {
      expect(
        snakeCaseRegex.test(cdr.id),
        `CDR ID "${cdr.id}" is not snake_case`,
      ).toBe(true)
    }
  })

  describe('component validation', () => {
    it('boolean components have a numeric "value" field', () => {
      for (const cdr of batch1CardioCdrs) {
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
      for (const cdr of batch1CardioCdrs) {
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
      for (const cdr of batch1CardioCdrs) {
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
      for (const cdr of batch1CardioCdrs) {
        for (const comp of cdr.components) {
          expect(
            validSources.includes(comp.source),
            `CDR "${cdr.id}", component "${comp.id}": invalid source "${comp.source}"`,
          ).toBe(true)
        }
      }
    })

    it('component IDs are unique within each CDR', () => {
      for (const cdr of batch1CardioCdrs) {
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
      for (const cdr of batch1CardioCdrs) {
        expect(
          validMethods.includes(cdr.scoring.method),
          `CDR "${cdr.id}": invalid scoring method "${cdr.scoring.method}"`,
        ).toBe(true)
      }
    })

    it('scoring ranges have no gaps between consecutive ranges', () => {
      for (const cdr of batch1CardioCdrs) {
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
      for (const cdr of batch1CardioCdrs) {
        const ranges = [...cdr.scoring.ranges].sort((a, b) => a.min - b.min)
        for (let i = 1; i < ranges.length; i++) {
          expect(
            ranges[i].min,
            `CDR "${cdr.id}": overlap between ranges "${ranges[i - 1].risk}" and "${ranges[i].risk}"`,
          ).toBeGreaterThan(ranges[i - 1].max)
        }
      }
    })

    it('scoring ranges cover the full achievable score range for sum-method CDRs', () => {
      for (const cdr of batch1CardioCdrs) {
        if (cdr.scoring.method !== 'sum') continue

        // Calculate min and max achievable scores
        let minScore = 0
        let maxScore = 0

        for (const comp of cdr.components) {
          if (comp.type === 'boolean') {
            const v = comp.value ?? 0
            // Boolean: contributes 0 (unchecked) or v (checked)
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
      for (const cdr of batch1CardioCdrs) {
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
    it('TIMI UA/NSTEMI has 7 boolean components each worth 1 point', () => {
      const timi = batch1CardioCdrs.find((c) => c.id === 'timi_ua_nstemi')!
      expect(timi.components).toHaveLength(7)
      for (const comp of timi.components) {
        expect(comp.type).toBe('boolean')
        expect(comp.value).toBe(1)
      }
    })

    it('sPESI has 6 boolean components each worth 1 point with threshold at 0', () => {
      const spesi = batch1CardioCdrs.find((c) => c.id === 'spesi')!
      expect(spesi.components).toHaveLength(6)
      for (const comp of spesi.components) {
        expect(comp.type).toBe('boolean')
        expect(comp.value).toBe(1)
      }
      // Low risk is score 0 only
      const lowRange = spesi.scoring.ranges.find((r) => r.risk === 'Low')!
      expect(lowRange.min).toBe(0)
      expect(lowRange.max).toBe(0)
    })

    it('HAS-BLED has 9 boolean components each worth 1 point', () => {
      const hasbled = batch1CardioCdrs.find((c) => c.id === 'has_bled')!
      expect(hasbled.components).toHaveLength(9)
      for (const comp of hasbled.components) {
        expect(comp.type).toBe('boolean')
        expect(comp.value).toBe(1)
      }
    })

    it('ADD-RS has 3 risk category booleans plus D-dimer', () => {
      const addrs = batch1CardioCdrs.find((c) => c.id === 'add_rs')!
      expect(addrs.components).toHaveLength(4)
      expect(addrs.scoring.method).toBe('algorithm')
      // 3 risk categories each worth 1 point
      const riskCategories = addrs.components.filter((c) => c.value === 1)
      expect(riskCategories).toHaveLength(3)
    })

    it('Sgarbossa uses algorithm scoring method', () => {
      const sgarbossa = batch1CardioCdrs.find((c) => c.id === 'sgarbossa')!
      expect(sgarbossa.scoring.method).toBe('algorithm')
      // Original weighted: concordant ST elevation = 5, depression = 3, discordant = 2
      const concordantElev = sgarbossa.components.find((c) => c.id === 'concordant_st_elevation')!
      expect(concordantElev.value).toBe(5)
      const concordantDep = sgarbossa.components.find((c) => c.id === 'concordant_st_depression')!
      expect(concordantDep.value).toBe(3)
    })

    it('PESI age select starts at 25 (representing 18-30 years)', () => {
      const pesi = batch1CardioCdrs.find((c) => c.id === 'pesi')!
      const ageComp = pesi.components.find((c) => c.id === 'age')!
      expect(ageComp.type).toBe('select')
      const minAge = Math.min(...(ageComp.options?.map((o) => o.value) ?? []))
      expect(minAge).toBe(25)
    })

    it('EDACS reproduced_palpation has negative point value', () => {
      const edacs = batch1CardioCdrs.find((c) => c.id === 'edacs')!
      const palpation = edacs.components.find((c) => c.id === 'reproduced_palpation')!
      expect(palpation.value).toBeLessThan(0)
    })

    it('all CDRs have category CARDIOVASCULAR', () => {
      for (const cdr of batch1CardioCdrs) {
        expect(cdr.category).toBe('CARDIOVASCULAR')
      }
    })
  })
})
