import { describe, it, expect } from 'vitest'
import { batch13IdToxCdrs } from '../batch-13-id-tox'
import type { CdrSeed, CdrComponent } from '../types'

describe('Batch 13 — Infectious Disease, Toxicology & Pediatric CDRs', () => {
  it('exports exactly 6 CDR definitions', () => {
    expect(batch13IdToxCdrs).toHaveLength(6)
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

    for (const cdr of batch13IdToxCdrs) {
      for (const key of requiredKeys) {
        expect(cdr, `CDR "${cdr.id}" missing required field "${key}"`).toHaveProperty(key)
      }
    }
  })

  it('all IDs are unique', () => {
    const ids = batch13IdToxCdrs.map((c) => c.id)
    const uniqueIds = new Set(ids)
    expect(uniqueIds.size).toBe(ids.length)
  })

  it('all IDs are snake_case', () => {
    const snakeCaseRegex = /^[a-z][a-z0-9]*(_[a-z0-9]+)*$/
    for (const cdr of batch13IdToxCdrs) {
      expect(
        snakeCaseRegex.test(cdr.id),
        `CDR ID "${cdr.id}" is not snake_case`,
      ).toBe(true)
    }
  })

  it('every CDR has >= 3 user-answerable interactive components', () => {
    for (const cdr of batch13IdToxCdrs) {
      const userAnswerable = cdr.components.filter(
        (c) =>
          (c.type === 'boolean' || c.type === 'select') &&
          (c.source === 'section1' || c.source === 'user_input'),
      )
      expect(
        userAnswerable.length,
        `CDR "${cdr.id}" has only ${userAnswerable.length} user-answerable components (need >= 3)`,
      ).toBeGreaterThanOrEqual(3)
    }
  })

  describe('component validation', () => {
    it('boolean components have a numeric "value" field', () => {
      for (const cdr of batch13IdToxCdrs) {
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
      for (const cdr of batch13IdToxCdrs) {
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
      for (const cdr of batch13IdToxCdrs) {
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
      for (const cdr of batch13IdToxCdrs) {
        for (const comp of cdr.components) {
          expect(
            validSources.includes(comp.source),
            `CDR "${cdr.id}", component "${comp.id}": invalid source "${comp.source}"`,
          ).toBe(true)
        }
      }
    })

    it('component IDs are unique within each CDR', () => {
      for (const cdr of batch13IdToxCdrs) {
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
      for (const cdr of batch13IdToxCdrs) {
        expect(
          validMethods.includes(cdr.scoring.method),
          `CDR "${cdr.id}": invalid scoring method "${cdr.scoring.method}"`,
        ).toBe(true)
      }
    })

    it('scoring ranges have no gaps between consecutive ranges for sum-method CDRs', () => {
      for (const cdr of batch13IdToxCdrs) {
        if (cdr.scoring.method !== 'sum') continue
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
      for (const cdr of batch13IdToxCdrs) {
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
      for (const cdr of batch13IdToxCdrs) {
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
      for (const cdr of batch13IdToxCdrs) {
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
    it('FeverPAIN has 5 boolean components each worth 1 point', () => {
      const feverpain = batch13IdToxCdrs.find((c) => c.id === 'feverpain')!
      expect(feverpain.components).toHaveLength(5)
      for (const comp of feverpain.components) {
        expect(comp.type).toBe('boolean')
        expect(comp.value).toBe(1)
      }
      expect(feverpain.scoring.method).toBe('sum')
      expect(feverpain.category).toBe('INFECTIOUS DISEASE')
    })

    it("King's College Criteria has 10 components with algorithm scoring", () => {
      const kings = batch13IdToxCdrs.find((c) => c.id === 'kings_college_criteria')!
      expect(kings.components).toHaveLength(10)
      expect(kings.scoring.method).toBe('algorithm')
      expect(kings.category).toBe('TOXICOLOGY')
      // Has etiology select with acetaminophen vs non-acetaminophen
      const etiology = kings.components.find((c) => c.id === 'etiology')!
      expect(etiology.type).toBe('select')
      expect(etiology.source).toBe('user_input')
    })

    it('PAWSS has 10 boolean components with threshold scoring at 4', () => {
      const pawss = batch13IdToxCdrs.find((c) => c.id === 'pawss')!
      expect(pawss.components).toHaveLength(10)
      for (const comp of pawss.components) {
        expect(comp.type).toBe('boolean')
        expect(comp.value).toBe(1)
      }
      expect(pawss.scoring.method).toBe('threshold')
      expect(pawss.category).toBe('TOXICOLOGY')
      // High risk threshold starts at 4
      const highRange = pawss.scoring.ranges.find((r) => r.risk === 'High')!
      expect(highRange.min).toBe(4)
    })

    it('Naranjo ADR Scale has 10 select components with negative option values', () => {
      const naranjo = batch13IdToxCdrs.find((c) => c.id === 'naranjo_adr')!
      expect(naranjo.components).toHaveLength(10)
      for (const comp of naranjo.components) {
        expect(comp.type).toBe('select')
      }
      expect(naranjo.scoring.method).toBe('sum')
      expect(naranjo.category).toBe('TOXICOLOGY')
      // Some options have negative values (e.g., -1 for certain answers)
      const allValues = naranjo.components.flatMap((c) => c.options?.map((o) => o.value) ?? [])
      expect(allValues.some((v) => v < 0)).toBe(true)
      // Score range starts at -4
      const ranges = [...naranjo.scoring.ranges].sort((a, b) => a.min - b.min)
      expect(ranges[0].min).toBe(-4)
    })

    it('Poisoning Severity Score has 5 select components (4 organ systems + overall grade) with algorithm scoring', () => {
      const pss = batch13IdToxCdrs.find((c) => c.id === 'poisoning_severity_score')!
      expect(pss.components).toHaveLength(5)
      for (const comp of pss.components) {
        expect(comp.type).toBe('select')
      }
      expect(pss.scoring.method).toBe('algorithm')
      expect(pss.category).toBe('TOXICOLOGY')
      // 4 organ system components (section1) + 1 overall grade (user_input)
      const section1 = pss.components.filter((c) => c.source === 'section1')
      const userInput = pss.components.filter((c) => c.source === 'user_input')
      expect(section1).toHaveLength(4)
      expect(userInput).toHaveLength(1)
      // Overall grade has 5 options (grades 0-4)
      const overall = pss.components.find((c) => c.id === 'overall_severity')!
      expect(overall.options).toHaveLength(5)
      const values = overall.options!.map((o) => o.value)
      expect(Math.min(...values)).toBe(0)
      expect(Math.max(...values)).toBe(4)
    })

    it('TEN-4-FACESp has 10 boolean components with threshold scoring', () => {
      const ten4 = batch13IdToxCdrs.find((c) => c.id === 'ten_4_faces_p')!
      expect(ten4.components).toHaveLength(10)
      for (const comp of ten4.components) {
        expect(comp.type).toBe('boolean')
        expect(comp.value).toBe(1)
      }
      expect(ten4.scoring.method).toBe('threshold')
      expect(ten4.category).toBe('PEDIATRIC')
    })
  })
})
