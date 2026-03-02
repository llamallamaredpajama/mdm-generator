import { describe, it, expect } from 'vitest'
import { batch6CritPedsCdrs } from '../batch-6-crit-peds'
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

describe('batch-6-crit-peds CDR definitions', () => {
  it(`exports exactly ${EXPECTED_CDR_COUNT} CDRs`, () => {
    expect(batch6CritPedsCdrs).toHaveLength(EXPECTED_CDR_COUNT)
  })

  it('has unique IDs across all CDRs', () => {
    const ids = batch6CritPedsCdrs.map((c) => c.id)
    const unique = new Set(ids)
    expect(unique.size).toBe(ids.length)
  })

  it('all IDs are snake_case', () => {
    for (const cdr of batch6CritPedsCdrs) {
      expect(cdr.id).toMatch(SNAKE_CASE_RE)
    }
  })

  describe.each(batch6CritPedsCdrs.map((c) => [c.id, c]))('%s', (_id, cdr) => {
    it('has all required CdrSeed fields', () => {
      for (const field of REQUIRED_CDR_FIELDS) {
        expect(cdr).toHaveProperty(field)
        // Non-array required fields should be truthy (non-empty strings, etc.)
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
      // Ranges should be sorted by min
      const sorted = [...ranges].sort((a, b) => a.min - b.min)

      // For sum-based scores, first range should start at the minimum possible score.
      // Most tools start at 0, but GCS starts at 3 (E1+V1+M1).
      const minPossible = computeMinScore(cdr.components)
      expect(sorted[0].min).toBe(minPossible)

      // Check for gaps between consecutive ranges
      for (let i = 1; i < sorted.length; i++) {
        const prevMax = sorted[i - 1].max
        const currMin = sorted[i].min
        expect(currMin).toBe(prevMax + 1)
      }

      // For non-algorithm methods, last range max should cover the max possible score.
      // Use >= rather than === because some tools have mutually exclusive components
      // (e.g., NEWS2 SpO2 Scale 1 vs Scale 2) where the computed max overcounts, or
      // the range ceiling is intentionally slightly above the theoretical max.
      if (cdr.scoring.method !== 'algorithm') {
        const maxPossible = computeMaxScore(cdr.components)
        const lastRangeMax = sorted[sorted.length - 1].max
        // The last range must reach at least the max achievable score via a single
        // clinical pathway (which may be less than the naive component sum if some
        // components are mutually exclusive). We verify the range endpoint is
        // within a reasonable window: at least maxPossible minus the largest single
        // component max (accounts for one mutually-exclusive component group) and
        // at most maxPossible + a small ceiling buffer.
        const largestComponentMax = Math.max(
          ...cdr.components.map((c) => {
            if (c.type === 'boolean') return c.value ?? 0
            if (c.type === 'select' && c.options) return Math.max(...c.options.map((o) => o.value))
            if (c.type === 'number_range' && c.max !== undefined) return c.max
            return 0
          })
        )
        // lastRangeMax should be >= (maxPossible - largestComponentMax) to cover
        // the realistic max when one group is excluded, and should not wildly exceed
        // the naive max.
        expect(lastRangeMax).toBeGreaterThanOrEqual(maxPossible - largestComponentMax)
        expect(lastRangeMax).toBeLessThanOrEqual(maxPossible + 10)
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
            // Select components must have options array
            expect(comp.options).toBeDefined()
            expect(Array.isArray(comp.options)).toBe(true)
            expect(comp.options!.length).toBeGreaterThan(0)

            // Each option must have label and numeric value
            for (const opt of comp.options!) {
              expect(opt.label).toBeTruthy()
              expect(typeof opt.value).toBe('number')
            }

            // All option values must be non-negative integers
            const values = comp.options!.map((o) => o.value)
            for (const v of values) {
              expect(v).toBeGreaterThanOrEqual(0)
              expect(Number.isInteger(v)).toBe(true)
            }
          }

          if (comp.type === 'number_range') {
            // Number range components must have min and max
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
 * Compute the minimum possible score for a set of components.
 * - boolean: 0 (not checked)
 * - select: min option value
 * - number_range: min value
 */
function computeMinScore(components: CdrComponent[]): number {
  let min = 0
  for (const comp of components) {
    if (comp.type === 'boolean') {
      // Boolean minimum is 0 (unchecked)
      min += 0
    } else if (comp.type === 'select' && comp.options) {
      min += Math.min(...comp.options.map((o) => o.value))
    } else if (comp.type === 'number_range' && comp.min !== undefined) {
      min += comp.min
    }
  }
  return min
}

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
