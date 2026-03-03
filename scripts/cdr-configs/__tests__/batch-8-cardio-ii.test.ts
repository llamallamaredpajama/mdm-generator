import { describe, it, expect } from 'vitest'
import { batch8CardioIiCdrs } from '../batch-8-cardio-ii'
import type { CdrSeed, CdrComponent } from '../types'

describe('Batch 8 — Cardiovascular II CDRs', () => {
  it('exports exactly 8 CDR definitions', () => {
    expect(batch8CardioIiCdrs).toHaveLength(8)
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

    for (const cdr of batch8CardioIiCdrs) {
      for (const key of requiredKeys) {
        expect(cdr, `CDR "${cdr.id}" missing required field "${key}"`).toHaveProperty(key)
      }
    }
  })

  it('all IDs are unique', () => {
    const ids = batch8CardioIiCdrs.map((c) => c.id)
    const uniqueIds = new Set(ids)
    expect(uniqueIds.size).toBe(ids.length)
  })

  it('all IDs are snake_case', () => {
    const snakeCaseRegex = /^[a-z][a-z0-9]*(_[a-z0-9]+)*$/
    for (const cdr of batch8CardioIiCdrs) {
      expect(
        snakeCaseRegex.test(cdr.id),
        `CDR ID "${cdr.id}" is not snake_case`,
      ).toBe(true)
    }
  })

  describe('component validation', () => {
    it('boolean components have a numeric "value" field', () => {
      for (const cdr of batch8CardioIiCdrs) {
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
      for (const cdr of batch8CardioIiCdrs) {
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
      for (const cdr of batch8CardioIiCdrs) {
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
      for (const cdr of batch8CardioIiCdrs) {
        for (const comp of cdr.components) {
          expect(
            validSources.includes(comp.source),
            `CDR "${cdr.id}", component "${comp.id}": invalid source "${comp.source}"`,
          ).toBe(true)
        }
      }
    })

    it('component IDs are unique within each CDR', () => {
      for (const cdr of batch8CardioIiCdrs) {
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
      for (const cdr of batch8CardioIiCdrs) {
        expect(
          validMethods.includes(cdr.scoring.method),
          `CDR "${cdr.id}": invalid scoring method "${cdr.scoring.method}"`,
        ).toBe(true)
      }
    })

    it('scoring ranges have no gaps between consecutive ranges', () => {
      for (const cdr of batch8CardioIiCdrs) {
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
      for (const cdr of batch8CardioIiCdrs) {
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
      for (const cdr of batch8CardioIiCdrs) {
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
      for (const cdr of batch8CardioIiCdrs) {
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
    it('HESTIA has 11 boolean components each worth 1 point with threshold scoring', () => {
      const hestia = batch8CardioIiCdrs.find((c) => c.id === 'hestia')!
      expect(hestia.components).toHaveLength(11)
      for (const comp of hestia.components) {
        expect(comp.type).toBe('boolean')
        expect(comp.value).toBe(1)
      }
      expect(hestia.scoring.method).toBe('threshold')
      // Score 0 = safe for outpatient
      const safeRange = hestia.scoring.ranges.find((r) => r.risk === 'Safe for Outpatient')!
      expect(safeRange.min).toBe(0)
      expect(safeRange.max).toBe(0)
    })

    it('SFSR has 5 CHESS criteria as boolean components each worth 1 point', () => {
      const sfsr = batch8CardioIiCdrs.find((c) => c.id === 'sfsr')!
      expect(sfsr.components).toHaveLength(5)
      for (const comp of sfsr.components) {
        expect(comp.type).toBe('boolean')
        expect(comp.value).toBe(1)
      }
      expect(sfsr.scoring.method).toBe('threshold')
    })

    it('CSRS has negative-value components for vasovagal predisposition and diagnosis', () => {
      const csrs = batch8CardioIiCdrs.find((c) => c.id === 'csrs')!
      expect(csrs.scoring.method).toBe('sum')
      const vasovagalPred = csrs.components.find((c) => c.id === 'vasovagal_predisposition')!
      expect(vasovagalPred.value).toBe(-1)
      const vasovagalDx = csrs.components.find((c) => c.id === 'vasovagal_syncope_diagnosis')!
      expect(vasovagalDx.value).toBe(-2)
    })

    it('OESIL has 4 boolean components each worth 1 point', () => {
      const oesil = batch8CardioIiCdrs.find((c) => c.id === 'oesil')!
      expect(oesil.components).toHaveLength(4)
      for (const comp of oesil.components) {
        expect(comp.type).toBe('boolean')
        expect(comp.value).toBe(1)
      }
      expect(oesil.scoring.method).toBe('sum')
      // Score 4 = Very High (57.1% mortality)
      const veryHigh = oesil.scoring.ranges.find((r) => r.risk === 'Very High')!
      expect(veryHigh.min).toBe(4)
      expect(veryHigh.max).toBe(4)
    })

    it('ESC hs-Troponin is quarantined (only 2 user-answerable components)', () => {
      const esc = batch8CardioIiCdrs.find((c) => c.id === 'esc_hs_troponin')
      expect(esc).toBeUndefined()
    })

    it('FAINT Score is quarantined (only 2 user-answerable components)', () => {
      const faint = batch8CardioIiCdrs.find((c) => c.id === 'faint_score')
      expect(faint).toBeUndefined()
    })

    it('YEARS Algorithm has 3 boolean YEARS items plus a D-dimer select', () => {
      const years = batch8CardioIiCdrs.find((c) => c.id === 'years_algorithm')!
      expect(years.components).toHaveLength(4)
      expect(years.scoring.method).toBe('algorithm')
      const booleans = years.components.filter((c) => c.type === 'boolean')
      expect(booleans).toHaveLength(3)
      const ddimerSelect = years.components.find((c) => c.id === 'ddimer_level')!
      expect(ddimerSelect.type).toBe('select')
      expect(ddimerSelect.options).toHaveLength(3)
    })

    it('Ottawa AF Protocol has 7 boolean contraindication criteria', () => {
      const ottawa = batch8CardioIiCdrs.find((c) => c.id === 'ottawa_af_protocol')!
      expect(ottawa.components).toHaveLength(7)
      for (const comp of ottawa.components) {
        expect(comp.type).toBe('boolean')
        expect(comp.value).toBe(1)
      }
      expect(ottawa.scoring.method).toBe('threshold')
    })

    it('all CDRs have category CARDIOVASCULAR', () => {
      for (const cdr of batch8CardioIiCdrs) {
        expect(cdr.category).toBe('CARDIOVASCULAR')
      }
    })
  })
})
