import { describe, it, expect } from 'vitest'
import { batch20OrthoGeriPallCdrs } from '../batch-20-ortho-geri-pall'
import type { CdrSeed, CdrComponent } from '../types'

describe('Batch 20 — Rheumatology, Geriatrics & Palliative CDRs', () => {
  it('exports exactly 7 CDR definitions', () => {
    expect(batch20OrthoGeriPallCdrs).toHaveLength(7)
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

    for (const cdr of batch20OrthoGeriPallCdrs) {
      for (const key of requiredKeys) {
        expect(cdr, `CDR "${cdr.id}" missing required field "${key}"`).toHaveProperty(key)
      }
    }
  })

  it('all IDs are unique', () => {
    const ids = batch20OrthoGeriPallCdrs.map((c) => c.id)
    const uniqueIds = new Set(ids)
    expect(uniqueIds.size).toBe(ids.length)
  })

  it('all IDs are snake_case (allowing digit-prefixed like 4at)', () => {
    const snakeCaseRegex = /^[a-z0-9][a-z0-9]*(_[a-z0-9]+)*$/
    for (const cdr of batch20OrthoGeriPallCdrs) {
      expect(
        snakeCaseRegex.test(cdr.id),
        `CDR ID "${cdr.id}" is not snake_case`,
      ).toBe(true)
    }
  })

  it('every CDR has >= 3 user-answerable interactive components', () => {
    for (const cdr of batch20OrthoGeriPallCdrs) {
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
      for (const cdr of batch20OrthoGeriPallCdrs) {
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
      for (const cdr of batch20OrthoGeriPallCdrs) {
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
      for (const cdr of batch20OrthoGeriPallCdrs) {
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
      for (const cdr of batch20OrthoGeriPallCdrs) {
        for (const comp of cdr.components) {
          expect(
            validSources.includes(comp.source),
            `CDR "${cdr.id}", component "${comp.id}": invalid source "${comp.source}"`,
          ).toBe(true)
        }
      }
    })

    it('component IDs are unique within each CDR', () => {
      for (const cdr of batch20OrthoGeriPallCdrs) {
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
      for (const cdr of batch20OrthoGeriPallCdrs) {
        expect(
          validMethods.includes(cdr.scoring.method),
          `CDR "${cdr.id}": invalid scoring method "${cdr.scoring.method}"`,
        ).toBe(true)
      }
    })

    it('scoring ranges have no gaps between consecutive ranges', () => {
      for (const cdr of batch20OrthoGeriPallCdrs) {
        if (cdr.scoring.method === 'algorithm') continue // Algorithm CDRs may have intentional gaps
        const ranges = [...cdr.scoring.ranges].sort((a, b) => a.min - b.min)
        for (let i = 1; i < ranges.length; i++) {
          const prevMax = ranges[i - 1].max
          const currMin = ranges[i].min
          // CDRs with fractional scores (PPI, PaP) use non-integer boundaries
          if (!Number.isInteger(prevMax) || !Number.isInteger(currMin)) {
            expect(
              currMin,
              `CDR "${cdr.id}": large gap between range ending at ${prevMax} and range starting at ${currMin}`,
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
      for (const cdr of batch20OrthoGeriPallCdrs) {
        const ranges = [...cdr.scoring.ranges].sort((a, b) => a.min - b.min)
        for (let i = 1; i < ranges.length; i++) {
          // All CDRs: next range min must be >= previous range max (no backward overlap)
          expect(
            ranges[i].min,
            `CDR "${cdr.id}": overlap between ranges "${ranges[i - 1].risk}" and "${ranges[i].risk}"`,
          ).toBeGreaterThanOrEqual(ranges[i - 1].max)
        }
      }
    })

    it('scoring ranges cover the full achievable score range for sum-method CDRs', () => {
      for (const cdr of batch20OrthoGeriPallCdrs) {
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
      for (const cdr of batch20OrthoGeriPallCdrs) {
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
    it('4AT Delirium Screen has 4 select components and sum scoring with max 12', () => {
      const fourAT = batch20OrthoGeriPallCdrs.find((c) => c.id === '4at')!
      expect(fourAT.components).toHaveLength(4)
      expect(fourAT.scoring.method).toBe('sum')
      expect(fourAT.category).toBe('GERIATRICS & DELIRIUM')
      for (const comp of fourAT.components) {
        expect(comp.type).toBe('select')
      }
      // Alertness can score 0 or 4, AMT4 0/1/2, Attention 0/1/2, Acute change 0/4
      const ranges = [...fourAT.scoring.ranges].sort((a, b) => a.min - b.min)
      expect(ranges[ranges.length - 1].max).toBe(12)
    })

    it('Braden Scale has 6 select components and sum scoring with inverted risk (lower = higher risk)', () => {
      const braden = batch20OrthoGeriPallCdrs.find((c) => c.id === 'braden_scale')!
      expect(braden.components).toHaveLength(6)
      expect(braden.scoring.method).toBe('sum')
      expect(braden.category).toBe('GERIATRICS & DELIRIUM')
      // Friction/shear maxes at 3 (not 4 like the others)
      const frictionShear = braden.components.find((c) => c.id === 'friction_shear')!
      expect(frictionShear.options).toHaveLength(3)
      const maxFrictionValue = Math.max(...frictionShear.options!.map((o) => o.value))
      expect(maxFrictionValue).toBe(3)
      // Highest risk range starts at 6 (minimum achievable score)
      const ranges = [...braden.scoring.ranges].sort((a, b) => a.min - b.min)
      expect(ranges[0].min).toBe(6)
      expect(ranges[0].risk).toBe('Very High Risk')
    })

    it('Morse Fall Scale has 6 select components and sum scoring with max 125', () => {
      const morse = batch20OrthoGeriPallCdrs.find((c) => c.id === 'morse_fall_scale')!
      expect(morse.components).toHaveLength(6)
      expect(morse.scoring.method).toBe('sum')
      expect(morse.category).toBe('GERIATRICS & DELIRIUM')
      for (const comp of morse.components) {
        expect(comp.type).toBe('select')
      }
      const ranges = [...morse.scoring.ranges].sort((a, b) => a.min - b.min)
      expect(ranges[ranges.length - 1].max).toBe(125)
    })

    it('Jones Criteria has 10 boolean components (5 major + 4 minor + GAS evidence) and algorithm scoring', () => {
      const jones = batch20OrthoGeriPallCdrs.find((c) => c.id === 'jones_criteria')!
      expect(jones.components).toHaveLength(10)
      expect(jones.scoring.method).toBe('algorithm')
      expect(jones.category).toBe('RHEUMATOLOGY')
      // GAS evidence is worth 0 points (marker, not scored)
      const gasEvidence = jones.components.find((c) => c.id === 'gas_evidence')!
      expect(gasEvidence.value).toBe(0)
      // All other booleans worth 1
      const scoredComponents = jones.components.filter((c) => c.id !== 'gas_evidence')
      for (const comp of scoredComponents) {
        expect(comp.type).toBe('boolean')
        expect(comp.value).toBe(1)
      }
    })

    it('PPS has 5 dimension components with algorithm scoring', () => {
      const pps = batch20OrthoGeriPallCdrs.find((c) => c.id === 'pps')!
      expect(pps.components).toHaveLength(5)
      expect(pps.scoring.method).toBe('algorithm')
      expect(pps.category).toBe('PALLIATIVE CARE & PROGNOSIS')
      // All 5 components are select type and section1 source
      for (const comp of pps.components) {
        expect(comp.type).toBe('select')
        expect(comp.source).toBe('section1')
      }
      // 5 dimensions: ambulation, activity, self-care, intake, consciousness
      const ids = pps.components.map((c) => c.id)
      expect(ids).toContain('ambulation')
      expect(ids).toContain('activity_level')
      expect(ids).toContain('self_care')
      expect(ids).toContain('intake')
      expect(ids).toContain('conscious_level')
    })

    it('PaP Score has 6 select components and sum scoring with max 17.5', () => {
      const pap = batch20OrthoGeriPallCdrs.find((c) => c.id === 'pap_score')!
      expect(pap.components).toHaveLength(6)
      expect(pap.scoring.method).toBe('sum')
      expect(pap.category).toBe('PALLIATIVE CARE & PROGNOSIS')
      for (const comp of pap.components) {
        expect(comp.type).toBe('select')
      }
      const ranges = [...pap.scoring.ranges].sort((a, b) => a.min - b.min)
      expect(ranges[ranges.length - 1].max).toBe(17.5)
    })

    it('covers 3 distinct categories (after quarantine removed ORTHOPEDIC)', () => {
      const categories = new Set(batch20OrthoGeriPallCdrs.map((c) => c.category))
      expect(categories.has('RHEUMATOLOGY')).toBe(true)
      expect(categories.has('GERIATRICS & DELIRIUM')).toBe(true)
      expect(categories.has('PALLIATIVE CARE & PROGNOSIS')).toBe(true)
    })
  })
})
