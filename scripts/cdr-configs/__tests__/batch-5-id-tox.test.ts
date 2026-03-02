import { describe, it, expect } from 'vitest'
import { batch5IdToxCdrs } from '../batch-5-id-tox'
import type { CdrSeed } from '../types'

describe('Batch 5 — Infectious Disease & Toxicology CDRs', () => {
  it('exports exactly 10 CDR definitions', () => {
    expect(batch5IdToxCdrs).toHaveLength(10)
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

    for (const cdr of batch5IdToxCdrs) {
      for (const key of requiredKeys) {
        expect(cdr, `CDR "${cdr.id}" missing required field "${key}"`).toHaveProperty(key)
      }
    }
  })

  it('all IDs are unique', () => {
    const ids = batch5IdToxCdrs.map((c) => c.id)
    const uniqueIds = new Set(ids)
    expect(uniqueIds.size).toBe(ids.length)
  })

  it('all IDs are snake_case', () => {
    const snakeCaseRegex = /^[a-z][a-z0-9]*(_[a-z0-9]+)*$/
    for (const cdr of batch5IdToxCdrs) {
      expect(
        snakeCaseRegex.test(cdr.id),
        `CDR ID "${cdr.id}" is not snake_case`,
      ).toBe(true)
    }
  })

  describe('component validation', () => {
    it('boolean components have a numeric "value" field', () => {
      for (const cdr of batch5IdToxCdrs) {
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
      for (const cdr of batch5IdToxCdrs) {
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
      for (const cdr of batch5IdToxCdrs) {
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

    it('select option values are monotonically ordered (ascending or descending)', () => {
      for (const cdr of batch5IdToxCdrs) {
        const selects = cdr.components.filter((c) => c.type === 'select')
        for (const comp of selects) {
          const values = (comp.options ?? []).map((o) => o.value)
          if (values.length <= 1) continue
          const ascending = values.every((v, i) => i === 0 || v >= values[i - 1])
          const descending = values.every((v, i) => i === 0 || v <= values[i - 1])
          const allEqual = values.every((v) => v === values[0])
          expect(
            ascending || descending || allEqual,
            `CDR "${cdr.id}", component "${comp.id}": option values are not monotonically ordered: [${values.join(', ')}]`,
          ).toBe(true)
        }
      }
    })

    it('every component has a valid source', () => {
      const validSources = ['section1', 'section2', 'user_input']
      for (const cdr of batch5IdToxCdrs) {
        for (const comp of cdr.components) {
          expect(
            validSources.includes(comp.source),
            `CDR "${cdr.id}", component "${comp.id}": invalid source "${comp.source}"`,
          ).toBe(true)
        }
      }
    })

    it('component IDs are unique within each CDR', () => {
      for (const cdr of batch5IdToxCdrs) {
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
      for (const cdr of batch5IdToxCdrs) {
        expect(
          validMethods.includes(cdr.scoring.method),
          `CDR "${cdr.id}": invalid scoring method "${cdr.scoring.method}"`,
        ).toBe(true)
      }
    })

    it('scoring ranges have no gaps between consecutive ranges', () => {
      for (const cdr of batch5IdToxCdrs) {
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
      for (const cdr of batch5IdToxCdrs) {
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
      for (const cdr of batch5IdToxCdrs) {
        if (cdr.scoring.method !== 'sum') continue

        // Calculate min and max achievable scores
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
      for (const cdr of batch5IdToxCdrs) {
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
    it('SOFA has 6 select components each scored 0–4', () => {
      const sofa = batch5IdToxCdrs.find((c) => c.id === 'sofa')!
      expect(sofa.components).toHaveLength(6)
      for (const comp of sofa.components) {
        expect(comp.type).toBe('select')
        const values = comp.options!.map((o) => o.value)
        expect(Math.min(...values)).toBe(0)
        expect(Math.max(...values)).toBe(4)
      }
      expect(sofa.scoring.method).toBe('sum')
    })

    it('SIRS has 4 boolean components each worth 1 point with threshold scoring', () => {
      const sirs = batch5IdToxCdrs.find((c) => c.id === 'sirs')!
      expect(sirs.components).toHaveLength(4)
      for (const comp of sirs.components) {
        expect(comp.type).toBe('boolean')
        expect(comp.value).toBe(1)
      }
      expect(sirs.scoring.method).toBe('threshold')
      // >=2 criteria = SIRS
      const highRange = sirs.scoring.ranges.find((r) => r.risk === 'High')!
      expect(highRange.min).toBe(2)
    })

    it('MASCC max achievable score is 26 (matching range upper bound)', () => {
      const mascc = batch5IdToxCdrs.find((c) => c.id === 'mascc')!
      let maxScore = 0
      for (const comp of mascc.components) {
        if (comp.type === 'boolean') {
          maxScore += comp.value ?? 0
        } else if (comp.type === 'select' && comp.options) {
          maxScore += Math.max(...comp.options.map((o) => o.value))
        }
      }
      expect(maxScore).toBe(26)
      const ranges = [...mascc.scoring.ranges].sort((a, b) => a.min - b.min)
      expect(ranges[ranges.length - 1].max).toBe(26)
    })

    it('LRINEC max score is 13 (CRP 4 + WBC 2 + Hgb 2 + Na 2 + Cr 2 + Glc 1)', () => {
      const lrinec = batch5IdToxCdrs.find((c) => c.id === 'lrinec')!
      expect(lrinec.components).toHaveLength(6)
      let maxScore = 0
      for (const comp of lrinec.components) {
        if (comp.options) {
          maxScore += Math.max(...comp.options.map((o) => o.value))
        }
      }
      expect(maxScore).toBe(13)
      expect(lrinec.scoring.method).toBe('sum')
    })

    it('CIWA-Ar has 10 components: 9 scored 0–7 and 1 scored 0–4', () => {
      const ciwa = batch5IdToxCdrs.find((c) => c.id === 'ciwa_ar')!
      expect(ciwa.components).toHaveLength(10)
      const maxes = ciwa.components.map((c) => Math.max(...(c.options?.map((o) => o.value) ?? [0])))
      // 9 components with max 7, 1 component (clouding_sensorium) with max 4
      expect(maxes.filter((m) => m === 7)).toHaveLength(9)
      expect(maxes.filter((m) => m === 4)).toHaveLength(1)
      // Total max = 9*7 + 4 = 67
      expect(maxes.reduce((sum, v) => sum + v, 0)).toBe(67)
    })

    it('Rumack-Matthew uses algorithm scoring method', () => {
      const rumack = batch5IdToxCdrs.find((c) => c.id === 'rumack_matthew')!
      expect(rumack.scoring.method).toBe('algorithm')
      expect(rumack.components).toHaveLength(3)
      // Has a boolean for risk factors
      const riskFactors = rumack.components.find((c) => c.id === 'risk_factors')!
      expect(riskFactors.type).toBe('boolean')
      expect(riskFactors.value).toBe(1)
    })

    it('BWPS temperature component includes normal option with value 0', () => {
      const bwps = batch5IdToxCdrs.find((c) => c.id === 'bwps')!
      const temp = bwps.components.find((c) => c.id === 'temperature')!
      expect(temp.type).toBe('select')
      const values = temp.options!.map((o) => o.value)
      expect(values).toContain(0)
      // Max temperature score = 30
      expect(Math.max(...values)).toBe(30)
    })

    it('ADA DKA Severity uses algorithm scoring with 3 severity levels', () => {
      const dka = batch5IdToxCdrs.find((c) => c.id === 'ada_dka_severity')!
      expect(dka.scoring.method).toBe('algorithm')
      expect(dka.scoring.ranges).toHaveLength(3)
      const risks = dka.scoring.ranges.map((r) => r.risk)
      expect(risks).toContain('Low')
      expect(risks).toContain('Moderate')
      expect(risks).toContain('High')
    })

    it('4Ts Score has 4 select components each scored 0–2', () => {
      const fourTs = batch5IdToxCdrs.find((c) => c.id === 'four_ts')!
      expect(fourTs.components).toHaveLength(4)
      for (const comp of fourTs.components) {
        expect(comp.type).toBe('select')
        const values = comp.options!.map((o) => o.value)
        expect(Math.min(...values)).toBe(0)
        expect(Math.max(...values)).toBe(2)
      }
      expect(fourTs.scoring.method).toBe('sum')
      // Max score = 8
      const ranges = [...fourTs.scoring.ranges].sort((a, b) => a.min - b.min)
      expect(ranges[ranges.length - 1].max).toBe(8)
    })

    it('Anion Gap uses algorithm scoring with 4 severity levels', () => {
      const ag = batch5IdToxCdrs.find((c) => c.id === 'anion_gap')!
      expect(ag.scoring.method).toBe('algorithm')
      expect(ag.scoring.ranges).toHaveLength(4)
    })

    it('batch spans correct categories', () => {
      const categories = new Set(batch5IdToxCdrs.map((c) => c.category))
      expect(categories.has('INFECTIOUS DISEASE')).toBe(true)
      expect(categories.has('TOXICOLOGY')).toBe(true)
      expect(categories.has('ENDOCRINE')).toBe(true)
      expect(categories.has('HEMATOLOGY / COAGULATION')).toBe(true)
      expect(categories.has('NEPHROLOGY & ELECTROLYTES')).toBe(true)
    })
  })
})
