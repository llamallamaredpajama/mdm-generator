import { describe, it, expect } from 'vitest'
import { batch17PsychBurnsNephroCdrs } from '../batch-17-psych-burns-nephro'
import type { CdrSeed, CdrComponent } from '../types'

describe('Batch 17 — Psychiatry, Burns & Wound Management, Nephrology CDRs', () => {
  it('exports exactly 10 CDR definitions', () => {
    expect(batch17PsychBurnsNephroCdrs).toHaveLength(10)
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

    for (const cdr of batch17PsychBurnsNephroCdrs) {
      for (const key of requiredKeys) {
        expect(cdr, `CDR "${cdr.id}" missing required field "${key}"`).toHaveProperty(key)
      }
    }
  })

  it('all IDs are unique', () => {
    const ids = batch17PsychBurnsNephroCdrs.map((c) => c.id)
    const uniqueIds = new Set(ids)
    expect(uniqueIds.size).toBe(ids.length)
  })

  it('all IDs are snake_case', () => {
    const snakeCaseRegex = /^[a-z][a-z0-9]*(_[a-z0-9]+)*$/
    for (const cdr of batch17PsychBurnsNephroCdrs) {
      expect(
        snakeCaseRegex.test(cdr.id),
        `CDR ID "${cdr.id}" is not snake_case`,
      ).toBe(true)
    }
  })

  describe('component validation', () => {
    it('boolean components have a numeric "value" field', () => {
      for (const cdr of batch17PsychBurnsNephroCdrs) {
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
      for (const cdr of batch17PsychBurnsNephroCdrs) {
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
      for (const cdr of batch17PsychBurnsNephroCdrs) {
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
      for (const cdr of batch17PsychBurnsNephroCdrs) {
        for (const comp of cdr.components) {
          expect(
            validSources.includes(comp.source),
            `CDR "${cdr.id}", component "${comp.id}": invalid source "${comp.source}"`,
          ).toBe(true)
        }
      }
    })

    it('component IDs are unique within each CDR', () => {
      for (const cdr of batch17PsychBurnsNephroCdrs) {
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
      for (const cdr of batch17PsychBurnsNephroCdrs) {
        expect(
          validMethods.includes(cdr.scoring.method),
          `CDR "${cdr.id}": invalid scoring method "${cdr.scoring.method}"`,
        ).toBe(true)
      }
    })

    it('scoring ranges have no gaps between consecutive ranges', () => {
      for (const cdr of batch17PsychBurnsNephroCdrs) {
        const ranges = [...cdr.scoring.ranges].sort((a, b) => a.min - b.min)
        for (let i = 1; i < ranges.length; i++) {
          const prevMax = ranges[i - 1].max
          const currMin = ranges[i].min
          // Algorithm CDRs may use continuous ranges with shared boundaries
          if (cdr.scoring.method === 'algorithm') {
            expect(
              currMin,
              `CDR "${cdr.id}": gap between range ending at ${prevMax} and range starting at ${currMin}`,
            ).toBeLessThanOrEqual(prevMax + 1)
          } else {
            expect(
              currMin,
              `CDR "${cdr.id}": gap between range ending at ${prevMax} and range starting at ${currMin}`,
            ).toBe(prevMax + 1)
          }
        }
      }
    })

    it('scoring ranges have no overlaps', () => {
      for (const cdr of batch17PsychBurnsNephroCdrs) {
        const ranges = [...cdr.scoring.ranges].sort((a, b) => a.min - b.min)
        for (let i = 1; i < ranges.length; i++) {
          // Algorithm CDRs may use shared boundaries (e.g., FENa: 0-1, 1-2, 2-100)
          if (cdr.scoring.method === 'algorithm') {
            expect(
              ranges[i].min,
              `CDR "${cdr.id}": overlap between ranges "${ranges[i - 1].risk}" and "${ranges[i].risk}"`,
            ).toBeGreaterThanOrEqual(ranges[i - 1].max)
          } else {
            expect(
              ranges[i].min,
              `CDR "${cdr.id}": overlap between ranges "${ranges[i - 1].risk}" and "${ranges[i].risk}"`,
            ).toBeGreaterThan(ranges[i - 1].max)
          }
        }
      }
    })

    it('scoring ranges cover the full achievable score range for sum-method CDRs', () => {
      for (const cdr of batch17PsychBurnsNephroCdrs) {
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
      for (const cdr of batch17PsychBurnsNephroCdrs) {
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
    it('MMSE has 11 components (7 select + 4 boolean) and sum scoring with max 30', () => {
      const mmse = batch17PsychBurnsNephroCdrs.find((c) => c.id === 'mmse')!
      expect(mmse.components).toHaveLength(11)
      expect(mmse.scoring.method).toBe('sum')
      const selects = mmse.components.filter((c) => c.type === 'select')
      const booleans = mmse.components.filter((c) => c.type === 'boolean')
      expect(selects).toHaveLength(7)
      expect(booleans).toHaveLength(4)
      // All booleans worth 1 point
      for (const b of booleans) {
        expect(b.value).toBe(1)
      }
      // Last range max should be 30
      const ranges = [...mmse.scoring.ranges].sort((a, b) => a.min - b.min)
      expect(ranges[ranges.length - 1].max).toBe(30)
    })

    it('SCORTEN has 7 boolean components each worth 1 point for SJS/TEN mortality', () => {
      const scorten = batch17PsychBurnsNephroCdrs.find((c) => c.id === 'scorten')!
      expect(scorten.components).toHaveLength(7)
      expect(scorten.category).toBe('BURNS & WOUND MANAGEMENT')
      expect(scorten.scoring.method).toBe('sum')
      for (const comp of scorten.components) {
        expect(comp.type).toBe('boolean')
        expect(comp.value).toBe(1)
      }
    })

    it('Baux Score has inhalation_injury boolean worth 17 points and uses algorithm scoring', () => {
      const baux = batch17PsychBurnsNephroCdrs.find((c) => c.id === 'baux_score')!
      expect(baux.scoring.method).toBe('algorithm')
      expect(baux.components).toHaveLength(3)
      const inhalation = baux.components.find((c) => c.id === 'inhalation_injury')!
      expect(inhalation.type).toBe('boolean')
      expect(inhalation.value).toBe(17)
    })

    it('ABSI has 5 components (3 select + 2 boolean) with sum scoring starting at min 2', () => {
      const absi = batch17PsychBurnsNephroCdrs.find((c) => c.id === 'absi')!
      expect(absi.components).toHaveLength(5)
      expect(absi.scoring.method).toBe('sum')
      const ranges = [...absi.scoring.ranges].sort((a, b) => a.min - b.min)
      // Min achievable is 2 (sex=0 + age=1 + inhalation=0 + full_thickness=0 + tbsa=1)
      expect(ranges[0].min).toBe(2)
    })

    it('Lund-Browder has 18 body region components and algorithm scoring', () => {
      const lb = batch17PsychBurnsNephroCdrs.find((c) => c.id === 'lund_browder')!
      expect(lb.components).toHaveLength(18)
      expect(lb.scoring.method).toBe('algorithm')
      expect(lb.category).toBe('BURNS & WOUND MANAGEMENT')
    })

    it('FENa has 4 number_range components and algorithm scoring', () => {
      const fena = batch17PsychBurnsNephroCdrs.find((c) => c.id === 'fena')!
      expect(fena.components).toHaveLength(4)
      expect(fena.scoring.method).toBe('algorithm')
      expect(fena.category).toBe('NEPHROLOGY & ELECTROLYTES')
      for (const comp of fena.components) {
        expect(comp.type).toBe('number_range')
      }
    })

    it('KDIGO AKI has 2 select components and algorithm scoring', () => {
      const kdigo = batch17PsychBurnsNephroCdrs.find((c) => c.id === 'kdigo_aki')!
      expect(kdigo.components).toHaveLength(2)
      expect(kdigo.scoring.method).toBe('algorithm')
      expect(kdigo.category).toBe('NEPHROLOGY & ELECTROLYTES')
    })

    it('covers 3 distinct categories', () => {
      const categories = new Set(batch17PsychBurnsNephroCdrs.map((c) => c.category))
      expect(categories.has('PSYCHIATRY & BEHAVIORAL HEALTH')).toBe(true)
      expect(categories.has('BURNS & WOUND MANAGEMENT')).toBe(true)
      expect(categories.has('NEPHROLOGY & ELECTROLYTES')).toBe(true)
    })
  })
})
