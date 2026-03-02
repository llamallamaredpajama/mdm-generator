import { describe, it, expect } from 'vitest'
import { batch12GiIdCdrs } from '../batch-12-gi-id'
import type { CdrSeed, CdrComponent } from '../types'

describe('Batch 12 — Gastrointestinal / Genitourinary + Infectious Disease CDRs', () => {
  it('exports exactly 10 CDR definitions', () => {
    expect(batch12GiIdCdrs).toHaveLength(10)
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

    for (const cdr of batch12GiIdCdrs) {
      for (const key of requiredKeys) {
        expect(cdr, `CDR "${cdr.id}" missing required field "${key}"`).toHaveProperty(key)
      }
    }
  })

  it('all IDs are unique', () => {
    const ids = batch12GiIdCdrs.map((c) => c.id)
    const uniqueIds = new Set(ids)
    expect(uniqueIds.size).toBe(ids.length)
  })

  it('all IDs are snake_case', () => {
    const snakeCaseRegex = /^[a-z][a-z0-9]*(_[a-z0-9]+)*$/
    for (const cdr of batch12GiIdCdrs) {
      expect(
        snakeCaseRegex.test(cdr.id),
        `CDR ID "${cdr.id}" is not snake_case`,
      ).toBe(true)
    }
  })

  describe('component validation', () => {
    it('boolean components have a numeric "value" field', () => {
      for (const cdr of batch12GiIdCdrs) {
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
      for (const cdr of batch12GiIdCdrs) {
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
      for (const cdr of batch12GiIdCdrs) {
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
      for (const cdr of batch12GiIdCdrs) {
        for (const comp of cdr.components) {
          expect(
            validSources.includes(comp.source),
            `CDR "${cdr.id}", component "${comp.id}": invalid source "${comp.source}"`,
          ).toBe(true)
        }
      }
    })

    it('component IDs are unique within each CDR', () => {
      for (const cdr of batch12GiIdCdrs) {
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
      for (const cdr of batch12GiIdCdrs) {
        expect(
          validMethods.includes(cdr.scoring.method),
          `CDR "${cdr.id}": invalid scoring method "${cdr.scoring.method}"`,
        ).toBe(true)
      }
    })

    it('scoring ranges have no gaps between consecutive ranges', () => {
      for (const cdr of batch12GiIdCdrs) {
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
      for (const cdr of batch12GiIdCdrs) {
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
      for (const cdr of batch12GiIdCdrs) {
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
      for (const cdr of batch12GiIdCdrs) {
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
    it("Ranson's Criteria has 11 boolean components each worth 1 point", () => {
      const ransons = batch12GiIdCdrs.find((c) => c.id === 'ransons_criteria')!
      expect(ransons.components).toHaveLength(11)
      for (const comp of ransons.components) {
        expect(comp.type).toBe('boolean')
        expect(comp.value).toBe(1)
      }
      expect(ransons.scoring.method).toBe('sum')
      expect(ransons.category).toBe('GASTROINTESTINAL')
    })

    it('Atlanta Classification uses algorithm scoring with 3 select components', () => {
      const atlanta = batch12GiIdCdrs.find((c) => c.id === 'atlanta_pancreatitis')!
      expect(atlanta.components).toHaveLength(3)
      for (const comp of atlanta.components) {
        expect(comp.type).toBe('select')
      }
      expect(atlanta.scoring.method).toBe('algorithm')
      expect(atlanta.category).toBe('GASTROINTESTINAL')
    })

    it("Charcot's Triad / Reynolds' Pentad has 5 boolean components with threshold scoring", () => {
      const charcot = batch12GiIdCdrs.find((c) => c.id === 'charcot_reynolds')!
      expect(charcot.components).toHaveLength(5)
      for (const comp of charcot.components) {
        expect(comp.type).toBe('boolean')
        expect(comp.value).toBe(1)
      }
      expect(charcot.scoring.method).toBe('threshold')
      expect(charcot.category).toBe('GASTROINTESTINAL')
      // Three risk levels: Low Suspicion, Charcot's Triad, Reynolds' Pentad
      expect(charcot.scoring.ranges).toHaveLength(3)
    })

    it('STONE Score has 5 select components with category GENITOURINARY', () => {
      const stone = batch12GiIdCdrs.find((c) => c.id === 'stone_score')!
      expect(stone.components).toHaveLength(5)
      for (const comp of stone.components) {
        expect(comp.type).toBe('select')
      }
      expect(stone.scoring.method).toBe('sum')
      expect(stone.category).toBe('GENITOURINARY')
      // Min achievable score is 4 (Sex Female=2 + Timing >24h=1 + Origin Black=1 + Nausea None=0 + RBCs None=0)
      const ranges = [...stone.scoring.ranges].sort((a, b) => a.min - b.min)
      expect(ranges[0].min).toBe(4)
    })

    it('TWIST Score has 5 boolean components with two weighted at 2 points', () => {
      const twist = batch12GiIdCdrs.find((c) => c.id === 'twist_score')!
      expect(twist.components).toHaveLength(5)
      expect(twist.category).toBe('GENITOURINARY')
      const twoPointers = twist.components.filter((c) => c.value === 2)
      expect(twoPointers).toHaveLength(2)
      expect(twist.scoring.method).toBe('sum')
    })

    it('Philadelphia Criteria has 9 boolean components with threshold scoring (all must be met)', () => {
      const philly = batch12GiIdCdrs.find((c) => c.id === 'philadelphia_criteria')!
      expect(philly.components).toHaveLength(9)
      for (const comp of philly.components) {
        expect(comp.type).toBe('boolean')
        expect(comp.value).toBe(1)
      }
      expect(philly.scoring.method).toBe('threshold')
      expect(philly.category).toBe('INFECTIOUS DISEASE')
      // Low risk requires ALL 9 criteria met (score = 9)
      const lowRange = philly.scoring.ranges.find((r) => r.risk === 'Low')!
      expect(lowRange.min).toBe(9)
      expect(lowRange.max).toBe(9)
    })

    it('Boston Criteria has 6 boolean components with threshold scoring', () => {
      const boston = batch12GiIdCdrs.find((c) => c.id === 'boston_criteria_febrile_infant')!
      expect(boston.components).toHaveLength(6)
      expect(boston.scoring.method).toBe('threshold')
      expect(boston.category).toBe('INFECTIOUS DISEASE')
      // Low risk at score = 6 (all criteria met)
      const lowRange = boston.scoring.ranges.find((r) => r.risk === 'Low')!
      expect(lowRange.min).toBe(6)
      expect(lowRange.max).toBe(6)
    })

    it('Lab-Score has 3 select components with sum scoring up to 7', () => {
      const labScore = batch12GiIdCdrs.find((c) => c.id === 'lab_score')!
      expect(labScore.components).toHaveLength(3)
      for (const comp of labScore.components) {
        expect(comp.type).toBe('select')
      }
      expect(labScore.scoring.method).toBe('sum')
      expect(labScore.category).toBe('INFECTIOUS DISEASE')
      const ranges = [...labScore.scoring.ranges].sort((a, b) => a.min - b.min)
      expect(ranges[ranges.length - 1].max).toBe(7)
    })

    it('AAP 2021 Febrile Infant uses algorithm scoring with mixed component types', () => {
      const aap = batch12GiIdCdrs.find((c) => c.id === 'aap_2021_febrile_infant')!
      expect(aap.components).toHaveLength(5)
      expect(aap.scoring.method).toBe('algorithm')
      expect(aap.category).toBe('INFECTIOUS DISEASE')
      // Has both select (age_group) and boolean components
      const selects = aap.components.filter((c) => c.type === 'select')
      const booleans = aap.components.filter((c) => c.type === 'boolean')
      expect(selects).toHaveLength(1)
      expect(booleans).toHaveLength(4)
    })

    it('CISNE Score has 6 boolean components with two weighted at 2 points', () => {
      const cisne = batch12GiIdCdrs.find((c) => c.id === 'cisne')!
      expect(cisne.components).toHaveLength(6)
      expect(cisne.category).toBe('INFECTIOUS DISEASE')
      expect(cisne.scoring.method).toBe('sum')
      const twoPointers = cisne.components.filter((c) => c.value === 2)
      expect(twoPointers).toHaveLength(2)
      const onePointers = cisne.components.filter((c) => c.value === 1)
      expect(onePointers).toHaveLength(4)
    })
  })
})
