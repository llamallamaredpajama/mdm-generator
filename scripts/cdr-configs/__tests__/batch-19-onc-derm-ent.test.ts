import { describe, it, expect } from 'vitest'
import { batch19OncDermEntCdrs } from '../batch-19-onc-derm-ent'
import type { CdrSeed, CdrComponent } from '../types'

describe('Batch 19 — Oncologic Emergency, Critical Care, Dermatology, ENT, Orthopedic CDRs', () => {
  it('exports exactly 10 CDR definitions', () => {
    expect(batch19OncDermEntCdrs).toHaveLength(10)
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

    for (const cdr of batch19OncDermEntCdrs) {
      for (const key of requiredKeys) {
        expect(cdr, `CDR "${cdr.id}" missing required field "${key}"`).toHaveProperty(key)
      }
    }
  })

  it('all IDs are unique', () => {
    const ids = batch19OncDermEntCdrs.map((c) => c.id)
    const uniqueIds = new Set(ids)
    expect(uniqueIds.size).toBe(ids.length)
  })

  it('all IDs are snake_case', () => {
    const snakeCaseRegex = /^[a-z][a-z0-9]*(_[a-z0-9]+)*$/
    for (const cdr of batch19OncDermEntCdrs) {
      expect(
        snakeCaseRegex.test(cdr.id),
        `CDR ID "${cdr.id}" is not snake_case`,
      ).toBe(true)
    }
  })

  describe('component validation', () => {
    it('boolean components have a numeric "value" field', () => {
      for (const cdr of batch19OncDermEntCdrs) {
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
      for (const cdr of batch19OncDermEntCdrs) {
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
      for (const cdr of batch19OncDermEntCdrs) {
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
      for (const cdr of batch19OncDermEntCdrs) {
        for (const comp of cdr.components) {
          expect(
            validSources.includes(comp.source),
            `CDR "${cdr.id}", component "${comp.id}": invalid source "${comp.source}"`,
          ).toBe(true)
        }
      }
    })

    it('component IDs are unique within each CDR', () => {
      for (const cdr of batch19OncDermEntCdrs) {
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
      for (const cdr of batch19OncDermEntCdrs) {
        expect(
          validMethods.includes(cdr.scoring.method),
          `CDR "${cdr.id}": invalid scoring method "${cdr.scoring.method}"`,
        ).toBe(true)
      }
    })

    it('scoring ranges have no gaps between consecutive ranges', () => {
      for (const cdr of batch19OncDermEntCdrs) {
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
      for (const cdr of batch19OncDermEntCdrs) {
        const ranges = [...cdr.scoring.ranges].sort((a, b) => a.min - b.min)
        for (let i = 1; i < ranges.length; i++) {
          // Algorithm CDRs may use shared boundaries for continuous scoring
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
      for (const cdr of batch19OncDermEntCdrs) {
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
      for (const cdr of batch19OncDermEntCdrs) {
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
    it('SINS Score has 6 select components and sum scoring with max 18', () => {
      const sins = batch19OncDermEntCdrs.find((c) => c.id === 'sins_score')!
      expect(sins.components).toHaveLength(6)
      expect(sins.scoring.method).toBe('sum')
      expect(sins.category).toBe('ONCOLOGIC EMERGENCY')
      for (const comp of sins.components) {
        expect(comp.type).toBe('select')
      }
      const ranges = [...sins.scoring.ranges].sort((a, b) => a.min - b.min)
      expect(ranges[ranges.length - 1].max).toBe(18)
    })

    it('ABCDE Melanoma has 5 boolean components each worth 1 point and threshold scoring', () => {
      const abcde = batch19OncDermEntCdrs.find((c) => c.id === 'abcde_melanoma')!
      expect(abcde.components).toHaveLength(5)
      expect(abcde.scoring.method).toBe('threshold')
      expect(abcde.category).toBe('DERMATOLOGY')
      const ids = abcde.components.map((c) => c.id)
      expect(ids).toContain('asymmetry')
      expect(ids).toContain('border')
      expect(ids).toContain('color')
      expect(ids).toContain('diameter')
      expect(ids).toContain('evolution')
      for (const comp of abcde.components) {
        expect(comp.type).toBe('boolean')
        expect(comp.value).toBe(1)
      }
    })

    it('Epworth Sleepiness Scale has 8 select components each with 4 options (0-3)', () => {
      const ess = batch19OncDermEntCdrs.find((c) => c.id === 'epworth_sleepiness')!
      expect(ess.components).toHaveLength(8)
      expect(ess.scoring.method).toBe('sum')
      expect(ess.category).toBe('ENT / OTOLARYNGOLOGY')
      for (const comp of ess.components) {
        expect(comp.type).toBe('select')
        expect(comp.options).toHaveLength(4)
        const values = comp.options!.map((o) => o.value)
        expect(Math.min(...values)).toBe(0)
        expect(Math.max(...values)).toBe(3)
      }
    })

    it('Beighton Score has 9 boolean components each worth 1 point', () => {
      const beighton = batch19OncDermEntCdrs.find((c) => c.id === 'beighton_score')!
      expect(beighton.components).toHaveLength(9)
      expect(beighton.scoring.method).toBe('sum')
      expect(beighton.category).toBe('ORTHOPEDIC & MUSCULOSKELETAL')
      for (const comp of beighton.components) {
        expect(comp.type).toBe('boolean')
        expect(comp.value).toBe(1)
      }
    })

    it('SAPS II has 15 select components for ICU mortality prediction', () => {
      const saps = batch19OncDermEntCdrs.find((c) => c.id === 'saps2')!
      expect(saps.components).toHaveLength(15)
      expect(saps.scoring.method).toBe('sum')
      expect(saps.category).toBe('CRITICAL CARE & ICU')
      for (const comp of saps.components) {
        expect(comp.type).toBe('select')
      }
    })

    it('Lund-Mackay has 12 select components (6 right + 6 left sinus regions)', () => {
      const lm = batch19OncDermEntCdrs.find((c) => c.id === 'lund_mackay')!
      expect(lm.components).toHaveLength(12)
      expect(lm.scoring.method).toBe('sum')
      expect(lm.category).toBe('ENT / OTOLARYNGOLOGY')
      const rightComps = lm.components.filter((c) => c.id.startsWith('r_'))
      const leftComps = lm.components.filter((c) => c.id.startsWith('l_'))
      expect(rightComps).toHaveLength(6)
      expect(leftComps).toHaveLength(6)
    })

    it('covers 5 distinct categories', () => {
      const categories = new Set(batch19OncDermEntCdrs.map((c) => c.category))
      expect(categories.has('ONCOLOGIC EMERGENCY')).toBe(true)
      expect(categories.has('CRITICAL CARE & ICU')).toBe(true)
      expect(categories.has('DERMATOLOGY')).toBe(true)
      expect(categories.has('ENT / OTOLARYNGOLOGY')).toBe(true)
      expect(categories.has('ORTHOPEDIC & MUSCULOSKELETAL')).toBe(true)
    })
  })
})
