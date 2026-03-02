import { describe, it, expect } from 'vitest'
import { batch10PulmNeuroCdrs } from '../batch-10-pulm-neuro'
import type { CdrSeed, CdrComponent } from '../types'

describe('Batch 10 — Pulmonary & Neurology CDRs', () => {
  it('exports exactly 10 CDR definitions', () => {
    expect(batch10PulmNeuroCdrs).toHaveLength(10)
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

    for (const cdr of batch10PulmNeuroCdrs) {
      for (const key of requiredKeys) {
        expect(cdr, `CDR "${cdr.id}" missing required field "${key}"`).toHaveProperty(key)
      }
    }
  })

  it('all IDs are unique', () => {
    const ids = batch10PulmNeuroCdrs.map((c) => c.id)
    const uniqueIds = new Set(ids)
    expect(uniqueIds.size).toBe(ids.length)
  })

  it('all IDs are snake_case', () => {
    const snakeCaseRegex = /^[a-z][a-z0-9]*(_[a-z0-9]+)*$/
    for (const cdr of batch10PulmNeuroCdrs) {
      expect(
        snakeCaseRegex.test(cdr.id),
        `CDR ID "${cdr.id}" is not snake_case`,
      ).toBe(true)
    }
  })

  describe('component validation', () => {
    it('boolean components have a numeric "value" field', () => {
      for (const cdr of batch10PulmNeuroCdrs) {
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
      for (const cdr of batch10PulmNeuroCdrs) {
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
      for (const cdr of batch10PulmNeuroCdrs) {
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
      for (const cdr of batch10PulmNeuroCdrs) {
        for (const comp of cdr.components) {
          expect(
            validSources.includes(comp.source),
            `CDR "${cdr.id}", component "${comp.id}": invalid source "${comp.source}"`,
          ).toBe(true)
        }
      }
    })

    it('component IDs are unique within each CDR', () => {
      for (const cdr of batch10PulmNeuroCdrs) {
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
      for (const cdr of batch10PulmNeuroCdrs) {
        expect(
          validMethods.includes(cdr.scoring.method),
          `CDR "${cdr.id}": invalid scoring method "${cdr.scoring.method}"`,
        ).toBe(true)
      }
    })

    it('scoring ranges have no gaps between consecutive ranges (sum/threshold only)', () => {
      for (const cdr of batch10PulmNeuroCdrs) {
        // Algorithm-method CDRs may have intentionally overlapping/continuous ranges
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

    it('scoring ranges have no overlaps (sum/threshold only)', () => {
      for (const cdr of batch10PulmNeuroCdrs) {
        // Algorithm-method CDRs may have intentionally overlapping/continuous ranges
        if (cdr.scoring.method === 'algorithm') continue
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
      for (const cdr of batch10PulmNeuroCdrs) {
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
      for (const cdr of batch10PulmNeuroCdrs) {
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
    it("Light's Criteria has 3 boolean components each worth 1 point with algorithm scoring", () => {
      const lights = batch10PulmNeuroCdrs.find((c) => c.id === 'lights_criteria')!
      expect(lights.components).toHaveLength(3)
      expect(lights.category).toBe('PULMONARY')
      expect(lights.scoring.method).toBe('algorithm')
      for (const comp of lights.components) {
        expect(comp.type).toBe('boolean')
        expect(comp.value).toBe(1)
      }
      // Score 0 = Transudate, 1-3 = Exudate
      const transudate = lights.scoring.ranges.find((r) => r.risk === 'Transudate')!
      expect(transudate.min).toBe(0)
      expect(transudate.max).toBe(0)
    })

    it('CPSS has 3 boolean components for stroke screening with threshold scoring', () => {
      const cpss = batch10PulmNeuroCdrs.find((c) => c.id === 'cpss')!
      expect(cpss.components).toHaveLength(3)
      expect(cpss.category).toBe('NEUROLOGY')
      expect(cpss.scoring.method).toBe('threshold')
      for (const comp of cpss.components) {
        expect(comp.type).toBe('boolean')
        expect(comp.value).toBe(1)
      }
      // 3 risk levels: Low (0), High (1-2), Very High (3)
      expect(cpss.scoring.ranges).toHaveLength(3)
    })

    it('LAMS has 3 select components (facial droop 0-1, arm drift 0-2, grip 0-2) for max score 5', () => {
      const lams = batch10PulmNeuroCdrs.find((c) => c.id === 'lams')!
      expect(lams.components).toHaveLength(3)
      expect(lams.category).toBe('NEUROLOGY')
      expect(lams.scoring.method).toBe('sum')
      for (const comp of lams.components) {
        expect(comp.type).toBe('select')
      }
      const facialDroop = lams.components.find((c) => c.id === 'facial_droop')!
      expect(Math.max(...(facialDroop.options?.map((o) => o.value) ?? []))).toBe(1)
      const armDrift = lams.components.find((c) => c.id === 'arm_drift')!
      expect(Math.max(...(armDrift.options?.map((o) => o.value) ?? []))).toBe(2)
      const grip = lams.components.find((c) => c.id === 'grip_strength')!
      expect(Math.max(...(grip.options?.map((o) => o.value) ?? []))).toBe(2)
    })

    it('BE-FAST has 6 boolean components each worth 1 point with threshold scoring', () => {
      const befast = batch10PulmNeuroCdrs.find((c) => c.id === 'be_fast')!
      expect(befast.components).toHaveLength(6)
      expect(befast.category).toBe('NEUROLOGY')
      expect(befast.scoring.method).toBe('threshold')
      for (const comp of befast.components) {
        expect(comp.type).toBe('boolean')
        expect(comp.value).toBe(1)
      }
    })

    it('6-Hour CT Rule for SAH has 5 boolean components with algorithm scoring', () => {
      const sixHour = batch10PulmNeuroCdrs.find((c) => c.id === 'six_hour_ct_sah')!
      expect(sixHour.components).toHaveLength(5)
      expect(sixHour.category).toBe('NEUROLOGY')
      expect(sixHour.scoring.method).toBe('algorithm')
      for (const comp of sixHour.components) {
        expect(comp.type).toBe('boolean')
        expect(comp.value).toBe(1)
      }
      // Score 5 = all criteria met (SAH Excluded), 0-4 = Rule Not Applicable
      const excluded = sixHour.scoring.ranges.find((r) => r.risk === 'Rule Applicable \u2014 SAH Excluded')!
      expect(excluded.min).toBe(5)
      expect(excluded.max).toBe(5)
    })

    it('STANDING Algorithm has 6 components (5 selects + 1 boolean) with algorithm scoring', () => {
      const standing = batch10PulmNeuroCdrs.find((c) => c.id === 'standing_algorithm')!
      expect(standing.components).toHaveLength(6)
      expect(standing.category).toBe('NEUROLOGY')
      expect(standing.scoring.method).toBe('algorithm')
      const selects = standing.components.filter((c) => c.type === 'select')
      expect(selects).toHaveLength(5)
      const booleans = standing.components.filter((c) => c.type === 'boolean')
      expect(booleans).toHaveLength(1)
      // The boolean is new_headache_or_neuro worth 2 points
      expect(booleans[0].id).toBe('new_headache_or_neuro')
      expect(booleans[0].value).toBe(2)
    })

    it('BODE Index has 4 select components (BMI, FEV1, 6MWD, mMRC) with sum scoring', () => {
      const bode = batch10PulmNeuroCdrs.find((c) => c.id === 'bode_index')!
      expect(bode.components).toHaveLength(4)
      expect(bode.category).toBe('PULMONARY')
      expect(bode.scoring.method).toBe('sum')
      for (const comp of bode.components) {
        expect(comp.type).toBe('select')
      }
      // FEV1 has 4 options scored 0-3
      const fev1 = bode.components.find((c) => c.id === 'fev1_percent')!
      expect(fev1.options).toHaveLength(4)
      expect(Math.max(...(fev1.options?.map((o) => o.value) ?? []))).toBe(3)
    })

    it('Murray Lung Injury Score has 4 select components each scored 0-4 with algorithm method', () => {
      const murray = batch10PulmNeuroCdrs.find((c) => c.id === 'murray_lung_injury')!
      expect(murray.components).toHaveLength(4)
      expect(murray.category).toBe('PULMONARY')
      expect(murray.scoring.method).toBe('algorithm')
      for (const comp of murray.components) {
        expect(comp.type).toBe('select')
        const values = comp.options?.map((o) => o.value) ?? []
        expect(Math.min(...values)).toBe(0)
        expect(Math.max(...values)).toBe(4)
      }
    })

    it('batch contains mixed categories: PULMONARY and NEUROLOGY', () => {
      const categories = new Set(batch10PulmNeuroCdrs.map((c) => c.category))
      expect(categories.has('PULMONARY')).toBe(true)
      expect(categories.has('NEUROLOGY')).toBe(true)
    })
  })
})
