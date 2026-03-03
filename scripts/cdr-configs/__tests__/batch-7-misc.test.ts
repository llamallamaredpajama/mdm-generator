import { describe, it, expect } from 'vitest'
import { batch7MiscCdrs } from '../batch-7-misc'
import type { CdrSeed, CdrComponent } from '../types'

const EXPECTED_CDR_COUNT = 9

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

describe('batch-7-misc CDR definitions', () => {
  it(`exports exactly ${EXPECTED_CDR_COUNT} CDRs`, () => {
    expect(batch7MiscCdrs).toHaveLength(EXPECTED_CDR_COUNT)
  })

  it('has unique IDs across all CDRs', () => {
    const ids = batch7MiscCdrs.map((c) => c.id)
    const unique = new Set(ids)
    expect(unique.size).toBe(ids.length)
  })

  it('all IDs are snake_case', () => {
    for (const cdr of batch7MiscCdrs) {
      expect(cdr.id).toMatch(SNAKE_CASE_RE)
    }
  })

  describe.each(batch7MiscCdrs.map((c) => [c.id, c]))('%s', (_id, cdr) => {
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

      // First range should start at 0
      expect(sorted[0].min).toBe(0)

      // Check for gaps between consecutive ranges
      for (let i = 1; i < sorted.length; i++) {
        const prevMax = sorted[i - 1].max
        const currMin = sorted[i].min
        expect(currMin).toBe(prevMax + 1)
      }

      // For non-algorithm methods, last range max should cover the max possible score
      if (cdr.scoring.method !== 'algorithm') {
        const maxPossible = computeMaxScore(cdr.components)
        expect(sorted[sorted.length - 1].max).toBe(maxPossible)
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
            expect(comp.options!.length).toBeGreaterThanOrEqual(2)

            // Each option must have label and numeric value
            for (const opt of comp.options!) {
              expect(opt.label).toBeTruthy()
              expect(typeof opt.value).toBe('number')
            }

            const values = comp.options!.map((o) => o.value)

            // For sum/threshold scoring, first option should start at 0
            // (baseline / "none"). Algorithm-scored CDRs may use real-world
            // values (e.g., weight in kg) where 0 is not meaningful.
            if (cdr.scoring.method !== 'algorithm') {
              expect(values[0]).toBe(0)
            }

            // Values should be non-decreasing (allow equal values for tools
            // like 4AT where multiple options share the same score)
            for (let i = 1; i < values.length; i++) {
              expect(values[i]).toBeGreaterThanOrEqual(values[i - 1])
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
