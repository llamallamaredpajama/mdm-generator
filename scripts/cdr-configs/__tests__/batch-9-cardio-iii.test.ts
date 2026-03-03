import { describe, it, expect } from 'vitest'
import { batch9CardioIiiCdrs } from '../batch-9-cardio-iii'
import type { CdrSeed, CdrComponent } from '../types'

describe('Batch 9 — Cardiovascular III + Pulmonary CDRs', () => {
  it('exports exactly 9 CDR definitions', () => {
    expect(batch9CardioIiiCdrs).toHaveLength(9)
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

    for (const cdr of batch9CardioIiiCdrs) {
      for (const key of requiredKeys) {
        expect(cdr, `CDR "${cdr.id}" missing required field "${key}"`).toHaveProperty(key)
      }
    }
  })

  it('all IDs are unique', () => {
    const ids = batch9CardioIiiCdrs.map((c) => c.id)
    const uniqueIds = new Set(ids)
    expect(uniqueIds.size).toBe(ids.length)
  })

  it('all IDs are snake_case', () => {
    const snakeCaseRegex = /^[a-z][a-z0-9]*(_[a-z0-9]+)*$/
    for (const cdr of batch9CardioIiiCdrs) {
      expect(
        snakeCaseRegex.test(cdr.id),
        `CDR ID "${cdr.id}" is not snake_case`,
      ).toBe(true)
    }
  })

  describe('component validation', () => {
    it('boolean components have a numeric "value" field', () => {
      for (const cdr of batch9CardioIiiCdrs) {
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
      for (const cdr of batch9CardioIiiCdrs) {
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
      for (const cdr of batch9CardioIiiCdrs) {
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
      for (const cdr of batch9CardioIiiCdrs) {
        for (const comp of cdr.components) {
          expect(
            validSources.includes(comp.source),
            `CDR "${cdr.id}", component "${comp.id}": invalid source "${comp.source}"`,
          ).toBe(true)
        }
      }
    })

    it('component IDs are unique within each CDR', () => {
      for (const cdr of batch9CardioIiiCdrs) {
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
      for (const cdr of batch9CardioIiiCdrs) {
        expect(
          validMethods.includes(cdr.scoring.method),
          `CDR "${cdr.id}": invalid scoring method "${cdr.scoring.method}"`,
        ).toBe(true)
      }
    })

    it('scoring ranges have no gaps between consecutive ranges', () => {
      for (const cdr of batch9CardioIiiCdrs) {
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
      for (const cdr of batch9CardioIiiCdrs) {
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
      for (const cdr of batch9CardioIiiCdrs) {
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
      for (const cdr of batch9CardioIiiCdrs) {
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
    it('OHFRS has 10 boolean components with varying weights (1 or 2 points)', () => {
      const ohfrs = batch9CardioIiiCdrs.find((c) => c.id === 'ohfrs')!
      expect(ohfrs.components).toHaveLength(10)
      for (const comp of ohfrs.components) {
        expect(comp.type).toBe('boolean')
      }
      expect(ohfrs.scoring.method).toBe('sum')
      // Some components are worth 2 points (e.g., oxygen_saturation, hr_gt_110, troponin_elevated, ecg_acute_ischemia)
      const twoPointers = ohfrs.components.filter((c) => c.value === 2)
      expect(twoPointers.length).toBeGreaterThanOrEqual(4)
    })

    it('Modified Duke has 3 major criteria (2 pts each) and 5 minor criteria (1 pt each)', () => {
      const duke = batch9CardioIiiCdrs.find((c) => c.id === 'modified_duke')!
      expect(duke.components).toHaveLength(8)
      expect(duke.scoring.method).toBe('algorithm')
      const majors = duke.components.filter((c) => c.id.startsWith('major_'))
      expect(majors).toHaveLength(3)
      for (const m of majors) {
        expect(m.value).toBe(2)
      }
      const minors = duke.components.filter((c) => c.id.startsWith('minor_'))
      expect(minors).toHaveLength(5)
      for (const m of minors) {
        expect(m.value).toBe(1)
      }
    })

    it('CRUSADE has 8 components with mix of selects and booleans and high max score', () => {
      const crusade = batch9CardioIiiCdrs.find((c) => c.id === 'crusade')!
      expect(crusade.components).toHaveLength(8)
      expect(crusade.scoring.method).toBe('sum')
      const selects = crusade.components.filter((c) => c.type === 'select')
      expect(selects.length).toBe(5) // hematocrit, creatinine_clearance, heart_rate, sex, systolic_bp
      // creatinine_clearance max option is 35 points
      const crcl = crusade.components.find((c) => c.id === 'creatinine_clearance')!
      const maxCrclValue = Math.max(...(crcl.options?.map((o) => o.value) ?? []))
      expect(maxCrclValue).toBe(35)
    })

    it('Framingham HF uses threshold scoring with major (2pt) and minor (1pt) criteria', () => {
      const framingham = batch9CardioIiiCdrs.find((c) => c.id === 'framingham_hf')!
      expect(framingham.scoring.method).toBe('threshold')
      const majors = framingham.components.filter((c) => c.id.startsWith('major_'))
      expect(majors).toHaveLength(8)
      for (const m of majors) {
        expect(m.value).toBe(2)
      }
      const minors = framingham.components.filter((c) => c.id.startsWith('minor_'))
      expect(minors).toHaveLength(6)
      for (const m of minors) {
        expect(m.value).toBe(1)
      }
    })

    it('DASI has 12 boolean components with fractional metabolic weights', () => {
      const dasi = batch9CardioIiiCdrs.find((c) => c.id === 'dasi')!
      expect(dasi.components).toHaveLength(12)
      expect(dasi.scoring.method).toBe('sum')
      for (const comp of dasi.components) {
        expect(comp.type).toBe('boolean')
        expect(comp.value).toBeGreaterThan(0) // all positive weights
      }
      // self_care is 2.75
      const selfCare = dasi.components.find((c) => c.id === 'self_care')!
      expect(selfCare.value).toBe(2.75)
      // run_short_distance is 8.0
      const run = dasi.components.find((c) => c.id === 'run_short_distance')!
      expect(run.value).toBe(8.0)
    })

    it('CRB-65 has 4 boolean components each worth 1 point (PULMONARY category)', () => {
      const crb65 = batch9CardioIiiCdrs.find((c) => c.id === 'crb_65')!
      expect(crb65.components).toHaveLength(4)
      expect(crb65.category).toBe('PULMONARY')
      for (const comp of crb65.components) {
        expect(comp.type).toBe('boolean')
        expect(comp.value).toBe(1)
      }
    })

    // DECAF quarantined — only 1/5 components user-answerable (section2 lab/imaging)

    it('PASS has 3 select components scored 1-3 each (min 3, max 9)', () => {
      const pass = batch9CardioIiiCdrs.find((c) => c.id === 'pass_asthma')!
      expect(pass.components).toHaveLength(3)
      expect(pass.scoring.method).toBe('sum')
      expect(pass.category).toBe('PULMONARY')
      for (const comp of pass.components) {
        expect(comp.type).toBe('select')
        const values = comp.options?.map((o) => o.value) ?? []
        expect(Math.min(...values)).toBe(1)
        expect(Math.max(...values)).toBe(3)
      }
      // Scoring starts at 3, not 0
      const ranges = [...pass.scoring.ranges].sort((a, b) => a.min - b.min)
      expect(ranges[0].min).toBe(3)
      expect(ranges[ranges.length - 1].max).toBe(9)
    })

    it('batch contains mixed categories: CARDIOVASCULAR and PULMONARY', () => {
      const categories = new Set(batch9CardioIiiCdrs.map((c) => c.category))
      expect(categories.has('CARDIOVASCULAR')).toBe(true)
      expect(categories.has('PULMONARY')).toBe(true)
    })
  })
})
