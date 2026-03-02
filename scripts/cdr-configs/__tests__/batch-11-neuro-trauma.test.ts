import { describe, it, expect } from 'vitest'
import { batch11NeuroTraumaCdrs } from '../batch-11-neuro-trauma'
import type { CdrSeed, CdrComponent } from '../types'

describe('Batch 11 — Neurology, Trauma & GI CDRs', () => {
  it('exports exactly 10 CDR definitions', () => {
    expect(batch11NeuroTraumaCdrs).toHaveLength(10)
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

    for (const cdr of batch11NeuroTraumaCdrs) {
      for (const key of requiredKeys) {
        expect(cdr, `CDR "${cdr.id}" missing required field "${key}"`).toHaveProperty(key)
      }
    }
  })

  it('all IDs are unique', () => {
    const ids = batch11NeuroTraumaCdrs.map((c) => c.id)
    const uniqueIds = new Set(ids)
    expect(uniqueIds.size).toBe(ids.length)
  })

  it('all IDs are snake_case', () => {
    const snakeCaseRegex = /^[a-z][a-z0-9]*(_[a-z0-9]+)*$/
    for (const cdr of batch11NeuroTraumaCdrs) {
      expect(
        snakeCaseRegex.test(cdr.id),
        `CDR ID "${cdr.id}" is not snake_case`,
      ).toBe(true)
    }
  })

  describe('component validation', () => {
    it('boolean components have a numeric "value" field', () => {
      for (const cdr of batch11NeuroTraumaCdrs) {
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
      for (const cdr of batch11NeuroTraumaCdrs) {
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
      for (const cdr of batch11NeuroTraumaCdrs) {
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
      for (const cdr of batch11NeuroTraumaCdrs) {
        for (const comp of cdr.components) {
          expect(
            validSources.includes(comp.source),
            `CDR "${cdr.id}", component "${comp.id}": invalid source "${comp.source}"`,
          ).toBe(true)
        }
      }
    })

    it('component IDs are unique within each CDR', () => {
      for (const cdr of batch11NeuroTraumaCdrs) {
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
      for (const cdr of batch11NeuroTraumaCdrs) {
        expect(
          validMethods.includes(cdr.scoring.method),
          `CDR "${cdr.id}": invalid scoring method "${cdr.scoring.method}"`,
        ).toBe(true)
      }
    })

    it('scoring ranges have no gaps between consecutive ranges', () => {
      for (const cdr of batch11NeuroTraumaCdrs) {
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
      for (const cdr of batch11NeuroTraumaCdrs) {
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
      for (const cdr of batch11NeuroTraumaCdrs) {
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
      for (const cdr of batch11NeuroTraumaCdrs) {
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
    it('STESS has 4 select components and sum scoring with max 6', () => {
      const stess = batch11NeuroTraumaCdrs.find((c) => c.id === 'stess')!
      expect(stess.components).toHaveLength(4)
      for (const comp of stess.components) {
        expect(comp.type).toBe('select')
      }
      expect(stess.scoring.method).toBe('sum')
      expect(stess.category).toBe('NEUROLOGY')
      const ranges = [...stess.scoring.ranges].sort((a, b) => a.min - b.min)
      expect(ranges[ranges.length - 1].max).toBe(6)
    })

    it('ASPECTS has 10 boolean components each worth -1 (inverted scoring)', () => {
      const aspects = batch11NeuroTraumaCdrs.find((c) => c.id === 'aspects')!
      expect(aspects.components).toHaveLength(10)
      for (const comp of aspects.components) {
        expect(comp.type).toBe('boolean')
        expect(comp.value).toBe(-1)
      }
      expect(aspects.scoring.method).toBe('algorithm')
      expect(aspects.category).toBe('NEUROLOGY')
    })

    it('Modified Rankin Scale has 1 select component with 7 options (0-6)', () => {
      const mrs = batch11NeuroTraumaCdrs.find((c) => c.id === 'modified_rankin')!
      expect(mrs.components).toHaveLength(1)
      expect(mrs.components[0].type).toBe('select')
      expect(mrs.components[0].options).toHaveLength(7)
      const values = mrs.components[0].options!.map((o) => o.value)
      expect(Math.min(...values)).toBe(0)
      expect(Math.max(...values)).toBe(6)
    })

    it('CHALICE has 14 boolean components with threshold scoring', () => {
      const chalice = batch11NeuroTraumaCdrs.find((c) => c.id === 'chalice_rule')!
      expect(chalice.components).toHaveLength(14)
      for (const comp of chalice.components) {
        expect(comp.type).toBe('boolean')
        expect(comp.value).toBe(1)
      }
      expect(chalice.scoring.method).toBe('threshold')
      expect(chalice.category).toBe('TRAUMA')
    })

    it('TASH Score has 8 components (mixed boolean and select) with sum scoring', () => {
      const tash = batch11NeuroTraumaCdrs.find((c) => c.id === 'tash_score')!
      expect(tash.components).toHaveLength(8)
      expect(tash.scoring.method).toBe('sum')
      expect(tash.category).toBe('TRAUMA')
      // pelvic_fracture is worth 6 points (highest single boolean)
      const pelvicFx = tash.components.find((c) => c.id === 'pelvic_fracture')!
      expect(pelvicFx.type).toBe('boolean')
      expect(pelvicFx.value).toBe(6)
    })

    it('Oakland Score has category GASTROINTESTINAL and 7 components', () => {
      const oakland = batch11NeuroTraumaCdrs.find((c) => c.id === 'oakland')!
      expect(oakland.category).toBe('GASTROINTESTINAL')
      expect(oakland.components).toHaveLength(7)
      expect(oakland.scoring.method).toBe('sum')
    })

    it('PAS has 8 boolean components with two weighted at 2 points', () => {
      const pas = batch11NeuroTraumaCdrs.find((c) => c.id === 'pas_appendicitis')!
      expect(pas.components).toHaveLength(8)
      expect(pas.category).toBe('GASTROINTESTINAL')
      const twoPointers = pas.components.filter((c) => c.value === 2)
      expect(twoPointers).toHaveLength(2)
      expect(pas.scoring.method).toBe('sum')
    })

    it('NEXUS Chest CT has 8 boolean components with threshold scoring', () => {
      const nexusCt = batch11NeuroTraumaCdrs.find((c) => c.id === 'nexus_chest_ct')!
      expect(nexusCt.components).toHaveLength(8)
      expect(nexusCt.scoring.method).toBe('threshold')
      for (const comp of nexusCt.components) {
        expect(comp.type).toBe('boolean')
        expect(comp.value).toBe(1)
      }
    })

    it('NEXUS Chest X-Ray has 7 boolean components with threshold scoring', () => {
      const nexusXr = batch11NeuroTraumaCdrs.find((c) => c.id === 'nexus_chest_xray')!
      expect(nexusXr.components).toHaveLength(7)
      expect(nexusXr.scoring.method).toBe('threshold')
      for (const comp of nexusXr.components) {
        expect(comp.type).toBe('boolean')
        expect(comp.value).toBe(1)
      }
    })

    it('BIG Score has 3 select components and sum scoring', () => {
      const big = batch11NeuroTraumaCdrs.find((c) => c.id === 'big_score')!
      expect(big.components).toHaveLength(3)
      for (const comp of big.components) {
        expect(comp.type).toBe('select')
      }
      expect(big.scoring.method).toBe('sum')
      expect(big.category).toBe('TRAUMA')
    })
  })
})
