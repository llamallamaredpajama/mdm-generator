import { describe, it, expect } from 'vitest'
import { batch14PedsHemeCdrs } from '../batch-14-peds-heme'
import type { CdrSeed } from '../types'

describe('Batch 14 — Pediatric + Hematology CDRs', () => {
  it('exports exactly 6 CDR definitions', () => {
    expect(batch14PedsHemeCdrs).toHaveLength(6)
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

    for (const cdr of batch14PedsHemeCdrs) {
      for (const key of requiredKeys) {
        expect(cdr, `CDR "${cdr.id}" missing required field "${key}"`).toHaveProperty(key)
      }
    }
  })

  it('all IDs are unique', () => {
    const ids = batch14PedsHemeCdrs.map((c) => c.id)
    const uniqueIds = new Set(ids)
    expect(uniqueIds.size).toBe(ids.length)
  })

  it('all IDs are snake_case', () => {
    const snakeCaseRegex = /^[a-z][a-z0-9]*(_[a-z0-9]+)*$/
    for (const cdr of batch14PedsHemeCdrs) {
      expect(
        snakeCaseRegex.test(cdr.id),
        `CDR ID "${cdr.id}" is not snake_case`,
      ).toBe(true)
    }
  })

  describe('component validation', () => {
    it('boolean components have a numeric "value" field', () => {
      for (const cdr of batch14PedsHemeCdrs) {
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
      for (const cdr of batch14PedsHemeCdrs) {
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
      for (const cdr of batch14PedsHemeCdrs) {
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
      for (const cdr of batch14PedsHemeCdrs) {
        for (const comp of cdr.components) {
          expect(
            validSources.includes(comp.source),
            `CDR "${cdr.id}", component "${comp.id}": invalid source "${comp.source}"`,
          ).toBe(true)
        }
      }
    })

    it('component IDs are unique within each CDR', () => {
      for (const cdr of batch14PedsHemeCdrs) {
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
      for (const cdr of batch14PedsHemeCdrs) {
        expect(
          validMethods.includes(cdr.scoring.method),
          `CDR "${cdr.id}": invalid scoring method "${cdr.scoring.method}"`,
        ).toBe(true)
      }
    })

    it('scoring ranges have no gaps between consecutive ranges', () => {
      for (const cdr of batch14PedsHemeCdrs) {
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
      for (const cdr of batch14PedsHemeCdrs) {
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
      for (const cdr of batch14PedsHemeCdrs) {
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
      for (const cdr of batch14PedsHemeCdrs) {
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
    it('PIBS has 5 components with abnormal_neuro_exam worth 2 points', () => {
      const pibs = batch14PedsHemeCdrs.find((c) => c.id === 'pibs')!
      expect(pibs.components).toHaveLength(5)
      expect(pibs.category).toBe('PEDIATRIC')
      const neuro = pibs.components.find((c) => c.id === 'abnormal_neuro_exam')!
      expect(neuro.value).toBe(2)
      expect(neuro.type).toBe('boolean')
    })

    it('Tal Score has 4 select components each with 4 options (0–3)', () => {
      const tal = batch14PedsHemeCdrs.find((c) => c.id === 'tal_score')!
      expect(tal.components).toHaveLength(4)
      for (const comp of tal.components) {
        expect(comp.type).toBe('select')
        expect(comp.options).toHaveLength(4)
        const values = comp.options!.map((o) => o.value)
        expect(Math.min(...values)).toBe(0)
        expect(Math.max(...values)).toBe(3)
      }
    })

    it('YOS has 6 select components each with options 1/3/5 and starts at score 6', () => {
      const yos = batch14PedsHemeCdrs.find((c) => c.id === 'yos')!
      expect(yos.components).toHaveLength(6)
      for (const comp of yos.components) {
        expect(comp.type).toBe('select')
        const values = comp.options!.map((o) => o.value).sort((a, b) => a - b)
        expect(values).toEqual([1, 3, 5])
      }
      // Min score is 6 (all components = 1)
      const ranges = [...yos.scoring.ranges].sort((a, b) => a.min - b.min)
      expect(ranges[0].min).toBe(6)
    })

    it('HEMORR₂HAGES has 11 boolean components with rebleed_risk worth 2 points', () => {
      const hem = batch14PedsHemeCdrs.find((c) => c.id === 'hemorr2hages')!
      expect(hem.components).toHaveLength(11)
      expect(hem.category).toBe('HEMATOLOGY / COAGULATION')
      const rebleed = hem.components.find((c) => c.id === 'rebleed_risk')!
      expect(rebleed.value).toBe(2)
      // All other booleans worth 1
      const others = hem.components.filter((c) => c.id !== 'rebleed_risk')
      for (const comp of others) {
        expect(comp.value).toBe(1)
      }
    })

    // Bhutani Nomogram, ISTH DIC, ANC Calculation, RPI quarantined to _quarantine/

    it('Phoenix Sepsis has 4 organ-system select components with sum scoring', () => {
      const phoenix = batch14PedsHemeCdrs.find((c) => c.id === 'phoenix_sepsis')!
      expect(phoenix.components).toHaveLength(4)
      expect(phoenix.scoring.method).toBe('sum')
      const compIds = phoenix.components.map((c) => c.id)
      expect(compIds).toContain('respiratory')
      expect(compIds).toContain('cardiovascular')
      expect(compIds).toContain('coagulation')
      expect(compIds).toContain('neurologic')
    })
  })
})
