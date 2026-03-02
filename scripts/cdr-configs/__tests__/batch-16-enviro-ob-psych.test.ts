import { describe, it, expect } from 'vitest'
import { batch16EnviroObPsychCdrs } from '../batch-16-enviro-ob-psych'
import type { CdrSeed, CdrComponent } from '../types'

describe('Batch 16 — Environmental + OB/GYN + Psychiatry CDRs', () => {
  it('exports exactly 10 CDR definitions', () => {
    expect(batch16EnviroObPsychCdrs).toHaveLength(10)
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

    for (const cdr of batch16EnviroObPsychCdrs) {
      for (const key of requiredKeys) {
        expect(cdr, `CDR "${cdr.id}" missing required field "${key}"`).toHaveProperty(key)
      }
    }
  })

  it('all IDs are unique', () => {
    const ids = batch16EnviroObPsychCdrs.map((c) => c.id)
    const uniqueIds = new Set(ids)
    expect(uniqueIds.size).toBe(ids.length)
  })

  it('all IDs are snake_case', () => {
    const snakeCaseRegex = /^[a-z][a-z0-9]*(_[a-z0-9]+)*$/
    for (const cdr of batch16EnviroObPsychCdrs) {
      expect(
        snakeCaseRegex.test(cdr.id),
        `CDR ID "${cdr.id}" is not snake_case`,
      ).toBe(true)
    }
  })

  describe('component validation', () => {
    it('boolean components have a numeric "value" field', () => {
      for (const cdr of batch16EnviroObPsychCdrs) {
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
      for (const cdr of batch16EnviroObPsychCdrs) {
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
      for (const cdr of batch16EnviroObPsychCdrs) {
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
      for (const cdr of batch16EnviroObPsychCdrs) {
        for (const comp of cdr.components) {
          expect(
            validSources.includes(comp.source),
            `CDR "${cdr.id}", component "${comp.id}": invalid source "${comp.source}"`,
          ).toBe(true)
        }
      }
    })

    it('component IDs are unique within each CDR', () => {
      for (const cdr of batch16EnviroObPsychCdrs) {
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
      for (const cdr of batch16EnviroObPsychCdrs) {
        expect(
          validMethods.includes(cdr.scoring.method),
          `CDR "${cdr.id}": invalid scoring method "${cdr.scoring.method}"`,
        ).toBe(true)
      }
    })

    it('scoring ranges have no gaps between consecutive ranges', () => {
      for (const cdr of batch16EnviroObPsychCdrs) {
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
      for (const cdr of batch16EnviroObPsychCdrs) {
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
      for (const cdr of batch16EnviroObPsychCdrs) {
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
      for (const cdr of batch16EnviroObPsychCdrs) {
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
    it('Swiss Staging has 1 select component with 5 hypothermia stages (HT I–V)', () => {
      const swiss = batch16EnviroObPsychCdrs.find((c) => c.id === 'swiss_staging_hypothermia')!
      expect(swiss.category).toBe('ENVIRONMENTAL')
      expect(swiss.components).toHaveLength(1)
      expect(swiss.scoring.method).toBe('algorithm')
      const stage = swiss.components[0]
      expect(stage.type).toBe('select')
      expect(stage.options).toHaveLength(5)
      const values = stage.options!.map((o) => o.value).sort((a, b) => a - b)
      expect(values).toEqual([1, 2, 3, 4, 5])
    })

    it('Bouchama Criteria uses threshold scoring with 3 core boolean criteria worth 1 point each', () => {
      const bouchama = batch16EnviroObPsychCdrs.find((c) => c.id === 'bouchama_heat_stroke')!
      expect(bouchama.scoring.method).toBe('threshold')
      expect(bouchama.category).toBe('ENVIRONMENTAL')
      expect(bouchama.components).toHaveLength(5)
      // 3 core booleans worth 1 point each (core_temp, cns_dysfunction, exposure_history)
      const coreBooleans = bouchama.components.filter(
        (c) => c.type === 'boolean' && c.value === 1,
      )
      expect(coreBooleans).toHaveLength(3)
      // Anhidrosis is boolean with value 0 (informational, not scored)
      const anhidrosis = bouchama.components.find((c) => c.id === 'anhidrosis')!
      expect(anhidrosis.value).toBe(0)
      // Heat stroke threshold at 3 (all 3 required)
      const heatStrokeRange = bouchama.scoring.ranges.find((r) => r.risk === 'Heat Stroke')!
      expect(heatStrokeRange.min).toBe(3)
      expect(heatStrokeRange.max).toBe(3)
    })

    it('HELLP Mississippi Classification uses algorithm scoring with OB/GYN category', () => {
      const hellp = batch16EnviroObPsychCdrs.find((c) => c.id === 'hellp_mississippi')!
      expect(hellp.category).toBe('OB/GYN & OBSTETRIC EMERGENCY')
      expect(hellp.scoring.method).toBe('algorithm')
      expect(hellp.components).toHaveLength(4)
      const compIds = hellp.components.map((c) => c.id)
      expect(compIds).toContain('platelet_count')
      expect(compIds).toContain('ast_level')
      expect(compIds).toContain('ldh_level')
    })

    it('PHQ-2 has 2 select components each with 4 options (0–3) and max score 6', () => {
      const phq2 = batch16EnviroObPsychCdrs.find((c) => c.id === 'phq2')!
      expect(phq2.components).toHaveLength(2)
      expect(phq2.category).toBe('PSYCHIATRY & BEHAVIORAL HEALTH')
      expect(phq2.scoring.method).toBe('sum')
      for (const comp of phq2.components) {
        expect(comp.type).toBe('select')
        expect(comp.options).toHaveLength(4)
        const values = comp.options!.map((o) => o.value).sort((a, b) => a - b)
        expect(values).toEqual([0, 1, 2, 3])
      }
      const ranges = [...phq2.scoring.ranges].sort((a, b) => a.min - b.min)
      expect(ranges[ranges.length - 1].max).toBe(6)
    })

    it('GAD-7 has 7 select components each with 4 options (0–3) and max score 21', () => {
      const gad7 = batch16EnviroObPsychCdrs.find((c) => c.id === 'gad7')!
      expect(gad7.components).toHaveLength(7)
      expect(gad7.scoring.method).toBe('sum')
      for (const comp of gad7.components) {
        expect(comp.type).toBe('select')
        expect(comp.options).toHaveLength(4)
      }
      const ranges = [...gad7.scoring.ranges].sort((a, b) => a.min - b.min)
      expect(ranges[ranges.length - 1].max).toBe(21)
    })

    it('AUDIT has 10 select components covering consumption, dependence, and harm domains', () => {
      const audit = batch16EnviroObPsychCdrs.find((c) => c.id === 'audit')!
      expect(audit.components).toHaveLength(10)
      expect(audit.scoring.method).toBe('sum')
      // Max score 40
      const ranges = [...audit.scoring.ranges].sort((a, b) => a.min - b.min)
      expect(ranges[ranges.length - 1].max).toBe(40)
      // Q9 and Q10 have non-standard scoring (0, 2, 4 instead of 0-4)
      const q9 = audit.components.find((c) => c.id === 'alcohol_related_injury')!
      const q9Values = q9.options!.map((o) => o.value).sort((a, b) => a - b)
      expect(q9Values).toEqual([0, 2, 4])
    })

    it('RASS has 1 select component with scores from -5 to +4 and algorithm scoring', () => {
      const rass = batch16EnviroObPsychCdrs.find((c) => c.id === 'rass')!
      expect(rass.components).toHaveLength(1)
      expect(rass.scoring.method).toBe('algorithm')
      const level = rass.components[0]
      expect(level.type).toBe('select')
      expect(level.options).toHaveLength(10)
      const values = level.options!.map((o) => o.value).sort((a, b) => a - b)
      expect(values[0]).toBe(-5)
      expect(values[values.length - 1]).toBe(4)
    })

    it('DAST-10 has 10 boolean components each worth 1 point', () => {
      const dast = batch16EnviroObPsychCdrs.find((c) => c.id === 'dast10')!
      expect(dast.components).toHaveLength(10)
      expect(dast.scoring.method).toBe('sum')
      for (const comp of dast.components) {
        expect(comp.type).toBe('boolean')
        expect(comp.value).toBe(1)
      }
      const ranges = [...dast.scoring.ranges].sort((a, b) => a.min - b.min)
      expect(ranges[ranges.length - 1].max).toBe(10)
    })

    it('SAD PERSONS has 10 boolean components each worth 1 point with 4 risk tiers', () => {
      const sad = batch16EnviroObPsychCdrs.find((c) => c.id === 'sad_persons')!
      expect(sad.components).toHaveLength(10)
      expect(sad.scoring.method).toBe('sum')
      for (const comp of sad.components) {
        expect(comp.type).toBe('boolean')
        expect(comp.value).toBe(1)
      }
      expect(sad.scoring.ranges).toHaveLength(4)
      const ranges = [...sad.scoring.ranges].sort((a, b) => a.min - b.min)
      expect(ranges[ranges.length - 1].max).toBe(10)
    })

    it('Kleihauer-Betke uses algorithm scoring with number_range and select components', () => {
      const kb = batch16EnviroObPsychCdrs.find((c) => c.id === 'kleihauer_betke')!
      expect(kb.category).toBe('OB/GYN & OBSTETRIC EMERGENCY')
      expect(kb.scoring.method).toBe('algorithm')
      expect(kb.components).toHaveLength(3)
      const numberRanges = kb.components.filter((c) => c.type === 'number_range')
      expect(numberRanges).toHaveLength(1) // fetal_cell_percentage
    })
  })
})
