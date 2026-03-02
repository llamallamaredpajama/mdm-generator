import { describe, it, expect } from 'vitest'
import { batch18NephroOncCdrs } from '../batch-18-nephro-onc'
import type { CdrSeed, CdrComponent } from '../types'

describe('Batch 18 — Nephrology/Electrolytes & Oncologic CDRs', () => {
  it('exports exactly 10 CDR definitions', () => {
    expect(batch18NephroOncCdrs).toHaveLength(10)
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

    for (const cdr of batch18NephroOncCdrs) {
      for (const key of requiredKeys) {
        expect(cdr, `CDR "${cdr.id}" missing required field "${key}"`).toHaveProperty(key)
      }
    }
  })

  it('all IDs are unique', () => {
    const ids = batch18NephroOncCdrs.map((c) => c.id)
    const uniqueIds = new Set(ids)
    expect(uniqueIds.size).toBe(ids.length)
  })

  it('all IDs are snake_case', () => {
    const snakeCaseRegex = /^[a-z][a-z0-9]*(_[a-z0-9]+)*$/
    for (const cdr of batch18NephroOncCdrs) {
      expect(
        snakeCaseRegex.test(cdr.id),
        `CDR ID "${cdr.id}" is not snake_case`,
      ).toBe(true)
    }
  })

  describe('component validation', () => {
    it('boolean components have a numeric "value" field', () => {
      for (const cdr of batch18NephroOncCdrs) {
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
      for (const cdr of batch18NephroOncCdrs) {
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
      for (const cdr of batch18NephroOncCdrs) {
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
      for (const cdr of batch18NephroOncCdrs) {
        for (const comp of cdr.components) {
          expect(
            validSources.includes(comp.source),
            `CDR "${cdr.id}", component "${comp.id}": invalid source "${comp.source}"`,
          ).toBe(true)
        }
      }
    })

    it('component IDs are unique within each CDR', () => {
      for (const cdr of batch18NephroOncCdrs) {
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
      for (const cdr of batch18NephroOncCdrs) {
        expect(
          validMethods.includes(cdr.scoring.method),
          `CDR "${cdr.id}": invalid scoring method "${cdr.scoring.method}"`,
        ).toBe(true)
      }
    })

    it('scoring ranges have no gaps between consecutive ranges', () => {
      for (const cdr of batch18NephroOncCdrs) {
        if (cdr.scoring.method === 'algorithm') continue // Algorithm CDRs may have intentional gaps (e.g., KPS 10-point increments)
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
      for (const cdr of batch18NephroOncCdrs) {
        const ranges = [...cdr.scoring.ranges].sort((a, b) => a.min - b.min)
        for (let i = 1; i < ranges.length; i++) {
          // Algorithm CDRs may have shared boundaries or intentional gaps
          expect(
            ranges[i].min,
            `CDR "${cdr.id}": overlap between ranges "${ranges[i - 1].risk}" and "${ranges[i].risk}"`,
          ).toBeGreaterThanOrEqual(ranges[i - 1].max)
        }
      }
    })

    it('scoring ranges cover the full achievable score range for sum-method CDRs', () => {
      for (const cdr of batch18NephroOncCdrs) {
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
      for (const cdr of batch18NephroOncCdrs) {
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
    it('PLASMIC Score has 7 boolean components each worth 1 point with sum scoring', () => {
      const plasmic = batch18NephroOncCdrs.find((c) => c.id === 'plasmic_score')!
      expect(plasmic.components).toHaveLength(7)
      expect(plasmic.scoring.method).toBe('sum')
      expect(plasmic.category).toBe('ONCOLOGIC EMERGENCY')
      for (const comp of plasmic.components) {
        expect(comp.type).toBe('boolean')
        expect(comp.value).toBe(1)
      }
    })

    it('Cairo-Bishop TLS has 7 boolean components and threshold scoring', () => {
      const tls = batch18NephroOncCdrs.find((c) => c.id === 'cairo_bishop_tls')!
      expect(tls.components).toHaveLength(7)
      expect(tls.scoring.method).toBe('threshold')
      expect(tls.category).toBe('ONCOLOGIC EMERGENCY')
      // All booleans worth 1 point
      for (const comp of tls.components) {
        expect(comp.type).toBe('boolean')
        expect(comp.value).toBe(1)
      }
    })

    it('ECOG Performance Status has a single select component with 6 options (0-5)', () => {
      const ecog = batch18NephroOncCdrs.find((c) => c.id === 'ecog_performance')!
      expect(ecog.components).toHaveLength(1)
      expect(ecog.scoring.method).toBe('sum')
      const select = ecog.components[0]
      expect(select.type).toBe('select')
      expect(select.options).toHaveLength(6)
      // Values should range from 0 to 5
      const values = select.options!.map((o) => o.value)
      expect(Math.min(...values)).toBe(0)
      expect(Math.max(...values)).toBe(5)
    })

    it('Karnofsky PS has a single select with 11 options (0-100 in 10-point increments) and algorithm scoring', () => {
      const kps = batch18NephroOncCdrs.find((c) => c.id === 'karnofsky_ps')!
      expect(kps.components).toHaveLength(1)
      expect(kps.scoring.method).toBe('algorithm')
      const select = kps.components[0]
      expect(select.type).toBe('select')
      expect(select.options).toHaveLength(11)
      const values = select.options!.map((o) => o.value)
      expect(Math.min(...values)).toBe(0)
      expect(Math.max(...values)).toBe(100)
    })

    it('FEUrea has 4 number_range components and algorithm scoring', () => {
      const feurea = batch18NephroOncCdrs.find((c) => c.id === 'feurea')!
      expect(feurea.components).toHaveLength(4)
      expect(feurea.scoring.method).toBe('algorithm')
      expect(feurea.category).toBe('NEPHROLOGY & ELECTROLYTES')
      for (const comp of feurea.components) {
        expect(comp.type).toBe('number_range')
      }
    })

    it('Schwartz Equation has 3 components including a select for k constant', () => {
      const schwartz = batch18NephroOncCdrs.find((c) => c.id === 'schwartz_equation')!
      expect(schwartz.components).toHaveLength(3)
      expect(schwartz.scoring.method).toBe('algorithm')
      const kConstant = schwartz.components.find((c) => c.id === 'k_constant')!
      expect(kConstant.type).toBe('select')
      expect(kConstant.options).toHaveLength(3)
    })

    it("Winter's Formula has 2 number_range components and algorithm scoring with 3 outcome ranges", () => {
      const winters = batch18NephroOncCdrs.find((c) => c.id === 'winters_formula')!
      expect(winters.components).toHaveLength(2)
      expect(winters.scoring.method).toBe('algorithm')
      expect(winters.scoring.ranges).toHaveLength(3)
      for (const comp of winters.components) {
        expect(comp.type).toBe('number_range')
      }
    })

    it('covers 2 distinct categories', () => {
      const categories = new Set(batch18NephroOncCdrs.map((c) => c.category))
      expect(categories.has('NEPHROLOGY & ELECTROLYTES')).toBe(true)
      expect(categories.has('ONCOLOGIC EMERGENCY')).toBe(true)
    })
  })
})
