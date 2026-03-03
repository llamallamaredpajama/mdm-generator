import { describe, it, expect } from 'vitest'
import { batch15DispositionProcCdrs } from '../batch-15-disposition-proc'
import type { CdrSeed, CdrComponent } from '../types'

describe('Batch 15 — Disposition / Risk Stratification + Procedural / Airway CDRs', () => {
  it('exports exactly 7 CDR definitions', () => {
    // Quarantined: MELD (0 section1 components), Child-Pugh (only 2 section1),
    // ASA Classification (single-component ordinal scale, not decomposable)
    expect(batch15DispositionProcCdrs).toHaveLength(7)
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

    for (const cdr of batch15DispositionProcCdrs) {
      for (const key of requiredKeys) {
        expect(cdr, `CDR "${cdr.id}" missing required field "${key}"`).toHaveProperty(key)
      }
    }
  })

  it('all IDs are unique', () => {
    const ids = batch15DispositionProcCdrs.map((c) => c.id)
    const uniqueIds = new Set(ids)
    expect(uniqueIds.size).toBe(ids.length)
  })

  it('all IDs are snake_case', () => {
    const snakeCaseRegex = /^[a-z][a-z0-9]*(_[a-z0-9]+)*$/
    for (const cdr of batch15DispositionProcCdrs) {
      expect(
        snakeCaseRegex.test(cdr.id),
        `CDR ID "${cdr.id}" is not snake_case`,
      ).toBe(true)
    }
  })

  describe('component validation', () => {
    it('boolean components have a numeric "value" field', () => {
      for (const cdr of batch15DispositionProcCdrs) {
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
      for (const cdr of batch15DispositionProcCdrs) {
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
      for (const cdr of batch15DispositionProcCdrs) {
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
      for (const cdr of batch15DispositionProcCdrs) {
        for (const comp of cdr.components) {
          expect(
            validSources.includes(comp.source),
            `CDR "${cdr.id}", component "${comp.id}": invalid source "${comp.source}"`,
          ).toBe(true)
        }
      }
    })

    it('component IDs are unique within each CDR', () => {
      for (const cdr of batch15DispositionProcCdrs) {
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
      for (const cdr of batch15DispositionProcCdrs) {
        expect(
          validMethods.includes(cdr.scoring.method),
          `CDR "${cdr.id}": invalid scoring method "${cdr.scoring.method}"`,
        ).toBe(true)
      }
    })

    it('scoring ranges have no gaps between consecutive ranges', () => {
      for (const cdr of batch15DispositionProcCdrs) {
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
      for (const cdr of batch15DispositionProcCdrs) {
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
      for (const cdr of batch15DispositionProcCdrs) {
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
      for (const cdr of batch15DispositionProcCdrs) {
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
    it('MEWS has 5 select components each with 4 options (0–3) and max score 15', () => {
      const mews = batch15DispositionProcCdrs.find((c) => c.id === 'mews')!
      expect(mews.components).toHaveLength(5)
      expect(mews.category).toBe('DISPOSITION / RISK STRATIFICATION')
      for (const comp of mews.components) {
        expect(comp.type).toBe('select')
        expect(comp.options).toHaveLength(4)
      }
      const ranges = [...mews.scoring.ranges].sort((a, b) => a.min - b.min)
      expect(ranges[ranges.length - 1].max).toBe(15)
    })

    it('RTS has 3 select components each with 5 coded options (0–4) and max score 12', () => {
      const rts = batch15DispositionProcCdrs.find((c) => c.id === 'rts')!
      expect(rts.components).toHaveLength(3)
      expect(rts.scoring.method).toBe('sum')
      for (const comp of rts.components) {
        expect(comp.type).toBe('select')
        expect(comp.options).toHaveLength(5)
        const values = comp.options!.map((o) => o.value).sort((a, b) => a - b)
        expect(values).toEqual([0, 1, 2, 3, 4])
      }
      const ranges = [...rts.scoring.ranges].sort((a, b) => a.min - b.min)
      expect(ranges[ranges.length - 1].max).toBe(12)
    })

    it('ISS uses algorithm scoring with 3 AIS region selects', () => {
      const iss = batch15DispositionProcCdrs.find((c) => c.id === 'iss')!
      expect(iss.scoring.method).toBe('algorithm')
      expect(iss.components).toHaveLength(3)
      // First region starts at AIS 1, other two allow AIS 0
      const region1 = iss.components.find((c) => c.id === 'ais_region_1')!
      const minValue1 = Math.min(...region1.options!.map((o) => o.value))
      expect(minValue1).toBe(1)
      const region2 = iss.components.find((c) => c.id === 'ais_region_2')!
      const minValue2 = Math.min(...region2.options!.map((o) => o.value))
      expect(minValue2).toBe(0)
    })

    // Child-Pugh quarantined: only 2 section1 components (ascites, encephalopathy)

    it('MOANS has 5 boolean components each worth 1 and uses threshold scoring', () => {
      const moans = batch15DispositionProcCdrs.find((c) => c.id === 'moans')!
      expect(moans.components).toHaveLength(5)
      expect(moans.category).toBe('PROCEDURAL / AIRWAY')
      expect(moans.scoring.method).toBe('threshold')
      for (const comp of moans.components) {
        expect(comp.type).toBe('boolean')
        expect(comp.value).toBe(1)
      }
    })

    it('RODS has 4 boolean components each worth 1 and uses threshold scoring', () => {
      const rods = batch15DispositionProcCdrs.find((c) => c.id === 'rods')!
      expect(rods.components).toHaveLength(4)
      expect(rods.scoring.method).toBe('threshold')
      for (const comp of rods.components) {
        expect(comp.type).toBe('boolean')
        expect(comp.value).toBe(1)
      }
    })

    it('SHORT has 5 boolean components each worth 1 and uses threshold scoring', () => {
      const short = batch15DispositionProcCdrs.find((c) => c.id === 'short')!
      expect(short.components).toHaveLength(5)
      expect(short.scoring.method).toBe('threshold')
      for (const comp of short.components) {
        expect(comp.type).toBe('boolean')
        expect(comp.value).toBe(1)
      }
    })

    it('3-3-2 Rule has 3 boolean components and threshold at score 3 (all adequate)', () => {
      const rule = batch15DispositionProcCdrs.find((c) => c.id === 'three_three_two')!
      expect(rule.components).toHaveLength(3)
      expect(rule.scoring.method).toBe('threshold')
      const standardRange = rule.scoring.ranges.find((r) => r.risk === 'Standard')!
      expect(standardRange.min).toBe(3)
      expect(standardRange.max).toBe(3)
    })

    // ASA Classification quarantined: single-component ordinal scale, not decomposable

    // MELD quarantined: all 3 components are lab-based (section2)
  })
})
