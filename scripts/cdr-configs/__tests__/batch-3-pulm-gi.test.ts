import { describe, it, expect } from 'vitest'
import { batch3PulmGiCdrs } from '../batch-3-pulm-gi'
import type { CdrSeed, CdrComponent } from '../types'

const EXPECTED_CDR_COUNT = 10

const REQUIRED_CDR_FIELDS: (keyof CdrSeed)[] = [
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

const SNAKE_CASE_RE = /^[a-z][a-z0-9]*(_[a-z0-9]+)*$/

/**
 * CDRs whose components include mutually exclusive items (e.g., male vs female
 * hemoglobin) so the theoretical sum of ALL component max values exceeds the
 * clinically correct maximum score.  For these, we skip the exact max-score
 * assertion and only verify the range upper bound is >= the practical max.
 */
const CDRS_WITH_MUTUALLY_EXCLUSIVE_COMPONENTS: Record<string, number> = {
  // GBS: male and female hemoglobin are mutually exclusive; practical max = 23
  glasgow_blatchford: 23,
  // PSI/PORT: age select caps at 90, but range max 395 accounts for ages > 90
  // in original literature.  Step 1 screening booleans add 10 to a score that
  // normally uses only step 2 components (theoretical 385 vs range 395).
  psi_port: 395,
}

describe('batch-3-pulm-gi CDR definitions', () => {
  it(`exports exactly ${EXPECTED_CDR_COUNT} CDRs`, () => {
    expect(batch3PulmGiCdrs).toHaveLength(EXPECTED_CDR_COUNT)
  })

  it('has unique IDs across all CDRs', () => {
    const ids = batch3PulmGiCdrs.map((c) => c.id)
    const unique = new Set(ids)
    expect(unique.size).toBe(ids.length)
  })

  it('all IDs are snake_case', () => {
    for (const cdr of batch3PulmGiCdrs) {
      expect(cdr.id).toMatch(SNAKE_CASE_RE)
    }
  })

  describe.each(batch3PulmGiCdrs.map((c) => [c.id, c]))('%s', (_id, cdr) => {
    it('has all required CdrSeed fields', () => {
      for (const field of REQUIRED_CDR_FIELDS) {
        expect(cdr).toHaveProperty(field)
        const val = cdr[field]
        if (typeof val === 'string') {
          expect(val.length).toBeGreaterThan(0)
        }
      }
    })

    it('has non-empty applicableChiefComplaints', () => {
      expect(cdr.applicableChiefComplaints.length).toBeGreaterThan(0)
    })

    it('has non-empty keywords', () => {
      expect(cdr.keywords.length).toBeGreaterThan(0)
    })

    it('has at least one component', () => {
      expect(cdr.components.length).toBeGreaterThan(0)
    })

    it('has valid scoring method', () => {
      expect(['sum', 'threshold', 'algorithm']).toContain(cdr.scoring.method)
    })

    it('has at least one scoring range', () => {
      expect(cdr.scoring.ranges.length).toBeGreaterThan(0)
    })

    it('scoring ranges cover the full possible score range with no gaps', () => {
      const { ranges } = cdr.scoring
      const sorted = [...ranges].sort((a, b) => a.min - b.min)

      // Algorithm-type CDRs may not start at 0 (e.g., Berlin ARDS: score 0
      // means criteria not met, which is intentionally outside the ranges)
      if (cdr.scoring.method !== 'algorithm') {
        expect(sorted[0].min).toBe(0)
      }

      // Check for gaps between consecutive ranges
      for (let i = 1; i < sorted.length; i++) {
        const prevMax = sorted[i - 1].max
        const currMin = sorted[i].min
        expect(currMin).toBe(prevMax + 1)
      }

      // For non-algorithm methods, last range max should cover the max possible score
      if (cdr.scoring.method !== 'algorithm') {
        const override = CDRS_WITH_MUTUALLY_EXCLUSIVE_COMPONENTS[cdr.id]
        if (override !== undefined) {
          // For CDRs with mutually exclusive components, verify the range max
          // equals the documented practical maximum
          expect(sorted[sorted.length - 1].max).toBe(override)
        } else {
          const maxPossible = computeMaxScore(cdr.components)
          expect(sorted[sorted.length - 1].max).toBe(maxPossible)
        }
      }
    })

    it('scoring ranges have no overlaps', () => {
      const { ranges } = cdr.scoring
      const sorted = [...ranges].sort((a, b) => a.min - b.min)
      for (let i = 1; i < sorted.length; i++) {
        expect(sorted[i].min).toBeGreaterThan(sorted[i - 1].max)
      }
    })

    it('scoring ranges have valid risk and interpretation strings', () => {
      for (const range of cdr.scoring.ranges) {
        expect(range.risk.length).toBeGreaterThan(0)
        expect(range.interpretation.length).toBeGreaterThan(0)
      }
    })

    describe('component validation', () => {
      it.each(cdr.components.map((c) => [c.id, c]))(
        'component %s has valid structure',
        (_compId, comp) => {
          // Required fields
          expect(comp.id).toBeTruthy()
          expect(comp.label).toBeTruthy()
          expect(['select', 'boolean', 'number_range', 'algorithm']).toContain(comp.type)
          expect(['section1', 'section2', 'user_input']).toContain(comp.source)

          if (comp.type === 'boolean') {
            // Boolean components must have a point weight value
            expect(comp.value).toBeDefined()
            expect(typeof comp.value).toBe('number')
          }

          if (comp.type === 'select') {
            // Select components must have options array with valid entries
            expect(comp.options).toBeDefined()
            expect(Array.isArray(comp.options)).toBe(true)
            expect(comp.options!.length).toBeGreaterThan(0)

            for (const opt of comp.options!) {
              expect(opt.label).toBeTruthy()
              expect(typeof opt.value).toBe('number')
            }

            // Option values should be non-negative integers
            for (const opt of comp.options!) {
              expect(opt.value).toBeGreaterThanOrEqual(0)
              expect(Number.isInteger(opt.value)).toBe(true)
            }
          }

          if (comp.type === 'number_range') {
            expect(comp.min).toBeDefined()
            expect(comp.max).toBeDefined()
            expect(typeof comp.min).toBe('number')
            expect(typeof comp.max).toBe('number')
            expect(comp.max!).toBeGreaterThan(comp.min!)
          }
        }
      )

      it('all component IDs are unique within this CDR', () => {
        const compIds = cdr.components.map((c) => c.id)
        const unique = new Set(compIds)
        expect(unique.size).toBe(compIds.length)
      })
    })
  })
})

/**
 * Compute the maximum possible score for a set of components.
 * - boolean: adds its value (point weight)
 * - select: adds the max option value
 * - number_range: adds the max value
 */
function computeMaxScore(components: CdrComponent[]): number {
  let max = 0
  for (const comp of components) {
    if (comp.type === 'boolean') {
      max += comp.value ?? 0
    } else if (comp.type === 'select' && comp.options) {
      max += Math.max(...comp.options.map((o) => o.value))
    } else if (comp.type === 'number_range' && comp.max !== undefined) {
      max += comp.max
    }
  }
  return max
}
